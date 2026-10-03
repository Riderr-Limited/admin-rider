const BASE_URL = 'https://riderr-backend.onrender.com/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// Builds a query string, dropping empty/undefined values so the backend
// doesn't receive filters like `?status=` (which some handlers treat as set).
function qs(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return '';
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = String(v);
  }
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
}

async function parseError(res: Response) {
  const err = await res.json().catch(() => ({ message: res.statusText }));
  return new Error(err.message || res.statusText);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.data.accessToken}`,
            ...options.headers,
          },
        });
        if (!retryRes.ok) throw await parseError(retryRes);
        return retryRes.json();
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) throw await parseError(res);

  return res.json();
}

type Params = Record<string, string | number | boolean | undefined | null>;
const json = (method: string, body?: object): RequestInit => ({
  method,
  ...(body ? { body: JSON.stringify(body) } : {}),
});

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<any>('/auth/login', json('POST', { email, password })),
  logout: () => request<any>('/auth/logout', json('POST')),
  me: () => request<any>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>('/auth/change-password', json('POST', { currentPassword, newPassword })),

  // Dashboard & analytics
  dashboard: (period?: string) => request<any>(`/admin/dashboard${qs({ period })}`),
  systemStats: () => request<any>('/admin/system/stats'),
  analytics: (params?: Params) => request<any>(`/admin/analytics${qs(params)}`),

  // Users — GET /admin/users/:id returns { user, stats, deliveries, payments, supportTickets }
  getUsers: (params?: Params) => request<any>(`/admin/users${qs(params)}`),
  getUserById: (id: string) => request<any>(`/admin/users/${id}`),
  updateUser: (id: string, body: object) => request<any>(`/admin/users/${id}`, json('PUT', body)),
  suspendUser: (id: string, suspend: boolean, reason?: string) =>
    request<any>(`/admin/users/${id}/suspend`, json('PUT', { suspend, reason })),
  deleteUser: (id: string, permanent = false) =>
    request<any>(`/admin/users/${id}`, json('DELETE', { permanent })),
  resetUserPassword: (id: string, newPassword: string) =>
    request<any>(`/admin/users/${id}/reset-password`, json('POST', { newPassword })),

  // Drivers — GET /admin/drivers/:id returns { driver, deliveries, earnings, recentActivity }
  getDrivers: (params?: Params) => request<any>(`/admin/drivers${qs(params)}`),
  getDriverById: (id: string) => request<any>(`/admin/drivers/${id}`),
  getDriversForAssignment: (params?: Params) => request<any>(`/admin/drivers/for-assignment${qs(params)}`),
  updateDriver: (id: string, body: object) => request<any>(`/admin/drivers/${id}`, json('PUT', body)),
  approveDriver: (id: string, approve: boolean, reason?: string) =>
    request<any>(`/admin/drivers/${id}/approve`, json('PUT', { approve, reason })),
  deleteDriver: (id: string, permanent = false) =>
    request<any>(`/admin/drivers/${id}`, json('DELETE', { permanent })),

  // Companies — GET /admin/companies/:id returns { company, drivers, deliveries, payments, admins }
  getCompanies: (params?: Params) => request<any>(`/admin/companies${qs(params)}`),
  getCompanyById: (id: string) => request<any>(`/admin/companies/${id}`),
  updateCompany: (id: string, body: object) => request<any>(`/admin/companies/${id}`, json('PUT', body)),
  approveCompany: (id: string, approve: boolean, reason?: string) =>
    request<any>(`/admin/companies/${id}/approve`, json('PUT', { approve, reason })),
  approveBankDetails: (id: string) => request<any>(`/admin/companies/${id}/bank-details/approve`, json('PUT')),
  deleteCompany: (id: string, permanent = false) =>
    request<any>(`/admin/companies/${id}`, json('DELETE', { permanent })),

  // Deliveries — GET /admin/deliveries/:id returns { delivery, payment, chatMessages, voiceCalls }
  getDeliveries: (params?: Params) => request<any>(`/admin/deliveries${qs(params)}`),
  getDeliveryById: (id: string) => request<any>(`/admin/deliveries/${id}`),
  updateDeliveryStatus: (id: string, status: string, reason?: string) =>
    request<any>(`/admin/deliveries/${id}/status`, json('PUT', { status, reason })),
  assignDriver: (deliveryId: string, driverId: string) =>
    request<any>(`/admin/deliveries/${deliveryId}/assign-driver`, json('PUT', { driverId })),
  deleteDelivery: (id: string, permanent = false, reason?: string) =>
    request<any>(`/admin/deliveries/${id}`, json('DELETE', { permanent, ...(reason ? { reason } : {}) })),

  // Rides (admin list lives under /rides, not /admin)
  getRides: (params?: Params) => request<any>(`/rides/admin/all${qs(params)}`),
  getRideById: (id: string) => request<any>(`/rides/${id}`),
  assignRide: (id: string, driverId: string) => request<any>(`/rides/${id}/assign`, json('POST', { driverId })),

  // Pay-on-Delivery orders (admin sees every order)
  getPODs: (params?: Params) => request<any>(`/pod${qs(params)}`),
  getPOD: (id: string) => request<any>(`/pod/${id}`),
  confirmPOD: (id: string) => request<any>(`/pod/${id}/confirm`, json('PATCH')),
  markPODReady: (id: string) => request<any>(`/pod/${id}/ready`, json('PATCH')),
  assignPODDriver: (id: string, driverId: string) => request<any>(`/pod/${id}/assign`, json('POST', { driverId })),
  rejectPOD: (id: string, reason: string) => request<any>(`/pod/${id}/reject`, json('POST', { reason })),
  settlePOD: (id: string, settlementAmount?: number, note?: string) =>
    request<any>(`/pod/${id}/settle`, json('PATCH', { settlementAmount, note })),
  cancelPOD: (id: string, reason: string) => request<any>(`/pod/${id}/cancel`, json('PATCH', { reason })),

  // Errands
  getErrands: (params?: Params) => request<any>(`/errands${qs(params)}`),
  getErrand: (id: string) => request<any>(`/errands/${id}`),
  assignErrandRider: (id: string, driverId: string) => request<any>(`/errands/${id}/assign`, json('POST', { driverId })),
  confirmErrand: (id: string) => request<any>(`/errands/${id}/confirm-completion`, json('PATCH')),
  cancelErrand: (id: string, reason: string) => request<any>(`/errands/${id}/cancel`, json('PATCH', { reason })),
  disputeErrand: (id: string, details: string) => request<any>(`/errands/${id}/dispute`, json('POST', { details })),

  // Payments
  getPayments: (params?: Params) => request<any>(`/admin/payments${qs(params)}`),
  getPaymentById: (id: string) => request<any>(`/admin/payments/${id}`),
  issueRefund: (id: string, reason: string, amount?: number) =>
    request<any>(`/admin/payments/${id}/refund`, json('POST', { reason, ...(amount ? { amount } : {}) })),

  // Support tickets — admin CRUD under /admin, the message thread under /v1/support
  getSupportTickets: (params?: Params) => request<any>(`/admin/support-tickets${qs(params)}`),
  getSupportTicketById: (id: string) => request<any>(`/admin/support-tickets/${id}`),
  updateSupportTicket: (id: string, body: object) => request<any>(`/admin/support-tickets/${id}`, json('PUT', body)),
  getSupportTicketMessages: (ticketId: string) => request<any>(`/v1/support/tickets/${ticketId}/messages`),
  sendSupportTicketMessage: (ticketId: string, message: string) =>
    request<any>(`/v1/support/tickets/${ticketId}/messages`, json('POST', { message })),

  // Contact form submissions from the public website
  getContactMessages: (params?: Params) => request<any>(`/contact${qs(params)}`),
  updateContactStatus: (id: string, status: 'new' | 'read' | 'replied') =>
    request<any>(`/contact/${id}/status`, json('PATCH', { status })),

  // Notifications (admin inbox)
  getNotifications: (params?: Params) => request<any>(`/notifications${qs(params)}`),
  getUnreadNotificationCount: () => request<any>('/notifications/unread-count'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, json('PUT')),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', json('PUT')),
  deleteNotification: (id: string) => request<any>(`/notifications/${id}`, json('DELETE')),
  clearReadNotifications: () => request<any>('/notifications/clear-read', json('DELETE')),

  // Bulk notification sender — omitting both roles and userIds broadcasts to every active user
  sendBulkNotification: (body: { title: string; message: string; type: string; roles?: string[]; userIds?: string[] }) =>
    request<any>('/admin/notifications/bulk', json('POST', body)),

  // Export (always JSON — the backend ignores `format`)
  exportData: (dataType: 'users' | 'drivers' | 'deliveries' | 'payments', params?: Params) =>
    request<any>(`/admin/export/${dataType}${qs(params)}`),

  // Partners (list is unpaginated and returns toPublicJSON(), keyed by `id`)
  getPartners: (params?: Params) => request<any>(`/admin/partners${qs(params)}`),
  getPartnerById: (id: string) => request<any>(`/admin/partners/${id}`),
  createPartner: (body: object) => request<any>('/admin/partners', json('POST', body)),
  suspendPartner: (id: string) => request<any>(`/admin/partners/${id}/suspend`, json('PATCH')),
  activatePartner: (id: string) => request<any>(`/admin/partners/${id}/activate`, json('PATCH')),
  regeneratePartnerSecret: (id: string) => request<any>(`/admin/partners/${id}/regenerate-secret`, json('POST')),

  // Admin chat
  getChatConversations: (params?: Params) => request<any>(`/admin/chat/conversations${qs(params)}`),
  getChatAdminUnread: () => request<any>('/admin/chat/admin-unread'),
  getChatUserMessages: (userId: string, limit = 50, before?: string) =>
    request<any>(`/admin/chat/users/${userId}/messages${qs({ limit, before })}`),
  sendChatMessage: (userId: string, message: string) =>
    request<any>('/admin/chat/messages', json('POST', { userId, message })),
  markChatRead: (userId: string) => request<any>(`/admin/chat/users/${userId}/mark-read`, json('PUT')),
  deleteChatMessage: (messageId: string) => request<any>(`/admin/chat/messages/${messageId}`, json('DELETE')),
};

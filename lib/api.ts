const BASE_URL = 'http://localhost:5000/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
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
        if (!retryRes.ok) throw new Error(await retryRes.text());
        return retryRes.json();
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  me: () => request<any>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  // Dashboard
  dashboard: (period?: string) =>
    request<any>(`/admin/dashboard${period ? `?period=${period}` : ''}`),
  systemStats: () => request<any>('/admin/system/stats'),
  analytics: (params?: Record<string, string>) =>
    request<any>(`/admin/analytics?${new URLSearchParams(params)}`),

  // Users
  getUsers: (params?: Record<string, string>) =>
    request<any>(`/admin/users?${new URLSearchParams(params)}`),
  getUserById: (id: string) => request<any>(`/admin/users/${id}`),
  updateUser: (id: string, body: object) =>
    request<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  suspendUser: (id: string, suspend: boolean, reason?: string) =>
    request<any>(`/admin/users/${id}/suspend`, { method: 'PUT', body: JSON.stringify({ suspend, reason }) }),
  deleteUser: (id: string, permanent = false) =>
    request<any>(`/admin/users/${id}`, { method: 'DELETE', body: JSON.stringify({ permanent }) }),
  resetUserPassword: (id: string, newPassword: string) =>
    request<any>(`/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),

  // Drivers
  getDrivers: (params?: Record<string, string>) =>
    request<any>(`/admin/drivers?${new URLSearchParams(params)}`),
  getDriverById: (id: string) => request<any>(`/admin/drivers/${id}`),
  updateDriver: (id: string, body: object) =>
    request<any>(`/admin/drivers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  approveDriver: (id: string, approve: boolean, reason?: string) =>
    request<any>(`/admin/drivers/${id}/approve`, { method: 'PUT', body: JSON.stringify({ approve, reason }) }),
  deleteDriver: (id: string, permanent = false) =>
    request<any>(`/admin/drivers/${id}`, { method: 'DELETE', body: JSON.stringify({ permanent }) }),

  // Companies
  getCompanies: (params?: Record<string, string>) =>
    request<any>(`/admin/companies?${new URLSearchParams(params)}`),
  getCompanyById: (id: string) => request<any>(`/admin/companies/${id}`),
  updateCompany: (id: string, body: object) =>
    request<any>(`/admin/companies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  approveCompany: (id: string, approve: boolean, reason?: string) =>
    request<any>(`/admin/companies/${id}/approve`, { method: 'PUT', body: JSON.stringify({ approve, reason }) }),
  approveBankDetails: (id: string) =>
    request<any>(`/admin/companies/${id}/bank-details/approve`, { method: 'PUT' }),
  deleteCompany: (id: string, permanent = false) =>
    request<any>(`/admin/companies/${id}`, { method: 'DELETE', body: JSON.stringify({ permanent }) }),

  // Deliveries
  getDeliveries: (params?: Record<string, string>) =>
    request<any>(`/admin/deliveries?${new URLSearchParams(params)}`),
  getDeliveryById: (id: string) => request<any>(`/admin/deliveries/${id}`),
  updateDeliveryStatus: (id: string, status: string, reason?: string) =>
    request<any>(`/admin/deliveries/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
  assignDriver: (deliveryId: string, driverId: string) =>
    request<any>(`/admin/deliveries/${deliveryId}/assign-driver`, { method: 'PUT', body: JSON.stringify({ driverId }) }),
  deleteDelivery: (id: string, permanent = false, reason?: string) =>
    request<any>(`/admin/deliveries/${id}`, { method: 'DELETE', body: JSON.stringify({ permanent, ...(reason ? { reason } : {}) }) }),

  // Payments
  getPayments: (params?: Record<string, string>) =>
    request<any>(`/admin/payments?${new URLSearchParams(params)}`),
  getPaymentById: (id: string) => request<any>(`/admin/payments/${id}`),
  issueRefund: (id: string, reason: string, amount?: number) =>
    request<any>(`/admin/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason, ...(amount ? { amount } : {}) }),
    }),

  // Support Tickets (correct v1 routes)
  getSupportTickets: (params?: Record<string, string>) =>
    request<any>(`/v1/support/tickets${params && Object.keys(params).length ? '?' + new URLSearchParams(params) : ''}`),
  getSupportTicketById: (ticketId: string) => request<any>(`/v1/support/tickets/${ticketId}`),
  updateSupportTicket: (ticketId: string, body: object) =>
    request<any>(`/v1/support/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getSupportTicketMessages: (ticketId: string) =>
    request<any>(`/v1/support/tickets/${ticketId}/messages`),

  // Notifications
  getNotifications: (params?: Record<string, string>) =>
    request<any>(`/notifications${params && Object.keys(params).length ? '?' + new URLSearchParams(params) : ''}`),
  getUnreadCount: () => request<any>('/notifications/unread-count'),
  markNotificationRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markNotificationClicked: (id: string) =>
    request<any>(`/notifications/${id}/click`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    request<any>('/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id: string) =>
    request<any>(`/notifications/${id}`, { method: 'DELETE' }),
  clearReadNotifications: () =>
    request<any>('/notifications/clear-read', { method: 'DELETE' }),
  sendBulkNotification: (body: { title: string; message: string; type: string; roles?: string[]; userIds?: string[] }) =>
    request<any>('/admin/notifications/bulk', { method: 'POST', body: JSON.stringify(body) }),

  // Export
  exportData: (dataType: string, params?: Record<string, string>) =>
    request<any>(`/admin/export/${dataType}?${new URLSearchParams(params)}`),

  // Admin Chat
  getChatConversations: (params?: Record<string, string>) =>
    request<any>(`/admin-chat/conversations${params && Object.keys(params).length ? '?' + new URLSearchParams(params) : ''}`),
  getChatUserMessages: (userId: string, limit = 50, before?: string) =>
    request<any>(`/admin-chat/users/${userId}/messages?limit=${limit}${before ? '&before=' + before : ''}`),
  sendChatMessage: (message: string, userId: string) =>
    request<any>('/admin-chat/messages', { method: 'POST', body: JSON.stringify({ message, userId, messageType: 'text' }) }),
  markConversationRead: (userId: string) =>
    request<any>(`/admin-chat/users/${userId}/mark-read`, { method: 'PUT' }),
  deleteChatMessage: (messageId: string) =>
    request<any>(`/admin-chat/messages/${messageId}`, { method: 'DELETE' }),
  getAdminUnread: () => request<any>('/admin-chat/admin-unread'),

  // Delivery Chat
  getDeliveryChatMessages: (deliveryId: string, limit = 50) =>
    request<any>(`/chat/${deliveryId}/messages?limit=${limit}`),
  sendDeliveryMessage: (deliveryId: string, message: string, messageType = 'text') =>
    request<any>(`/chat/${deliveryId}/message`, { method: 'POST', body: JSON.stringify({ message, messageType }) }),
  markDeliveryMessagesRead: (deliveryId: string) =>
    request<any>(`/chat/${deliveryId}/read`, { method: 'PUT' }),
};

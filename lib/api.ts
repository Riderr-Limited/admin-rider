const BASE_URL = 'https://riderr-backend.onrender.com/api';

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
  deleteUser: (id: string) =>
    request<any>(`/admin/users/${id}`, { method: 'DELETE', body: JSON.stringify({ permanent: false }) }),
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

  // Deliveries
  getDeliveries: (params?: Record<string, string>) =>
    request<any>(`/admin/deliveries?${new URLSearchParams(params)}`),
  getDeliveryById: (id: string) => request<any>(`/admin/deliveries/${id}`),
  updateDeliveryStatus: (id: string, status: string, reason?: string) =>
    request<any>(`/admin/deliveries/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
  assignDriver: (deliveryId: string, driverId: string) =>
    request<any>(`/admin/deliveries/${deliveryId}/assign-driver`, { method: 'PUT', body: JSON.stringify({ driverId }) }),

  // Payments
  getPayments: (params?: Record<string, string>) =>
    request<any>(`/admin/payments?${new URLSearchParams(params)}`),
  getPaymentById: (id: string) => request<any>(`/admin/payments/${id}`),
  issueRefund: (id: string, reason: string, amount?: number) =>
    request<any>(`/admin/payments/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason, ...(amount ? { amount } : {}) }),
    }),

  // Support Tickets
  getSupportTickets: (params?: Record<string, string>) =>
    request<any>(`/admin/support-tickets?${new URLSearchParams(params)}`),
  getSupportTicketById: (id: string) => request<any>(`/admin/support-tickets/${id}`),
  updateSupportTicket: (id: string, body: object) =>
    request<any>(`/admin/support-tickets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // Notifications
  sendBulkNotification: (body: { title: string; message: string; type: string; roles?: string[]; userIds?: string[] }) =>
    request<any>('/admin/notifications/bulk', { method: 'POST', body: JSON.stringify(body) }),

  // Export
  exportData: (dataType: string, params?: Record<string, string>) =>
    request<any>(`/admin/export/${dataType}?${new URLSearchParams(params)}`),
};

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Bell, Send, Trash2, CheckCheck, RefreshCw, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { api } from '@/lib/api';

const TYPE_COLORS: Record<string, string> = {
  delivery: 'bg-blue-100 text-blue-700',
  payment: 'bg-green-100 text-green-700',
  driver: 'bg-purple-100 text-purple-700',
  company: 'bg-orange-100 text-orange-700',
  security: 'bg-red-100 text-red-700',
  system: 'bg-gray-100 text-gray-700',
  support: 'bg-yellow-100 text-yellow-700',
  announcement: 'bg-indigo-100 text-indigo-700',
  order: 'bg-teal-100 text-teal-700',
};

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const NOTIF_TYPES = [
  'announcement', 'system', 'delivery', 'payment',
  'security', 'promotion', 'order', 'support', 'driver', 'company',
];

export default function NotificationsPage() {
  // ── Inbox state ────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const limit = 15;

  // ── Bulk sender state ──────────────────────────────────────────────────────
  const [form, setForm] = useState({ title: '', message: '', type: 'announcement', target: 'all' });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [userIds, setUserIds] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── Fetch notifications ────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (filterUnread) params.unreadOnly = 'true';
      if (filterType) params.type = filterType;
      const res = await api.getNotifications(params);
      setNotifications(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
      setUnreadCount(res.pagination?.unreadCount ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filterUnread, filterType]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const markRead = async (id: string) => {
    setActionLoading(id);
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const deleteOne = async (id: string) => {
    setActionLoading(id + '_del');
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setTotal(t => t - 1);
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const markAllRead = async () => {
    setActionLoading('all');
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const clearRead = async () => {
    setActionLoading('clear');
    try {
      await api.clearReadNotifications();
      await fetchNotifications();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  // ── Bulk send ──────────────────────────────────────────────────────────────
  const toggleRole = (r: string) =>
    setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    try {
      const body: any = { title: form.title, message: form.message, type: form.type };
      if (form.target === 'customer') body.roles = ['customer'];
      else if (form.target === 'driver') body.roles = ['driver'];
      else if (form.target === 'company_admin') body.roles = ['company_admin'];
      else if (form.target === 'userIds' && userIds.trim())
        body.userIds = userIds.split(',').map(s => s.trim()).filter(Boolean);
      // 'all' → omit roles and userIds
      const res = await api.sendBulkNotification(body);
      setSendResult({ ok: true, msg: res.message ?? `Sent to ${res.data?.recipientCount ?? 0} users` });
      setForm({ title: '', message: '', type: 'announcement', target: 'all' });
      setSelectedRoles([]);
      setUserIds('');
    } catch (e: any) {
      setSendResult({ ok: false, msg: e.message || 'Failed to send' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">View your admin notifications and send bulk messages to users</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">

        {/* ── Inbox (3/5) ── */}
        <div className="xl:col-span-3 flex flex-col gap-4">

          {/* Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-900">Inbox</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {/* Unread filter */}
              <button
                onClick={() => { setFilterUnread(v => !v); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                  filterUnread ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                Unread only
              </button>

              {/* Type filter */}
              <select
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All types</option>
                {NOTIF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              {/* Mark all read */}
              <button
                onClick={markAllRead}
                disabled={actionLoading === 'all' || unreadCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {actionLoading === 'all' ? 'Marking...' : 'Mark all read'}
              </button>

              {/* Clear read */}
              <button
                onClick={clearRead}
                disabled={actionLoading === 'clear'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {actionLoading === 'clear' ? 'Clearing...' : 'Clear read'}
              </button>

              {/* Refresh */}
              <button
                onClick={fetchNotifications}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <Bell className="w-12 h-12" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(n => (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}
                  >
                    {/* Unread dot */}
                    <div className="flex-shrink-0 mt-1.5">
                      <div className={`w-2 h-2 rounded-full ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} leading-snug`}>
                          {n.title}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{n.timeAgo}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[n.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {n.type}
                        </span>
                        {n.priority && n.priority !== 'medium' && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[n.priority] ?? 'bg-gray-400'}`} />
                            {n.priority}
                          </span>
                        )}
                        {n.subType && (
                          <span className="text-xs text-gray-400">{n.subType.replace(/_/g, ' ')}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.read && (
                        <button
                          onClick={() => markRead(n._id)}
                          disabled={actionLoading === n._id}
                          title="Mark as read"
                          className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteOne(n._id)}
                        disabled={actionLoading === n._id + '_del'}
                        title="Delete"
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{total} total</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bulk Sender (2/5) ── */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Send Bulk Notification</h2>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  maxLength={200}
                  placeholder="e.g. System Maintenance"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  required
                  maxLength={500}
                  rows={3}
                  placeholder="e.g. The platform will be down for 30 minutes tonight."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.message.length}/500</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {NOTIF_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Send To</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all',          label: 'Everyone',  sub: 'All active users',     color: 'border-blue-500 bg-blue-50 text-blue-700',    idle: 'border-gray-200 hover:border-blue-300' },
                    { id: 'customer',     label: 'Customers', sub: 'All customers',         color: 'border-green-500 bg-green-50 text-green-700',  idle: 'border-gray-200 hover:border-green-300' },
                    { id: 'driver',       label: 'Drivers',   sub: 'All drivers',           color: 'border-purple-500 bg-purple-50 text-purple-700', idle: 'border-gray-200 hover:border-purple-300' },
                    { id: 'company_admin',label: 'Companies', sub: 'All company admins',    color: 'border-orange-500 bg-orange-50 text-orange-700', idle: 'border-gray-200 hover:border-orange-300' },
                    { id: 'userIds',      label: 'Specific',  sub: 'Enter user IDs',        color: 'border-gray-700 bg-gray-100 text-gray-800',    idle: 'border-gray-200 hover:border-gray-400' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, target: opt.id })); setSelectedRoles([]); }}
                      className={`flex flex-col items-start px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                        form.target === opt.id ? opt.color : `bg-white text-gray-600 ${opt.idle}`
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-xs opacity-70 mt-0.5">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {form.target === 'userIds' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    User IDs <span className="text-gray-400 font-normal">(comma separated)</span>
                  </label>
                  <textarea
                    value={userIds}
                    onChange={e => setUserIds(e.target.value)}
                    rows={3}
                    placeholder="64abc123, 64def456, 64ghi789"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-xs font-mono"
                  />
                </div>
              )}

              {sendResult && (
                <div className={`px-4 py-3 rounded-xl text-sm flex items-center justify-between ${
                  sendResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <span>{sendResult.msg}</span>
                  <button onClick={() => setSendResult(null)} className="ml-2 opacity-60 hover:opacity-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || (form.target === 'userIds' && !userIds.trim())}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Notification'}
              </button>

              <p className="text-xs text-center text-gray-400">
                {form.target === 'all' && 'Sends to all active users on the platform'}
                {form.target === 'customer' && 'Sends to all active customers'}
                {form.target === 'driver' && 'Sends to all active drivers'}
                {form.target === 'company_admin' && 'Sends to all company admins'}
                {form.target === 'userIds' && 'Sends only to the user IDs you enter'}
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

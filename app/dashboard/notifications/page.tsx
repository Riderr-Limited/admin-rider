'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Send, Users, TrendingUp, Package, DollarSign, MessageSquare, Phone } from 'lucide-react';
import { api } from '@/lib/api';

const METRICS = ['all', 'users', 'deliveries', 'revenue', 'drivers'] as const;

export default function NotificationsPage() {
  // Notification form
  const [form, setForm] = useState({ title: '', message: '', type: 'announcement', target: 'roles' });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [userIds, setUserIds] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  // Analytics
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [metric, setMetric] = useState<typeof METRICS[number]>('all');
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.systemStats().catch(() => null),
      api.analytics({ metric, period: '30days' }).catch(() => null),
    ]).then(([s, a]) => {
      setStats(s?.data ?? null);
      setAnalytics(a?.data ?? null);
    }).finally(() => setAnalyticsLoading(false));
  }, [metric]);

  const toggleRole = (r: string) => {
    setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendMsg('');
    try {
      const body: any = { title: form.title, message: form.message, type: form.type };
      if (form.target === 'roles' && selectedRoles.length > 0) body.roles = selectedRoles;
      if (form.target === 'userIds' && userIds.trim()) body.userIds = userIds.split(',').map(s => s.trim()).filter(Boolean);
      // if target === 'all', omit both roles and userIds
      await api.sendBulkNotification(body);
      setSendMsg('Notification sent successfully!');
      setForm({ title: '', message: '', type: 'announcement', target: 'roles' });
      setSelectedRoles([]);
      setUserIds('');
    } catch (e: any) {
      setSendMsg(e.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const statCards = stats ? [
    { label: 'Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Drivers', value: stats.drivers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Companies', value: stats.companies, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Deliveries', value: stats.deliveries, icon: Package, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Payments', value: stats.payments, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Support Tickets', value: stats.supportTickets, icon: MessageSquare, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Chat Messages', value: stats.chatMessages, icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Voice Calls', value: stats.voiceCalls, icon: Phone, color: 'text-pink-600', bg: 'bg-pink-100' },
  ] : [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications & Analytics</h1>
        <p className="text-gray-600">Send bulk notifications and view platform analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Notification */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Send Bulk Notification</h2>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. System Maintenance"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={3}
                  placeholder="e.g. The platform will be down for 30 minutes tonight."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="announcement">Announcement</option>
                  <option value="alert">Alert</option>
                  <option value="promotion">Promotion</option>
                  <option value="update">Update</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Send To</label>
                <select
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Active Users</option>
                  <option value="roles">By Role</option>
                  <option value="userIds">Specific User IDs</option>
                </select>
              </div>

              {form.target === 'roles' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {['driver', 'customer', 'company_admin', 'admin'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRole(r)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                          selectedRoles.includes(r)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {r.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.target === 'userIds' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">User IDs <span className="text-gray-400 font-normal">(comma separated)</span></label>
                  <textarea
                    value={userIds}
                    onChange={(e) => setUserIds(e.target.value)}
                    rows={2}
                    placeholder="id1, id2, id3..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm font-mono"
                  />
                </div>
              )}

              {sendMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm ${sendMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {sendMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
            </form>
          </div>
        </div>

        {/* System Stats + Analytics */}
        <div className="space-y-6">
          {/* System Stats */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">System Stats</h2>
            </div>
            {analyticsLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`${bg} p-2 rounded-lg`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{Number(value ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Analytics</h2>
              </div>
              <select
                value={metric}
                onChange={(e) => { setMetric(e.target.value as any); setAnalyticsLoading(true); }}
                className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              >
                {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {analyticsLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : analytics ? (
              <div className="space-y-2 text-sm">
                {Object.entries(analytics).map(([key, val]: any) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold text-gray-900">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No analytics data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

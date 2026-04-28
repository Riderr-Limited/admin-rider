'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Search, ChevronLeft, ChevronRight, XCircle, Save } from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function SupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);
  const [updateForm, setUpdateForm] = useState({ status: '', priority: '', response: '', internalNotes: '' });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');
  const limit = 15;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (search) params.search = search;
      const res = await api.getSupportTickets(params);
      setTickets(res.data?.tickets ?? res.data ?? []);
      setTotal(res.data?.total ?? res.pagination?.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status, priority, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openTicket = async (id: string) => {
    try {
      const res = await api.getSupportTicketById(id);
      const t = res.data ?? res;
      setSelected(t);
      setUpdateForm({ status: t.status ?? '', priority: t.priority ?? '', response: t.response ?? '', internalNotes: t.internalNotes ?? '' });
      setUpdateMsg('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateMsg('');
    try {
      const body: Record<string, string> = {};
      if (updateForm.status) body.status = updateForm.status;
      if (updateForm.priority) body.priority = updateForm.priority;
      if (updateForm.response) body.response = updateForm.response;
      if (updateForm.internalNotes) body.internalNotes = updateForm.internalNotes;
      await api.updateSupportTicket(selected._id, body);
      setUpdateMsg('Ticket updated successfully!');
      fetchTickets();
      setTimeout(() => { setSelected(null); setUpdateMsg(''); }, 1200);
    } catch (e: any) {
      setUpdateMsg(e.message || 'Update failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Tickets</h1>
        <p className="text-gray-600">Manage customer and driver support requests</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ticket ID, title, description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Ticket', 'User', 'Issue Type', 'Priority', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tickets.map((ticket: any) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-blue-600">#{ticket.ticketId ?? ticket._id?.slice(-6)}</p>
                        <p className="text-xs text-gray-700 mt-0.5 max-w-[180px] truncate">{ticket.title ?? ticket.subject ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{ticket.user?.name ?? ticket.userId ?? '—'}</p>
                        <p className="text-xs text-gray-500">{ticket.user?.role ?? ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 capitalize">{ticket.issueType?.replace(/_/g, ' ') ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[ticket.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ticket.priority ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ticket.status?.replace(/_/g, ' ') ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => openTicket(ticket._id)} className="px-3 py-1.5 text-xs font-medium border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tickets.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No support tickets found</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">#{selected.ticketId ?? selected._id?.slice(-6)}</h2>
                <p className="text-sm text-gray-500">{selected.title ?? selected.subject}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">User</span><span className="font-medium">{selected.user?.name ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Issue Type</span><span className="capitalize">{selected.issueType?.replace(/_/g, ' ') ?? '—'}</span></div>
                {selected.description && <div><p className="text-gray-500 mb-1">Description</p><p className="text-gray-800">{selected.description}</p></div>}
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                    <select value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="">No change</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                    <select value={updateForm.priority} onChange={(e) => setUpdateForm({ ...updateForm, priority: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="">No change</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Response to User</label>
                  <textarea value={updateForm.response} onChange={(e) => setUpdateForm({ ...updateForm, response: e.target.value })} rows={3} placeholder="Write a response visible to the user..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Internal Notes</label>
                  <textarea value={updateForm.internalNotes} onChange={(e) => setUpdateForm({ ...updateForm, internalNotes: e.target.value })} rows={2} placeholder="Internal notes (not visible to user)..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm" />
                </div>
                {updateMsg && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${updateMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{updateMsg}</div>
                )}
                <button type="submit" disabled={updateLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                  <Save className="w-4 h-4" />
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

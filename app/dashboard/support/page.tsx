'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MessageSquare, Search, ChevronLeft, ChevronRight, XCircle, Send } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';

const SOCKET_URL = 'http://localhost:5000';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
};

function timeAgo(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  // ticket detail + chat
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const adminId = useRef<string>('');

  // get admin id from localStorage
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) adminId.current = JSON.parse(u)._id ?? '';
  }, []);

  // auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const socket = io(`${SOCKET_URL}/support`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('receive_message', (msg: any) => {
      // senderId is a plain string in socket events
      setMessages(prev => [...prev, msg]);
    });

    return () => { socket.disconnect(); };
  }, []);

  // ── Tickets ────────────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const res = await api.getSupportTickets(params);
      const all: any[] = res.data ?? [];
      setTotal(all.length);
      // client-side pagination since API doesn't support it
      setTickets(all.slice((page - 1) * limit, page * limit));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ── Open ticket ────────────────────────────────────────────────────────────
  const openTicket = async (ticket: any) => {
    setSelected(ticket);
    setMessages([]);
    setMsgLoading(true);
    setText('');
    try {
      const res = await api.getSupportTicketMessages(ticket.ticketId);
      setMessages(res.data ?? []);
      // join socket room as agent
      socketRef.current?.emit('agent_join', { ticketId: ticket.ticketId });
    } catch (e) {
      console.error(e);
    } finally {
      setMsgLoading(false);
    }
  };

  // ── Update status ──────────────────────────────────────────────────────────
  const updateStatus = async (newStatus: string) => {
    if (!selected || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const res = await api.updateSupportTicket(selected.ticketId, { status: newStatus });
      const updated = res.data ?? res;
      setSelected(updated);
      setTickets(prev => prev.map(t => t.ticketId === updated.ticketId ? updated : t));
    } catch (e: any) {
      console.error(e);
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selected || sending) return;
    const msg = text.trim();
    setText('');
    setSending(true);
    socketRef.current?.emit('send_message', {
      senderId: adminId.current,
      ticketId: selected.ticketId,
      text: msg,
      timestamp: new Date().toISOString(),
    }, (ack: any) => {
      // ack.message has senderId as plain string — build display object
      if (ack?.success) {
        setMessages(prev => [...prev, {
          ...ack.message,
          senderId: { _id: adminId.current, name: 'Admin', email: '' },
        }]);
      }
      setSending(false);
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Tickets</h1>
        <p className="text-gray-600">Manage customer and driver support requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex gap-4">
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
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
                    {['Ticket', 'User', 'Issue Type', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tickets.map((ticket: any) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-blue-600">{ticket.ticketId}</p>
                        <p className="text-xs text-gray-700 mt-0.5 max-w-[200px] truncate">{ticket.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{ticket.user?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{ticket.user?.email ?? ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 capitalize">{ticket.issueType?.replace(/_/g, ' ') ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openTicket(ticket)}
                          className="px-3 py-1.5 text-xs font-medium border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Open Chat
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

      {/* ── Ticket Chat Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col" style={{ height: '85vh' }}>

            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-start justify-between flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-base font-bold text-gray-900">{selected.ticketId}</h2>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[selected.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {selected.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5 truncate">{selected.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selected.user?.name} · {selected.issueType?.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {/* Quick status change */}
                {selected.status !== 'resolved' && (
                  <button
                    onClick={() => updateStatus(selected.status === 'open' ? 'in-progress' : 'resolved')}
                    disabled={statusUpdating}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                      selected.status === 'open'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {statusUpdating ? '...' : selected.status === 'open' ? 'Mark In Progress' : 'Mark Resolved'}
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700">{selected.description}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {msgLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <MessageSquare className="w-8 h-8" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                messages.map((msg: any, i: number) => {
                  // senderId can be object (REST) or string (socket)
                  const senderIdStr = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId?._id;
                  const isAdmin = senderIdStr === adminId.current;
                  const senderName = typeof msg.senderId === 'object' ? msg.senderId?.name : (isAdmin ? 'Admin' : selected.user?.name);
                  return (
                    <div key={msg._id ?? i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <span className="text-xs text-gray-400 px-1">{senderName}</span>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 shadow-sm rounded-bl-sm border border-gray-100'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-xs text-gray-400 px-1">{timeAgo(msg.timestamp ?? msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {selected.status !== 'resolved' ? (
              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-400 flex-shrink-0">
                This ticket is resolved. Reopen to reply.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

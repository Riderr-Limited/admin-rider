'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MessageSquare, Send, Search, Circle, Trash2, ChevronUp, ArrowLeft, Phone, Mail } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { Badge, humanize, initial } from '../ui';

const SOCKET_URL = 'https://riderr-backend.onrender.com';
const POLL_MS = 15_000;

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

const ROLE_TONE: Record<string, string> = { driver: 'violet', customer: 'blue', company_admin: 'orange' };

export default function ChatPage({ onUnreadChange }: { onUnreadChange?: (n: number) => void } = {}) {
  const [inbox, setInbox] = useState<any[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const selectedRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef('');

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { searchRef.current = search; }, [search]);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await api.getChatConversations({ limit: 50, search: searchRef.current });
      setInbox(res.data ?? []);
      if (typeof res.totalUnread === 'number') onUnreadChange?.(res.totalUnread);
    } catch (e) {
      console.error(e);
    } finally {
      setInboxLoading(false);
    }
  }, [onUnreadChange]);

  const mergeMessages = (incoming: any[]) => {
    setMessages(prev => {
      const seen = new Set(prev.map(m => m._id));
      const fresh = incoming.filter(m => m?._id && !seen.has(m._id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(fetchInbox, 300);
    return () => clearTimeout(t);
  }, [search, fetchInbox]);

  // Poll so new messages arrive even if the socket can't connect.
  useEffect(() => {
    const t = setInterval(async () => {
      fetchInbox();
      const cur = selectedRef.current;
      if (cur) {
        try {
          const res = await api.getChatUserMessages(cur.userId, 30);
          mergeMessages(res.data ?? []);
        } catch {}
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [fetchInbox]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket: Socket = io(`${SOCKET_URL}/admin-chat`, { auth: { token }, transports: ['websocket'], reconnectionAttempts: 5 });
    setConnectionStatus('connecting');
    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('connect_error', () => setConnectionStatus('disconnected'));

    const onIncoming = (msg: any, fromUserId?: string) => {
      fetchInbox();
      const uid = String(fromUserId ?? msg?.userId?._id ?? msg?.userId ?? '');
      if (selectedRef.current && String(selectedRef.current.userId) === uid) mergeMessages([msg]);
    };
    socket.on('new_user_message', ({ data, fromUserId }: any) => onIncoming(data, fromUserId));
    socket.on('receive_message', (msg: any) => onIncoming(msg));
    socket.on('message_deleted', ({ messageId }: any) => setMessages(prev => prev.filter(m => m._id !== messageId)));

    return () => { socket.disconnect(); };
  }, [fetchInbox]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length, selected?.userId]);

  const openConversation = async (item: any) => {
    setSelected(item);
    setLoadingMsgs(true);
    setMessages([]);
    setHasMore(false);
    setSendError('');
    try {
      // Fetching as admin also marks the user's messages read server-side.
      const res = await api.getChatUserMessages(item.userId, 50);
      setMessages(res.data ?? []);
      setHasMore(res.pagination?.hasMore ?? false);
      if (item.unreadCount > 0) {
        api.markChatRead(item.userId).catch(() => {});
        setInbox(prev => prev.map(c => c.userId === item.userId ? { ...c, unreadCount: 0 } : c));
        fetchInbox();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMsgs(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const loadMore = async () => {
    if (!selected || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const res = await api.getChatUserMessages(selected.userId, 50, messages[0]._id);
      setMessages(prev => [...(res.data ?? []), ...prev]);
      setHasMore(res.pagination?.hasMore ?? false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg || !selected || sending) return;
    setSending(true);
    setSendError('');
    try {
      const res = await api.sendChatMessage(selected.userId, msg);
      setText('');
      if (res.data) mergeMessages([res.data]);
      fetchInbox();
    } catch (err: any) {
      setSendError(err.message || 'Message failed to send');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!confirm('Delete this message for everyone?')) return;
    try {
      await api.deleteChatMessage(msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (e) {
      console.error(e);
    }
  };

  const statusDot = connectionStatus === 'connected' ? 'fill-emerald-500 text-emerald-500' : connectionStatus === 'connecting' ? 'fill-amber-500 text-amber-500' : 'fill-gray-400 text-gray-400';
  const statusText = connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting…' : `Auto-refresh every ${POLL_MS / 1000}s`;

  return (
    <div className="flex h-full">
      {/* Inbox — full width on phones until a conversation is picked */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col flex-shrink-0`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Live chat</h2>
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><Circle className={`w-2 h-2 ${statusDot}`} />{statusText}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="search"
              placeholder="Search name, email or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {inboxLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : inbox.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 gap-2 py-16">
              <MessageSquare className="w-10 h-10" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-center px-8">Conversations appear here when a user messages support from the app.</p>
            </div>
          ) : (
            inbox.map(item => {
              const isActive = selected?.userId === item.userId;
              const user = item.user ?? {};
              return (
                <button
                  key={item.userId}
                  onClick={() => openConversation(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 text-left border-l-4 ${isActive ? 'bg-blue-50 border-l-blue-600' : 'border-l-transparent'}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">{initial(user.name)}</div>
                    {item.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {item.unreadCount > 9 ? '9+' : item.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${item.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>{user.name ?? 'Unknown'}</p>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(item.lastMessageTime)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${item.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {item.lastIsAdminMessage ? 'You: ' : ''}{item.lastMessageType === 'image' ? '📷 Photo' : (item.lastMessage || '—')}
                    </p>
                  </div>
                  <Badge tone={ROLE_TONE[user.role]} className="hidden sm:inline-flex">{humanize(user.role)}</Badge>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50 min-w-0`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 px-6 text-center">
            <MessageSquare className="w-14 h-14" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Pick a user on the left to read and reply.</p>
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-200 px-3 sm:px-5 py-3 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setSelected(null)} className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100" aria-label="Back to inbox"><ArrowLeft className="w-5 h-5" /></button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">{initial(selected.user?.name)}</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{selected.user?.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500 truncate">{humanize(selected.user?.role)}{selected.user?.isActive === false ? ' · suspended' : ''} · {selected.totalMessages ?? messages.length} messages</p>
              </div>
              {selected.user?.phone && <a href={`tel:${selected.user.phone}`} className="p-2 rounded-lg hover:bg-gray-100" title={selected.user.phone}><Phone className="w-4 h-4 text-gray-600" /></a>}
              {selected.user?.email && <a href={`mailto:${selected.user.email}`} className="p-2 rounded-lg hover:bg-gray-100" title={selected.user.email}><Mail className="w-4 h-4 text-gray-600" /></a>}
            </div>

            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3">
              {hasMore && (
                <div className="flex justify-center">
                  <button onClick={loadMore} disabled={loadingMore} className="flex items-center gap-1.5 text-xs text-blue-600 px-3 py-1.5 bg-white rounded-full shadow-sm ring-1 ring-gray-200 disabled:opacity-50">
                    <ChevronUp className="w-3 h-3" /> {loadingMore ? 'Loading…' : 'Load older messages'}
                  </button>
                </div>
              )}
              {loadingMsgs ? (
                <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2"><MessageSquare className="w-10 h-10" /><p className="text-sm">No messages yet</p></div>
              ) : (
                messages.map((msg: any, i: number) => {
                  const mine = msg.isAdminMessage;
                  return (
                    <div key={msg._id ?? i} className={`flex group ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
                        <div className={`relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-900 shadow-sm rounded-bl-sm ring-1 ring-gray-100'}`}>
                          {msg.imageUrl && (
                            <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={msg.imageUrl} alt="" className="rounded-lg max-h-60 mb-1" />
                            </a>
                          )}
                          {msg.message}
                        </div>
                        <div className="flex items-center gap-2 px-1 text-[11px] text-gray-400">
                          <span>{mine && msg.senderId?.name ? `${msg.senderId.name} · ` : ''}{timeAgo(msg.createdAt)}</span>
                          {mine && msg.isRead && <span className="text-blue-500">✓ read</span>}
                          <button onClick={() => deleteMessage(msg._id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500" title="Delete message"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 px-3 sm:px-5 py-3 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {sendError && <p className="text-xs text-red-600 mb-2">{sendError}</p>}
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Reply to ${selected.user?.name ?? 'user'}…`}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none max-h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button type="submit" disabled={!text.trim() || sending} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex-shrink-0" aria-label="Send">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

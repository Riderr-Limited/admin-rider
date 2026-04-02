'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MessageSquare, Send, Search, Circle, Trash2, ChevronUp } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';

const SOCKET_URL = 'http://localhost:5000';

function avatar(name?: string) {
  return name?.[0]?.toUpperCase() ?? '?';
}

function timeAgo(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

const ROLE_COLORS: Record<string, string> = {
  driver: 'bg-purple-100 text-purple-600',
  customer: 'bg-blue-100 text-blue-600',
  rider: 'bg-green-100 text-green-600',
};

export default function ChatPage() {
  const [inbox, setInbox] = useState<any[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null); // full conversation item
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const selectedRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // keep ref in sync for socket handlers
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // ── Inbox ──────────────────────────────────────────────────────────────────
  const fetchInbox = useCallback(async (q?: string) => {
    try {
      const params: Record<string, string> = { limit: '30' };
      if (q) params.search = q;
      const res = await api.getChatConversations(params);
      setInbox(res.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchInbox(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchInbox]);

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(`${SOCKET_URL}/admin-chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    // new message from a user → update inbox + append if thread is open
    socket.on('new_user_message', ({ data, fromUserId }: any) => {
      fetchInbox();
      if (selectedRef.current?.userId === fromUserId) {
        setMessages(prev => [...prev, data]);
      }
    });

    // confirmation that admin's own sent message was broadcast
    socket.on('receive_message', (msg: any) => {
      if (selectedRef.current?.userId === msg.userId) {
        setMessages(prev => {
          // avoid duplicate if already added via ack
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      fetchInbox();
    });

    // message deleted
    socket.on('message_deleted', ({ messageId }: any) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    return () => { socket.disconnect(); };
  }, [fetchInbox]);

  // auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Open conversation ──────────────────────────────────────────────────────
  const openConversation = async (item: any) => {
    setSelected(item);
    setLoadingMsgs(true);
    setMessages([]);
    setHasMore(false);
    inputRef.current?.focus();
    try {
      const res = await api.getChatUserMessages(item.userId, 50);
      setMessages(res.data ?? []);
      setHasMore(res.pagination?.hasMore ?? false);
      // update inbox badge to 0 for this user
      setInbox(prev => prev.map(c => c.userId === item.userId ? { ...c, unreadCount: 0 } : c));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMsgs(false);
    }
  };

  // ── Load older messages ────────────────────────────────────────────────────
  const loadMore = async () => {
    if (!selected || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0]._id;
      const res = await api.getChatUserMessages(selected.userId, 50, oldest);
      setMessages(prev => [...(res.data ?? []), ...prev]);
      setHasMore(res.pagination?.hasMore ?? false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selected || sending) return;
    const msg = text.trim();
    setText('');
    setSending(true);
    socketRef.current?.emit(
      'send_message',
      { message: msg, userId: selected.userId },
      (ack: any) => {
        if (ack?.success && ack.data) {
          setMessages(prev => [...prev, ack.data]);
          fetchInbox();
        }
        setSending(false);
      }
    );
  };

  // ── Delete message ─────────────────────────────────────────────────────────
  const deleteMessage = async (msgId: string) => {
    try {
      await api.deleteChatMessage(msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (e: any) {
      console.error(e);
    }
  };

  const filtered = inbox.filter(item =>
    !search ||
    item.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex" style={{ height: 'calc(100vh - 73px)' }}>

      {/* ── Inbox Sidebar ── */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {inboxLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-12">
              <MessageSquare className="w-10 h-10" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filtered.map(item => {
              const isActive = selected?.userId === item.userId;
              const user = item.user ?? {};
              return (
                <button
                  key={item.userId}
                  onClick={() => openConversation(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                    isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {avatar(user.name)}
                    </div>
                    {item.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {item.unreadCount > 9 ? '9+' : item.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${item.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                        {user.name ?? 'Unknown'}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(item.lastMessageTime)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${item.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {item.lastIsAdminMessage ? '↩ ' : ''}{item.lastMessage || '—'}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-500'}`}>
                      {user.role ?? ''}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <MessageSquare className="w-16 h-16" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">Choose a user from the left to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                {avatar(selected.user?.name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{selected.user?.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500 truncate">{selected.user?.email ?? ''}</p>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[selected.user?.role] ?? 'bg-gray-100 text-gray-500'}`}>
                  {selected.user?.role}
                </span>
                {selected.user?.phone && (
                  <span className="text-xs text-gray-500">{selected.user.phone}</span>
                )}
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 flex-shrink-0">
                <Circle className="w-2 h-2 fill-green-500" />
                Live
              </div>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-3 flex-shrink-0">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200 disabled:opacity-50"
                >
                  <ChevronUp className="w-3 h-3" />
                  {loadingMore ? 'Loading...' : 'Load older messages'}
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-12">
                  <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <MessageSquare className="w-10 h-10" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg: any, i: number) => {
                  const isAdmin = msg.isAdminMessage;
                  return (
                    <div key={msg._id ?? i} className={`flex group ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      {!isAdmin && (
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xs mr-2 flex-shrink-0 self-end mb-5">
                          {avatar(msg.senderId?.name ?? selected.user?.name)}
                        </div>
                      )}
                      <div className={`max-w-[65%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isAdmin
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 shadow-sm rounded-bl-sm border border-gray-100'
                        }`}>
                          {msg.message}
                          {isAdmin && (
                            <button
                              onClick={() => deleteMessage(msg._id)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-xs text-gray-400">{timeAgo(msg.createdAt)}</span>
                          {isAdmin && msg.isRead && (
                            <span className="text-xs text-blue-400">✓ read</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`Reply to ${selected.user?.name ?? 'user'}...`}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

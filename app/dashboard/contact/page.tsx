'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Mail, Reply, Check } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';
import { Badge, Card, EmptyState, LoadingBlock, Modal, Notice, Tabs, btnPrimary, btnSecondary, fmtDateTime, initial } from '../ui';

type Status = 'new' | 'read' | 'replied';

export default function ContactMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'' | Status>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState('');
  const limit = 20;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getContactMessages({ page, limit, status });
      setMessages(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { setPage(1); }, [status]);

  const setMsgStatus = async (m: any, s: Status) => {
    try {
      await api.updateContactStatus(m._id, s);
      setMessages(prev => prev.map(x => x._id === m._id ? { ...x, status: s } : x));
      setSelected((prev: any) => prev?._id === m._id ? { ...prev, status: s } : prev);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openMessage = (m: any) => {
    setSelected(m);
    if (m.status === 'new') setMsgStatus(m, 'read');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <PageHeader icon={Mail} title="Contact Messages" subtitle="Enquiries submitted through the website contact form" gradient="from-teal-500 to-emerald-600" />

      {error && <div className="mb-4"><Notice tone="red" onClose={() => setError('')}>{error}</Notice></div>}

      <Tabs
        tabs={[{ id: '' as const, label: 'All' }, { id: 'new' as const, label: 'New' }, { id: 'read' as const, label: 'Read' }, { id: 'replied' as const, label: 'Replied' }]}
        value={status}
        onChange={setStatus}
      />

      {loading ? <LoadingBlock /> : messages.length === 0 ? <EmptyState icon={Mail} text="No messages" /> : (
        <>
          <Card className="divide-y divide-gray-100 overflow-hidden">
            {messages.map(m => (
              <button key={m._id} onClick={() => openMessage(m)} className={`w-full text-left px-4 sm:px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 ${m.status === 'new' ? 'bg-blue-50/40' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">{initial(m.name)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${m.status === 'new' ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>{m.name} <span className="font-normal text-gray-500">· {m.email}</span></p>
                    <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">{fmtDateTime(m.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-900 truncate">{m.subject}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{m.message}</p>
                  <span className="sm:hidden text-[11px] text-gray-400">{fmtDateTime(m.createdAt)}</span>
                </div>
                <Badge status={m.status} />
              </button>
            ))}
          </Card>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {selected && (
        <Modal
          title={selected.subject}
          subtitle={<>{selected.name} · {selected.email} · {fmtDateTime(selected.createdAt)}</>}
          onClose={() => setSelected(null)}
          footer={
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                onClick={() => setMsgStatus(selected, 'replied')}
                className={btnPrimary}
              ><Reply className="w-4 h-4" /> Reply by email</a>
              {selected.status !== 'replied' && (
                <button onClick={() => setMsgStatus(selected, 'replied')} className={btnSecondary}><Check className="w-4 h-4" /> Mark as replied</button>
              )}
              {selected.status !== 'new' && (
                <button onClick={() => setMsgStatus(selected, 'new')} className={`${btnSecondary} sm:ml-auto`}>Mark unread</button>
              )}
            </div>
          }
        >
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
        </Modal>
      )}
    </div>
  );
}

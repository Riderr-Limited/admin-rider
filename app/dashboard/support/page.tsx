'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LifeBuoy, Send, Save, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';
import {
  Badge, Card, EmptyState, LoadingBlock, Modal, InfoGrid, Section, Notice, Tabs, Field, FilterBar, SearchInput,
  selectCls, inputCls, btnPrimary, btnSecondary, fmtDate, fmtDateTime, humanize, useDebounced,
} from '../ui';

// Values from the SupportTicket model
const STATUSES = ['open', 'in-progress', 'resolved'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const ISSUE_TYPES = ['payment issues', 'delivery problems', 'app technical issues', 'account problems', 'safety concerns', 'other'];
const PRIORITY_TONE: Record<string, string> = { low: 'gray', medium: 'blue', high: 'orange', urgent: 'red' };

function adminId(): string | null {
  try { const u = JSON.parse(localStorage.getItem('user') ?? 'null'); return u?._id ?? u?.id ?? null; } catch { return null; }
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [issueType, setIssueType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const limit = 15;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getSupportTickets({ page, limit, status, priority, issueType, search: debouncedSearch });
      setTickets(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, priority, issueType, debouncedSearch]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { setPage(1); }, [status, priority, issueType, debouncedSearch]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader icon={LifeBuoy} title="Support Tickets" subtitle="Customer, rider and company support requests" gradient="from-amber-500 to-orange-600" />

      {error && <div className="mb-4"><Notice tone="red" onClose={() => setError('')}>{error}</Notice></div>}

      <Tabs tabs={[{ id: '', label: 'All' }, ...STATUSES.map(s => ({ id: s, label: humanize(s) }))]} value={status} onChange={setStatus} />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search ticket ID, title or description…" />
        <div className="grid grid-cols-2 sm:flex gap-3">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectCls}>
            <option value="">Any priority</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{humanize(p)}</option>)}
          </select>
          <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className={selectCls}>
            <option value="">Any issue type</option>
            {ISSUE_TYPES.map(t => <option key={t} value={t}>{humanize(t)}</option>)}
          </select>
        </div>
      </FilterBar>

      {loading ? <LoadingBlock /> : tickets.length === 0 ? <EmptyState icon={LifeBuoy} text="No support tickets" /> : (
        <>
          <Card className="divide-y divide-gray-100 overflow-hidden">
            {tickets.map((t) => (
              <button key={t._id} onClick={() => setSelectedId(t._id)} className="w-full text-left px-4 sm:px-5 py-3.5 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-blue-700">#{t.ticketId ?? t._id.slice(-6)}</span>
                    <Badge tone={PRIORITY_TONE[t.priority]}>{humanize(t.priority)}</Badge>
                    {t.messages?.length > 0 && <span className="text-xs text-gray-400">{t.messages.length} msg</span>}
                  </div>
                  <p className="font-semibold text-gray-900 truncate mt-0.5">{t.title}</p>
                  <p className="text-xs text-gray-500 truncate">{t.user?.name ?? 'User'} · {humanize(t.user?.role)} · {humanize(t.issueType)} · {fmtDate(t.createdAt)}</p>
                </div>
                <Badge status={t.status} />
              </button>
            ))}
          </Card>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {selectedId && <TicketModal id={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchTickets} />}
    </div>
  );
}

function TicketModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [ticket, setTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ status: '', priority: '', internalNotes: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const me = adminId();

  const load = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([api.getSupportTicketById(id), api.getSupportTicketMessages(id).catch(() => null)]);
      setTicket(t.data);
      setForm({ status: t.data.status ?? 'open', priority: t.data.priority ?? 'medium', internalNotes: t.data.internalNotes ?? '' });
      setMessages(m?.data ?? t.data.messages ?? []);
    } catch (e: any) {
      setMsg({ tone: 'red', text: e.message });
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await api.sendSupportTicketMessage(id, reply.trim());
      setMessages(prev => [...prev, { ...res.data, senderRole: 'admin' }]);
      setReply('');
      // Move a fresh ticket into progress once support has replied.
      if (ticket?.status === 'open') {
        await api.updateSupportTicket(id, { status: 'in-progress' }).catch(() => {});
        setForm(f => ({ ...f, status: 'in-progress' }));
      }
      onChanged();
    } catch (e: any) {
      setMsg({ tone: 'red', text: e.message });
    } finally {
      setSending(false);
    }
  };

  const save = async (extra: Record<string, any> = {}) => {
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, any> = { ...extra };
      if (form.status !== ticket.status) body.status = form.status;
      if (form.priority !== ticket.priority) body.priority = form.priority;
      if (form.internalNotes !== (ticket.internalNotes ?? '')) body.internalNotes = form.internalNotes;
      if (!Object.keys(body).length) { setMsg({ tone: 'green', text: 'Nothing to save' }); return; }
      const res = await api.updateSupportTicket(id, body);
      setTicket((t: any) => ({ ...t, ...res.data }));
      setMsg({ tone: 'green', text: 'Ticket updated' });
      onChanged();
    } catch (e: any) {
      setMsg({ tone: 'red', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (!ticket) return <Modal title="Loading ticket…" onClose={onClose} size="lg">{msg ? <Notice tone="red">{msg.text}</Notice> : <LoadingBlock />}</Modal>;

  const assignedToMe = me && (ticket.assignedTo?._id ?? ticket.assignedTo) === me;

  return (
    <Modal
      title={ticket.title}
      subtitle={<span className="flex flex-wrap items-center gap-1.5 mt-1"><span className="font-mono text-xs">#{ticket.ticketId}</span><Badge status={ticket.status} /><Badge tone={PRIORITY_TONE[ticket.priority]}>{humanize(ticket.priority)}</Badge></span>}
      size="xl"
      onClose={onClose}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 flex flex-col min-w-0">
          <div className="bg-gray-50 rounded-xl p-4 text-sm mb-3">
            <p className="text-xs text-gray-500 mb-1">{ticket.user?.name ?? 'User'} wrote · {fmtDateTime(ticket.createdAt)}</p>
            <p className="text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="space-y-3 max-h-[40vh] lg:max-h-[50vh] overflow-y-auto pr-1">
            {ticket.response && !messages.some(m => m.message === ticket.response) && (
              <Bubble mine text={ticket.response} meta={`Official response · ${fmtDateTime(ticket.respondedAt)}`} />
            )}
            {messages.length === 0 && !ticket.response && <p className="text-xs text-gray-500 text-center py-4">No replies yet.</p>}
            {messages.map((m, i) => {
              const fromAdmin = m.senderRole === 'admin' || m.senderId?.role === 'admin';
              return <Bubble key={m._id ?? i} mine={fromAdmin} text={m.message} meta={`${fromAdmin ? (m.senderId?.name ?? 'Support') : (m.senderId?.name ?? ticket.user?.name ?? 'User')} · ${fmtDateTime(m.createdAt)}`} />;
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendReply} className="mt-3 flex gap-2 items-end">
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(e); }}
              rows={2}
              maxLength={2000}
              placeholder={`Reply to ${ticket.user?.name ?? 'user'}… (they get a notification)`}
              className={`${inputCls} resize-none`}
            />
            <button type="submit" disabled={sending || !reply.trim()} className={`${btnPrimary} !px-3`} aria-label="Send reply"><Send className="w-4 h-4" /></button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Section title="Requester">
            <InfoGrid items={[
              ['Name', ticket.user?.name ?? '—'],
              ['Role', humanize(ticket.user?.role)],
              ['Email', ticket.user?.email ?? '—'],
              ['Phone', ticket.user?.phone ?? '—'],
              ['Issue type', humanize(ticket.issueType)],
              ['Resolved', fmtDateTime(ticket.resolvedAt)],
            ]} />
          </Section>

          <Section
            title="Manage"
            action={!assignedToMe && me && <button onClick={() => save({ assignedTo: me })} disabled={saving} className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Assign to me</button>}
          >
            <div className="space-y-3">
              {ticket.assignedTo && <p className="text-xs text-gray-500">Assigned to {assignedToMe ? 'you' : (ticket.assignedTo?.name ?? 'another admin')}</p>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    {STATUSES.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={inputCls}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{humanize(p)}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Internal notes" hint="Only visible to admins">
                <textarea value={form.internalNotes} onChange={e => setForm({ ...form, internalNotes: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
              </Field>
              {msg && <Notice tone={msg.tone} onClose={() => setMsg(null)}>{msg.text}</Notice>}
              <div className="flex gap-2">
                <button onClick={() => save()} disabled={saving} className={`${btnPrimary} flex-1`}><Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}</button>
                {ticket.status !== 'resolved' && (
                  <button onClick={() => { setForm(f => ({ ...f, status: 'resolved' })); save({ status: 'resolved' }); }} disabled={saving} className={`${btnSecondary} flex-1 !text-emerald-700`}>Resolve</button>
                )}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  );
}

function Bubble({ mine, text, meta }: { mine: boolean; text: string; meta: string }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-900 ring-1 ring-gray-200 rounded-bl-sm'}`}>{text}</div>
        <span className="text-[11px] text-gray-400 px-1">{meta}</span>
      </div>
    </div>
  );
}

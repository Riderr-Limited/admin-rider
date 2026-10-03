'use client';

import React, { useEffect } from 'react';
import { X, Search } from 'lucide-react';

// ── Formatting ───────────────────────────────────────────────────────────────

export function money(value: unknown, currency = 'NGN') {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '—';
  const symbol = currency === 'NGN' ? '₦' : `${currency} `;
  return `${symbol}${n.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

export function compactMoney(value: unknown) {
  const n = Number(value ?? 0);
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return money(n);
}

export function fmtDate(iso?: string | Date | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function fmtDateTime(iso?: string | Date | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function humanize(value?: string | null) {
  if (!value) return '—';
  return value.replace(/[_-]+/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

export function initial(name?: string) {
  return name?.trim()?.[0]?.toUpperCase() ?? '?';
}

// ── Status colors (shared across pages) ──────────────────────────────────────

export const STATUS_TONE: Record<string, string> = {
  // generic
  active: 'green', approved: 'green', verified: 'green', successful: 'green', resolved: 'green',
  delivered: 'green', completed: 'green', settled: 'green', delivered_paid: 'green', replied: 'green',
  pending: 'amber', created: 'gray', open: 'blue', 'in-progress': 'amber', new: 'blue', read: 'gray',
  processing: 'amber', searching: 'amber', requested: 'amber', pod_requested: 'amber',
  searching_rider: 'amber', awaiting_confirmation: 'amber', awaiting_customer: 'amber',
  assigned: 'violet', accepted: 'violet', rider_assigned: 'violet', confirmed: 'violet', ready_for_delivery: 'violet',
  arrived: 'indigo', picked_up: 'indigo', ongoing: 'blue', in_progress: 'blue', at_pickup: 'indigo',
  out_for_delivery: 'blue', rescue_requested: 'orange',
  suspended: 'red', rejected: 'red', failed: 'red', cancelled: 'red', refunded: 'orange', rejected_return: 'red',
};

const TONES: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  gray: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
};

export function Badge({ children, tone, status, className = '' }: { children?: React.ReactNode; tone?: string; status?: string; className?: string }) {
  const t = tone ?? STATUS_TONE[String(status ?? '').toLowerCase()] ?? 'gray';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset whitespace-nowrap ${TONES[t] ?? TONES.gray} ${className}`}>
      {children ?? humanize(status)}
    </span>
  );
}

// ── Layout primitives ────────────────────────────────────────────────────────

export function Spinner({ className = '' }: { className?: string }) {
  return <div className={`w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin ${className}`} />;
}

export function LoadingBlock() {
  return <div className="flex justify-center py-16"><Spinner /></div>;
}

export function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-900/5 py-14 text-center">
      <Icon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 ${className}`}>{children}</div>;
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <Card className="mb-5 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">{children}</div>
    </Card>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex-1 min-w-0 sm:min-w-[220px] relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

export const selectCls = 'w-full sm:w-auto px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500';
export const inputCls = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
export const btnPrimary = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 transition-colors';
export const btnSecondary = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-gray-700 ring-1 ring-inset ring-gray-300 rounded-xl hover:bg-gray-50 text-sm font-semibold disabled:opacity-50 transition-colors';
export const btnDanger = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-semibold disabled:opacity-50 transition-colors';
export const btnSuccess = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50 transition-colors';
export const iconBtn = 'p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40';

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

// Bottom sheet on phones, centered dialog from `sm` up. Locks body scroll and closes on Escape.
export function Modal({
  title, subtitle, onClose, children, size = 'md', footer,
}: {
  title: React.ReactNode; subtitle?: React.ReactNode; onClose: () => void; children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`relative bg-white w-full ${width} max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-xl ring-1 ring-black/5`}>
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">{title}</h2>
            {subtitle && <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className={iconBtn} aria-label="Close"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 flex-1">{children}</div>
        {footer && <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

export function InfoGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-gray-500">{label}</dt>
          <dd className="text-gray-900 font-medium break-words">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="pt-5 mt-5 border-t border-gray-100 first:pt-0 first:mt-0 first:border-0">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold text-gray-900 tabular-nums truncate">{value}</p>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1 mb-4 no-scrollbar">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
            value === t.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-900/5 hover:bg-gray-50'
          }`}
        >
          {t.label}{t.count != null && <span className="ml-1.5 opacity-70">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Notice({ tone = 'green', children, onClose }: { tone?: 'green' | 'red' | 'amber' | 'blue'; children: React.ReactNode; onClose?: () => void }) {
  const cls = {
    green: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
    red: 'bg-red-50 text-red-800 ring-red-600/20',
    amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    blue: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  }[tone];
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ring-1 ring-inset ${cls}`}>
      <div className="flex-1">{children}</div>
      {onClose && <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>}
    </div>
  );
}

// Small text prompt dialog used for actions that need a reason (reject, cancel, suspend…).
export function ReasonModal({
  title, description, label = 'Reason', placeholder, confirmLabel, tone = 'danger', required = true, loading, onClose, onConfirm, extra,
}: {
  title: string; description?: React.ReactNode; label?: string; placeholder?: string; confirmLabel: string;
  tone?: 'danger' | 'primary' | 'success'; required?: boolean; loading?: boolean;
  onClose: () => void; onConfirm: (reason: string) => void; extra?: React.ReactNode;
}) {
  const [reason, setReason] = React.useState('');
  const cls = tone === 'danger' ? btnDanger : tone === 'success' ? btnSuccess : btnPrimary;
  return (
    <Modal
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className={`${btnSecondary} flex-1`}>Cancel</button>
          <button onClick={() => onConfirm(reason.trim())} disabled={loading || (required && !reason.trim())} className={`${cls} flex-1`}>
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {description && <p className="text-sm text-gray-600">{description}</p>}
        {extra}
        <Field label={required ? `${label} *` : label}>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder={placeholder} className={`${inputCls} resize-none`} autoFocus />
        </Field>
      </div>
    </Modal>
  );
}

export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = React.useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

// Download data as a CSV file (the backend export endpoint only returns JSON).
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const flat = rows.map(r => flatten(r));
  const headers = Array.from(new Set(flat.flatMap(r => Object.keys(r))));
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...flat.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function flatten(obj: any, prefix = '', out: Record<string, unknown> = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) flatten(v, key, out);
    else out[key] = Array.isArray(v) ? JSON.stringify(v) : v;
  }
  return out;
}

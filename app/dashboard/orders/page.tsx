'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, Eye, MapPin, UserPlus, CheckCircle, XCircle, Banknote, PackageCheck, AlertTriangle, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';
import {
  Badge, Card, EmptyState, LoadingBlock, Modal, InfoGrid, Section, Notice, FilterBar, ReasonModal, Field,
  selectCls, inputCls, btnPrimary, btnSecondary, btnSuccess, btnDanger, fmtDateTime, money, humanize, useDebounced,
} from '../ui';

type Kind = 'pod' | 'errand';

const POD_STATUSES = ['POD_REQUESTED', 'CONFIRMED', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'AWAITING_CUSTOMER', 'DELIVERED_PAID', 'REJECTED_RETURN', 'SETTLED', 'CANCELLED'];
const ERRAND_STATUSES = ['REQUESTED', 'SEARCHING_RIDER', 'RIDER_ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'AT_PICKUP', 'AWAITING_CONFIRMATION', 'COMPLETED', 'CANCELLED', 'FAILED'];

const POD_ASSIGNABLE = ['CONFIRMED', 'READY_FOR_DELIVERY'];
const POD_CANCELLABLE = ['POD_REQUESTED', 'CONFIRMED', 'READY_FOR_DELIVERY'];
const ERRAND_ASSIGNABLE = ['REQUESTED', 'SEARCHING_RIDER'];
const ERRAND_CANCELLABLE = ['REQUESTED', 'SEARCHING_RIDER', 'RIDER_ASSIGNED', 'ACCEPTED'];

export default function Orders() {
  const [kind, setKind] = useState<Kind>('pod');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [reasonAction, setReasonAction] = useState<null | { title: string; label: string; confirm: string; fn: (reason: string) => Promise<any> }>(null);
  const [settleTarget, setSettleTarget] = useState<any | null>(null);
  const limit = 10;

  const flash = (tone: 'green' | 'red', text: string) => { setNotice({ tone, text }); setTimeout(() => setNotice(null), 4500); };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, status };
      const res = kind === 'pod' ? await api.getPODs(params) : await api.getErrands(params);
      setItems(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setLoading(false);
    }
  }, [kind, page, status]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setPage(1); }, [kind, status]);
  useEffect(() => { setStatus(''); }, [kind]);

  const open = async (id: string) => {
    setSelected((p: any) => p ?? { loading: true });
    try {
      const res = kind === 'pod' ? await api.getPOD(id) : await api.getErrand(id);
      setSelected(res.data);
    } catch (e: any) {
      setSelected(null);
      flash('red', e.message);
    }
  };

  const run = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      flash('green', ok);
      fetchItems();
      if (selected?._id) open(selected._id);
      return true;
    } catch (e: any) {
      flash('red', e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const statuses = kind === 'pod' ? POD_STATUSES : ERRAND_STATUSES;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader icon={ShoppingBag} title="POD & Errands" subtitle="Pay-on-delivery orders and errand requests" gradient="from-fuchsia-500 to-pink-600" />

      {notice && <div className="mb-4"><Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}

      <div className="inline-flex p-1 bg-gray-200/70 rounded-xl mb-4">
        {(['pod', 'errand'] as Kind[]).map(k => (
          <button key={k} onClick={() => setKind(k)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${kind === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>
            {k === 'pod' ? 'Pay on delivery' : 'Errands'}
          </button>
        ))}
      </div>

      <FilterBar>
        <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          {statuses.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
      </FilterBar>

      {loading ? <LoadingBlock /> : items.length === 0 ? <EmptyState icon={kind === 'pod' ? ShoppingBag : ClipboardList} text={`No ${kind === 'pod' ? 'POD orders' : 'errands'} found`} /> : (
        <>
          <div className="space-y-3">
            {items.map(it => (
              <Card key={it._id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold">{it.referenceId ?? it._id.slice(-8)}</span>
                      <Badge status={it.status} />
                      {it.disputeRaised && <Badge tone="red">Disputed</Badge>}
                      <span className="text-xs text-gray-500">{fmtDateTime(it.createdAt)}</span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">
                      {kind === 'pod' ? `${it.product?.name ?? 'Product'} × ${it.product?.quantity ?? 1}` : humanize(it.errandType)}
                      {kind === 'errand' && it.description && <span className="text-gray-500 font-normal"> — {it.description}</span>}
                    </p>
                    <p className="flex items-start gap-1.5 text-gray-700"><MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" /><span className="break-words">{kind === 'pod' ? it.dropoff?.address : (it.destination?.address ?? it.pickupLocation?.address)}</span></p>
                    <p className="text-xs text-gray-500">{it.customerId?.name ?? it.customerName ?? 'Customer'} · {it.customerPhone ?? '—'} · {it.companyId?.name ?? 'No company'}</p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <div className="text-right">
                      <p className="text-base font-bold tabular-nums">{money(kind === 'pod' ? it.amountToCollect : (it.actualSpend || it.estimatedItemCost) + (it.serviceFee ?? 0))}</p>
                      <p className="text-xs text-gray-500">{humanize(it.paymentMethod)} · {humanize(it.paymentStatus)}</p>
                    </div>
                    <button onClick={() => open(it._id)} className={`${btnSecondary} !py-2`}><Eye className="w-4 h-4" /> Manage</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {selected && (
        <OrderDetail
          kind={kind}
          item={selected}
          busy={busy}
          onClose={() => setSelected(null)}
          onRun={run}
          onReason={setReasonAction}
          onSettle={setSettleTarget}
        />
      )}

      {reasonAction && (
        <ReasonModal
          title={reasonAction.title}
          label={reasonAction.label}
          confirmLabel={reasonAction.confirm}
          loading={busy}
          onClose={() => setReasonAction(null)}
          onConfirm={async (reason) => { if (await run(() => reasonAction.fn(reason), `${reasonAction.confirm} — done`)) setReasonAction(null); }}
        />
      )}

      {settleTarget && <SettleModal pod={settleTarget} busy={busy} onClose={() => setSettleTarget(null)} onSettle={async (amount, note) => { if (await run(() => api.settlePOD(settleTarget._id, amount, note), 'POD settled')) setSettleTarget(null); }} />}
    </div>
  );
}

function OrderDetail({ kind, item: it, busy, onClose, onRun, onReason, onSettle }: {
  kind: Kind; item: any; busy: boolean; onClose: () => void;
  onRun: (fn: () => Promise<any>, ok: string) => Promise<boolean>;
  onReason: (a: { title: string; label: string; confirm: string; fn: (r: string) => Promise<any> }) => void;
  onSettle: (pod: any) => void;
}) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const canAssign = it?._id && (kind === 'pod' ? POD_ASSIGNABLE : ERRAND_ASSIGNABLE).includes(it.status);

  useEffect(() => {
    if (!canAssign) return;
    api.getDriversForAssignment({ companyId: it.companyId?._id ?? it.companyId, search: debounced })
      .then(r => setDrivers(r.data ?? [])).catch(() => setDrivers([]));
  }, [canAssign, it?._id, debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!it?._id) return <Modal title="Loading…" onClose={onClose}><LoadingBlock /></Modal>;

  const ref = it.referenceId ?? it._id.slice(-8);
  const actions: React.ReactNode[] = [];
  if (kind === 'pod') {
    if (it.status === 'POD_REQUESTED') actions.push(<button key="c" disabled={busy} onClick={() => onRun(() => api.confirmPOD(it._id), 'POD confirmed')} className={btnSuccess}><CheckCircle className="w-4 h-4" /> Confirm order</button>);
    if (it.status === 'CONFIRMED') actions.push(<button key="r" disabled={busy} onClick={() => onRun(() => api.markPODReady(it._id), 'Marked ready for delivery')} className={btnPrimary}><PackageCheck className="w-4 h-4" /> Mark ready</button>);
    if (it.status === 'AWAITING_CUSTOMER' && it.inspectionAllowed) actions.push(<button key="rj" disabled={busy} onClick={() => onReason({ title: `Reject ${ref} on customer's behalf`, label: 'Rejection reason', confirm: 'Reject & return', fn: (r) => api.rejectPOD(it._id, r) })} className={btnSecondary}><XCircle className="w-4 h-4" /> Customer rejected</button>);
    if (it.status === 'DELIVERED_PAID') actions.push(<button key="s" disabled={busy} onClick={() => onSettle(it)} className={btnSuccess}><Banknote className="w-4 h-4" /> Settle to merchant</button>);
    if (POD_CANCELLABLE.includes(it.status)) actions.push(<button key="x" disabled={busy} onClick={() => onReason({ title: `Cancel ${ref}`, label: 'Cancellation reason', confirm: 'Cancel order', fn: (r) => api.cancelPOD(it._id, r) })} className={btnDanger}><XCircle className="w-4 h-4" /> Cancel</button>);
  } else {
    if (it.status === 'AWAITING_CONFIRMATION') actions.push(<button key="c" disabled={busy} onClick={() => onRun(() => api.confirmErrand(it._id), 'Errand marked complete')} className={btnSuccess}><CheckCircle className="w-4 h-4" /> Confirm completion</button>);
    if (!it.disputeRaised && !['CANCELLED'].includes(it.status)) actions.push(<button key="d" disabled={busy} onClick={() => onReason({ title: `Raise dispute on ${ref}`, label: 'Dispute details', confirm: 'Raise dispute', fn: (r) => api.disputeErrand(it._id, r) })} className={btnSecondary}><AlertTriangle className="w-4 h-4" /> Raise dispute</button>);
    if (ERRAND_CANCELLABLE.includes(it.status)) actions.push(<button key="x" disabled={busy} onClick={() => onReason({ title: `Cancel ${ref}`, label: 'Cancellation reason', confirm: 'Cancel errand', fn: (r) => api.cancelErrand(it._id, r) })} className={btnDanger}><XCircle className="w-4 h-4" /> Cancel</button>);
  }

  return (
    <Modal
      title={<span className="font-mono">{ref}</span>}
      subtitle={<span className="flex flex-wrap gap-1.5 mt-1"><Badge status={it.status} />{it.disputeRaised && <Badge tone="red">Disputed</Badge>}</span>}
      size="lg"
      onClose={onClose}
      footer={actions.length > 0 && <div className="flex flex-col sm:flex-row flex-wrap gap-2">{actions}</div>}
    >
      {canAssign && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-50 ring-1 ring-amber-600/20">
          <p className="font-semibold text-amber-900 flex items-center gap-2 mb-3"><UserPlus className="w-4 h-4" /> Assign a rider</p>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rider…" className={`${inputCls} bg-white mb-2`} />
          {drivers.length === 0 ? <p className="text-xs text-gray-600 bg-white rounded-xl px-4 py-3">No riders found.</p> : (
            <ul className="space-y-2 max-h-56 overflow-y-auto">
              {drivers.map(d => (
                <li key={d._id} className="flex items-center justify-between gap-3 px-3 py-2 bg-white ring-1 ring-gray-200 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-xs text-gray-500 truncate">{d.phone} · {humanize(d.vehicleType)} · {humanize(d.status)}</p>
                  </div>
                  <button
                    disabled={busy || d.status === 'suspended'}
                    onClick={() => onRun(() => (kind === 'pod' ? api.assignPODDriver(it._id, d._id) : api.assignErrandRider(it._id, d._id)), 'Rider assigned')}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                  >Assign</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {kind === 'pod' ? (
        <>
          <Section title="Product">
            <InfoGrid items={[
              ['Product', `${it.product?.name ?? '—'} × ${it.product?.quantity ?? 1}`],
              ['Description', it.product?.description ?? '—'],
              ['Merchant', [it.merchantName, it.merchantPhone].filter(Boolean).join(' · ') || it.merchantId?.name || '—'],
              ['Inspection allowed', it.inspectionAllowed ? `Yes (${it.returnWindowHours ?? 24}h return window)` : 'No'],
            ]} />
          </Section>
          <Section title="Money">
            <InfoGrid items={[
              ['Product amount', money(it.productAmount)],
              ['Delivery fee', money(it.deliveryFee)],
              ['Handling fee', money(it.handlingFee)],
              ['To collect', <b key="t">{money(it.amountToCollect)}</b>],
              ['Payment', `${humanize(it.paymentMethod)} · ${humanize(it.paymentStatus)}`],
              ['Collected at', fmtDateTime(it.paymentCollectedAt)],
              ['Settlement', it.settlementAmount ? `${money(it.settlementAmount)} on ${fmtDateTime(it.settledAt)}` : '—'],
              ['Return status', humanize(it.returnStatus)],
            ]} />
          </Section>
          <Section title="Route & people">
            <InfoGrid items={[
              ['Pickup', it.pickup?.address ?? '—'],
              ['Drop-off', it.dropoff?.address ?? '—'],
              ['Recipient', [it.dropoff?.recipientName, it.dropoff?.recipientPhone].filter(Boolean).join(' · ') || '—'],
              ['Customer', `${it.customerId?.name ?? it.customerName ?? '—'} · ${it.customerPhone ?? ''}`],
              ['Company', it.companyId?.name ?? '—'],
              ['Rejection', it.rejectionReason ?? '—'],
            ]} />
          </Section>
        </>
      ) : (
        <>
          <Section title="Errand">
            <InfoGrid items={[
              ['Type', humanize(it.errandType)],
              ['Description', it.description ?? '—'],
              ['Instructions', it.specialInstructions ?? '—'],
              ['Preferred time', fmtDateTime(it.preferredTime)],
              ['Pickup', it.pickupLocation?.address ?? '—'],
              ['Destination', it.destination?.address ?? '—'],
              ['Customer', `${it.customerId?.name ?? it.customerName ?? '—'} · ${it.customerPhone ?? ''}`],
              ['Company', it.companyId?.name ?? '—'],
            ]} />
          </Section>
          <Section title="Money">
            <InfoGrid items={[
              ['Estimated item cost', money(it.estimatedItemCost)],
              ['Spending limit', money(it.spendingLimit)],
              ['Advance to rider', money(it.customerAdvance)],
              ['Actual spend', money(it.actualSpend)],
              ['Balance returned', money(it.balanceReturned)],
              ['Service fee', money(it.serviceFee)],
              ['Payment', `${humanize(it.paymentMethod)} · ${humanize(it.paymentStatus)}`],
              ['Receipt / proof', (it.receiptUrl || it.completionProof) ? <span key="r" className="flex gap-2">{it.receiptUrl && <a href={it.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Receipt</a>}{it.completionProof && <a href={it.completionProof} target="_blank" rel="noreferrer" className="text-blue-600 underline">Proof photo</a>}</span> : '—'],
            ]} />
          </Section>
          {(it.disputeDetails || it.failureReason || it.cancelledBy?.reason) && (
            <Section title="Issues">
              <InfoGrid items={[
                ['Dispute', it.disputeDetails ?? '—'],
                ['Failure reason', it.failureReason ?? '—'],
                ['Cancelled', it.cancelledBy?.reason ? `${humanize(it.cancelledBy.role)}: ${it.cancelledBy.reason}` : '—'],
              ]} />
            </Section>
          )}
        </>
      )}

      <Section title="Rider">
        {it.driverId ? (
          <InfoGrid items={[
            ['Vehicle', `${humanize(it.driverId.vehicleType)} ${it.driverId.plateNumber ?? ''}`],
            ['Rider ID', <span key="i" className="font-mono text-xs">{it.driverId._id ?? it.driverId}</span>],
          ]} />
        ) : <p className="text-sm text-gray-400">Not assigned yet</p>}
      </Section>

      <Section title="Audit trail">
        {(it.auditLog ?? []).length === 0 ? <p className="text-sm text-gray-400">No events</p> : (
          <ol className="relative border-l-2 border-gray-200 ml-1.5 space-y-3">
            {[...it.auditLog].reverse().map((a: any, i: number) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white" />
                <p className="text-sm font-medium text-gray-900">{humanize(a.action)} <span className="text-xs text-gray-500 font-normal">by {humanize(a.actorRole)}</span></p>
                <p className="text-xs text-gray-500">{fmtDateTime(a.timestamp)}{a.note ? ` — ${a.note}` : ''}</p>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </Modal>
  );
}

function SettleModal({ pod, busy, onClose, onSettle }: { pod: any; busy: boolean; onClose: () => void; onSettle: (amount?: number, note?: string) => void }) {
  const [amount, setAmount] = useState(String(pod.productAmount ?? ''));
  const [note, setNote] = useState('');
  return (
    <Modal
      title="Settle POD to merchant"
      size="sm"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className={`${btnSecondary} flex-1`}>Cancel</button>
          <button disabled={busy} onClick={() => onSettle(amount ? Number(amount) : undefined, note || undefined)} className={`${btnSuccess} flex-1`}>{busy ? 'Working…' : 'Mark settled'}</button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Records that the collected cash has been paid out. This does not move money — pay the merchant first.</p>
        <Field label="Settlement amount" hint={`Product amount is ${money(pod.productAmount)}`}>
          <input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Note"><input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Bank transfer ref 12345" className={inputCls} /></Field>
      </div>
    </Modal>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Package, MapPin, Eye, CheckCircle, XCircle, Download, UserPlus, Trash2, Handshake, Phone, MessageSquare, PhoneCall, Star, AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import DeleteModal from '../DeleteModal';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';
import {
  Badge, Card, EmptyState, LoadingBlock, Modal, InfoGrid, Section, Notice, ReasonModal, Tabs,
  FilterBar, selectCls, inputCls, btnSecondary, btnSuccess, btnDanger,
  fmtDateTime, fmtDate, money, humanize, downloadCsv, useDebounced,
} from '../ui';

// Statuses the Delivery model actually stores.
const STATUSES = ['created', 'assigned', 'picked_up', 'delivered', 'completed', 'cancelled', 'failed', 'rescue_requested'];
// Statuses an admin can force through PUT /admin/deliveries/:id/status that the model also accepts.
const ADMIN_SETTABLE = ['created', 'picked_up', 'delivered', 'cancelled'];

const DRIVER_STATUS: Record<string, { label: string; tone: string }> = {
  available: { label: 'Available', tone: 'green' },
  online: { label: 'Online (busy)', tone: 'blue' },
  busy: { label: 'On a delivery', tone: 'orange' },
  offline: { label: 'Offline', tone: 'gray' },
  suspended: { label: 'Suspended', tone: 'red' },
};

const customerName = (d: any) => d.customerId?.name ?? d.customerName ?? '—';
const customerPhone = (d: any) => d.customerId?.phone ?? d.customerPhone;
const hasDriver = (d: any) => d.driverId !== null && d.driverId !== undefined;
const driverName = (d: any) => d.driverId?.userId?.name ?? d.driverDetails?.name ?? (hasDriver(d) ? 'Assigned' : 'Unassigned');
const refOf = (d: any) => d.referenceId ?? d._id?.slice(-8);
const isClosed = (d: any) => ['delivered', 'completed', 'cancelled', 'failed'].includes(d.status);

interface DeliveriesProps {
  initialDeliveryId?: string | null;
  onConsumeInitialDeliveryId?: () => void;
}

export default function Deliveries({ initialDeliveryId, onConsumeInitialDeliveryId }: DeliveriesProps = {}) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ delivery: any; status: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const flash = (tone: 'green' | 'red', text: string) => { setNotice({ tone, text }); setTimeout(() => setNotice(null), 4000); };

  useEffect(() => { api.getCompanies({ limit: 100 }).then(r => setCompanies(r.data ?? [])).catch(() => {}); }, []);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDeliveries({
        page, limit, status, source, companyId, startDate,
        endDate: endDate ? `${endDate}T23:59:59` : '',
      });
      setDeliveries(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, source, companyId, startDate, endDate]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);
  useEffect(() => { setPage(1); }, [status, source, companyId, startDate, endDate]);

  const openDetails = useCallback(async (id: string) => {
    setSelected((prev: any) => prev ?? { loading: true });
    try {
      const res = await api.getDeliveryById(id);
      setSelected(res.data);
    } catch (e: any) {
      setSelected(null);
      flash('red', e.message);
    }
  }, []);

  useEffect(() => {
    if (initialDeliveryId) {
      openDetails(initialDeliveryId);
      onConsumeInitialDeliveryId?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDeliveryId]);

  const run = async (fn: () => Promise<any>, ok: string, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      flash('green', ok);
      after?.();
      fetchDeliveries();
      if (selected?.delivery?._id) openDetails(selected.delivery._id);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.exportData('deliveries', { startDate, endDate });
      downloadCsv(`deliveries-${new Date().toISOString().slice(0, 10)}.csv`, res.data?.data ?? []);
    } catch (e: any) { flash('red', e.message); } finally { setExporting(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        icon={Package}
        title="Deliveries"
        subtitle="Track, dispatch and resolve delivery orders"
        gradient="from-blue-500 to-blue-600"
        action={<button onClick={handleExport} disabled={exporting} className={btnSecondary}><Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export CSV'}</button>}
      />

      {notice && <div className="mb-4"><Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}

      <Tabs
        tabs={[{ id: '', label: 'All' }, { id: 'created', label: 'Unassigned' }, ...STATUSES.filter(s => s !== 'created').map(s => ({ id: s, label: humanize(s) }))]}
        value={status}
        onChange={setStatus}
      />

      <FilterBar>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 w-full">
          <select value={source} onChange={(e) => setSource(e.target.value)} className={selectCls}>
            <option value="">All sources</option>
            <option value="app">Riderr app</option>
            <option value="partner_api">Partner API</option>
          </select>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={selectCls}>
            <option value="">All companies</option>
            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-gray-500">From
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={selectCls} />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-500">To
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={selectCls} />
          </label>
        </div>
      </FilterBar>

      {loading ? <LoadingBlock /> : deliveries.length === 0 ? <EmptyState icon={Package} text="No deliveries match these filters" /> : (
        <>
          <div className="space-y-3">
            {deliveries.map((d) => (
              <Card key={d._id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-blue-50 p-2 rounded-xl flex-shrink-0"><Package className="w-5 h-5 text-blue-600" /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 font-mono text-sm">{refOf(d)}</h3>
                        {d.source === 'partner_api' && <Badge tone="cyan"><Handshake className="w-3 h-3" /> {d.partnerId?.businessName ?? 'Partner'}</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">{fmtDateTime(d.createdAt)}{d.companyId?.name ? ` · ${d.companyId.name}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-shrink-0">
                    <Badge status={d.status} />
                    <span className="text-base font-bold text-gray-900 tabular-nums">{money(d.fare?.totalFare, d.fare?.currency)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                      <p className="text-gray-900 break-words"><span className="text-xs text-gray-500 block">Pickup</span>{d.pickup?.address ?? '—'}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-500 mt-1 flex-shrink-0" />
                      <p className="text-gray-900 break-words"><span className="text-xs text-gray-500 block">Drop-off</span>{d.dropoff?.address ?? '—'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><p className="text-xs text-gray-500">Customer</p><p className="font-medium text-gray-900 truncate">{customerName(d)}</p></div>
                    <div><p className="text-xs text-gray-500">Rider</p><p className={`font-medium truncate ${hasDriver(d) ? 'text-gray-900' : 'text-amber-600'}`}>{driverName(d)}</p></div>
                    <div><p className="text-xs text-gray-500">Item</p><p className="font-medium text-gray-900 truncate">{humanize(d.itemDetails?.type)}</p></div>
                    <div><p className="text-xs text-gray-500">Payment</p><p className="font-medium text-gray-900 truncate">{humanize(d.payment?.method)} · {humanize(d.payment?.status)}</p></div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-gray-100">
                  <button onClick={() => setDeleteTarget(d)} className={`${btnSecondary} !py-2 !text-red-600`}><Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span></button>
                  {!hasDriver(d) && !isClosed(d) && (
                    <button onClick={() => openDetails(d._id)} className={`${btnSecondary} !py-2 !text-amber-700`}><UserPlus className="w-4 h-4" /> Assign</button>
                  )}
                  <button onClick={() => openDetails(d._id)} className={`${btnSecondary} !py-2 !text-blue-700`}><Eye className="w-4 h-4" /> Details</button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {selected && (
        <DeliveryDetail
          data={selected}
          busy={busy}
          onClose={() => setSelected(null)}
          onAssign={(deliveryId, driverId) => run(() => api.assignDriver(deliveryId, driverId), 'Rider assigned')}
          onStatus={(delivery, s) => setStatusTarget({ delivery, status: s })}
        />
      )}

      {statusTarget && (
        <ReasonModal
          title={`Mark as ${humanize(statusTarget.status)}`}
          description={<>Override <b>{refOf(statusTarget.delivery)}</b> from <b>{humanize(statusTarget.delivery.status)}</b> to <b>{humanize(statusTarget.status)}</b>. The customer and rider are notified.</>}
          confirmLabel="Update status"
          tone={statusTarget.status === 'cancelled' ? 'danger' : 'primary'}
          required={statusTarget.status === 'cancelled'}
          placeholder={statusTarget.status === 'cancelled' ? 'Why is this order being cancelled?' : 'Optional note'}
          loading={busy}
          onClose={() => setStatusTarget(null)}
          onConfirm={(reason) => run(
            () => api.updateDeliveryStatus(statusTarget.delivery._id, statusTarget.status, reason || 'Admin override'),
            `Delivery marked ${humanize(statusTarget.status)}`,
            () => setStatusTarget(null),
          )}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          title="Delete delivery"
          name={refOf(deleteTarget)}
          softLabel="Cancel & hide"
          softDesc="Sets status to cancelled and hides it. Customer and rider are notified."
          hardDesc="Removes the delivery record. Customer and rider are still notified."
          requireReason
          loading={busy}
          onClose={() => setDeleteTarget(null)}
          onConfirm={(permanent, reason) => run(() => api.deleteDelivery(deleteTarget._id, permanent, reason), permanent ? 'Delivery deleted' : 'Delivery cancelled', () => setDeleteTarget(null))}
        />
      )}
    </div>
  );
}

function DeliveryDetail({ data, busy, onClose, onAssign, onStatus }: {
  data: any; busy: boolean; onClose: () => void; onAssign: (deliveryId: string, driverId: string) => void; onStatus: (d: any, status: string) => void;
}) {
  const d = data.delivery;
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverSearch, setDriverSearch] = useState('');
  const debounced = useDebounced(driverSearch, 300);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const canAssign = d && !hasDriver(d) && !isClosed(d);

  useEffect(() => {
    if (!canAssign) return;
    setLoadingDrivers(true);
    api.getDriversForAssignment({ companyId: d.companyId?._id ?? d.companyId, search: debounced })
      .then(r => setDrivers(r.data ?? []))
      .catch(() => setDrivers([]))
      .finally(() => setLoadingDrivers(false));
  }, [canAssign, d?._id, debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return <Modal title="Loading…" onClose={onClose} size="lg"><LoadingBlock /></Modal>;

  const p = data.payment;
  const chat: any[] = data.chatMessages ?? [];
  const calls: any[] = data.voiceCalls ?? [];
  const rejected: any[] = d.rejectedByDrivers ?? [];
  const cur = d.fare?.currency;

  const timeline: [string, any][] = ([
    ['Created', d.createdAt], ['Assigned', d.assignedAt], ['Picked up', d.pickedUpAt ?? d.pickupTime],
    ['Delivered', d.deliveredAt ?? d.deliveryTime], ['Completed', d.completedAt], ['Cancelled', d.cancelledAt],
  ] as [string, any][]).filter(([, v]) => v);

  return (
    <Modal
      title={<span className="font-mono">{refOf(d)}</span>}
      subtitle={<span className="flex flex-wrap gap-1.5 mt-1"><Badge status={d.status} />{d.source === 'partner_api' && <Badge tone="cyan">Partner API</Badge>}{d.isDeleted && <Badge tone="red">Deleted</Badge>}</span>}
      size="xl"
      onClose={onClose}
      footer={!isClosed(d) && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center mr-auto w-full sm:w-auto">Force status:</span>
          {ADMIN_SETTABLE.filter(s => s !== d.status && s !== 'cancelled').map(s => (
            <button key={s} onClick={() => onStatus(d, s)} disabled={busy} className={`${s === 'delivered' ? btnSuccess : btnSecondary} !py-2`}>
              {s === 'delivered' && <CheckCircle className="w-4 h-4" />} {humanize(s)}
            </button>
          ))}
          <button onClick={() => onStatus(d, 'cancelled')} disabled={busy} className={`${btnDanger} !py-2`}><XCircle className="w-4 h-4" /> Cancel order</button>
        </div>
      )}
    >
      {canAssign && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-50 ring-1 ring-amber-600/20">
          <p className="font-semibold text-amber-900 flex items-center gap-2 mb-3"><UserPlus className="w-4 h-4" /> No rider yet — assign one</p>
          <input value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} placeholder="Search rider by name, phone or plate…" className={`${inputCls} bg-white mb-2`} />
          {loadingDrivers ? <div className="py-4 text-center text-sm text-gray-500">Loading riders…</div> : drivers.length === 0 ? (
            <p className="text-xs text-gray-600 bg-white rounded-xl px-4 py-3">No riders found{d.companyId ? ' for this company' : ''}. Try a different search.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {drivers.map((r) => {
                const st = DRIVER_STATUS[r.status] ?? { label: humanize(r.status), tone: 'gray' };
                const blocked = r.status === 'suspended' || r.hasActiveDelivery;
                return (
                  <li key={r._id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white ring-1 ring-gray-200 rounded-xl">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{r.name ?? 'Unnamed rider'}</p>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{r.phone} · {humanize(r.vehicleType)} · {r.plateNumber ?? '—'} · {r.company ?? 'Independent'}</p>
                    </div>
                    <button
                      onClick={() => onAssign(d._id, r._id)}
                      disabled={busy || blocked}
                      title={blocked ? 'Rider is suspended or already on a delivery' : undefined}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold disabled:opacity-40 flex-shrink-0"
                    >Assign</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <Section title="Route">
        <div className="space-y-3 text-sm">
          {(['pickup', 'dropoff'] as const).map(k => (
            <div key={k} className="flex items-start gap-3">
              {k === 'pickup' ? <span className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" /> : <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{k === 'pickup' ? 'Pickup' : 'Drop-off'}</p>
                <p className="font-medium text-gray-900 break-words">{d[k]?.address ?? '—'}</p>
                <p className="text-xs text-gray-500">
                  {[d[k]?.name, d[k]?.phone].filter(Boolean).join(' · ')}
                  {d[k]?.instructions && <span className="block italic">“{d[k].instructions}”</span>}
                </p>
              </div>
              {d[k]?.lat != null && (
                <a className="ml-auto text-xs text-blue-600 hover:underline flex-shrink-0" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${d[k].lat},${d[k].lng}`}>Map</a>
              )}
            </div>
          ))}
          <p className="text-xs text-gray-500">Distance {d.estimatedDistanceKm ?? '—'} km · ETA {d.estimatedDurationMin ?? '—'} min</p>
        </div>
      </Section>

      <Section title="People">
        <InfoGrid items={[
          ['Customer', <span key="c">{customerName(d)} {customerPhone(d) && <a href={`tel:${customerPhone(d)}`} className="text-blue-600 ml-1 inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{customerPhone(d)}</a>}</span>],
          ['Recipient', [d.recipientName, d.recipientPhone].filter(Boolean).join(' · ') || '—'],
          ['Rider', <span key="r">{driverName(d)} {d.driverId?.userId?.phone && <a href={`tel:${d.driverId.userId.phone}`} className="text-blue-600 ml-1 inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{d.driverId.userId.phone}</a>}</span>],
          ['Rider vehicle', d.driverId ? `${humanize(d.driverId.vehicleType)} ${d.driverId.plateNumber ?? ''}` : '—'],
          ['Company', d.companyId?.name ?? d.companyDetails?.name ?? '—'],
          ['Partner', d.partnerId?.businessName ? `${d.partnerId.businessName}${d.partnerOrderRef ? ` (ref ${d.partnerOrderRef})` : ''}` : '—'],
        ]} />
      </Section>

      <Section title="Item & fare">
        <InfoGrid items={[
          ['Item type', humanize(d.itemDetails?.type)],
          ['Description', d.itemDetails?.description ?? '—'],
          ['Weight', d.itemDetails?.weight != null ? `${d.itemDetails.weight} kg` : '—'],
          ['Declared value', money(d.itemDetails?.value, cur)],
          ['Base fare', money(d.fare?.baseFare, cur)],
          ['Distance fare', money(d.fare?.distanceFare, cur)],
          ['Total fare', <b key="t">{money(d.fare?.totalFare, cur)}</b>],
          ['Tip', d.tip?.amount ? money(d.tip.amount, cur) : '—'],
        ]} />
      </Section>

      <Section title="Payment">
        <InfoGrid items={[
          ['Method', humanize(d.payment?.method ?? p?.paymentMethod)],
          ['Status on order', humanize(d.payment?.status)],
          ['Payment record', p ? <Badge key="s" status={p.status} /> : 'None'],
          ['Amount', p ? money(p.amount) : '—'],
          ['Platform fee', p ? money(p.platformFee) : '—'],
          ['Company share', p ? money(p.companyAmount) : '—'],
          ['Reference', <span key="r" className="font-mono text-xs break-all">{p?.paystackReference ?? d.payment?.reference ?? '—'}</span>],
          ['Paid at', fmtDateTime(p?.paidAt ?? d.payment?.paidAt)],
        ]} />
      </Section>

      <Section title="Timeline">
        <ol className="relative border-l-2 border-gray-200 ml-1.5 space-y-3">
          {timeline.map(([label, at]) => (
            <li key={label} className="ml-4">
              <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white" />
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{fmtDateTime(at)}</p>
            </li>
          ))}
        </ol>
        {(d.cancelledBy?.reason || d.cancellationReason || d.adminUpdateReason) && (
          <p className="text-sm text-gray-600 mt-3 flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            {d.cancelledBy?.reason ?? d.cancellationReason ?? d.adminUpdateReason}
            {d.cancelledBy?.role && <span className="text-gray-400"> — {humanize(d.cancelledBy.role)}</span>}
          </p>
        )}
      </Section>

      {(d.rating || d.review) && (
        <Section title="Customer rating">
          <p className="flex items-center gap-1 text-sm font-semibold"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {d.rating ?? '—'} / 5</p>
          {d.review && <p className="text-sm text-gray-600 mt-1 italic">“{d.review}”</p>}
        </Section>
      )}

      {rejected.length > 0 && (
        <Section title={`Declined by riders (${rejected.length})`}>
          <ul className="text-sm divide-y divide-gray-100 -my-1">
            {rejected.map((r, i) => (
              <li key={i} className="py-1.5 flex justify-between gap-2">
                <span className="font-mono text-xs text-gray-600">{String(r.driverId?._id ?? r.driverId).slice(-8)}</span>
                <span className="text-gray-600 truncate">{r.reason ?? 'No reason'}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{fmtDate(r.rejectedAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={`In-app chat (${chat.length})`}>
        {chat.length === 0 ? <p className="text-sm text-gray-400">No messages between customer and rider</p> : (
          <ul className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded-xl p-3">
            {chat.map((m: any) => (
              <li key={m._id} className="text-sm">
                <span className="font-semibold text-gray-900">{m.senderId?.name ?? 'User'}:</span>{' '}
                <span className="text-gray-700">{m.message ?? m.content ?? m.text}</span>
                <span className="text-[11px] text-gray-400 ml-1">{fmtDateTime(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Voice calls (${calls.length})`}>
        {calls.length === 0 ? <p className="text-sm text-gray-400">No calls</p> : (
          <ul className="text-sm divide-y divide-gray-100 -my-1">
            {calls.map((c: any) => (
              <li key={c._id} className="py-1.5 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-gray-400" />
                <span className="flex-1">{fmtDateTime(c.createdAt ?? c.startedAt)}</span>
                <span className="text-gray-600">{c.duration ? `${Math.round(c.duration)}s` : '—'}</span>
                <Badge status={c.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-[11px] text-gray-400 mt-5 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> ID {d._id}</p>
    </Modal>
  );
}

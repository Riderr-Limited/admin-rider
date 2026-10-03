'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Car, MapPin, Eye, UserPlus, Phone, Star } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';
import {
  Badge, Card, EmptyState, LoadingBlock, Modal, InfoGrid, Section, Notice, Tabs, FilterBar,
  selectCls, inputCls, btnSecondary, fmtDateTime, money, humanize, useDebounced,
} from '../ui';

const STATUSES = ['pending', 'searching', 'assigned', 'accepted', 'arrived', 'picked_up', 'ongoing', 'completed', 'cancelled'];
const ASSIGNABLE = ['pending', 'searching'];

const fareOf = (r: any) => r.actualFare ?? r.estimatedFare;

export default function Rides() {
  const [rides, setRides] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const limit = 15;

  const flash = (tone: 'green' | 'red', text: string) => { setNotice({ tone, text }); setTimeout(() => setNotice(null), 4000); };

  useEffect(() => { api.getCompanies({ limit: 100 }).then(r => setCompanies(r.data ?? [])).catch(() => {}); }, []);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getRides({ page, limit, status, companyId });
      setRides(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? res.pagination?.totalPages ?? 1);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, companyId]);

  useEffect(() => { fetchRides(); }, [fetchRides]);
  useEffect(() => { setPage(1); }, [status, companyId]);

  const openRide = async (id: string) => {
    setSelected((p: any) => p ?? { loading: true });
    try {
      const res = await api.getRideById(id);
      setSelected(res.data?.ride ?? res.data);
    } catch (e: any) {
      setSelected(null);
      flash('red', e.message);
    }
  };

  const assign = async (rideId: string, driverId: string) => {
    setBusy(true);
    try {
      await api.assignRide(rideId, driverId);
      flash('green', 'Driver assigned to ride');
      fetchRides();
      openRide(rideId);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader icon={Car} title="Rides" subtitle="Passenger ride requests across all companies" gradient="from-sky-500 to-blue-600" />

      {notice && <div className="mb-4"><Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}

      <Tabs tabs={[{ id: '', label: 'All' }, ...STATUSES.map(s => ({ id: s, label: humanize(s) }))]} value={status} onChange={setStatus} />

      <FilterBar>
        <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={selectCls}>
          <option value="">All companies</option>
          {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </FilterBar>

      {loading ? <LoadingBlock /> : rides.length === 0 ? <EmptyState icon={Car} text="No rides found" /> : (
        <>
          <div className="space-y-3">
            {rides.map(r => (
              <Card key={r._id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-gray-900">{r.referenceId ?? r._id.slice(-8)}</span>
                      <Badge status={r.status} />
                      <span className="text-xs text-gray-500">{fmtDateTime(r.createdAt ?? r.requestedAt)}</span>
                    </div>
                    <p className="flex items-start gap-2 text-gray-900"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" /><span className="break-words">{r.pickup?.address ?? '—'}</span></p>
                    <p className="flex items-start gap-2 text-gray-900"><MapPin className="w-3.5 h-3.5 text-red-500 mt-1 flex-shrink-0" /><span className="break-words">{r.dropoff?.address ?? '—'}</span></p>
                    <p className="text-xs text-gray-500">
                      {r.customerId?.name ?? r.customerName ?? 'Customer'} · {r.driverId?.userId?.name ? `Driver: ${r.driverId.userId.name}` : 'No driver'} · {r.companyId?.name ?? 'No company'} · <span className="capitalize">{r.vehicleType}</span>
                    </p>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <span className="text-base font-bold tabular-nums">{money(fareOf(r))}</span>
                    <button onClick={() => openRide(r._id)} className={`${btnSecondary} !py-2`}>
                      {ASSIGNABLE.includes(r.status) && !r.driverId ? <><UserPlus className="w-4 h-4" /> Assign</> : <><Eye className="w-4 h-4" /> Details</>}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {selected && <RideDetail ride={selected} busy={busy} onClose={() => setSelected(null)} onAssign={assign} />}
    </div>
  );
}

function RideDetail({ ride: r, busy, onClose, onAssign }: { ride: any; busy: boolean; onClose: () => void; onAssign: (rideId: string, driverId: string) => void }) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const canAssign = r?._id && ASSIGNABLE.includes(r.status);

  useEffect(() => {
    if (!canAssign) return;
    api.getDriversForAssignment({ companyId: r.companyId?._id ?? r.companyId, search: debounced })
      .then(res => setDrivers((res.data ?? []).filter((d: any) => d.vehicleType === r.vehicleType || !r.vehicleType)))
      .catch(() => setDrivers([]));
  }, [canAssign, r?._id, debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r?._id) return <Modal title="Loading…" onClose={onClose}><LoadingBlock /></Modal>;

  return (
    <Modal title={<span className="font-mono">{r.referenceId ?? r._id.slice(-8)}</span>} subtitle={<Badge status={r.status} />} size="lg" onClose={onClose}>
      {canAssign && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-50 ring-1 ring-amber-600/20">
          <p className="font-semibold text-amber-900 flex items-center gap-2 mb-3"><UserPlus className="w-4 h-4" /> Assign a {r.vehicleType ?? ''} driver</p>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search driver…" className={`${inputCls} bg-white mb-2`} />
          {drivers.length === 0 ? <p className="text-xs text-gray-600 bg-white rounded-xl px-4 py-3">No matching drivers.</p> : (
            <ul className="space-y-2 max-h-56 overflow-y-auto">
              {drivers.map(d => (
                <li key={d._id} className="flex items-center justify-between gap-3 px-3 py-2 bg-white ring-1 ring-gray-200 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-xs text-gray-500 truncate">{d.phone} · {d.plateNumber ?? '—'} · {humanize(d.status)}</p>
                  </div>
                  <button onClick={() => onAssign(r._id, d._id)} disabled={busy || d.status === 'suspended' || d.hasActiveDelivery} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40">Assign</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Section title="Trip">
        <InfoGrid items={[
          ['Pickup', r.pickup?.address],
          ['Drop-off', r.dropoff?.address],
          ['Vehicle', humanize(r.vehicleType)],
          ['Distance', r.actualDistance ?? r.estimatedDistance ? `${r.actualDistance ?? r.estimatedDistance} km` : '—'],
          ['Duration', r.actualDuration ?? r.estimatedDuration ? `${r.actualDuration ?? r.estimatedDuration} min` : '—'],
          ['Notes', r.notes ?? '—'],
        ]} />
      </Section>
      <Section title="People">
        <InfoGrid items={[
          ['Customer', <span key="c">{r.customerId?.name ?? r.customerName ?? '—'} {(r.customerId?.phone ?? r.customerPhone) && <a className="text-blue-600 inline-flex items-center gap-0.5 ml-1" href={`tel:${r.customerId?.phone ?? r.customerPhone}`}><Phone className="w-3 h-3" />{r.customerId?.phone ?? r.customerPhone}</a>}</span>],
          ['Driver', r.driverId?.userId?.name ? `${r.driverId.userId.name} · ${r.driverId.userId.phone ?? ''}` : '—'],
          ['Company', r.companyId?.name ?? '—'],
        ]} />
      </Section>
      <Section title="Fare & payment">
        <InfoGrid items={[
          ['Estimated fare', money(r.estimatedFare)],
          ['Actual fare', r.actualFare != null ? money(r.actualFare) : '—'],
          ['Base / distance / time', `${money(r.baseFare)} / ${money(r.distanceFare)} / ${money(r.timeFare)}`],
          ['Payment', `${humanize(r.payment?.method)} · ${humanize(r.payment?.status)}`],
          ['Cancelled by', r.cancellation?.cancelledBy ? `${humanize(r.cancellation.cancelledBy)}: ${r.cancellation.reason ?? ''}` : '—'],
          ['Cancellation fee', r.cancellation?.cancellationFee ? money(r.cancellation.cancellationFee) : '—'],
        ]} />
      </Section>
      <Section title="Timeline">
        <InfoGrid items={([
          ['Requested', r.requestedAt], ['Assigned', r.assignedAt], ['Accepted', r.acceptedAt], ['Arrived', r.arrivedAt],
          ['Picked up', r.pickedUpAt], ['Completed', r.completedAt], ['Cancelled', r.cancelledAt],
        ] as [string, any][]).filter(([, v]) => v).map(([k, v]) => [k, fmtDateTime(v)] as [string, string])} />
      </Section>
      {r.rating?.byCustomer?.score && (
        <Section title="Rating">
          <p className="flex items-center gap-1 text-sm font-semibold"><Star className="w-4 h-4 fill-amber-400 text-amber-400" />{r.rating.byCustomer.score}/5</p>
          {r.rating.byCustomer.feedback && <p className="text-sm text-gray-600 italic mt-1">“{r.rating.byCustomer.feedback}”</p>}
        </Section>
      )}
    </Modal>
  );
}

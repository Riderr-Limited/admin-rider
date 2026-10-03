'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Bike, Star, CheckCircle, XCircle, Trash2, Eye, Pencil, Power, Download, FileText, ExternalLink, Phone, Building2,
} from 'lucide-react';
import { api } from '@/lib/api';
import DeleteModal from '../DeleteModal';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';
import {
  Badge, Card, EmptyState, LoadingBlock, Modal, InfoGrid, Section, MiniStat, Field, Notice, ReasonModal,
  FilterBar, SearchInput, selectCls, inputCls, btnPrimary, btnSecondary, btnSuccess, iconBtn,
  fmtDate, fmtDateTime, money, humanize, initial, useDebounced, downloadCsv,
} from '../ui';

// GET /admin/drivers populates the linked user account under `userId`.
const riderName = (d: any): string => d.userId?.name ?? d.name ?? 'Unnamed rider';
const riderPhone = (d: any): string => d.userId?.phone ?? d.phone ?? '—';
const ratingOf = (d: any): number => Number(d.rating?.average ?? d.rating ?? 0);

// The approve endpoint writes isVerified/verificationStatus, while matching reads approvalStatus —
// show whichever signal exists so admins see the real state.
function approvalOf(d: any): 'approved' | 'rejected' | 'pending' {
  if (d.verificationStatus === 'rejected' || d.approvalStatus === 'rejected') return 'rejected';
  if (d.isVerified || d.verificationStatus === 'approved' || d.approvalStatus === 'approved') return 'approved';
  return 'pending';
}

function presence(d: any) {
  if (!d.isActive) return { label: 'Deactivated', tone: 'red' };
  if (d.isSuspended) return { label: 'Suspended', tone: 'red' };
  if (d.currentDeliveryId) return { label: 'On delivery', tone: 'orange' };
  if (d.isOnline && d.isAvailable) return { label: 'Available', tone: 'green' };
  if (d.isOnline) return { label: 'Online', tone: 'blue' };
  return { label: 'Offline', tone: 'gray' };
}

export default function Riders() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [vehicleType, setVehicleType] = useState('');
  const [isOnline, setIsOnline] = useState('');
  const [isActive, setIsActive] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);

  const flash = (tone: 'green' | 'red', text: string) => { setNotice({ tone, text }); setTimeout(() => setNotice(null), 4000); };

  useEffect(() => {
    api.getCompanies({ limit: 100 }).then(res => setCompanies(res.data ?? [])).catch(() => {});
  }, []);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDrivers({ page, limit, search: debouncedSearch, vehicleType, isOnline, isActive, companyId });
      setDrivers(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, vehicleType, isOnline, isActive, companyId]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);
  useEffect(() => { setPage(1); }, [debouncedSearch, vehicleType, isOnline, isActive, companyId]);

  const run = async (fn: () => Promise<any>, ok: string, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      flash('green', ok);
      after?.();
      fetchDrivers();
      if (detail?.driver?._id) openDetail(detail.driver._id);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setBusy(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetail((prev: any) => prev ?? { loading: true });
    try {
      const res = await api.getDriverById(id);
      setDetail(res.data);
    } catch (e: any) {
      setDetail(null);
      flash('red', e.message);
    }
  };

  const approve = (d: any) => run(() => api.approveDriver(d._id, true), `${riderName(d)} approved`);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.exportData('drivers');
      downloadCsv(`riders-${new Date().toISOString().slice(0, 10)}.csv`, res.data?.data ?? []);
    } catch (e: any) { flash('red', e.message); } finally { setExporting(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        icon={Bike}
        title="Riders"
        subtitle="Approve, manage and monitor delivery riders"
        gradient="from-violet-500 to-purple-700"
        action={<button onClick={handleExport} disabled={exporting} className={btnSecondary}><Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export CSV'}</button>}
      />

      {notice && <div className="mb-4"><Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, phone or plate…" />
        <div className="grid grid-cols-2 sm:flex gap-3">
          <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={selectCls}>
            <option value="">All vehicles</option>
            {['bike', 'car', 'van', 'truck'].map(v => <option key={v} value={v}>{humanize(v)}</option>)}
          </select>
          <select value={isOnline} onChange={(e) => setIsOnline(e.target.value)} className={selectCls}>
            <option value="">Online & offline</option>
            <option value="true">Online</option>
            <option value="false">Offline</option>
          </select>
          <select value={isActive} onChange={(e) => setIsActive(e.target.value)} className={selectCls}>
            <option value="">Active & inactive</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={selectCls}>
            <option value="">All companies</option>
            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </FilterBar>

      {loading ? <LoadingBlock /> : drivers.length === 0 ? <EmptyState icon={Bike} text="No riders match these filters" /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {drivers.map((d) => {
              const pres = presence(d);
              const appr = approvalOf(d);
              const s = d.stats ?? {};
              return (
                <Card key={d._id} className="p-4 sm:p-5 flex flex-col">
                  <div className="flex items-start gap-3">
                    <button onClick={() => openDetail(d._id)} className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {initial(riderName(d))}
                    </button>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => openDetail(d._id)} className="font-semibold text-gray-900 truncate block max-w-full text-left hover:text-blue-700">{riderName(d)}</button>
                      <p className="text-xs text-gray-500 truncate">{riderPhone(d)} · {d.companyId?.name ?? 'Independent'}</p>
                    </div>
                    <Badge tone={pres.tone}>{pres.label}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-gray-600">
                    <span className="capitalize">{d.vehicleType ?? '—'}{d.plateNumber ? ` · ${d.plateNumber}` : ''}</span>
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{ratingOf(d).toFixed(1)} <span className="text-gray-400">({d.rating?.totalRatings ?? 0})</span></span>
                    <Badge status={appr} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <MiniStat label="Jobs" value={s.totalDeliveries ?? 0} />
                    <MiniStat label="Done" value={s.completedDeliveries ?? 0} />
                    <MiniStat label="Earned" value={money(s.totalEarnings)} />
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    {appr !== 'approved' ? (
                      <>
                        <button onClick={() => approve(d)} disabled={busy} className={`${btnSuccess} flex-1 !py-2`}><CheckCircle className="w-4 h-4" /> Approve</button>
                        {appr !== 'rejected' && <button onClick={() => setRejectTarget(d)} disabled={busy} className={`${btnSecondary} flex-1 !py-2 !text-red-600`}><XCircle className="w-4 h-4" /> Reject</button>}
                      </>
                    ) : <span className="flex-1" />}
                    <button onClick={() => openDetail(d._id)} className={iconBtn} title="Details"><Eye className="w-4 h-4 text-gray-600" /></button>
                    <button onClick={() => setEditTarget(d)} className={iconBtn} title="Edit"><Pencil className="w-4 h-4 text-blue-600" /></button>
                    <button
                      onClick={() => d.isActive ? setDeactivateTarget(d) : run(() => api.updateDriver(d._id, { isActive: true }), `${riderName(d)} reactivated`)}
                      className={iconBtn}
                      title={d.isActive ? 'Deactivate' : 'Reactivate'}
                    >
                      <Power className={`w-4 h-4 ${d.isActive ? 'text-orange-600' : 'text-emerald-600'}`} />
                    </button>
                    <button onClick={() => setDeleteTarget(d)} className={iconBtn} title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </Card>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {detail && (
        <RiderDetail
          data={detail}
          busy={busy}
          onClose={() => setDetail(null)}
          onEdit={(d) => setEditTarget(d)}
          onApprove={(d) => approve(d)}
          onReject={(d) => setRejectTarget(d)}
        />
      )}

      {editTarget && (
        <EditRiderModal
          driver={editTarget}
          companies={companies}
          busy={busy}
          onClose={() => setEditTarget(null)}
          onSave={(body) => run(() => api.updateDriver(editTarget._id, body), 'Rider updated', () => setEditTarget(null))}
        />
      )}

      {rejectTarget && (
        <ReasonModal
          title={`Reject ${riderName(rejectTarget)}`}
          description="The rider is deactivated and notified with your reason."
          placeholder="e.g. Driver's licence photo is unreadable"
          confirmLabel="Reject rider"
          loading={busy}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => run(() => api.approveDriver(rejectTarget._id, false, reason), `${riderName(rejectTarget)} rejected`, () => setRejectTarget(null))}
        />
      )}

      {deactivateTarget && (
        <ReasonModal
          title={`Deactivate ${riderName(deactivateTarget)}`}
          description="Takes the rider offline and stops them receiving deliveries. Their account stays intact."
          label="Note for records"
          required={false}
          confirmLabel="Deactivate"
          loading={busy}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={(note) => run(
            () => api.updateDriver(deactivateTarget._id, { isActive: false, ...(note ? { notes: note } : {}) }),
            `${riderName(deactivateTarget)} deactivated`,
            () => setDeactivateTarget(null),
          )}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          title="Delete rider"
          name={riderName(deleteTarget)}
          softLabel="Deactivate"
          softDesc="Rider goes offline and can't take jobs. Linked user account is marked deleted."
          hardDesc="Removes the rider profile permanently. Linked user is marked deleted."
          loading={busy}
          onClose={() => setDeleteTarget(null)}
          onConfirm={(permanent) => run(() => api.deleteDriver(deleteTarget._id, permanent), permanent ? 'Rider deleted' : 'Rider deactivated', () => { setDeleteTarget(null); setDetail(null); })}
        />
      )}
    </div>
  );
}

function RiderDetail({ data, busy, onClose, onEdit, onApprove, onReject }: {
  data: any; busy: boolean; onClose: () => void; onEdit: (d: any) => void; onApprove: (d: any) => void; onReject: (d: any) => void;
}) {
  const d = data.driver;
  if (!d) return <Modal title="Loading…" onClose={onClose} size="lg"><LoadingBlock /></Modal>;
  const u = d.userId ?? {};
  const appr = approvalOf(d);
  const pres = presence(d);
  const docs: any[] = d.documents ?? [];

  return (
    <Modal
      title={riderName(d)}
      subtitle={<span className="flex flex-wrap gap-1.5 mt-1"><Badge tone={pres.tone}>{pres.label}</Badge><Badge status={appr} /></span>}
      size="lg"
      onClose={onClose}
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          {appr !== 'approved' && <button onClick={() => onApprove(d)} disabled={busy} className={btnSuccess}><CheckCircle className="w-4 h-4" /> Approve</button>}
          {appr === 'pending' && <button onClick={() => onReject(d)} disabled={busy} className={`${btnSecondary} !text-red-600`}><XCircle className="w-4 h-4" /> Reject</button>}
          <button onClick={() => onEdit(d)} className={`${btnPrimary} sm:ml-auto`}><Pencil className="w-4 h-4" /> Edit rider</button>
        </div>
      }
    >
      <Section title="Contact">
        <InfoGrid items={[
          ['Phone', u.phone ? <a key="p" href={`tel:${u.phone}`} className="text-blue-600 inline-flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</a> : '—'],
          ['Email', u.email ?? '—'],
          ['Company', d.companyId?.name ? <span key="c" className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" />{d.companyId.name}</span> : 'Independent'],
          ['Joined', fmtDate(d.createdAt)],
          ['Last online', fmtDateTime(d.lastOnlineAt)],
          ['Last location update', fmtDateTime(d.lastLocationUpdate)],
          ['Emergency contact', d.emergencyContact?.name ? `${d.emergencyContact.name} (${d.emergencyContact.relationship ?? '—'}) ${d.emergencyContact.phone ?? ''}` : '—'],
          ['Rider ID', <span key="id" className="font-mono text-xs">{d._id}</span>],
        ]} />
      </Section>

      <Section title="Vehicle">
        <InfoGrid items={[
          ['Type', humanize(d.vehicleType)],
          ['Make / model', [d.vehicleMake, d.vehicleModel, d.vehicleYear].filter(Boolean).join(' ') || '—'],
          ['Colour', d.vehicleColor ?? '—'],
          ['Plate number', d.plateNumber ?? '—'],
        ]} />
      </Section>

      <Section title="Performance">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MiniStat label="Rating" value={`${ratingOf(d).toFixed(1)} (${d.rating?.totalRatings ?? 0})`} />
          <MiniStat label="Acceptance" value={`${d.stats?.acceptanceRate ?? 0}%`} />
          <MiniStat label="Trips done" value={d.stats?.completedTrips ?? 0} />
          <MiniStat label="Cancelled" value={d.stats?.cancelledTrips ?? 0} />
          <MiniStat label="Total earned" value={money(d.stats?.totalEarnings)} />
          <MiniStat label="This month" value={money(d.stats?.monthEarnings)} />
          <MiniStat label="This week" value={money(d.stats?.weekEarnings)} />
          <MiniStat label="Today" value={money(d.stats?.todayEarnings)} />
        </div>
      </Section>

      <Section title={`Documents (${docs.length})`}>
        {docs.length === 0 ? <p className="text-sm text-gray-400">No documents uploaded</p> : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {docs.map((doc, i) => (
              <li key={doc._id ?? i}>
                <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-gray-200 hover:bg-gray-50">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{humanize(doc.type)}</p>
                    <p className="text-xs text-gray-500">{fmtDate(doc.uploadedAt)}{doc.expiryDate ? ` · expires ${fmtDate(doc.expiryDate)}` : ''}</p>
                  </div>
                  {doc.verified ? <Badge tone="green">Verified</Badge> : <ExternalLink className="w-4 h-4 text-gray-400" />}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Bank details">
        {d.bankDetails?.accountNumber ? (
          <InfoGrid items={[
            ['Bank', d.bankDetails.bankName ?? '—'],
            ['Account number', d.bankDetails.accountNumber],
            ['Account name', d.bankDetails.accountName ?? '—'],
            ['Verified', d.bankDetails.verified ? 'Yes' : 'No'],
          ]} />
        ) : <p className="text-sm text-gray-400">Not provided</p>}
      </Section>

      {(d.rejectionReason || d.verificationNotes || d.suspensionReason || d.adminNotes) && (
        <Section title="Notes">
          <InfoGrid items={[
            ...(d.verificationNotes ? [['Verification note', d.verificationNotes] as [string, string]] : []),
            ...(d.rejectionReason ? [['Rejection reason', d.rejectionReason] as [string, string]] : []),
            ...(d.suspensionReason ? [['Suspension reason', d.suspensionReason] as [string, string]] : []),
            ...(d.adminNotes ? [['Admin notes', d.adminNotes] as [string, string]] : []),
          ]} />
        </Section>
      )}

      <Section title="Monthly earnings">
        {(data.earnings ?? []).length === 0 ? <p className="text-sm text-gray-400">No completed deliveries yet</p> : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500"><th className="px-1 py-1.5">Month</th><th className="px-1 py-1.5 text-right">Jobs</th><th className="px-1 py-1.5 text-right">Earnings</th><th className="px-1 py-1.5 text-right">Tips</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.earnings.map((e: any) => (
                  <tr key={e._id}><td className="px-1 py-1.5">{e._id}</td><td className="px-1 py-1.5 text-right tabular-nums">{e.count}</td><td className="px-1 py-1.5 text-right tabular-nums">{money(e.earnings)}</td><td className="px-1 py-1.5 text-right tabular-nums">{money(e.tips)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title={`Recent deliveries (${data.deliveries?.length ?? 0})`}>
        {(data.deliveries ?? []).length === 0 ? <p className="text-sm text-gray-400">None</p> : (
          <ul className="divide-y divide-gray-100 -my-2">
            {data.deliveries.map((x: any) => (
              <li key={x._id} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-gray-900">{x.pickup?.address ?? '—'} → {x.dropoff?.address ?? '—'}</p>
                  <p className="text-xs text-gray-500">{x.customerId?.name ?? 'Customer'} · {fmtDate(x.createdAt)}</p>
                </div>
                <span className="tabular-nums text-gray-700 hidden sm:inline">{money(x.fare?.totalFare)}</span>
                <Badge status={x.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Modal>
  );
}

function EditRiderModal({ driver, companies, busy, onClose, onSave }: {
  driver: any; companies: any[]; busy: boolean; onClose: () => void; onSave: (body: object) => void;
}) {
  const [form, setForm] = useState({
    vehicleType: driver.vehicleType ?? 'bike',
    plateNumber: driver.plateNumber ?? '',
    companyId: driver.companyId?._id ?? driver.companyId ?? '',
    isActive: !!driver.isActive,
    isVerified: !!driver.isVerified,
    notes: driver.adminNotes ?? '',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, any> = { ...form };
    if (!body.companyId) delete body.companyId;
    if (!body.notes) delete body.notes;
    onSave(body);
  };

  return (
    <Modal
      title={`Edit ${riderName(driver)}`}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={`${btnSecondary} flex-1`}>Cancel</button>
          <button type="submit" form="edit-rider" disabled={busy} className={`${btnPrimary} flex-1`}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      }
    >
      <form id="edit-rider" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vehicle type">
            <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className={inputCls}>
              {['bike', 'car', 'van', 'truck'].map(v => <option key={v} value={v}>{humanize(v)}</option>)}
            </select>
          </Field>
          <Field label="Plate number"><input value={form.plateNumber} onChange={e => set('plateNumber', e.target.value.toUpperCase())} className={inputCls} /></Field>
        </div>
        <Field label="Company">
          <select value={form.companyId} onChange={e => set('companyId', e.target.value)} className={inputCls}>
            <option value="">— Keep current / none —</option>
            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2.5 p-3 rounded-xl ring-1 ring-gray-200 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-medium">Active</span>
          </label>
          <label className="flex items-center gap-2.5 p-3 rounded-xl ring-1 ring-gray-200 cursor-pointer">
            <input type="checkbox" checked={form.isVerified} onChange={e => set('isVerified', e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-medium">Verified</span>
          </label>
        </div>
        <Field label="Admin notes"><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
      </form>
    </Modal>
  );
}

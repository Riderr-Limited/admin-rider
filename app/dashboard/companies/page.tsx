'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2, Users, Eye, CheckCircle, XCircle, CreditCard, Trash2, Pencil, Ban, RotateCcw, FileText, ExternalLink, MapPin,
} from 'lucide-react';
import { api } from '@/lib/api';
import DeleteModal from '../DeleteModal';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';
import {
  Badge, Card, EmptyState, LoadingBlock, Modal, InfoGrid, Section, MiniStat, Field, Notice, ReasonModal, Tabs,
  FilterBar, SearchInput, inputCls, btnPrimary, btnSecondary, btnSuccess, iconBtn,
  fmtDate, money, humanize, useDebounced,
} from '../ui';

const emailOf = (c: any) => c.contactEmail ?? c.email ?? '—';
const locationOf = (c: any) => [c.address, c.lga, c.city, c.state].filter(Boolean).join(', ') || '—';

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const flash = (tone: 'green' | 'red', text: string) => { setNotice({ tone, text }); setTimeout(() => setNotice(null), 4000); };

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCompanies({ page, limit, search: debouncedSearch, status });
      setCompanies(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const openDetail = async (id: string) => {
    setDetail((prev: any) => prev ?? { loading: true });
    try {
      const res = await api.getCompanyById(id);
      setDetail(res.data);
    } catch (e: any) {
      setDetail(null);
      flash('red', e.message);
    }
  };

  const run = async (fn: () => Promise<any>, ok: string, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      flash('green', ok);
      after?.();
      fetchCompanies();
      if (detail?.company?._id) openDetail(detail.company._id);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setBusy(false);
    }
  };

  const approve = (c: any) => run(() => api.approveCompany(c._id, true), `${c.name} approved`);
  const approveBank = (c: any) => run(() => api.approveBankDetails(c._id), `Bank details for ${c.name} approved`);
  const reactivate = (c: any) => run(() => api.updateCompany(c._id, { status: 'active' }), `${c.name} reactivated`);

  const Actions = ({ c }: { c: any }) => (
    <div className="flex items-center gap-0.5">
      <button onClick={() => openDetail(c._id)} className={iconBtn} title="Details"><Eye className="w-4 h-4 text-gray-600" /></button>
      {c.status === 'pending' && (
        <>
          <button onClick={() => approve(c)} disabled={busy} className={iconBtn} title="Approve"><CheckCircle className="w-4 h-4 text-emerald-600" /></button>
          <button onClick={() => setRejectTarget(c)} disabled={busy} className={iconBtn} title="Reject"><XCircle className="w-4 h-4 text-red-600" /></button>
        </>
      )}
      {c.bankDetails?.accountNumber && !c.bankDetails.verified && (
        <button onClick={() => approveBank(c)} disabled={busy} className={iconBtn} title="Approve bank details"><CreditCard className="w-4 h-4 text-blue-600" /></button>
      )}
      <button onClick={() => setEditTarget(c)} className={iconBtn} title="Edit"><Pencil className="w-4 h-4 text-blue-600" /></button>
      {c.status === 'active' && <button onClick={() => setSuspendTarget(c)} className={iconBtn} title="Suspend"><Ban className="w-4 h-4 text-orange-600" /></button>}
      {(c.status === 'suspended' || c.status === 'rejected') && <button onClick={() => reactivate(c)} disabled={busy} className={iconBtn} title="Reactivate"><RotateCcw className="w-4 h-4 text-emerald-600" /></button>}
      <button onClick={() => setDeleteTarget(c)} className={iconBtn} title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader icon={Building2} title="Companies" subtitle="Logistics companies operating on Riderr" gradient="from-orange-500 to-amber-600" />

      {notice && <div className="mb-4"><Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}

      <Tabs
        tabs={[
          { id: '', label: 'All' }, { id: 'pending', label: 'Pending approval' }, { id: 'active', label: 'Active' },
          { id: 'suspended', label: 'Suspended' }, { id: 'rejected', label: 'Rejected' },
        ]}
        value={status}
        onChange={setStatus}
      />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search company name or phone…" />
      </FilterBar>

      {loading ? <LoadingBlock /> : companies.length === 0 ? <EmptyState icon={Building2} text="No companies found" /> : (
        <>
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    {['Company', 'Contact', 'Riders', 'Deliveries', 'Revenue', 'Status', 'Joined', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companies.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(c._id)} className="flex items-center gap-3 text-left">
                          <CompanyLogo c={c} />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-[220px]">{c.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[220px]">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 truncate max-w-[200px]">{emailOf(c)}</p>
                        <p className="text-xs text-gray-500">{c.contactPhone}</p>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{c.stats?.totalDrivers ?? 0}</td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">{c.stats?.completedDeliveries ?? 0} / {c.stats?.totalDeliveries ?? 0}</td>
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">{money(c.stats?.totalRevenue)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge status={c.status} />
                          {c.bankDetails?.accountNumber && !c.bankDetails.verified && <Badge tone="amber">Bank pending</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                      <td className="px-4 py-3"><Actions c={c} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="md:hidden space-y-3">
            {companies.map((c) => (
              <Card key={c._id} className="p-4">
                <button onClick={() => openDetail(c._id)} className="flex items-center gap-3 w-full text-left">
                  <CompanyLogo c={c} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{emailOf(c)}</p>
                  </div>
                  <Badge status={c.status} />
                </button>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <MiniStat label="Riders" value={c.stats?.totalDrivers ?? 0} />
                  <MiniStat label="Deliveries" value={c.stats?.totalDeliveries ?? 0} />
                  <MiniStat label="Revenue" value={money(c.stats?.totalRevenue)} />
                </div>
                <div className="flex justify-end border-t border-gray-100 mt-3 pt-2"><Actions c={c} /></div>
              </Card>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {detail && (
        <CompanyDetail
          data={detail}
          busy={busy}
          onClose={() => setDetail(null)}
          onApprove={approve}
          onReject={setRejectTarget}
          onApproveBank={approveBank}
          onEdit={setEditTarget}
        />
      )}

      {editTarget && (
        <EditCompanyModal
          company={editTarget}
          busy={busy}
          onClose={() => setEditTarget(null)}
          onSave={(body) => run(() => api.updateCompany(editTarget._id, body), 'Company updated', () => setEditTarget(null))}
        />
      )}

      {rejectTarget && (
        <ReasonModal
          title={`Reject ${rejectTarget.name}`}
          description="Company admins are notified with your reason."
          placeholder="e.g. CAC certificate doesn't match the business name"
          confirmLabel="Reject company"
          loading={busy}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => run(() => api.approveCompany(rejectTarget._id, false, reason), `${rejectTarget.name} rejected`, () => setRejectTarget(null))}
        />
      )}

      {suspendTarget && (
        <Modal
          title={`Suspend ${suspendTarget.name}`}
          size="sm"
          onClose={() => setSuspendTarget(null)}
          footer={
            <div className="flex gap-2">
              <button onClick={() => setSuspendTarget(null)} className={`${btnSecondary} flex-1`}>Cancel</button>
              <button disabled={busy} onClick={() => run(() => api.updateCompany(suspendTarget._id, { status: 'suspended' }), `${suspendTarget.name} suspended`, () => setSuspendTarget(null))} className={`${btnPrimary} !bg-orange-600 hover:!bg-orange-700 flex-1`}>
                {busy ? 'Working…' : 'Suspend company'}
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-600">Every rider at this company is taken offline and deactivated. Company admins are notified. You can reactivate the company later, but riders must be reactivated individually.</p>
        </Modal>
      )}

      {deleteTarget && (
        <DeleteModal
          title="Delete company"
          name={deleteTarget.name ?? 'this company'}
          softLabel="Suspend"
          softDesc="Suspends company, takes all riders offline, deactivates all its users."
          hardDesc="Deletes company and all its riders; its users are marked deleted."
          loading={busy}
          onClose={() => setDeleteTarget(null)}
          onConfirm={(permanent) => run(() => api.deleteCompany(deleteTarget._id, permanent), permanent ? 'Company deleted' : 'Company suspended', () => { setDeleteTarget(null); setDetail(null); })}
        />
      )}
    </div>
  );
}

function CompanyLogo({ c }: { c: any }) {
  return c.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-200 flex-shrink-0" />
  ) : (
    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
      <Building2 className="w-5 h-5 text-white" />
    </div>
  );
}

function CompanyDetail({ data, busy, onClose, onApprove, onReject, onApproveBank, onEdit }: {
  data: any; busy: boolean; onClose: () => void; onApprove: (c: any) => void; onReject: (c: any) => void; onApproveBank: (c: any) => void; onEdit: (c: any) => void;
}) {
  const c = data.company;
  if (!c) return <Modal title="Loading…" onClose={onClose} size="lg"><LoadingBlock /></Modal>;
  const bank = c.bankDetails?.accountNumber ? c.bankDetails : null;
  const docs: any[] = c.onboardingDocs ?? [];
  const revenue = (data.payments ?? []).filter((p: any) => p.status === 'successful').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

  return (
    <Modal
      title={c.name}
      subtitle={<span className="flex flex-wrap gap-1.5 mt-1"><Badge status={c.status} />{c.paymentSetupComplete && <Badge tone="green">Payments set up</Badge>}</span>}
      size="xl"
      onClose={onClose}
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          {c.status === 'pending' && <button onClick={() => onApprove(c)} disabled={busy} className={btnSuccess}><CheckCircle className="w-4 h-4" /> Approve</button>}
          {c.status === 'pending' && <button onClick={() => onReject(c)} disabled={busy} className={`${btnSecondary} !text-red-600`}><XCircle className="w-4 h-4" /> Reject</button>}
          <button onClick={() => onEdit(c)} className={`${btnPrimary} sm:ml-auto`}><Pencil className="w-4 h-4" /> Edit company</button>
        </div>
      }
    >
      <Section title="Company">
        <InfoGrid items={[
          ['Email', emailOf(c)],
          ['Phone', c.contactPhone ?? '—'],
          ['Address', <span key="a" className="inline-flex items-start gap-1"><MapPin className="w-3 h-3 mt-1 flex-shrink-0" />{locationOf(c)}</span>],
          ['Business licence', c.businessLicense ?? '—'],
          ['Tax ID', c.taxId ?? '—'],
          ['Registered', fmtDate(c.createdAt)],
          ['Approved', c.approvedAt ? fmtDate(c.approvedAt) : '—'],
          ['Rejection reason', c.rejectionReason ?? c.verificationNotes ?? '—'],
        ]} />
      </Section>

      <Section title="Activity">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MiniStat label="Riders" value={data.drivers?.length ?? 0} />
          <MiniStat label="Online now" value={(data.drivers ?? []).filter((d: any) => d.isOnline).length} />
          <MiniStat label="Recent deliveries" value={data.deliveries?.length ?? 0} />
          <MiniStat label="Recent revenue" value={money(revenue)} />
        </div>
      </Section>

      <Section
        title="Bank details"
        action={bank && !bank.verified && <button onClick={() => onApproveBank(c)} disabled={busy} className={`${btnSuccess} !py-1.5 !px-3 !text-xs`}><CreditCard className="w-3.5 h-3.5" /> Approve bank details</button>}
      >
        {bank ? (
          <InfoGrid items={[
            ['Bank', bank.bankName ?? '—'],
            ['Account number', bank.accountNumber],
            ['Account name', bank.accountName ?? '—'],
            ['Status', bank.verified ? <Badge key="v" tone="green">Verified {bank.verifiedAt ? fmtDate(bank.verifiedAt) : ''}</Badge> : <Badge key="v" tone="amber">Awaiting approval</Badge>],
          ]} />
        ) : <p className="text-sm text-gray-400">Not provided yet</p>}
      </Section>

      <Section title={`Onboarding documents (${docs.length})`}>
        {docs.length === 0 ? <p className="text-sm text-gray-400">No documents uploaded</p> : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {docs.map((doc, i) => (
              <li key={doc._id ?? i}>
                <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-gray-200 hover:bg-gray-50">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{humanize(doc.name)}</p>
                    <p className="text-xs text-gray-500">{fmtDate(doc.uploadedAt)}</p>
                  </div>
                  {doc.verified ? <Badge tone="green">Verified</Badge> : <ExternalLink className="w-4 h-4 text-gray-400" />}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Company admins (${data.admins?.length ?? 0})`}>
        {(data.admins ?? []).length === 0 ? <p className="text-sm text-gray-400">None</p> : (
          <ul className="divide-y divide-gray-100 -my-2">
            {data.admins.map((a: any) => (
              <li key={a._id} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0"><p className="font-medium text-gray-900 truncate">{a.name}</p><p className="text-xs text-gray-500 truncate">{a.email} · {a.phone ?? '—'}</p></div>
                <Badge tone={a.isActive ? 'green' : 'red'}>{a.isActive ? 'Active' : 'Inactive'}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Riders (${data.drivers?.length ?? 0})`}>
        {(data.drivers ?? []).length === 0 ? <p className="text-sm text-gray-400">None</p> : (
          <ul className="divide-y divide-gray-100 -my-2">
            {data.drivers.map((d: any) => (
              <li key={d._id} className="py-2 flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0"><p className="font-medium text-gray-900 truncate">{d.userId?.name ?? 'Unnamed'}</p><p className="text-xs text-gray-500 truncate">{d.userId?.phone ?? '—'} · {humanize(d.vehicleType)} {d.plateNumber ?? ''}</p></div>
                <Badge tone={!d.isActive ? 'red' : d.isOnline ? 'green' : 'gray'}>{!d.isActive ? 'Inactive' : d.isOnline ? 'Online' : 'Offline'}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Recent deliveries (${data.deliveries?.length ?? 0})`}>
        {(data.deliveries ?? []).length === 0 ? <p className="text-sm text-gray-400">None</p> : (
          <ul className="divide-y divide-gray-100 -my-2">
            {data.deliveries.map((x: any) => (
              <li key={x._id} className="py-2 flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-gray-900">{x.dropoff?.address ?? x.referenceId}</p>
                  <p className="text-xs text-gray-500">{x.customerId?.name ?? 'Customer'} · {x.driverId?.userId?.name ?? 'No rider'} · {fmtDate(x.createdAt)}</p>
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

function EditCompanyModal({ company, busy, onClose, onSave }: { company: any; busy: boolean; onClose: () => void; onSave: (body: object) => void }) {
  const [form, setForm] = useState({
    name: company.name ?? '', contactPhone: company.contactPhone ?? '', address: company.address ?? '', status: company.status ?? 'pending',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(form)) if (v !== (company[k] ?? '')) body[k] = v;
    if (!Object.keys(body).length) { onClose(); return; }
    onSave(body);
  };
  return (
    <Modal
      title={`Edit ${company.name}`}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={`${btnSecondary} flex-1`}>Cancel</button>
          <button type="submit" form="edit-company" disabled={busy} className={`${btnPrimary} flex-1`}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      }
    >
      <form id="edit-company" onSubmit={submit} className="space-y-4">
        <Field label="Company name"><input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} /></Field>
        <Field label="Contact phone" hint="Nigerian format: 08012345678 or +2348012345678">
          <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Address"><input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} /></Field>
        <Field label="Status" hint="Suspending takes every rider at this company offline.">
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
            {['pending', 'active', 'suspended', 'rejected'].map(s => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
        </Field>
      </form>
    </Modal>
  );
}

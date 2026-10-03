'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Eye, ShieldOff, Shield, Trash2, KeyRound, Pencil, Building2, Package, UserCog, Download, BadgeCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';
import DeleteModal from '../DeleteModal';
import {
  Badge, Card, EmptyState, LoadingBlock, Modal, InfoGrid, Section, MiniStat, Field, Notice, ReasonModal,
  FilterBar, SearchInput, selectCls, inputCls, btnPrimary, btnSecondary, iconBtn,
  fmtDate, fmtDateTime, money, humanize, initial, useDebounced, downloadCsv,
} from '../ui';

const ROLE_TONE: Record<string, string> = { customer: 'blue', driver: 'violet', company_admin: 'orange', admin: 'red' };

function currentAdminId(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem('user') ?? 'null');
    return u?._id ?? u?.id ?? null;
  } catch { return null; }
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [role, setRole] = useState('');
  const [isVerified, setIsVerified] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;
  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);

  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);
  const [resetTarget, setResetTarget] = useState<any | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { setSelfId(currentAdminId()); }, []);

  const flash = (tone: 'green' | 'red', text: string) => {
    setNotice({ tone, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUsers({ page, limit, search: debouncedSearch, role, isVerified, isActive });
      setUsers(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, role, isVerified, isActive]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch, role, isVerified, isActive]);

  const openDetail = async (id: string) => {
    setDetail({ loading: true });
    setDetailLoading(true);
    try {
      const res = await api.getUserById(id);
      setDetail(res.data);
    } catch (e: any) {
      setDetail(null);
      flash('red', e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const run = async (fn: () => Promise<any>, ok: string, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      flash('green', ok);
      after?.();
      fetchUsers();
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.exportData('users');
      downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`, res.data?.data ?? []);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setExporting(false);
    }
  };

  const isSelf = (u: any) => !!selfId && u._id === selfId;

  const Actions = ({ u }: { u: any }) => (
    <div className="flex items-center gap-0.5">
      <button onClick={() => openDetail(u._id)} className={iconBtn} title="View details"><Eye className="w-4 h-4 text-gray-600" /></button>
      <button onClick={() => setEditTarget(u)} disabled={isSelf(u)} className={iconBtn} title="Edit"><Pencil className="w-4 h-4 text-blue-600" /></button>
      <button onClick={() => setSuspendTarget(u)} disabled={isSelf(u)} className={iconBtn} title={u.isActive ? 'Suspend' : 'Reactivate'}>
        {u.isActive ? <ShieldOff className="w-4 h-4 text-orange-600" /> : <Shield className="w-4 h-4 text-emerald-600" />}
      </button>
      <button onClick={() => setResetTarget(u)} className={iconBtn} title="Reset password"><KeyRound className="w-4 h-4 text-violet-600" /></button>
      <button onClick={() => setDeleteTarget(u)} disabled={isSelf(u)} className={iconBtn} title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
    </div>
  );

  const statLine = (u: any) => {
    const s = u.stats ?? {};
    if (u.role === 'customer') return `${s.totalDeliveries ?? 0} orders · ${money(s.totalSpent)}`;
    if (u.role === 'driver') return `${s.completedDeliveries ?? 0}/${s.totalDeliveries ?? 0} done · ${money(s.totalEarnings)}`;
    if (u.role === 'company_admin') return u.companyId?.name ?? 'No company';
    return '—';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        icon={Users}
        title="Users"
        subtitle="All accounts on the platform: customers, riders, company admins and admins"
        gradient="from-blue-500 to-indigo-600"
        action={
          <button onClick={handleExport} disabled={exporting} className={btnSecondary}>
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        }
      />

      {notice && <div className="mb-4"><Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}

      <div className="flex gap-2 mb-4 overflow-x-auto -mx-1 px-1 pb-1">
        {[
          { value: '', label: 'All', icon: Users },
          { value: 'customer', label: 'Customers', icon: Users },
          { value: 'driver', label: 'Riders', icon: Package },
          { value: 'company_admin', label: 'Company admins', icon: Building2 },
          { value: 'admin', label: 'Admins', icon: UserCog },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setRole(value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              role === value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-900/5 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or phone…" />
        <div className="grid grid-cols-2 sm:flex gap-3">
          <select value={isVerified} onChange={(e) => setIsVerified(e.target.value)} className={selectCls}>
            <option value="">Any verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <select value={isActive} onChange={(e) => setIsActive(e.target.value)} className={selectCls}>
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Suspended</option>
          </select>
        </div>
      </FilterBar>

      {loading ? <LoadingBlock /> : users.length === 0 ? <EmptyState icon={Users} text="No users match these filters" /> : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    {['User', 'Role', 'Phone', 'Activity', 'Status', 'Joined', ''].map(h => (
                      <th key={h} className="px-4 lg:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-5 py-3">
                        <button onClick={() => openDetail(u._id)} className="flex items-center gap-3 text-left">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {initial(u.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-[200px]">{u.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{u.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 lg:px-5 py-3"><Badge tone={ROLE_TONE[u.role]}>{humanize(u.role)}</Badge></td>
                      <td className="px-4 lg:px-5 py-3 text-gray-700 whitespace-nowrap">{u.phone ?? '—'}</td>
                      <td className="px-4 lg:px-5 py-3 text-gray-600 text-xs whitespace-nowrap">{statLine(u)}</td>
                      <td className="px-4 lg:px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Suspended'}</Badge>
                          {u.isVerified && <Badge tone="blue">Verified</Badge>}
                        </div>
                      </td>
                      <td className="px-4 lg:px-5 py-3 text-gray-600 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 lg:px-5 py-3"><Actions u={u} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <Card key={u._id} className="p-4">
                <button onClick={() => openDetail(u._id)} className="flex items-center gap-3 w-full text-left">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {initial(u.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <Badge tone={ROLE_TONE[u.role]}>{humanize(u.role)}</Badge>
                </button>
                <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs text-gray-500">
                  <Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Suspended'}</Badge>
                  {u.isVerified && <Badge tone="blue">Verified</Badge>}
                  <span>{u.phone ?? 'No phone'}</span>
                  <span>· {statLine(u)}</span>
                </div>
                <div className="flex justify-end border-t border-gray-100 mt-3 pt-2"><Actions u={u} /></div>
              </Card>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {detail && (
        <UserDetail
          data={detail}
          loading={detailLoading}
          onClose={() => setDetail(null)}
          onEdit={(u) => { setDetail(null); setEditTarget(u); }}
        />
      )}

      {editTarget && (
        <EditUserModal
          user={editTarget}
          busy={busy}
          onClose={() => setEditTarget(null)}
          onSave={(body) => run(() => api.updateUser(editTarget._id, body), 'User updated', () => setEditTarget(null))}
        />
      )}

      {suspendTarget && (suspendTarget.isActive ? (
        <ReasonModal
          title={`Suspend ${suspendTarget.name}`}
          description={suspendTarget.role === 'driver'
            ? 'The user loses access immediately and their rider profile is taken offline.'
            : 'The user loses access to the platform immediately. They are notified with your reason.'}
          confirmLabel="Suspend"
          loading={busy}
          onClose={() => setSuspendTarget(null)}
          onConfirm={(reason) => run(() => api.suspendUser(suspendTarget._id, true, reason), `${suspendTarget.name} suspended`, () => setSuspendTarget(null))}
        />
      ) : (
        <Modal
          title={`Reactivate ${suspendTarget.name}`}
          size="sm"
          onClose={() => setSuspendTarget(null)}
          footer={
            <div className="flex gap-2">
              <button onClick={() => setSuspendTarget(null)} className={`${btnSecondary} flex-1`}>Cancel</button>
              <button disabled={busy} onClick={() => run(() => api.suspendUser(suspendTarget._id, false), `${suspendTarget.name} reactivated`, () => setSuspendTarget(null))} className={`${btnPrimary} flex-1`}>
                {busy ? 'Working…' : 'Restore access'}
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-600">Restore platform access for this account? They will be notified.</p>
        </Modal>
      ))}

      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          busy={busy}
          onClose={() => setResetTarget(null)}
          onSave={(pw) => run(() => api.resetUserPassword(resetTarget._id, pw), `Password reset for ${resetTarget.name}. They have been signed out everywhere.`, () => setResetTarget(null))}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          title="Delete user"
          name={deleteTarget.name}
          softLabel="Soft delete"
          softDesc={deleteTarget.role === 'driver' ? 'Deactivates account and rider profile; data kept.' : 'Deactivates and hides the account; data kept.'}
          hardDesc={deleteTarget.role === 'driver' ? 'Erases the account and the rider profile.' : 'Erases the account record.'}
          loading={busy}
          onClose={() => setDeleteTarget(null)}
          onConfirm={(permanent) => run(() => api.deleteUser(deleteTarget._id, permanent), permanent ? 'User permanently deleted' : 'User soft-deleted', () => setDeleteTarget(null))}
        />
      )}
    </div>
  );
}

function UserDetail({ data, loading, onClose, onEdit }: { data: any; loading: boolean; onClose: () => void; onEdit: (u: any) => void }) {
  const u = data.user;
  const s = data.stats ?? {};
  return (
    <Modal
      title={loading ? 'Loading…' : u?.name ?? 'User'}
      subtitle={u && <span className="flex flex-wrap gap-1.5 mt-1"><Badge tone={ROLE_TONE[u.role]}>{humanize(u.role)}</Badge><Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Suspended'}</Badge>{u.isVerified && <Badge tone="blue">Verified</Badge>}{u.isDeleted && <Badge tone="red">Deleted</Badge>}</span>}
      size="lg"
      onClose={onClose}
      footer={u && <button onClick={() => onEdit(u)} className={`${btnPrimary} w-full sm:w-auto`}><Pencil className="w-4 h-4" /> Edit user</button>}
    >
      {loading || !u ? <LoadingBlock /> : (
        <>
          <Section title="Account">
            <InfoGrid items={[
              ['Email', u.email],
              ['Phone', u.phone ?? '—'],
              ['Joined', fmtDateTime(u.createdAt)],
              ['Last login', fmtDateTime(u.lastLoginAt)],
              ['Last seen', fmtDateTime(u.lastSeenAt)],
              ['Email verified', u.emailVerifiedAt ? fmtDateTime(u.emailVerifiedAt) : 'No'],
              ['Guest account', u.isGuest ? 'Yes (created by partner)' : 'No'],
              ['Company', u.companyId?.name ?? '—'],
              ['User ID', <span key="id" className="font-mono text-xs">{u._id}</span>],
            ]} />
          </Section>

          {Object.keys(s).length > 0 && (
            <Section title="Stats">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {u.role === 'customer' ? (
                  <>
                    <MiniStat label="Orders" value={s.totalDeliveries ?? 0} />
                    <MiniStat label="Completed" value={s.completedDeliveries ?? 0} />
                    <MiniStat label="Cancelled" value={s.cancelledDeliveries ?? 0} />
                    <MiniStat label="Total spent" value={money(s.totalSpent)} />
                    <MiniStat label="Avg order" value={money(s.avgSpending)} />
                  </>
                ) : (
                  <>
                    <MiniStat label="Deliveries" value={s.totalDeliveries ?? 0} />
                    <MiniStat label="Completed" value={s.completedDeliveries ?? 0} />
                    <MiniStat label="Earnings" value={money(s.totalEarnings)} />
                    <MiniStat label="Tips" value={money(s.totalTips)} />
                    <MiniStat label="Avg rating" value={s.avgRating ? Number(s.avgRating).toFixed(1) : '—'} />
                  </>
                )}
              </div>
            </Section>
          )}

          {u.driverId && typeof u.driverId === 'object' && (
            <Section title="Rider profile">
              <InfoGrid items={[
                ['Vehicle', `${humanize(u.driverId.vehicleType)} ${[u.driverId.vehicleMake, u.driverId.vehicleModel].filter(Boolean).join(' ')}`],
                ['Plate', u.driverId.plateNumber ?? '—'],
                ['Approval', humanize(u.driverId.approvalStatus)],
                ['Online', u.driverId.isOnline ? 'Yes' : 'No'],
              ]} />
            </Section>
          )}

          <Section title={`Recent deliveries (${data.deliveries?.length ?? 0})`}>
            {(data.deliveries ?? []).length === 0 ? <p className="text-sm text-gray-400">None</p> : (
              <ul className="divide-y divide-gray-100 -my-2">
                {data.deliveries.map((d: any) => (
                  <li key={d._id} className="py-2 flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-900">{d.dropoff?.address ?? d.referenceId}</p>
                      <p className="text-xs text-gray-500">{d.referenceId ?? d._id.slice(-8)} · {fmtDate(d.createdAt)}</p>
                    </div>
                    <span className="tabular-nums text-gray-700">{money(d.fare?.totalFare)}</span>
                    <Badge status={d.status} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Payments (${data.payments?.length ?? 0})`}>
            {(data.payments ?? []).length === 0 ? <p className="text-sm text-gray-400">None</p> : (
              <ul className="divide-y divide-gray-100 -my-2">
                {data.payments.map((p: any) => (
                  <li key={p._id} className="py-2 flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs truncate">{p.paystackReference ?? p.gatewayReference ?? p._id}</p>
                      <p className="text-xs text-gray-500">{humanize(p.paymentMethod)} · {fmtDate(p.createdAt)}</p>
                    </div>
                    <span className="tabular-nums text-gray-700">{money(p.amount)}</span>
                    <Badge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Support tickets (${data.supportTickets?.length ?? 0})`}>
            {(data.supportTickets ?? []).length === 0 ? <p className="text-sm text-gray-400">None</p> : (
              <ul className="divide-y divide-gray-100 -my-2">
                {data.supportTickets.map((t: any) => (
                  <li key={t._id} className="py-2 flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-900">{t.title}</p>
                      <p className="text-xs text-gray-500">#{t.ticketId} · {humanize(t.issueType)} · {fmtDate(t.createdAt)}</p>
                    </div>
                    <Badge status={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </Modal>
  );
}

function EditUserModal({ user, busy, onClose, onSave }: { user: any; busy: boolean; onClose: () => void; onSave: (body: object) => void }) {
  const [form, setForm] = useState({
    name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '', role: user.role ?? 'customer',
    isVerified: !!user.isVerified, isActive: !!user.isActive,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Only send fields that actually changed — the backend notifies the user listing every changed field.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, any> = {};
    for (const [k, v] of Object.entries(form)) if (v !== (user[k] ?? (typeof v === 'boolean' ? false : ''))) body[k] = v;
    if (Object.keys(body).length === 0) { onClose(); return; }
    onSave(body);
  };

  return (
    <Modal
      title={`Edit ${user.name}`}
      size="md"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={`${btnSecondary} flex-1`}>Cancel</button>
          <button type="submit" form="edit-user" disabled={busy} className={`${btnPrimary} flex-1`}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      }
    >
      <form id="edit-user" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name"><input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} /></Field>
          <Field label="Phone"><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Email"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} /></Field>
        <Field label="Role" hint="Changing the role does not create a rider or company profile — use with care.">
          <select value={form.role} onChange={e => set('role', e.target.value)} className={inputCls}>
            <option value="customer">Customer</option>
            <option value="driver">Rider (driver)</option>
            <option value="company_admin">Company admin</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2.5 p-3 rounded-xl ring-1 ring-gray-200 cursor-pointer">
            <input type="checkbox" checked={form.isVerified} onChange={e => set('isVerified', e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-medium text-gray-800 flex items-center gap-1"><BadgeCheck className="w-4 h-4 text-blue-600" /> Verified</span>
          </label>
          <label className="flex items-center gap-2.5 p-3 rounded-xl ring-1 ring-gray-200 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-medium text-gray-800">Active</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, busy, onClose, onSave }: { user: any; busy: boolean; onClose: () => void; onSave: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  return (
    <Modal
      title="Reset password"
      size="sm"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className={`${btnSecondary} flex-1`}>Cancel</button>
          <button onClick={() => onSave(pw)} disabled={busy || pw.length < 6} className={`${btnPrimary} flex-1`}>{busy ? 'Resetting…' : 'Reset password'}</button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Set a new password for <b>{user.name}</b>. They will be signed out of every device. No email is sent, so share the new password with them yourself.
        </p>
        <Field label="New password" hint="At least 6 characters">
          <input type="text" value={pw} onChange={e => setPw(e.target.value)} className={`${inputCls} font-mono`} autoFocus />
        </Field>
      </div>
    </Modal>
  );
}

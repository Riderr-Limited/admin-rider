'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, ChevronLeft, ChevronRight, Eye, XCircle,
  ShieldOff, Shield, Trash2, KeyRound, Save
} from 'lucide-react';
import { api } from '@/lib/api';

const ROLE_COLORS: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-700',
  driver: 'bg-purple-100 text-purple-700',
  company_admin: 'bg-orange-100 text-orange-700',
  admin: 'bg-red-100 text-red-700',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isVerified, setIsVerified] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  // Modals
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [suspendModal, setSuspendModal] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [resetModal, setResetModal] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [editModal, setEditModal] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (role) params.role = role;
      if (isVerified) params.isVerified = isVerified;
      if (isActive) params.isActive = isActive;
      const res = await api.getUsers(params);
      setUsers(res.data?.users ?? res.data ?? []);
      setTotal(res.data?.total ?? res.pagination?.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, isVerified, isActive]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailUser({ _id: id, _loading: true });
    try {
      const res = await api.getUserById(id);
      setDetailUser(res.data ?? res);
    } catch (e: any) {
      alert(e.message);
      setDetailUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSuspend = async (suspend: boolean) => {
    setSuspendLoading(true);
    try {
      await api.suspendUser(suspendModal._id, suspend, suspend ? suspendReason : undefined);
      setSuspendModal(null);
      setSuspendReason('');
      fetchUsers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Soft delete user "${name}"? This can be reversed.`)) return;
    try {
      await api.deleteUser(id);
      setActionMsg('User deleted.');
      fetchUsers();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg('');
    try {
      await api.resetUserPassword(resetModal._id, newPassword);
      setResetMsg('Password reset successfully!');
      setNewPassword('');
      setTimeout(() => { setResetModal(null); setResetMsg(''); }, 1500);
    } catch (e: any) {
      setResetMsg(e.message || 'Failed');
    } finally {
      setResetLoading(false);
    }
  };

  const openEdit = (user: any) => {
    setEditModal(user);
    setEditForm({ name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '', role: user.role ?? '', notes: user.notes ?? '' });
    setEditMsg('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMsg('');
    try {
      await api.updateUser(editModal._id, editForm);
      setEditMsg('User updated successfully!');
      fetchUsers();
      setTimeout(() => { setEditModal(null); setEditMsg(''); }, 1500);
    } catch (e: any) {
      setEditMsg(e.message || 'Failed');
    } finally {
      setEditLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
        <p className="text-gray-600">Manage all platform users</p>
      </div>

      {actionMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-xl text-sm">{actionMsg}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
            <option value="company_admin">Company Admin</option>
            <option value="admin">Admin</option>
          </select>
          <select value={isVerified} onChange={(e) => { setIsVerified(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">All Verified</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <select value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">All Active</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['User', 'Role', 'Phone', 'Verified', 'Active', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user: any) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                            {user.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {user.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.phone ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {user.isVerified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {user.isActive ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetail(user._id)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="View Details">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button onClick={() => openEdit(user)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Edit User">
                            <Save className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => { setSuspendModal(user); setSuspendReason(''); }}
                            className="p-1.5 hover:bg-orange-50 rounded-lg"
                            title={user.isActive ? 'Suspend' : 'Unsuspend'}
                          >
                            {user.isActive ? <ShieldOff className="w-4 h-4 text-orange-600" /> : <Shield className="w-4 h-4 text-green-600" />}
                          </button>
                          <button onClick={() => { setResetModal(user); setNewPassword(''); setResetMsg(''); }} className="p-1.5 hover:bg-purple-50 rounded-lg" title="Reset Password">
                            <KeyRound className="w-4 h-4 text-purple-600" />
                          </button>
                          <button onClick={() => handleDelete(user._id, user.name)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete User">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages} · {total} total</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">User Details</h2>
              <button onClick={() => setDetailUser(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="p-6 space-y-3 text-sm">
                {[
                  ['Name', detailUser.name],
                  ['Email', detailUser.email],
                  ['Phone', detailUser.phone ?? '—'],
                  ['Role', detailUser.role],
                  ['Verified', detailUser.isVerified ? 'Yes' : 'No'],
                  ['Active', detailUser.isActive ? 'Yes' : 'No'],
                  ['Joined', detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString() : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
                {detailUser.stats && (
                  <div className="pt-2">
                    <p className="font-semibold text-gray-700 mb-2">Stats</p>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(detailUser.stats).map(([k, v]: any) => (
                        <div key={k} className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">{v}</p>
                          <p className="text-xs text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
              <button onClick={() => setEditModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={editForm[key]}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
                  <option value="customer">Customer</option>
                  <option value="driver">Driver</option>
                  <option value="company_admin">Company Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              {editMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm ${editMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{editMsg}</div>
              )}
              <button type="submit" disabled={editLoading} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {suspendModal.isActive ? 'Suspend User' : 'Unsuspend User'}
              </h2>
              <button onClick={() => setSuspendModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {suspendModal.isActive
                  ? `Suspend "${suspendModal.name}"? They will lose access to the platform.`
                  : `Restore access for "${suspendModal.name}"?`}
              </p>
              {suspendModal.isActive && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason</label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    rows={3}
                    placeholder="Reason for suspension..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setSuspendModal(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => handleSuspend(suspendModal.isActive)}
                  disabled={suspendLoading}
                  className={`flex-1 py-2.5 text-white font-semibold rounded-xl disabled:opacity-60 ${suspendModal.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {suspendLoading ? 'Processing...' : suspendModal.isActive ? 'Suspend' : 'Restore Access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
              <button onClick={() => setResetModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Set a new password for <span className="font-semibold">{resetModal.name}</span></p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {resetMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm ${resetMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{resetMsg}</div>
              )}
              <button type="submit" disabled={resetLoading} className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-60">
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

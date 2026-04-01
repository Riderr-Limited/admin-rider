'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Building2, Users, Package, Search, Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const limit = 10;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.getCompanies(params);
      setCompanies(res.data?.companies ?? res.data ?? []);
      setTotal(res.data?.total ?? res.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleApprove = async (id: string, approve: boolean) => {
    setActionLoading(id + approve);
    try {
      await api.approveCompany(id, approve);
      fetchCompanies();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveBankDetails = async (id: string) => {
    setActionLoading(id + 'bank');
    try {
      await api.approveBankDetails(id);
      alert('Bank details approved!');
      fetchCompanies();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.getCompanyById(id);
      setSelected(res.data);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    suspended: 'bg-red-100 text-red-700',
    rejected: 'bg-gray-100 text-gray-700',
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Companies</h1>
        <p className="text-gray-600">Manage your logistics partners</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
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
                    {['Company', 'Contact', 'Drivers', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companies.map((company: any) => (
                    <tr key={company._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                            {company.address && <p className="text-xs text-gray-500">{company.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{company.email}</p>
                        <p className="text-xs text-gray-500">{company.contactPhone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Users className="w-4 h-4 text-gray-400" />
                          {company.totalDrivers ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge[company.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {company.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {company.createdAt ? new Date(company.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewDetails(company._id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {company.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(company._id, true)}
                                disabled={actionLoading === company._id + 'true'}
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => handleApprove(company._id, false)}
                                disabled={actionLoading === company._id + 'false'}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                          {company.status === 'active' && company.bankDetails && !company.bankDetails.verified && (
                            <button
                              onClick={() => handleApproveBankDetails(company._id)}
                              disabled={actionLoading === company._id + 'bank'}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Approve Bank Details"
                            >
                              <CreditCard className="w-4 h-4 text-blue-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {companies.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No companies found</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Company Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{selected.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{selected.contactPhone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[selected.status] ?? ''}`}>{selected.status}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium">{selected.address ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Drivers</span><span className="font-medium">{selected.totalDrivers ?? 0}</span></div>
              {selected.bankDetails && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="font-semibold text-gray-700 mb-2">Bank Details</p>
                  <div className="space-y-1 text-gray-600">
                    <p>{selected.bankDetails.bankName} — {selected.bankDetails.accountNumber}</p>
                    <p>{selected.bankDetails.accountName}</p>
                    <p className={selected.bankDetails.verified ? 'text-green-600' : 'text-yellow-600'}>
                      {selected.bankDetails.verified ? '✓ Verified' : '⏳ Pending verification'}
                    </p>
                  </div>
                </div>
              )}
              {selected.notes && <div className="pt-3 border-t border-gray-100"><p className="text-gray-500 text-xs">Notes: {selected.notes}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

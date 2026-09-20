'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Handshake, Search, Eye, XCircle, ChevronLeft, ChevronRight, Plus, Ban, CheckCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '../PageHeader';

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
};

export default function Partners() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({ businessName: '', contactName: '', contactEmail: '', contactPhone: '', allowedCompanyIds: '' });
  const [secretModal, setSecretModal] = useState<{ apiKey: string; apiSecret: string; message: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const limit = 10;

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.getPartners(params);
      setPartners(res.data?.partners ?? res.data ?? []);
      setTotal(res.data?.total ?? res.total ?? (res.data?.length ?? 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const body: any = {
        businessName: form.businessName,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
      };
      const ids = form.allowedCompanyIds.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length) body.allowedCompanyIds = ids;
      const res = await api.createPartner(body);
      setShowCreate(false);
      setForm({ businessName: '', contactName: '', contactEmail: '', contactPhone: '', allowedCompanyIds: '' });
      setSecretModal({ apiKey: res.data?.apiKey, apiSecret: res.data?.apiSecret, message: res.message ?? 'Partner created. Store the apiSecret now — it will not be shown again.' });
      fetchPartners();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSuspend = async (id: string, suspend: boolean) => {
    setActionLoading(id + suspend);
    try {
      if (suspend) await api.suspendPartner(id);
      else await api.activatePartner(id);
      fetchPartners();
      if (selected?.id === id || selected?._id === id) handleViewDetails(id);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm('Regenerate this partner\'s API secret? The old secret will stop working immediately.')) return;
    setActionLoading(id + 'regen');
    try {
      const res = await api.regeneratePartnerSecret(id);
      setSecretModal({ apiKey: res.data?.apiKey, apiSecret: res.data?.apiSecret, message: res.message ?? 'New apiSecret generated. Store it now — it will not be shown again.' });
      fetchPartners();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.getPartnerById(id);
      setSelected(res.data ?? res);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <PageHeader
        icon={Handshake}
        title="API Partners"
        subtitle="Manage external partner integrations and API access"
        gradient="from-cyan-500 to-blue-600"
        action={
          <button
            onClick={() => { setShowCreate(true); setCreateError(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Partner
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 mb-6 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search partners..."
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
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Partner', 'Contact', 'API Key', 'Status', 'Requests', 'Last Used', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {partners.map((partner: any) => {
                    const id = partner.id ?? partner._id;
                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                              <Handshake className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{partner.businessName}</p>
                              <p className="text-xs text-gray-500">{partner.contactName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{partner.contactEmail}</p>
                          <p className="text-xs text-gray-500">{partner.contactPhone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-700">{partner.apiKey}</code>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge[partner.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {partner.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{partner.requestCount ?? 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {partner.lastUsedAt ? new Date(partner.lastUsedAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleViewDetails(id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleRegenerate(id)}
                              disabled={actionLoading === id + 'regen'}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Regenerate Secret"
                            >
                              <RefreshCw className="w-4 h-4 text-blue-600" />
                            </button>
                            {partner.status === 'active' ? (
                              <button
                                onClick={() => handleSuspend(id, true)}
                                disabled={actionLoading === id + 'true'}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Suspend"
                              >
                                <Ban className="w-4 h-4 text-red-600" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(id, false)}
                                disabled={actionLoading === id + 'false'}
                                className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                title="Activate"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {partners.length === 0 && (
              <div className="text-center py-12">
                <Handshake className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No partners found</p>
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

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{selected.businessName}</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Contact</span><span className="font-medium">{selected.contactName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{selected.contactEmail}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{selected.contactPhone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[selected.status] ?? ''}`}>{selected.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">API Key</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-700">{selected.apiKey}</code>
                  <button onClick={() => handleCopy('key', selected.apiKey)} className="p-1 hover:bg-gray-100 rounded-lg">
                    {copied === 'key' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Requests</span><span className="font-medium">{selected.requestCount ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Last Used</span><span className="font-medium">{selected.lastUsedAt ? new Date(selected.lastUsedAt).toLocaleString() : 'Never'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="font-medium">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span></div>
              {selected.allowedCompanyIds && selected.allowedCompanyIds.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="font-semibold text-gray-700 mb-2">Restricted to Companies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.allowedCompanyIds.map((cid: string) => (
                      <code key={cid} className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-700">{cid}</code>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => handleRegenerate(selected.id ?? selected._id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" /> Regenerate Secret
                </button>
                {selected.status === 'active' ? (
                  <button
                    onClick={() => handleSuspend(selected.id ?? selected._id, true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    <Ban className="w-4 h-4" /> Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleSuspend(selected.id ?? selected._id, false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-green-300 text-green-600 rounded-xl hover:bg-green-50 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" /> Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add Partner</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => setForm({ ...form, businessName: e.target.value })}
                  required
                  placeholder="e.g. Jumia NG"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Name</label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={e => setForm({ ...form, contactName: e.target.value })}
                  required
                  placeholder="e.g. Jane Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                  required
                  placeholder="integrations@jumia.example"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                  required
                  placeholder="08012345678"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Allowed Company IDs <span className="text-gray-400 font-normal">(optional, comma separated)</span>
                </label>
                <textarea
                  value={form.allowedCompanyIds}
                  onChange={e => setForm({ ...form, allowedCompanyIds: e.target.value })}
                  rows={2}
                  placeholder="Leave empty to allow any active company"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-xs font-mono"
                />
              </div>

              {createError && (
                <div className="px-4 py-3 rounded-xl text-sm bg-red-50 text-red-700">{createError}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 text-sm font-medium"
                >
                  {creating ? 'Creating...' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-time secret modal */}
      {secretModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Partner Credentials</h2>
              <button onClick={() => setSecretModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <p className="text-xs text-yellow-700">{secretModal.message}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">API Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded-xl text-gray-700 break-all">{secretModal.apiKey}</code>
                  <button onClick={() => handleCopy('modalKey', secretModal.apiKey)} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
                    {copied === 'modalKey' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">API Secret</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded-xl text-gray-700 break-all">{secretModal.apiSecret}</code>
                  <button onClick={() => handleCopy('modalSecret', secretModal.apiSecret)} className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0">
                    {copied === 'modalSecret' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSecretModal(null)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
              >
                I've stored it, close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

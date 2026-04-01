'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DollarSign, Search, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, RotateCcw, Eye, Download } from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  successful: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  successful: <CheckCircle className="w-4 h-4" />,
  pending: <Clock className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
};

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);
  const [refundModal, setRefundModal] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMsg, setRefundMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const limit = 15;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.getPayments(params);
      setPayments(res.data?.payments ?? res.data ?? []);
      setTotals(res.data?.totals ?? res.totals ?? null);
      setTotal(res.data?.total ?? res.pagination?.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status, startDate, endDate]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.getPaymentById(id);
      setSelected(res.data ?? res);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundLoading(true);
    setRefundMsg('');
    try {
      await api.issueRefund(refundModal._id, refundReason, refundAmount ? Number(refundAmount) : undefined);
      setRefundMsg('Refund issued successfully!');
      setRefundAmount('');
      setRefundReason('');
      setTimeout(() => { setRefundModal(null); setRefundMsg(''); fetchPayments(); }, 1500);
    } catch (e: any) {
      setRefundMsg(e.message || 'Refund failed');
    } finally {
      setRefundLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = { format: 'json' };
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.exportData('payments', params);
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  };

  const filtered = payments.filter(p =>
    !search ||
    p._id?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase()) ||
    p.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
        <p className="text-gray-600">Monitor all transactions and issue refunds</p>
      </div>

      {/* Totals Summary */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Amount', value: totals.totalAmount, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Platform Fees', value: totals.totalPlatformFees, color: 'text-purple-600', bg: 'bg-purple-100' },
            { label: 'Company Revenue', value: totals.totalCompanyRevenue, color: 'text-green-600', bg: 'bg-green-100' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">₦{Number(item.value ?? 0).toLocaleString()}</p>
                </div>
                <div className={`${item.bg} p-3 rounded-xl`}>
                  <DollarSign className={`w-6 h-6 ${item.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ID, reference, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:opacity-60 text-sm font-medium">
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
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
                    {['Reference', 'Customer', 'Amount', 'Platform Fee', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((payment: any) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-mono font-medium text-blue-600">{payment.reference ?? payment._id?.slice(-8)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{payment.customer?.name ?? '—'}</p>
                        <p className="text-xs text-gray-500">{payment.customer?.email ?? ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">₦{Number(payment.amount ?? 0).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">₦{Number(payment.platformFee ?? 0).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[payment.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_ICONS[payment.status]}
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleViewDetails(payment._id)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="View Details">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {payment.status === 'successful' && (
                            <button onClick={() => { setRefundModal(payment); setRefundMsg(''); }} className="p-1.5 hover:bg-orange-50 rounded-lg" title="Issue Refund">
                              <RotateCcw className="w-4 h-4 text-orange-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No payments found</p>
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

      {/* Payment Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Payment Details</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              {[
                ['Reference', selected.reference ?? selected._id],
                ['Amount', `₦${Number(selected.amount ?? 0).toLocaleString()}`],
                ['Platform Fee', `₦${Number(selected.platformFee ?? 0).toLocaleString()}`],
                ['Company Revenue', `₦${Number(selected.companyRevenue ?? 0).toLocaleString()}`],
                ['Status', selected.status],
                ['Customer', selected.customer?.name ?? '—'],
                ['Driver', selected.driver?.name ?? '—'],
                ['Delivery', selected.delivery ?? selected.deliveryId ?? '—'],
                ['Date', selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Issue Refund</h2>
              <button onClick={() => setRefundModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRefund} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <p className="text-gray-500">Payment Amount</p>
                <p className="text-xl font-bold text-gray-900">₦{Number(refundModal.amount ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Refund Amount <span className="text-gray-400 font-normal">(leave blank for full refund)</span>
                </label>
                <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder={`Max: ${refundModal.amount}`} min={1} max={refundModal.amount} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason <span className="text-red-500">*</span></label>
                <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} required rows={3} placeholder="e.g. Customer complaint - item not delivered" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              {refundMsg && (
                <div className={`px-4 py-3 rounded-xl text-sm ${refundMsg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{refundMsg}</div>
              )}
              <button type="submit" disabled={refundLoading} className="w-full py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-60">
                {refundLoading ? 'Processing...' : 'Issue Refund'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

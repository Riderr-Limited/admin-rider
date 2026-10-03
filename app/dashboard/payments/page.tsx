'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DollarSign, RotateCcw, Eye, Download, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';
import {
  Badge, Card, EmptyState, LoadingBlock, Modal, InfoGrid, Section, Notice, Field, FilterBar,
  selectCls, inputCls, btnSecondary, btnDanger, iconBtn, fmtDate, fmtDateTime, money, humanize, downloadCsv,
} from '../ui';

const refOf = (p: any) => p.paystackReference ?? p.gatewayReference ?? p._id?.slice(-10);
const refundStatusOf = (p: any) => p.refundStatus ?? (p.refund?.status && p.refund.status !== 'none' ? p.refund.status : null);

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [refundTarget, setRefundTarget] = useState<any | null>(null);
  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const limit = 15;

  const flash = (tone: 'green' | 'red', text: string) => { setNotice({ tone, text }); setTimeout(() => setNotice(null), 5000); };

  useEffect(() => { api.getCompanies({ limit: 100 }).then(r => setCompanies(r.data ?? [])).catch(() => {}); }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPayments({
        page, limit, status, companyId, startDate, endDate: endDate ? `${endDate}T23:59:59` : '', minAmount, maxAmount,
      });
      setPayments(res.data ?? []);
      setTotals(res.totals ?? null);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.pages ?? 1);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, companyId, startDate, endDate, minAmount, maxAmount]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setPage(1); }, [status, companyId, startDate, endDate, minAmount, maxAmount]);

  const openPayment = async (id: string) => {
    try {
      const res = await api.getPaymentById(id);
      setSelected(res.data);
    } catch (e: any) { flash('red', e.message); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.exportData('payments', { startDate, endDate });
      downloadCsv(`payments-${new Date().toISOString().slice(0, 10)}.csv`, res.data?.data ?? []);
    } catch (e: any) { flash('red', e.message); } finally { setExporting(false); }
  };

  const canRefund = (p: any) => p.status === 'successful' && !refundStatusOf(p);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        icon={DollarSign}
        title="Payments"
        subtitle="Transactions, platform fees, company payouts and refunds"
        gradient="from-emerald-500 to-green-600"
        action={<button onClick={handleExport} disabled={exporting} className={btnSecondary}><Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export CSV'}</button>}
      />

      {notice && <div className="mb-4"><Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}

      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
          {[
            { label: 'Successful volume', value: totals.totalAmount, bar: 'from-blue-500 to-blue-600' },
            { label: 'Platform fees', value: totals.totalPlatformFees, bar: 'from-violet-500 to-purple-600' },
            { label: 'Company share', value: totals.totalCompanyRevenue, bar: 'from-emerald-500 to-green-600' },
          ].map((t) => (
            <Card key={t.label} className="relative p-4 sm:p-5 overflow-hidden">
              <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${t.bar}`} />
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums mt-1">{money(t.value)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Matching current filters</p>
            </Card>
          ))}
        </div>
      )}

      <FilterBar>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 w-full">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
            <option value="">All statuses</option>
            {['successful', 'pending', 'processing', 'failed', 'refunded'].map(s => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
          <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={selectCls}>
            <option value="">All companies</option>
            {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={selectCls} aria-label="From date" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={selectCls} aria-label="To date" />
          <input type="number" min={0} placeholder="Min ₦" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className={`${selectCls} sm:w-28`} />
          <input type="number" min={0} placeholder="Max ₦" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className={`${selectCls} sm:w-28`} />
        </div>
      </FilterBar>

      {loading ? <LoadingBlock /> : payments.length === 0 ? <EmptyState icon={DollarSign} text="No payments match these filters" /> : (
        <>
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    {['Reference', 'Customer', 'Company', 'Method', 'Amount', 'Fee', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-blue-700 max-w-[160px] truncate">{refOf(p)}</td>
                      <td className="px-4 py-3"><p className="font-medium text-gray-900 truncate max-w-[160px]">{p.customerId?.name ?? '—'}</p><p className="text-xs text-gray-500 truncate max-w-[160px]">{p.customerId?.email ?? ''}</p></td>
                      <td className="px-4 py-3 text-gray-700 truncate max-w-[140px]">{p.companyId?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{humanize(p.paymentMethod)}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">{money(p.amount)}</td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums whitespace-nowrap">{money(p.platformFee)}</td>
                      <td className="px-4 py-3"><div className="flex flex-wrap gap-1"><Badge status={p.status} />{refundStatusOf(p) && <Badge tone="orange">Refund {humanize(refundStatusOf(p))}</Badge>}</div></td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-0.5">
                          <button onClick={() => openPayment(p._id)} className={iconBtn} title="Details"><Eye className="w-4 h-4 text-gray-600" /></button>
                          {canRefund(p) && <button onClick={() => setRefundTarget(p)} className={iconBtn} title="Record refund"><RotateCcw className="w-4 h-4 text-orange-600" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="lg:hidden space-y-3">
            {payments.map((p) => (
              <Card key={p._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.customerId?.name ?? 'Customer'}</p>
                    <p className="font-mono text-[11px] text-gray-500 truncate">{refOf(p)}</p>
                  </div>
                  <p className="text-base font-bold tabular-nums">{money(p.amount)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-gray-500">
                  <Badge status={p.status} />
                  {refundStatusOf(p) && <Badge tone="orange">Refund {humanize(refundStatusOf(p))}</Badge>}
                  <span>{humanize(p.paymentMethod)} · fee {money(p.platformFee)} · {fmtDate(p.createdAt)}</span>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
                  {canRefund(p) && <button onClick={() => setRefundTarget(p)} className={`${btnSecondary} !py-1.5 !text-orange-700`}><RotateCcw className="w-4 h-4" /> Refund</button>}
                  <button onClick={() => openPayment(p._id)} className={`${btnSecondary} !py-1.5`}><Eye className="w-4 h-4" /> Details</button>
                </div>
              </Card>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {selected && (
        <Modal title="Payment details" subtitle={<Badge status={selected.status} />} size="lg" onClose={() => setSelected(null)}
          footer={canRefund(selected) && <button onClick={() => { setRefundTarget(selected); setSelected(null); }} className={`${btnSecondary} !text-orange-700`}><RotateCcw className="w-4 h-4" /> Record refund</button>}
        >
          <Section title="Transaction">
            <InfoGrid items={[
              ['Amount', <b key="a">{money(selected.amount, selected.currency)}</b>],
              ['Platform fee', money(selected.platformFee)],
              ['Company share', money(selected.companyAmount)],
              ['Gateway', humanize(selected.gateway)],
              ['Method', humanize(selected.paymentMethod)],
              ['Type', humanize(selected.paymentType)],
              ['Reference', <span key="r" className="font-mono text-xs break-all">{refOf(selected)}</span>],
              ['Paid at', fmtDateTime(selected.paidAt)],
              ['Verified at', fmtDateTime(selected.verifiedAt)],
              ['Created', fmtDateTime(selected.createdAt)],
            ]} />
          </Section>
          <Section title="Parties">
            <InfoGrid items={[
              ['Customer', `${selected.customerId?.name ?? '—'} ${selected.customerId?.email ? `(${selected.customerId.email})` : ''}`],
              ['Rider', selected.driverId?.userId?.name ?? '—'],
              ['Company', selected.companyId?.name ?? '—'],
              ['Delivery', <span key="d" className="font-mono text-xs">{selected.deliveryId?.referenceId ?? selected.deliveryId?._id ?? selected.deliveryId ?? '—'}</span>],
            ]} />
          </Section>
          <Section title="Escrow & settlement">
            <InfoGrid items={[
              ['Split type', humanize(selected.escrowDetails?.splitType)],
              ['Platform %', selected.escrowDetails?.platformPercentage != null ? `${selected.escrowDetails.platformPercentage}%` : '—'],
              ['Settled to company', selected.escrowDetails?.settledToCompany ? `Yes, ${fmtDate(selected.escrowDetails.settlementDate)}` : 'No'],
              ['Transfer ID', selected.escrowDetails?.paystackTransferId ?? '—'],
            ]} />
          </Section>
          {(refundStatusOf(selected) || selected.failureReason || selected.errorMessage) && (
            <Section title="Refund / errors">
              <InfoGrid items={[
                ['Refund status', humanize(refundStatusOf(selected))],
                ['Refund amount', money(selected.refundAmount ?? selected.refund?.amount)],
                ['Refund reason', selected.refundReason ?? selected.refund?.reason ?? '—'],
                ['Failure reason', selected.failureReason ?? selected.errorMessage ?? '—'],
              ]} />
            </Section>
          )}
          {(selected.auditLog ?? []).length > 0 && (
            <Section title="Audit log">
              <ul className="text-sm divide-y divide-gray-100 -my-1">
                {selected.auditLog.map((a: any, i: number) => (
                  <li key={i} className="py-1.5 flex justify-between gap-3"><span>{humanize(a.action)}</span><span className="text-xs text-gray-500">{fmtDateTime(a.timestamp ?? a.at)}</span></li>
                ))}
              </ul>
            </Section>
          )}
        </Modal>
      )}

      {refundTarget && (
        <RefundModal
          payment={refundTarget}
          onClose={() => setRefundTarget(null)}
          onDone={() => { setRefundTarget(null); flash('green', 'Refund recorded and customer notified. Remember to send the money via Paystack.'); fetchPayments(); }}
        />
      )}
    </div>
  );
}

function RefundModal({ payment, onClose, onDone }: { payment: any; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.issueRefund(payment._id, reason.trim(), amount ? Number(amount) : undefined);
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Record refund"
      size="sm"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className={`${btnSecondary} flex-1`}>Cancel</button>
          <button onClick={submit} disabled={busy || !reason.trim() || (!!amount && Number(amount) > payment.amount)} className={`${btnDanger} flex-1`}>{busy ? 'Saving…' : 'Record refund'}</button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500">Original payment</p>
          <p className="text-xl font-bold tabular-nums">{money(payment.amount)}</p>
          <p className="text-xs text-gray-500">{payment.customerId?.name ?? ''}</p>
        </div>
        <div className="flex items-start gap-2 bg-amber-50 ring-1 ring-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          This only records the refund and notifies the customer. It does not send money back — issue the actual refund from the Paystack dashboard.
        </div>
        <Field label="Amount" hint="Leave blank to refund the full amount">
          <input type="number" min={1} max={payment.amount} value={amount} onChange={e => setAmount(e.target.value)} placeholder={String(payment.amount)} className={inputCls} />
        </Field>
        <Field label="Reason *">
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g. Item not delivered" className={`${inputCls} resize-none`} />
        </Field>
        {error && <Notice tone="red">{error}</Notice>}
      </div>
    </Modal>
  );
}

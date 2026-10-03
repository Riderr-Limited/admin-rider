'use client';

import React, { useEffect, useState } from 'react';
import {
  Package, Users, Building2, DollarSign, Bike, Wallet, AlertCircle, ArrowRight, Star, RefreshCw, Database,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { api } from '@/lib/api';
import { Card, Badge, LoadingBlock, compactMoney, money, fmtDateTime, humanize, selectCls } from './ui';

const SERIES = '#2563eb';
const GRID = '#e5e7eb';
const AXIS = '#6b7280';

function Kpi({ title, value, sub, icon: Icon, gradient }: { title: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ElementType; gradient: string }) {
  return (
    <Card className="relative p-4 sm:p-5 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums truncate">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1 truncate">{sub}</p>}
        </div>
        <div className={`bg-gradient-to-br ${gradient} p-2 sm:p-2.5 rounded-xl shadow-sm flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </Card>
  );
}

function ChartTooltip({ active, payload, label, format }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg ring-1 ring-gray-900/10 px-3 py-2 text-xs">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 tabular-nums">{format(payload[0].value)}</p>
    </div>
  );
}

const shortDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

export default function Overview({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);
  const [completionRate, setCompletionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30days');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.dashboard(period),
      api.systemStats().catch(() => null),
      api.analytics({ period, metric: 'deliveries' }).catch(() => null),
    ])
      .then(([dash, sys, analytics]) => {
        setData(dash.data);
        setSystem(sys?.data ?? null);
        const rate = analytics?.data?.completionRate;
        setCompletionRate(typeof rate === 'number' ? rate : null);
      })
      .catch((e) => setError(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [period, reloadKey]);

  const periodLabel = { '7days': 'last 7 days', '30days': 'last 30 days', '90days': 'last 90 days' }[period];
  const daily: any[] = (data?.deliveries?.dailyStats ?? []).map((d: any) => ({ date: shortDate(d._id), count: d.count, revenue: d.revenue ?? 0 }));
  const byStatus: { status: string; count: number }[] = (data?.deliveries?.byStatus ?? [])
    .map((s: any) => ({ status: s._id ?? 'unknown', count: s.count ?? 0 }))
    .sort((a: any, b: any) => b.count - a.count);
  const maxStatus = Math.max(1, ...byStatus.map(s => s.count));
  const roles: Record<string, number> = Object.fromEntries((data?.users?.byRole ?? []).map((r: any) => [r._id, r.count]));
  const topRated: any[] = data?.drivers?.topRated ?? [];
  const recent: any[] = data?.recentActivities ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-5 sm:mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Platform activity for the {periodLabel}</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className={selectCls}>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
          <button onClick={() => setReloadKey(k => k + 1)} className="p-2.5 bg-white ring-1 ring-gray-300 rounded-xl hover:bg-gray-50" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm ring-1 ring-red-600/20">{error}</div>}

      {loading && !data ? <LoadingBlock /> : data && (
        <>
          {/* Needs attention */}
          {(data.companies?.pending > 0) && (
            <button
              onClick={() => onNavigate?.('companies')}
              className="w-full mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 ring-1 ring-amber-600/20 text-left hover:bg-amber-100 transition-colors"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-900 flex-1">
                <b>{data.companies.pending}</b> compan{data.companies.pending === 1 ? 'y is' : 'ies are'} waiting for approval
              </span>
              <ArrowRight className="w-4 h-4 text-amber-700" />
            </button>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
            <Kpi title="Deliveries" value={(data.deliveries?.thisPeriod?.count ?? 0).toLocaleString()} sub={`${(data.deliveries?.total ?? 0).toLocaleString()} all-time`} icon={Package} gradient="from-blue-500 to-blue-600" />
            <Kpi title="Revenue" value={compactMoney(data.revenue?.totalRevenue)} sub={`${data.revenue?.totalTransactions ?? 0} successful payments`} icon={DollarSign} gradient="from-emerald-500 to-green-600" />
            <Kpi title="Platform fees" value={compactMoney(data.revenue?.platformFees)} sub={`Avg ticket ${compactMoney(data.revenue?.avgTransactionValue)}`} icon={Wallet} gradient="from-violet-500 to-purple-600" />
            <Kpi title="Completion rate" value={completionRate != null ? `${completionRate.toFixed(1)}%` : '—'} sub={`Avg fare ${compactMoney(data.deliveries?.thisPeriod?.avgFare)}`} icon={Star} gradient="from-amber-500 to-orange-500" />
            <Kpi title="Riders online" value={`${data.drivers?.online ?? 0} / ${data.drivers?.total ?? 0}`} sub={`${data.drivers?.available ?? 0} available now`} icon={Bike} gradient="from-teal-500 to-emerald-600" />
            <Kpi title="Users" value={(data.users?.total ?? 0).toLocaleString()} sub={`+${data.users?.newThisPeriod ?? 0} new · ${data.users?.active ?? 0} active`} icon={Users} gradient="from-indigo-500 to-blue-600" />
            <Kpi title="Companies" value={data.companies?.total ?? 0} sub={`${data.companies?.active ?? 0} active · ${data.companies?.pending ?? 0} pending`} icon={Building2} gradient="from-orange-500 to-amber-600" />
            <Kpi title="Customers / Riders" value={`${roles.customer ?? 0} / ${roles.driver ?? 0}`} sub={`${roles.company_admin ?? 0} company admins · ${roles.admin ?? 0} admins`} icon={Users} gradient="from-sky-500 to-cyan-600" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-base font-bold text-gray-900">Deliveries per day</h2>
              <p className="text-xs text-gray-500 mb-4">Orders created, {periodLabel}</p>
              {daily.length === 0 ? <p className="text-sm text-gray-400 py-16 text-center">No deliveries in this period</p> : (
                <div className="h-56 sm:h-64 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dlv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SERIES} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                      <Tooltip content={<ChartTooltip format={(v: number) => `${v} deliveries`} />} cursor={{ stroke: AXIS, strokeDasharray: '3 3' }} />
                      <Area type="monotone" dataKey="count" stroke={SERIES} strokeWidth={2} fill="url(#dlv)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-4 sm:p-6">
              <h2 className="text-base font-bold text-gray-900">Delivery value per day</h2>
              <p className="text-xs text-gray-500 mb-4">Sum of quoted fares, {periodLabel}</p>
              {daily.length === 0 ? <p className="text-sm text-gray-400 py-16 text-center">No deliveries in this period</p> : (
                <div className="h-56 sm:h-64 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => compactMoney(v)} />
                      <Tooltip content={<ChartTooltip format={(v: number) => money(v)} />} cursor={{ fill: '#f3f4f6' }} />
                      <Bar dataKey="revenue" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-6">
            {/* Status breakdown */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Deliveries by status <span className="text-xs font-normal text-gray-500">(all-time)</span></h2>
              {byStatus.length === 0 ? <p className="text-sm text-gray-400">No data</p> : (
                <ul className="space-y-3">
                  {byStatus.map(s => (
                    <li key={s.status}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{humanize(s.status)}</span>
                        <span className="font-semibold text-gray-900 tabular-nums">{s.count.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(s.count / maxStatus) * 100}%`, background: SERIES }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Top rated riders */}
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Top rated riders</h2>
                <button onClick={() => onNavigate?.('riders')} className="text-xs font-semibold text-blue-600 hover:underline">View all</button>
              </div>
              {topRated.length === 0 ? <p className="text-sm text-gray-400">No riders yet</p> : (
                <ul className="divide-y divide-gray-100">
                  {topRated.slice(0, 6).map((d: any, i: number) => (
                    <li key={d._id ?? i} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.name ?? 'Unnamed rider'}</p>
                        <p className="text-xs text-gray-500 capitalize">{d.vehicleType ?? '—'}</p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-semibold text-gray-900 tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {Number(d.rating?.average ?? d.rating ?? 0).toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* System record counts */}
            <Card className="p-4 sm:p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-gray-400" /> Records</h2>
              {system ? (
                <dl className="grid grid-cols-2 gap-2">
                  {Object.entries(system).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-xl px-3 py-2">
                      <dt className="text-[11px] text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd className="text-base font-bold text-gray-900 tabular-nums">{Number(v).toLocaleString()}</dd>
                    </div>
                  ))}
                </dl>
              ) : <p className="text-sm text-gray-400">Unavailable</p>}
            </Card>
          </div>

          {/* Recent deliveries */}
          <Card>
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Latest deliveries</h2>
                <p className="text-xs text-gray-500">10 most recent orders</p>
              </div>
              <button onClick={() => onNavigate?.('deliveries')} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                All deliveries <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {recent.length === 0 ? <div className="p-10 text-center text-sm text-gray-500">No recent deliveries</div> : (
              <ul className="divide-y divide-gray-100">
                {recent.map((d: any) => (
                  <li key={d._id} className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {d.pickup?.address ?? '—'} <span className="text-gray-400">→</span> {d.dropoff?.address ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {d.customerId?.name ?? 'Customer'} · {d.driverId?.userId?.name ? `Rider: ${d.driverId.userId.name}` : 'No rider yet'} · {fmtDateTime(d.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">{money(d.fare?.totalFare)}</span>
                      <Badge status={d.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

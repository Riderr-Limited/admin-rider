'use client';

import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, Users, ArrowRight, Building2, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

export default function Overview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    api.dashboard(period)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = [
    {
      title: 'TOTAL DELIVERIES',
      value: data?.deliveries?.total ?? 0,
      icon: Package,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'TOTAL REVENUE',
      value: `₦${((data?.revenue?.totalRevenue ?? 0) / 1000).toFixed(0)}K`,
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'TOTAL DRIVERS',
      value: data?.drivers?.total ?? 0,
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'ONLINE NOW',
      value: data?.drivers?.online ?? 0,
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'COMPANIES',
      value: data?.companies?.total ?? 0,
      icon: Building2,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      title: 'TOTAL USERS',
      value: data?.users?.total ?? 0,
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  ];

  const recentActivities: any[] = data?.recentActivities ?? [];

  const statusColor: Record<string, string> = {
    delivered: 'text-green-600 bg-green-100',
    in_transit: 'text-blue-600 bg-blue-100',
    cancelled: 'text-red-600 bg-red-100',
    pending_driver: 'text-yellow-600 bg-yellow-100',
    driver_assigned: 'text-purple-600 bg-purple-100',
    picked_up: 'text-indigo-600 bg-indigo-100',
    created: 'text-gray-600 bg-gray-100',
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening.</p>
        </div>
        <select
          value={period}
          onChange={(e) => { setPeriod(e.target.value); setLoading(true); }}
          className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="90days">Last 90 days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.iconBg} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Status Breakdown */}
      {data?.deliveries?.byStatus && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Status Breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.deliveries.byStatus).map(([status, count]: any) => (
              <div key={status} className={`px-4 py-2 rounded-xl text-sm font-medium ${statusColor[status] ?? 'bg-gray-100 text-gray-600'}`}>
                {status.replace(/_/g, ' ')}: <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
                <p className="text-sm text-gray-500">Latest platform activity</p>
              </div>
            </div>
          </div>
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No recent activities</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentActivities.slice(0, 10).map((activity: any, i: number) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.description ?? activity.type}</p>
                  <p className="text-xs text-gray-500">{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}</p>
                </div>
                {activity.status && (
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColor[activity.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {activity.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

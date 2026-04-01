import React from 'react';
import { Package, TrendingUp, Users, ArrowRight } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

interface Delivery {
  id: string;
  pickup: {
    name: string;
    address: string;
  };
  dropoff: {
    name: string;
    address: string;
  };
  amount: string;
  status: string;
  date: string;
}

const Overview: React.FC = () => {
  const stats: StatCard[] = [
    {
      title: 'TOTAL DELIVERIES',
      value: '4',
      icon: Package,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'TOTAL REVENUE',
      value: 'NGN 0',
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'TOTAL DRIVERS',
      value: '7',
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'ONLINE NOW',
      value: '5',
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ];

  const recentDeliveries: Delivery[] = [
    {
      id: 'RID-1770239277898-0322C5',
      pickup: {
        name: 'name',
        address: 'Abuja'
      },
      dropoff: {
        name: 'name',
        address: 'Sudan Street, Abuja, Nigeria'
      },
      amount: 'NGN 0',
      status: 'Delivered',
      date: 'February 4, 2026'
    }
  ];

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back, Company Rider Admin! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.iconBg} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Deliveries */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Recent Deliveries</h2>
                <p className="text-sm text-gray-500">Latest delivery requests and updates</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pickup
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dropoff
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-blue-600">{delivery.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{delivery.pickup.name}</p>
                        <p className="text-xs text-gray-500">{delivery.pickup.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <div className="bg-green-100 p-1.5 rounded-full mt-0.5">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{delivery.dropoff.name}</p>
                        <p className="text-xs text-gray-500">{delivery.dropoff.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{delivery.amount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-600">{delivery.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{delivery.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
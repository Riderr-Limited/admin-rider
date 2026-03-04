'use client';

import React, { useState } from 'react';
import { Package, Search, MapPin, Clock, CheckCircle, XCircle, Download } from 'lucide-react';

type DeliveryStatus = 'completed' | 'in-progress' | 'failed';

interface Delivery {
  id: string;
  from: string;
  fromAddress: string;
  to: string;
  toAddress: string;
  rider: string;
  riderPhone: string;
  customer: string;
  customerPhone: string;
  status: DeliveryStatus;
  price: number;
  distance: string;
  time: string;
  timestamp: string;
  company: string;
}

const Deliveries: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('today');

  const deliveries: Delivery[] = [
    {
      id: 'DEL-8472',
      from: 'Ikeja City Mall',
      fromAddress: '15 Obafemi Awolowo Way, Ikeja',
      to: 'Victoria Island Office',
      toAddress: '23 Adeola Odeku Street, VI',
      rider: 'Chinedu Okafor',
      riderPhone: '+234 801 234 5678',
      customer: 'Aisha Ibrahim',
      customerPhone: '+234 809 123 4567',
      status: 'completed',
      price: 3500,
      distance: '12.5km',
      time: '12 min ago',
      timestamp: '2025-02-12 14:23',
      company: 'Swift Logistics'
    },
    {
      id: 'DEL-8471',
      from: 'Lekki Shopping Center',
      fromAddress: '42 Admiralty Way, Lekki Phase 1',
      to: 'Surulere Residence',
      toAddress: '78 Adeniran Ogunsanya Street',
      rider: 'Amina Kazeem',
      riderPhone: '+234 802 345 6789',
      customer: 'Tunde Williams',
      customerPhone: '+234 810 234 5678',
      status: 'in-progress',
      price: 4200,
      distance: '15.8km',
      time: '18 min ago',
      timestamp: '2025-02-12 14:17',
      company: 'FastTrack Couriers'
    },
    {
      id: 'DEL-8470',
      from: 'Yaba Tech Hub',
      fromAddress: '5 Herbert Macaulay Way, Yaba',
      to: 'Ajah Estate',
      toAddress: '12 Badore Road, Ajah',
      rider: 'Tunde Adebayo',
      riderPhone: '+234 803 456 7890',
      customer: 'Ngozi Obi',
      customerPhone: '+234 811 345 6789',
      status: 'completed',
      price: 5100,
      distance: '18.3km',
      time: '25 min ago',
      timestamp: '2025-02-12 14:10',
      company: 'Metro Riders'
    },
    {
      id: 'DEL-8469',
      from: 'Ikoyi Restaurant',
      fromAddress: '89 Awolowo Road, Ikoyi',
      to: 'Maryland Office',
      toAddress: '34 Ikorodu Road, Maryland',
      rider: 'Blessing Eze',
      riderPhone: '+234 804 567 8901',
      customer: 'Emeka Nwankwo',
      customerPhone: '+234 812 456 7890',
      status: 'in-progress',
      price: 3800,
      distance: '10.2km',
      time: '31 min ago',
      timestamp: '2025-02-12 14:04',
      company: 'Swift Logistics'
    },
    {
      id: 'DEL-8468',
      from: 'Festac Pharmacy',
      fromAddress: '23 2nd Avenue, Festac Town',
      to: 'Apapa Port',
      toAddress: '45 Warehouse Road, Apapa',
      rider: 'Ibrahim Musa',
      riderPhone: '+234 805 678 9012',
      customer: 'Sarah Okafor',
      customerPhone: '+234 813 567 8901',
      status: 'failed',
      price: 4500,
      distance: '14.7km',
      time: '1 hour ago',
      timestamp: '2025-02-12 13:35',
      company: 'QuickMove Express'
    }
  ];

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.rider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalStats = {
    total: deliveries.length,
    completed: deliveries.filter(d => d.status === 'completed').length,
    inProgress: deliveries.filter(d => d.status === 'in-progress').length,
    failed: deliveries.filter(d => d.status === 'failed').length,
    revenue: deliveries.filter(d => d.status === 'completed').reduce((sum, d) => sum + d.price, 0)
  };

  const getStatusColor = (status: DeliveryStatus): string => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: DeliveryStatus) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deliveries</h1>
        <p className="text-gray-600">Track and manage all deliveries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.completed}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">In Progress</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.inProgress}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Failed</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.failed}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₦{(totalStats.revenue / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, customer, or rider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {filteredDeliveries.map((delivery) => (
          <div key={delivery.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{delivery.id}</h3>
                    <p className="text-sm text-gray-500">{delivery.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                    {getStatusIcon(delivery.status)}
                    {delivery.status === 'in-progress' ? 'In Progress' : delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                  </span>
                  <span className="text-lg font-bold text-gray-900">₦{delivery.price.toLocaleString()}</span>
                </div>
              </div>

              {/* Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                    <MapPin className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900">Pickup</p>
                      <p className="text-sm text-gray-600">{delivery.from}</p>
                      <p className="text-xs text-gray-500">{delivery.fromAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Drop-off</p>
                      <p className="text-sm text-gray-600">{delivery.to}</p>
                      <p className="text-xs text-gray-500">{delivery.toAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Rider</p>
                    <p className="text-sm font-medium text-gray-900">{delivery.rider}</p>
                    <p className="text-xs text-gray-500">{delivery.riderPhone}</p>
                    <p className="text-xs text-blue-600 mt-1">{delivery.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Customer</p>
                    <p className="text-sm font-medium text-gray-900">{delivery.customer}</p>
                    <p className="text-xs text-gray-500">{delivery.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{delivery.distance}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{delivery.timestamp}</span>
                  </div>
                </div>
                <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No deliveries found</p>
        </div>
      )}
    </div>
  );
};

export default Deliveries;
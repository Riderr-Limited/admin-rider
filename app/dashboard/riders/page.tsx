'use client';

import React, { useState } from 'react';
import { Users, Search, Plus, MapPin, Star, TrendingUp, Package } from 'lucide-react';

interface Rider {
  id: number;
  name: string;
  phone: string;
  company: string;
  deliveries: number;
  rating: number;
  status: 'active' | 'offline';
  location: string;
  joinDate: string;
  earnings: number;
}

const Riders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const riders: Rider[] = [
    { 
      id: 1,
      name: 'Chinedu Okafor', 
      phone: '+234 801 234 5678',
      company: 'Swift Logistics',
      deliveries: 127,
      rating: 4.9,
      status: 'active',
      location: 'Ikeja, Lagos',
      joinDate: '2024-08-20',
      earnings: 456000
    },
    { 
      id: 2,
      name: 'Amina Kazeem', 
      phone: '+234 802 345 6789',
      company: 'FastTrack Couriers',
      deliveries: 118,
      rating: 4.8,
      status: 'active',
      location: 'Victoria Island, Lagos',
      joinDate: '2024-09-15',
      earnings: 423000
    },
    { 
      id: 3,
      name: 'Tunde Adebayo', 
      phone: '+234 803 456 7890',
      company: 'Metro Riders',
      deliveries: 112,
      rating: 4.9,
      status: 'active',
      location: 'Surulere, Lagos',
      joinDate: '2024-10-08',
      earnings: 401000
    },
    { 
      id: 4,
      name: 'Blessing Eze', 
      phone: '+234 804 567 8901',
      company: 'Swift Logistics',
      deliveries: 98,
      rating: 4.7,
      status: 'active',
      location: 'Lekki, Lagos',
      joinDate: '2024-10-25',
      earnings: 352000
    },
    { 
      id: 5,
      name: 'Ibrahim Musa', 
      phone: '+234 805 678 9012',
      company: 'QuickMove Express',
      deliveries: 94,
      rating: 4.8,
      status: 'active',
      location: 'Yaba, Lagos',
      joinDate: '2024-11-10',
      earnings: 337000
    },
    { 
      id: 6,
      name: 'Ngozi Okonkwo', 
      phone: '+234 806 789 0123',
      company: 'Urban Dispatch',
      deliveries: 87,
      rating: 4.6,
      status: 'active',
      location: 'Ajah, Lagos',
      joinDate: '2024-11-28',
      earnings: 312000
    },
    { 
      id: 7,
      name: 'Yusuf Abdullahi', 
      phone: '+234 807 890 1234',
      company: 'FastTrack Couriers',
      deliveries: 82,
      rating: 4.9,
      status: 'offline',
      location: 'Maryland, Lagos',
      joinDate: '2024-12-05',
      earnings: 294000
    },
    { 
      id: 8,
      name: 'Chioma Nwosu', 
      phone: '+234 808 901 2345',
      company: 'Metro Riders',
      deliveries: 76,
      rating: 4.7,
      status: 'active',
      location: 'Ikoyi, Lagos',
      joinDate: '2024-12-18',
      earnings: 273000
    }
  ];

  const companies = ['all', ...Array.from(new Set(riders.map(r => r.company)))];

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rider.phone.includes(searchTerm);
    const matchesCompany = filterCompany === 'all' || rider.company === filterCompany;
    const matchesStatus = filterStatus === 'all' || rider.status === filterStatus;
    return matchesSearch && matchesCompany && matchesStatus;
  });

  const totalStats = {
    totalRiders: riders.length,
    activeRiders: riders.filter(r => r.status === 'active').length,
    totalDeliveries: riders.reduce((sum, r) => sum + r.deliveries, 0),
    avgRating: (riders.reduce((sum, r) => sum + r.rating, 0) / riders.length).toFixed(1)
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Riders</h1>
        <p className="text-gray-600">Manage your delivery riders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Riders</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.totalRiders}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Active Now</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.activeRiders}</p>
              <p className="text-green-600 text-xs mt-2 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" />
                Online
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Deliveries</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.totalDeliveries}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Avg Rating</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.avgRating}</p>
              <div className="flex items-center gap-0.5 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <Star className="w-6 h-6 text-yellow-600" />
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
                placeholder="Search riders by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Companies</option>
              {companies.filter(c => c !== 'all').map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="offline">Offline</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              Add Rider
            </button>
          </div>
        </div>
      </div>

      {/* Riders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRiders.map((rider) => (
          <div key={rider.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Rider Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {rider.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{rider.name}</h3>
                    <p className="text-sm text-gray-500">{rider.phone}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  rider.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {rider.status}
                </span>
              </div>

              {/* Company & Location */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package className="w-4 h-4" />
                  <span>{rider.company}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{rider.location}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Deliveries</p>
                  <p className="text-lg font-bold text-gray-900">{rider.deliveries}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <p className="text-lg font-bold text-gray-900">{rider.rating}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Earnings</p>
                  <p className="text-sm font-bold text-gray-900">₦{(rider.earnings / 1000).toFixed(0)}K</p>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full mt-4 py-2.5 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRiders.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No riders found</p>
        </div>
      )}
    </div>
  );
};

export default Riders;
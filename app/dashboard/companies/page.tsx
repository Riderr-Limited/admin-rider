'use client';

import React, { useState } from 'react';
import { Building2, Users, Package, Search, Plus, Eye, Edit, MoreVertical } from 'lucide-react';

interface Company {
  id: number;
  name: string;
  riders: number;
  deliveries: number;
  revenue: number;
  status: 'active' | 'pending';
  joinDate: string;
  contact: string;
  phone: string;
}

const Companies: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const companies: Company[] = [
    { 
      id: 1,
      name: 'Swift Logistics', 
      riders: 45, 
      deliveries: 892,
      revenue: 1284000,
      status: 'active',
      joinDate: '2024-08-15',
      contact: 'contact@swiftlogistics.ng',
      phone: '+234 801 234 5678'
    },
    { 
      id: 2,
      name: 'FastTrack Couriers', 
      riders: 32, 
      deliveries: 645,
      revenue: 896500,
      status: 'active',
      joinDate: '2024-09-10',
      contact: 'info@fasttrack.ng',
      phone: '+234 802 345 6789'
    },
    { 
      id: 3,
      name: 'Metro Riders', 
      riders: 28, 
      deliveries: 521,
      revenue: 745200,
      status: 'active',
      joinDate: '2024-10-05',
      contact: 'hello@metroriders.ng',
      phone: '+234 803 456 7890'
    },
    { 
      id: 4,
      name: 'QuickMove Express', 
      riders: 21, 
      deliveries: 389,
      revenue: 556800,
      status: 'active',
      joinDate: '2024-10-20',
      contact: 'support@quickmove.ng',
      phone: '+234 804 567 8901'
    },
    { 
      id: 5,
      name: 'Urban Dispatch', 
      riders: 18, 
      deliveries: 267,
      revenue: 382000,
      status: 'active',
      joinDate: '2024-11-12',
      contact: 'team@urbandispatch.ng',
      phone: '+234 805 678 9012'
    },
    { 
      id: 6,
      name: 'City Movers', 
      riders: 12, 
      deliveries: 133,
      revenue: 190400,
      status: 'pending',
      joinDate: '2025-01-18',
      contact: 'info@citymovers.ng',
      phone: '+234 806 789 0123'
    }
  ];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || company.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalStats = {
    companies: companies.length,
    activeCompanies: companies.filter(c => c.status === 'active').length,
    totalRiders: companies.reduce((sum, c) => sum + c.riders, 0),
    totalRevenue: companies.reduce((sum, c) => sum + c.revenue, 0)
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Companies</h1>
        <p className="text-gray-600">Manage your logistics partners</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.companies}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Active Partners</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.activeCompanies}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Riders</p>
              <p className="text-3xl font-bold text-gray-900">{totalStats.totalRiders}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₦{(totalStats.totalRevenue / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search companies..."
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
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              Add Company
            </button>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Riders</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deliveries</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{company.contact}</div>
                    <div className="text-xs text-gray-500">{company.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{company.riders}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.deliveries.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">₦{(company.revenue / 1000).toLocaleString()}K</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      company.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(company.joinDate).toLocaleDateString('en-NG', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View Details">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="More Options">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No companies found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Companies;
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, Users, DollarSign, AlertCircle, CheckCircle, Clock, Phone, Mail, MapPin, Search, Filter, Download, Eye, Edit, Trash2, Bell, Settings, Menu, X } from 'lucide-react';

const RiderDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sample data - replace with real API calls
  const revenueData = [
    { month: 'Jan', revenue: 45000, deliveries: 1200 },
    { month: 'Feb', revenue: 52000, deliveries: 1450 },
    { month: 'Mar', revenue: 48000, deliveries: 1350 },
    { month: 'Apr', revenue: 61000, deliveries: 1680 },
    { month: 'May', revenue: 58000, deliveries: 1590 },
    { month: 'Jun', revenue: 67000, deliveries: 1820 },
  ];

  const partnersData = [
    { id: 1, name: 'Swift Logistics', riders: 45, status: 'active', revenue: 28000, deliveries: 890, rating: 4.8 },
    { id: 2, name: 'Express Delivery Co', riders: 32, status: 'active', revenue: 19500, deliveries: 620, rating: 4.6 },
    { id: 3, name: 'FastTrack Services', riders: 28, status: 'active', revenue: 15200, deliveries: 480, rating: 4.7 },
    { id: 4, name: 'Metro Couriers', riders: 18, status: 'inactive', revenue: 4300, deliveries: 130, rating: 4.3 },
  ];

  const customerIssues = [
    { id: 1, customer: 'John Doe', issue: 'Delayed delivery', status: 'pending', priority: 'high', time: '2 hours ago' },
    { id: 2, customer: 'Jane Smith', issue: 'Package damaged', status: 'resolved', priority: 'medium', time: '5 hours ago' },
    { id: 3, customer: 'Mike Johnson', issue: 'Wrong address', status: 'in-progress', priority: 'high', time: '1 hour ago' },
    { id: 4, customer: 'Sarah Williams', issue: 'Rider not responding', status: 'pending', priority: 'urgent', time: '30 min ago' },
  ];

  const deliveryStatusData = [
    { name: 'Completed', value: 1820, color: '#10b981' },
    { name: 'In Transit', value: 245, color: '#3b82f6' },
    { name: 'Pending', value: 89, color: '#f59e0b' },
    { name: 'Cancelled', value: 34, color: '#ef4444' },
  ];

  // Stats cards data
  const stats = [
    { label: 'Total Revenue', value: '₦67,000', change: '+15.3%', icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Active Partners', value: '12', change: '+2', icon: Users, color: 'bg-orange-500' },
    { label: 'Total Deliveries', value: '1,820', change: '+12.5%', icon: Package, color: 'bg-purple-500' },
    { label: 'Pending Issues', value: '8', change: '-3', icon: AlertCircle, color: 'bg-red-500' },
  ];

  const Sidebar = () => (
    <div className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col shadow-xl`}>
      <div className="p-3 flex items-center justify-between border-b border-gray-700">
        {sidebarOpen && (
          <Image src="/logo.png" alt="Riderr Logo" width={100} height={40} className="object-contain" />
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 p-3 space-y-1">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'partners', label: 'Partners', icon: Users },
          { id: 'revenue', label: 'Revenue', icon: DollarSign },
          { id: 'deliveries', label: 'Deliveries', icon: Package },
          { id: 'customer-service', label: 'Customer Service', icon: Phone },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
              activeTab === item.id 
                ? 'bg-orange-500 shadow-lg transform scale-105' 
                : 'hover:bg-gray-700 hover:translate-x-1'
            }`}
          >
            <item.icon size={18} />
            {sidebarOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} p-2 rounded-lg shadow-sm`}>
                <stat.icon className="text-white" size={20} />
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-500 text-xs font-medium mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Delivery Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deliveryStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={75}
                fill="#8884d8"
                dataKey="value"
                style={{ fontSize: '11px' }}
              >
                {deliveryStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Recent Customer Issues</h3>
        <div className="space-y-2">
          {customerIssues.slice(0, 3).map((issue) => (
            <div key={issue.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-all duration-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  issue.priority === 'urgent' ? 'bg-red-500' :
                  issue.priority === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{issue.customer}</p>
                  <p className="text-xs text-gray-600">{issue.issue}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{issue.time}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  issue.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {issue.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PartnersTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Logistics Partners</h2>
        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 shadow hover:shadow-lg transition-all text-sm">
          <Users size={18} />
          Add Partner
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search partners..."
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={16} />
              Filter
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Partner Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Riders</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deliveries</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {partnersData.map((partner) => (
                <tr key={partner.id} className="hover:bg-orange-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-gray-900 text-sm">{partner.name}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">{partner.riders}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">{partner.deliveries}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-bold text-sm">₦{partner.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-900 font-semibold text-sm">{partner.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      partner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {partner.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors" title="View">
                        <Eye size={14} className="text-blue-600" />
                      </button>
                      <button className="p-1.5 hover:bg-green-100 rounded-lg transition-colors" title="Edit">
                        <Edit size={14} className="text-green-600" />
                      </button>
                      <button className="p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={14} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const RevenueTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Revenue Analytics</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <select className="w-full sm:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            <option>Last 6 months</option>
            <option>Last 12 months</option>
            <option>This year</option>
          </select>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-4 border border-green-200">
          <h3 className="text-green-700 text-xs font-semibold mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-900">₦331,000</p>
          <p className="text-xs text-green-700 mt-1 font-medium">↑ 18.2% from last period</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 border border-blue-200">
          <h3 className="text-blue-700 text-xs font-semibold mb-1">Average Order Value</h3>
          <p className="text-3xl font-bold text-blue-900">₦182</p>
          <p className="text-xs text-blue-700 mt-1 font-medium">↑ 5.3% from last period</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 border border-purple-200">
          <h3 className="text-purple-700 text-xs font-semibold mb-1">Commission Earned</h3>
          <p className="text-3xl font-bold text-purple-900">₦49,650</p>
          <p className="text-xs text-purple-700 mt-1 font-medium">15% of total revenue</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Revenue & Deliveries Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar yAxisId="left" dataKey="revenue" fill="#f97316" name="Revenue (₦)" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="right" dataKey="deliveries" fill="#10b981" name="Deliveries" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const CustomerServiceTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Customer Service</h2>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
            {customerIssues.filter(i => i.status === 'pending').length} Pending
          </span>
          <button className="bg-orange-500 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-orange-600 shadow hover:shadow-lg transition-all">
            View All Tickets
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
          <p className="text-xs text-gray-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <p className="text-xs text-gray-600 font-medium">In Progress</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">12</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <p className="text-xs text-gray-600 font-medium">Resolved</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
          <p className="text-xs text-gray-600 font-medium">Avg Response Time</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">18m</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-3 border-b flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search issues..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option>All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
            <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option>All Priority</option>
              <option>Urgent</option>
              <option>High</option>
              <option>Medium</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {customerIssues.map((issue) => (
            <div key={issue.id} className="p-3 hover:bg-orange-50 transition-colors">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                      issue.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      issue.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {issue.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      issue.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {issue.status}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{issue.time}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-0.5">{issue.customer}</h4>
                  <p className="text-gray-600 text-sm">{issue.issue}</p>
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <button className="flex-1 lg:flex-none px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 lg:flex-none px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-xs font-medium shadow hover:shadow-lg transition-all">
                    Respond
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-10 gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {activeTab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={18} className="text-gray-700" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-900">Admin User</p>
                <p className="text-xs text-gray-600">Riderr Team</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow text-sm">
                A
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-3 sm:p-4">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'partners' && <PartnersTab />}
          {activeTab === 'revenue' && <RevenueTab />}
          {activeTab === 'customer-service' && <CustomerServiceTab />}
          {activeTab === 'deliveries' && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Package size={40} className="mx-auto text-orange-500 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Deliveries Management</h3>
              <p className="text-sm text-gray-600">Track and manage all deliveries in real-time</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Settings size={40} className="mx-auto text-gray-500 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Settings</h3>
              <p className="text-sm text-gray-600">Configure your dashboard preferences and system settings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
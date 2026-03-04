'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Package, Users, Building2, LayoutDashboard, User, Settings, LogOut, Bell } from 'lucide-react';
import Overview from './dashboard/OverviewTab';
import Companies from './dashboard/companies/page';
import Riders from './dashboard/riders/page';
import Deliveries from './dashboard/deliveries/page';

type PageType = 'overview' | 'deliveries' | 'riders' | 'companies';

interface NavigationItem {
  id: PageType;
  name: string;
  icon: React.ElementType;
}

const RiderrDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('overview');

  const navigation: NavigationItem[] = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'riders', name: 'Riders', icon: Users },
    { id: 'deliveries', name: 'Deliveries', icon: Package },
  ];

  const renderPage = () => {
    switch(currentPage) {
      case 'overview':
        return <Overview />;
      case 'deliveries':
        return <Deliveries />;
      case 'riders':
        return <Riders />;
      case 'companies':
        return <Companies />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-blue-600 flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <Image src="/logo.png" alt="RIDERR" width={120} height={40} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'text-white hover:bg-blue-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-blue-500 transition-all">
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-blue-500 transition-all">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-800 text-white hover:bg-blue-700 transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-end gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">Company Rider Admin</p>
                <p className="text-xs text-gray-500">Company Admin</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                C
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default RiderrDashboard;
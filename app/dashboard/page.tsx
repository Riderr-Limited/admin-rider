'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, Users, Building2, LayoutDashboard, User, LogOut, Bell, DollarSign, MessageSquare } from 'lucide-react';
import Overview from './OverviewTab';
import UsersPage from './users/page';
import Companies from './companies/page';
import Riders from './riders/page';
import Deliveries from './deliveries/page';
import Payments from './payments/page';
import Support from './support/page';
import Notifications from './notifications/page';
import Profile from './ProfileTab';
import { api } from '@/lib/api';

type PageType = 'overview' | 'users' | 'riders' | 'deliveries' | 'companies' | 'payments' | 'support' | 'notifications' | 'profile';

const navigation: { id: PageType; name: string; icon: React.ElementType }[] = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'users', name: 'Users', icon: Users },
  { id: 'riders', name: 'Riders', icon: Users },
  { id: 'deliveries', name: 'Deliveries', icon: Package },
  { id: 'companies', name: 'Companies', icon: Building2 },
  { id: 'payments', name: 'Payments', icon: DollarSign },
  { id: 'support', name: 'Support', icon: MessageSquare },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

export default function RiderrDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<PageType>('overview');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.role !== 'admin') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.replace('/login');
        return;
      }
      setUser(parsed);
    }
  }, [router]);

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <Overview />;
      case 'users': return <UsersPage />;
      case 'riders': return <Riders />;
      case 'deliveries': return <Deliveries />;
      case 'companies': return <Companies />;
      case 'payments': return <Payments />;
      case 'support': return <Support />;
      case 'notifications': return <Notifications />;
      case 'profile': return <Profile />;
      default: return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-blue-600 flex flex-col">
        <div className="p-6">
          <Image src="/logo.png" alt="RIDERR" width={120} height={40} className="rounded-lg" />
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-blue-500 text-white' : 'text-white hover:bg-blue-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 space-y-1">
          <button
            onClick={() => setCurrentPage('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-blue-500 transition-all ${currentPage === 'profile' ? 'bg-blue-500' : ''}`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-800 text-white hover:bg-blue-700 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => setCurrentPage('notifications')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.name ?? 'Admin'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role ?? 'admin'}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

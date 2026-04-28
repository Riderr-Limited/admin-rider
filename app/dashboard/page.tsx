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
import Chat from './chat/page';
import { api } from '@/lib/api';

type PageType = 'overview' | 'users' | 'riders' | 'deliveries' | 'companies' | 'payments' | 'support' | 'notifications' | 'profile' | 'chat';

const navigation: { id: PageType; name: string; icon: React.ElementType }[] = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'users', name: 'Users', icon: Users },
  { id: 'riders', name: 'Riders', icon: Users },
  { id: 'deliveries', name: 'Deliveries', icon: Package },
  { id: 'companies', name: 'Companies', icon: Building2 },
  { id: 'payments', name: 'Payments', icon: DollarSign },
  { id: 'support', name: 'Support', icon: MessageSquare },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'chat', name: 'Chat', icon: MessageSquare },
];

export default function RiderrDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<PageType>('overview');
  const [user, setUser] = useState<any>(null);
  const [chatUnread, setChatUnread] = useState(0);

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
      api.getChatConversations({ limit: '50' }).then((res: any) => {
        const total = (res.data ?? []).reduce((sum: number, item: any) => sum + (item.unreadCount ?? 0), 0);
        setChatUnread(total);
      }).catch(() => {});
    }
  }, [router]);

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.replace('/login');
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
                {item.id === 'chat' && chatUnread > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {chatUnread > 99 ? '99+' : chatUnread}
                  </span>
                )}
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
            <button onClick={() => setCurrentPage('notifications')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button onClick={() => setCurrentPage('chat')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              {chatUnread > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
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
          {currentPage === 'overview' && <Overview />}
          {currentPage === 'users' && <UsersPage />}
          {currentPage === 'riders' && <Riders />}
          {currentPage === 'deliveries' && <Deliveries />}
          {currentPage === 'companies' && <Companies />}
          {currentPage === 'payments' && <Payments />}
          {currentPage === 'support' && <Support />}
          {currentPage === 'notifications' && <Notifications />}
          {currentPage === 'chat' && <Chat />}
          {currentPage === 'profile' && <Profile />}
        </div>
      </div>
    </div>
  );
}

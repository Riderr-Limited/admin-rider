'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, Users, Building2, LayoutDashboard, User, LogOut, Bell, DollarSign, MessageSquare, Handshake } from 'lucide-react';
import Overview from './OverviewTab';
import UsersPage from './users/page';
import Companies from './companies/page';
import Riders from './riders/page';
import Deliveries from './deliveries/page';
import Payments from './payments/page';
import Support from './support/page';
import Notifications from './notifications/page';
import Partners from './partners/page';
import Profile from './ProfileTab';
import Chat from './chat/page';
import { api } from '@/lib/api';

type PageType = 'overview' | 'users' | 'riders' | 'deliveries' | 'companies' | 'partners' | 'payments' | 'support' | 'notifications' | 'profile' | 'chat';

const navigation: { id: PageType; name: string; icon: React.ElementType }[] = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'users', name: 'Users', icon: Users },
  { id: 'riders', name: 'Riders', icon: Users },
  { id: 'deliveries', name: 'Deliveries', icon: Package },
  { id: 'companies', name: 'Companies', icon: Building2 },
  { id: 'partners', name: 'Partners', icon: Handshake },
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
  const [notifUnread, setNotifUnread] = useState(0);
  const [deepLinkDeliveryId, setDeepLinkDeliveryId] = useState<string | null>(null);

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
      api.getUnreadNotificationCount().then((res: any) => {
        setNotifUnread(res.data?.count ?? 0);
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
      <div className="w-64 bg-gradient-to-b from-blue-700 via-blue-700 to-blue-900 flex flex-col shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Image src="/logo.png" alt="" width={40} height={40} className="rounded-xl ring-1 ring-white/20 shadow-sm flex-shrink-0" />
          <span className="text-white font-bold text-xl tracking-tight">RIDERR</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive ? 'bg-white/15 text-white shadow-sm' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-white" />}
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.4 : 2} />
                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                {item.id === 'chat' && chatUnread > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {chatUnread > 99 ? '99+' : chatUnread}
                  </span>
                )}
                {item.id === 'notifications' && notifUnread > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {notifUnread > 99 ? '99+' : notifUnread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 space-y-0.5 border-t border-white/10">
          <button
            onClick={() => setCurrentPage('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentPage === 'profile' ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <User className="w-[18px] h-[18px]" />
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-100 hover:bg-red-500/20 hover:text-white transition-all"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-8 py-3.5 flex-shrink-0">
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setCurrentPage('notifications')} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {notifUnread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </button>
            <button onClick={() => setCurrentPage('chat')} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors relative">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              {chatUnread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button onClick={() => setCurrentPage('profile')} className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white shadow-sm">
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name ?? 'Admin'}</p>
                <p className="text-xs text-gray-500 capitalize leading-tight">{user?.role ?? 'admin'}</p>
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50">
          {currentPage === 'overview' && <Overview />}
          {currentPage === 'users' && <UsersPage />}
          {currentPage === 'riders' && <Riders />}
          {currentPage === 'deliveries' && (
            <Deliveries
              initialDeliveryId={deepLinkDeliveryId}
              onConsumeInitialDeliveryId={() => setDeepLinkDeliveryId(null)}
            />
          )}
          {currentPage === 'companies' && <Companies />}
          {currentPage === 'partners' && <Partners />}
          {currentPage === 'payments' && <Payments />}
          {currentPage === 'support' && <Support />}
          {currentPage === 'notifications' && (
            <Notifications
              onNavigate={(page, meta) => {
                setCurrentPage(page as PageType);
                if (meta?.deliveryId) setDeepLinkDeliveryId(meta.deliveryId);
              }}
              onUnreadCountChange={setNotifUnread}
            />
          )}
          {currentPage === 'chat' && <Chat />}
          {currentPage === 'profile' && <Profile />}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package, Users, Building2, LayoutDashboard, User, LogOut, Bell, DollarSign, MessageSquare,
  Handshake, Bike, Car, ShoppingBag, LifeBuoy, Mail, Menu, X,
} from 'lucide-react';
import Overview from './OverviewTab';
import UsersPage from './users/page';
import Companies from './companies/page';
import Riders from './riders/page';
import Deliveries from './deliveries/page';
import Rides from './rides/page';
import Orders from './orders/page';
import Payments from './payments/page';
import Support from './support/page';
import Contact from './contact/page';
import Notifications from './notifications/page';
import Partners from './partners/page';
import Profile from './ProfileTab';
import Chat from './chat/page';
import { api } from '@/lib/api';
import { initial } from './ui';

type PageType =
  | 'overview' | 'users' | 'riders' | 'deliveries' | 'rides' | 'orders' | 'companies' | 'partners'
  | 'payments' | 'support' | 'contact' | 'notifications' | 'profile' | 'chat';

type NavItem = { id: PageType; name: string; icon: React.ElementType };

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: 'Overview', items: [{ id: 'overview', name: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Operations',
    items: [
      { id: 'deliveries', name: 'Deliveries', icon: Package },
      { id: 'rides', name: 'Rides', icon: Car },
      { id: 'orders', name: 'POD & Errands', icon: ShoppingBag },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'users', name: 'Users', icon: Users },
      { id: 'riders', name: 'Riders', icon: Bike },
      { id: 'companies', name: 'Companies', icon: Building2 },
      { id: 'partners', name: 'API Partners', icon: Handshake },
    ],
  },
  { label: 'Finance', items: [{ id: 'payments', name: 'Payments', icon: DollarSign }] },
  {
    label: 'Communication',
    items: [
      { id: 'chat', name: 'Live Chat', icon: MessageSquare },
      { id: 'support', name: 'Support Tickets', icon: LifeBuoy },
      { id: 'contact', name: 'Contact Messages', icon: Mail },
      { id: 'notifications', name: 'Notifications', icon: Bell },
    ],
  },
];

const ALL_PAGES = new Set<PageType>([...navGroups.flatMap(g => g.items.map(i => i.id)), 'profile']);

function pageFromHash(): PageType {
  if (typeof window === 'undefined') return 'overview';
  const h = window.location.hash.replace('#', '') as PageType;
  return ALL_PAGES.has(h) ? h : 'overview';
}

export default function RiderrDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPageState] = useState<PageType>('overview');
  const [user, setUser] = useState<any>(null);
  const [chatUnread, setChatUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const [deepLinkDeliveryId, setDeepLinkDeliveryId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep the active tab in the URL hash so a refresh or back button returns to the same page.
  const setCurrentPage = useCallback((p: PageType) => {
    setCurrentPageState(p);
    setDrawerOpen(false);
    if (typeof window !== 'undefined' && window.location.hash !== `#${p}`) {
      window.history.pushState(null, '', `#${p}`);
    }
  }, []);

  useEffect(() => {
    setCurrentPageState(pageFromHash());
    const onPop = () => setCurrentPageState(pageFromHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const refreshBadges = useCallback(() => {
    api.getChatAdminUnread()
      .then((res: any) => setChatUnread(res.data?.totalUnread ?? 0))
      .catch(() => {});
    api.getUnreadNotificationCount()
      .then((res: any) => setNotifUnread(res.data?.count ?? res.data?.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;
    if (!parsed || parsed.role !== 'admin') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.replace('/login');
      return;
    }
    setUser(parsed);
    refreshBadges();
    const t = setInterval(refreshBadges, 60_000);
    return () => clearInterval(t);
  }, [router, refreshBadges]);

  // Close the mobile drawer with Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const badgeFor = (id: PageType) => (id === 'chat' ? chatUnread : id === 'notifications' ? notifUnread : 0);
  const currentName = navGroups.flatMap(g => g.items).find(i => i.id === currentPage)?.name ?? 'Profile';

  const sidebar = (
    <div className="h-full w-72 lg:w-64 bg-gradient-to-b from-blue-700 via-blue-700 to-blue-900 flex flex-col shadow-xl">
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
        <Image src="/logo.png" alt="" width={36} height={36} className="rounded-xl ring-1 ring-white/20 shadow-sm flex-shrink-0" />
        <span className="text-white font-bold text-lg tracking-tight">RIDERR <span className="text-blue-200 font-medium text-sm">Admin</span></span>
        <button onClick={() => setDrawerOpen(false)} className="ml-auto lg:hidden p-1.5 rounded-lg text-blue-100 hover:bg-white/10" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label} className="mb-3">
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-blue-200/70">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                const badge = badgeFor(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive ? 'bg-white/15 text-white shadow-sm' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-white" />}
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                    <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                    {badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 space-y-0.5 border-t border-white/10">
        <button
          onClick={() => setCurrentPage('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentPage === 'profile' ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
          }`}
        >
          <User className="w-[18px] h-[18px]" />
          Profile
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-100 hover:bg-red-500/20 hover:text-white transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block flex-shrink-0">{sidebar}</aside>

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gray-900/50" onClick={() => setDrawerOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebar}
        </aside>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setDrawerOpen(true)} className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100" aria-label="Open menu">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <p className="lg:hidden font-semibold text-gray-900 truncate">{currentName}</p>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button onClick={() => setCurrentPage('notifications')} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors relative" aria-label="Notifications">
              <Bell className="w-5 h-5 text-gray-600" />
              {notifUnread > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </button>
            <button onClick={() => setCurrentPage('chat')} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors relative" aria-label="Chat">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              {chatUnread > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 sm:mx-2" />
            <button onClick={() => setCurrentPage('profile')} className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white shadow-sm">
                {initial(user?.name ?? 'A')}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name ?? 'Admin'}</p>
                <p className="text-xs text-gray-500 capitalize leading-tight">{user?.role ?? 'admin'}</p>
              </div>
            </button>
          </div>
        </header>

        <main className={`flex-1 bg-gray-50 ${currentPage === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {currentPage === 'overview' && <Overview onNavigate={(p) => setCurrentPage(p as PageType)} />}
          {currentPage === 'users' && <UsersPage />}
          {currentPage === 'riders' && <Riders />}
          {currentPage === 'deliveries' && (
            <Deliveries
              initialDeliveryId={deepLinkDeliveryId}
              onConsumeInitialDeliveryId={() => setDeepLinkDeliveryId(null)}
            />
          )}
          {currentPage === 'rides' && <Rides />}
          {currentPage === 'orders' && <Orders />}
          {currentPage === 'companies' && <Companies />}
          {currentPage === 'partners' && <Partners />}
          {currentPage === 'payments' && <Payments />}
          {currentPage === 'support' && <Support />}
          {currentPage === 'contact' && <Contact />}
          {currentPage === 'notifications' && (
            <Notifications
              onNavigate={(page, meta) => {
                setCurrentPage(page as PageType);
                if (meta?.deliveryId) setDeepLinkDeliveryId(meta.deliveryId);
              }}
              onUnreadCountChange={setNotifUnread}
            />
          )}
          {currentPage === 'chat' && <Chat onUnreadChange={setChatUnread} />}
          {currentPage === 'profile' && <Profile />}
        </main>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Package, Users, Building2, Bell, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SidebarLink from './SidebarLink';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pathname = usePathname();

  const notifications = [
    { id: 1, title: 'New delivery request', message: 'Swift Logistics requested a new delivery', time: '5 min ago', unread: true },
    { id: 2, title: 'Rider approved', message: 'Chinedu Okafor has been approved', time: '1 hour ago', unread: true },
    { id: 3, title: 'Payment received', message: 'NGN 28,000 from Express Delivery Co', time: '2 hours ago', unread: false },
  ];

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'deliveries', label: 'Deliveries', icon: Package, href: '/dashboard/deliveries' },
    { id: 'riders', label: 'Riders', icon: Users, href: '/dashboard/riders' },
    { id: 'companies', label: 'Companies', icon: Building2, href: '/dashboard/companies' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-blue-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Riderr Admin</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-800 rounded-lg">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.href}>
              <SidebarLink
                id={item.id}
                label={item.label}
                icon={item.icon}
                isActive={pathname === item.href}
                isOpen={sidebarOpen}
                onClick={() => {}}
              />
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell size={24} className="text-gray-600" />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications Panel */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        notif.unread ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{notif.time}</p>
                        </div>
                        {notif.unread && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

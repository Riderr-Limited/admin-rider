'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarLinkProps {
  item: SidebarItem;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ item, activeTab, setActiveTab, sidebarOpen }) => {
  return (
    <button
      onClick={() => setActiveTab(item.id)}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
        activeTab === item.id 
          ? 'bg-yellow-500 shadow-lg transform scale-105' 
          : 'hover:bg-blue-700 hover:translate-x-1'
      }`}
    >
      <item.icon size={18} />
      {sidebarOpen && <span className="font-medium">{item.label}</span>}
    </button>
  );
};

export default SidebarLink;
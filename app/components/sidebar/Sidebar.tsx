'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import SidebarLink from './SidebarLink';
import { sidebarItems } from './sidebarItems';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
  return (
    <div className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col shadow-xl`}>
      <div className="p-3 flex items-center justify-between border-b border-blue-700">
        {sidebarOpen && (
          <Image src="/logo.png" alt="Riderr Logo" width={100} height={40} className="object-contain" />
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-blue-700 rounded-lg transition-colors">
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 p-3 space-y-1">
        {sidebarItems.map((item) => (
          <SidebarLink
            key={item.id}
            item={item}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarOpen={sidebarOpen}
          />
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
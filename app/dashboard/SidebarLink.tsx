import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarLinkProps {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon: Icon, label, isActive, isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
        isActive 
          ? 'bg-yellow-500 shadow-lg transform scale-105' 
          : 'hover:bg-blue-700 hover:translate-x-1'
      }`}
    >
      <Icon size={18} />
      {isOpen && <span className="font-medium">{label}</span>}
    </button>
  );
};

export default SidebarLink;

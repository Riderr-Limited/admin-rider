'use client';

import React from 'react';

interface PageHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  gradient?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ icon: Icon, title, subtitle, gradient = 'from-blue-500 to-blue-600', action }: PageHeaderProps) {
  return (
    <div className="mb-5 sm:mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className={`bg-gradient-to-br ${gradient} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        </div>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

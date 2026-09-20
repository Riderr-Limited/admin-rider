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
    <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <div className={`bg-gradient-to-br ${gradient} p-3 rounded-2xl shadow-sm flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Riderr Admin Dashboard',
  description: 'Manage your logistics business',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

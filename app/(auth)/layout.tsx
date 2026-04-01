import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Riderr Admin — Login',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

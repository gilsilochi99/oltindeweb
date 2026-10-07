import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mis Compras' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

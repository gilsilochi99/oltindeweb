import type { Metadata } from 'next';
import { RentalsNav } from '@/components/rentals/RentalsNav';
import { PrivateRentalsGate } from '@/components/rentals/dashboard/PrivateRentalsGate';

export const metadata: Metadata = { title: 'Mis alquileres', robots: { index: false } };

// Rentals of a private advertiser (not a company): anyone signed in.
export default function PrivateRentalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RentalsNav basePath="/dashboard/alquileres" />
      <PrivateRentalsGate>{children}</PrivateRentalsGate>
    </>
  );
}

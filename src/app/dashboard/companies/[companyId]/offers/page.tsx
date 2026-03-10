'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/data';
import type { Company, Offer } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import OffersList from './OffersList';
import AddOfferForm from './AddOfferForm';

export default function CompanyOffersPage({ params }: any) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchCompanyData = async () => {
        setIsLoading(true);
        const data = await getCompanyById(params.companyId);
        if (!data || data.ownerId !== user.uid) {
          notFound();
        }
        setCompany(data);
        setOffers(data.offers?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []);
        setIsLoading(false);
      };
      fetchCompanyData();
    }
  }, [user, params.companyId]);

  const handleOfferAdded = (newOffer: Offer) => {
    setOffers(prev => [newOffer, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleOfferDeleted = (offerId: string) => {
    setOffers(prev => prev.filter(o => o.id !== offerId));
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return null; // Or some other placeholder
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestionar Ofertas para {company.name}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <OffersList companyId={company.id} offers={offers} onOfferDeleted={handleOfferDeleted} />
        </div>
        <div>
          <AddOfferForm companyId={company.id} onOfferAdded={handleOfferAdded} />
        </div>
      </div>
    </div>
  );
}

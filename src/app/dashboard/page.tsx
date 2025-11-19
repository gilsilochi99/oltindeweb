
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Loader2, Megaphone, Tag, FileText } from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Lazy load the admin panels
const ManagementPanel = lazy(() => import('@/components/dashboard/ManagementPanel'));
const CompaniesPanel = lazy(() => import('@/components/dashboard/panels/CompaniesPanel'));
const PublicationsPanel = lazy(() => import('@/components/dashboard/panels/PublicationsPanel'));
const UserProfilePanel = lazy(() => import('@/components/dashboard/panels/UserProfilePanel'));

function DashboardLoading() {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin h-10 w-10" />
      </div>
    )
}

function UserDashboard({ user }) {
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsDataLoading(true);
        try {
          const companiesQuery = query(collection(db, 'companies'), where('ownerId', '==', user.id));
          const companiesSnapshot = await getDocs(companiesQuery);
          const companiesData = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
          setUserCompanies(companiesData);

        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsDataLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const handleAddCompany = () => {
    router.push('/dashboard/companies/new');
  };

  const handleEditCompany = (item: Company) => {
    router.push(`/dashboard/companies/${item.id}/edit`);
  };

  const handleDeleteCompany = async (item: Company) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
      await deleteDoc(doc(db, 'companies', item.id));
      setUserCompanies(userCompanies.filter(c => c.id !== item.id));
    }
  };

  const companyColumns = [
    { header: 'Nombre', accessor: (item: Company) => item.name },
    { header: 'Ciudad', accessor: (item: Company) => item.branches[0]?.location.city },
    { header: 'Verificada', accessor: (item: Company) => (item.isVerified ? 'Sí' : 'No') },
  ];

  const companyCustomActions = user.isPremium ? [
    {
        label: 'Documentos',
        onClick: (item: Company) => router.push(`/dashboard/companies/${item.id}/documents`),
        icon: <FileText className="h-4 w-4" />
    },
    {
        label: 'Anuncios',
        onClick: (item: Company) => router.push(`/dashboard/companies/${item.id}/announcements`),
        icon: <Megaphone className="h-4 w-4" />
    },
    {
        label: 'Ofertas',
        onClick: (item: Company) => router.push(`/dashboard/companies/${item.id}/offers`),
        icon: <Tag className="h-4 w-4" />
    }
  ] : [];


  if (isDataLoading) {
      return <DashboardLoading />
  }

  return (
    <div className="space-y-12">
        <Suspense fallback={<DashboardLoading />}>
            <ManagementPanel
              title={`Mis Empresas (${userCompanies.length})`}
              data={userCompanies}
              columns={companyColumns}
              onAddItem={handleAddCompany}
              onEditItem={handleEditCompany}
              onDeleteItem={handleDeleteCompany}
              addItemLabel="Añadir Nueva Empresa"
              customActions={companyCustomActions}
            />
        </Suspense>
      </div>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <DashboardLoading />;
  }

  const canManageCompanies = user.role === 'admin' || user.role === 'manager';

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Panel de Control Principal</h1>
          <p className="text-muted-foreground">Gestione sus listados de empresas y publicaciones aquí.</p>
        </div>
      </div>

      <div className="space-y-8">
          <Suspense fallback={<DashboardLoading />}>
            <UserProfilePanel />
            <UserDashboard user={user} />
            <PublicationsPanel />
            {canManageCompanies && <CompaniesPanel />}
          </Suspense>
      </div>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import ManagementPanel from '@/components/dashboard/ManagementPanel';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Company } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function CompaniesPanel() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCompanies = async () => {
      const querySnapshot = await getDocs(collection(db, 'companies'));
      const companiesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(companiesData);
    };

    fetchCompanies();
  }, []);

  const handleAddItem = () => {
    router.push('/dashboard/companies/new');
  };

  const handleEditItem = (item: Company) => {
    router.push(`/dashboard/companies/${item.id}/edit`);
  };

  const handleDeleteItem = async (item: Company) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
      await deleteDoc(doc(db, 'companies', item.id));
      setCompanies(companies.filter(c => c.id !== item.id));
    }
  };

  const columns = [
    { header: 'Nombre', accessor: (item: Company) => item.name },
    { header: 'Ciudad', accessor: (item: Company) => item.branches[0]?.location.city },
    { header: 'Verificada', accessor: (item: Company) => (item.isVerified ? 'Sí' : 'No') },
  ];

  return (
    <ManagementPanel
      title="Gestionar Empresas"
      data={companies}
      columns={columns}
      onAddItem={handleAddItem}
      onEditItem={handleEditItem}
      onDeleteItem={handleDeleteItem}
      addItemLabel="Nueva Empresa"
    />
  );
}


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
    if (window.confirm('Are you sure you want to delete this company?')) {
      await deleteDoc(doc(db, 'companies', item.id));
      setCompanies(companies.filter(c => c.id !== item.id));
    }
  };

  const columns = [
    { header: 'Name', accessor: (item: Company) => item.name },
    { header: 'City', accessor: (item: Company) => item.city },
    { header: 'Verified', accessor: (item: Company) => (item.isVerified ? 'Yes' : 'No') },
  ];

  return (
    <ManagementPanel
      title="Manage Companies"
      data={companies}
      columns={columns}
      onAddItem={handleAddItem}
      onEditItem={handleEditItem}
      onDeleteItem={handleDeleteItem}
    />
  );
}

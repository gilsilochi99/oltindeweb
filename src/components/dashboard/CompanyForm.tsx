
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Company } from '@/lib/types';

interface CompanyFormProps {
  companyId?: string;
}

export default function CompanyForm({ companyId }: CompanyFormProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [name, setName] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [cif, setCif] = useState('');
  const [city, setCity] = useState(''); // Assuming city is the first branch's city

  const router = useRouter();

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;
      const docRef = doc(db, 'companies', companyId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Company;
        setCompany(data);
        setName(data.name);
        setLegalForm(data.legalForm);
        setCif(data.cif);
        if (data.branches && data.branches.length > 0) {
            setCity(data.branches[0].location.city);
        }
      } else {
        // Handle not found
        console.error("Company not found");
        router.push('/dashboard');
      }
    };

    if (companyId) {
      fetchCompany();
    }
  }, [companyId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const companyData = {
      name,
      legalForm,
      cif,
      branches: [
        {
          location: {
            city,
          }
        }
      ]
    };

    if (companyId) {
      const docRef = doc(db, 'companies', companyId as string);
      await updateDoc(docRef, companyData);
    } else {
      await addDoc(collection(db, 'companies'), {
        ...companyData,
        isVerified: false,
        createdAt: new Date().toISOString(),
      });
    }

    router.push('/dashboard'); // Redirect to the main dashboard page after update
  };

  if (companyId && !company) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold font-headline mb-6">
        {companyId ? `Edit Company: ${company?.name}` : 'Create Company'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="legalForm" className="block text-sm font-medium text-gray-700">Forma Jurídica</label>
          <input
            type="text"
            id="legalForm"
            value={legalForm}
            onChange={(e) => setLegalForm(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="cif" className="block text-sm font-medium text-gray-700">CIF</label>
          <input
            type="text"
            id="cif"
            value={cif}
            onChange={(e) => setCif(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ciudad (de la primera sucursal)</label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {companyId ? 'Actualizar Empresa' : 'Crear Empresa'}
            </button>
        </div>
      </form>
    </div>
  );
}

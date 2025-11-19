
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ManagementPanel from '@/components/dashboard/ManagementPanel';
import { getCompaniesByOwner, getServices, getUniqueCategories, getUniqueCities } from "@/lib/data";
import type { Company, Service, CategoryUsage } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CompanyForm } from "@/components/shared/CompanyForm";
import { Loader2 } from 'lucide-react';

export default function CompaniesPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<CategoryUsage[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [companiesData, servicesData, citiesData] = await Promise.all([
        getCompaniesByOwner(user.id),
        getServices(),
        getUniqueCities(),
      ]);
      const uniqueCategories = [...new Set(servicesData.map(s => s.category))].map(name => ({
          name,
          companyCount: 0,
          institutionCount: 0,
          procedureCount: 0,
      }));

      setUserCompanies(companiesData);
      setServices(servicesData);
      setCategories(uniqueCategories);
      setCities(citiesData);

    } catch (error) {
      console.error("Error fetching data: ", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos necesarios para el formulario.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenForm = (company?: Company) => {
    setEditingCompany(company || null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setEditingCompany(null);
    // Re-fetch data to show the new/updated company
    fetchData(); 
  };

  const handleDeleteItem = async (item: Company) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
      try {
        await deleteDoc(doc(db, 'companies', item.id));
        setUserCompanies(currentCompanies => currentCompanies.filter(c => c.id !== item.id));
        toast({
          title: "Empresa Eliminada",
          description: "La empresa ha sido eliminada correctamente.",
        });
      } catch (error) {
        console.error("Error deleting company: ", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la empresa.",
          variant: "destructive",
        });
      }
    }
  };

  const columns = [
    { header: 'Nombre', accessor: (item: Company) => item.name },
    { header: 'Ciudad', accessor: (item: Company) => item.branches[0]?.location.city },
    { header: 'Verificada', accessor: (item: Company) => (item.isVerified ? 'Sí' : 'No') },
  ];

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin" />
          </div>
      );
  }

  return (
    <>
      <ManagementPanel
        title="Mis Empresas"
        data={userCompanies}
        columns={columns}
        onAddItem={() => handleOpenForm()}
        onEditItem={handleOpenForm}
        onDeleteItem={handleDeleteItem}
        addItemLabel="Añadir Empresa"
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Añadir Nueva Empresa'}</DialogTitle>
            <DialogDescription>
              {editingCompany 
                ? 'Actualice los detalles de su empresa a continuación.'
                : 'Complete el formulario para registrar una nueva empresa.'
              }
            </DialogDescription>
          </DialogHeader>
          <CompanyForm
            type={editingCompany ? 'Update' : 'Create'}
            initialData={editingCompany || undefined}
            userId={user?.id}
            categories={categories}
            services={services}
            cities={cities}
            onFormSubmit={handleFormSubmit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

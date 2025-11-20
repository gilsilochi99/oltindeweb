
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Company } from '@/lib/types';
import { CompanyForm } from '@/components/shared/CompanyForm';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function EditCompanyPage() {
  const { companyId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      const fetchCompany = async () => {
        setLoading(true);
        const companyDocRef = doc(db, 'companies', companyId as string);
        const companyDocSnap = await getDoc(companyDocRef);
        if (companyDocSnap.exists()) {
          setCompany({ id: companyDocSnap.id, ...companyDocSnap.data() } as Company);
        } else {
          toast({ title: "Error", description: "Company not found.", variant: "destructive" });
          router.push('/dashboard');
        }
        setLoading(false);
      };
      fetchCompany();
    }
  }, [companyId, router, toast]);

  const handleSubmit = async (data: any) => {
    if (!companyId) return;
    try {
      const companyDocRef = doc(db, 'companies', companyId as string);
      await updateDoc(companyDocRef, data);
      toast({ title: "Success", description: "Company updated successfully." });
      router.push('/dashboard');
    } catch (error) {
      console.error("Error updating company: ", error);
      toast({ title: "Error", description: "Failed to update company.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-10 w-10" /></div>;
  }

  if (!company) {
    return <div className="container mx-auto p-4 md:p-8"><h1 className="text-3xl font-bold">Company not found</h1></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                <h1 className="text-3xl font-bold font-headline">Editar Empresa</h1>
                <p className="text-muted-foreground">Actualice los detalles de su empresa aquí.</p>
                </div>
            </div>
            <CompanyForm type="Update" initialData={company} onSubmit={handleSubmit} />
        </div>
    </div>
  );
}

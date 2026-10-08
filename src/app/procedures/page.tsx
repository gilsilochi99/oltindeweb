import type { Metadata } from 'next';
import { getProcedures, getUniqueCategories, getInstitutions } from "@/lib/data";
import { ProceduresPageClient } from "./ProceduresPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Guía de Trámites en Guinea Ecuatorial",
  description: "Requisitos, pasos, documentos y costes de los trámites administrativos de Guinea Ecuatorial: pasaporte, empresas, permisos y más.",
  alternates: { canonical: '/procedures' },
};

export default async function ProceduresPage() {
  const [allProcedures, categoriesData, institutions] = await Promise.all([
    getProcedures(),
    getUniqueCategories(),
    getInstitutions(),
  ]);

  const procedureCategories = new Set(allProcedures.map(p => p.category));
  const categories = ['all', ...categoriesData.map(c => c.name).filter(name => procedureCategories.has(name))];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <ProceduresPageClient allProcedures={allProcedures} categories={categories} institutions={institutions} />
    </Suspense>
  );
}

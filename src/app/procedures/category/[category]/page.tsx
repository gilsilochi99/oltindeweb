import { getProcedures, getUniqueCategories, getInstitutions } from "@/lib/data";
import { ProceduresPageClient } from "../../ProceduresPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
};

async function getCategoryList(): Promise<string[]> {
  const [allProcedures, categoriesData] = await Promise.all([
    getProcedures(),
    getUniqueCategories(),
  ]);
  const procedureCategories = new Set(allProcedures.map((p) => p.category));
  return categoriesData.map((c) => c.name).filter((name) => procedureCategories.has(name));
}

export async function generateStaticParams() {
  const categoryList = await getCategoryList();
  return categoryList.map((category) => ({ category: slugify(category) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const categoryList = await getCategoryList();
  const match = categoryList.find((c) => slugify(c) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `Trámites de ${match} en Guinea Ecuatorial`,
    description: `Guía de trámites de ${match} en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function ProcedureCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const [allProcedures, institutions, categoryList] = await Promise.all([
    getProcedures(),
    getInstitutions(),
    getCategoryList(),
  ]);

  const match = categoryList.find((c) => slugify(c) === slug);
  if (!match) {
    notFound();
  }

  const categories = ['all', ...categoryList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <ProceduresPageClient allProcedures={allProcedures} categories={categories} institutions={institutions} initialCategory={match} />
    </Suspense>
  );
}

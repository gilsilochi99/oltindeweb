import { getInstitutions, getUniqueCategories } from "@/lib/data";
import { InstitutionsPageClient } from "../../InstitutionsPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const [allInstitutions, categoriesData] = await Promise.all([
    getInstitutions(),
    getUniqueCategories(),
  ]);
  const institutionCategories = new Set(allInstitutions.map((inst) => inst.category));
  const categories = categoriesData.filter((c) => institutionCategories.has(c.name));
  return categories.map((category) => ({ category: slugify(category.name) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const categoriesData = await getUniqueCategories();
  const match = categoriesData.find((c) => slugify(c.name) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `Instituciones de ${match.name} en Guinea Ecuatorial`,
    description: `Directorio de instituciones de ${match.name} en Guinea Ecuatorial.`,
  };
}

export default async function InstitutionCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const [allInstitutions, categoriesData] = await Promise.all([
    getInstitutions(),
    getUniqueCategories(),
  ]);

  const institutionCategories = new Set(allInstitutions.map((inst) => inst.category));
  const categories = categoriesData.filter((c) => institutionCategories.has(c.name));

  const match = categories.find((c) => slugify(c.name) === slug);
  if (!match) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <InstitutionsPageClient allInstitutions={allInstitutions} categories={categories} initialCategory={match.name} />
    </Suspense>
  );
}

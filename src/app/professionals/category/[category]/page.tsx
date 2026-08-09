import { getActiveProfessionals, getServices } from "@/lib/data";
import { ProfessionalsPageClient } from "../../ProfessionalsPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Service } from "@/lib/types";

type Props = {
  params: Promise<{ category: string }>;
};

async function getCategoryList(): Promise<string[]> {
  const servicesData = await getServices();
  return [...new Set(servicesData.map((s: Service) => s.category))];
}

export async function generateStaticParams() {
  const categories = await getCategoryList();
  return categories.map((category) => ({ category: slugify(category) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const categories = await getCategoryList();
  const match = categories.find((c) => slugify(c) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `Profesionales de ${match} en Guinea Ecuatorial`,
    description: `Encuentre profesionales independientes de ${match} en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function ProfessionalCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const [allProfessionals, categoryList] = await Promise.all([
    getActiveProfessionals(),
    getCategoryList(),
  ]);

  const match = categoryList.find((c) => slugify(c) === slug);
  if (!match) {
    notFound();
  }

  const categories = ['all', ...categoryList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <ProfessionalsPageClient allProfessionals={allProfessionals} categories={categories} initialCategory={match} />
    </Suspense>
  );
}

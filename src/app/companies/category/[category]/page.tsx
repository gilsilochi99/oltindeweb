import { getActiveCompanies, getCompanyCategoryCounts, getServices } from "@/lib/data";
import { CompaniesPageClient } from "../../CompaniesPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const categories = await getCompanyCategoryCounts();
  return categories.map((category) => ({ category: slugify(category.name) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const categories = await getCompanyCategoryCounts();
  const match = categories.find((c) => slugify(c.name) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `Empresas de ${match.name} en Guinea Ecuatorial`,
    description: `Explore empresas de ${match.name} en el directorio de Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function CompanyCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const [companies, categories, services] = await Promise.all([
    getActiveCompanies(),
    getCompanyCategoryCounts(),
    getServices(),
  ]);

  const match = categories.find((c) => slugify(c.name) === slug);
  if (!match) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <CompaniesPageClient
        initialCompanies={companies}
        initialCategories={categories}
        initialServices={services}
        initialCategory={match.name}
        initialMode="list"
      />
    </Suspense>
  );
}

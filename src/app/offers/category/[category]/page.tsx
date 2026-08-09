import { buildOffersData } from "../../data";
import { OffersPageClient } from "../../OffersPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const { categoryList } = await buildOffersData();
  return categoryList.map((category) => ({ category: slugify(category) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const { categoryList } = await buildOffersData();
  const match = categoryList.find((c) => slugify(c) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `Ofertas de empresas de ${match} en Guinea Ecuatorial`,
    description: `Últimas ofertas y descuentos de empresas de ${match} en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function OfferCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const { allOffers, categoryList, companies } = await buildOffersData();
  const match = categoryList.find((c) => slugify(c) === slug);
  if (!match) {
    notFound();
  }

  const categories = ['all', ...categoryList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <OffersPageClient allOffers={allOffers} categories={categories} companies={companies} initialCategory={match} />
    </Suspense>
  );
}

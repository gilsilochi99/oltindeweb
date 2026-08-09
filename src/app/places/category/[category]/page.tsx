import { getTouristLocations, getUniqueTouristLocationCategories, getUniqueCities } from "@/lib/data";
import { PlacesPageClient } from "../../PlacesPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const categoryList = await getUniqueTouristLocationCategories();
  return categoryList.map((category) => ({ category: slugify(category) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const categoryList = await getUniqueTouristLocationCategories();
  const match = categoryList.find((c) => slugify(c) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `${match} en Guinea Ecuatorial`,
    description: `Descubra lugares turísticos de tipo ${match} en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function PlaceCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const [locations, categoryList, cityList] = await Promise.all([
    getTouristLocations(),
    getUniqueTouristLocationCategories(),
    getUniqueCities(),
  ]);

  const match = categoryList.find((c) => slugify(c) === slug);
  if (!match) {
    notFound();
  }

  const allLocations = [...locations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const categories = ['all', ...categoryList];
  const cities = ['all', ...cityList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <PlacesPageClient allLocations={allLocations} categories={categories} cities={cities} initialCategory={match} />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { getTouristLocations, getUniqueTouristLocationCategories, getUniqueCities } from "@/lib/data";
import { PlacesPageClient } from "./PlacesPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Turismo en Guinea Ecuatorial: lugares que visitar, playas y monumentos",
  description: "Qué ver en Guinea Ecuatorial: playas, monumentos, museos, parques naturales y lugares turísticos de Malabo, Bata, Bioko y la región continental.",
  alternates: { canonical: '/places' },
};

export default async function PlacesPage() {
  const [locations, categoryList, cityList] = await Promise.all([
    getTouristLocations(),
    getUniqueTouristLocationCategories(),
    getUniqueCities(),
  ]);

  const allLocations = [...locations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const categories = ['all', ...categoryList];
  const cities = ['all', ...cityList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <PlacesPageClient allLocations={allLocations} categories={categories} cities={cities} />
    </Suspense>
  );
}

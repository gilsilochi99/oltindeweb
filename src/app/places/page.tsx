import { getTouristLocations, getUniqueTouristLocationCategories, getUniqueCities } from "@/lib/data";
import { PlacesPageClient } from "./PlacesPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

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

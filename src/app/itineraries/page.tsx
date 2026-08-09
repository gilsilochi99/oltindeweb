import { getItineraries, getUniqueCities } from "@/lib/data";
import { ItinerariesPageClient } from "./ItinerariesPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function ItinerariesPage() {
  const [allItineraries, cityList] = await Promise.all([
    getItineraries(),
    getUniqueCities(),
  ]);

  const cities = ['all', ...cityList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <ItinerariesPageClient allItineraries={allItineraries} cities={cities} />
    </Suspense>
  );
}

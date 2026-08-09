import { getEvents, getUniqueEventCategories, getUniqueCities } from "@/lib/data";
import { EventsPageClient } from "./EventsPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function EventsPage() {
  const [events, categoryList, cityList] = await Promise.all([
    getEvents(),
    getUniqueEventCategories(),
    getUniqueCities(),
  ]);

  const allEvents = events
    .filter(e => e.status === 'scheduled' && new Date(e.startDate).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const categories = ['all', ...categoryList];
  const cities = ['all', ...cityList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <EventsPageClient allEvents={allEvents} categories={categories} cities={cities} />
    </Suspense>
  );
}

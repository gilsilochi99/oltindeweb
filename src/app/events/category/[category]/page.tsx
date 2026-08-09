import { getEvents, getUniqueEventCategories, getUniqueCities } from "@/lib/data";
import { EventsPageClient } from "../../EventsPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const categoryList = await getUniqueEventCategories();
  return categoryList.map((category) => ({ category: slugify(category) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const categoryList = await getUniqueEventCategories();
  const match = categoryList.find((c) => slugify(c) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `Eventos de ${match} en Guinea Ecuatorial`,
    description: `Calendario de eventos de ${match} en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function EventCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const [events, categoryList, cityList] = await Promise.all([
    getEvents(),
    getUniqueEventCategories(),
    getUniqueCities(),
  ]);

  const match = categoryList.find((c) => slugify(c) === slug);
  if (!match) {
    notFound();
  }

  const allEvents = events
    .filter(e => e.status === 'scheduled' && new Date(e.startDate).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const categories = ['all', ...categoryList];
  const cities = ['all', ...cityList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <EventsPageClient allEvents={allEvents} categories={categories} cities={cities} initialCategory={match} />
    </Suspense>
  );
}

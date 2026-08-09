import { buildAnnouncementsData } from "../../data";
import { AnnouncementsPageClient } from "../../AnnouncementsPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const { categoryList } = await buildAnnouncementsData();
  return categoryList.map((category) => ({ category: slugify(category) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const { categoryList } = await buildAnnouncementsData();
  const match = categoryList.find((c) => slugify(c) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `Anuncios de empresas de ${match} en Guinea Ecuatorial`,
    description: `Últimos anuncios de empresas de ${match} en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function AnnouncementCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const { allAnnouncements, categoryList, companies } = await buildAnnouncementsData();
  const match = categoryList.find((c) => slugify(c) === slug);
  if (!match) {
    notFound();
  }

  const categories = ['all', ...categoryList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <AnnouncementsPageClient allAnnouncements={allAnnouncements} categories={categories} companies={companies} initialCategory={match} />
    </Suspense>
  );
}

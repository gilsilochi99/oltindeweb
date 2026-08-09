import { getServicesByCompany } from "@/lib/data";
import { ServicesPageClient } from "../../ServicesPageClient";
import { slugify } from "@/lib/slug";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const allServices = await getServicesByCompany();
  const categories = Array.from(new Set(allServices.map((s) => s.category).filter(Boolean)));
  return categories.map((category) => ({ category: slugify(category) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const allServices = await getServicesByCompany();
  const categories = Array.from(new Set(allServices.map((s) => s.category).filter(Boolean)));
  const match = categories.find((c) => slugify(c) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `Servicios de ${match} en Guinea Ecuatorial`,
    description: `Explore servicios de ${match} ofrecidos por empresas locales en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function ServiceCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const allServices = await getServicesByCompany();
  const categories = Array.from(new Set(allServices.map((s) => s.category).filter(Boolean)));
  const match = categories.find((c) => slugify(c) === slug);
  if (!match) {
    notFound();
  }

  return <ServicesPageClient allServices={allServices} initialCategory={match} />;
}

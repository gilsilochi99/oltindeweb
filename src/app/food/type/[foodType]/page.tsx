import { getActiveCompanies, getActiveMenuItems, getUniqueCities } from "@/lib/data";
import { FoodPageClient } from "../../FoodPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { MenuItem } from "@/lib/types";

type Props = {
  params: Promise<{ foodType: string }>;
};

function getFoodTypes(menuItems: MenuItem[]): string[] {
  return Array.from(new Set(menuItems.map((i) => i.foodType).filter(Boolean))).sort();
}

export async function generateStaticParams() {
  const menuItems = await getActiveMenuItems();
  return getFoodTypes(menuItems).map((foodType) => ({ foodType: slugify(foodType) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { foodType: slug } = await params;
  const menuItems = await getActiveMenuItems();
  const match = getFoodTypes(menuItems).find((t) => slugify(t) === slug);

  if (!match) {
    return { title: "Tipo de comida no encontrado" };
  }

  return {
    title: `Restaurantes de comida ${match} en Guinea Ecuatorial`,
    description: `Pida comida ${match} en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function FoodTypePage({ params }: Props) {
  const { foodType: slug } = await params;

  const [companies, menuItems, cityList] = await Promise.all([
    getActiveCompanies(),
    getActiveMenuItems(),
    getUniqueCities(),
  ]);

  const match = getFoodTypes(menuItems).find((t) => slugify(t) === slug);
  if (!match) {
    notFound();
  }

  const cities = ['all', ...cityList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <FoodPageClient companies={companies} menuItems={menuItems} cities={cities} initialFoodType={match} />
    </Suspense>
  );
}

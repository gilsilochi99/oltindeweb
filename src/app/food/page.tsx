import { getActiveCompanies, getActiveMenuItems, getUniqueCities } from "@/lib/data";
import { FoodPageClient } from "./FoodPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function FoodPage() {
  const [companies, menuItems, cityList] = await Promise.all([
    getActiveCompanies(),
    getActiveMenuItems(),
    getUniqueCities(),
  ]);

  const cities = ['all', ...cityList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <FoodPageClient companies={companies} menuItems={menuItems} cities={cities} />
    </Suspense>
  );
}

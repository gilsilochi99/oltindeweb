
'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getUniqueCategories } from "@/lib/data";
import { ContributionForm } from "@/components/shared/ContributionForm";
import type { CategoryUsage } from "@/lib/types";

export default function NewContributionPage() {
  const { user, loading: userLoading } = useAuth();
  const [categories, setCategories] = useState<CategoryUsage[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const fetchedCategories = await getUniqueCategories();
      setCategories(fetchedCategories);
      setLoadingCategories(false);
    }

    fetchCategories();
  }, []);

  if (userLoading || loadingCategories) {
    return <p>Loading...</p>; // Or a more sophisticated loading spinner
  }

  if (!user) {
    return <p>You must be logged in to create a contribution.</p>;
  }

  const categoryNames = categories.map(c => c.name);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Añadir Nueva Contribución</h1>
      <ContributionForm
        type="Create"
        userId={user.id}
        categories={categoryNames}
      />
    </div>
  );
}

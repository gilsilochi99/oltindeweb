
'use client';

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import Link from "next/link";
import type { Company, Branch } from "@/lib/types";

const ITEMS_PER_PAGE = 10;

type Provider = Company & { branches: Branch[] };

export function ProvidersList({ providers }: { providers: Provider[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(providers.length / ITEMS_PER_PAGE);
  const currentProviders = providers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (providers.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No se encontraron empresas que ofrezcan este servicio.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {currentProviders.map(company => (
        <Card key={company.id} className="p-4">
          <h3 className="text-xl font-semibold mb-2">
            <Link href={`/companies/${company.id}`} className="hover:underline">{company.name}</Link>
          </h3>
          <div className="space-y-3">
            {company.branches.map(branch => (
              <div key={branch.id} className="flex items-center justify-between p-3 border bg-muted/50">
                <div>
                  <p className="font-semibold">{branch.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" /> {branch.location.address}, {branch.location.city}
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/companies/${company.id}`}>Ver Empresa</Link>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {totalPages > 1 && (
        <div className="pt-2 border-t">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

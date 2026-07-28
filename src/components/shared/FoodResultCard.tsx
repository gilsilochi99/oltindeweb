
import type { FoodResult } from "@/lib/search-engine";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

export function FoodResultCard({ item }: { item: FoodResult }) {
  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md">
      <Link href={`/companies/${item.companyId}#menu`} className="flex gap-4 p-4">
        <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {item.image ? (
            <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
          ) : (
            <UtensilsCrossed className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <CardContent className="p-0 flex-grow">
          <p className="text-sm text-black font-semibold">{item.companyName}</p>
          <h3 className="text-base font-bold font-headline leading-tight mt-0.5">{item.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
          <p className="text-sm font-bold mt-2">{formatPrice(item.price)}</p>
        </CardContent>
      </Link>
    </Card>
  );
}

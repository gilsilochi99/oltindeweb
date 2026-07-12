
import type { OfferWithCompany } from "@/app/offers/page";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Badge } from "../ui/badge";

export function OfferCard({ offer }: { offer: OfferWithCompany }) {
  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md flex flex-col">
        <CardHeader className="p-4">
            <div className="flex gap-4">
                <div className="w-16 h-16 shrink-0">
                    <Link href={`/companies/${offer.companyId}`}>
                        <Image src={offer.companyLogo} alt={`${offer.companyName} logo`} width={64} height={64} className="object-contain bg-muted border" />
                    </Link>
                </div>
                <div className="flex-grow">
                     <div className="flex justify-between items-start">
                        <div>
                             <Link href={`/companies/${offer.companyId}`} className="text-sm text-primary font-semibold hover:underline">
                                {offer.companyName}
                            </Link>
                            <h3 className="text-lg font-bold font-headline leading-tight mt-1">
                                <Link href={`/offers/${offer.id}`} className="hover:underline">
                                    {offer.title}
                                </Link>
                            </h3>
                        </div>
                    </div>
                     <Badge variant="default" className="text-base mt-2">{offer.discount}</Badge>
                     <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{offer.description}</p>
                </div>
                {offer.image && (
                    <div className="w-20 h-20 shrink-0 hidden sm:block">
                        <Link href={`/offers/${offer.id}`}>
                            <Image src={offer.image} alt={offer.title} width={80} height={80} className="object-cover bg-muted border rounded-md" />
                        </Link>
                    </div>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3 flex-grow">
             <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1.5"/>
                <span>
                    Válido hasta el {new Date(offer.validUntil).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>
        </CardContent>
    </Card>
  );
}

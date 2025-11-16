
import type { Institution } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import { MapPin, Phone, Globe, Briefcase, ExternalLink, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { OpeningStatusBadge } from "./OpeningStatusBadge";

export function InstitutionCard({ institution }: { institution: Institution }) {
  const averageRating =
    institution.reviews && institution.reviews.length > 0
      ? institution.reviews.reduce((acc, review) => acc + review.rating, 0) / institution.reviews.length
      : 0;

  const mainBranch = institution.branches && institution.branches.length > 0 ? institution.branches[0] : null;

  return (
    <Card className={cn(
        "w-full overflow-hidden transition-all hover:shadow-md flex flex-col"
    )}>
        <CardHeader className="p-4">
            <div className="flex gap-4">
                <div className="w-20 h-20 shrink-0">
                     <Image
                        src={institution.logo}
                        alt={`${institution.name} logo`}
                        width={80}
                        height={80}
                        className="object-contain w-full h-full bg-muted border"
                        data-ai-hint="institution logo"
                    />
                </div>
                <div className="flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold font-headline leading-tight">
                            <Link href={`/institutions/${institution.id}`} className="hover:underline flex items-center gap-2">
                                {institution.name}
                            </Link>
                        </h3>
                        <OpeningStatusBadge branch={mainBranch} />
                    </div>

                    {averageRating > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={averageRating} />
                            <span className="text-xs text-muted-foreground">{averageRating.toFixed(1)} ({institution.reviews.length} reseñas)</span>
                        </div>
                    )}
                    <p className="text-base md:text-sm text-muted-foreground mt-2 line-clamp-2">{institution.description}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3 flex-grow">
             <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-base md:text-sm text-muted-foreground">
                {mainBranch && (
                    <>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4"/>
                            <span>{mainBranch.location.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4"/>
                            <span>{mainBranch.contact.phone}</span>
                        </div>
                    </>
                )}
                 {institution.contact.website && (
                    <a href={institution.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                        <Globe className="w-4 h-4" />
                        <span>Sitio Web</span>
                    </a>
                )}
            </div>
        </CardContent>
         <CardFooter className="p-4 pt-0">
            <Button asChild className="w-full sm:w-auto sm:ml-auto">
                <Link href={`/institutions/${institution.id}`}>Ver Detalles</Link>
            </Button>
        </CardFooter>
    </Card>
  );
}

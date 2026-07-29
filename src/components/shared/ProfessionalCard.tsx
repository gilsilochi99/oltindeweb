
import type { Professional } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { MapPin, Star } from "lucide-react";

export function ProfessionalCard({ professional }: { professional: Professional }) {
    const averageRating = professional.reviews.length > 0
        ? professional.reviews.reduce((acc, r) => acc + r.rating, 0) / professional.reviews.length
        : 0;

    return (
        <Card className="w-full overflow-hidden transition-all hover:shadow-md flex flex-col">
            <CardHeader className="p-4">
                <div className="flex gap-4">
                    <div className="w-14 h-14 shrink-0">
                        <Link href={`/professionals/${professional.id}`}>
                            <Image
                                src={professional.photo || `https://placehold.co/100x100/CCCCCC/000000?text=${professional.displayName.substring(0, 2).toUpperCase()}`}
                                alt={professional.displayName}
                                width={56}
                                height={56}
                                className="object-cover rounded-full bg-muted w-14 h-14"
                            />
                        </Link>
                    </div>
                    <div className="flex-grow min-w-0">
                        <h3 className="text-lg font-bold font-headline leading-tight">
                            <Link href={`/professionals/${professional.id}`} className="hover:underline">
                                {professional.displayName}
                            </Link>
                        </h3>
                        <p className="text-sm text-black font-semibold">{professional.title}</p>
                    </div>
                    {professional.isVerified && (
                        <Badge variant="secondary" className="shrink-0 h-fit">Verificado</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{professional.bio}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{professional.city}</span>
                    </div>
                    {professional.category && (
                        <div className="flex items-center gap-1.5">
                            <span>{professional.category}</span>
                        </div>
                    )}
                    {professional.reviews.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-current text-black" />
                            <span>{averageRating.toFixed(1)} ({professional.reviews.length})</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

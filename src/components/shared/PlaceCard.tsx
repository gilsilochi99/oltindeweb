
import type { TouristLocation } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Tag } from "lucide-react";

export function PlaceCard({ place }: { place: TouristLocation }) {
    return (
        <Card className="w-full overflow-hidden transition-all hover:shadow-md flex flex-col">
            <CardHeader className="p-4">
                <div className="flex gap-4">
                    <div className="w-14 h-14 shrink-0">
                        <Image src={place.image} alt={place.name} width={56} height={56} className="object-cover rounded bg-muted w-14 h-14" />
                    </div>
                    <div className="flex-grow min-w-0">
                        <h3 className="text-lg font-bold font-headline leading-tight">
                            <Link href={`/places/${place.id}`} className="hover:underline">
                                {place.name}
                            </Link>
                        </h3>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{place.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{place.location.city}</span>
                    </div>
                    {place.category && (
                        <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{place.category}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

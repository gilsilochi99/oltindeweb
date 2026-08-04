
import type { Itinerary } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { MapPin, CalendarDays } from "lucide-react";

export function ItineraryCard({ itinerary }: { itinerary: Itinerary }) {
    return (
        <Card className="w-full overflow-hidden transition-all hover:shadow-md flex flex-col">
            <CardHeader className="p-4">
                <div className="flex gap-4">
                    <div className="w-14 h-14 shrink-0">
                        <Image src={itinerary.coverImage} alt={itinerary.title} width={56} height={56} className="object-cover rounded bg-muted w-14 h-14" />
                    </div>
                    <div className="flex-grow min-w-0">
                        <h3 className="text-lg font-bold font-headline leading-tight">
                            <Link href={`/itineraries/${itinerary.id}`} className="hover:underline">
                                {itinerary.title}
                            </Link>
                        </h3>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{itinerary.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{itinerary.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>{itinerary.durationDays} día{itinerary.durationDays === 1 ? '' : 's'}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

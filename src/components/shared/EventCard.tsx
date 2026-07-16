
import type { CalendarEvent } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { MapPin, CalendarDays, Tag } from "lucide-react";

function formatEventDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function EventCard({ event }: { event: CalendarEvent }) {
    const organizerHref = event.organizerType === 'company' ? `/companies/${event.organizerId}` : `/institutions/${event.organizerId}`;
    return (
        <Card className="w-full overflow-hidden transition-all hover:shadow-md flex flex-col">
            <CardHeader className="p-4">
                <div className="flex gap-4">
                    <div className="w-14 h-14 shrink-0">
                        <Link href={organizerHref}>
                            <Image src={event.organizerLogo} alt={`${event.organizerName} logo`} width={56} height={56} className="object-contain bg-muted" />
                        </Link>
                    </div>
                    <div className="flex-grow min-w-0">
                        <Link href={organizerHref} className="text-sm text-primary font-semibold hover:underline">
                            {event.organizerName}
                        </Link>
                        <h3 className="text-lg font-bold font-headline leading-tight mt-1">
                            <Link href={`/events/${event.id}`} className="hover:underline">
                                {event.title}
                            </Link>
                        </h3>
                    </div>
                    {event.status === 'cancelled' && (
                        <Badge variant="destructive" className="shrink-0 h-fit">Cancelado</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>{formatEventDate(event.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{event.city}</span>
                    </div>
                    {event.category && (
                        <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{event.category}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

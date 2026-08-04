import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';

export type ItineraryTimelineStop = {
  id: string;
  order: number;
  day: number;
  suggestedTime?: string;
  notes?: string;
  locationId: string;
  locationType: 'place' | 'company';
  locationName: string;
  locationImage?: string;
  locationCategory?: string;
};

export function ItineraryTimeline({ stops }: { stops: ItineraryTimelineStop[] }) {
  const orderedStops = [...stops].sort((a, b) => a.order - b.order);

  if (orderedStops.length === 0) {
    return <p className="text-sm text-muted-foreground">Este itinerario todavía no tiene paradas.</p>;
  }

  return (
    <ol className="space-y-6">
      {orderedStops.map((stop, index) => (
        <li key={stop.id} className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
              {stop.order}
            </div>
            {index < orderedStops.length - 1 && <div className="w-px flex-1 bg-outline-variant mt-1" />}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wide bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
                Día {stop.day}
              </span>
              {stop.suggestedTime && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {stop.suggestedTime}
                </span>
              )}
            </div>
            <div className="flex gap-3 items-start">
              {stop.locationImage && (
                <div className="w-16 h-16 rounded overflow-hidden shrink-0 bg-white border border-outline-variant">
                  <Image src={stop.locationImage} alt={stop.locationName} width={64} height={64} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <Link href={stop.locationType === 'company' ? `/companies/${stop.locationId}` : `/places/${stop.locationId}`} className="font-semibold text-secondary underline">
                  {stop.locationName}
                </Link>
                {stop.locationCategory && <p className="text-xs text-muted-foreground">{stop.locationCategory}</p>}
                {stop.notes && <p className="text-sm text-on-surface-variant mt-1">{stop.notes}</p>}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

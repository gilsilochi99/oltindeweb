
import { getItineraryById, getTouristLocationById } from "@/lib/data";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import { FavoriteButton } from "./_components/FavoriteButton";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection, ReviewsTeaserShell } from "@/components/shared/detail/StitchDetailKit";
import { DynamicItineraryMap } from "@/components/shared/itinerary/DynamicItineraryMap";
import { ItineraryTimeline } from "@/components/shared/itinerary/ItineraryTimeline";
import { AddReviewForm } from "@/components/shared/AddReviewForm";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { hasValidCoordinates } from "@/lib/map-utils";
import type { TouristLocation } from "@/lib/types";
import { CalendarDays, MapPin } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const itinerary = await getItineraryById(id);
  if (!itinerary) {
    return { title: 'Itinerario no encontrado' };
  }
  return { title: itinerary.title, description: itinerary.description };
}

export default async function ItineraryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itinerary = await getItineraryById(id);

  if (!itinerary) {
    notFound();
  }

  const orderedStops = [...itinerary.stops].sort((a, b) => a.order - b.order);
  const uniqueLocationIds = Array.from(new Set(orderedStops.map(s => s.locationId)));
  const locationDocs = await Promise.all(uniqueLocationIds.map(locId => getTouristLocationById(locId)));
  const locationsById = new Map<string, TouristLocation>();
  locationDocs.forEach(loc => { if (loc) locationsById.set(loc.id, loc); });

  const resolvedStops = orderedStops
    .map(stop => ({ stop, location: locationsById.get(stop.locationId) }))
    .filter((s): s is { stop: typeof orderedStops[number]; location: TouristLocation } => !!s.location);

  const mapStops = resolvedStops
    .filter(({ location }) => hasValidCoordinates(location.location))
    .map(({ stop, location }) => ({
      id: stop.id,
      order: stop.order,
      name: location.name,
      lat: location.location.lat,
      lng: location.location.lng,
    }));

  const timelineStops = resolvedStops.map(({ stop, location }) => ({
    id: stop.id,
    order: stop.order,
    day: stop.day,
    suggestedTime: stop.suggestedTime,
    notes: stop.notes,
    locationId: location.id,
    locationName: location.name,
    locationImage: location.image,
    locationCategory: location.category,
  }));

  const rating = itinerary.reviews && itinerary.reviews.length > 0
    ? itinerary.reviews.reduce((acc, r) => acc + r.rating, 0) / itinerary.reviews.length
    : undefined;

  return (
    <DetailShell
      sidebar={
        <>
          <SidebarCard title="Detalles del Viaje">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{itinerary.durationDays} día{itinerary.durationDays === 1 ? '' : 's'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{itinerary.city}</span>
              </div>
              <div className="text-muted-foreground">Por {itinerary.authorName}</div>
            </div>
          </SidebarCard>
          {mapStops.length > 0 && (
            <SidebarCard title="Mapa del Recorrido" className="mt-5">
              <DynamicItineraryMap stops={mapStops} height="280px" />
            </SidebarCard>
          )}
        </>
      }
    >
      <DetailHero
        logoSrc={itinerary.coverImage}
        logoAlt={itinerary.title}
        name={itinerary.title}
        rating={rating}
        reviewCount={itinerary.reviews?.length || 0}
        tags={itinerary.theme}
        actions={
          <>
            <ShareButtons path={`/itineraries/${itinerary.id}`} title={itinerary.title} />
            <FavoriteButton itineraryId={itinerary.id} />
          </>
        }
      />

      <InfoCard title="Sobre este Itinerario">
        <InfoSection label="Descripción" divider={false}>
          <p>{itinerary.description}</p>
        </InfoSection>
      </InfoCard>

      <div className="mt-8 bg-white border border-outline-variant rounded-sm p-6 shadow-sm">
        <h2 className="text-lg font-bold text-on-background mb-4">Recorrido Paso a Paso</h2>
        <ItineraryTimeline stops={timelineStops} />
      </div>

      <ReviewsTeaserShell title="Opiniones de Viajeros">
        <div className="space-y-4">
          {itinerary.reviews && itinerary.reviews.length > 0 ? (
            itinerary.reviews.map(review => <ReviewCard key={review.id} review={review} />)
          ) : (
            <p className="text-sm text-muted-foreground">Sea el primero en opinar sobre este itinerario.</p>
          )}
        </div>
      </ReviewsTeaserShell>

      <div className="mt-6">
        <AddReviewForm entityId={itinerary.id} entityType="itineraries" />
      </div>
    </DetailShell>
  );
}

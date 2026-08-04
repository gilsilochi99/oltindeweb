
import { getItineraryById, getTouristLocationById, getCompanyById } from "@/lib/data";
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
import type { ItineraryStop, ItineraryStopLocationType } from "@/lib/types";
import { CalendarDays, MapPin } from "lucide-react";

type ResolvedStopLocation = {
  id: string;
  type: ItineraryStopLocationType;
  name: string;
  image?: string;
  category?: string;
  location: { lat?: number; lng?: number };
};

async function resolveStopLocation(stop: ItineraryStop): Promise<ResolvedStopLocation | undefined> {
  const type = stop.locationType || 'place';
  if (type === 'company') {
    const company = await getCompanyById(stop.locationId);
    if (!company) return undefined;
    return {
      id: company.id,
      type,
      name: company.name,
      image: company.logo,
      category: company.category,
      location: company.branches?.[0]?.location || {},
    };
  }
  const place = await getTouristLocationById(stop.locationId);
  if (!place) return undefined;
  return {
    id: place.id,
    type,
    name: place.name,
    image: place.image,
    category: place.category,
    location: place.location,
  };
}

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
  const uniqueStopKeys = Array.from(new Map(orderedStops.map(s => [`${s.locationType || 'place'}:${s.locationId}`, s])).values());
  const locationDocs = await Promise.all(uniqueStopKeys.map(s => resolveStopLocation(s)));
  const locationsByKey = new Map<string, ResolvedStopLocation>();
  locationDocs.forEach(loc => { if (loc) locationsByKey.set(`${loc.type}:${loc.id}`, loc); });

  const resolvedStops = orderedStops
    .map(stop => ({ stop, location: locationsByKey.get(`${stop.locationType || 'place'}:${stop.locationId}`) }))
    .filter((s): s is { stop: typeof orderedStops[number]; location: ResolvedStopLocation } => !!s.location);

  const mapStops = resolvedStops
    .filter(({ location }) => hasValidCoordinates(location.location))
    .map(({ stop, location }) => ({
      id: stop.id,
      order: stop.order,
      name: location.name,
      lat: location.location.lat as number,
      lng: location.location.lng as number,
    }));

  const timelineStops = resolvedStops.map(({ stop, location }) => ({
    id: stop.id,
    order: stop.order,
    day: stop.day,
    suggestedTime: stop.suggestedTime,
    notes: stop.notes,
    locationId: location.id,
    locationType: location.type,
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
            <SidebarCard title="Mapa del Recorrido" className="mt-5 hidden md:block">
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

      {mapStops.length > 0 && (
        <SidebarCard title="Mapa del Recorrido" className="mt-8 md:hidden">
          <DynamicItineraryMap stops={mapStops} height="280px" />
        </SidebarCard>
      )}

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

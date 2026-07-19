
import { getTouristLocationById } from "@/lib/data";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import { FavoriteButton } from "./_components/FavoriteButton";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection } from "@/components/shared/detail/StitchDetailKit";
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { stitch } from "@/components/shared/detail/stitch-tokens";
import { DynamicItineraryMap } from "@/components/shared/itinerary/DynamicItineraryMap";
import { hasValidCoordinates } from "@/lib/map-utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const location = await getTouristLocationById(id);
  if (!location || location.status !== 'approved') {
    return { title: 'Lugar no encontrado' };
  }
  return { title: location.name, description: location.description };
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const location = await getTouristLocationById(id);

  if (!location || location.status !== 'approved') {
    notFound();
  }

  const rating = location.reviews && location.reviews.length > 0
    ? location.reviews.reduce((acc, r) => acc + r.rating, 0) / location.reviews.length
    : undefined;

  return (
    <DetailShell
      sidebar={
        <SidebarCard title="Información">
          <div className="space-y-3">
            <div className="flex items-start gap-3" style={{ color: stitch.secondary }}>
              <MaterialIcon name="location_on" className="!text-[18px] mt-0.5" />
              <span className="text-sm text-black">{location.location.address}, {location.location.city}</span>
            </div>
            {location.priceRange && (
              <div className="flex items-start gap-3" style={{ color: stitch.secondary }}>
                <MaterialIcon name="payments" className="!text-[18px] mt-0.5" />
                <span className="text-sm text-black">{location.priceRange === 'free' ? 'Entrada gratuita' : `Rango de precio: ${location.priceRange}`}</span>
              </div>
            )}
          </div>
          {hasValidCoordinates(location.location) && (
            <div className="mt-4">
              <DynamicItineraryMap
                stops={[{ id: location.id, order: 1, name: location.name, lat: location.location.lat, lng: location.location.lng }]}
                height="220px"
                defaultZoom={14}
              />
            </div>
          )}
        </SidebarCard>
      }
    >
      <DetailHero
        logoSrc={location.image}
        logoAlt={location.name}
        name={location.name}
        rating={rating}
        reviewCount={location.reviews?.length || 0}
        tags={[location.category, location.location.city].filter(Boolean) as string[]}
        actions={
          <>
            <ShareButtons path={`/places/${location.id}`} title={location.name} />
            <FavoriteButton placeId={location.id} />
          </>
        }
      />

      <InfoCard title="Sobre este Lugar">
        <InfoSection label="Descripción" divider={false}>
          <p>{location.description}</p>
        </InfoSection>

        {location.openingHours && location.openingHours.length > 0 && (
          <InfoSection label="Horario">
            <ul className="space-y-1">
              {location.openingHours.map((h, i) => (
                <li key={i} className="flex justify-between text-sm max-w-xs">
                  <span className="font-medium">{h.day}</span>
                  <span>{h.hours}</span>
                </li>
              ))}
            </ul>
          </InfoSection>
        )}
      </InfoCard>
    </DetailShell>
  );
}

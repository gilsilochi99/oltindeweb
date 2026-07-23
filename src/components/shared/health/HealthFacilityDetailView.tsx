import { ShareButtons } from "@/components/shared/ShareButtons";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection } from "@/components/shared/detail/StitchDetailKit";
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { stitch } from "@/components/shared/detail/stitch-tokens";
import { DynamicItineraryMap } from "@/components/shared/itinerary/DynamicItineraryMap";
import { hasValidCoordinates } from "@/lib/map-utils";
import type { HealthFacility } from "@/lib/types";
import placeholderImages from '@/lib/placeholder-images.json';
import { JsonLd } from "@/components/shared/JsonLd";
import { buildHealthFacilitySchema } from "@/lib/structured-data";

const OWNERSHIP_LABELS = { public: 'Público', private: 'Privado' } as const;

export function HealthFacilityDetailView({ facility, detailPath }: { facility: HealthFacility; detailPath: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const isOnDutyToday = facility.type === 'pharmacy' && (facility.onDutyDates || []).includes(today);

  const tags = [
    OWNERSHIP_LABELS[facility.ownership],
    facility.location.city,
    ...(facility.emergencyServices ? ['Urgencias 24h'] : []),
    ...(isOnDutyToday ? ['De Guardia Hoy'] : []),
  ].filter(Boolean) as string[];

  return (
    <>
    <JsonLd data={buildHealthFacilitySchema(facility, detailPath)} />
    <DetailShell
      sidebar={
        <SidebarCard title="Información">
          <div className="space-y-3">
            <div className="flex items-start gap-3" style={{ color: stitch.secondary }}>
              <MaterialIcon name="location_on" className="!text-[18px] mt-0.5" />
              <span className="text-sm text-black">{facility.location.address}, {facility.location.city}</span>
            </div>
            {facility.contact.phone && (
              <a href={`tel:${facility.contact.phone}`} className="flex items-start gap-3 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                <MaterialIcon name="call" className="!text-[18px] mt-0.5" />
                <span className="text-black">{facility.contact.phone}</span>
              </a>
            )}
            {facility.contact.email && (
              <a href={`mailto:${facility.contact.email}`} className="flex items-start gap-3 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                <MaterialIcon name="mail" className="!text-[18px] mt-0.5" />
                <span className="text-black">{facility.contact.email}</span>
              </a>
            )}
          </div>
          {hasValidCoordinates(facility.location) && (
            <div className="mt-4">
              <DynamicItineraryMap
                stops={[{ id: facility.id, order: 1, name: facility.name, lat: facility.location.lat, lng: facility.location.lng }]}
                height="220px"
                defaultZoom={14}
              />
            </div>
          )}
        </SidebarCard>
      }
    >
      <DetailHero
        logoSrc={facility.image || placeholderImages.logo.src}
        logoAlt={facility.name}
        name={facility.name}
        tags={tags}
        actions={<ShareButtons path={`${detailPath}/${facility.id}`} title={facility.name} />}
      />

      {isOnDutyToday && (
        <div className="rounded-md border border-green-600/30 bg-green-50 text-green-800 px-4 py-3 text-sm font-semibold">
          Esta farmacia está de guardia hoy.
        </div>
      )}

      <InfoCard title="Sobre este Centro">
        <InfoSection label="Descripción" divider={false}>
          <p>{facility.description}</p>
        </InfoSection>

        {facility.services && facility.services.length > 0 && (
          <InfoSection label="Servicios">
            <div className="flex flex-wrap gap-1.5">
              {facility.services.map(s => (
                <span key={s} className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full text-xs">{s}</span>
              ))}
            </div>
          </InfoSection>
        )}

        {facility.specialties && facility.specialties.length > 0 && (
          <InfoSection label="Especialidades">
            <div className="flex flex-wrap gap-1.5">
              {facility.specialties.map(s => (
                <span key={s} className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full text-xs">{s}</span>
              ))}
            </div>
          </InfoSection>
        )}

        {facility.openingHours && facility.openingHours.length > 0 && (
          <InfoSection label="Horario">
            <ul className="space-y-1">
              {facility.openingHours.map((h, i) => (
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
    </>
  );
}

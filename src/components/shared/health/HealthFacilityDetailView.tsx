import { ShareButtons } from "@/components/shared/ShareButtons";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection } from "@/components/shared/detail/StitchDetailKit";
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { stitch } from "@/components/shared/detail/stitch-tokens";
import { DynamicItineraryMap } from "@/components/shared/itinerary/DynamicItineraryMap";
import { hasValidCoordinates } from "@/lib/map-utils";
import type { HealthFacility, Service } from "@/lib/types";
import placeholderImages from '@/lib/placeholder-images.json';
import { JsonLd } from "@/components/shared/JsonLd";
import { buildHealthFacilitySchema } from "@/lib/structured-data";

const OWNERSHIP_LABELS = { public: 'Público', private: 'Privado' } as const;

export function HealthFacilityDetailView({ facility, services, detailPath }: { facility: HealthFacility; services: Service[]; detailPath: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const isOnDutyToday = facility.type === 'pharmacy' && (facility.onDutyDates || []).includes(today);
  const mainBranch = facility.branches?.[0];
  const serviceNames = (facility.services || []).map(id => services.find(s => s.id === id)?.name).filter(Boolean) as string[];

  const mapStops = (facility.branches || [])
    .filter(b => hasValidCoordinates(b.location))
    .map((b, i) => ({ id: `${facility.id}-${i}`, order: i + 1, name: b.name, lat: b.location.lat, lng: b.location.lng }));

  const tags = [
    OWNERSHIP_LABELS[facility.ownership],
    mainBranch?.location.city,
    ...(facility.emergencyServices ? ['Urgencias 24h'] : []),
    ...(isOnDutyToday ? ['De Guardia Hoy'] : []),
  ].filter(Boolean) as string[];

  return (
    <>
    <JsonLd data={buildHealthFacilitySchema(facility, detailPath)} />
    <DetailShell
      sidebar={
        <SidebarCard title={facility.branches?.length > 1 ? 'Sucursales' : 'Información'}>
          <div className="space-y-4">
            {(facility.branches || []).map((branch, i) => (
              <div key={i} className={i > 0 ? "pt-4 border-t border-outline-variant" : undefined}>
                {facility.branches.length > 1 && (
                  <p className="text-sm font-bold text-on-background mb-1.5">{branch.name}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-start gap-3" style={{ color: stitch.secondary }}>
                    <MaterialIcon name="location_on" className="!text-[18px] mt-0.5" />
                    <span className="text-sm text-black">{branch.location.address}, {branch.location.city}</span>
                  </div>
                  {branch.contact.phone && (
                    <a href={`tel:${branch.contact.phone}`} className="flex items-start gap-3 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                      <MaterialIcon name="call" className="!text-[18px] mt-0.5" />
                      <span className="text-black">{branch.contact.phone}</span>
                    </a>
                  )}
                  {branch.contact.email && (
                    <a href={`mailto:${branch.contact.email}`} className="flex items-start gap-3 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                      <MaterialIcon name="mail" className="!text-[18px] mt-0.5" />
                      <span className="text-black">{branch.contact.email}</span>
                    </a>
                  )}
                  {branch.workingHours && branch.workingHours.length > 0 && (
                    <ul className="space-y-0.5 pt-1">
                      {branch.workingHours.map((h, hi) => (
                        <li key={hi} className="flex justify-between text-xs text-secondary max-w-xs">
                          <span className="font-medium">{h.day}</span>
                          <span>{h.hours}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {facility.contact?.whatsapp && (
              <a href={`https://wa.me/${facility.contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-sm font-semibold underline pt-3 border-t border-outline-variant" style={{ color: stitch.secondary }}>
                <MaterialIcon name="chat" className="!text-[18px] mt-0.5" />
                <span className="text-black">WhatsApp</span>
              </a>
            )}
          </div>
          {mapStops.length > 0 && (
            <div className="mt-4">
              <DynamicItineraryMap
                stops={mapStops}
                height="220px"
                defaultZoom={mapStops.length > 1 ? 12 : 14}
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

        {serviceNames.length > 0 && (
          <InfoSection label="Servicios">
            <div className="flex flex-wrap gap-1.5">
              {serviceNames.map(s => (
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
      </InfoCard>
    </DetailShell>
    </>
  );
}

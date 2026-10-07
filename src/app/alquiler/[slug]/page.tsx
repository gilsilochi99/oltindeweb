import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BadgeCheck, Bath, BedDouble, CalendarRange, Car, Check, Eye, Fuel, Gauge, MapPin, Ruler, Sofa, Store, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DynamicDirectoryMap } from '@/components/shared/DynamicDirectoryMap';
import { getCompanyById } from '@/lib/data';
import { getRentalBySlug, getSimilarRentals } from '@/lib/rentals/public';
import { DRIVER_OPTION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, kindLabel, unitLabel, type RentalListing } from '@/lib/rentals/types';
import { formatXaf } from '@/lib/shop/types';
import { categorySlug } from '@/lib/rentals/query-params';
import { RentalBreadcrumbs, RentalPrices, RentalRail } from '@/components/rentals/RentalCard';
import { RentalContactButtons, RentalGallery } from '@/components/rentals/RentalDetailClient';
import { BookingWidget } from '@/components/rentals/BookingWidget';

type Props = { params: Promise<{ slug: string }> };

const absolute = (url: string) => (url.startsWith('http') ? url : `https://oltinde.com${url}`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getRentalBySlug(slug);
  if (!found) return { title: 'Anuncio no encontrado' };
  const { listing, isPreview } = found;
  const description = `${kindLabel(listing.category, listing.kind)} en alquiler en ${listing.city}. ${listing.description}`.slice(0, 160);
  return {
    title: `${listing.title} — Alquiler en ${listing.city}`,
    description,
    alternates: { canonical: `/alquiler/${listing.slug}` },
    robots: isPreview ? { index: false, follow: false } : undefined,
    openGraph: { title: listing.title, description, images: listing.images.slice(0, 4).map(i => absolute(i.url)) },
  };
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Icon className="w-5 h-5 shrink-0 text-muted-foreground" />
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold text-sm">{value}</p></div>
    </div>
  );
}

function facts(l: RentalListing) {
  const out: { icon: React.ElementType; label: string; value: string }[] = [];
  if (l.category === 'property') {
    if (l.bedrooms !== undefined) out.push({ icon: BedDouble, label: 'Habitaciones', value: String(l.bedrooms) });
    if (l.bathrooms !== undefined) out.push({ icon: Bath, label: 'Baños', value: String(l.bathrooms) });
    if (l.areaM2 !== undefined) out.push({ icon: Ruler, label: 'Superficie', value: `${l.areaM2} m²` });
    if (l.maxGuests !== undefined) out.push({ icon: Users, label: 'Personas', value: `Hasta ${l.maxGuests}` });
    if (l.furnished !== undefined) out.push({ icon: Sofa, label: 'Amueblado', value: l.furnished ? 'Sí' : 'No' });
  } else {
    if (l.brand || l.model) out.push({ icon: Car, label: 'Vehículo', value: [l.brand, l.model, l.year].filter(Boolean).join(' ') });
    if (l.seats !== undefined) out.push({ icon: Users, label: 'Plazas', value: String(l.seats) });
    if (l.transmission) out.push({ icon: Gauge, label: 'Cambio', value: TRANSMISSION_LABELS[l.transmission] ?? l.transmission });
    if (l.fuel) out.push({ icon: Fuel, label: 'Combustible', value: FUEL_LABELS[l.fuel] ?? l.fuel });
    if (l.driverOption) out.push({ icon: UserRound, label: 'Conductor', value: DRIVER_OPTION_LABELS[l.driverOption] });
  }
  return out;
}

export default async function RentalDetailPage({ params }: Props) {
  const { slug } = await params;
  const found = await getRentalBySlug(slug);
  if (!found) notFound();
  const { listing: l, isPreview } = found;
  const [company, { similar, fromCompany }] = await Promise.all([
    getCompanyById(l.companyId),
    getSimilarRentals(l.id, l.category, l.city, l.companyId),
  ]);
  const branch = company?.branches?.[0];
  const unit = unitLabel(l.category);
  const searchCat = `/alquiler/buscar?cat=${categorySlug(l.category)}`;

  return (
    <div className="space-y-10">
      <div>
        <RentalBreadcrumbs items={[
          { label: l.category === 'property' ? 'Inmuebles' : 'Vehículos', href: searchCat },
          { label: l.city, href: `${searchCat}&ciudad=${encodeURIComponent(l.city)}` },
          { label: l.title, href: `/alquiler/${l.slug}` },
        ]} />
        {isPreview && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Eye className="w-4 h-4" />Vista previa: este anuncio no está publicado y solo usted puede verlo.</span>
            <Link href={`/dashboard/companies/${l.companyId}/rentals/${l.id}`} className="font-semibold underline">Editar anuncio</Link>
          </div>
        )}
        <div className="space-y-1 mb-4">
          <p className="text-sm text-muted-foreground">{kindLabel(l.category, l.kind)} en alquiler</p>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{l.title}</h1>
          <p className="text-muted-foreground flex items-center gap-1"><MapPin className="w-4 h-4" />{[l.neighborhood, l.city].filter(Boolean).join(', ')}</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          <div className="space-y-8 min-w-0">
            <RentalGallery images={l.images} title={l.title} category={l.category} />

            {facts(l).length > 0 && (
              <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">{facts(l).map(f => <Fact key={f.label} {...f} />)}</section>
            )}

            <section className="space-y-3">
              <h2 className="text-xl font-bold">Descripción</h2>
              <p className="whitespace-pre-line leading-relaxed">{l.description}</p>
            </section>

            {l.amenities.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold">{l.category === 'property' ? 'Servicios y equipamiento' : 'Equipamiento'}</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {l.amenities.map(a => <li key={a} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-600" />{a}</li>)}
                </ul>
              </section>
            )}

            {l.rules && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold">{l.category === 'property' ? 'Normas' : 'Requisitos y condiciones'}</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed">{l.rules}</p>
              </section>
            )}

            {l.lat !== undefined && l.lng !== undefined && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold">{l.category === 'property' ? 'Ubicación' : 'Punto de recogida'}</h2>
                <DynamicDirectoryMap
                  markers={[{ id: l.companyId, name: l.title, category: kindLabel(l.category, l.kind), type: 'company', branchName: l.companyName, lat: l.lat, lng: l.lng }]}
                  height="300px" singleMarker defaultCenter={{ lat: l.lat, lng: l.lng }} defaultZoom={15}
                />
                {l.address && <p className="text-sm text-muted-foreground">{l.address}</p>}
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-outline-variant bg-card p-5 space-y-4">
              <RentalPrices item={l} size="lg" />
              <ul className="text-sm space-y-1 text-muted-foreground">
                {l.shortTermEnabled && <li className="flex items-center gap-2"><CalendarRange className="w-4 h-4" />Mínimo {l.minUnits} {unitLabel(l.category, l.minUnits !== 1)}{l.maxUnits ? `, máximo ${l.maxUnits}` : ''}</li>}
                {l.longTermEnabled && <li className="flex items-center gap-2"><CalendarRange className="w-4 h-4" />Alquiler mensual: mínimo {l.minMonths} {l.minMonths === 1 ? 'mes' : 'meses'}</li>}
                {l.deposit ? <li>Fianza: <span className="font-medium text-foreground">{formatXaf(l.deposit)}</span></li> : null}
                {l.driverOption && l.driverOption !== 'none' && l.driverDailyFee ? <li>Conductor: +{formatXaf(l.driverDailyFee)} / día</li> : null}
                {l.priceNotes && <li>{l.priceNotes}</li>}
              </ul>
              <RentalContactButtons
                listingId={l.id} title={l.title} slug={l.slug} companyName={l.companyName} isPreview={isPreview}
                whatsapp={company?.contact.socialMedia?.whatsapp || branch?.contact.phone || undefined}
                phone={branch?.contact.phone || undefined}
              />
              <p className="text-xs text-muted-foreground">¿Dudas? Escriba o llame a la empresa. Para reservar, elija fechas abajo.</p>
            </div>

            {!isPreview && <BookingWidget listing={l} />}

            <div className="rounded-lg border border-outline-variant bg-card p-5 space-y-3">
              <p className="text-sm font-semibold">Anunciado por</p>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-md border bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  {company?.logo ? <Image src={company.logo} alt={l.companyName} fill sizes="48px" className="object-contain p-1" /> : <Store className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold flex items-center gap-1.5"><span className="truncate">{l.companyName}</span>{company?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" aria-label="Empresa verificada" />}</p>
                  {branch?.location.city && <p className="text-xs text-muted-foreground">{branch.location.city}</p>}
                </div>
              </div>
              <Button variant="outline" asChild className="w-full"><Link href={`/companies/${l.companyId}`}>Ver la empresa</Link></Button>
            </div>
          </aside>
        </div>
      </div>

      <RentalRail title={`Más de ${l.companyName}`} items={fromCompany} />
      <RentalRail title={`Similares en ${l.city}`} href={`${searchCat}&ciudad=${encodeURIComponent(l.city)}`} items={similar} />
    </div>
  );
}

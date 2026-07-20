
import { getEventById, getCompanyById, getInstitutionById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building, Landmark, CalendarDays, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FavoriteButton } from "./_components/FavoriteButton";
import { ShareButtons } from "@/components/shared/ShareButtons";
import type { Metadata } from 'next';
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection } from "@/components/shared/detail/StitchDetailKit";
import { stitch } from "@/components/shared/detail/stitch-tokens";
import placeholderImages from '@/lib/placeholder-images.json';
import { JsonLd } from "@/components/shared/JsonLd";
import { buildEventSchema } from "@/lib/structured-data";

function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return { title: 'Evento no encontrado' };
  }
  return { title: `${event.title} - ${event.organizerName}`, description: event.description };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const organizer = event.organizerType === 'company'
    ? await getCompanyById(event.organizerId)
    : await getInstitutionById(event.organizerId);
  const organizerHref = event.organizerType === 'company' ? `/companies/${event.organizerId}` : `/institutions/${event.organizerId}`;
  const OrganizerIcon = event.organizerType === 'company' ? Building : Landmark;

  const registerHref = event.registrationMethod === 'email'
    ? `mailto:${event.registrationValue}`
    : event.registrationMethod === 'link'
      ? event.registrationValue
      : undefined;

  return (
    <>
    <JsonLd data={buildEventSchema(event)} />
    <DetailShell
        sidebar={
            organizer && (
                <SidebarCard title="Sobre el organizador">
                    <div className="flex items-center gap-3 mb-4">
                        <Image src={organizer.logo || placeholderImages.logo.src} alt={`${organizer.name} logo`} width={48} height={48} className="rounded-md bg-muted object-contain w-12 h-12" />
                        <div>
                            <Link href={organizerHref} className="font-semibold underline text-sm leading-tight" style={{ color: stitch.secondary }}>
                                {organizer.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{organizer.category}</p>
                        </div>
                    </div>
                    {organizer.contact.email && (
                        <a href={`mailto:${organizer.contact.email}`} className="flex items-center gap-3 py-1 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                            <MaterialIcon name="mail" className="!text-[18px]" />
                            {organizer.contact.email}
                        </a>
                    )}
                    <Button asChild className="w-full mt-4" variant="outline">
                        <Link href={organizerHref}><OrganizerIcon className="w-4 h-4 mr-2" />Ver Perfil Completo</Link>
                    </Button>
                </SidebarCard>
            )
        }
    >
        <DetailHero
            logoSrc={organizer?.logo || placeholderImages.logo.src}
            logoAlt={`${event.organizerName} logo`}
            name={event.title}
            tags={[event.category, event.city].filter(Boolean) as string[]}
            actions={
                <>
                    {event.status === 'cancelled' && <span className="text-xs font-bold uppercase text-white bg-red-500 px-2 py-1 rounded">Cancelado</span>}
                    <ShareButtons path={`/events/${event.id}`} title={event.title} />
                    <FavoriteButton eventId={event.id} />
                </>
            }
        />

        <InfoCard title="Detalles del Evento">
            <InfoSection label="Descripción" divider={false}>
                <p>{event.description}</p>
            </InfoSection>

            <InfoSection label="Fecha y Hora">
                <div className="space-y-1">
                    <p className="flex items-center gap-2 font-medium">
                        <CalendarDays className="w-4 h-4" />
                        Inicio: {formatEventDateTime(event.startDate)}
                    </p>
                    {event.endDate && (
                        <p className="flex items-center gap-2 font-medium">
                            <CalendarDays className="w-4 h-4" />
                            Fin: {formatEventDateTime(event.endDate)}
                        </p>
                    )}
                </div>
            </InfoSection>

            {event.address && (
                <InfoSection label="Ubicación">
                    <p>{event.address}, {event.city}</p>
                </InfoSection>
            )}

            <div className="mt-8">
                {event.status === 'scheduled' ? (
                    registerHref ? (
                        <Button asChild size="lg" className="w-full sm:w-auto">
                            <a href={registerHref} target={event.registrationMethod === 'link' ? '_blank' : undefined} rel="noopener noreferrer">
                                Registrarse {event.registrationMethod === 'link' && <ExternalLink className="w-4 h-4 ml-2" />}
                            </a>
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4" style={{ color: stitch.primary }} />
                            <span>Entrada libre, no se requiere registro.</span>
                        </div>
                    )
                ) : (
                    <Button size="lg" className="w-full sm:w-auto" disabled>Este evento ha sido cancelado</Button>
                )}
            </div>
        </InfoCard>
    </DetailShell>
    </>
  );
}

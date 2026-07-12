
import { getEventById, getCompanyById, getInstitutionById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Landmark, CalendarDays, Mail, MapPin, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FavoriteButton } from "./_components/FavoriteButton";
import type { Metadata } from 'next';

function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await getEventById(params.id);
  if (!event) {
    return { title: 'Evento no encontrado' };
  }
  return { title: `${event.title} - ${event.organizerName}`, description: event.description };
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

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
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>Evento</span>
                {event.status === 'cancelled' && <Badge variant="destructive">Cancelado</Badge>}
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold font-headline mt-2">{event.title}</CardTitle>
              <CardDescription className="text-lg pt-2">
                <Link href={organizerHref} className="text-primary hover:underline font-medium">{event.organizerName}</Link>
                {' · '}{event.city}
              </CardDescription>
            </div>
            <FavoriteButton eventId={event.id} />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-4">
            <Badge variant="secondary" className="gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{formatEventDateTime(event.startDate)}</Badge>
            {event.category && <Badge variant="secondary">{event.category}</Badge>}
            <Badge variant="secondary" className="gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.city}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none dark:prose-invert">
            <p>{event.description}</p>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>Inicio: {formatEventDateTime(event.startDate)}</span>
            </div>
            {event.endDate && (
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Fin: {formatEventDateTime(event.endDate)}</span>
              </div>
            )}
            {event.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{event.address}, {event.city}</span>
              </div>
            )}
          </div>

          {event.status === 'scheduled' ? (
            registerHref ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href={registerHref} target={event.registrationMethod === 'link' ? '_blank' : undefined} rel="noopener noreferrer">
                  Registrarse {event.registrationMethod === 'link' && <ExternalLink className="w-4 h-4 ml-2" />}
                </a>
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Entrada libre, no se requiere registro.</span>
              </div>
            )
          ) : (
            <Button size="lg" className="w-full sm:w-auto" disabled>Este evento ha sido cancelado</Button>
          )}
        </CardContent>
      </Card>

      {organizer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sobre el organizador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Image src={organizer.logo} alt={`${organizer.name} logo`} width={60} height={60} className="rounded-md border bg-muted object-contain" />
              <div>
                <h3 className="font-semibold text-lg">{organizer.name}</h3>
                <p className="text-sm text-muted-foreground">{organizer.category}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${organizer.contact.email}`} className="text-primary hover:underline">{organizer.contact.email}</a>
              </div>
            </div>
            <Button asChild className="mt-4" variant="outline">
              <Link href={organizerHref}><OrganizerIcon className="w-4 h-4 mr-2" />Ver Perfil Completo</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

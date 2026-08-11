

import { getInstitutionById, getInstitutions, getProcedures } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { AddReviewForm } from "@/components/shared/AddReviewForm";
import { ReportInfoDialog } from "@/components/shared/ReportInfoDialog";
import { FavoriteButton } from "./_components/FavoriteButton";
import { ShareButtons } from "@/components/shared/ShareButtons";
import Link from "next/link";
import { StarRating } from "@/components/shared/StarRating";
import type { Metadata, ResolvingMetadata } from 'next';
import placeholderImages from '@/lib/placeholder-images.json';
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { hasValidCoordinates } from "@/lib/map-utils";
import { DynamicDirectoryMap } from "@/components/shared/DynamicDirectoryMap";
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection, ReviewsTeaserShell } from "@/components/shared/detail/StitchDetailKit";
import { QuickActionsRow } from "@/components/shared/detail/QuickActionsRow";
import { DetailSectionNav } from "@/components/shared/detail/DetailSectionNav";
import { stitch } from "@/components/shared/detail/stitch-tokens";

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const institution = await getInstitutionById(id)

  if (!institution) {
    return {
      title: 'Institución no encontrada'
    }
  }

  return {
    title: institution.name,
    description: institution.description,
  }
}

export async function generateStaticParams() {
    const institutions = await getInstitutions();
    return institutions.map((institution) => ({
      id: institution.id,
    }));
}

export default async function InstitutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const institution = await getInstitutionById(id);
  const allInstitutions = await getInstitutions();
  const allProcedures = await getProcedures();

  if (!institution) {
    notFound();
  }

  const reviews = institution.reviews || [];
  const branches = institution.branches || [];
  const procedures = institution.procedures || [];

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length : 0;
  const logoUrl = institution.logo || placeholderImages.logo.src;
  const mainBranch = branches?.[0];

  const relatedInstitutions = allInstitutions
    .filter(i => i.category === institution.category && i.id !== institution.id)
    .map(i => {
        const avgRating = i.reviews.length > 0 ? i.reviews.reduce((acc, r) => acc + r.rating, 0) / i.reviews.length : 0;
        return { ...i, averageRating: avgRating };
    })
    .slice(0, 5);

  const institutionProcedureIds = new Set(procedures.map(p => p.id));
  const otherProcedures = allProcedures.filter(p => !institutionProcedureIds.has(p.id)).slice(0, 7);

  return (
    <DetailShell
        sidebar={
            <>
                <SidebarCard>
                    {mainBranch?.contact.phone && (
                        <div className="mb-6">
                            <a href={`tel:${mainBranch.contact.phone}`} className="flex items-center gap-3 mb-4" style={{ color: stitch.secondary }}>
                                <MaterialIcon name="call" className="!text-[28px]" />
                                <span className="text-xl font-bold text-[#1a1c1c]">{mainBranch.contact.phone}</span>
                            </a>
                            <div className="space-y-3">
                                {institution.contact.website && (
                                    <a href={institution.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                                        <MaterialIcon name="language" />
                                        Visitar Sitio Web
                                    </a>
                                )}
                                {hasValidCoordinates(mainBranch.location) && (
                                    <a href={`https://www.google.com/maps?q=${mainBranch.location.lat},${mainBranch.location.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                                        <MaterialIcon name="map" />
                                        Ver en Mapa &amp; Direcciones
                                    </a>
                                )}
                                <div className="text-[13px] text-black ml-9 -mt-2">
                                    {mainBranch.location.address}<br />
                                    {mainBranch.location.city}, Guinea Ecuatorial
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                        <WhatsAppButton value={institution.contact.whatsapp} />
                        {institution.contact.email && (
                            <Button variant="default" size="icon" asChild>
                                <a href={`mailto:${institution.contact.email}`}><MaterialIcon name="mail" className="!text-[18px]" /></a>
                            </Button>
                        )}
                    </div>
                    <a href="#reviews" className="w-full mt-4 border py-2.5 rounded text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#eeeeee] transition-colors" style={{ borderColor: stitch.outline, color: stitch.secondary }}>
                        <MaterialIcon name="edit_note" className="!text-[18px]" /> Escribir una Reseña
                    </a>
                </SidebarCard>

                {mainBranch?.workingHours && mainBranch.workingHours.length > 0 && (
                    <SidebarCard title="Horario">
                        <div className="space-y-2 text-sm">
                            {mainBranch.workingHours.map((wh, index) => (
                                <div key={index} className="flex justify-between">
                                    <span>{wh.day}</span>
                                    <span className="font-medium" style={wh.hours.toLowerCase().includes('cerrado') ? { color: stitch.error } : undefined}>{wh.hours}</span>
                                </div>
                            ))}
                        </div>
                    </SidebarCard>
                )}

                {branches.length > 0 && (
                    <SidebarCard title="Ubicaciones">
                        <ul className="space-y-4">
                            {branches.map(branch => (
                                <li key={branch.id}>
                                    <p className="text-sm font-bold" style={{ color: stitch.secondary }}>{branch.name}</p>
                                    <p className="text-xs text-black">{branch.location.address}, {branch.location.city}</p>
                                </li>
                            ))}
                        </ul>
                    </SidebarCard>
                )}

                {relatedInstitutions.length > 0 && (
                    <SidebarCard title="Instituciones Similares">
                        <div className="space-y-4">
                            {relatedInstitutions.map(related => {
                                const relatedMainBranch = related.branches[0];
                                return (
                                <div key={related.id} className="p-3 border rounded-lg space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Image src={related.logo} alt={related.name} width={40} height={40} className="rounded-md bg-muted object-contain w-10 h-10" data-ai-hint="institution logo"/>
                                        <div className="flex-1">
                                            <Link href={`/institutions/${related.id}`} className="font-semibold underline text-sm leading-tight" style={{ color: stitch.secondary }}>
                                                {related.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">{related.category}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                 <StarRating rating={related.averageRating} iconClassName="w-3 h-3"/>
                                                 <span className="text-xs text-muted-foreground">({related.reviews.length})</span>
                                            </div>
                                        </div>
                                    </div>
                                    {relatedMainBranch && (
                                        <div className="text-xs text-muted-foreground space-y-1 border-t pt-2 mt-2">
                                            <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3"/>{relatedMainBranch.location.city}</p>
                                            <p className="flex items-center gap-1.5"><Phone className="w-3 h-3"/>{relatedMainBranch.contact.phone}</p>
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    </SidebarCard>
                )}

                {otherProcedures.length > 0 && (
                    <SidebarCard title="También te puede interesar">
                        <div className="space-y-2">
                            {otherProcedures.map(proc => (
                                <div key={proc.id}>
                                    <Link href={`/procedures/${proc.id}`} className="text-sm font-medium underline">
                                        {proc.name}
                                    </Link>
                                </div>
                            ))}
                            <Button variant="link" asChild className="p-0 h-auto">
                                <Link href="/procedures">Ver todos los trámites</Link>
                            </Button>
                        </div>
                    </SidebarCard>
                )}
            </>
        }
    >
        <DetailHero
            logoSrc={logoUrl}
            logoAlt={`${institution.name} logo`}
            name={institution.name}
            rating={averageRating}
            reviewCount={reviews.length}
            tags={[institution.category]}
            actions={
                <>
                    <ShareButtons path={`/institutions/${institution.id}`} title={institution.name} />
                    <FavoriteButton institutionId={institution.id} />
                </>
            }
        />

        <QuickActionsRow
            phone={mainBranch?.contact.phone}
            whatsapp={institution.contact.whatsapp}
            mapHref={mainBranch && hasValidCoordinates(mainBranch.location) ? `https://www.google.com/maps?q=${mainBranch.location.lat},${mainBranch.location.lng}` : undefined}
            email={institution.contact.email}
            website={institution.contact.website}
        />

        <DetailSectionNav
            items={[
                { id: 'info', label: 'Info' },
                ...(procedures.length > 0 ? [{ id: 'procedures', label: 'Trámites' }] : []),
                { id: 'reviews', label: 'Reseñas' },
            ]}
        />

        <InfoCard id="info" className="scroll-mt-24" title="Más Información">
            <InfoSection label="Sobre Nosotros" divider={false}>
                <p>{institution.description}</p>
            </InfoSection>

            {institution.responsiblePerson?.name && (
                <InfoSection label="Responsable">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 text-muted-foreground"/>
                        </div>
                        <div>
                            <p className="font-semibold">{institution.responsiblePerson.name}</p>
                            <p className="text-sm text-muted-foreground">{institution.responsiblePerson.title}</p>
                        </div>
                    </div>
                </InfoSection>
            )}

            {mainBranch && hasValidCoordinates(mainBranch.location) && (
                <InfoSection label="Ubicación">
                    <DynamicDirectoryMap
                        markers={[{
                            id: institution.id,
                            name: institution.name,
                            category: institution.category,
                            type: 'institution',
                            branchName: mainBranch.name,
                            lat: mainBranch.location.lat,
                            lng: mainBranch.location.lng,
                        }]}
                        height="280px"
                        singleMarker
                        defaultCenter={{ lat: mainBranch.location.lat, lng: mainBranch.location.lng }}
                        defaultZoom={15}
                    />
                </InfoSection>
            )}
        </InfoCard>

        {procedures.length > 0 && (
            <InfoCard id="procedures" className="scroll-mt-24" title="Trámites Ofrecidos">
                <div className="space-y-3">
                    {procedures.map(proc => (
                        <Link key={proc.id} href={`/procedures/${proc.id}`} className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <h4 className="font-semibold underline" style={{ color: stitch.secondary }}>{proc.name}</h4>
                        </Link>
                    ))}
                </div>
            </InfoCard>
        )}

        <div id="reviews" className="scroll-mt-24">
            <ReviewsTeaserShell title="Reseñas de Usuarios" action={<ReportInfoDialog />}>
                {reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                    </div>
                ) : (
                    <p className="text-muted-foreground py-6 text-center italic text-sm">Todavía no hay reseñas para esta institución. ¡Sea el primero!</p>
                )}
                <Separator className="my-6"/>
                <AddReviewForm entityId={institution.id} entityType="institutions" />
            </ReviewsTeaserShell>
        </div>
    </DetailShell>
  );
}

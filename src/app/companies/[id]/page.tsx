
import { getCompanyById, getCompanies, getServices, getUserById, getJobPostings, getEvents, getMenuItemsByCompany } from "@/lib/data";
import { RestaurantMenu } from "./_components/RestaurantMenu";
import { EventCard } from "@/components/shared/EventCard";
import { PaginatedOffers } from "./_components/PaginatedOffers";
import { PaginatedAnnouncements } from "./_components/PaginatedAnnouncements";
import { PaginatedJobs } from "./_components/PaginatedJobs";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Linkedin, Facebook, Twitter, CalendarDays, Briefcase, Instagram, ShieldQuestion, Star, FileText, Download, Camera, MapPin, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { AddReviewForm } from "@/components/shared/AddReviewForm";
import { ReportInfoDialog } from "@/components/shared/ReportInfoDialog";
import { FavoriteButton } from "./_components/FavoriteButton";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { StarRating } from "@/components/shared/StarRating";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClaimButton } from "./_components/ClaimButton";
import { SubscribeButton } from "./_components/SubscribeButton";
import type { Metadata, ResolvingMetadata } from 'next';
import { ReviewSummary } from "@/components/shared/ReviewSummary";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { hasValidCoordinates } from "@/lib/map-utils";
import { DynamicDirectoryMap } from "@/components/shared/DynamicDirectoryMap";
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection, ReviewsTeaserShell } from "@/components/shared/detail/StitchDetailKit";
import { stitch } from "@/components/shared/detail/stitch-tokens";
import { JsonLd } from "@/components/shared/JsonLd";
import { buildLocalBusinessSchema, buildRestaurantMenuSchema } from "@/lib/structured-data";

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const company = await getCompanyById(id)

  if (!company) {
    return {
      title: 'Empresa no encontrada'
    }
  }

  return {
    title: company.name,
    description: company.description,
  }
}

export async function generateStaticParams() {
    const companies = await getCompanies();
    return companies.map((company) => ({
      id: company.id,
    }));
}

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2859 3333" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" {...props}><path d="M2081 0c55 473 319 755 778 785v532c-266 26-499-61-770-225v995c0 1264-1378 1659-1736 755-319-792 245-1827 1736-1827v471c-428 0-835 396-835 896s399 888 835 888 842-396 842-888V0z"/></svg>
);

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const company = await getCompanyById(id);
    const allServices = await getServices();
    const allCompanies = await getCompanies();
    const allJobs = await getJobPostings();
    const allEvents = await getEvents();

    if (!company) {
        notFound();
    }

    const menuItems = await getMenuItemsByCompany(company.id);

    const owner = company.ownerId ? await getUserById(company.ownerId) : null;

    const reviews = company.reviews || [];
    const documents = company.documents || [];
    const gallery = company.gallery || [];
    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : 0;

    const sortedAnnouncements = company.announcements?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
    const sortedOffers = company.offers?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
    const companyJobs = allJobs
        .filter(j => j.companyId === company.id && j.status === 'open')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const companyEvents = allEvents
        .filter(e => e.organizerType === 'company' && e.organizerId === company.id && e.status === 'scheduled')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const mainBranch = company.branches?.[0];

    const companyServiceIds = new Set<string>();
    (company.branches || []).forEach(branch => {
        branch.servicesOffered?.forEach(serviceId => {
            companyServiceIds.add(serviceId);
        });
    });

    const companyServices = allServices.filter(s => s && s.id && s.name && companyServiceIds.has(s.id));

    const relatedCompanies = allCompanies
        .filter(c => c.category === company.category && c.id !== company.id)
        .map(c => {
            const avgRating = c.reviews.length > 0 ? c.reviews.reduce((acc, r) => acc + r.rating, 0) / c.reviews.length : 0;
            return { ...c, averageRating: avgRating };
        })
        .slice(0, 5);

    const otherServices = allServices.filter(s => s && s.id && s.name && !companyServiceIds.has(s.id)).slice(0, 7);
    const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');

    const tags = [company.category, company.companySize, company.geographicScope].filter(Boolean) as string[];

    return (
        <>
        <JsonLd data={buildLocalBusinessSchema(company)} />
        {menuItems.length > 0 && <JsonLd data={buildRestaurantMenuSchema(company, menuItems)} />}
        <DetailShell
            afterAll={
                <>
                <div className="flex justify-end mb-4">
                    <ShareButtons path={`/companies/${company.id}`} title={company.name} />
                </div>
                <div id="reviews">
                    <ReviewsTeaserShell action={<ReportInfoDialog />}>
                        <ReviewSummary
                            companyName={company.name}
                            reviews={reviews.map(r => r.comment)}
                            isPremium={owner?.isPremium || false}
                        />
                        {reviews.length > 0 ? (
                            <div className="space-y-4 mt-4">
                                {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                            </div>
                        ) : (
                            <p className="text-muted-foreground py-6 text-center italic text-sm">Todavía no hay reseñas para esta empresa. ¡Sea el primero!</p>
                        )}
                        <Separator className="my-6"/>
                        <AddReviewForm entityId={company.id} entityType="companies" />
                    </ReviewsTeaserShell>
                </div>
                </>
            }
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
                                    {company.contact.website && (
                                        <a href={company.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
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
                            <WhatsAppButton value={company.contact.socialMedia?.whatsapp} />
                            {company.contact.socialMedia?.linkedin && <Button variant="default" size="icon" asChild><a href={company.contact.socialMedia.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin/></a></Button>}
                            {company.contact.socialMedia?.facebook && <Button variant="default" size="icon" asChild><a href={company.contact.socialMedia.facebook} target="_blank" rel="noopener noreferrer"><Facebook/></a></Button>}
                            {company.contact.socialMedia?.instagram && <Button variant="default" size="icon" asChild><a href={company.contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer"><Instagram/></a></Button>}
                            {company.contact.socialMedia?.twitter && <Button variant="default" size="icon" asChild><a href={company.contact.socialMedia.twitter} target="_blank" rel="noopener noreferrer"><Twitter/></a></Button>}
                            {company.contact.socialMedia?.tiktok && <Button variant="default" size="icon" asChild><a href={company.contact.socialMedia.tiktok} target="_blank" rel="noopener noreferrer"><TikTokIcon className="w-4 h-4" fill="currentColor"/></a></Button>}
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
                                        <span className={wh.hours.toLowerCase().includes('cerrado') ? '' : 'font-medium'}>{wh.day}</span>
                                        <span className={wh.hours.toLowerCase().includes('cerrado') ? 'font-medium' : 'font-medium'} style={wh.hours.toLowerCase().includes('cerrado') ? { color: stitch.error } : undefined}>{wh.hours}</span>
                                    </div>
                                ))}
                            </div>
                        </SidebarCard>
                    )}

                    {company.branches && company.branches.length > 0 && (
                        <SidebarCard title="Ubicaciones">
                            <ul className="space-y-4">
                                {company.branches.map(branch => (
                                    <li key={branch.id}>
                                        <p className="text-sm font-bold" style={{ color: stitch.secondary }}>{branch.name}</p>
                                        <p className="text-xs text-black">{branch.location.address}, {branch.location.city}</p>
                                    </li>
                                ))}
                            </ul>
                        </SidebarCard>
                    )}

                    {!company.ownerId && (
                        <SidebarCard>
                            <div className="flex flex-col items-center text-center gap-2">
                                <ShieldQuestion className="w-8 h-8 text-blue-700" />
                                <p className="font-semibold text-sm">¿Es usted el propietario de este negocio?</p>
                                <p className="text-xs text-muted-foreground">Reclame este listado para actualizar su información y gestionar las reseñas.</p>
                                <ClaimButton company={company} />
                            </div>
                        </SidebarCard>
                    )}

                    {relatedCompanies.length > 0 && (
                        <SidebarCard title="Empresas Similares">
                            <div className="space-y-4">
                                {relatedCompanies.map(relatedCompany => {
                                    const relatedMainBranch = relatedCompany.branches && relatedCompany.branches.length > 0 ? relatedCompany.branches[0] : null;
                                    return (
                                        <div key={relatedCompany.id} className="p-3 border rounded-lg space-y-3">
                                            <div className="flex items-start gap-3">
                                                <Image src={relatedCompany.logo} alt={relatedCompany.name} width={40} height={40} className="rounded-md bg-muted object-contain w-10 h-10" />
                                                <div className="flex-1">
                                                    <Link href={`/companies/${relatedCompany.id}`} className="font-semibold underline text-sm leading-tight" style={{ color: stitch.secondary }}>
                                                        {relatedCompany.name}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">{relatedCompany.category}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <StarRating rating={relatedCompany.averageRating} iconClassName="w-3 h-3"/>
                                                        <span className="text-xs text-muted-foreground">({relatedCompany.reviews.length})</span>
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
                                    )
                                })}
                            </div>
                        </SidebarCard>
                    )}

                    {otherServices.length > 0 && (
                        <SidebarCard title="También te puede interesar">
                            <div className="space-y-2">
                                {otherServices.map(service => (
                                    <div key={service.id}>
                                        <Link href={`/services/${createSlug(service.name)}`} className="text-sm font-medium underline">
                                            {service.name}
                                        </Link>
                                    </div>
                                ))}
                                <Button variant="link" asChild className="p-0 h-auto">
                                    <Link href="/services">Ver todos los servicios</Link>
                                </Button>
                            </div>
                        </SidebarCard>
                    )}
                </>
            }
        >
            <DetailHero
                logoSrc={company.logo}
                logoAlt={`${company.name} logo`}
                name={company.name}
                verified={company.isVerified}
                rating={averageRating}
                reviewCount={reviews.length}
                tags={tags}
                actions={
                    <>
                        <FavoriteButton companyId={company.id} />
                        <SubscribeButton companyId={company.id} companyName={company.name} />
                    </>
                }
            />

            <InfoCard title="Más Información">
                <InfoSection label="Sobre Nosotros" divider={false}>
                    <p>{company.description}</p>
                </InfoSection>

                <InfoSection label="Detalles">
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                        <div><p className="text-xs text-muted-foreground">Razón social</p><p className="font-medium">{company.name}</p></div>
                        <div><p className="text-xs text-muted-foreground">Forma jurídica</p><p className="font-medium">{company.legalForm}</p></div>
                        <div><p className="text-xs text-muted-foreground">CIF</p><p className="font-medium">{company.cif}</p></div>
                        <div><p className="text-xs text-muted-foreground">Año de constitución</p><p className="font-medium">{company.yearEstablished}</p></div>
                        {company.capitalOwnership && <div><p className="text-xs text-muted-foreground">Propiedad</p><p className="font-medium">{company.capitalOwnership}</p></div>}
                        {company.purpose && <div><p className="text-xs text-muted-foreground">Finalidad</p><p className="font-medium">{company.purpose}</p></div>}
                        {company.fiscalRegime && <div><p className="text-xs text-muted-foreground">Régimen Fiscal</p><p className="font-medium">{company.fiscalRegime}</p></div>}
                        {company.contact.email && <div><p className="text-xs text-muted-foreground">Email</p><a href={`mailto:${company.contact.email}`} className="font-medium underline break-all" style={{ color: stitch.secondary }}>{company.contact.email}</a></div>}
                    </div>
                </InfoSection>

                {companyServices.length > 0 && (
                    <InfoSection label="Servicios & Productos">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 list-disc pl-4">
                            {companyServices.map(service => (
                                <li key={service.id}>
                                    <Link href={`/services/${createSlug(service.name)}`} className="underline hover:text-secondary transition-colors">
                                        {service.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </InfoSection>
                )}

                {mainBranch && hasValidCoordinates(mainBranch.location) && (
                    <InfoSection label="Ubicación">
                        <DynamicDirectoryMap
                            markers={[{
                                id: company.id,
                                name: company.name,
                                category: company.category,
                                type: 'company',
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

            {menuItems.length > 0 && (
                <div id="menu" className="scroll-mt-24">
                    <InfoCard title="Menú">
                        <RestaurantMenu items={menuItems} companyId={company.id} companyName={company.name} />
                    </InfoCard>
                </div>
            )}

            {gallery.length > 0 && (
                <InfoCard title="Galería">
                    <ImageGallery images={gallery} alt={company.name} />
                </InfoCard>
            )}

            {(sortedOffers.length > 0 || sortedAnnouncements.length > 0) && (
                <InfoCard title="Novedades">
                    {sortedOffers.length > 0 && (
                        <PaginatedOffers
                            offers={sortedOffers}
                            companyId={company.id}
                            companyName={company.name}
                            companyLogo={company.logo}
                        />
                    )}
                    {sortedAnnouncements.length > 0 && (
                        <PaginatedAnnouncements
                            announcements={sortedAnnouncements}
                            companyId={company.id}
                            companyName={company.name}
                            companyLogo={company.logo}
                        />
                    )}
                </InfoCard>
            )}

            {companyJobs.length > 0 && (
                <InfoCard title={`Empleos (${companyJobs.length})`}>
                    <PaginatedJobs jobs={companyJobs} />
                </InfoCard>
            )}

            {companyEvents.length > 0 && (
                <InfoCard title={`Eventos (${companyEvents.length})`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {companyEvents.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </InfoCard>
            )}

            {documents.length > 0 && (
                <InfoCard title="Documentos">
                    <div className="space-y-3">
                        {documents.map(doc => (
                            <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold" style={{ color: stitch.secondary }}>{doc.name}</span>
                                    <Download className="w-5 h-5 text-muted-foreground"/>
                                </div>
                            </a>
                        ))}
                    </div>
                </InfoCard>
            )}
        </DetailShell>
        </>
    );
}


import { getCompanyById, getCompanies, getServices, getUserById } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Globe, Clock, MapPin, Tag, Linkedin, Facebook, Twitter, Building, CheckCircle, Info, Megaphone, Calendar, TicketPercent, Briefcase, Users, Instagram, Smartphone, ShieldQuestion, Star, FileText, Download, Package, Camera } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { AddReviewForm } from "@/components/shared/AddReviewForm";
import { ReportInfoDialog } from "@/components/shared/ReportInfoDialog";
import type { Company, Service, Product } from "@/lib/types";
import { FavoriteButton } from "./_components/FavoriteButton";
import * as LucideIcons from "lucide-react";
import { StarRating } from "@/components/shared/StarRating";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClaimButton } from "./_components/ClaimButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SubscribeButton } from "./_components/SubscribeButton";
import type { Metadata, ResolvingMetadata } from 'next';
import { OpeningStatusBadge } from "@/components/shared/OpeningStatusBadge";
import { ReviewSummary } from "@/components/shared/ReviewSummary";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export async function generateMetadata(
  { params }: any,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const company = await getCompanyById(params.id)

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

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12.06 0C5.4 0 0 5.4 0 12.06c0 3.48 1.5 6.6 3.96 8.76L0 24l3.3-3.84c2.04 1.44 4.5 2.28 7.08 2.28h.06c6.66 0 12.06-5.4 12.06-12.06C24.18 5.4 18.72 0 12.06 0zm0 0" />
    <path
      d="M12.06 22.92c-5.94 0-10.8-4.86-10.8-10.8 0-2.94 1.2-5.58 3.12-7.5l-2.1-2.46 2.58-2.22 2.22 2.58c1.92-1.2 4.14-1.92 6.54-1.92h.06c5.94 0 10.8 4.86 10.8 10.8-.06 5.94-4.86 10.8-10.8 10.8zm0 0"
      fill="#fff"
    />
    <path
      d="M18.9 15.3c-.42-.24-2.52-1.2-2.88-1.38-.42-.18-.72-.24-.96.24-.3.42-.96 1.38-1.2 1.62-.24.24-.48.3-.9.06-.42-.24-1.8-1.14-3.42-2.94-1.26-1.44-2.1-3.24-2.4-3.78-.3-.54-.06-.84.18-1.08.18-.18.42-.48.6-.72s.24-.42.36-.72c.12-.24.06-.48 0-.72-.12-.24-.96-2.4-.96-2.4s-.3-.24-.6-.24h-.36c-.3 0-.66.06-1.02.42-.36.36-1.38 1.38-1.38 3.3 0 1.92 1.44 3.84 1.62 4.08.18.24 2.76 4.44 6.72 5.88 1.02.36 1.8.42 2.4.36.66-.06 2.52-1.02 2.52-1.02s.42-.48.18-.9zm0 0"
      fill="#fff"
    />
  </svg>
);

const ContactItem = ({ icon: Icon, value, href }: { icon: React.ElementType, value: string | undefined, href?: string }) => {
    if (!value) return null;
    const content = href ? <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary break-all">{value}</a> : <span className="break-all">{value}</span>;
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="w-4 h-4 shrink-0" />
            {content}
        </div>
    )
};


export default async function CompanyDetailPage({ params }: any) {
    const company = await getCompanyById(params.id);
    const allServices = await getServices();
    const allCompanies = await getCompanies();
    
    if (!company) {
        notFound();
    }

    const owner = company.ownerId ? await getUserById(company.ownerId) : null;
  
    const reviews = company.reviews || [];
    const documents = company.documents || [];
    const gallery = company.gallery || [];
    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : 0;
        
    const sortedAnnouncements = company.announcements?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
    const sortedOffers = company.offers?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
    const mainBranch = company.branches?.[0];

    const companyServiceIds = new Set<string>();
    (company.branches || []).forEach(branch => {
        branch.servicesOffered?.forEach(serviceId => {
            companyServiceIds.add(serviceId);
        });
    });

    const companyServices = allServices.filter(s => s && s.id && s.name && companyServiceIds.has(s.id));
    
    const defaultOpenAccordions = ['info'];
    if (companyServices.length > 0) defaultOpenAccordions.push('services');
    if ((sortedAnnouncements.length > 0 || sortedOffers.length > 0)) defaultOpenAccordions.push('updates');
    if (reviews.length > 0) defaultOpenAccordions.push('reviews');
    if (documents.length > 0) defaultOpenAccordions.push('documents');

    const relatedCompanies = allCompanies
        .filter(c => c.category === company.category && c.id !== company.id)
        .map(c => {
            const avgRating = c.reviews.length > 0 ? c.reviews.reduce((acc, r) => acc + r.rating, 0) / c.reviews.length : 0;
            return { ...c, averageRating: avgRating };
        })
        .slice(0, 5);

    const otherServices = allServices.filter(s => s && s.id && s.name && !companyServiceIds.has(s.id)).slice(0, 7);
    const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');


    return (
        <div className="space-y-6">
            {/* Header Section */}
            <Card>
                 <CardContent className="p-4 md:p-6">
                    <div className="flex flex-row items-center gap-4">
                        <Image src={company.logo} alt={`${company.name} logo`} width={80} height={80} className="w-16 h-16 md:w-20 md:h-20 shrink-0 border bg-background object-contain" />
                        <div className="flex-grow">
                             <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                                <div className="flex-grow">
                                     <div className="flex items-center gap-x-2 flex-wrap">
                                     <h1 className="text-2xl md:text-4xl font-bold font-headline">
                                        {company.name}
                                    </h1>
                                     {company.isVerified && <CheckCircle className="w-4 h-4 text-primary"/>}
                                     <OpeningStatusBadge branch={mainBranch} />
                                     </div>
                                    <p className="text-md md:text-lg text-muted-foreground mt-1">{company.category}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                    <FavoriteButton companyId={company.id} />
                                    <SubscribeButton companyId={company.id} companyName={company.name} />
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                        <div className="flex items-center gap-4">
                            <StarRating rating={averageRating} />
                            <span className="text-sm text-muted-foreground">
                                {averageRating.toFixed(1)}/5 ({reviews.length} reseñas)
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {company.contact.socialMedia?.whatsapp && <Button variant="outline" size="icon" asChild><a href={company.contact.socialMedia.whatsapp.startsWith('http') ? company.contact.socialMedia.whatsapp : `https://wa.me/${company.contact.socialMedia.whatsapp}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-4 w-4 fill-current"/></a></Button>}
                            {company.contact.socialMedia?.linkedin && <Button variant="outline" size="icon" asChild><a href={company.contact.socialMedia.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin/></a></Button>}
                            {company.contact.socialMedia?.facebook && <Button variant="outline" size="icon" asChild><a href={company.contact.socialMedia.facebook} target="_blank" rel="noopener noreferrer"><Facebook/></a></Button>}
                            {company.contact.socialMedia?.instagram && <Button variant="outline" size="icon" asChild><a href={company.contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer"><Instagram/></a></Button>}
                            {company.contact.socialMedia?.twitter && <Button variant="outline" size="icon" asChild><a href={company.contact.socialMedia.twitter} target="_blank" rel="noopener noreferrer"><Twitter/></a></Button>}
                            {company.contact.socialMedia?.tiktok && <Button variant="outline" size="icon" asChild><a href={company.contact.socialMedia.tiktok} target="_blank" rel="noopener noreferrer"><TikTokIcon className="w-4 h-4" fill="currentColor"/></a></Button>}
                        </div>
                    </div>
                </CardContent>
            </Card>
            

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">
                     <Accordion type="multiple" defaultValue={defaultOpenAccordions} className="w-full space-y-4">
                        <Card>
                             <AccordionItem value="info" className="border-b-0">
                                <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                                    Información General
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="prose max-w-none text-foreground/80 dark:prose-invert pt-4 border-t">
                                        <p>{company.description}</p>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 pt-6 mt-6 border-t">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Razón social</p>
                                                <p className="font-medium">{company.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Forma jurídica</p>
                                                <p className="font-medium">{company.legalForm}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">CIF</p>
                                                <p className="font-medium">{company.cif}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Año de constitución</p>
                                                <p className="font-medium">{company.yearEstablished}</p>
                                            </div>
                                            {mainBranch && (
                                                <>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Dirección Principal</p>
                                                        <p className="font-medium">{mainBranch.location.address}, {mainBranch.location.city}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Teléfono Principal</p>
                                                        <p className="font-medium">{mainBranch.contact.phone}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            {company.companySize && <div><p className="text-sm text-muted-foreground">Tamaño</p><p className="font-medium">{company.companySize}</p></div>}
                                            {company.capitalOwnership && <div><p className="text-sm text-muted-foreground">Propiedad</p><p className="font-medium">{company.capitalOwnership}</p></div>}
                                            {company.geographicScope && <div><p className="text-sm text-muted-foreground">Ámbito</p><p className="font-medium">{company.geographicScope}</p></div>}
                                            {company.purpose && <div><p className="text-sm text-muted-foreground">Finalidad</p><p className="font-medium">{company.purpose}</p></div>}
                                            {company.fiscalRegime && <div><p className="text-sm text-muted-foreground">Régimen Fiscal</p><p className="font-medium">{company.fiscalRegime}</p></div>}
                                            {company.contact.email && <div><p className="text-sm text-muted-foreground">Email</p><a href={`mailto:${company.contact.email}`} className="font-medium text-primary hover:underline break-all">{company.contact.email}</a></div>}
                                            {company.contact.website && <div><p className="text-sm text-muted-foreground">Sitio Web</p><a href={company.contact.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-all">{company.contact.website}</a></div>}
                                        </div>
                                    </div>
                                     {mainBranch?.workingHours && (
                                        <div className="pt-6 mt-6 border-t">
                                            <h4 className="font-semibold text-base mb-2">Horario de Apertura</h4>
                                            <div className="text-sm text-muted-foreground">
                                                {mainBranch.workingHours.map((wh, index) => (
                                                    <div key={index} className="flex justify-between">
                                                        <span>{wh.day}</span>
                                                        <span className="font-medium text-foreground">{wh.hours}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </AccordionContent>
                             </AccordionItem>
                        </Card>
                        {(sortedAnnouncements.length > 0 || sortedOffers.length > 0) && (
                            <Card>
                                <AccordionItem value="updates" className="border-b-0">
                                    <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                                        Novedades
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 pt-2">
                                        {sortedOffers.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold">Ofertas Activas</h3>
                                                {sortedOffers.map(offer => (
                                                    <Link href={`/offers/${offer.id}`} key={offer.id}>
                                                        <Card className="border-primary/50 relative bg-primary/5 overflow-hidden hover:shadow-md transition-shadow">
                                                            {offer.image && <Image src={offer.image} alt={offer.title} width={400} height={150} className="w-full h-32 object-cover"/>}
                                                            <CardHeader className="pb-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                                                                            <TicketPercent className="w-5 h-5"/>
                                                                            {offer.title}
                                                                        </CardTitle>
                                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            Válido hasta el {new Date(offer.validUntil).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                        </p>
                                                                    </div>
                                                                    <Badge variant="default" className="text-base">{offer.discount}</Badge>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <p className="text-sm text-foreground/80 line-clamp-2">{offer.description}</p>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        {sortedAnnouncements.length > 0 && (
                                            <div className="space-y-4 mt-6">
                                                <h3 className="font-semibold">Anuncios</h3>
                                                {sortedAnnouncements.map(announcement => (
                                                    <Link href={`/announcements/${announcement.id}`} key={announcement.id}>
                                                        <Card className="bg-secondary/30 overflow-hidden hover:shadow-md transition-shadow">
                                                            {announcement.image && <Image src={announcement.image} alt={announcement.title} width={400} height={150} className="w-full h-32 object-cover"/>}
                                                            <CardHeader className="pb-2">
                                                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                                                    <Megaphone className="w-4 h-4 text-primary"/>
                                                                    {announcement.title}
                                                                </CardTitle>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(announcement.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </p>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <p className="text-sm text-foreground/80 line-clamp-2">{announcement.content}</p>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </Card>
                        )}
                        
                        {gallery.length > 0 && (
                             <Card>
                                <AccordionItem value="gallery" className="border-b-0">
                                    <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <Camera className="w-5 h-5" />
                                            Galería
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6">
                                        <Carousel className="w-full">
                                            <CarouselContent>
                                                {gallery.map((image, index) => (
                                                <CarouselItem key={index}>
                                                    <div className="aspect-video relative">
                                                    <Image src={image} alt={`${company.name} gallery image ${index + 1}`} fill className="object-cover rounded-lg border"/>
                                                    </div>
                                                </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="-left-4" />
                                            <CarouselNext className="-right-4" />
                                        </Carousel>
                                    </AccordionContent>
                                </AccordionItem>
                            </Card>
                        )}
                        
                        {(companyServices.length > 0) && (
                            <Card>
                                <AccordionItem value="services" className="border-b-0">
                                    <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                                        Servicios Ofrecidos
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 pt-2">
                                        <div className="space-y-6">
                                            {companyServices.length > 0 && (
                                                <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                                                    {companyServices.map(service => (
                                                        <li key={service.id}>
                                                            <Badge variant="outline" className="text-base sm:text-xs font-normal">{service.name}</Badge>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Card>
                        )}
                        
                        
                        
                        {documents.length > 0 && (
                            <Card>
                                <AccordionItem value="documents" className="border-b-0">
                                    <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                                         <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5"/>
                                            Documentos
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 pt-2">
                                        <div className="space-y-3">
                                            {documents.map(doc => (
                                                <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-primary">{doc.name}</span>
                                                        <Download className="w-5 h-5 text-muted-foreground"/>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Card>
                        )}

                        <Card>
                            <AccordionItem value="reviews" className="border-b-0">
                                <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                                     <div className="flex items-center gap-2">
                                        <Star className="w-5 h-5"/>
                                        Reseñas de Clientes
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6 pt-2">
                                    <div className="flex justify-end mb-4">
                                        <ReportInfoDialog/>
                                    </div>
                                    <ReviewSummary
                                        companyName={company.name}
                                        reviews={reviews.map(r => r.comment)}
                                        isPremium={owner?.isPremium || false}
                                    />
                                    {reviews.length > 0 ? (
                                        <div className="space-y-4 mt-4">
                                            <div className="space-y-4">
                                                {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground py-8 text-center">Todavía no hay reseñas para esta empresa. ¡Sea el primero!</p>
                                    )}
                                    <Separator className="my-6" />
                                    <AddReviewForm entityId={company.id} entityType="companies" />
                                </AccordionContent>
                             </AccordionItem>
                        </Card>
                    </Accordion>
                </div>
                
                {/* Right Column */}


                
                <div className="lg:col-span-1 space-y-6 lg:sticky top-20">
                     
                     
                     {otherServices.length > 0 && (
                        <Card>
                            <CardHeader>
                                <h2 className="font-bold font-headline text-lg">Tambien te puede interesar</h2>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {otherServices.map(service => (
                                    <div key={service.id} className="flex items-center gap-2">
                                        <Link href={`/services/${createSlug(service.name)}`} className="text-sm font-medium hover:underline">
                                            {service.name}
                                        </Link>
                                    </div>
                                ))}
                                <Button variant="link" asChild className="p-0 h-auto">
                                    <Link href="/services">Ver todos los servicios</Link>
                                </Button>
                            </CardContent>
                        </Card>
                     )}
                      {!company.ownerId && (
                        <Card className="mt-4 p-4 bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50 rounded-lg flex flex-col items-center text-center gap-2">
                           <ShieldQuestion className="w-8 h-8 text-blue-700 dark:text-blue-400"/>
                            <div>
                                <p className="font-semibold text-blue-800 dark:text-blue-300">¿Es usted el propietario de este negocio?</p>
                                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Reclame este listado para actualizar su información y gestionar las reseñas.</p>
                            </div>
                           <ClaimButton company={company} />
                        </Card>
                    )}
                    {relatedCompanies.length > 0 && (
                        <Card>
                            <CardHeader>
                                <h2 className="font-bold font-headline text-lg">Empresas Similares</h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {relatedCompanies.map(relatedCompany => {
                                    const relatedMainBranch = relatedCompany.branches && relatedCompany.branches.length > 0 ? relatedCompany.branches[0] : null;
                                    return (
                                        <div key={relatedCompany.id} className="p-3 border rounded-lg space-y-3">
                                            <div className="flex items-start gap-3">
                                                <Image src={relatedCompany.logo} alt={relatedCompany.name} width={40} height={40} className="rounded-md border bg-muted object-contain w-10 h-10" />
                                                <div className="flex-1">
                                                    <Link href={`/companies/${relatedCompany.id}`} className="font-semibold text-primary hover:underline text-sm leading-tight">
                                                        {relatedCompany.name}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">{relatedCompany.category}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <StarRating rating={relatedCompany.averageRating} iconClassName="w-3 h-3"/>
                                                        <span className="text-xs text-muted-foreground">({relatedCompany.reviews.length})</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground space-y-1 border-t pt-2 mt-2">
                                                {relatedMainBranch && (
                                                    <>
                                                        <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3"/>{relatedMainBranch.location.city}</p>
                                                        <p className="flex items-center gap-1.5"><Phone className="w-3 h-3"/>{relatedMainBranch.contact.phone}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                     )}
                </div>
            </div>
        </div>
    );
}

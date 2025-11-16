

import { getInstitutionById, getInstitutions, getProcedures } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Globe, Star, MapPin, Briefcase, Landmark, Users, MessageSquare, User, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { AddReviewForm } from "@/components/shared/AddReviewForm";
import { ReportInfoDialog } from "@/components/shared/ReportInfoDialog";
import type { Institution } from "@/lib/types";
import { FavoriteButton } from "./_components/FavoriteButton";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StarRating } from "@/components/shared/StarRating";
import type { Metadata, ResolvingMetadata } from 'next';
import placeholderImages from '@/lib/placeholder-images.json';
import { OpeningStatusBadge } from "@/components/shared/OpeningStatusBadge";

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
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

export default async function InstitutionDetailPage({ params }: { params: { id: string } }) {
  const institution = await getInstitutionById(params.id);
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

  const defaultOpenAccordions = ['info'];
  if (procedures.length > 0) defaultOpenAccordions.push('procedures');
  if (reviews.length > 0) defaultOpenAccordions.push('reviews');

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
    <div className="space-y-6">
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-row items-start gap-4">
                    <Image src={logoUrl} alt={`${institution.name} logo`} width={80} height={80} className="w-20 h-20 shrink-0 border bg-background p-1 object-contain" data-ai-hint="institution logo" />
                    <div className="flex-grow">
                        <div className="flex justify-between items-start">
                             <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-3xl md:text-4xl font-bold font-headline">{institution.name}</h1>
                                    <OpeningStatusBadge branch={mainBranch} />
                                </div>
                                <p className="text-lg text-muted-foreground">{institution.category}</p>
                            </div>
                            <FavoriteButton institutionId={institution.id} />
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
                        {institution.contact.website && (
                            <Button variant="outline" size="icon" asChild>
                                <a href={institution.contact.website} target="_blank" rel="noopener noreferrer"><Globe/></a>
                            </Button>
                        )}
                        <Button variant="outline" size="icon" asChild>
                            <a href={`mailto:${institution.contact.email}`}><Mail/></a>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
                 <Accordion type="multiple" defaultValue={defaultOpenAccordions} className="w-full space-y-4">
                    <Card>
                         <AccordionItem value="info" className="border-b-0">
                            <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                                Información General
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                {institution.responsiblePerson?.name && (
                                    <div className="pt-4 border-t">
                                        <h3 className="font-semibold mb-2">Responsable</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                <User className="w-6 h-6 text-muted-foreground"/>
                                            </div>
                                            <div>
                                                <p className="font-semibold">{institution.responsiblePerson.name}</p>
                                                <p className="text-sm text-muted-foreground">{institution.responsiblePerson.title}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="prose max-w-none text-foreground/80 dark:prose-invert pt-4 mt-6 border-t">
                                    <p>{institution.description}</p>
                                </div>
                                
                                <div className="pt-6 mt-6 border-t">
                                    <h3 className="font-semibold mb-4">Ubicaciones y Contacto</h3>
                                    <div className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {institution.contact.email && <div className="p-3 border rounded-lg bg-muted/50 space-y-1 flex items-center gap-2"><Mail className="w-4 h-4 text-primary shrink-0"/> <a href={`mailto:${institution.contact.email}`} className="text-sm hover:underline truncate">{institution.contact.email}</a></div>}
                                            {institution.contact.website && <div className="p-3 border rounded-lg bg-muted/50 space-y-1 flex items-center gap-2"><Globe className="w-4 h-4 text-primary shrink-0"/> <a href={institution.contact.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline truncate">{institution.contact.website}</a></div>}
                                        </div>
                                        {branches.map(branch => (
                                            <div key={branch.id} className="p-3 border rounded-lg bg-muted/50 space-y-1">
                                                <h4 className="font-semibold">{branch.name}</h4>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4"/>{branch.location.address}, {branch.location.city}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4"/>{branch.contact.phone}</p>
                                                {branch.contact.email && <a href={`mailto:${branch.contact.email}`} className="text-sm text-primary flex items-center gap-2 hover:underline"><Mail className="w-4 h-4"/>{branch.contact.email}</a>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {mainBranch?.workingHours && (
                                    <div className="pt-6 mt-6 border-t">
                                        <h3 className="font-semibold text-base mb-2 flex items-center gap-2"><Clock className="w-4 h-4"/>Horario de Apertura</h3>
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

                    {procedures.length > 0 && (
                        <Card>
                            <AccordionItem value="procedures" className="border-b-0">
                                <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                                    Trámites Ofrecidos
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6 pt-2">
                                     <div className="space-y-3">
                                        {procedures.map(proc => (
                                            <Link key={proc.id} href={`/procedures/${proc.id}`} className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <h4 className="font-semibold text-primary">{proc.name}</h4>
                                            </Link>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                    )}

                    <Card>
                        <AccordionItem value="reviews" className="border-b-0">
                            <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                                 Reseñas de Usuarios
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6 pt-2">
                                <div className="flex justify-end mb-4">
                                    <ReportInfoDialog/>
                                </div>
                                {reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground py-8 text-center">Todavía no hay reseñas para esta institución. ¡Sea el primero!</p>
                                )}
                                <Separator className="my-6"/>
                                <AddReviewForm entityId={institution.id} entityType="institutions" />
                            </AccordionContent>
                         </AccordionItem>
                    </Card>
                </Accordion>
            </div>
            
            <div className="lg:col-span-1 space-y-6 lg:sticky top-20">
                 {relatedInstitutions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-bold font-headline">Instituciones Similares</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {relatedInstitutions.map(related => {
                                const relatedMainBranch = related.branches[0];
                                return (
                                <div key={related.id} className="p-3 border rounded-lg space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Image src={related.logo} alt={related.name} width={40} height={40} className="rounded-md border bg-muted object-contain w-10 h-10" data-ai-hint="institution logo"/>
                                        <div className="flex-1">
                                            <Link href={`/institutions/${related.id}`} className="font-semibold text-primary hover:underline text-sm leading-tight">
                                                {related.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">{related.category}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                 <StarRating rating={related.averageRating} iconClassName="w-3 h-3"/>
                                                 <span className="text-xs text-muted-foreground">({related.reviews.length})</span>
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
                            )})}
                        </CardContent>
                    </Card>
                 )}
                {otherProcedures.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-bold font-headline">También te puede interesar</h2>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {otherProcedures.map(proc => (
                                <div key={proc.id} className="flex items-center gap-2">
                                    <Link href={`/procedures/${proc.id}`} className="text-sm font-medium hover:underline">
                                        {proc.name}
                                    </Link>
                                </div>
                            ))}
                            <Button variant="link" asChild className="p-0 h-auto">
                                <Link href="/procedures">Ver todos los trámites</Link>
                            </Button>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </div>
    </div>
  );
}

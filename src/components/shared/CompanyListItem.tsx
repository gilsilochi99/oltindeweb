
'use client';

import type { Company } from "@/lib/types";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import { MapPin, Phone, CheckCircle, Linkedin, Facebook, Twitter, Instagram, Smartphone, Megaphone, TicketPercent } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { OpeningStatusBadge } from "./OpeningStatusBadge";
import { WhatsAppButton } from "./WhatsAppButton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2859 3333" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" {...props}><path d="M2081 0c55 473 319 755 778 785v532c-266 26-499-61-770-225v995c0 1264-1378 1659-1736 755-319-792 245-1827 1736-1827v471c-428 0-835 396-835 896s399 888 835 888 842-396 842-888V0z"/></svg>
);


export function CompanyListItem({ company }: { company: Company }) {
  const averageRating =
    company.reviews && company.reviews.length > 0
      ? company.reviews.reduce((acc, review) => acc + review.rating, 0) / company.reviews.length
      : 0;
  
  const latestReview = company.reviews?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const mainBranch = company.branches?.[0];

  return (
    <Card className={cn(
        "w-full overflow-hidden transition-all hover:shadow-md flex flex-col",
        company.isFeatured && "bg-primary/5"
    )}>
        <CardHeader className={cn("p-4", company.isFeatured && "")}>
            <div className="flex gap-4">
                <div className="w-20 h-20 shrink-0">
                     <Image src={company.logo} alt={`${company.name} logo`} width={80} height={80} className="object-contain w-full h-full bg-muted border" />
                </div>
                <div className="flex-grow">
                     <div className="flex justify-between items-start">
                        <div>
                             <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold font-headline leading-tight">
                                    <Link href={`/companies/${company.id}`} className="hover:underline">
                                        {company.name}
                                    </Link>
                                </h3>
                                {company.isVerified && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <CheckCircle className="w-4 h-4 text-primary cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p className="font-semibold mb-1">Empresa Verificada</p>
                                                <p className="text-xs">
                                                    Nuestro equipo ha confirmado: nombre legal y CIF válidos, al menos un método de contacto confirmado, y la ubicación de al menos una sede.
                                                </p>
                                                <Link href="/faq#verificacion" className="text-xs underline mt-1 inline-block">Más información</Link>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                <OpeningStatusBadge branch={mainBranch} />
                            </div>

                            {averageRating > 0 && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <StarRating rating={averageRating} />
                                        <span className="text-xs text-muted-foreground">{averageRating.toFixed(1)} ({company.reviews.length} reseñas)</span>
                                    </div>
                                )}
                        </div>
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                           {company.announcements && company.announcements.length > 0 && (
                            <Link href={`/companies/${company.id}`}>
                             <Badge variant="outline" className="hover:bg-accent">
                               <Megaphone className="w-3.5 h-3.5 mr-1.5"/> Anuncios
                             </Badge>
                             </Link>
                           )}
                           {company.offers && company.offers.length > 0 && (
                             <Link href={`/companies/${company.id}`}>
                             <Badge variant="outline" className="hover:bg-accent">
                               <TicketPercent className="w-3.5 h-3.5 mr-1.5"/> Ofertas
                             </Badge>
                             </Link>
                           )}
                        </div>
                    </div>
                     <p className="text-base md:text-sm text-muted-foreground mt-2 line-clamp-2">{company.description}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3 flex-grow">
             <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-base md:text-sm text-muted-foreground">
                {mainBranch && (
                    <>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4"/>
                            <span>{mainBranch.location.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4"/>
                            <span>{mainBranch.contact.phone}</span>
                        </div>
                    </>
                )}
                <div className="flex items-center gap-1">
                    <WhatsAppButton value={company.contact.socialMedia?.whatsapp} variant="ghost" className="h-8 w-8" />
                    {company.contact.socialMedia?.linkedin && <Button variant="ghost" size="icon" className="h-8 w-8" asChild><a href={company.contact.socialMedia.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4"/></a></Button>}
                    {company.contact.socialMedia?.facebook && <Button variant="ghost" size="icon" className="h-8 w-8" asChild><a href={company.contact.socialMedia.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4"/></a></Button>}
                    {company.contact.socialMedia?.instagram && <Button variant="ghost" size="icon" className="h-8 w-8" asChild><a href={company.contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4"/></a></Button>}
                    {company.contact.socialMedia?.twitter && <Button variant="ghost" size="icon" className="h-8 w-8" asChild><a href={company.contact.socialMedia.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-4 w-4"/></a></Button>}
                    {company.contact.socialMedia?.tiktok && <Button variant="ghost" size="icon" className="h-8 w-8" asChild><a href={company.contact.socialMedia.tiktok} target="_blank" rel="noopener noreferrer"><TikTokIcon className="w-4 h-4" fill="currentColor"/></a></Button>}
                </div>
            </div>

            {latestReview && (
                <div className="pt-3">
                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1" className="border-b-0">
                            <div className="flex items-start gap-3">
                                <Image src={`https://i.pravatar.cc/40?u=${encodeURIComponent(latestReview.author)}`} alt={latestReview.author} width={40} height={40} className="rounded-full mt-1" />
                                <div className="flex-1">
                                    <p className="text-base md:text-sm italic text-muted-foreground">
                                        <span className="font-semibold text-foreground not-italic">{latestReview.author}</span>: "{latestReview.comment}"
                                    </p>
                                    <AccordionTrigger className="justify-start text-sm text-primary hover:no-underline p-0 pt-1 font-semibold">
                                        Leer reseña completa
                                    </AccordionTrigger>
                                </div>
                            </div>
                            <AccordionContent>
                                <div className="mt-2 space-y-2">
                                    <p className="font-semibold text-sm">{latestReview.author} dice:</p>
                                    <blockquote className="text-sm text-muted-foreground italic">"{latestReview.comment}"</blockquote>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            )}
        </CardContent>
         <CardFooter className="p-4 pt-0">
            <Button asChild className="w-full sm:w-auto sm:ml-auto">
                <Link href={`/companies/${company.id}`}>Ver Perfil</Link>
            </Button>
        </CardFooter>
    </Card>
  );
}

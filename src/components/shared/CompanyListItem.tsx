
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
                                {company.isVerified && <CheckCircle className="w-4 h-4 text-primary"/>}
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
                    {company.contact.socialMedia?.whatsapp && <Button variant="ghost" size="icon" className="h-8 w-8" asChild><a href={company.contact.socialMedia.whatsapp.startsWith('http') ? company.contact.socialMedia.whatsapp : `https://wa.me/${company.contact.socialMedia.whatsapp}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-4 w-4 fill-current"/></a></Button>}
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

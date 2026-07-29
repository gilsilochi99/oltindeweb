
import { getProfessionalById, getProfessionals, getUserById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Mail, Phone, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { AddReviewForm } from "@/components/shared/AddReviewForm";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { ReviewSummary } from "@/components/shared/ReviewSummary";
import { ProfessionalFavoriteButton } from "./_components/ProfessionalFavoriteButton";
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection, ReviewsTeaserShell } from "@/components/shared/detail/StitchDetailKit";
import { stitch } from "@/components/shared/detail/stitch-tokens";
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const professional = await getProfessionalById(id);

  if (!professional) {
    return {
      title: 'Profesional no encontrado'
    }
  }

  return {
    title: `${professional.displayName} - ${professional.title}`,
    description: professional.bio,
  }
}

export async function generateStaticParams() {
    const professionals = await getProfessionals();
    return professionals.map((professional) => ({
      id: professional.id,
    }));
}

export default async function ProfessionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const professional = await getProfessionalById(id);

    if (!professional) {
        notFound();
    }

    const owner = professional.ownerId ? await getUserById(professional.ownerId) : null;

    const reviews = professional.reviews || [];
    const portfolio = professional.portfolio || [];
    const services = professional.services || [];
    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : 0;

    return (
        <DetailShell
            sidebar={
                <>
                    <SidebarCard>
                        <div className="mb-6">
                            {professional.contact.phone && (
                                <a href={`tel:${professional.contact.phone}`} className="flex items-center gap-3 mb-4" style={{ color: stitch.secondary }}>
                                    <MaterialIcon name="call" className="!text-[28px]" />
                                    <span className="text-xl font-bold text-[#1a1c1c]">{professional.contact.phone}</span>
                                </a>
                            )}
                            {professional.contact.email && (
                                <a href={`mailto:${professional.contact.email}`} className="flex items-center gap-3 py-2 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                                    <MaterialIcon name="mail" />
                                    {professional.contact.email}
                                </a>
                            )}
                            <div className="text-[13px] text-black ml-9 -mt-1">
                                {professional.city}, Guinea Ecuatorial
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <WhatsAppButton value={professional.contact.whatsapp} />
                            {professional.contact.linkedin && (
                                <Button variant="default" size="icon" asChild>
                                    <a href={professional.contact.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin/></a>
                                </Button>
                            )}
                        </div>
                        <a href="#reviews" className="w-full mt-4 border py-2.5 rounded text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#eeeeee] transition-colors" style={{ borderColor: stitch.outline, color: stitch.secondary }}>
                            <MaterialIcon name="edit_note" className="!text-[18px]" /> Escribir una Reseña
                        </a>
                    </SidebarCard>

                    {professional.availability && (
                        <SidebarCard title="Disponibilidad">
                            <p className="text-sm font-medium">{professional.availability}</p>
                        </SidebarCard>
                    )}
                </>
            }
        >
            <DetailHero
                logoSrc={professional.photo || 'https://placehold.co/200x200/CCCCCC/000000?text=' + professional.displayName.substring(0, 2).toUpperCase()}
                logoAlt={professional.displayName}
                name={professional.displayName}
                verified={professional.isVerified}
                verifiedLabel="Profesional Verificado"
                rating={averageRating}
                reviewCount={reviews.length}
                tags={[professional.title, professional.category, ...professional.skills.slice(0, 3)]}
                actions={
                    <>
                        <ShareButtons path={`/professionals/${professional.id}`} title={professional.displayName} />
                        <ProfessionalFavoriteButton professionalId={professional.id} />
                    </>
                }
            />

            <InfoCard title="Más Información">
                <InfoSection label="Sobre Mí" divider={false}>
                    <p>{professional.bio}</p>
                </InfoSection>

                <InfoSection label="Habilidades">
                    <div className="flex flex-wrap gap-2">
                        {professional.skills.map((skill) => (
                            <span key={skill} className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs">
                                {skill}
                            </span>
                        ))}
                    </div>
                </InfoSection>
            </InfoCard>

            {services.length > 0 && (
                <InfoCard title="Servicios">
                    <div className="space-y-4">
                        {services.map((service) => (
                            <div key={service.id} className="flex justify-between items-start gap-4 border-b border-stitch-outline-variant pb-4 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-semibold text-stitch-on-background">{service.name}</p>
                                    {service.description && <p className="text-sm text-muted-foreground mt-1">{service.description}</p>}
                                </div>
                                {service.price && <p className="font-bold shrink-0" style={{ color: stitch.secondary }}>{service.price}</p>}
                            </div>
                        ))}
                    </div>
                </InfoCard>
            )}

            {portfolio.length > 0 && (
                <InfoCard title="Portafolio">
                    <ImageGallery images={portfolio} alt={professional.displayName} />
                </InfoCard>
            )}

            <div id="reviews">
                <ReviewsTeaserShell>
                    <ReviewSummary
                        companyName={professional.displayName}
                        reviews={reviews.map(r => r.comment)}
                        isPremium={owner?.isPremium || false}
                    />
                    {reviews.length > 0 ? (
                        <div className="space-y-4 mt-4">
                            {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                        </div>
                    ) : (
                        <p className="text-muted-foreground py-6 text-center italic text-sm">Todavía no hay reseñas para este profesional. ¡Sea el primero!</p>
                    )}
                    <Separator className="my-6"/>
                    <AddReviewForm entityId={professional.id} entityType="professionals" />
                </ReviewsTeaserShell>
            </div>
        </DetailShell>
    );
}

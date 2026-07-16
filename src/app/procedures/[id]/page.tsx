
import { getProcedureById, getProcedures, getInstitutionById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ListChecks, FileText, Star, AlertCircle, Download, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { AddReviewForm } from "@/components/shared/AddReviewForm";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { ReportInfoDialog } from "@/components/shared/ReportInfoDialog";
import { FavoriteButton } from "./_components/FavoriteButton";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import type { Metadata, ResolvingMetadata } from 'next';
import { DetailShell, SidebarCard, InfoCard } from "@/components/shared/detail/StitchDetailKit";
import { stitch } from "@/components/shared/detail/stitch-tokens";

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const procedure = await getProcedureById(id)

  if (!procedure) {
    return {
      title: 'Trámite no encontrado'
    }
  }

  return {
    title: procedure.name,
    description: procedure.description,
  }
}

export async function generateStaticParams() {
    const procedures = await getProcedures();
    return procedures.map((procedure) => ({
      id: procedure.id,
    }));
}


export default async function ProcedureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const procedure = await getProcedureById(id);

  if (!procedure) {
    notFound();
  }

  const documents = procedure.documents || [];
  const institution = procedure.institutionId ? await getInstitutionById(procedure.institutionId) : undefined;
  const institutionMainBranch = institution?.branches?.[0];

  return (
    <DetailShell
        sidebar={
            <>
                <SidebarCard title="Requisitos">
                    <ul className="list-disc list-inside space-y-2 text-sm text-foreground/80">
                        {procedure.requirements.map(req => <li key={req}>{req}</li>)}
                    </ul>
                </SidebarCard>

                <SidebarCard title="Institución Responsable">
                    <Link href={`/institutions/${procedure.institutionId}`} className="font-semibold underline block mb-3" style={{ color: stitch.secondary }}>
                        {procedure.institution}
                    </Link>
                    {institution && (
                        <div className="space-y-2 pt-3 border-t text-sm">
                            {institutionMainBranch?.contact.phone && (
                                <a href={`tel:${institutionMainBranch.contact.phone}`} className="flex items-center gap-2 text-muted-foreground underline">
                                    <Phone className="w-4 h-4" /> {institutionMainBranch.contact.phone}
                                </a>
                            )}
                            {institution.contact.email && (
                                <a href={`mailto:${institution.contact.email}`} className="flex items-center gap-2 text-muted-foreground underline">
                                    <Mail className="w-4 h-4" /> {institution.contact.email}
                                </a>
                            )}
                            {institution.contact.whatsapp && (
                                <div className="flex items-center gap-2">
                                    <WhatsAppButton value={institution.contact.whatsapp} className="h-8 w-8" />
                                    <span className="text-muted-foreground text-xs">Contactar por WhatsApp</span>
                                </div>
                            )}
                        </div>
                    )}
                </SidebarCard>

                <SidebarCard title="Costo del Trámite">
                    <p className="text-2xl font-bold" style={{ color: stitch.primary }}>{procedure.cost}</p>
                </SidebarCard>

                <div className="border border-blue-200 bg-blue-50 p-5 rounded mb-5">
                    <h3 className="font-bold text-blue-700 flex items-center gap-2 text-sm mb-2"><AlertCircle className="w-4 h-4" /> Nota Importante</h3>
                    <p className="text-sm text-blue-700">
                        La información, costos y requisitos pueden cambiar. Se recomienda confirmar con la institución responsable antes de iniciar cualquier trámite.
                    </p>
                </div>
            </>
        }
    >
        <div className="flex items-start justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl md:text-[32px] md:leading-[40px] font-bold text-[#1a1c1c]">{procedure.name}</h1>
                <p className="text-base text-muted-foreground mt-2">{procedure.description}</p>
            </div>
            <FavoriteButton procedureId={procedure.id} />
        </div>

        <InfoCard title="Pasos a Seguir">
            <ol className="relative border-l border-border space-y-8 ml-3">
                {procedure.steps.map(step => (
                    <li key={step.step} className="ml-6">
                        <span className="absolute flex items-center justify-center w-8 h-8 text-white rounded-full -left-4" style={{ backgroundColor: stitch.secondary }}>
                            {step.step}
                        </span>
                        <h3 className="font-semibold text-lg flex items-center gap-2"><ListChecks className="w-4 h-4 shrink-0" />{step.description}</h3>
                        <p className="text-sm text-muted-foreground">Lugar: {step.location}</p>
                    </li>
                ))}
            </ol>
        </InfoCard>

        {documents.length > 0 && (
            <InfoCard title="Documentos Adjuntos">
                <div className="space-y-3">
                    {documents.map(doc => (
                        <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" download className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold" style={{ color: stitch.secondary }}>{doc.name}</span>
                                <Download className="w-5 h-5 text-muted-foreground"/>
                            </div>
                        </a>
                    ))}
                </div>
            </InfoCard>
        )}

        <div className="mt-8 bg-[#f3f3f3] border border-[#e2e2e2] p-6 rounded-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#1a1c1c] flex items-center gap-2"><Star className="w-4 h-4" style={{ color: stitch.secondary }} /> Opiniones sobre el Trámite</h3>
                <ReportInfoDialog/>
            </div>
            {procedure.reviews.length > 0 ? (
                <div className="space-y-4">
                    {procedure.reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                </div>
            ) : (
                <p className="text-muted-foreground py-6 text-center italic text-sm">Todavía no hay reseñas para este trámite.</p>
            )}
            <Separator className="my-6"/>
            <AddReviewForm entityId={procedure.id} entityType="procedures" />
        </div>
    </DetailShell>
  );
}

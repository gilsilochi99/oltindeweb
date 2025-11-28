
import { getProcedureById, getProcedures } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ListChecks, Landmark, CircleDollarSign, Star, AlertCircle, Download } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { AddReviewForm } from "@/components/shared/AddReviewForm";
import { ReviewCard } from "@/components/shared/ReviewCard";
import { ReportInfoDialog } from "@/components/shared/ReportInfoDialog";
import { FavoriteButton } from "./_components/FavoriteButton";
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const procedure = await getProcedureById(params.id)

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


export default async function ProcedureDetailPage({ params }: { params: { id: string } }) {
  const procedure = await getProcedureById(params.id);

  if (!procedure) {
    notFound();
  }

  const documents = procedure.documents || [];

  return (
    <div className="space-y-6">
       <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div>
                     <h1 className="text-3xl md:text-4xl font-bold font-headline">{procedure.name}</h1>
                    <p className="text-lg text-muted-foreground mt-2">{procedure.description}</p>
                </div>
                <FavoriteButton procedureId={procedure.id} />
            </div>
          </CardContent>
        </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ListChecks /> Pasos a Seguir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="relative border-l border-border space-y-8 ml-3">
                            {procedure.steps.map(step => (
                                <li key={step.step} className="ml-6">
                                    <span className="absolute flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full -left-4">
                                        {step.step}
                                    </span>
                                    <h3 className="font-semibold text-lg">{step.description}</h3>
                                    <p className="text-sm text-muted-foreground">Lugar: {step.location}</p>
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>
                
                {documents.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText /> Documentos Adjuntos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {documents.map(doc => (
                                    <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" download className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-primary">{doc.name}</span>
                                            <Download className="w-5 h-5 text-muted-foreground"/>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span className="flex items-center gap-2"><Star /> Opiniones sobre el Trámite</span>
                            <ReportInfoDialog/>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {procedure.reviews.length > 0 ? (
                            <div className="space-y-4">
                                {procedure.reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                            </div>
                        ) : (
                            <p className="text-muted-foreground py-8 text-center">Todavía no hay reseñas para este trámite.</p>
                        )}
                        <Separator className="my-6"/>
                        <AddReviewForm entityId={procedure.id} entityType="procedures" />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6 lg:sticky top-20">
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-bold font-headline">Requisitos</h2>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-foreground/80">
                            {procedure.requirements.map(req => <li key={req}>{req}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-bold font-headline">Institución Responsable</h2>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href={`/institutions/${procedure.institutionId}`} className="font-semibold text-foreground hover:underline">
                            {procedure.institution}
                        </Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-bold font-headline">Costo del Trámite</h2>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-primary">{procedure.cost}</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-base"><AlertCircle/> Nota Importante</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-700 dark:text-blue-400">
                        La información, costos y requisitos pueden cambiar. Se recomienda confirmar con la institución responsable antes de iniciar cualquier trámite.
                    </CardContent>
                </Card>
            </div>
          </div>
    </div>
  );
}

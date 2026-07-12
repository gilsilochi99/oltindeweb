
import { getJobById, getCompanyById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Calendar, Briefcase, Phone, Mail, MapPin, Clock, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FavoriteButton } from "./_components/FavoriteButton";
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getJobById(params.id);
  if (!job) {
    return { title: 'Empleo no encontrado' };
  }
  return { title: `${job.title} en ${job.companyName}`, description: job.description };
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await getJobById(params.id);

  if (!job) {
    notFound();
  }

  const company = await getCompanyById(job.companyId);
  const mainBranch = company?.branches?.[0];
  const applyHref = job.applicationMethod === 'email' ? `mailto:${job.applicationValue}` : job.applicationValue;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                <span>Empleo</span>
                {job.status === 'closed' && <Badge variant="destructive">Cerrado</Badge>}
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold font-headline mt-2">{job.title}</CardTitle>
              <CardDescription className="text-lg pt-2">
                <Link href={`/companies/${job.companyId}`} className="text-primary hover:underline font-medium">{job.companyName}</Link>
                {' · '}{job.city}
              </CardDescription>
            </div>
            <FavoriteButton jobId={job.id} />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-4">
            <Badge variant="secondary" className="gap-1.5"><Clock className="w-3.5 h-3.5" />{job.employmentType}</Badge>
            {job.sector && <Badge variant="secondary" className="gap-1.5"><Briefcase className="w-3.5 h-3.5" />{job.sector}</Badge>}
            <Badge variant="secondary" className="gap-1.5"><MapPin className="w-3.5 h-3.5" />{job.city}</Badge>
            {job.salaryRange && <Badge variant="outline">{job.salaryRange}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none dark:prose-invert">
            <p>{job.description}</p>
          </div>

          {job.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Requisitos</h3>
              <ul className="space-y-1.5">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.deadline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Fecha límite: {new Date(job.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}

          {job.status === 'open' ? (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={applyHref} target={job.applicationMethod === 'link' ? '_blank' : undefined} rel="noopener noreferrer">
                Aplicar Ahora {job.applicationMethod === 'link' && <ExternalLink className="w-4 h-4 ml-2" />}
              </a>
            </Button>
          ) : (
            <Button size="lg" className="w-full sm:w-auto" disabled>Este empleo ya no está disponible</Button>
          )}
        </CardContent>
      </Card>

      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sobre la empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Image src={company.logo} alt={`${company.name} logo`} width={60} height={60} className="rounded-md border bg-muted object-contain" />
              <div>
                <h3 className="font-semibold text-lg">{company.name}</h3>
                <p className="text-sm text-muted-foreground">{company.category}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              {mainBranch && (
                <>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{mainBranch.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{mainBranch.location.address}, {mainBranch.location.city}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${company.contact.email}`} className="text-primary hover:underline">{company.contact.email}</a>
              </div>
            </div>
            <Button asChild className="mt-4" variant="outline">
              <Link href={`/companies/${company.id}`}><Building className="w-4 h-4 mr-2" />Ver Perfil Completo</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


import { getJobById, getCompanyById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building, Calendar, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FavoriteButton } from "./_components/FavoriteButton";
import type { Metadata } from 'next';
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection } from "@/components/shared/detail/StitchDetailKit";
import { stitch } from "@/components/shared/detail/stitch-tokens";
import placeholderImages from '@/lib/placeholder-images.json';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    return { title: 'Empleo no encontrado' };
  }
  return { title: `${job.title} en ${job.companyName}`, description: job.description };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) {
    notFound();
  }

  const company = await getCompanyById(job.companyId);
  const mainBranch = company?.branches?.[0];
  const applyHref = job.applicationMethod === 'email' ? `mailto:${job.applicationValue}` : job.applicationValue;

  return (
    <DetailShell
        sidebar={
            company && (
                <SidebarCard title="Sobre la empresa">
                    <div className="flex items-center gap-3 mb-4">
                        <Image src={company.logo || placeholderImages.logo.src} alt={`${company.name} logo`} width={48} height={48} className="rounded-md border bg-muted object-contain w-12 h-12" />
                        <div>
                            <Link href={`/companies/${company.id}`} className="font-semibold hover:underline text-sm leading-tight" style={{ color: stitch.secondary }}>
                                {company.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{company.category}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {mainBranch?.contact.phone && (
                            <a href={`tel:${mainBranch.contact.phone}`} className="flex items-center gap-3 py-1 text-sm font-semibold hover:underline" style={{ color: stitch.secondary }}>
                                <MaterialIcon name="call" className="!text-[18px]" />
                                {mainBranch.contact.phone}
                            </a>
                        )}
                        {company.contact.email && (
                            <a href={`mailto:${company.contact.email}`} className="flex items-center gap-3 py-1 text-sm font-semibold hover:underline" style={{ color: stitch.secondary }}>
                                <MaterialIcon name="mail" className="!text-[18px]" />
                                {company.contact.email}
                            </a>
                        )}
                        {mainBranch && (
                            <div className="text-[13px] text-[#4d4732] ml-9 -mt-1">
                                {mainBranch.location.address}, {mainBranch.location.city}
                            </div>
                        )}
                    </div>
                    <Button asChild className="w-full mt-4" variant="outline">
                        <Link href={`/companies/${company.id}`}><Building className="w-4 h-4 mr-2" />Ver Perfil Completo</Link>
                    </Button>
                </SidebarCard>
            )
        }
    >
        <DetailHero
            logoSrc={company?.logo || placeholderImages.logo.src}
            logoAlt={`${job.companyName} logo`}
            name={job.title}
            tags={[job.employmentType, job.sector, job.city].filter(Boolean) as string[]}
            actions={
                <>
                    {job.status === 'closed' && <span className="text-xs font-bold uppercase text-white bg-red-500 px-2 py-1 rounded">Cerrado</span>}
                    <FavoriteButton jobId={job.id} />
                </>
            }
        />

        <InfoCard title="Detalles del Puesto">
            <InfoSection label="Descripción" divider={false}>
                <p>{job.description}</p>
            </InfoSection>

            {job.requirements.length > 0 && (
                <InfoSection label="Requisitos">
                    <ul className="space-y-1.5">
                        {job.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: stitch.primary }} />
                                {req}
                            </li>
                        ))}
                    </ul>
                </InfoSection>
            )}

            {job.salaryRange && (
                <InfoSection label="Salario">
                    <p className="font-medium">{job.salaryRange}</p>
                </InfoSection>
            )}

            {job.deadline && (
                <InfoSection label="Fecha Límite">
                    <p className="flex items-center gap-2 font-medium">
                        <Calendar className="w-4 h-4" />
                        {new Date(job.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </InfoSection>
            )}

            <div className="mt-8">
                {job.status === 'open' ? (
                    <Button asChild size="lg" className="w-full sm:w-auto">
                        <a href={applyHref} target={job.applicationMethod === 'link' ? '_blank' : undefined} rel="noopener noreferrer">
                            Aplicar Ahora {job.applicationMethod === 'link' && <ExternalLink className="w-4 h-4 ml-2" />}
                        </a>
                    </Button>
                ) : (
                    <Button size="lg" className="w-full sm:w-auto" disabled>Este empleo ya no está disponible</Button>
                )}
            </div>
        </InfoCard>
    </DetailShell>
  );
}

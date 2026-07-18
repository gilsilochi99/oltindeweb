
'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById, getJobPostings } from '@/lib/data';
import { deleteJobPosting, toggleJobStatus } from '@/lib/actions';
import type { Company, JobPosting } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, MapPin, Clock, Briefcase, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function CompanyJobsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const companyData = await getCompanyById(companyId);
    if (!companyData || companyData.ownerId !== user.uid) {
      notFound();
      return;
    }
    const allJobs = await getJobPostings();
    setCompany(companyData);
    setJobs(allJobs.filter(j => j.companyId === companyId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setIsLoading(false);
  }, [user, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (jobId: string) => {
    if (!user) return;
    const result = await deleteJobPosting(jobId, user.uid);
    if (result.success) {
      toast({ title: 'Empleo eliminado' });
      fetchData();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (jobId: string) => {
    if (!user) return;
    const result = await toggleJobStatus(jobId, user.uid);
    if (result.success) {
      toast({ title: result.status === 'open' ? 'Empleo reabierto' : 'Empleo cerrado' });
      fetchData();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gestionar Empleos</h1>
          <p className="text-muted-foreground">
            Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link>
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/companies/${companyId}/jobs/new`}>
            <PlusCircle className="mr-2 h-4 w-4" /> Publicar Empleo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empleos Publicados ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-black" />
                          {job.title}
                          {job.status === 'closed' && <Badge variant="destructive">Cerrado</Badge>}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.city}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.employmentType}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/companies/${companyId}/jobs/${job.id}`}>Editar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(job.id)}>
                              {job.status === 'open' ? 'Marcar como cerrado' : 'Reabrir empleo'}
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente la publicación de empleo.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(job.id)}>Sí, eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 line-clamp-2">{job.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay empleos publicados para esta empresa.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

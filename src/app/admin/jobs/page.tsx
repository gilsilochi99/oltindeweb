

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobPostings } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { JobPosting } from '@/lib/types';
import { deleteJobPosting, toggleJobStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function AdminJobsPage() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { user, isAdmin } = useAuth();

    const fetchData = async () => {
        const jobsData = await getJobPostings();
        jobsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJobs(jobsData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredJobs = useMemo(() => {
        return jobs.filter(job =>
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.companyName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [jobs, searchQuery]);

    const handleDelete = async (jobId: string) => {
        if (!user) return;
        const result = await deleteJobPosting(jobId, user.uid, true);
        if (result.success) {
            toast({ title: 'Éxito', description: 'Empleo eliminado correctamente.' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    const handleToggleStatus = async (jobId: string) => {
        if (!user) return;
        const result = await toggleJobStatus(jobId, user.uid, true);
        if (result.success) {
            toast({ title: result.status === 'open' ? 'Empleo reabierto' : 'Empleo cerrado' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Gestionar Empleos</h1>
                <p className="text-muted-foreground">Supervisar todas las ofertas de empleo publicadas en la plataforma.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Empleos ({filteredJobs.length})</CardTitle>
                            <CardDescription>Empleos publicados por todas las empresas.</CardDescription>
                        </div>
                        <Input
                            placeholder="Buscar por título o empresa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Ciudad</TableHead>
                                <TableHead>Sector</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredJobs.map((job) => (
                                <TableRow key={job.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/jobs/${job.id}`} target="_blank" className="hover:underline hover:text-black">{job.title}</Link>
                                    </TableCell>
                                    <TableCell>{job.companyName}</TableCell>
                                    <TableCell>{job.city}</TableCell>
                                    <TableCell>{job.sector}</TableCell>
                                    <TableCell>
                                        {job.status === 'open' ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">Abierto</Badge>
                                        ) : (
                                            <Badge variant="destructive">Cerrado</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(job.id)}>
                                                        {job.status === 'open' ? 'Marcar como cerrado' : 'Reabrir empleo'}
                                                    </DropdownMenuItem>
                                                    {isAdmin && (
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    )}
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

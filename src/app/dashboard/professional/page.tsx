
'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getServices, getUniqueCities, getProfessionalByOwnerId } from '@/lib/data';
import { deleteProfessionalProfile } from '@/lib/actions';
import type { Professional } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ProfessionalForm } from '@/components/shared/ProfessionalForm';
import { QrCodeDialog } from '@/components/shared/QrCodeDialog';
import { Trash, ExternalLink } from 'lucide-react';

function ProfessionalPageLoader() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function DashboardProfessionalPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [categories, setCategories] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [professional, setProfessional] = useState<Professional | null | undefined>(undefined);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
    }, [user, loading, router]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const [servicesData, citiesData, professionalData] = await Promise.all([
                getServices(),
                getUniqueCities(),
                getProfessionalByOwnerId(user.uid),
            ]);
            setCategories([...new Set(servicesData.map(s => s.category))]);
            setCities(citiesData);
            setProfessional(professionalData || null);
        } catch (error) {
            console.error("Failed to fetch data for professional profile", error);
        } finally {
            setIsDataLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    const handleDelete = () => {
        if (!professional) return;
        startTransition(async () => {
            const result = await deleteProfessionalProfile(professional.id);
            if (result.success) {
                toast({ title: 'Perfil Eliminado', description: 'Su perfil profesional ha sido eliminado.' });
                setProfessional(null);
            } else {
                toast({ title: 'Error', description: result.message, variant: 'destructive' });
            }
        });
    };

    if (loading || isDataLoading) {
        return <ProfessionalPageLoader />;
    }

    if (!user) {
        return null; // Redirecting...
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold font-headline">
                        {professional ? 'Su Perfil Profesional' : 'Conviértase en Profesional'}
                    </h1>
                    <p className="text-muted-foreground">
                        {professional
                            ? 'Actualice su información, servicios y portafolio en cualquier momento.'
                            : 'Publique su perfil de profesional independiente y sea descubierto por miles de clientes potenciales.'}
                    </p>
                </div>
                {professional && (
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" asChild>
                            <Link href={`/professionals/${professional.id}`}>
                                Ver Perfil Público <ExternalLink className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                        <QrCodeDialog
                            url={`https://oltinde.com/professionals/${professional.id}`}
                            title={professional.displayName}
                        />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive"><Trash className="mr-2 w-4 h-4" />Eliminar Perfil</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente su perfil profesional
                                        <strong className="text-foreground"> {professional.displayName} </strong>
                                        y todos sus datos asociados.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                                        {isPending ? 'Eliminando...' : 'Sí, eliminar'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
            <ProfessionalForm
                type={professional ? 'Update' : 'Create'}
                userId={user.uid}
                initialData={professional || undefined}
                categories={categories}
                cities={cities}
                onFormSubmit={fetchData}
            />
        </div>
    )
}

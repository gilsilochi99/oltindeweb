
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCompaniesByOwner, getPostsByAuthor } from '@/lib/data';
import type { Company, Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Building, Edit, Trash, Loader2, Megaphone, TicketPercent, MoreHorizontal, FileText, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { deleteCompany, deletePost } from '@/lib/actions';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function EmptyDashboard() {
    return (
        <div className="text-center py-16 px-4 border-2 border-dashed">
            <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">No tiene ninguna empresa listada</h3>
            <p className="text-muted-foreground mt-2">
                Empiece por añadir su primera empresa para que los clientes puedan encontrarle.
            </p>
            <Button asChild className="mt-6">
                <Link href="/dashboard/add-company"><PlusCircle className="w-4 h-4 mr-2"/>Añadir Nueva Empresa</Link>
            </Button>
        </div>
    )
}

function DeleteCompanyButton({ companyId, companyLogoUrl, companyName, onDeleted }: { companyId: string, companyLogoUrl: string, companyName: string, onDeleted: () => void }) {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteCompany(companyId, companyLogoUrl);
        if (result.success) {
            toast({ title: 'Empresa Eliminada', description: `"${companyName}" ha sido eliminada.` });
            onDeleted();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
        setIsDeleting(false);
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    <Trash className="w-4 h-4 mr-2"/>Eliminar
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la empresa
                        <strong className="text-foreground"> {companyName} </strong>
                         y todos sus datos asociados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}


export default function DashboardPage() {
    const { user, loading, isPremium } = useAuth();
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const { toast } = useToast();

    const fetchAllData = async () => {
        if (user) {
            setIsFetching(true);
            const [userCompanies, userPosts] = await Promise.all([
                getCompaniesByOwner(user.uid),
                getPostsByAuthor(user.uid)
            ]);
            setCompanies(userCompanies);
            setPosts(userPosts);
            setIsFetching(false);
        }
    }

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
        if (user) {
          fetchAllData();
        }
    }, [user, loading, router]);


    const handleDeletePost = async (postId: string) => {
        const result = await deletePost(postId);
        if (result.success) {
            toast({ title: "Publicación eliminada" });
            fetchAllData();
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };
    
    const statusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
        switch(status) {
            case 'published': return 'secondary';
            case 'draft': return 'outline';
            case 'pending': return 'default';
            default: return 'outline';
        }
    }

    if (loading || isFetching) {
        return (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
        )
    }
    
    if (!user) {
        return null;
    }

    const canAddCompany = companies.length === 0 || isPremium;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Panel de Control Principal</h1>
                    <p className="text-muted-foreground">Gestione sus listados de empresas y publicaciones aquí.</p>
                </div>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="inline-block">
                                 <Button asChild disabled={!canAddCompany}>
                                    <Link href="/dashboard/add-company">
                                        <PlusCircle className="w-4 h-4 mr-2"/>Añadir Nueva Empresa
                                    </Link>
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {!canAddCompany && (
                            <TooltipContent>
                                <p className="flex items-center"><Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500"/> Función Premium. Contacte para añadir más empresas.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                 </TooltipProvider>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mis Empresas ({companies.length})</CardTitle>
                    <CardDescription>A continuación se muestran todas las empresas que ha registrado.</CardDescription>
                </CardHeader>
                <CardContent>
                    {companies.length === 0 ? (
                        <EmptyDashboard />
                    ) : (
                        <div className="space-y-4">
                            {companies.map(company => (
                                <Card key={company.id} className="p-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-start gap-4">
                                            <Image src={company.logo} alt={company.name} width={64} height={64} className="bg-muted border rounded-md" />
                                            <div>
                                                <h3 className="font-semibold">{company.name}</h3>
                                                <p className="text-sm text-muted-foreground">{company.category}</p>
                                                <div>
                                                    {company.isVerified ? (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">Verificado</Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 mt-1">Pendiente de Verificación</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/edit/${company.id}`}><Edit className="w-4 h-4 mr-2"/>Editar Empresa</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild disabled={!isPremium}>
                                                    <Link href={`/dashboard/companies/${company.id}/announcements`}><Megaphone className="w-4 h-4 mr-2"/>Anuncios</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild disabled={!isPremium}>
                                                    <Link href={`/dashboard/companies/${company.id}/offers`}><TicketPercent className="w-4 h-4 mr-2"/>Ofertas</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild disabled={!isPremium}>
                                                    <Link href={`/dashboard/companies/${company.id}/documents`}><FileText className="w-4 h-4 mr-2"/>Documentos</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DeleteCompanyButton companyId={company.id} companyLogoUrl={company.logo} companyName={company.name} onDeleted={fetchAllData} />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    {!isPremium && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex gap-2 mt-4">
                                                        <Button variant="outline" size="sm" disabled><FileText className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Documentos</span></Button>
                                                        <Button variant="outline" size="sm" disabled><TicketPercent className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Ofertas</span></Button>
                                                        <Button variant="outline" size="sm" disabled><Megaphone className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Anuncios</span></Button>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="flex items-center"><Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500"/> Función Premium. Contacte con nosotros.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                     {isPremium && (
                                        <div className="flex gap-2 mt-4">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/companies/${company.id}/documents`}><FileText className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Documentos</span></Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/companies/${company.id}/offers`}><TicketPercent className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Ofertas</span></Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/companies/${company.id}/announcements`}><Megaphone className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Anuncios</span></Link>
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Mis Publicaciones</CardTitle>
                        <CardDescription>Gestione sus borradores y publicaciones pendientes de revisión.</CardDescription>
                    </div>
                     <Button asChild>
                        <Link href="/dashboard/contribuciones/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Nueva Publicación
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {posts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha Creación</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant(post.status)}>{post.status}</Badge>
                                        </TableCell>
                                        <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/contribuciones/${post.id}`)}>Editar</DropdownMenuItem>
                                                        {post.status === 'published' && <DropdownMenuItem asChild><Link href={`/contribuciones/${post.id}`} target="_blank">Ver</Link></DropdownMenuItem>}
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción eliminará permanentemente la publicación.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeletePost(post.id)}>Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                            <p>No ha creado ninguna publicación todavía.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

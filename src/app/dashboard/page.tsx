
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCompaniesByOwner, getPostsByAuthor, getProfessionalByOwnerId, getItinerariesByAuthor } from '@/lib/data';
import type { Company, Post, Professional, Itinerary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Building, Edit, Trash, Loader2, Megaphone, TicketPercent, MoreHorizontal, FileText, Star, Briefcase, CalendarDays, UtensilsCrossed, GraduationCap, Route, Newspaper, ExternalLink, QrCode as QrCodeIcon, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { deleteCompany, deletePost, deleteItinerary } from '@/lib/actions';
import { QrCodeDialog } from '@/components/shared/QrCodeDialog';
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

// Menú/Pedidos only makes sense for food businesses — gate it on the
// company's own category rather than a separate flag, so it shows up
// automatically for any company categorized as a restaurant.
function isRestaurantCategory(category?: string) {
    return !!category && category.toLowerCase().includes('restaurant');
}

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
    const [professional, setProfessional] = useState<Professional | null>(null);
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const { toast } = useToast();

    const fetchAllData = async () => {
        if (user) {
            setIsFetching(true);
            const [userCompanies, userPosts, userProfessional, userItineraries] = await Promise.all([
                getCompaniesByOwner(user.uid),
                getPostsByAuthor(user.uid),
                getProfessionalByOwnerId(user.uid),
                getItinerariesByAuthor(user.uid),
            ]);
            setCompanies(userCompanies);
            setPosts(userPosts);
            setProfessional(userProfessional || null);
            setItineraries(userItineraries);
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

    const handleDeleteItinerary = async (itineraryId: string) => {
        if (!user) return;
        const result = await deleteItinerary(itineraryId, user.uid);
        if (result.success) {
            toast({ title: "Itinerario eliminado" });
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
                <Loader2 className="w-8 h-8 animate-spin text-black" />
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
                    <CardTitle>Publicar algo nuevo</CardTitle>
                    <CardDescription>Todo lo que puede añadir a Oltinde, en un solo lugar.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/add-company"><Building className="w-4 h-4 mr-2"/>Empresa</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/add-business"><Building className="w-4 h-4 mr-2"/>Negocio Local</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/professional"><GraduationCap className="w-4 h-4 mr-2"/>Perfil Profesional</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/contribuciones/new"><Newspaper className="w-4 h-4 mr-2"/>Contribución</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/itineraries/new"><Route className="w-4 h-4 mr-2"/>Itinerario</Link>
                    </Button>
                </CardContent>
            </Card>

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
                                            <Image src={company.logo} alt={company.name} width={64} height={64} className="bg-muted rounded-md" />
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
                                                <QrCodeDialog
                                                    url={`https://oltinde.com/companies/${company.id}`}
                                                    title={company.name}
                                                    trigger={
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <QrCodeIcon className="w-4 h-4 mr-2"/>Código QR
                                                        </DropdownMenuItem>
                                                    }
                                                />
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
                                                <DropdownMenuItem asChild disabled={!isPremium}>
                                                    <Link href={`/dashboard/companies/${company.id}/jobs`}><Briefcase className="w-4 h-4 mr-2"/>Empleos</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild disabled={!isPremium}>
                                                    <Link href={`/dashboard/companies/${company.id}/events`}><CalendarDays className="w-4 h-4 mr-2"/>Eventos</Link>
                                                </DropdownMenuItem>
                                                {isRestaurantCategory(company.category) && (
                                                    <DropdownMenuItem asChild disabled={!isPremium}>
                                                        <Link href={`/dashboard/companies/${company.id}/menu`}><UtensilsCrossed className="w-4 h-4 mr-2"/>Menú</Link>
                                                    </DropdownMenuItem>
                                                )}
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
                                                        <Button variant="outline" size="sm" disabled><Briefcase className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Empleos</span></Button>
                                                        <Button variant="outline" size="sm" disabled><CalendarDays className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Eventos</span></Button>
                                                        {isRestaurantCategory(company.category) && (
                                                            <Button variant="outline" size="sm" disabled><UtensilsCrossed className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Menú</span></Button>
                                                        )}
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
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/companies/${company.id}/jobs`}><Briefcase className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Empleos</span></Link>
                                            </Button>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/dashboard/companies/${company.id}/events`}><CalendarDays className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Eventos</span></Link>
                                            </Button>
                                            {isRestaurantCategory(company.category) && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/dashboard/companies/${company.id}/menu`}><UtensilsCrossed className="w-4 h-4 sm:mr-2"/> <span className="hidden sm:inline">Menú</span></Link>
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mi Perfil Profesional</CardTitle>
                    <CardDescription>Ofrezca sus servicios como profesional independiente.</CardDescription>
                </CardHeader>
                <CardContent>
                    {professional ? (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <GraduationCap className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{professional.displayName}</h3>
                                    <p className="text-sm text-muted-foreground">{professional.title}</p>
                                    {professional.isVerified ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">Verificado</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 mt-1">Pendiente de Verificación</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/dashboard/professional"><Edit className="w-4 h-4 mr-2"/>Editar</Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/professionals/${professional.id}`} target="_blank"><ExternalLink className="w-4 h-4 mr-2"/>Ver Perfil</Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 px-4 border-2 border-dashed">
                            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-muted-foreground">Aún no tiene un perfil profesional</h3>
                            <p className="text-muted-foreground mt-1 text-sm">Publique sus habilidades, servicios y portafolio para que le encuentren nuevos clientes. Es gratis.</p>
                            <Button asChild className="mt-4">
                                <Link href="/dashboard/professional"><PlusCircle className="w-4 h-4 mr-2"/>Publicar mi Perfil Profesional</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Mis Itinerarios ({itineraries.length})</CardTitle>
                        <CardDescription>Gestione los planes de viaje que ha creado.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/itineraries/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Itinerario
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {itineraries.length > 0 ? (
                        <div className="space-y-4">
                            {itineraries.map((itinerary) => (
                                <Card key={itinerary.id} className="p-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                                                {itinerary.title}
                                                {itinerary.visibility === 'unlisted' && <Badge variant="secondary">No listado</Badge>}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{itinerary.city}</span>
                                                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{itinerary.durationDays} día{itinerary.durationDays === 1 ? '' : 's'}</span>
                                                <span>{itinerary.stops.length} parada{itinerary.stops.length === 1 ? '' : 's'}</span>
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
                                                        <Link href={`/itineraries/${itinerary.id}`} target="_blank">Ver Público</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/itineraries/${itinerary.id}`}><Edit className="w-4 h-4 mr-2"/>Editar</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                            <Trash className="w-4 h-4 mr-2"/>Eliminar
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el itinerario
                                                        <strong className="text-foreground"> {itinerary.title}</strong>.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteItinerary(itinerary.id)}>Sí, eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                            <p>Todavía no ha creado ningún itinerario.</p>
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


'use client';

import { useState, useEffect } from 'react';
import { getPosts } from '@/lib/data';
import { deletePost } from '@/lib/actions';
import type { Post } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const { isAdmin } = useAuth();

    const fetchPosts = async () => {
        setIsLoading(true);
        const postsData = await getPosts();
        setPosts(postsData);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (postId: string) => {
        const result = await deletePost(postId);
        if (result.success) {
            toast({ title: "Publicación eliminada" });
            fetchPosts();
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

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Gestionar Contribuciones</h1>
                    <p className="text-muted-foreground">Crear, editar y publicar artículos.</p>
                </div>
                <Button asChild>
                    <Link href="/admin/contribuciones/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Nueva Publicación
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Todas las Publicaciones ({posts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Autor</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha Creación</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell>{post.authorName}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => router.push(`/admin/contribuciones/edit/${post.id}`)}>Editar</DropdownMenuItem>
                                                        <DropdownMenuItem asChild><Link href={`/contribuciones/${post.id}`} target="_blank">Ver</Link></DropdownMenuItem>
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
                                                            Esta acción eliminará permanentemente la publicación.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(post.id)}>Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

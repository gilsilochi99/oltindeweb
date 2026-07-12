
'use client';

import { getPublishedPosts, getUsers } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { User, Calendar, Loader2, Search } from "lucide-react";
import type { Post, AppUser } from "@/lib/types";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

function ContributionsPageContent() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [authors, setAuthors] = useState<AppUser[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAuthor, setSelectedAuthor] = useState('all');
    
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const [postsData, usersData] = await Promise.all([
                getPublishedPosts(),
                getUsers()
            ]);
            
            const uniqueCategories = [...new Set(postsData.map(p => p.category).filter(Boolean) as string[])];
            const authorIdsWithPosts = new Set(postsData.map(p => p.authorId));
            const authorsWithPosts = usersData.filter(u => authorIdsWithPosts.has(u.id));

            setPosts(postsData);
            setAuthors(authorsWithPosts);
            setCategories(uniqueCategories);
            setIsLoading(false);
        }
        fetchData();
    }, []);
    
    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesQuery = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
            const matchesAuthor = selectedAuthor === 'all' || post.authorId === selectedAuthor;
            return matchesQuery && matchesCategory && matchesAuthor;
        });
    }, [posts, searchQuery, selectedCategory, selectedAuthor]);


    return (
        <div className="space-y-8">
             <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-headline">Contribuciones</h1>
                <p className="max-w-2xl mx-auto mt-4 text-lg text-muted-foreground">
                    Noticias, guías y artículos de interés sobre el ecosistema empresarial de Guinea Ecuatorial. ¡Todo el mundo puede crear su artículo!
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="search-posts">Buscar artículo</Label>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="search-posts"
                        placeholder="Ej: Nuevo reglamento..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-filter">Filtrar por Categoría</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={categories.length === 0}>
                    <SelectTrigger id="category-filter">
                        <SelectValue placeholder="Seleccione una categoría"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las Categorías</SelectItem>
                        {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="author-filter">Filtrar por Autor</Label>
                <Select value={selectedAuthor} onValueChange={setSelectedAuthor} disabled={authors.length === 0}>
                    <SelectTrigger id="author-filter">
                        <SelectValue placeholder="Seleccione un autor"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los Autores</SelectItem>
                        {authors.map(author => (
                            <SelectItem key={author.id} value={author.id}>{author.displayName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map(post => (
                        <Card key={post.id} className="flex flex-col overflow-hidden group">
                            <Link href={`/contribuciones/${post.id}`} className="block">
                                <div className="aspect-video overflow-hidden">
                                    <Image 
                                        src={post.featuredImage}
                                        alt={post.title}
                                        width={600}
                                        height={338}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            </Link>
                            <CardContent className="p-6 flex flex-col flex-grow">
                                 <div className="flex-grow">
                                    <h2 className="text-xl font-bold font-headline leading-tight">
                                        <Link href={`/contribuciones/${post.id}`} className="hover:text-primary transition-colors">{post.title}</Link>
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-2 line-clamp-3">{post.excerpt}</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4 pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{post.authorName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <time dateTime={post.createdAt}>
                                            {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </time>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground border-2 border-dashed">
                        <p>No se encontraron contribuciones que coincidan con su búsqueda.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


export default function ContribucionesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <ContributionsPageContent />
        </Suspense>
    )
}

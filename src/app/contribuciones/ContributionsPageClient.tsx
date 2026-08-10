'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import type { Post, AppUser } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/shared/Pagination";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { ArchiveShell, ArchiveHeader, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";
import { MobileFilterSheet } from "@/components/shared/archive/MobileFilterSheet";

const ITEMS_PER_PAGE = 10;

interface ContributionsPageClientProps {
  posts: Post[];
  authors: AppUser[];
  categories: string[];
  initialCategory?: string;
}

export function ContributionsPageClient({ posts, authors, categories, initialCategory }: ContributionsPageClientProps) {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
    const [selectedAuthor, setSelectedAuthor] = useState('all');

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesQuery = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
            const matchesAuthor = selectedAuthor === 'all' || post.authorId === selectedAuthor;
            return matchesQuery && matchesCategory && matchesAuthor;
        });
    }, [posts, searchQuery, selectedCategory, selectedAuthor]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, selectedAuthor]);

    const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
    const currentPosts = filteredPosts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    const featuredItems = useMemo(() => posts
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        href: `/contribuciones/${p.id}`,
        name: p.title,
        subtitle: p.authorName,
      })), [posts]);

    return (
      <ArchiveShell
        sidebar={
          <>
            <FeaturedListingsWidget title="Artículos Destacados" items={featuredItems} />
            <QAWidget />
          </>
        }
      >
        <ArchiveHeader
          breadcrumbLabel="Contribuciones"
          title="Contribuciones"
          description="Noticias, guías y artículos de interés sobre el ecosistema empresarial de Guinea Ecuatorial. ¡Todo el mundo puede crear su artículo!"
          resultCount={filteredPosts.length}
          pageStart={filteredPosts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
          pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredPosts.length)}
        />

        {(() => {
          const filterControls = (
            <>
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
                <Select value={selectedCategory} onValueChange={(value) => router.push(value === 'all' ? '/contribuciones' : `/contribuciones/category/${slugify(value)}`)} disabled={categories.length === 0}>
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
            </>
          );
          const activeCount = [selectedCategory !== 'all', selectedAuthor !== 'all', searchQuery !== ''].filter(Boolean).length;
          return (
            <>
              <div className="hidden md:grid md:grid-cols-3 gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6">{filterControls}</div>
              <MobileFilterSheet activeCount={activeCount}>{filterControls}</MobileFilterSheet>
            </>
          );
        })()}

        {currentPosts.length > 0 ? (
            <div className="space-y-4">
                {currentPosts.map(post => (
                    <ListingCard
                        key={post.id}
                        href={`/contribuciones/${post.id}`}
                        logoSrc={post.featuredImage}
                        logoAlt={post.title}
                        name={post.title}
                        subtitle={post.category}
                        metaPrimary={new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        metaSecondary={post.authorName}
                        quickLinks={[
                            { label: 'Leer Artículo', href: `/contribuciones/${post.id}` },
                        ]}
                    />
                ))}
            </div>
        ) : (
            <Card>
                <CardContent className="py-16 text-center text-muted-foreground border-2 border-dashed">
                    <p>No se encontraron contribuciones que coincidan con su búsqueda.</p>
                </CardContent>
            </Card>
        )}

        {totalPages > 1 && (
            <div className="pt-2">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        )}
      </ArchiveShell>
    );
}

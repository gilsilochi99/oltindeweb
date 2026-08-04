
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { searchGooglePlaces, importPlacesAsCompanies, type PlaceSearchResultWithStatus } from '@/lib/actions';
import { Loader2, MapPinned, Search } from 'lucide-react';

interface ImportFromPlacesDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onImportSuccess: () => void;
}

export function ImportFromPlacesDialog({ isOpen, onOpenChange, onImportSuccess }: ImportFromPlacesDialogProps) {
    const [city, setCity] = useState('');
    const [category, setCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<PlaceSearchResultWithStatus[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (city || category) {
            setSearchQuery(`${category} en ${city}, Guinea Ecuatorial`.replace(/^ en /, '').trim());
        }
    }, [city, category]);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !city.trim()) {
            toast({ title: "Error", description: "Indique al menos ciudad y categoría antes de buscar.", variant: "destructive" });
            return;
        }
        setIsSearching(true);
        setResults([]);
        setNextPageToken(undefined);
        setSelectedIds(new Set());
        try {
            const result = await searchGooglePlaces(searchQuery, city);
            if (!result.success) throw new Error(result.message);
            setResults(result.results);
            setNextPageToken(result.nextPageToken);
            if (result.results.length === 0) {
                toast({ title: "Sin resultados", description: "No se encontraron negocios para esta búsqueda." });
            }
        } catch (error: any) {
            toast({ title: "Error de Búsqueda", description: error.message || "No se pudo consultar Google Places.", variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    };

    // Fetches the next page of the SAME query (Google returns up to 20 per
    // call, 60 total across 3 pages) and appends rather than replacing, so
    // already-checked selections and "Ya importada" state on the first page
    // survive.
    const handleLoadMore = async () => {
        if (!nextPageToken) return;
        setIsLoadingMore(true);
        try {
            const result = await searchGooglePlaces(searchQuery, city, nextPageToken);
            if (!result.success) throw new Error(result.message);
            const existingIds = new Set(results.map(r => r.placeId));
            setResults(prev => [...prev, ...result.results.filter(r => !existingIds.has(r.placeId))]);
            setNextPageToken(result.nextPageToken);
        } catch (error: any) {
            toast({ title: "Error de Búsqueda", description: error.message || "No se pudo consultar Google Places.", variant: "destructive" });
        } finally {
            setIsLoadingMore(false);
        }
    };

    const toggleSelected = (placeId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(placeId)) next.delete(placeId);
            else next.add(placeId);
            return next;
        });
    };

    const handleImport = async () => {
        if (!category.trim()) {
            toast({ title: "Error", description: "Indique la categoría con la que se importarán estos negocios.", variant: "destructive" });
            return;
        }
        const toImport = results.filter(r => selectedIds.has(r.placeId));
        if (toImport.length === 0) return;

        setIsImporting(true);
        try {
            const result = await importPlacesAsCompanies({ places: toImport, category });
            if (!result.success) throw new Error(result.message);
            const skipped = result.skipped ?? 0;
            const skippedNote = skipped > 0 ? ` ${skipped} omitidos por no estar operativos.` : '';
            toast({ title: "Éxito", description: `${result.count} negocios importados sin propietario, listos para ser reclamados.${skippedNote}` });
            onImportSuccess();
            onOpenChange(false);
            setResults([]);
            setSelectedIds(new Set());
        } catch (error: any) {
            toast({ title: "Error de Importación", description: error.message || "Ocurrió un error al importar.", variant: "destructive" });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importar desde Google Places</DialogTitle>
                    <DialogDescription>
                        Busque negocios reales por ciudad y categoría. Al importar se añaden también teléfono, sitio web, horario y una foto cuando estén disponibles. Se crean sin propietario, listos para que su dueño los reclame.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="places-city">Ciudad</Label>
                            <Input id="places-city" placeholder="Malabo" value={city} onChange={(e) => setCity(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="places-category">Categoría</Label>
                            <Input id="places-category" placeholder="Farmacia" value={category} onChange={(e) => setCategory(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="places-query">Consulta de búsqueda</Label>
                        <div className="flex gap-2">
                            <Input id="places-query" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <Button type="button" onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {results.length > 0 && (
                        <>
                            <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
                                {results.map((place) => (
                                    <label
                                        key={place.placeId}
                                        className={`flex items-start gap-3 p-3 text-sm ${place.alreadyImported ? 'opacity-50' : 'cursor-pointer hover:bg-muted/50'}`}
                                    >
                                        <Checkbox
                                            className="mt-0.5"
                                            checked={selectedIds.has(place.placeId)}
                                            disabled={place.alreadyImported}
                                            onCheckedChange={() => toggleSelected(place.placeId)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{place.name}</span>
                                                {place.alreadyImported && <Badge variant="secondary">Ya importada</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{place.address}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {nextPageToken && (
                                <Button type="button" variant="outline" className="w-full" onClick={handleLoadMore} disabled={isLoadingMore}>
                                    {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Cargar más resultados
                                </Button>
                            )}
                        </>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cerrar</Button>
                    </DialogClose>
                    <Button onClick={handleImport} disabled={selectedIds.size === 0 || isImporting}>
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importando...
                            </>
                        ) : (
                            <>
                                <MapPinned className="mr-2 h-4 w-4" />
                                Importar Seleccionadas ({selectedIds.size})
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

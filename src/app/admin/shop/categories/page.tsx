'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, MoreHorizontal, PlusCircle, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useStorage } from '@/hooks/use-storage';
import { compressImageToBlob } from '@/lib/image-upload';
import { getProductCategories, getProductCategoryCounts } from '@/lib/shop/data';
import { createProductCategory, deleteProductCategory, updateProductCategory } from '@/lib/shop/actions';
import type { ProductCategory } from '@/lib/shop/types';
import { descendantIds, flattenCategories } from '@/components/shop/category-tree';

const ROOT = '__root__';

type Draft = { id?: string; name: string; parentId: string; description: string; image: string; position: string; isActive: boolean };

const emptyDraft = (parentId = ROOT): Draft => ({ name: '', parentId, description: '', image: '', position: '0', isActive: true });

export default function AdminShopCategoriesPage() {
  const { toast } = useToast();
  const { uploadFile, isUploading } = useStorage();
  const [categories, setCategories] = useState<ProductCategory[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleting, setDeleting] = useState<ProductCategory | null>(null);

  const load = useCallback(async () => {
    const [cats, cnt] = await Promise.all([getProductCategories(), getProductCategoryCounts()]);
    setCategories(cats);
    setCounts(cnt);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flat = useMemo(() => flattenCategories(categories ?? []), [categories]);

  // A category can't be moved under itself or its own subcategories.
  const parentChoices = useMemo(() => {
    if (!draft?.id || !categories) return flat;
    const blocked = descendantIds(categories, draft.id);
    return flat.filter(c => !blocked.has(c.id));
  }, [flat, draft?.id, categories]);

  const openEdit = (c: ProductCategory) => setDraft({
    id: c.id,
    name: c.name,
    parentId: c.parentId ?? ROOT,
    description: c.description ?? '',
    image: c.image ?? '',
    position: String(c.position),
    isActive: c.isActive,
  });

  const handleImage = async (file: File | undefined) => {
    if (!file || !draft) return;
    try {
      const blob = await compressImageToBlob(file);
      const url = await uploadFile(blob, `products/categories/${uuidv4()}.webp`);
      setDraft(d => (d ? { ...d, image: url } : d));
    } catch {
      toast({ title: 'No se pudo subir la imagen', variant: 'destructive' });
    }
  };

  const save = async () => {
    if (!draft) return;
    setIsSaving(true);
    const input = {
      name: draft.name,
      parentId: draft.parentId === ROOT ? null : draft.parentId,
      description: draft.description,
      image: draft.image,
      position: Number(draft.position) || 0,
      isActive: draft.isActive,
    };
    const result = draft.id ? await updateProductCategory(draft.id, input) : await createProductCategory(input);
    setIsSaving(false);
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: draft.id ? 'Categoría actualizada' : 'Categoría creada' });
    setDraft(null);
    load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const result = await deleteProductCategory(deleting.id);
    setDeleting(null);
    if (!result.success) {
      toast({ title: 'No se pudo eliminar', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Categoría eliminada' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-headline">Categorías de la Tienda</h1>
          <p className="text-muted-foreground">Organice los productos del marketplace. Las subcategorías se anidan bajo su categoría padre.</p>
        </div>
        <Button onClick={() => setDraft(emptyDraft())}><PlusCircle className="w-4 h-4 mr-2" /> Nueva categoría</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorías ({flat.length})</CardTitle>
          <CardDescription>El orden se controla con el campo &quot;Posición&quot; (menor primero).</CardDescription>
        </CardHeader>
        <CardContent>
          {categories === null ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-center">Posición</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {flat.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2" style={{ paddingLeft: c.depth * 24 }}>
                        {c.depth > 0 && <span className="text-muted-foreground">└</span>}
                        {c.image && <Image src={c.image} alt="" width={28} height={28} className="w-7 h-7 rounded object-cover" />}
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground hidden md:inline">/{c.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{c.position}</TableCell>
                    <TableCell className="text-center">{counts[c.id] ?? 0}</TableCell>
                    <TableCell className="text-center">
                      {c.isActive ? <Badge>Activa</Badge> : <Badge variant="outline">Oculta</Badge>}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Acciones</span><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDraft(emptyDraft(c.id))}>Añadir subcategoría</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(c)}>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!draft} onOpenChange={open => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nombre</Label>
                <Input id="cat-name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Categoría padre</Label>
                <Select value={draft.parentId} onValueChange={v => setDraft({ ...draft, parentId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT}>— Ninguna (categoría principal) —</SelectItem>
                    {parentChoices.map(c => (
                      <SelectItem key={c.id} value={c.id}><span style={{ paddingLeft: c.depth * 12 }}>{c.name}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-description">Descripción (opcional)</Label>
                <Textarea id="cat-description" rows={2} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <div className="flex items-end gap-4">
                <div className="space-y-2 w-28">
                  <Label htmlFor="cat-position">Posición</Label>
                  <Input id="cat-position" type="number" min={0} value={draft.position} onChange={e => setDraft({ ...draft, position: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch id="cat-active" checked={draft.isActive} onCheckedChange={v => setDraft({ ...draft, isActive: v })} />
                  <Label htmlFor="cat-active">Visible en la tienda</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagen (opcional)</Label>
                {draft.image ? (
                  <div className="relative w-24 h-24">
                    <Image src={draft.image} alt="" fill sizes="96px" className="rounded-md object-cover" />
                    <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setDraft({ ...draft, image: '' })} aria-label="Quitar imagen">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label className="w-24 h-24 rounded-md border-2 border-dashed flex flex-col items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/60">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UploadCloud className="w-5 h-5 mb-1" />Subir</>}
                    <input type="file" accept="image/png, image/jpeg, image/webp" className="sr-only" onChange={e => handleImage(e.target.files?.[0])} />
                  </label>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button>
            <Button onClick={save} disabled={isSaving || isUploading}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar &quot;{deleting?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>Solo se pueden eliminar categorías sin subcategorías ni productos. Para ocultarla sin borrarla, desactive &quot;Visible en la tienda&quot;.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

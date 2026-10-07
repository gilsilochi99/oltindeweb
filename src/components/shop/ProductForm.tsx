'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, ArrowRight, Loader2, PlusCircle, Star, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useStorage } from '@/hooks/use-storage';
import { compressImageToBlob, isImageTooLarge } from '@/lib/image-upload';
import { createProduct, updateProduct } from '@/lib/shop/actions';
import {
  PRODUCT_CONDITION_LABELS, variantTitle,
  type Product, type ProductCategory, type ProductCondition, type ProductInput, type ProductSpec, type ProductStatus,
} from '@/lib/shop/types';
import { flattenCategories } from './category-tree';

const MAX_IMAGES = 12;
const MAX_OPTIONS = 3;
const NO_CATEGORY = '__none__';
const NO_IMAGE = '__none__';

type OptionDraft = { name: string; values: string[]; pending: string };

type VariantRow = {
  id?: string;
  optionValues: string[];
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  stockLoaded?: number;
  image: string;
  isActive: boolean;
};

const comboKey = (values: string[]) => values.join('\u0000');

function cartesian(lists: string[][]): string[][] {
  return lists.reduce<string[][]>((acc, list) => acc.flatMap(prefix => list.map(v => [...prefix, v])), [[]]);
}

function emptyRow(optionValues: string[] = [], template?: VariantRow): VariantRow {
  return {
    optionValues,
    sku: '',
    price: template?.price ?? '',
    compareAtPrice: template?.compareAtPrice ?? '',
    stock: '0',
    image: '',
    isActive: true,
  };
}

function rowFromVariant(v: Product['variants'][number]): VariantRow {
  return {
    id: v.id,
    optionValues: v.optionValues,
    sku: v.sku ?? '',
    price: String(v.price),
    compareAtPrice: v.compareAtPrice !== undefined ? String(v.compareAtPrice) : '',
    stock: String(v.stock),
    stockLoaded: v.stock,
    image: v.image ?? '',
    isActive: v.isActive,
  };
}

// Rebuilds the variant rows for the current options, keeping the data of
// every combination that still exists so editing an option doesn't wipe
// prices/stock the seller already typed.
function syncVariants(options: OptionDraft[], rows: VariantRow[]): VariantRow[] {
  const usable = options.filter(o => o.name.trim() && o.values.length > 0);
  if (usable.length === 0) return [];
  const existing = new Map(rows.map(r => [comboKey(r.optionValues), r]));
  return cartesian(usable.map(o => o.values)).map(values => existing.get(comboKey(values)) ?? emptyRow(values, rows[0]));
}

const toNumber = (s: string) => (s.trim() === '' ? NaN : Number(s));

interface ProductFormProps {
  companyId: string;
  categories: ProductCategory[];
  initialData?: Product;
  onSaved: (productId: string) => void;
}

export function ProductForm({ companyId, categories, initialData, onSaved }: ProductFormProps) {
  const { toast } = useToast();
  const { uploadFile } = useStorage();
  const flatCategories = useMemo(() => flattenCategories(categories).filter(c => c.isActive || c.id === initialData?.categoryId), [categories, initialData?.categoryId]);

  const initialHasVariants = (initialData?.options.length ?? 0) > 0;

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? NO_CATEGORY);
  const [brand, setBrand] = useState(initialData?.brand ?? '');
  const [condition, setCondition] = useState<ProductCondition>(initialData?.condition ?? 'new');
  const [tags, setTags] = useState((initialData?.tags ?? []).join(', '));
  const [specs, setSpecs] = useState<ProductSpec[]>(initialData?.specs ?? []);
  const [images, setImages] = useState<{ url: string; alt?: string }[]>(initialData?.images.map(i => ({ url: i.url, alt: i.alt })) ?? []);
  const [pendingUploads, setPendingUploads] = useState(0);

  const [hasVariants, setHasVariants] = useState(initialHasVariants);
  const [options, setOptions] = useState<OptionDraft[]>(
    initialData?.options.map(o => ({ name: o.name, values: o.values, pending: '' })) ?? [],
  );
  const [variants, setVariants] = useState<VariantRow[]>(initialHasVariants ? initialData!.variants.map(rowFromVariant) : []);
  const [single, setSingle] = useState<VariantRow>(
    !initialHasVariants && initialData?.variants[0] ? rowFromVariant(initialData.variants[0]) : emptyRow(),
  );
  const firstVariant = initialData?.variants[0];
  const [trackInventory, setTrackInventory] = useState(firstVariant?.trackInventory ?? true);
  const [allowBackorder, setAllowBackorder] = useState(firstVariant?.allowBackorder ?? false);

  const [savingAs, setSavingAs] = useState<ProductStatus | null>(null);
  const isBusy = savingAs !== null || pendingUploads > 0;

  // ------------------------------------------------------------ images

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_IMAGES - images.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) {
      toast({ title: 'Demasiadas imágenes', description: `Máximo ${MAX_IMAGES} imágenes por producto.`, variant: 'destructive' });
    }
    for (const file of picked) {
      if (isImageTooLarge(file)) {
        toast({ title: 'Imagen demasiado grande', description: `${file.name} supera los 15 MB.`, variant: 'destructive' });
        continue;
      }
      setPendingUploads(c => c + 1);
      try {
        const blob = await compressImageToBlob(file);
        const url = await uploadFile(blob, `products/${companyId}/${uuidv4()}.webp`);
        setImages(prev => [...prev, { url }]);
      } catch {
        toast({ title: 'Error', description: `No se pudo subir ${file.name}.`, variant: 'destructive' });
      } finally {
        setPendingUploads(c => c - 1);
      }
    }
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeImage = (url: string) => {
    setImages(prev => prev.filter(i => i.url !== url));
    // Variants pointing at a removed image fall back to the product images.
    setVariants(prev => prev.map(v => (v.image === url ? { ...v, image: '' } : v)));
  };

  // ------------------------------------------------------------ options & variants

  const updateOptions = (next: OptionDraft[]) => {
    setOptions(next);
    setVariants(prev => syncVariants(next, prev));
  };

  const addOptionValue = (index: number) => {
    const option = options[index];
    const newValues = option.pending.split(',').map(v => v.trim()).filter(v => v && !option.values.includes(v));
    if (newValues.length === 0) return;
    updateOptions(options.map((o, i) => (i === index ? { ...o, values: [...o.values, ...newValues], pending: '' } : o)));
  };

  const toggleVariants = (enabled: boolean) => {
    setHasVariants(enabled);
    if (enabled && options.length === 0) {
      setOptions([{ name: '', values: [], pending: '' }]);
    }
  };

  const updateVariant = (index: number, patch: Partial<VariantRow>) => {
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  const applyToAll = (field: 'price' | 'compareAtPrice' | 'stock') => {
    const value = variants[0]?.[field] ?? '';
    setVariants(prev => prev.map(v => ({ ...v, [field]: value })));
  };

  // ------------------------------------------------------------ submit

  const buildInput = (status: ProductStatus): ProductInput | string => {
    if (title.trim().length < 3) return 'El título debe tener al menos 3 caracteres.';
    const usableOptions = hasVariants ? options.filter(o => o.name.trim() && o.values.length > 0) : [];
    if (hasVariants && usableOptions.length === 0) return 'Añada al menos una opción con valores, o desactive las variantes.';
    const rows = hasVariants ? variants : [single];

    for (const row of rows) {
      const label = hasVariants ? ` (${variantTitle(row.optionValues)})` : '';
      if (Number.isNaN(toNumber(row.price))) return `Indique el precio${label}.`;
      if (row.compareAtPrice.trim() && toNumber(row.compareAtPrice) <= toNumber(row.price)) {
        return `El precio anterior${label} debe ser mayor que el precio actual.`;
      }
      if (!Number.isInteger(toNumber(row.stock || '0'))) return `El stock${label} debe ser un número entero.`;
    }

    return {
      categoryId: categoryId === NO_CATEGORY ? null : categoryId,
      title: title.trim(),
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim(),
      brand: brand.trim() || undefined,
      condition,
      status,
      options: usableOptions.map(o => ({ name: o.name.trim(), values: o.values })),
      specs: specs.filter(s => s.name.trim() && s.value.trim()).map(s => ({ name: s.name.trim(), value: s.value.trim() })),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      images,
      variants: rows.map(row => ({
        id: row.id,
        optionValues: hasVariants ? row.optionValues : [],
        sku: row.sku.trim() || undefined,
        price: toNumber(row.price),
        compareAtPrice: row.compareAtPrice.trim() ? toNumber(row.compareAtPrice) : null,
        stock: toNumber(row.stock || '0'),
        stockLoaded: row.stockLoaded,
        trackInventory,
        allowBackorder,
        image: row.image || undefined,
        isActive: row.isActive,
      })),
    };
  };

  const save = async (status: ProductStatus) => {
    const input = buildInput(status);
    if (typeof input === 'string') {
      toast({ title: 'Revise el formulario', description: input, variant: 'destructive' });
      return;
    }
    setSavingAs(status);
    try {
      const result = initialData ? await updateProduct(initialData.id, input) : await createProduct(companyId, input);
      if (!result.success) throw new Error(result.message);
      toast({
        title: status === 'active' ? 'Producto publicado' : 'Producto guardado',
        description: status === 'active' ? 'Ya es visible en la tienda.' : undefined,
      });
      onSaved('id' in result ? (result.id as string) : initialData!.id);
    } catch (error) {
      toast({ title: 'No se pudo guardar', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    } finally {
      setSavingAs(null);
    }
  };

  const currentStatus = initialData?.status ?? 'draft';

  // ------------------------------------------------------------ render

  const priceFields = (row: VariantRow, onChange: (patch: Partial<VariantRow>) => void) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="price">Precio (XAF)</Label>
        <Input id="price" type="number" min={0} inputMode="numeric" value={row.price} onChange={e => onChange({ price: e.target.value })} placeholder="0" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="compare-at">Precio anterior (opcional)</Label>
        <Input id="compare-at" type="number" min={0} inputMode="numeric" value={row.compareAtPrice} onChange={e => onChange({ compareAtPrice: e.target.value })} placeholder="Se muestra tachado" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sku">SKU / Referencia (opcional)</Label>
        <Input id="sku" value={row.sku} onChange={e => onChange({ sku: e.target.value })} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del producto</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} maxLength={255} placeholder="Ej: Samsung Galaxy A15 128GB" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="short-description">Resumen (opcional)</Label>
            <Input id="short-description" value={shortDescription} onChange={e => setShortDescription(e.target.value)} maxLength={512} placeholder="Una línea que aparece en los listados" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={6} value={description} onChange={e => setDescription(e.target.value)} placeholder="Características, qué incluye, garantía..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Elija una categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Sin categoría</SelectItem>
                  {flatCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span style={{ paddingLeft: c.depth * 12 }}>{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca (opcional)</Label>
              <Input id="brand" value={brand} onChange={e => setBrand(e.target.value)} maxLength={128} />
            </div>
            <div className="space-y-2">
              <Label>Estado del artículo</Label>
              <Select value={condition} onValueChange={v => setCondition(v as ProductCondition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCT_CONDITION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imágenes</CardTitle>
          <CardDescription>Hasta {MAX_IMAGES} imágenes. La primera es la imagen principal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, index) => (
              <div key={img.url} className="relative aspect-square rounded-lg border overflow-hidden group bg-muted">
                <Image src={img.url} alt={img.alt || title || 'Imagen del producto'} fill sizes="200px" className="object-cover" />
                {index === 0 && (
                  <Badge className="absolute top-1.5 left-1.5 gap-1"><Star className="w-3 h-3" /> Principal</Badge>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Mover a la izquierda">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label="Mover a la derecha">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Button type="button" size="icon" variant="destructive" className="h-7 w-7" onClick={() => removeImage(img.url)} aria-label="Quitar imagen">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {Array.from({ length: pendingUploads }).map((_, i) => (
              <div key={`pending-${i}`} className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ))}
            {images.length + pendingUploads < MAX_IMAGES && (
              <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center p-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted/60 transition-colors">
                <UploadCloud className="w-7 h-7 mb-1" />
                Subir imágenes
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  multiple
                  className="sr-only"
                  onChange={e => { handleImageFiles(e.target.files); e.target.value = ''; }}
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Precio y Variantes</CardTitle>
              <CardDescription>Active las variantes si el producto viene en varias tallas, colores, capacidades...</CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Label htmlFor="has-variants" className="text-sm font-normal">Tiene variantes</Label>
              <Switch id="has-variants" checked={hasVariants} onCheckedChange={toggleVariants} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasVariants ? (
            <>
              {priceFields(single, patch => setSingle(prev => ({ ...prev, ...patch })))}
              {trackInventory && (
                <div className="space-y-2 max-w-[200px]">
                  <Label htmlFor="stock">Stock disponible</Label>
                  <Input id="stock" type="number" min={0} inputMode="numeric" value={single.stock} onChange={e => setSingle(prev => ({ ...prev, stock: e.target.value }))} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        className="max-w-[220px]"
                        value={option.name}
                        onChange={e => updateOptions(options.map((o, i) => (i === index ? { ...o, name: e.target.value } : o)))}
                        placeholder="Nombre: Talla, Color..."
                        aria-label="Nombre de la opción"
                      />
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => updateOptions(options.filter((_, i) => i !== index))} aria-label="Quitar opción">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {option.values.map(value => (
                        <Badge key={value} variant="secondary" className="gap-1 pr-1">
                          {value}
                          <button
                            type="button"
                            className="rounded-full hover:bg-black/10 p-0.5"
                            onClick={() => updateOptions(options.map((o, i) => (i === index ? { ...o, values: o.values.filter(v => v !== value) } : o)))}
                            aria-label={`Quitar ${value}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={option.pending}
                        onChange={e => setOptions(options.map((o, i) => (i === index ? { ...o, pending: e.target.value } : o)))}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOptionValue(index); } }}
                        placeholder="Valores separados por comas: S, M, L"
                        aria-label="Nuevos valores"
                      />
                      <Button type="button" variant="outline" onClick={() => addOptionValue(index)}>Añadir</Button>
                    </div>
                  </div>
                ))}
                {options.length < MAX_OPTIONS && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, { name: '', values: [], pending: '' }])}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Añadir opción
                  </Button>
                )}
              </div>

              {variants.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variante</TableHead>
                        <TableHead className="min-w-[110px]">
                          Precio <button type="button" className="text-xs text-primary underline ml-1" onClick={() => applyToAll('price')}>copiar a todas</button>
                        </TableHead>
                        <TableHead className="min-w-[110px]">
                          Anterior <button type="button" className="text-xs text-primary underline ml-1" onClick={() => applyToAll('compareAtPrice')}>copiar</button>
                        </TableHead>
                        {trackInventory && <TableHead className="min-w-[90px]">Stock</TableHead>}
                        <TableHead className="min-w-[110px]">SKU</TableHead>
                        {images.length > 0 && <TableHead>Imagen</TableHead>}
                        <TableHead>Activa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((row, index) => (
                        <TableRow key={comboKey(row.optionValues)} className={row.isActive ? '' : 'opacity-50'}>
                          <TableCell className="font-medium whitespace-nowrap">{variantTitle(row.optionValues)}</TableCell>
                          <TableCell><Input type="number" min={0} className="h-8" value={row.price} onChange={e => updateVariant(index, { price: e.target.value })} aria-label="Precio" /></TableCell>
                          <TableCell><Input type="number" min={0} className="h-8" value={row.compareAtPrice} onChange={e => updateVariant(index, { compareAtPrice: e.target.value })} aria-label="Precio anterior" /></TableCell>
                          {trackInventory && (
                            <TableCell><Input type="number" min={0} className="h-8" value={row.stock} onChange={e => updateVariant(index, { stock: e.target.value })} aria-label="Stock" /></TableCell>
                          )}
                          <TableCell><Input className="h-8" value={row.sku} onChange={e => updateVariant(index, { sku: e.target.value })} aria-label="SKU" /></TableCell>
                          {images.length > 0 && (
                            <TableCell>
                              <Select value={row.image || NO_IMAGE} onValueChange={v => updateVariant(index, { image: v === NO_IMAGE ? '' : v })}>
                                <SelectTrigger className="h-8 w-[90px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={NO_IMAGE}>—</SelectItem>
                                  {images.map((img, i) => (
                                    <SelectItem key={img.url} value={img.url}>Imagen {i + 1}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
                          <TableCell><Switch checked={row.isActive} onCheckedChange={checked => updateVariant(index, { isActive: checked })} aria-label="Variante activa" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border p-3 gap-3">
              <div>
                <Label htmlFor="track-inventory">Controlar stock</Label>
                <p className="text-xs text-muted-foreground">Desactive para servicios o productos por encargo sin límite.</p>
              </div>
              <Switch id="track-inventory" checked={trackInventory} onCheckedChange={setTrackInventory} />
            </div>
            {trackInventory && (
              <div className="flex items-center justify-between rounded-lg border p-3 gap-3">
                <div>
                  <Label htmlFor="allow-backorder">Vender sin stock</Label>
                  <p className="text-xs text-muted-foreground">Permite pedidos aunque el stock llegue a 0 (bajo pedido).</p>
                </div>
                <Switch id="allow-backorder" checked={allowBackorder} onCheckedChange={setAllowBackorder} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ficha Técnica y Etiquetas</CardTitle>
          <CardDescription>Datos como "Memoria: 128 GB" o "Material: Algodón". Ayudan a los clientes a comparar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {specs.map((spec, index) => (
              <div key={index} className="flex gap-2">
                <Input value={spec.name} onChange={e => setSpecs(specs.map((s, i) => (i === index ? { ...s, name: e.target.value } : s)))} placeholder="Característica" aria-label="Característica" className="max-w-[220px]" />
                <Input value={spec.value} onChange={e => setSpecs(specs.map((s, i) => (i === index ? { ...s, value: e.target.value } : s)))} placeholder="Valor" aria-label="Valor" />
                <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => setSpecs(specs.filter((_, i) => i !== index))} aria-label="Quitar característica">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setSpecs([...specs, { name: '', value: '' }])}>
              <PlusCircle className="w-4 h-4 mr-2" /> Añadir característica
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (opcional)</Label>
            <Input id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="smartphone, android, 5g" />
            <p className="text-xs text-muted-foreground">Separadas por comas. Mejoran la búsqueda.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t">
        <Button type="button" variant="outline" onClick={() => save(currentStatus === 'active' ? 'draft' : currentStatus)} disabled={isBusy}>
          {savingAs && savingAs !== 'active' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {currentStatus === 'active' ? 'Pasar a borrador' : currentStatus === 'archived' ? 'Guardar (archivado)' : 'Guardar borrador'}
        </Button>
        <Button type="button" onClick={() => save('active')} disabled={isBusy}>
          {savingAs === 'active' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {pendingUploads > 0 ? 'Subiendo imágenes...' : currentStatus === 'active' ? 'Guardar cambios' : 'Publicar'}
        </Button>
      </div>
    </div>
  );
}

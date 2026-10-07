'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, ArrowRight, Car, Home, Loader2, Star, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicLocationPicker } from '@/components/shared/DynamicLocationPicker';
import { useToast } from '@/hooks/use-toast';
import { useStorage } from '@/hooks/use-storage';
import { compressImageToBlob, isImageTooLarge } from '@/lib/image-upload';
import { getUniqueCities } from '@/lib/data';
import { createRentalListing, updateRentalListing } from '@/lib/rentals/actions';
import {
  DRIVER_OPTION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, amenitiesFor, kindsFor, unitLabel,
  type RentalCategory, type RentalDriverOption, type RentalListing, type RentalListingInput, type RentalStatus,
} from '@/lib/rentals/types';
import { cn } from '@/lib/utils';

const MAX_IMAGES = 15;
const NONE = '__none__';

// Numbers are edited as strings so fields can be empty.
const str = (n: number | undefined) => (n === undefined ? '' : String(n));
const numOrUndef = (s: string) => (s.trim() === '' ? undefined : Number(s));

interface Props {
  companyId: string;
  initialData?: RentalListing;
  onSaved: (id: string) => void;
}

export function RentalListingForm({ companyId, initialData, onSaved }: Props) {
  const { toast } = useToast();
  const { uploadFile } = useStorage();
  const d = initialData;

  const [cities, setCities] = useState<string[]>([]);
  const [category, setCategory] = useState<RentalCategory>(d?.category ?? 'property');
  const [kind, setKind] = useState(d?.kind ?? '');
  const [title, setTitle] = useState(d?.title ?? '');
  const [description, setDescription] = useState(d?.description ?? '');
  const [city, setCity] = useState(d?.city ?? '');
  const [neighborhood, setNeighborhood] = useState(d?.neighborhood ?? '');
  const [address, setAddress] = useState(d?.address ?? '');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({ lat: d?.lat, lng: d?.lng });

  const [shortTerm, setShortTerm] = useState(d?.shortTermEnabled ?? true);
  const [dailyPrice, setDailyPrice] = useState(str(d?.dailyPrice));
  const [minUnits, setMinUnits] = useState(str(d?.minUnits ?? 1));
  const [maxUnits, setMaxUnits] = useState(str(d?.maxUnits));
  const [longTerm, setLongTerm] = useState(d?.longTermEnabled ?? false);
  const [monthlyPrice, setMonthlyPrice] = useState(str(d?.monthlyPrice));
  const [minMonths, setMinMonths] = useState(str(d?.minMonths ?? 1));
  const [deposit, setDeposit] = useState(str(d?.deposit));
  const [priceNotes, setPriceNotes] = useState(d?.priceNotes ?? '');

  const [bedrooms, setBedrooms] = useState(str(d?.bedrooms));
  const [bathrooms, setBathrooms] = useState(str(d?.bathrooms));
  const [areaM2, setAreaM2] = useState(str(d?.areaM2));
  const [maxGuests, setMaxGuests] = useState(str(d?.maxGuests));
  const [furnished, setFurnished] = useState(d?.furnished ?? false);

  const [brand, setBrand] = useState(d?.brand ?? '');
  const [model, setModel] = useState(d?.model ?? '');
  const [year, setYear] = useState(str(d?.year));
  const [transmission, setTransmission] = useState(d?.transmission ?? NONE);
  const [fuel, setFuel] = useState(d?.fuel ?? NONE);
  const [seats, setSeats] = useState(str(d?.seats));
  const [driverOption, setDriverOption] = useState<RentalDriverOption>(d?.driverOption ?? 'none');
  const [driverDailyFee, setDriverDailyFee] = useState(str(d?.driverDailyFee));

  const [amenities, setAmenities] = useState<string[]>(d?.amenities ?? []);
  const [customAmenity, setCustomAmenity] = useState('');
  const [rules, setRules] = useState(d?.rules ?? '');
  const [images, setImages] = useState<string[]>(d?.images.map(i => i.url) ?? []);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [savingAs, setSavingAs] = useState<RentalStatus | null>(null);

  useEffect(() => { getUniqueCities().then(setCities); }, []);

  const isProperty = category === 'property';
  const kinds = kindsFor(category);
  const unit = unitLabel(category);

  const switchCategory = (c: RentalCategory) => {
    setCategory(c);
    setKind('');
    setAmenities([]);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_IMAGES - images.length;
    if (files.length > room) toast({ title: 'Demasiadas fotos', description: `Máximo ${MAX_IMAGES} fotos por anuncio.`, variant: 'destructive' });
    for (const file of Array.from(files).slice(0, room)) {
      if (isImageTooLarge(file)) {
        toast({ title: 'Foto demasiado grande', description: `${file.name} supera los 15 MB.`, variant: 'destructive' });
        continue;
      }
      setPendingUploads(c => c + 1);
      try {
        const blob = await compressImageToBlob(file);
        const url = await uploadFile(blob, `rentals/${companyId}/${uuidv4()}.webp`);
        setImages(prev => [...prev, url]);
      } catch {
        toast({ title: 'Error', description: `No se pudo subir ${file.name}.`, variant: 'destructive' });
      } finally {
        setPendingUploads(c => c - 1);
      }
    }
  };

  const moveImage = (i: number, dir: -1 | 1) => setImages(prev => {
    const next = [...prev];
    const j = i + dir;
    if (j < 0 || j >= next.length) return prev;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const toggleAmenity = (a: string) => setAmenities(prev => (prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]));

  const save = async (status: RentalStatus) => {
    if (!kind) {
      toast({ title: 'Revise el formulario', description: 'Elija el tipo de inmueble o vehículo.', variant: 'destructive' });
      return;
    }
    const input: RentalListingInput = {
      title, description, category, kind, status, city,
      neighborhood: neighborhood || undefined,
      address: address || undefined,
      lat: coords.lat, lng: coords.lng,
      shortTermEnabled: shortTerm,
      dailyPrice: numOrUndef(dailyPrice),
      minUnits: numOrUndef(minUnits) ?? 1,
      maxUnits: numOrUndef(maxUnits),
      longTermEnabled: longTerm,
      monthlyPrice: numOrUndef(monthlyPrice),
      minMonths: numOrUndef(minMonths) ?? 1,
      deposit: numOrUndef(deposit),
      priceNotes: priceNotes || undefined,
      bedrooms: numOrUndef(bedrooms), bathrooms: numOrUndef(bathrooms), areaM2: numOrUndef(areaM2),
      maxGuests: numOrUndef(maxGuests), furnished,
      brand: brand || undefined, model: model || undefined, year: numOrUndef(year),
      transmission: transmission === NONE ? undefined : transmission,
      fuel: fuel === NONE ? undefined : fuel,
      seats: numOrUndef(seats),
      driverOption, driverDailyFee: numOrUndef(driverDailyFee),
      amenities, rules: rules || undefined, images,
    };
    setSavingAs(status);
    const result = d ? await updateRentalListing(d.id, input) : await createRentalListing(companyId, input);
    setSavingAs(null);
    if (!result.success) {
      toast({ title: 'No se pudo guardar', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: status === 'active' ? 'Anuncio publicado' : 'Anuncio guardado' });
    onSaved('id' in result ? (result.id as string) : d!.id);
  };

  const currentStatus = d?.status ?? 'draft';
  const busy = savingAs !== null || pendingUploads > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>¿Qué alquila?</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {([['property', 'Inmueble', Home], ['vehicle', 'Vehículo', Car]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => switchCategory(value)}
                aria-pressed={category === value}
                className={cn('flex items-center justify-center gap-2 rounded-lg border-2 p-4 font-semibold transition-colors', category === value ? 'border-primary bg-primary/10' : 'border-muted hover:border-outline-variant')}
              >
                <Icon className="w-5 h-5" />{label}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={kind || undefined} onValueChange={setKind}>
                <SelectTrigger><SelectValue placeholder="Elija el tipo" /></SelectTrigger>
                <SelectContent>{Object.entries(kinds).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-title">Título del anuncio</Label>
              <Input id="r-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={255} placeholder={isProperty ? 'Ej: Piso de 3 habitaciones en Caracolas' : 'Ej: Toyota Land Cruiser 4x4'} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-desc">Descripción</Label>
            <Textarea id="r-desc" rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder={isProperty ? 'Distribución, estado, qué incluye, cercanías...' : 'Estado del vehículo, kilometraje, qué incluye...'} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fotos</CardTitle><CardDescription>Hasta {MAX_IMAGES} fotos. La primera es la portada.</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <div key={url} className="relative aspect-[4/3] rounded-lg border overflow-hidden bg-muted">
                <Image src={url} alt="" fill sizes="200px" className="object-cover" />
                {i === 0 && <Badge className="absolute top-1.5 left-1.5 gap-1"><Star className="w-3 h-3" />Portada</Badge>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex gap-1">
                    <Button type="button" size="icon" variant="secondary" className="h-7 w-7" disabled={i === 0} onClick={() => moveImage(i, -1)} aria-label="Mover a la izquierda"><ArrowLeft className="w-3.5 h-3.5" /></Button>
                    <Button type="button" size="icon" variant="secondary" className="h-7 w-7" disabled={i === images.length - 1} onClick={() => moveImage(i, 1)} aria-label="Mover a la derecha"><ArrowRight className="w-3.5 h-3.5" /></Button>
                  </div>
                  <Button type="button" size="icon" variant="destructive" className="h-7 w-7" onClick={() => setImages(prev => prev.filter(u => u !== url))} aria-label="Quitar foto"><X className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
            {Array.from({ length: pendingUploads }).map((_, i) => (
              <div key={`p${i}`} className="aspect-[4/3] rounded-lg border-2 border-dashed flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ))}
            {images.length + pendingUploads < MAX_IMAGES && (
              <label className="aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-sm text-muted-foreground cursor-pointer hover:bg-muted/60">
                <UploadCloud className="w-7 h-7 mb-1" />Subir fotos
                <input type="file" accept="image/png, image/jpeg, image/webp" multiple className="sr-only" onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Precios y modalidad</CardTitle><CardDescription>Puede ofrecer alquiler por {unitLabel(category, true)}, por meses, o ambos.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border p-4 space-y-4">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span><span className="font-semibold">Por {unitLabel(category, true)}</span><span className="block text-xs text-muted-foreground">{isProperty ? 'Estancias cortas, vacaciones, viajes de trabajo.' : 'Alquiler por días, con calendario de disponibilidad.'}</span></span>
              <Switch checked={shortTerm} onCheckedChange={setShortTerm} />
            </label>
            {shortTerm && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="r-daily">Precio por {unit} (XAF)</Label><Input id="r-daily" type="number" min={0} value={dailyPrice} onChange={e => setDailyPrice(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="r-min">Mínimo de {unitLabel(category, true)}</Label><Input id="r-min" type="number" min={1} value={minUnits} onChange={e => setMinUnits(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="r-max">Máximo (opcional)</Label><Input id="r-max" type="number" min={1} value={maxUnits} onChange={e => setMaxUnits(e.target.value)} placeholder="Sin límite" /></div>
              </div>
            )}
          </div>
          <div className="rounded-lg border p-4 space-y-4">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span><span className="font-semibold">Por meses</span><span className="block text-xs text-muted-foreground">{isProperty ? 'Alquiler residencial u oficinas de larga duración.' : 'Renting mensual para empresas o particulares.'}</span></span>
              <Switch checked={longTerm} onCheckedChange={setLongTerm} />
            </label>
            {longTerm && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="r-monthly">Precio por mes (XAF)</Label><Input id="r-monthly" type="number" min={0} value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="r-minm">Mínimo de meses</Label><Input id="r-minm" type="number" min={1} value={minMonths} onChange={e => setMinMonths(e.target.value)} /></div>
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="r-dep">Fianza (opcional, XAF)</Label><Input id="r-dep" type="number" min={0} value={deposit} onChange={e => setDeposit(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="r-pn">Notas sobre el precio (opcional)</Label><Input id="r-pn" value={priceNotes} onChange={e => setPriceNotes(e.target.value)} maxLength={512} placeholder={isProperty ? 'Ej: agua y luz incluidas' : 'Ej: combustible no incluido'} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{isProperty ? 'Características del inmueble' : 'Datos del vehículo'}</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {isProperty ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2"><Label htmlFor="r-bed">Habitaciones</Label><Input id="r-bed" type="number" min={0} value={bedrooms} onChange={e => setBedrooms(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="r-bath">Baños</Label><Input id="r-bath" type="number" min={0} value={bathrooms} onChange={e => setBathrooms(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="r-area">Superficie (m²)</Label><Input id="r-area" type="number" min={1} value={areaM2} onChange={e => setAreaM2(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="r-guests">Personas máx.</Label><Input id="r-guests" type="number" min={1} value={maxGuests} onChange={e => setMaxGuests(e.target.value)} /></div>
              <label className="flex items-center gap-2 text-sm col-span-2 cursor-pointer"><Switch checked={furnished} onCheckedChange={setFurnished} />Amueblado</label>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2"><Label htmlFor="r-brand">Marca</Label><Input id="r-brand" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Toyota" /></div>
                <div className="space-y-2"><Label htmlFor="r-model">Modelo</Label><Input id="r-model" value={model} onChange={e => setModel(e.target.value)} placeholder="Hilux" /></div>
                <div className="space-y-2"><Label htmlFor="r-year">Año</Label><Input id="r-year" type="number" min={1950} value={year} onChange={e => setYear(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="r-seats">Plazas</Label><Input id="r-seats" type="number" min={1} value={seats} onChange={e => setSeats(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Cambio</Label>
                  <Select value={transmission} onValueChange={setTransmission}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value={NONE}>—</SelectItem>{Object.entries(TRANSMISSION_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Combustible</Label>
                  <Select value={fuel} onValueChange={setFuel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value={NONE}>—</SelectItem>{Object.entries(FUEL_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Conductor</Label>
                  <Select value={driverOption} onValueChange={v => setDriverOption(v as RentalDriverOption)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(DRIVER_OPTION_LABELS) as RentalDriverOption[]).map(k => <SelectItem key={k} value={k}>{DRIVER_OPTION_LABELS[k]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {driverOption !== 'none' && (
                  <div className="space-y-2"><Label htmlFor="r-dfee">Suplemento conductor por día (XAF)</Label><Input id="r-dfee" type="number" min={0} value={driverDailyFee} onChange={e => setDriverDailyFee(e.target.value)} placeholder={driverOption === 'required' ? 'Incluido en el precio si lo deja vacío' : ''} /></div>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>{isProperty ? 'Servicios y equipamiento' : 'Equipamiento y servicios'}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from(new Set([...amenitiesFor(category), ...amenities])).map(a => (
                <label key={a} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />{a}</label>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <Input value={customAmenity} onChange={e => setCustomAmenity(e.target.value)} placeholder="Añadir otro..." maxLength={80}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customAmenity.trim()) { setAmenities(p => Array.from(new Set([...p, customAmenity.trim()]))); setCustomAmenity(''); } } }} />
              <Button type="button" variant="outline" onClick={() => { if (customAmenity.trim()) { setAmenities(p => Array.from(new Set([...p, customAmenity.trim()]))); setCustomAmenity(''); } }}>Añadir</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-rules">{isProperty ? 'Normas de la casa (opcional)' : 'Requisitos y condiciones (opcional)'}</Label>
            <Textarea id="r-rules" rows={3} value={rules} onChange={e => setRules(e.target.value)} placeholder={isProperty ? 'Ej: no se permiten fiestas, entrada a partir de las 14h...' : 'Ej: carnet con 2 años de antigüedad, edad mínima 23 años...'} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ubicación</CardTitle><CardDescription>{isProperty ? 'Dónde está el inmueble.' : 'Dónde se recoge el vehículo.'}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Select value={city || undefined} onValueChange={setCity}>
                <SelectTrigger><SelectValue placeholder="Elija ciudad" /></SelectTrigger>
                <SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="r-nb">Barrio (opcional)</Label><Input id="r-nb" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="r-addr">Dirección (opcional)</Label><Input id="r-addr" value={address} onChange={e => setAddress(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>Marque el punto en el mapa (opcional)</Label>
            <DynamicLocationPicker lat={coords.lat} lng={coords.lng} onChange={setCoords} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t">
        <Button type="button" variant="outline" onClick={() => save(currentStatus === 'active' ? 'draft' : currentStatus)} disabled={busy}>
          {savingAs && savingAs !== 'active' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {currentStatus === 'active' ? 'Pasar a borrador' : 'Guardar borrador'}
        </Button>
        <Button type="button" onClick={() => save('active')} disabled={busy}>
          {savingAs === 'active' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {pendingUploads > 0 ? 'Subiendo fotos...' : currentStatus === 'active' ? 'Guardar cambios' : 'Publicar'}
        </Button>
      </div>
    </div>
  );
}

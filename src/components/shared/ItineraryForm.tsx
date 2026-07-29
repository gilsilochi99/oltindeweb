'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createItinerary, updateItinerary } from "@/lib/actions";
import type { Itinerary, TouristLocation } from "@/lib/types";
import { ArrowUp, ArrowDown, Trash2, PlusCircle, UploadCloud, X } from "lucide-react";
import { isImageTooLarge } from "@/lib/image-upload";

const itineraryFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  city: z.string({ required_error: "Debe seleccionar una ciudad." }).min(1, "Debe seleccionar una ciudad."),
  durationDays: z.coerce.number().min(1, "Debe durar al menos 1 día."),
  coverImage: z.string().optional().or(z.literal('')),
  theme: z.string().optional(),
  visibility: z.enum(['public', 'unlisted']),
});

type ItineraryFormValues = z.infer<typeof itineraryFormSchema>;

interface StopDraft {
  key: string;
  locationId: string;
  day: number;
  suggestedTime: string;
  notes: string;
}

interface ItineraryFormProps {
  type: 'Create' | 'Update';
  userId: string;
  authorName: string;
  isAdmin?: boolean;
  initialData?: Itinerary;
  cities: string[];
  locations: TouristLocation[];
  onFormSubmit: () => void;
}

export function ItineraryForm({ type, userId, authorName, isAdmin = false, initialData, cities, locations, onFormSubmit }: ItineraryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stops, setStops] = useState<StopDraft[]>(
    initialData
      ? [...initialData.stops].sort((a, b) => a.order - b.order).map(s => ({
          key: s.id,
          locationId: s.locationId,
          day: s.day,
          suggestedTime: s.suggestedTime || '',
          notes: s.notes || '',
        }))
      : []
  );
  const [newStopLocationId, setNewStopLocationId] = useState('');
  const [newStopDay, setNewStopDay] = useState('1');
  const [newStopTime, setNewStopTime] = useState('');
  const [newStopNotes, setNewStopNotes] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(initialData?.coverImage || null);

  const defaultValues: ItineraryFormValues = initialData ? {
    title: initialData.title,
    description: initialData.description,
    city: initialData.city,
    durationDays: initialData.durationDays,
    coverImage: initialData.coverImage || '',
    theme: initialData.theme?.join(', ') || '',
    visibility: initialData.visibility,
  } : {
    title: '',
    description: '',
    city: '',
    durationDays: 1,
    coverImage: '',
    theme: '',
    visibility: 'public',
  };

  const form = useForm<ItineraryFormValues>({
    resolver: zodResolver(itineraryFormSchema),
    defaultValues,
  });

  function locationName(locationId: string) {
    return locations.find(l => l.id === locationId)?.name || 'Lugar desconocido';
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isImageTooLarge(file)) {
        toast({ title: "Imagen Demasiado Grande", description: "La imagen no puede superar 600 KB. Intente con una imagen más pequeña o comprimida.", variant: "destructive" });
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCoverImagePreview(result);
        form.setValue('coverImage', result, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverImage = () => {
    setCoverImagePreview(null);
    form.setValue('coverImage', '', { shouldDirty: true });
  };

  function addStop() {
    if (!newStopLocationId) {
      toast({ title: "Seleccione un lugar", variant: "destructive" });
      return;
    }
    setStops(prev => [...prev, {
      key: `${newStopLocationId}-${Date.now()}`,
      locationId: newStopLocationId,
      day: parseInt(newStopDay, 10) || 1,
      suggestedTime: newStopTime,
      notes: newStopNotes,
    }]);
    setNewStopLocationId('');
    setNewStopTime('');
    setNewStopNotes('');
  }

  function removeStop(key: string) {
    setStops(prev => prev.filter(s => s.key !== key));
  }

  function moveStop(index: number, direction: -1 | 1) {
    setStops(prev => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  async function onSubmit(values: ItineraryFormValues) {
    if (stops.length === 0) {
      toast({ title: "Añada al menos una parada", description: "Un itinerario necesita al menos un lugar para visitar.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        city: values.city,
        durationDays: values.durationDays,
        coverImage: values.coverImage,
        theme: values.theme ? values.theme.split(',').map(t => t.trim()).filter(Boolean) : [],
        visibility: values.visibility,
        stops: stops.map((s, index) => ({
          locationId: s.locationId,
          order: index + 1,
          day: s.day,
          suggestedTime: s.suggestedTime,
          notes: s.notes,
        })),
      };

      if (type === 'Create') {
        const result = await createItinerary(userId, authorName, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Itinerario Creado", description: "Su itinerario ya es visible públicamente." });
      } else if (initialData) {
        const result = await updateItinerary(initialData.id, userId, isAdmin, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Itinerario Actualizado", description: "Los cambios han sido guardados." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar el itinerario.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Título del Itinerario</FormLabel><FormControl><Input {...field} placeholder="Ej: Fin de semana en Malabo" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una ciudad" /></SelectTrigger></FormControl>
                <SelectContent>
                  {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="durationDays" render={({ field }) => (
            <FormItem><FormLabel>Duración (días)</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="theme" render={({ field }) => (
            <FormItem>
              <FormLabel>Temas (Opcional)</FormLabel>
              <FormControl><Input {...field} placeholder="Ej: familiar, aventura" /></FormControl>
              <FormDescription>Separados por comas.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="visibility" render={({ field }) => (
            <FormItem>
              <FormLabel>Visibilidad</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="unlisted">No listado (solo con enlace)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField
          control={form.control}
          name="coverImage"
          render={() => (
            <FormItem>
              <FormLabel>Imagen de Portada (Opcional)</FormLabel>
              <FormControl>
                <div className="w-full">
                  <Input
                    id="itinerary-cover-upload"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleCoverImageChange}
                    disabled={isSubmitting}
                  />
                  {coverImagePreview ? (
                    <div className="relative w-32 h-32 rounded-lg border-2 border-dashed flex justify-center items-center">
                      <Image src={coverImagePreview} alt="Vista previa" fill style={{ objectFit: 'cover' }} className="rounded-lg" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removeCoverImage}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="itinerary-cover-upload"
                      className="cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full h-32 rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground"
                    >
                      <UploadCloud className="w-8 h-8 mb-2" />
                      <span>Subir imagen</span>
                    </label>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-6">
          <FormLabel>Paradas del Itinerario</FormLabel>
          <p className="text-sm text-muted-foreground mb-4">Añada lugares en el orden en que se visitarán.</p>

          {stops.length > 0 && (
            <div className="space-y-2 mb-4">
              {stops.map((stop, index) => (
                <div key={stop.key} className="flex items-center gap-3 border rounded-md p-3 bg-muted/30">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{locationName(stop.locationId)}</p>
                    <p className="text-xs text-muted-foreground">
                      Día {stop.day}{stop.suggestedTime && ` · ${stop.suggestedTime}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveStop(index, -1)} disabled={index === 0}>
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveStop(index, 1)} disabled={index === stops.length - 1}>
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeStop(stop.key)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 border rounded-md p-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Lugar</Label>
              <Select value={newStopLocationId} onValueChange={setNewStopLocationId}>
                <SelectTrigger><SelectValue placeholder="Seleccione un lugar" /></SelectTrigger>
                <SelectContent>
                  {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Día</Label>
              <Input type="number" min={1} value={newStopDay} onChange={(e) => setNewStopDay(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hora sugerida</Label>
              <Input placeholder="Ej: 10:00" value={newStopTime} onChange={(e) => setNewStopTime(e.target.value)} />
            </div>
            <div className="sm:col-span-4 space-y-1.5">
              <Label>Notas (Opcional)</Label>
              <Input placeholder="Ej: Llevar protector solar" value={newStopNotes} onChange={(e) => setNewStopNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-4">
              <Button type="button" variant="outline" size="sm" onClick={addStop}>
                <PlusCircle className="mr-2 h-4 w-4" />Añadir Parada
              </Button>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Publicar Itinerario' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}

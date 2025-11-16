

'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/data';
import type { Company, Offer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, TicketPercent, UploadCloud, X } from 'lucide-react';
import Link from 'next/link';
import { addOffer } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const offerSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  discount: z.string().min(1, "El descuento es obligatorio."),
  validUntil: z.date({ required_error: "La fecha de validez es obligatoria."}),
  image: z.string().optional(),
});

function AddOfferForm({ companyId, onOfferAdded }: { companyId: string, onOfferAdded: (newOffer: Offer) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('');
  const [validUntil, setValidUntil] = useState<Date | undefined>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [image, setImage] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImage('');
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = offerSchema.safeParse({ title, description, discount, validUntil, image });
    if (!validation.success) {
      toast({
        title: "Error de validación",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await addOffer(companyId, { 
          title, 
          description, 
          discount, 
          validUntil: validUntil!.toISOString(),
          image,
      });
      if (result.success && result.newOffer) {
        toast({ title: "Oferta Publicada", description: "Su oferta ahora es visible en su página." });
        onOfferAdded(result.newOffer);
        setTitle('');
        setDescription('');
        setDiscount('');
        setValidUntil(undefined);
        setImage('');
        setImagePreview(null);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nueva Oferta</CardTitle>
        <CardDescription>Publique descuentos y promociones para atraer clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la Oferta</Label>
            <Input id="title" placeholder="Ej: 20% de Descuento en..." value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPending} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="discount">Descuento</Label>
            <Input id="discount" placeholder="Ej: 20% o 5.000 XAF" value={discount} onChange={(e) => setDiscount(e.target.value)} disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" placeholder="Describa los detalles de su oferta..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} />
          </div>
          <div className="space-y-2">
             <Label htmlFor="validUntil">Válido Hasta</Label>
             <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !validUntil && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validUntil ? format(validUntil, "PPP", { locale: es }) : <span>Elija una fecha</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <CalendarPicker
                        mode="single"
                        selected={validUntil}
                        onSelect={setValidUntil}
                        initialFocus
                        locale={es}
                    />
                </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Imagen (Opcional)</Label>
            <Input
              id="image-upload-offer"
              type="file"
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleImageChange}
              disabled={isPending}
            />
            {imagePreview ? (
              <div className="relative aspect-video rounded-lg border-2 border-dashed flex justify-center items-center">
                <Image src={imagePreview} alt="Vista previa" fill objectFit="cover" className="rounded-lg" />
                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removeImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="image-upload-offer"
                className="cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full aspect-video rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground"
              >
                <UploadCloud className="w-8 h-8 mb-2" />
                <span>Subir imagen</span>
                <span className="text-xs mt-1">PNG, JPG, GIF</span>
              </label>
            )}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</> : "Publicar Oferta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function OffersPage({ params }: { params: { companyId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchCompanyData = async () => {
        setIsLoading(true);
        const data = await getCompanyById(params.companyId);
        if (!data || data.ownerId !== user.uid) {
          notFound();
        }
        setCompany(data);
        setOffers(data.offers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsLoading(false);
      };
      fetchCompanyData();
    }
  }, [user, params.companyId]);
  
  const handleNewOffer = (newOffer: Offer) => {
      setOffers(prev => [newOffer, ...prev]);
  }


  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestionar Ofertas</h1>
        <p className="text-muted-foreground">
          Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-primary hover:underline">{company.name}</Link>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ofertas Publicadas ({offers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {offers.length > 0 ? (
                <div className="space-y-4">
                  {offers.map((offer) => (
                     <Card key={offer.id} className="border-primary border-2 relative overflow-hidden bg-primary/5">
                        {offer.image && <Image src={offer.image} alt={offer.title} width={400} height={200} className="w-full h-32 object-cover" />}
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                                        <TicketPercent className="w-5 h-5"/>
                                        {offer.title}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        Válido hasta el {new Date(offer.validUntil).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <Badge variant="default" className="text-base">{offer.discount}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground/80">{offer.description}</p>
                        </CardContent>
                        {/* Add Edit/Delete buttons here in the future */}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay ofertas publicadas para esta empresa.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <AddOfferForm companyId={company.id} onOfferAdded={handleNewOffer} />
        </div>
      </div>
    </div>
  );
}

    
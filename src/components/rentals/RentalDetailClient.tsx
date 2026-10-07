'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Car, ChevronLeft, ChevronRight, Home, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toWhatsAppHref } from '@/components/shared/WhatsAppButton';
import { recordRentalView } from '@/lib/rentals/actions';
import type { RentalCategory, RentalImage } from '@/lib/rentals/types';
import { cn } from '@/lib/utils';

export function RentalGallery({ images, title, category }: { images: RentalImage[]; title: string; category: RentalCategory }) {
  const [i, setI] = useState(0);
  const current = images[i];
  if (!current) {
    return (
      <div className="aspect-[16/10] rounded-lg bg-muted flex items-center justify-center">
        {category === 'property' ? <Home className="w-16 h-16 text-muted-foreground" /> : <Car className="w-16 h-16 text-muted-foreground" />}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-muted">
        <Image src={current.url} alt={`${title} — foto ${i + 1}`} fill priority sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" />
        {images.length > 1 && (
          <>
            <Button type="button" size="icon" variant="secondary" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setI((i - 1 + images.length) % images.length)} aria-label="Foto anterior"><ChevronLeft className="w-5 h-5" /></Button>
            <Button type="button" size="icon" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setI((i + 1) % images.length)} aria-label="Foto siguiente"><ChevronRight className="w-5 h-5" /></Button>
            <span className="absolute bottom-2 right-2 rounded bg-black/60 text-white text-xs px-2 py-0.5">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, n) => (
            <button key={img.id} type="button" onClick={() => setI(n)} aria-label={`Ver foto ${n + 1}`} aria-current={n === i}
              className={cn('relative w-20 h-14 shrink-0 rounded-md overflow-hidden border-2', n === i ? 'border-primary' : 'border-transparent opacity-80 hover:opacity-100')}>
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// WhatsApp + call, always available (the user asked for both alongside booking requests).
export function RentalContactButtons({ listingId, title, slug, companyName, whatsapp, phone, isPreview }: {
  listingId: string; title: string; slug: string; companyName: string; whatsapp?: string; phone?: string; isPreview: boolean;
}) {
  useEffect(() => {
    if (!isPreview) recordRentalView(listingId);
  }, [listingId, isPreview]);

  const number = whatsapp ? (whatsapp.startsWith('http') ? whatsapp : whatsapp.replace(/[^\d]/g, '')) : '';
  const waHref = number
    ? toWhatsAppHref(number, `Hola ${companyName}, me interesa este alquiler que vi en Oltinde:\n${title}\nhttps://oltinde.com/alquiler/${slug}`)
    : undefined;

  if (!waHref && !phone) return <p className="text-sm text-muted-foreground">Contacte con la empresa desde su perfil.</p>;
  return (
    <div className="flex flex-col gap-2">
      {waHref && (
        <Button asChild size="lg" className="w-full bg-[#25D366] hover:bg-[#1ebe5b] text-white">
          <a href={waHref} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-2" />Consultar por WhatsApp</a>
        </Button>
      )}
      {phone && (
        <Button asChild size="lg" variant="outline" className="w-full">
          <a href={`tel:${phone.replace(/\s/g, '')}`}><Phone className="w-4 h-4 mr-2" />Llamar</a>
        </Button>
      )}
    </div>
  );
}

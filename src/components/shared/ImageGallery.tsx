
'use client';

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

function LightboxNav({ api, count }: { api: CarouselApi | undefined; count: number }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  if (count <= 1) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => api?.scrollPrev()}
        aria-label="Foto anterior"
        className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => api?.scrollNext()}
        aria-label="Foto siguiente"
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium z-10">
        {selectedIndex + 1} / {count}
      </div>
    </>
  );
}

// A click-to-enlarge photo gallery: a scrollable strip of thumbnails plus a
// fullscreen lightbox. The lightbox uses embla (already a dependency via
// components/ui/carousel, previously unused) so mobile visitors can swipe
// between photos instead of only tapping the prev/next buttons.
export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className={cn(
              "group relative aspect-video overflow-hidden rounded-lg border",
              index === 0 && "col-span-2 sm:col-span-2 sm:row-span-2 aspect-square sm:aspect-auto"
            )}
          >
            <Image
              src={image}
              alt={`${alt} - foto ${index + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Expand className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 bg-black border-none overflow-hidden">
          <DialogTitle className="sr-only">{alt} - galería de imágenes</DialogTitle>
          {lightboxIndex !== null && (
            <Carousel
              opts={{ loop: true, startIndex: lightboxIndex }}
              setApi={setApi}
              className="relative"
            >
              <CarouselContent className="-ml-0">
                {images.map((image, index) => (
                  <CarouselItem key={index} className="pl-0 relative aspect-video sm:aspect-[16/10]">
                    <Image
                      src={image}
                      alt={`${alt} - foto ${index + 1}`}
                      fill
                      className="object-contain"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <LightboxNav api={api} count={images.length} />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

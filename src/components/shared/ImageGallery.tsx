
'use client';

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// A click-to-enlarge photo gallery: a scrollable strip of thumbnails plus a
// fullscreen lightbox with prev/next navigation and a position counter, used
// on business detail pages instead of a bare, non-interactive carousel.
export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const showPrev = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  const showNext = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));

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
            <div className="relative aspect-video sm:aspect-[16/10]">
              <Image
                src={images[lightboxIndex]}
                alt={`${alt} - foto ${lightboxIndex + 1}`}
                fill
                className="object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Foto siguiente"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
                    {lightboxIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

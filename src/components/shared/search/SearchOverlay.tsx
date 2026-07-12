
'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { SearchExperience } from './SearchExperience';

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Built on the raw Radix primitives (not the shadcn Dialog/DialogContent wrapper)
// because that wrapper hardcodes a centered, max-w-lg, rounded card with its own
// built-in close button — exactly the "boxed popup" look this is meant to avoid.
// This still gets Radix's focus trap, Escape-to-close, and scroll lock for free.
export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 bg-background flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">Búsqueda Inteligente</DialogPrimitive.Title>
          <SearchExperience variant="overlay" onClose={() => onOpenChange(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

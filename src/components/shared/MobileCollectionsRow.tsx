
'use client';

import { useState } from "react";
import Link from "next/link";
import {
  Sheet, SheetContent, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Building, Landmark, FileText, Briefcase, CalendarDays, TicketPercent,
  Megaphone, Newspaper, MoreHorizontal,
} from "lucide-react";

// Kept separate from the desktop `collections` array in page.tsx: passing
// icon components as props across the server/client boundary isn't
// serializable, so this client island defines its own copy.
const collections = [
  { href: "/companies", label: "Empresas", icon: Building },
  { href: "/institutions", label: "Instituciones", icon: Landmark },
  { href: "/procedures", label: "Trámites", icon: FileText },
  { href: "/jobs", label: "Empleos", icon: Briefcase },
  { href: "/events", label: "Eventos", icon: CalendarDays },
  { href: "/offers", label: "Ofertas", icon: TicketPercent },
  { href: "/announcements", label: "Anuncios", icon: Megaphone },
  { href: "/contribuciones", label: "Contribuciones", icon: Newspaper },
];

const VISIBLE_COUNT = 4;

function CollectionTile({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: React.ElementType; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary transition-colors group-active:bg-primary/20">
        <Icon className="w-6 h-6" strokeWidth={1.75} />
      </span>
      <span className="text-[11px] font-medium text-foreground/80 text-center leading-tight">
        {label}
      </span>
    </Link>
  );
}

export function MobileCollectionsRow() {
  const [open, setOpen] = useState(false);
  const visible = collections.slice(0, VISIBLE_COUNT);

  return (
    <div className="mt-8 md:hidden grid grid-cols-5 gap-1 max-w-sm mx-auto px-4">
      {visible.map(item => (
        <CollectionTile key={item.href} {...item} />
      ))}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button type="button" className="flex flex-col items-center gap-1.5 group">
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary transition-colors group-active:bg-primary/20">
              <MoreHorizontal className="w-6 h-6" strokeWidth={1.75} />
            </span>
            <span className="text-[11px] font-medium text-foreground/80 text-center leading-tight">
              Más
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetTitle className="text-base font-semibold mb-6 text-center">Todas las colecciones</SheetTitle>
          <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            {collections.map(item => (
              <CollectionTile key={item.href} {...item} onClick={() => setOpen(false)} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

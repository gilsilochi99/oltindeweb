import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, Briefcase, HeartPulse, ImageOff, Search, UserRound, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { RentalCard } from "@/components/rentals/RentalCard";
import type { ProductListItem } from "@/lib/shop/types";
import type { RentalListItem } from "@/lib/rentals/types";
import type { HealthFacility, MenuItem } from "@/lib/types";

// The homepage on phones: the same design as the app's home screen
// (mobile/app/(tabs)/index.tsx) — yellow hero with the search bar, popular
// searches, two big tiles, a grid of app tiles, shelves and the black panel.

const POPULAR = ["Restaurantes en Malabo", "Farmacias de guardia", "Abogados", "Hoteles en Bata", "Pasaporte", "Informática", "Empleo"];

const ill = (name: string) => `/illustrations/home/${name}.svg`;

const FEATURED = [
  { image: ill("tienda-online"), title: "Tienda", text: "Compra a tiendas locales y paga al recibir.", href: "/tienda", bg: "#FFF1BF" },
  { image: ill("alquileres"), title: "Alquiler", text: "Casas y coches por días o meses.", href: "/alquiler", bg: "#E4EEF6" },
];

const TILES: { image?: string; icon?: LucideIcon; label: string; href: string }[] = [
  { image: ill("directorio-empresas"), label: "Empresas", href: "/companies" },
  { icon: UtensilsCrossed, label: "Comida", href: "/food" },
  { icon: Briefcase, label: "Servicios", href: "/services" },
  { icon: UserRound, label: "Profesionales", href: "/professionals" },
  { icon: HeartPulse, label: "Salud", href: "/health" },
  { image: ill("guia-tramites"), label: "Trámites", href: "/procedures" },
  { image: ill("anuncios-ofertas"), label: "Ofertas y anuncios", href: "/announcements" },
  { image: ill("bolsa-trabajo"), label: "Empleo", href: "/jobs" },
  { image: ill("eventos"), label: "Eventos", href: "/events" },
  { image: ill("lugares-turisticos"), label: "Turismo", href: "/places" },
  { image: ill("itinerarios-viaje"), label: "Itinerarios", href: "/itineraries" },
  { image: ill("alta-empresa"), label: "Publicar empresa", href: "/list-your-company" },
];

function NewTag() {
  return <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-black">Nuevo</span>;
}

function Rail({ title, subtitle, isNew, href, children }: { title: string; subtitle?: string; isNew?: boolean; href: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <div className="flex items-end justify-between gap-3 px-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold normal-case text-foreground">{title}</h2>
            {isNew ? <NewTag /> : null}
          </div>
          {subtitle ? <p className="mt-0.5 text-xs text-foreground/60">{subtitle}</p> : null}
        </div>
        <Link href={href} className="flex shrink-0 items-center gap-1 pb-0.5 text-sm font-semibold text-foreground underline">
          Ver todo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
    </section>
  );
}

// Seeded filler photos say nothing about the place; show "no photo" instead.
const isPlaceholderImage = (url: string) => ["picsum.photos", "placehold.co"].some((host) => url.includes(`//${host}/`));

function MiniCard({ image, title, subtitle, extra, href }: { image?: string; title: string; subtitle?: string; extra?: string; href: string }) {
  const real = image && !isPlaceholderImage(image) ? image : undefined;
  return (
    <Link href={href} className="w-44 shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-card transition-transform active:scale-[0.97]">
      <div className="relative flex h-28 w-full items-center justify-center bg-white">
        {real ? <img src={real} alt={title} loading="lazy" className="h-full w-full object-cover" /> : <ImageOff className="h-6 w-6 text-[#C4C4C4]" />}
      </div>
      <div className="space-y-0.5 p-3">
        <p className="truncate text-sm font-semibold text-secondary underline">{title}</p>
        {subtitle ? <p className="truncate text-xs text-foreground/70">{subtitle}</p> : null}
        {extra ? <p className="mt-0.5 text-sm font-semibold text-foreground">{extra}</p> : null}
      </div>
    </Link>
  );
}

export function MobileHome({ shopProducts, rentals, menuDelDia, pharmacies }: {
  shopProducts: ProductListItem[];
  rentals: RentalListItem[];
  menuDelDia: MenuItem[];
  pharmacies: HealthFacility[];
}) {
  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden pb-10 md:hidden">
      {/* Hero: title, one line, search bar */}
      <div className="bg-primary px-4 pb-6 pt-5 animate-in fade-in duration-300">
        <p className="text-[28px] font-semibold leading-8 tracking-tight text-black">
          Todo lo que buscas está <em className="italic">aquí</em>
        </p>
        <p className="mt-1.5 text-sm text-black/70">Empresas, trámites, tienda y alquileres de Guinea Ecuatorial.</p>
        <Link
          href="/search"
          className="mt-4 flex h-[50px] items-center gap-2.5 rounded-full bg-white px-4 shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-transform active:scale-[0.98]"
        >
          <Search className="h-[19px] w-[19px] text-[#555]" />
          <span className="flex-1 truncate text-[15px] text-black/50">Busca empresas, trámites, productos…</span>
        </Link>
      </div>

      {/* Popular searches: one swipeable row */}
      <div className="flex gap-2 overflow-x-auto px-4 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {POPULAR.map((q) => (
          <Link
            key={q}
            href={`/search?q=${encodeURIComponent(q)}`}
            className="shrink-0 rounded-full border border-border bg-card px-3.5 py-2 text-[13px] font-medium text-foreground active:bg-muted"
          >
            {q}
          </Link>
        ))}
      </div>

      {/* Tienda and Alquiler as two big tiles */}
      <div className="flex gap-3 px-4 pt-5">
        {FEATURED.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="relative h-[156px] flex-1 overflow-hidden rounded-xl transition-transform active:scale-[0.96]"
            style={{ backgroundColor: f.bg }}
          >
            <div className="p-3.5">
              <NewTag />
              <p className="mt-2 text-lg font-semibold leading-5 text-black">{f.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-black/65">{f.text}</p>
            </div>
            <Image src={f.image} alt="" width={104} height={76} className="absolute -bottom-1 -right-1.5 h-[76px] w-[104px] object-contain" />
          </Link>
        ))}
      </div>

      {/* The rest of Oltinde: a grid of app tiles */}
      <h2 className="mt-7 px-4 text-lg font-semibold normal-case text-foreground">Explora Oltinde</h2>
      <div className="grid grid-cols-4 gap-3 px-4 pt-3">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="flex flex-col items-center transition-transform active:scale-[0.92]">
            <span className="flex aspect-square w-full items-center justify-center rounded-2xl bg-[#F3F3F3]">
              {t.image ? (
                <Image src={t.image} alt="" width={80} height={80} className="h-[82%] w-[82%] object-contain" />
              ) : t.icon ? (
                <span className="flex h-[56%] w-[56%] items-center justify-center rounded-full bg-primary">
                  <t.icon className="h-1/2 w-1/2 text-black" strokeWidth={1.8} />
                </span>
              ) : null}
            </span>
            <span className="mt-1.5 line-clamp-2 text-center text-[12px] font-semibold leading-4 text-foreground">{t.label}</span>
          </Link>
        ))}
      </div>

      {shopProducts.length > 0 ? (
        <Rail title="Tienda Oltinde" isNew subtitle="Productos locales en XAF, con pago al recibir." href="/tienda">
          {shopProducts.map((p) => <ProductCard key={p.id} product={p} className="w-40 shrink-0 snap-start" />)}
        </Rail>
      ) : null}

      {rentals.length > 0 ? (
        <Rail title="Alquiler" isNew subtitle="Casas, pisos y coches por días o meses." href="/alquiler">
          {rentals.map((l) => <RentalCard key={l.id} item={l} className="w-60 shrink-0 snap-start" />)}
        </Rail>
      ) : null}

      {menuDelDia.length > 0 ? (
        <Rail title="Menús del día" href="/food">
          {menuDelDia.map((item) => (
            <MiniCard
              key={item.id}
              image={item.image}
              title={item.name}
              subtitle={item.companyName}
              extra={`${item.price.toLocaleString("es-ES")} XAF`}
              href={`/companies/${item.companyId}#menu`}
            />
          ))}
        </Rail>
      ) : null}

      {pharmacies.length > 0 ? (
        <Rail title="Farmacias de guardia" href="/health/pharmacies">
          {pharmacies.map((p) => (
            <MiniCard key={p.id} image={p.image} title={p.name} subtitle="De guardia hoy" href={`/health/pharmacies/${p.id}`} />
          ))}
        </Rail>
      ) : null}

      {/* "¿Tienes una empresa?" — the black panel */}
      <div className="mx-4 mt-8 rounded-lg bg-[#111111] p-6">
        <h2 className="text-2xl font-semibold normal-case leading-7 text-white">¿Tienes una empresa en Guinea Ecuatorial?</h2>
        <p className="mt-2 text-sm leading-5 text-white/70">Publícala gratis, empieza a recibir clientes y vende tus productos en la Tienda.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/list-your-company" className="flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-black">
            Publicar mi empresa
          </Link>
          <Link href="/dashboard" className="flex h-11 items-center rounded-md border border-white/40 px-4 text-sm font-semibold text-white">
            Mi negocio
          </Link>
        </div>
      </div>
    </div>
  );
}


"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Star, LogOut, User, LayoutDashboard, Shield, FileText, Megaphone, TicketPercent, Newspaper, Briefcase, Landmark, UserPlus, Building, Bot, CalendarDays, Info, BookOpen, Wrench, Route, UserCheck, HeartPulse, UtensilsCrossed, HardHat } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { GlobalHeaderSearch } from "../shared/GlobalHeaderSearch";
import { CitySelector } from "./CitySelector";
import { NotificationBell } from "./NotificationBell";
import { ModeToggle } from "../mode-toggle";

// The site's browsable directory sections — one flat "Directorio" menu, Yelp's
// "More" dropdown style, so the header stays a few links wide no matter how
// many features (tenders, etc.) ship later.
const COLLECTION_LINKS = [
    {href: "/companies", label: "Empresas"},
    {href: "/institutions", label: "Instituciones"},
    {href: "/procedures", label: "Trámites"},
    {href: "/services", label: "Servicios"},
    {href: "/health", label: "Salud"},
    {href: "/food", label: "Comida"},
    {href: "/professionals", label: "Profesionales"},
    {href: "/jobs", label: "Empleos"},
    {href: "/events", label: "Eventos"},
    {href: "/itineraries", label: "Itinerarios"},
    {href: "/offers", label: "Ofertas"},
    {href: "/announcements", label: "Anuncios"},
    {href: "/contribuciones", label: "Contribuciones"},
];

// Informational / company-facing links, matching the mockup's top nav.
const INFO_LINKS = [
    {href: "/about", label: "Nosotros"},
    {href: "/para-ti", label: "Para Ti"},
    {href: "/para-empresas", label: "Para Empresas"},
    {href: "/guia-de-usuario", label: "Guía"},
];

// Grouped for the mobile sheet, Yelp-app style: a quick action up top, then
// labeled sections instead of one long undifferentiated list.
function buildMobileNavGroups(isAdmin: boolean): { title: string | null; links: { href: string; label: string }[] }[] {
  return [
    { title: null, links: [{ href: "/search", label: "Buscador Inteligente" }] },
    { title: "Directorio", links: COLLECTION_LINKS },
    { title: "Cuenta", links: [
      { href: "/advisor", label: "Asesor IA" },
      { href: "/favorites", label: "Favoritos" },
      { href: "/dashboard/orders", label: "Mis Pedidos" },
      ...(isAdmin ? [{ href: "/admin/dashboard", label: "Admin" }] : []),
    ] },
    { title: "Nosotros", links: INFO_LINKS },
  ];
}

function NavIcon({ label, className = "w-5 h-5" }: { label: string; className?: string }) {
  switch (label) {
    case 'Empresas': return <Building className={className} />;
    case 'Buscador Inteligente': return <Bot className={className} />;
    case 'Instituciones': return <Landmark className={className} />;
    case 'Trámites': return <FileText className={className} />;
    case 'Servicios': return <Wrench className={className} />;
    case 'Salud': return <HeartPulse className={className} />;
    case 'Comida': return <UtensilsCrossed className={className} />;
    case 'Profesionales': return <HardHat className={className} />;
    case 'Empleos': return <Briefcase className={className} />;
    case 'Eventos': return <CalendarDays className={className} />;
    case 'Itinerarios': return <Route className={className} />;
    case 'Anuncios': return <Megaphone className={className} />;
    case 'Ofertas': return <TicketPercent className={className} />;
    case 'Contribuciones': return <Newspaper className={className} />;
    case 'Asesor IA': return <Bot className={className} />;
    case 'Favoritos': return <Star className={className} />;
    case 'Mis Pedidos': return <UtensilsCrossed className={className} />;
    case 'Nosotros': return <Info className={className} />;
    case 'Para Ti': return <UserCheck className={className} />;
    case 'Para Empresas': return <UserPlus className={className} />;
    case 'Guía': return <BookOpen className={className} />;
    case 'Admin': return <Shield className={className} />;
    default: return null;
  }
}

function NavRow({ links, className }: { links: { href: string; label: string }[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex items-center gap-5 overflow-x-auto", className)}>
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "font-medium whitespace-nowrap transition-colors hover:text-black",
            pathname.startsWith(link.href) ? "text-black" : "text-on-surface-variant"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

// "Directorio" flyout — same slide-out Sheet the mobile menu uses for the
// collections list, triggered by a hamburger icon after the user avatar.
function DirectorioMenu() {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Directorio</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 flex flex-col bg-background">
        <div className="p-4 border-b border-outline-variant">
          <SheetTitle className="font-semibold">Directorio</SheetTitle>
        </div>
        <nav className="grid content-start gap-0.5 p-4 flex-1 overflow-y-auto">
          {COLLECTION_LINKS.map(link => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-4 rounded-md py-2 px-3 text-base text-on-surface-variant hover:bg-accent hover:text-accent-foreground",
                  pathname === link.href && "bg-accent text-accent-foreground"
                )}
              >
                <NavIcon label={link.label} />
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="p-4 pt-3 border-t border-outline-variant space-y-0.5">
          {INFO_LINKS.map(link => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-4 rounded-md py-2 px-3 text-sm text-on-surface-variant hover:bg-accent hover:text-accent-foreground",
                  pathname === link.href && "bg-accent text-accent-foreground"
                )}
              >
                <NavIcon label={link.label} />
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center shrink-0">
        <Image
          src="/oltinde-logo.png"
          alt="Oltinde"
          width={2107}
          height={512}
          priority
          className="h-8 md:h-10 w-auto object-contain"
        />
    </Link>
  );
}


function UserNav() {
    const { user, isAdmin, signout } = useAuth();

    if (!user) {
        return (
             <div className="flex items-center gap-4 text-sm">
                <Button asChild variant="ghost" className="hidden sm:inline-flex font-semibold hover:text-black">
                    <Link href="/signin">Iniciar Sesión</Link>
                </Button>
                <Button asChild variant="secondary">
                    <Link href="/signup">Registrarse</Link>
                </Button>
            </div>
        )
    }

    const userInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-5 h-5" />;

    return (
      <div className="flex items-center gap-2">
        { user && <NotificationBell /> }
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center"><User className="w-4 h-4 mr-2"/>Mi Perfil</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center"><LayoutDashboard className="w-4 h-4 mr-2"/>Panel de Control</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/favorites" className="flex items-center"><Star className="w-4 h-4 mr-2"/>Mis Favoritos</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/dashboard/professional" className="flex items-center"><HardHat className="w-4 h-4 mr-2"/>Perfil de Profesional</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/dashboard/orders" className="flex items-center"><UtensilsCrossed className="w-4 h-4 mr-2"/>Mis Pedidos</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="flex items-center"><Shield className="w-4 h-4 mr-2"/>Panel de Admin</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signout}>
                    <LogOut className="w-4 h-4 mr-2"/>
                    Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
}

export default function Header() {
  const pathname = usePathname();
  const { user, isAdmin, signout } = useAuth();

  // Hide search in header on homepage, since it's in the hero
  const isHomePage = pathname === '/';


  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant bg-background">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8 gap-6">
        <div className="flex items-center gap-6 shrink-0">
          <Logo />
          <nav className="hidden lg:flex items-center gap-5 text-sm">
            <NavRow links={INFO_LINKS} className="text-sm" />
          </nav>
        </div>

        {!isHomePage && (
            <div className="flex-1 hidden md:flex justify-center">
                <div className="w-full max-w-lg">
                    <GlobalHeaderSearch variant="header" />
                </div>
            </div>
        )}
        {isHomePage && <div className="flex-1" />}

        <div className="hidden md:flex items-center gap-3 justify-end shrink-0">
            <ModeToggle />
            <CitySelector />
           <UserNav />
           <DirectorioMenu />
        </div>

        <div className="flex items-center justify-end ml-auto md:hidden gap-2">
          {user && <NotificationBell />}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 flex flex-col bg-background">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              {user ? (
                <div className="p-4 border-b border-outline-variant bg-muted/50 space-y-3">
                    <SheetClose asChild>
                        <Link href="/profile" className="block">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                  <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="font-semibold">{user.displayName}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                        </Link>
                    </SheetClose>
                    <div className="grid grid-cols-2 gap-2">
                       <SheetClose asChild>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/profile"><User className="w-4 h-4 mr-2"/>Mi Perfil</Link>
                        </Button>
                       </SheetClose>
                        <SheetClose asChild>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2"/>Panel</Link>
                        </Button>
                       </SheetClose>
                    </div>
                </div>
              ) : (
                <div className="p-4 border-b border-outline-variant">
                   <div className="grid grid-cols-2 gap-2">
                    <SheetClose asChild>
                      <Button asChild variant="secondary" className="w-full">
                          <Link href="/signup">Registrarse</Link>
                      </Button>
                    </SheetClose>
                     <SheetClose asChild>
                      <Button asChild className="w-full" variant="outline">
                          <Link href="/signin">Iniciar Sesión</Link>
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                <span className="text-sm font-medium text-muted-foreground">Ciudad</span>
                <CitySelector />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                <span className="text-sm font-medium text-muted-foreground">Tema</span>
                <ModeToggle />
              </div>
              <nav className="grid content-start gap-0.5 p-4 flex-1 overflow-y-auto">
                  {buildMobileNavGroups(isAdmin).map((group, i) => (
                    <div key={group.title ?? `group-${i}`} className={cn(i > 0 && "mt-2 pt-2 border-t border-outline-variant")}>
                      {group.title && (
                        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</p>
                      )}
                      <div className="grid gap-0.5">
                        {group.links.map((link) => (
                          <SheetClose asChild key={link.href}>
                            <Link
                              href={link.href}
                              className={cn(
                                "flex items-center gap-4 rounded-md py-2 px-3 text-base text-on-surface-variant hover:bg-accent hover:text-accent-foreground",
                                pathname === link.href && "bg-accent text-accent-foreground"
                              )}
                            >
                              <NavIcon label={link.label} />
                              {link.label}
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  ))}
              </nav>
                {user && (
                     <div className="p-4 border-t border-outline-variant">
                         <SheetClose asChild>
                            <button onClick={signout} className={cn(
                              "w-full text-sm",
                              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                              "border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                          )}>
                             <LogOut className="w-4 h-4 mr-2"/>Cerrar Sesión
                          </button>
                        </SheetClose>
                    </div>
                )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

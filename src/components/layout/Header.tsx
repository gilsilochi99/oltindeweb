
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Star, LogOut, User, LayoutDashboard, Shield, FileText, Megaphone, TicketPercent, Bell, Newspaper, Briefcase, Landmark, Search, UserPlus, Building, Bot, Sparkles, CalendarDays, Info, BookOpen, Wrench } from "lucide-react";
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

// The site's browsable directory sections — one flat "Colecciones" menu, Yelp's
// "More" dropdown style, so the header stays two menus wide no matter how many
// features (tenders, etc.) ship later.
const COLLECTION_LINKS = [
    {href: "/companies", label: "Empresas"},
    {href: "/institutions", label: "Instituciones"},
    {href: "/procedures", label: "Trámites"},
    {href: "/services", label: "Servicios"},
    {href: "/jobs", label: "Empleos"},
    {href: "/events", label: "Eventos"},
    {href: "/offers", label: "Ofertas"},
    {href: "/announcements", label: "Anuncios"},
    {href: "/contribuciones", label: "Contribuciones"},
];

// Informational / company-facing links — Yelp keeps these out of its category
// nav entirely, in a separate "For Businesses" style menu.
const INFO_LINKS = [
    {href: "/about", label: "Nosotros"},
    {href: "/para-empresas", label: "Para Empresas"},
    {href: "/guia-de-usuario", label: "Guía"},
];

const mainNavLinks = COLLECTION_LINKS;

// Grouped for the mobile sheet, Yelp-app style: a quick action up top, then
// labeled sections instead of one long undifferentiated list.
const mobileNavGroups: { title: string | null; links: { href: string; label: string }[] }[] = [
  { title: null, links: [{ href: "/search", label: "Buscador Inteligente" }] },
  { title: "Colecciones", links: COLLECTION_LINKS },
  { title: "Cuenta", links: [
    { href: "/advisor", label: "Asesor IA" },
    { href: "/favorites", label: "Favoritos" },
  ] },
  { title: "Nosotros", links: INFO_LINKS },
];

function NavIcon({ label, className = "w-5 h-5" }: { label: string; className?: string }) {
  switch (label) {
    case 'Empresas': return <Building className={className} />;
    case 'Buscador Inteligente': return <Sparkles className={className} />;
    case 'Instituciones': return <Landmark className={className} />;
    case 'Trámites': return <FileText className={className} />;
    case 'Servicios': return <Wrench className={className} />;
    case 'Empleos': return <Briefcase className={className} />;
    case 'Eventos': return <CalendarDays className={className} />;
    case 'Anuncios': return <Megaphone className={className} />;
    case 'Ofertas': return <TicketPercent className={className} />;
    case 'Contribuciones': return <Newspaper className={className} />;
    case 'Asesor IA': return <Bot className={className} />;
    case 'Favoritos': return <Star className={className} />;
    case 'Nosotros': return <Info className={className} />;
    case 'Para Empresas': return <UserPlus className={className} />;
    case 'Guía': return <BookOpen className={className} />;
    default: return null;
  }
}

function NavRow({ links, className, showIcons }: { links: { href: string; label: string }[]; className?: string; showIcons?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex items-center gap-6 overflow-x-auto", className)}>
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-1.5 font-medium whitespace-nowrap transition-colors hover:text-primary",
            pathname.startsWith(link.href) ? "text-primary" : "text-muted-foreground"
          )}
        >
          {showIcons && <NavIcon label={link.label} className="w-4 h-4" />}
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

// Desktop-only expandable panel for the collections, shown on non-home pages
// where the hero's own circular icon row isn't present. Same slide-out Sheet
// pattern as the mobile menu, just triggered from the right of the header.
function CollectionsMenu() {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Colecciones</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 flex flex-col bg-background">
        <div className="p-4 border-b">
          <SheetTitle className="font-semibold">Colecciones</SheetTitle>
        </div>
        <nav className="grid gap-1 p-4 flex-1 overflow-y-auto">
          {COLLECTION_LINKS.map(link => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-4 rounded-md p-3 text-base text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  pathname === link.href && "bg-accent text-accent-foreground"
                )}
              >
                <NavIcon label={link.label} />
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group shrink-0">
        <span className="font-extrabold text-2xl tracking-tighter text-primary">oltinde</span>
    </Link>
  );
}


function UserNav() {
    const { user, isAdmin, signout } = useAuth();

    if (!user) {
        return (
             <div className="flex items-center gap-2">
                <Button asChild variant="ghost">
                    <Link href="/signin">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
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
  const { user, signout } = useAuth();
  
  // Hide search in header on homepage, since it's in the hero
  const isHomePage = pathname === '/';


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-8 gap-4">
        <Logo />
        {isHomePage && (
            <NavRow links={INFO_LINKS} className="hidden lg:flex ml-6 text-sm text-muted-foreground gap-4 shrink-0" />
        )}

        {!isHomePage && (
            <div className="flex-1 hidden md:flex justify-center">
                <div className="w-full max-w-lg">
                    <GlobalHeaderSearch />
                </div>
            </div>
        )}
        {isHomePage && <div className="flex-1" />}

        <div className="hidden md:flex items-center gap-2 justify-end shrink-0">
            <CitySelector />
           <UserNav />
           {!isHomePage && <CollectionsMenu />}
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
                <div className="p-4 border-b bg-muted/50 space-y-3">
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
                <div className="p-4 border-b">
                   <div className="grid grid-cols-2 gap-2">
                    <SheetClose asChild>
                      <Button asChild className="w-full">
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
              <nav className="grid gap-1 p-4 flex-1 overflow-y-auto">
                  {mobileNavGroups.map((group, i) => (
                    <div key={group.title ?? `group-${i}`} className={cn(i > 0 && "mt-4 pt-4 border-t")}>
                      {group.title && (
                        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</p>
                      )}
                      <div className="grid gap-1">
                        {group.links.map((link) => (
                          <SheetClose asChild key={link.href}>
                            <Link
                              href={link.href}
                              className={cn(
                                "flex items-center gap-4 rounded-md p-3 text-base text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
                     <div className="p-4 border-t">
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

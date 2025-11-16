
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu, Star, LogOut, User, LayoutDashboard, Shield, FileText, Megaphone, TicketPercent, Bell, Newspaper, Briefcase, Landmark, Search, UserPlus, Building, Bot } from "lucide-react";
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
import { ModeToggle } from "../mode-toggle";
import { CitySelector } from "./CitySelector";
import { NotificationBell } from "./NotificationBell";

const mainNavLinks = [
    {href: "/companies", label: "Empresas"},
    {href: "/institutions", label: "Instituciones"},
    {href: "/procedures", label: "Trámites"},
    {href: "/announcements", label: "Anuncios"},
    {href: "/offers", label: "Ofertas"},
    {href: "/contribuciones", label: "Contribuciones"},
]

const mobileNavLinks = [
  ...mainNavLinks,
  { href: "/advisor", label: "Asesor IA" },
  { href: "/search", label: "Buscar" },
  { href: "/favorites", label: "Favoritos" },
  { href: "/list-your-company", label: "Listar su Empresa" },
];

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

        <div className="flex-1 flex justify-center items-center">
            {!isHomePage ? (
                <div className="w-full max-w-lg hidden md:block">
                    <GlobalHeaderSearch />
                </div>
            ) : (
                <nav className="hidden md:flex items-center justify-center gap-6 text-sm">
                    {mainNavLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                        "font-medium text-muted-foreground transition-colors hover:text-primary",
                        pathname.startsWith(link.href) && "text-primary"
                        )}
                    >
                        {link.label}
                    </Link>
                    ))}
                </nav>
            )}
        </div>
        
        <div className="hidden md:flex items-center gap-2 justify-end">
            <CitySelector />
            <ModeToggle />
            {user && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/advisor" aria-label="Asesor de Negocios IA">
                  <Bot className="w-5 h-5"/>
                </Link>
              </Button>
            )}
           <UserNav />
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
              <nav className="grid gap-2 p-4 flex-1">
                  {mobileNavLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-4 rounded-md p-3 text-base text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          pathname === link.href && "bg-accent text-accent-foreground"
                        )}
                      >
                        {
                            link.label === 'Empresas' ? <Building className="w-5 h-5"/> :
                            link.label === 'Buscar' ? <Search className="w-5 h-5"/> :
                            link.label === 'Instituciones' ? <Landmark className="w-5 h-5"/> :
                            link.label === 'Trámites' ? <FileText className="w-5 h-5"/> :
                            link.label === 'Anuncios' ? <Megaphone className="w-5 h-5"/> :
                            link.label === 'Ofertas' ? <TicketPercent className="w-5 h-5"/> :
                            link.label === 'Contribuciones' ? <Newspaper className="w-5 h-5"/> :
                            link.label === 'Asesor IA' ? <Bot className="w-5 h-5"/> :
                            link.label === 'Favoritos' ? <Star className="w-5 h-5"/> :
                            link.label === 'Listar su Empresa' ? <UserPlus className="w-5 h-5"/> : null
                        }
                        {link.label}
                      </Link>
                    </SheetClose>
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

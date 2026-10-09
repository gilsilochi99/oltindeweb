'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, Settings, Building, Briefcase, BriefcaseBusiness, Landmark, FileText, List, Users, Shield, ShieldCheck, BadgeCheck, Newspaper, MapPin, Database, CalendarDays, Compass, Route, HeartPulse, UtensilsCrossed, GraduationCap, Menu, ShoppingBag, Receipt, Package, Star, Search, KeyRound, PanelLeftClose, PanelLeftOpen, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";

type Role = 'admin' | 'manager' | 'editor' | 'pharmacist';
type NavLink = { href: string; label: string; icon: typeof Home; roles: Role[] };

// Grouped so each section is found by its name, not guessed from an icon.
const NAV_GROUPS: { title: string; links: NavLink[] }[] = [
    { title: 'General', links: [
        { href: '/admin/dashboard', label: 'Panel', icon: Home, roles: ['admin', 'manager'] },
    ] },
    { title: 'Directorio', links: [
        { href: '/admin/companies', label: 'Empresas', icon: Building, roles: ['admin', 'manager'] },
        { href: '/admin/institutions', label: 'Instituciones', icon: Landmark, roles: ['admin', 'manager', 'editor'] },
        { href: '/admin/procedures', label: 'Trámites', icon: FileText, roles: ['admin', 'manager', 'editor'] },
        { href: '/admin/services', label: 'Servicios', icon: Briefcase, roles: ['admin', 'manager'] },
        { href: '/admin/professionals', label: 'Profesionales', icon: GraduationCap, roles: ['admin', 'manager'] },
        { href: '/admin/health', label: 'Salud', icon: HeartPulse, roles: ['admin', 'manager', 'pharmacist'] },
        { href: '/admin/categories', label: 'Categorías', icon: List, roles: ['admin', 'manager'] },
        { href: '/admin/locations', label: 'Ubicaciones', icon: MapPin, roles: ['admin', 'manager'] },
    ] },
    { title: 'Comercio', links: [
        { href: '/admin/shop/orders', label: 'Tienda: Pedidos', icon: Receipt, roles: ['admin', 'manager'] },
        { href: '/admin/shop/products', label: 'Tienda: Productos', icon: Package, roles: ['admin', 'manager'] },
        { href: '/admin/shop/categories', label: 'Tienda: Categorías', icon: ShoppingBag, roles: ['admin', 'manager'] },
        { href: '/admin/rentals', label: 'Alquileres', icon: KeyRound, roles: ['admin', 'manager'] },
        { href: '/admin/food-orders', label: 'Pedidos de comida', icon: UtensilsCrossed, roles: ['admin', 'manager'] },
        { href: '/admin/premium', label: 'Funciones Premium', icon: Star, roles: ['admin'] },
    ] },
    { title: 'Contenido', links: [
        { href: '/admin/jobs', label: 'Empleos', icon: BriefcaseBusiness, roles: ['admin', 'manager'] },
        { href: '/admin/events', label: 'Eventos', icon: CalendarDays, roles: ['admin', 'manager'] },
        { href: '/admin/places', label: 'Lugares turísticos', icon: Compass, roles: ['admin', 'manager'] },
        { href: '/admin/itineraries', label: 'Itinerarios', icon: Route, roles: ['admin', 'manager'] },
        { href: '/admin/contribuciones', label: 'Contribuciones', icon: Newspaper, roles: ['admin', 'manager'] },
    ] },
    { title: 'Usuarios', links: [
        { href: '/admin/users', label: 'Usuarios', icon: Users, roles: ['admin'] },
        { href: '/admin/claims', label: 'Reclamaciones', icon: ShieldCheck, roles: ['admin', 'manager'] },
        { href: '/admin/verifications', label: 'Verificaciones', icon: BadgeCheck, roles: ['admin', 'manager'] },
    ] },
    { title: 'Sistema', links: [
        { href: '/admin/settings', label: 'Ajustes del sitio', icon: Settings, roles: ['admin'] },
        { href: '/admin/migration', label: 'Migración', icon: Database, roles: ['admin'] },
    ] },
];

function useNavGroups(filter: string) {
    const { isAdmin, isManager, isEditor, isPharmacist } = useAuth();
    const role: Role | null = isAdmin ? 'admin' : isManager ? 'manager' : isEditor ? 'editor' : isPharmacist ? 'pharmacist' : null;
    const q = filter.trim().toLowerCase();
    return NAV_GROUPS
        .map(g => ({ ...g, links: g.links.filter(l => role && l.roles.includes(role) && (!q || l.label.toLowerCase().includes(q) || g.title.toLowerCase().includes(q))) }))
        .filter(g => g.links.length > 0);
}

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/');

function NavItem({ link, collapsed }: { link: NavLink; collapsed?: boolean }) {
    const pathname = usePathname();
    const active = link.href !== '/' && isActive(pathname, link.href);
    const item = (
        <Link
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'flex items-center gap-3 rounded-md text-sm transition-colors',
                collapsed ? 'h-9 w-9 justify-center' : 'px-3 py-2',
                active ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
        >
            <link.icon className="h-4 w-4 shrink-0" />
            {collapsed ? <span className="sr-only">{link.label}</span> : <span className="truncate">{link.label}</span>}
        </Link>
    );
    if (!collapsed) return item;
    return (
        <Tooltip>
            <TooltipTrigger asChild>{item}</TooltipTrigger>
            <TooltipContent side="right">{link.label}</TooltipContent>
        </Tooltip>
    );
}

// Desktop: labeled, grouped sidebar with a section search. It can be
// collapsed to icons (remembered per browser).
function AdminSidebar() {
    const [filter, setFilter] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const groups = useNavGroups(collapsed ? '' : filter);

    useEffect(() => {
        try { setCollapsed(localStorage.getItem('admin-nav-collapsed') === '1'); } catch {}
    }, []);
    const toggle = () => setCollapsed(c => {
        try { localStorage.setItem('admin-nav-collapsed', c ? '0' : '1'); } catch {}
        return !c;
    });

    return (
        <aside className={cn('hidden sm:flex flex-col border-r bg-background sticky top-16 h-[calc(100vh-4rem)] shrink-0', collapsed ? 'w-16' : 'w-60')}>
            <TooltipProvider delayDuration={100}>
                <div className={cn('flex items-center gap-2 border-b', collapsed ? 'justify-center py-3' : 'px-3 py-3')}>
                    {!collapsed && <p className="flex-1 text-sm font-bold">Administración</p>}
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={toggle} aria-label={collapsed ? 'Mostrar nombres' : 'Ocultar nombres'} title={collapsed ? 'Mostrar nombres' : 'Ocultar nombres'}>
                        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>
                {!collapsed && (
                    <div className="px-3 pt-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar sección..." className="h-9 pl-8" />
                        </div>
                    </div>
                )}
                <nav aria-label="Administración" className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                    {groups.map(g => (
                        <div key={g.title}>
                            {collapsed
                                ? <div className="mx-auto mb-2 h-px w-6 bg-border" />
                                : <p className="px-3 mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{g.title}</p>}
                            <div className={cn('flex flex-col gap-0.5', collapsed && 'items-center')}>
                                {g.links.map(link => <NavItem key={link.href} link={link} collapsed={collapsed} />)}
                            </div>
                        </div>
                    ))}
                    {groups.length === 0 && <p className="px-3 text-sm text-muted-foreground">Ninguna sección coincide.</p>}
                </nav>
                <div className={cn('border-t py-3', collapsed ? 'flex justify-center' : 'px-3')}>
                    <NavItem link={{ href: '/', label: 'Volver al sitio', icon: ArrowLeft, roles: [] }} collapsed={collapsed} />
                </div>
            </TooltipProvider>
        </aside>
    );
}

// Phones: the same groups in a slide-out sheet; the bar shows the current section.
function AdminMobileNav() {
    const pathname = usePathname();
    const [filter, setFilter] = useState('');
    const groups = useNavGroups(filter);
    const current = NAV_GROUPS.flatMap(g => g.links).find(l => isActive(pathname, l.href));

    return (
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4 sm:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Abrir menú de administración</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 flex flex-col bg-background w-72">
                    <SheetTitle className="px-4 pt-4 text-left">Administración</SheetTitle>
                    <div className="px-4 pt-3">
                        <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar sección..." className="h-9" />
                    </div>
                    <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                        {groups.map(g => (
                            <div key={g.title}>
                                <p className="px-3 mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{g.title}</p>
                                <div className="flex flex-col gap-0.5">
                                    {g.links.map(link => (
                                        <SheetClose asChild key={link.href}><div><NavItem link={link} /></div></SheetClose>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
            <span className="font-semibold text-sm truncate">{current ? current.label : 'Administración'}</span>
        </header>
    );
}

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-center">
            <Shield className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold">Acceso Denegado</h1>
            <p className="text-muted-foreground mt-2">No tiene permiso para ver esta página.</p>
            <Button asChild className="mt-6">
                <Link href="/">Volver a Inicio</Link>
            </Button>
        </div>
    )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isAdmin, isManager, isEditor, isPharmacist } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return null;
  }

  const canAccessAdmin = isAdmin || isManager || isEditor || isPharmacist;

  if (!canAccessAdmin) {
      return <AccessDenied />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col sm:flex-row">
        <AdminSidebar />
        <div className="flex flex-1 flex-col min-w-0">
            <AdminMobileNav />
            <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
        </div>
    </div>
  )
}

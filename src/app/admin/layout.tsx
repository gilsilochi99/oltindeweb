

'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, Settings, Building, Briefcase, Landmark, FileText, List, Users, Shield, Book, ShieldCheck, Newspaper, MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const allNavLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'manager'] },
    { href: '/admin/companies', label: 'Empresas', icon: Building, roles: ['admin', 'manager'] },
    { href: '/admin/institutions', label: 'Instituciones', icon: Landmark, roles: ['admin', 'manager', 'editor'] },
    { href: '/admin/procedures', label: 'Trámites', icon: FileText, roles: ['admin', 'manager', 'editor'] },
    { href: '/admin/services', label: 'Servicios', icon: Briefcase, roles: ['admin', 'manager'] },
    { href: '/admin/categories', label: 'Categorías', icon: List, roles: ['admin', 'manager'] },
    { href: '/admin/locations', label: 'Ubicaciones', icon: MapPin, roles: ['admin', 'manager'] },
    { href: '/admin/contribuciones', label: 'Contribuciones', icon: Newspaper, roles: ['admin', 'manager'] },
    { href: '/admin/users', label: 'Usuarios', icon: Users, roles: ['admin'] },
    { href: '/admin/claims', label: 'Reclamaciones', icon: ShieldCheck, roles: ['admin', 'manager'] },
]


function AdminSidebar() {
    const pathname = usePathname();
    const { isAdmin, isManager, isEditor } = useAuth();
    
    const userRole = isAdmin ? 'admin' : isManager ? 'manager' : isEditor ? 'editor' : 'user';
    
    const navLinks = allNavLinks.filter(link => link.roles.includes(userRole));

    return (
        <aside className="hidden w-16 flex-col border-r bg-background sm:flex">
             <TooltipProvider>
                <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/"
                                className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                                >
                                <Book className="h-4 w-4 transition-all group-hover:scale-110" />
                                <span className="sr-only">Oltinde</span>
                            </Link>
                        </TooltipTrigger>
                         <TooltipContent side="right">Oltinde</TooltipContent>
                    </Tooltip>
                    {navLinks.map(link => (
                        <Tooltip key={link.href}>
                            <TooltipTrigger asChild>
                                <Link
                                href={link.href}
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                    pathname.startsWith(link.href) && "bg-accent text-accent-foreground"
                                )}
                                >
                                <link.icon className="h-5 w-5" />
                                <span className="sr-only">{link.label}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{link.label}</TooltipContent>
                        </Tooltip>
                    ))}
                </nav>
                 <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Link
                            href="/admin/settings"
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                pathname.startsWith('/admin/settings') && "bg-accent text-accent-foreground"
                            )}
                        >
                            <Settings className="h-5 w-5" />
                            <span className="sr-only">Settings</span>
                        </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">Settings</TooltipContent>
                    </Tooltip>
                </nav>
            </TooltipProvider>
        </aside>
    )
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
  const { user, loading, isAdmin, isManager, isEditor } = useAuth();
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
    return null; // or a redirect component
  }
  
  const canAccessAdmin = isAdmin || isManager || isEditor;

  if (!canAccessAdmin) {
      return <AccessDenied />;
  }

  return (
    <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
    </div>
  )
}

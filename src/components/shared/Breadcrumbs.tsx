
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';
import type { Breadcrumb } from '@/lib/types';
import { cn } from '@/lib/utils';

// Function to capitalize the first letter of a string
const capitalize = (s: string) => {
    if (typeof s !== 'string' || s.length === 0) return '';
    const formatted = s.replace(/-/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const translations: { [key: string]: string } = {
  'companies': 'Empresas',
  'institutions': 'Instituciones',
  'procedures': 'Trámites',
  'announcements': 'Anuncios',
  'offers': 'Ofertas',
  'contribuciones': 'Contribuciones',
  'admin': 'Admin',
  'dashboard': 'Panel de Control',
  'edit': 'Editar',
  'users': 'Usuarios',
  'categories': 'Categorías',
  'services': 'Servicios',
  'locations': 'Ubicaciones',
  'claims': 'Reclamaciones',
  'settings': 'Configuración',
  'about': 'Sobre Oltinde',
  'contact': 'Contacto',
  'faq': 'Preguntas Frecuentes',
  'favorites': 'Favoritos',
  'guia-de-usuario': 'Guía del Usuario',
  'list-your-company': 'Publicar mi Empresa',
  'map': 'Mapa',
  'notifications': 'Notificaciones',
  'privacy': 'Política de Privacidad',
  'profile': 'Perfil',
  'reset-password': 'Restablecer Contraseña',
  'search': 'Búsqueda',
  'services': 'Servicios',
  'signin': 'Iniciar Sesión',
  'signup': 'Registrarse',
  'terms': 'Términos de Servicio',
  'new': 'Nuevo',
  'add-company': 'Añadir Empresa',
};

// Simple heuristic to check if a string looks like a Firestore ID
const isFirestoreId = (s: string) => {
  return /^[a-zA-Z0-9]{20,}$/.test(s) || s.length > 20;
};


export default function Breadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === '/') {
    return null;
  }

  const pathSegments = pathname.split('/').filter(segment => segment);
  
  const breadcrumbs: Breadcrumb[] = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;
    
    let label = capitalize(decodeURIComponent(segment));

    // Translate segment if a translation exists
    if (translations[segment]) {
      label = translations[segment];
    }

    // Check if the segment is an ID and replace its label
    if (isFirestoreId(segment)) {
        const parentPath = pathSegments[index-1];
        if (parentPath === 'companies' || parentPath === 'institutions' || parentPath === 'procedures' || parentPath === 'contribuciones' || parentPath === 'announcements' || parentPath === 'offers') {
            label = 'Detalle';
        } else if (parentPath === 'edit') {
            label = 'Editar';
        }
    }


    return { href, label, isLast };
  });

  const allBreadcrumbs = [{ href: '/', label: 'Inicio', isLast: false }, ...breadcrumbs];

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-1.5 text-sm text-muted-foreground">
        {allBreadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb.href}>
            <li>
              <div className="flex items-center">
                {breadcrumb.href === '/' && (
                    <Link href={breadcrumb.href} className="hover:text-primary transition-colors">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Inicio</span>
                    </Link>
                )}
                {breadcrumb.href !== '/' && (
                    breadcrumb.isLast ? (
                    <span className="font-medium text-foreground">{breadcrumb.label}</span>
                    ) : (
                    <Link href={breadcrumb.href} className="hover:text-primary transition-colors">
                        {breadcrumb.label}
                    </Link>
                    )
                )}
              </div>
            </li>
            {!breadcrumb.isLast && (
              <li aria-hidden="true">
                <ChevronRight className="h-4 w-4" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

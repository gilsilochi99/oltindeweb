
import type {Metadata, Viewport} from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Toaster } from "@/components/ui/toaster"
import AppShell from '@/components/layout/AppShell';
import { Providers } from '@/components/shared/Providers';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import OfflineBanner from '@/components/layout/OfflineBanner';
import InstallBanner from '@/components/layout/InstallBanner';
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister';
import MobileTabBar from '@/components/layout/MobileTabBar';
import { JsonLd } from '@/components/shared/JsonLd';
import { buildOrganizationSchema } from '@/lib/structured-data';
import { getSiteSettings } from '@/lib/data';

export const metadata: Metadata = {
  metadataBase: new URL('https://oltinde.com'),
  title: {
    default: 'Oltinde - Directorio de Empresas de Guinea Ecuatorial',
    template: '%s | Oltinde',
  },
  description: 'El directorio digital más completo de empresas, servicios, instituciones y trámites en Guinea Ecuatorial. Encuentre y conecte con el tejido comercial de Malabo, Bata y todo el país.',
  keywords: [
    'Guinea Ecuatorial',
    'Equatorial Guinea',
    'empresas',
    'negocios',
    'directorio',
    'business directory',
    'Malabo',
    'Bata',
    'servicios',
    'instituciones',
    'trámites',
    'economía',
    'comercio',
    'GE',
    'EG',
    'información empresarial',
    'proveedores',
    'consultoría',
    'construcción',
    'telecomunicaciones',
    'Oltinde',
  ],
  openGraph: {
    title: 'Oltinde - Directorio de Empresas de Guinea Ecuatorial',
    description: 'El directorio digital más completo de empresas, servicios, instituciones y trámites en Guinea Ecuatorial.',
    url: 'https://oltinde.com',
    siteName: 'Oltinde',
    images: [
      {
        url: 'https://picsum.photos/seed/oltinde-og/1200/630', // Replace with a real OG image URL
        width: 1200,
        height: 630,
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oltinde - Directorio de Empresas de Guinea Ecuatorial',
    description: 'El directorio digital más completo de empresas, servicios, instituciones y trámites en Guinea Ecuatorial.',
    images: ['https://picsum.photos/seed/oltinde-og/1200/630'], // Replace with a real Twitter image URL
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Oltinde',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFCD00',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <JsonLd data={buildOrganizationSchema(settings)} />
      </head>
      <body className={cn("font-body antialiased")}>
        <Providers>
          <ServiceWorkerRegister />
          <div className="flex min-h-screen flex-col">
            <InstallBanner />
            <OfflineBanner />
            <Header />
            <AppShell>
              {children}
            </AppShell>
            <Footer />
          </div>
          <MobileTabBar />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}


import type {Metadata} from 'next';
import { Inter, Dancing_Script } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import AppShell from '@/components/layout/AppShell';
import { Providers } from '@/components/shared/Providers';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const fontBody = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
});

const fontHeadline = Inter({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-headline',
});

const fontCursive = Dancing_Script({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-cursive',
});


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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("font-body antialiased", fontBody.variable, fontHeadline.variable, fontCursive.variable)}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <AppShell>
              {children}
            </AppShell>
            <Footer />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

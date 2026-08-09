import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Oltinde - Directorio de Empresas de Guinea Ecuatorial',
    short_name: 'Oltinde',
    description: 'El directorio digital más completo de empresas, servicios, instituciones y trámites en Guinea Ecuatorial.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FFCD00',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

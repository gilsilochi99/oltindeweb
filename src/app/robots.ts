import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/favorites', '/profile', '/notifications', '/reset-password', '/checkout',
        '/tienda/carrito', '/tienda/checkout', '/tienda/pedido/', '/tienda/deseos', '/alquiler/reserva/', '/signin', '/signup'],
    },
    sitemap: 'https://oltinde.com/sitemap.xml',
  };
}

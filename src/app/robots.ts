import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/favorites', '/profile', '/notifications', '/reset-password'],
    },
    sitemap: 'https://oltinde.com/sitemap.xml',
  };
}


import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Disabled because react-leaflet v4's MapContainer isn't safe under React 18
  // StrictMode's dev-only double-mount: Leaflet throws "Map container is
  // already initialized" on the second mount. No effect on production builds.
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Service workers must be re-checked on every load — a cached, stale
        // sw.js would never pick up caching-rule changes (the same staleness
        // trap fixed for Server Actions earlier, but for the fix mechanism
        // itself this time).
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;


import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Disabled because react-leaflet v4's MapContainer isn't safe under React 18
  // StrictMode's dev-only double-mount: Leaflet throws "Map container is
  // already initialized" on the second mount. No effect on production builds.
  reactStrictMode: false,
  // Self-contained server bundle (.next/standalone) for Namecheap shared
  // hosting: built on a dev machine and uploaded, no npm install on the server.
  output: 'standalone',
  // The deploy build goes to its own folder so it doesn't clobber a running `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // One canonical host. www.oltinde.com isn't a Firebase Auth authorized
  // domain, so "Continuar con Google" fails there; it's also duplicate content.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.oltinde.com' }],
        destination: 'https://oltinde.com/:path*',
        permanent: true,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // No on-the-fly resizing: it needs the native `sharp` library and a lot of
    // memory, both scarce on shared hosting. Uploads are already resized and
    // compressed in the browser before upload (see src/lib/image-upload.ts).
    unoptimized: true,
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
        hostname: 'oltinde.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;


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
  // Forms across the app (Company logo/gallery, HealthFacility, Professional
  // photo/portfolio, etc.) embed uploaded images as base64 directly in the
  // Server Action payload. Next's default 1MB body limit rejects that before
  // the action even runs, surfacing as an opaque "Server Components render"
  // error in production. Raised well above the client-side per-image cap
  // (see ProfessionalForm.tsx) so real submissions never hit the ceiling.
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
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
};

export default nextConfig;

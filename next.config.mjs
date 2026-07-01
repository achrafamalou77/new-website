// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['lvh.me', '*.lvh.me'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'framer-motion',
      '@base-ui/react',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    qualities: [75, 80],
  },
  // Keep this mirror aligned with next.config.ts for tools that still read JS config.
  reactStrictMode: false,
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  poweredByHeader: false,
};
export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Disable React strict mode in dev to halve the number of re-renders
  reactStrictMode: false,
  // Reduce logging noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  poweredByHeader: false,
};

export default nextConfig;

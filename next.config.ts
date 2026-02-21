import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve WebP and AVIF for maximum compression
    formats: ["image/avif", "image/webp"],
    // Optimized breakpoints for mobile-first
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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
  },
  // Enable gzip/brotli compression
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

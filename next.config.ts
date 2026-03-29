import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Firebase Storage (bucket novo firebasestorage.app)
        protocol: 'https',
        hostname: '*.firebasestorage.app',
      },
      {
        // Firebase Storage (bucket legado googleapis.com)
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        // Google Storage
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        // Google avatares (login com Google)
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;

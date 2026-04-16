import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['child_process'],
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

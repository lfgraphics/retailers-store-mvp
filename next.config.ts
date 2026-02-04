import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withPWA({
  dest: 'public',
  disable: false,
  register: true,
  sw: 'service-worker.js',
  scope: '/',
  reloadOnOnline: true,
})(nextConfig);

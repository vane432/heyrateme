import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.heyrate.me' }],
        destination: 'https://heyrate.me/:path*',
        permanent: true,
      },
      // Redirect old /profile/username URLs to /username
      {
        source: '/profile/:username',
        destination: '/:username',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

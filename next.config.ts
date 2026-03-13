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

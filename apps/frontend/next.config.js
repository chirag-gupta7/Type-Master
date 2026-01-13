const backendUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() || 'https://typemaster-backend-pfns.onrender.com';

if (!backendUrl) {
  throw new Error('NEXT_PUBLIC_API_URL must be set or a backend fallback provided.');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  rewrites: async () => {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

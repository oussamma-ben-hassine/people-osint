/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  async rewrites() {
    const apiInternal = process.env.API_INTERNAL_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternal}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${apiInternal}/auth/:path*`,
      },
      {
        source: '/health/:path*',
        destination: `${apiInternal}/health/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

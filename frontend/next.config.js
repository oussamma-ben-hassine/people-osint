const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  async rewrites() {
    const apiInternal = process.env.API_INTERNAL_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternal}/api/:path*`,
      },
      {
        source: '/health/:path*',
        destination: `${apiInternal}/health/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

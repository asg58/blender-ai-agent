/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_BLENDER_WS_URL: process.env.NEXT_PUBLIC_BLENDER_WS_URL || 'ws://localhost:9876',
  },
  webpack(config) {
    return config;
  },
}

module.exports = nextConfig 
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: false, // Force webpack — kills PostCSS phantom error
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

module.exports = nextConfig;

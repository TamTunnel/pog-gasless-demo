import type { NextConfig } from "next"
import type { Configuration } from "webpack"

const nextConfig: NextConfig = {
  // Minimal turbopack config so Next stops complaining,
  // but with no special options.
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Keep your fs: false fallback for packages that expect Node's fs.
  webpack: (config: Configuration) => {
    config.resolve = config.resolve || {}
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
    }
    return config
  },
}

export default nextConfig


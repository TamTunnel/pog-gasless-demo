/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Remove experimental.turbopack — it's invalid in Next.js 16 stable
  // Turbopack is now default when you use `next dev`, no need to force it
}

export default nextConfig

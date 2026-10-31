import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  // Keep dev artifacts apart from build artifacts. When `next dev` and
  // `next build` share .next, the dev server rewrites chunks while the build
  // reads them, which surfaces as "Could not find files for /_error in
  // .next/build-manifest.json" followed by "Cannot read properties of
  // undefined (reading 'call')" while prerendering the first page.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);

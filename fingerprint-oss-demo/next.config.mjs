/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build optimization for OpenNext
  output: 'standalone',
  
  // Performance optimizations for Cloudflare Workers
  compress: true,
  poweredByHeader: false,
  
  // Build configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization for edge deployment
  images: {
    unoptimized: true,
    // Use responsive image formats
    formats: ['image/webp'],
    // Optimize for various screen sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
        },
      ],
    },
    // Static assets caching for performance
    {
      source: '/(.*)\\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    // API routes caching
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, must-revalidate',
        },
      ],
    },
  ],

  // Simplified webpack configuration for Cloudflare Workers compatibility
  webpack: (config, { isServer }) => {
    // Don't include server-only packages in client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },

  // Trailing slash configuration
  trailingSlash: false,

  // Strict mode for better performance
  reactStrictMode: true,
}

export default nextConfig

import nextPWA from 'next-pwa';

// Bundle analyzer (optional - only when ANALYZE=true)
// Install with: npm install --save-dev @next/bundle-analyzer
let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
  } catch (e) {
    console.warn('Bundle analyzer not installed. Run: npm install --save-dev @next/bundle-analyzer');
  }
}

const withPWA = nextPWA({
  dest: 'public',      // service worker will be generated in /public
  register: true,      // auto-register the service worker
  skipWaiting: true,   // activate new service worker immediately
  // Disable during non-production builds to avoid Workbox/GenerateSW being
  // invoked multiple times (Next.js compiles client + server). Enable only
  // in production to generate a single, stable service worker.
  disable: process.env.NODE_ENV !== 'production',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Enable compression
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // Optimize images
  images: {
    remotePatterns: [
      // Localhost with any port (for development)
      { 
        protocol: 'http', 
        hostname: 'localhost',
        pathname: '/storage/**',
      },
      { 
        protocol: 'http', 
        hostname: '127.0.0.1',
        pathname: '/storage/**',
      },
      // Production backend
      { 
        protocol: 'https', 
        hostname: 'leftover-be.ccdev.space', 
        pathname: '/storage/**' 
      },
      // Allow images from any domain (for flexibility)
      { 
        protocol: 'http', 
        hostname: '**', 
        pathname: '/storage/**' 
      },
      { 
        protocol: 'https', 
        hostname: '**', 
        pathname: '/storage/**' 
      },
    ],
    unoptimized: false, // Enable optimization for better performance
    formats: ['image/avif', 'image/webp'], // Use modern image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optimize webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for large libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Separate chunk for common libraries
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },

  async headers() {
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://leftover-be.ccdev.space').replace(/\/$/, '');
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:* http:",
      "media-src 'self' data: blob: https:",
      `connect-src 'self' ${backendUrl} http://localhost:*/ https: ws: wss:`,
      "font-src 'self' data: https:",
      "frame-src 'self' https://accounts.google.com https://*.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy-Report-Only',
            value: csp,
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

// Apply bundle analyzer if enabled
const configWithAnalyzer = withBundleAnalyzer(nextConfig);

export default withPWA(configWithAnalyzer);
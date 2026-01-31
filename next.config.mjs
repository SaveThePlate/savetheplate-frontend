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
  // Turbopack configuration for Next.js 16+
  turbopack: {},
  // Enable compression
  compress: true,
  // Optimize production builds
  // swcMinify is now enabled by default in Next.js 13+
  // Enable React strict mode for better performance
  reactStrictMode: true,
  // Optimize images
  images: {
    remotePatterns: [
      // Localhost with any port (for development)
      { 
        protocol: 'http', 
        hostname: 'localhost',
        pathname: '/store/**',
      },
      { 
        protocol: 'http', 
        hostname: '127.0.0.1',
        pathname: '/store/**',
      },
      // Production backend
      { 
        protocol: 'http', 
        hostname: 'savetheplate.tn', 
        pathname: '/store/**' 
      },
      { 
        protocol: 'https', 
        hostname: 'savetheplate.tn', 
        pathname: '/store/**' 
      },
      // Facebook CDN for profile images
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'scontent.*.fbcdn.net',
      },
      // Allow images from any domain (for flexibility)
      { 
        protocol: 'http', 
        hostname: '**', 
        pathname: '/store/**' 
      },
      { 
        protocol: 'https', 
        hostname: '**', 
        pathname: '/store/**' 
      },
    ],
    unoptimized: false, // Enable Next.js image optimization for better performance
    formats: ['image/avif', 'image/webp'], // Use modern image formats
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache images for 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://savetheplate.tn').replace(/\/$/, '');
    const isProd = process.env.NODE_ENV === 'production';
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      // In production, don't include localhost in CSP (keeps builds unambiguous and avoids accidental local calls).
      isProd
        ? "img-src 'self' data: blob: https:"
        : "img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:* http:",
      "media-src 'self' data: blob: https:",
      isProd
        ? `connect-src 'self' ${backendUrl} https: ws: wss:`
        : `connect-src 'self' ${backendUrl} http://localhost:*/ https: ws: wss:`,
      "font-src 'self' data: https:",
      "frame-src 'self' https://accounts.google.com https://*.google.com https://*.facebook.com https://www.facebook.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      // Headers for sign-in page - use unsafe-none COOP to allow Google OAuth popups
      {
        source: '/signIn',
        headers: [
          {
            key: 'Content-Security-Policy-Report-Only',
            value: csp,
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
        ],
      },
      // Headers for all other pages - with stricter COOP for security
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
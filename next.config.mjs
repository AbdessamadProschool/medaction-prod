import createNextIntlPlugin from 'next-intl/plugin';
/** @type {import('next').NextConfig} */

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CONFIGURATION NEXT.JS - SÉCURITÉ ULTRA-PROFESSIONNELLE
 * ════════════════════════════════════════════════════════════════════════════
 */

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://api.mapbox.com https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https: http:;
  connect-src 'self' https://www.google-analytics.com https://api.mapbox.com https://*.sentry.io wss://*.mapbox.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
`.replace(/\n/g, '').replace(/\s+/g, ' ').trim();

const PermissionsPolicy = [
  'accelerometer=()',
  'autoplay=()',
  'camera=()',
  'cross-origin-isolated=()',
  'display-capture=()',
  'encrypted-media=()',
  'fullscreen=(self)',
  'geolocation=(self)',
  'gyroscope=()',
  'keyboard-map=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'payment=()',
  'picture-in-picture=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'sync-xhr=()',
  'usb=()',
  'web-share=()',
  'xr-spatial-tracking=()',
].join(', ');

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  compress: true,
  images: {
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '192.168.1.83' },
      { protocol: 'https', hostname: 'bo.provincemediouna.ma' },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: PermissionsPolicy },
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? process.env.NEXTAUTH_URL || 'https://mediouna-action.gov.ma'
              : 'http://localhost:3000',
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-CSRF-Token' },
          { key: 'Access-Control-Max-Age', value: '86400' },
          { key: 'Access-Control-Expose-Headers', value: 'X-RateLimit-Remaining, X-Request-ID' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Content-Security-Policy', value: "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none';" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/.env:path*', destination: '/acces-refuse', permanent: false },
      { source: '/.git:path*', destination: '/acces-refuse', permanent: false },
      { source: '/prisma/:path*', destination: '/acces-refuse', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: '/api/uploads/:path*' },
    ];
  },
  serverExternalPackages: ['prisma', '@prisma/client', 'bcryptjs', 'puppeteer', 'sharp'],
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

export default withNextIntl(nextConfig);

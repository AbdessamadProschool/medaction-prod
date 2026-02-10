import createNextIntlPlugin from 'next-intl/plugin';

// Utilisation du plugin avec configuration explicite pour éviter les erreurs de chemin
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─────────────────────────────────────────────────────────────────
  // SÉCURITÉ & HEADERS (MANUELLEMENT CONFIGURÉS - SANS LIB EXTERNE)
  // ─────────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' // Ou DENY si vous voulez être strict
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.mapbox.com https://challenges.cloudflare.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.mapbox.com;
              img-src 'self' data: blob: https://*.mapbox.com https://*.openstreetmap.org https://res.cloudinary.com https://mediouna.gov.ma;
              font-src 'self' https://fonts.gstatic.com data:;
              connect-src 'self' https://*.mapbox.com https://events.mapbox.com;
              frame-src 'self' https://challenges.cloudflare.com;
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ];
  },

  poweredByHeader: false,
  compress: true,

  // ─────────────────────────────────────────────────────────────────
  // IMAGE OPTIMIZATION
  // ─────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mediouna.gov.ma',
        pathname: '/**',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ─────────────────────────────────────────────────────────────────
  // BUILD & TYPESCRIPT & ESLINT
  // ─────────────────────────────────────────────────────────────────
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // ─────────────────────────────────────────────────────────────────
  // EXPERIMENTAL FEATURES
  // ─────────────────────────────────────────────────────────────────
  experimental: {
    // Désactiver explicitement l'instrumentation pour éviter le bug clientModules
    instrumentationHook: false,
  },

  // ─────────────────────────────────────────────────────────────────
  // WEBPACK
  // ─────────────────────────────────────────────────────────────────
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

export default withNextIntl(nextConfig);

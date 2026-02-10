import createNextIntlPlugin from 'next-intl/plugin';

// Utilisation du plugin avec configuration automatique (i18n/request.ts)
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactivation des fonctionnalités strictes pour isoler le bug
  reactStrictMode: false,
  poweredByHeader: false,

  // Configuration d'images minimale pour éviter les erreurs 
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // Pas de headers de sécurité complexes pour ce test
  // Pas de mode standalone

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);

import HeroSection from '@/components/home/HeroSection';
import QuickFiltersSection from '@/components/home/QuickFiltersSection';
import EventsSection from '@/components/home/EventsSection';
import CampaignsSection from '@/components/home/CampaignsSection';
import NewsSection from '@/components/home/NewsSection';

import StatsSection from '@/components/home/StatsSection';
import CTASection from '@/components/home/CTASection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PORTAIL MEDIOUNA - Province de Médiouna | بوابة مديونة',
  description: 'Portail citoyen officiel PORTAIL MEDIOUNA. Participez, signalez et contribuez au développement de la Province de Médiouna. Une initiative de la Gouvernance Locale.',
  keywords: 'Mediouna, Province, Citoyen, Réclamation, Événements, Maroc, Gouvernance',
  openGraph: {
    title: 'PORTAIL MEDIOUNA - Province de Médiouna',
    description: 'Plateforme citoyenne officielle de la Province de Médiouna',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://mediouna-action.ma',
    siteName: 'PORTAIL MEDIOUNA',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PORTAIL MEDIOUNA - Province de Médiouna',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PORTAIL MEDIOUNA',
    description: 'Portail citoyen de la Province de Médiouna',
    images: ['/images/logo-portal-mediouna.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://province-rhamna.gov.ma',
  },
};

export default function HomePage() {
  return (
    <>
      {/* Hero avec carousel fullscreen */}
      <HeroSection />

      {/* Filtres rapides par secteur/commune */}
      <QuickFiltersSection />



      {/* Événements à venir - carousel infini */}
      <EventsSection />

      {/* Campagnes actives avec progress bars */}
      <CampaignsSection />

      {/* Actualités récentes */}
      <NewsSection />

      {/* Statistiques animées */}
      <StatsSection />

      {/* CTA finale */}
      <CTASection />
    </>
  );
}

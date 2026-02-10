import HeroSection from '@/components/home/HeroSection';
import QuickFiltersSection from '@/components/home/QuickFiltersSection';
import EventsSection from '@/components/home/EventsSection';
import CampaignsSection from '@/components/home/CampaignsSection';
import NewsSection from '@/components/home/NewsSection';
import StatsSection from '@/components/home/StatsSection';
import CTASection from '@/components/home/CTASection';
import GovHeader from '@/components/layout/GovHeader';
import GovFooter from '@/components/layout/GovFooter';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  // Next.js 15: params est maintenant une Promise
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });
  const tHero = await getTranslations({ locale, namespace: 'hero' });
  
  return {
    title: `${t('portail')} - ${t('province')}`,
    description: tHero('description'),
    keywords: 'Mediouna, Province, Citoyen, Réclamation, Événements, Maroc, Gouvernance',
    openGraph: {
      title: `${t('portail')} - ${t('province')}`,
      description: tHero('description'),
      type: 'website',
      locale: locale === 'ar' ? 'ar_MA' : 'fr_FR',
      url: 'https://mediouna-action.ma',
      siteName: t('portail'),
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `${t('portail')} - ${t('province')}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('portail'),
      description: tHero('description'),
      images: ['/images/logo-portal-mediouna.png'],
    },
  };
}

export default function HomePage() {
  return (
    <>
      <GovHeader />
      <main className="flex-1">
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
      </main>
      <GovFooter />
    </>
  );
}

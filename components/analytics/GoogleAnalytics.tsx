'use client';

import Script from 'next/script';

interface GoogleAnalyticsProps {
  measurementId: string;
}

/**
 * Google Analytics 4 Component
 * Usage: <GoogleAnalytics measurementId="G-XXXXXXXXXX" />
 */
export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  if (!measurementId || process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  );
}

// Analytics event tracking helper
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Page view tracking
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    });
  }
}

// Custom events for MedAction
export const AnalyticsEvents = {
  // Réclamations
  reclamationCreated: (communeId: number) => 
    trackEvent('create', 'reclamation', `commune_${communeId}`),
  reclamationViewed: (id: number) => 
    trackEvent('view', 'reclamation', `id_${id}`),
  
  // Établissements
  etablissementViewed: (id: number, secteur: string) => 
    trackEvent('view', 'etablissement', secteur),
  etablissementSearched: (query: string) => 
    trackEvent('search', 'etablissement', query),
  
  // Évaluations
  evaluationSubmitted: (etablissementId: number, note: number) => 
    trackEvent('submit', 'evaluation', `etablissement_${etablissementId}`, note),
  
  // Événements
  evenementViewed: (id: number) => 
    trackEvent('view', 'evenement', `id_${id}`),
  evenementParticipation: (id: number) => 
    trackEvent('participate', 'evenement', `id_${id}`),
  
  // Auth
  userLogin: () => trackEvent('login', 'auth'),
  userLogout: () => trackEvent('logout', 'auth'),
  userRegister: () => trackEvent('register', 'auth'),
  
  // Navigation
  menuClicked: (item: string) => 
    trackEvent('click', 'navigation', item),
  searchPerformed: (query: string, resultsCount: number) => 
    trackEvent('search', 'global', query, resultsCount),
};

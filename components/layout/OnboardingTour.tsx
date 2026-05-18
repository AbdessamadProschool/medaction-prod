'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslations } from 'next-intl';

export default function OnboardingTour() {
  const pathname = usePathname();
  const t = useTranslations('onboarding'); // Let's use a simple fallback if not translated
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if we already showed the tour
    const hasSeenTour = localStorage.getItem('medaction_tour_completed');
    
    // Only run on home page of the citizen portal
    if (pathname === '/fr' || pathname === '/ar' || pathname === '/') {
      if (!hasSeenTour) {
        // Wait a bit for animations and rendering
        const timer = setTimeout(() => {
          startTour();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, mounted]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Suivant ➔',
      prevBtnText: '⬅ Précédent',
      doneBtnText: 'Terminer',
      popoverClass: 'gov-driver-popover',
      steps: [
        {
          element: 'header',
          popover: {
            title: 'Bienvenue sur Portail MedAction',
            description: 'Découvrez comment participer activement à l\'amélioration de notre province. Laissez-nous vous guider !',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '.gov-search-trigger', // We will add this class to the search button in GovHeader
          popover: {
            title: 'Recherche Instantanée',
            description: 'Utilisez le raccourci Cmd+K ou cliquez ici pour trouver rapidement des services, démarches ou informations.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: 'nav a[href$="/reclamations/nouvelle"]', // "Déposer une réclamation"
          popover: {
            title: 'Soumettre une Réclamation',
            description: 'Un problème dans votre quartier ? Signalez-le directement aux services compétents en quelques clics.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: 'nav a[href$="/mes-reclamations"]',
          popover: {
            title: 'Suivi de vos dossiers',
            description: 'Suivez l\'état d\'avancement de vos réclamations grâce à notre timeline interactive détaillée.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: 'nav a[href$="/suggestions"]',
          popover: {
            title: 'Boîte à idées',
            description: 'Partagez vos idées et suggestions pour améliorer le quotidien de tous les citoyens de la province.',
            side: "bottom", align: 'start'
          }
        }
      ],
      onDestroyed: () => {
        localStorage.setItem('medaction_tour_completed', 'true');
      }
    });

    driverObj.drive();
  };

  // Render nothing, it's just a logic component
  return null;
}

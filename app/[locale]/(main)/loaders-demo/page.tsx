'use client';

import { useState } from 'react';
import LoadingScreen, { InlineLoader, BrandSkeleton } from '@/components/ui/LoadingScreen';
import PageLoader from '@/components/ui/PageLoader';

export default function LoadersShowcasePage() {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleShowFullscreen = () => {
    setShowFullscreen(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowFullscreen(false), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Styles de Chargement</h1>
        <p className="text-gray-600 mb-8">Démonstration des différents composants de chargement de la plateforme.</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Fullscreen Loader */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Loader Plein Écran</h2>
            <p className="text-gray-600 text-sm mb-4">
              Utilisé lors du chargement initial de l'application.
            </p>
            <button
              onClick={handleShowFullscreen}
              className="px-6 py-3 bg-gradient-to-r from-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)] text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Voir le Loader Plein Écran
            </button>
          </div>

          {/* Page Loader Default */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Loader de Page (Default)</h2>
            <div className="bg-gray-50 rounded-xl p-4 -mx-2">
              <PageLoader message="Chargement des données..." />
            </div>
          </div>

          {/* Page Loader Minimal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Loader Minimal</h2>
            <p className="text-gray-600 text-sm mb-4">
              Pour les chargements rapides ou les petites sections.
            </p>
            <div className="bg-gray-50 rounded-xl p-4">
              <PageLoader variant="minimal" message="Chargement..." />
            </div>
          </div>

          {/* Page Loader Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Loader Carte</h2>
            <p className="text-gray-600 text-sm mb-4">
              Pour les modales ou les sections encadrées.
            </p>
            <div className="flex justify-center">
              <PageLoader variant="card" message="Traitement en cours..." />
            </div>
          </div>

          {/* Inline Loader */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Loader Inline</h2>
            <p className="text-gray-600 text-sm mb-4">
              Pour les chargements dans le flux du contenu.
            </p>
            <div className="space-y-4">
              <InlineLoader message="Sauvegarde en cours..." />
              <InlineLoader message="Mise à jour..." />
            </div>
          </div>

          {/* Skeleton Loaders */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Squelettes de Chargement</h2>
            <p className="text-gray-600 text-sm mb-4">
              Pour préserver la mise en page pendant le chargement.
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <BrandSkeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <BrandSkeleton className="h-4 w-3/4" />
                  <BrandSkeleton className="h-3 w-1/2" />
                </div>
              </div>
              <BrandSkeleton className="h-32" />
              <div className="flex gap-4">
                <BrandSkeleton className="h-10 flex-1" />
                <BrandSkeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Palette de Couleurs</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-[hsl(213,80%,28%)] shadow-lg" />
              <span className="text-xs text-gray-600">Bleu Primaire</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-[hsl(45,93%,47%)] shadow-lg" />
              <span className="text-xs text-gray-600">Or/Doré</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-[hsl(213,80%,28%)] to-[hsl(45,93%,47%)] shadow-lg" />
              <span className="text-xs text-gray-600">Gradient</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Loader */}
      {showFullscreen && (
        <LoadingScreen 
          message="Chargement de l'application..." 
          showProgress 
          progress={progress}
        />
      )}
    </div>
  );
}

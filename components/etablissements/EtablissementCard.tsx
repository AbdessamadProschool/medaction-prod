'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { GraduationCap, Hospital, Trophy, HeartHandshake, Drama, Building2, MapPin, Star } from 'lucide-react';
import React from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslations } from 'next-intl';

interface Etablissement {
  id: number;
  code: string;
  nom: string;
  secteur: string;
  photoPrincipale?: string;
  noteMoyenne: number;
  nombreEvaluations: number;
  commune: { nom: string };
  annexe?: { nom: string } | null;
  nature?: string;
  telephone?: string;
  _count?: {
    evaluations: number;
    reclamations: number;
    evenements: number;
    actualites: number;
  };
}

interface EtablissementCardProps {
  etablissement: Etablissement;
  index: number;
  view?: 'grid' | 'list';
}

const secteurConfig: Record<string, { bg: string; text: string; icon: React.ElementType; gradient: string }> = {
  EDUCATION: { bg: 'bg-blue-50', text: 'text-blue-700', icon: GraduationCap, gradient: 'from-blue-500 to-indigo-600' },
  SANTE: { bg: 'bg-red-50', text: 'text-red-700', icon: Hospital, gradient: 'from-red-500 to-pink-600' },
  SPORT: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Trophy, gradient: 'from-emerald-500 to-teal-600' },
  SOCIAL: { bg: 'bg-purple-50', text: 'text-purple-700', icon: HeartHandshake, gradient: 'from-purple-500 to-violet-600' },
  CULTUREL: { bg: 'bg-orange-50', text: 'text-orange-700', icon: Drama, gradient: 'from-orange-500 to-amber-600' },
  AUTRE: { bg: 'bg-gray-50', text: 'text-gray-700', icon: Building2, gradient: 'from-gray-500 to-slate-600' },
};

function StarRating({ rating }: { rating: number }) {
  const t = useTranslations();
  return (
    <div className="flex items-center gap-0.5" aria-label={t('common.stars_rating', { rating })}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function EtablissementCard({ etablissement, index, view = 'grid' }: EtablissementCardProps) {
  const t = useTranslations();
  const config = secteurConfig[etablissement.secteur] || secteurConfig.AUTRE;
  
  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group bg-white rounded-xl p-4 border border-gray-100 hover:border-[hsl(213,80%,28%)]/30 hover:shadow-lg hover:shadow-[hsl(213,80%,28%)]/5 transition-all duration-300"
      >
        <div className="flex gap-4 md:gap-6">
          {/* Image Thumbnail */}
          <div className="shrink-0 w-24 h-24 md:w-32 md:h-24 rounded-lg overflow-hidden relative bg-gray-100">
            {etablissement.photoPrincipale ? (
              <OptimizedImage 
                src={etablissement.photoPrincipale} 
                alt={etablissement.nom}
                type="etablissement"
                width={128}
                height={96}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                <config.icon className="w-8 h-8 text-white/80" />
              </div>
            )}

          </div>

          {/* Info Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${config.bg} ${config.text}`}>
                  <config.icon className="w-3 h-3" />
                  {t(`sectors.${etablissement.secteur.toLowerCase()}`)}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                  <MapPin className="w-3 h-3" />
                  {etablissement.commune.nom}
                </span>
              </div>
              
              <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-[hsl(213,80%,28%)] transition-colors line-clamp-1 mb-1">
                <Link href={`/etablissements/${etablissement.id}`} className="focus:outline-none focus:underline">
                  <span aria-hidden="true" className="absolute inset-0" />
                  {etablissement.nom}
                </Link>
              </h3>
            </div>

            <div className="flex items-end justify-between gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <StarRating rating={Math.round(etablissement.noteMoyenne)} />
                  <span className="font-semibold text-gray-900 ml-1">{etablissement.noteMoyenne.toFixed(1)}</span>
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>{etablissement.nombreEvaluations} {t('common.reviews')}</span>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs font-medium text-[hsl(213,80%,28%)] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  {t('common.view_details')}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[hsl(213,80%,28%)]/30 hover:shadow-xl hover:shadow-[hsl(213,80%,28%)]/5 transition-all duration-300 flex flex-col h-full"
    >
      {/* Image Area */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {etablissement.photoPrincipale ? (
          <OptimizedImage 
            src={etablissement.photoPrincipale} 
            alt={etablissement.nom}
            type="etablissement"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
            <config.icon className="w-14 h-14 text-white/70" />
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md bg-white/90 ${config.text}`}>
              <config.icon className="w-3 h-3" />
              {t(`sectors.${etablissement.secteur.toLowerCase()}`)}
            </span>

          </div>
        </div>
        
        {/* Gradient Overlay for text contrast if needed specifically at bottom, but we use card body */}
      </div>

      {/* Body Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{etablissement.commune.nom}</span>
            {etablissement.annexe && (
               <>
                <span className="text-gray-300 mx-1">•</span>
                <span className="truncate">{etablissement.annexe.nom}</span>
               </>
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-[hsl(213,80%,28%)] transition-colors">
            <Link href={`/etablissements/${etablissement.id}`} className="focus:outline-none focus:underline">
              <span aria-hidden="true" className="absolute inset-0" />
              {etablissement.nom}
            </Link>
          </h3>
          
          <div className="flex items-center gap-2 mt-2 mb-4">
             <StarRating rating={Math.round(etablissement.noteMoyenne)} />
             <span className="text-sm font-bold text-gray-900">
               {etablissement.noteMoyenne > 0 ? etablissement.noteMoyenne.toFixed(1) : '-'}
             </span>
             <span className="text-xs text-gray-400">({etablissement.nombreEvaluations})</span>
          </div>
        </div>
        
        {/* Footer Actions / Stats */}
        <div className="pt-4 mt-2 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
           <div className="flex gap-3">
             {etablissement._count && etablissement._count.evenements > 0 && (
                <span className="flex items-center gap-1 text-[hsl(213,80%,28%)] bg-[hsl(213,80%,28%)]/5 px-2 py-1 rounded-md">
                   📅 {etablissement._count.evenements}
                </span>
             )}
             {etablissement._count && etablissement._count.actualites > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                   📰 {etablissement._count.actualites}
                </span>
             )}
           </div>
           
           <span className="flex items-center gap-1 text-[hsl(213,80%,28%)] opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
             {t('common.access')}
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
             </svg>
           </span>
        </div>
      </div>
    </motion.div>
  );
}

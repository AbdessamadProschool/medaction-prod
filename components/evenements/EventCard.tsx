'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  GraduationCap, Hospital, Trophy, HeartHandshake, Drama, ClipboardList, 
  CheckCircle2, PlayCircle, Calendar, MapPin, Users 
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslations, useLocale } from 'next-intl';
import React from 'react';

interface Evenement {
  id: number;
  titre: string;
  description: string;
  typeCategorique: string;
  secteur: string;
  statut: string;
  dateDebut: string;
  dateFin?: string;
  heureDebut?: string;
  lieu?: string;
  capaciteMax?: number;
  nombreInscrits: number;
  nombreVues: number;
  etablissement: { nom: string };
  commune: { nom: string };
  medias?: { urlPublique: string }[];
}

interface EventCardProps {
  event: Evenement;
  index: number;
  view?: 'grid' | 'list';
}

const secteurColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  EDUCATION: { bg: 'bg-blue-100', text: 'text-blue-700', icon: GraduationCap },
  SANTE: { bg: 'bg-red-100', text: 'text-red-700', icon: Hospital },
  SPORT: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Trophy },
  SOCIAL: { bg: 'bg-purple-100', text: 'text-purple-700', icon: HeartHandshake },
  CULTUREL: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Drama },
  AUTRE: { bg: 'bg-gray-100', text: 'text-gray-700', icon: ClipboardList },
};

function getStatusBadge(statut: string, dateDebut: string, dateFin?: string) {
  const now = new Date();
  const start = new Date(dateDebut);
  const end = dateFin ? new Date(dateFin) : null;

  if (statut === 'CLOTUREE' || (end && now > end)) {
    return { labelKey: 'completed', className: 'bg-gray-500 text-white', icon: CheckCircle2 };
  }
  if (statut === 'EN_ACTION' || (now >= start && (!end || now <= end))) {
    return { labelKey: 'in_progress', className: 'bg-red-500 text-white animate-pulse shadow-red-200', icon: PlayCircle };
  }
  return { labelKey: 'upcoming', className: 'bg-[hsl(45,93%,47%)] text-[hsl(213,80%,15%)] font-bold', icon: Calendar };
}

export default function EventCard({ event, index, view = 'grid' }: EventCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const secteurConfig = secteurColors[event.secteur] || secteurColors.AUTRE;
  const statusBadge = getStatusBadge(event.statut, event.dateDebut, event.dateFin);
  let imageUrl = event.medias?.[0]?.urlPublique;

  // Normalize URL if relative and missing leading slash
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    imageUrl = `/${imageUrl}`;
  }
  
  const isGrid = view === 'grid';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex ${isGrid ? 'flex-col h-full' : 'flex-row h-52'}`}
    >
      {/* Image Header */}
      <div className={`relative bg-gray-100 overflow-hidden ${isGrid ? 'h-48 w-full' : 'h-full w-1/3 min-w-[200px]'}`}>
        {imageUrl ? (
          <OptimizedImage
            src={imageUrl}
            alt={event.titre}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 group-hover:scale-105 transition-transform duration-500`}>
             <secteurConfig.icon className="w-16 h-16 text-gray-300 group-hover:text-[hsl(213,80%,28%)]/20 transition-colors" />
          </div>
        )}
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs shadow-lg backdrop-blur-md ${statusBadge.className}`}>
             <statusBadge.icon className="w-3.5 h-3.5" />
             {t(`filters.${statusBadge.labelKey}`)}
           </span>
        </div>

        <div className="absolute top-3 right-3">
           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-gray-700 shadow-sm">
              <secteurConfig.icon className={`w-3.5 h-3.5 ${secteurConfig.text}`} />
              {t(`sectors.${event.secteur.toLowerCase()}`)}
           </span>
        </div>

        {/* Date Tiles */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
           <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 text-white">
              <span className="block text-2xl font-bold leading-none">{new Date(event.dateDebut).getDate()}</span>
              <span className="block text-[10px] uppercase font-bold opacity-80">{new Date(event.dateDebut).toLocaleDateString(locale, { month: 'short' })}</span>
           </div>
        </div>
      </div>

      {/* Content Body */}
      <div className={`p-5 flex flex-col flex-1 ${!isGrid && 'justify-center'}`}>
        <h3 className={`font-bold text-gray-900 mb-2 group-hover:text-[hsl(213,80%,28%)] transition-colors leading-tight ${isGrid ? 'text-lg line-clamp-2' : 'text-xl line-clamp-1'}`}>
          {event.titre}
        </h3>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
          {event.description}
        </p>

        {/* Footer Info */}
        <div className={`space-y-3 pt-4 border-t border-gray-50 ${isGrid ? 'mt-auto' : ''}`}>
           <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5 truncate max-w-[60%]">
                 <MapPin className="w-3.5 h-3.5 shrink-0" />
                 <span className="truncate">{event.lieu || event.commune.nom}</span>
              </div>
              {event.capaciteMax && (
                 <div className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    <span className={event.nombreInscrits >= event.capaciteMax ? 'text-red-500' : 'text-emerald-600'}>
                       {event.nombreInscrits} / {event.capaciteMax}
                    </span>
                 </div>
              )}
           </div>

           <Link 
             href={`/evenements/${event.id}`}
             className="block w-full py-2.5 text-center text-sm font-bold text-[hsl(213,80%,28%)] bg-[hsl(213,80%,28%)]/5 rounded-xl hover:bg-[hsl(213,80%,28%)] hover:text-white transition-all active:scale-[0.98]"
           >
             {t('common.view_details')}
           </Link>
        </div>
      </div>
    </motion.div>
  );
}

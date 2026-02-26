'use client';

import { motion } from 'framer-motion';
import { 
  Megaphone, Users, Target, ArrowRight, Sparkles, Heart 
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslations } from 'next-intl';

interface Campagne {
  id: number;
  titre: string;
  nom: string;
  slug: string;
  description?: string;
  type?: string;
  imageCouverture?: string;
  imagePrincipale?: string;
  couleurTheme?: string;
  objectifParticipations?: number;
  nombreParticipations: number;
  isFeatured?: boolean;
  createdAt: string;
}

interface CampaignCardProps {
  campagne: Campagne;
  onClick: (campagne: Campagne) => void;
  index?: number;
}

export default function CampaignCard({ campagne, onClick, index = 0 }: CampaignCardProps) {
  const t = useTranslations('campaigns');
  const getProgress = () => {
    if (!campagne.objectifParticipations) return 0;
    return Math.min(100, (campagne.nombreParticipations / campagne.objectifParticipations) * 100);
  };

  let imageUrl = campagne.imageCouverture || campagne.imagePrincipale;
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    imageUrl = `/${imageUrl}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300 border border-gray-100 cursor-pointer h-full flex flex-col"
      onClick={() => onClick(campagne)}
    >
      {/* Header Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {imageUrl ? (
          <OptimizedImage
            src={imageUrl}
            alt={campagne.titre}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: campagne.couleurTheme || 'hsl(145,63%,32%)' }}
          >
            <Megaphone className="w-16 h-16 text-white/20" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {campagne.type && (
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-gray-800 shadow-sm uppercase">
              {t('types.' + campagne.type)}
            </span>
          )}
        </div>

        {campagne.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-amber-400 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              {t('featured')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-[hsl(145,63%,32%)] transition-colors leading-tight">
          {campagne.titre}
        </h3>

        <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1">
          {campagne.description}
        </p>

        {/* Progress Section */}
        {campagne.objectifParticipations && (
          <div className="mb-5 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                <Users className="w-3.5 h-3.5" />
                {campagne.nombreParticipations} {t('participants')}
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {t('goal')} {campagne.objectifParticipations}
              </span>
            </div>
            
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full rounded-full"
                style={{ backgroundColor: campagne.couleurTheme || 'hsl(145,63%,32%)' }}
              />
            </div>
            <div className="mt-1 text-right">
               <span className="text-[10px] font-bold text-gray-400">{Math.round(getProgress())}%</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <button className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-[hsl(145,63%,32%)] bg-[hsl(145,63%,32%)]/5 rounded-xl group-hover:bg-[hsl(145,63%,32%)] group-hover:text-white transition-all">
          <Heart className="w-4 h-4" />
          {t('participate')}
        </button>
      </div>
    </motion.div>
  );
}

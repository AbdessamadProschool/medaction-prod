'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Building2, Eye, ArrowRight, MapPin } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslations, useLocale } from 'next-intl';

interface Actualite {
  id: number;
  titre: string;
  description: string | null;
  categorie: string | null;
  nombreVues: number;
  datePublication: string | null;
  createdAt: string;
  etablissement?: {
    id: number;
    nom: string;
    secteur: string;
    commune?: { nom: string };
  } | null;
  medias: { urlPublique: string }[];
}

interface NewsCardProps {
  news: Actualite;
  view?: 'grid' | 'list';
  index?: number;
}

const getCategoryKey = (cat: string | null) => {
  if (!cat) return 'AUTRE';
  return cat.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "_");
};

export default function NewsCard({ news, view = 'grid', index = 0 }: NewsCardProps) {
  const t = useTranslations('news_page');
  const locale = useLocale();
  const date = new Date(news.datePublication || news.createdAt).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const isGrid = view === 'grid';
  let imageUrl = news.medias?.[0]?.urlPublique;
  
  // Normalize URL if relative and missing leading slash
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    imageUrl = `/${imageUrl}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[hsl(213,80%,28%)]/5 transition-all duration-300 flex ${isGrid ? 'flex-col h-full' : 'flex-row h-48'}`}
    >
      <Link href={`/actualites/${news.id}`} className="flex-1 flex w-full relative">
        {/* Image Section */}
        <div className={`relative overflow-hidden bg-gray-100 ${isGrid ? 'w-full h-48 aspect-video' : 'w-1/3 min-w-[200px] h-full'}`}>
          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={news.titre}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200`}>
              <Building2 className="w-12 h-12 text-gray-300" />
            </div>
          )}
          
          {/* Overlay for text visibility in grid mode if needed, though we have white bg body */}
          {isGrid && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-300" />}

          {/* Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md shadow-sm ${
              news.categorie 
                ? 'bg-white/90 text-[hsl(213,80%,28%)]' 
                : 'bg-gray-800/80 text-white'
            }`}>
              {t('categories.' + getCategoryKey(news.categorie))}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className={`flex flex-col p-5 flex-1 ${!isGrid && 'justify-center'}`}>
          {/* Meta Top */}
          <div className="flex items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3 flex-wrap">
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              <Calendar className="w-3 h-3 text-[hsl(45,93%,47%)]" />
              {date}
            </span>
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              <Building2 className="w-3 h-3 text-gray-400" />
              {news.etablissement?.secteur || 'N/A'}
            </span>
          </div>

          {/* Title */}
          <h3 className={`font-bold text-gray-900 mb-2 group-hover:text-[hsl(213,80%,28%)] transition-colors leading-tight ${isGrid ? 'text-lg line-clamp-2' : 'text-xl'}`}>
            {news.titre}
          </h3>

          {/* Description (Grid only, or truncated in list) */}
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
            {news.description}
          </p>

          {/* Footer Meta */}
          <div className={`flex items-center justify-between pt-4 border-t border-gray-50 ${isGrid ? 'mt-auto' : ''}`}>
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  {news.nombreVues}
               </div>
               {news.etablissement?.commune?.nom && (
               <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 font-medium truncate max-w-[150px]">
                  <MapPin className="w-3.5 h-3.5" />
                  {news.etablissement.commune.nom}
               </div>
               )}
             </div>
             
             <span className="flex items-center gap-1 text-sm font-bold text-[hsl(45,93%,47%)] group-hover:translate-x-1 transition-transform">
                {t('read')}
                <ArrowRight className="w-4 h-4" />
             </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

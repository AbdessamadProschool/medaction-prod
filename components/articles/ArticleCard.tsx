'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, Eye, User, ArrowRight, BookOpen } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslations, useLocale } from 'next-intl';

const getCategoryKey = (cat: string) => {
  return cat.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "_");
};

interface Article {
  id: number;
  titre: string;
  resume?: string;
  categorie?: string;
  imageCouverture?: string;
  vues: number;
  datePublication?: string;
  createdAt: string;
  auteur?: {
    id: number;
    prenom: string;
    nom: string;
  };
}

interface ArticleCardProps {
  article: Article;
  index: number;
}

export default function ArticleCard({ article, index }: ArticleCardProps) {
  const t = useTranslations('articles_page');
  const locale = useLocale();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link href={`/articles/${article.id}`} className="block h-full">
        <div className="h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[hsl(213,80%,28%)]/5 transition-all duration-300 border border-gray-100 flex flex-col">
          {/* Image */}
          <div className="relative h-56 overflow-hidden bg-gray-100">
            {article.imageCouverture ? (
              <OptimizedImage
                src={article.imageCouverture}
                alt={article.titre}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <BookOpen className="w-12 h-12 text-blue-200" />
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Category */}
            {article.categorie && (
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-[hsl(213,80%,28%)] shadow-sm">
                  {t('categories.' + getCategoryKey(article.categorie))}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(article.datePublication || article.createdAt).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.vues}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[hsl(213,80%,28%)] transition-colors leading-tight">
              {article.titre}
            </h3>

            <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1 text-balanced">
              {article.resume}
            </p>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              {article.auteur ? (
                 <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[hsl(213,80%,28%)]/10 flex items-center justify-center text-[hsl(213,80%,28%)] text-xs font-bold">
                       {article.auteur.prenom[0]}
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                       {article.auteur.prenom} {article.auteur.nom}
                    </span>
                 </div>
              ) : (
                <div />
              )}
              
              <span className="flex items-center gap-1 text-sm font-bold text-[hsl(45,93%,47%)] group-hover:translate-x-1 transition-transform">
                {t('read')}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

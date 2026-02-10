'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowLeft,
  Clock,
  Eye,
  User,
  Tag,
  Share2,
  BookOpen,
  ChevronRight,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

const getCategoryKey = (cat: string) => {
  return cat.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "_");
};

interface Article {
  id: number;
  titre: string;
  contenu: string;
  resume?: string;
  categorie?: string;
  imageCouverture?: string;
  tags?: string[];
  vues: number;
  datePublication?: string;
  createdAt: string;
  auteur?: {
    id: number;
    prenom: string;
    nom: string;
  };
}

interface ArticleConnexe {
  id: number;
  titre: string;
  resume?: string;
  imageCouverture?: string;
  categorie?: string;
  datePublication?: string;
}

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const t = useTranslations('articles_page');
  const tNews = useTranslations('news_page');
  const locale = useLocale();
  const [article, setArticle] = useState<Article | null>(null);
  const [articlesConnexes, setArticlesConnexes] = useState<ArticleConnexe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${id}`);
        if (res.ok) {
          const json = await res.json();
          setArticle(json.data);
          setArticlesConnexes(json.articlesConnexes || []);
        } else if (res.status === 404) {
          setError('Article non trouvé');
        } else {
          setError('Erreur lors du chargement');
        }
      } catch (err) {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: article?.titre,
        text: article?.resume,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(tNews('detail.copied'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-[hsl(213,80%,28%)] animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{error || tNews('detail.not_found')}</h1>
          <Link href="/articles" className="text-[hsl(213,80%,28%)] hover:underline font-medium">
            {tNews('detail.back_to_list')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HERO HEADER ==================== */}
      <div className="relative h-[300px] md:h-[400px] bg-gray-900 overflow-hidden">
        {article.imageCouverture ? (
          <OptimizedImage
            src={article.imageCouverture}
            alt={article.titre}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)]">
            <BookOpen className="w-24 h-24 text-white/20" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Back button */}
        <div className="absolute top-24 left-4 z-20">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-colors border border-white/10 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            {tNews('detail.back_to_list')}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-32 relative z-10 pb-20">
        {/* ==================== ARTICLE CARD ==================== */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="p-6 md:p-10">
            {/* Category Badge */}
            <div className="flex items-center justify-between mb-6">
               {article.categorie && (
                 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(213,80%,28%)]/5 text-[hsl(213,80%,28%)] rounded-lg text-sm font-bold tracking-wide uppercase">
                   <Tag size={13} strokeWidth={2.5} />
                   {t('categories.' + getCategoryKey(article.categorie))}
                 </span>
               )}
               
               <button
                 onClick={handleShare}
                 className="flex items-center gap-2 text-gray-400 hover:text-[hsl(213,80%,28%)] transition-colors text-sm font-medium"
               >
                 <Share2 size={16} />
                 {tNews('detail.share')}
               </button>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              {article.titre}
            </h1>

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
               {article.auteur && (
                 <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-[hsl(213,80%,28%)] flex items-center justify-center text-white font-bold text-lg">
                       {article.auteur.prenom[0]}
                    </div>
                    <div>
                       <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{tNews('detail.written_by', { name: '' }).replace('{name}', '').trim()}</p>
                       <p className="font-bold text-gray-900">{article.auteur.prenom} {article.auteur.nom}</p>
                    </div>
                 </div>
               )}

               <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{t('published_on') || 'Publié le'}</span>
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <Clock size={16} className="text-[hsl(45,93%,47%)]" />
                    {new Date(article.datePublication || article.createdAt).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
               </div>

               <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{tNews('detail.views', { count: '' }).replace('{count}', '').trim() || 'Vues'}</span>
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <Eye size={16} className="text-[hsl(45,93%,47%)]" />
                    {tNews('detail.views', { count: article.vues })}
                  </span>
               </div>
            </div>

            {/* Resume / Abstract */}
            {article.resume && (
               <div className="bg-gray-50 p-6 rounded-2xl mb-8 border-l-4 border-[hsl(45,93%,47%)]">
                  <p className="text-lg text-gray-700 italic leading-relaxed font-medium">
                     {article.resume}
                  </p>
               </div>
            )}

            {/* Main Content */}
            <div 
              className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-[hsl(213,80%,28%)] prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: article.contenu }}
            />

            {/* Tags Footer */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-10 pt-8 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">{t('tags') || 'Mots-clés associés'}</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.article>

        {/* ==================== RELATED ARTICLES ==================== */}
        {articlesConnexes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-gray-900">{tNews('detail.related_articles')}</h2>
               <Link href="/articles" className="text-sm font-bold text-[hsl(213,80%,28%)] hover:underline flex items-center gap-1">
                  {t('see_all') || 'Voir tout'} <ArrowRight size={16} />
               </Link>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {articlesConnexes.map((art) => (
                <Link
                  key={art.id}
                  href={`/articles/${art.id}`}
                  className="bg-white rounded-2xl p-4 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 border border-gray-100 group flex items-start gap-4"
                >
                  <div className="w-24 h-24 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden relative">
                    {art.imageCouverture ? (
                      <OptimizedImage 
                        src={art.imageCouverture} 
                        alt="" 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1">
                     {art.categorie && (
                       <span className="text-[10px] font-bold text-[hsl(213,80%,28%)] uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-md mb-2 inline-block">
                         {t('categories.' + getCategoryKey(art.categorie))}
                       </span>
                     )}
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-[hsl(213,80%,28%)] transition-colors mb-2">
                      {art.titre}
                    </h3>
                    {art.datePublication && (
                       <p className="text-xs text-gray-400">
                          {new Date(art.datePublication).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                       </p>
                    )}
                  </div>
                  
                  <div className="self-center">
                     <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[hsl(213,80%,28%)] group-hover:text-white transition-all">
                        <ChevronRight size={16} />
                     </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}

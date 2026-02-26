'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  FileText,
  Plus,
  Search,
  Eye,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  Sparkles,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Article {
  id: number;
  titre: string;
  resume?: string;
  categorie?: string;
  isPublie: boolean;
  vues: number;
  datePublication?: string;
  createdAt: string;
}

export default function MesArticlesPage() {
  const t = useTranslations('delegation.dashboard.articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (statusFilter) params.set('statut', statusFilter);

      try {
        const res = await fetch(`/api/delegation/articles?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setArticles(json.data || []);
          setTotalPages(json.pagination?.totalPages || 1);
          setTotal(json.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchArticles, 300);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter]);

  const deleteArticle = async (id: number) => {
    if (!confirm(t('delete_confirm'))) return;

    try {
      const res = await fetch(`/api/delegation/articles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== id));
        toast.success(t('delete_success'));
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(t('delete_error'));
    }
  };

  return (
    <div className="space-y-8">
      {/* Premium Header Section - Compacted */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-500/10 px-6 py-6 md:px-8 md:py-10">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BookOpen className="w-48 h-48 transform rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-blue-100 font-bold bg-white/10 w-fit px-3 py-1 rounded-xl backdrop-blur-md border border-white/10 text-xs uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></span>
                    <span>{t('title')}</span>
                </div>
                <div>
                   <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-1">
                       {t('header_title')} ({t('count_label', { count: total })})
                   </h1>
                   <p className="text-blue-100/80 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                       تصفح وأدر جميع مقالاتك المنشورة والمسودات في مكان واحد. شارك المعرفة والأخبار مع الجميع.
                   </p>
                </div>
            </div>
            
            <Link
                href="/delegation/articles/nouveau"
                className="group relative px-6 py-3 bg-white text-indigo-700 rounded-xl font-black text-sm shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center gap-2 overflow-hidden no-underline"
            >
                <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-2">
                    <Plus size={18} className="stroke-[4px]" />
                    <span>{t('new_article')}</span>
                </div>
            </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md rounded-2xl p-2 border border-gray-100 shadow-lg shadow-gray-200/50 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
              <Search className="absolute right-4 rtl:right-4 ltr:right-auto ltr:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full bg-transparent rtl:pr-12 rtl:pl-4 ltr:pl-12 ltr:pr-4 py-3.5 outline-none text-gray-800 placeholder:text-gray-400 font-medium text-start"
              />
          </div>
          
          <div className="w-px h-10 bg-gray-200 self-center hidden md:block"></div>

          <div className="relative min-w-[200px]">
                <div className="absolute right-4 rtl:right-4 ltr:right-auto ltr:left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <Filter size={18} />
                </div>
                <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-50 hover:bg-gray-100 rtl:pr-12 rtl:pl-10 ltr:pl-12 ltr:pr-10 py-3.5 rounded-xl outline-none cursor-pointer appearance-none font-semibold text-gray-700 transition-colors border-transparent border focus:border-blue-200 text-start"
                >
                <option value="">{t('filter_all')}</option>
                <option value="PUBLIE">{t('filter_published')}</option>
                <option value="BROUILLON">{t('filter_draft')}</option>
                </select>
          </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {t('empty_title')}
          </h3>
          <p className="text-gray-500 mb-8 font-medium text-lg">
            {t('empty_subtitle')}
          </p>
          <Link 
            href="/delegation/articles/nouveau" 
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-blue-500/30 font-bold text-lg"
          >
            <Plus size={22} />
            {t('create_first')}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <div
                key={article.id}
                className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    article.isPublie 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {article.isPublie ? t('status_published') : t('status_draft')}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-3 group-hover:text-blue-700 transition-colors">
                  {article.titre}
                </h3>

                {article.categorie && (
                  <span className="inline-block px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg mb-4 font-bold">
                    {article.categorie}
                  </span>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 font-medium">
                  <span className="flex items-center gap-2">
                    <Clock size={14} />
                    {new Date(article.createdAt).toLocaleDateString('ar-MA')}
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye size={14} />
                    {article.vues} {t('views')}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <Link
                    href={`/actualites/${article.id}`}
                    target="_blank"
                    className="p-3 text-green-600 hover:bg-green-50 hover:scale-110 rounded-xl transition-transform"
                    title="عرض المقال (Vue public)"
                  >
                    <ExternalLink size={20} />
                  </Link>
                  <Link
                    href={`/delegation/articles/${article.id}`}
                    className="flex-1 py-3 text-center text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    {t('edit')}
                  </Link>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-3 rounded-xl border-2 border-gray-200 disabled:opacity-50 hover:bg-gray-50 hover:border-blue-300 transition-all"
              >
                <ChevronRight size={22} />
              </button>
              <span className="text-base text-gray-700 px-6 font-bold">
                {t('page')} {page} {t('of')} {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-3 rounded-xl border-2 border-gray-200 disabled:opacity-50 hover:bg-gray-50 hover:border-blue-300 transition-all"
              >
                <ChevronLeft size={22} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

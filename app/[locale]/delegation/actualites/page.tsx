'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Newspaper,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  Filter,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface Actualite {
  id: number;
  titre: string;
  resume?: string;
  statut: string;
  isPublie: boolean;
  vues: number;
  datePublication?: string;
  createdAt: string;
  etablissement?: { nom: string };
  categorie?: string;
}

export default function MesActualitesPage() {
  const t = useTranslations('delegation.dashboard.my_news');
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchActualites = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '8'); // Lower limit for grid layout
      if (search) params.set('search', search);
      if (statusFilter) params.set('statut', statusFilter);

      try {
        const res = await fetch(`/api/delegation/actualites?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setActualites(json.data || []);
          setTotalPages(json.pagination?.totalPages || 1);
          setTotal(json.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement des actualités');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchActualites, 300);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter]);

  const deleteActualite = async (id: number) => {
    // Note: t('item.delete_confirm') should be available if json is correct
    if (!confirm(t('item.delete_confirm'))) return;

    try {
      const res = await fetch(`/api/delegation/actualites/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActualites(prev => prev.filter(a => a.id !== id));
        toast.success('Actualité supprimée avec succès');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
           console.error('Erreur suppression:', error);
           toast.error('Erreur système');
    }
  };

  return (
    <div className="space-y-10 font-sans text-right" dir="rtl">
      
      {/* Premium Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-xl shadow-orange-500/20 px-8 py-10 md:px-12 md:py-14">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-12 opacity-10">
            <Newspaper className="w-64 h-64 transform rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-orange-100 font-medium bg-black/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span>{t('title')}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                    {t('title')}
                </h1>
                <p className="text-orange-100/90 text-lg max-w-xl leading-relaxed">
                    قم بإدارة جميع الأخبار والمستجدات الخاصة بقطاعك في مكان واحد. تواصل مع المواطنين بفعالية.
                </p>
            </div>
            
            <Link
                href="/delegation/actualites/nouvelle"
                className="group relative px-8 py-4 bg-white text-orange-600 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Plus size={24} className="stroke-[3px]" />
                <span className="relative">{t('create_new')}</span>
            </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md rounded-2xl p-2 border border-gray-100 shadow-lg shadow-gray-200/50 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full bg-transparent pr-12 pl-4 py-3.5 outline-none text-gray-800 placeholder:text-gray-400 font-medium"
              />
          </div>
          
          <div className="w-px h-10 bg-gray-200 self-center hidden md:block"></div>

          <div className="relative min-w-[200px]">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <Filter size={18} />
                </div>
                <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-50 hover:bg-gray-100 pr-12 pl-10 py-3.5 rounded-xl outline-none cursor-pointer appearance-none font-semibold text-gray-700 transition-colors border-transparent border focus:border-orange-200"
                >
                <option value="">{t('status_filter')}</option>
                <option value="PUBLIEE">{t('status_published')}</option>
                <option value="BROUILLON">{t('status_draft')}</option>
                </select>
          </div>
      </div>

      {/* Grid Content */}
      <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                  <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
                  <Newspaper className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500 w-6 h-6" />
              </div>
              <p className="text-gray-400 font-medium animate-pulse">جاري تحميل المستجدات...</p>
            </div>
          ) : actualites.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100 border-dashed text-center"
            >
              <div className="w-28 h-28 bg-orange-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <FileText className="w-12 h-12 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('empty_state.title')}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                {t('empty_state.description')}
              </p>
              <Link href="/delegation/actualites/nouvelle" className="px-10 py-4 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 font-bold flex items-center gap-3 hover:-translate-y-1">
                <Plus size={22} />
                {t('empty_state.action')}
              </Link>
            </motion.div>
          ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {actualites.map((actu, index) => (
                        <motion.div
                            key={actu.id}
                            layout
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, delay: index * 0.05, type: 'spring', damping: 25 }}
                            className="bg-white rounded-[2rem] p-4 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 flex flex-col group h-full relative"
                        >
                            {/* Card Header / Image Area */}
                            <div className="h-48 rounded-[1.5rem] bg-gray-100 overflow-hidden relative mb-5 flex-shrink-0">
                                {/* Decorator or Image would go here */}
                                <div className={`absolute inset-0 ${actu.isPublie ? 'bg-gradient-to-br from-orange-50 to-red-50' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:scale-110 transition-transform duration-700">
                                    <Newspaper size={64} className={actu.isPublie ? "text-orange-900" : "text-gray-400"} />
                                </div>
                                
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4">
                                     <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border border-white/20 flex items-center gap-2 ${
                                        actu.isPublie 
                                        ? 'bg-green-500/90 text-white shadow-green-500/20' 
                                        : 'bg-gray-500/90 text-white'
                                     }`}>
                                        <span className={`w-2 h-2 rounded-full ${actu.isPublie ? "bg-white animate-pulse" : "bg-gray-300"}`}></span>
                                        {actu.isPublie ? t('item.published') : t('item.draft')}
                                     </span>
                                </div>

                                {/* Category Badge */}
                                {actu.categorie && (
                                    <div className="absolute bottom-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur text-gray-800 text-xs font-bold rounded-lg shadow-sm border border-black/5 flex items-center gap-1.5">
                                            <Tag size={12} className="text-orange-500" />
                                            {actu.categorie}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="flex-1 flex flex-col px-2 pb-2">
                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors cursor-pointer" onClick={() => window.location.href = `/delegation/actualites/${actu.id}`}>
                                    {actu.titre}
                                </h3>
                                
                                {actu.resume ? (
                                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                                        {actu.resume}
                                    </p>
                                ) : (
                                    <div className="flex-1"></div>
                                )}

                                {/* Meta Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                                            <Clock size={14} className="text-gray-300" />
                                            <span dir="ltr">{new Date(actu.createdAt).toLocaleDateString('fr-FR')}</span>
                                        </span>
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                                            <Eye size={14} className="text-gray-300" />
                                            {actu.vues}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-100 translate-y-0 transition-all">
                                        <Link
                                            href={`/delegation/actualites/${actu.id}`}
                                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title={t('item.edit')}
                                        >
                                            <Edit2 size={18} />
                                        </Link>
                                        <button
                                            onClick={() => deleteActualite(actu.id)}
                                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title={t('item.delete')}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Modern Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-12">
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 disabled:opacity-30 hover:scale-110 hover:shadow-lg transition-all"
                        >
                            <ChevronRight size={22} />
                        </button>
                        
                        <div className="px-6 py-3 bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 font-bold text-gray-700">
                            {page} <span className="text-gray-300 mx-2">/</span> {totalPages}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 disabled:opacity-30 hover:scale-110 hover:shadow-lg transition-all"
                        >
                            <ChevronLeft size={22} />
                        </button>
                    </div>
                )}
            </>
          )}
      </div>
    </div>
  );
}

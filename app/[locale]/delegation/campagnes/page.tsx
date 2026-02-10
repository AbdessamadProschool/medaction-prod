'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Megaphone,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Target,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Campagne {
  id: number;
  titre: string;
  nom: string;
  description?: string;
  type?: string;
  isActive: boolean;
  objectifParticipations?: number;
  nombreParticipations: number;
  dateDebut?: string;
  dateFin?: string;
  createdAt: string;
}

export default function MesCampagnesPage() {
  const t = useTranslations('delegation.dashboard.campaigns');
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCampagnes = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (statusFilter) params.set('statut', statusFilter);

      try {
        const res = await fetch(`/api/delegation/campagnes?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setCampagnes(json.data || []);
          setTotalPages(json.pagination?.totalPages || 1);
          setTotal(json.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchCampagnes, 300);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter]);

  const deleteCampagne = async (id: number) => {
    if (!confirm(t('delete_confirm'))) return;

    try {
      const res = await fetch(`/api/delegation/campagnes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCampagnes(prev => prev.filter(c => c.id !== id));
        toast.success(t('delete_success'));
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(t('delete_error'));
    }
  };

  const typeColors: Record<string, string> = {
    SANTE: 'from-red-500 to-rose-500',
    ENVIRONNEMENT: 'from-green-500 to-emerald-500',
    EDUCATION: 'from-blue-500 to-indigo-500',
    SOCIAL: 'from-orange-500 to-amber-500',
    AUTRE: 'from-gray-500 to-gray-600',
  };

  const getTypeGradient = (type?: string) => {
    return typeColors[type || 'AUTRE'] || typeColors['AUTRE'];
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-500/20 px-8 py-10 md:px-12 md:py-14">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-12 opacity-10">
            <Megaphone className="w-64 h-64 transform rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-100 font-medium bg-black/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{t('title')}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                    {total} {t('count_label')}
                </h1>
                <p className="text-emerald-100/90 text-lg max-w-xl leading-relaxed">
                    أطلق حملات توعوية ومبادرات مجتمعية فعالة. تتبع المشاركة والتفاعل لتحقيق أهدافك.
                </p>
            </div>
            
            <Link
                href="/delegation/campagnes/nouvelle"
                className="group relative px-8 py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Plus size={24} className="stroke-[3px]" />
                <span className="relative">{t('new_campaign')}</span>
            </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md rounded-2xl p-2 border border-gray-100 shadow-lg shadow-gray-200/50 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
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
                className="w-full bg-gray-50 hover:bg-gray-100 pr-12 pl-10 py-3.5 rounded-xl outline-none cursor-pointer appearance-none font-semibold text-gray-700 transition-colors border-transparent border focus:border-emerald-200"
                >
                <option value="">{t('filter_all')}</option>
                <option value="ACTIVE">{t('filter_active')}</option>
                <option value="UPCOMING">{t('filter_upcoming')}</option>
                <option value="FINISHED">{t('filter_finished')}</option>
                </select>
          </div>
      </div>

      {/* Campagnes Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
        </div>
      ) : campagnes.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {t('empty_title')}
          </h3>
          <p className="text-gray-500 mb-8 font-medium text-lg">
            {t('empty_subtitle')}
          </p>
          <Link 
            href="/delegation/campagnes/nouvelle" 
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-green-500/30 font-bold text-lg"
          >
            <Plus size={22} />
            {t('create_first')}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campagnes.map((campagne, index) => {
              const progress = campagne.objectifParticipations 
                ? Math.min(100, (campagne.nombreParticipations / campagne.objectifParticipations) * 100)
                : 0;
              
              return (
                <div
                  key={campagne.id}
                  className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header */}
                  <div className={`h-28 bg-gradient-to-br ${getTypeGradient(campagne.type)} relative p-5`}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Megaphone className="w-20 h-20 text-white" />
                    </div>
                    <div className="relative flex items-start justify-between">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        campagne.isActive 
                          ? 'bg-white/25 text-white border border-white/30' 
                          : 'bg-gray-900/30 text-gray-200 border border-gray-500/30'
                      }`}>
                        {campagne.isActive ? `🟢 ${t('status_active')}` : `⚫ ${t('status_finished')}`}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg truncate mb-2 group-hover:text-green-700 transition-colors">
                      {campagne.titre || campagne.nom}
                    </h3>
                    
                    {campagne.type && (
                      <span className="inline-block px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg mb-4 font-bold">
                        {t(`types.${campagne.type.toLowerCase()}`) || campagne.type}
                      </span>
                    )}

                    {/* Progress */}
                    {campagne.objectifParticipations && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2 font-medium">
                          <span className="flex items-center gap-2">
                            <Users size={16} />
                            {campagne.nombreParticipations} {t('participants')}
                          </span>
                          <span className="flex items-center gap-2">
                            <Target size={16} />
                            {t('objective')}: {campagne.objectifParticipations}
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${getTypeGradient(campagne.type)} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 font-medium">
                      <span className="flex items-center gap-2">
                        <Clock size={16} />
                        {new Date(campagne.createdAt).toLocaleDateString('ar-MA')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <Link
                        href={`/delegation/campagnes/${campagne.id}/modifier`}
                        className="flex-1 py-3 text-center text-sm font-bold text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        {t('edit')}
                      </Link>
                      <button
                        onClick={() => deleteCampagne(campagne.id)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-3 rounded-xl border-2 border-gray-200 disabled:opacity-50 hover:bg-gray-50 hover:border-green-300 transition-all"
              >
                <ChevronRight size={22} />
              </button>
              <span className="text-base text-gray-700 px-6 font-bold">
                {t('page')} {page} {t('of')} {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-3 rounded-xl border-2 border-gray-200 disabled:opacity-50 hover:bg-gray-50 hover:border-green-300 transition-all"
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

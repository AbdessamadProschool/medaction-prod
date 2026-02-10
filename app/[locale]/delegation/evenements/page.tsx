'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Users,
  MoreVertical,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  CheckCircle,
  X,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

interface Evenement {
  id: number;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin?: string;
  lieu?: string;
  statut: string;
  nombreInscrits: number;
  nombreVues: number;
  etablissement?: { nom: string };
  commune?: { nom: string };
  medias?: { urlPublique: string }[];
}

export default function MesEvenementsPage() {
  const t = useTranslations('delegation.dashboard.my_events');
  const { data: session } = useSession();
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showSuccess, setShowSuccess] = useState(false);

  // Status mapping
  const getStatusLabel = (status: string) => {
    switch(status) {
        case 'BROUILLON': return { label: t('status_filter.draft'), color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-200' };
        case 'EN_ATTENTE':
        case 'EN_ATTENTE_VALIDATION': return { label: t('status_filter.pending'), color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-200' };
        case 'PUBLIEE': return { label: t('status_filter.published'), color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' };
        case 'TERMINEE': return { label: t('status_filter.finished'), color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200' };
        case 'CLOTUREE': return { label: t('status_filter.closed'), color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-200' };
        case 'ANNULEE': return { label: t('status_filter.cancelled'), color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
        case 'EN_ACTION': return { label: t('status_filter.active'), color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' };
        default: return { label: status, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    }
  };

  useEffect(() => {
    // Check for success param
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
        setShowSuccess(true);
        window.history.replaceState({}, '', window.location.pathname);
        const timer = setTimeout(() => setShowSuccess(false), 5000);
        return () => clearTimeout(timer);
        }
    }
  }, []);

  useEffect(() => {
    const fetchEvenements = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', viewMode === 'list' ? '15' : '12');
      if (search) params.set('search', search);
      if (statusFilter) params.set('statut', statusFilter);

      try {
        const res = await fetch(`/api/delegation/evenements?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setEvenements(json.data || []);
          setTotalPages(json.pagination?.totalPages || 1);
          setTotal(json.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchEvenements, 300);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter, viewMode]);

  const deleteEvenement = async (id: number) => {
    if (!confirm(t('item.delete_confirm'))) return;

    try {
      const res = await fetch(`/api/delegation/evenements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvenements(prev => prev.filter(e => e.id !== id));
        toast.success(t('success_message'));
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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-500/20 px-8 py-10 md:px-12 md:py-14">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-12 opacity-10">
            <Calendar className="w-64 h-64 transform -rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-blue-100 font-medium bg-black/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10 text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></span>
                    <span>{t('title')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                    {t('description', { count: total })}
                </h1>
                <p className="text-blue-100/90 text-lg max-w-xl leading-relaxed">
                    نظم وتابع جميع الفعاليات والأنشطة الخاصة بقطاعك. تتبع المشاركة والتفاعل في الوقت الفعلي.
                </p>
            </div>
            
            <Link
                href="/delegation/evenements/nouveau"
                className="group relative px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Plus size={24} className="stroke-[3px]" />
                <span className="relative">{t('create_new')}</span>
            </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md rounded-2xl p-2 border border-gray-100 shadow-lg shadow-gray-200/50 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
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
                className="w-full bg-gray-50 hover:bg-gray-100 pr-12 pl-10 py-3.5 rounded-xl outline-none cursor-pointer appearance-none font-semibold text-gray-700 transition-colors border-transparent border focus:border-indigo-200"
             >
                <option value="">{t('status_filter.all')}</option>
                <option value="BROUILLON">{t('status_filter.draft')}</option>
                <option value="EN_ATTENTE_VALIDATION">{t('status_filter.pending')}</option>
                <option value="PUBLIEE">{t('status_filter.published')}</option>
                <option value="TERMINEE">{t('status_filter.finished')}</option>
                <option value="CLOTUREE">{t('status_filter.closed')}</option>
                <option value="ANNULEE">{t('status_filter.cancelled')}</option>
             </select>
          </div>

          <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                title={t('view_mode.list')}
            >
                <ListIcon size={20} />
            </button>
            <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                title={t('view_mode.grid')}
            >
                <LayoutGrid size={20} />
            </button>
          </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <Calendar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-6 h-6" />
              </div>
              <p className="text-gray-400 font-medium animate-pulse">جاري تحميل الفعاليات...</p>
            </div>
        ) : evenements.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100 border-dashed text-center"
            >
            <div className="w-28 h-28 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Calendar className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('empty.title')}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                {t('empty.description')}
            </p>
            <Link href="/delegation/evenements/nouveau" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 font-bold flex items-center gap-3 hover:-translate-y-1">
                <Plus size={22} />
                {t('empty.action')}
            </Link>
            </motion.div>
        ) : (
            <>
            {viewMode === 'list' ? (
                /* LIST / TABLE VIEW */
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden"
                >
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                    <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold tracking-wider border-b border-gray-100">
                        <tr>
                        <th className="px-8 py-6 w-1/3 text-right">{t('columns.event')}</th>
                        <th className="px-6 py-6 text-right">{t('columns.date_location')}</th>
                        <th className="px-6 py-6 text-center">{t('columns.stats')}</th>
                        <th className="px-6 py-6 text-center">{t('columns.status')}</th>
                        <th className="px-6 py-6 text-left">{t('columns.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {evenements.map((event, idx) => {
                        const statut = getStatusLabel(event.statut);
                        return (
                            <motion.tr 
                                key={event.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="hover:bg-indigo-50/30 transition-colors group"
                            >
                            <td className="px-8 py-5">
                                <div className="flex items-start gap-5">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-all">
                                        {event.medias && event.medias[0] ? (
                                            <img src={event.medias[0].urlPublique} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-indigo-300 bg-indigo-50">
                                                <Calendar size={28} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <Link href={`/delegation/evenements/${event.id}`} className="block text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors truncate mb-1">
                                            {event.titre}
                                        </Link>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-md text-gray-500 border border-gray-200">#{event.id}</span>
                                            {event.etablissement && (
                                            <span className="truncate max-w-[200px] flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                {event.etablissement.nom}
                                            </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="space-y-2 text-sm font-semibold text-gray-600">
                                <div className="flex items-center gap-2.5">
                                    <Clock size={16} className="text-gray-400" />
                                    <span className="text-gray-900">{new Date(event.dateDebut).toLocaleDateString('ar-MA')}</span>
                                </div>
                                {event.lieu && (
                                    <div className="flex items-center gap-2.5">
                                    <MapPin size={16} className="text-gray-400" />
                                    <span className="truncate max-w-[150px]">{event.lieu}</span>
                                    </div>
                                )}
                                </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                                <div className="inline-flex items-center gap-6 text-sm text-gray-600 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100">
                                <div className="text-center">
                                    <span className="block font-bold text-gray-900 text-lg leading-none">{event.nombreVues}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 block">{t('item.views')}</span>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div className="text-center">
                                    <span className="block font-bold text-gray-900 text-lg leading-none">{event.nombreInscrits}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 block">{t('item.registered')}</span>
                                </div>
                                </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${statut.bg} ${statut.color} ${statut.border} shadow-sm`}>
                                {statut.label}
                                </span>
                            </td>
                            <td className="px-6 py-5 text-left">
                                <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                {(event.statut === 'PUBLIEE' || event.statut === 'EN_ACTION') &&
                                event.dateFin && new Date(event.dateFin) < new Date() && (
                                    <Link
                                    href={`/delegation/evenements/${event.id}/cloture`}
                                    className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors animate-pulse border border-amber-200 hover:shadow-sm"
                                    title={t('item.close_action')}
                                    >
                                    <CheckCircle size={18} />
                                    <span className="text-xs font-bold hidden xl:inline">{t('item.close_action')}</span>
                                    </Link>
                                )}
                                {event.statut !== 'CLOTUREE' && (
                                    <Link
                                    href={`/delegation/evenements/${event.id}/modifier`}
                                    className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors hover:shadow-sm border border-blue-100"
                                    title={t('item.edit')}
                                    >
                                    <Edit2 size={18} />
                                    </Link>
                                )}
                                {['BROUILLON', 'EN_ATTENTE_VALIDATION', 'REJETEE'].includes(event.statut) && (
                                    <button
                                    onClick={() => deleteEvenement(event.id)}
                                    className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors hover:shadow-sm border border-red-100"
                                    title={t('item.delete')}
                                    >
                                    <Trash2 size={18} />
                                    </button>
                                )}
                                </div>
                            </td>
                            </motion.tr>
                        );
                        })}
                    </tbody>
                    </table>
                </div>
                </motion.div>
            ) : (
                /* GRID VIEW */
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode='popLayout'>
                    {evenements.map((event, index) => {
                    const statut = getStatusLabel(event.statut);
                    return (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col h-full"
                    >
                        {/* Image placeholder */}
                        <div className="h-56 bg-gray-100 relative overflow-hidden flex-shrink-0">
                            {event.medias && event.medias[0] ? (
                                <img
                                src={event.medias[0].urlPublique}
                                alt={event.titre}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                            ) : (
                                <>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Calendar className="w-16 h-16 text-indigo-200/80" />
                                </div>
                                </>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                            
                            <div className="absolute stop-4 right-4 z-10 top-4">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border border-white/20 ${statut.bg} ${statut.color} flex items-center gap-2`}>
                                    <span className={`w-2 h-2 rounded-full ${statut.color.replace('text', 'bg')}`}></span>
                                    {statut.label}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col">
                        <div className="mb-4 flex-1">
                            <Link href={`/delegation/evenements/${event.id}/modifier`} className="block text-xl font-bold text-gray-900 mb-3 leading-snug hover:text-indigo-600 transition-colors">
                                {event.titre}
                            </Link>
                            <div className="space-y-3 text-sm font-semibold text-gray-500">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><Clock size={16} /></div>
                                    <span>{new Date(event.dateDebut).toLocaleDateString('ar-MA')}</span>
                                </div>
                                {event.lieu && (
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><MapPin size={16} /></div>
                                    <span className="truncate">{event.lieu}</span>
                                </div>
                                )}
                            </div>
                        </div>

                        {/* Stats & Actions Row */}
                        <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-auto">
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                <Eye size={14} className="text-gray-400" /> {event.nombreVues}
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                <Users size={14} className="text-gray-400" /> {event.nombreInscrits}
                            </span>
                            </div>

                            <div className="flex gap-2">
                                {(event.statut === 'PUBLIEE' || event.statut === 'EN_ACTION') &&
                                event.dateFin && new Date(event.dateFin) < new Date() && (
                                    <Link
                                    href={`/delegation/evenements/${event.id}/cloture`}
                                    className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors animate-pulse border border-amber-200"
                                    title={t('item.close_action')}
                                    >
                                    <CheckCircle size={18} />
                                    </Link>
                                )}

                                {event.statut !== 'CLOTUREE' && (
                                <Link
                                    href={`/delegation/evenements/${event.id}/modifier`}
                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
                                    title={t('item.edit')}
                                >
                                    <Edit2 size={18} />
                                </Link>
                                )}

                                {['BROUILLON', 'EN_ATTENTE_VALIDATION', 'REJETEE'].includes(event.statut) && (
                                <button
                                    onClick={() => deleteEvenement(event.id)}
                                    className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
                                    title={t('item.delete')}
                                >
                                    <Trash2 size={18} />
                                </button>
                                )}
                            </div>
                        </div>
                        </div>
                    </motion.div>
                    );
                    })}
                </AnimatePresence>
                </div>
            )}

            {/* Pagination */}
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

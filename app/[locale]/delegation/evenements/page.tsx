'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
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
  const locale = useLocale();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showSuccess, setShowSuccess] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<number | null>(null);

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
        case 'EN_ACTION': return { label: t('status_filter.active'), color: 'text-gov-green-dark', bg: 'bg-gov-green/10', border: 'border-gov-green/30' };
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

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: viewMode === 'list' ? '15' : '12',
    ...(search ? { search } : {}),
    ...(statusFilter ? { statut: statusFilter } : {})
  });

  const { data: responseData, isLoading: loading, mutate: refreshEvenements } = useData(`/api/delegation/evenements?${searchParams.toString()}`);
  // /api/delegation/evenements → successResponse({evenements, pagination})
  // SWR reçoit: { success, data: { evenements: [...], pagination: {...} } }
  const evenements: Evenement[] = Array.isArray(responseData?.data?.evenements)
    ? responseData.data.evenements
    : [];
  const totalPages = responseData?.data?.pagination?.totalPages || 1;
  const total = responseData?.data?.pagination?.total || 0;
  
  const actionMutation = useMutation();

  const handleDeleteClick = (id: number) => {
    setEventToDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDeleteId) return;
    const id = eventToDeleteId;
    setEventToDeleteId(null);

    const promise = new Promise(async (resolve, reject) => {
      try {
        await actionMutation.mutate(`/api/delegation/evenements/${id}`, { method: 'DELETE' });
        await refreshEvenements();
        resolve(true);
      } catch (error: any) {
        reject(new Error(error.message || 'Erreur système'));
      }
    });

    toast.promise(promise, {
      loading: t('deleting') || 'جاري الحذف...',
      success: t('success_message'),
      error: (err) => err.message,
    });
  };

  return (
    <div className="space-y-10">

      {/* Premium Header Section - White Version */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white text-gray-900 shadow-sm border border-gray-100 px-6 py-6 md:px-8 md:py-10">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Calendar className="w-48 h-48 transform -rotate-12 text-blue-600" />
        </div>
        
        <div className={`relative z-10 flex flex-col md:flex-row ${direction === 'rtl' ? 'md:items-start text-right' : 'md:items-end text-left'} justify-between gap-6`}>
            <div className={`space-y-3 flex flex-col ${direction === 'rtl' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2.5 text-blue-600 font-bold bg-blue-50 w-fit px-3 py-1 rounded-xl border border-blue-100 text-xs uppercase tracking-wider ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>{t('title')}</span>
                </div>
                <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-1 text-gray-900">
                    {t('header_title')} ({t('count_label', { count: total })})
                </h1>
                   <p className="text-gray-500 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                       {t('header_description')}
                   </p>
                </div>
            </div>
            
            <Link
                href="/delegation/evenements/nouveau"
                className="group relative px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center gap-2 overflow-hidden no-underline"
            >
                <Plus size={18} className="stroke-[4px]" />
                <span>{t('create_new')}</span>
            </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md rounded-2xl p-2 border border-gray-100 shadow-lg shadow-gray-200/50 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
              <Search className="absolute right-4 rtl:right-4 ltr:right-auto ltr:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gov-blue-dark transition-colors" size={20} />
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
                className="w-full bg-gray-50 hover:bg-gray-100 rtl:pr-12 rtl:pl-10 ltr:pl-12 ltr:pr-10 py-3.5 rounded-xl outline-none cursor-pointer appearance-none font-semibold text-gray-700 transition-colors border-transparent border focus:border-gov-blue/30 text-start"
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
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gov-blue-dark font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                title={t('view_mode.list')}
            >
                <ListIcon size={20} />
            </button>
            <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gov-blue-dark font-bold' : 'text-gray-500 hover:text-gray-700'}`}
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
                  <div className="w-16 h-16 border-4 border-gov-blue/30 border-t-indigo-600 rounded-full animate-spin"></div>
                  <Calendar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gov-blue-dark w-6 h-6" />
              </div>
              <p className="text-gray-400 font-medium animate-pulse">جاري تحميل الفعاليات...</p>
            </div>
        ) : evenements.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 bg-white rounded-[2rem] border border-gray-100 border-dashed text-center"
            >
            <div className="w-28 h-28 bg-gov-blue/5 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Calendar className="w-12 h-12 text-gov-blue-dark" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('empty.title')}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                {t('empty.description')}
            </p>
            <Link href="/delegation/evenements/nouveau" className="px-10 py-4 bg-gov-blue/10 text-white rounded-2xl hover:bg-gov-blue/10 transition-all shadow-lg shadow-gov-blue/20 font-bold flex items-center gap-3 hover:-translate-y-1">
                <Plus size={22} />
                {t('empty.action')}
            </Link>
            </motion.div>
        ) : (
            <>
            {viewMode === 'list' ? (
                /* LIST / TABLE VIEW */
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden"
                >
                <div className="overflow-x-auto">
                    <table className="w-full text-right" style={{ minWidth: '600px' }}>
                    <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-500 font-bold tracking-wider border-b border-gray-100">
                        <tr>
                        {/* Always visible on all screens */}
                        <th className="px-6 py-4 w-1/3 text-right">{t('columns.event')}</th>
                        {/* Hidden on mobile, visible sm+ */}
                        <th className="px-4 py-4 text-right hidden sm:table-cell">{t('columns.date_location')}</th>
                        <th className="px-4 py-4 text-center hidden md:table-cell">{t('columns.stats')}</th>
                        <th className="px-4 py-4 text-center">{t('columns.status')}</th>
                        <th className="px-4 py-4 text-left">{t('columns.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {(Array.isArray(evenements) ? evenements : []).map((event: Evenement, idx: number) => {
                        const statut = getStatusLabel(event.statut);
                        return (
                            <motion.tr 
                                key={event.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="hover:bg-gov-blue/5/30 transition-colors group"
                            >
                            <td className="px-8 py-5">
                                <div className="flex items-start gap-3 sm:gap-5">
                                    {/* Thumbnail — hidden on very small, shown sm+ */}
                                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-all">
                                        {event.medias && event.medias[0] ? (
                                            <img src={event.medias[0].urlPublique} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gov-blue-dark bg-gov-blue/5">
                                                <Calendar size={24} aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <Link href={`/delegation/evenements/${event.id}`} className="block text-base font-bold text-gray-900 hover:text-gov-blue-dark transition-colors line-clamp-2 mb-0.5">
                                            {event.titre}
                                        </Link>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-md text-gray-500 border border-gray-200">#{event.id}</span>
                                            {event.etablissement && (
                                            <span className="truncate max-w-[120px] sm:max-w-[200px] flex items-center gap-1.5 bg-gov-blue/5 text-gov-blue-dark px-2 py-0.5 rounded-md border border-gov-blue/30">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gov-blue/10" aria-hidden="true" />
                                                {event.etablissement.nom}
                                            </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            {/* Date/lieu — hidden on mobile */}
                            <td className="px-6 py-5 hidden sm:table-cell">
                                <div className="space-y-2 text-sm font-semibold text-gray-600">
                                <div className="flex items-center gap-2.5">
                                    <Clock size={16} className="text-gray-400" aria-hidden="true" />
                                    <span className="text-gray-900">{new Date(event.dateDebut).toLocaleDateString('ar-MA')}</span>
                                </div>
                                {event.lieu && (
                                    <div className="flex items-center gap-2.5">
                                    <MapPin size={16} className="text-gray-400" aria-hidden="true" />
                                    <span className="truncate max-w-[150px]">{event.lieu}</span>
                                    </div>
                                )}
                                </div>
                            </td>
                            {/* Stats — hidden on mobile and tablet */}
                            <td className="px-6 py-5 text-center hidden md:table-cell">
                                <div className="inline-flex items-center gap-4 sm:gap-6 text-sm text-gray-600 bg-gray-50 px-3 sm:px-5 py-2.5 rounded-2xl border border-gray-100">
                                <div className="text-center">
                                    <span className="block font-bold text-gray-900 text-lg leading-none">{event.nombreVues}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 block">{t('item.views')}</span>
                                </div>
                                <div className="w-px h-8 bg-gray-200" aria-hidden="true" />
                                <div className="text-center">
                                    <span className="block font-bold text-gray-900 text-lg leading-none">{event.nombreInscrits}</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 block">{t('item.registered')}</span>
                                </div>
                                </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statut.bg} ${statut.color} ${statut.border} shadow-sm whitespace-nowrap`}>
                                {statut.label}
                                </span>
                            </td>
                            <td className="px-4 sm:px-6 py-5 text-left">
                                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                {(event.statut === 'PUBLIEE' || event.statut === 'EN_ACTION') &&
                                event.dateFin && new Date(event.dateFin) < new Date() && (
                                    <Link
                                    href={`/delegation/evenements/${event.id}/cloture`}
                                    className="flex items-center gap-1.5 px-2 sm:px-3 py-2 bg-gov-gold/5 text-gov-gold rounded-xl hover:bg-gov-gold/10 transition-colors animate-pulse border border-gov-gold/30 hover:shadow-sm"
                                    title={t('item.close_action')}
                                    >
                                    <CheckCircle size={16} aria-hidden="true" />
                                    <span className="text-xs font-bold hidden xl:inline">{t('item.close_action')}</span>
                                    </Link>
                                )}
                                {event.statut !== 'CLOTUREE' && !(event.dateFin && new Date(event.dateFin) < new Date() && (event.statut === 'PUBLIEE' || event.statut === 'EN_ACTION')) && (
                                    <Link
                                    href={`/delegation/evenements/${event.id}/modifier`}
                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors hover:shadow-sm border border-blue-100"
                                    title={t('item.edit')}
                                    >
                                    <Edit2 size={16} aria-hidden="true" />
                                    </Link>
                                )}
                                 {['BROUILLON', 'EN_ATTENTE_VALIDATION', 'REJETEE'].includes(event.statut) && (
                                     <button
                                     onClick={() => handleDeleteClick(event.id)}
                                     className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors hover:shadow-sm border border-red-100"
                                     title={t('item.delete')}
                                     >
                                     <Trash2 size={16} aria-hidden="true" />
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
                    {(Array.isArray(evenements) ? evenements : []).map((event: Evenement, index: number) => {
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
                                <div className="absolute inset-0 bg-gradient-to-br from-gov-blue to-gov-blue-dark" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Calendar className="w-16 h-16 text-gov-blue-dark/80" />
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
                            <Link href={`/delegation/evenements/${event.id}/modifier`} className="block text-xl font-bold text-gray-900 mb-3 leading-snug hover:text-gov-blue-dark transition-colors">
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
                                    className="p-2 bg-gov-gold/5 text-gov-gold rounded-xl hover:bg-gov-gold/10 transition-colors animate-pulse border border-gov-gold/30"
                                    title={t('item.close_action')}
                                    >
                                    <CheckCircle size={18} />
                                    </Link>
                                )}

                                {event.statut !== 'CLOTUREE' && !(event.dateFin && new Date(event.dateFin) < new Date() && (event.statut === 'PUBLIEE' || event.statut === 'EN_ACTION')) && (
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
                                     onClick={() => handleDeleteClick(event.id)}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {eventToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEventToDeleteId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-6 relative overflow-hidden text-right"
              dir="rtl"
            >
              <div className="absolute top-0 end-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t('item.delete') || 'حذف الفعالية'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{t('irreversible_action') || 'هذا الإجراء غير قابل للتراجع'}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 font-medium">
                {t('item.delete_confirm')}
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEventToDeleteId(null)}
                  className="px-5 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-bold transition-all"
                >
                  {t('cancel') || 'إلغاء'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-bold transition-all shadow-lg shadow-red-600/10"
                >
                  {t('delete') || 'حذف'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  Target,
  Clock,
  Megaphone,
  Edit2,
  Trash2,
  Share2,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  Trophy,
  History
} from 'lucide-react';
import { toast } from 'sonner';

interface CampagneDetail {
  id: number;
  titre: string;
  nom: string;
  description?: string;
  contenu?: string;
  type?: string;
  statut: string;
  isActive: boolean;
  objectifParticipations?: number;
  nombreParticipations: number;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
  createdAt: string;
  couleur?: string;
}

export default function CampagneDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('delegation.dashboard.campaigns');
  
  const [campagne, setCampagne] = useState<CampagneDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    const fetchCampagne = async () => {
      try {
        const res = await fetch(`/api/delegation/campagnes/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('الحملة غير موجودة');
          throw new Error('حدث خطأ أثناء تحميل الحملة');
        }
        const json = await res.json();
        setCampagne(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampagne();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm(t('delete_confirm'))) return;
    try {
      const res = await fetch(`/api/delegation/campagnes/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('delete_success'));
        router.push('/delegation/campagnes');
      } else {
        toast.error(t('delete_error'));
      }
    } catch (error) {
       toast.error(t('delete_error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
          <div className="absolute inset-0 blur-xl bg-emerald-400/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !campagne) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-6" dir="rtl">
        <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center shadow-inner">
            <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-900 font-cairo">{error || 'الحملة غير موجودة'}</h2>
          <p className="text-gray-500 font-medium font-cairo">عذراً، لم نتمكن من الوصول إلى تفاصيل هذه الحملة</p>
        </div>
        <Link 
          href="/delegation/campagnes"
          className="px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all font-black font-cairo shadow-lg shadow-gray-200 hover:-translate-y-1"
        >
          العودة إلى القائمة
        </Link>
      </div>
    );
  }

  // Double check NaN
  const safeObjective = Number(campagne.objectifParticipations) || 0;
  const safeParticipations = Number(campagne.nombreParticipations) || 0;
  
  const rawProgress = safeObjective > 0 ? (safeParticipations / safeObjective) * 100 : 0;
  const progress = isNaN(rawProgress) ? 0 : Math.min(100, Math.max(0, rawProgress));

  const getTypeGradient = (type?: string) => {
    const typeColors: Record<string, string> = {
      SANTE: 'from-rose-600 to-red-600',
      ENVIRONNEMENT: 'from-emerald-600 to-teal-600',
      EDUCATION: 'from-blue-600 to-indigo-600',
      SOCIAL: 'from-orange-500 to-amber-600',
      AUTRE: 'from-slate-600 to-slate-800',
    };
    return typeColors[type || 'AUTRE'] || typeColors['AUTRE'];
  };

  return (
    <div className="space-y-8 text-right font-cairo pb-12" dir="rtl">
      {/* Header Premium Hero */}
      <div className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${getTypeGradient(campagne.type)} text-white shadow-2xl px-5 py-10 md:px-10 md:py-16`}>
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Megaphone className="w-72 h-72 transform rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
           {/* Breadcrumbs with glass effect */}
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <Link 
               href="/delegation/campagnes"
               className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-all mb-4 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg font-bold group"
             >
               <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
               <span>العودة إلى الحملات</span>
             </Link>
           </motion.div>

           <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
             <div className="space-y-6 flex-1">
               <div className="flex flex-wrap gap-3">
                 <span className="px-4 py-1.5 bg-white/20 backdrop-blur-xl rounded-xl text-xs font-black border border-white/20 uppercase tracking-widest shadow-sm">
                    {campagne.type ? t(`types.${campagne.type.toLowerCase()}`) : 'عام'}
                 </span>
                 <span className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 border shadow-sm ${
                   campagne.statut === 'CLOTUREE' ? 'bg-indigo-500/20 text-white border-indigo-400/30' :
                   campagne.isActive ? 'bg-green-500/20 text-white border-green-400/30' : 
                   'bg-gray-800/30 text-gray-200 border-white/10'
                 }`}>
                    {campagne.statut === 'CLOTUREE' ? <CheckCircle2 size={14} /> :
                     campagne.isActive ? <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> : 
                     <Clock size={14} />}
                    {campagne.statut === 'CLOTUREE' ? t('status_closed') :
                     campagne.isActive ? t('status_active') : t('status_finished')}
                 </span>
               </div>
               
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg md:text-2xl lg:text-3xl font-black leading-[1.6] drop-shadow-2xl text-white text-right font-cairo"
                >
                  {campagne.titre}
                </motion.h1>
             </div>

             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="bg-white/10 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/20 min-w-[260px] shadow-2xl relative overflow-hidden group hover:bg-white/20 transition-all cursor-default"
             >
                <div className="relative z-10">
                  <p className="text-xs font-black text-white/80 mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <Trophy size={14} />
                    {t('details.general_progress')}
                  </p>
                   <div className="flex items-baseline gap-2 mb-4">
                     <span className="text-6xl font-black tracking-tight">{Math.round(progress)}</span>
                     <span className="text-2xl font-black opacity-80">%</span>
                   </div>
                  <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/5 p-0.5">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${progress}%` }}
                       transition={{ duration: 1.8, ease: "circOut" }}
                       className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]" 
                     />
                  </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
             </motion.div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Main Content (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
           {/* Description Card */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all"
           >
             <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-4 border-b border-gray-50 pb-6">
                <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-600 shadow-sm">
                   <Megaphone className="w-6 h-6" />
                </div>
                {t('details.description_title')}
             </h2>
             <div className="prose prose-lg max-w-none text-gray-600 leading-[1.8] whitespace-pre-line text-right font-cairo text-lg font-medium">
               {campagne.description}
             </div>
           </motion.div>

           {campagne.contenu && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all"
             >
               <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-4 border-b border-gray-50 pb-6">
                  <div className="p-3.5 bg-blue-500/10 rounded-2xl text-blue-600 shadow-sm">
                    <Info className="w-6 h-6" />
                  </div>
                  {t('details.content_title')}
               </h2>
                <div className="prose prose-lg max-w-none text-gray-600 leading-[1.8] whitespace-pre-line text-right font-cairo text-lg leading-loose">
                  {campagne.contenu}
                </div>
             </motion.div>
           )}
        </div>

        {/* Sidebar Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
           {/* Key Stats Card */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.5 }}
             className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 group"
           >
             <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                  <BarChart icon={<Users size={18} />} />
                </div>
                {t('details.stats_title')}
             </h3>
             <div className="space-y-4">
               <div className="flex items-center justify-between p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                      <Users size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-gray-400 block uppercase tracking-wider">{t('details.participants')}</span>
                      <span className="text-2xl font-black text-gray-900">{safeParticipations.toLocaleString()}</span>
                    </div>
                 </div>
               </div>
               
               <div className="flex items-center justify-between p-5 bg-blue-50/30 rounded-2xl border border-blue-100/50 hover:bg-blue-50 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
                      <Target size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-gray-400 block uppercase tracking-wider">{t('details.objective')}</span>
                      <span className="text-2xl font-black text-gray-900">{safeObjective.toLocaleString()}</span>
                    </div>
                 </div>
               </div>
             </div>
           </motion.div>

           {/* Timeline Card */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.6 }}
             className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 group"
           >
             <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                  <Calendar size={18} />
                </div>
                {t('details.planning_title')}
             </h3>
             <div className="space-y-6 relative">
               {/* Vertical line connector */}
               <div className="absolute right-7 top-4 bottom-4 w-0.5 bg-gray-100" />

               <div className="flex gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-100 group-hover:scale-105 transition-transform">
                    <Calendar size={22} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-black mb-1 uppercase tracking-widest">{t('details.start_date')}</p>
                    <p className="text-gray-900 font-black text-lg">{campagne.dateDebut ? new Date(campagne.dateDebut).toLocaleDateString('ar-MA', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                  </div>
               </div>
               
               <div className="flex gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0 border border-red-100 group-hover:scale-105 transition-transform">
                    <Clock size={22} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-black mb-1 uppercase tracking-widest">{t('details.end_date')}</p>
                    <p className="text-gray-900 font-black text-lg">{campagne.dateFin ? new Date(campagne.dateFin).toLocaleDateString('ar-MA', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                  </div>
               </div>
               
               {campagne.lieu && (
                 <div className="flex gap-5 relative z-10 pt-6 border-t border-gray-50">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-100 group-hover:scale-105 transition-transform">
                      <MapPin size={22} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-black mb-1 uppercase tracking-widest">{t('details.location')}</p>
                      <p className="text-gray-900 font-black text-lg">{campagne.lieu}</p>
                    </div>
                 </div>
               )}
             </div>
           </motion.div>

           {/* Management Actions Card */}
           {campagne.statut !== 'CLOTUREE' && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.7 }}
               className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden relative"
             >
               <div className="flex gap-3">
                  {campagne.dateFin && new Date(campagne.dateFin) < new Date() ? (
                    <Link 
                      href={`/delegation/campagnes/${campagne.id}/cloture`}
                      className="flex-1 flex flex-col items-center justify-center gap-3 py-6 bg-amber-50 text-amber-700 rounded-3xl hover:bg-amber-600 hover:text-white transition-all transform hover:-translate-y-1 group"
                    >
                      <div className="p-3 bg-white rounded-2xl shadow-sm animate-pulse">
                        <CheckCircle2 size={24} className="text-amber-600" />
                      </div>
                      <span className="font-black text-sm">إغلاق الحملة</span>
                    </Link>
                  ) : (
                    <Link 
                      href={`/delegation/campagnes/${campagne.id}/modifier`}
                      className="flex-1 flex flex-col items-center justify-center gap-3 py-6 bg-slate-50 text-slate-700 rounded-3xl hover:bg-slate-900 hover:text-white transition-all transform hover:-translate-y-1 group"
                    >
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-900">
                        <Edit2 size={24} />
                      </div>
                      <span className="font-black text-sm">{t('details.edit')}</span>
                    </Link>
                  )}
                  
                  {['BROUILLON', 'EN_ATTENTE'].includes(campagne.statut) && (
                    <button 
                      onClick={handleDelete}
                      className="flex-1 flex flex-col items-center justify-center gap-3 py-6 bg-red-50 text-red-600 rounded-3xl hover:bg-red-600 hover:text-white transition-all transform hover:-translate-y-1 group"
                    >
                      <div className="p-3 bg-white rounded-2xl shadow-sm">
                        <Trash2 size={24} />
                      </div>
                      <span className="font-black text-sm">{t('details.delete')}</span>
                    </button>
                  )}
               </div>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}

// Utility icon component
function BarChart({ icon }: { icon: React.ReactNode }) {
  return icon;
}

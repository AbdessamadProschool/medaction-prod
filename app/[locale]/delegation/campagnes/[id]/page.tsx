'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
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
  Loader2
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
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error || !campagne) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{error || 'الحملة غير موجودة'}</h2>
        <Link 
          href="/delegation/campagnes"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-bold"
        >
          العودة إلى القائمة
        </Link>
      </div>
    );
  }

  const progress = campagne.objectifParticipations 
    ? Math.min(100, (campagne.nombreParticipations / campagne.objectifParticipations) * 100)
    : 0;

  const getTypeGradient = (type?: string) => {
    const typeColors: Record<string, string> = {
      SANTE: 'from-red-500 to-rose-500',
      ENVIRONNEMENT: 'from-green-500 to-emerald-500',
      EDUCATION: 'from-blue-500 to-indigo-500',
      SOCIAL: 'from-orange-500 to-amber-500',
      AUTRE: 'from-gray-500 to-gray-600',
    };
    return typeColors[type || 'AUTRE'] || typeColors['AUTRE'];
  };

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Header with detailed info */}
      <div className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${getTypeGradient(campagne.type)} text-white shadow-xl px-8 py-10 md:px-12 md:py-14`}>
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Megaphone className="w-64 h-64 transform rotate-12" />
        </div>
        
        <div className="relative z-10 space-y-6">
           {/* Breadcrumbs / Back */}
           <Link 
             href="/delegation/campagnes"
             className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4 bg-black/10 px-4 py-2 rounded-full backdrop-blur-sm"
           >
             <ArrowRight size={18} />
             <span>العودة إلى الحملات</span>
           </Link>

           <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
             <div className="space-y-4 max-w-3xl">
               <div className="flex flex-wrap gap-3">
                 <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-sm font-bold border border-white/20">
                    {campagne.type ? t(`types.${campagne.type.toLowerCase()}`) : 'عام'}
                 </span>
                 <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 ${campagne.isActive ? 'bg-green-500/20 text-white border border-green-400/30' : 'bg-gray-800/30 text-gray-200'}`}>
                    {campagne.isActive ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    {campagne.isActive ? t('status_active') : t('status_finished')}
                 </span>
               </div>
               
               <h1 className="text-3xl md:text-5xl font-black leading-tight">
                 {campagne.titre}
               </h1>
             </div>

             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 min-w-[200px]">
                <p className="text-sm text-white/80 mb-1">{t('details.general_progress')}</p>
                <p className="text-4xl font-bold mb-2">{Math.round(progress)}%</p>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                   <div className="h-full bg-white transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
           {/* Description Card */}
           <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
             <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
               <div className="p-2 bg-emerald-50 rounded-xl">📝</div>
               {t('details.description_title')}
             </h2>
             <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
               {campagne.description}
             </div>
           </div>

           {campagne.contenu && (
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
               <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                 <div className="p-2 bg-blue-50 rounded-xl">📄</div>
                 {t('details.content_title')}
               </h2>
               <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                 {campagne.contenu}
               </div>
             </div>
           )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           {/* Key Stats */}
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-4">{t('details.stats_title')}</h3>
             <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                 <div className="flex items-center gap-3 text-gray-600">
                    <Users size={20} className="text-emerald-600" />
                    <span className="font-medium">{t('details.participants')}</span>
                 </div>
                 <span className="text-xl font-bold text-gray-900">{campagne.nombreParticipations}</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                 <div className="flex items-center gap-3 text-gray-600">
                    <Target size={20} className="text-blue-600" />
                    <span className="font-medium">{t('details.objective')}</span>
                 </div>
                 <span className="text-xl font-bold text-gray-900">{campagne.objectifParticipations || '-'}</span>
               </div>
             </div>
           </div>

           {/* Planning */}
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-4">{t('details.planning_title')}</h3>
             <div className="space-y-4">
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">{t('details.start_date')}</p>
                    <p className="text-gray-900 font-medium">{campagne.dateDebut ? new Date(campagne.dateDebut).toLocaleDateString('ar-MA') : '-'}</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">{t('details.end_date')}</p>
                    <p className="text-gray-900 font-medium">{campagne.dateFin ? new Date(campagne.dateFin).toLocaleDateString('ar-MA') : '-'}</p>
                  </div>
               </div>
               
               {campagne.lieu && (
                 <div className="flex gap-4 pt-4 border-t border-gray-50 mt-2">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold mb-1">{t('details.location')}</p>
                      <p className="text-gray-900 font-medium">{campagne.lieu}</p>
                    </div>
                 </div>
               )}
             </div>
           </div>

           {/* Actions */}
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-4">{t('details.management_title')}</h3>
             <div className="space-y-3">
                <Link 
                  href={`/delegation/campagnes/${campagne.id}/modifier`}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors font-bold"
                >
                  <Edit2 size={18} />
                  {t('details.edit')}
                </Link>
                <button 
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold"
                >
                  <Trash2 size={18} />
                  {t('details.delete')}
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

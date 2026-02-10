'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Image as ImageIcon,
  Edit2,
  FileText,
  Phone,
  Mail,
  Share2,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export default function EvenementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('delegation.dashboard.event_details');
  const id = params.id;
  
  const [evenement, setEvenement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/delegation/evenements/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setEvenement(data.data);
        } else {
          setError('Événement introuvable');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Erreur lors du chargement');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error || !evenement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{error || t('not_found')}</h1>
        <Link href="/delegation/evenements" className="text-gray-500 hover:text-gray-900 font-bold underline">
          {t('back_to_list')}
        </Link>
      </div>
    );
  }

  const getTypeGradient = (type?: string) => {
    // Default to purple if type unknown
    return 'from-purple-600 via-violet-600 to-indigo-600';
  };

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Premium Header */}
      <div className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${getTypeGradient(evenement.type)} text-white shadow-xl px-8 py-10 md:px-12 md:py-14`}>
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <Calendar className="w-64 h-64 transform rotate-12" />
        </div>
        
        <div className="relative z-10 space-y-6">
           <Link 
             href="/delegation/evenements"
             className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4 bg-black/10 px-4 py-2 rounded-full backdrop-blur-sm"
           >
             <ArrowRight size={18} />
             <span>{t('back_to_list')}</span>
           </Link>

           <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
             <div className="space-y-4 max-w-3xl">
               <div className="flex flex-wrap gap-3">
                 <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-sm font-bold border border-white/20">
                    {evenement.type}
                 </span>
                 <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 ${
                    evenement.statut === 'PUBLIEE' ? 'bg-green-500/20 text-white border border-green-400/30' : 'bg-white/10 text-white/80'
                 }`}>
                    {evenement.statut === 'PUBLIEE' ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {evenement.statut === 'PUBLIEE' ? t('status_published') : 
                     evenement.statut === 'CLOTUREE' ? t('status_closed') : t('status_draft')}
                 </span>
               </div>
               
               <h1 className="text-3xl md:text-5xl font-black leading-tight">
                 {evenement.titre}
               </h1>
             </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* Image */}
           {evenement.image && (
             <div className="relative h-80 w-full rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 group">
                <OptimizedImage
                    src={evenement.image}
                    alt={evenement.titre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
             </div>
           )}

           {/* Description */}
           <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
             <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
               <div className="p-2 bg-purple-50 rounded-xl">📝</div>
               {t('description')}
             </h2>
             <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
               {evenement.description}
             </div>
           </div>

           {/* Bilan Report (if closed) */}
           {evenement.statut === 'CLOTUREE' && evenement.bilanDescription && (
             <div className="bg-emerald-50 rounded-[2rem] p-8 shadow-sm border border-emerald-100">
               <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-3">
                 <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm">
                    <FileText className="w-6 h-6" />
                 </div>
                 {t('report_title')}
               </h2>
               
               <div className="flex items-center gap-4 mb-6">
                 <div className="bg-white px-4 py-2 rounded-xl text-emerald-800 font-bold shadow-sm">
                    {t('participants_count')}: <span className="text-2xl ml-2">{evenement.bilanNbParticipants}</span>
                 </div>
               </div>
               
               <div className="prose prose-lg max-w-none text-emerald-800 leading-relaxed">
                 {evenement.bilanDescription}
               </div>
             </div>
           )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           
           {/* Organisateur */}
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
                <Users className="text-purple-600" size={20} />
                {t('organizer')}
             </h3>
             
             <div className="space-y-4">
               <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                 <p className="font-bold text-purple-900 text-lg mb-1">{evenement.organisateurNom || "Organisateur inconnu"}</p>
                 <p className="text-sm text-purple-700 font-medium">مؤسسة منظمة</p>
               </div>

               {(evenement.organisateurEmail || evenement.organisateurTel) && (
                 <div className="space-y-3 pt-2">
                    {evenement.organisateurTel && (
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                <Phone size={16} />
                            </div>
                            <span className="font-medium" dir="ltr">{evenement.organisateurTel}</span>
                        </div>
                    )}
                    {evenement.organisateurEmail && (
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                <Mail size={16} />
                            </div>
                            <span className="font-medium text-sm">{evenement.organisateurEmail}</span>
                        </div>
                    )}
                 </div>
               )}
             </div>
           </div>

           {/* Planning */}
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
                <Calendar className="text-blue-600" size={20} />
                {t('time')} & {t('location')}
             </h3>
             <div className="space-y-6">
               <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-lg flex-col leading-none shadow-sm">
                    <span>{new Date(evenement.dateDebut).getDate()}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">{t('date')}</p>
                    <p className="text-gray-900 font-bold text-lg">
                        {new Date(evenement.dateDebut).toLocaleDateString('ar-MA', { item: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-gray-500 font-medium text-sm mt-1 flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(evenement.dateDebut).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
               </div>
               
               <div className="h-px bg-gray-100 w-full"></div>

               <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600 shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">{t('location')}</p>
                    <p className="text-gray-900 font-bold text-lg">{evenement.lieu || "Lieu non précisé"}</p>
                  </div>
               </div>

               {evenement.capacite && (
                 <div className="flex gap-4 pt-2">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600 shadow-sm">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">{t('capacity')}</p>
                        <p className="text-gray-900 font-bold text-lg">{evenement.capacite} {t('seats')}</p>
                    </div>
                 </div>
               )}
             </div>
           </div>

           {/* Actions */}
           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
             <div className="space-y-3">
                {evenement.statut === 'PUBLIEE' && new Date(evenement.dateFin) < new Date() && (
                    <Link 
                    href={`/delegation/evenements/${id}/cloture`}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-lg shadow-emerald-500/30"
                    >
                    <CheckCircle size={18} />
                    {t('close')}
                    </Link>
                )}
                
                <Link 
                  href={`/delegation/evenements/${id}/modifier?from=detail`}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors font-bold"
                >
                  <Edit2 size={18} />
                  {t('edit')}
                </Link>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

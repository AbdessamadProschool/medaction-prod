'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Building2, MapPin, Phone, Mail, Globe, GraduationCap, 
  BarChart3, Star, Users, Calendar, Megaphone,
  ShieldCheck, AlertTriangle, TrendingUp, Zap,
  FileText, Activity, ArrowDownToLine, CheckCircle, Info,
  Stethoscope, Wrench, UserSquare2, Download, Eye, FileBadge,
  AlertCircle, Clock, ArrowRight, ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { getEtabScore } from '@/lib/scoring';
import { toast } from 'sonner';
import {
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip
} from 'recharts';

interface Props {
  etablissement: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function DecisionCenterModal({ etablissement: initialEtab, isOpen, onClose }: Props) {
  const t = useTranslations('governor.decision_center');
  const tSectors = useTranslations('sectors');
  const locale = useLocale();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Real Data State
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Merge initial map data with fetched details
  const etablissement = details ? { ...initialEtab, ...details.data, stats: { ...initialEtab?.stats, ...details.data?._count } } : initialEtab;

  useEffect(() => {
    if (isOpen && initialEtab?.id) {
        setLoading(true);
        // Use a slight delay to allow the modal animation to start smoothly
        const timer = setTimeout(() => {
            fetch(`/api/etablissements/${initialEtab.id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to load');
                    return res.json();
                })
                .then(data => {
                    setDetails(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch details", err);
                    setLoading(false);
                });
        }, 300);
        return () => clearTimeout(timer);
    } else {
        setDetails(null);
        setLoading(true);
    }
  }, [isOpen, initialEtab?.id]);

  if (!etablissement) return null;

  // 1. Data Normalization with fallbacks
  const counts = details?.data?._count || {};
  
  const events = counts.evenements ?? (initialEtab.evenementsCount || 0);
  const reclamations = counts.reclamations ?? (initialEtab.reclamationsCount || 0);
  const abonnements = counts.abonnements ?? (initialEtab.abonnementsCount || 0);
  const reviews = counts.evaluations ?? (initialEtab.evaluationsCount || 0);
  const news = counts.actualites ?? (initialEtab.actualitesCount || 0);
  
  const activities = counts.programmesActivites ?? (initialEtab.programmesActivitesCount || 0);
  const rating = etablissement.noteMoyenne || 0;

  // Calculate strict score
  const calculatedScore = getEtabScore({
      evenementsCount: events,
      activitesCount: activities,
      reclamationsCount: reclamations,
      evaluationsCount: reviews,
      abonnementsCount: abonnements,
      actualitesCount: news,
      noteMoyenne: rating
  });
  
  const score = calculatedScore;

  // 2. Score Details Structure
  // 2. Score Details Structure
  const scoreDetails = [
    { label: t('labels.events'), count: events, pts: 10, total: events * 10, icon: Calendar, color: 'text-blue-500', tabRef: 'live' },
    { label: t('labels.activities'), count: activities, pts: 9, total: activities * 9, icon: Activity, color: 'text-purple-500', tabRef: 'performance' },
    { label: t('labels.news'), count: news, pts: 0.3, total: (news * 0.3).toFixed(1), icon: Megaphone, color: 'text-pink-500' },
    { label: t('labels.subscribers'), count: abonnements, pts: 0.3, total: (abonnements * 0.3).toFixed(1), icon: Users, color: 'text-emerald-500' },
    { label: t('labels.campaigns'), count: Math.round(events * 0.2), pts: 3, total: (events * 0.2 * 3).toFixed(1), icon: Megaphone, color: 'text-orange-500' },
    { label: t('labels.citizen_reviews'), count: reviews, pts: 0.1, total: (reviews * 0.1).toFixed(1), icon: Star, color: 'text-amber-500', tabRef: 'performance' },
    { label: t('labels.reclamations'), count: reclamations, pts: -5, total: (reclamations * -5).toFixed(1), icon: AlertTriangle, color: 'text-red-500', isNegative: true, tabRef: 'live' },
  ];

  // Prepare Chart Data (Positive metrics only)
  const chartData = scoreDetails
    .filter(d => !d.isNegative && parseFloat(d.total.toString()) > 0)
    .map(d => ({
        subject: d.label,
        A: parseFloat(d.total.toString()),
        fullMark: 150
    }));

  const isUrgent = !!etablissement.besoinsUrgents;
  // 3. Rank Logic
  const getRank = (s: number) => {
      if (s >= 90) return { label: 'S', color: 'text-amber-400', bg: 'bg-amber-950', border: 'border-amber-500/50', desc: t('rank.s') };
      if (s >= 70) return { label: 'A', color: 'text-emerald-400', bg: 'bg-emerald-950', border: 'border-emerald-500/50', desc: t('rank.a') };
      if (s >= 50) return { label: 'B', color: 'text-blue-400', bg: 'bg-blue-950', border: 'border-blue-500/50', desc: t('rank.b') };
      if (s >= 30) return { label: 'C', color: 'text-orange-400', bg: 'bg-orange-950', border: 'border-orange-500/50', desc: t('rank.c') };
      return { label: 'D', color: 'text-red-500', bg: 'bg-red-950', border: 'border-red-500/50', desc: t('rank.d') };
  };
  const rank = getRank(score);

  const slides = [
    { id: 'overview', title: t('tabs.overview'), icon: Globe },
    { id: 'infos', title: t('tabs.infos'), icon: Building2 },
    { id: 'performance', title: t('tabs.performance'), icon: BarChart3 },
    { id: 'live', title: t('tabs.live'), icon: Zap },
    { id: 'docs', title: t('tabs.docs'), icon: FileText }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
           onClick={onClose}
        >
          <motion.div
             initial={{ scale: 0.95, opacity: 0, y: 30 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             exit={{ scale: 0.95, opacity: 0, y: 30 }}
             onClick={(e) => e.stopPropagation()}
             className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 relative xl:max-w-[1600px]"
          >
             {/* 🎖️ HEADER AREA */}
             <div className="bg-slate-950 text-white p-8 sm:p-10 flex flex-col shrink-0 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-96 h-96 ${rank.bg.replace('bg-', 'bg-')}/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none`} />
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full -translate-y-1/3 -translate-x-1/4 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10 w-full">
                   {/* Left Side: Title & Info */}
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-4">
                         <div className={`w-16 h-16 ${rank.bg} rounded-2xl flex flex-col items-center justify-center border-4 ${rank.border} shadow-2xl shrink-0 transition-all`}>
                             <span className={`text-2xl font-black ${rank.color}`}>{rank.label}</span>
                         </div>
                         <div>
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border mb-2 ${rank.border} ${rank.bg} ${rank.color}`}>
                                {rank.desc}
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white mb-1">
                               {etablissement.nom}
                            </h2>
                         </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 pl-20">
                           <span className="flex items-center gap-1.5 text-slate-400 text-sm font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                               <MapPin size={14} /> {etablissement.communeNom || etablissement.commune?.nom}
                           </span>
                           <span className="flex items-center gap-1.5 text-slate-400 text-sm font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                               <Building2 size={14} /> {tSectors(etablissement.secteur?.toLowerCase() || 'autre')}
                           </span>
                      </div>
                   </div>

                   {/* Right Side: Close Button */}
                   <div className="absolute top-0 right-0 md:static md:self-start">
                        <button 
                             onClick={onClose} 
                             className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md border border-white/5 group"
                        >
                            <X size={24} className="group-hover:rotate-90 transition-transform" />
                        </button>
                   </div>
                </div>
             </div>

             {/* 🧭 NAVIGATION TABS */}
             <div className="bg-slate-950 border-b border-white/10 px-8 pb-0 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                {slides.map((s, idx) => (
                   <button 
                     key={s.id} 
                     onClick={() => setCurrentSlide(idx)}
                     className={`flex items-center gap-3 px-6 py-4 rounded-t-2xl transition-all border-t border-x border-transparent relative top-[1px] ${
                        currentSlide === idx 
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800' 
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                     }`}
                   >
                      <s.icon size={18} className={currentSlide === idx ? 'text-gov-blue' : ''} />
                      <span className="text-xs font-black uppercase tracking-widest">{s.title}</span>
                   </button>
                ))}
             </div>

             {/* 📖 CONTENT SLIDER */}
             <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-8 md:p-10">
               <AnimatePresence mode='wait'>
                 <motion.div 
                   key={currentSlide}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   transition={{ duration: 0.2 }}
                 >
                   
                   {/* 0. VUE GLOBALE */}
                   {/* 0. VUE GLOBALE */}
                   {currentSlide === 0 && (
                      <div className="grid lg:grid-cols-3 gap-8">
                         {/* LEFT COLUMN: STATS GRID */}
                         <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                            {scoreDetails.slice(0, 4).map((detail, i) => (
                               <div key={i} className="relative bg-white dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-gov-blue/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[160px]">
                                  <div className="flex justify-between items-start">
                                      <div className={`w-14 h-14 rounded-2xl ${detail.color.replace('text-', 'bg-')}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                         <detail.icon className={detail.color} size={28} />
                                      </div>
                                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${detail.isNegative ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                           {detail.isNegative ? '' : '+'}{detail.total} pts
                                      </span>
                                  </div>
                                  
                                  <div>
                                     <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{detail.count}</span>
                                     </div>
                                     <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{detail.label}</p>
                                  </div>
                                  
                                  {/* Action Arrow */}
                                  {(detail as any).tabRef && (
                                    <button 
                                        onClick={() => setCurrentSlide(slides.findIndex(s => s.id === (detail as any).tabRef))}
                                        className="absolute bottom-6 right-6 p-2 bg-slate-50 text-slate-400 hover:bg-gov-blue hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                                        title={`View ${detail.label}`}
                                    >
                                        <ArrowRight size={16} />
                                    </button>
                                  )}
                               </div>
                            ))}
                         </div>

                         {/* RIGHT COLUMN: HIGHLIGHTS & ACTIONS */}
                         <div className="space-y-6">
                            {/* Status Card */}
                            <div className={`p-8 rounded-[2.5rem] relative overflow-hidden ${isUrgent ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-slate-900 text-white shadow-xl'}`}>
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                            {isUrgent ? <AlertCircle size={24} /> : <ShieldCheck size={24} />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{t('infos.functional_status')}</p>
                                            <p className="text-lg font-black">{isUrgent ? t('values.critical_state') : t('values.operational')}</p>
                                        </div>
                                    </div>
                                    
                                    {etablissement.besoinsUrgents ? (
                                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 mb-6">
                                            <p className="text-xs font-bold leading-relaxed line-clamp-3">
                                                "{etablissement.besoinsUrgents}"
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mb-8 opacity-60">
                                            <CheckCircle size={16} />
                                            <span className="text-sm font-medium">{t('infos.no_urgent_needs')}</span>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => setCurrentSlide(1)} 
                                        className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {t('tabs.infos')} <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                                    {t('live.immediate_action')}
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors gap-2 group">
                                        <FileText size={20} className="text-slate-400 group-hover:text-blue-500" />
                                        <span className="text-[10px] font-bold">Rapport</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-purple-50 hover:text-purple-600 transition-colors gap-2 group">
                                        <Activity size={20} className="text-slate-400 group-hover:text-purple-500" />
                                        <span className="text-[10px] font-bold">Audit</span>
                                    </button>
                                </div>
                            </div>
                         </div>
                      </div>
                   )}
                   {currentSlide === 1 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-6">
                              {/* IDENTITY CARD - Redesigned */}
                              <div className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50  rounded-bl-[4rem] -mr-8 -mt-8 z-0"></div>
                                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 relative z-10">
                                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                         <Building2 size={20} />
                                      </div>
                                      {t('infos.identity_card')}
                                  </h3>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-8 relative z-10">
                                      <InfoField label={t('infos.functional_status')} value={etablissement.statutFonctionnel} icon={Activity} />
                                      <InfoField label={t('infos.nature')} value={etablissement.nature || t('values.public')} icon={Building2} />
                                      <InfoField label={t('infos.creation_year')} value={etablissement.anneeCreation} icon={Clock} />
                                      <InfoField label={t('infos.capacity')} value={etablissement.capaciteAccueil} suffix={t('units.people')} icon={Users} />
                                      <InfoField label={t('infos.type')} value={etablissement.typeEtablissement} className="col-span-2" />
                                      <InfoField label={t('infos.manager')} value={etablissement.responsableNom} icon={UserSquare2} className="col-span-2" />
                                  </div>
                              </div>
                              
                              {/* CONTACT & LOCATION CARD */}
                              <div className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                  <div className="flex items-center gap-3 mb-6">
                                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                                          <MapPin size={20} />
                                      </div>
                                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('infos.contact_access')}</h3>
                                  </div>
                                  
                                  <div className="space-y-4">
                                      {etablissement.adresseComplete && (
                                          <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-start gap-4 border border-slate-100 dark:border-slate-800">
                                              <MapPin size={18} className="mt-0.5 text-slate-400 shrink-0" />
                                              <div>
                                                  <span className="block text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wider">Adresse</span>
                                                  <p className="text-sm text-slate-800 dark:text-slate-200 font-bold leading-snug">{etablissement.adresseComplete}</p>
                                              </div>
                                          </div>
                                      )}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <ContactField icon={Phone} label="Téléphone" value={etablissement.telephone} href={`tel:${etablissement.telephone}`} color="blue" />
                                          <ContactField icon={Mail} label="Email" value={etablissement.email} href={`mailto:${etablissement.email}`} color="purple" />
                                      </div>
                                  </div>
                              </div>

                              {/* NEW: Human Capital */}
                              {(etablissement.effectifTotal || etablissement.nombrePersonnel) && (
                                  <div className="bg-white dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                          <Users className="text-orange-500" size={18} /> {t('infos.human_capital')}
                                      </h3>
                                      <div className="grid grid-cols-2 gap-3">
                                          <InfoField label={t('infos.total_staff')} value={etablissement.effectifTotal || etablissement.nombrePersonnel} suffix={t('units.people')} />
                                          <InfoField label="Cadres" value={etablissement.cadre || t('values.not_specified')} />
                                      </div>
                                  </div>
                              )}

                              {/* NEW: Gestion & Budget */}
                              <div className="bg-white dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                      <BarChart3 className="text-emerald-500" size={18} /> {t('infos.budget_management')}
                                  </h3>
                                  <div className="space-y-4">
                                      <InfoField label={t('infos.tutelle')} value={etablissement.tutelle} />
                                      <div className="grid grid-cols-2 gap-3">
                                          <InfoField label={t('infos.budget_annual')} value={etablissement.budgetAnnuel} suffix="MAD" />
                                          <InfoField label="Investissement" value={etablissement.inputBudget} suffix="MAD" />
                                      </div>
                                      <div>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-2">{t('infos.financing_sources')}</p>
                                          {etablissement.sourcesFinancement ? (
                                              <div className="flex flex-wrap gap-2">
                                                  {etablissement.sourcesFinancement.split(',').map((s: string, i: number) => (
                                                      <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-wide">
                                                          {s.trim()}
                                                      </span>
                                                  ))}
                                              </div>
                                          ) : (
                                              <span className="text-xs text-slate-400 italic">{t('values.not_specified')}</span>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-6">
                              {/* INFRASTRUCTURE STATUS - Dark Theme Card */}
                              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                                  
                                  <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
                                      <ShieldCheck className="text-emerald-400" size={24} /> {t('infos.infrastructure_status')}
                                  </h3>
                                  
                                  <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                                      <div className="bg-white/10 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                          <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 tracking-widest">{t('infos.general_state')}</p>
                                          <p className="text-xl font-black text-emerald-300">{etablissement.etatInfrastructure || t('values.not_provided')}</p>
                                      </div>
                                      <div className="bg-white/10 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                          <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 tracking-widest">{t('infos.accessibility')}</p>
                                          <p className="text-xl font-black text-blue-300">{etablissement.accessibilite || t('values.not_provided')}</p>
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-4 relative z-10">
                                      <UtilityRow label={t('infos.water')} value={etablissement.disponibiliteEau} t={t} />
                                      <UtilityRow label={t('infos.electricity')} value={etablissement.disponibiliteElectricite} t={t} />
                                      <UtilityRow label={t('infos.internet')} value={etablissement.connexionInternet} t={t} />
                                  </div>
                              </div>

                              {/* NEW: Pedagogical Stats (Education) */}
                              {etablissement.secteur === 'EDUCATION' && (
                                  <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-[2.5rem] border border-blue-100 dark:border-blue-800 shadow-sm relative overflow-hidden">
                                      <div className="absolute -right-6 -top-6 text-blue-100 dark:text-blue-900/20 opacity-50">
                                          <GraduationCap size={120} />
                                      </div>
                                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                                          <GraduationCap className="text-blue-600" size={20} /> {t('infos.students_stats')}
                                      </h3>
                                      <div className="grid grid-cols-2 gap-6 relative z-10">
                                          <InfoField label={t('infos.total_students')} value={etablissement.elevesTotal} />
                                          <InfoField label={t('infos.girls')} value={etablissement.elevesFilles} />
                                          <InfoField label={t('infos.success_rate')} value={etablissement.tauxReussite ? `${etablissement.tauxReussite}%` : null} className="col-span-2" />
                                      </div>
                                  </div>
                              )}

                              {/* NEW: Strategic Diagnostic */}
                               <div className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                          <Activity className="text-red-500" size={20} /> {t('infos.strategic_diagnosis')}
                                      </h3>
                                      <div className="space-y-4">
                                          {etablissement.besoinsUrgents ? (
                                              <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-3xl border border-red-100 dark:border-red-900/20">
                                                  <p className="text-[10px] text-red-500 uppercase font-black mb-2 tracking-widest">{t('infos.urgent_needs')}</p>
                                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{etablissement.besoinsUrgents}</p>
                                              </div>
                                          ) : (
                                              <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                                  <p className="text-xs font-medium text-slate-400 italic">{t('infos.no_urgent_needs')}</p>
                                              </div>
                                          )}

                                          {etablissement.projetsFuturs && (
                                              <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/20">
                                                  <p className="text-[10px] text-blue-500 uppercase font-black mb-2 tracking-widest">{t('infos.future_projects')}</p>
                                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{etablissement.projetsFuturs}</p>
                                              </div>
                                          )}
                                      </div>
                                  </div>

                                  {/* NEW: Caractéristiques Techniques */}
                                  <div className="bg-white dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                          <Wrench className="text-slate-500" size={18} /> {t('infos.technical_specs')}
                                      </h3>
                                      <div className="grid grid-cols-2 gap-4">
                                          <InfoField label={t('infos.surface_total')} value={etablissement.surfaceTotale} suffix="m²" />
                                          <InfoField label={t('infos.rooms_count')} value={etablissement.nombreSalles} />
                                      </div>
                                  </div>
                              </div>
                           </div>
                   )}

                   {/* 2. DETAIL SCORE & PERFORMANCE */}
                   {currentSlide === 2 && (
                      <div className="grid md:grid-cols-2 gap-8">
                         <div className="bg-white dark:bg-slate-950 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">{t('score.composition')}</h3>
                            
                            {/* Radar Chart Integration */}
                            {(chartData.length > 2) ? (
                                <div className="h-64 mb-6 relative -ml-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                            <PolarGrid gridType="polygon" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                            <Radar
                                                name="Points"
                                                dataKey="A"
                                                stroke="#2563eb"
                                                fill="#3b82f6"
                                                fillOpacity={0.6}
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ color: '#1e293b', fontWeight: 'bold', fontSize: '12px' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-center text-xs mb-6">
                                    {t('score.no_data')}
                                </div>
                            )}

                            <div className="space-y-4">
                               {scoreDetails.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 transition-colors">
                                      <div className="flex items-center gap-4">
                                         <div className={`w-10 h-10 rounded-xl ${item.color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
                                            <item.icon size={20} className={item.color} />
                                         </div>
                                         <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                                            <p className="text-xs text-slate-400">{t('score.weight')}: x {Math.abs(item.pts)}</p>
                                         </div>
                                      </div>
                                      <div className="text-right">
                                         <p className={`font-black text-lg ${item.isNegative ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {item.isNegative ? '' : '+'}{item.total}
                                         </p>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-6">
                            <div className="bg-blue-600 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                               <div className="relative z-10">
                                   <TrendingUp size={40} className="mb-4 text-blue-200" />
                                   <h3 className="text-xl font-black mb-2">{t('score.impact_analysis')}</h3>
                                   <p className="text-blue-100 text-sm leading-relaxed mb-6">
                                      {t('score.impact_text_part1')} <strong>{t('labels.events')}</strong> ({events} réalisés).
                                   </p>
                               </div>
                            </div>
                         </div>
                      </div>
                   )}

                   {/* 3. LIVE - URGENCES & NEWS */}
                   {currentSlide === 3 && (
                      <div className="space-y-8">
                         
                         {/* Reclamations Section */}
                         <div>
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Zap className="text-gov-blue" /> {t('live.title')}
                                </h3>
                                {loading && <span className="text-xs text-slate-400 animate-pulse">Sync...</span>}
                             </div>

                             {(details?.data?.reclamations?.length > 0) ? (
                               <div className="grid gap-3">
                                  {details.data.reclamations.map((rec: any) => (
                                     <div key={rec.id} className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4">
                                        <div className="min-w-0 flex-1">
                                           <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {new Date(rec.createdAt).toLocaleDateString(locale)}
                                                </span>
                                           </div>
                                           <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{rec.titre}</h4>
                                           <p className="text-slate-500 text-xs mt-1 line-clamp-2">{rec.description}</p>
                                        </div>
                                        <div className="sm:self-center">
                                            <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs uppercase ${
                                                rec.statut === 'EN_ATTENTE' ? 'bg-amber-100 text-amber-700' : 
                                                rec.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-700' : 
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {rec.statut?.replace('_', ' ') || 'En attente'}
                                            </span>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                             ) : (
                               <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800">
                                   <CheckCircle className="mx-auto text-emerald-400 mb-3" size={32} />
                                   <p className="font-bold text-slate-900 dark:text-white">{t('live.no_alerts')}</p>
                                   <p className="text-xs text-slate-400 mt-1">{t('live.no_alerts_msg')}</p>
                               </div>
                             )}
                         </div>
                         
                         {/* Events List */}
                         {details?.data?.evenements?.length > 0 && (
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Calendar className="text-purple-500" size={20} /> {t('live.upcoming_events')}
                                </h3>
                                <div className="grid gap-3">
                                    {details.data.evenements.map((evt: any) => (
                                        <a 
                                            key={evt.id} 
                                            href={`/${locale}/evenements/${evt.id}`}
                                            target="_blank"
                                            className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20 group hover:bg-purple-100 dark:hover:bg-purple-900/20 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md relative"
                                        >
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 text-purple-600 rounded-xl flex flex-col items-center justify-center shrink-0 font-black shadow-sm">
                                                <span className="text-base leading-none">{new Date(evt.dateDebut).getDate()}</span>
                                                <span className="text-[9px] uppercase opacity-60 leading-none mt-0.5">{new Date(evt.dateDebut).toLocaleString(locale, {month:'short'})}</span>
                                            </div>
                                            <div className="ml-4 min-w-0 flex-1">
                                                <p className="font-bold text-slate-900 dark:text-white truncate text-sm group-hover:text-purple-700 transition-colors">{evt.titre}</p>
                                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{evt.typeCategorique}</p>
                                            </div>
                                            
                                            {/* Action Indicator */}
                                            <div className="w-8 h-8 rounded-full bg-white text-purple-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm scale-90 group-hover:scale-100">
                                                <ArrowUpRight size={16} />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                         )}
                      </div>
                   )}

                   {/* 4. DOCS & GALERIE */}
                   {currentSlide === 4 && (
                      <div className="space-y-8">
                           <div className="text-center mb-6">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('docs.title')}</h3>
                                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                                    {t('docs.desc')}
                                </p>
                           </div>

                           {/* GALERIE PHOTOS */}
                           {((etablissement.medias && etablissement.medias.some((m: any) => m.type === 'IMAGE' || m.type === 'image')) || etablissement.photoPrincipale) && (
                                <div className="space-y-4">
                                     <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <Eye className="text-purple-500" size={20} /> {t('docs.gallery_title')}
                                     </h4>
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                         {etablissement.photoPrincipale && (
                                             <div className="aspect-video relative rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-all" onClick={() => window.open(etablissement.photoPrincipale, '_blank')}>
                                                 <img src={etablissement.photoPrincipale} alt="Principal" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                     <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                 </div>
                                             </div>
                                         )}
                                         {etablissement.medias?.filter((m: any) => m.type === 'IMAGE' || m.type === 'image').map((img: any, i: number) => (
                                              <div key={img.id || i} className="aspect-video relative rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-lg transition-all" onClick={() => window.open(img.urlPublique, '_blank')}>
                                                 <img src={img.urlPublique} alt={img.nomFichier || 'Gallery image'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                     <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                           )}

                           {/* DOCUMENTS LIST */}
                           <div className="space-y-4">
                               <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText className="text-blue-500" size={20} /> {t('docs.docs_list_title')}
                               </h4>
                               
                               {(etablissement.medias && etablissement.medias.filter((m: any) => m.type !== 'IMAGE' && m.type !== 'image').length > 0) ? (
                                  <div className="grid gap-3">
                                      {etablissement.medias.filter((m: any) => m.type !== 'IMAGE' && m.type !== 'image').map((doc: any, i: number) => (
                                          <div key={doc.id || i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-gov-blue/20 transition-all group cursor-pointer" onClick={() => window.open(doc.urlPublique, '_blank')}>
                                              <div className="flex items-center gap-4">
                                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform`}>
                                                      <FileText size={20} />
                                                  </div>
                                                  <div>
                                                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">{doc.nomFichier || doc.nom || `Document ${i + 1}`}</p>
                                                      <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{doc.type || 'Fichier'}</span>
                                                      </div>
                                                  </div>
                                              </div>
                                              <button className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-colors">
                                                  <Download size={16} />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                               ) : (
                                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800">
                                       <FileBadge className="mx-auto text-slate-300 mb-3" size={32} />
                                       <p className="font-bold text-slate-900 dark:text-white">{t('docs.no_docs_title')}</p>
                                       <p className="text-xs text-slate-400 mt-1">{t('docs.no_docs_msg')}</p>
                                   </div>
                               )}
                           </div>
                      </div>
                   )}

                  </motion.div>
                </AnimatePresence>
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helpers
function InfoField({ label, value, icon: Icon, suffix, className }: any) {
    if (!value && value !== 0) return null;
    return (
        <div className={`bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-colors ${className}`}>
            <div className="flex justify-between items-start mb-1 gap-2">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider truncate">{label}</p>
                {Icon && <Icon size={14} className="text-slate-300 shrink-0" />}
            </div>
            <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                {value} {suffix && <span className="text-[10px] text-slate-400 font-bold ml-0.5">{suffix}</span>}
            </p>
        </div>
    );
}

function ContactField({ icon: Icon, label, value, href, color }: any) {
    if (!value) return null;
    const colors: any = {
        blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
        purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
    };

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800 hover:border-slate-300 transition-all group cursor-pointer">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${colors[color]}`}>
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">{label}</span>
                <p className="font-black text-slate-900 dark:text-white truncate text-sm">{value}</p>
            </div>
        </a>
    );
}

function UtilityRow({ label, value, t }: { label: string, value: boolean | null, t: any }) {
    if (value === null) return null; // Don't show if unknown
    return (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <span className="text-sm font-medium opacity-80">{label}</span>
            {value ? (
                <div className="flex items-center gap-2 text-emerald-400">
                    <span className="text-xs font-bold uppercase">{t('values.connected')}</span>
                    <CheckCircle size={18} />
                </div>
            ) : (
                <div className="flex items-center gap-2 text-red-400">
                     <span className="text-xs font-bold uppercase">{t('values.not_connected')}</span>
                     <AlertCircle size={18} />
                </div>
            )}
        </div>
    );
}

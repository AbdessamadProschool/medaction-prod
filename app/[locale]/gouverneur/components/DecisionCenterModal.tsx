'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Building2, MapPin, Phone, Mail, Globe, GraduationCap, 
  BarChart3, Star, Users, Calendar, Megaphone,
  ShieldCheck, AlertTriangle, TrendingUp, Zap,
  FileText, Activity, ArrowDownToLine, CheckCircle, Info,
  Stethoscope, Wrench, UserSquare2, Download, Eye, FileBadge,
  AlertCircle, Clock, ArrowRight, Layout, Monitor,
  FileCheck2, FileOutput, ClipboardCheck, Search, Filter, Layers,
  Construction, Briefcase, HeartPulse, Sparkles, MessageSquare, AlignLeft, Shield
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { getEtabScore } from '@/lib/scoring';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';

interface Props {
  etablissement: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function DecisionCenterModal({ etablissement: initialEtab, isOpen, onClose }: Props) {
  const t = useTranslations('decision_center');
  const tSectors = useTranslations('sectors');
  const currentLocale = useLocale();
  const locale = currentLocale === 'ar' ? 'ar' : 'fr';
  const isRTL = locale === 'ar';
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [filterType, setFilterType] = useState('ALL'); 
  const [showBilan, setShowBilan] = useState<any>(null);

  const etablissement = details?.data ? { ...initialEtab, ...details.data } : initialEtab;

  function isInformative(val: any) {
    if (val === null || val === undefined || val === "") return false;
    const str = String(val).toLowerCase().trim();
    const placeholders = [
      "null", "undefined", "nan",
      "non fourni", "non spécifié", "non renseigné", "a renseigner",
      "غير محدد", "غير متوفر", "لا يوجد", "none", "unknown", "n/a", "pas de données"
    ];
    // Reject strictly placeholder 0s, but allow genuine numeric values if they are informative
    if (str === "0" || str === "0.0") return false; 
    return !placeholders.includes(str);
  };

  const getVal = (field: string, rootOnly = false) => {
    if (!etablissement) return null;
    const root = etablissement[field];
    if (isInformative(root)) return root;

    // Convert keys to string format for robust checking
    const dbFormatField = field;
    const lowerField = field.toLowerCase();
    
    // Check direct lowercase field variations
    if (isInformative(etablissement[lowerField])) return etablissement[lowerField];
    const camelCaseField = field.charAt(0).toUpperCase() + field.slice(1);
    if (isInformative(etablissement[camelCaseField])) return etablissement[camelCaseField];
    if (isInformative(etablissement[field.toUpperCase()])) return etablissement[field.toUpperCase()];

    if (rootOnly) return null;
    
    const spec = etablissement.donneesSpecifiques || {};
    if (isInformative(spec[dbFormatField])) return spec[dbFormatField];
    if (isInformative(spec[lowerField])) return spec[lowerField];
    if (isInformative(spec[camelCaseField])) return spec[camelCaseField];
    if (isInformative(spec[field.toUpperCase()])) return spec[field.toUpperCase()];

    return null;
  };

  const translateValue = (field: string, val: any) => {
    if (!isInformative(val)) return null;
    const s = String(val).toLowerCase().trim();
    if (s === 'oui' || s === 'true' || s === 'yes') return t('status.active');
    if (s === 'non' || s === 'false' || s === 'no') return t('status.not_available');
    
    // Traductions communes des types/structures (BD en français)
    const translations: any = {
      'ecole primaire autonome': currentLocale === 'ar' ? 'مدرسة ابتدائية مستقلة' : val,
      'etablissement de l\'enseignement primaire': currentLocale === 'ar' ? 'مؤسسة التعليم الابتدائي' : val,
      'public': currentLocale === 'ar' ? 'عمومي' : val,
      'prive': currentLocale === 'ar' ? 'خصوصي' : val,
      'urbain': currentLocale === 'ar' ? 'حضري' : val,
      'rural': currentLocale === 'ar' ? 'قروي' : val
    };
    if (translations[s]) return translations[s];

    // Secteurs
    if (field === 'secteur') return tSectors(s);
    
    return val;
  };

  useEffect(() => {
    if (isOpen && initialEtab?.id) {
        setLoading(true);
        fetch(`/api/etablissements/${initialEtab.id}`)
            .then(res => res.json())
            .then(data => {
                setDetails(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setLoading(false);
            });
    } else {
        setDetails(null);
    }
  }, [isOpen, initialEtab?.id]);

  if (!etablissement) return null;

  const counts = details?.data?._count || initialEtab.stats || {};
  const events = counts.evenements || 0;
  const reclamations = counts.reclamations || 0;
  const abonnements = counts.abonnements || 0;
  const reviewsCount = counts.evaluations || 0;
  const news = counts.actualites || 0;
  const activities = counts.programmesActivites || 0;
  const rating = etablissement.noteMoyenne || 0;

  const score = getEtabScore({
      evenementsCount: events,
      activitesCount: activities,
      reclamationsCount: reclamations,
      evaluationsCount: reviewsCount,
      abonnementsCount: abonnements,
      actualitesCount: news,
      noteMoyenne: rating
  });

  const getRank = (s: number) => {
      if (s >= 90) return { label: 'S', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/50', desc: t('rank.s') };
      if (s >= 70) return { label: 'A', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/50', desc: t('rank.a') };
      if (s >= 50) return { label: 'B', color: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-500/50', desc: t('rank.b') };
      if (s >= 30) return { label: 'C', color: 'text-orange-400', bg: 'bg-orange-950/40', border: 'border-orange-500/50', desc: t('rank.c') };
      return { label: 'D', color: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-500/50', desc: t('rank.d') };
  };
  const rank = getRank(score);

  const slides = [
    { id: 'overview', title: t('tabs.overview'), icon: Layout },
    { id: 'infos', title: t('tabs.infos'), icon: Building2 },
    { id: 'performance', title: t('tabs.performance'), icon: BarChart3 },
    { id: 'live', title: t('tabs.live'), icon: Clock },
    { id: 'docs', title: t('tabs.docs'), icon: FileBadge }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl"
           onClick={onClose}
        >
          <motion.div
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.95, opacity: 0 }}
             onClick={(e) => e.stopPropagation()}
             className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] w-full max-w-[100vw] h-[96vh] flex flex-col overflow-hidden border border-white/5 relative xl:max-w-[1450px]"
          >
             {/* 🎖️ HEADER - LISIBILITÉ ACCRUE */}
             <header className="bg-slate-950 px-8 py-6 shrink-0 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border ${rank.border} ${rank.bg} ${rank.color} shadow-lg`}>
                        <span className="text-xl font-black leading-none">{rank.label}</span>
                        <span className="text-[8px] font-black opacity-40 uppercase">{t('labels.rank')}</span>
                    </div>
                    
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-tight border border-blue-500/20">
                                {tSectors(etablissement.secteur?.toLowerCase())}
                            </span>
                            <span className="text-slate-600 text-[10px] font-black uppercase">ID: {etablissement.id}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase truncate max-w-[300px] sm:max-w-xl">{etablissement.nom}</h2>
                        <div className="flex items-center gap-4 text-slate-500 text-xs font-bold">
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {etablissement.communeNom || etablissement.commune?.nom}</span>
                            <span className="flex items-center gap-1.5"><Users size={14} /> {abonnements} {t('labels.subscribers')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex gap-8 border-l border-white/10 pl-8">
                         <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('labels.performance_index')}</p>
                             <p className="text-2xl font-black text-white">{score}%</p>
                         </div>
                         <div className="text-right">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('labels.social_score')}</p>
                             <p className="text-2xl font-black text-amber-500 flex items-center justify-end gap-1">
                                {rating} <span className="text-xs opacity-30 pt-1">/5</span>
                             </p>
                         </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-red-500 hover:text-white rounded-2xl text-white transition-all border border-white/5 group">
                        <X size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
             </header>

             {/* 🧭 NAVIGATION TABS - LISIBLES */}
             <nav className="bg-slate-950 px-8 flex gap-2 overflow-x-auto no-scrollbar shrink-0 border-b border-white/5">
                {slides.map((s, idx) => (
                   <button 
                     key={s.id} 
                     onClick={() => setCurrentSlide(idx)}
                     className={`flex items-center gap-3 px-6 py-4 rounded-t-2xl transition-all relative top-[1px] ${
                        currentSlide === idx 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                     }`}
                   >
                      <s.icon size={16} className={currentSlide === idx ? 'text-blue-500' : ''} />
                      <span className="text-xs font-black uppercase tracking-wider whitespace-nowrap">{s.title}</span>
                      {currentSlide === idx && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />}
                   </button>
                ))}
             </nav>

             {/* 📖 CONTENT - MORE COMPACT */}
             <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 no-scrollbar">
               <AnimatePresence mode='wait'>
                 <motion.div 
                   key={currentSlide}
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.98 }}
                   className="h-full max-w-[1350px] mx-auto"
                 >
                   
                   {/* 0. COMMAND CENTER - LISIBILITÉ ACCRUE */}
                   {currentSlide === 0 && (
                      <div className="grid lg:grid-cols-4 gap-8 animate-in fade-in duration-500">
                          <div className="lg:col-span-1 space-y-6">
                              <div className={`p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between group min-h-[220px] ${etablissement.besoinsUrgents ? 'bg-red-600' : 'bg-slate-900'} text-white relative overflow-hidden backdrop-blur-md`}>
                                  <Zap className="absolute -top-6 -right-6 opacity-5" size={120} />
                                  <div className="relative z-10">
                                      <div className="px-3 py-1 bg-white/20 rounded-md text-[10px] font-black uppercase w-fit mb-3 tracking-widest">{t('labels.emergency_diag')}</div>
                                      <h3 className="text-xl font-black mb-2 uppercase">{etablissement.besoinsUrgents ? t('status.urgent_alert') : t('status.normal_ops')}</h3>
                                      <p className="text-[10px] text-white/70 font-bold leading-relaxed mb-4 italic pl-3 border-l-2 border-white/20">
                                          {t('labels.decision_report_desc')}
                                      </p>
                                      <p className="text-xs text-white/90 font-bold leading-relaxed line-clamp-2 pl-3 border-l-2 border-white/20">
                                          {etablissement.besoinsUrgents || t('status.nominal') + " " + t('status.no_emergency')}
                                      </p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                        toast.success("Génération du rapport de décision en cours...");
                                        setTimeout(() => window.print(), 1000);
                                    }}
                                    className="mt-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-50 transition-all shadow-lg active:scale-95"
                                  >
                                    {t('labels.decision_report')}
                                  </button>
                              </div>

                              <div className="bg-white dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-50 dark:border-white/5 pb-3">
                                      <Monitor size={14} className="text-blue-500" /> {t('labels.utility_status')}
                                  </h4>
                                  <div className="space-y-3">
                                      <StatusTag label={t('utilities.water')} active={getVal('disponibiliteEau')} />
                                      <StatusTag label={t('utilities.electricity')} active={getVal('disponibiliteElectricite')} />
                                      <StatusTag label={t('utilities.internet')} active={getVal('connexionInternet')} />
                                  </div>
                              </div>
                          </div>

                          <div className="lg:col-span-3 space-y-8">
                              <div className="grid sm:grid-cols-3 gap-6">
                                  <StatMetric icon={Calendar} label={t('labels.events')} value={events} color="blue" trend="+12%" />
                                  <StatMetric icon={Activity} label={t('labels.activities')} value={activities} color="purple" trend="Stable" />
                                  <StatMetric icon={AlertTriangle} label={t('labels.reclamations')} value={reclamations} color="red" negative trend="-5%" />
                              </div>

                              <div className="grid lg:grid-cols-2 gap-8">
                                  <div className="bg-white dark:bg-slate-950 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden shadow-sm">
                                   <h4 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center justify-between tracking-widest">
                                       {t('labels.activity_log')} <Zap size={16} className="text-blue-500" />
                                   </h4>
                                   <div className="space-y-4">
                                       {(() => {
                                           const flow = [
                                               ...(details?.data?.evenements || []).map((e: any) => ({ ...e, _type: 'EVENT' })),
                                               ...(details?.data?.actualites || []).map((n: any) => ({ ...n, _type: 'NEWS' }))
                                           ].sort((a,b) => new Date(b.createdAt || b.dateDebut).getTime() - new Date(a.createdAt || a.dateDebut).getTime())
                                            .slice(0, 4);

                                           if (flow.length === 0) return <p className="py-14 text-center text-slate-300 italic text-sm">{t('labels.no_activity')}</p>;

                                           return flow.map((item: any, i: number) => (
                                               <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl group border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all cursor-pointer">
                                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${item._type === 'NEWS' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                       {item._type === 'NEWS' ? <Megaphone size={18} /> : <Calendar size={18} />}
                                                   </div>
                                                   <div className="min-w-0 flex-1">
                                                       <p className="text-sm font-black truncate uppercase leading-tight mb-1">{item.titre}</p>
                                                       <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(item.createdAt || item.dateDebut).toLocaleDateString()}</span>
                                                          <span className={`px-2 py-0.5 rounded-full ${item._type === 'NEWS' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>{item._type === 'NEWS' ? 'NEWS' : 'EVENT'}</span>
                                                       </div>
                                                   </div>
                                                   <ArrowRight size={14} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                                               </div>
                                           ));
                                       })()}
                                   </div>
                                </div>
                                <div className="bg-white dark:bg-slate-950 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                     <h4 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2">
                                         {t('labels.citizen_watch')} <Star size={16} className="text-amber-500" />
                                     </h4>
                                     <div className="space-y-5">
                                         {(details?.data?.evaluations || []).slice(0, 2).map((rev: any, i: number) => (
                                             <div key={i} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl relative border border-slate-50 dark:border-white/5">
                                                 <div className="flex justify-between items-center mb-2">
                                                     <div className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-500 truncate"><UserSquare2 size={12} /> {rev.user?.nom}</div>
                                                     <div className="flex text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg scale-90">
                                                         {[...Array(5)].map((_, j) => <Star key={j} size={12} fill={j < rev.noteGlobale ? "currentColor" : "none"} />)}
                                                     </div>
                                                 </div>
                                                 <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-bold italic line-clamp-2">"{rev.commentaire}"</p>
                                             </div>
                                         ))}
                                         {(details?.data?.evaluations?.length === 0) && (
                                             <div className="text-center py-14">
                                                 <MessageSquare className="mx-auto text-slate-200 mb-4" size={40} />
                                                 <p className="text-slate-300 italic text-sm">{t('labels.no_citizen_reviews')}</p>
                                             </div>
                                         )}
                                     </div>
                                </div>
                              </div>
                          </div>
                      </div>
                   )}

                    {/* 1. INFOS - DÉTAILS COMPLETS DE LA BD */}
                    {currentSlide === 1 && (
                       <div className="space-y-8 pb-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                 {/* 🏛️ PANEL GOUVERNANCE */}
                                 <SpecPanel title={t('infos.gouvernance')} icon={ShieldCheck} color="blue">
                                    <SpecLine label={t('infos.directeur')} value={translateValue('responsableNom', getVal('responsableNom'))} icon={UserSquare2} />
                                    <SpecLine label={t('infos.tutelle')} value={translateValue('tutelle', getVal('tutelle'))} icon={Building2} />
                                    <SpecLine label={t('infos.gestionnaire')} value={translateValue('gestionnaire', getVal('gestionnaire'))} icon={Briefcase} />
                                    <SpecLine label={t('infos.structure')} value={translateValue('typeEtablissement', getVal('typeEtablissement'))} icon={Layers} />
                                    <SpecLine label={t('extra_fields.creation_year')} value={getVal('anneeCreation')} icon={Calendar} />
                                    <SpecLine label={t('infos.nature')} value={translateValue('nature', getVal('nature'))} icon={ShieldCheck} />
                                    <SpecLine label={t('infos.statut')} value={translateValue('statutJuridique', getVal('statutJuridique'))} icon={FileText} />
                                    <SpecLine label={t('infos.statut_fonctionnel')} value={translateValue('statutFonctionnel', getVal('statutFonctionnel'))} icon={Activity} />
                                </SpecPanel>

                                {/* 📦 PANEL LOGISTIQUE & RH */}
                                <SpecPanel title={t('infos.logistique')} icon={Construction} color="purple">
                                    <SpecLine label={t('labels.rh_total')} value={getVal('effectifTotal')} icon={Users} />
                                    <SpecLine label={t('extra_fields.staff')} value={getVal('nombrePersonnel')} icon={UserSquare2} />
                                    <SpecLine label={t('extra_fields.executives')} value={getVal('nbCadres') || getVal('executives')} icon={Briefcase} />
                                    <SpecLine label={t('labels.capacity')} value={getVal('capaciteAccueil')} icon={Layout} />
                                    <SpecLine label={t('extra_fields.infra_state')} value={translateValue('etatInfrastructure', getVal('etatInfrastructure'))} icon={Shield} />
                                    <SpecLine label={t('infos.cadre')} value={translateValue('cadre', getVal('cadre'))} icon={Briefcase} />
                                    <SpecLine label={t('infos.unites')} value={getVal('nombreSalles')} icon={Layers} />
                                    
                                    {etablissement.secteur === 'EDUCATION' && (
                                        <>
                                            <SpecLine label={t('infos.unites')} value={getVal('nbClasses')} suffix="Classes" icon={Layout} />
                                            <SpecLine label={t('infos.cadre')} value={getVal('nbEnseignants')} suffix="Ens." icon={Users} />
                                        </>
                                    )}
                                    <SpecLine label={t('infos.ouverture')} value={getVal('anneeOuverture')} icon={Clock} />
                                </SpecPanel>

                                {/* 📐 PANEL SPÉCIFICATIONS TECHNIQUES */}
                                <SpecPanel title={t('infos.specifications')} icon={TrendingUp} color="emerald">
                                    <SpecLine label={t('infos.surface')} value={translateValue('surfaceTotale', getVal('surfaceTotale'))} suffix="m²" icon={MapPin} />
                                    <SpecLine label={t('infos.budget')} value={translateValue('budgetAnnuel', getVal('budgetAnnuel'))} suffix="MAD" icon={BarChart3} />
                                    <SpecLine label={t('extra_fields.accessibility')} value={translateValue('accessibilite', getVal('accessibilite'))} icon={Globe} />
                                    <SpecLine label={t('extra_fields.zone')} value={translateValue('zoneTypologie', getVal('zoneTypologie'))} icon={MapPin} />
                                    
                                    {etablissement.secteur === 'EDUCATION' && (
                                        <>
                                            <SpecLine label={t('infos.type')} value={translateValue('cycle', getVal('cycle'))} icon={ShieldCheck} />
                                            <SpecLine label={t('infos.reussite')} value={getVal('tauxReussite')} suffix="%" icon={CheckCircle} />
                                            <SpecLine label={t('infos.apprenants')} value={getVal('elevesTotal')} icon={GraduationCap} />
                                            <SpecLine label={t('infos.prescolaire')} value={getVal('elevesPrescolaire')} icon={Users} />
                                            <SpecLine label={t('infos.filles')} value={getVal('elevesPrescolaireFilles')} icon={UserSquare2} />
                                            <SpecLine label={t('infos.abandon')} value={translateValue('tauxAbandon', getVal('tauxAbandon'))} suffix="%" icon={AlertCircle} />
                                        </>
                                    )}
                                </SpecPanel>

                                {/* 🧩 DONNÉES SPÉCIFIQUES - DYNAMIQUE */}
                                {etablissement.donneesSpecifiques && Object.keys(etablissement.donneesSpecifiques).length > 0 && (
                                    <SpecPanel title={t('infos.extra')} icon={Layers} color="blue">
                                        {Object.entries(etablissement.donneesSpecifiques).map(([key, val]: [string, any]) => {
                                            // Éviter d'afficher ce qui a déjà été affiché par getVal classique
                                            const knownFields = [
                                                'responsableNom', 'tutelle', 'gestionnaire', 'typeEtablissement', 'anneeCreation', 'nature', 'statutJuridique',
                                                'effectifTotal', 'nombrePersonnel', 'capaciteAccueil', 'etatInfrastructure', 'cadre', 'nombreSalles',
                                                'surfaceTotale', 'budgetAnnuel', 'accessibilite', 'zoneTypologie', 'statutFonctionnel', 'tauxAbandon', 'tauxReussite'
                                            ];
                                            if (knownFields.includes(key) || knownFields.includes(key.toLowerCase())) return null;
                                            
                                            // Éviter les doublons de clés (sensible à la casse dans l'objet source mais pas fonctionnellement)
                                            const normalizedKey = key.toLowerCase();
                                            if (Object.keys(etablissement.donneesSpecifiques).some(k => k.toLowerCase() === normalizedKey && k !== key && Object.keys(etablissement.donneesSpecifiques).indexOf(k) < Object.keys(etablissement.donneesSpecifiques).indexOf(key))) {
                                                return null;
                                            }

                                            const translationKey = Object.keys(t.raw('extra_fields')).find(k => k.toLowerCase() === key.toLowerCase());
                                            const label = translationKey ? t(`extra_fields.${translationKey}`) : key.charAt(0).toUpperCase() + key.slice(1);
                                            return <SpecLine key={key} label={label} value={translateValue(key, val)} icon={Info} />;
                                        })}
                                    </SpecPanel>
                                )}
                            </div>

                           <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                                     <div className="space-y-4">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 w-fit px-4 py-2 rounded-xl mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center"><MapPin size={18} /></div>
                                            {t('infos.localisation')}
                                        </h4>
                                        <div className="flex items-start gap-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                                             <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20"><MapPin size={32} /></div>
                                             <div className="min-w-0">
                                                 <p className="text-xs font-black text-blue-500 uppercase mb-2 tracking-widest">
                                                    {getVal('latitude') ? `${getVal('latitude')?.toFixed(5)}, ${getVal('longitude')?.toFixed(5)}` : t('labels.not_informative')}
                                                 </p>
                                                 <p className="text-base font-black text-slate-900 dark:text-white leading-relaxed uppercase">
                                                     {getVal('adresseComplete') || getVal('quartierDouar') || t('labels.address_not_provided')}
                                                 </p>
                                                 {getVal('codeCommune') && <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-tight">Source ID: {getVal('codeCommune')}</p>}
                                             </div>
                                        </div>
                                         <div className="flex gap-4 mt-2">
                                             <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${getVal('latitude')},${getVal('longitude')}`}
                                                target="_blank"
                                                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-600 transition-all border border-transparent hover:border-blue-100 flex items-center justify-center gap-3 group"
                                             >
                                                 <Globe size={14} className="text-blue-500 group-hover:scale-110 transition-transform" /> {t('labels.google_maps')}
                                             </a>
                                             <button 
                                                onClick={() => {
                                                    onClose();
                                                    window.location.href = `/${locale}/carte?id=${etablissement.id}`;
                                                }}
                                                className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-[10px] font-black uppercase text-white transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 group"
                                             >
                                                 <MapPin size={14} className="group-hover:animate-bounce" /> {t('labels.our_map')}
                                             </button>
                                         </div>
                                    </div>
                                    
                                     {getVal('observation') && (
                                        <div className="p-6 bg-blue-50 dark:bg-blue-500/5 rounded-3xl border border-blue-100 dark:border-blue-500/20 shadow-sm">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase mb-3">
                                                <Info size={14} /> {t('infos.observation')}
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold italic leading-relaxed">"{getVal('observation')}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 w-fit px-4 py-2 rounded-xl mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center"><Phone size={18} /></div>
                                        {t('infos.contact')}
                                    </h4>
                                    <div className="grid gap-4">
                                        <ContactCard icon={Phone} value={getVal('telephone') || "05 22 55 44 33"} label={t('infos.telephone')} href={`tel:${getVal('telephone') || "0522554433"}`} color="blue" />
                                        <ContactCard icon={Mail} value={getVal('email') || "direction@medaction.ma"} label={t('infos.email')} href={`mailto:${getVal('email') || "direction@medaction.ma"}`} color="purple" />
                                        <ContactCard icon={Globe} value={getVal('siteWeb') || getVal('site_web')} label={t('infos.site_web')} href={getVal('siteWeb') || "https://www.medaction.ma"} color="emerald" />
                                    </div>
                                </div>
                           </div>
                       </div>
                    )}

                   {/* 2. PERFORMANCE HUB - LISIBILITÉ */}
                   {currentSlide === 2 && (
                      <div className="grid lg:grid-cols-2 gap-12 items-stretch h-full pb-10">
                         <div className="bg-white dark:bg-slate-950 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col items-center">
                            <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter">{t('performance.maturity_balance')}</h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10">{t('performance.indicators_5_pillars')}</p>
                            
                            <div className="flex-1 w-full min-h-[400px]">
                                {(() => {
                                    const radarData = [
                                        { subject: t('radar.engagement'), A: Math.min(events * 10, 100), fullMark: 100 },
                                        { subject: t('radar.social'), A: Math.min(activities * 5, 100), fullMark: 100 },
                                        { subject: t('radar.satisfaction'), A: Math.min(rating * 20, 100), fullMark: 100 },
                                        { subject: t('radar.subscribers'), A: Math.min(abonnements / 2, 100), fullMark: 100 },
                                        { subject: t('radar.news'), A: Math.min(news * 15, 100), fullMark: 100 },
                                    ];
                                    return (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                                <PolarGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: '900' }} />
                                                <Radar name="Performance" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} dot={{ r: 4, fill: '#3b82f6' }} />
                                                <Tooltip content={<SimpleTooltip />} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    );
                                })()}
                            </div>
                         </div>

                         <div className="space-y-8 flex flex-col">
                            <div className="p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl group relative overflow-hidden flex-1 flex flex-col justify-center border border-white/5">
                                <Sparkles className="absolute -top-12 -right-12 opacity-5 text-blue-500" size={200} />
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black mb-6 uppercase tracking-tight text-blue-400 drop-shadow-sm">{t('performance.strategic_analysis')}</h3>
                                    <p className="text-sm text-white/80 font-bold leading-relaxed italic border-l-4 border-blue-500 pl-6 mb-8">
                                        {score > 75 ? t('performance.high_efficiency_msg') : t('performance.stable_performance_msg')}
                                    </p>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <TrendingUp size={16} className="text-blue-500" /> {t('performance.positive_trend')}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <MetricsHero icon={CheckCircle} label={t('performance.resolution')} value="100%" color="emerald" sub={t('performance.closed_cases')} />
                                <MetricsHero icon={Activity} label={t('performance.impact')} value={t('performance.significant')} color="blue" sub={t('performance.local_reach')} />
                            </div>
                         </div>
                      </div>
                   )}

                   {/* 3. CHRONO JOURNAL - LISIBILITÉ */}
                   {currentSlide === 3 && (
                      <div className="flex flex-col h-full animate-in slide-in-from-bottom-5 duration-500">
                          <div className="flex items-center justify-between mb-8">
                               <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-2 rounded-2xl shadow-inner border border-slate-200/50 dark:border-white/5">
                                  {['ALL', 'EVENTS', 'NEWS', 'ACTIVITIES', 'RECLAMATIONS', 'COMMENTS'].map((type) => (
                                      <button
                                          key={type}
                                          onClick={() => setFilterType(type)}
                                          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                                              filterType === type ? 'bg-blue-600 text-white shadow-lg active:scale-95' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                          }`}
                                      >
                                          {t(`filters.${type.toLowerCase()}`)}
                                      </button>
                                  ))}
                               </div>
                          </div>

                          <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-20 pr-2">
                              {(() => {
                                  const combined: any[] = [];
                                  const data = details?.data || etablissement.presentation || {};
                                  
                                  if (filterType === 'ALL' || filterType === 'EVENTS') (data.evenements || []).forEach((e: any) => combined.push({ ...e, _tag: 'EVENT', _date: new Date(e.dateDebut) }));
                                  if (filterType === 'ALL' || filterType === 'NEWS') (data.actualites || []).forEach((n: any) => combined.push({ ...n, _tag: 'NEWS', _date: new Date(n.createdAt) }));
                                  if (filterType === 'ALL' || filterType === 'ACTIVITIES') (data.activites || []).forEach((a: any) => combined.push({ ...a, _tag: 'ACTIVITY', _date: new Date(a.date) }));
                                  if (filterType === 'ALL' || filterType === 'RECLAMATIONS') (data.reclamations || []).forEach((r: any) => combined.push({ ...r, _tag: 'RECLAMATION', _date: new Date(r.createdAt) }));
                                  if (filterType === 'ALL' || filterType === 'COMMENTS') (data.evaluations || []).forEach((r: any) => combined.push({ ...r, _tag: 'COMMENT', _date: new Date(r.createdAt) }));

                                  combined.sort((a, b) => b._date.getTime() - a._date.getTime());

                                  if (combined.length === 0) return (
                                      <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                          <Search size={48} className="mb-4 opacity-20" />
                                          <p className="font-black text-xs uppercase tracking-[0.2em]">{t('labels.no_activity')}</p>
                                      </div>
                                  );

                                  return combined.map((item, idx) => (
                                      <div key={idx} className="flex gap-6 group cursor-pointer" onClick={() => setShowBilan(item)}>
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
                                              item._tag === 'EVENT' ? 'bg-blue-600' : 
                                              item._tag === 'RECLAMATION' ? 'bg-red-600' : 
                                              item._tag === 'COMMENT' ? 'bg-amber-500' : 'bg-emerald-600'
                                          } text-white group-hover:scale-110 transition-transform`}>
                                              {item._tag === 'EVENT' ? <Calendar size={20} /> : item._tag === 'RECLAMATION' ? <AlertTriangle size={20} /> : item._tag === 'COMMENT' ? <Star size={20} /> : <Activity size={20} />}
                                          </div>
                                          <div className="flex-1 bg-white dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-blue-500/30 transition-all shadow-sm relative">
                                               <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">{new Date(item._date).toLocaleDateString(locale)}</span>
                                                    {item.statut && <span className={`text-[10px] font-black px-3 py-1 rounded-full ${item.statut === 'CLOTUREE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{t(`status.${item.statut.toLowerCase()}`)}</span>}
                                               </div>
                                               <h4 className="text-sm font-black uppercase mb-2 tracking-tight">{item.titre || (item._tag === 'COMMENT' ? t('media.citizen_watch') : t('media.institutional_action'))}</h4>
                                               <p className="text-xs text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed line-clamp-3">"{item.description || item.commentaire || t('media.no_comment')}"</p>
                                               <div className="mt-4 text-[10px] font-black text-blue-400 uppercase flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                                    <BarChart3 size={14} /> {t('modal.open_details')}
                                               </div>
                                          </div>
                                      </div>
                                  ));
                              })()}
                          </div>
                      </div>
                   )}

                   {/* 4. DOCUMENTS - LISIBILITÉ */}
                   {currentSlide === 4 && (
                      <div className="space-y-10 pb-20">
                           <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-5">
                                {etablissement.photoPrincipale && <MediaCard src={etablissement.photoPrincipale} label={t('media.main_facade')} />}
                                {etablissement.medias?.filter((m: any) => ['IMAGE', 'image'].includes(m.type)).slice(0, 15).map((img: any, i: number) => (
                                    <MediaCard key={i} src={img.urlPublique} label={`${t('media.field_view')} ${i+1}`} />
                                ))}
                           </div>

                           <div className="bg-white dark:bg-slate-950 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                               <h3 className="text-xs font-black uppercase text-slate-400 mb-8 flex items-center gap-3 border-b border-slate-50 dark:border-white/5 pb-4 tracking-[0.2em]">
                                   <FileBadge size={18} className="text-blue-500" /> {t('labels.technical_dossier')}
                               </h3>
                               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                   {etablissement.medias?.filter((m: any) => !['IMAGE', 'image'].includes(m.type)).map((doc: any, i: number) => (
                                       <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900 rounded-[2rem] group cursor-pointer border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20 hover:shadow-md transition-all" onClick={() => window.open(doc.urlPublique, '_blank')}>
                                           <div className="flex items-center gap-4 min-w-0">
                                               <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all"><FileText size={20} /></div>
                                               <p className="text-xs font-black truncate uppercase tracking-tight">{doc.nomFichier || doc.nom || t('media.tech_doc')}</p>
                                           </div>
                                           <Download size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                                       </div>
                                   ))}
                                   {(etablissement.medias?.filter((m: any) => !['IMAGE', 'image'].includes(m.type)).length === 0) && (
                                       <p className="text-center col-span-full py-10 text-slate-300 italic text-sm">{t('media.no_docs')}</p>
                                   )}
                               </div>
                           </div>
                      </div>
                   )}

                 </motion.div>
               </AnimatePresence>
             </div>

             {/* 📄 STRUCTURED PRINT REPORT - Professional & Clean */}
             <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 text-slate-950 overflow-y-auto">
                 {/* Header Protocolar */}
                 <div className="flex justify-between items-center border-b-4 border-slate-900 pb-8 mb-8">
                     <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-slate-900 rounded-none flex items-center justify-center text-white font-black text-4xl">M</div>
                         <div>
                             <h1 className="text-3xl font-black uppercase tracking-tighter mb-1 leading-none">{etablissement.nom}</h1>
                             <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Rapport de Situation Institutionnel - Province de Médiouna</p>
                         </div>
                     </div>
                     <div className="text-right border-l-2 border-slate-100 pl-8">
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Période du Rapport</p>
                         <p className="font-black text-xs uppercase">{new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</p>
                         <p className="text-[10px] font-bold text-slate-500 mt-1 italic">Édition du {new Date().toLocaleDateString(locale)}</p>
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-10">
                     {/* Identification & Gouvernance */}
                     <div className="space-y-8 text-left">
                         <section>
                             <h2 className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2.5 mb-5 flex justify-between items-center">
                                 <span>Gouvernance & Identification</span>
                                 <span className="opacity-50 text-[9px]">REF: {etablissement.id}</span>
                             </h2>
                             <div className="space-y-3 px-2">
                                 <div className="flex justify-between border-b border-slate-100 py-1.5">
                                     <span className="text-[10px] font-bold uppercase text-slate-500">Secteur</span>
                                     <span className="text-[10px] font-black">{tSectors(etablissement.secteur?.toLowerCase())}</span>
                                 </div>
                                 <div className="flex justify-between border-b border-slate-100 py-1.5">
                                     <span className="text-[10px] font-bold uppercase text-slate-500">Localisation</span>
                                     <span className="text-[10px] font-black">{etablissement.communeNom || etablissement.commune?.nom}</span>
                                 </div>
                                 <div className="flex justify-between border-b border-slate-100 py-1.5">
                                     <span className="text-[10px] font-bold uppercase text-slate-500">Responsable</span>
                                     <span className="text-[10px] font-black">{getVal('responsableNom') || 'NON RENSEIGNÉ'}</span>
                                 </div>
                                 <div className="flex justify-between border-b border-slate-100 py-1.5">
                                     <span className="text-[10px] font-bold uppercase text-slate-500">Tutelle</span>
                                     <span className="text-[10px] font-black">{getVal('tutelle') || 'MINISTÈRE'}</span>
                                 </div>
                             </div>
                         </section>

                         <section>
                             <h2 className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2.5 mb-5">Audit des Infrastructures</h2>
                             <div className="grid grid-cols-3 gap-3">
                                 <div className="p-3 bg-slate-50 border border-slate-200 text-center">
                                     <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">Eau</p>
                                     <p className="text-[10px] font-black">{getVal('disponibiliteEau') ? 'OUI' : 'NON'}</p>
                                 </div>
                                 <div className="p-3 bg-slate-50 border border-slate-200 text-center">
                                     <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">Élec</p>
                                     <p className="text-[10px] font-black">{getVal('disponibiliteElectricite') ? 'OUI' : 'NON'}</p>
                                 </div>
                                 <div className="p-3 bg-slate-50 border border-slate-200 text-center">
                                     <p className="text-[9px] font-black text-slate-400 mb-1 uppercase">Web</p>
                                     <p className="text-[10px] font-black">{getVal('connexionInternet') ? 'OUI' : 'NON'}</p>
                                 </div>
                             </div>
                         </section>
                     </div>

                     {/* Performance & Score */}
                     <div className="space-y-8">
                         <section>
                             <h2 className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2.5 mb-5 flex justify-between">
                                 <span>Indicateurs Stratégiques</span>
                                 <span className="opacity-50 text-[9px]">KPI SCORE</span>
                             </h2>
                             <div className="flex gap-4 mb-6">
                                 <div className="flex-1 p-5 border-2 border-slate-900 text-center">
                                     <p className="text-4xl font-black mb-1">{score}%</p>
                                     <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Maturité Digitale</p>
                                 </div>
                                 <div className="flex-1 p-5 border-2 border-slate-900 text-center">
                                     <p className="text-4xl font-black mb-1">{rating}/5</p>
                                     <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Perception Sociale</p>
                                 </div>
                             </div>
                             <div className="p-5 bg-slate-50 border border-slate-200">
                                 <h3 className="text-[10px] font-black uppercase mb-3 flex items-center gap-2">
                                     <AlignLeft size={12} /> Analyse Gouverneur
                                 </h3>
                                 <p className="text-[10px] font-bold text-slate-700 leading-relaxed italic border-l-4 border-slate-400 pl-4 py-1">
                                     {score > 75 ? t('performance.high_efficiency_msg') : t('performance.stable_performance_msg')}
                                 </p>
                             </div>
                         </section>
                     </div>
                 </div>

                 {/* Historical Log Section */}
                 <div className="mt-12">
                     <h2 className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2.5 mb-6">Chronologie des Actions Récentes</h2>
                     <div className="space-y-2">
                         {[
                             ...(details?.data?.evenements || []).map((e: any) => ({ ...e, _type: 'EVENT' })),
                             ...(details?.data?.actualites || []).map((n: any) => ({ ...n, _type: 'NEWS' })),
                             ...(details?.data?.reclamations || []).map((r: any) => ({ ...r, _type: 'RECLAMATION' }))
                         ].sort((a,b) => new Date(b.createdAt || b.dateDebut).getTime() - new Date(a.createdAt || a.dateDebut).getTime())
                          .slice(0, 5).map((item: any, i: number) => (
                             <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100">
                                 <div className="text-left flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter">{item._type}</span>
                                         <p className="text-[10px] font-black uppercase">{item.titre || item.objet || 'Intervention Institutionnelle'}</p>
                                     </div>
                                     <p className="text-[9px] text-slate-400 font-bold italic line-clamp-1">{item.description?.substring(0, 200)}</p>
                                 </div>
                                 <div className="text-right ml-10">
                                     <p className="text-[9px] font-black">{new Date(item.createdAt || item.dateDebut).toLocaleDateString()}</p>
                                     {item.statut && <p className="text-[7px] font-black text-slate-300 uppercase">{item.statut}</p>}
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Protocolar Signatures */}
                 <div className="mt-24 grid grid-cols-2 gap-20">
                     <div className="text-center">
                         <div className="mb-20">
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2">Signature du Responsable</p>
                             <p className="text-[10px] font-black uppercase">Direction de l'Établissement</p>
                         </div>
                         <div className="w-48 h-[1px] bg-slate-200 mx-auto"></div>
                     </div>
                     <div className="text-center">
                         <div className="mb-20">
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 mb-2">Approbation de la Province</p>
                             <p className="text-[10px] font-black uppercase">Cabinet de Monsieur le Gouverneur</p>
                         </div>
                         <div className="w-48 h-[1px] bg-slate-200 mx-auto"></div>
                     </div>
                 </div>

                 {/* Footer Security */}
                 <div className="fixed bottom-10 left-10 right-10 flex justify-between items-center text-[7px] font-bold uppercase text-slate-300 border-t border-slate-100 pt-4">
                     <p>Province de Médiouna - Système de Gestion Intégré des Équipements</p>
                     <p>Généré par @Antigravity - ID Session: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                     <p>Page 1 / 1 - Confidentiel</p>
                 </div>
             </div>

             {loading && (
                  <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm flex items-center justify-center z-[5000]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  </div>
             )}

             {/* ACTIVITY DETAILS MODAL */}
             <AnimatePresence>
                 {showBilan && (
                     <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[6000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
                        onClick={() => setShowBilan(null)}
                     >
                         <motion.div 
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden flex flex-col max-h-full"
                         >
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-start justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
                                <div className="min-w-0 pr-4">
                                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${
                                            showBilan._tag === 'EVENT' ? 'bg-blue-600' : 
                                            showBilan._tag === 'RECLAMATION' ? 'bg-red-600' : 
                                            showBilan._tag === 'COMMENT' ? 'bg-amber-500' : 'bg-emerald-600'
                                        }`}>
                                            {showBilan._tag === 'EVENT' ? <Calendar size={18} /> : showBilan._tag === 'RECLAMATION' ? <AlertTriangle size={18} /> : showBilan._tag === 'COMMENT' ? <Star size={18} /> : <Activity size={18} />}
                                        </span>
                                        <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full">{new Date(showBilan._date).toLocaleDateString(locale)}</span>
                                        {showBilan.statut && <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${showBilan.statut === 'CLOTUREE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{showBilan.statut}</span>}
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white break-words">{showBilan.titre || (showBilan._tag === 'COMMENT' ? t('media.citizen_watch') : t('media.institutional_action'))}</h3>
                                </div>
                                <button onClick={() => setShowBilan(null)} className="w-10 h-10 bg-slate-200/50 hover:bg-red-500 hover:text-white dark:bg-white/5 rounded-full flex items-center justify-center transition-colors shrink-0">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto space-y-8 flex-1">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-3"><AlignLeft size={14} /> {t('modal.description')}</h4>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{showBilan.description || showBilan.commentaire || t('media.no_comment')}</p>
                                </div>
                                
                                {showBilan.reponse && (
                                    <div className="p-6 bg-blue-50 dark:bg-blue-500/10 rounded-3xl border border-blue-100 dark:border-blue-500/20">
                                        <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-2 mb-3"><MessageSquare size={14} /> Réponse Officielle</h4>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">"{showBilan.reponse}"</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900 flex justify-between shrink-0">
                                {showBilan.id ? (
                                    <Link 
                                        href={`/${showBilan._tag === 'EVENT' ? 'evenements' : showBilan._tag === 'RECLAMATION' ? 'reclamations' : showBilan._tag === 'ACTIVITY' ? 'campagnes' : 'actualites'}/${showBilan.id}`} 
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                                    >
                                        <ArrowRight size={14} /> {t('modal.details')}
                                    </Link>
                                ) : <div />}
                                <button onClick={() => setShowBilan(null)} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-colors">
                                    {t('modal.close')}
                                </button>
                            </div>
                         </motion.div>
                     </motion.div>
                 )}
             </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// COMPACT HELPER COMPONENTS
function StatMetric({ icon: Icon, label, value, color, negative, trend }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20',
        purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20',
        red: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:border-red-500/20',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20'
    };
    return (
        <div className="bg-white dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:border-blue-500/20 transition-all shadow-sm">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-md ${colors[color] || 'bg-slate-50'}`}><Icon size={20} /></div>
            <p className="text-2xl font-black mb-1 leading-none tracking-tight">{value}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
            {trend && <div className={`text-[9px] font-black px-3 py-1 rounded-full ${negative ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>{trend}</div>}
        </div>
    );
}

function StatusTag({ label, active }: any) {
    const t = useTranslations('decision_center');
    const isActive = active && !['non', '0', 'no', 'false', 'off', 'غير متوفر'].includes(String(active).toLowerCase());
    return (
        <div className="flex items-center justify-between group py-1">
            <span className="text-[10px] font-bold text-slate-500 tracking-tight">{label}</span>
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-600'}`}>
                {isActive ? t('status.active') : t('status.not_available')}
            </div>
        </div>
    );
}

function SpecLine({ label, value, icon: Icon, suffix }: any) {
    if (!value || value === '0' || String(value).toLowerCase() === 'null') return null;
    
    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-50 dark:border-slate-800/50 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all group shadow-sm">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all"><Icon size={14} /></div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-tight">{label}</span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {value} {suffix}
            </span>
        </div>
    );
}

function SpecPanel({ title, icon: Icon, children, color }: any) {
    // Ne pas inclure le panneau entier si aucun enfant n'est valide
    const validChildren = React.Children.toArray(children).filter((child: any) => {
        if (child?.type === React.Fragment) {
            return React.Children.toArray(child.props.children).some((c: any) => {
                const val = c?.props?.value;
                return val && val !== '0' && String(val).toLowerCase() !== 'null';
            });
        }
        const val = child?.props?.value;
        return val && val !== '0' && String(val).toLowerCase() !== 'null';
    });
    
    if (validChildren.length === 0) return null;

    const colors: any = { blue: 'text-blue-500', purple: 'text-purple-500', emerald: 'text-emerald-500' };
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50 pb-4">
                <div className={`w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center ${colors[color]}`}><Icon size={16} /></div>
                <h4 className="text-xs font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white">{title}</h4>
            </div>
            <div className="grid gap-3">{children}</div>
        </div>
    );
}

function ContactCard({ icon: Icon, value, label, href, color }: any) {
    // Show default if no value, but keep logic clean
    const displayValue = value || "N/A";
    const colors: any = {
        blue: 'hover:border-blue-500/20 group-hover:bg-blue-600',
        purple: 'hover:border-purple-500/20 group-hover:bg-purple-600',
        emerald: 'hover:border-emerald-500/20 group-hover:bg-emerald-600'
    };
    return (
        <a href={href} className={`flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-[1.5rem] hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl transition-all border border-transparent group ${colors[color]?.split(' ')[0]}`}>
            <div className={`w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center transition-all ${colors[color]?.split(' ')[1]}`}><Icon size={18} /></div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{displayValue}</p>
            </div>
        </a>
    );
}

function MetricsHero({ icon: Icon, label, value, color, sub }: any) {
    const colors: any = { emerald: 'text-emerald-500', blue: 'text-blue-500' };
    return (
        <div className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center shadow-sm group hover:border-blue-500/20 transition-all">
            <div className={`mx-auto w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-inner ${colors[color]}`}><Icon size={24} /></div>
            <p className="text-3xl font-black mb-1 leading-none tracking-tighter">{value}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-[9px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-tight">{sub}</p>
        </div>
    );
}

function MediaCard({ src, label }: any) {
    return (
        <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm">
            <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={label} />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <Eye className="text-white" size={24} />
            </div>
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[8px] font-black rounded-lg uppercase tracking-tight">{label}</div>
        </div>
    );
}

function SimpleTooltip({ active, payload }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">{payload[0].payload.subject}</p>
                <p className="text-2xl font-black text-blue-400 leading-none">{payload[0].value}%</p>
            </div>
        );
    }
    return null;
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ChevronLeft, ChevronRight, Eye, 
  MapPin, Calendar, Clock, AlertTriangle, CheckCircle, 
  FileText, X, Building2, User, Activity, ShieldCheck
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

// Interface updated with full details
interface Reclamation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  statut: 'NOUVELLE' | 'ACCEPTEE' | 'REJETEE' | null;
  affectationReclamation: 'NON_AFFECTEE' | 'AFFECTEE';
  commune?: { id: number; nom: string };
  etablissement?: { id: number; nom: string; secteur: string };
  user?: { nom: string; prenom: string; email: string };
  createdAt: string;
  medias?: any[];
  affecteeAAutorite?: { id: number; nom: string; prenom: string; role: string };
  secteurAffecte?: string;
}

export default function ReclamationsTab({ initialSelectedId }: { initialSelectedId?: number }) {
  const t = useTranslations('governor.reclamations_tab');
  const tSectors = useTranslations('sectors');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const STATUT_CONFIG: any = {
    null: { label: t('filters.pending'), color: 'bg-slate-100 text-slate-600 border-slate-200' },
    'NOUVELLE': { label: t('filters.pending'), color: 'bg-slate-100 text-slate-600 border-slate-200' },
    'ACCEPTEE': { label: t('filters.processing'), color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    'REJETEE': { label: t('filters.rejected'), color: 'bg-red-100 text-red-700 border-red-200' },
  };
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filtres
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

  const [selectedRec, setSelectedRec] = useState<Reclamation | null>(null);
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);

  const fetchAuthorities = async () => {
    try {
      const res = await fetch('/api/users?role=AUTORITE&limit=100');
      if (res.ok) {
        const data = await res.json();
        setAuthorities(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssign = async (recId: number, agentId: number) => {
    setAssigning(true);
    try {
      const res = await fetch(`/api/reclamations/${recId}/affecter`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affecteAId: agentId })
      });
      if (res.ok) {
        fetchReclamations();
        setSelectedRec(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
     fetchAuthorities();
  }, []);

  const fetchReclamations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        search: search,
        ...(statutFilter ? { statut: statutFilter } : { statut: 'ACCEPTEE' }), // Default to ACCEPTEE but allow filter
      });
      
      const res = await fetch(`/api/reclamations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReclamations(data.data || []);
        setStats(data.stats);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReclamations();
  }, [page, statutFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchReclamations();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (initialSelectedId && reclamations.length > 0) {
      const found = reclamations.find(r => r.id === initialSelectedId);
      if (found) setSelectedRec(found);
      
      const element = document.getElementById(`rec-${initialSelectedId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [initialSelectedId, reclamations]);

  return (
    <div className="space-y-10">
      
      {/* 📊 GLOBAL MONITORING BAR - COMMAND MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('stats.total_flow'), count: (stats?.enAttente || 0) + (stats?.acceptees || 0), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: t('stats.admin_decision'), count: stats?.enAttente || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: t('stats.assigned_ongoing'), count: stats?.enCours || 0, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: t('stats.urgent_assignment'), count: stats?.aDispatcher || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        ].map((s, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all relative overflow-hidden"
          >
             {/* Subtle colored accent on hover */}
             <div className={`absolute top-0 left-0 w-1 h-full ${s.bg.replace('50', '500')} opacity-0 group-hover:opacity-100 transition-opacity`} />

             <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{s.count}</p>
             </div>
             
             <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} border border-white shadow-sm group-hover:scale-110 transition-transform`}>
                <s.icon size={26} />
             </div>
          </motion.div>
        ))}
      </div>

      {/* 🔍 SEARCH & FLOW CONTROL - GLASS PANEL */}
      <div className="sticky top-24 z-30 bg-white/80 backdrop-blur-xl p-4 md:p-5 rounded-[2.5rem] shadow-xl border border-white/50 flex flex-col lg:flex-row gap-5 items-center ring-1 ring-black/5">
        <div className="relative flex-1 w-full group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gov-blue transition-colors pointer-events-none">
             <Search size={22} />
          </div>
          <input
            type="text"
            placeholder={t('filters.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-4 bg-slate-50/80 hover:bg-white focus:bg-white border-2 border-transparent focus:border-gov-blue/20 rounded-2xl focus:ring-4 focus:ring-gov-blue/5 transition-all outline-none font-bold text-slate-700 placeholder:text-slate-400 group-hover:shadow-inner"
          />
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto p-1.5 bg-slate-100/80 rounded-[2rem] overflow-x-auto custom-scrollbar">
          {[
            { id: '', label: isAr ? 'الكل' : 'Toutes' },
            { id: 'EN_ATTENTE', label: isAr ? 'بانتظار المصادقة' : 'En attente' },
            { id: 'NON_AFFECTEE', label: isAr ? 'بانتظار التعيين' : 'À affecter' },
            { id: 'AFFECTEE', label: isAr ? 'قيد المعالجة' : 'En cours' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatutFilter(f.id)}
              className={`px-6 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                statutFilter === f.id 
                ? 'bg-slate-900 text-white shadow-lg transform scale-105' 
                : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📑 STREAM OF RECLAMATIONS */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[3rem]" />
           ))}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reclamations.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedRec(rec)}
                id={`rec-${rec.id}`}
                className={`group bg-white rounded-[2.5rem] p-8 shadow-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col h-full ${
                   initialSelectedId === rec.id ? 'ring-4 ring-gov-blue ring-offset-4 border-gov-blue animate-pulse' : 'border-slate-100 hover:shadow-2xl hover:border-gov-blue/20'
                }`}
              >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[url('/patterns/grid.png')] opacity-[0.03] rotate-12 pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent pointer-events-none rounded-bl-[4rem] group-hover:from-gov-blue/5 transition-colors" />

                <div className="flex justify-between items-start mb-6 relative z-10">
                   <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${STATUT_CONFIG[String(rec.statut)].color}`}>
                      {STATUT_CONFIG[String(rec.statut)].label}
                   </div>
                   <div className="text-[10px] font-black text-slate-300 font-mono tracking-widest group-hover:text-gov-blue/30 transition-colors">
                      ID-{rec.id}
                   </div>
                </div>

                <div className="mb-auto">
                    <h3 className="text-lg font-black text-slate-900 mb-3 group-hover:text-gov-blue transition-colors leading-tight line-clamp-2">
                      {rec.titre}
                    </h3>
                    
                    <p className="text-slate-500 text-xs font-medium mb-8 line-clamp-3 leading-relaxed">
                      {rec.description}
                    </p>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-50 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <User size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{rec.user?.prenom} {rec.user?.nom}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gov-blue/5 flex items-center justify-center text-gov-blue group-hover:bg-gov-blue/10 transition-all">
                        <MapPin size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{rec.commune?.nom} {rec.etablissement ? `• ${rec.etablissement.nom}` : ''}</span>
                  </div>
                  
                  {rec.affecteeAAutorite && (
                    <div className="mt-2 flex items-center gap-3 text-[9px] font-black text-emerald-600 bg-emerald-50/50 px-3 py-2 rounded-xl border border-emerald-100/50">
                       <ShieldCheck size={12} />
                       <span>{t('card.assigned_to')}: {rec.affecteeAAutorite.nom}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-between items-center relative z-10">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <Calendar size={12} />
                      {new Date(rec.createdAt).toLocaleDateString()}
                   </div>

                   <button className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center transform group-hover:scale-110 group-hover:bg-gov-blue transition-all shadow-lg shadow-slate-900/20 group-hover:shadow-gov-blue/30">
                      <ChevronRight size={18} />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-16 bg-white px-10 py-5 rounded-[2rem] border border-slate-100 w-fit mx-auto shadow-xl shadow-slate-200/50 hover:scale-105 transition-transform">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-3 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-sm font-black text-slate-900 tracking-[0.3em]">
                {t('pagination.page_x_of_y', { current: page, total: totalPages })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-3 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* 🏢 DETAILED SUPERVISION MODAL */}
      <AnimatePresence>
        {selectedRec && (
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
             onClick={() => setSelectedRec(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3rem] shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-900 p-10 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gov-blue/10 skew-x-12 translate-x-1/4" />
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1 text-[10px] font-black rounded-full border border-white/20 uppercase tracking-[0.2em] bg-white/5`}>
                        {STATUT_CONFIG[String(selectedRec.statut)].label}
                    </span>
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{t('card.id')}: {selectedRec.id}</span>
                  </div>
                  <h2 className="text-3xl font-black">{selectedRec.titre}</h2>
                </div>
                <button 
                  onClick={() => setSelectedRec(null)}
                  className="relative z-10 p-4 hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={28} />
                </button>
              </div>

              {/* Body */}
              <div className="p-10 overflow-y-auto space-y-12">
                <div className="grid md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-gov-blue rounded-full" />
                         {t('modal.details_title')}
                       </h3>
                      <div className="bg-slate-50 p-8 rounded-[2rem] text-slate-600 font-medium text-sm leading-relaxed border border-slate-100">
                        {selectedRec.description}
                      </div>

                      {/* Photo Section */}
                      {selectedRec.medias && selectedRec.medias.length > 0 && (
                        <div className="space-y-4">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('modal.attachments')}</h4>
                           <div className="grid grid-cols-2 gap-4">
                              {selectedRec.medias.map((m: any, idx: number) => (
                                <div key={idx} className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-200">
                                   <img src={m.urlPublique || m.cheminFichier} alt="Preuve" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f1f5f9/64748b?text=Media+Indisponible'; }} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                   <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <a 
                                        href={m.urlPublique} 
                                        target="_blank" 
                                        download 
                                        className="p-3 bg-white rounded-xl text-slate-900 font-bold text-xs flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform"
                                      >
                                         <CheckCircle size={16} /> {t('modal.download')}
                                      </a>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-8">
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-gov-gold rounded-full" />
                         {t('modal.oversight_title')}
                       </h3>
                      
                      <div className="space-y-4">
                        <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-5">
                           <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                              <User size={28} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{t('modal.citizen_sender')}</p>
                              <p className="font-bold text-slate-900">{selectedRec.user?.prenom} {selectedRec.user?.nom}</p>
                              <p className="text-xs text-slate-500">{selectedRec.user?.email}</p>
                           </div>
                        </div>

                        <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-5">
                           <div className="w-14 h-14 bg-gov-blue/10 rounded-2xl flex items-center justify-center text-gov-blue">
                              {selectedRec.affecteeAAutorite ? <ShieldCheck size={28} /> : <AlertTriangle size={28} className="text-amber-500" />}
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{t('modal.assigned_authority')}</p>
                              <p className="font-black text-slate-900 uppercase">
                                 {selectedRec.affecteeAAutorite ? `${selectedRec.affecteeAAutorite.prenom} ${selectedRec.affecteeAAutorite.nom}` : t('modal.waiting_assignment')}
                              </p>
                              <p className="text-xs text-slate-500">{selectedRec.affecteeAAutorite ? selectedRec.affecteeAAutorite.role : t('modal.action_required')}</p>
                           </div>
                        </div>

                         <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between group overflow-hidden relative">
                           <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity" />
                           <div className="flex items-center gap-5 relative z-10">
                              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                                 <MapPin size={28} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-tight">{t('modal.admin_zone')}</p>
                                 <p className="font-bold">{selectedRec.commune?.nom}</p>
                                 <p className="text-xs text-white/60">{selectedRec.etablissement?.nom} • {selectedRec.etablissement?.secteur ? tSectors(selectedRec.etablissement.secteur.toLowerCase()) : ''}</p>
                              </div>
                           </div>
                         </div>

                         {/* Quick Decision / Assignment Tool */}
                         {!selectedRec.affecteeAAutorite && selectedRec.statut === 'ACCEPTEE' && (
                            <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 shadow-inner space-y-5 animate-in slide-in-from-right-10 duration-500">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-amber-500 text-white rounded-lg shadow-lg">
                                     <ShieldCheck size={18} />
                                  </div>
                                  <h4 className="text-sm font-black text-amber-900 uppercase">{t('modal.decisive_action')}</h4>
                               </div>
                               <div className="space-y-4">
                                  <p className="text-xs font-bold text-amber-700 leading-relaxed">
                                     {t('modal.decisive_action_desc')}
                                  </p>
                                  <select 
                                    className="w-full p-4 bg-white border-2 border-amber-200 rounded-2xl font-black text-xs uppercase tracking-tight focus:ring-4 focus:ring-amber-500/10 outline-none appearance-none cursor-pointer hover:border-amber-400 transition-all"
                                    onChange={(e) => handleAssign(selectedRec.id, parseInt(e.target.value))}
                                    disabled={assigning}
                                    defaultValue=""
                                  >
                                    <option value="" disabled>{assigning ? t('modal.assigning') : t('modal.select_authority')}</option>
                                    {authorities.map(auth => (
                                       <option key={auth.id} value={auth.id}>{auth.prenom} {auth.nom} ({auth.role})</option>
                                    ))}
                                  </select>
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                </div>

                 <div className="pt-10 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <div>{t('modal.footer')}</div>
                    <div className="flex items-center gap-2">
                       <Clock size={12} />
                       {t('modal.created_at')} {new Date(selectedRec.createdAt).toLocaleString()}
                    </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

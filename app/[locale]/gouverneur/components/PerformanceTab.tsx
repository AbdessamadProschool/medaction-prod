'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Medal, Star, TrendingUp, Building2, 
  Award, ChevronRight, Target, Zap, ShieldCheck,
  Search, Filter, MapPin, Users, Calendar, Megaphone,
  AlertTriangle, CheckCircle, Activity, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import DecisionCenterModal from './DecisionCenterModal';

interface PerformanceItem {
  id: number;
  nom: string;
  secteur: string;
  commune: string;
  annexe?: string;
  score: number;
  level: string;
  rank: number;
  style: { color: string; bgColor: string };
  presentation: any;
  stats: {
    evenements: number;
    activites: number;
    reclamations: number;
    resolvedReclamations: number;
    note: number;
    subscribers: number;
    actualites: number;
    evaluations: number;
  };
}

export default function PerformanceTab({ initialSector = '' }: { initialSector?: string }) {
  const t = useTranslations('governor.performance_tab');
  const locale = useTranslations('locale')('code') || 'fr'; // fallback safely
  const isRTL = locale === 'ar';
  const [data, setData] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedSector, setSelectedSector] = useState(initialSector);
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedAnnexe, setSelectedAnnexe] = useState('');
  const [timeRange, setTimeRange] = useState('ALL'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Increased from 6 for better density
  
  const [selectedItem, setSelectedItem] = useState<PerformanceItem | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await fetch('/api/gouverneur/performance');
        if (res.ok) {
          const json = await res.json();
          // The API returns { success: true, data: { data: [...], pagination: { ... } } }
          const performanceData = json?.data?.data || (Array.isArray(json?.data) ? json.data : (json?.data ?? []));
          setData(Array.isArray(performanceData) ? performanceData : []);
        } else {
          throw new Error(`API returned ${res.status}`);
        }
      } catch (err) {
        console.error('Performance Tab Fetch Error:', err);
        toast.error(t('errors.fetch_failed') || 'Erreur lors du chargement des performances');
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  const communes = Array.from(new Set((Array.isArray(data) ? data : []).map(item => item?.commune).filter(Boolean)));
  const annexes = Array.from(new Set((Array.isArray(data) ? data : []).filter(item => !selectedCommune || item?.commune === selectedCommune).map(item => item?.annexe).filter(Boolean)));

  const filteredData = data.filter(item => 
    (item.nom.toLowerCase().includes(filter.toLowerCase()) || 
     item.commune?.toLowerCase().includes(filter.toLowerCase())) &&
    (selectedSector === '' || item.secteur === selectedSector) &&
    (selectedCommune === '' || item.commune === selectedCommune) &&
    (selectedAnnexe === '' || item.annexe === selectedAnnexe) 
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const top3 = filteredData.slice(0, 3);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[3rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <DecisionCenterModal 
        etablissement={selectedItem} 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />

      {/* 🏆 COMPACT PODIUM - Reduced vertical space */}
      <div className="relative pt-6 pb-8 px-4">
        <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-blue-900/5 via-indigo-900/5 to-transparent -z-10 rounded-b-[5rem]" />
        
        <div className="max-w-4xl mx-auto flex items-end justify-center gap-4 md:gap-8 lg:gap-12 perspective-1000 scale-90 sm:scale-100">
          {/* Rank 2 */}
          {top3[1] && <Top3Card item={top3[1]} rank={2} type="silver" onClick={() => setSelectedItem(top3[1])} t={t} />}
          {/* Rank 1 */}
          {top3[0] && <Top3Card item={top3[0]} rank={1} type="gold" onClick={() => setSelectedItem(top3[0])} t={t} />}
          {/* Rank 3 */}
          {top3[2] && <Top3Card item={top3[2]} rank={3} type="bronze" onClick={() => setSelectedItem(top3[2])} t={t} />}
        </div>
      </div>      {/* 🚀 COMPACT FILTER BAR - Sticky */}
      <div className="sticky top-24 z-20 max-w-7xl mx-auto px-6" dir="auto">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-3 rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-white/5 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1 group">
                <Search size={18} className={`${isRTL ? 'right-6' : 'left-6'} absolute top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors`} />
                <input 
                  type="text" 
                  placeholder={t('filters.search_placeholder')}
                  value={filter}
                  dir="auto"
                  onChange={(e) => setFilter(e.target.value)}
                  className={`w-full ${isRTL ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6 text-left'} py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-sm`}
                />

            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <select className="px-6 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-none font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer" value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)}>
                    <option value="">{t('filters.all_sectors')}</option>
                    <option value="EDUCATION">{t('filters.sectors.EDUCATION')}</option>
                    <option value="SANTE">{t('filters.sectors.SANTE')}</option>
                    <option value="SPORT">{t('filters.sectors.SPORT')}</option>
                    <option value="SOCIAL">{t('filters.sectors.SOCIAL')}</option>
                    <option value="CULTUREL">{t('filters.sectors.CULTUREL')}</option>
                </select>

                <select className="px-6 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-none font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer" value={selectedCommune} onChange={(e) => { setSelectedCommune(e.target.value); setSelectedAnnexe(''); }}>
                    <option value="">{t('filters.all_communes')}</option>
                    {[
                      { id: 'MEDIOUNA', fr: 'MÉDIOUNA', ar: 'مديونة' },
                      { id: 'TIT MELLIL', fr: 'TIT MELLIL', ar: 'تيط مليل' },
                      { id: 'LAHRAOUIYINE', fr: 'LAHRAOUIYINE', ar: 'الهراويين' },
                      { id: 'SIDI HAJJAJ OUED HASSAK', fr: 'SIDI HAJJAJ OUED HASSAK', ar: 'سيدي حجاج واد حصار' },
                      { id: 'MEJJATIA OULAD TALEB', fr: 'MEJJATIA OULAD TALEB', ar: 'المجاطية أولاد طالب' }
                    ].map(c => (
                        <option key={c.id} value={c.id} dir="auto">
                           {locale === 'ar' ? c.ar : c.fr}
                        </option>
                    ))}
                </select>
                <button 
                    onClick={() => { setFilter(''); setSelectedSector(''); setSelectedCommune(''); setSelectedAnnexe(''); }}
                    className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                    {t('filters.reset')} <Target size={14} />
                </button>
            </div>
        </div>
      </div>

      {/* 📊 PERFORMANCE TILES - Dense Layout */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedData.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (i % itemsPerPage) * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 group relative overflow-hidden transition-all hover:shadow-2xl hover:border-blue-500/20 cursor-pointer"
            >
              <div className="absolute top-4 right-4 text-4xl font-black text-slate-100 dark:text-slate-900 group-hover:text-blue-500/10 transition-colors">#{item.rank}</div>
              
              <div className="flex flex-col gap-4 relative z-10">
                 <div className={`w-12 h-12 rounded-2xl ${item.style.bgColor} flex items-center justify-center ${item.style.color} group-hover:scale-110 transition-transform`}>
                    <Building2 size={24} />
                 </div>
                 
                 <div className="text-start">
                    <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest mb-1 block">{(item.secteur).toUpperCase()}</span>
                    <h4 className="font-black text-slate-900 dark:text-white line-clamp-2 leading-tight uppercase group-hover:text-blue-500 transition-colors" dir="auto">{item.nom}</h4>
                    <p className="text-[10px] font-bold text-slate-600 mt-1 flex items-center gap-1.5" dir="auto"><MapPin size={10} /> {item.commune}</p>
                 </div>


                 {/* MINI STATS PREVIEW */}
                 <div className="grid grid-cols-2 gap-2 mt-2">
                    <MiniCount icon={Calendar} val={item.stats.evenements} color="blue" />
                    <MiniCount icon={Activity} val={item.stats.activites} color="purple" />
                    <MiniCount icon={Star} val={Math.round(item.stats.note * 10) / 10} suffix="/5" color="amber" />
                    <MiniCount icon={Megaphone} val={item.stats.actualites} color="emerald" />
                 </div>

                 <div className="pt-4 mt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">{t('card.maturity_score')}</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">{item.score}%</span>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.style.bgColor} ${item.style.color} border border-white/5 shadow-sm`}>
                        {t('card.rank_prefix')} {item.level}
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-16 bg-white dark:bg-slate-900 px-8 py-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 w-fit mx-auto shadow-xl">
             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-blue-500 hover:text-white disabled:opacity-30 transition-all"><ChevronRight className="rotate-180" size={18} /></button>
             <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-[0.3em] uppercase">Page {currentPage} / {totalPages}</span>
             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-blue-500 hover:text-white disabled:opacity-30 transition-all"><ChevronRight size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniCount({ icon: Icon, val, color, suffix }: any) {
    const colors: any = {
        blue: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30',
        purple: 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30',
        amber: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30',
        emerald: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30'
    };
    return (
        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200/50 dark:border-white/10 shadow-sm ${colors[color] || 'bg-slate-100 text-slate-800'}`}>
            <Icon size={12} className="opacity-80" />
            <span className="text-[11px] font-black tabular-nums tracking-wide" dir="ltr">{val}{suffix}</span>
        </div>
    );
}

function Top3Card({ item, rank, type, onClick, t }: any) {
    const isGold = type === 'gold';
    const colors: any = {
        gold: 'from-amber-200 via-yellow-400 to-amber-500 border-amber-300 ring-amber-100 shadow-amber-300/30',
        silver: 'from-slate-100 via-slate-200 to-slate-400 border-slate-300 ring-slate-100 shadow-slate-300/20',
        bronze: 'from-orange-100 via-orange-300 to-orange-500 border-orange-300 ring-orange-100 shadow-orange-300/20'
    };

    return (
        <motion.div 
          onClick={onClick}
          className={`flex-1 flex flex-col items-center cursor-pointer group max-w-[280px] ${isGold ? 'z-20 scale-110 mb-4' : 'z-10'}`}
        >
          <div className="relative mb-4">
             <div className={`w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br rounded-full flex items-center justify-center border-4 border-white shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform ${colors[type]}`}>
                {isGold ? <Trophy className="text-white w-10 md:w-14" /> : type === 'silver' ? <Medal className="text-slate-700 w-10 md:w-14" /> : <TrendingUp className="text-orange-600 w-10 md:w-14" />}
                <div className="absolute inset-x-0 bottom-0 py-1 bg-black/10 text-[9px] font-black text-white uppercase text-center">{rank === 1 ? t('levels.leader') : rank === 2 ? t('levels.excellence') : t('levels.hope')}</div>
             </div>
             <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-950 text-white rounded-full flex items-center justify-center font-black text-xs border-4 border-white shadow-xl">#{rank}</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[2.5rem] shadow-2xl border border-white/50 text-center w-full min-h-[140px] flex flex-col items-center justify-center group-hover:-translate-y-2 transition-transform">
            <p className="font-black text-slate-900 text-[13px] line-clamp-2 leading-none uppercase tracking-tight mb-2" dir="auto">{item.nom}</p>
            <div className="flex items-baseline gap-1">
                <p className={`text-3xl font-black tracking-tighter ${isGold ? 'text-amber-500' : 'text-slate-600'}`}>{item.score}</p>
                <span className="text-[9px] font-bold text-slate-600">{t('card.pts')}</span>
            </div>
            <div className="mt-2 px-3 py-1 bg-slate-100 text-[8px] font-black uppercase text-slate-700 rounded-lg border border-slate-200/50">{(item.secteur).toUpperCase()}</div>
          </div>
        </motion.div>
    );
}

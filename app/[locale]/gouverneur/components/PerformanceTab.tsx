'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  Building2, 
  Award,
  ChevronRight,
  Target,
  Zap,
  ShieldCheck,
  Search,
  Filter,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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
  stats: {
    evenements: number;
    activites: number;
    reclamations: number;
    resolvedReclamations: number;
    note: number;
    subscribers: number;
    news: number;
  };
}

import DecisionCenterModal from './DecisionCenterModal';

export default function PerformanceTab() {
  const t = useTranslations('governor.performance_tab');
  const [data, setData] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedAnnexe, setSelectedAnnexe] = useState('');
  const [timeRange, setTimeRange] = useState('ALL'); // ALL, MONTH, WEEK
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const [selectedItem, setSelectedItem] = useState<PerformanceItem | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await fetch('/api/gouverneur/performance');
        if (res.ok) {
          const json = await res.json();
          setData(json.data || json);
        }
      } catch (err) {
        toast.error(t('toasts.load_error'));
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  // Compute filtering options from data
  const communes = Array.from(new Set(data.map(item => item.commune).filter(Boolean)));
  const annexes = Array.from(new Set(data.filter(item => !selectedCommune || item.commune === selectedCommune).map(item => (item as any).annexe).filter(Boolean)));

  const filteredData = data.filter(item => 
    (item.nom.toLowerCase().includes(filter.toLowerCase()) || 
     item.commune?.toLowerCase().includes(filter.toLowerCase())) &&
    (selectedSector === '' || item.secteur === selectedSector) &&
    (selectedCommune === '' || item.commune === selectedCommune) &&
    (selectedAnnexe === '' || (item as any).annexe === selectedAnnexe) 
    // Time range would normally be an API param, simulating a partial filter here
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const top3 = filteredData.slice(0, 3);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-[3rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <DecisionCenterModal 
        etablissement={selectedItem} 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />

      {/* 🏆 PODIUM CHAMPIONS */}
      <div className="relative pt-16 pb-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-gov-blue/10 via-gov-blue/5 to-transparent rounded-[4rem] -z-10 mx-4" />
        
        <div className="max-w-5xl mx-auto flex items-end justify-center gap-6 md:gap-10">
          {/* Rang 2 */}
          {top3[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedItem(top3[1])}
              className="flex-1 flex flex-col items-center cursor-pointer group max-w-[280px]"
            >
              <div className="relative mb-6 group-hover:scale-110 transition-transform">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                   <Medal className="text-slate-400 w-10 h-10" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-slate-500 text-white rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-lg">2</div>
              </div>
              <div className="bg-white/90 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-slate-100 text-center w-full min-h-[160px] flex flex-col items-center justify-center hover:bg-white transition-all transform group-hover:-translate-y-2">
                <p className="font-black text-slate-900 text-sm line-clamp-2 mb-2 leading-tight">{top3[1].nom}</p>
                <p className="text-2xl font-black text-slate-500">{top3[1].score}</p>
                <div className="mt-2 px-3 py-1 bg-slate-50 text-[10px] font-black uppercase text-slate-500 rounded-full">{t(`filters.sectors.${top3[1].secteur}`)}</div>
              </div>
            </motion.div>
          )}

          {/* Rang 1 */}
          {top3[0] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedItem(top3[0])}
              className="flex-1 flex flex-col items-center z-10 scale-110 cursor-pointer group max-w-[320px]"
            >
              <div className="relative mb-8 group-hover:scale-110 transition-transform">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -inset-10 bg-gov-gold rounded-full blur-3xl -z-10"
                />
                <div className="w-28 h-28 md:w-36 md:h-36 bg-gradient-to-br from-gov-gold via-amber-400 to-gov-gold rounded-full flex items-center justify-center border-4 border-white shadow-2xl relative">
                   <Trophy className="text-slate-900 w-14 h-14 md:w-20 md:h-20" />
                </div>
                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-slate-900 text-gov-gold rounded-full flex items-center justify-center font-black text-xl border-4 border-white shadow-2xl">1</div>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-2 border-gov-gold/20 text-center w-full min-h-[220px] flex flex-col items-center justify-center ring-8 ring-gov-gold/5 group-hover:ring-gov-gold/15 transition-all transform group-hover:-translate-y-4">
                <div className="inline-flex items-center gap-2 text-[10px] font-black text-gov-gold bg-slate-900 px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
                  <Star size={12} className="fill-current" /> {t('podium.maestro')}
                </div>
                <p className="font-black text-slate-900 text-xl line-clamp-2 mb-2 leading-tight px-4">{top3[0].nom}</p>
                <p className="text-5xl font-black text-gov-gold drop-shadow-sm">{top3[0].score}</p>
                <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-widest">{t('podium.excellence_points')}</p>
              </div>
            </motion.div>
          )}

          {/* Rang 3 */}
          {top3[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setSelectedItem(top3[2])}
              className="flex-1 flex flex-col items-center cursor-pointer group max-w-[280px]"
            >
              <div className="relative mb-6 group-hover:scale-110 transition-transform">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-orange-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl text-orange-400">
                   <TrendingUp className="w-10 h-10" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-orange-600 text-white rounded-full flex items-center justify-center font-black text-sm border-2 border-white shadow-lg">3</div>
              </div>
              <div className="bg-white/90 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-slate-100 text-center w-full min-h-[160px] flex flex-col items-center justify-center hover:bg-white transition-all transform group-hover:-translate-y-2">
                <p className="font-black text-slate-900 text-sm line-clamp-2 mb-2 leading-tight">{top3[2].nom}</p>
                <p className="text-2xl font-black text-orange-600">{top3[2].score}</p>
                <div className="mt-2 px-3 py-1 bg-orange-50 text-[10px] font-black uppercase text-orange-400 rounded-full">{t(`filters.sectors.${top3[2].secteur}`)}</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 🚀 FILTERS COMMAND CENTER */}
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
           {/* Top Row: Search & Period */}
           <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gov-blue transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder={t('filters.search_placeholder')}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-gov-blue/5 transition-all outline-none font-bold text-slate-700"
                />
              </div>
              
              <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                 {[
                   { id: 'ALL', label: t('filters.history') },
                   { id: 'MONTH', label: t('filters.monthly') },
                   { id: 'WEEK', label: t('filters.weekly') },
                 ].map(t => (
                   <button
                    key={t.id}
                    onClick={() => setTimeRange(t.id)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      timeRange === t.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-white'
                    }`}
                   >
                     {t.label}
                   </button>
                 ))}
              </div>
           </div>

           {/* Bottom Row: Dynamic Selects */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <select 
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-6 py-4 bg-slate-50 rounded-xl border-none font-bold text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-gov-blue/10 cursor-pointer"
              >
                <option value="">{t('filters.all_sectors')}</option>
                <option value="EDUCATION">{t('filters.sectors.EDUCATION')}</option>
                <option value="SANTE">{t('filters.sectors.SANTE')}</option>
                <option value="SPORT">{t('filters.sectors.SPORT')}</option>
                <option value="CULTUREL">{t('filters.sectors.CULTUREL')}</option>
                <option value="SOCIAL">{t('filters.sectors.SOCIAL')}</option>
              </select>

               <select 
                value={selectedCommune}
                onChange={(e) => { setSelectedCommune(e.target.value); setSelectedAnnexe(''); }}
                className="px-4 py-4 bg-slate-50 rounded-xl border-none font-bold text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-gov-blue/10 cursor-pointer min-w-[160px] text-ellipsis"
              >
                <option value="">{t('filters.all_communes')}</option>
                {communes.map(c => <option key={c} value={c} title={c}>{c}</option>)}
              </select>

              <select 
                value={selectedAnnexe}
                onChange={(e) => setSelectedAnnexe(e.target.value)}
                className="px-4 py-4 bg-slate-50 rounded-xl border-none font-bold text-xs uppercase tracking-widest outline-none focus:ring-2 focus:ring-gov-blue/10 cursor-pointer min-w-[160px] text-ellipsis"
                disabled={annexes.length === 0}
              >
                <option value="">{annexes.length > 0 ? t('filters.all_annexes') : '—'}</option>
                {annexes.map(a => <option key={a} value={a} title={a}>{a}</option>)}
              </select>

              <button 
                onClick={() => { setFilter(''); setSelectedSector(''); setSelectedCommune(''); setSelectedAnnexe(''); setTimeRange('ALL'); }}
                className="px-6 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {t('filters.reset')} <Target size={14} />
              </button>
           </div>
        </div>
      </div>

      {/* 📊 MAIN RANKING GRID */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedData.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (i % itemsPerPage) * 0.05 }}
              className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 group relative overflow-hidden hover:shadow-2xl transition-all"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent flex items-start justify-end p-6 rounded-tr-[3rem]">
                 <span className="font-black text-slate-100 text-6xl select-none">#{item.rank}</span>
              </div>

              <div className="flex items-start gap-4 mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl ${item.style.bgColor} flex items-center justify-center ${item.style.color} shadow-inner border border-white/50`}>
                   <Building2 size={24} />
                </div>
                <div className="pr-12">
                  <h4 className="font-black text-slate-900 line-clamp-2 leading-[1.1] mb-1.5 text-lg">{item.nom}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin size={10} className="text-gov-blue" /> {item.commune}
                  </p>
                </div>
              </div>

              {/* Stats Grid - Executive Style */}
              <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                 <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                       <Zap size={10} />
                       <span className="text-[8px] font-black uppercase tracking-wider">{t('card.perf_index')}</span>
                    </div>
                    <span className="text-xl font-black text-slate-900">{item.score}</span>
                 </div>
                 
                 <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                       <Target size={10} />
                       <span className="text-[8px] font-black uppercase tracking-wider">{t('card.classification')}</span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${item.style.bgColor} ${item.style.color}`}>
                       {item.level}
                    </span>
                 </div>
              </div>

              {/* Progress Bar with Gradient */}
              <div className="relative mb-6">
                <div className="flex justify-between items-end mb-1.5">
                   <span className="text-[9px] font-bold text-slate-400 uppercase">{t('podium.excellence_points')}</span>
                   <span className="text-[9px] font-black text-slate-900">{Math.round((item.score / 100) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: `${item.score}%` }}
                     className={`h-full ${item.style.bgColor.replace('bg-', 'bg-gradient-to-r from-').replace('100', '400').replace('50', '400')} to-${item.style.color.split('-')[1]}-500/80`} 
                   />
                </div>
              </div>

              <button 
                onClick={() => setSelectedItem(item)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gov-blue transition-all shadow-xl shadow-slate-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('card.decision_center')}
                <ChevronRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* PAGINATION COMMANDS */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-16 bg-white px-8 py-4 rounded-[2rem] border border-slate-100 w-fit mx-auto shadow-xl">
             <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 disabled:opacity-30 transition-all font-black text-xs flex items-center gap-2"
             >
               <Medal size={18} className="rotate-180" />
             </button>
             <div className="text-sm font-black text-slate-900 tracking-[0.3em]">
               {t('pagination.page_x_of_y', { current: currentPage, total: totalPages })}
             </div>
             <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 disabled:opacity-30 transition-all font-black text-xs flex items-center gap-2"
             >
               <Medal size={18} />
             </button>
          </div>
        )}
      </div>
    </div>
  );
}

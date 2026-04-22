'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ChevronLeft, ChevronRight, Eye, 
  MapPin, Calendar, Clock, Image as ImageIcon, Users,
  Building2, Tag, ArrowRight, Activity, X, Target, FileText, Zap, Shield,
  ClipboardList, FileCheck, AlertCircle, FileSearch
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { SafeHTML } from '@/components/ui/SafeHTML';

export default function EvenementsTab({ highlightId }: { highlightId?: number }) {
  const t = useTranslations('governor');
  const locale = useLocale();
  const isAr = locale === 'ar';

  const STATUT_CONFIG: any = {
    'EN_ATTENTE_VALIDATION': { label: isAr ? 'قيد الانتظار' : 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    'PUBLIEE': { label: isAr ? 'منشور' : 'Publié', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'EN_ACTION': { label: isAr ? 'جاري التنفيذ' : 'En cours', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    'CLOTUREE': { label: isAr ? 'مغلق' : 'Clôturé', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    'ANNULEE': { label: isAr ? 'ملغى' : 'Annulé', color: 'bg-red-100 text-red-700 border-red-200' },
    'ACTIVE': { label: isAr ? 'نشط' : 'Actif', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  };

  const contentTypes = [
    { id: 'evenements', label: isAr ? 'الأحداث' : 'Événements', icon: Calendar },
    { id: 'campagnes', label: isAr ? 'الحملات' : 'Campagnes', icon: Target },
    { id: 'articles', label: isAr ? 'المقالات' : 'Articles', icon: FileText },
    { id: 'actualites', label: isAr ? 'الأخبار' : 'Actualités', icon: Zap },
  ];

  const [typeContenu, setTypeContenu] = useState<'evenements' | 'campagnes' | 'articles' | 'actualites'>('evenements');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filtres
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [secteurFilter, setSecteurFilter] = useState('');
  const [communeFilter, setCommuneFilter] = useState('');
  const [annexeFilter, setAnnexeFilter] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [communes, setCommunes] = useState<any[]>([]);
  const [annexes, setAnnexes] = useState<any[]>([]);

  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        const res = await fetch('/api/communes');
        if (res.ok) {
          const data = await res.json();
          setCommunes(data.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCommunes();
  }, []);

  useEffect(() => {
    if (!communeFilter) {
        setAnnexes([]);
        setAnnexeFilter('');
        return;
    }
    const fetchAnnexes = async () => {
        try {
            const res = await fetch(`/api/annexes?communeId=${communeFilter}`);
            if (res.ok) {
                const data = await res.json();
                setAnnexes(data.data || []);
            }
        } catch (e) {
            console.error(e);
        }
    };
    fetchAnnexes();
  }, [communeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        search: search,
      });

      if (statutFilter) params.append('statut', statutFilter);
      if (secteurFilter) params.append('secteur', secteurFilter);
      if (communeFilter) params.append('communeId', communeFilter);
      if (annexeFilter) params.append('annexeId', annexeFilter);
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const res = await fetch(`/api/${typeContenu}?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
        if (data.pagination) setTotalPages(data.pagination.totalPages);
      } else {
        setItems([]);
        setTotalPages(1);
      }
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statutFilter, secteurFilter, communeFilter, annexeFilter, typeContenu, dateDebut, dateFin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Highlight effect
  useEffect(() => {
    if (highlightId && items.length > 0) {
      const element = document.getElementById(`item-${highlightId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, items]);

  // Adapter les données indifféremment de leur type
  const getCardProps = (item: any) => {
    let desc = item.description || (item.contenu ? item.contenu.replace(/<[^>]*>?/gm, '') : '');
    desc = desc.substring(0, 120) + (desc.length > 120 ? '...' : '');
    const img = item.medias?.[0]?.urlPublique || item.imageCouverture || item.imagePrincipale || null;
    const dateAffichable = item.dateDebut || item.createdAt;
    const tagAffichable = item.typeCategorique || item.type || item.categorie || typeContenu.toUpperCase();
    const lieu1 = item.commune?.nom || item.etablissement?.commune?.nom || (item.etablissement?.nom ? item.etablissement.nom : '');
    const lieu2 = item.etablissement?.nom || '';
    
    const isFinished = item.dateFin ? new Date(item.dateFin) < new Date() : false;
    const hasReport = !!(item.bilanDescription || item.rapportClotureUrl || item.rapportComplete || item.photosRapport?.length > 0);
    const needsClosure = (item.statut === 'EN_ACTION' || item.statut === 'TERMINEE' || item.statut === 'PUBLIEE') && isFinished && !hasReport;
    
    return {
      id: item.id,
      titre: item.titre,
      description: desc,
      image: img,
      statut: item.statut || 'PUBLIEE',
      tag: tagAffichable,
      date: dateAffichable ? new Date(dateAffichable).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      dateFinObj: item.dateFin,
      lieu: lieu1,
      lieuDetail: lieu2,
      needsClosure,
      hasReport,
      raw: item,
    };
  };

  return (
    <div className="space-y-6">
      
      {/* 🚀 QUICK SWITCHER CONTROLS - RE-BALANCED */}
      <div className="flex bg-slate-100/80 backdrop-blur-xl rounded-2xl p-1.5 gap-1.5 overflow-x-auto border border-slate-200/50">
        {contentTypes.map((btn) => (
          <button
            key={btn.id}
            onClick={() => {
              setTypeContenu(btn.id as any);
              setStatutFilter('');
              setSearch('');
              setSecteurFilter('');
              setCommuneFilter('');
              setAnnexeFilter('');
              setDateDebut('');
              setDateFin('');
              setPage(1);
            }}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl font-black transition-all whitespace-nowrap text-sm ${
              typeContenu === btn.id
              ? 'bg-white text-gov-blue shadow-lg border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <btn.icon size={18} className={typeContenu === btn.id ? "text-gov-blue" : "opacity-60"} />
            {btn.label}
          </button>
        ))}
      </div>

      {/* 🔍 SEARCH AND FILTERS (PRO VERSION) */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col gap-6 relative overflow-hidden group/filters">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gov-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative w-full group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-gov-blue transition-colors pointer-events-none">
             <Search size={22} />
          </div>
          <input
            type="text"
            placeholder={isAr ? "البحث بالكلمات المفتاحية في الأحداث والمقالات..." : "Rechercher par titre, description, contenu..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-slate-50 hover:bg-white focus:bg-white border-2 border-transparent focus:border-gov-blue/20 rounded-[1.5rem] focus:ring-8 focus:ring-gov-blue/5 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-700 text-lg shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <select
              value={statutFilter}
              onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl appearance-none font-black text-[10px] uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-blue/10 transition-all cursor-pointer shadow-sm"
            >
              <option value="">{isAr ? 'جميع الحالات' : 'Tous les statuts'}</option>
              <option value="PUBLIEE">{isAr ? 'منشور' : 'Publié'}</option>
              {typeContenu === 'evenements' && <option value="EN_ACTION">{isAr ? 'جاري' : 'En cours'}</option>}
              {typeContenu === 'evenements' && <option value="CLOTUREE">{isAr ? 'مغلق' : 'Clôturé'}</option>}
              {typeContenu === 'campagnes' && <option value="ACTIVE">{isAr ? 'نشط' : 'Actif'}</option>}
              <option value="EN_ATTENTE_VALIDATION">{isAr ? 'في انتظار التحقق' : 'Attente Validation'}</option>
            </select>
            <Activity className="absolute left-5 top-1/2 -translate-y-1/2 text-gov-blue" size={16} />
          </div>

          <div className="relative">
            <select
              value={secteurFilter}
              onChange={(e) => { setSecteurFilter(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl appearance-none font-black text-[10px] uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-blue/10 transition-all cursor-pointer shadow-sm"
            >
              <option value="">{isAr ? 'جميع القطاعات' : 'Tous les secteurs'}</option>
              <option value="EDUCATION">{isAr ? 'التعليم' : 'Éducation'}</option>
              <option value="SANTE">{isAr ? 'الصحة' : 'Santé'}</option>
              <option value="SPORT">{isAr ? 'الرياضة' : 'Sport'}</option>
              <option value="CULTUREL">{isAr ? 'الثقافة' : 'Culturel'}</option>
              <option value="SOCIAL">{isAr ? 'الاجتماعي' : 'Social'}</option>
            </select>
            <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-gov-blue" size={16} />
          </div>

          <div className="relative">
            <select
              value={communeFilter}
              onChange={(e) => { setCommuneFilter(e.target.value); setAnnexeFilter(''); setPage(1); }}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl appearance-none font-black text-[10px] uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-blue/10 transition-all cursor-pointer shadow-sm"
            >
              <option value="">{isAr ? 'جميع الجماعات' : 'Toutes les communes'}</option>
              {[
                { id: 'MEDIOUNA', fr: 'MÉDIOUNA', ar: 'مديونة' },
                { id: 'TIT MELLIL', fr: 'TIT MELLIL', ar: 'تيط مليل' },
                { id: 'LAHRAOUIYINE', fr: 'LAHRAOUIYINE', ar: 'الهراويين' },
                { id: 'SIDI HAJJAJ OUED HASSAK', fr: 'SIDI HAJJAJ OUED HASSAK', ar: 'سيدي حجاج واد حصار' },
                { id: 'MEJJATIA OULAD TALEB', fr: 'MEJJATIA OULAD TALEB', ar: 'المجاطية أولاد طالب' }
              ].map((c) => (
                <option key={c.id} value={c.id} dir="auto">{isAr ? c.ar : c.fr}</option>
              ))}
            </select>
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gov-blue" size={16} />
          </div>

          <div className="relative">
            <select
              value={annexeFilter}
              disabled={!communeFilter}
              onChange={(e) => { setAnnexeFilter(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl appearance-none font-black text-[10px] uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-blue/10 transition-all cursor-pointer shadow-sm disabled:opacity-40"
            >
              <option value="">{isAr ? 'جميع الملحقات' : 'Toutes les annexes'}</option>
              {annexes.map((a) => (
                <option key={a.id} value={a.id}>{isAr && a.nomArabe ? a.nomArabe : a.nom}</option>
              ))}
            </select>
            <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-gov-blue" size={16} />
          </div>

          {/* New Date Filters */}
          <div className="relative">
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => { setDateDebut(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl appearance-none font-black text-[10px] uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-blue/10 transition-all cursor-pointer shadow-sm"
            />
            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gov-blue" size={16} />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black pointer-events-none opacity-40">{isAr ? 'من' : 'Du'}</div>
          </div>

          <div className="relative">
            <input
              type="date"
              value={dateFin}
              onChange={(e) => { setDateFin(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl appearance-none font-black text-[10px] uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-gov-blue/10 transition-all cursor-pointer shadow-sm"
            />
            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gov-blue" size={16} />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black pointer-events-none opacity-40">{isAr ? 'إلى' : 'Au'}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-600 tracking-[0.2em]">
                 <Zap size={14} className="text-gov-gold" />
                 {items.length} {isAr ? 'نتائج' : 'résultats trouvés'}
              </span>
           </div>
           
           <button 
             onClick={() => {
               setSearch('');
               setStatutFilter('');
               setSecteurFilter('');
               setCommuneFilter('');
               setAnnexeFilter('');
               setDateDebut('');
               setDateFin('');
             }}
             className="text-[10px] font-black uppercase text-gov-blue hover:text-blue-700 transition-colors flex items-center gap-2 tracking-widest"
           >
              {isAr ? 'إعادة تعيين الفلاتر' : 'Réinitialiser les filtres'}
              <X size={14} />
           </button>
        </div>
      </div>

      {/* 📑 BALANCED GRID */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2rem]" />
           ))}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                const p = getCardProps(item);
                const isHighlighted = highlightId === p.id;
                return (
                  <motion.div
                    key={p.id}
                    id={`item-${p.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedItem(p)}
                    className={`group bg-white rounded-[2.5rem] overflow-hidden border transition-all cursor-pointer flex flex-col relative h-full shadow-sm hover:shadow-2xl hover:-translate-y-2 ${
                      isHighlighted ? 'ring-4 ring-gov-blue ring-offset-4 border-gov-blue animate-pulse' : 'border-slate-100 hover:border-gov-blue/20'
                    }`}
                  >
                    <div className="h-40 w-full bg-slate-100 relative overflow-hidden flex-shrink-0">
                      {p.image ? (
                        <img 
                          src={p.image} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                             (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f1f5f9/64748b?text=Image+Indisponible';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon size={40} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest leading-none border shadow-md backdrop-blur-md ${STATUT_CONFIG[String(item.statut)]?.color || 'bg-white text-slate-800'}`}>
                            {STATUT_CONFIG[String(item.statut)]?.label || item.statut}
                        </div>
                        {p.needsClosure && (
                          <div className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest leading-none bg-red-500 text-white border-red-600 shadow-md flex items-center gap-1.5 animate-pulse">
                            <AlertCircle size={10} />
                            {isAr ? 'بانتظار تقرير الإغلاق' : 'Rapport Requis'}
                          </div>
                        )}
                        {p.hasReport && (
                          <div className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest leading-none bg-emerald-500 text-white border-emerald-600 shadow-md flex items-center gap-1.5">
                            <FileCheck size={10} />
                            {isAr ? 'تقرير متوفر' : 'Rapport Disponible'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <div className="mb-auto">
                            <div className="text-[9px] font-black text-gov-blue uppercase tracking-widest mb-2 flex items-center gap-1.5 opacity-90">
                               <Tag size={12} /> {item.tag}
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-1.5 line-clamp-2 leading-tight group-hover:text-gov-blue transition-colors">
                              {item.titre}
                            </h3>
                            <p className="text-slate-600 text-xs font-bold mb-4 line-clamp-2 leading-relaxed opacity-90">
                              {item.description}
                            </p>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-100 mt-2">
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-600">
                             <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-700" />
                                <span>{item.date}</span>
                             </div>
                             {item.lieu && (
                                <div className="flex items-center gap-2 truncate max-w-[140px]">
                                   <MapPin size={14} className="text-gov-blue" />
                                   <span className="truncate">{item.lieu}</span>
                                </div>
                             )}
                          </div>
                        </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {items.length === 0 && !loading && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-600">
                 <Filter size={64} className="mb-4 opacity-20" />
                 <p className="text-xl font-black">{isAr ? 'لا توجد نتائج' : 'Aucun résultat trouvé'}</p>
                 <p className="text-sm font-bold opacity-70">Essayez de modifier vos filtres.</p>
              </div>
            )}
          </div>

          {totalPages >= 1 && (
            <div className="flex justify-center items-center gap-6 mt-12 bg-white px-8 py-4 rounded-2xl border border-slate-100 w-fit mx-auto shadow-xl">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-3 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all shadow-sm"
              >
                {isAr ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
              <div className="text-xs font-black text-slate-900 tracking-[0.3em] uppercase">
                {isAr ? `صفحة ${page} / ${totalPages}` : `Page ${page} / ${totalPages}`}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-3 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all shadow-sm"
              >
                {isAr ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>
          )}
        </>
      )}

      {/* 🏢 DETAILED MODAL - PREMIUM READING */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/95 backdrop-blur-md"
             onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[3rem] shadow-2xl max-w-5xl w-full max-h-full overflow-hidden flex flex-col"
            >
              {/* Header with High Contrast Background Image */}
              <div className="relative h-40 md:h-48 bg-slate-900 flex items-center justify-center p-8 overflow-hidden flex-shrink-0 shadow-inner text-center">
                {selectedItem.image && (
                   <img 
                      src={selectedItem.image} 
                      className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay blur-[2px]" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                   />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/30" />
                <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
                  <div className="flex gap-3 mb-4 justify-center">
                    <span className="px-4 py-1.5 text-[10px] font-black rounded-lg bg-white/10 border border-white/20 text-white uppercase tracking-widest backdrop-blur-md">
                        {STATUT_CONFIG[String(selectedItem.statut)]?.label || selectedItem.statut}
                    </span>
                    <span className="px-4 py-1.5 text-[10px] font-black rounded-lg bg-gov-blue/90 border border-white/20 text-white uppercase tracking-widest shadow-lg shadow-gov-blue/40">
                        {selectedItem.tag}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-snug drop-shadow-lg max-w-3xl">{selectedItem.titre}</h2>
                </div>
                <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all border border-white/20 shadow-xl">
                  <X size={24} />
                </button>
              </div>

              {/* Body with High Contrast Text */}
              <div className="p-6 md:p-10 overflow-y-auto bg-slate-50 flex-1 grid md:grid-cols-3 gap-8 custom-scrollbar">
                   <div className="md:col-span-2 space-y-10">
                      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative">
                         <div className="absolute top-10 -left-1.5 w-3 h-12 bg-gov-blue rounded-r-lg" />
                         <h3 className="text-2xl font-black text-slate-900 mb-6">{isAr ? 'التفاصيل الكاملة' : 'Détails du dossier'}</h3>
                         <SafeHTML 
                            className="text-slate-700 leading-relaxed font-bold text-sm md:text-base whitespace-pre-wrap" 
                            html={selectedItem.raw.contenu || selectedItem.raw.description || ''} 
                         />
                      </div>
                      {selectedItem.raw.medias && selectedItem.raw.medias.length > 1 && (
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                           <h3 className="text-2xl font-black text-slate-900 mb-6">{isAr ? 'معرض الوسائط' : 'Galerie Médias'}</h3>
                           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                              {selectedItem.raw.medias.slice(1).map((m: any, idx: number) => (
                                 <img key={idx} src={m.urlPublique} onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f1f5f9/64748b?text=Media+Indisponible'; }} className="rounded-2xl w-full aspect-square object-cover shadow-sm hover:scale-105 transition-transform" />
                              ))}
                           </div>
                        </div>
                      )}
                   </div>
                   <div className="space-y-6">
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 sticky top-0">
                         <div className="flex gap-5"> <div className="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-2xl text-slate-600 shadow-inner"> <Calendar size={28} /> </div> <div> <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">{isAr ? 'التاريخ' : 'Calendrier'}</p> <p className="font-black text-slate-900 text-lg leading-none">{selectedItem.date}</p> </div> </div>
                         <div className="flex gap-5 pt-6 border-t border-slate-50"> <div className="w-14 h-14 bg-gov-blue/5 flex items-center justify-center rounded-2xl text-gov-blue shadow-inner"> <MapPin size={28} /> </div> <div> <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">{isAr ? 'الموقع الجغرافي' : 'Localisation'}</p> <p className="font-black text-slate-900 text-lg leading-none">{selectedItem.lieu}</p> <p className="text-xs font-bold text-slate-600 mt-1 opacity-80">{selectedItem.lieuDetail}</p> </div> </div>
                         {selectedItem.raw.capaciteMax && ( <div className="flex gap-5 pt-6 border-t border-slate-50"> <div className="w-14 h-14 bg-amber-50 flex items-center justify-center rounded-2xl text-amber-600 shadow-inner"> <Users size={28} /> </div> <div> <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">{isAr ? 'السعة' : 'Capacité Prévue'}</p> <p className="font-black text-slate-900 text-lg leading-none">{selectedItem.raw.capaciteMax} {isAr ? 'فرد' : 'Personnes'}</p> </div> </div> )}
                         {selectedItem.raw.nombreParticipations !== undefined && ( <div className="flex gap-5 pt-6 border-t border-slate-50"> <div className="w-14 h-14 bg-emerald-50 flex items-center justify-center rounded-2xl text-emerald-600 shadow-inner"> <Activity size={28} /> </div> <div> <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">{isAr ? 'المستوى التفاعلي' : 'Engagement'}</p> <p className="font-black text-slate-900 text-lg leading-none">{selectedItem.raw.nombreParticipations} {isAr ? 'تفاعل' : 'Actions'}</p> </div> </div> )}
                      </div>
                       {selectedItem.hasReport && (
                          <div className="p-1.5 bg-emerald-50 rounded-3xl border border-emerald-100 mb-6">
                            <div className="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col gap-4">
                               <div className="flex items-center gap-3 text-emerald-700">
                                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                     <FileCheck size={20} />
                                  </div>
                                  <span className="font-black text-sm uppercase tracking-widest">{isAr ? 'التقرير الختامي متوفر' : 'Rapport de Clôture Disponible'}</span>
                               </div>
                               <button 
                                 onClick={() => {
                                   if (selectedItem.raw.rapportClotureUrl) {
                                      window.open(selectedItem.raw.rapportClotureUrl, '_blank');
                                   } else {
                                      // If no URL but description exists, maybe it's already shown or we can trigger a detail view
                                      alert(isAr ? 'التقرير متوفر في تفاصيل السجل.' : 'Le rapport est disponible dans les détails ci-dessous.');
                                   }
                                 }}
                                 className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
                               >
                                  <FileSearch size={18} />
                                  {isAr ? 'الاطلاع على التقرير' : 'Consulter le Rapport'}
                               </button>
                            </div>
                          </div>
                       )}
                       <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center gap-4 shadow-xl"> <Shield size={24} className="text-gov-gold" /> <p className="text-[10px] font-black uppercase tracking-widest leading-tight"> {isAr ? 'نظام الحكامة الإقليمي لميديونة' : 'Governance System - Mediouna'} </p> </div>
                   </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

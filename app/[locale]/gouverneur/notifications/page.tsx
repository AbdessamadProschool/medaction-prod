'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  ChevronLeft, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Home,
  FileText,
  Calendar,
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';

interface Notification {
  id: string | number;
  titre: string;
  description: string;
  type: string;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
  date: string;
  isLue: boolean;
  lien?: string;
}

export default function GovernorNotificationsPage() {
  const t = useTranslations('governor');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();
  const { data: session } = useSession();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.notifications || []).map((n: any) => ({
          id: n.id,
          titre: n.titre,
          description: n.message,
          type: n.type || 'SYSTEM',
          priorite: n.priorite || 'MOYENNE',
          date: n.createdAt,
          isLue: n.isLue,
          lien: n.lien
        }));
        setNotifications(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string | number) => {
     try {
       await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
       setNotifications(prev => prev.map(n => n.id === id ? { ...n, isLue: true } : n));
     } catch(e) { console.error(e); }
  };

  const markAllRead = async () => {
     try {
       await fetch('/api/notifications/read-all', { method: 'PATCH' });
       setNotifications(prev => prev.map(n => ({ ...n, isLue: true })));
     } catch(e) { console.error(e); }
  };

  const filtered = notifications.filter(n => {
    const matchesSearch = n.titre.toLowerCase().includes(search.toLowerCase()) || 
                         n.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || !n.isLue;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link 
            href="/gouverneur"
            className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-all text-slate-600"
          >
            {isRTL ? <ChevronLeft className="rotate-180" size={20} /> : <ChevronLeft size={20} />}
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
               {t('header.notifications.title')}
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">MÉDIOUNA ACTION • CENTRE DE CONTRÔLE</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={markAllRead}
             className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-wide border border-slate-200"
           >
             <CheckCircle size={16} />
             {t('header.notifications.view_all')}
           </button>
           <Link 
             href="/gouverneur"
             className="px-6 py-2.5 bg-gov-blue text-white text-xs font-black rounded-2xl hover:bg-gov-blue/90 transition-all flex items-center gap-2 shadow-lg shadow-gov-blue/20 uppercase tracking-wide"
           >
             <Home size={16} />
             {isRTL ? 'لوحة القيادة' : 'Tableau de bord'}
           </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-8">
        {/* Statistics or Context */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <Bell size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('header.notifications.title')}</p>
                    <p className="text-2xl font-black text-slate-900">{notifications.length}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 border-l-4 border-l-blue-500">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Non lues</p>
                    <p className="text-2xl font-black text-slate-900">{notifications.filter(n => !n.isLue).length}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Traitées</p>
                    <p className="text-2xl font-black text-slate-900">{notifications.filter(n => n.isLue).length}</p>
                </div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-sm relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-gov-blue transition-colors" />
            <input 
              type="text" 
              placeholder={isRTL ? "البحث في الإشعارات..." : "Rechercher dans les notifications..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-gov-blue/5 focus:border-gov-blue outline-none transition-all font-bold text-sm shadow-sm"
            />
          </div>
          <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] border border-slate-200">
             <button 
               onClick={() => setFilter('ALL')}
               className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
             >
               {isRTL ? 'الكل' : 'TOUTES'}
             </button>
             <button 
               onClick={() => setFilter('UNREAD')}
               className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'UNREAD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
             >
               {isRTL ? 'غير مقروءة' : 'NON LUES'}
             </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4 pb-20">
          {loading ? (
             [1, 2, 3, 4, 5].map(i => (
               <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 animate-pulse space-y-4">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="h-4 w-1/3 bg-slate-100 rounded-lg" />
                        <div className="h-3 w-full bg-slate-100 rounded-lg" />
                        <div className="h-3 w-2/3 bg-slate-100 rounded-lg" />
                    </div>
                  </div>
               </div>
             ))
          ) : filtered.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex flex-col items-center justify-center py-24 bg-white rounded-[4rem] border border-slate-100 text-slate-400 shadow-sm"
             >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Bell size={48} className="opacity-10" />
                </div>
                <p className="text-xl font-black text-slate-900 mb-2">{isRTL ? 'لا توجد إشعارات حالياً' : 'Aucune notification'}</p>
                <p className="text-sm font-medium text-slate-500 max-w-xs text-center">{isRTL ? 'سيتم عرض جميع الإشعارات والتنبيهات هنا فور ورودها' : 'Toutes vos alertes et notifications système apparaîtront ici en temps réel.'}</p>
             </motion.div>
          ) : (
            filtered.map((n, idx) => (
              <motion.div 
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group bg-white p-8 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:-translate-y-1 flex gap-6 relative overflow-hidden ${n.isLue ? 'border-slate-100 grayscale-[0.5] opacity-80' : 'border-blue-100 shadow-xl shadow-blue-500/5'}`}
              >
                 {!n.isLue && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gov-blue" />
                 )}

                 <div className={`mt-1 flex-shrink-0 w-16 h-16 rounded-[1.5rem] flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110 ${
                   n.priorite === 'HAUTE' ? 'bg-red-50 border-red-100 text-red-500' :
                   n.priorite === 'MOYENNE' ? 'bg-amber-50 border-amber-100 text-amber-500' : 
                   'bg-blue-50 border-blue-100 text-blue-500'
                 }`}>
                    {n.type.includes('RECLAMATION') ? <MessageSquare size={24} /> :
                     n.type.includes('EVENT') ? <Calendar size={24} /> :
                     n.type.includes('SCORE') ? <Trophy size={24} /> :
                     <Bell size={24} />}
                 </div>

                 <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-3">
                          <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-gov-blue transition-colors">{n.titre}</h3>
                          {n.priorite === 'HAUTE' && (
                             <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black rounded-full uppercase tracking-widest animate-pulse">URGENT</span>
                          )}
                       </div>
                       {!n.isLue && (
                         <span className="w-2.5 h-2.5 bg-gov-blue rounded-full shadow-lg shadow-gov-blue/50" />
                       )}
                    </div>
                    <p className="text-sm font-medium text-slate-600 mb-4 leading-relaxed">{n.description}</p>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4">
                       <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 transition-colors group-hover:bg-white group-hover:border-slate-200">
                             <Clock size={12} className="text-slate-400" /> 
                             {new Date(n.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })} • {new Date(n.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </span>
                          <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                             {n.type}
                          </span>
                       </div>
                       
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          {!n.isLue && (
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="px-4 py-2 bg-slate-100 text-slate-700 text-[10px] font-black rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest border border-slate-200"
                            >
                              {isRTL ? 'تعيين كمقروء' : 'Marquer comme lu'}
                            </button>
                          )}
                          {n.lien && (
                            <Link 
                              href={n.lien}
                              className="px-4 py-2 bg-gov-blue text-white text-[10px] font-black rounded-xl hover:bg-gov-blue/90 transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-gov-blue/20"
                            >
                              {isRTL ? 'عرض التفاصيل' : 'Voir les détails'} <ArrowUpRight size={12} />
                            </Link>
                          )}
                       </div>
                    </div>
                 </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
      
      {/* Footer Branding */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md p-4 text-center pointer-events-none z-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Système de Gouvernance Intégré • Province de Médiouna</p>
      </footer>
    </div>
  );
}

const Trophy = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 22V18" />
    <path d="M14 22V18" />
    <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z" />
  </svg>
);

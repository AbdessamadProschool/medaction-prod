'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  Eye, 
  History,
  AlertCircle,
  FileText,
  User as UserIcon,
  Building2,
  Search,
  ChevronRight,
  ShieldCheck,
  Calendar,
  ExternalLink,
  MapPin,
  ClipboardList,
  GraduationCap,
  Coins,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getDemandesEtablissement } from '@/app/actions/etablissementWorkflow';
import { format as formatDate } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function MesDemandesPage() {
  const t = useTranslations('establishments_workflow');
  const te = useTranslations('admin.establishments');
  const tHistory = useTranslations('history_actions');
  const params = useParams();
  const locale = params.locale as string;
  const dateLocale = locale === 'ar' ? ar : fr;

  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const data = await getDemandesEtablissement();
      setDemandes(data);
    } catch (err) {
      toast.error("Échec du chargement de vos demandes");
    } finally {
      setLoading(false);
    }
  };

  const filteredDemandes = demandes.filter(d => 
    (d.donneesModifiees.nom || d.etablissement?.nom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        <Link 
          href="/delegation/etablissements" 
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors font-bold text-sm mb-4"
        >
          <ChevronLeft size={16} />
          {te('back_list')}
        </Link>

        {/* Header Header Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 dark:shadow-none">
              <ClipboardList size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                {t('mes_demandes_title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {t('mes_demandes_subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl w-full md:w-64 focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-medium"
              />
            </div>
            <Button variant="outline" onClick={fetchDemandes} className="rounded-2xl h-12 px-6 border-gray-200 dark:border-gray-700 font-bold">
              <History size={18} className="mr-2" />
              {te('requests.refresh')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar: Liste des demandes */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
               <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <Clock size={16} />
                 {t('admin_validation.history')} ({filteredDemandes.length})
               </h3>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-2 custom-scrollbar">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 animate-pulse" />
                ))
              ) : filteredDemandes.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 p-12 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <FileText size={32} />
                  </div>
                  <p className="text-gray-500 font-bold">{te('requests.no_requests')}</p>
                </div>
              ) : (
                filteredDemandes.map(d => (
                  <motion.div 
                    layoutId={`card-${d.id}`}
                    key={d.id}
                    onClick={() => setSelectedDemande(d)}
                    className={`p-6 rounded-[1.75rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${
                      selectedDemande?.id === d.id 
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10 shadow-lg shadow-emerald-500/5' 
                        : 'border-white dark:border-gray-900 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
                    }`}
                  >
                    {selectedDemande?.id === d.id && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-[2rem] flex items-center justify-center text-emerald-500">
                         <ChevronRight size={24} />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        d.statut === 'EN_ATTENTE_VALIDATION' ? 'bg-amber-100 text-amber-700' : 
                        d.statut === 'APPROUVEE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {t(`status.${d.statut}`)}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                      <span className="opacity-40 font-medium mr-1 text-[10px]">
                        {d.type === 'CREATION' ? tHistory('CREATION') : tHistory('UPDATE')}
                      </span><br/>
                      {d.donneesModifiees.nom || d.etablissement?.nom}
                    </h3>
                    
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-bold tracking-tighter">
                          {t('submitted_on', { date: formatDate(new Date(d.createdAt), 'dd/MM/yyyy', { locale: dateLocale }) })}
                        </span>
                        <Eye size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Main Content: Détails de la demande */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedDemande ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden"
                >
                  {/* Banner Detail */}
                  <div className="bg-gray-900 dark:bg-black p-10 text-white relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                       <Building2 size={200} />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-4">
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none py-1.5 px-4 rounded-full text-xs font-black tracking-widest">
                          {selectedDemande.type === 'CREATION' ? tHistory('CREATION') : tHistory('UPDATE')}
                        </Badge>
                        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                          <Calendar size={14} />
                          {formatDate(new Date(selectedDemande.createdAt), 'PPPP', { locale: dateLocale })}
                        </div>
                      </div>
                      <h2 className="text-4xl font-black tracking-tight">
                        {selectedDemande.donneesModifiees.nom || selectedDemande.etablissement?.nom}
                      </h2>
                    </div>
                  </div>

                  <div className="p-8 md:p-12 space-y-12">
                    {/* Status Summary */}
                    <div className={`p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 ${
                        selectedDemande.statut === 'APPROUVEE' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30' 
                          : selectedDemande.statut === 'REJETEE'
                            ? 'bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-300 border border-red-100 dark:border-red-900/30'
                            : 'bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30'
                      }`}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                          selectedDemande.statut === 'APPROUVEE' ? 'bg-emerald-500 text-white' : 
                          selectedDemande.statut === 'REJETEE' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {selectedDemande.statut === 'APPROUVEE' ? <CheckCircle2 size={32} /> : 
                           selectedDemande.statut === 'REJETEE' ? <XCircle size={32} /> : <Clock size={32} />}
                        </div>
                        <div className="text-center md:text-left space-y-1">
                          <h4 className="text-xl font-black">
                            {t(`status.${selectedDemande.statut}`)}
                          </h4>
                          <p className="font-medium opacity-75">
                            {selectedDemande.statut === 'EN_ATTENTE_VALIDATION' 
                              ? t('processing_admin') 
                              : t('processed_on', { date: formatDate(new Date(selectedDemande.dateValidation || selectedDemande.updatedAt), 'dd/MM/yyyy') })}
                          </p>
                          {selectedDemande.statut === 'REJETEE' && (
                            <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-current border-opacity-10 italic">
                               <span className="font-black uppercase text-[10px] block mb-1">{t('rejection_reason')} :</span>
                               {selectedDemande.motifRejet || t('no_justification')}
                            </div>
                          )}
                        </div>
                      </div>

                    {/* Justification */}
                    <div className="space-y-4">
                        <h4 className="font-black text-gray-400 uppercase text-xs tracking-widest flex items-center gap-2">
                           <AlertCircle size={16} />
                           {t('justification')}
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 italic text-gray-600 dark:text-gray-300">
                           {selectedDemande.justification || t('no_justification')}
                        </div>
                    </div>

                    {/* Data Summary */}
                    <div className="space-y-6">
                        <h4 className="font-black text-gray-400 uppercase text-xs tracking-widest flex items-center gap-2">
                           <FileText size={16} />
                           {t('details_title')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(selectedDemande.donneesModifiees).map(([k, v]: [string, any]) => {
                                if (v === null || v === '' || typeof v === 'object') return null;
                                return (
                                    <div key={k} className="flex flex-col p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">
                                            {te(`form.${k}`) || k}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {typeof v === 'boolean' ? (v ? 'Oui' : 'Non') : String(v)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800 p-12 text-center">
                   <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center mb-6 text-gray-200">
                      <Eye size={48} strokeWidth={1} />
                   </div>
                   <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('select_demande')}</h3>
                   <p className="text-gray-400 font-medium max-w-sm mx-auto">{t('select_demande_desc')}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
        }
      `}</style>
    </div>
  );
}

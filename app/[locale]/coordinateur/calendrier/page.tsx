'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Building2,
  Clock,
  Users,
  MapPin,
  X,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Send,
  Eye,
  FileEdit,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { arMA } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import BulkImportModal from '@/components/coordinateur/BulkImportModal';

interface Activite {
  id: number;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  typeActivite: string;
  statut: string;
  lieu?: string;
  participantsAttendus?: number;
  isVisiblePublic: boolean;
  isValideParAdmin: boolean;
  rapportComplete?: boolean;
  etablissement: { id: number; nom: string; secteur: string };
  description?: string;
  responsableNom?: string;
  isRecurrent?: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'DAILY_NO_WEEKEND';
  recurrenceEndDate?: string;
  recurrenceDays?: number[]; // Array of day indices (0-6)
  recurrenceParentId?: number | null;
}

interface CreateActivityData {
  etablissementId: number;
  date: string;
  heureDebut: string;
  heureFin: string;
  titre: string;
  description?: string;
  typeActivite: string;
  responsableNom?: string;
  participantsAttendus?: number;
  lieu?: string;
  isRecurrent: boolean;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'DAILY_NO_WEEKEND';
  recurrenceEndDate?: string;
  recurrenceDays?: number[];
}

const secteurColors: Record<string, { bg: string; border: string; text: string }> = {
  EDUCATION: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  SANTE: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  SPORT: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  CULTUREL: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  SOCIAL: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  AUTRE: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
};

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
// ... previous imports ...

export default function CalendrierPage() {
  const t = useTranslations('coordinator.calendar');
  const tStatus = useTranslations('coordinator.status');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [etablissements, setEtablissements] = useState<{ id: number; nom: string; secteur: string }[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedActivite, setSelectedActivite] = useState<Activite | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activite | null>(null);
  
  const activityIdParam = searchParams.get('activite');

  const brouillonsCount = activites.filter(a => a.statut === 'BROUILLON').length;
  const enAttenteCount = activites.filter(a => a.statut === 'EN_ATTENTE_VALIDATION').length;

  // Week starts on Sunday (0) now
  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek]);
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { weekStartsOn: 0 }), [currentWeek]);
  const daysOfWeek = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  const dateDebutStr = useMemo(() => format(weekStart, 'yyyy-MM-dd'), [weekStart]);
  const dateFinStr = useMemo(() => format(weekEnd, 'yyyy-MM-dd'), [weekEnd]);

  const fetchActivites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/programmes-activites?dateDebut=${dateDebutStr}&dateFin=${dateFinStr}`);
      if (res.ok) {
        const data = await res.json();
        setActivites(data.data || []);
        
        const etabs = data.data?.reduce((acc: any[], a: Activite) => {
          if (!acc.find(e => e.id === a.etablissement.id)) {
            acc.push(a.etablissement);
          }
          return acc;
        }, []) || [];
        setEtablissements(etabs);
      }
    } catch (error) {
      console.error('Erreur chargement activités:', error);
    } finally {
      setLoading(false);
    }
  }, [dateDebutStr, dateFinStr]);

  useEffect(() => {
    fetchActivites();
  }, [fetchActivites]);

  // Deep Link Logic
  useEffect(() => {
      if (activityIdParam && activites.length > 0) {
          const found = activites.find(a => a.id === parseInt(activityIdParam));
          if (found) {
              setSelectedActivite(found);
              setShowDetailModal(true);
          }
      }
  }, [activityIdParam, activites]);

  const closeDetailModal = () => {
      setShowDetailModal(false);
      setSelectedActivite(null);
      const params = new URLSearchParams(searchParams);
      params.delete('activite');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

      const getActivitesForDay = (date: Date) => {
    return activites.filter(a => {
      const activityDate = parseISO(a.date);
      const isStartDay = isSameDay(activityDate, date);

      // 1. Always show the physical record for its specific date
      if (isStartDay) return true;
      
      // 2. If it's not the start day, check if this activity generates a recurrence ensuring:
      //    - It IS recurrent
      //    - It is a PARENT (recurrenceParentId is null) - Optional, but safer
      //    - The target date is AFTER the start date
      if (!a.isRecurrent || !a.recurrencePattern) return false;
      if (isBefore(date, startOfDay(activityDate))) return false;

      // 3. Check End Date
      if (a.recurrenceEndDate) {
         const endDate = parseISO(a.recurrenceEndDate);
         if (isAfter(date, endOfDay(endDate))) return false;
      }

      // 4. Check Pattern
      let patternMatches = false;
      const pattern = a.recurrencePattern.toUpperCase();
      
      if (pattern === 'DAILY') {
          patternMatches = true;
      } else if (pattern === 'DAILY_NO_WEEKEND') {
          const day = date.getDay();
          // 0 is Sunday, 6 is Saturday
          patternMatches = day !== 0 && day !== 6;
      } else if (pattern === 'WEEKLY') {
          if (a.recurrenceDays && a.recurrenceDays.length > 0) {
              patternMatches = a.recurrenceDays.includes(date.getDay());
          } else {
              patternMatches = date.getDay() === activityDate.getDay();
          }
      } else if (pattern === 'MONTHLY') {
          patternMatches = date.getDate() === activityDate.getDate();
      }

      if (!patternMatches) return false;

      // 5. Anti-Duplicate: Check if a physical "Child" record already exists for this date
      const hasPhysicalChild = activites.some(other => 
        other.recurrenceParentId === a.id && 
        isSameDay(parseISO(other.date), date)
      );

      // Also check if 'a' IS the child for this date (just to be safe, though step 1 covers it)
      if (a.recurrenceParentId && isSameDay(parseISO(a.date), date)) return true;

      // Ensure we don't show the parent if it's "simulated" but a real child exists
      if (hasPhysicalChild) return false;

      return true;
    });
  };

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  const openCreatePanel = (date?: Date) => {
    setEditingActivity(null);
    setSelectedDate(date || new Date());
    setShowCreatePanel(true);
  };

  const submitAllForValidation = async () => {
    if (brouillonsCount === 0) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/programmes-activites/soumettre-tout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchActivites();
        // Toast logic would be better here
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = (statut: string) => {
    switch (statut) {
        case 'BROUILLON': return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '📝' };
        case 'EN_ATTENTE_VALIDATION': return { bg: 'bg-amber-100', text: 'text-amber-700', icon: '⏳' };
        case 'PLANIFIEE': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📅' };
        case 'EN_COURS': return { bg: 'bg-green-100', text: 'text-green-700', icon: '▶️' };
        case 'TERMINEE': return { bg: 'bg-gray-100', text: 'text-gray-500', icon: '✅' };
        case 'RAPPORT_COMPLETE': return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '📊' };
        case 'ANNULEE': return { bg: 'bg-red-100', text: 'text-red-700', icon: '❌' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: '?' };
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
           <div className="p-4 bg-blue-50 rounded-2xl hidden md:block">
              <Calendar className="w-8 h-8 text-blue-600" />
           </div>
           <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-500">{t('subtitle')}</p>
           </div>
           
           <div className="h-10 w-px bg-gray-200 hidden md:block mx-2"></div>
           
           <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl">
              <button onClick={goToNextWeek} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm">
                 <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center min-w-[180px] font-bold text-gray-900">
                 {format(weekStart, 'd MMMM', { locale: arMA })} - {format(weekEnd, 'd MMMM yyyy', { locale: arMA })}
              </div>
              <button onClick={goToPreviousWeek} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm">
                 <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
           </div>
           
           <button onClick={goToToday} className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
              {t('today')}
           </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
           {brouillonsCount > 0 && (
            <button
              onClick={submitAllForValidation}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-70"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t('submit_all', { count: brouillonsCount })}
            </button>
           )}
           
           <button
             onClick={() => setShowImportModal(true)}
             className="flex items-center gap-2 px-4 py-3 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
           >
             <FileSpreadsheet className="w-5 h-5" />
             {t('import')}
           </button>
           
           <button
             onClick={() => openCreatePanel()}
             className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
           >
             <Plus className="w-5 h-5" />
             {t('new_activity')}
           </button>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="mr-3 text-gray-500 font-medium">{t('loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-gray-100">
            {daysOfWeek.map((day, index) => {
              const isPastDay = day < new Date(new Date().setHours(0, 0, 0, 0));
              const isTodayDay = isToday(day);
              const dayActivities = getActivitesForDay(day);
              
              return (
              <div key={day.toISOString()} className={`min-h-[200px] md:min-h-[600px] ${isPastDay ? 'bg-gray-50/50' : 'bg-white'}`}>
                {/* Day Header */}
                <div className={`p-4 text-center border-b border-gray-100 ${
                    isTodayDay ? 'bg-blue-600 text-white shadow-md' : isPastDay ? 'bg-gray-50' : 'bg-white'
                  }`}>
                  <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${
                    isTodayDay ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {format(day, 'EEEE', { locale: arMA })}
                  </p>
                  <p className={`text-2xl font-black ${
                    isTodayDay ? 'text-white' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </p>
                </div>

                {/* Activities List */}
                <div className="p-3 space-y-3">
                  {dayActivities.map((activite) => {
                    const colors = secteurColors[activite.etablissement.secteur] || secteurColors.AUTRE;
                    const style = statusConfig(activite.statut);
                    
                    return (
                      <motion.div
                        key={`${activite.id}-${day.toISOString()}`}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedActivite(activite);
                          setShowDetailModal(true);
                        }}
                        className={`
                          p-3 rounded-2xl border cursor-pointer relative overflow-hidden group
                          ${colors.bg} ${colors.border}
                          hover:shadow-lg transition-all duration-300
                          ${isPastDay ? 'opacity-70' : ''}
                        `}
                      >
                         <div className="absolute top-2 left-2">
                            <span className={`w-2 h-2 rounded-full block ${activite.statut === 'EN_COURS' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                         </div>
                        
                         <div className="mb-2 pr-4">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 opacity-80 block mb-0.5">
                             {activite.etablissement.nom}
                           </span>
                           <h4 className={`font-bold text-sm leading-tight ${colors.text} line-clamp-2`}>
                             {activite.titre}
                           </h4>
                         </div>

                         <div className="flex items-center justify-between mt-3">
                           <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-xs font-bold text-gray-600 dir-ltr">
                                {activite.heureDebut} - {activite.heureFin}
                              </span>
                           </div>
                         </div>
                         
                         {/* Recurrence Badge for Generated Events */}
                         {activite.isRecurrent && (
                            <div className="mt-1 flex justify-end">
                                <RefreshCw className="w-3 h-3 text-blue-500 opacity-50" />
                            </div>
                         )}
                         
                         {/* Status Badge */}
                         {activite.statut !== 'PLANIFIEE' && (
                             <div className="mt-2 text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${style.bg} ${style.text}`}>
                                    {style.icon} {tStatus(activite.statut.toLowerCase() as any)}
                                </span>
                             </div>
                         )}

                         {/* Report Needed Badge */}
                         {activite.statut === 'TERMINEE' && !activite.rapportComplete && (
                             <div className="mt-1 text-right">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 animate-pulse">
                                    📋 {t('detail_modal.report_status.required')}
                                </span>
                             </div>
                         )}
                      </motion.div>
                    );
                  })}

                  {!isPastDay && (
                    <button
                      onClick={() => openCreatePanel(day)}
                      className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                        <Plus size={14} className="text-gray-500 group-hover:text-blue-700" />
                      </div>
                      <span className="text-sm font-bold">{t('add')}</span>
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Create Panel & Modals */}
      <AnimatePresence>
        {showCreatePanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setShowCreatePanel(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto"
            >
              <CreateActivityPanel 
                selectedDate={selectedDate}
                onClose={() => setShowCreatePanel(false)}
                onSuccess={() => {
                  setShowCreatePanel(false);
                  fetchActivites();
                }}
                initialData={editingActivity}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Detail Modal */}
      {showDetailModal && selectedActivite && (
        <ActivityDetailModal 
            activite={selectedActivite}
            onClose={closeDetailModal}
            onUpdate={fetchActivites}
            onEdit={(act) => {
                setEditingActivity(act);
                setSelectedDate(parseISO(act.date));
                setShowDetailModal(false);
                setShowCreatePanel(true);
            }}
        />
      )}

      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          fetchActivites();
        }}
      />
    </div>
  );
}

// Update imports to include Trash2, Edit
import { 
  // ... existing imports
  Trash2,
  Edit,
  Check
} from 'lucide-react';

// ... existing interfaces

// Update CreateActivityPanel props
interface CreateActivityPanelProps {
  selectedDate: Date | null;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Activite | null; // Add this
}

// ... existing helper functions

// ... Main Component logic update: handleEdit
// We need to move the sub-components logic inside the main or render them with correct props.

// Let's modify the sub-components first, assuming they are at the bottom of the file.

function ActivityDetailModal({ 
    activite, 
    onClose, 
    onUpdate,
    onEdit 
}: { 
    activite: Activite, 
    onClose: () => void, 
    onUpdate: () => void,
    onEdit: (activite: Activite) => void 
}) {
    const t = useTranslations('coordinator.calendar.detail_modal');
    const tStatus = useTranslations('coordinator.status');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(t('confirm_delete'))) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/programmes-activites/${activite.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                onUpdate(); // Refreshes list and closes modal via parent logic if needed, but we should close here too
                onClose();
            } else {
                alert(t('error_delete'));
            }
        } catch (e) {
            console.error(e);
            alert(t('error_delete'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden text-right flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
                dir="rtl"
            >
                {/* Header */}
                <div className="relative">
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500"></div>
                    <div className="p-6 pb-2 flex items-start justify-between">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold mb-2">
                                {activite.etablissement.nom}
                            </span>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">{activite.titre}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 flex-shrink-0">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Dates */}
                    <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold">{t('date')}</p>
                            <p className="font-bold">{format(parseISO(activite.date), 'EEEE d MMMM yyyy', { locale: arMA })}</p>
                        </div>
                    </div>

                    {/* Times */}
                    <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold">{t('time_start')} / {t('time_end')}</p>
                            <p className="font-bold dir-ltr">{activite.heureDebut} - {activite.heureFin}</p>
                        </div>
                    </div>

                     {/* Location */}
                     {activite.lieu && (
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold">{t('location')}</p>
                                <p className="font-bold">{activite.lieu}</p>
                            </div>
                        </div>
                    )}

                    {/* Responsible */}
                    {activite.responsableNom && (
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold">{t('responsible')}</p>
                                <p className="font-bold">{activite.responsableNom}</p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {activite.description && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="text-xs font-bold text-gray-400 mb-2">{t('description')}</h4>
                            <p className="text-gray-700 leading-relaxed font-medium">
                                {activite.description}
                            </p>
                        </div>
                    )}

                    {/* Recurrence Info */}
                     {activite.isRecurrent && (
                        <div className="bg-blue-50/50 rounded-xl p-3 flex items-center gap-3 border border-blue-100">
                            <RefreshCw className="w-4 h-4 text-blue-500" />
                            <div className="text-sm">
                                <span className="font-bold text-blue-700 block">
                                    {t('is_recurrent')} ({t(activite.recurrencePattern?.toLowerCase() || 'daily')})
                                </span>
                                {activite.recurrenceEndDate && (
                                    <span className="text-blue-500 text-xs">
                                       {t('recurrence_end')}: {format(parseISO(activite.recurrenceEndDate), 'd MMMM yyyy', { locale: arMA })}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
                    <div className="grid grid-cols-2 gap-3">
                         <button 
                            onClick={handleDelete} 
                            disabled={isDeleting}
                            className="py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                         >
                             {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                             {t('delete')}
                         </button>
                         <button 
                            onClick={() => onEdit(activite)}
                            className="py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                         >
                             <Edit className="w-4 h-4" />
                             {t('edit')}
                         </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function CreateActivityPanel({
  selectedDate,
  onClose,
  onSuccess,
  initialData
}: {
  selectedDate: Date | null;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Activite | null;
}) {
  const t = useTranslations('coordinator.calendar.create_panel');
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // Success state
  const [etablissements, setEtablissements] = useState<{ id: number; nom: string; secteur: string }[]>([]);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [formData, setFormData] = useState<CreateActivityData>({
    etablissementId: 0,
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : today,
    heureDebut: '09:00',
    heureFin: '12:00',
    titre: '',
    description: '',
    typeActivite: '',
    responsableNom: '',
    lieu: '',
    isRecurrent: false,
    recurrencePattern: 'DAILY', // Default to DAILY to ensure UI renders correctly
  });

  // Pre-fill data if editing
  useEffect(() => {
      if (initialData) {
          setFormData({
              etablissementId: initialData.etablissement.id,
              date: format(parseISO(initialData.date), 'yyyy-MM-dd'),
              heureDebut: initialData.heureDebut,
              heureFin: initialData.heureFin,
              titre: initialData.titre,
              description: initialData.description || '', 
              typeActivite: initialData.typeActivite,
              responsableNom: initialData.responsableNom || '',
              lieu: initialData.lieu || '',
              participantsAttendus: initialData.participantsAttendus,
              // Correctly load recurrence data
              isRecurrent: initialData.isRecurrent || false,
              recurrencePattern: initialData.recurrencePattern,
              recurrenceEndDate: initialData.recurrenceEndDate ? format(parseISO(initialData.recurrenceEndDate), 'yyyy-MM-dd') : undefined,
          });
      }
  }, [initialData]);

  // ... fetchEtabs logic ...
  useEffect(() => {
      // ... (keep existing fetch logic)
       const fetchEtabs = async () => {
         try {
             const res = await fetch('/api/etablissements?limit=100');
             if(res.ok) {
                 const data = await res.json();
                 setEtablissements(data.data || []);
             }
         } catch(e) {}
       }
       fetchEtabs();
  }, []);

  const [error, setError] = useState<string | null>(null);

  // Auto-select logic ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.etablissementId <= 0) {
        setError("المرجو اختيار المؤسسة");
        return;
    }
    
    setError(null);
    setLoading(true);
    try {
        const url = initialData 
            ? `/api/programmes-activites/${initialData.id}` 
            : '/api/programmes-activites';
        
        const method = initialData ? 'PATCH' : 'POST';

        // Clean payload: remove empty strings and nulls
        const payload = {
            ...formData,
            recurrenceEndDate: formData.recurrenceEndDate || undefined,
            description: formData.description || undefined,
            responsableNom: formData.responsableNom || undefined,
            lieu: formData.lieu || undefined,
            // Ensure recurrencePattern is a valid string if recurrent, otherwise undefined
            recurrencePattern: formData.isRecurrent 
                ? (formData.recurrencePattern || 'DAILY') // Fallback to DAILY if null/empty
                : undefined,
            recurrenceDays: formData.isRecurrent && formData.recurrencePattern === 'WEEKLY' 
                ? formData.recurrenceDays 
                : undefined,
        };

        const res = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 2000); // Wait 2s before closing
        } else {
            console.error('API Error:', data);
            if (data.details && Array.isArray(data.details)) {
                // Construct a readable error message from Zod issues
                const detailedError = data.details.map((d: any) => 
                    `${d.path ? d.path.join('.') + ': ' : ''}${d.message}`
                ).join(' | ');
                setError(detailedError);
            } else {
                setError(data.message || data.error || "حدث خطأ أثناء حفظ النشاط");
            }
        }
    } catch (err) {
        console.error(err);
        setError("حدث خطأ في الاتصال");
    } finally {
        setLoading(false);
    }
  };

  if (success) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-white">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                  <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">
                  {initialData ? t('success_update') : t('success_create')}
              </h3>
              <p className="text-gray-500">
                  {t('success_message')}
              </p>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-white text-right" dir="rtl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div>
                <h2 className="text-xl font-black text-gray-900">
                    {initialData ? t('edit_title') : t('title')}
                </h2>
                <p className="text-gray-500 text-sm">{t('subtitle')}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form id="create-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Error Banner */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                             <AlertCircle className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-sm">{error}</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('activity_title')}</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            required
                            value={formData.titre}
                            onChange={e => setFormData({...formData, titre: e.target.value})}
                            className="w-full pr-12 pl-4 py-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-lg text-gray-800 placeholder-gray-300 text-right"
                            placeholder={t('activity_title_placeholder')}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center pointer-events-none">
                             <FileEdit className="w-4 h-4 text-blue-500" />
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('date')}</label>
                         <div className="relative">
                            <input 
                                type="date"
                                required 
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-right h-[50px] font-bold text-gray-800"
                            />
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none" />
                        </div>
                    </div>
                    
                    {/* Date Preview Card */}
                    <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 flex flex-col justify-center items-center text-center">
                         {formData.date && !isNaN(new Date(formData.date).getTime()) ? (
                            <>
                                <span className="text-2xl font-black text-blue-600 leading-none mb-1">
                                    {format(parseISO(formData.date), 'd', { locale: arMA })}
                                </span>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                                    {format(parseISO(formData.date), 'MMMM yyyy', { locale: arMA })}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium bg-white px-2 py-0.5 rounded-full mt-1 shadow-sm">
                                    {format(parseISO(formData.date), 'EEEE', { locale: arMA })}
                                </span>
                            </>
                         ) : (
                             <span className="text-gray-400 text-sm">--/--/----</span>
                         )}
                    </div>
                </div>

                {/* Time Selection with 24h Standard */}
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('time_start')}</label>
                        <div className="flex items-center gap-2" dir="ltr">
                            {/* Heures */}
                            <div className="relative flex-1">
                                <select 
                                    value={formData.heureDebut.split(':')[0]}
                                    onChange={e => {
                                        const mm = formData.heureDebut.split(':')[1] || '00';
                                        setFormData({...formData, heureDebut: `${e.target.value}:${mm}`});
                                    }}
                                    className="w-full appearance-none px-3 py-3 rounded-xl border border-gray-200 bg-white font-mono text-center font-bold focus:border-blue-500 outline-none hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    {Array.from({ length: 24 }).map((_, i) => {
                                        const h = i.toString().padStart(2, '0');
                                        return <option key={h} value={h}>{h}</option>;
                                    })}
                                </select>
                            </div>
                            <span className="font-bold text-gray-400">:</span>
                            {/* Minutes */}
                            <div className="relative flex-1">
                                <select 
                                    value={formData.heureDebut.split(':')[1]}
                                    onChange={e => {
                                        const hh = formData.heureDebut.split(':')[0] || '09';
                                        setFormData({...formData, heureDebut: `${hh}:${e.target.value}`});
                                    }}
                                    className="w-full appearance-none px-3 py-3 rounded-xl border border-gray-200 bg-white font-mono text-center font-bold focus:border-blue-500 outline-none hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    {['00', '15', '30', '45'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('time_end')}</label>
                        <div className="flex items-center gap-2" dir="ltr">
                            {/* Heures */}
                            <div className="relative flex-1">
                                <select 
                                    value={formData.heureFin.split(':')[0]}
                                    onChange={e => {
                                        const mm = formData.heureFin.split(':')[1] || '00';
                                        setFormData({...formData, heureFin: `${e.target.value}:${mm}`});
                                    }}
                                    className="w-full appearance-none px-3 py-3 rounded-xl border border-gray-200 bg-white font-mono text-center font-bold focus:border-blue-500 outline-none hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    {Array.from({ length: 24 }).map((_, i) => {
                                        const h = i.toString().padStart(2, '0');
                                        return <option key={h} value={h}>{h}</option>;
                                    })}
                                </select>
                            </div>
                            <span className="font-bold text-gray-400">:</span>
                            {/* Minutes */}
                            <div className="relative flex-1">
                                <select 
                                    value={formData.heureFin.split(':')[1]}
                                    onChange={e => {
                                        const hh = formData.heureFin.split(':')[0] || '10';
                                        setFormData({...formData, heureFin: `${hh}:${e.target.value}`});
                                    }}
                                    className="w-full appearance-none px-3 py-3 rounded-xl border border-gray-200 bg-white font-mono text-center font-bold focus:border-blue-500 outline-none hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    {['00', '15', '30', '45'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('establishment')}</label>
                    <div className="relative">
                        <select 
                            className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none bg-white font-bold text-gray-800 text-right appearance-none h-[50px]"
                            value={formData.etablissementId}
                            onChange={e => setFormData({...formData, etablissementId: parseInt(e.target.value)})}
                        >
                            <option value={0}>{t('select_establishment')}</option>
                            {etablissements.map(e => (
                                <option key={e.id} value={e.id}>{e.nom}</option>
                            ))}
                        </select>
                        <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronLeft className="w-4 h-4 text-gray-400 -rotate-90" />
                        </div>
                    </div>
                </div>
                 
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('type')}</label>
                        <div className="relative">
                            <select 
                                required
                                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none bg-white font-medium appearance-none text-right"
                                value={formData.typeActivite}
                                onChange={e => setFormData({...formData, typeActivite: e.target.value})}
                            >
                                <option value="">{t('select_type')}</option>
                                <option value="CULTUREL">ثقافي</option>
                                <option value="SPORTIF">رياضي</option>
                                <option value="SOCIAL">اجتماعي</option>
                                <option value="EDUCATIF">تربوي</option>
                                <option value="SANTE">صحي</option>
                                <option value="ENVIRONNEMENT">بيئي</option>
                                <option value="AUTRE">آخر</option>
                            </select>
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronLeft className="w-4 h-4 text-gray-400 -rotate-90" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('location')}</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={formData.lieu || ''}
                                onChange={e => setFormData({...formData, lieu: e.target.value})}
                                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-right placeholder-gray-400"
                                placeholder="مثال: القاعة الكبرى"
                            />
                            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('description')}</label>
                    <div className="relative">
                        <textarea 
                            rows={3}
                            value={formData.description || ''}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none resize-none text-right placeholder-gray-400"
                            placeholder={t('description_placeholder')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('responsible')}</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={formData.responsableNom || ''}
                                onChange={e => setFormData({...formData, responsableNom: e.target.value})}
                                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-right placeholder-gray-400"
                                placeholder="اسم المسؤول"
                            />
                            <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">{t('participants')}</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                min="0"
                                value={formData.participantsAttendus || ''}
                                onChange={e => setFormData({...formData, participantsAttendus: parseInt(e.target.value) || 0})}
                                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-right placeholder-gray-400"
                                placeholder="0"
                            />
                            <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox"
                            id="recurrence"
                            checked={formData.isRecurrent}
                            onChange={e => {
                                const checked = e.target.checked;
                                setFormData({
                                    ...formData, 
                                    isRecurrent: checked,
                                    recurrencePattern: checked && !formData.recurrencePattern ? 'DAILY' : formData.recurrencePattern
                                })
                            }}
                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                        />
                        <label htmlFor="recurrence" className="font-bold text-gray-700 select-none cursor-pointer flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-blue-600" />
                            {t('is_recurrent')}
                        </label>
                    </div>

                    {formData.isRecurrent && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 text-right">{t('recurrence_pattern')}</label>
                                <select 
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none bg-white text-sm font-medium text-right"
                                    value={formData.recurrencePattern === 'DAILY_NO_WEEKEND' ? 'DAILY' : formData.recurrencePattern}
                                    onChange={e => {
                                        const val = e.target.value;
                                        // If switching away from DAILY, reset to simple pattern. 
                                        // Specific DAILY logic is handled below.
                                        setFormData({...formData, recurrencePattern: val as any})
                                    }}
                                >
                                    <option value="DAILY">{t('daily')}</option>
                                    <option value="WEEKLY">{t('weekly')}</option>
                                    <option value="MONTHLY">{t('monthly')}</option>
                                </select>
                                
                                {/* Checkbox for skipping weekends - Only visible if Daily is selected */}
                                {(formData.recurrencePattern === 'DAILY' || formData.recurrencePattern === 'DAILY_NO_WEEKEND') && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <input 
                                            type="checkbox"
                                            id="skip_weekend"
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                            checked={formData.recurrencePattern === 'DAILY_NO_WEEKEND'}
                                            onChange={(e) => {
                                                setFormData({
                                                    ...formData, 
                                                    recurrencePattern: e.target.checked ? 'DAILY_NO_WEEKEND' : 'DAILY'
                                                });
                                            }}
                                        />
                                        <label htmlFor="skip_weekend" className="text-xs text-gray-600 cursor-pointer select-none">
                                            {t('daily_no_weekend')}
                                        </label>
                                    </div>
                                )}

                                {/* Specific Days Selection for Weekly */}
                                {formData.recurrencePattern === 'WEEKLY' && (
                                    <div className="mt-3">
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 text-right">{t('select_days')}</label>
                                        <div className="flex flex-wrap gap-1 justify-end" dir="rtl">
                                            {[
                                                { k: 1, l: t('days.mon') },
                                                { k: 2, l: t('days.tue') },
                                                { k: 3, l: t('days.wed') },
                                                { k: 4, l: t('days.thu') },
                                                { k: 5, l: t('days.fri') },
                                                { k: 6, l: t('days.sat') },
                                                { k: 0, l: t('days.sun') },
                                            ].map((day) => {
                                                const isSelected = formData.recurrenceDays?.includes(day.k);
                                                return (
                                                    <button
                                                        key={day.k}
                                                        type="button"
                                                        onClick={() => {
                                                            const currentDays = formData.recurrenceDays || [];
                                                            let newDays;
                                                            if (currentDays.includes(day.k)) {
                                                                newDays = currentDays.filter(d => d !== day.k);
                                                            } else {
                                                                newDays = [...currentDays, day.k];
                                                            }
                                                            setFormData({...formData, recurrenceDays: newDays});
                                                        }}
                                                        className={`
                                                            w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all
                                                            ${isSelected 
                                                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100' 
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                            }
                                                        `}
                                                        title={day.l}
                                                    >
                                                        {day.l.charAt(0)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Specific Days Selection for Weekly */}
                                {formData.recurrencePattern === 'WEEKLY' && (
                                    <div className="mt-3">
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 text-right">{t('select_days')}</label>
                                        <div className="flex flex-wrap gap-1 justify-end" dir="rtl">
                                            {[
                                                { k: 1, l: t('days.mon') },
                                                { k: 2, l: t('days.tue') },
                                                { k: 3, l: t('days.wed') },
                                                { k: 4, l: t('days.thu') },
                                                { k: 5, l: t('days.fri') },
                                                { k: 6, l: t('days.sat') },
                                                { k: 0, l: t('days.sun') },
                                            ].map((day) => {
                                                const isSelected = formData.recurrenceDays?.includes(day.k);
                                                return (
                                                    <button
                                                        key={day.k}
                                                        type="button"
                                                        onClick={() => {
                                                            const currentDays = formData.recurrenceDays || [];
                                                            let newDays;
                                                            if (currentDays.includes(day.k)) {
                                                                newDays = currentDays.filter(d => d !== day.k);
                                                            } else {
                                                                newDays = [...currentDays, day.k];
                                                            }
                                                            setFormData({...formData, recurrenceDays: newDays});
                                                        }}
                                                        className={`
                                                            w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all
                                                            ${isSelected 
                                                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100' 
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                            }
                                                        `}
                                                        title={day.l}
                                                    >
                                                        {day.l.charAt(0)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 text-right">{t('recurrence_end')}</label>
                                <input 
                                    type="date"
                                    required={formData.isRecurrent}
                                    value={formData.recurrenceEndDate || ''}
                                    onChange={e => setFormData({...formData, recurrenceEndDate: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm text-right"
                                />
                                <p className="text-[10px] text-blue-600 mt-1 font-bold px-1 text-right">
                                    {formData.recurrenceEndDate && !isNaN(new Date(formData.recurrenceEndDate).getTime()) 
                                        ? format(parseISO(formData.recurrenceEndDate), 'EEEE d MMMM yyyy', { locale: arMA })
                                        : ''}
                                </p>
                            </div>
                        </div>
                    )}
                </div>    
             </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
             {/* ... buttons ... */}
            <button 
                type="submit"
                form="create-form"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                {initialData ? t('save_changes') : t('create')}
            </button>
        </div>
    </div>
  );
}


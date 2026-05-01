'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  ArrowRight, 
  History,
  AlertCircle,
  FileText,
  User as UserIcon,
  Building2,
  MoreVertical,
  Search,
  Filter,
  Layers,
  ChevronRight,
  ShieldCheck,
  Calendar,
  ExternalLink,
  MapPin,
  ClipboardList,
  GraduationCap,
  Coins,
  Loader2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getDemandesEtablissement, traiterDemandeEtablissement } from '@/app/actions/etablissementWorkflow';
import { format as formatDate } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDemandesPage() {
  const t = useTranslations('establishments_workflow');
  const te = useTranslations('admin.establishments');
  const tHistory = useTranslations('history_actions');
  const params = useParams();
  const locale = params.locale as string;
  const dateLocale = locale === 'ar' ? ar : fr;

  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState<any>(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [processing, setProcessing] = useState(false);
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
      toast.error("Échec du chargement des demandes");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'APPROUVER' | 'REJETER') => {
    if (action === 'REJETER' && !motifRejet) {
      toast.error(t('admin_validation.motif_rejet'));
      return;
    }

    setProcessing(true);
    try {
      const res = await traiterDemandeEtablissement({
        demandeId: selectedDemande.id,
        action,
        motifRejet
      });

      if (res.success) {
        toast.success(action === 'APPROUVER' ? t('admin_validation.applied_success') : t('admin_validation.rejected_success'));
        setSelectedDemande(null);
        setMotifRejet('');
        fetchDemandes();
      } else {
        toast.error(res.error || 'Erreur');
      }
    } catch (err) {
      toast.error("Erreur serveur");
    } finally {
      setProcessing(false);
    }
  };

  const filteredDemandes = demandes.filter(d => 
    (d.donneesModifiees.nom || d.etablissement?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.soumisPar.prenom + ' ' + d.soumisPar.nom).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header Ultra-Compact */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[hsl(213,80%,28%)] rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-900/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                {t('admin_validation.title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">
                {te('requests.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[hsl(213,80%,28%)] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl w-full md:w-64 focus:ring-2 focus:ring-[hsl(213,80%,28%)] transition-all outline-none text-sm font-bold text-gray-900 dark:text-white"
              />
            </div>
            <Button variant="outline" onClick={fetchDemandes} className="rounded-xl h-10 px-4 border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-gray-800">
              <History size={16} className="mr-2" />
              {te('requests.refresh')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar: Liste des demandes */}
          <div className="xl:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
               <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <ClipboardList size={16} />
                 Demandes ({filteredDemandes.length})
               </h3>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-2 custom-scrollbar">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
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
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                      selectedDemande?.id === d.id 
                        ? 'border-[hsl(213,80%,28%)] bg-blue-50/50 dark:bg-blue-900/10 shadow-md' 
                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
                    }`}
                  >
                    {selectedDemande?.id === d.id && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-[hsl(213,80%,28%)] rounded-bl-2xl flex items-center justify-center text-white">
                         <ChevronRight size={16} />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        d.statut === 'EN_ATTENTE_VALIDATION' ? 'bg-amber-100 text-amber-700' : 
                        d.statut === 'APPROUVEE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {t(`status.${d.statut}`)}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold ml-auto tracking-tighter">
                        #{d.id}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                      <span className="opacity-40 font-medium mr-1 text-[10px] block mb-1 uppercase tracking-widest">
                        {d.type === 'CREATION' ? tHistory('CREATION') : tHistory('UPDATE')}
                      </span>
                      {d.donneesModifiees.nom || d.etablissement?.nom}
                    </h3>
                    
                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                         <UserIcon size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{d.soumisPar.prenom} {d.soumisPar.nom}</span>
                        <span className="text-[10px] text-gray-400">{formatDate(d.createdAt, 'dd MMM yyyy à HH:mm', { locale: dateLocale })}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Main Content: Détails de la demande */}
          <div className="xl:col-span-8">
            <AnimatePresence mode="wait">
              {selectedDemande ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Banner Detail */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 md:p-8 border-b border-gray-200 dark:border-gray-700 relative">
                    <div className="relative z-10 space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[hsl(213,80%,28%)] text-white border-none py-1 px-3 rounded-lg text-[10px] font-black tracking-widest uppercase">
                          {selectedDemande.type === 'CREATION' ? tHistory('CREATION') : tHistory('UPDATE')}
                        </Badge>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold">
                          <Calendar size={14} />
                          {formatDate(selectedDemande.createdAt, 'PPPPpp', { locale: dateLocale })}
                        </div>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {selectedDemande.donneesModifiees.nom || selectedDemande.etablissement?.nom}
                      </h2>
                      <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                              <UserIcon size={18} className="text-[hsl(213,80%,28%)]" />
                           </div>
                           <div>
                              <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest">{t('admin_validation.soumis_par')}</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedDemande.soumisPar.prenom} {selectedDemande.soumisPar.nom}</p>
                           </div>
                        </div>
                        {selectedDemande.etablissementId && (
                           <a 
                             href={`/${locale}/etablissements/${selectedDemande.etablissementId}`} 
                             target="_blank"
                             className="ml-auto flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors py-2 px-4 rounded-xl backdrop-blur-md"
                           >
                             Voir fiche actuelle <ExternalLink size={14} />
                           </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-8">
                    {/* Justification Box Premium */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-4 shadow-sm">
                      <div className="w-12 h-12 bg-[hsl(213,80%,28%)] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <h4 className="text-[hsl(213,80%,28%)] dark:text-blue-300 font-black text-sm mb-1 uppercase tracking-wide">
                          {t('justification')}
                        </h4>
                        <p className="text-amber-900/70 dark:text-amber-100/70 leading-relaxed text-lg italic font-medium">
                          "{selectedDemande.justification || 'Pas de justification fournie'}"
                        </p>
                      </div>
                    </div>

                    {/* Data Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { id: 'general', label: te('sections.general'), icon: Building2, color: 'text-[hsl(213,80%,28%)]', fields: ['nom', 'nomArabe', 'code', 'secteur', 'typeEtablissement', 'nature', 'tutelle', 'statutJuridique', 'gestionnaire', 'responsableNom', 'anneeCreation', 'anneeOuverture'] },
                        { id: 'location', label: te('sections.localization'), icon: MapPin, color: 'text-blue-600', fields: ['communeId', 'annexeId', 'quartierDouar', 'adresseComplete', 'latitude', 'longitude', 'altitude', 'distanceChefLieu', 'transportPublic', 'voieAcces'] },
                        { id: 'infra', label: te('sections.infra'), icon: Layers, color: 'text-indigo-600', fields: ['etatInfrastructure', 'statutFonctionnel', 'surfaceTotale', 'disponibiliteEau', 'disponibiliteElectricite', 'connexionInternet', 'nombreSalles'] },
                        { id: 'education', label: te('sections.education'), icon: GraduationCap, color: 'text-blue-500', fields: ['cycle', 'nbClasses', 'nbEnseignants', 'nbCadres', 'elevesPrescolaire', 'elevesPrescolaireFilles', 'elevesTotal', 'elevesFilles', 'nouveauxInscrits', 'nouveauxInscritsFilles', 'tauxReussite', 'fillesDerniereAnnee'] },
                        { id: 'financial', label: te('sections.financial'), icon: Coins, color: 'text-[hsl(213,80%,40%)]', fields: ['budgetAnnuel', 'sourcesFinancement', 'partenaires'] },
                        { id: 'observations', label: 'Observations', icon: FileText, color: 'text-indigo-500', fields: ['remarques', 'besoinsUrgents', 'projetsFuturs'] },
                      ].map(group => {
                        const groupFields = Object.entries(selectedDemande.donneesModifiees)
                          .filter(([k]) => group.fields.includes(k));

                        if (groupFields.length === 0) return null;

                        return (
                          <div key={group.id} className="space-y-5">
                            <h4 className={`font-black flex items-center gap-3 ${group.color} uppercase text-xs tracking-[0.2em] px-2`}>
                               <group.icon size={18} />
                               {group.label}
                            </h4>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 shadow-sm">
                              {groupFields.map(([k, v]: [string, any]) => (
                                <div key={k} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                      {te(`form.${k}`) || k}
                                    </span>
                                    <span className={`text-sm font-bold ${v === null || v === '' ? 'text-gray-300 italic' : 'text-gray-900 dark:text-gray-100'}`}>
                                      {v === null || v === undefined || v === '' ? 'N/A' : 
                                       typeof v === 'boolean' ? (v ? '✅ Oui' : '❌ Non') : 
                                       k === 'budgetAnnuel' ? v.toLocaleString() + ' DH' : String(v)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Données Libres / Complémentaires Section */}
                    <div className="pt-10 border-t border-gray-100 dark:border-gray-800">
                        <h4 className="font-black text-gray-400 uppercase text-xs tracking-[0.2em] mb-6 flex items-center gap-2">
                           <Layers size={18} />
                           {t('complementary_fields')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                           {Object.keys(selectedDemande.champsComplementaires || {}).length > 0 ? (
                             Object.entries(selectedDemande.champsComplementaires).map(([k, v]: [string, any]) => (
                               <div key={k} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm">
                                  <p className="text-[10px] font-black text-[hsl(213,80%,28%)] uppercase tracking-tighter mb-1">{k}</p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{String(v)}</p>
                               </div>
                             ))
                           ) : (
                             <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-20 grayscale">
                                <Layers size={48} strokeWidth={1} />
                                <p className="text-xs font-black uppercase mt-4 tracking-widest">Aucun champ personnalisé</p>
                             </div>
                           )}
                        </div>
                    </div>

                    {/* Footer Actions Sticky for Selection */}
                    {selectedDemande.statut === 'EN_ATTENTE_VALIDATION' && (
                      <div className="pt-10 border-t border-gray-100 dark:border-gray-800 space-y-8 animate-in slide-in-from-bottom-5 duration-700">
                        <div className="space-y-4">
                           <label className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                             <XCircle size={18} className="text-red-500" />
                             {t('admin_validation.motif_rejet')}
                           </label>
                             <textarea 
                              value={motifRejet}
                              onChange={e => setMotifRejet(e.target.value)}
                              placeholder={t('admin_validation.motif_placeholder')}
                              className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[hsl(213,80%,28%)] focus:border-[hsl(213,80%,28%)] transition-all text-gray-900 dark:text-white font-medium"
                              rows={3}
                             />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button 
                            disabled={processing}
                            onClick={() => handleAction('REJETER')}
                            className="flex-1 h-16 rounded-2xl font-black text-lg bg-gray-100 dark:bg-gray-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-3 group"
                          >
                            <XCircle size={22} className="group-hover:scale-110 transition-transform" />
                            {t('admin_validation.reject')}
                          </button>
                          <button 
                            disabled={processing}
                            onClick={() => handleAction('APPROUVER')}
                            className="flex-1 h-14 rounded-xl font-black text-base bg-[hsl(213,80%,28%)] text-white hover:bg-[hsl(213,80%,20%)] active:scale-95 transition-all shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 group"
                          >
                            {processing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />}
                            {t('admin_validation.approve')}
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedDemande.statut !== 'EN_ATTENTE_VALIDATION' && (
                      <div className={`mt-8 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 border ${
                        selectedDemande.statut === 'APPROUVEE' 
                          ? 'bg-green-50 dark:bg-green-900/10 text-green-900 dark:text-green-300 border-green-200 dark:border-green-900/30' 
                          : 'bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-300 border-red-200 dark:border-red-900/30'
                      }`}>
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                          selectedDemande.statut === 'APPROUVEE' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {selectedDemande.statut === 'APPROUVEE' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                        </div>
                        <div className="text-center md:text-left space-y-2">
                          <h4 className="text-2xl font-black tracking-tight">
                            Demande traitée le {formatDate(selectedDemande.dateValidation || selectedDemande.updatedAt, 'PPP à HH:mm', { locale: dateLocale })}
                          </h4>
                          <p className="font-bold opacity-75 text-lg">
                            Statut final : <span className="underline decoration-2 underline-offset-4 uppercase tracking-widest">{t(`status.${selectedDemande.statut}`)}</span>
                          </p>
                          {selectedDemande.statut === 'REJETEE' && (
                            <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-current border-opacity-10 italic">
                               Motif de rejet : {selectedDemande.motifRejet || 'Non spécifié'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                 <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
                   <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-6 text-gray-300 dark:text-gray-600">
                      <Building2 size={48} strokeWidth={1} />
                   </div>
                   <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{te('requests.select_to_view')}</h3>
                   <p className="text-gray-500 font-bold max-w-sm mx-auto">{te('requests.can_validate_reject')}</p>
                   <div className="mt-8 flex gap-2">
                      <div className="w-2 h-2 bg-[hsl(213,80%,28%)] rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-[hsl(213,80%,28%)] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-[hsl(213,80%,28%)] rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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

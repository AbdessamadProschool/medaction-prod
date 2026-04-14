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
  Layers
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getDemandesEtablissement, traiterDemandeEtablissement } from '@/app/actions/etablissementWorkflow';
import { format as formatDate } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
export default function AdminDemandesPage() {
  const t = useTranslations('establishments_workflow');
  const te = useTranslations('admin.establishments');
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState<any>(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [processing, setProcessing] = useState(false);

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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-emerald-500" size={32} />
            {t('admin_validation.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Arbitrage et validation du patrimoine provincial
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={fetchDemandes}>
             <History size={18} className="mr-2" />
             Rafraîchir
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Liste des demandes */}
        <div className="xl:col-span-4 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12">
               <Clock className="animate-spin text-emerald-500" size={32} />
            </div>
          ) : demandes.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">Aucune demande en attente</p>
            </div>
          ) : (
            demandes.map(d => (
              <div 
                key={d.id}
                onClick={() => setSelectedDemande(d)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${
                  selectedDemande?.id === d.id 
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500' 
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-emerald-200 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={d.statut === 'EN_ATTENTE_VALIDATION' ? 'secondary' : d.statut === 'APPROUVEE' ? 'default' : 'destructive'} className={d.statut === 'EN_ATTENTE_VALIDATION' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-none' : d.statut === 'APPROUVEE' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none' : ''}>
                    {t(`status.${d.statut}`)}
                  </Badge>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    #{d.id}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-900 dark:text-white truncate">
                  {d.type === 'CREATION' ? "Création : " : "Modif : "}
                  {d.donneesModifiees.nom || d.etablissement?.nom}
                </h3>
                
                <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                     <UserIcon size={12} />
                  </div>
                  <span className="font-medium">{d.soumisPar.prenom} {d.soumisPar.nom}</span>
                  <span className="ml-auto opacity-70">{formatDate(d.createdAt, 'dd MMM HH:mm')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Détails de la demande sélectionnée */}
        <div className="xl:col-span-8">
          {selectedDemande ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Building2 size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-white/20 text-white backdrop-blur-md border-white/20">
                      {selectedDemande.type}
                    </Badge>
                    <span className="text-gray-400 text-sm">{formatDate(selectedDemande.createdAt, 'PPpp')}</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight mt-2">
                    {selectedDemande.donneesModifiees.nom || selectedDemande.etablissement?.nom}
                  </h2>
                  <p className="text-gray-400 mt-2 flex items-center gap-2">
                    <UserIcon size={16} />
                    {t('admin_validation.soumis_par')} : <span className="text-white font-bold">{selectedDemande.soumisPar.prenom} {selectedDemande.soumisPar.nom}</span>
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Justification */}
                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                  <h4 className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2 mb-3">
                    <AlertCircle size={18} />
                    {t('justification')}
                  </h4>
                  <p className="text-amber-900/80 dark:text-amber-100/80 leading-relaxed italic">
                    "{selectedDemande.justification || 'Pas de justification fournie'}"
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Données Modifiées (Groupées) */}
                  <div className="space-y-6">
                    {[
                      { id: 'general', label: te('sections.general'), fields: ['nom', 'nomArabe', 'code', 'secteur', 'typeEtablissement', 'nature', 'tutelle', 'statutJuridique', 'gestionnaire', 'responsableNom', 'anneeCreation', 'anneeOuverture'] },
                      { id: 'location', label: te('sections.localization'), fields: ['communeId', 'annexeId', 'quartierDouar', 'adresseComplete', 'latitude', 'longitude', 'altitude', 'distanceChefLieu', 'transportPublic', 'voieAcces'] },
                      { id: 'infra', label: te('sections.infra'), fields: ['etatInfrastructure', 'statutFonctionnel', 'surfaceTotale', 'disponibiliteEau', 'disponibiliteElectricite', 'connexionInternet', 'nombreSalles'] },
                      { id: 'staff', label: te('sections.staff'), fields: ['effectifTotal', 'nombrePersonnel', 'cadre', 'capaciteAccueil'] },
                      { id: 'education', label: te('sections.education'), fields: ['cycle', 'nbClasses', 'nbEnseignants', 'nbCadres', 'elevesPrescolaire', 'elevesPrescolaireFilles', 'elevesTotal', 'elevesFilles', 'nouveauxInscrits', 'nouveauxInscritsFilles', 'tauxReussite', 'fillesDerniereAnnee'] },
                      { id: 'financial', label: te('sections.financial'), fields: ['budgetAnnuel', 'sourcesFinancement', 'partenaires'] },
                      { id: 'observations', label: 'Observations', fields: ['remarques', 'besoinsUrgents', 'projetsFuturs'] },
                    ].map(group => {
                      const groupFields = Object.entries(selectedDemande.donneesModifiees)
                        .filter(([k]) => group.fields.includes(k));

                      if (groupFields.length === 0) return null;

                      return (
                        <div key={group.id} className="space-y-4">
                          <h4 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white uppercase text-[10px] tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">
                             {group.label}
                          </h4>
                          <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-4 divide-y divide-gray-100 dark:divide-gray-800">
                            {groupFields.map(([k, v]: [string, any]) => (
                              <div key={k} className="flex justify-between items-center py-2.5 px-1 hover:bg-white dark:hover:bg-gray-800 transition-colors rounded-lg">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter w-1/3 truncate">
                                  {te(`form.${k}`) || k}
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">
                                  {v === null || v === undefined || v === '' ? (
                                    <em className="opacity-30">Vide</em>
                                  ) : typeof v === 'boolean' ? (
                                    v ? 'Oui' : 'Non'
                                  ) : typeof v === 'number' && k === 'budgetAnnuel' ? (
                                    v.toLocaleString() + ' DH'
                                  ) : String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Données Complémentaires + Autres */}
                  <div className="space-y-8">
                    {/* Autres Champs Standard non groupés */}
                    {(() => {
                      const allKnownFields = [
                        'nom', 'nomArabe', 'code', 'secteur', 'typeEtablissement', 'nature', 'tutelle', 'statutJuridique', 'gestionnaire', 'responsableNom', 'anneeCreation', 'anneeOuverture',
                        'communeId', 'annexeId', 'quartierDouar', 'adresseComplete', 'latitude', 'longitude', 'altitude', 'distanceChefLieu', 'transportPublic', 'voieAcces',
                        'etatInfrastructure', 'statutFonctionnel', 'surfaceTotale', 'disponibiliteEau', 'disponibiliteElectricite', 'connexionInternet', 'nombreSalles',
                        'effectifTotal', 'nombrePersonnel', 'cadre', 'capaciteAccueil',
                        'cycle', 'nbClasses', 'nbEnseignants', 'nbCadres', 'elevesPrescolaire', 'elevesPrescolaireFilles', 'elevesTotal', 'elevesFilles', 'nouveauxInscrits', 'nouveauxInscritsFilles', 'tauxReussite', 'fillesDerniereAnnee',
                        'budgetAnnuel', 'sourcesFinancement', 'partenaires',
                        'remarques', 'besoinsUrgents', 'projetsFuturs', 'justification'
                      ];
                      const remainingFields = Object.entries(selectedDemande.donneesModifiees)
                        .filter(([k]) => !allKnownFields.includes(k));

                      if (remainingFields.length === 0) return null;

                      return (
                        <div className="space-y-4">
                          <h4 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white uppercase text-[10px] tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">
                             Champs Additionnels
                          </h4>
                          <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-4 divide-y divide-gray-100 dark:divide-gray-800">
                            {remainingFields.map(([k, v]: [string, any]) => (
                               <div key={k} className="flex justify-between items-center py-2.5 px-1 hover:bg-white dark:hover:bg-gray-800 transition-colors rounded-lg">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter w-1/3 truncate">{k}</span>
                                 <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">{String(v)}</span>
                               </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Données Complémentaires (JSON) */}
                    <div className="space-y-4">
                      <h4 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white uppercase text-[10px] tracking-widest border-b border-blue-100 dark:border-blue-900/50 pb-2">
                         <Layers size={14} className="text-blue-500" />
                         Données Complémentaires (Libres)
                      </h4>
                      <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-4 min-h-[100px] divide-y divide-gray-100 dark:divide-gray-800">
                        {Object.keys(selectedDemande.champsComplementaires || {}).length > 0 ? (
                          Object.entries(selectedDemande.champsComplementaires).map(([k, v]: [string, any]) => (
                            <div key={k} className="flex justify-between items-center py-2.5 px-1 hover:bg-white dark:hover:bg-gray-800 transition-colors rounded-lg">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{k}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{String(v)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 opacity-30">
                             <Layers size={24} strokeWidth={1} />
                             <p className="text-[10px] uppercase font-bold mt-2 tracking-widest">Aucun champ personnalisé</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions de validation */}
                {selectedDemande.statut === 'EN_ATTENTE_VALIDATION' && (
                  <div className="pt-8 border-t border-gray-100 dark:border-gray-700 space-y-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                         {t('admin_validation.motif_rejet')}
                       </label>
                       <textarea 
                        value={motifRejet}
                        onChange={e => setMotifRejet(e.target.value)}
                        placeholder={t('admin_validation.motif_placeholder')}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                       />
                    </div>
                    
                    <div className="flex gap-4">
                      <Button 
                        variant="destructive" 
                        size="lg" 
                        className="flex-1 rounded-2xl font-bold py-6 group"
                        onClick={() => handleAction('REJETER')}
                        disabled={processing}
                      >
                        <XCircle size={20} className="mr-2 group-hover:scale-110 transition-transform" />
                        {t('admin_validation.reject')}
                      </Button>
                      <Button 
                        variant="default" 
                        size="lg" 
                        className="flex-1 rounded-2xl font-bold py-6 group bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleAction('APPROUVER')}
                        disabled={processing}
                      >
                        <CheckCircle2 size={20} className="mr-2 group-hover:scale-110 transition-transform" />
                        {t('admin_validation.approve')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Info de traitement si déjà fait */}
                {selectedDemande.statut !== 'EN_ATTENTE_VALIDATION' && (
                  <div className={`mt-8 p-6 rounded-2xl flex items-center gap-4 ${
                    selectedDemande.statut === 'APPROUVEE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {selectedDemande.statut === 'APPROUVEE' ? <CheckCircle2 /> : <XCircle />}
                    <div>
                      <p className="font-bold">Demande déjà traitée le {formatDate(selectedDemande.dateValidation, 'PPP')}</p>
                      {selectedDemande.statut === 'REJETEE' && (
                        <p className="mt-1 text-sm opacity-90">Motif : {selectedDemande.motifRejet}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center text-gray-400">
               <Building2 size={64} strokeWidth={1} className="mb-6 opacity-20" />
               <p className="text-lg">Sélectionnez une demande dans la liste pour l'examiner.</p>
               <p className="text-sm mt-1">Vous pourrez valider ou rejeter les modifications après examen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

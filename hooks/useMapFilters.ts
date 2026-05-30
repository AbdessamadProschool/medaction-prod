import { useState, useMemo, useEffect } from 'react';
import { useData } from './use-data';
import annexesGeoData from '@/components/maps/data/annexes-geo.json';
import { getEtabScore, checkUrgency } from '@/lib/scoring';

export function useMapFilters(mode: 'PUBLIC' | 'GOVERNOR') {
  // --- Data Fetching avec le hook standardisé ---
  const { data: etabData, isLoading: isEtabLoading, error: etabError } = useData(`/api/map/etablissements?mode=${mode}`);
  const { data: communesData, isLoading: isCommunesLoading, error: communesError } = useData('/api/map/communes');
  
  const error = etabError || communesError;
  
  // --- States des filtres ---
  const [selectedCommune, setSelectedCommune] = useState<number | null>(null);
  const [selectedAnnexe, setSelectedAnnexe] = useState<number | null>(null);
  const [secteurFilters, setSecteurFilters] = useState<Record<string, boolean>>({});
  const [showPolygons, setShowPolygons] = useState(true);
  const [viewMode, setViewMode] = useState<'STANDARD' | 'PERFORMANCE'>('STANDARD');
  const [hasActivitiesOnly, setHasActivitiesOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minAbonnements, setMinAbonnements] = useState(0);
  const [showUrgencies, setShowUrgencies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNatures, setSelectedNatures] = useState<Record<string, boolean>>({});
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: annexesData } = useData(
    selectedCommune ? `/api/annexes?communeId=${selectedCommune}` : null
  );

  const availableAnnexes = annexesData || [];
  
  // --- Post-processing des données (Extraction & Normalisation) ---
  const etablissements = useMemo(() => {
    if (!etabData?.geojson?.features) return [];
    
    return etabData.geojson.features.map((f: any) => {
      let s = (f.properties.secteur || 'AUTRE').toUpperCase().trim();
      if (s.includes('CULTURE') || s.includes('JEUNES') || s.includes('BIBLIO')) s = 'CULTUREL';
      else if (s.includes('SPORT')) s = 'SPORT';
      else if (s.includes('SANTE') || s.includes('MEDECIN') || s.includes('HOPITAL')) s = 'SANTE';
      else if (s.includes('SOCIAL') || s.includes('FEMININ') || s.includes('FOYER')) s = 'SOCIAL';
      else if (s.includes('EDUC') || s.includes('ECOLE') || s.includes('LYCEE')) s = 'EDUCATION';
      else if (!['AUTRE', 'CULTUREL', 'SPORT', 'SANTE', 'SOCIAL', 'EDUCATION'].includes(s)) s = 'AUTRE';

      return {
        ...f.properties,
        secteur: s,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0]
      };
    });
  }, [etabData]);

  const communes = communesData?.communes || [];
  const communesGeoJSON = communesData?.geojson || null;
  const annexesGeoJSON = annexesGeoData;

  // --- Derived State & Logic ---
  const availableNatures = useMemo(() => {
    const natures = new Set<string>();
    etablissements.forEach((e: any) => {
      if (secteurFilters[e.secteur] !== false) {
        const type = (e.typeEtablissement && e.typeEtablissement.trim() !== "") ? e.typeEtablissement : e.nature;
        if (type) natures.add(type);
      }
    });
    return Array.from(natures).sort();
  }, [etablissements, secteurFilters]);

  const maxPerformanceScore = useMemo(() => {
    if (etablissements.length === 0) return 100;
    const max = Math.max(...etablissements.map((e: any) => getEtabScore(e)));
    return max > 50 ? max : 50; 
  }, [etablissements]);

  // Update Sector Stats
  const secteurStats = useMemo(() => {
    const stats: Record<string, number> = {};
    etablissements.forEach((e: any) => {
      stats[e.secteur] = (stats[e.secteur] || 0) + 1;
    });
    return stats;
  }, [etablissements]);

  // Reset annexe if commune changes
  useEffect(() => {
    setSelectedAnnexe(null);
  }, [selectedCommune]);

  // --- The Big Filter Function ---
  const filteredEtablissements = useMemo(() => {
    return etablissements.filter((etab: any) => {
      if (selectedCommune) {
         const directMatch = etab.communeId && Number(etab.communeId) === Number(selectedCommune);
         const annexeMatch = etab.annexeCommuneId && Number(etab.annexeCommuneId) === Number(selectedCommune);
         if (!directMatch && !annexeMatch) {
             if (!etab.communeId && !etab.annexeCommuneId && etab.communeNom) {
                 const commune = communes.find((c: any) => c.id === selectedCommune);
                 if (commune && etab.communeNom.trim().toLowerCase() !== commune.nom.trim().toLowerCase()) return false;
             } else {
                 return false;
             }
         }
      }

      if (selectedAnnexe) {
          if (!etab.annexeId || Number(etab.annexeId) !== Number(selectedAnnexe)) return false;
      }

      if (secteurFilters[etab.secteur] === false) return false;
      if (hasActivitiesOnly && (!etab.activitesCount || etab.activitesCount === 0)) return false;
      if ((etab.noteMoyenne || 0) < minRating) return false;
      if ((etab.abonnementsCount || 0) < minAbonnements) return false;
      
      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         if (!etab.nom.toLowerCase().includes(q) && !etab.secteur.toLowerCase().includes(q)) return false;
      }

      const type = (etab.typeEtablissement && etab.typeEtablissement.trim() !== "") ? etab.typeEtablissement : etab.nature;
      if (type && selectedNatures[type] === false) return false;

      const now = new Date();
      let checkEvents = periodFilter !== 'ALL' || statusFilter !== 'ALL';
      
      if (checkEvents) {
         const allEvents = [...(etab.eventsList || []), ...(etab.activitiesList || [])];
         if (allEvents.length === 0) return false;

         const hasMatchingEvent = allEvents.some((evt: any) => {
            const startStr = evt.dateDebut || evt.date;
            if (!startStr) return false;
            const start = new Date(startStr);
            
            if (statusFilter !== 'ALL') {
                if (statusFilter === 'EN_COURS' && (evt.statut !== 'EN_COURS' && evt.statut !== 'EN_ACTION')) return false;
                if (statusFilter === 'A_VENIR' && (evt.statut !== 'PUBLIEE' && evt.statut !== 'PLANIFIEE' && evt.statut !== 'VALIDEE')) return false;
                if (statusFilter === 'TERMINEE' && (evt.statut !== 'TERMINEE' && evt.statut !== 'CLOTUREE' && evt.statut !== 'RAPPORT_COMPLETE')) return false;
            }
            
            if (periodFilter !== 'ALL') {
                const diffTime = start.getTime() - now.getTime();
                const daysUntilStart = diffTime / (1000 * 60 * 60 * 24);
                
                if (daysUntilStart < -1) return false;
                
                if (periodFilter === '7D' && daysUntilStart > 7) return false;
                if (periodFilter === '15D' && daysUntilStart > 15) return false;
                if (periodFilter === '30D' && daysUntilStart > 30) return false;
                if (periodFilter === '60D' && daysUntilStart > 60) return false;
                if (periodFilter === '180D' && daysUntilStart > 180) return false;
                if (periodFilter === '365D' && daysUntilStart > 365) return false;
            }
            return true;
         });

         if (!hasMatchingEvent) return false;
      }

      const isUrgent = checkUrgency(etab);
      if (showUrgencies && !isUrgent) return false;

      return true;
    });
  }, [etablissements, selectedCommune, selectedAnnexe, secteurFilters, communes, hasActivitiesOnly, showUrgencies, minRating, minAbonnements, searchQuery, selectedNatures, periodFilter, statusFilter]);

  return {
    loading: isEtabLoading || isCommunesLoading,
    error,
    communes,
    etablissements,
    communesGeoJSON,
    annexesGeoJSON,
    availableAnnexes,
    filteredEtablissements,
    availableNatures,
    secteurStats,
    maxPerformanceScore,
    filters: {
      selectedCommune, setSelectedCommune,
      selectedAnnexe, setSelectedAnnexe,
      secteurFilters, setSecteurFilters,
      showPolygons, setShowPolygons,
      viewMode, setViewMode,
      hasActivitiesOnly, setHasActivitiesOnly,
      minRating, setMinRating,
      minAbonnements, setMinAbonnements,
      showUrgencies, setShowUrgencies,
      searchQuery, setSearchQuery,
      selectedNatures, setSelectedNatures,
      periodFilter, setPeriodFilter,
      statusFilter, setStatusFilter
    }
  };
}

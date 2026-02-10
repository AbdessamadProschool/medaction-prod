'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Building2, GraduationCap, Heart, Dumbbell, Users, Palette, Star, MapPin,
  Layers, Filter, Loader2, ZoomIn, ZoomOut, Activity, BarChart3, AlertTriangle, Calendar, Megaphone, ArrowUpRight
} from 'lucide-react';
import annexesGeoData from './data/annexes-geo.json';
import { getEtabScore, checkUrgency } from '@/lib/scoring';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Types updated with performance metrics
interface Etablissement {
  id: number;
  code: string;
  nom: string;
  secteur: string;
  nature: string | null;
  latitude: number;
  longitude: number;
  noteMoyenne: number;
  nombreEvaluations: number;
  photoPrincipale: string | null;
  statutFonctionnel: string | null;
  modele3DUrl: string | null;
  communeNom: string;
  communeId?: number;
  annexeNom: string | null;
  annexeCommuneId?: number;
  // Details
  typeEtablissement: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  adresseComplete: string | null;
  etatInfrastructure: string | null;
  capaciteAccueil: number | null;
  nombreSalles: number | null;
  anneeOuverture: number | null;
  effectifTotal: number | null;
  inputBudget: number | null;
  budgetAnnuel: number | null;
  sourcesFinancement: string | null;
  // New specific fields
  tutelle: string | null;
  responsableNom: string | null;
  accessibilite: string | null;
  surfaceTotale: number | null;
  disponibiliteEau: boolean | null;
  disponibiliteElectricite: boolean | null;
  connexionInternet: boolean | null;
  elevesTotal: number | null;
  elevesFilles: number | null;
  nouveauxInscrits: number | null;
  
  evaluationsCount: number;
  reclamationsCount: number;
  evenementsCount: number;
  activitesCount: number;
  abonnementsCount: number;
  actualitesCount: number;
  // Arrays for filtering
  eventsList?: any[];
  activitiesList?: any[];
}

interface Commune {
  id: number;
  nom: string;
  code: string;
}

interface MapProps {
  onEtablissementSelect?: (etablissement: Etablissement) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  height?: string;
  mode?: 'PUBLIC' | 'GOVERNOR';
}

// Configuration secteurs with gradients for modern UI
const SECTEUR_CONFIG: Record<string, { color: string; gradient: string; icon: React.ElementType; label: string }> = {
  EDUCATION: { color: '#3B82F6', gradient: 'from-blue-500 to-blue-600', icon: GraduationCap, label: 'Éducation' },
  SANTE: { color: '#EF4444', gradient: 'from-red-500 to-red-600', icon: Heart, label: 'Santé' },
  SPORT: { color: '#22C55E', gradient: 'from-green-500 to-green-600', icon: Dumbbell, label: 'Sport' },
  SOCIAL: { color: '#A855F7', gradient: 'from-purple-500 to-purple-600', icon: Users, label: 'Social' },
  CULTUREL: { color: '#F97316', gradient: 'from-orange-500 to-orange-600', icon: Palette, label: 'Culturel' },
  AUTRE: { color: '#6B7280', gradient: 'from-gray-500 to-gray-600', icon: Building2, label: 'Autre' },
};

const DEFAULT_CENTER: [number, number] = [33.45, -7.52];
const DEFAULT_ZOOM = 12;

// Get Emoji helper
function getSectorEmoji(secteur: string): string {
  const emojis: Record<string, string> = {
    EDUCATION: '🎓', SANTE: '🏥', SPORT: '⚽', SOCIAL: '🤝', CULTUREL: '🎭', AUTRE: '🏛️',
  };
  return emojis[secteur] || '📍';
}

// Custom Marker Creator with Performance Scaling
// Custom Marker Creator with Performance Scaling
// Custom Marker Creator with Performance Scaling and Tiered Visuals
function createMarkerIcon(
  secteur: string, 
  isSelected: boolean, 
  viewMode: 'STANDARD' | 'PERFORMANCE', 
  score: number = 0, 
  maxScore: number = 1,
  isUrgent: boolean = false,
  showUrgencies: boolean = false,
  urgencyText: string = 'URGENCE'
) {
  const config = SECTEUR_CONFIG[secteur] || SECTEUR_CONFIG.AUTRE;
  
  // -- ULTRA INNOVATION LOGIC --
  let size = isSelected ? 48 : 36;
  let backgroundColor = config.color;
  let borderColor = 'white';
  let borderWidth = isSelected ? '3px' : '2px';
  let badgeIcon = '';
  let customClass = '';
  let opacity = 1;
  let zIndex = 10;
  let pulseAnimation = '';
  
  // PERFORMANCE MODE TIERS
  if (viewMode === 'PERFORMANCE') {
       const relativeScore = (score / Math.max(maxScore, 1)) * 100; // 0-100 relative to max in view? Or absolute? User mentioned score > 5. Let's use absolute logic if possible, or relative to be safe.
       // Assuming Score is roughly 0-100 based on previous logic.
       
       if (score >= 70) {
           // 🏆 ELITE TIER
           size = 56;
           backgroundColor = '#10B981'; // Emerald
           borderColor = '#F59E0B'; // Gold Border
           borderWidth = '4px';
           badgeIcon = '🏆';
           pulseAnimation = 'animation: pulse-ring 2s infinite;';
           zIndex = 50;
       } else if (score >= 40) {
           // 😐 AVERAGE TIER
           size = 32;
           backgroundColor = '#3B82F6'; // Blue
           opacity = 0.8;
           zIndex = 30;
       } else {
           // ⚠️ LOW TIER
           size = 24;
           backgroundColor = '#64748B'; // Slate
           opacity = 0.6;
           badgeIcon = '⚠️';
           zIndex = 20;
       }
  }

  // URGENCY OVERRIDE
  if (showUrgencies && isUrgent) {
      size = 48;
      backgroundColor = '#EF4444'; // Red
      borderColor = 'white';
      badgeIcon = '🚨';
      pulseAnimation = 'animation: urgent-error 0.8s infinite alternate;';
      zIndex = 100;
      opacity = 1;
  }
  
  if (isSelected) {
      size = 60;
      zIndex = 200;
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        position: relative;
        transform-origin: center bottom;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: ${zIndex};
        ${isSelected ? 'transform: scale(1.1);' : ''}
      ">
        <div style="
          width: 100%;
          height: 100%;
          background: ${backgroundColor};
          border-radius: ${showUrgencies && isUrgent ? '12px' : '50%'};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          border: ${borderWidth} solid ${borderColor};
          opacity: ${isSelected ? 1 : opacity};
          ${pulseAnimation}
        ">
          <div style="color: white; font-size: ${size * 0.45}px;">
            ${badgeIcon ? badgeIcon : getSectorEmoji(secteur)}
          </div>
        </div>
        
        ${(score > 0 && !isUrgent && viewMode === 'PERFORMANCE' && score >= 40) ? `
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: ${score >= 70 ? '#F59E0B' : '#1E293B'};
          color: white;
          border-radius: 999px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 900;
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
          z-index: 60;
        ">
          ${score.toFixed(0)}
        </div>
        ` : ''}

        ${(showUrgencies && isUrgent) ? `
        <div style="
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          background: #EF4444;
          color: white;
          border-radius: 4px;
          padding: 1px 4px;
          font-size: 8px;
          font-weight: 900;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${urgencyText}
        </div>
        ` : ''}

      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function MapControls({ 
  communes, selectedCommune, onCommuneChange,
  secteurFilters, onSecteurToggle, secteurStats,
  showPolygons, onTogglePolygons,
  viewMode, onViewModeChange,
  hasActivitiesOnly, onToggleHasActivities,
  minRating, onRatingChange,
  minAbonnements, onAbonnementsChange,
  showUrgencies, onToggleUrgencies,
  searchQuery, onSearchChange,
  availableNatures, selectedNatures, onNatureToggle,
  mode,
  // New Filter Props
  periodFilter, onPeriodChange,
  statusFilter, onStatusChange
}: any) {
  const [showFilters, setShowFilters] = useState(false);

  // If PUBLIC mode, hide advanced controls
  const isPublic = mode === 'PUBLIC';
  const isGovernor = mode === 'GOVERNOR';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = useTranslations('map_page');

  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-3 max-w-[calc(100vw-32px)] md:max-w-[320px]">
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden bg-white/95 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/40 text-slate-700 font-bold flex items-center justify-center gap-2"
      >
        <Filter size={18} />
        {isMobileMenuOpen ? t('filters.close') : t('filters.title')}
      </button>

      <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-4 border border-white/40 gap-3 transition-all hover:scale-[1.02]`}>
         <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">

                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-inner"
            />
         </div>
         
         {!isPublic && (
            <div className="relative">
                <select
                  value={selectedCommune || ''}
                  onChange={(e) => onCommuneChange(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full appearance-none px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-pointer text-slate-700 hover:bg-white hover:border-slate-300 transition-all focus:outline-none focus:ring-4 focus:ring-slate-100"
                >
                  <option value="">{t('filters.all_communes')}</option>
                  {communes.map((c: any) => (
                    <option key={c.id} value={c.id}>📍 {c.nom}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Filter size={16} />
                </div>
            </div>
         )}
         
         {/* EVENT & PERIOD FILTERS - VISIBLE ONLY FOR GOVERNOR */}
         {isGovernor && (
         <div className="grid grid-cols-2 gap-2">
            <div className="relative">
                 <select
                    value={periodFilter}
                    onChange={(e) => onPeriodChange(e.target.value)}
                    className="w-full appearance-none pl-9 pr-2 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-slate-700 focus:ring-2 focus:ring-blue-100"
                 >
                    <option value="ALL">{t('filters.period')}</option>
                    <option value="7D">{t('filters.period_7d')}</option>
                    <option value="15D">{t('filters.period_15d')}</option>
                    <option value="30D">{t('filters.period_30d')}</option>
                    <option value="60D">{t('filters.period_60d')}</option>
                    <option value="180D">{t('filters.period_180d')}</option>
                    <option value="365D">{t('filters.period_365d')}</option>
                 </select>
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Calendar size={14} />
                 </div>
            </div>
            <div className="relative">
                 <select
                    value={statusFilter}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="w-full appearance-none pl-9 pr-2 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-slate-700 focus:ring-2 focus:ring-blue-100"
                 >
                    <option value="ALL">{t('filters.status')}</option>
                    <option value="EN_COURS">{t('filters.status_ongoing')}</option>
                    <option value="A_VENIR">{t('filters.status_upcoming')}</option>
                    <option value="TERMINEE">{t('filters.status_completed')}</option>
                 </select>
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Activity size={14} />
                 </div>
            </div>
         </div>
         )}

         {/* SECTOR PILLS GRID */}
         <div className="grid grid-cols-2 gap-2 mt-1">
            {Object.entries(SECTEUR_CONFIG).map(([secteur, config]) => {
               const isActive = secteurFilters[secteur] !== false;
               const Icon = config.icon;
               return (
                  <button
                    key={secteur}
                    onClick={() => onSecteurToggle(secteur)}
                    className={`
                        relative flex items-center gap-2 p-2 rounded-xl transition-all duration-300 border-2
                        ${isActive 
                            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-transparent text-white shadow-lg transform scale-100' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 grayscale opacity-70'}
                    `}
                  >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                          <Icon size={16} />
                      </div>
                      <div className="flex flex-col items-start leading-none">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-60">{t('sectors.label')}</span>
                          <span className="text-xs font-bold truncate max-w-[80px]">{t(`sectors.${secteur.toLowerCase()}`)}</span>
                      </div>
                      {isActive && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                      )}
                  </button>
               )
            })}
         </div>
         

      </div>

      {!isPublic && (
        <div className="flex gap-2">
            <button
            onClick={() => onViewModeChange(viewMode === 'STANDARD' ? 'PERFORMANCE' : 'STANDARD')}
            className={`flex-1 group relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl transition-all border-2 ${
                viewMode === 'PERFORMANCE' 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-white border-white text-slate-600 hover:scale-105'
            }`}
            >
                <div className={`absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity`} />
                <BarChart3 size={18} className={viewMode === 'PERFORMANCE' ? 'text-white' : 'text-indigo-500'} />
                <span className="text-xs font-black uppercase tracking-wide">{t('controls.performance')}</span>
            </button>

            <button
            onClick={onToggleUrgencies}
            className={`flex-1 group relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl transition-all border-2 ${
                showUrgencies 
                ? 'bg-red-500 border-red-600 text-white' 
                : 'bg-white border-white text-slate-600 hover:scale-105'
            }`}
            >
                <div className={`absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity`} />
                <AlertTriangle size={18} className={showUrgencies ? 'text-white animate-bounce' : 'text-red-500'} />
                <span className="text-xs font-black uppercase tracking-wide">{t('controls.urgency')}</span>
            </button>
        </div>
      )}
      
      {/* Types Scrollable List if needed - Collapsible */}
       {availableNatures && availableNatures.length > 0 && (
         <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-white/50">
             <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                {availableNatures.map((nature: string) => {
                    const isSelected = selectedNatures[nature] !== false;
                    return (
                        <button 
                            key={nature}
                            onClick={() => onNatureToggle(nature)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${
                                isSelected 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                : 'bg-transparent text-slate-500 border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            {nature}
                        </button>
                    )
                })}
             </div>
         </div>
       )}

    </div>
  );
}

export default function InteractiveMap({ onEtablissementSelect, initialCenter = DEFAULT_CENTER, initialZoom = DEFAULT_ZOOM, height = 'h-full min-h-[70vh]', mode = 'GOVERNOR' }: MapProps) {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [communesGeoJSON, setCommunesGeoJSON] = useState<any>(null);
  const [annexesGeoJSON, setAnnexesGeoJSON] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommune, setSelectedCommune] = useState<number | null>(null);
  const [secteurFilters, setSecteurFilters] = useState<Record<string, boolean>>({});
  const [secteurStats, setSecteurStats] = useState<Record<string, number>>({});
  const [showPolygons, setShowPolygons] = useState(true);
  const [selectedEtablissement, setSelectedEtablissement] = useState<Etablissement | null>(null);
  
  // New States
  const [viewMode, setViewMode] = useState<'STANDARD' | 'PERFORMANCE'>('STANDARD');
  const [hasActivitiesOnly, setHasActivitiesOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minAbonnements, setMinAbonnements] = useState(0);
  const [showUrgencies, setShowUrgencies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNatures, setSelectedNatures] = useState<Record<string, boolean>>({});
  
  const t = useTranslations('map_page');
  
  // Event Filters
  const [periodFilter, setPeriodFilter] = useState('ALL'); // ALL, 7D, 15D, 30D
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, EN_COURS, A_VENIR, TERMINEE

  // Derive unique natures (types) from CURRENTLY filtered establishments (by sector)
  // But to imply "if all sectors selected, show all types", we should calculate available natures
  // based on establishments that match the SECTOR filter first.
  // Derive unique natures (types) from CURRENTLY filtered establishments (by sector)
  const availableNatures = useMemo(() => {
     const natures = new Set<string>();
     etablissements.forEach(e => {
        // Only collect natures/types from establishments that match the current SECTOR filter
        if (secteurFilters[e.secteur] !== false) {
           // Prioritize typeEtablissement if available and not empty, otherwise fallback to nature
           const type = (e.typeEtablissement && e.typeEtablissement.trim() !== "") 
                        ? e.typeEtablissement 
                        : e.nature;
           
           if (type) natures.add(type);
        }
     });
     return Array.from(natures).sort();
  }, [etablissements, secteurFilters]);



  const maxPerformanceScore = useMemo(() => {
    if (etablissements.length === 0) return 100;
    const max = Math.max(...etablissements.map(e => getEtabScore(e)));
    return max > 50 ? max : 50; 
  }, [etablissements]);

  // Filtering
  const filteredEtablissements = useMemo(() => {
    return etablissements.filter(etab => {
      // Basic Filters
      if (selectedCommune) {
         // robust filtering: check direct communeId OR annexe's communeId (if linked via annexe)
         const directMatch = etab.communeId && Number(etab.communeId) === Number(selectedCommune);
         const annexeMatch = etab.annexeCommuneId && Number(etab.annexeCommuneId) === Number(selectedCommune);
         
         if (!directMatch && !annexeMatch) {
             // Last resort: name matching if IDs missing (legacy support)
             if (!etab.communeId && !etab.annexeCommuneId && etab.communeNom) {
                 const commune = communes.find(c => c.id === selectedCommune);
                 if (commune && etab.communeNom.trim().toLowerCase() !== commune.nom.trim().toLowerCase()) return false;
             } else {
                 return false;
             }
         }
      }
      if (secteurFilters[etab.secteur] === false) return false;
      if (hasActivitiesOnly && (!etab.activitesCount || etab.activitesCount === 0)) return false;
      if ((etab.noteMoyenne || 0) < minRating) return false;
      if ((etab.abonnementsCount || 0) < minAbonnements) return false;
      
      // Search Filter
      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         if (!etab.nom.toLowerCase().includes(q) && !etab.secteur.toLowerCase().includes(q)) return false;
      }

      // Nature/Type Filter
      const type = (etab.typeEtablissement && etab.typeEtablissement.trim() !== "") 
                   ? etab.typeEtablissement 
                   : etab.nature;

      if (type && selectedNatures[type] === false) return false;

      // -- EVENT FILTERS --
      const now = new Date();
      let hasMatchingEvent = false;
      let checkEvents = periodFilter !== 'ALL' || statusFilter !== 'ALL';
      
      if (checkEvents) {
         // Combine events and activities
         const allEvents = [...(etab.eventsList || []), ...(etab.activitiesList || [])];
         
         if (allEvents.length === 0) return false; // Must have events if filtering by events

         hasMatchingEvent = allEvents.some(evt => {
            const startStr = evt.dateDebut || evt.date;
            if (!startStr) return false;
            const start = new Date(startStr);
            
            // Status Check
            if (statusFilter !== 'ALL') {
                // Ongoing: EN_COURS (Activity) or EN_ACTION (Event)
                if (statusFilter === 'EN_COURS' && (evt.statut !== 'EN_COURS' && evt.statut !== 'EN_ACTION')) return false;
                
                // Upcoming: PUBLIEE (Event), PLANIFIEE (Activity), or VALIDEE (News/Other legacy)
                if (statusFilter === 'A_VENIR' && (evt.statut !== 'PUBLIEE' && evt.statut !== 'PLANIFIEE' && evt.statut !== 'VALIDEE')) return false;
                
                // Completed: TERMINEE (Activity) or CLOTUREE (Event) or RAPPORT_COMPLETE
                if (statusFilter === 'TERMINEE' && (evt.statut !== 'TERMINEE' && evt.statut !== 'CLOTUREE' && evt.statut !== 'RAPPORT_COMPLETE')) return false;
            }
            
            // Period Check
            if (periodFilter !== 'ALL') {
                const diffTime = start.getTime() - now.getTime(); // Signed difference
                // If filtering for "Upcoming" (7D/15D/30D), we want positive diff or very slightly negative (today)
                
                // Usually "Prochains 7 jours" means Start Date is between Now and Now + 7 days.
                // Or if it started in past but ends in future (Ongoing). 
                // For simplicity: Start Date >= Now AND Start Date <= Now + X
                // OR Event is occurring now (Start <= Now <= End).
                
                // Simplified "Upcoming" check:
                const daysUntilStart = diffTime / (1000 * 60 * 60 * 24);
                
                if (daysUntilStart < -1) return false; // Already started > 1 day ago? Maybe we want "Current" too. 
                // Let's stick to "Start Date is coming up OR is today"
                
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


      // View Mode Filters
      const isUrgent = checkUrgency(etab);
      
      // If "Urgency" toggle is ON, ONLY show urgent items
      if (showUrgencies && !isUrgent) return false;

      return true;
    });
  }, [etablissements, selectedCommune, secteurFilters, communes, hasActivitiesOnly, showUrgencies, minRating, minAbonnements, searchQuery, selectedNatures, periodFilter, statusFilter]);

  // Update Sector Stats when etablissements change
  useEffect(() => {
      const stats: Record<string, number> = {};
      // Calculate based on all establishments to show total potential counts in filter
      etablissements.forEach(e => {
          stats[e.secteur] = (stats[e.secteur] || 0) + 1;
      });
      setSecteurStats(stats);
  }, [etablissements]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [etabRes, communeRes] = await Promise.all([
          fetch('/api/map/etablissements'),
          fetch('/api/map/communes')
        ]);

        if (etabRes.ok) {
           const data = await etabRes.json();
           const extractedEtabs = (data.geojson?.features || []).map((f: any) => {
               // Normalize Sector Name on Client Side to fix data inconsistencies
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
           setEtablissements(extractedEtabs);
        }
        
        // utilizing imported data for annexes
        setAnnexesGeoJSON(annexesGeoData);
        
        if (communeRes.ok) {
           const data = await communeRes.json();
           setCommunes(data.communes || []);
           setCommunesGeoJSON(data.geojson || null);
        } else {
             setCommunes([]);
        }

      } catch (err) {
        console.error("Map Data Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const router = useRouter();

  const handleEtablissementClick = (etab: Etablissement) => {
    if (mode === 'PUBLIC') {
        router.push(`/etablissements/${etab.id}`);
        return;
    }
    setSelectedEtablissement(etab);
    if (onEtablissementSelect) onEtablissementSelect(etab);
  };

  return (
    <div className={`relative w-full ${height} overflow-hidden bg-white`}>
      <MapContainer 
        key={`map-${initialCenter[0]}-${initialCenter[1]}-${initialZoom}`}
        center={initialCenter} 
        zoom={initialZoom} 
        className="w-full h-full z-0" 
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />

         {/* Annexes GeoJSON Layer - Always visible if available, or toggled? Usually visible in background */}
         {annexesGeoJSON && (
            <GeoJSON 
              data={annexesGeoJSON} 
              style={{ color: '#64748b', weight: 2, fillOpacity: 0, dashArray: '5,5', opacity: 0.5 }} 
              onEachFeature={(feature, layer) => {
                 if (feature.properties && feature.properties.nom) {
                    layer.bindTooltip(feature.properties.nom, { permanent: false, direction: 'center', className: 'annexe-tooltip' });
                 }
              }}
            />
         )}

         {/* GAMIFIED BOUNDARIES: Each commune gets a unique vibrant neon color */}
         {showPolygons && communesGeoJSON && (
            <GeoJSON 
              data={communesGeoJSON} 
              style={(feature) => {
                 // Generate a consistent color based on the commune ID or Name string
                 const name = feature?.properties?.nom || 'unknown';
                 // Simple hash for color picking
                 const hash = name.split('').reduce((acc: any, char: any) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
                 const hue = Math.abs(hash % 360);
                 return { 
                    color: `hsl(${hue}, 70%, 60%)`, // Neon-like vibrant color
                    weight: 3, 
                    fillColor: `hsl(${hue}, 70%, 60%)`,
                    fillOpacity: 0.05, 
                    opacity: 0.8,
                    dashArray: '0', 
                    className: 'neon-path' // We will add a glow effect in CSS
                 };
              }}
              onEachFeature={(feature, layer) => {
                if (feature.properties && feature.properties.nom) {
                   layer.bindTooltip(
                      `<div class="font-black text-xs uppercase tracking-widest text-slate-600">${feature.properties.nom}</div>`, 
                      { permanent: true, direction: 'center', className: 'commune-lbl', offset: [0, 0] }
                   );
                   
                   // Hover effects
                    layer.on({
                        mouseover: (e) => {
                            const l = e.target;
                            l.setStyle({ weight: 5, fillOpacity: 0.2, opacity: 1 });
                        },
                        mouseout: (e) => {
                            const l = e.target;
                            l.setStyle({ weight: 3, fillOpacity: 0.05, opacity: 0.8 });
                        }
                    });
                }
             }}
            />
         )}

        {filteredEtablissements.map((etab) => {
            const score = getEtabScore(etab);
            const isUrgent = checkUrgency(etab);
            
            // Determine Visual State based on Modes
            let markerMode: 'STANDARD' | 'PERFORMANCE_HIGH' | 'PERFORMANCE_LOW' | 'URGENT' = 'STANDARD';
            
            if (showUrgencies) {
               // In Urgency Mode: Everything visible is Urgent (filtered above)
               markerMode = 'URGENT';
            } else if (viewMode === 'PERFORMANCE') {
               // In Performance Mode:
               if (score > maxPerformanceScore * 0.6) markerMode = 'PERFORMANCE_HIGH';
               else if (score < maxPerformanceScore * 0.2) markerMode = 'PERFORMANCE_LOW';
               else markerMode = 'STANDARD';
            } 
            // If "Urgent" but view is standard, do we show it? 
            // The user wants clear decision making. 
            // Let's overlay a small red alert on standard markers if they are urgent, 
            // but NOT turn the whole marker red unless ShowUrgencies is ON or it's critical.
            if (isUrgent && !showUrgencies && viewMode !== 'PERFORMANCE') {
                markerMode = 'URGENT'; // Force red if it's actually critical even in standard view? 
                // User complained about "always lamps rouge". 
                // Let's only force it if it's REALLY critical, or keep standard.
                // Let's try: ONLY show Red Lamp if 'showUrgencies' is toggled OR if user selected 'Performance' (to show low).
                // Revert: Standard view = Sector color.
                markerMode = 'STANDARD';
            }

            return (
              <Marker
                key={etab.id}
                position={[etab.latitude, etab.longitude]}
                icon={createMarkerIcon(
                  etab.secteur, 
                  selectedEtablissement?.id === etab.id, 
                  viewMode, 
                  score, 
                  maxPerformanceScore,
                  isUrgent,

                  showUrgencies, // Pass this to force Red ONLY when requested
                  t('controls.urgency').toUpperCase()
                )}
                eventHandlers={{
                  click: (e) => {
                     // Just open the popup, do not redirect yet
                     e.target.openPopup();
                  }
                }}
              >
                <Popup className="premium-popup" minWidth={380} closeButton={false} offset={[0, -20]}>
                  <div className="overflow-hidden rounded-2xl shadow-2xl bg-white font-sans">
                    {/* Premium Header */}
                    <div className={`relative px-6 py-6 bg-gradient-to-br ${SECTEUR_CONFIG[etab.secteur]?.gradient || 'from-gray-800 to-gray-900'} text-white overflow-hidden`}>
                         {/* Abstract BG Shapes */}
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                         <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                         
                         <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">
                                        {t(`sectors.${etab.secteur.toLowerCase()}`)}
                                    </span>
                                    {score > 80 && mode !== 'PUBLIC' && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                                            <Star size={10} fill="currentColor" /> Top
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-black text-xl leading-tight mb-1 text-white shadow-sm drop-shadow-md">
                                    {etab.nom}
                                </h3>
                                <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
                                    <MapPin size={12} />
                                    {etab.communeNom}
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-lg">
                                {getSectorEmoji(etab.secteur)}
                            </div>
                         </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5">
                       {/* Stats Pills - Gamified */}
                       <div className="flex justify-between gap-2 mb-6">
                           {[
                               { label: t('popup.activities'), val: etab.activitesCount, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                               { label: t('popup.events'), val: etab.evenementsCount, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                               { label: t('popup.reviews'), val: etab.noteMoyenne ? etab.noteMoyenne.toFixed(1) : '-', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                               { label: t('popup.subscriptions'), val: etab.abonnementsCount, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                           ].map((stat, i) => (
                               <div key={i} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-2xl border ${stat.bg} ${stat.border}`}>
                                   <span className={`text-lg font-black ${stat.color}`}>{stat.val || 0}</span>
                                   <span className={`text-[8px] font-bold uppercase tracking-wide opacity-70 ${stat.color}`}>{stat.label}</span>
                               </div>
                           ))}
                       </div>

                       {/* Details List */}
                       <div className="space-y-3 mb-6">
                           {mode !== 'PUBLIC' && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('popup.reclamations')}</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${etab.reclamationsCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <span className={`text-sm font-black ${etab.reclamationsCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                            {etab.reclamationsCount}
                                        </span>
                                    </div>
                                </div>
                           )}
                           
                           {/* Conditionally show Events List if filtering is active */}
                           {(periodFilter !== 'ALL' || statusFilter !== 'ALL') && (
                               <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 mb-3">
                                   <div className="flex items-center gap-2 mb-2">
                                       <Calendar size={12} className="text-blue-500" />
                                       <span className="text-[10px] font-black uppercase text-blue-600">{t('popup.filtered_events')}</span>
                                   </div>
                                   <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                                       {[...(etab.eventsList || []), ...(etab.activitiesList || [])].slice(0, 3).map((evt:any, idx:number) => (
                                           <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-white rounded-lg border border-blue-100 shadow-sm">
                                               <span className="font-bold text-slate-700 truncate max-w-[120px]">{evt.titre}</span>
                                               <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1 rounded">
                                                   {new Date(evt.dateDebut || evt.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                               </span>
                                           </div>
                                       ))}
                                       {((etab.eventsList?.length || 0) + (etab.activitiesList?.length || 0)) > 3 && (
                                           <div className="text-[9px] text-center text-blue-400 font-bold mt-1">{t('popup.others')}</div>
                                       )}
                                   </div>
                               </div>
                           )}

                           <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('popup.news')}</span>
                                <span className="text-sm font-black text-slate-700">{etab.actualitesCount || 0}</span>
                           </div>

                           {mode !== 'PUBLIC' && (
                               <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                   <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('popup.global_score')}</span>
                                   <span className={`text-sm font-black ${score >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                       {score.toFixed(1)}/100
                                   </span>
                                </div>
                           )}
                       </div>

                       {/* Action Button */}
                       <button
                         onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             console.log("Navigating to:", etab.id);
                             handleEtablissementClick(etab);
                         }}
                         className={`
                            group w-full py-3.5 rounded-xl font-black text-sm text-white shadow-lg shadow-blue-500/30 
                            transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                            flex items-center justify-center gap-2
                            ${SECTEUR_CONFIG[etab.secteur]?.gradient ? `bg-gradient-to-r ${SECTEUR_CONFIG[etab.secteur].gradient}` : 'bg-slate-900'}
                         `}
                       >
                         <span>{t('popup.view_details')}</span>
                         <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                       </button>

                    </div>
                  </div>
                </Popup>
              </Marker>
            );
        })}
      </MapContainer>

      <MapControls
        communes={communes}
        selectedCommune={selectedCommune}
        onCommuneChange={setSelectedCommune}
        secteurFilters={secteurFilters}
        onSecteurToggle={(s: string) => setSecteurFilters(prev => ({ ...prev, [s]: !prev[s] }))}
        secteurStats={secteurStats}
        showPolygons={showPolygons}
        onTogglePolygons={() => setShowPolygons(!showPolygons)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasActivitiesOnly={hasActivitiesOnly}
        onToggleHasActivities={() => setHasActivitiesOnly(!hasActivitiesOnly)}
        minRating={minRating}
        onRatingChange={setMinRating}
        minAbonnements={minAbonnements}
        onAbonnementsChange={setMinAbonnements}
        showUrgencies={showUrgencies}
        onToggleUrgencies={() => setShowUrgencies(!showUrgencies)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        availableNatures={availableNatures}
        selectedNatures={selectedNatures}
        onNatureToggle={(n: string) => setSelectedNatures(prev => ({ ...prev, [n]: !prev[n] }))}
        mode={mode}
        periodFilter={periodFilter}
        onPeriodChange={setPeriodFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
         <button onClick={() => { const btn = document.querySelector('.leaflet-control-zoom-in') as HTMLElement; btn?.click(); }} className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-100 text-gray-700">
             <ZoomIn size={20} />
         </button>
         <button onClick={() => { const btn = document.querySelector('.leaflet-control-zoom-out') as HTMLElement; btn?.click(); }} className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-100 text-gray-700">
             <ZoomOut size={20} />
         </button>
      </div>

      {/* Legend - Detailed & Dynamic */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2 pointer-events-none">
           {/* Context Card - Active if filtering */}
           {(viewMode === 'PERFORMANCE' || showUrgencies || filteredEtablissements.length !== etablissements.length) && (
              <div className="bg-slate-900/90 text-white p-3 rounded-2xl shadow-xl backdrop-blur-md pointer-events-auto border border-white/10 animate-in slide-in-from-right-4">
                  <div className="flex items-center gap-2 mb-1">
                      <Filter size={14} className="text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wide">{t('filters.view_filtered')}</span>
                  </div>
                  <div className="text-2xl font-black">{filteredEtablissements.length} <span className="text-sm font-medium text-slate-400">{t('filters.results')}</span></div>
              </div>
           )}

            {/* Mobile Legend Toggle */}
            <div className="pointer-events-auto md:hidden">
                 <button 
                   onClick={() => {
                        const legend = document.getElementById('map-legend-content');
                        if(legend) legend.classList.toggle('hidden');
                   }}
                   className="bg-white/90 p-2 rounded-xl shadow-lg border border-slate-100 text-slate-600 flex items-center justify-center"
                 >
                    <Layers size={20} />
                 </button>
            </div>

            <div id="map-legend-content" className="hidden md:block bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-4 border border-white/40 min-w-[220px] pointer-events-auto">
             <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {viewMode === 'PERFORMANCE' ? t('legend.performance_title') : t('legend.sectors_title')}
                </span>
             </div>
             
             {viewMode === 'PERFORMANCE' ? (
                 <div className="space-y-3">
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-amber-400 flex items-center justify-center shadow-lg animate-pulse text-xs">🏆</div>
                         <div>
                             <p className="text-xs font-black text-slate-800">{t('legend.excellence')}</p>
                             <p className="text-[10px] text-slate-500 font-medium">{t('legend.excellence_desc')}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white opacity-80"></div>
                         <div>
                             <p className="text-xs font-bold text-slate-700">{t('legend.standard')}</p>
                             <p className="text-[10px] text-slate-500 font-medium">{t('legend.standard_desc')}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="w-4 h-4 rounded-full bg-slate-500 border border-white opacity-60"></div>
                         <div>
                             <p className="text-xs font-bold text-slate-500">{t('legend.attention')}</p>
                             <p className="text-[10px] text-slate-400 font-medium">{t('legend.attention_desc')}</p>
                         </div>
                     </div>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 gap-2">
                     {Object.entries(SECTEUR_CONFIG).map(([k, v]) => (
                         <div key={k} className="flex items-center gap-2.5">
                             <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: v.color }} />
                             <span className="text-[11px] font-bold text-slate-600 truncate">{t(`sectors.${k.toLowerCase()}`)}</span>
                         </div>
                     ))}
                 </div>
             )}

             <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                    {t('legend.click_instruction')}
                </span>
             </div>
          </div>
      </div>

      <style jsx global>{`
        .custom-marker { background: transparent; }
        .premium-popup .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 12px; overflow: hidden; }
        .premium-popup .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .leaflet-container { font-family: inherit; }
        @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
        }
        @keyframes urgent-error {
            0% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px red); }
            100% { transform: scale(1.1); filter: brightness(1.3) drop-shadow(0 0 15px red); }
        }
        .commune-tooltip, .annexe-tooltip {
          background: rgba(255,255,255,0.9); backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          font-weight: 600; padding: 4px 8px; font-size: 11px;
        }
        .commune-lbl {
            background: rgba(255,255,255,0.4);
            backdrop-filter: blur(2px);
            border: none;
            box-shadow: none;
        }
        .neon-path {
            filter: drop-shadow(0 0 5px rgba(255,255,255,0.5));
            transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}


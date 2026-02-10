'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FileText, 
  Calendar, 
  Users, 
  Building2, 
  Clock,
  Eye,
  BarChart3,
  Search,
  Loader2,
  CheckCircle2,
  Megaphone,
  MapPin,
  ClipboardList,
  Image as ImageIcon,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface MediaItem {
  id: number;
  urlPublique: string;
  type: string;
  nomFichier: string;
}

interface BilanEvenement {
  id: number;
  titre: string;
  typeCategorique: string;
  secteur: string;
  dateDebut: string;
  dateFin?: string;
  statut: string;
  nombreInscrits: number;
  bilanDescription?: string;
  bilanNbParticipants?: number;
  bilanDatePublication?: string;
  etablissement?: { id: number; nom: string };
  commune?: { id: number; nom: string };
  createdByUser?: { nom: string; prenom: string };
  medias?: MediaItem[];
}

interface BilanActivite {
  id: number;
  titre: string;
  description?: string;
  typeActivite: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  lieu?: string;
  statut: string;
  participantsAttendus?: number;
  presenceEffective?: number;
  tauxPresence?: number;
  commentaireDeroulement?: string;
  difficultes?: string;
  pointsPositifs?: string;
  photosRapport?: string[];
  noteQualite?: number;
  recommandations?: string;
  dateRapport?: string;
  etablissement: { id: number; nom: string; secteur: string; commune?: { nom: string } };
  createdByUser?: { nom: string; prenom: string };
}

interface BilanCampagne {
  id: number;
  titre: string;
  description?: string;
  statut: string;
  dateDebut?: string;
  dateFin?: string;
  objectifParticipations?: number;
  bilanDescription?: string;
  nombreParticipations: number;
  nombreVues: number;
  createdByUser?: { nom: string; prenom: string };
  medias?: MediaItem[];
}

const SECTEUR_COLORS: Record<string, string> = {
  'EDUCATION': 'bg-blue-100 text-blue-700',
  'SANTE': 'bg-red-100 text-red-700',
  'SPORT': 'bg-green-100 text-green-700',
  'SOCIAL': 'bg-purple-100 text-purple-700',
  'CULTUREL': 'bg-amber-100 text-amber-700',
  'AUTRE': 'bg-gray-100 text-gray-700',
};

const SECTEUR_LABELS: Record<string, string> = {
  'EDUCATION': 'Éducation',
  'SANTE': 'Santé',
  'SPORT': 'Sport',
  'SOCIAL': 'Social',
  'CULTUREL': 'Culturel',
  'AUTRE': 'Autre',
};

export default function BilansPage() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'evenements' | 'activites' | 'campagnes'>('evenements');
  const [loading, setLoading] = useState(true);
  const [evenements, setEvenements] = useState<BilanEvenement[]>([]);
  const [activites, setActivites] = useState<BilanActivite[]>([]);
  const [campagnes, setCampagnes] = useState<BilanCampagne[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBilans();
  }, []);

  const fetchBilans = async () => {
    setLoading(true);
    try {
      const [evtRes, actRes, campRes] = await Promise.all([
        fetch('/api/admin/bilans/evenements'),
        fetch('/api/admin/bilans/activites'),
        fetch('/api/admin/bilans/campagnes'),
      ]);

      if (evtRes.ok) {
        const evtData = await evtRes.json();
        setEvenements(evtData.data || []);
      }

      if (actRes.ok) {
        const actData = await actRes.json();
        setActivites(actData.data || []);
      }

      if (campRes.ok) {
        const campData = await campRes.json();
        setCampagnes(campData.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement bilans:', error);
      toast.error('Erreur lors du chargement des bilans');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (key: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedItems(newSet);
  };

  const filteredEvenements = evenements.filter(evt => {
    const matchSearch = searchQuery === '' || 
      evt.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.etablissement?.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSecteur = selectedSecteur === '' || evt.secteur === selectedSecteur;
    return matchSearch && matchSecteur;
  });

  const filteredActivites = activites.filter(act => {
    const matchSearch = searchQuery === '' || 
      act.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.etablissement?.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSecteur = selectedSecteur === '' || act.etablissement?.secteur === selectedSecteur;
    return matchSearch && matchSecteur;
  });

  const filteredCampagnes = campagnes.filter(camp => {
    return searchQuery === '' || 
      camp.titre.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Stats
  const statsEvenements = {
    total: evenements.length,
    totalParticipants: evenements.reduce((sum, e) => sum + (e.bilanNbParticipants || e.nombreInscrits || 0), 0),
  };

  const statsActivites = {
    total: activites.length,
    totalParticipants: activites.reduce((sum, a) => sum + (a.presenceEffective || 0), 0),
  };

  const statsCampagnes = {
    total: campagnes.length,
    totalParticipations: campagnes.reduce((sum, c) => sum + (c.nombreParticipations || 0), 0),
  };

  // Photo Gallery Component
  const PhotoGallery = ({ photos, title }: { photos: string[]; title: string }) => {
    if (!photos || photos.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Photos ({photos.length})
        </h5>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, idx) => (
            <a 
              key={idx} 
              href={photo} 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors group"
            >
              <img 
                src={photo} 
                alt={`${title} - Photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  // Media Gallery for events/campaigns
  const MediaGallery = ({ medias }: { medias?: MediaItem[] }) => {
    if (!medias || medias.length === 0) return null;
    
    const images = medias.filter(m => m.type === 'IMAGE');
    if (images.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Photos ({images.length})
        </h5>
        <div className="flex flex-wrap gap-2">
          {images.map((media) => (
            <a 
              key={media.id} 
              href={media.urlPublique} 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors group"
            >
              <img 
                src={media.urlPublique} 
                alt={media.nomFichier}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-gray-500 mt-4">Chargement des bilans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            {t('admin_bilans.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('admin_bilans.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('admin_bilans.stats.closed_events')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsEvenements.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('admin_bilans.stats.activities_with_report')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsActivites.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('admin_bilans.stats.finished_campaigns')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsCampagnes.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('admin_bilans.stats.total_participations')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statsEvenements.totalParticipants + statsActivites.totalParticipants}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('evenements')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'evenements'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          {t('admin_bilans.tabs.events')} ({evenements.length})
        </button>
        <button
          onClick={() => setActiveTab('activites')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'activites'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList className="w-4 h-4 inline mr-2" />
          {t('admin_bilans.tabs.activities')} ({activites.length})
        </button>
        <button
          onClick={() => setActiveTab('campagnes')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'campagnes'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Megaphone className="w-4 h-4 inline mr-2" />
          {t('admin_bilans.tabs.campaigns')} ({campagnes.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('admin_bilans.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800"
          />
        </div>
        
        {(activeTab === 'evenements' || activeTab === 'activites') && (
          <select
            value={selectedSecteur}
            onChange={(e) => setSelectedSecteur(e.target.value)}
            className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800"
          >
            <option value="">{t('admin_bilans.all_sectors')}</option>
            <option value="EDUCATION">{t('sectors.education')}</option>
            <option value="SANTE">{t('sectors.sante')}</option>
            <option value="SPORT">{t('sectors.sport')}</option>
            <option value="SOCIAL">{t('sectors.social')}</option>
            <option value="CULTUREL">{t('sectors.culturel')}</option>
            <option value="AUTRE">{t('sectors.autre')}</option>
          </select>
        )}
      </div>

      {/* Content - Événements */}
      {activeTab === 'evenements' && (
        <div className="space-y-4">
          {filteredEvenements.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">{t('admin_bilans.empty.events')}</h3>
              <p className="text-gray-500">{t('admin_bilans.empty.desc_events')}</p>
            </div>
          ) : (
            filteredEvenements.map((evt) => {
              const isExpanded = expandedItems.has(`evt-${evt.id}`);
              return (
                <div 
                  key={evt.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${SECTEUR_COLORS[evt.secteur] || 'bg-gray-100'}`}>
                          {t('sectors.' + evt.secteur.toLowerCase())}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(evt.dateDebut).toLocaleDateString('fr-FR')}
                          {evt.dateFin && ` - ${new Date(evt.dateFin).toLocaleDateString('fr-FR')}`}
                        </span>
                          {evt.medias && evt.medias.length > 0 && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {evt.medias.filter(m => m.type === 'IMAGE').length} {t('admin_bilans.labels.photos')}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {evt.titre}
                      </h3>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        {evt.etablissement && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {evt.etablissement.nom}
                          </span>
                        )}
                        {evt.commune && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {evt.commune.nom}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-medium text-emerald-600">
                          <Users className="w-4 h-4" />
                          {evt.bilanNbParticipants || evt.nombreInscrits} {t('admin_bilans.labels.participations')}
                        </span>
                      </div>

                      {/* Bilan Description */}
                      {evt.bilanDescription && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {t('admin_bilans.labels.report')}
                            </h4>
                            <button 
                              onClick={() => toggleExpand(`evt-${evt.id}`)}
                              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {isExpanded ? 'Réduire' : 'Voir tout'}
                            </button>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                            {isExpanded 
                              ? evt.bilanDescription 
                              : (evt.bilanDescription.length > 200 
                                  ? evt.bilanDescription.substring(0, 200) + '...'
                                  : evt.bilanDescription)
                            }
                          </p>
                          {evt.bilanDatePublication && (
                            <p className="text-xs text-gray-400 mt-2">
                              {t('admin_bilans.labels.published_on')} {new Date(evt.bilanDatePublication).toLocaleDateString(t('locale') === 'ar' ? 'ar-MA' : 'fr-FR')}
                            </p>
                          )}
                          
                          {/* Photos */}
                          {isExpanded && <MediaGallery medias={evt.medias} />}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/evenements/${evt.id}/modifier`}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        {t('admin_bilans.labels.details')}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content - Activités */}
      {activeTab === 'activites' && (
        <div className="space-y-4">
          {filteredActivites.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">{t('admin_bilans.empty.activities')}</h3>
              <p className="text-gray-500">{t('admin_bilans.empty.desc_activities')}</p>
            </div>
          ) : (
            filteredActivites.map((act) => {
              const isExpanded = expandedItems.has(`act-${act.id}`);
              return (
                <div 
                  key={act.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${SECTEUR_COLORS[act.etablissement.secteur] || 'bg-gray-100'}`}>
                        {t('sectors.' + act.etablissement.secteur.toLowerCase())}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {act.typeActivite}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(act.date).toLocaleDateString('fr-FR')} • {act.heureDebut} - {act.heureFin}
                      </span>
                      {act.photosRapport && act.photosRapport.length > 0 && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {act.photosRapport.length} {t('admin_bilans.labels.photos')}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {act.titre}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {act.etablissement.nom}
                      </span>
                      {act.etablissement.commune && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {act.etablissement.commune.nom}
                        </span>
                      )}
                      {act.lieu && (
                        <span className="text-gray-400">📍 {act.lieu}</span>
                      )}
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <Users className="w-4 h-4" />
                        {act.presenceEffective || 0} / {act.participantsAttendus || '?'} {t('admin_bilans.labels.present')}
                        {act.tauxPresence && (
                          <span className="text-xs text-gray-400">({act.tauxPresence.toFixed(0)}%)</span>
                        )}
                      </span>
                      {act.noteQualite && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Star className="w-4 h-4 fill-current" />
                          {act.noteQualite}/5
                        </span>
                      )}
                    </div>

                    {/* Rapport */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {t('admin_bilans.labels.report_activity')}
                        </h4>
                        <button 
                          onClick={() => toggleExpand(`act-${act.id}`)}
                          className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? t('admin_bilans.labels.reduce') : t('admin_bilans.labels.view_all')}
                        </button>
                      </div>
                      
                      {act.commentaireDeroulement && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                          <strong>{t('admin_bilans.labels.deroulement')} :</strong> {isExpanded ? act.commentaireDeroulement : (act.commentaireDeroulement.length > 150 ? act.commentaireDeroulement.substring(0, 150) + '...' : act.commentaireDeroulement)}
                        </p>
                      )}
                      
                      {isExpanded && (
                        <>
                          {act.pointsPositifs && (
                            <p className="text-emerald-700 dark:text-emerald-400 text-sm mb-2">
                              <strong>✅ {t('admin_bilans.labels.positives')} :</strong> {act.pointsPositifs}
                            </p>
                          )}
                          {act.difficultes && (
                            <p className="text-amber-700 dark:text-amber-400 text-sm mb-2">
                              <strong>⚠️ {t('admin_bilans.labels.difficulties')} :</strong> {act.difficultes}
                            </p>
                          )}
                          {act.recommandations && (
                            <p className="text-blue-700 dark:text-blue-400 text-sm mb-2">
                              <strong>💡 {t('admin_bilans.labels.recommendations')} :</strong> {act.recommandations}
                            </p>
                          )}
                          
                          {/* Photos du rapport */}
                          <PhotoGallery photos={act.photosRapport || []} title={act.titre} />
                        </>
                      )}
                      
                      {act.dateRapport && (
                        <p className="text-xs text-gray-400 mt-2">
                          {t('admin_bilans.labels.completed_on')} {new Date(act.dateRapport).toLocaleDateString(t('locale') === 'ar' ? 'ar-MA' : 'fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content - Campagnes */}
      {activeTab === 'campagnes' && (
        <div className="space-y-4">
          {filteredCampagnes.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">{t('admin_bilans.empty.campaigns')}</h3>
              <p className="text-gray-500">{t('admin_bilans.empty.desc_campaigns')}</p>
            </div>
          ) : (
            filteredCampagnes.map((camp) => {
              const isExpanded = expandedItems.has(`camp-${camp.id}`);
              return (
                <div 
                  key={camp.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          {t('admin_bilans.tabs.campaigns')}
                        </span>
                        {camp.dateDebut && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(camp.dateDebut).toLocaleDateString('fr-FR')}
                            {camp.dateFin && ` - ${new Date(camp.dateFin).toLocaleDateString('fr-FR')}`}
                          </span>
                        )}
                        {camp.medias && camp.medias.length > 0 && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {camp.medias.filter(m => m.type === 'IMAGE').length} {t('admin_bilans.labels.photos')}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {camp.titre}
                      </h3>
                      
                      {camp.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {camp.description.length > 150 
                            ? camp.description.substring(0, 150) + '...' 
                            : camp.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1 font-medium text-emerald-600">
                          <Users className="w-4 h-4" />
                          {camp.nombreParticipations} {t('admin_bilans.labels.participations')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {camp.nombreVues} {t('admin_bilans.labels.views')}
                        </span>
                        {camp.objectifParticipations && (
                          <span className="flex items-center gap-1">
                            🎯 {t('admin_bilans.labels.objective')}: {camp.objectifParticipations}
                          </span>
                        )}
                      </div>

                      {/* Bilan */}
                      <div className="bg-gradient-to-r from-amber-50 to-green-50 rounded-lg p-4 border-l-4 border-amber-500">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-amber-700">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">{t('admin_bilans.labels.campaign_finished')}</span>
                          </div>
                          {(camp.bilanDescription || (camp.medias && camp.medias.length > 0)) && (
                            <button 
                              onClick={() => toggleExpand(`camp-${camp.id}`)}
                              className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {isExpanded ? t('admin_bilans.labels.reduce') : t('admin_bilans.labels.expand')}
                            </button>
                          )}
                        </div>
                        
                        {camp.objectifParticipations && (
                          <p className="text-sm text-gray-600">
                            {camp.objectifParticipations <= camp.nombreParticipations 
                              ? `✅ ${t('admin_bilans.labels.objective_reached')} (${camp.nombreParticipations}/${camp.objectifParticipations})`
                              : `📊 ${camp.nombreParticipations}/${camp.objectifParticipations} ${t('admin_bilans.labels.participations')}`
                            }
                          </p>
                        )}
                        
                        {isExpanded && camp.bilanDescription && (
                          <p className="text-gray-700 text-sm mt-3 whitespace-pre-wrap">
                            {camp.bilanDescription}
                          </p>
                        )}
                        
                        {isExpanded && <MediaGallery medias={camp.medias} />}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/campagnes/${camp.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        {t('admin_bilans.labels.details')}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

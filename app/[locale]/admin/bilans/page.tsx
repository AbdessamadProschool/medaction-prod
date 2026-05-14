'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
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
  ChevronUp,
  AlertCircle,
  Lightbulb,
  Target,
  Edit2,
  X,
  Save,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

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
  'EDUCATION': 'bg-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))]',
  'SANTE': 'bg-[hsl(var(--gov-red))/0.1] text-[hsl(var(--gov-red))]',
  'SPORT': 'bg-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))]',
  'SOCIAL': 'bg-purple-500/10 text-purple-600',
  'CULTUREL': 'bg-amber-500/10 text-amber-600',
  'AUTRE': 'bg-muted text-muted-foreground',
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
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<'evenements' | 'activites' | 'campagnes'>('evenements');
  const [loading, setLoading] = useState(true);
  const [evenements, setEvenements] = useState<BilanEvenement[]>([]);
  const [activites, setActivites] = useState<BilanActivite[]>([]);
  const [campagnes, setCampagnes] = useState<BilanCampagne[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingBilan, setEditingBilan] = useState<{id: number, titre: string, description: string, participants: number} | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBilans();
  }, []);

  const fetchBilans = async () => {
    setLoading(true);
    try {
      const [evtRes, actRes, campRes] = await Promise.all([
        fetch('/api/admin/bilans/evenements').catch(() => null),
        fetch('/api/admin/bilans/activites').catch(() => null),
        fetch('/api/admin/bilans/campagnes').catch(() => null),
      ]);

      if (evtRes?.ok) {
        try {
          const evtData = await evtRes.json();
          const evts = evtData.data?.data || evtData.data;
          setEvenements(Array.isArray(evts) ? evts : []);
        } catch { setEvenements([]); }
      }

      if (actRes?.ok) {
        try {
          const actData = await actRes.json();
          const acts = actData.data?.data || actData.data;
          setActivites(Array.isArray(acts) ? acts : []);
        } catch { setActivites([]); }
      }

      if (campRes?.ok) {
        try {
          const campData = await campRes.json();
          const camps = campData.data?.data || campData.data;
          setCampagnes(Array.isArray(camps) ? camps : []);
        } catch { setCampagnes([]); }
      }
    } catch (error) {
      console.error('Erreur chargement bilans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBilan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBilan) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/evenements/${editingBilan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bilanDescription: editingBilan.description,
          bilanNbParticipants: editingBilan.participants
        })
      });
      
      if (res.ok) {
        toast.success(t('admin_bilans.messages.update_success') || 'Bilan mis à jour avec succès');
        setEditingBilan(null);
        fetchBilans();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const handleResetBilan = async (id: number) => {
    if (!confirm(t('admin_bilans.labels.confirm_reset'))) return;
    
    try {
      const res = await fetch(`/api/evenements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'PUBLIEE',
          bilanDescription: null,
          bilanNbParticipants: null,
          bilanDatePublication: null
        })
      });
      
      if (res.ok) {
        toast.success(t('admin_bilans.messages.reset_success') || 'Bilan réinitialisé');
        fetchBilans();
      } else {
        toast.error('Erreur lors de la réinitialisation');
      }
    } catch (error) {
      toast.error('Erreur réseau');
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
    return (
      <div className="mt-6">
        <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-[hsl(var(--gov-green))]" />
          Photos ({photos.length})
        </h5>
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, idx) => (
            <a 
              key={idx} 
              href={photo} 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border hover:border-[hsl(var(--gov-green))] transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-1"
            >
              <img 
                src={photo} 
                alt={`${title} - Photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    );
    );
  };

  // Media Gallery for events/campaigns
  const MediaGallery = ({ medias }: { medias?: MediaItem[] }) => {
    if (!medias || medias.length === 0) return null;
    
    const images = medias.filter(m => m.type === 'IMAGE');
    const documents = medias.filter(m => m.type === 'DOCUMENT' || m.type === 'EVENT_REPORT');
    
    return (
    return (
      <div className="mt-6 space-y-6">
        {/* Documents Section */}
        {documents.length > 0 && (
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[hsl(var(--gov-blue))]" />
              {t('admin_bilans.labels.documents')} ({documents.length})
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <a 
                  key={doc.id} 
                  href={doc.urlPublique} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:border-[hsl(var(--gov-blue))/0.5] transition-all group shadow-sm hover:shadow-md hover:-translate-y-1"
                >
                  <div className="p-2.5 bg-[hsl(var(--gov-blue))/0.05] rounded-xl text-[hsl(var(--gov-blue))] border border-[hsl(var(--gov-blue))/0.1]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-foreground truncate group-hover:text-[hsl(var(--gov-blue))] transition-colors">
                      {doc.nomFichier === 'Compte Rendu Bilan' ? t('admin_bilans.labels.report') : doc.nomFichier}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{t('admin_bilans.labels.download_report')}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Photos Section */}
        {images.length > 0 && (
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-[hsl(var(--gov-green))]" />
              {t('admin_bilans.labels.photos')} ({images.length})
            </h5>
            <div className="flex flex-wrap gap-3">
              {images.map((media) => (
                <a 
                  key={media.id} 
                  href={media.urlPublique} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border hover:border-[hsl(var(--gov-green))] transition-all duration-300 group shadow-sm hover:shadow-md hover:-translate-y-1"
                >
                  <img 
                    src={media.urlPublique} 
                    alt={media.nomFichier}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[hsl(var(--gov-green))/0.1] rounded-3xl flex items-center justify-center mx-auto border border-[hsl(var(--gov-green))/0.2]">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--gov-green))]" />
          </div>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs animate-pulse">{t('admin_bilans.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-background min-h-screen p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[hsl(var(--gov-blue)/0.3)]">
              <BarChart3 className="w-6 h-6" />
            </div>
            {t('admin_bilans.title')}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            {t('admin_bilans.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -5 }} className="gov-stat-card group">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--gov-blue))/0.1] flex items-center justify-center border border-[hsl(var(--gov-blue))/0.1] group-hover:scale-110 transition-transform shadow-sm">
              <Calendar className="w-7 h-7 text-[hsl(var(--gov-blue))]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('admin_bilans.stats.closed_events')}</p>
              <p className="text-3xl font-extrabold text-foreground leading-none">{statsEvenements.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="gov-stat-card group">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/10 group-hover:scale-110 transition-transform shadow-sm">
              <ClipboardList className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('admin_bilans.stats.activities_with_report')}</p>
              <p className="text-3xl font-extrabold text-foreground leading-none">{statsActivites.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="gov-stat-card group">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10 group-hover:scale-110 transition-transform shadow-sm">
              <Megaphone className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('admin_bilans.stats.finished_campaigns')}</p>
              <p className="text-3xl font-extrabold text-foreground leading-none">{statsCampagnes.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="gov-stat-card group border-[hsl(var(--gov-green))/0.3] shadow-[hsl(var(--gov-green))/0.05]">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--gov-green))/0.1] flex items-center justify-center border border-[hsl(var(--gov-green))/0.1] group-hover:scale-110 transition-transform shadow-sm">
              <Users className="w-7 h-7 text-[hsl(var(--gov-green))]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('admin_bilans.stats.total_participations')}</p>
              <p className="text-3xl font-extrabold text-foreground leading-none">
                {statsEvenements.totalParticipants + statsActivites.totalParticipants}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 p-1.5 bg-muted rounded-2xl w-fit border border-border shadow-sm">
        <button
          onClick={() => setActiveTab('evenements')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'evenements'
              ? 'bg-card text-[hsl(var(--gov-blue))] shadow-lg shadow-[hsl(var(--gov-blue))/0.1] border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          {t('admin_bilans.tabs.events')}
          <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${activeTab === 'evenements' ? 'bg-[hsl(var(--gov-blue))/0.05] border-[hsl(var(--gov-blue))/0.1]' : 'bg-muted border-border'}`}>{evenements.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('activites')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'activites'
              ? 'bg-card text-[hsl(var(--gov-blue))] shadow-lg shadow-[hsl(var(--gov-blue))/0.1] border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          {t('admin_bilans.tabs.activities')}
          <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${activeTab === 'activites' ? 'bg-[hsl(var(--gov-blue))/0.05] border-[hsl(var(--gov-blue))/0.1]' : 'bg-muted border-border'}`}>{activites.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('campagnes')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === 'campagnes'
              ? 'bg-card text-[hsl(var(--gov-blue))] shadow-lg shadow-[hsl(var(--gov-blue))/0.1] border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          {t('admin_bilans.tabs.campaigns')}
          <span className={`px-2 py-0.5 rounded-lg text-[10px] border ${activeTab === 'campagnes' ? 'bg-[hsl(var(--gov-blue))/0.05] border-[hsl(var(--gov-blue))/0.1]' : 'bg-muted border-border'}`}>{campagnes.length}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors`} />
          <input
            type="text"
            placeholder={t('admin_bilans.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`gov-input py-3.5 ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
          />
        </div>
        
        {(activeTab === 'evenements' || activeTab === 'activites') && (
          <select
            value={selectedSecteur}
            onChange={(e) => setSelectedSecteur(e.target.value)}
            className="gov-input py-3.5 min-w-[200px]"
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
        <div className="space-y-6">
          {filteredEvenements.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">{t('admin_bilans.empty.events')}</h3>
              <p className="text-muted-foreground mt-2 font-medium">{t('admin_bilans.empty.desc_events')}</p>
            </div>
          ) : (
                <motion.div 
                  key={evt.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-3xl border border-border p-8 hover:shadow-xl hover:shadow-[hsl(var(--gov-blue)/0.05)] transition-all group overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${SECTEUR_COLORS[evt.secteur] || 'bg-muted'} border-current/20`}>
                          {t('sectors.' + evt.secteur.toLowerCase())}
                        </span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border/50">
                          <Clock className="w-3 h-3" />
                          {new Date(evt.dateDebut).toLocaleDateString('fr-FR')}
                          {evt.dateFin && ` - ${new Date(evt.dateFin).toLocaleDateString('fr-FR')}`}
                        </div>
                          {evt.medias && evt.medias.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-[hsl(var(--gov-green))/0.05] rounded-full text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--gov-green))] border border-[hsl(var(--gov-green))/0.1]">
                            <ImageIcon className="w-3 h-3" />
                            {evt.medias.filter(m => m.type === 'IMAGE').length} {t('admin_bilans.labels.photos')}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-2xl font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-tight">
                        {evt.titre}
                      </h3>
                      
                      <div className="flex flex-wrap gap-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        {evt.etablissement && (
                          <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                            <Building2 className="w-4 h-4 text-[hsl(var(--gov-blue))]" />
                            {evt.etablissement.nom}
                          </span>
                        )}
                        {evt.commune && (
                          <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                            <MapPin className="w-4 h-4 text-[hsl(var(--gov-red))]" />
                            {evt.commune.nom}
                          </span>
                        )}
                        <span className="flex items-center gap-2 bg-[hsl(var(--gov-green))/0.05] px-3 py-1.5 rounded-xl border border-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))]">
                          <Users className="w-4 h-4" />
                          {evt.bilanNbParticipants || evt.nombreInscrits} {t('admin_bilans.labels.participations')}
                        </span>
                      </div>

                      {/* Bilan Description */}
                      {evt.bilanDescription && (
                        <div className="bg-muted/50 rounded-3xl p-6 border border-border/50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                              <div className="w-6 h-6 bg-card rounded-lg flex items-center justify-center border border-border">
                                <FileText className="w-3.5 h-3.5 text-[hsl(var(--gov-blue))]" />
                              </div>
                              {t('admin_bilans.labels.report')}
                            </h4>
                            <button 
                              onClick={() => toggleExpand(`evt-${evt.id}`)}
                              className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--gov-blue))] hover:text-[hsl(var(--gov-blue-dark))] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--gov-blue))/0.05] transition-all"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {isExpanded ? t('admin_bilans.labels.reduce') : t('admin_bilans.labels.expand')}
                            </button>
                          </div>
                          <div className="text-muted-foreground font-medium text-sm leading-relaxed whitespace-pre-wrap">
                            {isExpanded 
                              ? evt.bilanDescription 
                              : (evt.bilanDescription.length > 200 
                                  ? evt.bilanDescription.substring(0, 200) + '...'
                                  : evt.bilanDescription)
                            }
                          </div>
                          {evt.bilanDatePublication && (
                            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                              <Calendar className="w-3.5 h-3.5" />
                              {t('admin_bilans.labels.published_on')} {new Date(evt.bilanDatePublication).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}
                            </div>
                          )}
                          
                          {/* Photos */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <MediaGallery medias={evt.medias} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-3 min-w-[200px]">
                      <Link
                        href={`/admin/evenements/${evt.id}/modifier`}
                        className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[hsl(var(--gov-blue))/0.05] text-[hsl(var(--gov-blue))] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[hsl(var(--gov-blue))] hover:text-white transition-all border border-[hsl(var(--gov-blue))/0.1] shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        {t('admin_bilans.labels.details')}
                      </Link>
                      <button
                        onClick={() => setEditingBilan({
                          id: evt.id,
                          titre: evt.titre,
                          description: evt.bilanDescription || '',
                          participants: evt.bilanNbParticipants || 0
                        })}
                        className="flex items-center justify-center gap-2 px-5 py-3.5 bg-card text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted hover:text-foreground transition-all border border-border shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        {t('admin_bilans.labels.edit_bilan')}
                      </button>
                      <button
                        onClick={() => handleResetBilan(evt.id)}
                        className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[hsl(var(--gov-red))/0.05] text-[hsl(var(--gov-red))] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[hsl(var(--gov-red))] hover:text-white transition-all border border-[hsl(var(--gov-red))/0.1] shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('admin_bilans.labels.reset_bilan')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Content - Activités */}
      {activeTab === 'activites' && (
        <div className="space-y-6">
          {filteredActivites.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">{t('admin_bilans.empty.activities')}</h3>
              <p className="text-muted-foreground mt-2 font-medium">{t('admin_bilans.empty.desc_activities')}</p>
            </div>
          ) : (
            filteredActivites.map((act) => {
              const isExpanded = expandedItems.has(`act-${act.id}`);
              return (
                <motion.div 
                  key={act.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-3xl border border-border p-8 hover:shadow-xl hover:shadow-[hsl(var(--gov-blue)/0.05)] transition-all group overflow-hidden"
                >
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${SECTEUR_COLORS[act.etablissement.secteur] || 'bg-muted'} border-current/20`}>
                        {t('sectors.' + act.etablissement.secteur.toLowerCase())}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[hsl(var(--gov-blue))/0.05] text-[hsl(var(--gov-blue))] border border-[hsl(var(--gov-blue))/0.1]">
                        {act.typeActivite}
                      </span>
                      <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border/50">
                        <Clock className="w-3 h-3" />
                        {new Date(act.date).toLocaleDateString('fr-FR')} • {act.heureDebut} - {act.heureFin}
                      </div>
                      {act.photosRapport && act.photosRapport.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-[hsl(var(--gov-green))/0.05] rounded-full text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--gov-green))] border border-[hsl(var(--gov-green))/0.1]">
                          <ImageIcon className="w-3 h-3" />
                          {act.photosRapport.length} {t('admin_bilans.labels.photos')}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-tight">
                      {act.titre}
                    </h3>
                    
                    <div className="flex flex-wrap gap-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                        <Building2 className="w-4 h-4 text-[hsl(var(--gov-blue))]" />
                        {act.etablissement.nom}
                      </span>
                      {(act.etablissement.commune || act.lieu) && (
                        <span className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                          <MapPin className="w-4 h-4 text-[hsl(var(--gov-red))]" />
                          {act.etablissement.commune?.nom || act.lieu}
                        </span>
                      )}
                      <span className="flex items-center gap-2 bg-[hsl(var(--gov-green))/0.05] px-3 py-1.5 rounded-xl border border-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))]">
                        <Users className="w-4 h-4" />
                        {act.presenceEffective || 0} / {act.participantsAttendus || '?'} {t('admin_bilans.labels.present')}
                        {act.tauxPresence && (
                          <span className="opacity-60 ml-1">({act.tauxPresence.toFixed(0)}%)</span>
                        )}
                      </span>
                      {act.noteQualite && (
                        <span className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 text-amber-600">
                          <Star className="w-4 h-4 fill-current" />
                          {act.noteQualite}/5
                        </span>
                      )}
                    </div>

                    {/* Rapport */}
                    <div className="bg-muted/50 rounded-3xl p-6 border border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                          <div className="w-6 h-6 bg-card rounded-lg flex items-center justify-center border border-border">
                            <FileText className="w-3.5 h-3.5 text-[hsl(var(--gov-blue))]" />
                          </div>
                          {t('admin_bilans.labels.report_activity')}
                        </h4>
                        <button 
                          onClick={() => toggleExpand(`act-${act.id}`)}
                          className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--gov-blue))] hover:text-[hsl(var(--gov-blue-dark))] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--gov-blue))/0.05] transition-all"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? t('admin_bilans.labels.reduce') : t('admin_bilans.labels.view_all')}
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {act.commentaireDeroulement && (
                          <div className="text-muted-foreground font-medium text-sm leading-relaxed">
                            <strong className="text-foreground">{t('admin_bilans.labels.deroulement')} :</strong> {isExpanded ? act.commentaireDeroulement : (act.commentaireDeroulement.length > 150 ? act.commentaireDeroulement.substring(0, 150) + '...' : act.commentaireDeroulement)}
                          </div>
                        )}
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden space-y-4"
                            >
                              {act.pointsPositifs && (
                                <div className="p-4 bg-[hsl(var(--gov-green))/0.05] rounded-2xl border border-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))] text-sm font-medium leading-relaxed">
                                  <div className="flex items-center gap-2 mb-1 font-bold uppercase text-[9px] tracking-widest opacity-60">
                                    <CheckCircle2 className="w-3 h-3" /> {t('admin_bilans.labels.positives')}
                                  </div>
                                  {act.pointsPositifs}
                                </div>
                              )}
                              {act.difficultes && (
                                <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-amber-700 text-sm font-medium leading-relaxed">
                                  <div className="flex items-center gap-2 mb-1 font-bold uppercase text-[9px] tracking-widest opacity-60">
                                    <AlertCircle className="w-3 h-3" /> {t('admin_bilans.labels.difficulties')}
                                  </div>
                                  {act.difficultes}
                                </div>
                              )}
                              {act.recommandations && (
                                <div className="p-4 bg-[hsl(var(--gov-blue))/0.05] rounded-2xl border border-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))] text-sm font-medium leading-relaxed">
                                  <div className="flex items-center gap-2 mb-1 font-bold uppercase text-[9px] tracking-widest opacity-60">
                                    <Lightbulb className="w-3 h-3" /> {t('admin_bilans.labels.recommendations')}
                                  </div>
                                  {act.recommandations}
                                </div>
                              )}
                              
                              <PhotoGallery photos={act.photosRapport || []} title={act.titre} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {act.dateRapport && (
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                          <Calendar className="w-3.5 h-3.5" />
                          {t('admin_bilans.labels.completed_on')} {new Date(act.dateRapport).toLocaleDateString(t('locale') === 'ar' ? 'ar-MA' : 'fr-FR')}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Content - Campagnes */}
      {activeTab === 'campagnes' && (
        <div className="space-y-6">
          {filteredCampagnes.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Megaphone className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">{t('admin_bilans.empty.campaigns')}</h3>
              <p className="text-muted-foreground mt-2 font-medium">{t('admin_bilans.empty.desc_campaigns')}</p>
            </div>
          ) : (
            filteredCampagnes.map((camp) => {
              const isExpanded = expandedItems.has(`camp-${camp.id}`);
              return (
                <motion.div 
                  key={camp.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-3xl border border-border p-8 hover:shadow-xl hover:shadow-[hsl(var(--gov-blue)/0.05)] transition-all group overflow-hidden"
                >
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${camp.statut === 'PUBLIEE' ? 'bg-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))]' : 'bg-muted text-muted-foreground'} border-current/20`}>
                        {camp.statut}
                      </span>
                      <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border/50">
                        <Calendar className="w-3 h-3" />
                        {camp.dateDebut ? new Date(camp.dateDebut).toLocaleDateString('fr-FR') : '?'}
                        {camp.dateFin && ` - ${new Date(camp.dateFin).toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>

                    <h3 className="text-2xl font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-tight">
                      {camp.titre}
                    </h3>

                    <div className="flex flex-wrap gap-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-2 bg-[hsl(var(--gov-green))/0.05] px-3 py-1.5 rounded-xl border border-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))]">
                        <Users className="w-4 h-4" />
                        {camp.nombreParticipations || 0} / {camp.objectifParticipations || '?'} {t('admin_bilans.labels.participations')}
                      </span>
                      <span className="flex items-center gap-2 bg-[hsl(var(--gov-blue))/0.05] px-3 py-1.5 rounded-xl border border-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))]">
                        <Eye className="w-4 h-4" />
                        {camp.nombreVues || 0} {t('admin_bilans.labels.views')}
                      </span>
                    </div>

                    {/* Description Section */}
                    {(camp.description || camp.bilanDescription) && (
                      <div className="bg-muted/50 rounded-3xl p-6 border border-border/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                            <div className="w-6 h-6 bg-card rounded-lg flex items-center justify-center border border-border">
                              <FileText className="w-3.5 h-3.5 text-[hsl(var(--gov-blue))]" />
                            </div>
                            {t('admin_bilans.labels.campaign_description')}
                          </h4>
                        </div>
                        <div className="text-muted-foreground font-medium text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                          {camp.bilanDescription || camp.description}
                        </div>
                        
                        {/* Media */}
                        <MediaGallery medias={camp.medias} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        </div>
      )}

      {/* Modal d'édition Bilan (Events) */}
      <AnimatePresence>
        {editingBilan && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingBilan(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-card shadow-2xl z-[101] overflow-y-auto border-l border-border"
            >
              <div className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border px-8 py-6 flex items-center justify-between z-10">
                <h2 className="text-xl font-extrabold text-foreground">
                  {t('admin_bilans.labels.edit_bilan_title') || 'Modifier le bilan'}
                </h2>
                <button
                  onClick={() => setEditingBilan(null)}
                  className="p-2.5 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateBilan} className="p-8 space-y-8">
                <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{t('admin_bilans.labels.event')}</p>
                  <p className="text-lg font-extrabold text-foreground leading-tight">{editingBilan.titre}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      {t('admin_bilans.labels.participants_count')}
                    </label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors" />
                      <input
                        type="number"
                        required
                        value={editingBilan.participants}
                        onChange={(e) => setEditingBilan({ ...editingBilan, participants: parseInt(e.target.value) })}
                        className="gov-input pl-12 py-3.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      {t('admin_bilans.labels.bilan_description')}
                    </label>
                    <textarea
                      required
                      rows={10}
                      value={editingBilan.description}
                      onChange={(e) => setEditingBilan({ ...editingBilan, description: e.target.value })}
                      className="gov-input py-4 min-h-[250px] resize-none"
                      placeholder={t('admin_bilans.labels.description_placeholder') || 'Rédigez le bilan de l\'événement...'}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setEditingBilan(null)}
                    className="flex-1 px-6 py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-muted/80 hover:text-foreground transition-all"
                  >
                    {t('admin_bilans.labels.cancel') || 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] gov-btn-primary py-4 rounded-2xl justify-center"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {t('admin_bilans.labels.save') || 'Enregistrer'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

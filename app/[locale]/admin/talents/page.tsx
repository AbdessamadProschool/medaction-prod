'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TalentForm from '@/components/admin/talents/TalentForm';
import Image from 'next/image';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Star, 
  CheckCircle, 
  Clock, 
  User, 
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Layout
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Talent {
  id: number;
  nom: string;
  prenom: string;
  nomArtistique?: string;
  domaine: string;
  photo?: string;
  isPublie: boolean;
  isMisEnAvant: boolean;
  nombreVues: number;
  createdAt: string;
}

export default function AdminTalentsPage() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTalents = async () => {
    setLoading(true);
    try {
      // On récupère tout sans filtre de publication pour l'admin
      // Note: L'API doit gérer le paramètre isPublie=undefined pour tout renvoyer si admin
      // On va passer un paramètre spécial ou juste ne pas passer isPublie
      const res = await fetch('/api/talents?limit=100&isPublie=false'); // isPublie=false avec admin session renvoie tout selon notre logique API
      // Attends, ma logique API était: si isPublie='false', renvoie isPublie=false.
      // Il faut que je corrige l'API pour permettre de tout récupérer.
      // Ou alors je fais 2 requêtes ? Non.
      // Je vais modifier l'API pour que si isPublie n'est pas fourni et qu'on est admin, on renvoie tout.
      // Actuellement: if (isPublie !== null) ... else if (!isAdmin) where.isPublie = true;
      // Donc si je ne passe pas isPublie et que je suis admin, where.isPublie n'est pas défini, donc ça renvoie tout. C'est bon.
      
      const res2 = await fetch('/api/talents?limit=100'); 
      const json = await res2.json();
      setTalents(json.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalents();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce talent ?')) return;

    try {
      const res = await fetch(`/api/talents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTalents(talents.filter(t => t.id !== id));
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const filteredTalents = talents.filter(t => 
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.nomArtistique && t.nomArtistique.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: talents.length,
    publie: talents.filter(t => t.isPublie).length,
    misEnAvant: talents.filter(t => t.isMisEnAvant).length,
    totalVues: talents.reduce((acc, t) => acc + (t.nombreVues || 0), 0)
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[hsl(var(--gov-blue))/0.1] rounded-2xl flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
              <Sparkles className="text-[hsl(var(--gov-blue))] w-6 h-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Gestion des Talents
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg ml-15">
            Valorisez les compétences et talents de la province
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchTalents}
            className="w-12 h-12 flex items-center justify-center bg-card border border-border rounded-2xl hover:bg-muted hover:border-muted-foreground/30 transition-all shadow-sm group"
          >
            <RefreshCw size={20} className={`text-muted-foreground group-hover:text-foreground transition-colors ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingTalent(null);
              setIsFormOpen(true);
            }}
            className="gov-btn-primary h-12 px-8 rounded-2xl text-xs uppercase tracking-widest font-bold"
          >
            <Plus size={18} />
            Nouveau Talent
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Talents', value: stats.total, icon: Users, color: 'hsl(var(--gov-blue))' },
          { label: 'Profils Publiés', value: stats.publie, icon: CheckCircle, color: 'hsl(var(--gov-green))' },
          { label: 'Mis en Avant', value: stats.misEnAvant, icon: Star, color: 'hsl(var(--gov-yellow))' },
          { label: 'Vues Totales', value: stats.totalVues, icon: TrendingUp, color: 'hsl(var(--gov-muted))' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="gov-stat-card group relative overflow-hidden"
          >
            <div 
              className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:rotate-12"
              style={{ color: stat.color }}
            >
              <stat.icon className="w-full h-full" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-current/10"
                  style={{ backgroundColor: `${stat.color}08`, color: stat.color }}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-foreground mb-1 tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {isFormOpen ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-[hsl(var(--gov-blue))/0.05]"
        >
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/50">
            <div>
              <h2 className="text-2xl font-black text-foreground">
                {editingTalent ? 'Modifier le profil' : 'Ajouter un nouveau talent'}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Saisie des informations de l'artiste ou du professionnel</p>
            </div>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="p-3 hover:bg-muted rounded-2xl transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            >
              <Trash2 size={20} />
            </button>
          </div>
          <TalentForm
            talent={editingTalent}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchTalents();
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xl shadow-[hsl(var(--gov-blue))/0.02]">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou nom artistique..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="gov-input pl-12 h-12 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl shadow-[hsl(var(--gov-blue))/0.05]">
            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                      Talent / Artiste
                    </th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                      Domaine d'expertise
                    </th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                      Statut & Visibilité
                    </th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                      Performance
                    </th>
                    <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-10 h-10 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Chargement des données...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTalents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <Users size={48} />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aucun talent répertorié</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTalents.map((talent) => (
                      <tr key={talent.id} className="group hover:bg-muted/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-muted overflow-hidden relative flex-shrink-0 border border-border shadow-inner">
                              {talent.photo ? (
                                <Image
                                  src={talent.photo}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                                  <User size={24} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-tight">
                                {talent.nomArtistique || `${talent.prenom} ${talent.nom}`}
                              </div>
                              {talent.nomArtistique && (
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 mt-0.5">
                                  {talent.prenom} {talent.nom}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                            {talent.domaine}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm w-fit ${
                              talent.isPublie 
                                ? 'bg-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))] border-[hsl(var(--gov-green))/0.2]' 
                                : 'bg-muted text-muted-foreground border-border'
                            }`}>
                              {talent.isPublie ? <CheckCircle size={12} /> : <Clock size={12} />}
                              {talent.isPublie ? 'En Ligne' : 'Brouillon'}
                            </span>
                            {talent.isMisEnAvant && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[hsl(var(--gov-yellow))/0.1] text-[hsl(var(--gov-yellow))] border border-[hsl(var(--gov-yellow))/0.2] shadow-sm w-fit">
                                <Star size={12} className="fill-current" />
                                Vedette
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                              <Eye size={14} className="text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-foreground">
                                {talent.nombreVues}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-tighter">
                                Vues cumulées
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingTalent(talent);
                                setIsFormOpen(true);
                              }}
                              className="w-9 h-9 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.05] hover:border-[hsl(var(--gov-blue))/0.2] rounded-xl transition-all shadow-sm"
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(talent.id)}
                              className="w-9 h-9 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))/0.05] hover:border-[hsl(var(--gov-red))/0.2] rounded-xl transition-all shadow-sm"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

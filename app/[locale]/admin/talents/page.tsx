'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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
import { GovPageHeader, GovButton, GovTable, GovTh, GovTd, GovTr } from '@/components/ui';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';

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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: talentsData, isLoading: loading, mutate: fetchTalents } = useData('/api/talents?limit=100');
  const talents: Talent[] = talentsData?.data || [];
  
  const actionMutation = useMutation();

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeleteConfirmId(null);
    const promise = new Promise(async (resolve, reject) => {
      try {
        await actionMutation.mutate(`/api/talents/${id}`, {
          method: 'DELETE',
        });
        await fetchTalents();
        resolve(true);
      } catch (error: any) {
        reject(new Error(error.message || 'Erreur lors de la suppression'));
      }
    });

    toast.promise(promise, {
      loading: 'Suppression du talent en cours...',
      success: 'Talent supprimé avec succès',
      error: (err) => err.message,
    });
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
      <GovPageHeader
        title="Gestion des Talents"
        subtitle="Valorisez les compétences et talents de la province"
        icon={<Sparkles className="w-8 h-8" />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <GovButton
              onClick={fetchTalents}
              variant="outline"
              size="icon"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </GovButton>
            <GovButton
              onClick={() => {
                setEditingTalent(null);
                setIsFormOpen(true);
              }}
              variant="primary"
              leftIcon={<Plus size={18} />}
            >
              Nouveau Talent
            </GovButton>
          </div>
        }
      />

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
            <div className="overflow-x-auto w-full min-w-full">
              <GovTable>
                <thead>
                  <tr>
                    <GovTh>
                      Talent / Artiste
                    </GovTh>
                    <GovTh>
                      Domaine d'expertise
                    </GovTh>
                    <GovTh>
                      Statut & Visibilité
                    </GovTh>
                    <GovTh>
                      Performance
                    </GovTh>
                    <GovTh className="text-right">
                      Actions
                    </GovTh>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <GovTr>
                      <GovTd colSpan={5} className="text-center py-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-10 h-10 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Chargement des données...</p>
                        </div>
                      </GovTd>
                    </GovTr>
                  ) : filteredTalents.length === 0 ? (
                    <GovTr>
                      <GovTd colSpan={5} className="text-center py-20">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <Users size={48} />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aucun talent répertorié</p>
                        </div>
                      </GovTd>
                    </GovTr>
                  ) : (
                    filteredTalents.map((talent) => (
                      <GovTr key={talent.id}>
                        <GovTd>
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
                        </GovTd>
                        <GovTd>
                          <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                            {talent.domaine}
                          </span>
                        </GovTd>
                        <GovTd>
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
                        </GovTd>
                        <GovTd>
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
                        </GovTd>
                        <GovTd className="text-right">
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
                              onClick={() => setDeleteConfirmId(talent.id)}
                              className="w-9 h-9 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))/0.05] hover:border-[hsl(var(--gov-red))/0.2] rounded-xl transition-all shadow-sm"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </GovTd>
                      </GovTr>
                    ))
                  )}
                </tbody>
              </GovTable>
            </div>
          </div>
        </div>
      )}
      {/* Modal Confirmation de Suppression */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl max-w-md w-full p-7 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-[hsl(var(--gov-red))/0.1] text-[hsl(var(--gov-red))] rounded-2xl mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-2">
                  Confirmation de suppression
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Êtes-vous sûr de vouloir supprimer ce talent ? Cette action est irréversible.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 px-5 py-3 border border-border text-muted-foreground rounded-2xl hover:bg-muted text-sm font-bold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmId)}
                    className="flex-1 px-5 py-3 bg-[hsl(var(--gov-red))] text-white rounded-2xl hover:opacity-90 text-sm font-bold transition-colors shadow-lg shadow-[hsl(var(--gov-red))/0.2]"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

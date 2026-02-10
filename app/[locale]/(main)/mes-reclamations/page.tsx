'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { PermissionGuard } from '@/hooks/use-permission';
import ReclamationCard from '@/components/reclamations/ReclamationCard';
import ReclamationModal from '@/components/reclamations/ReclamationModal';
import { ClipboardList, Clock, CheckCircle2, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface Reclamation {
  id: number;
  titre: string;
  categorie: string;
  description: string;
  statut: 'ACCEPTEE' | 'REJETEE' | null;
  affectationReclamation: 'NON_AFFECTEE' | 'AFFECTEE';
  dateResolution: string | null;
  createdAt: string;
  commune: { nom: string };
  etablissement?: { nom: string } | null;
}

const tabs = [
  { id: 'all', label: 'all', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'en_attente', label: 'pending', icon: <Clock className="w-4 h-4" />, color: 'text-amber-600' },
  { id: 'ACCEPTEE', label: 'accepted', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600' },
];

export default function MesReclamationsPage() {
  const t = useTranslations('my_reclamations_page');
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Charger les réclamations
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') {
      params.set('statut', activeTab);
    }

    fetch(`/api/reclamations?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        setReclamations(json.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeTab]);

  // Filtrer localement selon le tab (exclure les rejetées de l'affichage)
  const filteredReclamations = reclamations.filter(rec => {
    // Ne jamais afficher les réclamations rejetées
    if (rec.statut === 'REJETEE') return false;
    
    if (activeTab === 'all') return true;
    if (activeTab === 'en_attente') return rec.statut === null;
    return rec.statut === activeTab;
  });

  // Stats (sans les rejetées)
  const stats = {
    total: reclamations.filter(r => r.statut !== 'REJETEE').length,
    enAttente: reclamations.filter(r => r.statut === null).length,
    acceptees: reclamations.filter(r => r.statut === 'ACCEPTEE').length,
  };

  const openModal = (id: number) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  return (
    <PermissionGuard 
      permission="reclamations.read" 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('access_denied')}</h2>
            <p className="text-gray-500 mb-6">{t('permission_text')}</p>
            <Link href="/" className="text-emerald-600 hover:underline">
              {t('back_home')}
            </Link>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600 mt-1">{t('subtitle')}</p>
            </div>
            <PermissionGuard permission="reclamations.create">
              <Link
                href="/reclamations/nouvelle"
                className="gov-btn gov-btn-gold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('new_reclamation')}
              </Link>
            </PermissionGuard>
          </div>

          {/* Stats Cards - 3 cartes seulement */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="gov-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[hsl(213,80%,28%)]">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500">{t('stats.total')}</p>
                </div>
              </div>
            </div>
            <div className="gov-card p-4 border-[hsl(45,93%,47%)]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(45,93%,47%)]/20 flex items-center justify-center text-[hsl(45,93%,40%)]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[hsl(45,93%,40%)]">{stats.enAttente}</p>
                  <p className="text-xs text-gray-500">{t('stats.pending')}</p>
                </div>
              </div>
            </div>
            <div className="gov-card p-4 border-[hsl(145,63%,32%)]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(145,63%,32%)]/20 flex items-center justify-center text-[hsl(145,63%,32%)]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[hsl(145,63%,32%)]">{stats.acceptees}</p>
                  <p className="text-xs text-gray-500">{t('stats.accepted')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - 3 onglets seulement */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[hsl(213,80%,28%)] text-white shadow-lg shadow-[hsl(213,80%,28%)]/20'
                    : 'bg-white text-gray-600 hover:bg-[hsl(213,80%,28%)]/10 border border-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{t(`tabs.${tab.label}`)}</span>
                {tab.id === 'en_attente' && stats.enAttente > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-[hsl(45,93%,47%)]/20 text-[hsl(45,93%,40%)]'
                  }`}>
                    {stats.enAttente}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredReclamations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Inbox className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('empty.title')}
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === 'all' 
                  ? t('empty.all')
                  : t('empty.filtered', { filter: t(`tabs.${tabs.find(t => t.id === activeTab)?.label}`) })}
              </p>
              {activeTab === 'all' && (
                <PermissionGuard permission="reclamations.create">
                  <Link
                    href="/reclamations/nouvelle"
                    className="gov-btn gov-btn-primary"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('empty.create_btn')}
                  </Link>
                </PermissionGuard>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 gap-4"
            >
              <AnimatePresence>
                {filteredReclamations.map(rec => (
                  <ReclamationCard
                    key={rec.id}
                    reclamation={rec}
                    onClick={() => openModal(rec.id)}
                    onDelete={async () => {
                      if (!confirm(t('delete_confirm'))) return;
                      try {
                        const res = await fetch(`/api/reclamations/${rec.id}`, { method: 'DELETE' });
                        if (res.ok) {
                          toast.success(t('delete_success'));
                          // Rafraichir la liste
                          setReclamations(prev => prev.filter(r => r.id !== rec.id));
                        } else {
                          const data = await res.json();
                          toast.error(data.error || 'Erreur lors de la suppression');
                        }
                      } catch (e) {
                         toast.error('Erreur serveur');
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Modal */}
        <ReclamationModal
          reclamationId={selectedId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </PermissionGuard>
  );
}

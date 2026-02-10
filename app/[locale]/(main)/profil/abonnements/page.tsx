'use client';

import { PermissionGuard } from '@/hooks/use-permission';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Building2,
  Trash2,
  MapPin,
  Calendar,
  Newspaper,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  AlertCircle,
} from 'lucide-react';

interface Etablissement {
  id: number;
  nom: string;
  adresseComplete: string | null;
  secteur: string;
  photoPrincipale: string | null;
  commune: { nom: string };
  _count: {
    evenements: number;
    actualites: number;
  };
}

interface Abonnement {
  id: number;
  etablissementId: number;
  notificationsActives: boolean;
  createdAt: string;
  etablissement: Etablissement;
}

const secteurIcons: Record<string, string> = {
  SANTE: '🏥',
  EDUCATION: '🎓',
  SPORT: '⚽',
  CULTURE: '🎭',
  JEUNESSE: '👥',
  SOCIAL: '🤝',
  ENVIRONNEMENT: '🌳',
  ADMINISTRATION: '🏛️',
};

export default function AbonnementsPage() {
  const { data: session, status } = useSession();
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Charger les abonnements
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAbonnements();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, page]);

  const fetchAbonnements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/me/abonnements?page=${page}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setAbonnements(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Erreur chargement abonnements:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async (abonnement: Abonnement) => {
    setActionLoading(abonnement.id);
    try {
      const res = await fetch(`/api/abonnements/${abonnement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationsActives: !abonnement.notificationsActives }),
      });

      if (res.ok) {
        setAbonnements(prev => 
          prev.map(a => 
            a.id === abonnement.id 
              ? { ...a, notificationsActives: !a.notificationsActives }
              : a
          )
        );
      }
    } catch (error) {
      console.error('Erreur toggle notifications:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const unsubscribe = async (abonnement: Abonnement) => {
    if (!confirm(`Voulez-vous vraiment vous désabonner de "${abonnement.etablissement.nom}" ?`)) {
      return;
    }

    setActionLoading(abonnement.id);
    try {
      const res = await fetch(`/api/abonnements/${abonnement.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAbonnements(prev => prev.filter(a => a.id !== abonnement.id));
        setTotal(prev => prev - 1);
      }
    } catch (error) {
      console.error('Erreur désabonnement:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrer par recherche
  const filteredAbonnements = abonnements.filter(a => 
    a.etablissement?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.etablissement?.commune?.nom?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Non connecté
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="gov-card text-center py-16">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connexion requise</h2>
            <p className="text-gray-500 mb-6">Connectez-vous pour gérer vos abonnements.</p>
            <Link href="/login" className="gov-btn gov-btn-primary">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      permission="etablissements.subscribe" 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès restreint</h2>
            <p className="text-gray-500 mb-6">Vous n'avez pas la permission de gérer des abonnements.</p>
            <Link href="/profil" className="text-emerald-600 hover:underline">
              Retour au profil
            </Link>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/profil" className="hover:text-[hsl(213,80%,28%)]">Mon profil</Link>
                <span>/</span>
                <span className="text-gray-900">Mes abonnements</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Abonnements</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos abonnements aux établissements ({total})
              </p>
            </div>

            <Link
              href="/etablissements"
              className="gov-btn gov-btn-primary"
            >
              <Building2 size={18} />
              Explorer les établissements
            </Link>
          </div>

          {/* Barre de recherche */}
          <div className="gov-card p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un établissement..."
                className="gov-input pl-12"
              />
            </div>
          </div>

          {/* Contenu */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[hsl(213,80%,28%)] animate-spin" />
            </div>
          ) : filteredAbonnements.length === 0 ? (
            <div className="gov-card text-center py-16">
              <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'Aucun résultat' : 'Aucun abonnement'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? 'Aucun abonnement ne correspond à votre recherche.'
                  : 'Vous n\'êtes abonné à aucun établissement pour le moment.'}
              </p>
              {!searchQuery && (
                <Link href="/etablissements" className="gov-btn gov-btn-primary">
                  Découvrir les établissements
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Grille des abonnements */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredAbonnements.map((abonnement, index) => (
                    <motion.div
                      key={abonnement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="gov-card p-0 overflow-hidden group"
                    >
                      {/* Image ou placeholder */}
                      <div className="relative h-32 bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)] overflow-hidden">
                        {abonnement.etablissement.photoPrincipale ? (
                          <img
                            src={abonnement.etablissement.photoPrincipale}
                            alt=""
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl">
                              {secteurIcons[abonnement.etablissement.secteur] || '🏢'}
                            </span>
                          </div>
                        )}
                        
                        {/* Badge secteur */}
                        <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-medium text-gray-700">
                          {abonnement.etablissement.secteur}
                        </span>
                        
                        {/* Notification badge */}
                        <span className={`absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur ${
                          abonnement.notificationsActives 
                            ? 'bg-[hsl(45,93%,47%)]/90 text-gray-900' 
                            : 'bg-white/50 text-gray-500'
                        }`}>
                          {abonnement.notificationsActives ? <Bell size={14} /> : <BellOff size={14} />}
                        </span>
                      </div>

                      {/* Contenu */}
                      <div className="p-4">
                        <Link 
                          href={`/etablissements/${abonnement.etablissement.id}`}
                          className="block"
                        >
                          <h3 className="font-semibold text-gray-900 group-hover:text-[hsl(213,80%,28%)] transition-colors line-clamp-1">
                            {abonnement.etablissement.nom}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin size={12} />
                            {abonnement.etablissement?.commune?.nom || 'N/A'}
                          </p>
                        </Link>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {abonnement.etablissement._count.evenements} événement(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <Newspaper size={12} />
                            {abonnement.etablissement._count.actualites} actualité(s)
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => toggleNotifications(abonnement)}
                            disabled={actionLoading === abonnement.id}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                              abonnement.notificationsActives
                                ? 'bg-[hsl(45,93%,47%)]/10 text-[hsl(45,93%,35%)] hover:bg-[hsl(45,93%,47%)]/20'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {actionLoading === abonnement.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : abonnement.notificationsActives ? (
                              <Bell size={14} />
                            ) : (
                              <BellOff size={14} />
                            )}
                            {abonnement.notificationsActives ? 'Notif. ON' : 'Notif. OFF'}
                          </button>
                          <button
                            onClick={() => unsubscribe(abonnement)}
                            disabled={actionLoading === abonnement.id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Se désabonner"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {page} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}

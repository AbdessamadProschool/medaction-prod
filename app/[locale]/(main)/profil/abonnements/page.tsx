'use client';

import { PermissionGuard } from '@/hooks/use-permission';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';
import { toast } from 'sonner';
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
  const t = useTranslations('my_subscriptions_page');
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [abonnementToUnsubscribe, setAbonnementToUnsubscribe] = useState<Abonnement | null>(null);

  const queryStr = useMemo(() => {
    return `page=${page}&limit=12`;
  }, [page]);

  const { data: responseData, isLoading: loading, mutate: refreshData } = useData(status === 'authenticated' ? `/api/users/me/abonnements?${queryStr}` : null);
  const abonnements: Abonnement[] = responseData?.data?.data || [];
  const totalPages = responseData?.data?.pagination?.totalPages || 1;
  const total = responseData?.data?.pagination?.total || 0;

  const toggleMutation = useMutation();
  const unsubscribeMutation = useMutation();

  const toggleNotifications = async (abonnement: Abonnement) => {
    setActionLoading(abonnement.id);
    try {
      await toggleMutation.mutate(`/api/abonnements/${abonnement.id}`, {
        method: 'PATCH',
        data: { notificationsActives: !abonnement.notificationsActives },
      });
      refreshData();
      toast.success(t('notif_updated', { defaultMessage: 'Préférences mises à jour' }));
    } catch (error: any) {
      toast.error(error.message || tCommon('error', { defaultMessage: 'Une erreur est survenue' }));
    } finally {
      setActionLoading(null);
    }
  };

  const unsubscribe = async (abonnement: Abonnement) => {
    setAbonnementToUnsubscribe(null);
    setActionLoading(abonnement.id);
    try {
      await unsubscribeMutation.mutate(`/api/abonnements/${abonnement.id}`, {
        method: 'DELETE',
      });
      refreshData();
      toast.success(t('unsubscribe_success', { defaultMessage: 'Désabonnement réussi' }));
    } catch (error: any) {
      toast.error(error.message || tCommon('error', { defaultMessage: 'Une erreur est survenue' }));
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrer par recherche de manière sécurisée (au cas où l'API renvoie autre chose qu'un tableau)
  const safeAbonnements = Array.isArray(abonnements) ? abonnements : [];
  const filteredAbonnements = safeAbonnements.filter(a => 
    a?.etablissement?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a?.etablissement?.commune?.nom?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Non connecté
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="gov-card text-center py-16">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('auth_required')}</h2>
            <p className="text-gray-500 mb-6">{t('auth_required_desc')}</p>
            <Link href="/login" className="gov-btn gov-btn-primary">
              {t('login_btn')}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('access_denied')}</h2>
            <p className="text-gray-500 mb-6">{t('access_denied_desc')}</p>
            <Link href="/profil" className="text-gov-green-dark hover:underline">
              {t('back_to_profile')}
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
                <Link href="/profil" className="hover:text-gov-blue">{tCommon('user')}</Link>
                <span>/</span>
                <span className="text-gray-900">{t('breadcrumb')}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600 mt-1">
                {t('subtitle', { total })}
              </p>
            </div>

            <Link
              href="/etablissements"
              className="gov-btn gov-btn-primary"
            >
              <Building2 size={18} />
              {tCommon('explorer')}
            </Link>
          </div>

          {/* Barre de recherche */}
          <div className="gov-card p-4 mb-6">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="gov-input ps-12"
              />
            </div>
          </div>

          {/* Contenu */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gov-blue animate-spin" />
            </div>
          ) : filteredAbonnements.length === 0 ? (
            <div className="gov-card text-center py-16">
              <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? t('no_results') : t('no_subscriptions')}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? t('no_results_desc')
                  : t('no_subscriptions_desc')}
              </p>
              {!searchQuery && (
                <Link href="/etablissements" className="gov-btn gov-btn-primary">
                  {t('discover_btn')}
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
                      <div className="relative h-32 bg-gradient-to-br from-gov-blue to-[hsl(213,80%,35%)] overflow-hidden">
                        {abonnement.etablissement.photoPrincipale ? (
                          <OptimizedImage
                            src={abonnement.etablissement.photoPrincipale}
                            alt={abonnement.etablissement.nom}
                            fill
                            className="opacity-80 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl">
                              {secteurIcons[abonnement.etablissement.secteur] || '🏢'}
                            </span>
                          </div>
                        )}
                        
                        {/* Badge secteur */}
                        <span className="absolute top-3 start-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-medium text-gray-700">
                          {tCommon(`sectors.${abonnement.etablissement.secteur.toLowerCase()}`)}
                        </span>
                        
                        {/* Notification badge */}
                        <span className={`absolute top-3 end-3 p-1.5 rounded-lg backdrop-blur ${
                          abonnement.notificationsActives 
                            ? 'bg-gov-gold/90 text-gray-900' 
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
                          <h3 className="font-semibold text-gray-900 group-hover:text-gov-blue transition-colors line-clamp-1">
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
                            {t('events_count', { count: abonnement.etablissement._count.evenements })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Newspaper size={12} />
                            {t('news_count', { count: abonnement.etablissement._count.actualites })}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => toggleNotifications(abonnement)}
                            disabled={actionLoading === abonnement.id}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                              abonnement.notificationsActives
                                ? 'bg-gov-gold/10 text-[hsl(45,93%,35%)] hover:bg-gov-gold/20'
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
                            {abonnement.notificationsActives ? t('notif_on') : t('notif_off')}
                          </button>
                          <button
                            onClick={() => setAbonnementToUnsubscribe(abonnement)}
                            disabled={actionLoading === abonnement.id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title={t('unsubscribe')}
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
                    {t('page_info', { page, totalPages })}
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

      {/* Unsubscribe Confirmation Modal */}
      <AnimatePresence>
        {abonnementToUnsubscribe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 text-red-500">
                <Trash2 className="w-6 h-6" />
                <h3 className="text-lg font-bold text-foreground">Se désabonner</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('unsubscribe_confirm', { name: abonnementToUnsubscribe.etablissement.nom })}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAbonnementToUnsubscribe(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => unsubscribe(abonnementToUnsubscribe)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Se désabonner
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </PermissionGuard>
  );
}

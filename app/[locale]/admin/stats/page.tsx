'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Building2,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StatsData {
  reclamations: {
    total: number;
    ceMois: number;
    moisDernier: number;
    parStatut: { statut: string; count: number }[];
    parCategorie: { categorie: string; count: number }[];
    parCommune: { commune: string; count: number }[];
  };
  etablissements: {
    total: number;
    parSecteur: { secteur: string; count: number }[];
    noteMoyenne: number;
  };
  evenements: {
    total: number;
    ceMois: number;
    parSecteur: { secteur: string; count: number }[];
  };
  utilisateurs: {
    total: number;
    nouveauxCeMois: number;
    parRole: { role: string; count: number }[];
  };
}

export default function AdminStatsPage() {
  const t = useTranslations();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<'7j' | '30j' | '90j' | '1an'>('30j');

  useEffect(() => {
    fetchStats();
  }, [periode]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/stats?periode=${periode}`);
      if (res.ok) {
        const data = await res.json();
        // Mapping de la réponse API (format { stats, charts, details }) vers le format attendu par le composant
        const formattedData: StatsData = {
          reclamations: {
            total: data?.data?.stats?.reclamations?.total ?? 0,
            ceMois: data?.data?.stats?.reclamations?.ceMois ?? 0,
            moisDernier: data?.data?.stats?.reclamations?.moisDernier ?? 0,
            parStatut: data?.data?.charts?.reclamationsParStatut?.map((s: any) => ({
              statut: s.statut === 'En attente' ? 'EN_ATTENTE' : 
                      s.statut === 'À affecter' ? 'ACCEPTEE' : // Mapping approximatif pour le rendu
                      s.statut === 'En cours' ? 'ACCEPTEE' :
                      s.statut === 'Résolues' ? 'ACCEPTEE' :
                      s.statut === 'Rejetées' ? 'REJETEE' : s.statut,
              count: s.count
            })) ?? [],
            parCategorie: [], // Non fourni par cet API spécifique actuellement
            parCommune: [],
          },
          etablissements: {
            total: data?.data?.stats?.etablissements?.total ?? 0,
            parSecteur: [], // Non fourni par cet API spécifique actuellement
            noteMoyenne: data?.data?.stats?.etablissements?.noteMoyenne ?? 0
          },
          evenements: {
            total: data?.data?.stats?.evenements?.total ?? 0,
            ceMois: data?.data?.stats?.evenements?.ceMois ?? 0,
            parSecteur: data?.data?.charts?.evenementsParSecteur ?? []
          },
          utilisateurs: {
            total: data?.data?.stats?.utilisateurs?.total ?? 0,
            nouveauxCeMois: data?.data?.stats?.utilisateurs?.nouveaux ?? 0,
            parRole: Object.entries(data?.data?.stats?.utilisateurs?.byRole || {}).map(([role, count]) => ({
              role,
              count: count as number
            }))
          }
        };
        setStats(formattedData);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('admin_stats.title')}</h1>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="gov-card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Données par défaut
  const defaultStats: StatsData = stats || {
    reclamations: { total: 0, ceMois: 0, moisDernier: 0, parStatut: [], parCategorie: [], parCommune: [] },
    etablissements: { total: 0, parSecteur: [], noteMoyenne: 0 },
    evenements: { total: 0, ceMois: 0, parSecteur: [] },
    utilisateurs: { total: 0, nouveauxCeMois: 0, parRole: [] },
  };

  const variation = defaultStats.reclamations.moisDernier > 0
    ? Math.round(((defaultStats.reclamations.ceMois - defaultStats.reclamations.moisDernier) / defaultStats.reclamations.moisDernier) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="text-[hsl(var(--gov-blue))]" size={32} />
            {t('admin_stats.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('admin_stats.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {(['7j', '30j', '90j', '1an'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                periode === p
                  ? 'bg-[hsl(var(--gov-blue))] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gov-stat-card"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="gov-stat-label">{t('admin_stats.cards.reclamations_total')}</p>
              <p className="gov-stat-value mt-1">
                {defaultStats.reclamations.total}
              </p>
            </div>
            <div className="gov-stat-icon">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {variation >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-bold ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variation >= 0 ? '+' : ''}{variation}%
            </span>
            <span className="text-xs text-gray-500">{t('admin_stats.cards.vs_last_month')}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gov-stat-card"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="gov-stat-label">{t('admin_stats.cards.establishments')}</p>
              <p className="gov-stat-value mt-1">
                {defaultStats.etablissements.total}
              </p>
            </div>
            <div className="gov-stat-icon">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-500">{t('admin_stats.cards.avg_rating')}</span>
            <span className="text-sm font-bold text-[hsl(var(--gov-gold))]">
              ★ {defaultStats.etablissements.noteMoyenne.toFixed(1)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gov-stat-card"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="gov-stat-label">{t('admin_stats.cards.events')}</p>
              <p className="gov-stat-value mt-1">
                {defaultStats.evenements.total}
              </p>
            </div>
            <div className="gov-stat-icon">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-500">{t('admin_stats.cards.this_month')}</span>
            <span className="text-sm font-bold text-[hsl(var(--gov-blue))]">{defaultStats.evenements.ceMois}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gov-stat-card"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="gov-stat-label">{t('admin_stats.cards.users')}</p>
              <p className="gov-stat-value mt-1">
                {defaultStats.utilisateurs.total}
              </p>
            </div>
            <div className="gov-stat-icon">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-gray-500">{t('admin_stats.cards.new_this_month')}</span>
            <span className="text-sm font-bold text-green-600">
              +{defaultStats.utilisateurs.nouveauxCeMois}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Réclamations par statut */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="gov-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('admin_stats.charts.reclamations_by_status')}
          </h3>
          <div className="space-y-3">
            {defaultStats.reclamations.parStatut.length > 0 ? (
              defaultStats.reclamations.parStatut.map((item) => (
                <div key={item.statut} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.statut === 'ACCEPTEE' ? 'bg-[hsl(145,63%,32%)]' :
                      item.statut === 'REJETEE' ? 'bg-[hsl(348,83%,47%)]' :
                      'bg-[hsl(45,93%,47%)]'
                    }`} />
                    <span className="text-sm text-gray-600">
                      {item.statut ? (
                        item.statut === 'ACCEPTEE' ? t('status.accepted') :
                        item.statut === 'REJETEE' ? t('status.rejected') :
                        item.statut === 'EN_ATTENTE' ? t('status.pending') :
                        item.statut
                      ) : t('admin_stats.charts.pending')}
                    </span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">{t('admin_stats.charts.no_data')}</p>
            )}
          </div>
        </motion.div>

        {/* Établissements par secteur */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="gov-card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('admin_stats.charts.establishments_by_sector')}
          </h3>
          <div className="space-y-3">
            {defaultStats.etablissements.parSecteur.length > 0 ? (
              defaultStats.etablissements.parSecteur.map((item) => (
                <div key={item.secteur}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('sectors.' + item.secteur.toLowerCase())}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[hsl(213,80%,28%)] to-[hsl(213,80%,45%)] rounded-full"
                      style={{ 
                        width: `${(item.count / defaultStats.etablissements.total) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">{t('admin_stats.charts.no_data')}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Info */}
      <div className="gov-card p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            {t('admin_stats.info')}
          </p>
        </div>
      </div>
    </div>
  );
}

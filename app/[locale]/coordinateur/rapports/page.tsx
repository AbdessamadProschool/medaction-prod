'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  Search,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  RefreshCw,
  Download,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface Rapport {
  id: number;
  titre: string;
  date: string;
  statut: string;
  etablissement: { id: number; nom: string; secteur: string };
  nombreParticipants?: number;
  observations?: string;
  createdAt: string;
}

export default function CoordinateurRapportsPage() {
  const t = useTranslations('coordinator.reports');
  const { data: session } = useSession();
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<'all' | 'pending' | 'completed'>('all');

  const fetchRapports = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(
        `/api/programmes-activites?dateFin=${today}&statut=TERMINEE,RAPPORT_COMPLETE&limit=50`
      );
      
      if (res.ok) {
        const data = await res.json();
        setRapports(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRapports();
  }, [fetchRapports]);

  const filteredRapports = rapports.filter(rapport => {
    const matchSearch = rapport.titre.toLowerCase().includes(search.toLowerCase()) ||
                       rapport.etablissement?.nom.toLowerCase().includes(search.toLowerCase());
    
    if (filterStatut === 'pending') {
      return matchSearch && rapport.statut === 'TERMINEE';
    }
    if (filterStatut === 'completed') {
      return matchSearch && rapport.statut === 'RAPPORT_COMPLETE';
    }
    return matchSearch;
  });

  const pendingCount = rapports.filter(r => r.statut === 'TERMINEE').length;
  const completedCount = rapports.filter(r => r.statut === 'RAPPORT_COMPLETE').length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-MA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            {t('title')}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            {t('subtitle', { count: pendingCount })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRapports}
            disabled={loading}
            className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => setFilterStatut('all')}
          className={`p-4 rounded-[2rem] border-2 transition-all shadow-sm ${
            filterStatut === 'all'
              ? 'border-purple-500 bg-purple-50'
              : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-3xl font-black text-gray-900">{rapports.length}</p>
          <p className="text-sm text-gray-500 font-bold">{t('stats.total')}</p>
        </button>

        <button
          onClick={() => setFilterStatut('pending')}
          className={`p-4 rounded-[2rem] border-2 transition-all shadow-sm ${
            filterStatut === 'pending'
              ? 'border-amber-500 bg-amber-50'
              : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
          <p className="text-sm text-gray-500 font-bold">{t('stats.pending')}</p>
        </button>

        <button
          onClick={() => setFilterStatut('completed')}
          className={`p-4 rounded-[2rem] border-2 transition-all shadow-sm ${
            filterStatut === 'completed'
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-transparent bg-white hover:border-gray-200'
          }`}
        >
          <p className="text-3xl font-black text-emerald-600">{completedCount}</p>
          <p className="text-sm text-gray-500 font-bold">{t('stats.completed')}</p>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Liste des rapports */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          </div>
        ) : filteredRapports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {search ? t('empty.title') : t('empty.title')}
            </h3>
            <p className="text-gray-500 font-medium">
              {filterStatut === 'pending' 
                ? t('empty.all_completed') 
                : t('empty.subtitle')}
            </p>
          </div>
        ) : (
          filteredRapports.map((rapport, index) => {
            const isPending = rapport.statut === 'TERMINEE';
            // Config inline for now
            const config = isPending 
                ? { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: t('status.pending') }
                : { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: t('status.completed') };
            
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={rapport.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-[2rem] border ${
                  isPending 
                    ? 'border-amber-100' 
                    : 'border-gray-100'
                } overflow-hidden hover:shadow-xl transition-all group`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-16 h-16 rounded-2xl ${
                      isPending 
                        ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600' 
                        : 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600'
                    } flex items-center justify-center shadow-md`}>
                      <FileText className="w-7 h-7" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                            {rapport.titre}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              {formatDate(rapport.date)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              {rapport.etablissement?.nom || 'Établissement'}
                            </span>
                          </div>
                        </div>

                        <span className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        {isPending ? (
                          <Link
                            href={`/coordinateur/calendrier?activite=${rapport.id}&action=rapport`}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                            {t('actions.fill')}
                          </Link>
                        ) : (
                          <Link
                            href={`/coordinateur/calendrier?activite=${rapport.id}`}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            {t('actions.view')}
                          </Link>
                        )}
                        <button className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl transition-all">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Indicator bar for pending reports */}
                {isPending && (
                  <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

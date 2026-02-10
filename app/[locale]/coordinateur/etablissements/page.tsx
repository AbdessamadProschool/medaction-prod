'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  Building2,
  Search,
  MapPin,
  Calendar,
  Eye,
  ChevronLeft,
  RefreshCw,
  Star,
} from 'lucide-react';
import Link from 'next/link';

interface Etablissement {
  id: number;
  nom: string;
  code: string;
  secteur: string;
  adresse: string;
  telephone: string | null;
  email: string | null;
  commune: { id: number; nom: string } | null;
  note?: number;
  _count?: {
    evenements: number;
    evaluations: number;
  };
}

const SECTEURS_LABELS: Record<string, string> = {
  EDUCATION: 'التعليم',
  SANTE: 'الصحة',
  SPORT: 'الرياضة',
  SOCIAL: 'اجتماعي',
  CULTUREL: 'ثقافي',
  AUTRE: 'آخر',
};

const SECTEURS_COLORS: Record<string, string> = {
  EDUCATION: 'from-blue-500 to-indigo-600',
  SANTE: 'from-rose-500 to-red-600',
  SPORT: 'from-green-500 to-emerald-600',
  SOCIAL: 'from-purple-500 to-violet-600',
  CULTUREL: 'from-amber-500 to-orange-600',
  AUTRE: 'from-gray-500 to-gray-700',
};

export default function CoordinateurEtablissementsPage() {
  const t = useTranslations('coordinator.establishments');
  const { data: session } = useSession();
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEtablissements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Note: Le filtrage par "etablissementsGeres" est maintenant géré automatiquement 
      // par l'API (/api/etablissements) qui vérifie les données fraîches en BD
      // pour le coordinateur connecté. Cela évite les problèmes de session obsolète.
      
      const res = await fetch(`/api/etablissements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEtablissements(data.data || data.etablissements || []);
      }
    } catch (error) {
      console.error('Erreur chargement établissements:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchEtablissements();
    }
  }, [fetchEtablissements, session]);

  const filteredEtablissements = etablissements.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.code.toLowerCase().includes(search.toLowerCase()) ||
    e.secteur.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
            {t('title')}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            {t('subtitle', { count: etablissements.length })}
          </p>
        </div>
        
        <button
          onClick={fetchEtablissements}
          className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm self-start lg:self-auto"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
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
            className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-6 animate-pulse border border-gray-100">
              <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4" />
              <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
              <div className="h-16 w-full bg-gray-200 rounded-xl" />
            </div>
          ))
        ) : filteredEtablissements.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-[2rem] border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('empty.title')}
            </h3>
            <p className="text-gray-500 font-medium">
              {search ? t('empty.search') : t('empty.subtitle')}
            </p>
          </div>
        ) : (
          filteredEtablissements.map((etablissement) => (
            <motion.div
              key={etablissement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group"
            >
              {/* Header gradient */}
              <div className={`h-2 bg-gradient-to-r ${SECTEURS_COLORS[etablissement.secteur] || SECTEURS_COLORS.AUTRE}`} />
              
              <div className="p-6">
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${SECTEURS_COLORS[etablissement.secteur] || SECTEURS_COLORS.AUTRE} flex items-center justify-center text-white shadow-lg shrink-0`}>
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 line-clamp-2 text-lg leading-tight mb-1">
                      {etablissement.nom}
                    </h3>
                    <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">
                      {SECTEURS_LABELS[etablissement.secteur] || etablissement.secteur}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3 text-sm text-gray-500 mb-6 font-medium">
                  {etablissement.commune && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      <span>{etablissement.commune.nom}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded text-gray-400 border border-gray-100">{etablissement.code}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 font-bold">
                      <Calendar size={14} className="text-blue-500" />
                      {t('stats.events')}
                    </div>
                    <p className="font-black text-xl text-gray-900">
                      {etablissement._count?.evenements || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 font-bold">
                      <Star size={14} className="text-amber-500" />
                      {t('stats.evaluations')}
                    </div>
                    <p className="font-black text-xl text-gray-900">
                      {etablissement._count?.evaluations || 0}
                    </p>
                  </div>
                </div>

                {/* Action */}
                <Link
                  href={`/etablissements/${etablissement.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-xl transition-all font-bold group-hover:border-emerald-200 border border-transparent"
                >
                  <Eye size={18} />
                  <span>{t('view_details')}</span>
                  <ChevronLeft size={18} className="mr-auto text-gray-400 group-hover:text-emerald-500" />
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useData } from '@/hooks/use-data';
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
import { Link } from '@/i18n/navigation';

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
  EDUCATION: 'from-gov-blue to-gov-blue-dark',
  SANTE: 'from-rose-500 to-red-600',
  SPORT: 'from-green-500 to-emerald-600',
  SOCIAL: 'from-gov-blue to-gov-blue-dark',
  CULTUREL: 'from-gov-gold to-gov-gold-dark',
  AUTRE: 'from-gray-500 to-gray-700',
};

export default function CoordinateurEtablissementsPage() {
  const t = useTranslations('coordinator.establishments');
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const { data: responseData, isLoading: loading, mutate: refreshData } = useData('/api/etablissements');
  const rawEtabs = responseData?.data || responseData?.etablissements || [];
  const etablissements = Array.isArray(rawEtabs) ? rawEtabs : (Array.isArray(rawEtabs.data) ? rawEtabs.data : []);

  const fetchEtablissements = async () => {
    await refreshData();
  };

  const filteredEtablissements = Array.isArray(etablissements) ? etablissements.filter((e: any) =>
    e.nom?.toLowerCase().includes(search.toLowerCase()) ||
    e.code?.toLowerCase().includes(search.toLowerCase()) ||
    e.secteur?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gov-green to-gov-green-dark rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-1 font-medium">
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
            className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-green/20 focus:border-gov-green/30 outline-none transition-all font-medium"
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
          filteredEtablissements.map((etablissement: any) => (
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
                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg">
                      {SECTEURS_LABELS[etablissement.secteur] || etablissement.secteur}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3 text-sm text-gray-600 mb-6 font-medium">
                  {etablissement.commune && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gov-green" />
                      <span>{etablissement.commune.nom}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded text-gray-500 border border-gray-200">{etablissement.code}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 mb-1 font-bold">
                      <Calendar size={14} className="text-blue-600" />
                      {t('stats.events')}
                    </div>
                    <p className="font-black text-xl text-gray-900">
                      {etablissement._count?.evenements || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-gov-gold/5/70 rounded-xl border border-gov-gold/30">
                    <div className="flex items-center gap-1.5 text-xs text-gov-gold mb-1 font-bold">
                      <Star size={14} className="text-gov-gold" />
                      {t('stats.evaluations')}
                    </div>
                    <p className="font-black text-xl text-gray-900">
                      {etablissement._count?.evaluations || 0}
                    </p>
                  </div>
                </div>

                {/* Action */}
                <div className="space-y-2">
                  <Link
                    href={`/etablissements/${etablissement.id}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-gov-green to-gov-green-dark hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all font-bold shadow-md hover:shadow-lg"
                  >
                    <Eye size={18} />
                    <span>{t('view_details')}</span>
                    <ChevronLeft size={18} className="mr-auto opacity-70" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

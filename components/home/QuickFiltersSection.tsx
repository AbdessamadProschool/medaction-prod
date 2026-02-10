'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { 
  GraduationCap, 
  Hospital, 
  Trophy, 
  HeartHandshake, 
  Drama, 
  Users, 
  BarChart3,
  Search,
  MapPin,
  Building2,
  ArrowRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Secteur {
  id: string;
  labelKey: string;
  Icon: LucideIcon;
  gradient: string;
  count: number;
}

const secteursData: Secteur[] = [
  { id: 'EDUCATION', labelKey: 'education', Icon: GraduationCap, gradient: 'from-blue-500 to-indigo-600', count: 45 },
  { id: 'SANTE', labelKey: 'sante', Icon: Hospital, gradient: 'from-rose-500 to-pink-600', count: 23 },
  { id: 'SPORT', labelKey: 'sport', Icon: Trophy, gradient: 'from-amber-500 to-orange-600', count: 18 },
  { id: 'SOCIAL', labelKey: 'social', Icon: HeartHandshake, gradient: 'from-purple-500 to-violet-600', count: 31 },
  { id: 'CULTUREL', labelKey: 'culture', Icon: Drama, gradient: 'from-teal-500 to-cyan-600', count: 12 },
  { id: 'JEUNESSE', labelKey: 'jeunesse', Icon: Users, gradient: 'from-emerald-500 to-green-600', count: 15 },
];

interface Commune {
  id: number;
  nom: string;
  code?: string;
}

export default function QuickFiltersSection() {
  const t = useTranslations();
  const locale = useLocale();
  const [selectedSecteur, setSelectedSecteur] = useState<string | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [communes, setCommunes] = useState<Commune[]>([]);

  useEffect(() => {
    fetch('/api/communes')
      .then(res => res.json())
      .then(data => setCommunes(data.data || []))
      .catch(err => console.error('Erreur chargement communes:', err));
  }, []);

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(213,80%,35%)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[hsl(45,93%,47%)]/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 gov-pattern opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-white border border-[hsl(213,80%,35%)]/20 rounded-full shadow-sm mb-6"
          >
            <div className="w-2 h-2 bg-[hsl(45,93%,47%)] rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-[hsl(213,80%,35%)]">{t('search.quick')}</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4">
            {t('search.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('search.subtitle')}
          </p>
        </motion.div>

        {/* Secteurs Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[hsl(213,80%,35%)] to-[hsl(213,80%,50%)] rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{t('sectors.title')}</h3>
              <p className="text-sm text-gray-500">{t('sectors.filter')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {secteursData.map((secteur, index) => {
              const isSelected = selectedSecteur === secteur.id;
              const label = t(`sectors.${secteur.labelKey}`);
              return (
                <motion.button
                  key={secteur.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSecteur(isSelected ? null : secteur.id)}
                  aria-pressed={isSelected}
                  aria-label={t('sectors.filter_by', { sector: label })}
                  className={`
                    relative p-6 rounded-2xl border transition-all duration-300 
                    flex flex-col items-center justify-center text-center group
                    ${isSelected
                      ? 'border-gov-blue bg-gov-blue/5 shadow-xl ring-2 ring-gov-blue/20'
                      : 'border-gray-100 bg-white hover:border-gov-gold/30 hover:shadow-xl hover:shadow-gov-gold/5'
                    }
                  `}
                >
                  {/* Icon */}
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
                    ${secteur.gradient} /* Apply color variables always */
                    ${isSelected 
                      ? `bg-gradient-to-br shadow-lg scale-110` 
                      : `bg-gray-50 group-hover:bg-gradient-to-br group-hover:scale-110 group-hover:shadow-md`
                    }
                  `}>
                    <secteur.Icon 
                      className={`w-8 h-8 transition-colors duration-300 ${isSelected ? 'text-white' : 'text-gray-600 group-hover:text-white'}`} 
                      strokeWidth={1.5} 
                      aria-hidden="true"
                    />
                  </div>
                  
                  {/* Label */}
                  <h4 className={`font-bold text-gray-900 mb-1 transition-colors group-hover:text-gov-blue ${locale === 'ar' ? 'text-xl font-cairo' : 'text-base'}`}>
                    {label}
                  </h4>
                  <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-gov-blue' : 'text-gray-500 group-hover:text-gray-600'}`}>
                    {secteur.count} {t('sectors.etablissements')}
                  </span>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="secteurCheck"
                      className="absolute -top-3 -right-3 w-8 h-8 bg-gov-gold rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                      aria-hidden="true"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
        >
          <div className="grid md:grid-cols-3 gap-6">
            {/* Commune Select */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                <Building2 className="w-4 h-4 text-[hsl(213,80%,35%)]" />
                {t('common.commune')}
              </label>
              <div className="relative">
                <select
                  value={selectedCommune || ''}
                  onChange={(e) => setSelectedCommune(Number(e.target.value) || null)}
                  className="
                    w-full px-4 py-4 
                    bg-gray-50 border-2 border-gray-100 rounded-2xl
                    text-gray-900 appearance-none
                    focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[hsl(213,80%,35%)]
                    transition-all duration-200 hover:border-gray-200
                  "
                >
                  <option value="">{t('search.all_communes')}</option>
                  {communes.map((commune) => (
                    <option key={commune.id} value={commune.id}>
                      {commune.nom}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                <Search className="w-4 h-4 text-[hsl(213,80%,35%)]" />
                {t('common.rechercher')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="
                    w-full pl-12 pr-4 py-4 
                    bg-gray-50 border-2 border-gray-100 rounded-2xl
                    text-gray-900 placeholder:text-gray-400
                    focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[hsl(213,80%,35%)]
                    transition-all duration-200 hover:border-gray-200
                  "
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-3">
              <Link
                href={`/etablissements?secteur=${selectedSecteur || ''}&communeId=${selectedCommune || ''}&search=${searchQuery}`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[hsl(213,80%,35%)] to-[hsl(213,80%,45%)] text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all"
              >
                <Search className="w-5 h-5" />
                {t('actions.search')}
              </Link>
              <Link
                href="/carte"
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:border-[hsl(213,80%,35%)]/30 hover:bg-gray-50 transition-all"
              >
                <MapPin className="w-5 h-5" />
                {t('nav.carte')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

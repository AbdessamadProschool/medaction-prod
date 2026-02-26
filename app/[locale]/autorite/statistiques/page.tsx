
'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  PieChart
} from 'lucide-react';

export default function AutoriteStatistiquesPage() {
  const t = useTranslations('authority_statistics');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('mois');

  useEffect(() => {
    fetch(`/api/autorite/stats?periode=${periode}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setStats(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [periode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      label: t('cards.total'),
      value: stats?.total || 0,
      icon: FileText,
      color: 'blue',
      trend: stats?.totalTrend || 0
    },
    {
      label: t('cards.pending'),
      value: stats?.enAttente || 0,
      icon: Clock,
      color: 'amber',
      trend: null
    },
    {
      label: t('cards.resolved'),
      value: stats?.resolues || 0,
      icon: CheckCircle,
      color: 'green',
      trend: stats?.resoluesTrend || 0
    },
    {
      label: t('cards.rejected'),
      value: stats?.rejetees || 0,
      icon: XCircle,
      color: 'red',
      trend: null
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100', border: 'border-amber-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100', border: 'border-green-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100', border: 'border-red-100' },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className={`space-y-8 ${isRtl ? 'font-cairo' : ''}`}>
      {/* Header with Gradient */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-blue-100 font-medium">{t('subtitle')}</p>
          </div>
          
          <div className="relative">
            <Calendar className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none ${isRtl ? 'right-3' : 'left-3'}`} />
            <select 
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className={`appearance-none bg-white/95 backdrop-blur border-0 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg w-full md:w-auto cursor-pointer ${
                  isRtl ? 'pr-10 pl-8' : 'pl-10 pr-8'
              }`}
            >
              <option value="semaine">{t('period_selector.week')}</option>
              <option value="mois">{t('period_selector.month')}</option>
              <option value="trimestre">{t('period_selector.quarter')}</option>
              <option value="annee">{t('period_selector.year')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          const colors = colorClasses[card.color];
          
          return (
            <motion.div 
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-gray-100/80 transition-all hover:shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className={`w-14 h-14 rounded-2xl ${colors.iconBg} flex items-center justify-center shadow-inner`}>
                  <Icon className={`w-7 h-7 ${colors.text}`} strokeWidth={1.5} />
                </div>
                {card.trend !== null && (
                  <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full ${
                    card.trend >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                  }`}>
                    {card.trend >= 0 ? (
                      <TrendingUp className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      <TrendingDown className="w-4 h-4" strokeWidth={2} />
                    )}
                    <span>{Math.abs(card.trend)}%</span>
                  </div>
                )}
              </div>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{card.value.toLocaleString()}</p>
              <p className="text-sm font-semibold text-gray-500 mt-2">{card.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Graphique placeholder */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 shadow-md"
        >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <BarChart3 className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              {t('charts.evolution_title')}
            </h2>
            <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                </div>
                <p className="text-gray-500 font-semibold text-lg">{t('charts.coming_soon')}</p>
            </div>
        </motion.div>

        {/* Répartition par catégorie */}
        {stats?.parCategorie && stats.parCategorie.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm"
            >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                {t('charts.category_title')}
            </h2>
            <div className="space-y-5">
                {stats.parCategorie.map((cat: any, index: number) => {
                    const percentage = (cat.count / stats.total) * 100;
                    return (
                        <div key={index} className="group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 truncate">{cat.categorie}</span>
                                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{cat.count}</span>
                            </div>
                            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: 0.4 + (index * 0.1) }}
                                    className="bg-gov-blue h-full rounded-full group-hover:bg-blue-600 transition-colors"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            </motion.div>
        )}
      </div>
    </div>
  );
}

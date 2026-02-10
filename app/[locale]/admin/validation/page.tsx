'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Newspaper,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Building2,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

interface PendingItem {
  id: number;
  titre: string;
  description?: string;
  type: 'evenement' | 'actualite' | 'article';
  secteur?: string;
  createdBy?: { nom: string; prenom: string };
  etablissement?: { nom: string };
  createdAt: string;
  statut: string;
}

// TABS definition moved inside component or mapped dynamically

// Carte de contenu en attente
function PendingCard({
  item,
  type,
  onApprove,
  onReject,
  onView,
}: {
  item: PendingItem;
  type: string;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
}) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const t = useTranslations('admin.validation_page');
  const locale = useLocale();

  const handleApprove = async () => {
    setLoading('approve');
    await onApprove();
    setLoading(null);
  };

  const handleReject = async () => {
    setLoading('reject');
    await onReject();
    setLoading(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          type === 'evenements' ? 'bg-emerald-100 text-emerald-600' :
          type === 'actualites' ? 'bg-blue-100 text-blue-600' :
          'bg-purple-100 text-purple-600'
        }`}>
          {type === 'evenements' ? <Calendar size={24} /> :
           type === 'actualites' ? <Newspaper size={24} /> :
           <FileText size={24} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {item.titre}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {item.description || t('card.no_description')}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {item.createdBy && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {item.createdBy.prenom} {item.createdBy.nom}
              </span>
            )}
            {item.etablissement && (
              <span className="flex items-center gap-1">
                <Building2 size={12} />
                {item.etablissement.nom}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(item.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}
            </span>
            {item.secteur && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                {item.secteur}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('actions.view')}
          >
            <Eye size={18} />
          </button>
          <button
            onClick={handleReject}
            disabled={loading !== null}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title={t('actions.reject')}
          >
            {loading === 'reject' ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
          </button>
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            title={t('actions.approve')}
          >
            {loading === 'approve' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ValidationPage() {
  const t = useTranslations('admin.validation_page');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState('evenements');
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({
    evenements: 0,
    actualites: 0,
    articles: 0,
  });

  const TABS = [
    { id: 'evenements', label: t('tabs.events'), icon: Calendar, color: 'emerald' },
    { id: 'actualites', label: t('tabs.news'), icon: Newspaper, color: 'blue' },
    { id: 'articles', label: t('tabs.articles'), icon: FileText, color: 'purple' },
  ];

  // Charger les contenus en attente
  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/validation?type=${activeTab}`);
      
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setCounts(data.counts || { evenements: 0, actualites: 0, articles: 0 });
      } else {
        console.error('Erreur API validation');
        setItems([]);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingItems();
  }, [activeTab]);

  const handleApprove = async (item: PendingItem) => {
    try {
      const res = await fetch('/api/admin/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          action: 'approve',
        }),
      });

      if (res.ok) {
        toast.success(t('messages.approved'));
        // Retirer de la liste localement
        setItems(prev => prev.filter(i => i.id !== item.id));
        setCounts(prev => ({
          ...prev,
          [activeTab]: Math.max(0, prev[activeTab] - 1),
        }));
      } else {
        const data = await res.json();
        toast.error(data.error || t('messages.error'));
      }
    } catch (error) {
      toast.error(t('messages.error'));
    }
  };

  const handleReject = async (item: PendingItem) => {
    const reason = prompt(t('messages.reject_reason'));
    if (reason === null) return; // Annulé
    
    try {
      const res = await fetch('/api/admin/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          action: 'reject',
          motifRejet: reason,
        }),
      });

      if (res.ok) {
        toast.success(t('messages.rejected'));
        setItems(prev => prev.filter(i => i.id !== item.id));
        setCounts(prev => ({
          ...prev,
          [activeTab]: Math.max(0, prev[activeTab] - 1),
        }));
      } else {
        const data = await res.json();
        toast.error(data.error || t('messages.error'));
      }
    } catch (error) {
      toast.error(t('messages.error'));
    }
  };

  const handleView = (item: PendingItem) => {
    // TODO: Ouvrir un modal de détails
    toast.info(`Affichage des détails: ${item.titre}`);
  };

  const totalPending = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('subtitle', { count: totalPending })}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <Filter size={18} />
          {t('filter')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-5 rounded-2xl border-2 transition-all text-left ${
              activeTab === tab.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                tab.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                tab.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                <tab.icon size={22} />
              </div>
              {counts[tab.id] > 0 && (
                <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                  {counts[tab.id]}
                </span>
              )}
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">{tab.label}</p>
            <p className="text-sm text-gray-500">
              {t('subtitle', { count: counts[tab.id] })}
            </p>
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {t('empty.title')}
            </h3>
            <p className="text-gray-500">
              {t('empty.description')}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <PendingCard
              key={item.id}
              item={item}
              type={activeTab}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              onView={() => handleView(item)}
            />
          ))
        )}
      </div>

      {/* Quick Stats */}
      {items.length > 0 && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">{t('messages.guide_title')}</h3>
              <p className="text-sm text-slate-300">
                {t('messages.guide_text')}
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              {t('messages.guide_link')}
              <ChevronRight size={16} className={locale === 'ar' ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

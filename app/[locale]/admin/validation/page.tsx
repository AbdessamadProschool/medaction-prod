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
  Megaphone,
  User,
  Building2,
  ChevronRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { SafeHTML } from '@/components/ui/SafeHTML';

interface PendingItem {
  id: number;
  titre: string;
  description?: string;
  contenu?: string;
  image?: string;
  categorie?: string;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
  objectif?: number;
  type: 'evenement' | 'actualite' | 'article' | 'campagne';
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
          type === 'campagnes' ? 'bg-orange-100 text-orange-600' :
          'bg-purple-100 text-purple-600'
        }`}>
          {type === 'evenements' ? <Calendar size={24} /> :
           type === 'actualites' ? <Newspaper size={24} /> :
           type === 'campagnes' ? <Megaphone size={24} /> :
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
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({
    evenements: 0,
    actualites: 0,
    articles: 0,
    campagnes: 0,
  });

  const TABS = [
    { id: 'evenements', label: t('tabs.events'), icon: Calendar, color: 'emerald' },
    { id: 'actualites', label: t('tabs.news'), icon: Newspaper, color: 'blue' },
    { id: 'articles', label: t('tabs.articles'), icon: FileText, color: 'purple' },
    { id: 'campagnes', label: t('tabs.campaigns'), icon: Megaphone, color: 'orange' },
  ];

  // Charger les contenus en attente
  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/validation?type=${activeTab}`);
      
      if (res.ok) {
        const json = await res.json();
        const responseData = json.success ? json.data : json;
        
        setItems(responseData.items || (Array.isArray(responseData) ? responseData : []));
        setCounts(responseData.counts || json.counts || { evenements: 0, actualites: 0, articles: 0, campagnes: 0 });
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
    const promise = new Promise(async (resolve, reject) => {
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
          setItems(prev => prev.filter(i => i.id !== item.id));
          setCounts(prev => ({
            ...prev,
            [activeTab]: Math.max(0, prev[activeTab] - 1),
          }));
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || t('messages.error')));
        }
      } catch (error) {
        reject(new Error(t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: t('messages.approving') || 'Approbation en cours...',
      success: t('messages.approved'),
      error: (err) => err.message,
    });
  };

  const handleReject = async (item: PendingItem) => {
    const reason = prompt(t('messages.reject_reason'));
    if (reason === null) return;
    
    const promise = new Promise(async (resolve, reject) => {
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
          setItems(prev => prev.filter(i => i.id !== item.id));
          setCounts(prev => ({
            ...prev,
            [activeTab]: Math.max(0, prev[activeTab] - 1),
          }));
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || t('messages.error')));
        }
      } catch (error) {
        reject(new Error(t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: t('messages.rejecting') || 'Rejet en cours...',
      success: t('messages.rejected'),
      error: (err) => err.message,
    });
  };

  const handleView = (item: PendingItem) => {
    setSelectedItem(item);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`gov-stat-card transition-all text-left relative cursor-pointer ${
              activeTab === tab.id
                ? 'ring-2 ring-[hsl(var(--gov-gold))] shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="gov-stat-icon">
                <tab.icon size={22} />
              </div>
              {counts[tab.id] > 0 && (
                <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                  {counts[tab.id]}
                </span>
              )}
            </div>
            <p className="gov-stat-value text-xl">{counts[tab.id]}</p>
            <p className="gov-stat-label">{tab.label}</p>
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

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rtl:text-right" dir="auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative animate-fade-in-up">
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold dark:text-white">{t('modal.details_title')}</h2>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 md:p-10 flex-1">
               {selectedItem.image && (
                 <div className="w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-8 bg-gray-100 shadow-inner">
                   <img src={selectedItem.image} alt="Couverture" className="w-full h-full object-cover" />
                 </div>
               )}

               <div className="flex flex-wrap gap-3 mb-4">
                 <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold uppercase tracking-wide">
                    {selectedItem.type}
                 </span>
                 {selectedItem.categorie && (
                   <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold">
                    {selectedItem.categorie}
                   </span>
                 )}
                 {selectedItem.secteur && (
                   <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-bold">
                    {selectedItem.secteur}
                   </span>
                 )}
               </div>

               <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                 {selectedItem.titre}
               </h1>

               {/* Infos supplémentaires événement / campagne */}
               {(selectedItem.type === 'evenement' || selectedItem.type === 'campagne') && (
                 <div className="grid sm:grid-cols-2 gap-4 mb-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm">
                    {selectedItem.dateDebut && (
                      <div>
                        <span className="block text-gray-400 font-bold uppercase mb-1">{t('modal.start_date')}</span>
                        <span className="text-gray-800 dark:text-gray-200 font-semibold">{new Date(selectedItem.dateDebut).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')} à {new Date(selectedItem.dateDebut).toLocaleTimeString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    {selectedItem.dateFin && (
                      <div>
                        <span className="block text-gray-400 font-bold uppercase mb-1">{t('modal.end_date')}</span>
                        <span className="text-gray-800 dark:text-gray-200 font-semibold">{new Date(selectedItem.dateFin).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')} à {new Date(selectedItem.dateFin).toLocaleTimeString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    {selectedItem.lieu && (
                      <div className="sm:col-span-2">
                        <span className="block text-gray-400 font-bold uppercase mb-1">{t('modal.location')}</span>
                        <span className="text-gray-800 dark:text-gray-200 font-semibold">{selectedItem.lieu}</span>
                      </div>
                    )}
                    {selectedItem.objectif && (
                      <div className="sm:col-span-2">
                        <span className="block text-gray-400 font-bold uppercase mb-1">{t('modal.objective')}</span>
                        <span className="text-gray-800 dark:text-gray-200 font-semibold">{selectedItem.objectif} {t('modal.participants')}</span>
                      </div>
                    )}
                 </div>
               )}

               {/* Description & Contenu Principal */}
               {selectedItem.description && (
                 <div className="mb-8 p-6 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border-l-4 border-orange-400">
                   <p className="text-lg text-gray-700 dark:text-gray-300 font-semibold leading-relaxed">
                     {selectedItem.description}
                   </p>
                 </div>
               )}

               {selectedItem.contenu && (
                 <SafeHTML 
                   className="prose prose-lg dark:prose-invert max-w-none prose-img:rounded-2xl ltr:[&_*]:text-left rtl:[&_*]:text-right text-gray-800 dark:text-gray-200"
                   html={selectedItem.contenu}
                 />
               )}
               
               {/* Footer User Infos */}
               <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-6 text-sm text-gray-500 font-medium">
                  {selectedItem.createdBy && (
                    <div className="flex items-center gap-2">
                      <User size={16} /> {t('modal.created_by')} {selectedItem.createdBy.prenom} {selectedItem.createdBy.nom}
                    </div>
                  )}
                  {selectedItem.etablissement && (
                    <div className="flex items-center gap-2">
                      <Building2 size={16} /> {selectedItem.etablissement.nom}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock size={16} /> {new Date(selectedItem.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}
                  </div>
               </div>
            </div>

            <div className="sticky bottom-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
               >
                 {t('modal.cancel')}
               </button>
               <button
                 onClick={() => { setSelectedItem(null); handleReject(selectedItem); }}
                 className="px-8 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 hover:-translate-y-0.5 transition-all flex items-center gap-2"
               >
                 <XCircle size={20} /> {t('actions.reject')}
               </button>
               <button
                 onClick={() => { setSelectedItem(null); handleApprove(selectedItem); }}
                 className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
               >
                 <CheckCircle size={20} /> {t('actions.approve')}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

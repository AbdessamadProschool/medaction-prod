'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export default function SuggestionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations();
  
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reponseAdmin, setReponseAdmin] = useState('');

  // Configuration with translations
  const STATUT_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
    SOUMISE: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: t('suggestions.status.SOUMISE') },
    EN_EXAMEN: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye, label: t('suggestions.status.EN_EXAMEN') },
    APPROUVEE: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: t('suggestions.status.APPROUVEE') },
    REJETEE: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: t('suggestions.status.REJETEE') },
    IMPLEMENTEE: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Sparkles, label: t('suggestions.status.IMPLEMENTEE') },
  };

  const CATEGORIES: Record<string, { label: string; emoji: string }> = {
    infrastructure: { label: t('suggestions.categories.infrastructure'), emoji: '🏗️' },
    services: { label: t('suggestions.categories.services'), emoji: '🏛️' },
    environnement: { label: t('suggestions.categories.environnement'), emoji: '🌿' },
    education: { label: t('suggestions.categories.education'), emoji: '📚' },
    sante: { label: t('suggestions.categories.sante'), emoji: '🏥' },
    transport: { label: t('suggestions.categories.transport'), emoji: '🚌' },
    culture: { label: t('suggestions.categories.culture'), emoji: '🎭' },
    numerique: { label: t('suggestions.categories.numerique'), emoji: '💻' },
    autre: { label: t('suggestions.categories.autre'), emoji: '💡' },
  };

  // Fetch Logic
  const fetchSuggestion = async () => {
    try {
      const res = await fetch(`/api/suggestions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestion(data.data);
        setReponseAdmin(data.data.reponseAdmin || '');
      } else {
        toast.error(t('suggestions.messages.not_found'));
        router.push('/admin/suggestions');
      }
    } catch (error) {
      console.error(error);
      toast.error(t('suggestions.messages.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestion();
  }, [id]);

  const handleChangeStatut = async (newStatut: string) => {
    if (!suggestion) return;
    setActionLoading(newStatut);
    
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: newStatut,
          reponseAdmin: reponseAdmin || undefined,
        }),
      });

      if (res.ok) {
        toast.success(t('suggestions.messages.status_updated'));
        fetchSuggestion();
      } else {
        const err = await res.json();
        toast.error(err.error || t('toasts.error'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('toasts.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!suggestion) return;
    if (!confirm(t('suggestions.messages.delete_confirm'))) return;

    setActionLoading('DELETE');
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}`, { method: 'DELETE' });
      
      if (res.ok) {
        toast.success(t('suggestions.messages.deleted'));
        router.push('/admin/suggestions');
      } else {
        const err = await res.json();
        toast.error(err.error || t('toasts.error'));
      }
    } catch (error) {
       toast.error(t('toasts.error'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!suggestion) return null;

  const info = STATUT_CONFIG[suggestion.statut] || STATUT_CONFIG.SOUMISE;
  const Icon = info.icon;
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* HeaderNav */}
      <button 
        onClick={() => router.push('/admin/suggestions')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('actions.back')}
      </button>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner Status */}
        <div className={`px-6 py-4 flex items-center justify-between border-b border-gray-100 ${info.bg}`}>
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/50 backdrop-blur-sm ${info.text}`}>
               <Icon className="w-5 h-5" />
             </div>
             <div>
               <p className={`text-sm font-medium ${info.text} opacity-80`}>{t('admin_management.columns.status')}</p>
               <h1 className={`text-lg font-bold ${info.text}`}>{info.label}</h1>
             </div>
          </div>
          <span className="text-sm font-mono text-gray-500 bg-white/50 px-3 py-1 rounded-full">
            #{suggestion.id}
          </span>
        </div>

        <div className="p-8 space-y-8">
           {/* Section Titre & Desc */}
           <div>
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{suggestion.titre}</h2>
                {suggestion.categorie && CATEGORIES[suggestion.categorie] && (
                   <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                      <span>{CATEGORIES[suggestion.categorie].emoji}</span>
                      {CATEGORIES[suggestion.categorie].label}
                   </span>
                )}
              </div>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed mt-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                {suggestion.description}
              </p>
           </div>

           {/* Section Meta User */}
           <div className="flex flex-col md:flex-row gap-6">
             <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">
                  {suggestion.user.prenom[0]}{suggestion.user.nom[0]}
                </div>
                <div>
                   <p className="text-sm text-gray-500">{t('audit_page.columns.user')}</p>
                   <p className="font-semibold text-gray-900">{suggestion.user.prenom} {suggestion.user.nom}</p>
                   {suggestion.user.email && <p className="text-xs text-gray-400">{suggestion.user.email}</p>}
                </div>
             </div>
             
             <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                   <Calendar className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-sm text-gray-500">{t('audit_page.columns.date')}</p>
                   <p className="font-semibold text-gray-900">
                     {new Date(suggestion.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                   </p>
                   <p className="text-xs text-gray-400">
                     {new Date(suggestion.createdAt).toLocaleTimeString('fr-FR', { timeStyle: 'short' })}
                   </p>
                </div>
             </div>
           </div>
           
           {/* Section Admin Response */}
           <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
             <div className="flex items-center gap-2 mb-4">
               <MessageSquare className="w-5 h-5 text-gray-700" />
               <h3 className="font-semibold text-gray-900">Réponse de l'administration</h3>
             </div>
             <textarea
               value={reponseAdmin}
               onChange={(e) => setReponseAdmin(e.target.value)}
               placeholder="Ajouter une réponse officielle..."
               className="w-full min-h-[100px] p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
             />
           </div>

           {/* Actions Toolbar */}
           <div className="border-t border-gray-100 pt-6">
             <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{t('admin_management.columns.actions')}</h3>
             <div className="flex flex-wrap gap-3">
               {Object.entries(STATUT_CONFIG).map(([key, config]) => {
                  if (key === suggestion.statut) return null; // Don't show current status
                  const BtnIcon = config.icon;
                  const isLoading = actionLoading === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => handleChangeStatut(key)}
                      disabled={!!actionLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${config.bg} ${config.text} border-transparent hover:border-current disabled:opacity-50`}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BtnIcon className="w-4 h-4" />}
                      {config.label}
                    </button>
                  );
               })}
             </div>
             
             {/* Delete Button for Admin/SuperAdmin - checking requirement */}
             {isSuperAdmin && (
               <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleDelete}
                    disabled={!!actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-100"
                  >
                    {actionLoading === 'DELETE' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    {t('actions.delete')}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-right w-full block">Action irréversible réservée aux Super Admins</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

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
  ArrowRight,
  Calendar,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';
import { motion } from 'framer-motion';
import { GovButton } from '@/components/ui/GovButton';

export default function SuggestionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  
  const { data: responseData, isLoading: loading, mutate: fetchSuggestion } = useData(`/api/suggestions/${id}`);
  const suggestion = responseData?.data || responseData;
  const actionMutation = useMutation();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reponseAdmin, setReponseAdmin] = useState(suggestion?.reponseAdmin || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (suggestion?.reponseAdmin) {
      setReponseAdmin(suggestion.reponseAdmin);
    }
  }, [suggestion?.reponseAdmin]);

  // Configuration with translations
  const STATUT_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
    SOUMISE: { icon: Clock, label: t('suggestions.status.SOUMISE') },
    EN_EXAMEN: { icon: Eye, label: t('suggestions.status.EN_EXAMEN') },
    APPROUVEE: { icon: CheckCircle, label: t('suggestions.status.APPROUVEE') },
    REJETEE: { icon: XCircle, label: t('suggestions.status.REJETEE') },
    IMPLEMENTEE: { icon: Sparkles, label: t('suggestions.status.IMPLEMENTEE') },
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

  // Fetch Logic is replaced by useData

  const handleChangeStatut = async (newStatut: string) => {
    if (!suggestion) return;
    setActionLoading(newStatut);
    
    // Optimistic UI update
    fetchSuggestion(
      { ...responseData, data: { ...suggestion, statut: newStatut } },
      { revalidate: false }
    );

    const promise = new Promise(async (resolve, reject) => {
      try {
        await actionMutation.mutate(`/api/suggestions/${suggestion.id}/statut`, {
          method: 'PATCH',
          data: { statut: newStatut, reponseAdmin: reponseAdmin || undefined },
        });
        await fetchSuggestion();
        resolve(true);
      } catch (error: any) {
        await fetchSuggestion(); // Rollback
        reject(new Error(error.message || t('toasts.error')));
      } finally {
        setActionLoading(null);
      }
    });

    toast.promise(promise, {
      loading: 'Mise à jour du statut...',
      success: t('suggestions.messages.status_updated'),
      error: (err) => err.message,
    });
  };

  const handleDelete = async () => {
    if (!suggestion) return;

    setActionLoading('DELETE');
    try {
      await actionMutation.mutate(`/api/suggestions/${suggestion.id}`, { method: 'DELETE' });
      toast.success(t('suggestions.messages.deleted'));
      router.push('/admin/suggestions');
    } catch (error: any) {
       toast.error(error.message || t('toasts.error'));
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!suggestion) return null;

  const info = STATUT_CONFIG[suggestion.statut] || STATUT_CONFIG.SOUMISE;
  const Icon = info.icon;
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-5xl mx-auto px-4 py-8 space-y-8"
    >
      <GovButton 
        variant="ghost"
        onClick={() => router.push('/admin/suggestions')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors -ms-4"
      >
        {locale === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        {t('actions.back')}
      </GovButton>

      <div className="bg-card rounded-[2.5rem] shadow-sm border border-border overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between border-b border-border bg-muted/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full flex items-center justify-center bg-background border border-border shadow-sm text-foreground">
               <Icon className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted-foreground">{t('admin_management.columns.status')}</p>
               <h1 className="text-xl font-bold text-foreground">{info.label}</h1>
             </div>
          </div>
          <span className="text-sm font-mono text-muted-foreground bg-background px-4 py-1.5 rounded-full border border-border shadow-sm">
            #{suggestion.id}
          </span>
        </div>

        <div className="p-8 space-y-10">
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
           >
              <div className="flex items-start justify-between">
                <h2 className="text-3xl font-bold text-foreground mb-4">{suggestion.titre}</h2>
                {suggestion.categorie && CATEGORIES[suggestion.categorie] && (
                   <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full text-sm font-medium text-foreground border border-border">
                      <span>{CATEGORIES[suggestion.categorie].emoji}</span>
                      {CATEGORIES[suggestion.categorie].label}
                   </span>
                )}
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed mt-4 bg-muted/20 p-8 rounded-[2rem] border border-border backdrop-blur-sm text-lg">
                {suggestion.description}
              </p>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="flex flex-col md:flex-row gap-6"
           >
             <div className="flex-1 bg-card border border-border rounded-[2rem] p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl border border-primary/20">
                  {suggestion.user.prenom[0]}{suggestion.user.nom[0]}
                </div>
                <div>
                   <p className="text-sm text-muted-foreground mb-1">{t('audit_page.columns.user')}</p>
                   <p className="font-semibold text-foreground text-lg">{suggestion.user.prenom} {suggestion.user.nom}</p>
                   {suggestion.user.email && <p className="text-sm text-muted-foreground">{suggestion.user.email}</p>}
                </div>
             </div>
             
             <div className="flex-1 bg-card border border-border rounded-[2rem] p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center text-foreground border border-border">
                   <Calendar className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-sm text-muted-foreground mb-1">{t('audit_page.columns.date')}</p>
                   <p className="font-semibold text-foreground text-lg">
                     {new Date(suggestion.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { dateStyle: 'long' })}
                   </p>
                   <p className="text-sm text-muted-foreground">
                     {new Date(suggestion.createdAt).toLocaleTimeString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { timeStyle: 'short' })}
                   </p>
                </div>
             </div>
           </motion.div>
           
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="bg-muted/20 rounded-[2rem] p-8 border border-border backdrop-blur-sm"
           >
             <div className="flex items-center gap-3 mb-6">
               <MessageSquare className="w-6 h-6 text-foreground" />
               <h3 className="font-bold text-foreground text-xl">{t('suggestions.admin_response_title')}</h3>
             </div>
             <textarea
               value={reponseAdmin}
               onChange={(e) => setReponseAdmin(e.target.value)}
               placeholder={t('suggestions.admin_response_placeholder')}
               className="w-full min-h-[120px] p-5 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none resize-y transition-all text-base"
             />
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="border-t border-border pt-8"
           >
             <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">{t('admin_management.columns.actions')}</h3>
             <div className="flex flex-wrap gap-4">
               {Object.entries(STATUT_CONFIG).map(([key, config]) => {
                  if (key === suggestion.statut) return null;
                  const BtnIcon = config.icon;
                  const isLoading = actionLoading === key;
                  
                  return (
                    <GovButton
                      key={key}
                      variant="outline"
                      onClick={() => handleChangeStatut(key)}
                      disabled={!!actionLoading}
                      className="rounded-xl px-6 py-5 border-border hover:bg-muted"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin me-2" /> : <BtnIcon className="w-5 h-5 me-2" />}
                      {config.label}
                    </GovButton>
                  );
               })}
             </div>
             
             {/* Delete Button for Admin/SuperAdmin */}
             {isSuperAdmin && (
               <div className="mt-10 pt-8 border-t border-border flex flex-col items-end">
                  {!showDeleteConfirm ? (
                    <GovButton
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={!!actionLoading}
                      variant="danger"
                      className="rounded-xl px-6"
                    >
                      <XCircle className="w-5 h-5 me-2" />
                      {t('actions.delete')}
                    </GovButton>
                  ) : (
                    <div className="flex flex-col items-end gap-3 bg-destructive/10 p-5 rounded-2xl border border-destructive/20 w-full md:w-auto backdrop-blur-sm">
                      <p className="text-sm font-bold text-destructive">{t('suggestions.messages.delete_confirm')}</p>
                      <div className="flex items-center gap-3 w-full justify-end">
                        <GovButton
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={!!actionLoading}
                          variant="outline"
                          size="sm"
                          className="border-border hover:bg-muted"
                        >
                          {t('actions.cancel')}
                        </GovButton>
                        <GovButton
                          onClick={handleDelete}
                          disabled={!!actionLoading}
                          variant="danger"
                          size="sm"
                        >
                          {actionLoading === 'DELETE' ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <XCircle className="w-4 h-4 me-2" />}
                          {t('actions.confirm')}
                        </GovButton>
                      </div>
                    </div>
                  )}
                  {!showDeleteConfirm && (
                    <p className="text-sm text-muted-foreground mt-3 text-end block">{t('suggestions.super_admin_delete_warning')}</p>
                  )}
               </div>
             )}
           </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

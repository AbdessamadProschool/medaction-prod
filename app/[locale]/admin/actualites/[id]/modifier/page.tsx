'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calendar,
  Building2,
  Tag,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  Newspaper,
  Send,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { GovInput, GovSelect, GovTextarea, GovButton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Actualite {
  id: number;
  titre: string;
  description?: string;
  contenu: string;
  categorie?: string;
  tags: string[];
  statut: string;
  isPublie: boolean;
  isValide: boolean;
  datePublication?: string;
  etablissement?: { id: number; nom: string };
  createdByUser?: { nom: string; prenom: string };
  createdAt: string;
  medias?: { urlPublique: string }[];
}

const CATEGORIES = [
  { value: 'TRAVAUX', label: 'Travaux' },
  { value: 'ANNONCE', label: 'Annonce' },
  { value: 'PARTENARIAT', label: 'Partenariat' },
  { value: 'SUCCESS_STORY', label: 'Success Story' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function ModifierActualitePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const tNewsPage = useTranslations('admin.news_page');
  const t = useTranslations('admin.news');
  
  const [actualite, setActualite] = useState<Actualite | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    contenu: '',
    categorie: '',
    tags: '',
    isPublie: false,
    isValide: false,
  });

  useEffect(() => {
    if (id) {
      fetchActualite();
    }
  }, [id]);

  const fetchActualite = async () => {
    try {
      const res = await fetch(`/api/actualites/${id}`);
      if (!res.ok) throw new Error('Actualité non trouvée');
      
      const data = await res.json();
      const item = data.data || data;
      setActualite(item);
      
      setFormData({
        titre: item.titre || '',
        description: item.description || '',
        contenu: item.contenu || '',
        categorie: item.categorie || '',
        tags: (item.tags || []).join(', '),
        isPublie: item.isPublie || false,
        isValide: item.isValide || false,
      });
    } catch (error) {
      console.error('Erreur chargement actualité:', error);
      toast.error(t('actions.update_error'));
      router.push('/admin/actualites');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        const tagsArray = formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
        
        const res = await fetch(`/api/actualites/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            tags: tagsArray,
            statut: formData.isPublie ? 'PUBLIEE' : (formData.isValide ? 'VALIDEE' : 'EN_ATTENTE_VALIDATION'),
            datePublication: formData.isPublie ? new Date().toISOString() : null,
          }),
        });
        
        const result = await res.json();
        
        if (!res.ok) {
          if (result.error?.details) {
            reject(new Error(result.error.details.map((d: any) => d.message).join(', ')));
          } else {
            reject(new Error(result.error?.message || t('actions.update_error')));
          }
          return;
        }
        
        resolve(true);
        router.push('/admin/actualites');
      } catch (error) {
        console.error('Erreur sauvegarde:', error);
        reject(new Error(t('actions.update_error')));
      } finally {
        setSaving(false);
      }
    });

    toast.promise(submitPromise, {
      loading: 'Sauvegarde en cours...',
      success: t('actions.update_success'),
      error: (err: any) => err.message,
    });
  };

  const handleDelete = async () => {
    if (!confirm(tNewsPage('messages.delete_confirm') || 'Êtes-vous sûr ?')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/actualites/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error?.message || t('actions.delete_error'));
        return;
      }
      
      toast.success(t('actions.delete_success'));
      router.push('/admin/actualites');
    } catch (error) {
      toast.error(t('actions.delete_error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleValidate = async (validate: boolean) => {
    try {
      const res = await fetch(`/api/actualites/${id}/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isValide: validate }),
      });
      
      if (res.ok) {
        toast.success(validate ? t('actions.validate_success') : t('actions.reject_success'));
        fetchActualite();
      }
    } catch (error) {
      toast.error(t('actions.update_error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Chargement...</p>
      </div>
    );
  }

  if (!actualite) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-10">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
             <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{tNewsPage('messages.not_found')}</h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">L'actualité demandée est introuvable ou a été supprimée.</p>
          </div>
          <Link href="/admin/actualites">
            <GovButton variant="outline" className="rounded-full px-8">
              {t('back_list')}
            </GovButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header Premium */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-4">
          <Link 
            href="/admin/actualites"
            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-foreground/20 group-hover:bg-muted/50 transition-all">
              <ArrowLeft size={14} />
            </div>
            <span>{t('back_list')}</span>
          </Link>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[hsl(var(--gov-blue))/0.3] ring-8 ring-[hsl(var(--gov-blue))/0.1]">
              <Newspaper className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">
                {t('edit_title')}
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70 mt-1">
                ID: {id} • MODIFICATION EN COURS
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!actualite.isValide && (
            <>
              <GovButton
                onClick={() => handleValidate(true)}
                variant="primary"
                leftIcon={<CheckCircle size={18} />}
                className="rounded-full px-6 shadow-lg shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-700 border-none"
              >
                {t('actions.validate')}
              </GovButton>
              <GovButton
                onClick={() => handleValidate(false)}
                variant="danger"
                leftIcon={<XCircle size={18} />}
                className="rounded-full px-6"
              >
                {t('actions.reject')}
              </GovButton>
            </>
          )}
           <GovButton
            onClick={handleSubmit}
            loading={saving}
            variant="primary"
            leftIcon={!saving && <Save size={18} />}
            className="rounded-full px-10 shadow-xl shadow-[hsl(var(--gov-blue))/0.2]"
          >
            {t('actions.save')}
          </GovButton>
        </div>
      </motion.div>

      {/* Info Contextuelle Glassmorphic */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[hsl(var(--gov-blue))/0.03] backdrop-blur-xl border border-[hsl(var(--gov-blue))/0.1] rounded-[2rem] p-8 shadow-inner"
      >
        <div className="flex flex-wrap gap-8 items-center text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="w-4 h-4 text-[hsl(var(--gov-blue))]" />
            <span>Créé le {new Date(actualite.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
          {actualite.etablissement && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Building2 className="w-4 h-4 text-[hsl(var(--gov-blue))]" />
              <span>{actualite.etablissement.nom}</span>
            </div>
          )}
          {actualite.createdByUser && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <FileText className="w-4 h-4 text-[hsl(var(--gov-blue))]" />
              <span>Par {actualite.createdByUser.prenom} {actualite.createdByUser.nom}</span>
            </div>
          )}
          <div className={cn(
            "px-4 py-1.5 rounded-full ring-1 ring-inset shadow-sm",
            actualite.isPublie ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" :
            actualite.isValide ? "bg-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))] ring-[hsl(var(--gov-blue))/0.2]" :
            "bg-amber-500/10 text-amber-600 ring-amber-500/20"
          )}>
            {actualite.isPublie ? t('form.is_publie') : actualite.isValide ? t('form.is_valide') : tNewsPage('statuses.EN_ATTENTE_VALIDATION')}
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-[hsl(var(--gov-blue))/0.03]"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-[hsl(var(--gov-blue))] rounded-full" />
                {t('sections.content')}
              </h2>
            </div>
            
            <div className="p-10 space-y-10">
              <GovInput
                label={t('form.title')}
                placeholder="Titre de l'actualité"
                leftIcon={<Sparkles size={18} />}
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                required
                className="text-xl font-bold"
              />

              <GovTextarea
                label={t('form.description')}
                placeholder="Résumé court..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <GovTextarea
                label={t('form.content')}
                placeholder="Corps de l'actualité..."
                rows={15}
                required
                value={formData.contenu}
                onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                className="leading-relaxed"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-10">
          {/* Classification Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                  <Tag className="w-5 h-5 text-[hsl(var(--gov-blue))]" />
                  {t('sections.category')}
                </h3>
                <GovSelect
                  label=""
                  options={[
                    { label: t('form.select_category'), value: "" },
                    ...CATEGORIES.map(cat => ({ label: cat.label, value: cat.value }))
                  ]}
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-500" />
                  {t('form.tags')}
                </h3>
                <GovInput
                  label=""
                  placeholder={t('form.tags_placeholder')}
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>
          </motion.div>

          {/* Visibility Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <Eye className="w-5 h-5 text-emerald-500" />
              Visibilité & Validation
            </h3>
            
            <div className="space-y-4">
               <label className={cn(
                "relative flex items-center gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
                formData.isValide 
                  ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10 shadow-lg" 
                  : "border-border bg-muted/10"
              )}>
                <input
                  type="checkbox"
                  checked={formData.isValide}
                  onChange={(e) => setFormData({ ...formData, isValide: e.target.checked })}
                  className="w-6 h-6 rounded-lg border-border text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                />
                <div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest block transition-colors",
                    formData.isValide ? "text-emerald-700" : "text-foreground"
                  )}>{t('form.is_valide')}</span>
                </div>
              </label>

              <label className={cn(
                "relative flex items-center gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
                formData.isPublie 
                  ? "border-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue))/0.05] shadow-[hsl(var(--gov-blue))/0.1] shadow-lg" 
                  : "border-border bg-muted/10"
              )}>
                <input
                  type="checkbox"
                  checked={formData.isPublie}
                  onChange={(e) => setFormData({ ...formData, isPublie: e.target.checked })}
                  className="w-6 h-6 rounded-lg border-border text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))/0.2] cursor-pointer"
                />
                <div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest block transition-colors",
                    formData.isPublie ? "text-[hsl(var(--gov-blue))]" : "text-foreground"
                  )}>{t('form.is_publie')}</span>
                </div>
              </label>
            </div>

            <div className="mt-10 pt-10 border-t border-border/50">
               <GovButton
                onClick={handleDelete}
                disabled={deleting}
                variant="danger"
                leftIcon={!deleting && <Trash2 size={18} />}
                className="w-full rounded-full"
                loading={deleting}
              >
                {t('actions.delete')}
              </GovButton>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}


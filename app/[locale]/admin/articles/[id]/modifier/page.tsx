'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calendar, 
  Tag, 
  FileText, 
  Eye, 
  Star, 
  Trash2, 
  AlertTriangle,
  ImageIcon,
  PenTool,
  Sparkles,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { GovInput, GovSelect, GovTextarea, GovButton } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Article {
  id: number;
  titre: string;
  description?: string;
  contenu: string;
  categorie?: string;
  tags: string[];
  isPublie: boolean;
  isMisEnAvant: boolean;
  datePublication?: string;
  imagePrincipale?: string;
  createdByUser?: { nom: string; prenom: string };
  createdAt: string;
}

export default function ModifierArticlePage() {
  const t = useTranslations('admin.articles_page');
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const id = params?.id as string;
  
  const [article, setArticle] = useState<Article | null>(null);
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
    isMisEnAvant: false,
  });

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) throw new Error('Article non trouvé');
      
      const data = await res.json();
      const item = data.data || data;
      setArticle(item);
      
      setFormData({
        titre: item.titre || '',
        description: item.description || '',
        contenu: item.contenu || '',
        categorie: item.categorie || '',
        tags: (item.tags || []).join(', '),
        isPublie: item.isPublie || false,
        isMisEnAvant: item.isMisEnAvant || false,
      });
    } catch (error) {
      console.error('Erreur chargement article:', error);
      toast.error(t('messages.load_error') || 'Erreur lors du chargement');
      router.push('/admin/articles');
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
        
        const res = await fetch(`/api/articles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            tags: tagsArray,
            datePublication: formData.isPublie ? new Date().toISOString() : null,
          }),
        });
        
        const result = await res.json();
        
        if (!res.ok) {
          reject(new Error(result.error?.message || t('messages.save_error') || 'Erreur lors de la sauvegarde'));
          return;
        }
        
        resolve(true);
        router.push('/admin/articles');
        router.refresh();
      } catch (error) {
        console.error('Erreur sauvegarde:', error);
        reject(new Error(t('messages.save_error') || 'Erreur lors de la sauvegarde'));
      } finally {
        setSaving(false);
      }
    });

    toast.promise(submitPromise, {
      loading: 'Sauvegarde en cours...',
      success: t('messages.success') || 'Article mis à jour avec succès',
      error: (err: any) => err.message,
    });
  };

  const handleDelete = async () => {
    if (!confirm(t('messages.confirm_delete') || 'Êtes-vous sûr ?')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error?.message || t('messages.delete_error') || 'Erreur lors de la suppression');
        return;
      }
      
      toast.success(t('messages.deleted') || 'Article supprimé');
      router.push('/admin/articles');
      router.refresh();
    } catch (error) {
      toast.error(t('messages.delete_error') || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
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

  if (!article) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-10">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
             <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{t('empty.title') || 'Article introuvable'}</h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">L'article demandé est introuvable ou a été supprimé.</p>
          </div>
          <Link href="/admin/articles">
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
            href="/admin/articles"
            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-foreground/20 group-hover:bg-muted/50 transition-all">
              <ArrowLeft size={14} className={locale === 'ar' ? 'rotate-180' : ''} />
            </div>
            <span>{t('back_list')}</span>
          </Link>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-8 ring-indigo-500/10">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">
                {t('modal.title') || "Modifier l'article"}
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70 mt-1">
                ID: {id} • MODIFICATION EN COURS
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <GovButton
            onClick={handleSubmit}
            loading={saving}
            variant="primary"
            leftIcon={!saving && <Save size={18} />}
            className="rounded-full px-10 shadow-xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 border-none"
          >
            {t('actions.save')}
          </GovButton>
        </div>
      </motion.div>

      {/* Info Contextuelle Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-indigo-500/03 backdrop-blur-xl border border-indigo-500/10 rounded-[2rem] p-8 shadow-inner"
      >
        <div className="flex flex-wrap gap-8 items-center text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-3 text-muted-foreground">
            <UserIcon className="w-4 h-4 text-indigo-500" />
            <span>{t('table.author')}: {article.createdByUser?.prenom} {article.createdByUser?.nom}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Créé le {new Date(article.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className={cn(
            "px-4 py-1.5 rounded-full ring-1 ring-inset shadow-sm",
            article.isPublie ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" : "bg-amber-500/10 text-amber-600 ring-amber-500/20"
          )}>
            {article.isPublie ? t('status.published') : t('status.draft')}
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-10">
          {/* Cover Image Preview (if exists) */}
          {article.imagePrincipale && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[21/9] bg-muted/20 rounded-[2.5rem] overflow-hidden border border-border group"
            >
              <img src={article.imagePrincipale} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                 <p className="text-white text-[10px] font-black uppercase tracking-widest">Image de couverture actuelle</p>
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-indigo-500/03"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-indigo-500 rounded-full" />
                {t('sections.content')}
              </h2>
            </div>
            
            <div className="p-10 space-y-10">
              <GovInput
                label={t('form.title')}
                placeholder="Titre de l'article"
                leftIcon={<Sparkles size={18} />}
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                required
                className="text-xl font-bold"
              />

              <GovTextarea
                label={t('form.summary')}
                placeholder="Résumé court pour la liste..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <GovTextarea
                label={t('form.content')}
                placeholder="Corps de l'article..."
                rows={20}
                required
                value={formData.contenu}
                onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                className="leading-relaxed font-serif text-lg"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Column: Taxonomy & Settings */}
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
                  <Tag className="w-5 h-5 text-amber-500" />
                  {t('sections.category')}
                </h3>
                <GovSelect
                  label=""
                  options={[
                    { label: t('form.select_category'), value: "" },
                    { label: "Guide", value: "GUIDE" },
                    { label: "Ressource", value: "RESSOURCE" },
                    { label: "Conseil", value: "CONSEIL" },
                    { label: "Information", value: "INFO" },
                    { label: "Actualité", value: "ACTUALITE" }
                  ]}
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                  <ChevronRight className="w-5 h-5 text-indigo-500" />
                  {t('form.tags')}
                </h3>
                <GovInput
                  label=""
                  placeholder="Tag1, Tag2..."
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>
          </motion.div>

          {/* Publication Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <Eye className="w-5 h-5 text-emerald-500" />
              {t('sections.publication')}
            </h3>
            
            <div className="space-y-4">
               <label className={cn(
                "relative flex items-center gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
                formData.isPublie 
                  ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10 shadow-lg" 
                  : "border-border bg-muted/10"
              )}>
                <input
                  type="checkbox"
                  checked={formData.isPublie}
                  onChange={(e) => setFormData({ ...formData, isPublie: e.target.checked })}
                  className="w-6 h-6 rounded-lg border-border text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                />
                <div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest block transition-colors",
                    formData.isPublie ? "text-emerald-700" : "text-foreground"
                  )}>{t('form.publish_now')}</span>
                </div>
              </label>

              <label className={cn(
                "relative flex items-center gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
                formData.isMisEnAvant 
                  ? "border-amber-500 bg-amber-500/5 shadow-amber-500/10 shadow-lg" 
                  : "border-border bg-muted/10"
              )}>
                <input
                  type="checkbox"
                  checked={formData.isMisEnAvant}
                  onChange={(e) => setFormData({ ...formData, isMisEnAvant: e.target.checked })}
                  className="w-6 h-6 rounded-lg border-border text-amber-600 focus:ring-amber-500/20 cursor-pointer"
                />
                <div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest block transition-colors",
                    formData.isMisEnAvant ? "text-amber-700" : "text-foreground"
                  )}>{t('modal.toggle_featured')}</span>
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
                {t('modal.delete')}
              </GovButton>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/navigation';
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
  PenTool
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="text-gray-500 mt-4">{t('loading') || 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">{t('empty.title') || 'Article introuvable'}</h2>
          <Link href="/admin/articles" className="text-indigo-600 hover:underline mt-4 inline-block">
            {t('back_list') || 'Retour à la liste'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/articles"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={18} className={locale === 'ar' ? 'rotate-180' : ''} />
          <span>{t('back_list')}</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('modal.title') || "Modifier l'article"}
            </h1>
            <p className="text-gray-500">
              ID: {id} • {t('table.author')}: {article.createdByUser?.prenom} {article.createdByUser?.nom}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
            article.isPublie ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {article.isPublie ? t('status.published') : t('status.draft')}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-transparent">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              {t('sections.content')}
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('form.title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                className="gov-input text-xl font-medium"
                required
                minLength={5}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('form.summary')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="gov-textarea"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('form.content')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.contenu}
                onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                className="gov-textarea leading-relaxed"
                required
                minLength={50}
              />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              {t('sections.category')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">{t('form.category')}</label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="gov-select bg-white"
                >
                  <option value="">{t('form.select_category')}</option>
                  <option value="GUIDE">Guide</option>
                  <option value="RESSOURCE">Ressource</option>
                  <option value="CONSEIL">Conseil</option>
                  <option value="INFO">Information</option>
                  <option value="ACTUALITE">Actualité</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {t('form.tags')}
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="gov-input"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-500" />
              {t('sections.publication')}
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPublie}
                  onChange={(e) => setFormData({ ...formData, isPublie: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))] mt-0.5"
                />
                <div>
                  <span className="font-medium text-gray-800 block">{t('form.publish_now')}</span>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-amber-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isMisEnAvant}
                  onChange={(e) => setFormData({ ...formData, isMisEnAvant: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))] mt-0.5"
                />
                <div>
                  <span className="font-medium text-gray-800 block">{t('modal.toggle_featured')}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="gov-btn text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            <span>{t('modal.delete')}</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/articles')}
              className="gov-btn gov-btn-secondary"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="gov-btn gov-btn-primary px-8 py-3"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t('actions.saving')}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {t('actions.save')}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

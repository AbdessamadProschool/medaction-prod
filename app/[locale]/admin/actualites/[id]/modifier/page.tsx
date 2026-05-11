'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Upload,
  Calendar,
  Building2,
  Tag,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

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
  const tCommon = useTranslations('common');
  
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
      setActualite(data.data || data);
      
      setFormData({
        titre: data.data?.titre || data.titre || '',
        description: data.data?.description || data.description || '',
        contenu: data.data?.contenu || data.contenu || '',
        categorie: data.data?.categorie || data.categorie || '',
        tags: (data.data?.tags || data.tags || []).join(', '),
        isPublie: data.data?.isPublie || data.isPublie || false,
        isValide: data.data?.isValide || data.isValide || false,
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
        // Afficher les erreurs détaillées
        if (result.error?.details) {
          result.error.details.forEach((d: any) => toast.error(d.message));
        } else {
          toast.error(result.error?.message || t('actions.update_error'));
        }
        return;
      }
      
      toast.success(t('actions.update_success'));
      router.push('/admin/actualites');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error(t('actions.update_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(tNewsPage('messages.delete_confirm') || 'Êtes-vous sûr de vouloir supprimer cette actualité ?')) return;
    
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-gray-500 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!actualite) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">{tNewsPage('messages.not_found') || 'Actualité non trouvée'}</h2>
          <Link href="/admin/actualites" className="text-emerald-600 hover:underline mt-4 inline-block">
            {t('back_list')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/actualites"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('edit_title')}</h1>
            <p className="text-gray-500">ID: {id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Boutons de validation rapide */}
          {!actualite.isValide && (
            <>
              <button
                onClick={() => handleValidate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4" />
                {t('actions.validate')}
              </button>
              <button
                onClick={() => handleValidate(false)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" />
                {t('actions.reject')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Infos Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{t('info_card.created_at')} {new Date(actualite.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
          {actualite.etablissement && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{actualite.etablissement.nom}</span>
            </div>
          )}
          {actualite.createdByUser && (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{t('info_card.by')} {actualite.createdByUser.prenom} {actualite.createdByUser.nom}</span>
            </div>
          )}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            actualite.isPublie ? 'bg-emerald-100 text-emerald-700' :
            actualite.isValide ? 'bg-blue-100 text-blue-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {actualite.isPublie ? t('form.is_publie') : actualite.isValide ? t('form.is_valide') : tNewsPage('statuses.EN_ATTENTE_VALIDATION')}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.title')} *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
              minLength={5}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.content')} *
            </label>
            <textarea
              value={formData.contenu}
              onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={8}
              required
              minLength={50}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.category')}
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">{t('form.select_category') || '-- Sélectionner --'}</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.tags')}
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t('form.tags_placeholder')}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6 pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isValide}
                onChange={(e) => setFormData({ ...formData, isValide: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">{t('form.is_valide')}</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublie}
                onChange={(e) => setFormData({ ...formData, isPublie: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">{t('form.is_publie')}</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t('actions.delete')}
          </button>
          
          <div className="flex items-center gap-3">
            <Link
              href="/admin/actualites"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('actions.cancel')}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('actions.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

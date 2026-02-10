'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { 
  FileText, 
  Image as ImageIcon, 
  Save, 
  X, 
  Tag,
  PenTool,
  Loader2,
  Eye,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const articleSchema = z.object({
  titre: z.string().min(5, 'Le titre doit faire au moins 5 caractères').max(150),
  description: z.string().optional(),
  contenu: z.string().min(50, 'Le contenu doit faire au moins 50 caractères'),
  categorie: z.string().optional(),
  tags: z.string().optional(),
  isPublie: z.boolean().optional(),
});

type ArticleForm = z.infer<typeof articleSchema>;

export default function NouvelArticlePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      isPublie: false
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ArticleForm) => {
    setLoading(true);
    try {
      let imageUrl = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'articles');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Erreur upload image");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tags: tagsArray,
          imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        router.push('/admin/articles');
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Erreur serveur'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/articles"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Retour aux articles</span>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Nouvel Article
              </h1>
              <p className="text-gray-500">
                Rédigez un article pour la plateforme MedAction.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Image de couverture - En premier pour l'impact visuel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                Image de couverture
              </h2>
            </div>
            
            <div className="p-6">
              {previewUrl ? (
                <div className="relative w-full h-72 bg-gray-100 rounded-xl overflow-hidden group">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <span className="text-white text-sm font-medium">Image sélectionnée</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setPreviewUrl(null);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50/50 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-700 font-medium mb-1">Cliquez pour ajouter une image</p>
                  <p className="text-gray-400 text-sm">PNG, JPG jusqu'à 5MB • Recommandé: 1200x630px</p>
                  <input 
                    type="file" 
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-blue-600" />
                Rédaction de l'article
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre de l'article <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('titre')}
                  type="text"
                  placeholder="Un titre accrocheur pour votre article..."
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xl font-medium placeholder:text-gray-300"
                />
                {errors.titre && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.titre.message}
                  </p>
                )}
              </div>

              {/* Description courte */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chapeau / Résumé
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder="Un bref résumé qui donne envie de lire..."
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-600 placeholder:text-gray-300"
                />
              </div>

              {/* Contenu */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contenu complet <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('contenu')}
                  rows={15}
                  placeholder="Rédigez votre article ici. Soyez clair, précis et engageant..."
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all leading-relaxed placeholder:text-gray-300"
                />
                {errors.contenu && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.contenu.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                Catégorisation
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Catégorie</label>
                  <select
                    {...register('categorie')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="ACTUALITE">Actualité</option>
                    <option value="DOSSIER">Dossier</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="REPORTAGE">Reportage</option>
                    <option value="TRIBUNE">Tribune</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Tags <span className="text-gray-400 font-normal">(séparés par virgule)</span>
                  </label>
                  <input
                    {...register('tags')}
                    type="text"
                    placeholder="développement, innovation, mediouna"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                Publication
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    {...register('isPublie')}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 mt-0.5"
                  />
                  <div>
                    <span className="font-medium text-gray-800 block">Publier immédiatement</span>
                    <span className="text-sm text-gray-500">L'article sera visible sur la plateforme dès sa création.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <Link
              href="/admin/articles"
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Annuler
            </Link>
            
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Enregistrer l'article
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


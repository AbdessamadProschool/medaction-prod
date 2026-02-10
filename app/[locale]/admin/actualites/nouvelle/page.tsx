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
  Building2,
  Tag,
  PenTool,
  Loader2,
  ArrowLeft,
  Newspaper,
  Globe,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const actualiteSchema = z.object({
  titre: z.string().min(5, 'Le titre doit faire au moins 5 caractères').max(150),
  resume: z.string().optional(),
  contenu: z.string().min(20, 'Le contenu doit faire au moins 20 caractères'),
  secteur: z.string().min(1, 'Veuillez sélectionner un secteur'),
  categorie: z.string().optional(),
  statut: z.string(),
});

type ActualiteForm = z.infer<typeof actualiteSchema>;

const SECTEURS = [
  { value: 'EDUCATION', label: 'Éducation' },
  { value: 'SANTE', label: 'Santé' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'CULTUREL', label: 'Culturel' },
  { value: 'AUTRE', label: 'Autre' },
];

const STATUTS = [
  { value: 'BROUILLON', label: 'Brouillon', description: 'Visible uniquement par vous' },
  { value: 'EN_ATTENTE_VALIDATION', label: 'En attente', description: 'Soumis pour validation' },
  { value: 'PUBLIEE', label: 'Publier directement', description: 'Visible immédiatement' },
];

export default function AdminNouvelleActualitePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ActualiteForm>({
    resolver: zodResolver(actualiteSchema),
    defaultValues: {
      statut: 'BROUILLON',
    }
  });

  const selectedStatut = watch('statut');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ActualiteForm) => {
    setLoading(true);
    try {
      let imageUrl = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'actualites');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Erreur upload image");
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch('/api/actualites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          imageUrl: imageUrl,
        }),
      });

      if (res.ok) {
        toast.success('Actualité créée avec succès');
        router.push('/admin/actualites');
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur: ' + (error instanceof Error ? error.message : 'Erreur serveur'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/actualites"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Retour aux actualités</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              Nouvelle Actualité
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Créer une nouvelle actualité pour les citoyens.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Section Image */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              Image de couverture
            </h2>
          </div>
          
          <div className="p-5">
            {previewUrl ? (
              <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden group">
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
              <label className="block border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-12 text-center bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Cliquez pour ajouter une image</p>
                <p className="text-gray-400 text-sm">PNG, JPG jusqu'à 5MB</p>
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

        {/* Section Contenu */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 dark:from-blue-900/20 to-transparent">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-600" />
              Rédaction
            </h2>
          </div>
          
          <div className="p-5 space-y-5">
            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Titre de l'actualité <span className="text-red-500">*</span>
              </label>
              <input
                {...register('titre')}
                type="text"
                placeholder="Ex: Inauguration du nouveau centre sportif"
                className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-lg font-medium placeholder:text-gray-300 dark:placeholder:text-gray-500 dark:text-white"
              />
              {errors.titre && <p className="text-red-500 text-sm mt-2">{errors.titre.message}</p>}
            </div>

            {/* Résumé */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Résumé / Chapeau
              </label>
              <textarea
                {...register('resume')}
                rows={2}
                placeholder="Un résumé rapide pour l'aperçu..."
                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 dark:text-white"
              />
            </div>

            {/* Contenu */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Contenu complet <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('contenu')}
                rows={12}
                placeholder="Rédigez votre actualité ici..."
                className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 leading-relaxed dark:text-white"
              />
              {errors.contenu && <p className="text-red-500 text-sm mt-2">{errors.contenu.message}</p>}
            </div>
          </div>
        </div>

        {/* Section Contexte */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              Secteur
            </h3>
            
            <select
              {...register('secteur')}
              className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white"
            >
              <option value="">Sélectionner un secteur...</option>
              {SECTEURS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {errors.secteur && <p className="text-red-500 text-sm mt-2">{errors.secteur.message}</p>}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" />
              Catégorie
            </h3>
            
            <select
              {...register('categorie')}
              className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white"
            >
              <option value="">Général</option>
              <option value="TRAVAUX">🔧 Travaux & Aménagements</option>
              <option value="ANNONCE">📢 Annonce Officielle</option>
              <option value="PARTENARIAT">🤝 Partenariat</option>
              <option value="SUCCESS_STORY">🏆 Réussite</option>
              <option value="EVENEMENT">🎉 Événement</option>
            </select>
          </div>
        </div>

        {/* Section Statut */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-green-500" />
            Statut de publication
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUTS.map(statut => (
              <label 
                key={statut.value}
                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedStatut === statut.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  {...register('statut')}
                  value={statut.value}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900 dark:text-white">{statut.label}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{statut.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <Link
            href="/admin/actualites"
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Annuler
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all shadow-lg font-semibold flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save size={22} />
                Créer l'actualité
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

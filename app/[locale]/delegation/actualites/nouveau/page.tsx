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
  Newspaper
} from 'lucide-react';
import Link from 'next/link';

const actualiteSchema = z.object({
  titre: z.string().min(5, 'Le titre doit faire au moins 5 caractères').max(100),
  description: z.string().optional(),
  contenu: z.string().min(20, 'Le contenu doit faire au moins 20 caractères'),
  etablissementId: z.string().min(1, 'Veuillez sélectionner un établissement'),
  categorie: z.string().optional(),
});

type ActualiteForm = z.infer<typeof actualiteSchema>;

export default function NouvelleActualitePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [etablissements, setEtablissements] = useState<{id: number, nom: string}[]>([]);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ActualiteForm>({
    resolver: zodResolver(actualiteSchema)
  });

  useEffect(() => {
    const fetchEtablissements = async () => {
      try {
        let url = '/api/etablissements?limit=100';
        if (session?.user?.secteurResponsable) {
          url += `&secteur=${session.user.secteurResponsable}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        if(data.data) {
          setEtablissements(data.data);
        }
      } catch (error) {
        console.error("Erreur chargement établissements", error);
      }
    };

    if (session?.user) {
      fetchEtablissements();
    }
  }, [session]);

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

      const res = await fetch('/api/delegation/actualites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...data,
            etablissementId: parseInt(data.etablissementId),
            imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        router.push('/delegation/actualites');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/delegation/actualites"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Retour aux actualités</span>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Newspaper className="w-5 h-5 text-white" />
                </div>
                Nouvelle Actualité
              </h1>
              <p className="text-gray-500">
                Publiez une information ou une annonce pour les établissements.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section Image */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                Image de couverture
              </h2>
            </div>
            
            <div className="p-6">
              {previewUrl ? (
                <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden group">
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
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50/50 hover:bg-gray-50 hover:border-orange-300 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-orange-600" />
                  </div>
                  <p className="text-gray-700 font-medium mb-1">Cliquez pour ajouter une image</p>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50/50 to-transparent">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-orange-600" />
                Rédaction
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
                  placeholder="Ex: Rénovation de la façade terminée"
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-lg font-medium placeholder:text-gray-300"
                />
                {errors.titre && <p className="text-red-500 text-sm mt-2">{errors.titre.message}</p>}
              </div>

              {/* Description Courte */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chapeau / Description courte
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder="Un résumé rapide pour l'aperçu..."
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              {/* Contenu Riche */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contenu complet <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('contenu')}
                  rows={12}
                  placeholder="Rédigez votre article ici..."
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-300 leading-relaxed"
                />
                {errors.contenu && <p className="text-red-500 text-sm mt-2">{errors.contenu.message}</p>}
              </div>
            </div>
          </div>

          {/* Section Contexte */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                Établissement
              </h3>
              
              <select
                {...register('etablissementId')}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white"
              >
                <option value="">Sélectionner un établissement...</option>
                {etablissements.map(e => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
              {errors.etablissementId && <p className="text-red-500 text-sm mt-2">{errors.etablissementId.message}</p>}
              {etablissements.length === 0 && (
                <p className="text-orange-500 text-sm mt-2">Aucun établissement trouvé.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-500" />
                Catégorie
              </h3>
              
              <select
                {...register('categorie')}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white"
              >
                <option value="">Général</option>
                <option value="TRAVAUX">🔧 Travaux & Aménagements</option>
                <option value="ANNONCE">📢 Annonce Officielle</option>
                <option value="PARTENARIAT">🤝 Partenariat</option>
                <option value="SUCCESS_STORY">🏆 Réussite</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <Link
              href="/delegation/actualites"
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Annuler
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all shadow-lg font-semibold flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Save size={22} />
                  Publier l'actualité
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

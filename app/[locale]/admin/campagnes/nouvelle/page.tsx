'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Megaphone, 
  Image as ImageIcon, 
  Save, 
  X, 
  Calendar,
  Target,
  Palette,
  Loader2,
  ArrowLeft,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const campagneSchema = z.object({
  titre: z.string().min(5, 'Titre requis (min 5 caractères)').max(150),
  nom: z.string().min(2, 'Nom court requis'),
  description: z.string().optional(),
  contenu: z.string().min(20, 'Contenu détaillé requis'),
  type: z.string().min(1, 'Type requis'),
  objectifParticipations: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  couleurTheme: z.string().optional(),
  statut: z.string().default('BROUILLON'),
});

type CampagneForm = z.infer<typeof campagneSchema>;

const TYPES_CAMPAGNE = [
  { value: 'SOLIDARITE', label: 'Solidarité' },
  { value: 'ECOLOGIE', label: 'Écologie' },
  { value: 'CITOYENNETE', label: 'Citoyenneté' },
  { value: 'SANTE', label: 'Santé' },
  { value: 'EDUCATION', label: 'Éducation' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'CULTURE', label: 'Culture' },
  { value: 'AUTRE', label: 'Autre' },
];

const STATUTS = [
  { value: 'BROUILLON', label: 'Brouillon', description: 'Visible uniquement par les admins' },
  { value: 'ACTIVE', label: 'Active', description: 'Campagne en cours, visible publiquement' },
  { value: 'TERMINEE', label: 'Terminée', description: 'Campagne clôturée' },
];

export default function AdminNouvelleCampagnePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CampagneForm>({
    resolver: zodResolver(campagneSchema),
    defaultValues: {
      couleurTheme: '#1e40af',
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

  const onSubmit = async (data: CampagneForm) => {
    setLoading(true);
    try {
      let imageUrl = null;

      // Upload image
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'campagnes');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Erreur upload image");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch('/api/campagnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          objectifParticipations: data.objectifParticipations ? parseInt(data.objectifParticipations) : null,
          imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        toast.success('Campagne créée avec succès');
        router.push('/admin/campagnes');
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
          href="/admin/campagnes"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Retour aux campagnes</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              Nouvelle Campagne
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Lancez une initiative citoyenne ou une campagne de sensibilisation.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Infos Principales */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50/50 dark:from-emerald-900/20 to-transparent">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              Détails de la campagne
            </h2>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nom court (interne) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('nom')}
                  type="text"
                  placeholder="Ex: Hiver Solidaire 2025"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-white"
                />
                {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-white"
                >
                  <option value="">Sélectionner...</option>
                  {TYPES_CAMPAGNE.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Titre public <span className="text-red-500">*</span>
              </label>
              <input
                {...register('titre')}
                type="text"
                placeholder="Ex: Collecte de vêtements pour l'hiver"
                className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg font-medium dark:text-white"
              />
              {errors.titre && <p className="text-red-500 text-sm mt-1">{errors.titre.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description courte
              </label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Accroche de la campagne..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Contenu détaillé <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('contenu')}
                rows={8}
                placeholder="Explication complète de la campagne..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-white"
              />
              {errors.contenu && <p className="text-red-500 text-sm mt-1">{errors.contenu.message}</p>}
            </div>
          </div>
        </div>

        {/* Objectifs & Dates */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              Objectifs & Dates
            </h2>
          </div>
          
          <div className="p-5 grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Objectif participants
              </label>
              <input
                {...register('objectifParticipations')}
                type="number"
                placeholder="Ex: 1000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Couleur du thème
              </label>
              <div className="flex gap-3">
                <input
                  {...register('couleurTheme')}
                  type="color"
                  className="h-12 w-20 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer"
                />
                <input
                  {...register('couleurTheme')}
                  type="text"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none uppercase dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de début
              </label>
              <input
                {...register('dateDebut')}
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de fin
              </label>
              <input
                {...register('dateFin')}
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              Visuel de la campagne
            </h2>
          </div>
          
          <div className="p-5">
            {previewUrl ? (
              <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden group">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                    }}
                    className="p-3 bg-white rounded-full text-red-600 hover:bg-red-50"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-12 text-center bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-purple-300 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Bannière de la campagne</p>
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

        {/* Statut */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-green-500" />
            Statut de la campagne
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUTS.map(statut => (
              <label 
                key={statut.value}
                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedStatut === statut.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
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
            href="/admin/campagnes"
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Annuler
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all shadow-lg font-semibold flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save size={22} />
                Créer la campagne
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

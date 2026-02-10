'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { talentSchema, TalentInput } from '@/lib/validations/talent';
import { useRouter } from 'next/navigation';

interface TalentFormProps {
  talent?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const domaines = [
  'Musique',
  'Art Plastique',
  'Théâtre',
  'Cinéma',
  'Littérature',
  'Sport',
  'Artisanat',
  'Innovation',
  'Autre'
];

export default function TalentForm({ talent, onSuccess, onCancel }: TalentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TalentInput>({
    resolver: zodResolver(talentSchema),
    defaultValues: talent || {
      isPublie: false,
      isMisEnAvant: false,
      reseauxSociaux: {},
    },
  });

  const onSubmit = async (data: TalentInput) => {
    setLoading(true);
    setError('');

    try {
      const url = talent ? `/api/talents/${talent.id}` : '/api/talents';
      const method = talent ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Une erreur est survenue');
      }

      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gestion simplifiée des réseaux sociaux (juste Facebook et Instagram pour l'exemple)
  const reseauxSociaux = watch('reseauxSociaux') || {};

  const handleSocialChange = (network: string, value: string) => {
    setValue('reseauxSociaux', { ...reseauxSociaux, [network]: value });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            {...register('nom')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>}
        </div>

        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
          <input
            type="text"
            {...register('prenom')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>}
        </div>
      </div>

      {/* Nom Artistique */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom Artistique (Optionnel)</label>
        <input
          type="text"
          {...register('nomArtistique')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Domaine */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Domaine</label>
        <select
          {...register('domaine')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Sélectionner un domaine</option>
          {domaines.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {errors.domaine && <p className="mt-1 text-sm text-red-600">{errors.domaine.message}</p>}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Biographie</label>
        <textarea
          {...register('bio')}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Photo URL (Simplifié) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL Photo</label>
        <input
          type="text"
          {...register('photo')}
          placeholder="https://..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Réseaux Sociaux */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium text-gray-900">Réseaux Sociaux</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Facebook</label>
            <input
              type="text"
              value={reseauxSociaux.facebook || ''}
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="URL profil Facebook"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Instagram</label>
            <input
              type="text"
              value={reseauxSociaux.instagram || ''}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="URL profil Instagram"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Youtube</label>
            <input
              type="text"
              value={reseauxSociaux.youtube || ''}
              onChange={(e) => handleSocialChange('youtube', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="URL chaîne Youtube"
            />
          </div>
           <div>
            <label className="block text-sm text-gray-600 mb-1">LinkedIn</label>
            <input
              type="text"
              value={reseauxSociaux.linkedin || ''}
              onChange={(e) => handleSocialChange('linkedin', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="URL profil LinkedIn"
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex gap-6 border-t pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('isPublie')}
            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-gray-700">Publier immédiatement</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('isMisEnAvant')}
            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-gray-700">Mettre en avant</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : talent ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </form>
  );
}

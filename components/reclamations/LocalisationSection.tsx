'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ReclamationFormData } from '@/lib/validations/reclamation';
import { MapPin, Navigation, Building2, Home, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Import dynamique de la carte (SSR disabled)
const LocationMap = dynamic(() => import('@/components/maps/LocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <MapPin className="w-8 h-8 text-gray-400" />
        <span className="text-sm text-gray-400">Chargement de la carte...</span>
      </div>
    </div>
  ),
});

interface Commune {
  id: number;
  nom: string;
}

interface LocalisationSectionProps {
  register: UseFormRegister<ReclamationFormData>;
  setValue: UseFormSetValue<ReclamationFormData>;
  errors: FieldErrors<ReclamationFormData>;
  watch: (name: keyof ReclamationFormData) => any;
}

export default function LocalisationSection({ 
  register, 
  setValue, 
  errors,
  watch 
}: LocalisationSectionProps) {
  const t = useTranslations();
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Charger les communes
  useEffect(() => {
    fetch('/api/communes')
      .then(res => res.json())
      .then(data => {
        setCommunes(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Callback pour mise à jour position
  const handlePositionChange = useCallback((lat: number, lng: number) => {
    setPosition({ lat, lng });
    setValue('latitude', lat);
    setValue('longitude', lng);
  }, [setValue]);

  // Obtenir la position GPS
  const getGPSPosition = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation nécessite une connexion sécurisée (HTTPS) ou localhost.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handlePositionChange(latitude, longitude);
        setGpsLoading(false);
      },
      (err) => {
        console.error('Erreur GPS:', err);
        alert('Impossible d\'obtenir votre position. Vérifiez que vous avez autorisé la localisation et que vous utilisez une connexion sécurisée (HTTPS).');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-8">
      {/* Commune */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          {t('reclamation.form.commune')} <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Building2 className={`w-5 h-5 transition-colors ${errors.communeId ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[hsl(213,80%,35%)]'}`} />
          </div>
          <select
            {...register('communeId', { valueAsNumber: true })}
            className={`
              w-full pl-12 pr-12 py-4 
              bg-white border-2 rounded-2xl appearance-none
              text-gray-900
              focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[hsl(213,80%,35%)]
              transition-all duration-200
              ${errors.communeId 
                ? 'border-red-300 bg-red-50 focus:ring-red-100 focus:border-red-500' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            disabled={loading}
          >
            <option value="">{t('reclamation.form.select_commune')}</option>
            {communes.map((commune) => (
              <option key={commune.id} value={commune.id}>
                {commune.nom}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {errors.communeId && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.communeId.message}
          </p>
        )}
      </div>

      {/* Quartier/Douar + Adresse en grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            {t('reclamation.form.district')}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Home className="w-5 h-5 text-gray-400 group-focus-within:text-[hsl(213,80%,35%)] transition-colors" />
            </div>
            <input
              type="text"
              {...register('quartierDouar')}
              placeholder={t('reclamation.form.district_placeholder')}
              maxLength={100}
              className="
                w-full pl-12 pr-4 py-4 
                bg-white border-2 rounded-2xl
                text-gray-900 placeholder:text-gray-400
                focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[hsl(213,80%,35%)]
                transition-all duration-200
                border-gray-200 hover:border-gray-300
              "
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            {t('reclamation.form.address')}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="w-5 h-5 text-gray-400 group-focus-within:text-[hsl(213,80%,35%)] transition-colors" />
            </div>
            <input
              type="text"
              {...register('adresseComplete')}
              placeholder={t('reclamation.form.address_placeholder')}
              maxLength={200}
              className="
                w-full pl-12 pr-4 py-4 
                bg-white border-2 rounded-2xl
                text-gray-900 placeholder:text-gray-400
                focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[hsl(213,80%,35%)]
                transition-all duration-200
                border-gray-200 hover:border-gray-300
              "
            />
          </div>
        </div>
      </div>

      {/* Carte Interactive */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
        {/* Header carte */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(213,80%,35%)]/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[hsl(213,80%,35%)]" strokeWidth={1.5} />
            </div>
            <div>
              <span className="font-semibold text-gray-800">{t('reclamation.form.location_precise')}</span>
              <p className="text-xs text-gray-500">{t('reclamation.form.location_help')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={getGPSPosition}
            disabled={gpsLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[hsl(213,80%,35%)] text-white text-sm font-medium rounded-xl hover:bg-[hsl(213,80%,30%)] transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {gpsLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t('reclamation.form.locating')}</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" strokeWidth={2} />
                <span>{t('reclamation.form.my_position')}</span>
              </>
            )}
          </button>
        </div>

        {/* Map Container */}
        <div className="p-4 bg-gray-50">
          <LocationMap 
            position={position}
            onPositionChange={handlePositionChange}
          />
        </div>

        {/* Coordonnées affichées */}
        {position && (
          <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">{t('reclamation.form.position_success')}</p>
                <p className="text-xs text-emerald-600 font-mono">
                  Lat: {position.lat.toFixed(6)} | Lng: {position.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

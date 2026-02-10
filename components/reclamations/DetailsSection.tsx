'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ReclamationFormData } from '@/lib/validations/reclamation';
import { 
  FileEdit, 
  Lightbulb,
  Construction,
  Trash2,
  Lightbulb as LightbulbIcon,
  Droplets,
  Shield,
  GraduationCap,
  Hospital,
  Trophy,
  HeartHandshake,
  ClipboardList
} from 'lucide-react';
import { useTranslations } from 'next-intl';

// Catégories avec icônes Lucide flat
// Catégories avec icônes Lucide flat
const categoriesWithIcons = [
  { id: 'infrastructure', Icon: Construction, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', activeBg: 'bg-orange-100' },
  { id: 'proprete', Icon: Trash2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', activeBg: 'bg-green-100' },
  { id: 'eclairage', Icon: LightbulbIcon, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', activeBg: 'bg-yellow-100' },
  { id: 'eau', Icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', activeBg: 'bg-blue-100' },
  { id: 'securite', Icon: Shield, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', activeBg: 'bg-red-100' },
  { id: 'education', Icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', activeBg: 'bg-indigo-100' },
  { id: 'sante', Icon: Hospital, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', activeBg: 'bg-pink-100' },
  { id: 'sport', Icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', activeBg: 'bg-amber-100' },
  { id: 'social', Icon: HeartHandshake, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', activeBg: 'bg-purple-100' },
  { id: 'autre', Icon: ClipboardList, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', activeBg: 'bg-gray-100' },
];

interface DetailsSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<ReclamationFormData>;
  watch: (name: keyof ReclamationFormData) => any;
}

export default function DetailsSection({ 
  register, 
  errors,
  watch 
}: DetailsSectionProps) {
  const t = useTranslations();
  const titre = watch('titre') || '';
  const description = watch('description') || '';
  const selectedCategorie = watch('categorie');

  return (
    <div className="space-y-8">
      {/* Catégorie */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-4">
          {t('reclamation.form.category')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {categoriesWithIcons.map((cat) => {
            const isSelected = selectedCategorie === cat.id;
            return (
              <label
                key={cat.id}
                className={`
                  group relative flex flex-col items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? `${cat.activeBg} border-2 border-[hsl(213,80%,35%)] shadow-lg shadow-blue-100` 
                    : `bg-white border-2 ${cat.border} hover:border-gray-300 hover:shadow-md`
                  }
                `}
              >
                <input
                  type="radio"
                  {...register('categorie')}
                  value={cat.id}
                  className="sr-only"
                />
                {/* Icon Container */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-all
                  ${isSelected 
                    ? 'bg-[hsl(213,80%,35%)] text-white' 
                    : `${cat.bg} ${cat.color} group-hover:scale-110`
                  }
                `}>
                  <cat.Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                {/* Label */}
                <span className={`
                  text-xs font-medium text-center leading-tight
                  ${isSelected ? 'text-[hsl(213,80%,35%)]' : 'text-gray-600'}
                `}>
                  {t(`sectors.${cat.id}`)}
                </span>
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[hsl(213,80%,35%)] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </label>
            );
          })}
        </div>
        {errors.categorie && (
          <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.categorie.message}
          </p>
        )}
      </div>

      {/* Titre */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          {t('reclamation.form.title')} <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FileEdit className={`w-5 h-5 transition-colors ${errors.titre ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[hsl(213,80%,35%)]'}`} />
          </div>
          <input
            type="text"
            {...register('titre')}
            placeholder={t('reclamation.form.title_placeholder')}
            className={`
              w-full pl-12 pr-16 py-4 
              bg-white border-2 rounded-2xl
              text-gray-900 placeholder:text-gray-400
              focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[hsl(213,80%,35%)]
              transition-all duration-200
              ${errors.titre 
                ? 'border-red-300 bg-red-50 focus:ring-red-100 focus:border-red-500' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            maxLength={100}
          />
          <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded-lg ${
            titre.length > 90 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {titre.length}/100
          </span>
        </div>
        {errors.titre && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.titre.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
           {t('reclamation.form.description')} <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <textarea
            {...register('description')}
            placeholder={t('reclamation.form.description_placeholder')}
            rows={6}
            className={`
              w-full px-4 py-4 
              bg-white border-2 rounded-2xl
              text-gray-900 placeholder:text-gray-400
              focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[hsl(213,80%,35%)]
              transition-all duration-200 resize-none
              ${errors.description 
                ? 'border-red-300 bg-red-50 focus:ring-red-100 focus:border-red-500' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            maxLength={2000}
          />
          <span className={`absolute right-4 bottom-4 text-xs font-medium px-2 py-1 rounded-lg ${
            description.length > 1800 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {description.length}/2000
          </span>
        </div>
        {errors.description && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.description.message}
          </p>
        )}
        
        {/* Tip */}
        <div className="mt-4 flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">{t('reclamation.form.tip_title')}</p>
            <p className="text-xs text-blue-600 mt-0.5">
              {t('reclamation.form.tip_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

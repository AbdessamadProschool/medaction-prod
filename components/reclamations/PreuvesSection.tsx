'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface PreuvesSectionProps {
  photos: File[];
  setPhotos: (photos: File[]) => void;
}

const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 5;

export default function PreuvesSection({ photos, setPhotos }: PreuvesSectionProps) {
  const t = useTranslations();
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compression d'image (réduction qualité)
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const maxHeight = 1200;
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Gestion des fichiers
  const handleFiles = useCallback(async (files: FileList) => {
    setError(null);
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        setError(t('reclamation.form.error_type'));
        continue;
      }

      // Vérifier la taille
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(t('reclamation.form.error_size', { size: MAX_SIZE_MB }));
        continue;
      }

      // Vérifier le nombre max
      if (photos.length + validFiles.length >= MAX_PHOTOS) {
        setError(t('reclamation.form.error_max', { max: MAX_PHOTOS }));
        break;
      }

      // Compresser l'image
      const compressed = await compressImage(file);
      validFiles.push(compressed);
    }

    setPhotos([...photos, ...validFiles]);
  }, [photos, setPhotos, compressImage]);

  // Drag & Drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Supprimer une photo
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-xl">📷</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('reclamation.form.photos_title')}</h2>
          <p className="text-sm text-gray-500">{t('reclamation.form.photos_subtitle')}</p>
        </div>
      </div>

      {/* Zone d'upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-700 font-medium">
              {t('reclamation.form.drag_drop')}
            </p>
            <p className="text-sm text-gray-500">
              {t('reclamation.form.click_select')}
            </p>
          </div>
          <p className="text-xs text-gray-400">
            {t('reclamation.form.photos_limits', { max: MAX_PHOTOS, size: MAX_SIZE_MB })}
          </p>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Prévisualisation des photos */}
      <AnimatePresence>
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                  {(photo.size / 1024).toFixed(0)} KB
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Compteur */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {photos.length} / {MAX_PHOTOS} photos
        </span>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${(photos.length / MAX_PHOTOS) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

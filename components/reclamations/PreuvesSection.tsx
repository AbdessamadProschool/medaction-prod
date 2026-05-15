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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100/50">
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
          <Camera className="w-6 h-6 text-purple-600" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t('reclamation.form.photos_title')}</h2>
          <p className="text-sm text-gray-500">{t('reclamation.form.photos_subtitle')}</p>
        </div>
      </div>

      {/* Zone d'upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
          ${dragOver 
            ? 'border-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue)/0.05)] scale-[0.99] shadow-inner' 
            : 'border-gray-200 hover:border-[hsl(var(--gov-blue)/0.5)] hover:bg-gray-50/50'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-[hsl(var(--gov-blue)/0.4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-900 font-bold text-lg">
              {t('reclamation.form.drag_drop')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t('reclamation.form.click_select')}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {t('reclamation.form.photos_limits', { max: MAX_PHOTOS, size: MAX_SIZE_MB })}
          </div>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600"
        >
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {/* Prévisualisation des photos */}
      <AnimatePresence>
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm border border-gray-100"
              >
                <img
                  src={URL.createObjectURL(photo)}
                  alt={t('reclamation.form.photo_alt', { number: index + 1 })}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 text-red-600 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white shadow-lg backdrop-blur-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-2 left-2 text-[10px] font-black uppercase tracking-widest bg-black/50 text-white px-2 py-1 rounded-md backdrop-blur-md">
                  {(photo.size / 1024).toFixed(0)} KB
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Compteur et Barre de progression */}
      <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{photos.length}</span>
            <span className="text-sm text-gray-500 uppercase tracking-widest font-medium">/ {MAX_PHOTOS} Photos</span>
          </div>
          <span className="text-xs font-bold text-[hsl(var(--gov-blue))]">
            {Math.round((photos.length / MAX_PHOTOS) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-light))]"
            initial={{ width: 0 }}
            animate={{ width: `${(photos.length / MAX_PHOTOS) * 100}%` }}
            transition={{ duration: 0.5, type: 'spring', damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
}

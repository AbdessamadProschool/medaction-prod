'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ImageIcon, Loader2, CheckCircle, XCircle, Archive } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DownloadPhotosButtonProps {
  reclamationId: number;
  photoCount?: number;
  className?: string;
  variant?: 'button' | 'icon' | 'card';
}

export default function DownloadPhotosButton({
  reclamationId,
  photoCount = 0,
  className = '',
  variant = 'button'
}: DownloadPhotosButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const t = useTranslations('download_photos');

  const downloadPhotos = useCallback(async () => {
    if (downloading || photoCount === 0) return;

    setDownloading(true);
    setStatus('downloading');
    setProgress(0);
    setErrorMessage('');

    try {
      // Faire la requête de téléchargement
      const response = await fetch(`/api/reclamations/${reclamationId}/photos`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('error'));
      }

      // Récupérer les informations de taille
      const contentLength = response.headers.get('Content-Length');
      const totalSize = contentLength ? parseInt(contentLength) : 0;

      // Lire le stream avec progression
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream non disponible');
      }

      const chunks: Uint8Array[] = [];
      let receivedSize = 0;

      // Simuler une progression si pas de Content-Length
      let simulatedProgress = 0;
      const simulationInterval = totalSize === 0 ? setInterval(() => {
        simulatedProgress = Math.min(simulatedProgress + 5, 95);
        setProgress(simulatedProgress);
      }, 100) : null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedSize += value.length;
        
        if (totalSize > 0) {
          const progressPercent = Math.round((receivedSize / totalSize) * 100);
          setProgress(progressPercent);
        }
      }

      if (simulationInterval) {
        clearInterval(simulationInterval);
      }

      setProgress(100);

      // Créer le blob en concaténant les chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combinedArray = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      }
      const blob = new Blob([combinedArray], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      
      // Créer un élément <a> pour déclencher le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `reclamation_${reclamationId}_photos_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Libérer l'URL
      URL.revokeObjectURL(url);

      setStatus('success');
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, 3000);

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : t('error'));
      
      // Réinitialiser après 5 secondes
      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
        setErrorMessage('');
      }, 5000);
    } finally {
      setDownloading(false);
    }
  }, [reclamationId, photoCount, downloading, t]);

  if (photoCount === 0) {
    return null;
  }

  // Variant Icon (compact)
  if (variant === 'icon') {
    return (
      <button
        onClick={downloadPhotos}
        disabled={downloading}
        className={`relative p-2 rounded-lg transition-all ${
          downloading 
            ? 'bg-blue-100 cursor-wait' 
            : 'bg-gray-100 hover:bg-blue-50 hover:text-blue-600'
        } ${className}`}
        title={t('download_tooltip', { count: photoCount })}
      >
        {downloading ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        ) : status === 'success' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : status === 'error' ? (
          <XCircle className="w-5 h-5 text-red-600" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>
    );
  }

  // Variant Card (pour export gouverneur)
  if (variant === 'card') {
    return (
      <motion.div
        className={`bg-white rounded-2xl border border-gray-200 p-5 shadow-sm ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Archive className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('export_title')}</h3>
            <p className="text-sm text-gray-500">{t('photos_available', { count: photoCount })}</p>
          </div>
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {(downloading || status === 'success') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">
                  {status === 'success' ? t('completed') : t('downloading')}
                </span>
                <span className="font-medium text-blue-600">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    status === 'success' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {status === 'error' && errorMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-700">{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={downloadPhotos}
          disabled={downloading}
          className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-semibold transition-all ${
            downloading
              ? 'bg-blue-100 text-blue-700 cursor-wait'
              : status === 'success'
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-200 hover:shadow-xl'
          }`}
        >
          {downloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('compressing')}</span>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>{t('completed')}</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>{t('zip_label')}</span>
            </>
          )}
        </button>
      </motion.div>
    );
  }

  // Variant Button (default)
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={downloadPhotos}
        disabled={downloading}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
          downloading
            ? 'bg-blue-100 text-blue-700 cursor-wait'
            : status === 'success'
            ? 'bg-green-500 text-white hover:bg-green-600'
            : status === 'error'
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
        }`}
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('downloading')} {progress}%</span>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>{t('completed')}</span>
          </>
        ) : status === 'error' ? (
          <>
            <XCircle className="w-4 h-4" />
            <span>{t('error')}</span>
          </>
        ) : (
          <>
            <ImageIcon className="w-4 h-4" />
            <span>{t('button_label', { count: photoCount })}</span>
            <Download className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Progress bar sous le bouton */}
      <AnimatePresence>
        {downloading && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden"
            style={{ transformOrigin: 'left' }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

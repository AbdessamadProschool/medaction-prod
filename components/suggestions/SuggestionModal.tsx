'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Send, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORY_IDS = [
  'environnement',
  'services',
  'infrastructure',
  'transport',
  'sante',
  'education',
  'autre',
  'numerique',
  'culture',
];

export default function SuggestionModal({ isOpen, onClose, onSuccess }: SuggestionModalProps) {
  const t = useTranslations('suggestions');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Category emojis (flat style icons represented as emojis)
  const categoryEmojis: Record<string, string> = {
    infrastructure: '🏗️',
    services: '🏛️',
    environnement: '🌿',
    education: '📚',
    sante: '🏥',
    transport: '🚌',
    culture: '🎭',
    numerique: '💻',
    autre: '💡',
  };

  // Ensure component is mounted for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitre('');
      setDescription('');
      setCategorie('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!titre.trim()) {
      setError(t('error_title_required'));
      return;
    }

    if (!description.trim()) {
      setError(t('error_desc_required'));
      return;
    }

    if (description.length < 20) {
      setError(t('error_desc_min'));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre, description, categorie }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('error_title_required'));
      }

      setSuccess(true);
      toast.success(t('success_title'));
      onSuccess?.();

      // Fermer après 2 secondes
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('error_title_required');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 99999 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 100000 }}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[hsl(213,80%,28%)] via-[hsl(213,80%,32%)] to-[hsl(213,80%,40%)] px-6 py-5 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{t('modal_title')}</h2>
                      <p className="text-white/70 text-sm">{t('modal_subtitle')}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {t('success_title')}
                    </h3>
                    <p className="text-gray-500">
                      {t('success_message')}
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-emerald-600">
                      <Sparkles className="w-4 h-4" />
                      <span>{t('auto_close')}</span>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                        >
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <p className="text-sm text-red-700">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Titre */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('title_label')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={titre}
                        onChange={(e) => setTitre(e.target.value)}
                        placeholder={t('title_placeholder')}
                        maxLength={200}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[hsl(213,80%,28%)] focus:ring-4 focus:ring-[hsl(213,80%,28%)]/10 transition-all text-gray-900 placeholder:text-gray-400"
                      />
                      <div className="flex justify-end mt-1">
                        <p className="text-xs text-gray-400">
                          {titre.length}/200
                        </p>
                      </div>
                    </div>

                    {/* Catégorie */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('category_label')}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORY_IDS.map((catId) => (
                          <button
                            key={catId}
                            type="button"
                            onClick={() => setCategorie(catId === categorie ? '' : catId)}
                            className={`p-3 rounded-xl text-center transition-all ${
                              categorie === catId
                                ? 'bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,40%)] text-white shadow-lg scale-[1.02]'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            <span className="text-xl block mb-1">{categoryEmojis[catId]}</span>
                            <span className="text-xs font-medium">{t(`categories.${catId}`)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('description_label')} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('description_placeholder')}
                        rows={5}
                        maxLength={5000}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[hsl(213,80%,28%)] focus:ring-4 focus:ring-[hsl(213,80%,28%)]/10 transition-all resize-none text-gray-900 placeholder:text-gray-400"
                      />
                      <div className="flex justify-between mt-1">
                        <p className={`text-xs ${description.length < 20 ? 'text-orange-500' : 'text-gray-400'}`}>
                          {description.length < 20 ? t('chars_remaining', { count: 20 - description.length }) : t('min_reached')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {description.length}/5000
                        </p>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[hsl(213,80%,28%)] to-[hsl(213,80%,40%)] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-[hsl(213,80%,28%)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t('submitting')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>{t('submit_btn')}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render modal at document body level
  if (!mounted) return null;
  
  return createPortal(modalContent, document.body);
}

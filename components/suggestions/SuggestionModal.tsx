'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Lightbulb, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Building2,
  Landmark,
  Leaf,
  GraduationCap,
  HeartPulse,
  Bus,
  Palette,
  Laptop
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

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

const categoryIcons: Record<string, React.ElementType> = {
  infrastructure: Building2,
  services:       Landmark,
  environnement:  Leaf,
  education:      GraduationCap,
  sante:          HeartPulse,
  transport:      Bus,
  culture:        Palette,
  numerique:      Laptop,
  autre:          Lightbulb,
};

const categoryColors: Record<string, { bg: string; text: string; border: string; activeBg: string }> = {
  infrastructure: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', activeBg: 'bg-orange-100' },
  services:       { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100',   activeBg: 'bg-blue-100' },
  environnement:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100',  activeBg: 'bg-green-100' },
  education:      { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', activeBg: 'bg-indigo-100' },
  sante:          { bg: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-pink-100',   activeBg: 'bg-pink-100' },
  transport:      { bg: 'bg-sky-50',    text: 'text-sky-600',    border: 'border-sky-100',    activeBg: 'bg-sky-100' },
  culture:        { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', activeBg: 'bg-violet-100' },
  numerique:      { bg: 'bg-cyan-50',   text: 'text-cyan-600',   border: 'border-cyan-100',   activeBg: 'bg-cyan-100' },
  autre:          { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   activeBg: 'bg-gray-100' },
};

export default function SuggestionModal({ isOpen, onClose, onSuccess }: SuggestionModalProps) {
  const t = useTranslations('suggestions');
  const tGlobal = useTranslations();
  const locale = useLocale();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [categorie, setCategorie] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTitre('');
      setDescription('');
      setCategorie('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!titre.trim()) { setError(t('error_title_required')); return; }
    if (!description.trim()) { setError(t('error_desc_required')); return; }
    if (description.length < 20) { setError(t('error_desc_min')); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre, description, categorie }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error(tGlobal('errors.unauthorized'));
          window.location.href = `/${locale}/login?callbackUrl=/${locale}/suggestions?new=true`;
          return;
        }
        if (res.status === 429 && data.error === 'LIMIT_EXCEEDED' && data.resetDate) {
          const date = new Date(data.resetDate).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
          throw new Error(tGlobal('suggestion_rate_limit', { date }));
        }
        throw new Error(data.error || t('error_title_required'));
      }

      setSuccess(true);
      toast.success(t('success_title'));
      onSuccess?.();
      setTimeout(() => { onClose(); }, 2000);
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
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 100000 }}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div className="relative bg-gradient-to-br from-[hsl(var(--gov-blue-dark))] via-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue))] px-7 py-6 text-white flex-shrink-0 overflow-hidden">
                <div className="absolute inset-0 gov-pattern opacity-10" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative flex items-center justify-between z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                      <Lightbulb className="w-6 h-6 text-[hsl(var(--gov-gold))]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight font-outfit">{t('modal_title')}</h2>
                      <p className="text-white/60 text-xs font-medium mt-0.5">{t('modal_subtitle')}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* ── Content ── */}
              <div className="p-6 overflow-y-auto flex-1">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-[hsl(var(--gov-green))] to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-900/20">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-2 font-outfit">{t('success_title')}</h3>
                    <p className="text-gray-500 leading-relaxed">{t('success_message')}</p>
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-600">
                      <Sparkles className="w-4 h-4" />
                      {t('auto_close')}
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl"
                        >
                          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          </div>
                          <p className="text-sm font-medium text-red-700">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── Titre ── */}
                    <div>
                      <label className="gov-label mb-2">
                        {t('title_label')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={titre}
                          onChange={(e) => setTitre(e.target.value)}
                          placeholder={t('title_placeholder')}
                          maxLength={200}
                          className="gov-input"
                        />
                        <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-lg ${
                          titre.length > 180 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {titre.length}/200
                        </span>
                      </div>
                    </div>

                    {/* ── Catégorie ── */}
                    <div>
                      <label className="gov-label mb-3">{t('category_label')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORY_IDS.map((catId) => {
                          const Icon = categoryIcons[catId] || Lightbulb;
                          const colors = categoryColors[catId];
                          const isSelected = categorie === catId;
                          return (
                            <button
                              key={catId}
                              type="button"
                              onClick={() => setCategorie(catId === categorie ? '' : catId)}
                              className={`relative p-3 rounded-2xl text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 border ${
                                isSelected
                                  ? `${colors.activeBg} ${colors.border} ${colors.text} shadow-sm scale-[1.02]`
                                  : `bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50/50`
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(var(--gov-blue))] rounded-full flex items-center justify-center shadow-sm">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                isSelected ? `${colors.bg}` : 'bg-gray-100'
                              }`}>
                                <Icon className={`w-4 h-4 ${isSelected ? colors.text : 'text-gray-400'}`} strokeWidth={1.5} />
                              </div>
                              <span className="text-[10px] font-bold leading-tight text-center">
                                {t(`categories.${catId}`)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Description ── */}
                    <div>
                      <label className="gov-label mb-2">
                        {t('description_label')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={t('description_placeholder')}
                          rows={5}
                          maxLength={5000}
                          className="gov-textarea px-4 py-3"
                        />
                        <div className="flex justify-between items-center mt-1.5 px-1">
                          <span className={`text-xs font-bold transition-colors ${
                            description.length < 20 ? 'text-orange-500' : 'text-emerald-600'
                          }`}>
                            {description.length < 20 
                              ? t('chars_remaining', { count: 20 - description.length }) 
                              : t('min_reached')}
                          </span>
                          <span className="text-xs font-bold text-gray-400">{description.length}/5000</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Submit ── */}
                    <motion.button
                      type="submit"
                      disabled={submitting}
                      whileHover={{ scale: submitting ? 1 : 1.01 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

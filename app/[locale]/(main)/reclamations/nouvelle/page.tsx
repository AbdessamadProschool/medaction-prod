'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { reclamationSchema, ReclamationFormData } from '@/lib/validations/reclamation';
import LocalisationSection from '@/components/reclamations/LocalisationSection';
import DetailsSection from '@/components/reclamations/DetailsSection';
import PreuvesSection from '@/components/reclamations/PreuvesSection';
import { 
  MapPin, 
  FileEdit, 
  Camera, 
  Lightbulb, 
  CheckCircle2, 
  Shield,
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
  AlertTriangle,
  Scale,
  Eye,
  X,
  FileWarning,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { PermissionGuard } from '@/hooks/use-permission';
import { useTranslations, useLocale } from 'next-intl';



// Composant Popup Responsabilité
function ResponsibilityDisclaimer({ 
  isOpen, 
  onAccept, 
  onDecline 
}: { 
  isOpen: boolean; 
  onAccept: () => void; 
  onDecline: () => void; 
}) {
  const t = useTranslations();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[90vh]"
        >
          {/* Header avec gradient Royal */}
          <div className="relative flex-shrink-0 bg-gradient-to-r from-[hsl(var(--gov-blue-dark))] via-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] px-6 py-5 text-center border-b-4 border-[hsl(var(--gov-gold))]">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl mix-blend-overlay" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[hsl(var(--gov-gold))] rounded-full blur-3xl mix-blend-overlay" />
              <div className="absolute inset-0 gov-pattern opacity-10" />
            </div>
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 20, delay: 0.2 }}
                className="w-16 h-16 mx-auto mb-3 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-[hsl(var(--gov-gold)/0.3)] shadow-2xl shadow-[hsl(var(--gov-blue-dark)/0.5)]"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-inner">
                   <img src="/images/logo-portal-mediouna.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-1 font-outfit tracking-tight">
                {t('reclamation.disclaimer.title')}
              </h2>
              <div className="flex items-center justify-center gap-2 text-[hsl(var(--gov-gold))] text-xs font-medium uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gov-gold))]" />
                {t('reclamation.disclaimer.service_name')}
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gov-gold))]" />
              </div>
            </div>
          </div>

          {/* Contenu Scrollable */}
          <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
            {/* Avertissement principal */}
            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800 mb-0.5">{t('reclamation.disclaimer.warning')}</h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  {t('reclamation.disclaimer.warning_text')}
                </p>
              </div>
            </div>

            {/* Points de responsabilité - Style Carte */}
            <div className="grid gap-2">
              {[
                { icon: FileWarning, color: 'blue', titleKey: 'text_verified', subKey: 'sub_verified' },
                { icon: Camera, color: 'purple', titleKey: 'text_photos', subKey: 'sub_photos' },
                { icon: Eye, color: 'emerald', titleKey: 'text_official', subKey: 'sub_official' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-[hsl(var(--gov-blue)/0.2)] transition-all group">
                  <div className={`w-8 h-8 rounded-lg bg-${item.color}-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`w-4 h-4 text-${item.color}-600`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-0.5">{t(`reclamation.disclaimer.${item.titleKey}`)}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{t(`reclamation.disclaimer.${item.subKey}`)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Note légale */}
            <p className="text-[10px] text-gray-400 text-center px-4 leading-relaxed">
              {t('reclamation.disclaimer.legal_warning')}
            </p>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-3 flex-shrink-0 pt-2 bg-white border-t border-gray-50">
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-3 text-sm border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('reclamation.disclaimer.cancel')}
            </button>
            <motion.button
              onClick={onAccept}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm bg-gradient-to-r from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/40 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              {t('reclamation.disclaimer.accept')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function NouvelleReclamationPage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const steps = [
    { id: 1, title: t('reclamation.steps.location'), description: t('reclamation.steps.desc_location'), icon: MapPin },
    { id: 2, title: t('reclamation.steps.details'), description: t('reclamation.steps.desc_details'), icon: FileEdit },
    { id: 3, title: t('reclamation.steps.proofs'), description: t('reclamation.steps.desc_proofs'), icon: Camera },
  ];
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    register,
    setValue,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ReclamationFormData>({
    resolver: zodResolver(reclamationSchema),
    mode: 'onChange',
  });

  // Validation par étape
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return trigger(['communeId']);
      case 2:
        return trigger(['categorie', 'titre', 'description']);
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (!isValid) {
      toast.error(t('reclamation.new.error_required'));
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Soumission MANUELLE uniquement quand l'utilisateur clique
  const handleManualSubmit = async () => {
    if (currentStep !== 3) return;

    const isValid = await trigger();
    if (!isValid) {
      toast.error(t('reclamation.new.error_all_required'));
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      const data = getValues();
      
      setUploadProgress(20);
      const response = await fetch('/api/reclamations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429 && errorData.error === 'LIMIT_EXCEEDED' && errorData.resetDate) {
           const date = new Date(errorData.resetDate).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
           throw new Error(t('reclamation_rate_limit', { date }));
        }

        throw new Error(errorData.error || t('reclamation.errors.creation_failed'));
      }

      setUploadProgress(40);
      const result = await response.json();
      const reclamationId = result.data.id;

      // Upload des photos
      if (photos.length > 0) {
        setUploadProgress(50);
        const formData = new FormData();
        photos.forEach((photo) => formData.append('files', photo));
        formData.append('reclamationId', reclamationId.toString());

        const uploadResponse = await fetch('/api/upload/reclamation', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadErrorData = await uploadResponse.json().catch(() => ({}));
          // Annuler la réclamation car les photos sont obligatoires/importantes et ont échoué
          await fetch(`/api/reclamations/${reclamationId}`, { method: 'DELETE' }).catch(() => {});
          throw new Error(`Erreur lors de l'envoi des photos: ${uploadErrorData.error || uploadErrorData.message || 'Fichiers non valides ou rejetés par la sécurité'}`);
        }

        const uploadResult = await uploadResponse.json().catch(() => ({}));
        if (uploadResult.errors && uploadResult.errors.length > 0) {
          const errorMessages = uploadResult.errors.map((e: any) => `${e.filename}: ${e.error}`).join(', ');
          // Annuler la réclamation si certaines photos sont rejetées
          await fetch(`/api/reclamations/${reclamationId}`, { method: 'DELETE' }).catch(() => {});
          throw new Error(`Certaines photos ont été rejetées: ${errorMessages}`);
        }
        
        if (uploadResult.success === false) {
           await fetch(`/api/reclamations/${reclamationId}`, { method: 'DELETE' }).catch(() => {});
           throw new Error("L'envoi des photos a échoué. Veuillez vérifier le format et la taille des fichiers.");
        }
        
        setUploadProgress(90);
      }

      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(t('reclamation.new.success_sent'));
      router.push(`/reclamations/succes?id=${reclamationId}`);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : t('reclamation.errors.generic'), { duration: 6000 });
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Handlers pour le popup de responsabilité
  const handleAcceptTerms = () => {
    setHasAcceptedTerms(true);
    setShowDisclaimer(false);
  };

  const handleDeclineTerms = () => {
    router.back();
  };

  const CurrentStepIcon = steps[currentStep - 1].icon;

  return (
    <PermissionGuard permission="reclamations.create" fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('reclamation.actions.restricted')}</h2>
          <p className="text-gray-500 mb-6">{t('reclamation.actions.no_permission')}</p>
          <button onClick={() => router.back()} className="text-emerald-600 hover:underline">
            {t('reclamation.actions.back')}
          </button>
        </div>
      </div>
    }>
      {/* Popup de Responsabilité */}
      <ResponsibilityDisclaimer
        isOpen={showDisclaimer}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
        {/* Background Pattern */}
        <div 
          className="fixed inset-0 z-[-1] opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "url('/images/zellige-bg.jpg')",
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        />
        
        {/* Hero Banner avec Gradient Gouvernemental */}
        <div className="relative bg-gradient-to-b from-[hsl(var(--gov-blue-dark))] via-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] overflow-hidden shadow-2xl pb-32">
          <div className="absolute inset-0 gov-pattern opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          
          <div className="relative max-w-5xl mx-auto px-4 py-20 sm:py-24 text-center z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md border border-[hsl(var(--gov-gold)/0.3)] rounded-full text-[hsl(var(--gov-gold))] text-sm font-bold uppercase tracking-widest mb-8 shadow-xl">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--gov-gold))]" />
                {t('reclamation.disclaimer.service_name')}
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-sm font-outfit">
                {t('reclamation.new_title')}
              </h1>
              
              <p className="text-lg sm:text-xl text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
                {t('reclamation.new_subtitle')}
              </p>
            </motion.div>
          </div>
          
          {/* Decorative bottom curve */}
          <div className="absolute bottom-0 w-full">
             <svg viewBox="0 0 1440 120" className="relative w-full h-[60px] text-[hsl(var(--background))] fill-current" preserveAspectRatio="none">
                 <path d="M0,0 C240,120 480,120 720,60 C960,0 1200,0 1440,60 L1440,120 L0,120 Z" />
             </svg>
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 -mt-8 pb-16">
          {/* Steps Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <motion.div
                        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-[hsl(var(--gov-green))] text-white shadow-lg shadow-[hsl(var(--gov-green)/0.4)]'
                            : isActive
                            ? 'bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] text-white shadow-lg shadow-blue-200'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-6 h-6" />
                        )}
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 rounded-2xl border-2 border-[hsl(var(--gov-blue))]"
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          />
                        )}
                      </motion.div>
                      <div className="mt-3 text-center">
                        <p className={`font-semibold text-sm ${
                          isActive ? 'text-[hsl(var(--gov-blue))]' : isCompleted ? 'text-[hsl(var(--gov-green))]' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-shrink-0 w-12 sm:w-24 h-1 mx-2 rounded-full overflow-hidden bg-gray-100">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[hsl(var(--gov-green))] to-[hsl(var(--gov-green-light))]"
                          initial={{ width: 0 }}
                          animate={{ width: isCompleted ? '100%' : '0%' }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Form Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] flex items-center justify-center text-white shadow-lg">
                  <CurrentStepIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Étape {currentStep}: {steps[currentStep - 1].title}
                  </h2>
                  <p className="text-sm text-gray-500">{steps[currentStep - 1].description}</p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && (
                    <LocalisationSection
                      register={register}
                      setValue={setValue}
                      errors={errors}
                      watch={watch}
                    />
                  )}
                  {currentStep === 2 && (
                    <DetailsSection
                      register={register}
                      errors={errors}
                      watch={watch}
                    />
                  )}
                  {currentStep === 3 && (
                    <>
                      <PreuvesSection
                        photos={photos}
                        setPhotos={setPhotos}
                      />
                      
                      {/* Final Step Info */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 p-5 bg-gradient-to-r from-[hsl(var(--gov-green)/0.05)] to-[hsl(var(--gov-green)/0.1)] border border-[hsl(var(--gov-green)/0.2)] rounded-2xl"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gov-green))] flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-[hsl(var(--gov-green-dark))]">{t('reclamation.ready.title')}</p>
                            <p className="text-sm text-[hsl(var(--gov-green))] mt-1">
                              {t.rich('reclamation.ready.desc', { strong: (chunks) => <strong>{chunks}</strong> })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress bar pendant l'envoi */}
            <AnimatePresence>
              {isSubmitting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 sm:px-8 pb-4"
                >
                  <div className="p-4 bg-[hsl(var(--gov-blue)/0.05)] border border-[hsl(var(--gov-blue)/0.2)] rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[hsl(var(--gov-blue))] animate-pulse" />
                        <span className="text-sm font-medium text-[hsl(var(--gov-blue))]">
                          {uploadProgress < 40 ? t('reclamation.progress.creating') : 
                           uploadProgress < 90 ? t('reclamation.progress.uploading') : 
                           t('reclamation.progress.finalizing')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[hsl(var(--gov-blue))]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-light))]"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Footer */}
            <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <motion.button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all ${
                    currentStep === 1 || isSubmitting
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t('reclamation.actions.prev')}
                </motion.button>

                {currentStep < 3 ? (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/40 transition-all"
                  >
                    {t('reclamation.actions.next')}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="flex items-center gap-2 px-10 py-3.5 bg-gradient-to-r from-[hsl(var(--gov-green))] to-[hsl(var(--gov-green-dark))] text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t('reclamation.actions.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t('reclamation.actions.submit')}
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm"
          >
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white shadow-sm">
              <Shield className="w-4 h-4 text-[hsl(var(--gov-green))]" strokeWidth={2.5} />
              <span className="font-bold text-gray-600 uppercase tracking-tight">{t('reclamation.trust.secure')}</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white shadow-sm">
              <Clock className="w-4 h-4 text-[hsl(var(--gov-blue))]" strokeWidth={2.5} />
              <span className="font-bold text-gray-600 uppercase tracking-tight">{t('reclamation.trust.compliance')}</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--gov-gold))]" strokeWidth={2.5} />
              <span className="font-bold text-gray-600 uppercase tracking-tight">{t('reclamation.trust.tracking')}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </PermissionGuard>
  );
}

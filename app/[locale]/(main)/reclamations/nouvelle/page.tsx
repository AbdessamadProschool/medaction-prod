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
import { useTranslations } from 'next-intl';



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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header avec gradient */}
          <div className="relative bg-gradient-to-br from-[hsl(213,80%,25%)] via-[hsl(213,80%,30%)] to-[hsl(213,80%,35%)] px-6 py-8 text-center">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[hsl(45,93%,47%)] rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20"
              >
                <Scale className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('reclamation.disclaimer.title')}
              </h2>
              <p className="text-white/80 text-sm">
                {t('reclamation.disclaimer.service_name')}
              </p>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 space-y-5">
            {/* Avertissement principal */}
            <div className="flex gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">{t('reclamation.disclaimer.warning')}</h3>
                <p className="text-sm text-amber-700 leading-relaxed">
                  {t('reclamation.disclaimer.warning_text')}
                </p>
              </div>
            </div>

            {/* Points de responsabilité */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileWarning className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{t('reclamation.disclaimer.text_verified')}</p>
                  <p className="text-xs text-gray-500">{t('reclamation.disclaimer.sub_verified')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{t('reclamation.disclaimer.text_photos')}</p>
                  <p className="text-xs text-gray-500">{t('reclamation.disclaimer.sub_photos')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{t('reclamation.disclaimer.text_official')}</p>
                  <p className="text-xs text-gray-500">{t('reclamation.disclaimer.sub_official')}</p>
                </div>
              </div>
            </div>

            {/* Note légale */}
            <p className="text-xs text-gray-400 text-center px-4 leading-relaxed">
              {t('reclamation.disclaimer.legal_warning')}
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('reclamation.disclaimer.cancel')}
            </button>
            <motion.button
              onClick={onAccept}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[hsl(213,80%,30%)] to-[hsl(213,80%,40%)] text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all"
            >
              <UserCheck className="w-5 h-5" />
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
        throw new Error(errorData.error || 'Erreur lors de la création');
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
          console.error('Erreur upload photos');
        }
        setUploadProgress(90);
      }

      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(t('reclamation.new.success_sent'));
      router.push(`/reclamations/succes?id=${reclamationId}`);

    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
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
        <div className="fixed inset-0 gov-pattern pointer-events-none opacity-50" />
        
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-[hsl(213,80%,25%)] via-[hsl(213,80%,30%)] to-[hsl(213,80%,35%)] overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[hsl(45,93%,47%)] rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6">
                <Shield className="w-4 h-4" />
                <span>{t('reclamation.disclaimer.service_name')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                {t('reclamation.new_title')}
              </h1>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                {t('reclamation.new_subtitle')}
              </p>
            </motion.div>
          </div>
          {/* Bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent" />
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
                          {uploadProgress < 40 ? 'Création de la réclamation...' : 
                           uploadProgress < 90 ? 'Upload des photos...' : 
                           'Finalisation...'}
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
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                    currentStep === 1 || isSubmitting
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('reclamation.actions.prev')}
                </motion.button>

                {currentStep < 3 ? (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--gov-blue))] text-white rounded-xl font-mdeium shadow-lg shadow-blue-200 hover:bg-[hsl(var(--gov-blue-dark))] transition-all"
                  >
                    {t('reclamation.actions.next')}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[hsl(var(--gov-green))] to-[hsl(var(--gov-green-light))] text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[hsl(var(--gov-green))]" />
              <span>{t('reclamation.trust.secure')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[hsl(var(--gov-blue))]" />
              <span>{t('reclamation.trust.compliance')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--gov-gold))]" />
              <span>{t('reclamation.trust.tracking')}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </PermissionGuard>
  );
}

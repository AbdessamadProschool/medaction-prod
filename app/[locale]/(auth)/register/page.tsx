'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  RegisterStep1Input,
  RegisterStep2Input,
  RegisterStep3Input,
} from '@/lib/validations/auth';
import { useTranslations } from 'next-intl';

type FormData = RegisterStep1Input & RegisterStep2Input & RegisterStep3Input;

const steps = [
  { id: 1, title: 'Identité', description: 'Vos informations personnelles' },
  { id: 2, title: 'Contact', description: 'Email et téléphone' },
  { id: 3, title: 'Sécurité', description: 'Créez votre mot de passe' },
];

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Vérifier si les inscriptions sont activées
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const res = await fetch('/api/public/settings');
        if (res.ok) {
          const data = await res.json();
          setRegistrationEnabled(data.registrationEnabled !== false);
        } else {
          setRegistrationEnabled(true); // Par défaut, autoriser
        }
      } catch {
        setRegistrationEnabled(true);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkRegistration();
  }, []);

  // Form pour étape 1
  const step1Form = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: formData,
  });

  // Form pour étape 2
  const step2Form = useForm<RegisterStep2Input>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: formData,
  });

  // Form pour étape 3
  const step3Form = useForm<RegisterStep3Input>({
    resolver: zodResolver(registerStep3Schema),
  });

  const handleStep1Submit = (data: RegisterStep1Input) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: RegisterStep2Input) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: RegisterStep3Input) => {
    setIsLoading(true);
    setError('');

    const finalData = { ...formData, ...data };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: finalData.email,
          password: finalData.password,
          nom: finalData.nom,
          prenom: finalData.prenom,
          telephone: finalData.telephone || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de l\'inscription');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // État de chargement
  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(213,80%,28%)]"></div>
      </div>
    );
  }

  // Inscriptions désactivées
  if (!registrationEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('register_closed')}</h2>
          <p className="text-gray-500 mb-6">
            {t('register_closed_desc')}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-[hsl(213,80%,28%)] text-white rounded-xl font-semibold hover:bg-[hsl(213,80%,35%)] transition-colors"
          >
            {t('login_link')}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-[hsl(145,63%,32%)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[hsl(145,63%,32%)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('register_success')}</h2>
          <p className="text-gray-500 mb-4">
            {t('register_success_desc')}
          </p>
          <div className="animate-pulse text-[hsl(213,80%,28%)]">{t('redirecting')}</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[hsl(213,80%,20%)] via-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)]">
        {/* Bande tricolore */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[hsl(45,93%,47%)]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-2xl font-bold">{t('portal_name')}</span>
            </div>

            <h1 className="text-4xl font-bold mb-4 text-white">{t('register_join_community')}</h1>
            <p className="text-lg text-white/80 mb-12">
              {t('register_join_description')}
            </p>

            {/* Progress Steps */}
            <div className="space-y-4">
              {[
                { id: 1, title: t('step_identity'), description: t('step_identity_desc') },
                { id: 2, title: t('step_contact'), description: t('step_contact_desc') },
                { id: 3, title: t('step_security'), description: t('step_security_desc') },
              ].map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`flex items-center gap-4 ${
                    currentStep >= step.id ? 'text-white' : 'text-white/70'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep > step.id
                        ? 'bg-white text-[hsl(213,80%,28%)]'
                        : currentStep === step.id
                        ? 'bg-white/30 border-2 border-white'
                        : 'bg-white/10 border border-white/30'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm opacity-75">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-[hsl(213,80%,28%)]">{t('portal_name')}</span>
            </div>
            
            {/* Mobile Steps */}
            <div className="flex justify-center gap-2 mb-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentStep >= step.id ? 'bg-[hsl(213,80%,28%)]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {currentStep === 1 ? t('step_identity') : currentStep === 2 ? t('step_contact') : t('step_security')}
              </h2>
              <p className="text-gray-500">
                {currentStep === 1 ? t('step_identity_desc') : currentStep === 2 ? t('step_contact_desc') : t('step_security_desc')}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Identity */}
              {currentStep === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={step1Form.handleSubmit(handleStep1Submit)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('first_name')}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[hsl(213,80%,45%)]">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        {...step1Form.register('prenom')}
                        className={`block w-full rounded-xl border border-slate-300 bg-slate-50 ps-12 py-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[hsl(213,80%,45%)] focus:ring-4 focus:ring-[hsl(213,80%,45%)]/10 transition-all duration-300 hover:border-slate-400 ${
                          step1Form.formState.errors.prenom ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                        }`}
                        placeholder={t('first_name_placeholder')}
                      />
                    </div>
                    {step1Form.formState.errors.prenom && (
                      <p className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1">
                        <span className="inline-block w-1 h-4 bg-red-600 rounded-full"></span>
                        {step1Form.formState.errors.prenom.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('last_name')}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[hsl(213,80%,45%)]">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        {...step1Form.register('nom')}
                        className={`block w-full rounded-xl border border-slate-300 bg-slate-50 ps-12 py-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[hsl(213,80%,45%)] focus:ring-4 focus:ring-[hsl(213,80%,45%)]/10 transition-all duration-300 hover:border-slate-400 ${
                          step1Form.formState.errors.nom ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                        }`}
                        placeholder={t('last_name_placeholder')}
                      />
                    </div>
                    {step1Form.formState.errors.nom && (
                      <p className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1">
                        <span className="inline-block w-1 h-4 bg-red-600 rounded-full"></span>
                        {step1Form.formState.errors.nom.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full gov-btn gov-btn-primary py-3.5"
                  >
                    {t('continue')}
                  </button>
                </motion.form>
              )}

              {/* Step 2: Contact */}
              {currentStep === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={step2Form.handleSubmit(handleStep2Submit)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[hsl(213,80%,45%)]">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        {...step2Form.register('email')}
                        className={`block w-full rounded-xl border border-slate-300 bg-slate-50 ps-12 py-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[hsl(213,80%,45%)] focus:ring-4 focus:ring-[hsl(213,80%,45%)]/10 transition-all duration-300 hover:border-slate-400 ${
                          step2Form.formState.errors.email ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                        }`}
                        placeholder="votre@email.com"
                      />
                    </div>
                    {step2Form.formState.errors.email && (
                      <p className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1">
                        <span className="inline-block w-1 h-4 bg-red-600 rounded-full"></span>
                        {step2Form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('phone')} <span className="text-gray-400">{t('phone_optional')}</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[hsl(213,80%,45%)]">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        {...step2Form.register('telephone')}
                        className={`block w-full rounded-xl border border-slate-300 bg-slate-50 ps-12 py-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[hsl(213,80%,45%)] focus:ring-4 focus:ring-[hsl(213,80%,45%)]/10 transition-all duration-300 hover:border-slate-400 ${
                          step2Form.formState.errors.telephone ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                        }`}
                        placeholder={t('phone_placeholder')}
                      />
                    </div>
                    {step2Form.formState.errors.telephone && (
                      <p className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1">
                        <span className="inline-block w-1 h-4 bg-red-600 rounded-full"></span>
                        {step2Form.formState.errors.telephone.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      {t('back')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 gov-btn gov-btn-primary py-3.5"
                    >
                      {t('continue')}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Step 3: Password */}
              {currentStep === 3 && (
                <motion.form
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={step3Form.handleSubmit(handleStep3Submit)}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('password')}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[hsl(213,80%,45%)]">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        {...step3Form.register('password')}
                        className={`block w-full rounded-xl border border-slate-300 bg-slate-50 ps-12 py-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[hsl(213,80%,45%)] focus:ring-4 focus:ring-[hsl(213,80%,45%)]/10 transition-all duration-300 hover:border-slate-400 ${
                          step3Form.formState.errors.password ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                        }`}
                        placeholder="••••••••"
                      />
                    </div>
                    {step3Form.formState.errors.password && (
                      <p className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1">
                        <span className="inline-block w-1 h-4 bg-red-600 rounded-full"></span>
                        {step3Form.formState.errors.password.message}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <p>{t('password_requirements')}</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>{t('password_req_length')}</li>
                        <li>{t('password_req_case')}</li>
                        <li>{t('password_req_special')}</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('confirm_password')}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[hsl(213,80%,45%)]">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        {...step3Form.register('confirmPassword')}
                        className={`block w-full rounded-xl border border-slate-300 bg-slate-50 ps-12 py-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[hsl(213,80%,45%)] focus:ring-4 focus:ring-[hsl(213,80%,45%)]/10 transition-all duration-300 hover:border-slate-400 ${
                          step3Form.formState.errors.confirmPassword ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                        }`}
                        placeholder="••••••••"
                      />
                    </div>
                    {step3Form.formState.errors.confirmPassword && (
                      <p className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1">
                        <span className="inline-block w-1 h-4 bg-red-600 rounded-full"></span>
                        {step3Form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      {t('back')}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 gov-btn gov-btn-primary py-3.5 disabled:opacity-70"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t('creating')}
                        </span>
                      ) : (
                        t('create_my_account')
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-6 text-center">
              <p className="text-gray-500">
                {t('has_account')}{' '}
                <Link href="/login" className="font-semibold text-[hsl(45,93%,40%)] hover:text-[hsl(45,93%,35%)]">
                  {t('login_link')}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

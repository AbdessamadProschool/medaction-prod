'use client';

import { useState } from 'react';
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

type FormData = RegisterStep1Input & RegisterStep2Input & RegisterStep3Input;

const steps = [
  { id: 1, title: 'Identité', description: 'Vos informations personnelles' },
  { id: 2, title: 'Contact', description: 'Email et téléphone' },
  { id: 3, title: 'Sécurité', description: 'Créez votre mot de passe' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<FormData>>({});

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription réussie !</h2>
          <p className="text-gray-500 mb-4">
            Votre compte a été créé avec succès. Vous allez être redirigé vers la page de connexion.
          </p>
          <div className="animate-pulse text-emerald-600">Redirection en cours...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
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
              <span className="text-2xl font-bold">MedAction</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">Rejoignez notre communauté</h1>
            <p className="text-lg text-white/80 mb-12">
              Créez votre compte pour accéder à tous les services de la Province de Médiouna.
            </p>

            {/* Progress Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`flex items-center gap-4 ${
                    currentStep >= step.id ? 'text-white' : 'text-white/50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep > step.id
                        ? 'bg-white text-emerald-600'
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
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">MedAction</span>
            </div>
            
            {/* Mobile Steps */}
            <div className="flex justify-center gap-2 mb-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentStep >= step.id ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-gray-500">{steps[currentStep - 1].description}</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <input
                      {...step1Form.register('prenom')}
                      className={`block w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                        step1Form.formState.errors.prenom ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="Votre prénom"
                    />
                    {step1Form.formState.errors.prenom && (
                      <p className="mt-1 text-sm text-red-600">{step1Form.formState.errors.prenom.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      {...step1Form.register('nom')}
                      className={`block w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                        step1Form.formState.errors.nom ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="Votre nom"
                    />
                    {step1Form.formState.errors.nom && (
                      <p className="mt-1 text-sm text-red-600">{step1Form.formState.errors.nom.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/40 transition-all"
                  >
                    Continuer
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      {...step2Form.register('email')}
                      className={`block w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                        step2Form.formState.errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="votre@email.com"
                    />
                    {step2Form.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600">{step2Form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone <span className="text-gray-400">(optionnel)</span>
                    </label>
                    <input
                      type="tel"
                      {...step2Form.register('telephone')}
                      className={`block w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                        step2Form.formState.errors.telephone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="0612345678"
                    />
                    {step2Form.formState.errors.telephone && (
                      <p className="mt-1 text-sm text-red-600">{step2Form.formState.errors.telephone.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/40 transition-all"
                    >
                      Continuer
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                    <input
                      type="password"
                      {...step3Form.register('password')}
                      className={`block w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                        step3Form.formState.errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="••••••••"
                    />
                    {step3Form.formState.errors.password && (
                      <p className="mt-1 text-sm text-red-600">{step3Form.formState.errors.password.message}</p>
                    )}
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <p>Le mot de passe doit contenir :</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Au moins 8 caractères</li>
                        <li>Une majuscule et une minuscule</li>
                        <li>Un chiffre et un caractère spécial</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      {...step3Form.register('confirmPassword')}
                      className={`block w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                        step3Form.formState.errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="••••••••"
                    />
                    {step3Form.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{step3Form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 py-3.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/40 transition-all disabled:opacity-70"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Création...
                        </span>
                      ) : (
                        'Créer mon compte'
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-6 text-center">
              <p className="text-gray-500">
                Déjà un compte ?{' '}
                <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

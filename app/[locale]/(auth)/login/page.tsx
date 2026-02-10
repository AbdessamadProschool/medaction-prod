'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { useTranslations } from 'next-intl';

function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Rediriger si déjà connecté
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role;
      let targetUrl = callbackUrl !== '/' ? callbackUrl : '/';
      
      // Redirection selon le rôle
      if (targetUrl === '/') {
        switch (role) {
          case 'GOUVERNEUR':
            targetUrl = '/gouverneur';
            break;
          case 'DELEGATION':
            targetUrl = '/delegation';
            break;
          case 'AUTORITE_LOCALE':
            targetUrl = '/autorite';
            break;
          case 'COORDINATEUR_ACTIVITES':
            targetUrl = '/coordinateur';
            break;
          case 'ADMIN':
          case 'SUPER_ADMIN':
            targetUrl = '/admin';
            break;
          default:
            targetUrl = '/';
        }
      }
      
      router.replace(targetUrl);
    }
  }, [status, session, router, callbackUrl]);

  // Afficher un loader pendant la vérification de session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(213,80%,28%)]"></div>
      </div>
    );
  }

  // Si déjà connecté, ne pas afficher le formulaire
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(213,80%,28%)] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('already_connected')}</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: LoginInput) => {
    if (isLocked) return;

    setIsLoading(true);
    setError('');

    try {
      // === SECURITY: Check IP-based rate limit BEFORE login attempt ===
      const rateLimitCheck = await fetch('/api/auth/login-check', { method: 'POST' });
      const rateLimitData = await rateLimitCheck.json();
      
      if (!rateLimitData.success || rateLimitData.blocked) {
        setIsLocked(true);
        setLockoutMinutes(rateLimitData.retryAfterMinutes || 30);
        setError(t('too_many_attempts', { minutes: rateLimitData.retryAfterMinutes || 30 }));
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        code: data.code,
      });

      // === SECURITY: Record the login attempt result ===
      const loginSuccess = !result?.error;
      await fetch('/api/auth/login-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: loginSuccess }),
      });

      if (result?.error) {
        if (result.error === '2FA_REQUIRED') {
          setStep('2fa');
          setError('');
        } else {
           // Traduire le message d'erreur
           let errorMessage = result.error;
           
           if (result.error === 'CredentialsSignin' || result.error.includes('Identifiants incorrects')) {
             // Extraire le nombre de tentatives si présent
             const attemptMatch = result.error.match(/(\d+) tentative/);
             if (attemptMatch) {
               errorMessage = t('invalid_credentials_remaining', { count: attemptMatch[1] });
             } else {
               errorMessage = t('invalid_credentials');
             }
           } else if (result.error.includes('Compte temporairement bloqué') || result.error.includes('Account locked')) {
             const minuteMatch = result.error.match(/(\d+) minute/);
             errorMessage = t('account_locked', { minutes: minuteMatch ? minuteMatch[1] : '30' });
           } else if (result.error.includes('Trop de tentatives')) {
             errorMessage = t('too_many_attempts', { minutes: 30 });
           }
           
           setError(errorMessage);

           // Si le compte est bloqué, désactiver le bouton
           if (result.error.includes('Compte temporairement bloqué') || result.error.includes('Trop de tentatives') || result.error.includes('Account locked')) {
             setIsLocked(true);
           }
        }
        setIsLoading(false);
      } else {
        // Récupérer la session pour vérifier le rôle
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;

        // Redirection intelligente selon le rôle
        let targetUrl = callbackUrl !== '/' ? callbackUrl : '/';
        
        // Si l'URL de retour est la racine, on redirige vers le dashboard approprié
        if (targetUrl === '/') {
          switch (role) {
            case 'GOUVERNEUR':
              targetUrl = '/gouverneur';
              break;
            case 'DELEGATION':
              targetUrl = '/delegation';
              break;
            case 'AUTORITE_LOCALE':
              targetUrl = '/autorite';
              break;
            case 'COORDINATEUR_ACTIVITES':
              targetUrl = '/coordinateur';
              break;
            case 'ADMIN':
            case 'SUPER_ADMIN':
              targetUrl = '/admin';
              break;
            default:
              targetUrl = '/';
          }
        }

        router.push(targetUrl);
        router.refresh();
      }
    } catch (e) {
      setError(t('error_generic'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding Gouvernemental */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[hsl(213,80%,20%)] via-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)]">
        {/* Bande tricolore */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
        
        {/* Animated Background Patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[hsl(45,93%,47%)]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[hsl(145,63%,32%)]/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse delay-500" />
        </div>

        {/* Moroccan Pattern - Ultra Modern Integrated */}
        <div 
          className="absolute inset-0 opacity-10 mix-blend-soft-light pointer-events-none bg-center bg-no-repeat bg-cover" 
          style={{
            backgroundImage: `url("/images/pattern-maroc.png")`,
          }} 
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white rounded-xl p-2 shadow-lg">
                  <img
                    src="/images/logo-portal-mediouna.png"
                    alt="Portail Mediouna"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="font-outfit">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    <span>PORTAIL </span>
                    <span className="text-[hsl(45,93%,47%)]">MEDIOUNA</span>
                  </h2>
                  <p className="text-white/80 text-sm font-sans">Province de Médiouna</p>
                </div>
              </div>
              <h1 className="text-4xl font-bold leading-tight mb-4 text-white">
                {t('citizen_portal')}
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                {t('login_description')}
              </p>
            </div>

            <div className="space-y-4 mt-12">
              {[
                { icon: '📋', text: t('feature_reclamations') },
                { icon: '🏛️', text: t('feature_etablissements') },
                { icon: '📅', text: t('feature_evenements') },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3 text-white/90 bg-white/10 rounded-lg px-4 py-3"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 gov-pattern">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-lg">
                <img
                  src="/images/logo-portal-mediouna.png"
                  alt="Portail Mediouna"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left font-outfit">
                <h2 className="text-lg font-bold text-gray-900">
                  <span>PORTAIL </span>
                  <span className="text-[hsl(45,93%,47%)]">MEDIOUNA</span>
                </h2>
                <p className="text-xs text-[hsl(213,80%,28%)] font-sans font-medium">Province de Médiouna</p>
              </div>
            </div>
          </div>

          {/* Form Card - Gouvernemental */}
          <div className="gov-card gov-card-official p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {step === '2fa' ? t('security_verification') : t('login_title')}
              </h2>
              <p className="text-gray-500">
                {step === '2fa' 
                  ? t('enter_6digit_code') 
                  : t('login_subtitle')}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="gov-alert gov-alert-danger mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Étape 1 : Email et Mot de passe */}
              <div className={step === '2fa' ? 'hidden' : 'space-y-5'}>
                <div>
                  <label htmlFor="email" className="gov-label">
                    {t('email')}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[hsl(213,80%,45%)]">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      className={`block w-full rounded-xl border border-slate-300 bg-slate-50 ps-12 py-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[hsl(213,80%,45%)] focus:ring-4 focus:ring-[hsl(213,80%,45%)]/10 transition-all duration-300 hover:border-slate-400 ${
                        errors.email ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                      }`}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1">
                      <span className="inline-block w-1 h-4 bg-red-600 rounded-full"></span>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="gov-label">
                    {t('password')}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[hsl(213,80%,45%)]">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      {...register('password')}
                      className={`block w-full rounded-xl border border-slate-300 bg-slate-50 ps-12 py-4 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[hsl(213,80%,45%)] focus:ring-4 focus:ring-[hsl(213,80%,45%)]/10 transition-all duration-300 hover:border-slate-400 ${
                        errors.password ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : ''
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm font-bold text-red-600 flex items-center gap-1">
                      <span className="inline-block w-1 h-4 bg-red-600 rounded-full"></span>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-[hsl(213,80%,28%)] focus:ring-[hsl(213,80%,28%)] transition-colors"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{t('remember_me')}</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-bold text-[hsl(213,80%,28%)] hover:text-[hsl(213,80%,45%)] transition-colors underline-offset-4 hover:underline"
                  >
                    {t('forgot_password')}
                  </Link>
                </div>
              </div>

              {/* Étape 2 : Code 2FA */}
              {step === '2fa' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="code" className="gov-label">
                      {t('verification_code')}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[hsl(213,80%,45%)]">
                         <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                         </svg>
                      </div>
                      <input
                        id="code"
                        type="text"
                        maxLength={6}
                        autoComplete="one-time-code"
                        {...register('code')}
                        className="block w-full rounded-xl border border-slate-300 bg-slate-50 ps-12 py-4 text-center tracking-[0.5em] font-mono text-lg font-bold text-slate-900 focus:bg-white focus:border-[hsl(213,80%,45%)] focus:ring-4 focus:ring-[hsl(213,80%,45%)]/10 transition-all duration-300 hover:border-slate-400"
                        placeholder="000000"
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="w-full text-sm font-semibold text-[hsl(213,80%,28%)] underline hover:text-[hsl(213,80%,45%)] transition-colors"
                  >
                    {t('back_to_login')}
                  </button>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading || isLocked}
                className={`w-full gov-btn py-4 text-base shadow-lg transition-all ${
                  isLocked 
                    ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' 
                    : 'bg-[hsl(213,80%,28%)] text-white hover:bg-[hsl(213,80%,20%)] hover:shadow-xl active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('verifying')}
                  </span>
                ) : isLocked ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {t('locked')}
                  </span>
                ) : (
                  step === '2fa' ? t('verify_code') : t('connect_portal')
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500">
                {t('no_account')}{' '}
                <Link
                  href="/register"
                  className="font-bold text-[hsl(45,93%,35%)] hover:text-[hsl(45,93%,25%)] transition-colors underline-offset-4 hover:underline"
                >
                  {t('create_account')}
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            {t('copyright')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}

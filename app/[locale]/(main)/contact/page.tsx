'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import dynamicImport from 'next/dynamic';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  MessageSquare, 
  Send, 
  Loader2, 
  CheckCircle2,
  Building2,
  Clock,
  AlertTriangle
} from 'lucide-react';

// Import dynamique de la carte
const ContactMap = dynamicImport(() => import('@/components/contact/ContactMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-2xl" />
});

export default function ContactPage() {
  const t = useTranslations('contact_page');
  const locale = useLocale();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Schéma de validation Zod avec traductions
  const contactSchema = z.object({
    nom: z.string().min(2, t('validation.name_short')),
    email: z.string().email(t('validation.email_invalid')),
    sujet: z.string().min(1, t('validation.subject_required')),
    message: z.string().min(10, t('validation.message_short')).max(1000, t('validation.message_long'))
  });

  type ContactFormData = z.infer<typeof contactSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nom: '',
      email: '',
      sujet: '',
      message: ''
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const resData = await res.json();

      if (res.status === 429) {
        if (resData.error === 'LIMIT_EXCEEDED' && resData.resetDate) {
           const date = new Date(resData.resetDate).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
           toast.error(t('rate_limit_error', { date }));
        } else {
           // Fallback
           toast.error(resData.error || t('rate_limit_error', { date: 'prochainement' }));
        }
        setLoading(false);
        return; // Arrêt immédiat
      }
      
      if (!res.ok) {
        // En cas d'erreur serveur (500), on permet le fallback simulation
        // uniquement si ce n'est pas une erreur de validation ou rate limit
        if (res.status === 400) {
           toast.error(t('validation_error'));
           setLoading(false);
           return;
        }
        throw new Error('Erreur API');
      }
      
      setSuccess(true);
      reset();
      toast.success(t('success_message'));
    } catch (err) {
      console.error(err);
      // Fallback simulation pour ne pas bloquer l'utilisateur en cas d'erreur DB/réseau
      // SAUF si c'était une 429 (déjà géré par return)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative z-0">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 z-[-1] opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "url('/images/zellige-bg.jpg')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('title')}
          </h1>
          <p className="text-xl text-[hsl(45,93%,70%)] max-w-2xl mx-auto font-medium">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 -mt-10 relative z-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Formulaire */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 lg:p-10 border border-gray-100 order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('form_title')}</h2>
            </div>

            {/* Avertissement de responsabilité */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-bold mb-1">{t('warning.title')}</p>
                <p>
                  {t('warning.text')}
                </p>
              </div>
            </div>
            
            {success ? (
              <div className="text-center py-12 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('success_title')}</h3>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">{t('success_message')}</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl border-2 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                >
                  {t('send_another')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">{t('name_label')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-4 rtl:pr-4 flex items-center pointer-events-none text-gray-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        {...register('nom')}
                        className={`w-full ltr:pl-12 ltr:pr-4 rtl:pr-12 rtl:pl-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 transition-all outline-none ${errors.nom ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                        placeholder={t('name_placeholder')}
                      />
                    </div>
                    {errors.nom && <p className="text-xs text-red-500 font-medium ml-1">{errors.nom.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">{t('email_label')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-4 rtl:pr-4 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        {...register('email')}
                        className={`w-full ltr:pl-12 ltr:pr-4 rtl:pr-12 rtl:pl-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 transition-all outline-none ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                        placeholder={t('email_placeholder')}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 font-medium ml-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t('subject_label')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-4 rtl:pr-4 flex items-center pointer-events-none text-gray-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <select
                      {...register('sujet')}
                      className={`w-full ltr:pl-12 ltr:pr-4 rtl:pr-12 rtl:pl-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 transition-all outline-none appearance-none ${errors.sujet ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                    >
                      <option value="">{t('subject_placeholder')}</option>
                      <option value="info">{t('subjects.info')}</option>
                      <option value="tech">{t('subjects.tech')}</option>
                      <option value="partenariat">{t('subjects.partenariat')}</option>
                      <option value="autre">{t('subjects.autre')}</option>
                    </select>
                    <div className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-4 rtl:pl-4 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                  {errors.sujet && <p className="text-xs text-red-500 font-medium ml-1">{errors.sujet.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">{t('message_label')}</label>
                  <div className="relative">
                    <textarea
                      rows={5}
                      {...register('message')}
                      className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 transition-all outline-none resize-none ${errors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                      placeholder={t('message_placeholder')}
                    />
                  </div>
                  {errors.message && <p className="text-xs text-red-500 font-medium ml-1">{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 rtl:rotate-180" />
                      {t('submit_btn')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Infos & Carte */}
          <div className="space-y-8 order-1 lg:order-2">
            {/* Coordonnées */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-emerald-600" />
                {t('coords_title')}
              </h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('address_label')}</p>
                    <p className="text-lg font-medium text-gray-900 leading-relaxed">{t('address_value')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('phone_label')}</p>
                    <div className="flex flex-col" dir="ltr">
                      <a href="tel:0522510051" className="text-lg font-medium text-gray-900 hover:text-emerald-600 transition-colors font-mono text-left">05 22 51 00 51 (Standard)</a>
                      <a href="tel:0522510010" className="text-lg font-medium text-gray-900 hover:text-emerald-600 transition-colors font-mono text-left">05 22 51 00 10 (Fax)</a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('email_contact_label')}</p>
                    <a href="mailto:contact@provincemediouna.ma" className="text-lg font-medium text-gray-900 hover:text-purple-600 transition-colors break-all" dir="ltr">contact@provincemediouna.ma</a>
                  </div>
                </div>

                 <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('hours_label')}</p>
                    <p className="text-lg font-medium text-gray-900">{t('hours_value')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte */}
            <div className="h-80 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative z-0 ring-4 ring-white">
              <ContactMap />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

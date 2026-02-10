'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PermissionGuard } from '@/hooks/use-permission';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

// Schémas de validation
const profileSchema = z.object({
  prenom: z.string().min(2, 'Minimum 2 caractères'),
  nom: z.string().min(2, 'Minimum 2 caractères'),
  telephone: z
    .string()
    .regex(/^(\+212|0)[5-7]\d{8}$/, 'Format marocain invalide')
    .or(z.literal(''))
    .optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requis'),
  newPassword: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Une majuscule requise')
    .regex(/[a-z]/, 'Une minuscule requise')
    .regex(/[0-9]/, 'Un chiffre requis'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

interface UserProfile {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  photo: string | null;
  role: string;
  isEmailVerifie: boolean;
  dateInscription: string;
}

const tabs = [
  { id: 'infos', label: 'infos', icon: UserIcon },
  { id: 'security', label: 'security', icon: ShieldIcon },
  { id: 'notifications', label: 'notifications', icon: BellIcon },
];

export default function ProfilPage() {
  const t = useTranslations('profile_page');
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState('infos');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form pour les infos
  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  // Form pour le mot de passe
  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  // Charger le profil
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/users/me');
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          profileForm.reset({
            prenom: data.data.prenom,
            nom: data.data.nom,
            telephone: data.data.telephone || '',
          });
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session, profileForm]);

  // Message auto-hide
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Mettre à jour le profil
  const handleProfileSubmit = async (data: ProfileInput) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      
      if (result.success) {
        setProfile((prev) => prev ? { ...prev, ...result.data } : null);
        setMessage({ type: 'success', text: t('messages.success') });
        await updateSession();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch {
      setMessage({ type: 'error', text: t('messages.error_update') });
    } finally {
      setIsSaving(false);
    }
  };

  // Changer le mot de passe
  const handlePasswordSubmit = async (data: PasswordInput) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      
      if (result.success) {
        passwordForm.reset();
        setMessage({ type: 'success', text: t('messages.password_success') });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch {
      setMessage({ type: 'error', text: t('messages.error_update') });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('/api/users/me/photo', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      
      if (result.success) {
        setProfile((prev) => prev ? { ...prev, photo: result.data.photo } : null);
        setMessage({ type: 'success', text: t('photo.update_success') });
        await updateSession();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de l\'upload' });
    }
  };

  // Supprimer photo
  const handlePhotoDelete = async () => {
    try {
      const res = await fetch('/api/users/me/photo', { method: 'DELETE' });
      const result = await res.json();
      
      if (result.success) {
        setProfile((prev) => prev ? { ...prev, photo: null } : null);
        setMessage({ type: 'success', text: t('photo.delete_success') });
        await updateSession();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      CITOYEN: 'citizen',
      DELEGATION: 'delegation',
      AUTORITE_LOCALE: 'authority',
      COORDINATEUR_ACTIVITES: 'coordinator',
      ADMIN: 'admin',
      SUPER_ADMIN: 'super_admin',
      GOUVERNEUR: 'governor',
    };
    return t(`role_label.${labels[role] || role}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('subtitle')}</p>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-[hsl(145,63%,32%)]/10 border border-[hsl(145,63%,32%)]/30 text-[hsl(145,63%,32%)]' 
                  : 'bg-[hsl(348,83%,47%)]/10 border border-[hsl(348,83%,47%)]/30 text-[hsl(348,83%,47%)]'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="gov-card overflow-hidden">
          {/* Profile Header - Gouvernemental */}
          <div className="bg-gradient-to-r from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] px-6 py-8 md:px-10 md:py-12 relative">
            {/* Bande tricolore */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-xl transition-transform group-hover:scale-105">
                  {profile?.photo ? (
                    <OptimizedImage
                      src={profile.photo}
                      alt="Photo de profil"
                      type="profile"
                      fill
                      className="object-cover"
                      onError={() => {
                        if (profile) setProfile({ ...profile, photo: null });
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {profile?.prenom?.charAt(0)}{profile?.nom?.charAt(0)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10 cursor-pointer"
                >
                  <CameraIcon className="w-4 h-4 text-gray-600" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Info */}
              <div className="text-white">
                <h2 className="text-2xl font-bold">{profile?.prenom} {profile?.nom}</h2>
                <p className="text-white/80">{profile?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-[hsl(45,93%,47%)] text-gray-900 rounded-full text-sm font-medium">
                  {getRoleLabel(profile?.role || '')}
                </span>
              </div>

              {profile?.photo && (
                <button
                  onClick={handlePhotoDelete}
                  className="ml-auto text-white/80 hover:text-white text-sm underline"
                >
                  {t('photo.delete_btn')}
                </button>
              )}
            </div>
            
            {/* Lien rapide vers les abonnements */}
            <PermissionGuard permission="etablissements.subscribe">
              <div className="mt-4 pt-4 border-t border-white/20">
                <Link
                  href="/profil/abonnements"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  <HeartIcon className="w-4 h-4" />
                  <span>{t('subscriptions_btn')}</span>
                </Link>
              </div>
            </PermissionGuard>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[hsl(213,80%,28%)] text-[hsl(213,80%,28%)]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {t(`tabs.${tab.label}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Informations Tab */}
              {activeTab === 'infos' && (
                <motion.form
                  key="infos"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                  className="space-y-6"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.firstname')}</label>
                      <input
                        {...profileForm.register('prenom')}
                        className="gov-input"
                      />
                      {profileForm.formState.errors.prenom && (
                        <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.prenom.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.lastname')}</label>
                      <input
                        {...profileForm.register('nom')}
                        className="gov-input"
                      />
                      {profileForm.formState.errors.nom && (
                        <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.nom.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.email')}</label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-400">{t('form.email_hint')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.phone')}</label>
                    <input
                      {...profileForm.register('telephone')}
                      placeholder={t('form.phone_placeholder')}
                      className="gov-input"
                    />
                    {profileForm.formState.errors.telephone && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.telephone.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="gov-btn gov-btn-primary"
                    >
                      {isSaving ? t('form.saving') : t('form.save_btn')}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.form
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
                  className="space-y-6 max-w-md"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{t('form.change_password_title')}</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.current_password')}</label>
                    <input
                      type="password"
                      {...passwordForm.register('currentPassword')}
                      className="gov-input"
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.new_password')}</label>
                    <input
                      type="password"
                      {...passwordForm.register('newPassword')}
                      className="gov-input"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.confirm_password')}</label>
                    <input
                      type="password"
                      {...passwordForm.register('confirmPassword')}
                      className="gov-input"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="gov-btn gov-btn-primary"
                  >
                    {isSaving ? t('form.changing') : t('form.change_password_btn')}
                  </button>
                </motion.form>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{t('notifications.title')}</h3>
                  
                  <div className="space-y-4">
                    {[
                      { id: 'email_reclamations', label: t('notifications.reclamations'), description: t('notifications.reclamations_desc') },
                      { id: 'email_evenements', label: t('notifications.events'), description: t('notifications.events_desc') },
                      { id: 'email_actualites', label: t('notifications.news'), description: t('notifications.news_desc') },
                    ].map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                        <input
                          type="checkbox"
                          id={item.id}
                          defaultChecked
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-[hsl(213,80%,28%)] focus:ring-[hsl(213,80%,28%)]"
                        />
                        <label htmlFor={item.id} className="flex-1 cursor-pointer">
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </label>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="gov-btn gov-btn-primary"
                  >
                    {t('notifications.save_btn')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

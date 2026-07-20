'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Lock, Shield, Building2, Loader2, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { GovInput, GovSelect, GovButton, GovModal } from '@/components/ui';
import { cn } from '@/lib/utils';
import { z } from 'zod';

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// SECURITY FIX: Hiérarchie des niveaux de rôle
const ROLE_LEVEL: Record<string, number> = {
  CITOYEN: 1,
  DELEGATION: 2,
  COORDINATEUR_ACTIVITES: 3,
  AUTORITE_LOCALE: 4,
  ADMIN: 5,
  GOUVERNEUR: 6,
  SUPER_ADMIN: 7,
};

const ALL_ROLES = [
  { value: 'CITOYEN' },
  { value: 'DELEGATION' },
  { value: 'AUTORITE_LOCALE' },
  { value: 'COORDINATEUR_ACTIVITES' },
  { value: 'ADMIN' },
  { value: 'GOUVERNEUR' },
];

const SECTEURS = [
  'EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL'
];

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const t = useTranslations('admin.users_page.create_modal');
  const tRoles = useTranslations('admin.users_page.role_descriptions');
  const tRolesMain = useTranslations('admin.users_page.roles');
  const tSectors = useTranslations('admin.users_page.sectors');
  const locale = useLocale();
  const { data: currentSession } = useSession();

  // SECURITY FIX: Filtrer les rôles disponibles selon le niveau du caller
  const callerLevel = ROLE_LEVEL[currentSession?.user?.role ?? ''] ?? 0;
  const ROLES = ALL_ROLES.filter(role => ROLE_LEVEL[role.value] < callerLevel);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmMotDePasse: '',
    role: 'CITOYEN',
    secteurResponsable: '',
    communeResponsableId: '',
    etablissementsGeres: [] as number[],
    isActive: true,
  });
  const [communes, setCommunes] = useState<{ id: number; nom: string; nomArabe?: string }[]>([]);
  const [etablissements, setEtablissements] = useState<{ id: number; nom: string; nomArabe?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Charger les communes et établissements
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [communesRes, etabRes] = await Promise.all([
          fetch('/api/communes?limit=100'),
          fetch('/api/etablissements?limit=100'),
        ]);
        
        if (communesRes.ok) {
          const data = await communesRes.json();
          const rawCommunes = data.communes || data.data || [];
          setCommunes(Array.isArray(rawCommunes) ? rawCommunes : (Array.isArray(rawCommunes.data) ? rawCommunes.data : []));
        }
        if (etabRes.ok) {
          const data = await etabRes.json();
          const rawEtabs = data.etablissements || data.data || [];
          setEtablissements(Array.isArray(rawEtabs) ? rawEtabs : (Array.isArray(rawEtabs.data) ? rawEtabs.data : []));
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const validationSchema = z.object({
      prenom: z.string().min(1, t('errors.required') || 'Requis'),
      nom: z.string().min(1, t('errors.required') || 'Requis'),
      email: z.string().email(t('errors.invalid_email') || 'Email invalide'),
      telephone: z.string().optional(),
      motDePasse: z.string().min(6, t('errors.password_length') || '6 caractères min'),
      confirmMotDePasse: z.string(),
      role: z.string().min(1, t('errors.role_required') || 'Requis'),
      secteurResponsable: z.string().optional(),
      communeResponsableId: z.string().optional(),
      etablissementsGeres: z.array(z.number()),
      isActive: z.boolean()
    }).superRefine((data, ctx) => {
      if (data.motDePasse !== data.confirmMotDePasse) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['confirmMotDePasse'],
          message: t('errors.password_mismatch') || 'Mots de passe différents',
        });
      }
      if (data.role === 'DELEGATION' && !data.secteurResponsable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['secteurResponsable'],
          message: t('errors.sector_required') || 'Secteur requis',
        });
      }
      if (data.role === 'AUTORITE_LOCALE' && !data.communeResponsableId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['communeResponsableId'],
          message: t('errors.commune_required') || 'Commune requise',
        });
      }
      if (data.role === 'COORDINATEUR_ACTIVITES' && data.etablissementsGeres.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['etablissementsGeres'],
          message: t('errors.establishment_required') || 'Etablissement requis',
        });
      }
    });

    const parsed = validationSchema.safeParse(formData);
    if (!parsed.success) {
      const formattedErrors = parsed.error.flatten().fieldErrors;
      setFieldErrors(formattedErrors as Record<string, string[]>);
      setError(t('errors.create_error') || 'Erreur de validation');
      return;
    }

    setLoading(true);

    const submitPromise = fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone || null,
        motDePasse: formData.motDePasse,
        role: formData.role,
        secteurResponsable: formData.secteurResponsable || null,
        communeResponsableId: formData.communeResponsableId ? parseInt(formData.communeResponsableId) : null,
        etablissementsGeres: formData.etablissementsGeres,
        isActive: formData.isActive,
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.fieldErrors) {
          setFieldErrors(data.error.fieldErrors);
        }
        if (data.error?.field) {
          setFieldErrors(prev => ({
            ...prev,
            [data.error.field]: [data.error.message]
          }));
        }
        throw new Error(data.error?.message || t('errors.create_error'));
      }
      onSuccess();
      return data;
    }).finally(() => {
      setLoading(false);
    });

    toast.promise(submitPromise, {
      loading: 'Création en cours...',
      success: t('success', { name: `${formData.prenom} ${formData.nom}` }),
      error: (err: any) => err.message,
    });
  };

  const toggleEtablissement = (id: number) => {
    setFormData(prev => ({
      ...prev,
      etablissementsGeres: prev.etablissementsGeres.includes(id)
        ? prev.etablissementsGeres.filter(e => e !== id)
        : [...prev.etablissementsGeres, id]
    }));
  };

  return (
    <GovModal
      isOpen={true}
      onClose={onClose}
      title={t('title')}
      subtitle={t('subtitle')}
      icon={<User size={24} />}
      maxWidth="2xl"
      footer={
        <div className="flex w-full items-center justify-end gap-4">
          <GovButton
            type="button"
            onClick={onClose}
            variant="outline"
            className="h-12 px-8"
          >
            {t('cancel_btn')}
          </GovButton>
          <GovButton
            type="submit"
            form="create-user-form"
            loading={loading}
            className="h-12 px-10"
          >
            {t('submit_btn')}
          </GovButton>
        </div>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GovInput
              label={t('fields.first_name') + ' *'}
              required
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              placeholder={t('placeholders.first_name')}
              leftIcon={<User size={18} />}
              error={fieldErrors.prenom?.[0]}
            />

            <GovInput
              label={t('fields.last_name') + ' *'}
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder={t('placeholders.last_name')}
              leftIcon={<User size={18} />}
              error={fieldErrors.nom?.[0]}
            />

            <GovInput
              label={t('fields.email') + ' *'}
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('placeholders.email')}
              leftIcon={<Mail size={18} />}
              error={fieldErrors.email?.[0]}
            />

            <GovInput
              label={t('fields.phone')}
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder={t('placeholders.phone')}
              leftIcon={<Phone size={18} />}
              error={fieldErrors.telephone?.[0]}
            />

            <GovInput
              label={t('fields.password') + ' *'}
              type="password"
              required
              value={formData.motDePasse}
              onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
              placeholder={t('placeholders.password')}
              leftIcon={<Lock size={18} />}
              error={fieldErrors.motDePasse?.[0]}
            />

            <GovInput
              label={t('fields.confirm_password') + ' *'}
              type="password"
              required
              value={formData.confirmMotDePasse}
              onChange={(e) => setFormData({ ...formData, confirmMotDePasse: e.target.value })}
              placeholder={t('placeholders.password')}
              leftIcon={<Lock size={18} />}
              error={fieldErrors.confirmMotDePasse?.[0]}
            />

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 mb-2">
                {t('fields.role')} *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.role === role.value
                        ? 'border-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue)/0.05)] shadow-md shadow-[hsl(var(--gov-blue)/0.1)]'
                        : 'border-border bg-muted/20 hover:border-border/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value, communeResponsableId: '', etablissementsGeres: [] })}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      formData.role === role.value ? "bg-[hsl(var(--gov-blue))] text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {role.value === 'COORDINATEUR_ACTIVITES' ? (
                        <Calendar size={20} />
                      ) : (
                        <Shield size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-foreground uppercase tracking-tight text-xs">{tRolesMain(role.value)}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 line-clamp-1">{tRoles(role.value)}</p>
                    </div>
                  </label>
                ))}
              </div>
              {fieldErrors.role && (
                <div className="flex items-center gap-1.5 px-1 mt-2 text-red-500">
                  <AlertCircle size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{fieldErrors.role[0]}</span>
                </div>
              )}
            </div>

            {/* Secteur (pour DELEGATION) */}
            {formData.role === 'DELEGATION' && (
              <div className="md:col-span-2">
                <GovSelect
                  label={t('fields.sector') + ' *'}
                  required
                  value={formData.secteurResponsable}
                  onChange={(e) => setFormData({ ...formData, secteurResponsable: e.target.value })}
                  options={[
                    { label: t('select_option.sector'), value: '' },
                    ...SECTEURS.map(s => ({ label: tSectors(s), value: s }))
                  ]}
                  leftIcon={<Shield size={18} />}
                  error={fieldErrors.secteurResponsable?.[0]}
                />
              </div>
            )}

            {/* Commune (pour AUTORITE_LOCALE) */}
            {formData.role === 'AUTORITE_LOCALE' && (
              <div className="md:col-span-2">
                <GovSelect
                  label={t('fields.commune') + ' *'}
                  required
                  value={formData.communeResponsableId}
                  onChange={(e) => setFormData({ ...formData, communeResponsableId: e.target.value })}
                  options={[
                    { label: t('select_option.commune'), value: '' },
                    ...communes.map(c => ({ 
                      label: locale === 'ar' ? (c.nomArabe || c.nom) : c.nom, 
                      value: c.id 
                    }))
                  ]}
                  leftIcon={<MapPin size={18} />}
                  error={fieldErrors.communeResponsableId?.[0]}
                />
                <p className="mt-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 opacity-60">
                  {t('helpers.commune_helper')}
                </p>
              </div>
            )}

            {/* Établissements (pour COORDINATEUR_ACTIVITES) */}
            {formData.role === 'COORDINATEUR_ACTIVITES' && (
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 mb-2">
                   {t('fields.establishments', { count: formData.etablissementsGeres.length })} *
                </label>
                <div className="max-h-48 overflow-y-auto border border-border bg-muted/20 rounded-2xl p-3 space-y-1 custom-scrollbar">
                  {!Array.isArray(etablissements) || etablissements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{t('loading_establishments')}</p>
                    </div>
                  ) : (
                    etablissements.map((etab) => (
                      <label
                        key={etab.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent",
                          formData.etablissementsGeres.includes(etab.id)
                            ? 'bg-[hsl(var(--gov-blue)/0.1)] border-[hsl(var(--gov-blue)/0.2)]'
                            : 'hover:bg-muted/40'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={formData.etablissementsGeres.includes(etab.id)}
                          onChange={() => toggleEtablissement(etab.id)}
                          className="w-4 h-4 rounded border-border text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))]"
                        />
                        <Building2 className={cn("w-4 h-4", formData.etablissementsGeres.includes(etab.id) ? "text-[hsl(var(--gov-blue))]" : "text-muted-foreground")} />
                        <span className={cn("text-xs font-bold uppercase tracking-tight", formData.etablissementsGeres.includes(etab.id) ? "text-foreground" : "text-muted-foreground")}>
                          {locale === 'ar' ? (etab.nomArabe || etab.nom) : etab.nom}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {fieldErrors.etablissementsGeres && (
                  <div className="flex items-center gap-1.5 px-1 mt-2 text-red-500">
                    <AlertCircle size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{fieldErrors.etablissementsGeres[0]}</span>
                  </div>
                )}
                <p className="mt-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 opacity-60">
                  {t('helpers.establishments_helper')}
                </p>
              </div>
            )}

            {/* Statut actif */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-6 h-6 rounded-lg border-border text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))/0.2] transition-all cursor-pointer"
                  />
                </div>
                <span className="text-xs font-black text-foreground uppercase tracking-widest group-hover:text-[hsl(var(--gov-blue))] transition-colors">
                  {t('fields.active_account')}
                </span>
              </label>
            </div>
          </div>
      </form>
    </GovModal>
  );
}

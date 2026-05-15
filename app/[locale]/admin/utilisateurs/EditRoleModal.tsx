'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Building2, Loader2, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { GovSelect, GovButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  secteurResponsable: string | null;
  communeResponsableId: number | null;
  etablissementsGeres?: number[];
}

interface EditRoleModalProps {
  user: User;
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

export default function EditRoleModal({ user, onClose, onSuccess }: EditRoleModalProps) {
  const t = useTranslations('admin.users_page.edit_role_modal');
  const tRoles = useTranslations('admin.users_page.role_descriptions');
  const tRolesMain = useTranslations('admin.users_page.roles');
  const tSectors = useTranslations('admin.users_page.sectors');
  const tCreate = useTranslations('admin.users_page.create_modal');
  const locale = useLocale();
  const { data: currentSession } = useSession();

  // SECURITY FIX: Filtrer les rôles disponibles selon le niveau du caller
  const callerLevel = ROLE_LEVEL[currentSession?.user?.role ?? ''] ?? 0;
  const ROLES = ALL_ROLES.filter(role => ROLE_LEVEL[role.value] < callerLevel);

  const [selectedRole, setSelectedRole] = useState(user.role);
  const [secteurResponsable, setSecteurResponsable] = useState(user.secteurResponsable || '');
  const [communeResponsableId, setCommuneResponsableId] = useState(user.communeResponsableId?.toString() || '');
  const [etablissementsGeres, setEtablissementsGeres] = useState<number[]>(user.etablissementsGeres || []);
  const [communes, setCommunes] = useState<{ id: number; nom: string; nomArabe?: string }[]>([]);
  const [etablissements, setEtablissements] = useState<{ id: number; nom: string; nomArabe?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          setCommunes(data.communes || data.data || []);
        }
        if (etabRes.ok) {
          const data = await etabRes.json();
          setEtablissements(data.etablissements || data.data || []);
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

    if (selectedRole === 'DELEGATION' && !secteurResponsable) {
      setError(t('errors.sector_required'));
      return;
    }

    if (selectedRole === 'AUTORITE_LOCALE' && !communeResponsableId) {
      setError(t('errors.commune_required'));
      return;
    }

    if (selectedRole === 'COORDINATEUR_ACTIVITES' && etablissementsGeres.length === 0) {
      setError(t('errors.establishment_required'));
      return;
    }

    setLoading(true);

    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/users/${user.id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: selectedRole,
            secteurResponsable: selectedRole === 'DELEGATION' ? secteurResponsable : null,
            communeResponsableId: selectedRole === 'AUTORITE_LOCALE' ? parseInt(communeResponsableId) : null,
            etablissementsGeres: selectedRole === 'COORDINATEUR_ACTIVITES' ? etablissementsGeres : [],
          }),
        });

        const data = await res.json();

        if (res.ok) {
          onSuccess();
          resolve(data);
        } else {
          const errorMessage = typeof data.error === 'string' 
            ? data.error 
            : data.error?.message || t('errors.edit_error');
          reject(new Error(errorMessage));
        }
      } catch (err) {
        reject(new Error(t('errors.server_error')));
      } finally {
        setLoading(false);
      }
    });

    toast.promise(submitPromise, {
      loading: 'Mise à jour en cours...',
      success: t('success', { name: `${user.prenom} ${user.nom}` }),
      error: (err: any) => err.message,
    });
  };

  const toggleEtablissement = (id: number) => {
    setEtablissementsGeres(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-border"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex items-center justify-between shrink-0 bg-gradient-to-br from-card/50 to-muted/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">{t('title')}</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {user.prenom} {user.nom} • {user.email}
              </p>
            </div>
          </div>
          <GovButton
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <X size={20} />
          </GovButton>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Current Role */}
          <div className="mb-8 p-5 bg-gradient-to-br from-muted/30 to-muted/10 border border-border rounded-2xl shadow-sm">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{t('current_role')}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gov-blue)/0.1)] flex items-center justify-center text-[hsl(var(--gov-blue))]">
                <Shield size={20} />
              </div>
              <p className="text-sm font-black text-foreground uppercase tracking-tight">
                {tRolesMain(user.role)}
              </p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 mb-4">
              {t('new_role')}
            </label>
            <div className="space-y-3">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className={cn(
                    "relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                    selectedRole === role.value
                      ? "border-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue)/0.05)] shadow-md shadow-[hsl(var(--gov-blue)/0.1)]"
                      : "border-border bg-muted/20 hover:border-border/80"
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                    selectedRole === role.value ? "bg-[hsl(var(--gov-blue))] text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {role.value === 'COORDINATEUR_ACTIVITES' ? (
                      <Calendar size={24} />
                    ) : (
                      <Shield size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-foreground uppercase tracking-tight">{tRolesMain(role.value)}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{tRoles(role.value)}</p>
                  </div>
                  {selectedRole === role.value && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-[hsl(var(--gov-blue))] rounded-full flex items-center justify-center shadow-lg"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Secteur (pour DELEGATION) */}
          {selectedRole === 'DELEGATION' && (
            <div className="mb-8">
              <GovSelect
                label={tCreate('fields.sector') + ' *'}
                required
                value={secteurResponsable}
                onChange={(e) => setSecteurResponsable(e.target.value)}
                options={[
                  { label: tCreate('select_option.sector'), value: '' },
                  ...SECTEURS.map(s => ({ label: tSectors(s), value: s }))
                ]}
                leftIcon={<Shield size={18} />}
              />
            </div>
          )}

          {/* Commune (pour AUTORITE_LOCALE) */}
          {selectedRole === 'AUTORITE_LOCALE' && (
            <div className="mb-8">
              <GovSelect
                label={tCreate('fields.commune') + ' *'}
                required
                value={communeResponsableId}
                onChange={(e) => setCommuneResponsableId(e.target.value)}
                options={[
                  { label: tCreate('select_option.commune'), value: '' },
                  ...communes.map(c => ({ 
                    label: locale === 'ar' ? (c.nomArabe || c.nom) : c.nom, 
                    value: c.id 
                  }))
                ]}
                leftIcon={<MapPin size={18} />}
              />
            </div>
          )}

          {/* Établissements (pour COORDINATEUR_ACTIVITES) */}
          {selectedRole === 'COORDINATEUR_ACTIVITES' && (
            <div className="mb-8">
              <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 mb-4">
                 {tCreate('fields.establishments', { count: etablissementsGeres.length })} *
              </label>
              <div className="max-h-60 overflow-y-auto border border-border bg-muted/20 rounded-[1.5rem] p-3 space-y-1 custom-scrollbar shadow-inner">
                {etablissements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{t('loading')}</p>
                  </div>
                ) : (
                  etablissements.map((etab) => (
                    <label
                      key={etab.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent",
                        etablissementsGeres.includes(etab.id)
                          ? "bg-[hsl(var(--gov-blue)/0.1)] border-[hsl(var(--gov-blue)/0.2)] shadow-sm"
                          : "hover:bg-muted/40"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={etablissementsGeres.includes(etab.id)}
                        onChange={() => toggleEtablissement(etab.id)}
                        className="w-5 h-5 rounded-lg border-border text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))/0.2]"
                      />
                      <Building2 className={cn("w-4 h-4", etablissementsGeres.includes(etab.id) ? "text-[hsl(var(--gov-blue))]" : "text-muted-foreground")} />
                      <span className={cn(
                        "text-xs font-black uppercase tracking-tight",
                        etablissementsGeres.includes(etab.id) ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {locale === 'ar' ? (etab.nomArabe || etab.nom) : etab.nom}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-8 border-t border-border shrink-0">
            <GovButton
              type="button"
              onClick={onClose}
              variant="outline"
              className="h-12 px-8"
            >
              {tCreate('cancel_btn')}
            </GovButton>
            <GovButton
              type="submit"
              loading={loading}
              className="h-12 px-10"
            >
              {t('submit_btn')}
            </GovButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Building2, Loader2, MapPin, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

const ROLES = [
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

  const [selectedRole, setSelectedRole] = useState(user.role);
  const [secteurResponsable, setSecteurResponsable] = useState(user.secteurResponsable || '');
  const [communeResponsableId, setCommuneResponsableId] = useState(user.communeResponsableId?.toString() || '');
  const [etablissementsGeres, setEtablissementsGeres] = useState<number[]>(user.etablissementsGeres || []);
  const [communes, setCommunes] = useState<{ id: number; nom: string }[]>([]);
  const [etablissements, setEtablissements] = useState<{ id: number; nom: string }[]>([]);
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
      } else {
        setError(data.error || t('errors.edit_error'));
      }
    } catch (err) {
      setError(t('errors.server_error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleEtablissement = (id: number) => {
    setEtablissementsGeres(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h2>
            <p className="text-sm text-gray-500">
              {user.prenom} {user.nom} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Current Role */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">{t('current_role')}</p>
            <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Shield size={16} className="text-emerald-500" />
              {tRolesMain(user.role)}
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('new_role')}
            </label>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedRole === role.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="sr-only"
                  />
                  {role.value === 'COORDINATEUR_ACTIVITES' ? (
                    <Calendar className={`w-5 h-5 ${selectedRole === role.value ? 'text-emerald-500' : 'text-gray-400'}`} />
                  ) : (
                    <Shield className={`w-5 h-5 ${selectedRole === role.value ? 'text-emerald-500' : 'text-gray-400'}`} />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{tRolesMain(role.value)}</p>
                    <p className="text-sm text-gray-500">{tRoles(role.value)}</p>
                  </div>
                  {selectedRole === role.value && (
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Secteur (pour DELEGATION) */}
          {selectedRole === 'DELEGATION' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 {tCreate('fields.sector')} *
              </label>
              <select
                required
                value={secteurResponsable}
                onChange={(e) => setSecteurResponsable(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{tCreate('select_option.sector')}</option>
                {SECTEURS.map((s) => (
                  <option key={s} value={s}>{tSectors(s)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Commune (pour AUTORITE_LOCALE) */}
          {selectedRole === 'AUTORITE_LOCALE' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 {tCreate('fields.commune')} *
              </label>
              <div className="relative">
                <MapPin className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  required
                  value={communeResponsableId}
                  onChange={(e) => setCommuneResponsableId(e.target.value)}
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{tCreate('select_option.commune')}</option>
                  {communes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Établissements (pour COORDINATEUR_ACTIVITES) */}
          {selectedRole === 'COORDINATEUR_ACTIVITES' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 {tCreate('fields.establishments', { count: etablissementsGeres.length })} *
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl p-2 space-y-1">
                {etablissements.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2">{t('loading')}</p>
                ) : (
                  etablissements.map((etab) => (
                    <label
                      key={etab.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        etablissementsGeres.includes(etab.id)
                          ? 'bg-emerald-50 dark:bg-emerald-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={etablissementsGeres.includes(etab.id)}
                        onChange={() => toggleEtablissement(etab.id)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{etab.nom}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {tCreate('cancel_btn')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('submit_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

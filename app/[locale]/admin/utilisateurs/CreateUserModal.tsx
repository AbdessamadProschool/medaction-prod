'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Lock, Shield, Building2, Loader2, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface CreateUserModalProps {
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

export default function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const t = useTranslations('admin.users_page.create_modal');
  const tRoles = useTranslations('admin.users_page.role_descriptions');
  const tRolesMain = useTranslations('admin.users_page.roles');
  const tSectors = useTranslations('admin.users_page.sectors');

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

    // Validation
    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError(t('errors.password_mismatch'));
      return;
    }

    if (formData.motDePasse.length < 6) {
      setError(t('errors.password_length'));
      return;
    }

    if (formData.role === 'DELEGATION' && !formData.secteurResponsable) {
      setError(t('errors.sector_required'));
      return;
    }

    if (formData.role === 'AUTORITE_LOCALE' && !formData.communeResponsableId) {
      setError(t('errors.commune_required'));
      return;
    }

    if (formData.role === 'COORDINATEUR_ACTIVITES' && formData.etablissementsGeres.length === 0) {
      setError(t('errors.establishment_required'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/users', {
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
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(t('success', { name: `${formData.prenom} ${formData.nom}` }));
        onSuccess();
      } else {
        setError(data.error || t('errors.create_error'));
        toast.error(data.error || t('errors.create_error'));
      }
    } catch (err) {
      setError(t('errors.server_error'));
      toast.error(t('errors.server_error'));
    } finally {
      setLoading(false);
    }
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h2>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fields.first_name')} *
              </label>
              <div className="relative">
                <User className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('placeholders.first_name')}
                />
              </div>
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fields.last_name')} *
              </label>
              <div className="relative">
                <User className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('placeholders.last_name')}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fields.email')} *
              </label>
              <div className="relative">
                <Mail className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('placeholders.email')}
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fields.phone')}
              </label>
              <div className="relative">
                <Phone className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('placeholders.phone')}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fields.password')} *
              </label>
              <div className="relative">
                <Lock className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.motDePasse}
                  onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('placeholders.password')}
                />
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fields.confirm_password')} *
              </label>
              <div className="relative">
                <Lock className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.confirmMotDePasse}
                  onChange={(e) => setFormData({ ...formData, confirmMotDePasse: e.target.value })}
                  className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={t('placeholders.password')}
                />
              </div>
            </div>

            {/* Rôle */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fields.role')} *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.role === role.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
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
                    {role.value === 'COORDINATEUR_ACTIVITES' ? (
                      <Calendar className={`w-5 h-5 ${formData.role === role.value ? 'text-emerald-500' : 'text-gray-400'}`} />
                    ) : (
                      <Shield className={`w-5 h-5 ${formData.role === role.value ? 'text-emerald-500' : 'text-gray-400'}`} />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{tRolesMain(role.value)}</p>
                      <p className="text-xs text-gray-500">{tRoles(role.value)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Secteur (pour DELEGATION) */}
            {formData.role === 'DELEGATION' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   {t('fields.sector')} *
                </label>
                <select
                  required
                  value={formData.secteurResponsable}
                  onChange={(e) => setFormData({ ...formData, secteurResponsable: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('select_option.sector')}</option>
                  {SECTEURS.map((s) => (
                    <option key={s} value={s}>{tSectors(s)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Commune (pour AUTORITE_LOCALE) */}
            {formData.role === 'AUTORITE_LOCALE' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   {t('fields.commune')} *
                </label>
                <div className="relative">
                  <MapPin className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    required
                    value={formData.communeResponsableId}
                    onChange={(e) => setFormData({ ...formData, communeResponsableId: e.target.value })}
                    className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">{t('select_option.commune')}</option>
                    {communes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t('helpers.commune_helper')}
                </p>
              </div>
            )}

            {/* Établissements (pour COORDINATEUR_ACTIVITES) */}
            {formData.role === 'COORDINATEUR_ACTIVITES' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   {t('fields.establishments', { count: formData.etablissementsGeres.length })} *
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl p-2 space-y-1">
                  {etablissements.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">{t('loading_establishments')}</p>
                  ) : (
                    etablissements.map((etab) => (
                      <label
                        key={etab.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          formData.etablissementsGeres.includes(etab.id)
                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.etablissementsGeres.includes(etab.id)}
                          onChange={() => toggleEtablissement(etab.id)}
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{etab.nom}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t('helpers.establishments_helper')}
                </p>
              </div>
            )}

            {/* Statut actif */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('fields.active_account')}
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {t('cancel_btn')}
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

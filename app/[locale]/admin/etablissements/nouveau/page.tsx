'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ChevronLeft, 
  Save, 
  Loader2,
  Trash2,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NouveauEtablissementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    secteur: 'EDUCATION',
    communeId: '',
    annexeId: '',
    adresse: '',
    telephone: '',
    email: '',
    siteWeb: '',
    latitude: '',
    longitude: '',
    description: '',
    capacite: '',
    isPublie: false,
    isValide: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/etablissements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          communeId: formData.communeId ? parseInt(formData.communeId) : null,
          capacite: formData.capacite ? parseInt(formData.capacite) : null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('Établissement créé avec succès');
        router.push('/admin/etablissements');
      } else {
        // Afficher les erreurs détaillées du système de validation
        const errorInfo = data.error || data;
        
        // Si des détails de champs sont disponibles, afficher chaque erreur
        if (errorInfo.details && Array.isArray(errorInfo.details)) {
          errorInfo.details.forEach((detail: { field: string; message: string }) => {
            toast.error(detail.message, { 
              description: `Champ: ${detail.field}`,
              duration: 5000 
            });
          });
        } else if (errorInfo.fieldErrors) {
          // Format fieldErrors: { field: [messages] }
          Object.entries(errorInfo.fieldErrors).forEach(([field, messages]) => {
            (messages as string[]).forEach(msg => {
              toast.error(msg, { 
                description: `Champ: ${field}`,
                duration: 5000 
              });
            });
          });
        } else {
          // Message d'erreur simple
          toast.error(errorInfo.message || 'Une erreur est survenue lors de la création');
        }
      }
    } catch (err) {
      console.error('Erreur création établissement:', err);
      toast.error('Erreur de connexion au serveur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link 
        href="/admin/etablissements" 
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors mb-6"
      >
        <ChevronLeft size={20} />
        Retour à la liste
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Nouvel Établissement</h1>
              <p className="text-emerald-50 opacity-90">Remplissez les informations pour créer un nouvel établissement</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Informations Générales */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              Informations Générales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom de l'établissement *</label>
                <input
                  required
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                  placeholder="Ex: École Primaire Ibn Khaldoun"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Code Identifiant *</label>
                <input
                  required
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                  placeholder="Ex: EP-IK-001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Secteur *</label>
                <select
                  value={formData.secteur}
                  onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                >
                  <option value="EDUCATION">Éducation</option>
                  <option value="SANTE">Santé</option>
                  <option value="SPORT">Sport</option>
                  <option value="SOCIAL">Social</option>
                  <option value="CULTUREL">Culturel</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacité d'accueil</label>
                <input
                  type="number"
                  value={formData.capacite}
                  onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                  placeholder="Nombre de places"
                />
              </div>
            </div>
          </section>

          {/* Localisation */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
              Localisation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Commune *</label>
                <select
                  required
                  value={formData.communeId}
                  onChange={(e) => setFormData({ ...formData, communeId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                >
                  <option value="">Sélectionner une commune</option>
                  <option value="1">Médiouna</option>
                  <option value="2">Tit Mellil</option>
                  <option value="3">Lahraouyine</option>
                  <option value="4">Sidi Hajjaj Oued Hassar</option>
                  <option value="5">Mejatia Oulad Taleb</option>
                  <option value="6">Al Majat</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Adresse complète</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                  placeholder="N°, Rue, Quartier..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                  placeholder="Ex: 33.4509"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                  placeholder="Ex: -7.5098"
                />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
              Contact et Web
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                  placeholder="contact@exemple.ma"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                  placeholder="+212 5..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Site Web</label>
                <input
                  type="url"
                  value={formData.siteWeb}
                  onChange={(e) => setFormData({ ...formData, siteWeb: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
              Description
            </h2>
            <div className="space-y-2">
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all resize-none"
                placeholder="Décrivez l'établissement, sa mission, ses services..."
              />
            </div>
          </section>

          {/* Options */}
          <section className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isPublie}
                onChange={(e) => setFormData({ ...formData, isPublie: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 transition-colors">Publier immédiatement sur le portail citoyen</span>
            </label>
          </section>

          {/* Footer Actions */}
          <div className="pt-8 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              Enregistrer l'établissement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

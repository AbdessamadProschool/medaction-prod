'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  MapPin, 
  Clock,
  AlignLeft, 
  Image as ImageIcon, 
  Save, 
  X, 
  Building2,
  Tag,
  Loader2,
  Users,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  User,
  Link as LinkIcon,
  Globe
} from 'lucide-react';
import Link from 'next/link';

// Schéma de validation complet
const eventSchema = z.object({
  titre: z.string().min(5, 'Le titre doit faire au moins 5 caractères').max(100),
  description: z.string().min(20, 'La description doit faire au moins 20 caractères').max(2000),
  etablissementId: z.string().min(1, 'Veuillez sélectionner un établissement'),
  typeCategorique: z.string().min(1, 'Type requis'),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().optional(),
  heureDebut: z.string().optional(),
  heureFin: z.string().optional(),
  lieu: z.string().optional(),
  adresse: z.string().optional(),
  quartierDouar: z.string().optional(),
  capaciteMax: z.string().optional(),
  // Organisateur
  organisateur: z.string().optional(),
  contactOrganisateur: z.string().optional(),
  emailContact: z.string().email('Email invalide').optional().or(z.literal('')),
  // Inscription
  inscriptionsOuvertes: z.boolean().optional(),
  lienInscription: z.string().url('Lien invalide').optional().or(z.literal('')),
  // Tags
  tags: z.string().optional(),
});

type EventForm = z.infer<typeof eventSchema>;

export default function NouveauEventPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [etablissements, setEtablissements] = useState<{id: number, nom: string, secteur?: string}[]>([]);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      inscriptionsOuvertes: false
    }
  });

  const watchedType = watch('typeCategorique');
  const watchedInscriptions = watch('inscriptionsOuvertes');

  useEffect(() => {
    const fetchEtablissements = async () => {
      try {
        let url = '/api/etablissements?limit=100';
        
        if (session?.user?.secteurResponsable) {
          url += `&secteur=${session.user.secteurResponsable}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        if (data.data) {
          setEtablissements(data.data);
        }
      } catch (error) {
        console.error("Erreur chargement établissements", error);
      }
    };

    if (session?.user) {
      fetchEtablissements();
    }
  }, [session]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    try {
      let imageUrl = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'evenements');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Erreur lors de l'upload de l'image");
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // Parse tags
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      const res = await fetch('/api/admin/evenements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...data,
            etablissementId: parseInt(data.etablissementId),
            capaciteMax: data.capaciteMax ? parseInt(data.capaciteMax) : null,
            tags: tagsArray,
            imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        router.push('/admin/evenements');
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Erreur serveur'));
    } finally {
      setLoading(false);
    }
  };

  const typeColors: Record<string, string> = {
    CULTUREL: 'from-purple-500 to-pink-500',
    SPORTIF: 'from-green-500 to-emerald-500',
    SOCIAL: 'from-orange-500 to-amber-500',
    EDUCATIF: 'from-blue-500 to-cyan-500',
    SANTE: 'from-red-500 to-red-600',
    AUTRE: 'from-gray-500 to-gray-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/evenements"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Retour aux événements</span>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                Nouvel Événement
              </h1>
              <p className="text-gray-500">
                Créez un événement complet pour informer et mobiliser les citoyens.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Image de couverture */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                Visuel de l'événement
              </h2>
              <p className="text-sm text-gray-500 mt-1">Une image attractive augmente la participation</p>
            </div>
            
            <div className="p-6">
              {previewUrl ? (
                <div className="relative w-full h-72 bg-gray-100 rounded-xl overflow-hidden group">
                  <img src={previewUrl} alt="Prévisualisation" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <span className="text-white text-sm font-medium">Image sélectionnée</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setPreviewUrl(null);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50/50 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-700 font-medium mb-1">Cliquez pour ajouter une image</p>
                  <p className="text-gray-400 text-sm">PNG, JPG jusqu'à 5MB</p>
                  <input 
                    type="file" 
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Section 2: Informations Principales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-blue-600" />
                Informations Générales
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre de l'événement <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('titre')}
                  type="text"
                  placeholder="Ex: Festival du Printemps 2025"
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-lg font-medium placeholder:text-gray-300"
                />
                {errors.titre && (
                  <p className="text-red-500 text-sm mt-2">{errors.titre.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description détaillée <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={5}
                  placeholder="Décrivez le programme, les objectifs, les invités, les activités prévues..."
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 leading-relaxed"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-2">{errors.description.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Établissement */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Établissement organisateur <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      {...register('etablissementId')}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white appearance-none"
                    >
                      <option value="">Sélectionner un établissement...</option>
                      {etablissements.map(e => (
                        <option key={e.id} value={e.id}>{e.nom}</option>
                      ))}
                    </select>
                  </div>
                  {errors.etablissementId && (
                    <p className="text-red-500 text-sm mt-2">{errors.etablissementId.message}</p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type d'événement <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      {...register('typeCategorique')}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white appearance-none"
                    >
                      <option value="">Sélectionner un type...</option>
                      <option value="CULTUREL">🎭 Culturel</option>
                      <option value="SPORTIF">⚽ Sportif</option>
                      <option value="SOCIAL">🤝 Social</option>
                      <option value="EDUCATIF">📚 Éducatif</option>
                      <option value="SANTE">🏥 Santé</option>
                      <option value="AUTRE">📌 Autre</option>
                    </select>
                  </div>
                  {errors.typeCategorique && (
                    <p className="text-red-500 text-sm mt-2">{errors.typeCategorique.message}</p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tags <span className="text-gray-400 font-normal">(séparés par virgule)</span>
                </label>
                <input
                  {...register('tags')}
                  type="text"
                  placeholder="Ex: jeunesse, sport, culture, famille"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Date, Heure et Lieu */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-transparent">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Date, Heure et Lieu
              </h2>
            </div>
            
            <div className="p-6">
              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date de début <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('dateDebut')}
                    type="date"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                  {errors.dateDebut && (
                    <p className="text-red-500 text-sm mt-2">{errors.dateDebut.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date de fin <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    {...register('dateFin')}
                    type="date"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Heures */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1 text-gray-400" />
                    Heure de début
                  </label>
                  <input
                    {...register('heureDebut')}
                    type="time"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1 text-gray-400" />
                    Heure de fin
                  </label>
                  <input
                    {...register('heureFin')}
                    type="time"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Lieu */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />
                    Lieu / Salle
                  </label>
                  <input
                    {...register('lieu')}
                    type="text"
                    placeholder="Ex: Grande Salle de Conférence"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse complète
                  </label>
                  <input
                    {...register('adresse')}
                    type="text"
                    placeholder="Ex: Avenue Mohammed V, Médiouna"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quartier / Douar
                </label>
                <input
                  {...register('quartierDouar')}
                  type="text"
                  placeholder="Ex: Hay Mohammadi"
                  className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Organisateur & Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-transparent">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Organisateur & Contact
              </h2>
              <p className="text-sm text-gray-500 mt-1">Informations de contact pour les citoyens</p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1 text-gray-400" />
                    Nom de l'organisateur
                  </label>
                  <input
                    {...register('organisateur')}
                    type="text"
                    placeholder="Ex: Association Jeunesse Médiouna"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1 text-gray-400" />
                    Téléphone de contact
                  </label>
                  <input
                    {...register('contactOrganisateur')}
                    type="tel"
                    placeholder="Ex: 0522 123 456"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1 text-gray-400" />
                    Email de contact
                  </label>
                  <input
                    {...register('emailContact')}
                    type="email"
                    placeholder="Ex: contact@event.ma"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none placeholder:text-gray-300"
                  />
                  {errors.emailContact && (
                    <p className="text-red-500 text-sm mt-2">{errors.emailContact.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Participation & Inscription */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50/50 to-transparent">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Participation & Inscription
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Capacité maximale (personnes)
                  </label>
                  <input
                    {...register('capaciteMax')}
                    type="number"
                    min="0"
                    placeholder="Ex: 500"
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none placeholder:text-gray-300"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-green-300 cursor-pointer transition-colors w-full">
                    <input
                      type="checkbox"
                      {...register('inscriptionsOuvertes')}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 mt-0.5"
                    />
                    <div>
                      <span className="font-medium text-gray-800 block">Ouvrir les inscriptions</span>
                      <span className="text-sm text-gray-500">Permet aux citoyens de s'inscrire en ligne</span>
                    </div>
                  </label>
                </div>
              </div>

              {watchedInscriptions && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-1 text-gray-400" />
                    Lien d'inscription externe
                  </label>
                  <input
                    {...register('lienInscription')}
                    type="url"
                    placeholder="Ex: https://forms.google.com/..."
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none placeholder:text-gray-300"
                  />
                  {errors.lienInscription && (
                    <p className="text-red-500 text-sm mt-2">{errors.lienInscription.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <Link
              href="/admin/evenements"
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Annuler
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-4 bg-gradient-to-r ${watchedType ? typeColors[watchedType] || 'from-blue-600 to-blue-700' : 'from-blue-600 to-blue-700'} text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all shadow-lg font-semibold flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {loading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save size={22} />
                  Créer l'événement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


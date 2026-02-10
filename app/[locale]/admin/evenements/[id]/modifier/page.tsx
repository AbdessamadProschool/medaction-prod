'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calendar,
  Building2,
  MapPin,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  FileText,
  Clock,
  Tag,
  PlayCircle,
  StopCircle,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface Evenement {
  id: number;
  titre: string;
  description: string;
  typeCategorique: string;
  secteur: string;
  dateDebut: string;
  dateFin?: string;
  heureDebut?: string;
  heureFin?: string;
  lieu?: string;
  adresse?: string;
  statut: string;
  nombreVues: number;
  nombreInscrits: number;
  capaciteMax?: number;
  inscriptionsOuvertes: boolean;
  etablissement?: { id: number; nom: string };
  commune?: { id: number; nom: string };
  createdByUser?: { nom: string; prenom: string };
  createdAt: string;
  medias?: { urlPublique: string }[];
  tags?: string[];
  bilanDescription?: string;
  bilanNbParticipants?: number;
}

const STATUTS = [
  { value: 'EN_ATTENTE_VALIDATION', label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  { value: 'VALIDEE', label: 'Validé', color: 'bg-blue-100 text-blue-700' },
  { value: 'PUBLIEE', label: 'Publié', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'EN_ACTION', label: 'En cours', color: 'bg-purple-100 text-purple-700' },
  { value: 'CLOTUREE', label: 'Clôturé', color: 'bg-gray-100 text-gray-700' },
  { value: 'ANNULEE', label: 'Annulé', color: 'bg-red-100 text-red-700' },
];

export default function ModifierEvenementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [evenement, setEvenement] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showClotureForm, setShowClotureForm] = useState(false);
  
  // Image states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    typeCategorique: '',
    dateDebut: '',
    dateFin: '',
    heureDebut: '',
    heureFin: '',
    lieu: '',
    adresse: '',
    statut: '',
    capaciteMax: '',
    inscriptionsOuvertes: false,
    // Champs de clôture
    rapportCloture: '',
    bilanParticipation: '',
  });

  useEffect(() => {
    if (id) {
      fetchEvenement();
    }
  }, [id]);

  const fetchEvenement = async () => {
    try {
      const res = await fetch(`/api/evenements/${id}`);
      if (!res.ok) throw new Error('Événement non trouvé');
      
      const data = await res.json();
      const evt = data.data || data;
      setEvenement(evt);
      
      setFormData({
        titre: evt.titre || '',
        description: evt.description || '',
        typeCategorique: evt.typeCategorique || '',
        dateDebut: evt.dateDebut?.split('T')[0] || '',
        dateFin: evt.dateFin?.split('T')[0] || '',
        heureDebut: evt.heureDebut || '',
        heureFin: evt.heureFin || '',
        lieu: evt.lieu || '',
        adresse: evt.adresse || '',
        statut: evt.statut || '',
        capaciteMax: evt.capaciteMax?.toString() || '',
        inscriptionsOuvertes: evt.inscriptionsOuvertes || false,
        rapportCloture: evt.rapportCloture || '',
        bilanParticipation: evt.bilanParticipation?.toString() || '',
      });
      
      // Image actuelle
      if (evt.medias && evt.medias.length > 0) {
        setCurrentImageUrl(evt.medias[0].urlPublique);
      }
    } catch (error) {
      console.error('Erreur chargement événement:', error);
      toast.error('Erreur lors du chargement');
      router.push('/admin/evenements');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setCurrentImageUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let imageUrl = currentImageUrl;
      let imageUploadFailed = false;

      // === UPLOAD DE LA NOUVELLE IMAGE SI SÉLECTIONNÉE ===
      if (selectedImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedImage);
        formDataUpload.append('type', 'evenements');

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json();
            console.error("Erreur upload:", errData);
            imageUploadFailed = true;
            toast.error(`Erreur upload: ${errData.error || 'Erreur inconnue'}`);
            // Demander confirmation pour continuer
            const continueWithoutNewImage = confirm(
              `⚠️ L'upload de la nouvelle image a échoué.\n\nVoulez-vous sauvegarder l'événement avec l'image actuelle ?`
            );
            if (!continueWithoutNewImage) {
              setSaving(false);
              return;
            }
            // Garder l'image actuelle
            imageUrl = currentImageUrl;
          } else {
            const uploadData = await uploadRes.json();
            
            // Vérifier que l'upload a réellement réussi
            if (!uploadData.success) {
              console.error("Upload échoué:", uploadData);
              imageUploadFailed = true;
              const errorDetail = uploadData.errors?.[0]?.error || uploadData.message || 'Erreur inconnue';
              toast.error(`Erreur upload: ${errorDetail}`);
              const continueWithCurrentImage = confirm(
                `⚠️ L'upload a échoué: ${errorDetail}\n\nVoulez-vous sauvegarder avec l'image actuelle ?`
              );
              if (!continueWithCurrentImage) {
                setSaving(false);
                return;
              }
              imageUrl = currentImageUrl;
            } else {
              imageUrl = uploadData.url;
              
              // Vérifier que l'URL est valide
              if (!imageUrl || !imageUrl.startsWith('/')) {
                console.error("URL d'image invalide:", imageUrl, "Réponse complète:", uploadData);
                imageUploadFailed = true;
                toast.error("L'URL de l'image uploadée est invalide");
                const continueWithCurrentImage = confirm(
                  `⚠️ L'image a été uploadée mais l'URL est invalide.\n\nVoulez-vous sauvegarder avec l'image actuelle ?`
                );
                if (!continueWithCurrentImage) {
                  setSaving(false);
                  return;
                }
                imageUrl = currentImageUrl;
              } else {
                toast.success('Image uploadée avec succès');
              }
            }
          }
        } catch (uploadError) {
          console.error("Erreur réseau upload:", uploadError);
          imageUploadFailed = true;
          toast.error("Erreur réseau lors de l'upload");
          const continueWithCurrentImage = confirm(
            `⚠️ Erreur réseau lors de l'upload de l'image.\n\nVoulez-vous sauvegarder avec l'image actuelle ?`
          );
          if (!continueWithCurrentImage) {
            setSaving(false);
            return;
          }
          imageUrl = currentImageUrl;
        }
      }

      // === MISE À JOUR DE L'ÉVÉNEMENT ===
      const res = await fetch(`/api/evenements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capaciteMax: formData.capaciteMax ? parseInt(formData.capaciteMax) : null,
          bilanParticipation: formData.bilanParticipation ? parseInt(formData.bilanParticipation) : null,
          imagePrincipale: imageUrl,
        }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        if (result.error?.details) {
          result.error.details.forEach((d: any) => toast.error(d.message));
        } else {
          toast.error(result.error?.message || 'Erreur lors de la sauvegarde');
        }
        return;
      }
      
      // Message de succès adapté
      if (imageUploadFailed) {
        toast.success('Événement mis à jour (image non modifiée)');
      } else if (selectedImage && imageUrl) {
        toast.success('Événement et image mis à jour avec succès');
      } else {
        toast.success('Événement mis à jour avec succès');
      }
      router.push('/admin/evenements');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleStatutChange = async (newStatut: string) => {
    try {
      const res = await fetch(`/api/evenements/${id}/statut`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });
      
      if (res.ok) {
        toast.success(`Statut changé en "${STATUTS.find(s => s.value === newStatut)?.label}"`);
        fetchEvenement();
      } else {
        const result = await res.json();
        toast.error(result.error?.message || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleCloturer = async () => {
    if (!formData.rapportCloture.trim()) {
      toast.error('Le rapport de clôture est obligatoire');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/evenements/${id}/cloturer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rapportCloture: formData.rapportCloture,
          bilanParticipation: formData.bilanParticipation ? parseInt(formData.bilanParticipation) : null,
        }),
      });
      
      if (res.ok) {
        toast.success('Événement clôturé avec succès');
        setShowClotureForm(false);
        fetchEvenement();
      } else {
        const result = await res.json();
        toast.error(result.error?.message || 'Erreur lors de la clôture');
      }
    } catch (error) {
      toast.error('Erreur lors de la clôture');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/evenements/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error?.message || 'Erreur lors de la suppression');
        return;
      }
      
      toast.success('Événement supprimé');
      router.push('/admin/evenements');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-gray-500 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!evenement) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Événement introuvable</h2>
          <Link href="/admin/evenements" className="text-emerald-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const isPastEvent = evenement.dateFin && new Date(evenement.dateFin) < new Date();
  const canClose = isPastEvent && evenement.statut !== 'CLOTUREE' && evenement.statut !== 'ANNULEE';

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/evenements"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifier l'événement</h1>
            <p className="text-gray-500">ID: {id}</p>
          </div>
        </div>
      </div>

      {/* Alert pour clôture */}
      {canClose && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">Événement terminé</h3>
              <p className="text-sm text-amber-700">
                Cet événement est terminé et doit être clôturé avec un rapport.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowClotureForm(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Clôturer maintenant
          </button>
        </div>
      )}

      {/* Infos Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {new Date(evenement.dateDebut).toLocaleDateString('fr-FR')}
              {evenement.dateFin && ` - ${new Date(evenement.dateFin).toLocaleDateString('fr-FR')}`}
            </span>
          </div>
          {evenement.etablissement && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{evenement.etablissement.nom}</span>
            </div>
          )}
          {evenement.lieu && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{evenement.lieu}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>{evenement.nombreInscrits} inscrits</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>{evenement.nombreVues} vues</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            STATUTS.find(s => s.value === evenement.statut)?.color || 'bg-gray-100'
          }`}>
            {STATUTS.find(s => s.value === evenement.statut)?.label || evenement.statut}
          </span>
        </div>
      </div>

      {/* Actions rapides statut */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Actions rapides</h3>
        <div className="flex flex-wrap gap-2">
          {evenement.statut === 'EN_ATTENTE_VALIDATION' && (
            <>
              <button
                onClick={() => handleStatutChange('VALIDEE')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Valider
              </button>
              <button
                onClick={() => handleStatutChange('ANNULEE')}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                <XCircle className="w-4 h-4" />
                Rejeter
              </button>
            </>
          )}
          {evenement.statut === 'VALIDEE' && (
            <button
              onClick={() => handleStatutChange('PUBLIEE')}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
            >
              <Eye className="w-4 h-4" />
              Publier
            </button>
          )}
          {evenement.statut === 'PUBLIEE' && (
            <button
              onClick={() => handleStatutChange('EN_ACTION')}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              <PlayCircle className="w-4 h-4" />
              Démarrer
            </button>
          )}
        </div>
      </div>

      {/* Cloture Form Modal */}
      {showClotureForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <StopCircle className="w-6 h-6 text-amber-600" />
              Clôturer l'événement
            </h2>
            <p className="text-gray-500 mb-6">
              Remplissez le rapport de clôture et le bilan de participation pour finaliser cet événement.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rapport de clôture *
                </label>
                <textarea
                  value={formData.rapportCloture}
                  onChange={(e) => setFormData({ ...formData, rapportCloture: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  rows={5}
                  placeholder="Décrivez le déroulement de l'événement, les points forts, les difficultés rencontrées..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre réel de participants
                </label>
                <input
                  type="number"
                  value={formData.bilanParticipation}
                  onChange={(e) => setFormData({ ...formData, bilanParticipation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  min="0"
                  placeholder="Ex: 150"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowClotureForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleCloturer}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Clôturer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Image */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            Image de l'événement
          </h3>
          
          {(previewUrl || currentImageUrl) ? (
            <div className="relative w-full h-56 bg-gray-100 rounded-xl overflow-hidden group">
              <img 
                src={previewUrl || currentImageUrl || ''} 
                alt="Prévisualisation" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 cursor-pointer text-sm font-medium">
                  Changer
                  <input 
                    type="file" 
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
                <button
                  type="button"
                  onClick={removeImage}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                {previewUrl ? 'Nouvelle image' : 'Image actuelle'}
              </span>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Cliquez pour ajouter une image</p>
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

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            {/* Lieu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu
              </label>
              <input
                type="text"
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            {/* Capacité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacité max
              </label>
              <input
                type="number"
                value={formData.capaciteMax}
                onChange={(e) => setFormData({ ...formData, capaciteMax: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                min="0"
              />
            </div>
          </div>

          {/* Rapport de clôture (si clôturé) */}
          {evenement.statut === 'CLOTUREE' && evenement.bilanDescription && (
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Rapport de clôture
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{evenement.bilanDescription}</p>
              {evenement.bilanNbParticipants && (
                <p className="mt-2 text-sm text-gray-500">
                  Participation réelle: <strong>{evenement.bilanNbParticipants}</strong> personnes
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Supprimer
          </button>
          
          <div className="flex items-center gap-3">
            <Link
              href="/admin/evenements"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Send,
  Loader2,
  Download,
} from 'lucide-react';
import DownloadPhotosButton from '@/components/reclamations/DownloadPhotosButton';

interface Reclamation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  statut: string | null;
  affectationReclamation: string;
  motifRejet: string | null;
  solutionApportee: string | null;
  quartierDouar: string | null;
  adresseComplete: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
  };
  commune: {
    id: number;
    nom: string;
  };
  etablissement: {
    id: number;
    nom: string;
    secteur: string;
  } | null;
  historique: {
    id: number;
    action: string;
    details: any;
    effectuePar: number;
    createdAt: string;
  }[];
  medias: {
    id: number;
    urlPublique: string;
    type: string;
  }[];
}

const STATUT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  null: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
  ACCEPTEE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Acceptée' },
  REJETEE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejetée' },
};

const AFFECTATION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  NON_AFFECTEE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Non affectée' },
  AFFECTEE: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Affectée' },
};

export default function ReclamationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reclamationId = params.id as string;

  const [reclamation, setReclamation] = useState<Reclamation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Formulaires
  const [motifRejet, setMotifRejet] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    fetchReclamation();
  }, [reclamationId]);

  const fetchReclamation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reclamations/${reclamationId}`);
      if (res.ok) {
        const data = await res.json();
        setReclamation(data.data); // L'API retourne { data: reclamation }
      } else if (res.status === 404) {
        setError('Réclamation non trouvée');
      } else {
        setError('Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading('accept');
    try {
      const res = await fetch(`/api/reclamations/${reclamationId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'ACCEPTEE' }),
      });
      if (res.ok) {
        fetchReclamation();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l\'acceptation');
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!motifRejet.trim()) {
      alert('Veuillez indiquer un motif de rejet');
      return;
    }
    setActionLoading('reject');
    try {
      const res = await fetch(`/api/reclamations/${reclamationId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'REJETEE', motifRejet }),
      });
      if (res.ok) {
        setShowRejectForm(false);
        setMotifRejet('');
        fetchReclamation();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors du rejet');
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !reclamation) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Erreur'}</h2>
        <Link href="/admin" className="text-emerald-600 hover:underline">
          Retour au dashboard
        </Link>
      </div>
    );
  }

  const statutInfo = STATUT_COLORS[reclamation.statut || 'null'] || STATUT_COLORS['null'];
  const affectationInfo = AFFECTATION_COLORS[reclamation.affectationReclamation] || AFFECTATION_COLORS.NON_AFFECTEE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Réclamation #{reclamation.id}
            </h1>
            <p className="text-gray-500 mt-1">{reclamation.titre}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statutInfo.bg} ${statutInfo.text}`}>
            {statutInfo.label}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${affectationInfo.bg} ${affectationInfo.text}`}>
            {affectationInfo.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-emerald-500" />
              Description
            </h2>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {reclamation.description}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                {reclamation.categorie}
              </span>
            </div>
          </div>

          {/* Photos */}
          {reclamation.medias && reclamation.medias.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon size={20} className="text-emerald-500" />
                  Photos ({reclamation.medias.filter(m => m.type === 'IMAGE').length})
                </h2>
                <DownloadPhotosButton
                  reclamationId={reclamation.id}
                  photoCount={reclamation.medias.filter(m => m.type === 'IMAGE').length}
                  variant="button"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {reclamation.medias.map((media) => (
                  <div key={media.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={media.urlPublique}
                      alt="Photo réclamation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Admin */}
          {reclamation.statut === null && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-emerald-500" />
                Actions
              </h2>

              {showRejectForm ? (
                <div className="space-y-4">
                  <textarea
                    value={motifRejet}
                    onChange={(e) => setMotifRejet(e.target.value)}
                    placeholder="Motif du rejet..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading === 'reject'}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'reject' && <Loader2 size={16} className="animate-spin" />}
                      Confirmer le rejet
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading === 'accept'}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {actionLoading === 'accept' ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    Accepter
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                  >
                    <XCircle size={18} />
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Motif de rejet */}
          {reclamation.statut === 'REJETEE' && reclamation.motifRejet && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6">
              <h2 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                <XCircle size={20} />
                Motif de rejet
              </h2>
              <p className="text-red-600 dark:text-red-300">{reclamation.motifRejet}</p>
            </div>
          )}

          {/* Solution apportée */}
          {reclamation.solutionApportee && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6">
              <h2 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                <CheckCircle size={20} />
                Solution apportée
              </h2>
              <p className="text-green-600 dark:text-green-300">{reclamation.solutionApportee}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Citoyen */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-emerald-500" />
              Citoyen
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {reclamation.user.prenom[0]}{reclamation.user.nom[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {reclamation.user.prenom} {reclamation.user.nom}
                  </p>
                  <p className="text-sm text-gray-500">{reclamation.user.email}</p>
                </div>
              </div>
              {reclamation.user.telephone && (
                <p className="text-sm text-gray-500">📞 {reclamation.user.telephone}</p>
              )}
            </div>
          </div>

          {/* Localisation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-emerald-500" />
              Localisation
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Commune:</span> {reclamation.commune.nom}
              </p>
              {reclamation.quartierDouar && (
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Quartier:</span> {reclamation.quartierDouar}
                </p>
              )}
              {reclamation.adresseComplete && (
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Adresse:</span> {reclamation.adresseComplete}
                </p>
              )}
            </div>
          </div>

          {/* Établissement */}
          {reclamation.etablissement && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-emerald-500" />
                Établissement
              </h2>
              <p className="font-medium text-gray-900 dark:text-white">
                {reclamation.etablissement.nom}
              </p>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-2 inline-block">
                {reclamation.etablissement.secteur}
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-500" />
              Dates
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Créée le:</span>{' '}
                {new Date(reclamation.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Mise à jour:</span>{' '}
                {new Date(reclamation.updatedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Historique */}
          {reclamation.historique && reclamation.historique.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-emerald-500" />
                Historique
              </h2>
              <div className="space-y-4">
                {reclamation.historique.map((h) => (
                  <div key={h.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{h.action}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(h.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

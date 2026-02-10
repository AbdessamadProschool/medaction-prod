'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Building2,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  AlertCircle,
  Star,
  FileText,
  Camera,
  Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface Activite {
  id: number;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  lieu?: string;
  participantsAttendus?: number;
  statut: string;
  etablissement: {
    id: number;
    nom: string;
    secteur: string;
  };
  rapportComplete?: boolean;
  presenceEffective?: number;
  commentaireDeroulement?: string;
  difficultes?: string;
  pointsPositifs?: string;
  noteQualite?: number;
  recommandations?: string;
}

export default function RapportActivitePage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;

  const [activite, setActivite] = useState<Activite | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    presenceEffective: 0,
    commentaireDeroulement: '',
    difficultes: '',
    pointsPositifs: '',
    noteQualite: 3,
    recommandations: '',
  });

  // Charger l'activité
  useEffect(() => {
    const fetchActivite = async () => {
      try {
        const res = await fetch(`/api/programmes-activites/${activityId}`);
        if (res.ok) {
          const data = await res.json();
          setActivite(data.data);
          // Pré-remplir avec données existantes
          if (data.data.rapportComplete) {
            setFormData({
              presenceEffective: data.data.presenceEffective || 0,
              commentaireDeroulement: data.data.commentaireDeroulement || '',
              difficultes: data.data.difficultes || '',
              pointsPositifs: data.data.pointsPositifs || '',
              noteQualite: data.data.noteQualite || 3,
              recommandations: data.data.recommandations || '',
            });
          } else {
            setFormData(prev => ({
              ...prev,
              presenceEffective: data.data.participantsAttendus || 0,
            }));
          }
        } else {
          setError('Activité non trouvée');
        }
      } catch (e) {
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchActivite();
  }, [activityId]);

  // Soumettre le rapport
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/programmes-activites/${activityId}/rapport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/coordinateur/calendrier');
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (e) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gov-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement de l'activité...</p>
        </div>
      </div>
    );
  }

  if (error && !activite) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium">{error}</p>
          <Link href="/coordinateur/calendrier" className="text-gov-blue hover:underline mt-4 inline-block">
            Retour au calendrier
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rapport enregistré !</h2>
          <p className="text-gray-500">Redirection vers le calendrier...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/coordinateur/calendrier"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gov-blue transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au calendrier
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gov-blue to-blue-600 rounded-xl flex items-center justify-center text-white">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rapport d'activité</h1>
            <p className="text-gray-500">Complétez le rapport de cette séance</p>
          </div>
        </div>
      </div>

      {/* Info activité */}
      {activite && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Building2 className="w-4 h-4" />
            <span className="font-medium">{activite.etablissement.nom}</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {activite.etablissement.secteur}
            </span>
          </div>
          
          <h2 className="text-lg font-bold text-gray-900 mb-3">{activite.titre}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gov-blue" />
              <span>{format(parseISO(activite.date), 'd MMM yyyy', { locale: fr })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-gov-blue" />
              <span>{activite.heureDebut}h - {activite.heureFin}h</span>
            </div>
            {activite.lieu && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gov-blue" />
                <span>{activite.lieu}</span>
              </div>
            )}
            {activite.participantsAttendus && (
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-gov-blue" />
                <span>{activite.participantsAttendus} prévus</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Présence effective */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gov-blue" />
            Présence effective
          </h3>
          
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="0"
              value={formData.presenceEffective}
              onChange={(e) => setFormData({ ...formData, presenceEffective: parseInt(e.target.value) || 0 })}
              className="w-32 px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-bold text-gov-blue focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue"
            />
            <span className="text-gray-500">participants présents</span>
          </div>
          
          {activite?.participantsAttendus && (
            <p className="text-sm text-gray-400 mt-2">
              {activite.participantsAttendus} participants étaient prévus
            </p>
          )}
        </div>

        {/* Note qualité */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gov-gold" />
            Note de qualité globale
          </h3>
          
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, noteQualite: star })}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= formData.noteQualite
                      ? 'text-gov-gold fill-gov-gold'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-4 text-gray-500">
              {formData.noteQualite === 1 && 'Insuffisant'}
              {formData.noteQualite === 2 && 'Passable'}
              {formData.noteQualite === 3 && 'Bien'}
              {formData.noteQualite === 4 && 'Très bien'}
              {formData.noteQualite === 5 && 'Excellent'}
            </span>
          </div>
        </div>

        {/* Déroulement */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Déroulement de la séance</h3>
          <textarea
            value={formData.commentaireDeroulement}
            onChange={(e) => setFormData({ ...formData, commentaireDeroulement: e.target.value })}
            rows={4}
            placeholder="Décrivez comment s'est déroulée l'activité..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue resize-none"
          />
        </div>

        {/* Points positifs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Points positifs
          </h3>
          <textarea
            value={formData.pointsPositifs}
            onChange={(e) => setFormData({ ...formData, pointsPositifs: e.target.value })}
            rows={3}
            placeholder="Qu'est-ce qui a bien fonctionné ?"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue resize-none"
          />
        </div>

        {/* Difficultés */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Difficultés rencontrées
          </h3>
          <textarea
            value={formData.difficultes}
            onChange={(e) => setFormData({ ...formData, difficultes: e.target.value })}
            rows={3}
            placeholder="Y a-t-il eu des problèmes ou obstacles ?"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue resize-none"
          />
        </div>

        {/* Recommandations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recommandations pour les prochaines séances</h3>
          <textarea
            value={formData.recommandations}
            onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
            rows={3}
            placeholder="Suggestions d'amélioration..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue resize-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Link
            href="/coordinateur/calendrier"
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-center font-medium"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-gov-blue to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Enregistrement...' : 'Enregistrer le rapport'}
          </button>
        </div>
      </form>
    </div>
  );
}

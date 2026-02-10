'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Target, Calendar, Users, MapPin, Share2, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Campagne {
  id: number;
  titre: string;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  objectif?: number;
  progression?: number;
  imageUrl?: string;
  unite?: string;
  statut?: string;
  lieu?: string;
}

export default function CampagneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCampagne = async () => {
      try {
        const response = await fetch(`/api/campagnes/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          // Mapping des données API vers le format local
          const mappedData = {
            ...data.data,
            imageUrl: data.data.imagePrincipale || data.data.imageCouverture,
            objectif: data.data.objectifParticipations,
            progression: data.data.nombreParticipations || 0,
            statut: data.data.isActive ? 'EN_COURS' : data.data.statut // Fallback pour affichage statut
          };
          setCampagne(mappedData);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCampagne();
    }
  }, [params.id]);

  const handleParticipate = async () => {
    if (!session) {
      toast.error("Vous devez être connecté pour participer");
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    setParticipating(true);
    try {
      const res = await fetch(`/api/campagnes/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Corps vide pour participation simple
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Votre participation a bien été enregistrée !");
        // Rafraîchir les données
        const updatedRes = await fetch(`/api/campagnes/${params.id}`);
        if (updatedRes.ok) {
           const updatedData = await updatedRes.json();
           const mappedData = {
            ...updatedData.data,
            imageUrl: updatedData.data.imagePrincipale || updatedData.data.imageCouverture,
            objectif: updatedData.data.objectifParticipations,
            progression: updatedData.data.nombreParticipations || 0,
            statut: updatedData.data.isActive ? 'EN_COURS' : updatedData.data.statut
          };
          setCampagne(mappedData);
        }
      } else {
        toast.error(data.error || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setParticipating(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: campagne?.titre, url });
      } catch (e) { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié dans le presse-papiers !');
      } catch (err) {
        toast.error('Impossible de copier le lien');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-gov-gold" />
      </div>
    );
  }

  if (error || !campagne) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Target className="w-20 h-20 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Campagne non trouvée</h1>
        <p className="text-gray-500 mb-6">Cette campagne n&apos;existe pas ou a été supprimée.</p>
        <Link href="/campagnes" className="inline-flex items-center gap-2 px-6 py-3 bg-gov-gold text-white rounded-xl hover:bg-gov-gold-dark transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour aux campagnes
        </Link>
      </div>
    );
  }

  const progress = campagne.objectif ? ((campagne.progression || 0) / campagne.objectif) * 100 : 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!campagne.dateFin) return 0;
    const end = new Date(campagne.dateFin);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px] bg-gray-900">
        {campagne.imageUrl ? (
          <Image
            src={campagne.imageUrl}
            alt={campagne.titre}
            fill
            className="object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gov-gold/30 to-gov-green/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        
        {/* Back button */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gov-gold/20 text-gov-gold-light rounded-full text-sm font-medium mb-4">
                <Target className="w-4 h-4" />
                {campagne.statut === 'EN_COURS' ? 'Campagne en cours' : 'Campagne'}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                {campagne.titre}
              </h1>
              <div className="flex flex-wrap gap-4 text-white/80">
                {campagne.dateDebut && (
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(campagne.dateDebut)} - {formatDate(campagne.dateFin)}
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">À propos de cette campagne</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {campagne.description}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Progression</h3>
              
              {campagne.objectif && (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-gov-gold">{progress.toFixed(0)}%</div>
                    <div className="text-gray-500">de l&apos;objectif atteint</div>
                  </div>

                  <div className="h-4 bg-gov-gold/10 rounded-full overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-gov-gold to-gov-gold-dark rounded-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{(campagne.progression || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{campagne.unite || 'réalisés'}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{campagne.objectif.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">objectif</div>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-gov-gold" />
                  <span>{getDaysRemaining()} jours restants</span>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <button 
                onClick={handleParticipate}
                disabled={participating || campagne?.statut !== 'EN_COURS'}
                className="w-full py-4 bg-gradient-to-r from-gov-gold to-gov-gold-dark text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {participating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  'Participer à cette campagne'
                )}
              </button>
              
              <button 
                onClick={handleShare}
                className="w-full mt-3 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileText, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  ChevronLeft,
  AlertTriangle,
  MessageSquare,
  Calendar,
  User,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Reclamation {
  id: number;
  code: string;
  titre: string;
  description: string;
  categorie: string;
  statut: string | null;
  createdAt: string;
  commune: { nom: string };
  affectationReclamation: string;
  motifRejet?: string;
  solutionApportee?: string;
  dateResolution?: string;
  medias: { url: string; type: string }[];
  historique: {
    id: number;
    action: string;
    createdAt: string;
    details: any;
  }[];
}

export default function MaReclamationDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reclamation, setReclamation] = useState<Reclamation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/reclamations/${id}`);
        if (res.ok) {
          const data = await res.json();
          setReclamation(data.data || data);
        } else {
          router.push('/mes-reclamations');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!reclamation) return null;

  const getStatutConfig = (statut: string | null) => {
    switch (statut) {
      case 'ACCEPTEE': return { label: 'Traitée / Acceptée', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle };
      case 'REJETEE': return { label: 'Rejetée', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
      default: return { label: 'En attente', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock };
    }
  };

  const config = getStatutConfig(reclamation.statut);
  const StatusIcon = config.icon;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-8">
      <Link 
        href="/mes-reclamations" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors"
      >
        <ChevronLeft size={20} />
        Retour à mes réclamations
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Réf: {reclamation.code}
              </span>
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${config.bg} ${config.color}`}>
                <StatusIcon size={16} />
                {config.label}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {reclamation.titre}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {new Date(reclamation.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                {reclamation.commune.nom}
              </div>
              <div className="flex items-center gap-2">
                <FileText size={16} />
                {reclamation.categorie}
              </div>
            </div>

            <div className="prose prose-emerald max-w-none mb-10">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                {reclamation.description}
              </p>
            </div>

            {reclamation.medias && reclamation.medias.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Documents et photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {reclamation.medias.map((media, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                      <img 
                        src={media.url} 
                        alt="Preuve" 
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Feedback section if relevant */}
          {(reclamation.statut === 'REJETEE' || reclamation.statut === 'ACCEPTEE') && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-8 rounded-3xl border shadow-lg ${
                reclamation.statut === 'REJETEE' 
                ? 'bg-red-50 border-red-100' 
                : 'bg-emerald-50 border-emerald-100'
              }`}
            >
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                reclamation.statut === 'REJETEE' ? 'text-red-700' : 'text-emerald-700'
              }`}>
                {reclamation.statut === 'REJETEE' ? <XCircle size={20} /> : <CheckCircle size={20} />}
                {reclamation.statut === 'REJETEE' ? 'Motif du rejet' : 'Traitement de la réclamation'}
              </h3>
              <p className={`whitespace-pre-line ${
                reclamation.statut === 'REJETEE' ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {reclamation.statut === 'REJETEE' ? reclamation.motifRejet : reclamation.solutionApportee || "Votre réclamation a été acceptée et est en cours de traitement par les services compétents."}
              </p>
            </motion.div>
          )}
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700"
          >
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock className="text-emerald-500" size={20} />
              Historique de traitement
            </h3>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-700">
              {reclamation.historique?.map((step, idx) => (
                <div key={step.id} className="relative pl-10">
                  <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-4 border-white dark:border-gray-800 z-10 ${
                    idx === 0 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-gray-300'
                  }`} />
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {step.action === 'CREATION' ? 'Réclamation soumise' :
                       step.action === 'ACCEPTATION' ? 'Réclamation acceptée' :
                       step.action === 'REJET' ? 'Réclamation rejetée' :
                       step.action === 'AFFECTATION' ? 'Prise en charge' :
                       step.action === 'RESOLUTION' ? 'Réclamation résolue' :
                       step.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(step.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              
              {!reclamation.historique?.length && (
                <div className="relative pl-10">
                  <div className="absolute left-2 top-1 w-4 h-4 rounded-full border-4 border-white bg-emerald-500 ring-4 ring-emerald-100 z-10" />
                  <div>
                    <p className="text-sm font-bold text-gray-800">Soumission de la réclamation</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(reclamation.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="bg-gradient-to-br from-gov-blue to-blue-700 rounded-3xl p-6 text-white shadow-xl">
             <h4 className="font-bold mb-2 flex items-center gap-2">
               <MessageSquare size={18} />
               Assistance
             </h4>
             <p className="text-sm text-blue-100 mb-4">
               Si vous avez des questions concernant le traitement de votre réclamation, n'hésitez pas à nous contacter.
             </p>
             <Link 
               href="/contact" 
               className="block text-center py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all"
             >
               Contacter le support
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

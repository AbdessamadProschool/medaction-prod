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
  Loader2,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';

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
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

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

  const steps = [
    { title: 'Soumise', desc: 'Demande enregistrée', icon: FileText },
    { title: 'Prise en charge', desc: 'Dossier en cours d\'analyse', icon: User },
    { title: 'En cours', desc: 'Actions en cours de déploiement', icon: Clock },
    { title: reclamation.statut === 'REJETEE' ? 'Rejetée' : 'Résolue', desc: reclamation.statut === 'REJETEE' ? 'Demande non validée' : 'Demande traitée avec succès', icon: reclamation.statut === 'REJETEE' ? XCircle : CheckCircle }
  ];

  let currentStepIndex = 1;
  if (reclamation.statut === 'ACCEPTEE' || reclamation.statut === 'REJETEE') {
    currentStepIndex = 4;
  } else if (reclamation.affectationReclamation || reclamation.historique?.some(h => h.action === 'AFFECTATION')) {
    currentStepIndex = 3;
  } else {
    currentStepIndex = 2;
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-8">
      {/* Return button */}
      <Link 
        href="/mes-reclamations" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors font-semibold"
      >
        <ChevronLeft size={20} />
        Retour à mes réclamations
      </Link>

      {/* Premium Horizontal Stepper */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 dark:border-gray-700 w-full overflow-hidden"
      >
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-4">
          {/* Progress bar background line */}
          <div className="absolute left-[22px] md:left-10 md:top-6 right-0 bottom-0 md:bottom-auto h-[calc(100%-48px)] md:h-[4px] w-[4px] md:w-[calc(100%-80px)] bg-gray-100 dark:bg-gray-700 -z-10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0, height: 0 }}
              animate={{
                width: "100%",
                height: "100%"
              }}
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full w-full"
              style={{
                transform: typeof window !== 'undefined' && window.innerWidth >= 768 
                  ? `scaleX(${(currentStepIndex - 1) / 3})` 
                  : `scaleY(${(currentStepIndex - 1) / 3})`,
                transformOrigin: 'left top'
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = idx < currentStepIndex - 1;
            const isActive = idx === currentStepIndex - 1;
            const isPending = idx > currentStepIndex - 1;

            return (
              <div key={idx} className="flex md:flex-col items-center gap-4 md:text-center flex-1 relative z-10">
                {/* Step Circle */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 border-white dark:border-gray-800 text-white shadow-lg ring-4 ring-emerald-100 dark:ring-emerald-950'
                      : isActive
                      ? 'bg-white dark:bg-gray-800 border-emerald-500 text-emerald-500 shadow-xl ring-4 ring-emerald-500/20 animate-pulse'
                      : 'bg-gray-100 dark:bg-gray-700 border-white dark:border-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {isCompleted ? <Check size={16} className="stroke-[3]" /> : <StepIcon size={16} />}
                </motion.div>

                {/* Step Info */}
                <div className="flex-1 md:mt-2 text-left md:text-center">
                  <p className={`text-sm font-bold transition-colors ${
                    isCompleted || isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-[200px] md:mx-auto line-clamp-2 leading-tight">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

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
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 relative group cursor-pointer">
                      <img 
                        src={media.url} 
                        alt="Preuve" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-700">
              {reclamation.historique && reclamation.historique.length > 0 ? (
                reclamation.historique.map((step, idx) => {
                  const isExpanded = expandedStep === step.id;
                  
                  let StepIcon = Clock;
                  let stepColor = "bg-amber-500";
                  if (step.action === 'CREATION') {
                    StepIcon = FileText;
                    stepColor = "bg-blue-500";
                  } else if (step.action === 'AFFECTATION') {
                    StepIcon = User;
                    stepColor = "bg-indigo-500";
                  } else if (step.action === 'ACCEPTATION') {
                    StepIcon = CheckCircle;
                    stepColor = "bg-emerald-500";
                  } else if (step.action === 'REJET') {
                    StepIcon = XCircle;
                    stepColor = "bg-red-500";
                  } else if (step.action === 'RESOLUTION') {
                    StepIcon = CheckCircle;
                    stepColor = "bg-emerald-500";
                  }

                  return (
                    <motion.div
                      key={step.id}
                      layout
                      className="relative pl-12 cursor-pointer group"
                      onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    >
                      {/* Ring and Connector */}
                      <div className={`absolute left-2.5 top-3 w-5 h-5 rounded-full border-4 border-white dark:border-gray-800 z-10 transition-transform duration-300 flex items-center justify-center ${stepColor} ${
                        idx === 0 ? 'ring-4 ring-emerald-100 dark:ring-emerald-950 scale-110' : 'group-hover:scale-110'
                      }`} />
                      
                      {/* Card container */}
                      <div className={`bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-850 p-4 rounded-2xl border transition-all duration-300 ${
                        isExpanded 
                          ? 'border-emerald-500/30 bg-emerald-50/5 dark:bg-emerald-950/5 ring-1 ring-emerald-500/10 shadow-sm' 
                          : 'border-transparent'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {step.action === 'CREATION' ? 'Réclamation soumise' :
                             step.action === 'ACCEPTATION' ? 'Réclamation acceptée' :
                             step.action === 'REJET' ? 'Réclamation rejetée' :
                             step.action === 'AFFECTATION' ? 'Prise en charge' :
                             step.action === 'RESOLUTION' ? 'Réclamation résolue' :
                             step.action}
                          </p>
                          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-600" />}
                        </div>
                        
                        <p className="text-[11px] text-gray-500 mt-1">
                          {new Date(step.createdAt).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>

                        {/* Expandable details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 space-y-2"
                            >
                              {step.action === 'CREATION' && (
                                <p>Votre réclamation a été enregistrée avec succès. Elle est stockée de manière sécurisée sous la référence <span className="font-bold text-emerald-600">{reclamation.code}</span>.</p>
                              )}
                              {step.action === 'AFFECTATION' && (
                                <p>Le dossier a été transmis à la commune et au service compétent : <span className="font-bold text-gray-800 dark:text-white">{reclamation.affectationReclamation || 'Service technique local'}</span> pour instruction.</p>
                              )}
                              {step.action === 'RESOLUTION' && (
                                <div>
                                  <p className="font-semibold text-emerald-600">Solution apportée :</p>
                                  <p className="mt-1 italic">"{reclamation.solutionApportee || 'La situation a été résolue par nos agents de terrain.'}"</p>
                                </div>
                              )}
                              {step.action === 'REJET' && (
                                <div>
                                  <p className="font-semibold text-red-600">Motif du rejet :</p>
                                  <p className="mt-1 italic">"{reclamation.motifRejet || 'Ne correspond pas aux compétences de la commune.'}"</p>
                                </div>
                              )}
                              {step.details && typeof step.details === 'object' && Object.keys(step.details).length > 0 && (
                                <div className="bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800 mt-2 font-mono text-[10px] break-all">
                                  {JSON.stringify(step.details, null, 2)}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="relative pl-12">
                  <div className="absolute left-2.5 top-3 w-5 h-5 rounded-full border-4 border-white bg-emerald-500 ring-4 ring-emerald-100 z-10" />
                  <div className="bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-transparent">
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

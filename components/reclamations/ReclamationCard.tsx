'use client';

import { useSession } from 'next-auth/react';

import { motion } from 'framer-motion';
import { Clock, CheckCircle2, RefreshCw, PartyPopper, Construction, Trash2, Lightbulb, Droplets, Shield, GraduationCap, Hospital, Trophy, HeartHandshake, ClipboardList } from 'lucide-react';
import React from 'react';

interface Reclamation {
  id: number;
  titre: string;
  categorie: string;
  description: string;
  statut: 'ACCEPTEE' | 'REJETEE' | null;
  affectationReclamation: 'NON_AFFECTEE' | 'AFFECTEE';
  dateResolution: string | null;
  createdAt: string;
  commune: { nom: string };
  etablissement?: { nom: string } | null;
}

interface ReclamationCardProps {
  reclamation: Reclamation;
  onClick: () => void;
  onDelete?: () => void;
}

const statusConfig = {
  en_attente: {
    label: 'En attente',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: <Clock className="w-4 h-4" />
  },
  acceptee: {
    label: 'Acceptée',
    color: 'bg-[hsl(145,63%,32%)]/10 text-[hsl(145,63%,32%)] border-[hsl(145,63%,32%)]/30',
    dot: 'bg-[hsl(145,63%,32%)]',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  affectee: {
    label: 'En traitement',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: <RefreshCw className="w-4 h-4" />
  },
  resolue: {
    label: 'Résolue',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    icon: <PartyPopper className="w-4 h-4" />
  }
};

const categoryIcons: Record<string, React.ReactElement> = {
  infrastructure: <Construction className="w-6 h-6" />,
  proprete: <Trash2 className="w-6 h-6" />,
  eclairage: <Lightbulb className="w-6 h-6" />,
  eau: <Droplets className="w-6 h-6" />,
  securite: <Shield className="w-6 h-6" />,
  education: <GraduationCap className="w-6 h-6" />,
  sante: <Hospital className="w-6 h-6" />,
  sport: <Trophy className="w-6 h-6" />,
  social: <HeartHandshake className="w-6 h-6" />,
  autre: <ClipboardList className="w-6 h-6" />,
};

function getStatus(rec: Reclamation): keyof typeof statusConfig {
  if (rec.dateResolution) return 'resolue';
  if (rec.affectationReclamation === 'AFFECTEE') return 'affectee';
  if (rec.statut === 'ACCEPTEE') return 'acceptee';
  // Pour les rejetées, on affiche comme "en attente" (ne devrait pas arriver car filtrées)
  return 'en_attente';
}

export default function ReclamationCard({ reclamation, onClick, onDelete }: ReclamationCardProps) {
  const { data: session } = useSession();
  const status = getStatus(reclamation);
  const config = statusConfig[status];
  const date = new Date(reclamation.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer transition-all hover:border-[hsl(45,93%,47%)]/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-[hsl(213,80%,28%)]">
            {categoryIcons[reclamation.categorie] || <ClipboardList className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">REC-{String(reclamation.id).padStart(6, '0')}</p>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{reclamation.titre}</h3>
          </div>
        </div>
        
        {/* Status Badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.color}`}>
          <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
          {config.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
        {reclamation.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {reclamation.commune.nom}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {date}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
           {onDelete && (status === 'en_attente' || session?.user?.role === 'SUPER_ADMIN') && (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 onDelete();
               }}
               className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
               title="Supprimer la réclamation"
             >
               <Trash2 className="w-4 h-4" />
             </button>
           )}
           <span className="text-[hsl(213,80%,28%)] text-sm font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Détails
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
           </span>
        </div>
      </div>
    </motion.div>
  );
}

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface Talent {
  id: number;
  nom: string;
  prenom: string;
  nomArtistique?: string | null;
  domaine: string;
  photo?: string | null;
  bio?: string | null;
}

interface TalentCardProps {
  talent: Talent;
  onClick: () => void;
}

export default function TalentCard({ talent, onClick }: TalentCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="break-inside-avoid mb-6 bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {talent.photo ? (
          <Image
            src={talent.photo}
            alt={`${talent.prenom} ${talent.nom}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <span className="px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
            {talent.domaine}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
          {talent.nomArtistique || `${talent.prenom} ${talent.nom}`}
        </h3>
        {talent.nomArtistique && (
          <p className="text-sm text-gray-500">
            {talent.prenom} {talent.nom}
          </p>
        )}
      </div>
    </motion.div>
  );
}

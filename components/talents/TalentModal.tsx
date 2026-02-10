'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useEffect } from 'react';

interface Talent {
  id: number;
  nom: string;
  prenom: string;
  nomArtistique?: string | null;
  domaine: string;
  photo?: string | null;
  bio?: string | null;
  reseauxSociaux?: any;
}

interface TalentModalProps {
  talent: Talent | null;
  onClose: () => void;
}

export default function TalentModal({ talent, onClose }: TalentModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (talent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [talent]);

  if (!talent) return null;

  return (
    <AnimatePresence>
      {talent && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Image Section */}
              <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-100">
                {talent.photo ? (
                  <Image
                    src={talent.photo}
                    alt={`${talent.prenom} ${talent.nom}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    👤
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 md:hidden p-2 bg-white/80 backdrop-blur rounded-full text-gray-800 hover:bg-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/2 p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-2">
                      {talent.domaine}
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {talent.nomArtistique || `${talent.prenom} ${talent.nom}`}
                    </h2>
                    {talent.nomArtistique && (
                      <p className="text-lg text-gray-500 mt-1">
                        {talent.prenom} {talent.nom}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="hidden md:block p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="prose prose-emerald max-w-none mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Biographie</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {talent.bio || "Aucune biographie disponible."}
                  </p>
                </div>

                {/* Social Networks */}
                {talent.reseauxSociaux && Object.keys(talent.reseauxSociaux).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Réseaux Sociaux</h3>
                    <div className="flex gap-4">
                      {Object.entries(talent.reseauxSociaux).map(([network, url]) => (
                        <a
                          key={network}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-emerald-600"
                        >
                          <span className="capitalize font-medium">{network}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

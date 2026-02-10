'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, User, Camera, Trash2, CheckCircle, Clock } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface ReclamationModalProps {
  reclamationId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReclamationModal({ reclamationId, isOpen, onClose }: ReclamationModalProps) {
  const { data: session } = useSession();
  const isCitoyen = session?.user?.role === 'CITOYEN';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (isOpen && reclamationId) {
      setLoading(true);
      fetch(`/api/reclamations/${reclamationId}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success) setData(res.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, reclamationId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-gov-blue">#{reclamationId}</span>
                  {data?.titre || 'Détails de la réclamation'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                  </div>
                ) : data ? (
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column - Details */}
                    <div className="flex-1 space-y-6">
                      {/* Description */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <label className="text-sm font-medium text-gray-500 mb-2 block">Description</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{data.description}</p>
                      </div>

                      {/* Meta Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gov-blue" />
                          <span>{data.commune?.nom} - {data.localisation}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gov-blue" />
                          <span>{new Date(data.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                           <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                             data.statut === 'RESOLUE' ? 'bg-green-100 text-green-700' : 
                             data.statut === 'EN_ATTENTE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                           }`}>
                             {data.statut}
                           </span>
                        </div>
                      </div>

                      {/* Photos Gallery */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Camera className="w-4 h-4" /> Photos ({data.medias?.length || 0})
                        </h4>
                        {data.medias && data.medias.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {data.medias.map((media: any, index: number) => (
                              <div
                                key={media.id}
                                onClick={() => { setActivePhoto(index); setShowGallery(true); }}
                                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                              >
                                <img
                                  src={media.urlPublique}
                                  alt="Preuve"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm">
                            Aucune photo jointe
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Timeline */}
                    {!isCitoyen && (
                      <div className="w-full md:w-80 border-l border-gray-100 pl-8">
                        <h4 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Historique
                        </h4>
                        <div className="relative space-y-6">
                           <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                           {data.historique?.map((item: any) => (
                             <div key={item.id} className="relative flex gap-3">
                               <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center z-10">
                                 <div className="w-2 h-2 rounded-full bg-gov-blue"></div>
                               </div>
                               <div>
                                 <p className="text-sm font-medium text-gray-900">{item.action}</p>
                                 <p className="text-xs text-gray-500">
                                   {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </p>
                                 {item.commentaire && (
                                   <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">{item.commentaire}</p>
                                 )}
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Impossible de charger les détails
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Gallery Modal */}
          {showGallery && data?.medias && (
            <div 
              className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
              onClick={() => setShowGallery(false)}
            >
              <button className="absolute top-4 right-4 text-white p-2">
                <X className="w-8 h-8" />
              </button>
              <img
                src={data.medias[activePhoto].urlPublique}
                alt="Full size"
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

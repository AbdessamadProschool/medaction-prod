'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Building2,
  Star,
  Calendar,
  MessageSquare,
  Info,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  ChevronRight,
  ExternalLink,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface Etablissement {
  id: number;
  code: string;
  nom: string;
  secteur: string;
  nature: string | null;
  noteMoyenne: number;
  nombreEvaluations: number;
  photoPrincipale: string | null;
  statutFonctionnel: string | null;
  communeNom: string;
  annexeNom: string | null;
  evaluationsCount: number;
  reclamationsCount: number;
  evenementsCount: number;
}

interface EtablissementDetails {
  id: number;
  nom: string;
  nomArabe: string | null;
  secteur: string;
  nature: string | null;
  tutelle: string | null;
  responsableNom: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  adresseComplete: string | null;
  capaciteAccueil: number | null;
  effectifTotal: number | null;
  etatInfrastructure: string | null;
  services: string[];
  programmes: string[];
  noteMoyenne: number;
  nombreEvaluations: number;
  photoPrincipale: string | null;
  commune: { nom: string };
  annexe: { nom: string } | null;
  evaluations: any[];
  evenements: any[];
  reclamations: any[];
}

interface MapSidebarProps {
  etablissement: Etablissement | null;
  onClose: () => void;
  isOpen: boolean;
}

const TABS = [
  { id: 'infos', label: 'Infos', icon: Info },
  { id: 'avis', label: 'Avis', icon: Star },
  { id: 'events', label: 'Événements', icon: Calendar },
  { id: 'reclamations', label: 'Réclamations', icon: MessageSquare },
  { id: 'contact', label: 'Contact', icon: Phone },
];

const SECTEUR_CONFIG: Record<string, { color: string; gradient: string; label: string }> = {
  EDUCATION: { color: '#3B82F6', gradient: 'from-blue-500 to-indigo-600', label: 'Éducation' },
  SANTE: { color: '#EF4444', gradient: 'from-red-500 to-pink-600', label: 'Santé' },
  SPORT: { color: '#22C55E', gradient: 'from-green-500 to-emerald-600', label: 'Sport' },
  SOCIAL: { color: '#A855F7', gradient: 'from-purple-500 to-violet-600', label: 'Social' },
  CULTUREL: { color: '#F97316', gradient: 'from-orange-500 to-amber-600', label: 'Culturel' },
  AUTRE: { color: '#6B7280', gradient: 'from-gray-500 to-slate-600', label: 'Autre' },
};

export default function MapSidebar({ etablissement, onClose, isOpen }: MapSidebarProps) {
  const [activeTab, setActiveTab] = useState('infos');
  const [details, setDetails] = useState<EtablissementDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les détails
  useEffect(() => {
    if (etablissement) {
      setLoading(true);
      fetch(`/api/etablissements/${etablissement.id}`)
        .then(res => res.json())
        .then(data => {
          setDetails(data.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [etablissement?.id]);

  if (!isOpen || !etablissement) return null;

  const config = SECTEUR_CONFIG[etablissement.secteur] || SECTEUR_CONFIG.AUTRE;

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[1001] flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`relative bg-gradient-to-r ${config.gradient} p-6 text-white`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <X size={18} />
        </button>

        {etablissement.photoPrincipale && (
          <div className="absolute inset-0 opacity-20">
            <img
              src={etablissement.photoPrincipale}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="relative">
          <span className="inline-block px-2 py-1 bg-white/20 rounded text-xs font-medium mb-2">
            {config.label}
          </span>
          <h2 className="text-xl font-bold mb-1">{etablissement.nom}</h2>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <MapPin size={14} />
            {etablissement.communeNom}
            {etablissement.annexeNom && ` • ${etablissement.annexeNom}`}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{etablissement.noteMoyenne.toFixed(1)}</span>
              <span className="text-white/60 text-xs">({etablissement.nombreEvaluations})</span>
            </div>
            {etablissement.statutFonctionnel && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {etablissement.statutFonctionnel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} className="mx-auto mb-1" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Tab Infos */}
            {activeTab === 'infos' && details && (
              <div className="space-y-4">
                {/* Infos générales */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Informations</h3>
                  <div className="space-y-2 text-sm">
                    {details.nature && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nature</span>
                        <span className="font-medium">{details.nature}</span>
                      </div>
                    )}
                    {details.tutelle && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tutelle</span>
                        <span className="font-medium">{details.tutelle}</span>
                      </div>
                    )}
                    {details.responsableNom && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Responsable</span>
                        <span className="font-medium">{details.responsableNom}</span>
                      </div>
                    )}
                    {details.etatInfrastructure && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">État</span>
                        <span className="font-medium">{details.etatInfrastructure}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Capacités */}
                {(details.capaciteAccueil || details.effectifTotal) && (
                  <div className="grid grid-cols-2 gap-3">
                    {details.capaciteAccueil && (
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-blue-600">{details.capaciteAccueil}</p>
                        <p className="text-xs text-blue-700">Capacité</p>
                      </div>
                    )}
                    {details.effectifTotal && (
                      <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <Users className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-purple-600">{details.effectifTotal}</p>
                        <p className="text-xs text-purple-700">Effectif</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Services */}
                {details.services && details.services.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {details.services.map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Programmes */}
                {details.programmes && details.programmes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Programmes</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {details.programmes.map((p, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Avis */}
            {activeTab === 'avis' && details && (
              <div className="space-y-4">
                {/* Score global */}
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-amber-600">{details.noteMoyenne.toFixed(1)}</p>
                  <div className="flex items-center justify-center gap-0.5 my-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        size={16}
                        className={i <= details.noteMoyenne ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-amber-700">{details.nombreEvaluations} avis</p>
                </div>

                {/* Liste des avis */}
                {details.evaluations && details.evaluations.length > 0 ? (
                  <div className="space-y-3">
                    {details.evaluations.slice(0, 5).map((evaluation: any) => (
                      <div key={evaluation.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {evaluation.user?.prenom} {evaluation.user?.nom?.charAt(0)}.
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star
                                key={i}
                                size={10}
                                className={i <= evaluation.noteGlobale ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>
                        {evaluation.commentaire && (
                          <p className="text-xs text-gray-600 line-clamp-2">{evaluation.commentaire}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Aucun avis pour le moment</p>
                )}

                <Link
                  href={`/evaluer/${etablissement.id}`}
                  className="block w-full py-2.5 text-center bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                >
                  Donner mon avis
                </Link>
              </div>
            )}

            {/* Tab Événements */}
            {activeTab === 'events' && details && (
              <div className="space-y-3">
                {details.evenements && details.evenements.length > 0 ? (
                  details.evenements.slice(0, 5).map((event: any) => (
                    <Link
                      key={event.id}
                      href={`/evenements/${event.id}`}
                      className="block bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar size={20} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{event.titre}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock size={10} />
                            {new Date(event.dateDebut).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucun événement</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Réclamations */}
            {activeTab === 'reclamations' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{etablissement.reclamationsCount}</p>
                  <p className="text-sm text-gray-500">Réclamations</p>
                </div>

                <Link
                  href={`/reclamations/nouvelle?etablissementId=${etablissement.id}`}
                  className="block w-full py-2.5 text-center bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Signaler un problème
                </Link>
              </div>
            )}

            {/* Tab Contact */}
            {activeTab === 'contact' && details && (
              <div className="space-y-3">
                {details.telephone && (
                  <a
                    href={`tel:${details.telephone}`}
                    className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <Phone size={18} />
                    <span>{details.telephone}</span>
                  </a>
                )}
                {details.email && (
                  <a
                    href={`mailto:${details.email}`}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Mail size={18} />
                    <span className="truncate">{details.email}</span>
                  </a>
                )}
                {details.siteWeb && (
                  <a
                    href={details.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    <Globe size={18} />
                    <span className="truncate">Site web</span>
                    <ExternalLink size={14} className="ml-auto" />
                  </a>
                )}
                {details.adresseComplete && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-600">{details.adresseComplete}</span>
                    </div>
                  </div>
                )}

                {!details.telephone && !details.email && !details.siteWeb && (
                  <div className="text-center py-8">
                    <Phone className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Aucune information de contact</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <Link
          href={`/etablissements/${etablissement.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 text-emerald-600 font-medium hover:bg-emerald-50 rounded-xl transition-colors"
        >
          Voir la fiche complète
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
}

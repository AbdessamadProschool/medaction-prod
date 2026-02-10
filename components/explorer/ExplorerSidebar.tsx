'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Calendar, Newspaper, FileText, Megaphone, GraduationCap, Hospital, Trophy, HeartHandshake, Drama, ClipboardList } from 'lucide-react';

const types = [
  { id: 'all', label: 'Tout voir', icon: <Search className="w-4 h-4" /> },
  { id: 'event', label: 'Événements', icon: <Calendar className="w-4 h-4" /> },
  { id: 'news', label: 'Actualités', icon: <Newspaper className="w-4 h-4" /> },
  { id: 'article', label: 'Articles', icon: <FileText className="w-4 h-4" /> },
  { id: 'campaign', label: 'Campagnes', icon: <Megaphone className="w-4 h-4" /> },
];

const secteurs = [
  { id: 'EDUCATION', label: 'Éducation', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'SANTE', label: 'Santé', icon: <Hospital className="w-4 h-4" /> },
  { id: 'SPORT', label: 'Sport', icon: <Trophy className="w-4 h-4" /> },
  { id: 'SOCIAL', label: 'Social', icon: <HeartHandshake className="w-4 h-4" /> },
  { id: 'CULTUREL', label: 'Culturel', icon: <Drama className="w-4 h-4" /> },
  { id: 'AUTRE', label: 'Autre', icon: <ClipboardList className="w-4 h-4" /> },
];

const dates = [
  { id: 'any', label: 'Toute date' },
  { id: 'today', label: 'Aujourd\'hui' },
  { id: 'week', label: 'Cette semaine' },
  { id: 'month', label: 'Ce mois-ci' },
];

export default function ExplorerSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeType, setActiveType] = useState(searchParams.get('type') || 'all');
  const [activeSecteur, setActiveSecteur] = useState(searchParams.get('secteur') || '');
  const [activeDate, setActiveDate] = useState(searchParams.get('date') || 'any');

  // Mettre à jour l'URL quand les filtres changent
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'any') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page on filter change
    params.set('page', '1');
    router.push(`/explorer?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
      {/* Type de contenu */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          Type de contenu
        </h3>
        <div className="space-y-2">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setActiveType(type.id);
                updateFilters('type', type.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeType === type.id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secteurs (visible seulement si pertinent) */}
      {(activeType === 'all' || activeType === 'event' || activeType === 'news') && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Secteurs
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveSecteur('');
                updateFilters('secteur', '');
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !activeSecteur
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tous les secteurs
            </button>
            {secteurs.map((secteur) => (
              <button
                key={secteur.id}
                onClick={() => {
                  setActiveSecteur(secteur.id);
                  updateFilters('secteur', secteur.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSecteur === secteur.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{secteur.icon}</span>
                {secteur.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          Date
        </h3>
        <div className="space-y-2">
          {dates.map((date) => (
            <label key={date.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer group">
              <input
                type="radio"
                name="date"
                value={date.id}
                checked={activeDate === date.id}
                onChange={(e) => {
                  setActiveDate(e.target.value);
                  updateFilters('date', e.target.value);
                }}
                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <span className={`text-sm font-medium group-hover:text-emerald-600 transition-colors ${
                activeDate === date.id ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {date.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

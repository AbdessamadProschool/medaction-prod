'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TalentForm from '@/components/admin/talents/TalentForm';
import Image from 'next/image';

interface Talent {
  id: number;
  nom: string;
  prenom: string;
  nomArtistique?: string;
  domaine: string;
  photo?: string;
  isPublie: boolean;
  isMisEnAvant: boolean;
  nombreVues: number;
  createdAt: string;
}

export default function AdminTalentsPage() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTalents = async () => {
    setLoading(true);
    try {
      // On récupère tout sans filtre de publication pour l'admin
      // Note: L'API doit gérer le paramètre isPublie=undefined pour tout renvoyer si admin
      // On va passer un paramètre spécial ou juste ne pas passer isPublie
      const res = await fetch('/api/talents?limit=100&isPublie=false'); // isPublie=false avec admin session renvoie tout selon notre logique API
      // Attends, ma logique API était: si isPublie='false', renvoie isPublie=false.
      // Il faut que je corrige l'API pour permettre de tout récupérer.
      // Ou alors je fais 2 requêtes ? Non.
      // Je vais modifier l'API pour que si isPublie n'est pas fourni et qu'on est admin, on renvoie tout.
      // Actuellement: if (isPublie !== null) ... else if (!isAdmin) where.isPublie = true;
      // Donc si je ne passe pas isPublie et que je suis admin, where.isPublie n'est pas défini, donc ça renvoie tout. C'est bon.
      
      const res2 = await fetch('/api/talents?limit=100'); 
      const json = await res2.json();
      setTalents(json.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalents();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce talent ?')) return;

    try {
      const res = await fetch(`/api/talents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTalents(talents.filter(t => t.id !== id));
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const filteredTalents = talents.filter(t => 
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.nomArtistique && t.nomArtistique.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Talents</h1>
          <p className="text-gray-500">Gérez les profils des talents locaux</p>
        </div>
        <button
          onClick={() => {
            setEditingTalent(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau Talent
        </button>
      </div>

      {isFormOpen ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            {editingTalent ? 'Modifier le talent' : 'Ajouter un talent'}
          </h2>
          <TalentForm
            talent={editingTalent}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchTalents();
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Talent</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Domaine</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Vues</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : filteredTalents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucun talent trouvé
                    </td>
                  </tr>
                ) : (
                  filteredTalents.map((talent) => (
                    <tr key={talent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative flex-shrink-0">
                            {talent.photo ? (
                              <Image
                                src={talent.photo}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                👤
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {talent.nomArtistique || `${talent.prenom} ${talent.nom}`}
                            </div>
                            {talent.nomArtistique && (
                              <div className="text-sm text-gray-500">
                                {talent.prenom} {talent.nom}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                          {talent.domaine}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                            talent.isPublie ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {talent.isPublie ? 'Publié' : 'Brouillon'}
                          </span>
                          {talent.isMisEnAvant && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                              Mis en avant
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {talent.nombreVues}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingTalent(talent);
                              setIsFormOpen(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(talent.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

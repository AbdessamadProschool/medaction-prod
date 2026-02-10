'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  XCircle,
  UserCheck,
  MessageSquare,
  Loader2,
  AlertTriangle,
  Send,
  ArrowRight,
} from 'lucide-react';

interface Reclamation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  statut: 'ACCEPTEE' | 'REJETEE' | null;
  affectationReclamation: 'NON_AFFECTEE' | 'AFFECTEE';
  dateResolution: string | null;
  user: { id: number; nom: string; prenom: string };
  commune: { nom: string };
}

interface AutoriteLocale {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

interface TraiterReclamationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reclamation: Reclamation | null;
  onSuccess: () => void;
}

type ActionType = 'accepter' | 'rejeter' | 'affecter' | 'resoudre' | null;

export default function TraiterReclamationModal({
  isOpen,
  onClose,
  reclamation,
  onSuccess,
}: TraiterReclamationModalProps) {
  const [action, setAction] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [motifRejet, setMotifRejet] = useState('');
  const [solution, setSolution] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [autoriteId, setAutoriteId] = useState<number | null>(null);
  const [autorites, setAutorites] = useState<AutoriteLocale[]>([]);
  const [loadingAutorites, setLoadingAutorites] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setAction(null);
      setMotifRejet('');
      setSolution('');
      setCommentaire('');
      setAutoriteId(null);
      setError('');
    }
  }, [isOpen]);

  // Load autorites locales
  useEffect(() => {
    if (action === 'affecter' && autorites.length === 0) {
      loadAutorites();
    }
  }, [action]);

  const loadAutorites = async () => {
    setLoadingAutorites(true);
    try {
      const res = await fetch('/api/users?role=AUTORITE_LOCALE&isActive=true');
      if (res.ok) {
        const data = await res.json();
        setAutorites(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement autorités:', error);
    } finally {
      setLoadingAutorites(false);
    }
  };

  const handleSubmit = async () => {
    if (!reclamation || !action) return;
    
    setError('');
    setLoading(true);

    try {
      let endpoint = '';
      let body: any = { commentaire };

      switch (action) {
        case 'accepter':
          endpoint = `/api/reclamations/${reclamation.id}/statut`;
          body.statut = 'ACCEPTEE';
          break;
        
        case 'rejeter':
          if (motifRejet.trim().length < 10) {
            setError('Le motif doit contenir au moins 10 caractères');
            setLoading(false);
            return;
          }
          endpoint = `/api/reclamations/${reclamation.id}/rejeter`;
          body.motif = motifRejet;
          break;
        
        case 'affecter':
          if (!autoriteId) {
            setError('Veuillez sélectionner une autorité locale');
            setLoading(false);
            return;
          }
          endpoint = `/api/reclamations/${reclamation.id}/statut`;
          body.affecteeAAutoriteId = autoriteId;
          break;
        
        case 'resoudre':
          if (solution.trim().length < 10) {
            setError('La solution doit contenir au moins 10 caractères');
            setLoading(false);
            return;
          }
          endpoint = `/api/reclamations/${reclamation.id}/resoudre`;
          body.solution = solution;
          break;
      }

      const res = await fetch(endpoint, {
        method: action === 'accepter' || action === 'affecter' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || result.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur traitement:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Déterminer les actions disponibles
  const getAvailableActions = () => {
    if (!reclamation) return [];
    
    const actions: { id: ActionType; label: string; icon: any; color: string }[] = [];
    
    // Si pas encore de décision (statut null) -> accepter ou rejeter
    if (reclamation.statut === null) {
      actions.push(
        { id: 'accepter', label: 'Accepter', icon: CheckCircle, color: 'hsl(145,63%,32%)' },
        { id: 'rejeter', label: 'Rejeter', icon: XCircle, color: 'hsl(348,83%,47%)' }
      );
    }
    
    // Si acceptée mais non affectée -> affecter
    if (reclamation.statut === 'ACCEPTEE' && reclamation.affectationReclamation === 'NON_AFFECTEE') {
      actions.push(
        { id: 'affecter', label: 'Affecter', icon: UserCheck, color: 'hsl(213,80%,28%)' }
      );
    }
    
    // Si affectée et non résolue -> résoudre
    if (reclamation.statut === 'ACCEPTEE' && reclamation.affectationReclamation === 'AFFECTEE' && !reclamation.dateResolution) {
      actions.push(
        { id: 'resoudre', label: 'Résoudre', icon: Send, color: 'hsl(145,63%,32%)' }
      );
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  if (!isOpen || !reclamation) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] text-white">
            <div>
              <h2 className="text-lg font-semibold">Traiter la réclamation</h2>
              <p className="text-sm text-white/70 truncate max-w-xs">{reclamation.titre}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Sélection de l'action */}
            {!action && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">Choisissez l'action à effectuer :</p>
                
                {availableActions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune action disponible pour cette réclamation.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {availableActions.map((act) => {
                      const Icon = act.icon;
                      return (
                        <button
                          key={act.id}
                          onClick={() => setAction(act.id)}
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all group"
                        >
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${act.color}15` }}
                          >
                            <Icon size={24} style={{ color: act.color }} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900">{act.label}</p>
                            <p className="text-sm text-gray-500">
                              {act.id === 'accepter' && 'Valider cette réclamation pour traitement'}
                              {act.id === 'rejeter' && 'Refuser cette réclamation avec un motif'}
                              {act.id === 'affecter' && 'Assigner à une autorité locale'}
                              {act.id === 'resoudre' && 'Clôturer avec une solution'}
                            </p>
                          </div>
                          <ArrowRight size={18} className="text-gray-400 group-hover:text-gray-600" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Formulaire selon l'action */}
            {action && (
              <div className="space-y-4">
                {/* Bouton retour */}
                <button
                  onClick={() => setAction(null)}
                  className="text-sm text-[hsl(213,80%,28%)] hover:underline mb-4"
                >
                  ← Retour aux actions
                </button>

                {/* Accepter - pas de formulaire spécifique */}
                {action === 'accepter' && (
                  <div className="bg-[hsl(145,63%,32%)]/10 border border-[hsl(145,63%,32%)]/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-[hsl(145,63%,32%)]" />
                      <div>
                        <p className="font-medium text-gray-900">Accepter cette réclamation</p>
                        <p className="text-sm text-gray-600">
                          La réclamation sera validée et prête à être affectée.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejeter - motif obligatoire */}
                {action === 'rejeter' && (
                  <div className="space-y-4">
                    <div className="bg-[hsl(348,83%,47%)]/10 border border-[hsl(348,83%,47%)]/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-6 h-6 text-[hsl(348,83%,47%)] flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Rejeter cette réclamation</p>
                          <p className="text-sm text-gray-600">
                            Le citoyen sera informé du rejet avec le motif fourni.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="gov-label">Motif du rejet *</label>
                      <textarea
                        value={motifRejet}
                        onChange={(e) => setMotifRejet(e.target.value)}
                        rows={4}
                        className="gov-input"
                        placeholder="Expliquez pourquoi cette réclamation est rejetée..."
                      />
                      <p className="text-xs text-gray-400 mt-1">Minimum 10 caractères</p>
                    </div>
                  </div>
                )}

                {/* Affecter - sélection autorité */}
                {action === 'affecter' && (
                  <div className="space-y-4">
                    <div className="bg-[hsl(213,80%,28%)]/10 border border-[hsl(213,80%,28%)]/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <UserCheck className="w-6 h-6 text-[hsl(213,80%,28%)] flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Affecter à une autorité locale</p>
                          <p className="text-sm text-gray-600">
                            L'autorité recevra une notification et devra traiter la réclamation.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="gov-label">Autorité locale *</label>
                      {loadingAutorites ? (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-gray-500">Chargement...</span>
                        </div>
                      ) : (
                        <select
                          value={autoriteId || ''}
                          onChange={(e) => setAutoriteId(parseInt(e.target.value) || null)}
                          className="gov-input gov-select"
                        >
                          <option value="">Sélectionner une autorité</option>
                          {autorites.map((aut) => (
                            <option key={aut.id} value={aut.id}>
                              {aut.prenom} {aut.nom} ({aut.email})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {/* Résoudre - solution obligatoire */}
                {action === 'resoudre' && (
                  <div className="space-y-4">
                    <div className="bg-[hsl(145,63%,32%)]/10 border border-[hsl(145,63%,32%)]/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Send className="w-6 h-6 text-[hsl(145,63%,32%)] flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Résoudre cette réclamation</p>
                          <p className="text-sm text-gray-600">
                            Le citoyen sera informé de la résolution avec la solution apportée.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="gov-label">Solution apportée *</label>
                      <textarea
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        rows={4}
                        className="gov-input"
                        placeholder="Décrivez la solution apportée pour résoudre le problème..."
                      />
                      <p className="text-xs text-gray-400 mt-1">Minimum 10 caractères</p>
                    </div>
                  </div>
                )}

                {/* Commentaire interne (optionnel) */}
                <div>
                  <label className="gov-label">Commentaire interne (optionnel)</label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={2}
                    className="gov-input"
                    placeholder="Note interne pour le suivi..."
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-[hsl(348,83%,47%)]/10 border border-[hsl(348,83%,47%)]/20 rounded-lg p-3 flex items-center gap-2 text-[hsl(348,83%,47%)]">
                    <AlertTriangle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {action && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 transition-colors disabled:opacity-50 ${
                  action === 'rejeter' 
                    ? 'bg-[hsl(348,83%,47%)] hover:bg-[hsl(348,83%,42%)]'
                    : 'bg-[hsl(213,80%,28%)] hover:bg-[hsl(213,80%,25%)]'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {action === 'accepter' && <CheckCircle size={18} />}
                    {action === 'rejeter' && <XCircle size={18} />}
                    {action === 'affecter' && <UserCheck size={18} />}
                    {action === 'resoudre' && <Send size={18} />}
                  </>
                )}
                {action === 'accepter' && 'Accepter'}
                {action === 'rejeter' && 'Rejeter'}
                {action === 'affecter' && 'Affecter'}
                {action === 'resoudre' && 'Résoudre'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  FileText,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
  total: number;
}

interface Etablissement {
  id: number;
  nom: string;
  secteur: string;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les établissements gérés par le coordinateur
  useEffect(() => {
    const fetchEtabs = async () => {
      if (session?.user?.etablissementsGeres?.length) {
        try {
          const ids = session.user.etablissementsGeres.join(',');
          const res = await fetch(`/api/etablissements?ids=${ids}`);
          if (res.ok) {
            const data = await res.json();
            setEtablissements(data.data || []);
          }
        } catch (e) {
          console.error('Erreur chargement établissements:', e);
        }
      }
    };
    if (isOpen) fetchEtabs();
  }, [isOpen, session]);

  // Télécharger le template Excel (format tableau bien tracé)
  const downloadTemplate = () => {
    // Créer un fichier HTML tableau que Excel peut ouvrir parfaitement
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  table { border-collapse: collapse; width: 100%; }
  th { 
    background-color: #1E3A5F; 
    color: white; 
    font-weight: bold; 
    padding: 12px 8px; 
    border: 2px solid #0D1F33;
    text-align: center;
  }
  td { 
    padding: 8px; 
    border: 1px solid #ccc; 
    text-align: left;
  }
  tr:nth-child(even) { background-color: #f9f9f9; }
  tr:nth-child(odd) { background-color: #ffffff; }
  .instructions {
    background-color: #FFF3CD;
    padding: 15px;
    margin-bottom: 20px;
    border: 1px solid #FFC107;
    font-family: Arial, sans-serif;
  }
  .required { color: #DC3545; }
</style>
</head>
<body>
<div class="instructions">
  <h2>📋 Instructions d'import des Programmes d'Activités</h2>
  <p><strong>Format des colonnes :</strong></p>
  <ul>
    <li><strong>date</strong><span class="required">*</span> : Format AAAA-MM-JJ (ex: 2025-01-15)</li>
    <li><strong>heureDebut</strong><span class="required">*</span> : Heure de début (8 à 22)</li>
    <li><strong>heureFin</strong><span class="required">*</span> : Heure de fin (9 à 22)</li>
    <li><strong>titre</strong><span class="required">*</span> : Titre de l'activité (min 5 caractères)</li>
    <li><strong>description</strong> : Description détaillée</li>
    <li><strong>typeActivite</strong><span class="required">*</span> : Type d'activité</li>
    <li><strong>etablissementId</strong><span class="required">*</span> : ID de l'établissement</li>
    <li><strong>lieu</strong> : Lieu spécifique</li>
    <li><strong>participantsAttendus</strong> : Nombre de participants prévus</li>
    <li><strong>responsableNom</strong> : Nom du responsable</li>
  </ul>
  <p><span class="required">*</span> Champs obligatoires</p>
</div>

<table>
  <thead>
    <tr>
      <th>date</th>
      <th>heureDebut</th>
      <th>heureFin</th>
      <th>titre</th>
      <th>description</th>
      <th>typeActivite</th>
      <th>etablissementId</th>
      <th>lieu</th>
      <th>participantsAttendus</th>
      <th>responsableNom</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2025-01-15</td>
      <td>9</td>
      <td>12</td>
      <td>Soutien scolaire en mathématiques</td>
      <td>Cours de révision pour les élèves de 3ème - Préparation examen</td>
      <td>Soutien scolaire</td>
      <td>1</td>
      <td>Salle 101</td>
      <td>25</td>
      <td>M. Benslimane</td>
    </tr>
    <tr>
      <td>2025-01-16</td>
      <td>14</td>
      <td>17</td>
      <td>Atelier de théâtre pour jeunes</td>
      <td>Expression dramatique et improvisation pour les 12-16 ans</td>
      <td>Théâtre et expression dramatique</td>
      <td>2</td>
      <td>Salle polyvalente</td>
      <td>15</td>
      <td>Mme. Alami</td>
    </tr>
    <tr>
      <td>2025-01-17</td>
      <td>10</td>
      <td>12</td>
      <td>Tournoi de football inter-quartiers</td>
      <td>Compétition sportive pour les jeunes du quartier</td>
      <td>Tournois sportifs</td>
      <td>1</td>
      <td>Terrain municipal</td>
      <td>40</td>
      <td>M. Rachidi</td>
    </tr>
    <tr>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>

<div class="instructions" style="margin-top: 20px;">
  <h3>📝 Types d'activités disponibles :</h3>
  <p><strong>Éducatives :</strong> Soutien scolaire, Alphabétisation, Cours de langues, Aide aux devoirs, Formation informatique...</p>
  <p><strong>Culturelles :</strong> Théâtre, Musique, Dessin/Peinture, Danse, Calligraphie, Ciné-club...</p>
  <p><strong>Sportives :</strong> Football, Basketball, Arts martiaux, Fitness, Tournois sportifs...</p>
  <p><strong>Sociales :</strong> Volontariat, Sensibilisation citoyenneté, Environnement...</p>
  <p><strong>Professionnelles :</strong> Orientation, CV/Entretien, Entrepreneuriat, Formations métiers...</p>
</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_programmes_activites.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier le type de fichier
      const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        setError('Veuillez sélectionner un fichier CSV ou Excel');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/programmes-activites/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import');
      }

      setResult(data);
      
      if (data.success > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Import en masse</h3>
                <p className="text-sm text-gray-500">Importer des activités depuis un fichier</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Comment utiliser l'import :
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                    <li>Téléchargez le modèle CSV ci-dessous</li>
                    <li>Remplissez le fichier avec vos activités</li>
                    <li>Utilisez les IDs ci-dessous pour la colonne etablissementId</li>
                    <li>Importez le fichier complété</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Liste des établissements avec ID */}
            {etablissements.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <h4 className="font-semibold text-amber-900">Référence des établissements</h4>
                </div>
                <div className="space-y-2">
                  {etablissements.map((etab) => (
                    <div 
                      key={etab.id} 
                      className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm"
                    >
                      <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-gov-blue to-blue-600 text-white font-bold flex items-center justify-center text-lg">
                        {etab.id}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{etab.nom}</p>
                        <p className="text-xs text-gray-500">{etab.secteur}</p>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                        ID: {etab.id}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-amber-700">
                  💡 Utilisez l'ID (premier nombre) dans la colonne "etablissementId" de votre fichier
                </p>
              </div>
            )}

            {/* Download Template */}
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Télécharger le modèle CSV</span>
            </button>

            {/* File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-6 border-2 border-dashed rounded-xl transition-all ${
                  file
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setResult(null);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-medium text-gray-900 dark:text-white">
                      Cliquez pour sélectionner un fichier
                    </p>
                    <p className="text-sm text-gray-500">CSV ou Excel (.csv, .xlsx)</p>
                  </div>
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`p-4 rounded-xl ${
                result.errors.length === 0
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : 'bg-amber-50 dark:bg-amber-900/20'
              }`}>
                <div className="flex items-start gap-3">
                  {result.errors.length === 0 ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      result.errors.length === 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {result.success} activité(s) importée(s) sur {result.total}
                    </p>
                    {result.errors.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        <p className="text-sm text-amber-700 font-medium mb-1">Erreurs :</p>
                        {result.errors.slice(0, 5).map((err, i) => (
                          <p key={i} className="text-xs text-amber-600">
                            Ligne {err.row}: {err.message}
                          </p>
                        ))}
                        {result.errors.length > 5 && (
                          <p className="text-xs text-amber-600 mt-1">
                            ...et {result.errors.length - 5} autres erreurs
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {result ? 'Fermer' : 'Annuler'}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importer
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

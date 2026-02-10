'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Database, 
  Download, 
  Trash2, 
  Plus, 
  HardDrive, 
  Clock, 
  FileJson,
  AlertTriangle,
  Loader2,
  Check,
  X,
  Upload
} from 'lucide-react';

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

export default function SuperAdminBackupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [status, session, router]);

  const loadBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (error) {
      console.error('Erreur chargement backups:', error);
      setError('Impossible de charger la liste des sauvegardes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      loadBackups();
    }
  }, [session]);

  const handleCreateBackup = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Sauvegarde créée avec succès');
        loadBackups();
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      setError('Erreur réseau');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file extension
    if (!file.name.endsWith('.json')) {
      setError('Format invalide. Veuillez utiliser un fichier .json');
      return;
    }

    if (!confirm('ATTENTION: Cette action va REMPLACER toutes les données actuelles par celles du backup. Continuer ?')) {
      e.target.value = ''; // Reset input
      return;
    }

    setRestoring(true);
    setSuccess(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Restauration effectuée avec succès !');
        setTimeout(() => window.location.reload(), 2000); // Reload to reflect data changes
      } else {
        setError(data.error || 'Erreur lors de la restauration');
      }
    } catch (err) {
      setError('Erreur réseau');
    } finally {
      setRestoring(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ?')) return;

    setDeleting(filename);
    try {
      const res = await fetch(`/api/backups/${filename}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('Sauvegarde supprimée');
        // Mise à jour optimiste
        setBackups(prev => prev.filter(b => b.name !== filename));
      } else {
        setError('Impossible de supprimer le fichier');
      }
    } catch (error) {
      setError('Erreur réseau');
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Messages */}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 animate-in fade-in slide-in-from-top-2">
            <Check size={18} />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto hover:bg-emerald-100 p-1 rounded">
              <X size={14} />
            </button>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={18} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 p-1 rounded">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                 <Database size={24} />
               </div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sauvegardes Système</h1>
            </div>
            <p className="text-gray-500">
              Gérez les sauvegardes manuelles de la base de données. 
              Les fichiers sont stockés au format JSON sécurisé.
            </p>
          </div>

          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-medium transition-all transform active:scale-95"
          >
            {creating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            Créer une sauvegarde
          </button>
          
          <div className="relative">
             <input
               type="file"
               id="restore-upload"
               accept=".json"
               className="hidden"
               onChange={handleRestore}
               disabled={restoring || creating}
             />
             <label
               htmlFor="restore-upload"
               className={`flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm font-medium transition-all cursor-pointer ${restoring ? 'opacity-50 pointer-events-none' : ''}`}
             >
               {restoring ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
               Restaurer
             </label>
          </div>
        </div>

        {/* Liste */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {backups.map((backup) => (
              <div 
                key={backup.name}
                className="group relative bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <FileJson className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/backups/${backup.name}`}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Télécharger"
                    >
                      <Download size={18} />
                    </a>
                    <button
                      onClick={() => handleDelete(backup.name)}
                      disabled={deleting === backup.name}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      {deleting === backup.name ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1" title={backup.name}>
                  {backup.name}
                </h3>
                
                <div className="space-y-1 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    {new Date(backup.createdAt).toLocaleString('fr-FR')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <HardDrive size={14} />
                    {formatSize(backup.size)}
                  </div>
                </div>
              </div>
            ))}
            
            {backups.length === 0 && !loading && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Aucune sauvegarde</h3>
                <p className="text-gray-500 max-w-sm mt-1">
                  Créez votre première sauvegarde pour sécuriser les données de l'application.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

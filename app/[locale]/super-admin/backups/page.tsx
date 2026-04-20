'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
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
  Upload,
  RefreshCw,
  Save,
  ShieldCheck
} from 'lucide-react';

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

export default function SuperAdminBackupsPage() {
  const t = useTranslations('admin.backups');
  const locale = useLocale();
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
      setError(t('messages.error_network'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      loadBackups();
    }
  }, [session?.user?.role]);

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
        setSuccess(t('messages.created'));
        loadBackups();
      } else {
        setError(data.error || t('messages.error_create'));
      }
    } catch (error) {
      setError(t('messages.error_network'));
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file extension
    if (!file.name.endsWith('.json')) {
      setError(t('messages.error_format'));
      return;
    }

    if (!confirm(t('confirm_restore'))) {
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
        setSuccess(t('messages.restored'));
        setTimeout(() => window.location.reload(), 2000); // Reload to reflect data changes
      } else {
        setError(data.error || t('messages.error_restore'));
      }
    } catch (err) {
      setError(t('messages.error_network'));
    } finally {
      setRestoring(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(t('confirm_delete'))) return;

    setDeleting(filename);
    try {
      const res = await fetch(`/api/backups/${filename}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess(t('messages.deleted'));
        // Mise à jour optimiste
        setBackups(prev => prev.filter(b => b.name !== filename));
      } else {
        setError(t('messages.error_delete'));
      }
    } catch (error) {
      setError(t('messages.error_network'));
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

  const formatBackupName = (name: string) => {
      // backup-2026-02-14T15-56-02.json -> 14 Fev 2026 15:56
      // ou ...2026-02-14...
      // Essayons de trouver une date ISO dans le nom
      const match = name.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})[-:](\d{2})[-:](\d{2})/);
      if (match) {
          const [_, year, month, day, hour, min, sec] = match;
          const date = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
          return new Intl.DateTimeFormat(locale, { 
              dateStyle: 'medium', 
              timeStyle: 'medium' 
            }).format(date);
      }
      return name.replace('.json', '').replace('backup-', '');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Messages */}
        <AnimatePresence>
            {success && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 shadow-sm"
            >
                <div className="p-1 bg-emerald-100 dark:bg-emerald-800 rounded-full">
                    <Check size={16} />
                </div>
                {success}
                <button onClick={() => setSuccess(null)} className="ml-auto hover:bg-emerald-100 dark:hover:bg-emerald-800 p-1.5 rounded-lg transition-colors">
                <X size={16} />
                </button>
            </motion.div>
            )}
            
            {error && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 shadow-sm"
            >
                <div className="p-1 bg-red-100 dark:bg-red-800 rounded-full">
                    <AlertTriangle size={16} />
                </div>
                {error}
                <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 dark:hover:bg-red-800 p-1.5 rounded-lg transition-colors">
                <X size={16} />
                </button>
            </motion.div>
            )}
        </AnimatePresence>

        {/* Header */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div className="flex gap-4">
             <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white h-fit">
               <Database size={32} />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   {t('title')}
                   <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                       {backups.length} fichiers
                   </span>
               </h1>
               <p className="text-gray-500 dark:text-gray-400 max-w-xl mt-1 text-sm leading-relaxed">
                 {t('subtitle')}
               </p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative group w-full sm:w-auto">
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
                  className={`flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm font-medium transition-all cursor-pointer w-full sm:w-auto ${restoring ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {restoring ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  {t('restore')}
                </label>
             </div>

            <button
              onClick={handleCreateBackup}
              disabled={creating}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg disabled:opacity-50 font-medium transition-all transform active:scale-95 w-full sm:w-auto"
            >
              {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {t('create')}
            </button>
          </div>
        </motion.div>

        {/* Liste */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
                {backups.map((backup, index) => (
                <motion.div 
                    key={backup.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/5"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <FileJson className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                                href={`/api/backups/${backup.name}`}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors"
                                title="Télécharger"
                            >
                                <Download size={18} />
                            </a>
                            <button
                                onClick={() => handleDelete(backup.name)}
                                disabled={deleting === backup.name}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors"
                                title="Supprimer"
                            >
                                {deleting === backup.name ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                            {formatBackupName(backup.name)}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono truncate" title={backup.name}>
                            {backup.name}
                        </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md">
                            <Clock size={12} />
                            {new Date(backup.createdAt).toLocaleDateString(locale)}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md">
                            <HardDrive size={12} />
                            {formatSize(backup.size)}
                        </div>
                    </div>
                    
                    {/* Indicateur de sécurité visuel */}
                    <div className="absolute top-4 right-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShieldCheck size={16} />
                    </div>
                </motion.div>
                ))}
            </AnimatePresence>
            
            {backups.length === 0 && !loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700"
              >
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
                  <Save className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('empty')}</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {t('empty_desc')}
                </p>
                <button
                    onClick={handleCreateBackup}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                    {t('create_first')}
                </button>
              </motion.div>
            )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Key,
  Shield,
  ShieldCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  X,
  Check,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  Users,
  Settings,
  Database,
  FileText,
  Building2,
  MessageSquare,
  Calendar,
  ArrowLeft,
} from 'lucide-react';

interface Permission {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  groupe: string;
  groupeLabel: string;
  ordre: number;
  isActive: boolean;
  _count?: {
    admins: number;
  };
}

interface PermissionGroup {
  name: string;
  label: string;
  icon: React.ElementType;
  color: string;
  permissions: Permission[];
}

const GROUP_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  USERS: { icon: Users, color: 'from-blue-500 to-indigo-600' },
  RECLAMATIONS: { icon: MessageSquare, color: 'from-orange-500 to-red-600' },
  ETABLISSEMENTS: { icon: Building2, color: 'from-emerald-500 to-teal-600' },
  EVENEMENTS: { icon: Calendar, color: 'from-purple-500 to-violet-600' },
  CONTENT: { icon: FileText, color: 'from-pink-500 to-rose-600' },
  SETTINGS: { icon: Settings, color: 'from-gray-500 to-gray-700' },
  SYSTEM: { icon: Database, color: 'from-cyan-500 to-blue-600' },
};

export default function SuperAdminPermissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Form
  const [form, setForm] = useState({
    code: '',
    nom: '',
    description: '',
    groupe: '',
    groupeLabel: '',
  });

  // Redirect if not SUPER_ADMIN
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/admin');
      toast.error('Accès réservé aux Super Administrateurs');
    }
  }, [status, session, router]);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || []);
        
        // Group permissions
        const grouped: Record<string, Permission[]> = {};
        (data.permissions || []).forEach((perm: Permission) => {
          if (!grouped[perm.groupe]) {
            grouped[perm.groupe] = [];
          }
          grouped[perm.groupe].push(perm);
        });
        
        // Convert to array with icons
        const groupedArray: PermissionGroup[] = Object.entries(grouped).map(([groupe, perms]) => ({
          name: groupe,
          label: perms[0]?.groupeLabel || groupe,
          icon: GROUP_ICONS[groupe]?.icon || Lock,
          color: GROUP_ICONS[groupe]?.color || 'from-gray-500 to-gray-700',
          permissions: perms.sort((a, b) => a.ordre - b.ordre),
        }));
        
        setGroupedPermissions(groupedArray);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      fetchPermissions();
    }
  }, [fetchPermissions, session]);

  // Toggle permission active state
  const handleToggleActive = async (perm: Permission) => {
    setActionLoading(`toggle-${perm.id}`);
    try {
      const res = await fetch(`/api/permissions/${perm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !perm.isActive }),
      });

      if (res.ok) {
        toast.success(perm.isActive ? 'Permission désactivée' : 'Permission activée');
        fetchPermissions();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete permission
  const handleDelete = async (perm: Permission) => {
    if (!confirm(`Supprimer la permission "${perm.nom}" ? Cette action est irréversible.`)) return;
    
    setActionLoading(`delete-${perm.id}`);
    try {
      const res = await fetch(`/api/permissions/${perm.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Permission supprimée');
        fetchPermissions();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  // Create/Update permission
  const handleSubmit = async () => {
    if (!form.code || !form.nom || !form.groupe) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setActionLoading('submit');
    try {
      const url = selectedPermission 
        ? `/api/permissions/${selectedPermission.id}`
        : '/api/permissions';
      const method = selectedPermission ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(selectedPermission ? 'Permission mise à jour' : 'Permission créée');
        setShowCreateModal(false);
        setSelectedPermission(null);
        setForm({ code: '', nom: '', description: '', groupe: '', groupeLabel: '' });
        fetchPermissions();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter permissions by search
  const filteredGroups = groupedPermissions.map(group => ({
    ...group,
    permissions: group.permissions.filter(p =>
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(g => g.permissions.length > 0);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/super-admin"
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur">
              <Key className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gestion des Permissions</h1>
              <p className="text-amber-100 text-sm">Système RBAC - Contrôle d'accès basé sur les rôles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une permission..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPermissions}
              disabled={refreshing}
              className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                setSelectedPermission(null);
                setForm({ code: '', nom: '', description: '', groupe: '', groupeLabel: '' });
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={18} />
              Nouvelle permission
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{permissions.length}</p>
            <p className="text-sm text-gray-500">Total permissions</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-emerald-600">{permissions.filter(p => p.isActive).length}</p>
            <p className="text-sm text-gray-500">Actives</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-red-600">{permissions.filter(p => !p.isActive).length}</p>
            <p className="text-sm text-gray-500">Inactives</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-purple-600">{groupedPermissions.length}</p>
            <p className="text-sm text-gray-500">Groupes</p>
          </div>
        </div>

        {/* Permission Groups */}
        <div className="space-y-6">
          {filteredGroups.map((group) => {
            const Icon = group.icon;
            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                {/* Group Header */}
                <div className={`bg-gradient-to-r ${group.color} px-6 py-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6" />
                    <div>
                      <h3 className="font-bold text-lg">{group.label}</h3>
                      <p className="text-sm opacity-80">{group.permissions.length} permission(s)</p>
                    </div>
                  </div>
                </div>

                {/* Permissions List */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {group.permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded font-mono">
                              {perm.code}
                            </code>
                            {!perm.isActive && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                Inactive
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{perm.nom}</h4>
                          {perm.description && (
                            <p className="text-sm text-gray-500 mt-1">{perm.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(perm)}
                            disabled={!!actionLoading}
                            className={`p-2 rounded-lg transition-colors ${
                              perm.isActive
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={perm.isActive ? 'Désactiver' : 'Activer'}
                          >
                            {actionLoading === `toggle-${perm.id}` ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : perm.isActive ? (
                              <Lock size={18} />
                            ) : (
                              <Unlock size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPermission(perm);
                              setForm({
                                code: perm.code,
                                nom: perm.nom,
                                description: perm.description || '',
                                groupe: perm.groupe,
                                groupeLabel: perm.groupeLabel,
                              });
                              setShowCreateModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(perm)}
                            disabled={!!actionLoading}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            {actionLoading === `delete-${perm.id}` ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="text-center py-16">
              <Key className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aucune permission
              </h3>
              <p className="text-gray-500">
                {search ? 'Aucun résultat pour votre recherche' : 'Créez votre première permission'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {selectedPermission ? 'Modifier la permission' : 'Nouvelle permission'}
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="USER_CREATE"
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      placeholder="Créer des utilisateurs"
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Description de la permission..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Groupe *
                      </label>
                      <select
                        value={form.groupe}
                        onChange={(e) => setForm({ ...form, groupe: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Sélectionner</option>
                        <option value="USERS">Utilisateurs</option>
                        <option value="RECLAMATIONS">Réclamations</option>
                        <option value="ETABLISSEMENTS">Établissements</option>
                        <option value="EVENEMENTS">Événements</option>
                        <option value="CONTENT">Contenu</option>
                        <option value="SETTINGS">Paramètres</option>
                        <option value="SYSTEM">Système</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Label du groupe
                      </label>
                      <input
                        type="text"
                        value={form.groupeLabel}
                        onChange={(e) => setForm({ ...form, groupeLabel: e.target.value })}
                        placeholder="Gestion des utilisateurs"
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={actionLoading === 'submit'}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {actionLoading === 'submit' && <Loader2 size={16} className="animate-spin" />}
                    {selectedPermission ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

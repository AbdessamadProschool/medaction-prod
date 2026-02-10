'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Search,
  Plus,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  KeyRound,
  ShieldOff,
  Edit,
  Trash2,
} from 'lucide-react';

interface Permission {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  groupe: string;
  groupeLabel: string;
  ordre: number;
}

interface Admin {
  id: number;
  email: string;
  telephone: string | null;
  nom: string;
  prenom: string;
  photo: string | null;
  role: string;
  isActive: boolean;
  twoFactorEnabled?: boolean;
  derniereConnexion: string | null;
  createdAt: string;
  permissions: string[];
  permissionsDetails?: Permission[];
}

export default function SuperAdminAdminsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations();
  
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Formulaire création
  const [createForm, setCreateForm] = useState({
    email: '',
    telephone: '',
    nom: '',
    prenom: '',
    motDePasse: '',
    permissions: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [status, session, router]);

  // Charger les permissions disponibles
  const loadPermissions = async () => {
    try {
      const res = await fetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        setAllPermissions(data.grouped || {});
      }
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
    }
  };

  // Charger les admins
  const loadAdmins = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      
      const res = await fetch(`/api/admins?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      loadAdmins();
      loadPermissions();
    }
  }, [loadAdmins, session]);

  // États pour l'édition et la suppression
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [editForm, setEditForm] = useState({
    id: 0,
    email: '',
    telephone: '',
    nom: '',
    prenom: '',
    isActive: true,
  });

  // Ouvrir le modal d'édition
  const openEditModal = (admin: Admin) => {
    setEditForm({
      id: admin.id,
      email: admin.email,
      telephone: admin.telephone || '',
      nom: admin.nom,
      prenom: admin.prenom,
      isActive: admin.isActive,
    });
    setShowEditModal(true);
  };

  // Mettre à jour un admin
  const handleUpdate = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admins/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editForm.email,
          telephone: editForm.telephone || null,
          nom: editForm.nom,
          prenom: editForm.prenom,
          isActive: editForm.isActive,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Administrateur mis à jour avec succès');
        setShowEditModal(false);
        loadAdmins();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setSaving(false);
    }
  };

  // Supprimer un admin
  const handleDelete = async () => {
    if (!adminToDelete) return;
    
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admins/${adminToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Administrateur supprimé avec succès');
        setShowDeleteModal(false);
        setAdminToDelete(null);
        loadAdmins();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setSaving(false);
    }
  };

  // Générer un mot de passe sécurisé
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm({ ...createForm, motDePasse: password });
    setShowPassword(true);
  };

  // Créer un admin
  const handleCreate = async () => {
    setError(null);
    
    if (!createForm.email || !createForm.nom || !createForm.prenom || !createForm.motDePasse) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (createForm.motDePasse.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Administrateur créé avec succès!');
        setShowCreateModal(false);
        setCreateForm({ email: '', telephone: '', nom: '', prenom: '', motDePasse: '', permissions: [] });
        loadAdmins();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setCreating(false);
    }
  };

  // Ouvrir le modal de permissions
  const openPermissionsModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setSelectedPermissions([...admin.permissions]);
    setShowPermissionsModal(true);
  };

  // Modifier les permissions
  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;
    
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admins/${selectedAdmin.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Permissions mises à jour!');
        setShowPermissionsModal(false);
        setSelectedAdmin(null);
        loadAdmins();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erreur');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  // Toggle une permission
  const togglePermission = (code: string, target: 'create' | 'edit') => {
    if (target === 'create') {
      setCreateForm(prev => ({
        ...prev,
        permissions: prev.permissions.includes(code)
          ? prev.permissions.filter(p => p !== code)
          : [...prev.permissions, code]
      }));
    } else {
      setSelectedPermissions(prev => 
        prev.includes(code)
          ? prev.filter(p => p !== code)
          : [...prev, code]
      );
    }
  };

  // Sélectionner/désélectionner un groupe entier
  const toggleGroup = (permissions: Permission[], target: 'create' | 'edit') => {
    const codes = permissions.map(p => p.code);
    const currentPerms = target === 'create' ? createForm.permissions : selectedPermissions;
    const allSelected = codes.every(c => currentPerms.includes(c));
    
    if (target === 'create') {
      setCreateForm(prev => ({
        ...prev,
        permissions: allSelected
          ? prev.permissions.filter(p => !codes.includes(p))
          : Array.from(new Set([...prev.permissions, ...codes]))
      }));
    } else {
      setSelectedPermissions(prev => 
        allSelected
          ? prev.filter(p => !codes.includes(p))
          : Array.from(new Set([...prev, ...codes]))
      );
    }
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Messages */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700">
            <Check size={18} />
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle size={18} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('admin_management.title')}
              </h1>
            </div>
            <p className="text-gray-500">{total} {t('admin_management.subtitle')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadAdmins}
              disabled={refreshing}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                setCreateForm({ email: '', telephone: '', nom: '', prenom: '', motDePasse: '', permissions: [] });
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              <Plus size={18} />
              {t('admin_management.new_admin')}
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('admin_management.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin_management.columns.administrator')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin_management.columns.contact')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin_management.columns.role')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin_management.columns.permissions')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin_management.columns.status')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin_management.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          admin.role === 'SUPER_ADMIN' 
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                            : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        }`}>
                          {admin.prenom?.[0]?.toUpperCase()}{admin.nom?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {admin.prenom} {admin.nom}
                          </p>
                          <p className="text-xs text-gray-500">Créé le {new Date(admin.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          {admin.email}
                        </div>
                        {admin.telephone && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Phone size={14} className="text-gray-400" />
                            {admin.telephone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        admin.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {admin.role === 'SUPER_ADMIN' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                        {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          admin.role === 'SUPER_ADMIN' ? 'text-purple-600' : 'text-blue-600'
                        }`}>
                          {admin.role === 'SUPER_ADMIN' ? t('admin_management.all_permissions') : admin.permissions?.length || 0}
                        </span>
                        <span className="text-xs text-gray-400">
                          {admin.role === 'SUPER_ADMIN' ? '' : 'permissions'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        admin.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {admin.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {admin.isActive ? t('admin_management.status.active') : t('admin_management.status.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {admin.role !== 'SUPER_ADMIN' && (
                          <>
                            <button
                              onClick={() => openPermissionsModal(admin)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Gérer les permissions"
                            >
                              <ShieldCheck size={18} />
                            </button>
                            <button
                              onClick={() => openEditModal(admin)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setAdminToDelete(admin);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        {admin.role === 'SUPER_ADMIN' && (
                          <span className="text-xs text-gray-400 italic">Super Admin</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {admins.length === 0 && (
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun administrateur trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Créez votre premier administrateur</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {page} sur {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Créer Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  Créer un administrateur
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations personnelles */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Informations personnelles
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={createForm.prenom}
                      onChange={(e) => setCreateForm({ ...createForm, prenom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={createForm.nom}
                      onChange={(e) => setCreateForm({ ...createForm, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Auth */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Contact & Authentification
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="admin@medaction.ma"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={createForm.telephone}
                      onChange={(e) => setCreateForm({ ...createForm, telephone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={createForm.motDePasse}
                          onChange={(e) => setCreateForm({ ...createForm, motDePasse: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Min. 8 caractères"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium whitespace-nowrap"
                      >
                        Générer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Permissions
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({createForm.permissions.length} sélectionnées)
                  </span>
                </h4>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {Object.entries(allPermissions).map(([groupLabel, permissions]) => (
                    <div key={groupLabel} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-800">{groupLabel}</span>
                        <button
                          type="button"
                          onClick={() => toggleGroup(permissions, 'create')}
                          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                        >
                          {permissions.every(p => createForm.permissions.includes(p.code)) ? 'Tout retirer' : 'Tout ajouter'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {permissions.map(perm => (
                          <button
                            key={perm.code}
                            type="button"
                            onClick={() => togglePermission(perm.code, 'create')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              createForm.permissions.includes(perm.code)
                                ? 'bg-purple-500 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {perm.nom}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                * Champs obligatoires
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 font-medium"
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}
                  Créer l'administrateur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Permissions */}
      {showPermissionsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedAdmin.prenom?.[0]?.toUpperCase()}{selectedAdmin.nom?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {`${selectedAdmin.prenom} ${selectedAdmin.nom}`}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedAdmin.email}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Permissions</h4>
                <span className="text-sm text-purple-600 font-medium">
                  {selectedPermissions.length} sélectionnées
                </span>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(allPermissions).map(([groupLabel, permissions]) => (
                  <div key={groupLabel} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-800">{groupLabel}</span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(permissions, 'edit')}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        {permissions.every(p => selectedPermissions.includes(p.code)) ? 'Tout retirer' : 'Tout ajouter'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map(perm => (
                        <button
                          key={perm.code}
                          type="button"
                          onClick={() => togglePermission(perm.code, 'edit')}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            selectedPermissions.includes(perm.code)
                              ? 'bg-purple-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {perm.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 font-medium"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Suppression */}
      {showDeleteModal && adminToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer l'administrateur ?</h3>
              <p className="text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer <strong>{`${adminToDelete.prenom} ${adminToDelete.nom}`}</strong> ?
                Cette action est irréversible et supprimera toutes ses données associées.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edition */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white">Modifier l'administrateur</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Info Perso */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Informations Personnelles
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={editForm.prenom}
                      onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={editForm.nom}
                      onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="tel"
                        value={editForm.telephone}
                        onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${editForm.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${editForm.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="hidden"
                  />
                  <span className="font-medium text-gray-700">Compte Actif</span>
                </label>
                <p className="text-sm text-gray-500 mt-2 ml-15 pl-1">
                  Les comptes inactifs ne peuvent pas se connecter à la plateforme.
                </p>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 font-medium"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

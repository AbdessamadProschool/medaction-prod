'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  X,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import CreateUserModal from './CreateUserModal';
import EditRoleModal from './EditRoleModal';

interface User {
  id: number;
  email: string;
  telephone: string | null;
  nom: string;
  prenom: string;
  photo: string | null;
  role: string;
  isActive: boolean;
  isEmailVerifie: boolean;
  secteurResponsable: string | null;
  communeResponsableId: number | null;
  communeResponsable: { id: number; nom: string } | null;
  etablissementsGeres?: number[];
  derniereConnexion: string | null;
  createdAt: string;
  _count: {
    evaluations: number;
    reclamationsCreees: number;
    evenementsCrees: number;
    actualiteCreees: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_KEYS = [
  'CITOYEN',
  'DELEGATION',
  'AUTORITE_LOCALE',
  'COORDINATEUR_ACTIVITES',
  'ADMIN',
  'SUPER_ADMIN',
  'GOUVERNEUR',
];

const ROLE_COLORS: Record<string, string> = {
  CITOYEN: 'bg-gray-100 text-gray-700',
  DELEGATION: 'bg-blue-100 text-blue-700',
  AUTORITE_LOCALE: 'bg-purple-100 text-purple-700',
  COORDINATEUR_ACTIVITES: 'bg-cyan-100 text-cyan-700',
  ADMIN: 'bg-orange-100 text-orange-700',
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  GOUVERNEUR: 'bg-emerald-100 text-emerald-700',
};

export default function UsersPage() {
  const t = useTranslations('admin.users_page');
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { isActive: statusFilter }),
      });

      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter, statusFilter, t]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (res.ok) {
        const statusText = !user.isActive ? t('statuses.activated') : t('statuses.deactivated');
        toast.success(t('messages.status_changed', { status: statusText }));
        fetchUsers();
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast.error(t('messages.error'));
    }
    setActiveDropdown(null);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(t('messages.delete_confirm', { name: `${user.prenom} ${user.nom}` }))) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('messages.user_deleted'));
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || t('messages.error'));
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(t('messages.error'));
    }
    setActiveDropdown(null);
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
    setActiveDropdown(null);
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm(t('messages.reset_password_confirm', { name: `${user.prenom} ${user.nom}` }))) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        alert(t('messages.reset_password_alert', { password: data.generatedPassword }));
        toast.success(t('messages.reset_password_success'));
      } else {
        const data = await res.json();
        toast.error(data.error || t('messages.error'));
      }
    } catch (error) {
      console.error('Erreur reset password:', error);
      toast.error(t('messages.error'));
    }
    setActiveDropdown(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('page_title')}</h1>
          <p className="text-gray-500 mt-1">{t('total_users', { count: pagination.total })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={20} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Download size={18} />
            {t('export')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus size={18} />
            {t('add')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t('filter_roles_all')}</option>
            {ROLE_KEYS.map(role => (
              <option key={role} value={role}>{t(`roles.${role}`)}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | 'true' | 'false')}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t('filter_status_all')}</option>
            <option value="true">{t('statuses.active')}</option>
            <option value="false">{t('statuses.inactive')}</option>
          </select>

          {(search || roleFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
              {t('reset_filters')}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.user')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.role')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.status')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.sector_establishment')}</th>
                <th className="px-6 py-4 text-left rtl:text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.activity')}</th>
                <th className="px-6 py-4 text-right rtl:text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {t('no_users')}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.prenom[0]}{user.nom[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.prenom} {user.nom}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}>
                        <Shield size={12} />
                        {t(`roles.${user.role}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {user.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                        {user.isActive ? t('statuses.active') : t('statuses.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {user.secteurResponsable || user.communeResponsable?.nom || 
                         (user.etablissementsGeres && user.etablissementsGeres.length > 0 
                           ? t('table.estab_count', { count: user.etablissementsGeres.length }) 
                           : '-')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">
                        {t('table.actions_count', { count: user._count.evenementsCrees + user._count.reclamationsCreees })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === user.id && (
                        <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-10">
                          <button
                            onClick={() => handleEditRole(user)}
                            className="w-full px-4 py-2 text-left rtl:text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit size={16} />
                            {t('actions.edit_role')}
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="w-full px-4 py-2 text-left rtl:text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <KeyRound size={16} />
                            {t('actions.reset_password')}
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className="w-full px-4 py-2 text-left rtl:text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                            {user.isActive ? t('actions.deactivate') : t('actions.activate')}
                          </button>
                          <hr className="my-2 border-gray-100 dark:border-gray-700" />
                          <button
                            onClick={() => handleDelete(user)}
                            className="w-full px-4 py-2 text-left rtl:text-right text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            {t('actions.delete')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {t('pagination', { 
                start: (pagination.page - 1) * pagination.limit + 1, 
                end: Math.min(pagination.page * pagination.limit, pagination.total), 
                total: pagination.total 
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="rtl:rotate-180" size={20} />
              </button>
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-emerald-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="rtl:rotate-180" size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchUsers(); }}
        />
      )}

      {showRoleModal && selectedUser && (
        <EditRoleModal
          user={selectedUser}
          onClose={() => { setShowRoleModal(false); setSelectedUser(null); }}
          onSuccess={() => { setShowRoleModal(false); setSelectedUser(null); fetchUsers(); }}
        />
      )}

      {/* Close dropdown on outside click */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
}

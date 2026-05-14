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
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { PermissionGuard } from '@/hooks/use-permission';
import EmptyState from '@/components/ui/EmptyState';
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
  communeResponsable: { id: number; nom: string; nomArabe?: string } | null;
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
  const locale = useLocale();
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
        const json = await res.json();
        let usersArray: User[] = [];
        let paginationData = json.pagination || (json.success ? json.data?.pagination : null);

        if (json.success) {
          if (Array.isArray(json.data)) {
            usersArray = json.data;
            paginationData = json.pagination;
          } else if (json.data?.users) {
            usersArray = json.data.users;
            paginationData = json.data.pagination;
          } else if (json.data?.data && Array.isArray(json.data.data)) {
            usersArray = json.data.data;
          }
        } else {
          usersArray = json.users || json.data || (Array.isArray(json) ? json : []);
        }

        setUsers(usersArray);
        if (paginationData) {
          setPagination(prev => ({
            ...prev,
            total: paginationData.total ?? prev.total,
            totalPages: paginationData.totalPages ?? paginationData.pages ?? prev.totalPages,
          }));
        }
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
    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/users/${user.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !user.isActive }),
        });

        if (res.ok) {
          fetchUsers();
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || t('messages.error')));
        }
      } catch (error) {
        reject(new Error(t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: t('messages.updating_status'),
      success: (data) => {
        const statusText = !user.isActive ? t('statuses.activated') : t('statuses.deactivated');
        return t('messages.status_changed', { status: statusText });
      },
      error: (err) => err.message,
    });
    setActiveDropdown(null);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(t('messages.delete_confirm', { name: `${user.prenom} ${user.nom}` }))) {
      return;
    }

    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchUsers();
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || t('messages.error')));
        }
      } catch (error) {
        reject(new Error(t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: t('messages.deleting'),
      success: t('messages.user_deleted'),
      error: (err) => err.message,
    });
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

    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          resolve(data.generatedPassword);
        } else {
          const data = await res.json();
          reject(new Error(data.error || t('messages.error')));
        }
      } catch (error) {
        reject(new Error(t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: t('messages.resetting'),
      success: (password) => {
        alert(t('messages.reset_password_alert', { password: password as string }));
        return t('messages.reset_password_success');
      },
      error: (err) => err.message,
    });
    setActiveDropdown(null);
  };

  return (
    <PermissionGuard permission="users.read">
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(var(--gov-blue)/0.03)] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[hsl(var(--gov-gold)/0.03)] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="max-w-[1600px] mx-auto relative z-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[hsl(var(--gov-blue)/0.25)] ring-4 ring-white dark:ring-gray-900 group">
                <Users className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
                  {t('page_title')}
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                  {t('total_users', { count: pagination.total })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchUsers()}
                className="p-3 bg-card border border-border rounded-xl hover:bg-muted transition-colors shadow-sm text-muted-foreground hover:text-foreground active:scale-95"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              <button className="flex items-center gap-2 px-6 py-3 text-foreground bg-card border border-border rounded-xl hover:bg-muted transition-all font-black text-xs uppercase tracking-widest shadow-sm active:scale-95">
                <Download size={18} />
                {t('export')}
              </button>
              <PermissionGuard permission="users.create">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="gov-btn gov-btn-primary px-8 py-3 h-auto shadow-lg shadow-[hsl(var(--gov-blue)/0.2)] active:scale-95"
                >
                  <Plus size={20} className="mr-2" />
                  <span className="font-black uppercase tracking-widest text-xs">{t('add')}</span>
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="gov-card p-6 bg-card/50 backdrop-blur-sm border-dashed">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex-1 min-w-[300px] relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors" />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="gov-input pl-12 py-3.5 bg-muted/30 focus:bg-background transition-all"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl border border-border shadow-inner">
                  <Filter size={16} className="text-muted-foreground" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent text-sm font-bold text-foreground focus:outline-none min-w-[150px]"
                  >
                    <option value="">{t('filter_roles_all')}</option>
                    {ROLE_KEYS.map(role => (
                      <option key={role} value={role}>{t(`roles.${role}`)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl border border-border shadow-inner">
                  <Shield size={16} className="text-muted-foreground" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as '' | 'true' | 'false')}
                    className="bg-transparent text-sm font-bold text-foreground focus:outline-none min-w-[150px]"
                  >
                    <option value="">{t('filter_status_all')}</option>
                    <option value="true">{t('statuses.active')}</option>
                    <option value="false">{t('statuses.inactive')}</option>
                  </select>
                </div>

                {(search || roleFilter || statusFilter) && (
                  <button
                    onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-100 uppercase tracking-widest active:scale-95"
                  >
                    <X size={14} />
                    {t('reset_filters')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="gov-card overflow-hidden shadow-2xl border-none">
            <div className="gov-table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.user')}</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.role')}</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.status')}</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.sector_establishment')}</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.activity')}</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-muted rounded-2xl" /><div className="space-y-2"><div className="h-4 w-32 bg-muted rounded" /><div className="h-3 w-24 bg-muted rounded" /></div></div></td>
                        <td className="px-6 py-6"><div className="h-6 w-24 bg-muted rounded-full" /></td>
                        <td className="px-6 py-6"><div className="h-6 w-20 bg-muted rounded-full" /></td>
                        <td className="px-6 py-6"><div className="h-4 w-32 bg-muted rounded" /></td>
                        <td className="px-6 py-6"><div className="h-4 w-24 bg-muted rounded" /></td>
                        <td className="px-6 py-6 text-right"><div className="h-10 w-10 bg-muted rounded-xl ml-auto" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                          <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center text-muted-foreground mb-6 shadow-inner">
                            <Users size={40} />
                          </div>
                          <h3 className="text-xl font-black text-foreground mb-2">{t('no_users')}</h3>
                          <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                            Aucun utilisateur ne correspond à vos critères actuels. Essayez de modifier vos filtres ou de créer un nouveau compte.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-all group">
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[hsl(var(--gov-blue)/0.2)] group-hover:scale-110 transition-transform duration-500">
                              {(user.prenom?.[0] || '')}{(user.nom?.[0] || '') || 'U'}
                            </div>
                            <div>
                              <p className="font-black text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-tight">{user.prenom || ''} {user.nom || ''}</p>
                              <p className="text-[11px] text-muted-foreground font-bold tracking-wide mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                            user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' 
                              ? 'bg-orange-50 text-orange-600 border-orange-200' 
                              : user.role === 'DELEGATION'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : user.role === 'GOUVERNEUR'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            <Shield size={12} className="stroke-[2.5]" />
                            {t(`roles.${user.role}`)}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                            user.isActive 
                              ? 'bg-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))] border-[hsl(var(--gov-green))/0.2]' 
                              : 'bg-[hsl(var(--gov-red))/0.1] text-[hsl(var(--gov-red))] border-[hsl(var(--gov-red))/0.2]'
                          }`}>
                            {user.isActive ? <UserCheck size={12} className="stroke-[2.5]" /> : <UserX size={12} className="stroke-[2.5]" />}
                            {user.isActive ? t('statuses.active') : t('statuses.inactive')}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-xs text-foreground font-black opacity-70">
                            {user.secteurResponsable || (locale === 'ar' ? (user.communeResponsable?.nomArabe || user.communeResponsable?.nom) : user.communeResponsable?.nom) || 
                             (user.etablissementsGeres && user.etablissementsGeres.length > 0 
                               ? t('table.estab_count', { count: user.etablissementsGeres.length }) 
                               : '-')}
                          </p>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1 bg-muted rounded-lg text-[10px] font-black text-muted-foreground uppercase shadow-inner">
                              {t('table.actions_count', { count: user._count.evenementsCrees + user._count.reclamationsCreees })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                            className={`p-2.5 rounded-xl transition-all shadow-sm border ${activeDropdown === user.id ? 'bg-[hsl(var(--gov-blue))] text-white border-[hsl(var(--gov-blue))] scale-90' : 'bg-card text-muted-foreground border-border hover:text-[hsl(var(--gov-blue))] hover:bg-muted active:scale-95'}`}
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === user.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-3 w-64 bg-card rounded-2xl shadow-2xl border border-border py-2 z-50 backdrop-blur-xl bg-card/95 overflow-hidden"
                              >
                                <button
                                  onClick={() => handleEditRole(user)}
                                  className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-foreground hover:bg-[hsl(var(--gov-blue))] hover:text-white flex items-center gap-3 transition-colors"
                                >
                                  <Edit size={16} />
                                  {t('actions.edit_role')}
                                </button>
                                <button
                                  onClick={() => handleResetPassword(user)}
                                  className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-foreground hover:bg-[hsl(var(--gov-blue))] hover:text-white flex items-center gap-3 transition-colors"
                                >
                                  <KeyRound size={16} />
                                  {t('actions.reset_password')}
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(user)}
                                  className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                                >
                                  {user.isActive 
                                    ? <UserX size={16} className="text-rose-600" /> 
                                    : <UserCheck size={16} className="text-emerald-600" />}
                                  {user.isActive ? t('actions.deactivate') : t('actions.activate')}
                                </button>
                                <div className="h-px bg-border my-2 mx-2 opacity-50" />
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                                >
                                  <Trash2 size={16} />
                                  {t('actions.delete')}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Container */}
            {pagination.totalPages > 1 && (
              <div className="px-8 py-8 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest text-center sm:text-left">
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
                    className="p-3 bg-card border border-border rounded-xl hover:bg-muted disabled:opacity-20 transition-all shadow-sm active:scale-95"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-1.5 px-1.5">
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (pagination.totalPages > 7 && Math.abs(pagination.page - pageNum) > 2 && pageNum !== 1 && pageNum !== pagination.totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                          className={`min-w-[40px] h-10 rounded-xl text-xs font-black transition-all border shadow-sm ${
                            pagination.page === pageNum
                              ? 'bg-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue))] text-white shadow-lg shadow-[hsl(var(--gov-blue)/0.2)]'
                              : 'bg-card text-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-3 bg-card border border-border rounded-xl hover:bg-muted disabled:opacity-20 transition-all shadow-sm active:scale-95"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals & Overlays */}
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

        {activeDropdown && (
          <div className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px]" onClick={() => setActiveDropdown(null)} />
        )}
      </div>
    </PermissionGuard>
  );
}

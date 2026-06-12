'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PermissionGuard } from '@/hooks/use-permission';
import EmptyState from '@/components/ui/EmptyState';
import CreateUserModal from './CreateUserModal';
import EditRoleModal from './EditRoleModal';
import { GovButton } from '@/components/ui/GovButton';
import { GovTable, GovTh, GovTd, GovTr } from '@/components/ui/GovTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';

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
  AUTORITE_LOCALE: 'bg-gov-blue/10 text-gov-blue-dark',
  COORDINATEUR_ACTIVITES: 'bg-gov-blue/10 text-gov-blue',
  ADMIN: 'bg-gov-gold/10 text-gov-gold',
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  GOUVERNEUR: 'bg-gov-green/10 text-gov-green-dark',
};

export default function UsersPage() {
  const t = useTranslations('admin.users_page');
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (activeDropdown === null) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-trigger') && !target.closest('.dropdown-menu-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeDropdown]);

  // New state variables for state-based dialogs/modals
  const [showDeleteId, setShowDeleteId] = useState<number | null>(null);
  const [showResetId, setShowResetId] = useState<number | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  const actionMutation = useMutation();

  const queryParams = useMemo(() => {
    return new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(roleFilter && { role: roleFilter }),
      ...(statusFilter && { isActive: statusFilter }),
    });
  }, [page, limit, search, roleFilter, statusFilter]);

  const { data: responseData, isLoading: loading, mutate: fetchUsers } = useData(`/api/users?${queryParams.toString()}`);

  let users: User[] = [];
  let paginationData: any = null;

  if (responseData) {
    if (responseData.success !== undefined) {
      if (Array.isArray(responseData.data)) {
        users = responseData.data;
        paginationData = responseData.pagination;
      } else if (responseData.data?.users) {
        users = responseData.data.users;
        paginationData = responseData.data.pagination;
      } else if (responseData.data?.data && Array.isArray(responseData.data.data)) {
        users = responseData.data.data;
      }
    } else {
      users = responseData.users || responseData.data || (Array.isArray(responseData) ? responseData : []);
      paginationData = responseData.pagination;
    }
  }

  const totalPages = paginationData?.totalPages ?? paginationData?.pages ?? 1;
  const total = paginationData?.total ?? 0;

  const handleToggleStatus = async (user: User) => {
    const promise = actionMutation.mutate(`/api/users/${user.id}/status`, {
      method: 'PATCH',
      data: { isActive: !user.isActive },
    }).then(async () => {
      await fetchUsers();
      return true;
    }).catch((error: any) => {
      throw new Error(error.message || t('messages.error'));
    });

    toast.promise(promise, {
      loading: t('messages.updating_status'),
      success: () => {
        const statusText = !user.isActive ? t('statuses.activated') : t('statuses.deactivated');
        return t('messages.status_changed', { status: statusText });
      },
      error: (err) => err.message,
    });
    setActiveDropdown(null);
  };

  const handleDelete = (user: User) => {
    setTargetUser(user);
    setShowDeleteId(user.id);
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (!targetUser) return;
    const user = targetUser;
    const promise = actionMutation.mutate(`/api/users/${user.id}`, { method: 'DELETE' }).then(async () => {
      await fetchUsers();
      setShowDeleteId(null);
      setTargetUser(null);
      return true;
    }).catch((error: any) => {
      throw new Error(error.message || t('messages.error'));
    });

    toast.promise(promise, {
      loading: t('messages.deleting'),
      success: t('messages.user_deleted'),
      error: (err) => err.message,
    });
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
    setActiveDropdown(null);
  };

  const handleResetPassword = (user: User) => {
    setTargetUser(user);
    setShowResetId(user.id);
    setActiveDropdown(null);
  };

  const handleResetPasswordConfirm = async () => {
    if (!targetUser) return;
    const user = targetUser;
    const promise = actionMutation.mutate(`/api/admin/users/${user.id}/reset-password`, {
      method: 'POST',
    }).then((data: any) => {
      setGeneratedPassword(data.generatedPassword);
      setShowResetId(null);
      return data.generatedPassword;
    }).catch((error: any) => {
      throw new Error(error.message || t('messages.error'));
    });

    toast.promise(promise, {
      loading: t('messages.resetting'),
      success: t('messages.reset_password_success'),
      error: (err) => err.message,
    });
  };

  return (
    <PermissionGuard permission="users.read">
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 end-0 w-[600px] h-[600px] bg-[hsl(var(--gov-blue)/0.03)] rounded-full -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-[400px] h-[400px] bg-[hsl(var(--gov-gold)/0.03)] rounded-full translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="max-w-[1600px] mx-auto relative z-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[#ebd281] to-[#d4b962] rounded-2xl flex items-center justify-center text-[#0a3b68] shadow-lg shadow-[#ebd281]/30 ring-2 ring-white dark:ring-gray-900 group">
                <Users className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
                  {t('page_title')}
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                  {t('total_users', { count: total })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <GovButton
                onClick={() => fetchUsers()}
                variant="outline"
                size="icon"
                loading={loading}
                title={t('refresh')}
              />
              <GovButton
                variant="outline"
                leftIcon={<Download size={18} />}
              >
                {t('export')}
              </GovButton>
              <PermissionGuard permission="users.create">
                <GovButton
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  leftIcon={<Plus size={20} />}
                  className="shadow-lg shadow-[hsl(var(--gov-blue)/0.2)]"
                >
                  <span className="font-black uppercase tracking-widest text-xs">{t('add')}</span>
                </GovButton>
              </PermissionGuard>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="gov-card p-6 bg-card/50 backdrop-blur-sm border-dashed">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex-1 min-w-[300px] relative group">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors" />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="gov-input ps-12 py-3.5 bg-muted/30 focus:bg-background transition-all"
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
                  <GovButton
                    onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
                    variant="ghost"
                    size="sm"
                    className="text-gov-red hover:bg-gov-red/5"
                    leftIcon={<X size={14} />}
                  >
                    {t('reset_filters')}
                  </GovButton>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <GovTable>
            <thead>
              <tr>
                <GovTh>{t('table.user')}</GovTh>
                <GovTh>{t('table.role')}</GovTh>
                <GovTh>{t('table.status')}</GovTh>
                <GovTh>{t('table.sector_establishment')}</GovTh>
                <GovTh>{t('table.activity')}</GovTh>
                <GovTh className="text-end">{t('table.actions')}</GovTh>
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
                    <td className="px-6 py-6 text-end"><div className="h-10 w-10 bg-muted rounded-xl ms-auto" /></td>
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
                users.map((user) => {
                  // Role Mapping for StatusBadge
                  const roleBadgeColor: Record<string, any> = {
                    ADMIN: 'gold',
                    SUPER_ADMIN: 'red',
                    GOUVERNEUR: 'green',
                    DELEGATION: 'blue',
                    AUTORITE_LOCALE: 'purple',
                    CITOYEN: 'muted',
                    COORDINATEUR_ACTIVITES: 'blue'
                  };

                  return (
                    <GovTr key={user.id} className={cn(activeDropdown === user.id ? "relative z-50" : "")}>
                      <GovTd>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ebd281] to-[#d4b962] flex items-center justify-center text-[#0a3b68] font-black text-sm shadow-lg shadow-[hsl(var(--gov-blue)/0.2)] group-hover:scale-110 transition-transform duration-500">
                            {(user.prenom?.[0] || '')}{(user.nom?.[0] || '') || 'U'}
                          </div>
                          <div>
                            <p className="font-black text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-tight">{user.prenom || ''} {user.nom || ''}</p>
                            <p className="text-[11px] text-muted-foreground font-bold tracking-wide mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </GovTd>
                      <GovTd>
                        <StatusBadge color={roleBadgeColor[user.role] || 'muted'} icon={Shield}>
                          {t(`roles.${user.role}`)}
                        </StatusBadge>
                      </GovTd>
                      <GovTd>
                        <StatusBadge 
                          color={user.isActive ? 'green' : 'red'} 
                          icon={user.isActive ? UserCheck : UserX}
                        >
                          {user.isActive ? t('statuses.active') : t('statuses.inactive')}
                        </StatusBadge>
                      </GovTd>
                      <GovTd>
                        <p className="text-xs text-foreground font-black opacity-70">
                          {user.secteurResponsable || (locale === 'ar' ? (user.communeResponsable?.nomArabe || user.communeResponsable?.nom) : user.communeResponsable?.nom) || 
                           (user.etablissementsGeres && user.etablissementsGeres.length > 0 
                             ? t('table.estab_count', { count: user.etablissementsGeres.length }) 
                             : '-')}
                        </p>
                      </GovTd>
                      <GovTd>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-muted rounded-lg text-[10px] font-black text-muted-foreground uppercase shadow-inner">
                            {t('table.actions_count', { count: user._count.evenementsCrees + user._count.reclamationsCreees })}
                          </div>
                        </div>
                      </GovTd>
                      <GovTd className="text-end relative">
                        {/* Toujours visible sur mobile + desktop (pas de group-hover) */}
                        <div className="flex items-center justify-end gap-2">
                          <GovButton
                            onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                            variant="outline"
                            size="icon"
                            className={cn(
                              "dropdown-trigger",
                              activeDropdown === user.id ? 'bg-[hsl(var(--gov-blue))] text-white border-[hsl(var(--gov-blue))]' : ''
                            )}
                            aria-label="Actions"
                            aria-expanded={activeDropdown === user.id}
                          >
                            <MoreVertical size={18} />
                          </GovButton>
                        </div>

                        <AnimatePresence>
                          {activeDropdown === user.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              // z-[60] pour être au-dessus de tout sur mobile
                              className="dropdown-menu-container absolute end-0 mt-2 w-64 bg-card rounded-2xl shadow-2xl border border-border py-2 z-[60] backdrop-blur-xl bg-card/95 overflow-hidden"
                            >
                              <button
                                onClick={() => handleEditRole(user)}
                                className="w-full px-5 py-3 text-start text-xs font-black uppercase tracking-widest text-foreground hover:bg-[hsl(var(--gov-blue))] hover:text-white flex items-center gap-3 transition-colors"
                              >
                                <Edit size={16} />
                                {t('actions.edit_role')}
                              </button>
                              <button
                                onClick={() => handleResetPassword(user)}
                                className="w-full px-5 py-3 text-start text-xs font-black uppercase tracking-widest text-foreground hover:bg-[hsl(var(--gov-blue))] hover:text-white flex items-center gap-3 transition-colors"
                              >
                                <KeyRound size={16} />
                                {t('actions.reset_password')}
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className="w-full px-5 py-3 text-start text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                              >
                                {user.isActive 
                                  ? <UserX size={16} className="text-gov-red" /> 
                                  : <UserCheck size={16} className="text-gov-green-dark" />}
                                {user.isActive ? t('actions.deactivate') : t('actions.activate')}
                              </button>
                              <Link
                                href={`/admin/logs?userId=${user.id}`}
                                className="w-full px-5 py-3 text-start text-xs font-black uppercase tracking-widest text-foreground hover:bg-[hsl(var(--gov-blue))] hover:text-white flex items-center gap-3 transition-colors"
                              >
                                <History size={16} />
                                {t('actions.view_timeline')}
                              </Link>
                              <div className="h-px bg-border my-2 mx-2 opacity-50" />
                              <button
                                onClick={() => handleDelete(user)}
                                className="w-full px-5 py-3 text-start text-xs font-black uppercase tracking-widest text-gov-red hover:bg-gov-red/5 flex items-center gap-3 transition-colors"
                              >
                                <Trash2 size={16} />
                                {t('actions.delete')}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </GovTd>
                    </GovTr>
                  );
                })
              )}
            </tbody>
          </GovTable>

            {totalPages > 1 && (
              <div className="px-4 sm:px-8 py-6 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide text-center sm:text-start">
                  {t('pagination', { 
                    start: (page - 1) * limit + 1, 
                    end: Math.min(page * limit, total), 
                    total: total 
                  })}
                </p>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted disabled:opacity-20 transition-all shadow-sm active:scale-95"
                    aria-label="Page précédente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      // Sur mobile, afficher max 5 pages autour de la courante
                      if (totalPages > 5 && Math.abs(page - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`min-w-[36px] h-9 rounded-xl text-xs font-black transition-all border shadow-sm ${
                            page === pageNum
                              ? 'bg-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue))] text-white shadow-lg shadow-[hsl(var(--gov-blue)/0.2)]'
                              : 'bg-card text-foreground border-border hover:bg-muted'
                          }`}
                          aria-current={page === pageNum ? 'page' : undefined}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted disabled:opacity-20 transition-all shadow-sm active:scale-95"
                    aria-label="Page suivante"
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


        {/* Delete Confirmation Modal */}
        {showDeleteId && targetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 text-gov-red">
                <Trash2 className="w-6 h-6" />
                <h3 className="text-lg font-bold">{t('actions.delete') || 'Suppression'}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('messages.delete_confirm', { name: `${targetUser.prenom} ${targetUser.nom}` })}
              </p>
              <div className="flex justify-end gap-3">
                <GovButton
                  onClick={() => { setShowDeleteId(null); setTargetUser(null); }}
                  variant="outline"
                  size="sm"
                >
                  {t('cancel') || 'Annuler'}
                </GovButton>
                <GovButton
                  onClick={handleDeleteConfirm}
                  variant="danger"
                  size="sm"
                  loading={actionMutation.isLoading}
                >
                  {t('actions.delete') || 'Supprimer'}
                </GovButton>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Confirmation Modal */}
        {showResetId && targetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 text-gov-gold">
                <KeyRound className="w-6 h-6" />
                <h3 className="text-lg font-bold">{t('actions.reset_password') || 'Réinitialisation'}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('messages.reset_password_confirm', { name: `${targetUser.prenom} ${targetUser.nom}` })}
              </p>
              <div className="flex justify-end gap-3">
                <GovButton
                  onClick={() => { setShowResetId(null); setTargetUser(null); }}
                  variant="outline"
                  size="sm"
                >
                  {t('cancel') || 'Annuler'}
                </GovButton>
                <GovButton
                  onClick={handleResetPasswordConfirm}
                  variant="primary"
                  size="sm"
                  loading={actionMutation.isLoading}
                >
                  {t('confirm') || 'Confirmer'}
                </GovButton>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Result Modal */}
        {generatedPassword && targetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px] animate-fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 text-gov-green-dark">
                <UserCheck className="w-6 h-6" />
                <h3 className="text-lg font-bold">{t('messages.reset_password_success') || 'Mot de passe réinitialisé'}</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Le mot de passe pour <strong>{targetUser.prenom} {targetUser.nom}</strong> a été réinitialisé avec succès. Veuillez copier le nouveau mot de passe temporaire :
                </p>
                <div className="bg-muted p-4 rounded-xl font-mono text-center text-lg select-all border border-border text-foreground">
                  {generatedPassword}
                </div>
              </div>
              <div className="flex justify-end">
                <GovButton
                  onClick={() => { setGeneratedPassword(null); setTargetUser(null); }}
                  variant="primary"
                  size="sm"
                >
                  {t('close') || 'Fermer'}
                </GovButton>
              </div>
            </div>
          </div>
        )}
    </PermissionGuard>
  );
}

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  Globe,
  Award,
  Calendar,
  MessageSquare,
  FileText,
  Megaphone,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { 
  ROLE_DEFAULT_PERMISSIONS, 
  PERMISSION_LABELS, 
  PermissionCode 
} from '@/lib/permissions-types';
import { PermissionGuard } from '@/hooks/use-permission';

// Mapping des icônes par groupe de permission
const GROUP_ICONS: Record<string, any> = {
  auth: Lock,
  users: Users,
  reclamations: MessageSquare,
  etablissements: BuildingIcon,
  evenements: Calendar,
  actualites: FileText,
  campagnes: Megaphone,
  stats: LayoutDashboard,
  communes: Globe,
  settings: Settings,
  logs: FileText,
};

function BuildingIcon(props: any) {
  return <Briefcase {...props} />;
}

export default function AdminRolesPage() {
  const t = useTranslations('admin_roles');
  const tPerm = useTranslations('permissions');
  const { data: session } = useSession();
  const [selectedRole, setSelectedRole] = useState<string>('CITOYEN');
  
  // Extraire les groupes de permissions
  const getPermissionGroups = (role: string) => {
    const permissions = ROLE_DEFAULT_PERMISSIONS[role] || [];
    const groups: Record<string, PermissionCode[]> = {};
    
    permissions.forEach(perm => {
      const group = perm.split('.')[0];
      if (!groups[group]) groups[group] = [];
      groups[group].push(perm);
    });
    
    return groups;
  };

  const roles = Object.keys(ROLE_DEFAULT_PERMISSIONS);
  const groups = getPermissionGroups(selectedRole);

  const roleColors: Record<string, { bg: string, text: string, border: string, icon: any }> = {
    CITOYEN: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: Users },
    DELEGATION: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: Briefcase },
    AUTORITE_LOCALE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: Globe },
    ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', icon: Shield },
    SUPER_ADMIN: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: Lock },
    GOUVERNEUR: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', icon: Award },
    COORDINATEUR_ACTIVITES: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', icon: Calendar },
  };

  return (
    <PermissionGuard permission="permissions.manage">
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(var(--gov-blue)/0.03)] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[hsl(var(--gov-gold)/0.03)] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="max-w-[1600px] mx-auto relative z-10">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[hsl(var(--gov-blue)/0.25)] ring-4 ring-white dark:ring-gray-900 group">
                <Shield className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                    {t('title')}
                  </h1>
                  <span className="px-3 py-1 bg-[hsl(var(--gov-gold)/0.1)] text-[hsl(var(--gov-gold-dark))] text-[10px] font-black rounded-full uppercase tracking-widest border border-[hsl(var(--gov-gold)/0.2)]">
                    Système RBAC
                  </span>
                </div>
                <p className="text-muted-foreground text-sm font-medium max-w-2xl">
                  {t('description')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--gov-gold))/0.1] text-[hsl(var(--gov-gold-dark))] rounded-xl text-xs font-black border border-[hsl(var(--gov-gold))/0.2] uppercase tracking-widest shadow-sm">
                <Lock size={16} className="text-[hsl(var(--gov-gold-dark))]" />
                {t('read_only_mode')}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[
              { label: 'Profils Définis', value: roles.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
              { label: 'Groupes de Droits', value: Object.keys(GROUP_ICONS).length, icon: LayoutDashboard, color: 'text-purple-600', bg: 'bg-purple-500/10' },
              { label: 'Total Permissions', value: Object.keys(PERMISSION_LABELS).length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
              { label: 'Utilisateurs Actifs', value: '---', icon: Users, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="gov-card p-5 group flex items-center gap-4 border-dashed"
              >
                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground leading-none mb-1">{stat.value}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Sidebar: Role Selector */}
            <div className="lg:col-span-3 space-y-4">
              <div className="gov-card p-2 bg-card/50 backdrop-blur-sm">
                <div className="px-4 py-3 mb-2">
                  <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {t('available_roles')}
                  </h2>
                </div>
                <div className="space-y-1">
                  {roles.map(role => {
                    const config = roleColors[role] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: Shield };
                    const Icon = config.icon;
                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`w-full text-left px-4 py-4 rounded-xl transition-all group flex items-center justify-between ${
                          selectedRole === role
                            ? 'bg-[hsl(var(--gov-blue))] text-white shadow-lg shadow-[hsl(var(--gov-blue)/0.2)] ring-2 ring-[hsl(var(--gov-blue)/0.1)] scale-[1.02]'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRole === role ? 'bg-white/20' : 'bg-muted group-hover:bg-background'}`}>
                            <Icon size={16} className={selectedRole === role ? 'text-white' : config.text} />
                          </div>
                          <span className="text-sm font-black uppercase tracking-tight">{t('roles.' + role)}</span>
                        </div>
                        {selectedRole === role && <motion.div layoutId="active-indicator"><CheckCircle size={16} className="text-white" /></motion.div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Security Hint */}
              <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-4">
                  <Shield size={20} />
                </div>
                <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-2">Note de Sécurité</h4>
                <p className="text-[11px] font-medium text-indigo-800/70 dark:text-indigo-400/60 leading-relaxed">
                  Les permissions sont héritées par profil institutionnel. Toute modification de la matrice impacte l'ensemble des utilisateurs rattachés au rôle.
                </p>
              </div>
            </div>

            {/* Main Content: Permissions Details */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedRole}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Selected Role Hero Card */}
                  <div className="gov-card p-8 bg-card/80 backdrop-blur-xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${roleColors[selectedRole]?.bg} ${roleColors[selectedRole]?.text} border-current/10`}>
                            Profil {selectedRole}
                          </div>
                          <div className="h-4 w-px bg-border" />
                          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-emerald-500" />
                            {t('active_permissions', {count: ROLE_DEFAULT_PERMISSIONS[selectedRole]?.length || 0})}
                          </div>
                        </div>
                        <h2 className="text-4xl font-black text-foreground tracking-tight">
                          {t('roles.' + selectedRole)}
                        </h2>
                        <p className="text-lg font-medium text-muted-foreground leading-relaxed">
                          {t('descriptions.' + selectedRole)}
                        </p>
                      </div>
                      <div className={`w-32 h-32 rounded-3xl ${roleColors[selectedRole]?.bg} flex items-center justify-center ${roleColors[selectedRole]?.text} shadow-inner group-hover:rotate-6 transition-transform duration-700`}>
                        {(() => {
                          const Icon = roleColors[selectedRole]?.icon || Shield;
                          return <Icon size={64} className="opacity-20 stroke-[3]" />;
                        })()}
                      </div>
                    </div>
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-foreground/5 to-transparent rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
                  </div>

                  {/* Permissions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.entries(groups).map(([group, perms], idx) => {
                      const Icon = GROUP_ICONS[group] || Shield;
                      return (
                        <motion.div
                          key={group}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="gov-card p-6 flex flex-col hover:shadow-lg transition-all border-dashed"
                        >
                          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                            <div className="w-10 h-10 rounded-xl bg-muted text-[hsl(var(--gov-blue))] flex items-center justify-center shadow-inner">
                              <Icon size={20} className="stroke-[2.5]" />
                            </div>
                            <h3 className="font-black text-xs uppercase tracking-widest text-foreground">
                              {t('groups.' + group)}
                            </h3>
                            <div className="ml-auto text-[10px] font-black bg-muted px-2 py-1 rounded text-muted-foreground">
                              {perms.length}
                            </div>
                          </div>
                          
                          <div className="space-y-4 flex-1">
                            {perms.map(perm => (
                              <div key={perm} className="group/perm">
                                <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center mt-0.5 shrink-0">
                                    <CheckCircle size={12} className="stroke-[3]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-foreground group-hover/perm:text-[hsl(var(--gov-blue))] transition-colors">
                                      {tPerm(perm)}
                                    </p>
                                    <p className="text-[9px] font-mono font-bold text-muted-foreground/60 uppercase tracking-tighter mt-0.5">
                                      {perm}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}

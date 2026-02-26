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
  const t = useTranslations();
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

  const roleDescriptions: Record<string, string> = {
    CITOYEN: 'Accès public standard avec authentification. Peut créer des réclamations et participer.',
    DELEGATION: 'Responsable de secteur. Gère les contenus (événements, actualités) liés à son domaine.',
    AUTORITE_LOCALE: 'Gestionnaire communal. Traite et modère les réclamations de sa zone géographique.',
    ADMIN: 'Administrateur fonctionnel. Valide les contenus et gère les utilisateurs.',
    SUPER_ADMIN: 'Contrôle total du système. Gère les paramètres techniques et les rôles.',
    GOUVERNEUR: 'Vue d\'ensemble stratégique en lecture seule sur toute la province.',
    COORDINATEUR_ACTIVITES: 'Gère la planification opérationnelle des activités des établissements.'
  };

  const roleColors: Record<string, string> = {
    CITOYEN: 'bg-blue-100 text-blue-700 border-blue-200',
    DELEGATION: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    AUTORITE_LOCALE: 'bg-amber-100 text-amber-700 border-amber-200',
    ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
    GOUVERNEUR: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    COORDINATEUR_ACTIVITES: 'bg-teal-100 text-teal-700 border-teal-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-600" />
            {t('admin_roles.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin_roles.description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
          <AlertCircle size={16} />
          <span>{t('admin_roles.read_only_mode')}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Liste des Rôles */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">
              {t('admin_roles.available_roles')}
            </h2>
            <div className="space-y-2">
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    selectedRole === role
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{t('admin_roles.roles.' + role)}</span>
                    {selectedRole === role && <CheckCircle size={16} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu Détails du Rôle */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Carte Info Rôle */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {t('admin_roles.roles.' + selectedRole)}
                    </h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${roleColors[selectedRole] || 'bg-gray-100 text-gray-700'}`}>
                      {t('admin_roles.active_permissions', {count: ROLE_DEFAULT_PERMISSIONS[selectedRole]?.length || 0})}
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('admin_roles.descriptions.' + selectedRole)}
                </p>
              </div>

              {/* Matrice des Permissions */}
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(groups).map(([group, perms]) => {
                  const Icon = GROUP_ICONS[group] || Shield;
                  return (
                    <motion.div
                      key={group}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Icon size={18} />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                          {t('admin_roles.groups.' + group)}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {perms.map(perm => (
                          <div key={perm} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-gray-700 dark:text-gray-200">
                                {t('permissions.' + perm)}
                              </p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">
                                {perm}
                              </p>
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
  );
}

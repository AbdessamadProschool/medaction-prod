'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Key,
  Lock,
  Settings,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Camera,
  Edit2,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Clock,
} from 'lucide-react';

export default function AdminProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState<{ enabled: boolean; pending: boolean }>({ enabled: false, pending: false });
  
  // Édition
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
  });
  
  // Changement de mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Messages
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      router.push('/');
    }
  }, [status, session, router]);

  // Charger le profil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Charger le statut 2FA
        const res2FA = await fetch('/api/auth/2fa/enable');
        if (res2FA.ok) {
          const data = await res2FA.json();
          setTwoFactorStatus({ enabled: data.enabled, pending: data.pending });
        }
        
        // Le profil vient de la session
        if (session?.user) {
          setProfile({
            id: session.user.id,
            email: session.user.email,
            nom: session.user.nom || '',
            prenom: session.user.prenom || '',
            telephone: '',
            role: session.user.role,
            photo: session.user.photo,
          });
          setEditForm({
            nom: session.user.nom || '',
            prenom: session.user.prenom || '',
            telephone: '',
          });
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadProfile();
    }
  }, [session]);

  // Sauvegarder le profil
  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Profil mis à jour avec succès !');
        setProfile({ ...profile, ...editForm });
        setEditing(false);
        // Mettre à jour la session
        await update();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setChangingPassword(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Mot de passe modifié avec succès !');
        setShowPasswordForm(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setChangingPassword(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-500">Gérez vos informations personnelles et la sécurité de votre compte</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carte Profil principale */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* En-tête */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold">
                      {profile?.prenom?.[0]?.toUpperCase()}{profile?.nom?.[0]?.toUpperCase()}
                    </div>
                    <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-lg text-gray-600 hover:text-blue-600">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="text-white">
                    <h2 className="text-xl font-semibold">{profile?.prenom} {profile?.nom}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        profile?.role === 'SUPER_ADMIN' 
                          ? 'bg-purple-400/30 text-purple-100' 
                          : 'bg-blue-400/30 text-blue-100'
                      }`}>
                        {profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Informations personnelles</h3>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={14} />
                      Modifier
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditForm({
                            nom: profile?.nom || '',
                            prenom: profile?.prenom || '',
                            telephone: profile?.telephone || '',
                          });
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Email (non modifiable) */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-gray-900">{profile?.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">Non modifiable</span>
                  </div>

                  {/* Prénom */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Prénom</p>
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.prenom}
                          onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg mt-1"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.prenom || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Nom */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Nom</p>
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.nom}
                          onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg mt-1"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.nom || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Téléphone</p>
                      {editing ? (
                        <input
                          type="tel"
                          value={editForm.telephone}
                          onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg mt-1"
                          placeholder="+212 6XX XXX XXX"
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.telephone || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sécurité */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-400" />
                Sécurité
              </h3>

              {/* 2FA Status */}
              <Link
                href="/profil/securite"
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {twoFactorStatus.enabled ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Key className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">2FA</p>
                      <p className="text-xs text-gray-500">
                        {twoFactorStatus.enabled ? 'Activé' : 'Désactivé'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    twoFactorStatus.enabled 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {twoFactorStatus.enabled ? 'Actif' : 'Configurer'}
                  </span>
                </div>
              </Link>

              {/* Changer le mot de passe */}
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Mot de passe</p>
                    <p className="text-xs text-gray-500">Changer votre mot de passe</p>
                  </div>
                </div>
              </button>

              {/* Formulaire changement mot de passe */}
              {showPasswordForm && (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mot de passe actuel</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Confirmer le nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {changingPassword && <Loader2 size={16} className="animate-spin" />}
                    Changer le mot de passe
                  </button>
                </div>
              )}
            </div>

            {/* Activité récente */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Activité récente
              </h3>
              <div className="text-sm text-gray-500">
                <p>Dernière connexion :</p>
                <p className="font-medium text-gray-900 mt-1">
Première connexion
                </p>
              </div>
            </div>

            {/* Liens rapides (pour SUPER_ADMIN) */}
            {session?.user?.role === 'SUPER_ADMIN' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-400" />
                  Administration
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/super-admin/admins"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700"
                  >
                    Gérer les administrateurs
                  </Link>
                  <Link
                    href="/admin/logs"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700"
                  >
                    Voir les logs
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

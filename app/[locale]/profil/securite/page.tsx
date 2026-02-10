'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Key,
  Copy,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw,
  Download,
  CheckCircle,
} from 'lucide-react';

interface TwoFactorData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  otpauthUrl: string;
}

export default function SecurityPage() {
  const t = useTranslations('security_page');
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  
  // États pour l'activation 2FA
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorData | null>(null);
  const [setupStep, setSetupStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState(false);
  
  // États pour la désactivation 2FA
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);
  
  // UI
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Charger le statut 2FA
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch('/api/auth/2fa/enable');
        if (res.ok) {
          const data = await res.json();
          setTwoFactorEnabled(data.enabled);
          setTwoFactorPending(data.pending);
        }
      } catch (error) {
        console.error('Erreur chargement statut 2FA:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadStatus();
    }
  }, [session]);

  // Démarrer la configuration 2FA
  const startSetup = async () => {
    setSetupError(null);
    setShowSetup(true);
    setSetupStep(1);
    
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSetupData(data.data);
        setTwoFactorPending(true);
      } else {
        setSetupError(data.error || t('setup_modal.error_server'));
      }
    } catch (error) {
      setSetupError(t('setup_modal.error_server'));
    }
  };

  // Vérifier le code et activer 2FA
  const verifyAndActivate = async () => {
    if (verificationCode.length !== 6) {
      setSetupError(t('setup_modal.error_code_length'));
      return;
    }

    setVerifying(true);
    setSetupError(null);

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSetupSuccess(true);
        setTwoFactorEnabled(true);
        setTwoFactorPending(false);
        setSetupStep(3);
      } else {
        setSetupError(data.error || 'Code invalide');
      }
    } catch (error) {
      setSetupError(t('setup_modal.error_server'));
    } finally {
      setVerifying(false);
    }
  };

  // Désactiver 2FA
  const disable2FA = async () => {
    if (disableCode.length !== 6) {
      setSetupError(t('setup_modal.error_code_length'));
      return;
    }

    setDisabling(true);
    setSetupError(null);

    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTwoFactorEnabled(false);
        setShowDisable(false);
        setDisableCode('');
      } else {
        setSetupError(data.error || 'Code invalide');
      }
    } catch (error) {
      setSetupError('Erreur de connexion');
    } finally {
      setDisabling(false);
    }
  };

  // Copier dans le presse-papier
  const copyToClipboard = async (text: string, type: 'secret' | 'codes') => {
    await navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  // Télécharger les codes de secours
  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    
    const content = `Codes de secours MedAction
===========================
Date: ${new Date().toLocaleDateString('fr-FR')}
Email: ${session?.user?.email}

Conservez ces codes en lieu sûr. Chaque code ne peut être utilisé qu'une fois.

${setupData.backupCodes.join('\n')}

IMPORTANT: Ces codes vous permettent de récupérer l'accès à votre compte si vous perdez votre appareil d'authentification.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medaction-codes-secours.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fermer et réinitialiser
  const closeSetup = () => {
    setShowSetup(false);
    setSetupData(null);
    setSetupStep(1);
    setVerificationCode('');
    setSetupError(null);
    setSetupSuccess(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/profil" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft size={18} />
            {t('back_profile')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-500">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Carte 2FA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${twoFactorEnabled ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  {twoFactorEnabled ? (
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ShieldOff className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('2fa_title')}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {twoFactorEnabled 
                      ? t('2fa_enabled_desc')
                      : t('2fa_disabled_desc')}
                  </p>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                twoFactorEnabled 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {twoFactorEnabled ? t('status_enabled') : t('status_disabled')}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              {twoFactorEnabled ? (
                <button
                  onClick={() => setShowDisable(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                >
                  <Unlock size={18} />
                  {t('disable_btn')}
                </button>
              ) : (
                <button
                  onClick={startSetup}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                >
                  <Lock size={18} />
                  {t('setup_btn')}
                </button>
              )}
            </div>
          </div>

          {/* Info supplémentaire */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p 
                  className="text-sm text-gray-600"
                  dangerouslySetInnerHTML={{ __html: t.raw('authenticator_apps') }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info sur la sécurité */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t('why_2fa_title')}</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>{t('why_2fa_points.protection')}</li>
                <li>{t('why_2fa_points.notification')}</li>
                <li>{t('why_2fa_points.compliance')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Configuration 2FA */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900">
                {t('setup_modal.title')}
              </h3>
              <button onClick={closeSetup} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Étapes */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                      setupStep >= step 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {setupStep > step ? <Check size={16} /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-20 h-1 mx-2 ${
                        setupStep > step ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{t('setup_modal.steps.scan')}</span>
                <span>{t('setup_modal.steps.verify')}</span>
                <span>{t('setup_modal.steps.finish')}</span>
              </div>
            </div>

            {/* Contenu selon l'étape */}
            <div className="p-6">
              {setupError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle size={16} />
                  {setupError}
                </div>
              )}

              {/* Étape 1: Scanner le QR code */}
              {setupStep === 1 && setupData && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      {t('setup_modal.step1_scan')}
                    </p>
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={setupData.qrCode} 
                        alt="QR Code pour configurer l'authentification à deux facteurs" 
                        className="w-48 h-48"
                        loading="eager"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                       {t('setup_modal.step1_manual')}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className={`flex-1 px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm ${
                        showSecret ? '' : 'filter blur-sm select-none'
                      }`}>
                        {setupData.secret}
                      </code>
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title={showSecret ? 'Masquer' : 'Afficher'}
                      >
                        {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(setupData.secret, 'secret')}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title={t('setup_modal.copy')}
                      >
                        {copiedSecret ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setSetupStep(2)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {t('setup_modal.continue')}
                  </button>
                </div>
              )}

              {/* Étape 2: Vérifier le code */}
              {setupStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Smartphone className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {t('setup_modal.step2_enter')}
                    </p>
                  </div>

                  <div className="max-w-xs mx-auto">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-3xl font-mono tracking-[0.5em] px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSetupStep(1)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      {t('setup_modal.back')}
                    </button>
                    <button
                      onClick={verifyAndActivate}
                      disabled={verifying || verificationCode.length !== 6}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {verifying && <Loader2 size={18} className="animate-spin" />}
                      {t('setup_modal.verify')}
                    </button>
                  </div>
                </div>
              )}

              {/* Étape 3: Succès et codes de secours */}
              {setupStep === 3 && setupData && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                       {t('setup_modal.success_title')}
                    </h4>
                    <p className="text-gray-600">
                       {t('setup_modal.save_codes')}
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <p className="text-sm text-amber-800">
                        <strong>Important :</strong> {t('setup_modal.important_warning')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">{t('setup_modal.backup_codes')}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'codes')}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {copiedCodes ? <Check size={14} /> : <Copy size={14} />}
                          {copiedCodes ? t('setup_modal.copied') : t('setup_modal.copy')}
                        </button>
                        <button
                          onClick={downloadBackupCodes}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Download size={14} />
                          {t('setup_modal.download')}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {setupData.backupCodes.map((code, index) => (
                        <code key={index} className="px-3 py-2 bg-white border border-gray-200 rounded text-center font-mono text-sm">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={closeSetup}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {t('setup_modal.finish')}
                  </button>
                </div>
              )}

              {/* Loading initial */}
              {setupStep === 1 && !setupData && !setupError && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">{t('setup_modal.loading_qr')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Désactivation 2FA */}
      {showDisable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ShieldOff className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {t('disable_modal.title')}
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                {t('disable_modal.desc')}
              </p>

              {setupError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                  <AlertTriangle size={16} />
                  {setupError}
                </div>
              )}

              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl font-mono tracking-[0.5em] px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisable(false);
                    setDisableCode('');
                    setSetupError(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  {t('disable_modal.cancel')}
                </button>
                <button
                  onClick={disable2FA}
                  disabled={disabling || disableCode.length !== 6}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {disabling && <Loader2 size={18} className="animate-spin" />}
                  {t('disable_modal.disable')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

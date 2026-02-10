'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, BellOff, Loader2, Check, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface SubscribeButtonProps {
  etablissementId: number;
  etablissementNom: string;
  variant?: 'default' | 'compact' | 'full';
  className?: string;
}

interface Abonnement {
  id: number;
  etablissementId: number;
  notificationsActives: boolean;
}

export default function SubscribeButton({ 
  etablissementId, 
  etablissementNom,
  variant = 'default',
  className = ''
}: SubscribeButtonProps) {
  const t = useTranslations('etablissement_page.buttons');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Vérifier si l'utilisateur est abonné
  useEffect(() => {
    if (status === 'authenticated') {
      checkSubscription();
    } else if (status === 'unauthenticated') {
      setChecking(false);
    }
  }, [status, etablissementId]);

  const checkSubscription = async () => {
    try {
      const res = await fetch(`/api/users/me/abonnements`);
      if (res.ok) {
        const data = await res.json();
        const found = data.data?.find((a: Abonnement) => a.etablissementId === etablissementId);
        setAbonnement(found || null);
      }
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!session) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/abonnements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etablissementId }),
      });

      if (res.ok) {
        const data = await res.json();
        setAbonnement(data.abonnement);
      } else if (res.status === 409) {
        // Déjà abonné - rafraîchir
        await checkSubscription();
      }
    } catch (error) {
      console.error('Erreur abonnement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!abonnement) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/abonnements/${abonnement.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAbonnement(null);
      }
    } catch (error) {
      console.error('Erreur désabonnement:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    if (!abonnement) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/abonnements/${abonnement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationsActives: !abonnement.notificationsActives }),
      });

      if (res.ok) {
        const data = await res.json();
        setAbonnement(data.abonnement);
      }
    } catch (error) {
      console.error('Erreur toggle notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading initial
  if (checking) {
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">{t('checking')}</span>
      </div>
    );
  }

  // Pas connecté
  if (!session) {
    return (
      <button
        onClick={handleSubscribe}
        className={`inline-flex items-center gap-2 px-4 py-2.5 bg-[hsl(213,80%,28%)] text-white rounded-xl font-medium hover:bg-[hsl(213,80%,25%)] transition-colors ${className}`}
      >
        <UserPlus className="w-4 h-4" />
        {variant !== 'compact' && <span>{t('subscribe')}</span>}
      </button>
    );
  }

  // Abonné
  if (abonnement) {
    if (variant === 'compact') {
      return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="p-2 bg-[hsl(145,63%,32%)]/10 text-[hsl(145,63%,32%)] rounded-lg hover:bg-[hsl(145,63%,32%)]/20 transition-colors disabled:opacity-50"
            title="Se désabonner"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleNotifications}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              abonnement.notificationsActives 
                ? 'bg-[hsl(45,93%,47%)]/20 text-[hsl(45,93%,35%)]' 
                : 'bg-gray-100 text-gray-400'
            }`}
            title={abonnement.notificationsActives ? 'Désactiver les notifications' : 'Activer les notifications'}
          >
            {abonnement.notificationsActives ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[hsl(145,63%,32%)]/10 text-[hsl(145,63%,32%)] border border-[hsl(145,63%,32%)]/30 rounded-xl font-medium hover:bg-[hsl(145,63%,32%)]/20 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {variant === 'full' ? t('subscribed_full') : t('subscribed')}
        </button>
        <button
          onClick={toggleNotifications}
          disabled={loading}
          className={`p-2.5 rounded-xl border transition-colors disabled:opacity-50 ${
            abonnement.notificationsActives 
              ? 'bg-[hsl(45,93%,47%)]/10 border-[hsl(45,93%,47%)]/30 text-[hsl(45,93%,35%)]' 
              : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
          }`}
          title={abonnement.notificationsActives ? 'Désactiver les notifications' : 'Activer les notifications'}
        >
          {abonnement.notificationsActives ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  // Non abonné
  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2.5 bg-[hsl(213,80%,28%)] text-white rounded-xl font-medium hover:bg-[hsl(213,80%,25%)] transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {variant !== 'compact' && <span>{t('subscribe')}</span>}
    </button>
  );
}

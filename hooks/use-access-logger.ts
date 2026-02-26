"use client";

import { useEffect } from 'react';

// Cette clé doit être unique pour l'application
const ACCESS_DENIED_KEY = 'medaction_access_denied_log';

export function useAccessLogger() {
  const logAccessDenied = async (path: string, reason: string) => {
    try {
      // Envoyer le log au serveur
      await fetch('/api/admin/logs/access-denied', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, reason })
      });
    } catch (e) {
      console.error('Failed to log access denied', e);
    }
  };

  return { logAccessDenied };
}

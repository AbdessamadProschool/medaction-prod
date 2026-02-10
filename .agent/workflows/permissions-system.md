---
description: Système de Gestion des Permissions (RBAC)
---

# Système de Permissions (RBAC) Professional

Ce document décrit comment gérer et étendre le système de permissions de l'application MedAction.
Le système suit une approche **RBAC (Role-Based Access Control) hybride** avec des permissions granulaires.

## Architecture

1.  **Backend (API)** : Protection via `withPermission` (HOC) ou vérifications manuelles `checkPermission`.
2.  **Frontend (UI)** : Protection via le hook `usePermission` et le composant `<PermissionGuard>`.
3.  **Database** : Tables `Permission` et `UserPermission`.

---

## 🚀 Workflow : Ajouter une nouvelle permission

Si vous devez ajouter une nouvelle fonctionnalité (ex: "Gérer les vidéos"), suivez ces étapes :

### 1. Déclarer la Permission
Ouvrez `lib/permissions.ts` et ajoutez le code de la permission dans le type `PermissionCode` et le label dans `PERMISSION_LABELS`.

```typescript
// lib/permissions.ts

export type PermissionCode = 
  // ... existants
  | 'videos.create' | 'videos.delete'; // <-- AJOUT ICI

export const PERMISSION_LABELS: Record<PermissionCode, string> = {
  // ... existants
  'videos.create': 'Créer Vidéos',
  'videos.delete': 'Supprimer Vidéos',
};
```

### 2. Ajouter au Seeder
Pour que la permission existe en base de données, ajoutez-la dans `prisma/seed-permissions.ts`.

```typescript
// prisma/seed-permissions.ts
const PERMISSIONS = [
  // ...
  { code: 'videos.create', nom: 'Créer des vidéos', groupe: 'videos', groupeLabel: 'Vidéos' },
  { code: 'videos.delete', nom: 'Supprimer des vidéos', groupe: 'videos', groupeLabel: 'Vidéos' },
];
```
Ensuite, lancez la commande : `npx tsx prisma/seed-permissions.ts`

### 3. Protéger l'API
Utilisez le HOC `withPermission` dans votre route API.

```typescript
// app/api/videos/route.ts
import { withPermission } from '@/lib/auth/api-guard';

async function handler(req: NextRequest) {
  // Logique métier...
}

// Protéger la route POST
export const POST = withPermission('videos.create', handler);
```

### 4. Protéger l'UI (Frontend)
Masquez les boutons ou sections pour les utilisateurs non autorisés.

```tsx
// app/videos/page.tsx
import { PermissionGuard } from '@/hooks/use-permission';

export default function VideosPage() {
  return (
    <div>
      <h1>Vidéos</h1>
      
      <PermissionGuard permission="videos.create">
        <button>Ajouter une vidéo</button>
      </PermissionGuard>

      {/* Liste des vidéos... */}
    </div>
  );
}
```

---

## Sécurité & Bonnes Pratiques

*   **Fail Safe** : Si une vérification échoue ou erreur, l'accès est REFUSÉ par défaut.
*   **Super Admin** : Le rôle `SUPER_ADMIN` contourne toutes les vérifications. Ne jamais tester les permissions avec ce rôle.
*   **Performance** : Les permissions frontend sont mises en cache (SWR).

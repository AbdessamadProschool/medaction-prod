# Guide de Gestion des Erreurs API - MedAction

## 🎯 Objectif

Ce guide définit la norme professionnelle pour la gestion des erreurs dans les APIs du projet MedAction.

## 📋 Format Standard des Réponses d'Erreur

### Structure de Réponse

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Message principal lisible par l'utilisateur",
    "details": [
      { "field": "titre", "message": "Le titre est obligatoire" },
      { "field": "email", "message": "L'adresse email n'est pas valide" }
    ],
    "fieldErrors": {
      "titre": ["Le titre est obligatoire"],
      "email": ["L'adresse email n'est pas valide"]
    }
  }
}
```

### Codes d'Erreur Standard

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Données invalides |
| `UNAUTHORIZED` | 401 | Non authentifié |
| `FORBIDDEN` | 403 | Accès refusé |
| `NOT_FOUND` | 404 | Ressource introuvable |
| `CONFLICT` | 409 | Doublon détecté |
| `INTERNAL_SERVER_ERROR` | 500 | Erreur serveur |

## 🔧 Comment Utiliser le Wrapper

### 1. Importer le Handler

```typescript
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError, AppError } from '@/lib/exceptions';
```

### 2. Wrapper la Fonction

**AVANT (ancien style):**
```typescript
export async function POST(request: NextRequest) {
  try {
    // logique...
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
```

**APRÈS (nouveau style):**
```typescript
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Pas besoin de try/catch - le handler gère tout!
  
  if (!session?.user) {
    throw new UnauthorizedError('Vous devez être connecté');
  }
  
  if (!hasPermission) {
    throw new ForbiddenError('Vous n\'avez pas la permission');
  }
  
  // Validation manuelle avec messages détaillés
  const errors = [];
  if (!body.titre) {
    errors.push({ field: 'titre', message: 'Le titre est obligatoire' });
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Données invalides', { fieldErrors: ... });
  }
  
  return NextResponse.json({ success: true, data });
});
```

### 3. Exceptions Disponibles

```typescript
// Utilisateur non connecté
throw new UnauthorizedError('Message personnalisé');

// Pas de permission
throw new ForbiddenError('Vous n\'avez pas accès');

// Ressource non trouvée
throw new NotFoundError('L\'établissement n\'existe pas');

// Validation échouée
throw new ValidationError('Données invalides', {
  fieldErrors: {
    nom: ['Le nom est obligatoire'],
    email: ['Format email invalide']
  }
});

// Erreur métier personnalisée
throw new AppError('Message', 'CODE', statusCode, context);
```

## ✅ APIs Migrées (avec gestion d'erreurs professionnelle)

### APIs Principales
- [x] `/api/etablissements` - Établissements (GET, POST)
- [x] `/api/reclamations` - Réclamations
- [x] `/api/communes` - Communes
- [x] `/api/campagnes` - Campagnes (GET, POST)
- [x] `/api/actualites` - Actualités (GET, POST)
- [x] `/api/evenements` - Événements (GET, POST)
- [x] `/api/articles` - Articles (GET, POST)
- [x] `/api/abonnements` - Abonnements (GET, POST)

### APIs Admin
- [x] `/api/admin/users` - Gestion des utilisateurs
- [x] `/api/admin/settings` - Paramètres système
- [x] `/api/admin/stats` - Statistiques dashboard

### APIs Délégation
- [x] `/api/delegation/evenements` - Événements par délégation
- [x] `/api/delegation/actualites` - Actualités par délégation

### APIs Autorité Locale
- [x] `/api/autorite/reclamations` - Réclamations par commune

## ⏳ APIs Restantes (Priorité Basse)

Ces APIs peuvent être migrées progressivement :
- [ ] `/api/auth/*` - Authentication (fonctionne différemment)
- [ ] `/api/admin/import` - Import de données
- [ ] `/api/admin/validation` - Validation de contenu
- [ ] `/api/suggestions` - Suggestions citoyennes


## 📁 Fichiers Clés

- `lib/api-handler.ts` - Wrapper principal
- `lib/exceptions.ts` - Classes d'exceptions
- `lib/error-formatter.ts` - Formatage des erreurs Zod/Prisma
- `lib/validations/` - Schémas Zod avec messages personnalisés

## 🌐 Côté Client (React)

Pour afficher les erreurs côté client:

```typescript
const response = await fetch('/api/...', { ... });
const data = await response.json();

if (!response.ok) {
  // Afficher l'erreur principale
  toast.error(data.error?.message || 'Une erreur est survenue');
  
  // Afficher les erreurs par champ dans le formulaire
  if (data.error?.fieldErrors) {
    Object.entries(data.error.fieldErrors).forEach(([field, messages]) => {
      setError(field, { message: messages[0] });
    });
  }
}
```

## 🔍 Monitoring avec Sentry

Les erreurs sont automatiquement capturées par Sentry via `instrumentation.ts`.
Consultez le dashboard Sentry pour le suivi des erreurs en production.

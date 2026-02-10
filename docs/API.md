# 📡 Documentation API MedAction

Base URL: `https://medaction.ma/api` (production) ou `http://localhost:3000/api` (développement)

## 🔐 Authentification

L'API utilise NextAuth.js pour l'authentification. Les endpoints protégés nécessitent une session valide.

### Headers

```
Cookie: next-auth.session-token=xxx
```

---

## 📚 Endpoints

### 🔑 Auth

#### POST /api/auth/register
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "prenom": "Ahmed",
  "nom": "Bennani",
  "telephone": "0612345678",
  "communeId": 1
}
```

**Response: 201**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "prenom": "Ahmed",
    "nom": "Bennani"
  }
}
```

**Errors:**
- `400` - Validation failed
- `409` - Email already exists

---

#### GET /api/auth/session
Récupérer la session courante.

**Response: 200**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nom": "Bennani",
    "prenom": "Ahmed",
    "role": "CITOYEN",
    "communeId": 1
  },
  "expires": "2024-12-31T23:59:59.000Z"
}
```

---

### 🏢 Établissements

#### GET /api/etablissements
Liste paginée des établissements.

**Query Parameters:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Page (défaut: 1) |
| `limit` | number | Items par page (défaut: 10, max: 100) |
| `secteur` | string | Filtrer par secteur |
| `communeId` | number | Filtrer par commune |
| `search` | string | Recherche par nom |
| `noteMin` | number | Note minimale (0-5) |
| `sortBy` | string | Champ de tri |
| `sortOrder` | string | `asc` ou `desc` |

**Response: 200**
```json
{
  "data": [
    {
      "id": 1,
      "code": "ETB-001",
      "nom": "École Primaire Al Nour",
      "secteur": "EDUCATION",
      "communeId": 1,
      "commune": {
        "id": 1,
        "nom": "Sidi Ahmed"
      },
      "noteMoyenne": 4.2,
      "nombreEvaluations": 15,
      "latitude": 33.5,
      "longitude": -7.6
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

---

#### GET /api/etablissements/[id]
Détail d'un établissement.

**Response: 200**
```json
{
  "id": 1,
  "code": "ETB-001",
  "nom": "École Primaire Al Nour",
  "nomArabe": "المدرسة الابتدائية النور",
  "secteur": "EDUCATION",
  "nature": "PUBLIC",
  "adresseComplete": "123 Rue de la Paix, Sidi Ahmed",
  "telephone": "0522123456",
  "horaires": "08:00 - 17:00",
  "latitude": 33.5,
  "longitude": -7.6,
  "noteMoyenne": 4.2,
  "nombreEvaluations": 15,
  "commune": {
    "id": 1,
    "nom": "Sidi Ahmed"
  },
  "evaluations": [
    {
      "id": 1,
      "noteGlobale": 5,
      "commentaire": "Excellent établissement",
      "createdAt": "2024-01-15T10:00:00Z",
      "user": {
        "prenom": "Mohammed",
        "nom": "A."
      }
    }
  ],
  "evenements": [
    {
      "id": 1,
      "titre": "Journée portes ouvertes",
      "dateDebut": "2024-02-01T09:00:00Z"
    }
  ]
}
```

---

#### POST /api/etablissements
Créer un établissement. **Rôle requis: ADMIN**

**Body:**
```json
{
  "nom": "Nouveau Centre de Santé",
  "secteur": "SANTE",
  "communeId": 1,
  "adresseComplete": "Adresse complète",
  "latitude": 33.5,
  "longitude": -7.6
}
```

**Response: 201**
```json
{
  "success": true,
  "etablissement": { ... }
}
```

---

### 📝 Réclamations

#### GET /api/reclamations
Liste des réclamations.

**Query Parameters:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Page |
| `limit` | number | Items par page |
| `statut` | string | Filtrer par statut |
| `communeId` | number | Filtrer par commune |
| `categorie` | string | Filtrer par catégorie |
| `userId` | number | Filtrer par utilisateur |

**Response: 200**
```json
{
  "data": [
    {
      "id": 1,
      "code": "REC-2024-001",
      "titre": "Problème d'éclairage",
      "statut": "EN_ATTENTE",
      "categorie": "INFRASTRUCTURE",
      "priority": "NORMALE",
      "createdAt": "2024-01-15T10:00:00Z",
      "commune": {
        "nom": "Sidi Ahmed"
      },
      "utilisateur": {
        "prenom": "Ahmed",
        "nom": "B."
      }
    }
  ],
  "pagination": { ... }
}
```

---

#### GET /api/reclamations/[id]
Détail d'une réclamation.

**Response: 200**
```json
{
  "id": 1,
  "code": "REC-2024-001",
  "titre": "Problème d'éclairage",
  "description": "Les lampadaires ne fonctionnent plus...",
  "statut": "EN_COURS",
  "categorie": "INFRASTRUCTURE",
  "priority": "HAUTE",
  "latitude": 33.5,
  "longitude": -7.6,
  "quartierDouar": "Hay Mohammadi",
  "photos": ["url1.jpg", "url2.jpg"],
  "createdAt": "2024-01-15T10:00:00Z",
  "commune": { ... },
  "utilisateur": { ... },
  "autoriteLocale": { ... },
  "historique": [
    {
      "id": 1,
      "statutAvant": "SOUMISE",
      "statutApres": "EN_ATTENTE",
      "commentaire": "Réclamation reçue",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/reclamations
Créer une réclamation. **Auth requise**

**Body:**
```json
{
  "titre": "Problème d'éclairage dans le quartier",
  "description": "Les lampadaires de notre rue ne fonctionnent plus depuis 2 semaines...",
  "categorie": "INFRASTRUCTURE",
  "communeId": 1,
  "quartierDouar": "Hay Mohammadi",
  "latitude": 33.5,
  "longitude": -7.6,
  "etablissementId": null
}
```

**Response: 201**
```json
{
  "success": true,
  "reclamation": {
    "id": 1,
    "code": "REC-2024-001",
    ...
  }
}
```

---

#### PATCH /api/reclamations/[id]
Mettre à jour une réclamation. **Auth requise**

**Body:**
```json
{
  "statut": "EN_COURS",
  "commentaire": "Traitement en cours"
}
```

---

#### POST /api/reclamations/[id]/affecter
Affecter une réclamation à une autorité locale. **Rôle: DELEGATION**

**Body:**
```json
{
  "autoriteLocaleId": 5,
  "commentaire": "Affectation pour traitement"
}
```

---

### 📅 Événements

#### GET /api/evenements
Liste des événements.

**Query Parameters:**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `page` | number | Page |
| `type` | string | Type d'événement |
| `communeId` | number | Commune |
| `dateDebut` | string | Date minimum (ISO) |
| `dateFin` | string | Date maximum (ISO) |

**Response: 200**
```json
{
  "data": [
    {
      "id": 1,
      "titre": "Festival culturel",
      "description": "Grand festival annuel...",
      "type": "CULTUREL",
      "dateDebut": "2024-03-01T10:00:00Z",
      "dateFin": "2024-03-03T22:00:00Z",
      "lieu": "Place centrale",
      "imageUrl": "festival.jpg",
      "isPublie": true
    }
  ]
}
```

---

#### POST /api/evenements
Créer un événement. **Rôle: DELEGATION+**

**Body:**
```json
{
  "titre": "Campagne de vaccination",
  "description": "Campagne gratuite...",
  "type": "SANTE",
  "dateDebut": "2024-04-01T09:00:00Z",
  "dateFin": "2024-04-01T17:00:00Z",
  "lieu": "Centre de santé",
  "communeId": 1
}
```

---

### ⭐ Évaluations

#### POST /api/evaluations
Soumettre une évaluation. **Auth requise**

**Body:**
```json
{
  "etablissementId": 1,
  "noteGlobale": 4,
  "commentaire": "Service de qualité"
}
```

---

#### GET /api/evaluations?etablissementId=1
Liste des évaluations d'un établissement.

---

### 📊 Statistiques

#### GET /api/stats/dashboard
Statistiques générales. **Auth requise**

**Response: 200**
```json
{
  "reclamations": {
    "total": 150,
    "enAttente": 30,
    "enCours": 45,
    "resolues": 75
  },
  "etablissements": {
    "total": 200,
    "parSecteur": {
      "EDUCATION": 80,
      "SANTE": 50,
      "ADMINISTRATIF": 70
    }
  },
  "evenements": {
    "aVenir": 12,
    "ceMois": 5
  }
}
```

---

### ❤️ Health Check

#### GET /api/health
Vérifier l'état de l'application.

**Response: 200**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 15
    },
    "memory": {
      "status": "healthy",
      "used": 128,
      "total": 512
    }
  }
}
```

---

## 📋 Codes d'Erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 409 | Conflit (doublon) |
| 422 | Validation échouée |
| 429 | Too many requests |
| 500 | Erreur serveur |

---

## 🔄 Pagination

Tous les endpoints de liste supportent la pagination :

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🏷️ Enums

### Secteur
- `EDUCATION`
- `SANTE`
- `SOCIAL`
- `CULTUREL`
- `SPORTIF`
- `ADMINISTRATIF`
- `RELIGIEUX`
- `SECURITE`

### StatutReclamation
- `SOUMISE`
- `EN_ATTENTE`
- `EN_COURS`
- `TRAITEE`
- `REJETEE`
- `ARCHIVEE`

### CategorieReclamation
- `INFRASTRUCTURE`
- `HYGIENE`
- `SECURITE`
- `SERVICE`
- `ENVIRONNEMENT`
- `AUTRE`

### Role
- `CITOYEN`
- `AUTORITE_LOCALE`
- `DELEGATION`
- `GOUVERNEUR`
- `ADMIN`

---

## 📝 Rate Limiting

| Endpoint | Limite |
|----------|--------|
| Auth | 5 req/min |
| API publique | 100 req/min |
| API authentifiée | 200 req/min |
| Upload | 10 req/min |

---

**Documentation générée le:** 2024-12-10

---
description: Workflow d'affectation des réclamations aux autorités locales
---

# Workflow: Affectation des Réclamations

## Rôles autorisés pour affecter
- **ADMIN**
- **SUPER_ADMIN**
- **GOUVERNEUR**

---

## Processus complet

### 1. Création d'une réclamation (par Citoyen)

**Page:** `/reclamations/nouvelle`

**Rôle requis:** CITOYEN uniquement

**Données requises:**
- Commune (obligatoire)
- Établissement (optionnel)
- Catégorie (Infrastructure, Services, Propreté, etc.)
- Titre (min 5 caractères)
- Description (min 20 caractères)
- Localisation GPS (optionnel)
- Photos/preuves (optionnel)

**API appelée:** `POST /api/reclamations`

**Résultat:**
- Réclamation créée avec `statut: null` (en attente de décision)
- `affectationReclamation: NON_AFFECTEE`
- Historique créé avec action "CREATION"
- Notifications envoyées aux admins

---

### 2. Consultation des réclamations (Admin)

**Page:** `/admin/reclamations`

**Fonctionnalités:**
- Tableau avec filtres (statut, affectation, priorité, commune, catégorie)
- Stats: Total, En attente, Acceptées, Rejetées, Urgentes
- Pagination
- Actions rapides par ligne

---

### 3. Affectation d'une réclamation

**Étapes:**
1. Cliquer sur l'icône **👤+** (UserPlus) de la réclamation
2. Le modal d'affectation s'ouvre
3. Choisir un agent dans la liste ou "Ne pas affecter"
4. L'affectation est enregistrée

**API appelée:** `PATCH /api/reclamations/[id]/affecter`

**Body de la requête:**
```json
{
  "affecteAId": 5,                    // ID de l'agent (ou null pour désaffecter)
  "secteurAffecte": "SANTE",          // Optionnel: enum Secteur
  "commentaireAffectation": "Urgent"  // Optionnel: max 500 caractères
}
```

**Actions effectuées par l'API:**

1. **Vérification des permissions** (ADMIN, SUPER_ADMIN, GOUVERNEUR)

2. **Validation de l'agent** (existe et actif)

3. **Mise à jour de la réclamation:**
   ```javascript
   {
     affecteeAAutoriteId: affecteAId,       // L'agent affecté
     secteurAffecte: secteurAffecte,        // Le secteur
     affectationReclamation: 'AFFECTEE',    // ou 'NON_AFFECTEE' si null
     dateAffectation: new Date(),           // Date de l'affectation
     affecteeParAdminId: admin.id,          // L'admin qui a affecté
   }
   ```

4. **Création de l'historique:**
   ```javascript
   {
     reclamationId: id,
     action: 'AFFECTATION',  // ou 'DESAFFECTATION'
     details: {
       message: "Affectée à Jean Dupont",
       commentaire: "Urgent",
       agentId: 5
     },
     effectuePar: admin.id
   }
   ```

5. **Notification à l'agent:**
   ```javascript
   {
     userId: affecteAId,
     type: 'RECLAMATION_AFFECTEE',
     titre: 'Nouvelle réclamation affectée',
     message: 'La réclamation "Titre" vous a été affectée.',
     lien: '/reclamations/123'
   }
   ```

---

### 4. Cycle de vie de l'affectation

```
CRÉATION (Citoyen)
    ↓
statut: null (en attente décision)
affectation: NON_AFFECTEE
    ↓
┌─────────────────────┐
│ Décision Admin      │
├─────────────────────┤
│ ACCEPTEE  │ REJETEE │
└─────────────────────┘
    ↓
ACCEPTEE + NON_AFFECTEE
    ↓
┌─────────────────────┐
│ Affectation Admin   │
│ (ce workflow)       │
└─────────────────────┘
    ↓
ACCEPTEE + AFFECTEE
    ↓
Autorité locale traite
    ↓
RÉSOLUE
```

---

## Résumé des champs Prisma utilisés

### Modèle Reclamation

| Champ | Type | Description |
|-------|------|-------------|
| statut | StatutReclamation? | ACCEPTEE, REJETEE, ou null (en attente) |
| affectationReclamation | AffectationReclamation | NON_AFFECTEE, AFFECTEE |
| affecteeParAdminId | Int? | Admin qui a affecté |
| affecteeAAutoriteId | Int? | Autorité locale assignée |
| secteurAffecte | Secteur? | Secteur de responsabilité |
| serviceInterneProvince | String? | Service interne si province |
| dateAffectation | DateTime? | Date de l'affectation |

### Modèle HistoriqueReclamation

| Champ | Type | Description |
|-------|------|-------------|
| reclamationId | Int | Référence réclamation |
| action | String | CREATION, AFFECTATION, DESAFFECTATION, etc. |
| details | Json? | Données contextuelles |
| effectuePar | Int | User ID qui a fait l'action |

---

## Vérification du bon fonctionnement

// turbo
1. Vérifier que l'API existe:
```bash
# Le fichier doit exister:
# app/api/reclamations/[id]/affecter/route.ts
```

// turbo
2. Tester l'API:
```bash
curl -X PATCH http://localhost:3000/api/reclamations/1/affecter \
  -H "Content-Type: application/json" \
  -d '{"affecteAId": 1}'
```

3. Vérifier dans la base:
   - Table `Reclamation`: champs affectation mis à jour
   - Table `HistoriqueReclamation`: nouvelle entrée créée
   - Table `Notification`: notification envoyée à l'agent

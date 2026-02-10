---
description: Workflow complet de création d'un événement avec détails des champs du stepper
---

# Workflow: Création d'Événement (Stepper Multi-Step)

## Rôles autorisés
- **DELEGATION** (Responsable de secteur)
- **ADMIN**
- **SUPER_ADMIN**

## Accès
- **Admin:** `/admin/evenements` → Bouton "Créer un événement"
- **Public:** `/evenements` → Bouton "Créer"

---

# 📋 STEPPER - 4 ÉTAPES

## 🔵 ÉTAPE 1: Informations de base
**Icône:** ℹ️ Info
**Description:** Titre et description

| Champ | Type | Obligatoire | Validation | Exemple |
|-------|------|-------------|------------|---------|
| **Titre** | `input text` | ✅ OUI | Min 5 caractères, Max 200 | "Festival Culturel de Médiouna 2025" |
| **Description** | `textarea` | ✅ OUI | Min 20 caractères, Max 5000 | "Venez profiter d'une journée exceptionnelle..." |
| **Secteur** | `select` | ✅ OUI | Enum obligatoire | EDUCATION, SANTE, SPORT, SOCIAL, CULTUREL, AUTRE |
| **Catégorie** | `select` | ✅ OUI | Non vide | Conférence, Formation, Atelier, Festival, etc. |

### Options Secteur:
```
🎓 EDUCATION  - Éducation
🏥 SANTE      - Santé
⚽ SPORT      - Sport
🤝 SOCIAL     - Social
🎭 CULTUREL   - Culturel
📌 AUTRE      - Autre
```

### Options Catégorie:
```
- Conférence
- Formation
- Atelier
- Festival
- Compétition
- Spectacle
- Exposition
- Journée portes ouvertes
- Campagne
- Rencontre
- Cérémonie
- Autre
```

---

## 📍 ÉTAPE 2: Localisation
**Icône:** 📍 MapPin
**Description:** Lieu de l'événement

| Champ | Type | Obligatoire | Validation | Exemple |
|-------|------|-------------|------------|---------|
| **Commune** | `select` | ✅ OUI | ID numérique positif | Médiouna, Sidi Moumen, etc. |
| **Établissement** | `select` | ❌ NON | Filtré par commune sélectionnée | École primaire X, Centre de santé Y |
| **Lieu précis** | `input text` | ✅ OUI | Min 3 caractères, Max 255 | "Salle des fêtes, 12 rue principale" |
| **Adresse complète** | `input text` | ❌ NON | Texte libre | "Avenue Mohammed V, Médiouna" |
| **Latitude** | `map click` | ❌ NON | Nombre décimal | 33.4521 |
| **Longitude** | `map click` | ❌ NON | Nombre décimal | -7.5189 |

### Carte Interactive:
- Centre par défaut: **33.45, -7.52** (Province Médiouna)
- Zoom: 12
- Cliquer sur la carte pour positionner le marqueur
- Le marqueur est draggable

---

## 👥 ÉTAPE 3: Participation
**Icône:** 👥 Users
**Description:** Dates et inscriptions

| Champ | Type | Obligatoire | Validation | Exemple |
|-------|------|-------------|------------|---------|
| **Date de début** | `input date` | ✅ OUI | Date future (min: aujourd'hui) | 2025-01-15 |
| **Date de fin** | `input date` | ❌ NON | >= Date début | 2025-01-16 |
| **Heure début** | `input time` | ❌ NON | Format HH:mm | 09:00 |
| **Heure fin** | `input time` | ❌ NON | Format HH:mm | 18:00 |
| **Capacité max** | `input number` | ❌ NON | Entier positif ou vide (illimité) | 500 |
| **Événement gratuit** | `checkbox` | ✅ OUI | Boolean (défaut: true) | ✅ Coché |
| **Prix d'entrée (DH)** | `input number` | ⚠️ Conditionnel | Si non gratuit: positif requis | 50.00 |
| **Lien inscription** | `input url` | ❌ NON | URL valide ou vide | https://forms.google.com/... |

### Logique conditionnelle:
- Si **"Événement gratuit"** est ✅ coché → Le champ **"Prix d'entrée"** est masqué
- Si **"Événement gratuit"** est ❌ décoché → Le champ **"Prix d'entrée"** devient **obligatoire**

---

## 🖼️ ÉTAPE 4: Médias
**Icône:** 🖼️ Image
**Description:** Photos et vidéos

| Champ | Type | Obligatoire | Validation | Exemple |
|-------|------|-------------|------------|---------|
| **Photos** | `file upload` | ❌ NON | JPG, PNG, WebP, max 5MB par fichier | event-photo.jpg |

### Zone d'upload:
- Zone drag & drop ou clic
- Upload multiple supporté
- Prévisualisation des images uploadées
- Bouton supprimer par image
- API: `POST /api/upload` avec `type: "evenement"`

### Résumé affiché:
Après avoir rempli les 3 premières étapes, un résumé s'affiche:
```
📋 Résumé de l'événement
━━━━━━━━━━━━━━━━━━━━━━
Titre: Festival Culturel de Médiouna 2025
Secteur: Culturel
Date: 15/01/2025
Lieu: Salle des fêtes, 12 rue principale
Prix: Gratuit
Photos: 3
```

---

# 🔘 Actions disponibles

## Boutons du footer:

| Bouton | Action | Disponible |
|--------|--------|------------|
| **💾 Sauvegarder brouillon** | Sauvegarde dans localStorage | Toutes les étapes |
| **⬅️ Précédent** | Revenir à l'étape précédente | Étapes 2, 3, 4 |
| **➡️ Suivant** | Passer à l'étape suivante (après validation) | Étapes 1, 2, 3 |
| **✅ Créer l'événement** | Soumettre le formulaire | Étape 4 uniquement |

---

# 📤 Soumission (API)

**Endpoint:** `POST /api/evenements`

**Données envoyées:**
```json
{
  "titre": "Festival Culturel de Médiouna 2025",
  "description": "Venez profiter d'une journée exceptionnelle...",
  "secteur": "CULTUREL",
  "typeCategorique": "Festival",
  "communeId": 1,
  "etablissementId": null,
  "lieu": "Salle des fêtes, 12 rue principale",
  "adresseComplete": "Avenue Mohammed V, Médiouna",
  "latitude": 33.4521,
  "longitude": -7.5189,
  "dateDebut": "2025-01-15",
  "dateFin": "2025-01-16",
  "heureDebut": "09:00",
  "heureFin": "18:00",
  "capaciteMax": 500,
  "isGratuit": true,
  "prixEntree": null,
  "lienInscription": "",
  "medias": [
    { "url": "/uploads/event-1.jpg", "type": "IMAGE" },
    { "url": "/uploads/event-2.jpg", "type": "IMAGE" }
  ]
}
```

**Réponse succès:**
```json
{
  "message": "Événement créé avec succès, en attente de validation",
  "data": {
    "id": 42,
    "statut": "EN_ATTENTE_VALIDATION",
    ...
  }
}
```

---

# ✅ Validation par étape

## Étape 1 - Obligatoire:
- Titre: min 5 caractères
- Description: min 20 caractères
- Catégorie: non vide

## Étape 2 - Obligatoire:
- Commune: sélectionnée
- Lieu: min 3 caractères

## Étape 3 - Obligatoire:
- Date de début: non vide
- Si non gratuit: Prix d'entrée > 0

## Étape 4 - Optionnel:
- Pas de validation bloquante
- Les photos sont optionnelles

---

# 🔄 Cycle de vie après création

```
┌──────────────────────────────────┐
│    CRÉATION (Étape 4 validée)    │
└──────────────────┬───────────────┘
                   ▼
        ┌──────────────────┐
        │ EN_ATTENTE_VALIDATION │
        └─────────┬────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   ┌─────────┐        ┌─────────┐
   │ PUBLIEE │        │ REJETEE │
   └────┬────┘        └─────────┘
        │
        ▼ (date début atteinte)
   ┌───────────┐
   │ EN_ACTION │
   └─────┬─────┘
         │
         ▼ (date fin passée)
   ┌──────────┐
   │ CLOTUREE │
   └──────────┘
```

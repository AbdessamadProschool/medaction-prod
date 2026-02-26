# 🧪 Plan de Tests d'Acceptation Utilisateur (UAT)

**Projet:** MedAction  
**Date:** 2024-12-10  
**Version:** 1.0.0

---

## 📋 Table des Matières

1. [Objectifs](#objectifs)
2. [Scénarios par Rôle](#scénarios-par-rôle)
3. [Critères d'Acceptation](#critères-dacceptation)
4. [Checklist de Test](#checklist-de-test)
5. [Rapport de Bugs](#rapport-de-bugs)

---

## 🎯 Objectifs

Valider que toutes les fonctionnalités répondent aux besoins métier et offrent une expérience utilisateur optimale.

---

## 👥 Scénarios par Rôle

### 1. CITOYEN

#### SC-C01: Inscription
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller sur `/register` | Page d'inscription affichée |
| 2 | Remplir le formulaire | Validation en temps réel |
| 3 | Soumettre | Redirection vers login + message succès |

#### SC-C02: Connexion
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller sur `/login` | Page de connexion affichée |
| 2 | Entrer credentials valides | Redirection vers accueil |
| 3 | Menu utilisateur visible | Photo/initiales + nom affichés |

#### SC-C03: Créer une Réclamation
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer "Nouvelle réclamation" | Stepper 3 étapes affiché |
| 2 | Étape 1: Sélectionner commune | Carte mise à jour |
| 3 | Étape 1: Placer marqueur sur carte | Coordonnées enregistrées |
| 4 | Étape 2: Remplir titre + description | Validation ok |
| 5 | Étape 3: Ajouter photos (optionnel) | Preview photos |
| 6 | Soumettre | Page confirmation + numéro suivi |

#### SC-C04: Suivre mes Réclamations
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder `/mes-reclamations` | Liste de mes réclamations |
| 2 | Filtrer par statut | Liste filtrée |
| 3 | Cliquer sur une réclamation | Modal détail ouvert |

#### SC-C05: Évaluer un Établissement
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Ouvrir un établissement | Page détail |
| 2 | Cliquer "Évaluer" | Formulaire évaluation |
| 3 | Donner note (étoiles) | Étoiles sélectionnées |
| 4 | Écrire commentaire | Texte accepté |
| 5 | Soumettre | Évaluation ajoutée à la liste |

#### SC-C06: Consulter les Événements
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder `/evenements` | Liste des événements |
| 2 | Filtrer par secteur | Événements filtrés |
| 3 | Cliquer sur un événement | Page détail avec toutes infos |

#### SC-C07: Modifier mon Profil
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Accéder `/profil` | Page profil 3 onglets |
| 2 | Modifier nom/prénom | Champs éditables |
| 3 | Changer photo | Upload + preview |
| 4 | Changer mot de passe | Validation + succès |
| 5 | Sauvegarder | Message confirmation |

---

### 2. AUTORITÉ LOCALE

#### SC-AL01: Accéder au Dashboard
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Se connecter (role AUTORITE_LOCALE) | Redirection dashboard |
| 2 | Dashboard affiché | Stats + réclamations de ma commune |

#### SC-AL02: Traiter une Réclamation
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Voir réclamation affectée | Détails complets |
| 2 | Changer statut | Dropdown fonctionnel |
| 3 | Accepter/Rejeter | Statut mis à jour |

---

### 3. DÉLÉGATION

#### SC-D01: Dashboard Délégation
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Se connecter (role DELEGATION) | Dashboard `/delegation` |
| 2 | Statistiques affichées | Événements, articles, campagnes |

#### SC-D02: Créer un Événement
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller sur `/delegation/evenements` | Liste des événements |
| 2 | Cliquer "Créer" | Formulaire événement |
| 3 | Remplir le formulaire | Tous les champs |
| 4 | Soumettre | Événement créé + visible |

#### SC-D03: Créer une Actualité
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller sur `/delegation/actualites` | Liste actualités |
| 2 | Créer nouvelle | Formulaire |
| 3 | Publier | Visible sur site public |

---

### 4. ADMIN

#### SC-A01: Dashboard Admin
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Se connecter (role ADMIN) | Dashboard `/admin` |
| 2 | Toutes les stats | Vue globale plateforme |

#### SC-A02: Gérer les Utilisateurs
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller `/admin/utilisateurs` | Liste des utilisateurs |
| 2 | Filtrer par rôle | Liste filtrée |
| 3 | Modifier un utilisateur | Formulaire édition |
| 4 | Désactiver un compte | Compte désactivé |

#### SC-A03: Valider les Contenus
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller `/admin/validation` | Contenus en attente |
| 2 | Approuver/Rejeter | Statut mis à jour |

#### SC-A04: Consulter les Logs
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller `/admin/logs` | Journal d'activité |
| 2 | Filtrer par type | Logs filtrés |

#### SC-A05: Statistiques Admin
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller `/admin/stats` | Statistiques détaillées |
| 2 | Changer période | Données mises à jour |

#### SC-A06: Paramètres
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller `/admin/settings` | Page paramètres |
| 2 | Modifier paramètre | Sauvegarde réussie |

---

### 5. GOUVERNEUR

#### SC-G01: Dashboard Gouverneur
| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Se connecter (role GOUVERNEUR) | Dashboard `/gouverneur` |
| 2 | Statistiques provinciales | Vue d'ensemble |
| 3 | Accès rapides | Liens fonctionnels |

---

## ✅ Critères d'Acceptation

### Fonctionnel
- [ ] Toutes les fonctionnalités sont accessibles selon le rôle
- [ ] Les formulaires valident correctement les entrées
- [ ] Les messages d'erreur sont clairs et en français
- [ ] Les redirections fonctionnent correctement

### Performance
- [ ] Pages chargent en < 3 secondes
- [ ] Pas de freeze lors des actions
- [ ] Infinite scroll fonctionne

### UI/UX
- [ ] Responsive (mobile, tablette, desktop)
- [ ] Animations fluides
- [ ] Contraste suffisant
- [ ] Cohérence visuelle gouvernementale

### Sécurité
- [ ] Accès protégé selon les rôles
- [ ] Déconnexion fonctionne
- [ ] Pas d'accès aux données d'autres utilisateurs

---

## 📝 Checklist de Test

### Pages Publiques
- [ ] Accueil `/`
- [ ] Établissements `/etablissements`
- [ ] Détail établissement `/etablissements/[id]`
- [ ] Événements `/evenements`
- [ ] Détail événement `/evenements/[id]`
- [ ] Actualités `/actualites`
- [ ] Carte `/carte`
- [ ] Contact `/contact`
- [ ] FAQ `/faq`

### Pages Authentifiées
- [ ] Nouvelle réclamation `/reclamations/nouvelle`
- [ ] Mes réclamations `/mes-reclamations`
- [ ] Profil `/profil`
- [ ] Notifications `/notifications`

### Dashboards
- [ ] Admin `/admin`
- [ ] Autorité Locale `/autorite`
- [ ] Délégation `/delegation`
- [ ] Gouverneur `/gouverneur`

### API Endpoints
- [ ] Health check `/api/health`
- [ ] Auth `/api/auth/*`
- [ ] Établissements `/api/etablissements`
- [ ] Réclamations `/api/reclamations`
- [ ] Événements `/api/evenements`

---

## 🐛 Rapport de Bugs Critiques (Corrigés)

| ID | Bug | Statut | Fix |
|----|-----|--------|-----|
| BUG-001 | Avatar image error Next.js | ✅ Corrigé | Remplacé Image par img |
| BUG-002 | event-placeholder.jpg 404 | ✅ Corrigé | Fallback CSS gradient |
| BUG-003 | /gouverneur 404 | ✅ Corrigé | Page créée |
| BUG-004 | /admin/stats 404 | ✅ Corrigé | Page créée |
| BUG-005 | /admin/settings 404 | ✅ Corrigé | Page créée |
| BUG-006 | /mes-suggestions menu link | ✅ Corrigé | Lien supprimé du menu |

---

## 📊 Load Testing

### Outils Recommandés
- **k6** - Load testing moderne
- **Artillery** - Tests de charge JavaScript
- **Apache JMeter** - Tests avancés

### Scénarios de Charge

```bash
# Installation k6
# Télécharger depuis https://k6.io/

# Exemple script k6
# k6 run load-test.js
```

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up
    { duration: '1m', target: 50 },   // Plateau
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function() {
  // Test page d'accueil
  let res = http.get('http://localhost:3000/');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);

  // Test API établissements
  res = http.get('http://localhost:3000/api/etablissements?limit=10');
  check(res, { 'API status 200': (r) => r.status === 200 });
  sleep(0.5);
}
```

### Métriques à Surveiller
- Response time (p95 < 500ms)
- Throughput (req/s)
- Error rate (< 1%)
- Memory usage
- CPU usage

---

**Document mis à jour par:** Équipe QA MedAction

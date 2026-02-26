# 🔐 GUIDE D'AMÉLIORATION SÉCURITÉ - ÉTAPE PAR ÉTAPE

## 📋 Checklist de Sécurité

---

## ÉTAPE 1: GÉNÉRER LES SECRETS ✅

Exécutez ce script pour générer des secrets sécurisés :

```bash
node scripts/generate-secrets.js
```

Puis copiez les valeurs générées dans votre fichier `.env`.

---

## ÉTAPE 2: METTRE À JOUR VOTRE .env

Ouvrez votre fichier `.env` et remplacez les valeurs suivantes :

### Variables OBLIGATOIRES en production:

```env
# 🔐 AUTHENTICATION
NEXTAUTH_SECRET="<valeur_générée_par_script>"

# 📱 API MOBILE  
MOBILE_API_KEY="<valeur_générée_par_script>"

# 🗄️ BASE DE DONNÉES
DATABASE_URL="postgresql://medaction:<nouveau_mot_de_passe>@localhost:5432/medaction"
POSTGRES_PASSWORD="<valeur_générée_par_script>"
```

---

## ÉTAPE 3: CONFIGURER HCAPTCHA

### Pour le développement (clés de test):
```env
NEXT_PUBLIC_HCAPTCHA_SITE_KEY="10000000-ffff-ffff-ffff-000000000001"
HCAPTCHA_SECRET="0x0000000000000000000000000000000000000000"
```

### Pour la production:
1. Créez un compte sur https://www.hcaptcha.com/
2. Créez un site et récupérez vos clés
3. Remplacez les valeurs dans `.env`

---

## ÉTAPE 4: VÉRIFIER LA CONFIGURATION

Redémarrez l'application et vérifiez les logs :

```bash
# Arrêter npm run dev (Ctrl+C)
npm run dev
```

Vous devriez voir le message de validation des variables d'environnement.

---

## ÉTAPE 5: TESTER LES PROTECTIONS

### Test du Rate Limiting:
```bash
# Essayez de vous connecter 6 fois avec un mauvais mot de passe
# Vous devriez être bloqué après 5 tentatives
```

### Test du CAPTCHA:
```bash
# Après 3 échecs de connexion, le CAPTCHA devrait être requis
```

### Test de l'API Mobile:
```bash
# Sans clé API
curl http://localhost:3000/api/auth/mobile/login

# Avec clé API
curl -H "X-Mobile-API-Key: votre_cle" http://localhost:3000/api/auth/mobile/login
```

---

## ÉTAPE 6: DOCKER (Optionnel)

Si vous utilisez Docker, mettez à jour `docker-compose.yml` :

```yaml
environment:
  - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
  - MOBILE_API_KEY=${MOBILE_API_KEY}
  - DATABASE_URL=postgresql://medaction:${POSTGRES_PASSWORD}@postgres:5432/medaction
```

Puis reconstruisez :
```bash
docker-compose down
docker-compose build app
docker-compose up -d
```

---

## 📊 SCORE DE SÉCURITÉ

| Étape | Description | Points |
|-------|-------------|--------|
| ✅ | Secrets générés | +3 |
| ✅ | MOBILE_API_KEY configuré | +2 |
| ✅ | hCaptcha configuré | +2 |
| ⏳ | HTTPS en production | +2 |
| ⏳ | Redis pour rate limiting | +1 |

**Score actuel estimé: 91/100 → 98/100** (après toutes les étapes)

---

## 🚨 VARIABLES À NE JAMAIS EXPOSER

Ces variables contiennent des secrets sensibles :
- `NEXTAUTH_SECRET`
- `MOBILE_API_KEY`
- `DATABASE_URL` (contient le mot de passe)
- `POSTGRES_PASSWORD`
- `HCAPTCHA_SECRET`

**NE JAMAIS :**
- Les mettre dans le code source
- Les partager sur Slack/Discord/Email
- Les commiter dans Git
- Les afficher dans les logs

---

## ✅ FICHIERS CRÉÉS/MODIFIÉS

| Fichier | Description |
|---------|-------------|
| `.env.example` | Template avec toutes les variables |
| `scripts/generate-secrets.js` | Script de génération de secrets |
| `lib/security/env-validator.ts` | Validation des variables au démarrage |
| `docs/SECURITY_RECOMMENDATIONS.md` | Recommandations détaillées |

---

*Document mis à jour le 23/12/2025*

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║              RAPPORT DE DÉPLOIEMENT - MEDACTION v1.0.0                        ║
# ║                      Province de Médiouna                                      ║
# ║                                                                                ║
# ║  Date: 04/02/2026                                                              ║
# ║  Objectif: Documenter les problèmes et solutions du dernier déploiement        ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

## 📋 RÉSUMÉ DES PROBLÈMES RENCONTRÉS

### 1. ❌ Erreur `clientModules` (500 Internal Server Error)

**Symptôme:**
```
TypeError: Cannot read properties of undefined (reading 'clientModules')
at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js
```

**Cause racine:**
- Cache `.next` corrompu pendant le build
- Incompatibilité entre le cache local et l'image Docker

**Solution appliquée:**
- Nettoyer `.next` avant chaque build : `Remove-Item -Recurse -Force .next`
- Nettoyer `node_modules\.cache` : `Remove-Item -Recurse -Force node_modules\.cache`

**Prévention:**
- ✅ Ajouté au script `build-local.ps1`

---

### 2. ❌ Erreurs de Traduction (IntlError)

**Symptôme:**
```
MISSING_MESSAGE: Could not resolve 'campaigns.no_campaigns' in messages for locale 'ar'
```

**Cause racine:**
- Clés de traduction manquantes dans `locales/ar/common.json`
- Section `campaigns` dupliquée dans le fichier JSON

**Solutions appliquées:**
- Ajouté les clés manquantes : `no_campaigns`, `status_finished`, `subtitle`, etc.
- Fusionné les sections `campaigns` dupliquées

**Prévention:**
- ✅ Vérifier la syntaxe JSON avant le build
- ✅ Comparer les clés entre `fr` et `ar`

---

### 3. ❌ Build Docker Extrêmement Long (8+ heures)

**Symptôme:**
- `[runner 9/9] RUN chown -R nextjs:nodejs /app` prend 8+ heures
- Contexte de build de 1.03 GB

**Cause racine:**
- `.dockerignore` n'exclut pas assez de fichiers
- Build multi-stage refait tout à chaque fois
- Windows + Docker Desktop = performances lentes

**Solution appliquée:**
- Créé `Dockerfile.local` optimisé qui utilise le build local pré-compilé
- Créé `.dockerignore.local` minimal
- Script `build-local.ps1` automatisé

**Prévention:**
- ✅ Toujours utiliser `Dockerfile.local` pour les builds locaux
- ✅ Build estimé : 5-10 minutes au lieu de 8 heures

---

### 4. ❌ Erreur d'Hydratation (LoadingScreen)

**Symptôme:**
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client
```

**Cause racine:**
- Utilisation de `Math.random()` dans `LoadingScreen.tsx`
- Valeurs différentes entre serveur et client

**Solution appliquée:**
- Remplacé les positions aléatoires par des positions fixes pré-calculées

**Fichier modifié:**
- `components/ui/LoadingScreen.tsx` (lignes 87-109)

---

### 5. ⚠️ Erreurs "Dynamic Server Usage" pendant le Build

**Symptôme:**
```
Route /api/map/annexes couldn't be rendered statically because it used `request.url`
```

**Cause:**
- Routes API dynamiques ne peuvent pas être pré-rendues
- Pas de base de données disponible pendant le build local

**Impact:** AUCUN - C'est un comportement NORMAL
- Ces routes seront rendues dynamiquement au runtime

**Action:** Ignorer ces avertissements pendant le build

---

### 6. ⚠️ Upload ISO sur Proxmox Échoue

**Symptôme:**
```
Error '0' occurred while receiving the document
```

**Cause racine:**
- Interface web Proxmox instable pour gros fichiers
- Espace insuffisant dans `/var/tmp`
- Connexion interrompue

**Solution appliquée:**
- Utiliser `gdown` pour télécharger directement sur le serveur
- Installer pip et gdown sur Proxmox

**Commandes:**
```bash
pip3 install gdown --break-system-packages
gdown "FILE_ID"
```

---

## ✅ CHECKLIST PRÉ-DÉPLOIEMENT

### Phase 1: Préparation Locale
- [ ] Docker Desktop démarré et fonctionnel
- [ ] Nettoyer `.next` : `Remove-Item -Recurse -Force .next`
- [ ] Nettoyer cache : `Remove-Item -Recurse -Force node_modules\.cache`
- [ ] Vérifier les traductions (pas de clés dupliquées)

### Phase 2: Build
- [ ] `npm run build` réussi sans erreurs critiques
- [ ] Les erreurs "Dynamic Server Usage" sont ignorées (normal)
- [ ] `.\build-local.ps1 -SkipNpmBuild` exécuté

### Phase 3: Upload
- [ ] Fichier `.tar` uploadé sur Google Drive
- [ ] Lien de partage obtenu
- [ ] ID du fichier extrait

### Phase 4: Déploiement Serveur
- [ ] SSH/Shell Proxmox accessible
- [ ] `gdown "FILE_ID"` réussi à 100%
- [ ] `pct push` vers le conteneur 100
- [ ] `docker load -i` réussi

### Phase 5: Mise en Production
- [ ] `docker ps` pour vérifier le conteneur actuel
- [ ] `docker stop medaction-app`
- [ ] `docker rm medaction-app`
- [ ] `docker run` avec les bonnes variables d'environnement
- [ ] `docker logs --tail 50 medaction-app` vérifié

### Phase 6: Validation
- [ ] Site accessible sur `https://bo.provincemediouna.ma`
- [ ] Connexion admin fonctionne
- [ ] Pages en arabe et français fonctionnent
- [ ] Pas d'erreur 500

---

## 🔧 COMMANDE DE ROLLBACK (si problème)

```bash
# Dans le conteneur 100
docker stop medaction-app
docker rm medaction-app

# Revenir à la version stable
docker run -d \
  --name medaction-app \
  --restart unless-stopped \
  --network medaction_medaction-network \
  -p 3000:3000 \
  -v medaction_uploads_data:/app/public/uploads \
  -e DATABASE_URL="postgresql://medaction:medaction_secure_2024@postgres:5432/medaction" \
  -e NEXTAUTH_URL="http://192.168.1.41:3000" \
  -e NEXTAUTH_SECRET="super_secret_key_change_in_production_2024" \
  -e NODE_ENV="production" \
  -e LICENSE_KEY="MED-0D84-C0A3-3DF4-C9AF" \
  -e LICENSE_DOMAINS="localhost,127.0.0.1,192.168.1.103,192.168.1.41,bo.provincemediouna.ma" \
  medaction-app:security-update
```

---

## 📊 VERSIONS DES IMAGES DOCKER

| Tag | Description | Status |
|-----|-------------|--------|
| `medaction-app:latest` | Dernière version (à déployer) | 🔄 En préparation |
| `medaction-app:security-update` | Version stable de secours | ✅ Fonctionnelle |

---

## 📝 NOTES IMPORTANTES

1. **Ne JAMAIS supprimer `medaction-app:security-update`** - C'est votre backup
2. **Les données sont dans PostgreSQL**, pas dans l'image Docker
3. **Toujours tester sur `192.168.1.41:3000`** avant de valider
4. **Garder ce document à jour** après chaque déploiement

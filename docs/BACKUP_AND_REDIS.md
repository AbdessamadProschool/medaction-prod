# 🔄 GUIDE: BACKUPS AUTOMATIQUES & REDIS

## Table des matières
1. [Activer Redis pour le Rate Limiting](#1-activer-redis-pour-le-rate-limiting)
2. [Configurer les Backups Automatiques](#2-configurer-les-backups-automatiques)

---

## 1. ACTIVER REDIS POUR LE RATE LIMITING

### Pourquoi Redis?

| Sans Redis | Avec Redis |
|------------|------------|
| Rate limiting en mémoire | Rate limiting distribué |
| Perdu au redémarrage | Persistant |
| 1 seule instance | Multi-instances |
| Développement | Production |

### Étape 1: Lancer Redis avec Docker

```bash
# Lancer Redis avec Docker Compose
docker-compose --profile cache up -d redis

# Vérifier que Redis fonctionne
docker-compose logs redis
```

### Étape 2: Configurer votre .env

Ajoutez cette ligne dans votre fichier `.env`:

```env
# Redis pour le rate limiting distribué
REDIS_URL="redis://localhost:6379"
```

### Étape 3: Vérifier la connexion

Redémarrez l'application et vérifiez les logs:

```bash
# Redémarrer npm run dev
npm run dev

# Vous devriez voir:
# [RATE_LIMITER] ✅ Connecté à Redis
```

### Utilisation dans le code

Le rate limiter est importable depuis `lib/security/rate-limiter-redis.ts`:

```typescript
import { 
  checkLoginRateLimit, 
  checkApiRateLimit 
} from '@/lib/security/rate-limiter-redis';

// Exemple dans une API route
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  
  const rateLimit = await checkLoginRateLimit(ip);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives', retryAfter: rateLimit.retryAfterSeconds },
      { status: 429 }
    );
  }
  
  // ... reste de la logique
}
```

### Rate Limiters disponibles

| Fonction | Limite | Usage |
|----------|--------|-------|
| `checkLoginRateLimit` | 5/15min | Connexions |
| `checkApiRateLimit` | 100/min | APIs générales |
| `checkMobileApiRateLimit` | 30/min | API mobile |
| `checkReclamationRateLimit` | 5/heure | Création réclamations |
| `checkRegistrationRateLimit` | 3/heure | Inscriptions |
| `checkPasswordResetRateLimit` | 3/heure | Reset mot de passe |

---

## 2. CONFIGURER LES BACKUPS AUTOMATIQUES

### Prérequis
- Linux/macOS (pour cron)
- `pg_dump` installé
- Variables d'environnement configurées

### Sur Windows

Sur Windows, utilisez le **Planificateur de tâches** :

1. Ouvrir "Planificateur de tâches"
2. Créer une tâche de base
3. Nom: "MedAction Backup"
4. Déclencheur: Quotidien à 2h00
5. Action: Démarrer un programme
6. Programme: `powershell.exe`
7. Arguments:
   ```
   -ExecutionPolicy Bypass -File "C:\path\to\medaction\scripts\backup-database.ps1"
   ```

### Script PowerShell pour Windows

Créez `scripts/backup-database.ps1`:

```powershell
# Backup PostgreSQL - Windows
$DATE = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_DIR = "$PSScriptRoot\..\backups"
$BACKUP_FILE = "$BACKUP_DIR\medaction_$DATE.sql"

# Créer le dossier si nécessaire
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

# Variables de connexion
$env:PGPASSWORD = "votre_mot_de_passe"

# Backup
pg_dump -h localhost -U medaction -d medaction -f $BACKUP_FILE

# Compression
Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip"
Remove-Item $BACKUP_FILE

Write-Host "Backup créé: $BACKUP_FILE.zip"
```

### Sur Linux/macOS

#### Option A: Script automatique

```bash
# Rendre le script exécutable
chmod +x scripts/setup-cron.sh

# Exécuter le script de configuration
sudo ./scripts/setup-cron.sh
```

#### Option B: Configuration manuelle

```bash
# Éditer le crontab
crontab -e

# Ajouter ces lignes:
# Backup quotidien à 2h00
0 2 * * * cd /path/to/medaction && ./scripts/backup-database.sh >> /var/log/medaction/backup.log 2>&1

# Backup hebdomadaire le dimanche à 1h00
0 1 * * 0 cd /path/to/medaction && BACKUP_RETENTION_DAYS=90 ./scripts/backup-database.sh >> /var/log/medaction/backup-weekly.log 2>&1
```

### Vérifier les backups

```bash
# Lister les backups
ls -la backups/

# Voir le contenu d'un backup
zcat backups/medaction_2025-01-01_02-00-00.sql.gz | head -100

# Test de restauration (sur une base de test)
gunzip -c backups/medaction_latest.sql.gz | psql -h localhost -U medaction -d medaction_test
```

### Avec Docker

Si vous utilisez Docker, les backups peuvent être automatisés via le container:

```bash
# Backup depuis Docker
docker-compose exec postgres pg_dump -U medaction medaction | gzip > backups/medaction_$(date +%Y-%m-%d).sql.gz

# Ou via un container dédié
docker run --rm \
  --network medaction-network \
  -e PGPASSWORD=votre_mot_de_passe \
  -v $(pwd)/backups:/backups \
  postgres:16-alpine \
  pg_dump -h postgres -U medaction medaction | gzip > /backups/backup.sql.gz
```

---

## 📊 Résumé des fichiers créés

| Fichier | Description |
|---------|-------------|
| `lib/security/rate-limiter-redis.ts` | Rate limiter avec Redis |
| `scripts/backup-database.sh` | Script de backup PostgreSQL |
| `scripts/setup-cron.sh` | Configuration automatique cron |

---

## ✅ Checklist

- [ ] Redis lancé et connecté
- [ ] REDIS_URL configuré dans .env
- [ ] Script de backup testé manuellement
- [ ] Cron jobs configurés
- [ ] Dossier backups créé
- [ ] Permissions correctes

---

*Document créé le 23/12/2025*

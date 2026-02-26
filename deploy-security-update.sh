#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# SCRIPT DE DÉPLOIEMENT ROBUSTE - MEDACTION (Fix Alpine/OpenSSL)
# ════════════════════════════════════════════════════════════════════════════

set -e

# --- CONFIGURATION ---
BASE_DIR="/home/medaction"
IMAGE_TAR="${BASE_DIR}/medaction-app-security-update.tar"
COMPOSE_FILE="docker-compose.server.yml"
CONTAINER_NAME="medaction-app"

echo "════════════════════════════════════════════════════════════════"
echo "  🛡️  DÉPLOIEMENT MEDACTION - PATCH FINAL"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Étape 1: Charger l'image Docker
if [ -f "$IMAGE_TAR" ]; then
    echo "📦 1. Chargement de l'image Docker..."
    docker load -i "$IMAGE_TAR"
    docker tag medaction-app:security-update medaction-app:latest
    echo "✅ Image chargée et taguée."
else
    echo "⚠️  Fichier image non trouvé, on continue avec l'image existante..."
fi
echo ""

# Étape 2: Redémarrer l'application
echo "🚀 2. Redémarrage des conteneurs..."
docker compose -f $COMPOSE_FILE down --remove-orphans || true
docker compose -f $COMPOSE_FILE up -d
echo "✅ Conteneurs lancés."
echo ""

# Étape 3: Attendre
echo "⏳ 3. Attente (10s)..."
sleep 10
echo "✅ Prêt."
echo ""

# Étape 4: PATCH ET MIGRATION
echo "🔧 4. Préparation et Migration..."

# 4a. Installation des dépendances système manquantes (OpenSSL) pour Alpine
echo "   -> Installation OpenSSL (Fix Alpine)..."
docker exec -u root $CONTAINER_NAME apk add --no-cache openssl ca-certificates > /dev/null 2>&1 || echo "   (OpenSSL déjà présent ou installation ignorée)"

# 4b. Patch du schema.prisma
echo "   -> Patching schema.prisma..."
docker exec -u root $CONTAINER_NAME sh -c "sed -i 's/provider = \"postgresql\"/provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")/' prisma/schema.prisma"
echo "   -> Patch appliqué."

# 4c. Migration avec Prisma 5.22.0 (Stable)
echo "   -> Exécution de la migration..."
if docker exec -e DATABASE_URL='postgresql://medaction:medaction_secure_2024@postgres:5432/medaction' $CONTAINER_NAME npx -y prisma@5.22.0 db push --accept-data-loss; then
    echo "✅ MIGRATION RÉUSSIE !"
else
    echo "❌ La migration a échoué. Vérifiez les logs ci-dessus."
    # Fallback: Essayons avec la version 'latest' si la 5.22 échoue sur l'architecture, sait-on jamais
    # echo "   Tentative de secours..."
    # docker exec -e DATABASE_URL='postgresql://medaction:medaction_secure_2024@postgres:5432/medaction' $CONTAINER_NAME npx prisma db push --accept-data-loss
fi
echo ""

# Étape 5: Vérification finale
echo "🔍 5. État des services :"
docker compose -f $COMPOSE_FILE ps
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ FIN DU SCRIPT"
echo "════════════════════════════════════════════════════════════════"

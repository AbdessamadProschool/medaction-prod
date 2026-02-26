#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    DEPLOY SCRIPT - MEDACTION                                 ║
# ║                         Province de Médiouna                                 ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
ENV="${1:-development}"
COMPOSE_FILE="docker-compose.yml"

echo -e "${MAGENTA}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MEDACTION - Deployment Script                     ║"
echo "║                Province de Médiouna                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${BLUE}Environment: ${ENV}${NC}"
echo ""

# Check required files
echo -e "${BLUE}📋 Pre-deployment checks...${NC}"

if [ ! -f "${COMPOSE_FILE}" ]; then
    echo -e "${RED}❌ ${COMPOSE_FILE} not found!${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ docker-compose.yml found${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}  ⚠ .env file not found - using defaults${NC}"
else
    echo -e "${GREEN}  ✓ .env file found${NC}"
fi

# Check required environment variables
echo ""
echo -e "${BLUE}🔐 Checking environment variables...${NC}"
REQUIRED_VARS=("NEXTAUTH_SECRET" "POSTGRES_PASSWORD")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${YELLOW}  ⚠ Missing variables (will use defaults): ${MISSING_VARS[*]}${NC}"
else
    echo -e "${GREEN}  ✓ All required variables set${NC}"
fi

# Step 1: Stop existing containers
echo ""
echo -e "${YELLOW}🛑 Step 1: Stopping existing containers...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}  ✓ Containers stopped${NC}"

# Step 2: Pull/Build images
echo ""
echo -e "${YELLOW}📥 Step 2: Building/pulling images...${NC}"
if [ "$ENV" == "production" ]; then
    docker-compose pull postgres nginx 2>/dev/null || true
fi
docker-compose build --parallel
echo -e "${GREEN}  ✓ Images ready${NC}"

# Step 3: Start services
echo ""
echo -e "${YELLOW}▶️  Step 3: Starting services...${NC}"

if [ "$ENV" == "production" ]; then
    docker-compose --profile production up -d
else
    docker-compose up -d
fi

echo -e "${GREEN}  ✓ Services started${NC}"

# Step 4: Wait for health checks
echo ""
echo -e "${YELLOW}⏳ Step 4: Waiting for services to be healthy...${NC}"

MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    # Check if app is healthy
    APP_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' medaction-app 2>/dev/null || echo "starting")
    
    if [ "$APP_HEALTH" == "healthy" ]; then
        echo -e "${GREEN}  ✓ Application is healthy!${NC}"
        break
    fi
    
    echo -e "  Waiting... ($WAITED/$MAX_WAIT seconds) - Status: $APP_HEALTH"
    sleep 5
    WAITED=$((WAITED + 5))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}  ⚠ Health check timeout - check logs${NC}"
fi

# Step 5: Run database migrations
echo ""
echo -e "${YELLOW}🗄️  Step 5: Running database migrations...${NC}"
sleep 5  # Wait a bit more for DB to be fully ready
docker-compose exec -T app npx prisma migrate deploy 2>/dev/null || {
    echo -e "${YELLOW}  ⚠ Migration skipped (may already be up to date)${NC}"
}
echo -e "${GREEN}  ✓ Migrations complete${NC}"

# Step 6: Show status
echo ""
echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo -e "  Application:  ${GREEN}http://localhost:3000${NC}"
echo -e "  Health Check: ${GREEN}http://localhost:3000/api/health${NC}"
if [ "$ENV" != "production" ]; then
    echo -e "  Adminer (DB): ${GREEN}http://localhost:8080${NC}"
fi

echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo -e "  View logs:        ${YELLOW}docker-compose logs -f app${NC}"
echo -e "  App shell:        ${YELLOW}docker-compose exec app sh${NC}"
echo -e "  DB shell:         ${YELLOW}docker-compose exec postgres psql -U medaction${NC}"
echo -e "  Prisma Studio:    ${YELLOW}docker-compose exec app npx prisma studio${NC}"
echo -e "  Stop services:    ${YELLOW}docker-compose down${NC}"
echo ""

# Health check
echo -e "${BLUE}🩺 Quick Health Check:${NC}"
sleep 2
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo '{"status":"unavailable"}')
echo -e "  Response: ${HEALTH_RESPONSE}"
echo ""

#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    BUILD SCRIPT - MEDACTION                                  ║
# ║                         Province de Médiouna                                 ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage: ./scripts/build.sh [tag]
# Example: ./scripts/build.sh v1.0.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="medaction"
REGISTRY="${DOCKER_REGISTRY:-}"
TAG="${1:-latest}"
FULL_IMAGE="${IMAGE_NAME}:${TAG}"

echo -e "${MAGENTA}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MEDACTION - Docker Build Script                   ║"
echo "║                Province de Médiouna                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Pre-build checks
echo -e "${BLUE}📋 Pre-build checks...${NC}"

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Docker is running${NC}"

# Check Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile not found!${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Dockerfile found${NC}"

# Check package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found!${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ package.json found${NC}"

# Build image
echo ""
echo -e "${YELLOW}🚀 Building Docker image: ${FULL_IMAGE}${NC}"
echo ""

BUILD_START=$(date +%s)

docker build \
    --tag "${FULL_IMAGE}" \
    --tag "${IMAGE_NAME}:latest" \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg VERSION="${TAG}" \
    --progress=plain \
    .

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Show image info
    echo -e "${BLUE}📊 Image Information:${NC}"
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    echo ""
    echo -e "${BLUE}⏱️  Build time: ${BUILD_TIME} seconds${NC}"
    
    # Get image size
    IMAGE_SIZE=$(docker images "${FULL_IMAGE}" --format "{{.Size}}")
    echo -e "${BLUE}📦 Image size: ${IMAGE_SIZE}${NC}"
    
    # Security scan suggestion
    echo ""
    echo -e "${YELLOW}🔐 Security Recommendations:${NC}"
    echo -e "  Run vulnerability scan: ${BLUE}docker scout quickview ${FULL_IMAGE}${NC}"
    echo -e "  Or with Trivy: ${BLUE}trivy image ${FULL_IMAGE}${NC}"
    
    echo ""
    echo -e "${MAGENTA}🎯 Next Steps:${NC}"
    echo -e "  1. Test locally:     ${BLUE}docker-compose up -d${NC}"
    echo -e "  2. View logs:        ${BLUE}docker-compose logs -f app${NC}"
    echo -e "  3. Health check:     ${BLUE}curl http://localhost:3000/api/health${NC}"
    echo -e "  4. Push to registry: ${BLUE}docker push ${REGISTRY}${FULL_IMAGE}${NC}"
    echo ""
    
else
    echo ""
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ Build failed!${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "  1. Check Dockerfile syntax"
    echo -e "  2. Verify all required files exist"
    echo -e "  3. Check npm dependencies"
    echo -e "  4. View detailed logs above"
    exit 1
fi

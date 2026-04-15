
# 1. Dépendances
FROM node:20-bullseye-slim AS deps
WORKDIR /app

# Installation de OpenSSL (requis par Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copier uniquement les fichiers nécessaires aux dépendances
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installation propre via le lockfile pour limiter la charge CPU et Disk
RUN npm ci --legacy-peer-deps --ignore-scripts

# 2. Builder
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV CI=true

# Génération Prisma et Build Next.js
RUN npx prisma generate
RUN npm run build

# 3. Runner (Image finale optimisée)
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie des fichiers standalone générés
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Note: Prisma est déjà inclus dans standalone par next-intl si configuré, 
# mais on garde une trace si besoin.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Commande recommandée pour le mode standalone
CMD ["node", "server.js"]

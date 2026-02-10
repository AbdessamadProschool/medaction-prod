
FROM node:20-bullseye-slim AS deps
WORKDIR /app

# Install OpenSSL 1.1 (required for Prisma on old Debian/Node images if needed, but 20-bullseye uses 3.x usually. keeping minimal)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Force install to respect versions
RUN rm -f package-lock.json && npm install --legacy-peer-deps --ignore-scripts

# 2. Rebuild the source code only when needed
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Force l'utilisation d'un seul worker pour économiser la RAM et éviter le crash EOF
ENV NEXT_CPU_COUNT=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV CI=true

RUN npx prisma generate
RUN npm run build

# 3. Production image, copy all the files and run next
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 4. Prisma (copy only if needed for runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]

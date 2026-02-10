
FROM node:20-bullseye-slim

WORKDIR /app

# Install dependencies (incluant OpenSSL pour Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Installer TOUTES les dépendances (y compris dev pour le build)
RUN npm install --legacy-peer-deps

# Copier le code source
COPY . .

# Désactiver la télémétrie et configurer la mémoire
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV CI=true

# Générer Prisma et Builder l'app
RUN npx prisma generate
RUN npm run build --no-lint

# Nettoyer les devDependencies si possible (optionnel, on garde simple pour la stabilité)
# RUN npm prune --production

# Exposer le port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Commande de lancement STANDARD
CMD ["npm", "start"]

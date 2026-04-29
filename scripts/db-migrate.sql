-- =============================================
-- SCRIPT DE SYNCHRONISATION SCHEMA PRODUCTION
-- Idempotent : peut être exécuté plusieurs fois sans risque
-- À exécuter automatiquement à chaque déploiement via deploy.sh
-- =============================================

-- Etablissement
ALTER TABLE "Etablissement" ADD COLUMN IF NOT EXISTS "champsComplementaires" JSONB DEFAULT '{}';

-- Evenement
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS "isOrganiseParProvince" BOOLEAN DEFAULT false;
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS "sousCouvertProvince" BOOLEAN DEFAULT false;
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS "lieuEtablissementId" INTEGER;

-- Campagne
ALTER TABLE "Campagne" ADD COLUMN IF NOT EXISTS "isOrganiseParProvince" BOOLEAN DEFAULT false;
ALTER TABLE "Campagne" ADD COLUMN IF NOT EXISTS "sousCouvertProvince" BOOLEAN DEFAULT false;
ALTER TABLE "Campagne" ADD COLUMN IF NOT EXISTS "lieuEtablissementId" INTEGER;
ALTER TABLE "Campagne" ADD COLUMN IF NOT EXISTS "rapportClotureUrl" TEXT;
ALTER TABLE "Campagne" ADD COLUMN IF NOT EXISTS "bilanDescription" TEXT;
ALTER TABLE "Campagne" ADD COLUMN IF NOT EXISTS "bilanChiffresCles" JSONB;
-- NOUVELLES colonnes de traduction arabe (fix erreur 500)
ALTER TABLE "Campagne" ADD COLUMN IF NOT EXISTS "titreAr" TEXT;
ALTER TABLE "Campagne" ADD COLUMN IF NOT EXISTS "descriptionAr" TEXT;
ALTER TABLE "Campagne" ADD COLUMN IF NOT EXISTS "contenuAr" TEXT;

-- Article : créer l'enum StatutArticle si absent puis ajouter la colonne statut
DO $$ BEGIN
  CREATE TYPE "StatutArticle" AS ENUM ('BROUILLON', 'EN_ATTENTE', 'PUBLIE', 'REJETE', 'ARCHIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "statut" "StatutArticle" NOT NULL DEFAULT 'BROUILLON';
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "titreAr" TEXT;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "descriptionAr" TEXT;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "contenuAr" TEXT;

-- Evenement : colonnes de traduction arabe
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS "titreAr" TEXT;
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS "descriptionAr" TEXT;

-- Notification
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "isLue" BOOLEAN DEFAULT false;

-- DemandeModificationEtablissement
ALTER TABLE "DemandeModificationEtablissement" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'MODIFICATION';
ALTER TABLE "DemandeModificationEtablissement" ADD COLUMN IF NOT EXISTS "champsComplementaires" JSONB DEFAULT '{}';
ALTER TABLE "DemandeModificationEtablissement" ADD COLUMN IF NOT EXISTS "justification" TEXT;
ALTER TABLE "DemandeModificationEtablissement" ADD COLUMN IF NOT EXISTS "soumisParId" INTEGER;
ALTER TABLE "DemandeModificationEtablissement" ADD COLUMN IF NOT EXISTS "valideParId" INTEGER;
ALTER TABLE "DemandeModificationEtablissement" ADD COLUMN IF NOT EXISTS "dateValidation" TIMESTAMP(3);
ALTER TABLE "DemandeModificationEtablissement" ADD COLUMN IF NOT EXISTS "statut" TEXT DEFAULT 'EN_ATTENTE_VALIDATION';
ALTER TABLE "DemandeModificationEtablissement" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorBackupCodes" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginAttempts" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastFailedLogin" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferences" JSONB DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "etablissementsGeres" INTEGER[] DEFAULT '{}';

-- Tables complètes manquantes (idempotent)
CREATE TABLE IF NOT EXISTS "Video" (
  id SERIAL PRIMARY KEY, titre TEXT NOT NULL, description TEXT, "urlYoutube" TEXT NOT NULL,
  thumbnail TEXT, categorie TEXT, tags TEXT[] DEFAULT '{}',
  "isPublie" BOOLEAN DEFAULT false, "isMisEnAvant" BOOLEAN DEFAULT false,
  "nombreVues" INTEGER DEFAULT 0, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Talent" (
  id SERIAL PRIMARY KEY, nom TEXT NOT NULL, prenom TEXT NOT NULL,
  "nomArtistique" TEXT, bio TEXT, domaine TEXT NOT NULL, photo TEXT,
  "reseauxSociaux" JSONB, "isPublie" BOOLEAN DEFAULT false, "isMisEnAvant" BOOLEAN DEFAULT false,
  "nombreVues" INTEGER DEFAULT 0, "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SecurityToken" (
  id SERIAL PRIMARY KEY, token TEXT UNIQUE NOT NULL, type TEXT NOT NULL,
  "userId" INTEGER NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3), "isRevoked" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, "ipAddress" TEXT
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  id SERIAL PRIMARY KEY, action TEXT NOT NULL, "resourceType" TEXT, "resourceId" TEXT,
  "userId" INTEGER, details TEXT, "previousValue" TEXT, "newValue" TEXT,
  "ipAddress" TEXT, "userAgent" TEXT, "requestId" TEXT,
  success BOOLEAN DEFAULT true, "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ContactMessage" (
  id SERIAL PRIMARY KEY, nom TEXT NOT NULL, email TEXT NOT NULL, sujet TEXT NOT NULL,
  message TEXT NOT NULL, "isRead" BOOLEAN DEFAULT false, "userId" INTEGER,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SystemSetting" (
  id SERIAL PRIMARY KEY, key TEXT UNIQUE NOT NULL, value JSONB NOT NULL,
  category TEXT NOT NULL, description TEXT, "updatedById" INTEGER,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Permission" (
  id SERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, nom TEXT NOT NULL,
  description TEXT, groupe TEXT NOT NULL, "groupeLabel" TEXT NOT NULL,
  ordre INTEGER DEFAULT 0, "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "UserPermission" (
  id SERIAL PRIMARY KEY, "userId" INTEGER NOT NULL, "permissionId" INTEGER NOT NULL,
  "grantedById" INTEGER, "grantedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3), "isActive" BOOLEAN DEFAULT true,
  UNIQUE("userId", "permissionId")
);

-- Seed des permissions de base (idempotent - ON CONFLICT DO NOTHING)
INSERT INTO "Permission" (code, nom, groupe, "groupeLabel", ordre, "updatedAt") VALUES
  ('users.read','Voir les utilisateurs','users','Utilisateurs',1,NOW()),
  ('users.create','Créer des utilisateurs','users','Utilisateurs',2,NOW()),
  ('users.update','Modifier des utilisateurs','users','Utilisateurs',3,NOW()),
  ('users.delete','Supprimer des utilisateurs','users','Utilisateurs',4,NOW()),
  ('reclamations.read','Voir les réclamations','reclamations','Réclamations',5,NOW()),
  ('reclamations.validate','Valider les réclamations','reclamations','Réclamations',6,NOW()),
  ('etablissements.read','Voir les établissements','etablissements','Établissements',7,NOW()),
  ('etablissements.create','Créer des établissements','etablissements','Établissements',8,NOW()),
  ('etablissements.update','Modifier des établissements','etablissements','Établissements',9,NOW()),
  ('etablissements.request.edit','Gérer demandes établissements','etablissements','Établissements',10,NOW()),
  ('evenements.read','Voir les événements','evenements','Événements',11,NOW()),
  ('evenements.validate','Valider les événements','evenements','Événements',12,NOW()),
  ('actualites.read','Voir les actualités','actualites','Actualités',13,NOW()),
  ('actualites.validate','Valider les actualités','actualites','Actualités',14,NOW()),
  ('campagnes.read','Voir les campagnes','campagnes','Campagnes',15,NOW()),
  ('campagnes.validate','Valider les campagnes','campagnes','Campagnes',16,NOW()),
  ('suggestions.read.own','Voir les suggestions','suggestions','Suggestions',17,NOW()),
  ('programmes.read','Voir les programmes','programmes','Programmes',18,NOW()),
  ('stats.view.global','Voir les statistiques','stats','Statistiques',19,NOW()),
  ('system.settings.read','Voir les paramètres système','system','Système',20,NOW())
ON CONFLICT (code) DO NOTHING;

-- Donner toutes les permissions au Super Admin (userId=1)
INSERT INTO "UserPermission" ("userId", "permissionId", "isActive")
SELECT 1, id, true FROM "Permission"
ON CONFLICT ("userId", "permissionId") DO NOTHING;

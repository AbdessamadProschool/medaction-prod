-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR');

-- CreateEnum
CREATE TYPE "Secteur" AS ENUM ('EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutReclamation" AS ENUM ('ACCEPTEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "AffectationReclamation" AS ENUM ('NON_AFFECTEE', 'AFFECTEE');

-- CreateEnum
CREATE TYPE "StatutEvenement" AS ENUM ('EN_ATTENTE_VALIDATION', 'PUBLIEE', 'EN_ACTION', 'CLOTUREE', 'REJETEE');

-- CreateEnum
CREATE TYPE "StatutActualite" AS ENUM ('BROUILLON', 'EN_ATTENTE_VALIDATION', 'VALIDEE', 'PUBLIEE', 'DEPUBLIEE', 'ARCHIVEE');

-- CreateEnum
CREATE TYPE "StatutSuggestion" AS ENUM ('SOUMISE', 'EN_EXAMEN', 'APPROUVEE', 'REJETEE', 'IMPLEMENTEE');

-- CreateEnum
CREATE TYPE "TypeZone" AS ENUM ('URBAINE', 'RURALE', 'PERI_URBAINE');

-- CreateEnum
CREATE TYPE "Accessibilite" AS ENUM ('FACILE', 'MOYENNE', 'DIFFICILE');

-- CreateEnum
CREATE TYPE "EtatInfrastructure" AS ENUM ('EXCELLENT', 'BON', 'MOYEN', 'DEGRADE', 'A_RENOVER', 'DANGEREUX');

-- CreateEnum
CREATE TYPE "TypeMedia" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'AUTRE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "photo" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CITOYEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerifie" BOOLEAN NOT NULL DEFAULT false,
    "isTelephoneVerifie" BOOLEAN NOT NULL DEFAULT false,
    "secteurResponsable" "Secteur",
    "etablissementId" INTEGER,
    "derniereConnexion" TIMESTAMP(3),
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commune" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomArabe" TEXT,
    "region" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "population" INTEGER,
    "superficieKm2" DOUBLE PRECISION,
    "densite" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geojsonBoundary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annexe" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomArabe" TEXT,
    "communeId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geojsonBoundary" JSONB,
    "population" INTEGER,
    "superficieKm2" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annexe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etablissement" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomArabe" TEXT,
    "secteur" "Secteur" NOT NULL,
    "communeId" INTEGER NOT NULL,
    "annexeId" INTEGER,
    "quartierDouar" TEXT,
    "adresseComplete" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION,
    "zoneTypologie" "TypeZone",
    "accessibilite" "Accessibilite",
    "voieAcces" TEXT,
    "distanceChefLieu" DOUBLE PRECISION,
    "transportPublic" TEXT,
    "nature" TEXT,
    "tutelle" TEXT,
    "statutJuridique" TEXT,
    "gestionnaire" TEXT,
    "responsableNom" TEXT,
    "anneeCreation" INTEGER,
    "anneeOuverture" INTEGER,
    "telephone" TEXT,
    "email" TEXT,
    "siteWeb" TEXT,
    "etatInfrastructure" "EtatInfrastructure",
    "surfaceTotale" DOUBLE PRECISION,
    "disponibiliteEau" BOOLEAN,
    "disponibiliteElectricite" BOOLEAN,
    "connexionInternet" BOOLEAN,
    "effectifTotal" INTEGER,
    "capaciteAccueil" INTEGER,
    "services" TEXT[],
    "programmes" TEXT[],
    "donneesSpecifiques" JSONB NOT NULL,
    "photoPrincipale" TEXT,
    "modele3DUrl" TEXT,
    "couleurAffichage" TEXT,
    "iconePersonnalise" TEXT,
    "noteMoyenne" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nombreEvaluations" INTEGER NOT NULL DEFAULT 0,
    "isPublie" BOOLEAN NOT NULL DEFAULT false,
    "isValide" BOOLEAN NOT NULL DEFAULT false,
    "isMisEnAvant" BOOLEAN NOT NULL DEFAULT false,
    "statutFonctionnel" TEXT,
    "sourcesFinancement" TEXT,
    "budgetAnnuel" DOUBLE PRECISION,
    "partenaires" TEXT,
    "remarques" TEXT,
    "besoinsUrgents" TEXT,
    "projetsFuturs" TEXT,
    "annee" INTEGER NOT NULL DEFAULT 2025,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Etablissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminFichier" TEXT NOT NULL,
    "urlPublique" TEXT NOT NULL,
    "type" "TypeMedia" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tailleMo" DOUBLE PRECISION,
    "largeur" INTEGER,
    "hauteur" INTEGER,
    "duree" INTEGER,
    "etablissementId" INTEGER,
    "evenementId" INTEGER,
    "reclamationId" INTEGER,
    "actualiteId" INTEGER,
    "articleId" INTEGER,
    "campagneId" INTEGER,
    "talentId" INTEGER,
    "uploadePar" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbonnementEtablissement" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "etablissementId" INTEGER NOT NULL,
    "notificationsActives" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbonnementEtablissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "etablissementId" INTEGER NOT NULL,
    "noteGlobale" DOUBLE PRECISION NOT NULL,
    "commentaire" TEXT,
    "isSignalee" BOOLEAN NOT NULL DEFAULT false,
    "motifSignalement" TEXT,
    "isValidee" BOOLEAN NOT NULL DEFAULT true,
    "dateExpiration" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reclamation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "etablissementId" INTEGER,
    "communeId" INTEGER NOT NULL,
    "quartierDouar" TEXT,
    "adresseComplete" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "categorie" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "statut" "StatutReclamation",
    "affectationReclamation" "AffectationReclamation" NOT NULL DEFAULT 'NON_AFFECTEE',
    "affecteeParAdminId" INTEGER,
    "affecteeAAutoriteId" INTEGER,
    "secteurAffecte" "Secteur",
    "serviceInterneProvince" TEXT,
    "dateAffectation" TIMESTAMP(3),
    "dateResolution" TIMESTAMP(3),
    "motifRejet" TEXT,
    "solutionApportee" TEXT,
    "isArchivee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reclamation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoriqueReclamation" (
    "id" SERIAL NOT NULL,
    "reclamationId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "effectuePar" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoriqueReclamation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" TEXT,
    "statut" "StatutSuggestion" NOT NULL DEFAULT 'SOUMISE',
    "reponseAdmin" TEXT,
    "dateTraitement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evenement" (
    "id" SERIAL NOT NULL,
    "etablissementId" INTEGER NOT NULL,
    "secteur" "Secteur" NOT NULL,
    "communeId" INTEGER NOT NULL,
    "lieu" TEXT,
    "adresse" TEXT,
    "quartierDouar" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "typeCategorique" TEXT NOT NULL,
    "categorie" TEXT,
    "tags" TEXT[],
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "heureDebut" TEXT,
    "heureFin" TEXT,
    "organisateur" TEXT,
    "contactOrganisateur" TEXT,
    "emailContact" TEXT,
    "capaciteMax" INTEGER,
    "inscriptionsOuvertes" BOOLEAN NOT NULL DEFAULT false,
    "lienInscription" TEXT,
    "nombreInscrits" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutEvenement" NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION',
    "motifRejet" TEXT,
    "isMisEnAvant" BOOLEAN NOT NULL DEFAULT false,
    "bilanDescription" TEXT,
    "bilanNbParticipants" INTEGER,
    "bilanDatePublication" TIMESTAMP(3),
    "nombreVues" INTEGER NOT NULL DEFAULT 0,
    "nombrePartages" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actualite" (
    "id" SERIAL NOT NULL,
    "etablissementId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "contenu" TEXT NOT NULL,
    "categorie" TEXT,
    "tags" TEXT[],
    "statut" "StatutActualite" NOT NULL DEFAULT 'BROUILLON',
    "isPublie" BOOLEAN NOT NULL DEFAULT false,
    "isValide" BOOLEAN NOT NULL DEFAULT false,
    "datePublication" TIMESTAMP(3),
    "nombreVues" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actualite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "contenu" TEXT NOT NULL,
    "categorie" TEXT,
    "tags" TEXT[],
    "imagePrincipale" TEXT,
    "isPublie" BOOLEAN NOT NULL DEFAULT false,
    "isMisEnAvant" BOOLEAN NOT NULL DEFAULT false,
    "datePublication" TIMESTAMP(3),
    "nombreVues" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "urlYoutube" TEXT NOT NULL,
    "thumbnail" TEXT,
    "categorie" TEXT,
    "tags" TEXT[],
    "isPublie" BOOLEAN NOT NULL DEFAULT false,
    "isMisEnAvant" BOOLEAN NOT NULL DEFAULT false,
    "nombreVues" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Talent" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nomArtistique" TEXT,
    "bio" TEXT,
    "domaine" TEXT NOT NULL,
    "photo" TEXT,
    "reseauxSociaux" JSONB,
    "isPublie" BOOLEAN NOT NULL DEFAULT false,
    "isMisEnAvant" BOOLEAN NOT NULL DEFAULT false,
    "nombreVues" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Talent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campagne" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "contenu" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imagePrincipale" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campagne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien" TEXT,
    "isLue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_telephone_key" ON "User"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "User_etablissementId_key" ON "User"("etablissementId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_secteurResponsable_idx" ON "User"("secteurResponsable");

-- CreateIndex
CREATE INDEX "User_etablissementId_idx" ON "User"("etablissementId");

-- CreateIndex
CREATE UNIQUE INDEX "Commune_code_key" ON "Commune"("code");

-- CreateIndex
CREATE INDEX "Commune_code_idx" ON "Commune"("code");

-- CreateIndex
CREATE INDEX "Commune_nom_idx" ON "Commune"("nom");

-- CreateIndex
CREATE INDEX "Commune_province_idx" ON "Commune"("province");

-- CreateIndex
CREATE UNIQUE INDEX "Annexe_code_key" ON "Annexe"("code");

-- CreateIndex
CREATE INDEX "Annexe_communeId_idx" ON "Annexe"("communeId");

-- CreateIndex
CREATE INDEX "Annexe_code_idx" ON "Annexe"("code");

-- CreateIndex
CREATE INDEX "Annexe_nom_idx" ON "Annexe"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Etablissement_code_key" ON "Etablissement"("code");

-- CreateIndex
CREATE INDEX "Etablissement_code_idx" ON "Etablissement"("code");

-- CreateIndex
CREATE INDEX "Etablissement_secteur_idx" ON "Etablissement"("secteur");

-- CreateIndex
CREATE INDEX "Etablissement_communeId_idx" ON "Etablissement"("communeId");

-- CreateIndex
CREATE INDEX "Etablissement_annexeId_idx" ON "Etablissement"("annexeId");

-- CreateIndex
CREATE INDEX "Etablissement_isPublie_idx" ON "Etablissement"("isPublie");

-- CreateIndex
CREATE INDEX "Etablissement_isValide_idx" ON "Etablissement"("isValide");

-- CreateIndex
CREATE INDEX "Etablissement_nature_idx" ON "Etablissement"("nature");

-- CreateIndex
CREATE INDEX "Etablissement_statutFonctionnel_idx" ON "Etablissement"("statutFonctionnel");

-- CreateIndex
CREATE INDEX "Etablissement_latitude_longitude_idx" ON "Etablissement"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Media_etablissementId_idx" ON "Media"("etablissementId");

-- CreateIndex
CREATE INDEX "Media_evenementId_idx" ON "Media"("evenementId");

-- CreateIndex
CREATE INDEX "Media_reclamationId_idx" ON "Media"("reclamationId");

-- CreateIndex
CREATE INDEX "Media_actualiteId_idx" ON "Media"("actualiteId");

-- CreateIndex
CREATE INDEX "Media_articleId_idx" ON "Media"("articleId");

-- CreateIndex
CREATE INDEX "Media_campagneId_idx" ON "Media"("campagneId");

-- CreateIndex
CREATE INDEX "Media_type_idx" ON "Media"("type");

-- CreateIndex
CREATE INDEX "AbonnementEtablissement_userId_idx" ON "AbonnementEtablissement"("userId");

-- CreateIndex
CREATE INDEX "AbonnementEtablissement_etablissementId_idx" ON "AbonnementEtablissement"("etablissementId");

-- CreateIndex
CREATE UNIQUE INDEX "AbonnementEtablissement_userId_etablissementId_key" ON "AbonnementEtablissement"("userId", "etablissementId");

-- CreateIndex
CREATE INDEX "Evaluation_etablissementId_idx" ON "Evaluation"("etablissementId");

-- CreateIndex
CREATE INDEX "Evaluation_isSignalee_idx" ON "Evaluation"("isSignalee");

-- CreateIndex
CREATE INDEX "Evaluation_isValidee_idx" ON "Evaluation"("isValidee");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_userId_etablissementId_key" ON "Evaluation"("userId", "etablissementId");

-- CreateIndex
CREATE INDEX "Reclamation_userId_idx" ON "Reclamation"("userId");

-- CreateIndex
CREATE INDEX "Reclamation_etablissementId_idx" ON "Reclamation"("etablissementId");

-- CreateIndex
CREATE INDEX "Reclamation_communeId_idx" ON "Reclamation"("communeId");

-- CreateIndex
CREATE INDEX "Reclamation_statut_idx" ON "Reclamation"("statut");

-- CreateIndex
CREATE INDEX "Reclamation_affectationReclamation_idx" ON "Reclamation"("affectationReclamation");

-- CreateIndex
CREATE INDEX "Reclamation_affecteeAAutoriteId_idx" ON "Reclamation"("affecteeAAutoriteId");

-- CreateIndex
CREATE INDEX "Reclamation_secteurAffecte_idx" ON "Reclamation"("secteurAffecte");

-- CreateIndex
CREATE INDEX "Reclamation_isArchivee_idx" ON "Reclamation"("isArchivee");

-- CreateIndex
CREATE INDEX "Reclamation_createdAt_idx" ON "Reclamation"("createdAt");

-- CreateIndex
CREATE INDEX "HistoriqueReclamation_reclamationId_idx" ON "HistoriqueReclamation"("reclamationId");

-- CreateIndex
CREATE INDEX "HistoriqueReclamation_createdAt_idx" ON "HistoriqueReclamation"("createdAt");

-- CreateIndex
CREATE INDEX "Suggestion_userId_idx" ON "Suggestion"("userId");

-- CreateIndex
CREATE INDEX "Suggestion_statut_idx" ON "Suggestion"("statut");

-- CreateIndex
CREATE INDEX "Suggestion_createdAt_idx" ON "Suggestion"("createdAt");

-- CreateIndex
CREATE INDEX "Evenement_etablissementId_idx" ON "Evenement"("etablissementId");

-- CreateIndex
CREATE INDEX "Evenement_communeId_idx" ON "Evenement"("communeId");

-- CreateIndex
CREATE INDEX "Evenement_secteur_idx" ON "Evenement"("secteur");

-- CreateIndex
CREATE INDEX "Evenement_statut_idx" ON "Evenement"("statut");

-- CreateIndex
CREATE INDEX "Evenement_dateDebut_idx" ON "Evenement"("dateDebut");

-- CreateIndex
CREATE INDEX "Evenement_isMisEnAvant_idx" ON "Evenement"("isMisEnAvant");

-- CreateIndex
CREATE INDEX "Evenement_createdBy_idx" ON "Evenement"("createdBy");

-- CreateIndex
CREATE INDEX "Actualite_etablissementId_idx" ON "Actualite"("etablissementId");

-- CreateIndex
CREATE INDEX "Actualite_statut_idx" ON "Actualite"("statut");

-- CreateIndex
CREATE INDEX "Actualite_isPublie_idx" ON "Actualite"("isPublie");

-- CreateIndex
CREATE INDEX "Actualite_isValide_idx" ON "Actualite"("isValide");

-- CreateIndex
CREATE INDEX "Actualite_datePublication_idx" ON "Actualite"("datePublication");

-- CreateIndex
CREATE INDEX "Actualite_createdBy_idx" ON "Actualite"("createdBy");

-- CreateIndex
CREATE INDEX "Article_isPublie_idx" ON "Article"("isPublie");

-- CreateIndex
CREATE INDEX "Article_datePublication_idx" ON "Article"("datePublication");

-- CreateIndex
CREATE INDEX "Article_createdBy_idx" ON "Article"("createdBy");

-- CreateIndex
CREATE INDEX "Video_isPublie_idx" ON "Video"("isPublie");

-- CreateIndex
CREATE INDEX "Video_categorie_idx" ON "Video"("categorie");

-- CreateIndex
CREATE INDEX "Talent_domaine_idx" ON "Talent"("domaine");

-- CreateIndex
CREATE INDEX "Talent_isPublie_idx" ON "Talent"("isPublie");

-- CreateIndex
CREATE UNIQUE INDEX "Campagne_slug_key" ON "Campagne"("slug");

-- CreateIndex
CREATE INDEX "Campagne_slug_idx" ON "Campagne"("slug");

-- CreateIndex
CREATE INDEX "Campagne_isActive_idx" ON "Campagne"("isActive");

-- CreateIndex
CREATE INDEX "Campagne_createdBy_idx" ON "Campagne"("createdBy");

-- CreateIndex
CREATE INDEX "Notification_userId_isLue_idx" ON "Notification"("userId", "isLue");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_entity_idx" ON "ActivityLog"("entity");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annexe" ADD CONSTRAINT "Annexe_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etablissement" ADD CONSTRAINT "Etablissement_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etablissement" ADD CONSTRAINT "Etablissement_annexeId_fkey" FOREIGN KEY ("annexeId") REFERENCES "Annexe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "Evenement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_reclamationId_fkey" FOREIGN KEY ("reclamationId") REFERENCES "Reclamation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_actualiteId_fkey" FOREIGN KEY ("actualiteId") REFERENCES "Actualite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_campagneId_fkey" FOREIGN KEY ("campagneId") REFERENCES "Campagne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "Talent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonnementEtablissement" ADD CONSTRAINT "AbonnementEtablissement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonnementEtablissement" ADD CONSTRAINT "AbonnementEtablissement_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamation" ADD CONSTRAINT "Reclamation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamation" ADD CONSTRAINT "Reclamation_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reclamation" ADD CONSTRAINT "Reclamation_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoriqueReclamation" ADD CONSTRAINT "HistoriqueReclamation_reclamationId_fkey" FOREIGN KEY ("reclamationId") REFERENCES "Reclamation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actualite" ADD CONSTRAINT "Actualite_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actualite" ADD CONSTRAINT "Actualite_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campagne" ADD CONSTRAINT "Campagne_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

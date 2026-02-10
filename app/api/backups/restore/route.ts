import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// Fonction pour nettoyer les objets (convertir les dates string en objets Date)
const cleanData = (data: any[]) => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(item => {
    const newItem = { ...item };
    Object.keys(newItem).forEach(key => {
      // Convertir les chaînes ISO date en objets Date
      if (typeof newItem[key] === 'string' && 
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(newItem[key])) {
        newItem[key] = new Date(newItem[key]);
      }
      // Gérer le cas des champs nuls
      if (newItem[key] === null) {
        // Prisma gère bien les nulls, on laisse
      }
    });
    return newItem;
  });
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const fileContent = await file.text();
    const backup = JSON.parse(fileContent);

    if (!backup.data) {
       return NextResponse.json({ error: 'Format de sauvegarde invalide (data manquant)' }, { status: 400 });
    }

    const d = backup.data;

    console.log(`[RESTORE] Démarrage restauration... Tables à traiter: ${Object.keys(d).length}`);

    // EXÉCUTION DE LA RESTAURATION EN TRANSACTION
    // Ordre CRITIQUE pour respecter les contraintes de clés étrangères
    await prisma.$transaction(async (tx) => {
      
      // 1. Suppression des données existantes (Ordre Inverse des dépendances)
      console.log('--- SUPPRESSION ---');
      
      // Niveau 4 : Logs et relations finales
      await tx.media.deleteMany();
      await tx.activityLog.deleteMany();
      await tx.notification.deleteMany();
      await tx.historiqueReclamation.deleteMany();
      await tx.evaluation.deleteMany();
      await tx.userPermission.deleteMany();
      await tx.abonnementEtablissement.deleteMany();
      await tx.participationCampagne.deleteMany();
      
      // Niveau 3 : Contenu
      await tx.programmeActivite.deleteMany();
      await tx.reclamation.deleteMany();
      await tx.suggestion.deleteMany();
      await tx.evenement.deleteMany();
      await tx.actualite.deleteMany();
      await tx.article.deleteMany();
      await tx.campagne.deleteMany();
      await tx.video.deleteMany();
      await tx.talent.deleteMany();

      // Niveau 2 : Structures
      await tx.etablissement.deleteMany();
      
      // Niveau 1 : Users et Geo
      // Note: User dépend de Commune. Annexe dépend de Commune.
      await tx.user.deleteMany(); 
      await tx.annexe.deleteMany();
      await tx.commune.deleteMany();
      
      // Niveau 0 : Config
      await tx.permission.deleteMany();
      await tx.systemSetting.deleteMany();
      
      console.log('Données supprimées. Début insertion...');

      // 2. Insertion des données (Ordre des dépendances)
      
      // Niveau 0
      if (d.settings?.length) await tx.systemSetting.createMany({ data: cleanData(d.settings) });
      if (d.permissions?.length) await tx.permission.createMany({ data: cleanData(d.permissions) });
      
      // Niveau 1
      // Commune est requise par User (communeResponsableId) et Annexe
      if (d.communes?.length) await tx.commune.createMany({ data: cleanData(d.communes) });
      if (d.annexes?.length) await tx.annexe.createMany({ data: cleanData(d.annexes) });
      
      // USERS - Attention aux dépendances circulaires éventuelles
      // Mais ici communeResponsableId pointe vers Commune qui existe déjà
      if (d.users?.length) {
         // On doit nettoyer les relations one-to-many inverses si elles étaient dans le JSON exporté par erreur
         // createMany ignore les champs inconnus normalement, mais on s'assure que cleanData est propre.
         const usersToCreate = cleanData(d.users).map((u: any) => {
             const { evaluations, reclamationsCreees, suggestions, notifications, ...rest } = u; // Exclure relations inverses
             return rest;
         });
         await tx.user.createMany({ data: usersToCreate });
      }

      // Niveau 2
      if (d.etablissements?.length) {
         const etabs = cleanData(d.etablissements).map((e: any) => {
             const { evaluations, reclamations, evenements, actualites, medias, ...rest } = e;
             return rest;
         });
         await tx.etablissement.createMany({ data: etabs });
      }

      // Niveau 3 : Contenu
      // Créés par User, liés à Etablissement
      if (d.campagnes?.length) await tx.campagne.createMany({ data: cleanData(d.campagnes) });
      if (d.articles?.length) await tx.article.createMany({ data: cleanData(d.articles) });
      if (d.actualites?.length) await tx.actualite.createMany({ data: cleanData(d.actualites) });
      if (d.evenements?.length) await tx.evenement.createMany({ data: cleanData(d.evenements) });
      
      if (d.reclamations?.length) {
         // Extraire historique et medias si inclus (car createMany ne supporte pas nested)
         // Ici on restaure la table 'Reclamation' pure, puis l'historique
         const recs = cleanData(d.reclamations).map((r: any) => {
             const { historique, medias, ...rest } = r;
             return rest;
         });
         await tx.reclamation.createMany({ data: recs });
      }

      if (d.suggestions?.length) await tx.suggestion.createMany({ data: cleanData(d.suggestions) });
      if (d.programmes?.length) await tx.programmeActivite.createMany({ data: cleanData(d.programmes) });
      if (d.evaluations?.length) await tx.evaluation.createMany({ data: cleanData(d.evaluations) });
      
      // Niveau 4 : Relations finales
      if (d.userPermissions?.length) await tx.userPermission.createMany({ data: cleanData(d.userPermissions) });
      
      // Historique Réclamations (Recupéré de reclamations include ou table séparée ?)
      // Dans le POST backup, on a fait `prisma.reclamation.findMany({ include: { historique: true } })`
      // Donc l'historique est imbriqué dans reclamations.
      // On doit le parser.
      if (d.reclamations?.length) {
         const allHistory = [];
         for (const r of d.reclamations) {
            if (r.historique && Array.isArray(r.historique)) {
               allHistory.push(...r.historique);
            }
         }
         if (allHistory.length) await tx.historiqueReclamation.createMany({ data: cleanData(allHistory) });
      }

      // MEDIA - DOIT ÊTRE LA FIN CAR RÉFÉRENCE TOUT
      if (d.medias?.length) {
        // Attention: Media a des FKs optionnels vers etablissement, evenement, etc. Ces IDs doivent exister.
        // Comme on a tout créé avant, ça devrait être bon.
        await tx.media.createMany({ data: cleanData(d.medias) });
      }

    }, {
      timeout: 20000, // 20 secondes timeout
      maxWait: 5000,
    });

    console.log('[RESTORE] Restauration terminée avec succès');

    return NextResponse.json({ 
      success: true, 
      message: 'Restauration complète effectuée avec succès',
      details: `${Object.keys(d).length} tables restaurées.`
    });

  } catch (error) {
    console.error('Erreur restauration critique:', error);
    return NextResponse.json({ 
       error: 'Erreur lors de la restauration. La base de données peut être dans un état incohérent.',
       details: String(error)
    }, { status: 500 });
  }
}

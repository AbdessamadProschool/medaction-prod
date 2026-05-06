const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const permissions = [
  // --- Groupe: Gestion Utilisateurs ---
  {
    code: 'users.reset-password',
    nom: 'Réinitialiser mot de passe',
    nomAr: 'إعادة تعيين كلمة المرور',
    groupe: 'users',
    groupeLabel: 'Utilisateurs',
    groupeLabelAr: 'المستخدمين',
    ordre: 10,
    description: 'Permet de réinitialiser le mot de passe des utilisateurs (sauf Super Admin)',
  },
  {
    code: 'users.manage-2fa',
    nom: 'Gérer 2FA',
    nomAr: 'إدارة المصادقة الثنائية',
    groupe: 'users',
    groupeLabel: 'Utilisateurs',
    groupeLabelAr: 'المستخدمين',
    ordre: 11,
    description: 'Permet de désactiver ou réinitialiser la double authentification des utilisateurs',
  },
  {
    code: 'users.delete.all',
    nom: 'Suppression totale',
    nomAr: 'حذف نهائي',
    groupe: 'users',
    groupeLabel: 'Utilisateurs',
    groupeLabelAr: 'المستخدمين',
    ordre: 12,
    description: 'Permet de supprimer définitivement un compte utilisateur',
  },
  
  // --- Groupe: Logs et Audit ---
  {
    code: 'system.logs.view',
    nom: 'Voir les logs',
    nomAr: 'عرض السجلات',
    groupe: 'system',
    groupeLabel: 'Système',
    groupeLabelAr: 'النظام',
    ordre: 20,
    description: 'Permet de consulter les logs d\'audit et d\'activité du système',
  },
  
  // --- Groupe: Paramètres Système ---
  {
    code: 'system.settings.edit',
    nom: 'Modifier paramètres',
    nomAr: 'تعديل الإعدادات',
    groupe: 'system',
    groupeLabel: 'Système',
    groupeLabelAr: 'النظام',
    ordre: 21,
    description: 'Permet de modifier les réglages de la plateforme (hors sécurité critique)',
  }
];

async function main() {
  console.log('🚀 Démarrage de la synchronisation des permissions...');

  for (const p of permissions) {
    try {
      // On utilise le code comme identifiant unique
      const existing = await prisma.permission.findUnique({
        where: { code: p.code }
      });

      // Les screenshots montrent que même en Arabe, les noms des permissions en DB sont en Français
      // (ex: "Utilisateurs", "Actualités"). On s'aligne sur l'existant.
      
      const label = p.groupeLabel;
      const nom = p.nom;

      if (existing) {
        await prisma.permission.update({
          where: { code: p.code },
          data: {
            nom: nom,
            groupeLabel: label,
            ordre: p.ordre,
            isActive: true
          }
        });
        console.log(`✅ Mise à jour : ${p.code}`);
      } else {
        await prisma.permission.create({
          data: {
            code: p.code,
            nom: nom,
            description: p.description,
            groupe: p.groupe,
            groupeLabel: label,
            ordre: p.ordre,
            isActive: true
          }
        });
        console.log(`✨ Création : ${p.code}`);
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${p.code}:`, error.message);
    }
  }

  console.log('🏁 Synchronisation terminée.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

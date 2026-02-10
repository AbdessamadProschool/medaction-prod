                                                                                                                                                                                                  import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Mise à jour des établissements du secteur EDUCATION...');

    const toDelete = await prisma.etablissement.findMany({
      where: { secteur: 'EDUCATION' },
      select: { id: true, latitude: true, longitude: true }
    });
    
    const idsToDelete = toDelete
      .filter(e => e.latitude === null || e.longitude === null || e.latitude === 0 || e.longitude === 0)
      .map(e => e.id);
    
    if (idsToDelete.length > 0) {
      await prisma.etablissement.deleteMany({ where: { id: { in: idsToDelete } } });
    }

    const etablissementsEducation = [
      {
        code: 'EDU-EP-NAJD-1',
        nom: 'ECOLE PRIMAIRE NAJD',
        nomArabe: 'مدرسة النجد الابتدائية',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'Min. de l\'Education Nationale',
        gestionnaire: 'Direction Provinciale Médiouna',
        responsableNom: 'M. Ahmed El Mansouri',
        latitude: 33.4547,
        longitude: -7.5192,
        communeNom: 'Médiouna',
        adresse: 'Quartier Najd, Rue des Écoles, Médiouna',
        telephone: '05 22 59 91 12',
        email: 'ep.najd@men.gov.ma',
        anneeCreation: 1985,
        etatInfrastructure: 'BON',
        capaciteAccueil: 450,
        effectifTotal: 380,
        services: ['Cantine scolaire', 'Transport scolaire', 'Bibliothèque', 'Salle informatique'],
        programmes: ['Programme national primaire', 'Activités parascolaires', 'Soutien scolaire'],
        statutFonctionnel: 'Fonctionnel',
      },
      {
        code: 'EDU-CLG-MYOUSSEF-1',
        nom: 'COLLEGE MOULAY YOUSSEF',
        nomArabe: 'إعدادية مولاي يوسف',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'Min. de l\'Education Nationale',
        gestionnaire: 'Direction Provinciale Médiouna',
        responsableNom: 'Mme Fatima Zahra Bennani',
        latitude: 33.4512,
        longitude: -7.5186,
        communeNom: 'Médiouna',
        adresse: 'Avenue Moulay Youssef, Centre Ville, Médiouna',
        telephone: '05 22 59 92 43',
        email: 'clg.myoussef@men.gov.ma',
        anneeCreation: 1992,
        etatInfrastructure: 'BON',
        capaciteAccueil: 800,
        effectifTotal: 720,
        services: ['Laboratoire sciences', 'CDI', 'Salle multimédia', 'Terrain de sport'],
        programmes: ['Programme collégial', 'Clubs scientifiques', 'Activités culturelles'],
        statutFonctionnel: 'Fonctionnel',
      },
      {
        code: 'EDU-LYC-MED-1',
        nom: 'LYCEE QUALIFIANT MEDIOUNA',
        nomArabe: 'الثانوية التأهيلية ميديونة',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'Min. de l\'Education Nationale',
        gestionnaire: 'Direction Provinciale Médiouna',
        responsableNom: 'M. Karim Alaoui',
        latitude: 33.4498,
        longitude: -7.5231,
        communeNom: 'Médiouna',
        adresse: 'Boulevard Hassan II, Centre Ville, Médiouna',
        telephone: '05 22 59 93 55',
        email: 'lycee.mediouna@men.gov.ma',
        siteWeb: 'https://lycee-mediouna.ma',
        anneeCreation: 1998,
        etatInfrastructure: 'BON',
        capaciteAccueil: 1200,
        effectifTotal: 980,
        services: ['Laboratoires', 'Bibliothèque', 'Salle informatique', 'Amphithéâtre', 'Infirmerie'],
        programmes: ['Sciences expérimentales', 'Sciences mathématiques', 'Lettres et sciences humaines'],
        statutFonctionnel: 'Fonctionnel',
      },
      {
        code: 'EDU-CLG-LAHR-1',
        nom: 'COLLEGE LAHRAOUYINE',
        nomArabe: 'إعدادية الهراويين',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'Min. de l\'Education Nationale',
        gestionnaire: 'Direction Provinciale Médiouna',
        responsableNom: 'M. Hassan Chraibi',
        latitude: 33.5076,
        longitude: -7.4509,
        communeNom: 'Lahraouyine',
        adresse: 'Avenue Principale, Centre Lahraouyine',
        telephone: '05 22 61 45 87',
        email: 'clg.lahraouyine@men.gov.ma',
        anneeCreation: 2005,
        etatInfrastructure: 'MOYEN',
        capaciteAccueil: 600,
        effectifTotal: 520,
        services: ['Laboratoire', 'Bibliothèque', 'Salle sport'],
        programmes: ['Programme collégial', 'Soutien scolaire'],
        statutFonctionnel: 'Fonctionnel',
      },
      {
        code: 'EDU-LYC-LAHR-1',
        nom: 'LYCEE QUALIFIANT LAHRAOUYINE',
        nomArabe: 'الثانوية التأهيلية الهراويين',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'Min. de l\'Education Nationale',
        gestionnaire: 'Direction Provinciale Médiouna',
        responsableNom: 'Mme Nadia Tazi',
        latitude: 33.5095,
        longitude: -7.4521,
        communeNom: 'Lahraouyine',
        adresse: 'Quartier Central, Lahraouyine',
        telephone: '05 22 61 46 90',
        email: 'lycee.lahraouyine@men.gov.ma',
        anneeCreation: 2010,
        etatInfrastructure: 'BON',
        capaciteAccueil: 900,
        effectifTotal: 780,
        services: ['Laboratoires sciences', 'CDI', 'Salle informatique', 'Terrain multisport'],
        programmes: ['Sciences expérimentales', 'Sciences mathématiques', 'Lettres'],
        statutFonctionnel: 'Fonctionnel',
      },
      {
        code: 'EDU-CFP-MED-1',
        nom: 'CENTRE DE FORMATION PROFESSIONNELLE MEDIOUNA',
        nomArabe: 'مركز التكوين المهني ميديونة',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'OFPPT',
        gestionnaire: 'Direction Régionale OFPPT',
        responsableNom: 'M. Abdellah Moussaoui',
        latitude: 33.4534,
        longitude: -7.5178,
        communeNom: 'Médiouna',
        adresse: 'Zone Industrielle, Médiouna',
        telephone: '05 22 59 94 23',
        email: 'cfp.mediouna@ofppt.ma',
        siteWeb: 'https://www.ofppt.ma',
        anneeCreation: 2000,
        etatInfrastructure: 'BON',
        capaciteAccueil: 500,
        effectifTotal: 420,
        services: ['Ateliers pratiques', 'Laboratoire', 'Salle informatique', 'Stage entreprise'],
        programmes: ['Électricité', 'Mécanique', 'Informatique', 'Gestion'],
        statutFonctionnel: 'Fonctionnel',
      },
      {
        code: 'EDU-ISTA-MED-1',
        nom: 'INSTITUT SPECIALISE DE TECHNOLOGIE APPLIQUEE',
        nomArabe: 'المعهد المتخصص للتكنولوجيا التطبيقية',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'OFPPT',
        gestionnaire: 'Direction Régionale OFPPT',
        responsableNom: 'M. Mohamed Berrada',
        latitude: 33.4567,
        longitude: -7.5223,
        communeNom: 'Médiouna',
        adresse: 'Avenue Industrielle, Médiouna',
        telephone: '05 22 59 95 34',
        email: 'ista.mediouna@ofppt.ma',
        siteWeb: 'https://www.ofppt.ma',
        anneeCreation: 2008,
        etatInfrastructure: 'BON',
        capaciteAccueil: 400,
        effectifTotal: 350,
        services: ['Laboratoires high-tech', 'Centre de ressources', 'Partenariats entreprises'],
        programmes: ['Développement informatique', 'Réseaux', 'Commerce', 'Comptabilité'],
        statutFonctionnel: 'Fonctionnel',
      },
      {
        code: 'EDU-DEL-MED-1',
        nom: 'DELEGATION PROVINCIALE DE L\'EDUCATION NATIONALE',
        nomArabe: 'المندوبية الإقليمية لوزارة التربية الوطنية',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'Min. de l\'Education Nationale',
        gestionnaire: 'Académie Régionale Casablanca-Settat',
        responsableNom: 'M. Rachid El Ouali',
        latitude: 33.4521,
        longitude: -7.5201,
        communeNom: 'Médiouna',
        adresse: 'Centre Administratif, Avenue Mohammed V, Médiouna',
        telephone: '05 22 59 90 00',
        email: 'delegation.mediouna@men.gov.ma',
        siteWeb: 'https://www.men.gov.ma',
        anneeCreation: 1990,
        etatInfrastructure: 'BON',
        services: ['Gestion administrative', 'Affaires pédagogiques', 'Ressources humaines', 'Examens'],
        programmes: ['Coordination pédagogique', 'Formation continue', 'Contrôle qualité'],
        statutFonctionnel: 'Fonctionnel',
      },
      {
        code: 'EDU-DT-MED-1',
        nom: 'DAR TALIB MEDIOUNA',
        nomArabe: 'دار الطالب ميديونة',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'Entraide Nationale',
        gestionnaire: 'Délégation Provinciale Entraide Nationale',
        responsableNom: 'M. Said Lahlou',
        latitude: 33.4556,
        longitude: -7.5212,
        communeNom: 'Médiouna',
        adresse: 'Près du Lycée Qualifiant, Médiouna',
        telephone: '05 22 59 97 12',
        email: 'dartalib.mediouna@entraide.gov.ma',
        anneeCreation: 2005,
        etatInfrastructure: 'BON',
        capaciteAccueil: 120,
        effectifTotal: 95,
        services: ['Hébergement', 'Restauration', 'Salle d\'études', 'Accompagnement social'],
        programmes: ['Soutien scolaire', 'Activités culturelles', 'Formation civique'],
        statutFonctionnel: 'Fonctionnel',
      },
      {
        code: 'EDU-DTA-MED-1',
        nom: 'DAR TALIBA MEDIOUNA',
        nomArabe: 'دار الطالبة ميديونة',
        secteur: 'EDUCATION',
        nature: 'Public',
        tutelle: 'Entraide Nationale',
        gestionnaire: 'Délégation Provinciale Entraide Nationale',
        responsableNom: 'Mme Khadija Amrani',
        latitude: 33.4561,
        longitude: -7.5223,
        communeNom: 'Médiouna',
        adresse: 'Près du Lycée Qualifiant, Médiouna',
        telephone: '05 22 59 97 34',
        email: 'dartaliba.mediouna@entraide.gov.ma',
        anneeCreation: 2008,
        etatInfrastructure: 'BON',
        capaciteAccueil: 100,
        effectifTotal: 85,
        services: ['Hébergement', 'Restauration', 'Salle d\'études', 'Accompagnement féminin'],
        programmes: ['Soutien scolaire', 'Développement personnel', 'Formation professionnelle'],
        statutFonctionnel: 'Fonctionnel',
      },
    ];

    let communeDefault = await prisma.commune.findFirst({
      where: { nom: { contains: 'Médiouna' } }
    });
    if (!communeDefault) communeDefault = await prisma.commune.findFirst();
    if (!communeDefault) return NextResponse.json({ error: 'Aucune commune trouvée' }, { status: 400 });

    const results: string[] = [];

    for (const etab of etablissementsEducation) {
      let commune = await prisma.commune.findFirst({
        where: { nom: { contains: etab.communeNom || 'Médiouna' } }
      });
      if (!commune) commune = communeDefault;

      const existingEtab = await prisma.etablissement.findUnique({ where: { code: etab.code } });

      const data: any = {
        nom: etab.nom,
        nomArabe: etab.nomArabe,
        secteur: etab.secteur,
        nature: etab.nature,
        tutelle: etab.tutelle,
        gestionnaire: etab.gestionnaire,
        responsableNom: etab.responsableNom,
        latitude: etab.latitude,
        longitude: etab.longitude,
        adresseComplete: etab.adresse,
        telephone: etab.telephone,
        email: etab.email,
        siteWeb: etab.siteWeb,
        anneeCreation: etab.anneeCreation,
        etatInfrastructure: etab.etatInfrastructure,
        capaciteAccueil: etab.capaciteAccueil,
        effectifTotal: etab.effectifTotal,
        services: etab.services || [],
        programmes: etab.programmes || [],
        statutFonctionnel: etab.statutFonctionnel,
        isPublie: true,
        isValide: true,
        communeId: commune.id,
      };

      if (existingEtab) {
        await prisma.etablissement.update({ where: { code: etab.code }, data });
        results.push(`✅ Mis à jour: ${etab.code}`);
      } else {
        await prisma.etablissement.create({ data: { code: etab.code, ...data, donneesSpecifiques: {} } });
        results.push(`➕ Créé: ${etab.code}`);
      }
    }

    const countEducation = await prisma.etablissement.count({ where: { secteur: 'EDUCATION', isPublie: true } });

    return NextResponse.json({
      success: true,
      deleted: idsToDelete.length,
      created: results.filter(r => r.startsWith('➕')).length,
      updated: results.filter(r => r.startsWith('✅')).length,
      totalEducation: countEducation,
      details: results,
    });

  } catch (error: any) {
    console.error('Erreur seed-education:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error?.message }, { status: 500 });
  }
}

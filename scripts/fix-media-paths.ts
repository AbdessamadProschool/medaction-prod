import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DÉBUT DE LA NORMALISATION DES CHEMINS MÉDIA ---');
  
  const medias = await prisma.media.findMany({
    where: {
      type: 'IMAGE',
      OR: [
        { cheminFichier: { contains: '\\' } },
        { cheminFichier: { startsWith: 'C:' } },
        { cheminFichier: { startsWith: 'public' } },
        { NOT: { urlPublique: { startsWith: '/api/uploads' } } }
      ]
    }
  });

  console.log(`Trouvé ${medias.length} médias à normaliser.`);

  for (const media of medias) {
    let newPath = media.cheminFichier;
    
    // 1. Convertir Windows en Linux separators
    newPath = newPath.replace(/\\/g, '/');
    
    // 2. Nettoyer les préfixes absolus Windows
    if (newPath.match(/^[a-zA-Z]:/)) {
      if (newPath.includes('/uploads/')) {
        newPath = newPath.split('/uploads/')[1];
      }
    }
    
    // 3. Enlever le préfixe 'public' ou 'public/uploads'
    newPath = newPath.replace(/^public\/uploads\//, '');
    newPath = newPath.replace(/^public\//, '');
    newPath = newPath.replace(/^uploads\//, '');
    
    // 4. S'assurer qu'il commence par /reclamations (ou autre dossier racine)
    if (!newPath.startsWith('/')) {
      newPath = '/' + newPath;
    }
    
    // 5. Mettre à jour l'URL publique pour inclure /api
    let newUrl = media.urlPublique;
    if (!newUrl.startsWith('/api/')) {
      newUrl = '/api' + (newUrl.startsWith('/') ? '' : '/') + newUrl;
    }

    console.log(`ID ${media.id}: [${media.cheminFichier}] -> [${newPath}]`);
    console.log(`URL ${media.id}: [${media.urlPublique}] -> [${newUrl}]`);

    await prisma.media.update({
      where: { id: media.id },
      data: {
        cheminFichier: newPath,
        urlPublique: newUrl
      }
    });
  }

  console.log('--- FIN DE LA NORMALISATION ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

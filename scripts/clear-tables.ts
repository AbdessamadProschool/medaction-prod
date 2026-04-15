import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clear() {
    console.log('🗑️ Vidage des tables : Evenement, ProgrammeActivite, Campagne...');
    
    try {
        const res1 = await prisma.evenement.deleteMany();
        console.log(`✅ ${res1.count} événements supprimés.`);

        const res2 = await prisma.programmeActivite.deleteMany();
        console.log(`✅ ${res2.count} activités supprimées.`);

        const res3 = await prisma.campagne.deleteMany();
        console.log(`✅ ${res3.count} campagnes supprimées.`);

        console.log('✨ Tables vidées avec succès.');
    } catch (e) {
        console.error('❌ Erreur lors du vidage :', e);
    } finally {
        await prisma.$disconnect();
    }
}

clear();

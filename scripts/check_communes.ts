
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const communes = await prisma.commune.findMany({ 
        select: { id: true, nom: true, geojsonBoundary: true } 
    });
    console.log("----------------------------------------");
    console.log("COMMUNE STATUS:");
    communes.forEach(c => {
        const hasGeo = c.geojsonBoundary ? "✅ OUI" : "❌ NON";
        console.log(`- ${c.nom}: GEOJSON = ${hasGeo}`);
    });
    console.log("----------------------------------------");
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

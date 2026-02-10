import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PERMISSION_LABELS, PermissionCode } from '../lib/permissions-types';

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedPermissions() {
  console.log('🚀 Seeding Permissions pro-grade...');

  const permissions: { code: PermissionCode, label: string }[] = (Object.keys(PERMISSION_LABELS) as PermissionCode[]).map(code => ({
    code: code,
    label: PERMISSION_LABELS[code]
  }));

  let orderCounter = 1;

  for (const perm of permissions) {
    const groupKey = perm.code.split('.')[0]; // ex: 'users', 'auth'
    const groupLabel = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);

    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        nom: perm.label,
        groupe: groupKey,
        groupeLabel: groupLabel,
      },
      create: {
        code: perm.code,
        nom: perm.label,
        groupe: groupKey,
        groupeLabel: groupLabel,
        description: `Permission système : ${perm.label}`,
        ordre: orderCounter++,
        isActive: true,
      },
    });
  }

  console.log(`✅ ${permissions.length} Permissions seeded successfully`);
}

seedPermissions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

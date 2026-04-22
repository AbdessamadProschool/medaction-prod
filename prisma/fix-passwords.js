const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// SECURITY: credentials must come from the environment — never hardcoded.
// Run with: DATABASE_URL="postgresql://user:pass@host:port/db" node prisma/fix-passwords.js
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set. Aborting.');
  process.exit(1);
}

const client = new Client({ connectionString });

async function main() {
  await client.connect();
  console.log('🔌 Connecté à la DB Docker via port 5433');

  const password = '12345678';
  console.log(`🔒 Génération du hash pour "${password}"...`);
  const hashedPassword = await bcrypt.hash(password, 12);

  // Update Admin
  const resAdmin = await client.query(
    'UPDATE "User" SET "motDePasse" = $1 WHERE email = $2 RETURNING email',
    [hashedPassword, 'superadmin@medaction.ma']
  );
  console.log('✅ Admin Mis à jour:', resAdmin.rowCount);

  // Update Citoyen
  const resCitoyen = await client.query(
    'UPDATE "User" SET "motDePasse" = $1 WHERE email = $2 RETURNING email',
    [hashedPassword, 'citoyen@medaction.ma']
  );
  console.log('✅ Citoyen Mis à jour:', resCitoyen.rowCount);

  await client.end();
}

main().catch(console.error);

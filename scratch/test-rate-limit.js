const axios = require('axios');

async function run() {
  console.log('Début du test de charge de Rate Limiting sur les routes d\'authentification...');
  
  // Nous envoyons des requêtes à /api/auth/callback/credentials ou /api/auth/login
  // En Next.js, NextAuth écoute sur /api/auth/signin/credentials ou /api/auth/callback/credentials.
  // Faisons le test sur l'URL de callback de credentials.
  const targetUrl = 'http://localhost:3000/api/auth/callback/credentials';
  
  console.log(`Cible : ${targetUrl}`);
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let otherErrorCount = 0;

  for (let i = 1; i <= 8; i++) {
    try {
      console.log(`Requête #${i} en cours...`);
      const response = await axios.post(targetUrl, {
        email: 'test-rate-limit@provincemediouna.ma',
        password: 'Password123!',
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          // Utiliser une IP fictive (le middleware l'extrait de x-forwarded-for en dev)
          'X-Forwarded-For': '198.51.100.42'
        },
        timeout: 3000,
        validateStatus: () => true // Ne pas lever d'erreur sur les status != 200
      });

      console.log(`Requête #${i} - Status: ${response.status} - Header Limit: ${response.headers['x-ratelimit-limit'] || 'N/A'}`);
      
      if (response.status === 429) {
        rateLimitedCount++;
      } else if (response.status === 401 || response.status === 403 || response.status === 200 || response.status === 302) {
        successCount++; // Le rate limiter a laissé passer la requête (NextAuth renvoie 302 ou 401 sur des credentials bidons)
      } else {
        otherErrorCount++;
      }
    } catch (error) {
      console.error(`Requête #${i} - Échec réseau:`, error.message);
      otherErrorCount++;
    }
  }

  console.log('\n--- Bilan du Test ---');
  console.log(`Autorisées par le Rate Limiter (Status != 429) : ${successCount}`);
  console.log(`Bloquées par le Rate Limiter (Status 429) : ${rateLimitedCount}`);
  console.log(`Erreurs réseau ou autres : ${otherErrorCount}`);

  if (rateLimitedCount > 0) {
    console.log('✅ Le Rate Limiter a correctement bloqué les requêtes en excès avec le code 429.');
  } else {
    console.log('⚠️ Aucune requête n\'a été bloquée par le Rate Limiter.');
    console.log('Note : Pour faire tourner ce test, assurez-vous que le serveur local MedAction tourne sur le port 3000 (npm run dev).');
  }
}

run();

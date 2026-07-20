const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Connexion à Brave via CDP...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  
  // Obtenir les contextes de navigateur existants
  const contexts = browser.contexts();
  if (contexts.length === 0) {
    throw new Error('Aucun contexte de navigateur trouvé.');
  }
  
  const context = contexts[0];
  const pages = context.pages();
  console.log(`Trouvé ${pages.length} pages ouvertes.`);
  
  // Chercher l'onglet bo.provincemediouna.ma ou en créer un nouveau avec les mêmes cookies
  let activePage = null;
  for (const p of pages) {
    const url = p.url();
    if (url.includes('bo.provincemediouna.ma')) {
      activePage = p;
      console.log('Onglet production actif trouvé:', url);
      break;
    }
  }
  
  if (!activePage) {
    console.log('Aucun onglet production actif trouvé, création d\'un nouvel onglet...');
    activePage = await context.newPage();
    await activePage.goto('https://bo.provincemediouna.ma/fr');
    await activePage.waitForTimeout(3000);
  }
  
  // S'assurer que le viewport est de 360px de large (mobile)
  await activePage.setViewportSize({ width: 360, height: 800 });
  console.log('Viewport configuré à 360x800.');
  
  const screenshotsDir = 'C:/Users/Proschool/.gemini/antigravity/brain/ac36c815-bd63-44ec-9bda-76f691009959/scratch/audit-screenshots';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const reports = [];

  // Définition des pages à visiter et des actions à faire (modals)
  const auditPlan = [
    // === Admin ===
    { name: 'Admin_Dashboard', url: '/fr/admin' },
    { name: 'Admin_Reclamations_Liste', url: '/fr/admin/reclamations' },
    {
      name: 'Admin_Reclamations_Modal_Affectation',
      url: '/fr/admin/reclamations',
      action: async (page) => {
        // Cliquer sur le premier bouton d'affectation
        const btn = page.locator('button[title*="Affecter"], button:has-text("Affecter")').first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(1000);
        } else {
          // Cliquer sur une ligne puis trouver le bouton
          const tr = page.locator('tbody tr').first();
          if (await tr.count() > 0) {
            await tr.click();
            await page.waitForTimeout(1000);
            const affectBtn = page.locator('button:has-text("Affecter")').first();
            if (await affectBtn.count() > 0) await affectBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    },
    {
      name: 'Admin_Reclamations_Modal_Arbitrage',
      url: '/fr/admin/reclamations',
      action: async (page) => {
        // Clic sur bouton d'arbitrage/statut
        const btn = page.locator('button[title*="Statut"], button:has-text("Statut"), button[title*="arbitrage"]').first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(1000);
        }
      }
    },
    {
      name: 'Admin_Reclamations_Modal_Suppression',
      url: '/fr/admin/reclamations',
      action: async (page) => {
        const btn = page.locator('button[title*="Supprimer"], button:has-text("Supprimer")').first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(1000);
        }
      }
    },
    { name: 'Admin_Utilisateurs_Liste', url: '/fr/admin/utilisateurs' },
    {
      name: 'Admin_Utilisateurs_Modal_Creation',
      url: '/fr/admin/utilisateurs',
      action: async (page) => {
        const btn = page.locator('button:has-text("Ajouter"), button:has-text("Nouvel utilisateur")').first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(1000);
        }
      }
    },
    {
      name: 'Admin_Utilisateurs_Modal_Permissions',
      url: '/fr/admin/utilisateurs',
      action: async (page) => {
        // Clic sur l'icône de clé/rôle/permissions
        const btn = page.locator('button[title*="permissions"], button[title*="Rôle"]').first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(1000);
        }
      }
    },
    { name: 'Admin_Etablissements_Liste', url: '/fr/admin/etablissements' },
    {
      name: 'Admin_Etablissements_Detail',
      url: '/fr/admin/etablissements',
      action: async (page) => {
        const tr = page.locator('tbody tr').first();
        if (await tr.count() > 0) {
          await tr.click();
          await page.waitForTimeout(3000);
        }
      }
    },
    { name: 'Admin_Evenements_Liste', url: '/fr/admin/evenements' },
    {
      name: 'Admin_Evenements_Modal_Detail',
      url: '/fr/admin/evenements',
      action: async (page) => {
        const tr = page.locator('tbody tr').first();
        if (await tr.count() > 0) {
          await tr.click();
          await page.waitForTimeout(1000);
        }
      }
    },
    { name: 'Admin_Evenements_Creation', url: '/fr/admin/evenements/nouveau' },
    { name: 'Admin_Actualites_Liste', url: '/fr/admin/actualites' },
    { name: 'Admin_Actualites_Creation', url: '/fr/admin/actualites/nouvelle' },
    { name: 'Admin_Articles_Liste', url: '/fr/admin/articles' },
    { name: 'Admin_Articles_Creation', url: '/fr/admin/articles/nouveau' },
    { name: 'Admin_Campagnes_Liste', url: '/fr/admin/campagnes' },
    { name: 'Admin_Campagnes_Creation', url: '/fr/admin/campagnes/nouvelle' },
    { name: 'Admin_Programmes_Liste', url: '/fr/admin/programmes-activites' },
    { name: 'Admin_Programmes_Creation', url: '/fr/admin/programmes-activites/nouvelle' },
    { name: 'Admin_Bilans', url: '/fr/admin/bilans' },
    { name: 'Admin_Validation', url: '/fr/admin/validation' },
    { name: 'Admin_Suggestions_Liste', url: '/fr/admin/suggestions' },
    { name: 'Admin_Logs', url: '/fr/admin/logs' },
    { name: 'Admin_Profil', url: '/fr/admin/profil' },

    // === Super Admin ===
    { name: 'SuperAdmin_Dashboard', url: '/fr/super-admin' },
    { name: 'SuperAdmin_Admins_Liste', url: '/fr/super-admin/admins' },
    {
      name: 'SuperAdmin_Admins_Modal_Creation',
      url: '/fr/super-admin/admins',
      action: async (page) => {
        const btn = page.locator('button:has-text("Ajouter"), button:has-text("Nouvel Administrateur")').first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(1000);
        }
      }
    },
    { name: 'SuperAdmin_Audit', url: '/fr/super-admin/audit' },
    { name: 'SuperAdmin_Licence', url: '/fr/super-admin/licence' },
    { name: 'SuperAdmin_Settings', url: '/fr/super-admin/settings' }
  ];

  for (const step of auditPlan) {
    console.log(`Audit de ${step.name}...`);
    try {
      // Aller sur la page cible
      await activePage.goto(`https://bo.provincemediouna.ma${step.url}`);
      await activePage.waitForTimeout(4000); // Attente de chargement
      
      // Exécuter l'action optionnelle (ex: ouvrir une modal)
      if (step.action) {
        await step.action(activePage);
        await activePage.waitForTimeout(1000);
      }
      
      // Prendre capture d'écran
      const imgPath = path.join(screenshotsDir, `${step.name}.png`);
      await activePage.screenshot({ path: imgPath });
      
      // Lancer les assertions d'audit responsive en cours de route
      const auditResult = await activePage.evaluate(() => {
        const errors = [];
        
        // 1. Détection de scroll horizontal
        const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth;
        if (hasHorizontalScroll) {
          errors.push('Scroll horizontal indésirable détecté.');
        }
        
        // 2. Détection de chevauchement/superposition d'éléments critiques
        // (Vérifie si les boutons ont une zone tactile trop petite ou se superposent)
        const buttons = Array.from(document.querySelectorAll('button, a.btn, input[type="submit"]'));
        let touchTargetErrors = 0;
        buttons.forEach(btn => {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width < 44 || rect.height < 44) {
              touchTargetErrors++;
            }
          }
        });
        if (touchTargetErrors > 5) {
          errors.push(`${touchTargetErrors} boutons ont une zone tactile inférieure à 44px (recommandation WCAG).`);
        }
        
        // 3. Détection des modals qui débordent
        const modals = Array.from(document.querySelectorAll('.modal, [role="dialog"], .fixed'));
        modals.forEach(modal => {
          const rect = modal.getBoundingClientRect();
          if (rect.width > window.innerWidth || rect.height > window.innerHeight) {
            errors.push('La boîte de dialogue ou modal déborde des limites de l\'écran.');
          }
        });

        // 4. Détection des tableaux non responsivisés (sans conteneur de défilement)
        const tables = Array.from(document.querySelectorAll('table'));
        tables.forEach(table => {
          const parent = table.parentElement;
          const parentOverflow = parent ? window.getComputedStyle(parent).overflowX : '';
          if (parentOverflow !== 'auto' && parentOverflow !== 'scroll' && table.offsetWidth > window.innerWidth) {
            errors.push('Tableau non scrollable horizontalement détecté (casse le layout mobile).');
          }
        });

        return {
          errors,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth
        };
      });
      
      reports.push({
        name: step.name,
        url: step.url,
        status: auditResult.errors.length === 0 ? 'CONFORME' : 'DÉFAUT',
        errors: auditResult.errors,
        screenshot: `${step.name}.png`
      });
      
      console.log(`Statut ${step.name}:`, auditResult.errors.length === 0 ? 'CONFORME' : `DÉFAUT (${auditResult.errors.join(', ')})`);
    } catch (e) {
      console.error(`Erreur lors de l'audit de ${step.name}:`, e.message);
      reports.push({
        name: step.name,
        url: step.url,
        status: 'ERREUR_EXECUTION',
        errors: [e.message]
      });
    }
  }

  // Écrire le rapport final sous forme de JSON
  const reportPath = 'C:/Users/Proschool/.gemini/antigravity/brain/ac36c815-bd63-44ec-9bda-76f691009959/scratch/sweep-mobile-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
  console.log('Audit terminé et rapport écrit.');
  
  await browser.close();
}

main().catch(console.error);

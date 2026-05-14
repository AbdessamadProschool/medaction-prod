import { test, expect } from '@playwright/test';

test.describe('Admin Reclamations Status Change Modal', () => {
  test('should display and interact with the status change modal', async ({ page }) => {
    // 1. Mock de l'API de session (authentification)
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            name: 'Admin Test',
            email: 'admin@test.com',
            role: 'SUPER_ADMIN', // Autorisé à voir la page et effectuer les actions
          },
          expires: '9999-12-31T23:59:59.999Z',
        }),
      });
    });

    // 2. Mock des données de réclamations
    const mockReclamation = {
      id: 999,
      reference: 'REC-TEST-999',
      titre: 'Problème de voirie',
      description: 'Nid de poule dangereux',
      categorie: 'Infrastructure',
      statut: 'EN_ATTENTE',
      createdAt: new Date().toISOString(),
      user: { nom: 'Citoyen Test', telephone: '0600000000' },
      commune: { nom: 'Commune Centrale' },
    };

    await page.route('**/api/reclamations*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [mockReclamation],
            pagination: { total: 1, totalPages: 1 },
            stats: { total: 1, enAttente: 1, aDispatcher: 0, enCours: 0, acceptees: 0 },
          }),
        });
      }
    });

    // 3. Mock des métadonnées (communes, agents)
    await page.route('**/api/map/communes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ communes: [] }),
      });
    });

    await page.route('**/api/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    // 4b. Mock de la licence
    await page.route('**/api/license/check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, daysRemaining: 365 }),
      });
    });

    // 4. Mock de l'action de changement de statut
    let statusUpdated = false;
    let newStatus = '';
    await page.route(`**/api/reclamations/${mockReclamation.id}/statut`, async (route) => {
      if (route.request().method() === 'PATCH') {
        statusUpdated = true;
        const postData = JSON.parse(route.request().postData() || '{}');
        newStatus = postData.statut;
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // 5. Navigation avec bypass de l'authentification
    await page.setExtraHTTPHeaders({
      'x-playwright-test': 'lwcM7sCqBQ5FLuKkrOUUCjp3tQ+DQjv2s8UiSKTYRTg='
    });

    await page.goto('/fr/admin/reclamations', { timeout: 60000 });

    // Attendre que l'état de chargement disparaisse
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 30000 });
    
    // Attendre que la table soit chargée et cliquer sur la réclamation
    // On cherche la ligne qui contient la référence ou le titre
    const row = page.locator('tbody tr').filter({ hasText: 'REC-TEST-999' }).first();
    await expect(row).toBeVisible({ timeout: 15000 });

    // 6. Ouvrir le panneau de détails (Drawer)
    await row.click();
    
    // Vérifier que le drawer est visible
    const drawer = page.locator('h2:has-text("REC-TEST-999")').first();
    await expect(drawer).toBeVisible();

    // 7. Cliquer sur le bouton "Mettre à jour le statut" dans le drawer
    // On cible le bouton par son texte (qui contient la clé de translation si non traduite)
    const editBtn = page.locator('button').filter({ hasText: /update_status/i }).first();
    await editBtn.click();

    // 8. Vérifier la modale de statut
    // Le header contient la clé UPDATE_STATUS
    const modalHeader = page.locator('h3').filter({ hasText: /UPDATE_STATUS/i }).first();
    await expect(modalHeader).toBeVisible({ timeout: 10000 });

    // 9. Changer le statut à 'ACCEPTEE'
    // Le bouton contient la clé STATUS_LABELS.ACCEPTED
    const acceptBtn = page.locator('button').filter({ hasText: /ACCEPTED/i }).first();
    await acceptBtn.click();

    // 10. Vérifier que la requête a été interceptée et le statut modifié
    // Comme la promesse toast s'exécute, il y aura un bref délai
    await page.waitForTimeout(1000);
    expect(statusUpdated).toBeTruthy();
  });
});

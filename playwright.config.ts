import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E
 */
export default defineConfig({
  // Dossier des tests
  testDir: './e2e',
  
  // Timeout global
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },
  
  // Exécution complète même si un test échoue
  fullyParallel: true,
  
  // Nombre de retries en CI
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // Configuration partagée
  use: {
    // Base URL pour les tests
    baseURL: 'http://localhost:3000',
    
    // Trace en cas d'échec
    trace: 'on-first-retry',
    
    // Screenshot en cas d'échec
    screenshot: 'only-on-failure',
    
    // Vidéo en cas d'échec
    video: 'on-first-retry',
    
    // Viewport par défaut
    viewport: { width: 1280, height: 720 },
    
    // User-Agent
    userAgent: 'Playwright E2E Tests',
  },

  // Projets de test
  projects: [
    // Setup - authentification
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Tests authentifiés
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Tests sans authentification
    {
      name: 'chromium-unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.public\.spec\.ts/,
    },
    
    // Tests mobile
    {
      name: 'mobile',
      use: { 
        ...devices['iPhone 14'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],

  // Serveur de développement
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

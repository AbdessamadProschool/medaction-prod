/**
 * MedAction Mobile API - Documentation Endpoints
 * 
 * Base URL: http://localhost:3000 (dev) | https://your-domain.ma (prod)
 * 
 * ============================================
 * HEADERS REQUIS POUR TOUTES LES REQUÊTES
 * ============================================
 * 
 * X-Mobile-API-Key: [votre clé API mobile]
 * Content-Type: application/json
 * 
 * Pour les endpoints authentifiés:
 * Authorization: Bearer [token JWT]
 * 
 * ============================================
 * AUTHENTIFICATION
 * ============================================
 * 
 * POST /api/auth/mobile/login
 * - Body: { email, password, captchaToken? }
 * - Response: { success, token, user }
 * 
 * POST /api/auth/mobile/register
 * - Body: { email, password, nom, prenom, telephone? }
 * - Response: { success, data: { user } }
 * 
 * POST /api/auth/mobile/forgot-password
 * - Body: { email }
 * - Response: { success, message }
 * 
 * POST /api/auth/mobile/refresh
 * - Headers: Authorization: Bearer [token]
 * - Response: { success, token, user }
 * 
 * GET /api/auth/mobile/profile
 * - Headers: Authorization: Bearer [token]
 * - Response: { success, data: { user profile } }
 * 
 * PATCH /api/auth/mobile/profile
 * - Headers: Authorization: Bearer [token]
 * - Body: { nom?, prenom?, telephone? }
 * - Response: { success, data: { updated user } }
 * 
 * ============================================
 * RÉCLAMATIONS
 * ============================================
 * 
 * GET /api/mobile/reclamations
 * - Headers: Authorization: Bearer [token]
 * - Query: page, limit, status
 * - Response: { success, data: [], pagination }
 * 
 * POST /api/mobile/reclamations
 * - Headers: Authorization: Bearer [token]
 * - Body: { titre, description, categorie?, etablissementId?, communeId?, latitude?, longitude?, photos? }
 * - Response: { success, data: { reclamation } }
 * 
 * GET /api/mobile/reclamations/[id]
 * - Headers: Authorization: Bearer [token]
 * - Response: { success, data: { reclamation avec historique } }
 * 
 * ============================================
 * ÉTABLISSEMENTS
 * ============================================
 * 
 * GET /api/mobile/etablissements
 * - Query: page, limit, secteur, communeId, search
 * - Response: { success, data: [], pagination }
 * 
 * GET /api/mobile/etablissements/[id]
 * - Response: { success, data: { etablissement avec stats } }
 * 
 * ============================================
 * CODES D'ERREUR
 * ============================================
 * 
 * error: 'INVALID_API_KEY'     - Clé API manquante ou invalide
 * error: 'UNAUTHORIZED'        - Token JWT manquant ou invalide
 * error: 'TOKEN_INVALID'       - Token JWT expiré ou corrompu
 * error: 'ACCOUNT_DISABLED'    - Compte utilisateur désactivé
 * error: 'ACCOUNT_LOCKED'      - Compte temporairement verrouillé
 * error: 'RATE_LIMITED'        - Trop de requêtes (429)
 * error: 'CAPTCHA_REQUIRED'    - Captcha requis après échecs
 * error: 'CAPTCHA_INVALID'     - Token captcha invalide
 * 
 * ============================================
 * CONFIGURATION FLUTTER
 * ============================================
 * 
 * class ApiEndpoints {
 *   static const String baseUrl = 'http://10.0.2.2:3000'; // Android Emulator
 *   // static const String baseUrl = 'http://localhost:3000'; // iOS Simulator
 *   // static const String baseUrl = 'https://your-domain.ma'; // Production
 * 
 *   // Auth
 *   static const String login = '/api/auth/mobile/login';
 *   static const String register = '/api/auth/mobile/register';
 *   static const String refreshToken = '/api/auth/mobile/refresh';
 *   static const String forgotPassword = '/api/auth/mobile/forgot-password';
 *   static const String profile = '/api/auth/mobile/profile';
 * 
 *   // Reclamations
 *   static const String reclamations = '/api/mobile/reclamations';
 *   
 *   // Etablissements
 *   static const String etablissements = '/api/mobile/etablissements';
 * }
 * 
 * // Dans vos requêtes HTTP, ajoutez toujours:
 * headers: {
 *   'X-Mobile-API-Key': 'votre-cle-api-mobile',
 *   'Content-Type': 'application/json',
 *   'Authorization': 'Bearer $token', // Pour les endpoints authentifiés
 * }
 */

export const MOBILE_API_VERSION = '1.0.0';

export const MOBILE_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/mobile/login',
  REGISTER: '/api/auth/mobile/register',
  REFRESH: '/api/auth/mobile/refresh',
  FORGOT_PASSWORD: '/api/auth/mobile/forgot-password',
  PROFILE: '/api/auth/mobile/profile',
  
  // Reclamations
  RECLAMATIONS: '/api/mobile/reclamations',
  RECLAMATION_DETAIL: (id: number) => `/api/mobile/reclamations/${id}`,
  
  // Etablissements
  ETABLISSEMENTS: '/api/mobile/etablissements',
  ETABLISSEMENT_DETAIL: (id: number) => `/api/mobile/etablissements/${id}`,
} as const;

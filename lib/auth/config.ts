import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { AuthToken, AuthUser } from '@/lib/auth/types';
import { authenticator } from 'otplib';
import { isAccountLocked, recordFailedLogin, resetLoginAttempts, check2FAAttempts, record2FAFailure, reset2FAAttempts } from '@/lib/auth/security';
import { getSecuritySettings } from '@/lib/settings/service';
import bcrypt from 'bcryptjs';
import { SystemLogger } from '@/lib/system-logger';

// Configuration TOTP
authenticator.options = {
  window: 1,
  step: 30,
};

/**
 * Configuration NextAuth.js avec stratégie JWT
 * Intègre la gestion des tentatives de connexion et le blocage temporaire
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Identifiants',

      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        code: { label: 'Code 2FA', type: 'text' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email et mot de passe requis');
          }

          const email = credentials.email.toLowerCase();

          // === VÉRIFIER SI LE COMPTE EST BLOQUÉ ===
          const lockStatus = await isAccountLocked(email);
          if (lockStatus.blocked) {
            throw new Error(
              `Compte temporairement bloqué. Réessayez dans ${lockStatus.lockoutMinutes} minutes.`
            );
          }

          // Rechercher l'utilisateur par email
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
              motDePasse: true,
              role: true,
              photo: true,
              secteurResponsable: true,
              communeResponsableId: true,
              etablissementsGeres: true,
              isActive: true,
              isEmailVerifie: true,
              twoFactorEnabled: true,
              twoFactorSecret: true,
              twoFactorBackupCodes: true,
            },
          });

          if (!user) {
            // SECURITY FIX: Exécuter un hash factice pour uniformiser le temps de réponse
            await verifyPassword('dummy_password_check', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.aQZVRNWmqLqKiy');
            throw new Error('Identifiants incorrects');
          }

          // Vérifier si le compte est actif
          if (!user.isActive) {
            throw new Error('Compte désactivé. Contactez l\'administrateur.');
          }

          // Vérifier le mot de passe
          const isValidPassword = await verifyPassword(
            credentials.password,
            user.motDePasse
          );

          if (!isValidPassword) {
            // === ENREGISTRER LA TENTATIVE ÉCHOUÉE ===
            const result = await recordFailedLogin(email);
            
            // Log failed attempt to system logs
            SystemLogger.warning('auth', `Échec de connexion: ${email}`, {
              email,
              remainingAttempts: result.remainingAttempts,
              blocked: result.blocked,
            });
            
            if (result.blocked) {
              throw new Error(
                `Trop de tentatives échouées. Compte bloqué pour ${result.lockoutMinutes} minutes.`
              );
            }
            
            throw new Error(
              `Identifiants incorrects. ${result.remainingAttempts} tentative(s) restante(s).`
            );
          }

          // === Gestion du 2FA ===
          const securitySettings = await getSecuritySettings();
          const is2FARequiredForRole = securitySettings.require2FA && 
            ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
          
          if (user.twoFactorEnabled || is2FARequiredForRole) {
            if (!credentials.code || credentials.code === 'undefined' || credentials.code === 'null') {
               throw new Error('2FA_REQUIRED');
            }

            const twoFACheck = check2FAAttempts(email);
            if (!twoFACheck.allowed) {
              throw new Error(`Trop de tentatives 2FA. Réessayez dans ${twoFACheck.lockoutMinutes} minutes.`);
            }

            let isValidTotp = false;
            if (user.twoFactorSecret) {
              isValidTotp = authenticator.verify({
                token: credentials.code,
                secret: user.twoFactorSecret,
              });
            }

            let isBackupCode = false;
            let updatedBackupCodes: string[] | null = null;

            if (!isValidTotp && user.twoFactorBackupCodes) {
              try {
                const hashedBackupCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
                const formattedCode = credentials.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
                
                for (let i = 0; i < hashedBackupCodes.length; i++) {
                  const isMatch = await bcrypt.compare(formattedCode, hashedBackupCodes[i]);
                  if (isMatch) {
                    isBackupCode = true;
                    isValidTotp = true;
                    updatedBackupCodes = [...hashedBackupCodes];
                    updatedBackupCodes.splice(i, 1);
                    break;
                  }
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }

            if (!isValidTotp) {
              const failResult = record2FAFailure(email);
              if (!failResult.allowed) {
                throw new Error(`Trop de tentatives 2FA. Compte bloqué pour ${failResult.lockoutMinutes} minutes.`);
              }
              throw new Error(`Code de vérification incorrect. ${failResult.attemptsRemaining} tentative(s) restante(s).`);
            }

            reset2FAAttempts(email);

            if (isBackupCode && updatedBackupCodes) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  twoFactorBackupCodes: JSON.stringify(updatedBackupCodes),
                }
              });
            }
          }

          // === RÉINITIALISER LES TENTATIVES APRÈS SUCCÈS ===
          await resetLoginAttempts(user.id);

          await prisma.user.update({
            where: { id: user.id },
            data: { derniereConnexion: new Date() },
          });

          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: 'LOGIN_SUCCESS',
              entity: 'User',
              entityId: user.id,
              details: { ip: 'N/A', userAgent: 'N/A' },
            },
          });

          return {
            id: String(user.id),
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            role: user.role,
            photo: user.photo,
            secteurResponsable: user.secteurResponsable,
            communeResponsableId: user.communeResponsableId,
            etablissementsGeres: user.etablissementsGeres,
            isActive: user.isActive,
            isEmailVerifie: user.isEmailVerifie,
          };
        } catch (error: any) {
          console.error('[AUTH_ERROR]', error.message);
          
          // Si c'est une erreur métier connue (ex: "Account Locked" ou "Identifiants incorrects"), on la propage
          if (error.message && (
            error.message.includes('requis') ||
            error.message.includes('Identifiants incorrects') ||
            error.message.includes('bloqué') ||
            error.message.includes('désactivé') ||
            error.message.includes('2FA')
          )) {
             throw error;
          }

          // Sinon, c'est une erreur technique (ex: Prisma DB down)
          // ON MASQUE L'ERREUR TECHNIQUE pour l'utilisateur
          throw new Error('Service temporairement indisponible. Veuillez réessayer.');
        }
      },
    }),
  ],

  // Stratégie JWT avec durée depuis les settings
  session: {
    strategy: 'jwt',
    maxAge: parseInt(process.env.JWT_MAX_AGE || '86400'), // 24 heures par défaut
  },

  // Configuration JWT
  jwt: {
    maxAge: parseInt(process.env.JWT_MAX_AGE || '86400'),
  },

  // Pages personnalisées
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
  },

  // Callbacks
  callbacks: {
    /**
     * Callback JWT : appelé à chaque création/mise à jour de token
     */
    async jwt({ token, user, trigger, session }) {
      // Premier login : ajouter les données utilisateur au token
      if (user) {
        const authUser = user as AuthUser;
        token.id = authUser.id;
        token.email = authUser.email;
        token.nom = authUser.nom;
        token.prenom = authUser.prenom;
        token.role = authUser.role;
        token.photo = authUser.photo;
        token.secteurResponsable = authUser.secteurResponsable;
        token.communeResponsableId = authUser.communeResponsableId;
        token.etablissementsGeres = authUser.etablissementsGeres;
        token.isActive = authUser.isActive;
        token.isEmailVerifie = authUser.isEmailVerifie;
      }

      // Mise à jour de session (useSession().update())
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      return token;
    },

    /**
     * Callback Session : transforme le token en session côté client
     */
    async session({ session, token }) {
      const authToken = token as AuthToken;

      session.user = {
        id: authToken.id,
        email: authToken.email!,
        nom: authToken.nom,
        prenom: authToken.prenom,
        role: authToken.role,
        photo: authToken.photo,
        secteurResponsable: authToken.secteurResponsable,
        communeResponsableId: authToken.communeResponsableId,
        etablissementsGeres: authToken.etablissementsGeres,
        isActive: authToken.isActive,
        isEmailVerifie: authToken.isEmailVerifie,
      } as AuthUser;

      return session;
    },
  },

  // Événements (pour logging)
  events: {
    async signIn({ user }) {
      console.log(`[AUTH] Connexion: ${user.email}`);
      SystemLogger.info('auth', `Connexion réussie: ${user.email}`, { userId: user.id });
    },
    async signOut({ token }) {
      console.log(`[AUTH] Déconnexion: ${token?.email}`);
      SystemLogger.info('auth', `Déconnexion: ${token?.email || 'unknown'}`);
    },
  },

  // SECURITY FIX (Context7): Explicit Cookie Policy
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https') ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL?.startsWith('https'),
      },
    },
  },

  // Activation du mode debug (Désactivé par défaut pour sécurité)
  debug: process.env.NEXTAUTH_DEBUG === 'true',

  // Secret pour signer les tokens
  secret: process.env.NEXTAUTH_SECRET,
};

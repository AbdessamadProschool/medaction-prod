import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { AuthToken, AuthUser } from '@/lib/auth/types';

/**
 * Configuration NextAuth.js avec stratégie JWT
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Identifiants',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'votre@email.com',
        },
        password: {
          label: 'Mot de passe',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        // Rechercher l'utilisateur par email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            motDePasse: true,
            role: true,
            photo: true,
            secteurResponsable: true,
            etablissementId: true,
            isActive: true,
            isEmailVerifie: true,
          },
        });

        if (!user) {
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
          throw new Error('Identifiants incorrects');
        }

        // Mettre à jour la dernière connexion
        await prisma.user.update({
          where: { id: user.id },
          data: { derniereConnexion: new Date() },
        });

        // Retourner l'utilisateur pour le token
        return {
          id: String(user.id),
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          photo: user.photo,
          secteurResponsable: user.secteurResponsable,
          etablissementId: user.etablissementId,
          isActive: user.isActive,
          isEmailVerifie: user.isEmailVerifie,
        };
      },
    }),
  ],

  // Stratégie JWT
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
    error: '/login', // Redirection en cas d'erreur
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
        token.etablissementId = authUser.etablissementId;
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
        etablissementId: authToken.etablissementId,
        isActive: authToken.isActive,
        isEmailVerifie: authToken.isEmailVerifie,
      } as AuthUser;

      return session;
    },
  },

  // Événements (optionnel pour logging)
  events: {
    async signIn({ user }) {
      console.log(`[AUTH] Connexion: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`[AUTH] Déconnexion: ${token?.email}`);
    },
  },

  // Activation du mode debug en développement
  debug: process.env.NODE_ENV === 'development',

  // Secret pour signer les tokens
  secret: process.env.NEXTAUTH_SECRET,
};

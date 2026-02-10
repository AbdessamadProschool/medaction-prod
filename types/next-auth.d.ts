import { Role, Secteur } from '@/lib/auth/types';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      nom: string;
      prenom: string;
      role: Role;
      photo?: string | null;
      secteurResponsable?: Secteur | null;
      communeResponsableId?: number | null;  // Pour AUTORITE_LOCALE
      etablissementsGeres?: number[];        // Pour COORDINATEUR_ACTIVITES
      isActive: boolean;
      isEmailVerifie: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: Role;
    photo?: string | null;
    secteurResponsable?: Secteur | null;
    communeResponsableId?: number | null;
    etablissementsGeres?: number[];
    isActive: boolean;
    isEmailVerifie: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: Role;
    photo?: string | null;
    secteurResponsable?: Secteur | null;
    communeResponsableId?: number | null;
    etablissementsGeres?: number[];
    isActive: boolean;
    isEmailVerifie: boolean;
  }
}

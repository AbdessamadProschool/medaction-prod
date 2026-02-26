import { z } from 'zod';

export const talentSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  nomArtistique: z.string().optional(),
  bio: z.string().optional(),
  domaine: z.string().min(2, "Le domaine est requis"),
  photo: z.string().optional(),
  reseauxSociaux: z.record(z.string(), z.string()).optional(),
  isPublie: z.boolean().optional(),
  isMisEnAvant: z.boolean().optional(),
});

export type TalentInput = z.infer<typeof talentSchema>;

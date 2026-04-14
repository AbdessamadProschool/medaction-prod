import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { sanitizeString } from '@/lib/security/validation';

// Schéma de validation
const contactSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").transform(sanitizeString),
  email: z.string().email("Email invalide").transform(val => val.toLowerCase().trim()),
  sujet: z.string().min(3, "Le sujet doit contenir au moins 3 caractères").transform(sanitizeString),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(1000, "Message trop long").transform(sanitizeString)
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    // 1. Validation des entrées
    const validation = contactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { nom, email, sujet, message } = validation.data;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 2. Rate Limiting (3 messages/mois)
    let userId: number | undefined;
    
    // Si connecté, on utilise l'ID utilisateur
    if (session?.user?.id) {
       userId = parseInt(session.user.id as string);
       
       if (!isNaN(userId)) {
         try {
           const count = await prisma.contactMessage.count({
             where: {
               userId: userId,
               createdAt: { gte: startOfMonth }
             }
           });
           
           if (count >= 3) {
             return NextResponse.json(
               { error: 'LIMIT_EXCEEDED', resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString() }, 
               { status: 429 } 
             );
           }
         } catch (e) {
           console.error("DB Count Error", e);
           // On continue si erreur DB (fallback simulé plus bas si save échoue)
         }
       }
    } else {
       // Si invité, on limite par email pour éviter le spam simple
       try {
         const count = await prisma.contactMessage.count({
            where: {
              email: email,
              createdAt: { gte: startOfMonth }
            }
         });
         
         if (count >= 3) {
            return NextResponse.json(
              { error: 'LIMIT_EXCEEDED', resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString() }, 
              { status: 429 }
            );
         }
       } catch (e) {
         console.error("DB Count Error", e);
       }
    }

    // 3. Sauvegarde
    const newMessage = await prisma.contactMessage.create({
      data: {
        nom,
        email,
        sujet,
        message,
        userId: userId,
        isRead: false
      }
    });

    return NextResponse.json({ success: true, id: newMessage.id });

  } catch (error) {
    console.error('Erreur API Contact:', error);
    return NextResponse.json(
      { error: 'Une erreur interne est survenue. Veuillez réessayer plus tard.' }, 
      { status: 500 }
    );
  }
}

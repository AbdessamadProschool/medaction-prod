import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/dev/seed-superadmin - Créer un Super Admin pour les tests
export async function POST() {
  try {
    // Vérifier si on est en développement
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Cette route est désactivée en production' },
        { status: 403 }
      );
    }

    const email = 'superadmin@medaction.ma';
    const password = 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Vérifier si le super admin existe déjà
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      // S'assurer que le rôle est bien SUPER_ADMIN
      if (existing.role !== 'SUPER_ADMIN') {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: 'SUPER_ADMIN', isActive: true },
        });
      }

      return NextResponse.json({
        message: 'Super Admin existe déjà',
        email,
        password,
        id: existing.id,
        loginUrl: '/login',
        superAdminUrl: '/super-admin',
      });
    }

    // Créer le super admin
    const superAdmin = await prisma.user.create({
      data: {
        email,
        motDePasse: hashedPassword,
        nom: 'Admin',
        prenom: 'Super',
        telephone: '+212600000000',
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerifie: true,
      },
    });

    return NextResponse.json({
      message: 'Super Admin créé avec succès!',
      email,
      password,
      id: superAdmin.id,
      loginUrl: '/login',
      superAdminUrl: '/super-admin',
    });

  } catch (error) {
    console.error('Erreur seed super admin:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du Super Admin' },
      { status: 500 }
    );
  }
}

// GET - Pour faciliter l'accès
export async function GET() {
  return POST();
}

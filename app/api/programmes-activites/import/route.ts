import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

interface ImportRow {
  date: string;
  heureDebut: string;
  heureFin: string;
  titre: string;
  description?: string;
  typeActivite: string;
  etablissementId: string;
  lieu?: string;
  participantsAttendus?: string;
  responsableNom?: string;
}

interface ImportError {
  row: number;
  message: string;
}

// POST - Importer des programmes d'activités en masse
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les permissions
    const allowedRoles = ['COORDINATEUR_ACTIVITES', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Seuls les coordinateurs et administrateurs peuvent importer des programmes' 
      }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Lire le contenu du fichier
    const content = await file.text();
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      return NextResponse.json({ 
        error: 'Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données' 
      }, { status: 400 });
    }

    // Parser les en-têtes
    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
    
    // Vérifier les colonnes requises
    const requiredColumns = ['date', 'heureDebut', 'heureFin', 'titre', 'typeActivite', 'etablissementId'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Colonnes manquantes: ${missingColumns.join(', ')}` 
      }, { status: 400 });
    }

    // Parser les données
    const today = new Date().toISOString().split('T')[0];
    const errors: ImportError[] = [];
    const successfulImports: any[] = [];
    const userId = parseInt(session.user.id);

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const rowNumber = i + 1;

      try {
        // Validation
        if (!row.date) {
          errors.push({ row: rowNumber, message: 'Date manquante' });
          continue;
        }
        if (!row.titre || row.titre.length < 5) {
          errors.push({ row: rowNumber, message: 'Titre manquant ou trop court (min 5 caractères)' });
          continue;
        }
        if (!row.heureDebut || !row.heureFin) {
          errors.push({ row: rowNumber, message: 'Heures de début/fin manquantes' });
          continue;
        }
        if (!row.typeActivite) {
          errors.push({ row: rowNumber, message: 'Type d\'activité manquant' });
          continue;
        }
        if (!row.etablissementId || isNaN(parseInt(row.etablissementId))) {
          errors.push({ row: rowNumber, message: 'ID établissement invalide' });
          continue;
        }

        // Vérifier la date (doit être aujourd'hui ou dans le futur)
        if (row.date < today) {
          errors.push({ row: rowNumber, message: 'La date doit être aujourd\'hui ou dans le futur' });
          continue;
        }

        // Vérifier l'heure
        if (row.heureFin <= row.heureDebut) {
          errors.push({ row: rowNumber, message: 'L\'heure de fin doit être après l\'heure de début' });
          continue;
        }

        // Vérifier que l'établissement existe
        const etablissementId = parseInt(row.etablissementId);
        const etablissement = await prisma.etablissement.findUnique({
          where: { id: etablissementId },
          select: { id: true }
        });

        if (!etablissement) {
          errors.push({ row: rowNumber, message: `Établissement ${etablissementId} non trouvé` });
          continue;
        }

        // Créer le programme
        const programme = await prisma.programmeActivite.create({
          data: {
            etablissementId,
            date: new Date(row.date),
            heureDebut: row.heureDebut,
            heureFin: row.heureFin,
            titre: row.titre,
            description: row.description || null,
            typeActivite: row.typeActivite,
            lieu: row.lieu || null,
            participantsAttendus: row.participantsAttendus ? parseInt(row.participantsAttendus) : null,
            responsableNom: row.responsableNom || null,
            statut: 'PLANIFIEE',
            isVisiblePublic: false,
            isValideParAdmin: false,
            createdBy: userId,
          }
        });

        successfulImports.push(programme);
      } catch (rowError: any) {
        errors.push({ row: rowNumber, message: rowError.message || 'Erreur inconnue' });
      }
    }

    return NextResponse.json({
      success: successfulImports.length,
      errors,
      total: lines.length - 1,
      message: `${successfulImports.length} programme(s) importé(s) avec succès`
    });

  } catch (error: any) {
    console.error('Erreur import programmes:', error);
    return NextResponse.json({ 
      error: error.message || 'Erreur serveur lors de l\'import' 
    }, { status: 500 });
  }
}

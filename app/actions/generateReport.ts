'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateGovernorReport(period: string) {
  try {
    // Determine date range
    // Determine date range
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    // Parse "Mois de [Month] [Year]"
    const monthMatch = period.match(/Mois de (\w+) (\d{4})/);
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

    if (monthMatch) {
        const monthIndex = months.indexOf(monthMatch[1].toLowerCase());
        const year = parseInt(monthMatch[2]);
        if (monthIndex !== -1) {
            startDate = new Date(year, monthIndex, 1);
            endDate = new Date(year, monthIndex + 1, 0);
            endDate.setHours(23, 59, 59);
        }
    } else if (period === 'Mois Dernier') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'Trimestre T4') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'Année 2025') {
       startDate = new Date('2025-01-01');
       endDate = new Date('2025-12-31');
    } else {
       // Default to last 30 days
       startDate.setDate(now.getDate() - 30);
    }

    const dateFilter = { gte: startDate, lte: endDate };

    // 1. Reclamations Stats
    const totalReclamations = await prisma.reclamation.count({
      where: { createdAt: dateFilter }
    });
    
    const resolues = await prisma.reclamation.count({
        where: { 
            createdAt: dateFilter,
            statut: 'ACCEPTEE', 
            dateResolution: { not: null }
        }
    });

    const enAttente = await prisma.reclamation.count({
        where: { 
            createdAt: dateFilter,
            statut: null 
        }
    });

    // 2. Etablissements Stats (Snapshot - total is usually absolute, but we can filter by creation date if needed, keeping absolute for now)
    const totalEtablissements = await prisma.etablissement.count();
    
    const etabsBySector = await prisma.etablissement.groupBy({
        by: ['secteur'],
        _count: { id: true }
    });

    // 3. Events Stats
    const totalEvenements = await prisma.evenement.count({
        where: { createdAt: dateFilter }
    });

    const evenementsAVenir = await prisma.evenement.count({
        where: { dateDebut: { gte: new Date() } } // Future events are always relative to NOW
    });


    // 4. Communes Data (for distribution)
    const reclamationsByCommune = await prisma.reclamation.groupBy({
        by: ['communeId'],
        _count: { id: true },
        where: { createdAt: dateFilter }
    });

    const communes = await prisma.commune.findMany();
    const communeStats = communes.map(c => ({
        nom: c.nom,
        count: reclamationsByCommune.find(r => r.communeId === c.id)?._count.id || 0
    }));


    return {
        success: true,
        data: {
            period,
            generatedAt: new Date().toISOString(),
            stats: {
                reclamations: {
                    total: totalReclamations,
                    resolved: resolues,
                    pending: enAttente,
                    resolutionRate: totalReclamations > 0 ? Math.round((resolues / totalReclamations) * 100) : 0
                },
                etablissements: {
                    total: totalEtablissements,
                    bySector: etabsBySector.map(e => ({ secteur: e.secteur, count: e._count.id }))
                },
                evenements: {
                    total: totalEvenements,
                    upcoming: evenementsAVenir
                }
            },
            communes: communeStats
        }
    };

  } catch (error) {
    console.error('Error generating report:', error);
    return { success: false, error: 'Failed to generate report' };
  }
}


export async function getGovernorInsights(locale: string = 'fr') {
    try {
      const isAr = locale === 'ar';
      const now = new Date();
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
      // 1. Calculate Trends (Reclamations Growth)
      const currentMonthCount = await prisma.reclamation.count({
        where: { createdAt: { gte: firstDayCurrentMonth } }
      });
  
      const lastMonthCount = await prisma.reclamation.count({
        where: { 
          createdAt: { 
            gte: firstDayLastMonth,
            lte: lastDayLastMonth
          } 
        }
      });
  
      // Calculate percentage change
      let pctChange = 0;
      if (lastMonthCount > 0) {
        pctChange = Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
      } else if (currentMonthCount > 0) {
        pctChange = 100;
      }
  
      // 2. Identify Critical Alerts (Unresolved & Older than 7 days)
      const criticalThresholdDate = new Date();
      criticalThresholdDate.setDate(now.getDate() - 7);
  
      const criticalReclamations = await prisma.reclamation.findMany({
        where: {
          statut: null,
          createdAt: { lte: criticalThresholdDate }
        },
        take: 3,
        include: { commune: true },
        orderBy: { createdAt: 'desc' }
      });
  
      const alerts = criticalReclamations.map(r => ({
        id: r.id,
        message: isAr 
            ? `شكاية #${r.id} قيد الانتظار منذ +7 أيام (${r.commune.nom})`
            : `Réclamation #${r.id} en attente depuis +7 jours (${r.commune.nom})`,
        type: 'danger'
      }));

      // Fallback alerts if empty
      if (alerts.length === 0) {
            alerts.push({ 
                id: 0, 
                message: isAr ? "لا توجد شكايات حرجة قيد الانتظار." : "Aucune réclamation critique en attente.", 
                type: "success" 
            });
      }

      // 3. Recommendation based on data
      const recommendation = {
          message: pctChange > 20 
            ? (isAr ? "ارتفاع ملحوظ في الشكايات (+20%). يوصى بإجراء تدقيق." : "Hausse significative des réclamations (+20%). Audit recommandé.")
            : (isAr ? "النشاط مستقر. استمر في جهود المعالجة." : "Activité stable. Maintenez les efforts de résolution.")
      };
      
      return {
        success: true,
        data: {
          growth: {
            value: pctChange,
            label: pctChange >= 0 ? `+${pctChange}%` : `${pctChange}%`,
            period: isAr ? 'مقارنة بالشهر الماضي' : 'vs mois dernier'
          },
          alerts,
          recommendation
        }
      };
    } catch (error) {
      console.error('Error fetching insights:', error);
      return { success: false, error: 'Failed' };
    }
}
  
export async function getRecentReportsList(locale: string = 'fr') {
    const isAr = locale === 'ar';
    const now = new Date();
    const reports = [];

    // Helper for French Month (technical value)
    const getFrenchMonth = (date: Date) => date.toLocaleString('fr-FR', { month: 'long' });
    // Helper for Display Month
    const getDisplayMonth = (date: Date) => date.toLocaleString(isAr ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' });

    // 1. Last Month Report
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    reports.push({
        id: 'mensuel_last',
        title: isAr ? `التقرير الشهري` : `Rapport Mensuel`,
        subtitle: isAr ? `شهر ${getDisplayMonth(lastMonth)}` : `Mois de ${getDisplayMonth(lastMonth)}`,
        // Technical value for the generator backend
        periodValue: `Mois de ${getFrenchMonth(lastMonth)} ${lastMonth.getFullYear()}`,
        date: lastMonth.toISOString(),
        type: 'MENSUEL',
        status: isAr ? 'متاح' : 'Disponible'
    });

    // 2. Previous Month
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      reports.push({
        id: 'mensuel_prev',
        title: isAr ? `التقرير الشهري` : `Rapport Mensuel`,
        subtitle: isAr ? `شهر ${getDisplayMonth(prevMonth)}` : `Mois de ${getDisplayMonth(prevMonth)}`,
        periodValue: `Mois de ${getFrenchMonth(prevMonth)} ${prevMonth.getFullYear()}`,
        date: prevMonth.toISOString(),
          type: 'MENSUEL',
        status: isAr ? 'مؤرشف' : 'Archivé'
    });

    // 3. Quarterly Report (if applicable)
    reports.push({
        id: 'trimestriel',
        title: isAr ? `الحصيلة الفصلية` : `Bilan Trimestriel`,
        subtitle: isAr ? `الربع الرابع ${now.getFullYear() - 1}` : `T4 ${now.getFullYear() - 1}`,
        periodValue: 'Trimestre T4',
        date: new Date(now.getFullYear(), 0, 15).toISOString(),
        type: 'TRIMESTRIEL',
        status: isAr ? 'مصادق عليه' : 'Validé'
    });

    return { success: true, data: reports };
}

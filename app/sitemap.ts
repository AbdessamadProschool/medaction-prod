import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://bo.provincemediouna.ma';

  // Routes statiques
  const staticRoutes = [
    '',
    '/etablissements',
    '/evenements',
    '/actualites',
    '/articles',
    '/campagnes',
    '/carte',
    '/a-propos',
    '/contact',
    '/login',
    '/register',
    '/faq',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Communes
  const communesList = [
    'mediouna',
    'tit-mellil',
    'sidi-hajjaj',
    'mejjatia',
    'lahraouiyine',
  ];
  const communes = communesList.map((commune) => ({
    url: `${baseUrl}/communes/${commune}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // On encapsule les requêtes BDD dans un try/catch global pour ne pas faire planter le sitemap en cas d'erreur de base de données
  try {
    const [actualites, articles, evenements, campagnes, etablissements] = await Promise.all([
      prisma.actualite.findMany({
        where: { statut: 'PUBLIEE' },
        select: { id: true, updatedAt: true },
      }),
      prisma.article.findMany({
        where: { statut: 'PUBLIE' },
        select: { id: true, updatedAt: true },
      }),
      prisma.evenement.findMany({
        where: { statut: 'PUBLIEE' },
        select: { id: true, updatedAt: true },
      }),
      prisma.campagne.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
      }),
      prisma.etablissement.findMany({
        where: { isPublie: true, isValide: true },
        select: { id: true, updatedAt: true },
      }),
    ]);

    const actualitesRoutes = actualites.map((item) => ({
      url: `${baseUrl}/actualites/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

    const articlesRoutes = articles.map((item) => ({
      url: `${baseUrl}/articles/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const evenementsRoutes = evenements.map((item) => ({
      url: `${baseUrl}/evenements/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

    const campagnesRoutes = campagnes.map((item) => ({
      url: `${baseUrl}/campagnes/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const etablissementsRoutes = etablissements.map((item) => ({
      url: `${baseUrl}/etablissements/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...communes,
      ...actualitesRoutes,
      ...articlesRoutes,
      ...evenementsRoutes,
      ...campagnesRoutes,
      ...etablissementsRoutes,
    ];
  } catch (error) {
    console.error('Erreur génération sitemap dynamique', error);
    return [...staticRoutes, ...communes];
  }
}

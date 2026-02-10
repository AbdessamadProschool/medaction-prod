import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://medaction.ma';

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
  const communes = [
    'mediouna',
    'tit-mellil',
    'sidi-hajjaj',
    'mejjatia',
    'lahraouiyine',
  ].map((commune) => ({
    url: `${baseUrl}/communes/${commune}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...communes];
}

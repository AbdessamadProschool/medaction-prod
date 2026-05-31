import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getTranslations } from 'next-intl/server';
import ArticleSchema from '@/components/seo/ArticleSchema';

type Props = {
  params: Promise<{ id: string; locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  
  const actualite = await prisma.actualite.findUnique({
    where: { id: parseInt(id) },
    include: {
      medias: {
        where: { type: 'IMAGE' },
        take: 1
      }
    }
  });

  if (!actualite) {
    return {
      title: 'Actualité introuvable | Portail Médiouna'
    };
  }

  const title = locale === 'ar' && actualite.titreAr ? actualite.titreAr : actualite.titre;
  const description = locale === 'ar' && actualite.descriptionAr ? actualite.descriptionAr : actualite.description;
  const imageUrl = actualite.medias?.[0]?.urlPublique || '/images/logo-portal-mediouna.png';

  return {
    title: `${title} | Portail Médiouna`,
    description: description || 'Actualité de la province de Médiouna',
    openGraph: {
      title: `${title} | Portail Médiouna`,
      description: description || 'Actualité de la province de Médiouna',
      url: `https://bo.provincemediouna.ma/${locale}/actualites/${id}`,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description || '',
      images: [imageUrl],
    },
  };
}

export default async function Layout({ children, params }: Props) {
  const { id, locale } = await params;
  
  const actualite = await prisma.actualite.findUnique({
    where: { id: parseInt(id) },
    include: { medias: { where: { type: 'IMAGE' }, take: 1 } }
  });

  if (!actualite) return <>{children}</>;

  const title = locale === 'ar' && actualite.titreAr ? actualite.titreAr : actualite.titre;
  const description = locale === 'ar' && actualite.descriptionAr ? actualite.descriptionAr : actualite.description;
  const imageUrl = actualite.medias?.[0]?.urlPublique || 'https://bo.provincemediouna.ma/images/logo-portal-mediouna.png';

  return (
    <>
      <ArticleSchema 
        title={title}
        description={description || title}
        imageUrl={imageUrl}
        datePublished={actualite.createdAt.toISOString()}
        dateModified={actualite.updatedAt.toISOString()}
        isNews={true}
      />
      {children}
    </>
  );
}

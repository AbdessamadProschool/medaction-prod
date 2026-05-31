import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import ArticleSchema from '@/components/seo/ArticleSchema';

type Props = {
  params: Promise<{ id: string; locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  
  const article = await prisma.article.findUnique({
    where: { id: parseInt(id) }
  });

  if (!article) {
    return {
      title: 'Article introuvable | Portail Médiouna'
    };
  }

  const title = locale === 'ar' && article.titreAr ? article.titreAr : article.titre;
  const description = locale === 'ar' && article.descriptionAr ? article.descriptionAr : article.description;
  const imageUrl = article.imagePrincipale || '/images/logo-portal-mediouna.png';

  return {
    title: `${title} | Portail Médiouna`,
    description: description || 'Article de la province de Médiouna',
    openGraph: {
      title: `${title} | Portail Médiouna`,
      description: description || 'Article de la province de Médiouna',
      url: `https://bo.provincemediouna.ma/${locale}/articles/${id}`,
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
  
  const article = await prisma.article.findUnique({
    where: { id: parseInt(id) }
  });

  if (!article) return <>{children}</>;

  const title = locale === 'ar' && article.titreAr ? article.titreAr : article.titre;
  const description = locale === 'ar' && article.descriptionAr ? article.descriptionAr : article.description;
  const imageUrl = article.imagePrincipale || 'https://bo.provincemediouna.ma/images/logo-portal-mediouna.png';

  return (
    <>
      <ArticleSchema 
        title={title}
        description={description || title}
        imageUrl={imageUrl.startsWith('http') ? imageUrl : `https://bo.provincemediouna.ma${imageUrl}`}
        datePublished={article.createdAt.toISOString()}
        dateModified={article.updatedAt.toISOString()}
        isNews={false}
      />
      {children}
    </>
  );
}

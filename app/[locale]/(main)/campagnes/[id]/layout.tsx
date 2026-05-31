import { Metadata } from 'next';
import { prisma } from '@/lib/db';

type Props = {
  params: Promise<{ id: string; locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  
  const campagne = await prisma.campagne.findUnique({
    where: { id: parseInt(id) }
  });

  if (!campagne) {
    return {
      title: 'Campagne introuvable | Portail Médiouna'
    };
  }

  const title = locale === 'ar' && campagne.titreAr ? campagne.titreAr : campagne.titre;
  const description = locale === 'ar' && campagne.descriptionAr ? campagne.descriptionAr : campagne.description;
  const imageUrl = campagne.imagePrincipale || '/images/logo-portal-mediouna.png';

  return {
    title: `${title} | Portail Médiouna`,
    description: description || 'Campagne de la province de Médiouna',
    openGraph: {
      title: `${title} | Portail Médiouna`,
      description: description || 'Campagne de la province de Médiouna',
      url: `https://bo.provincemediouna.ma/${locale}/campagnes/${id}`,
      type: 'website',
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

export default function Layout({ children }: Props) {
  return <>{children}</>;
}

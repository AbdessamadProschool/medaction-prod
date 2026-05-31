import { Metadata } from 'next';
import { prisma } from '@/lib/db';

type Props = {
  params: Promise<{ id: string; locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: parseInt(id) }
  });

  if (!etablissement) {
    return {
      title: 'Établissement introuvable | Portail Médiouna'
    };
  }

  const title = locale === 'ar' && etablissement.nomArabe ? etablissement.nomArabe : etablissement.nom;
  const description = `Découvrez l'établissement ${title} dans la province de Médiouna.`;
  const imageUrl = etablissement.photoPrincipale || '/images/logo-portal-mediouna.png';

  return {
    title: `${title} | Portail Médiouna`,
    description: description,
    openGraph: {
      title: `${title} | Portail Médiouna`,
      description: description,
      url: `https://bo.provincemediouna.ma/${locale}/etablissements/${id}`,
      type: 'profile',
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
      description: description,
      images: [imageUrl],
    },
  };
}

export default function Layout({ children }: Props) {
  return <>{children}</>;
}

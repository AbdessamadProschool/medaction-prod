import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import EventSchema from '@/components/seo/EventSchema';

type Props = {
  params: Promise<{ id: string; locale: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  
  const evenement = await prisma.evenement.findUnique({
    where: { id: parseInt(id) },
    include: {
      etablissement: true,
    }
  });

  if (!evenement) {
    return {
      title: 'Événement introuvable | Portail Médiouna'
    };
  }

  const title = locale === 'ar' && evenement.titreAr ? evenement.titreAr : evenement.titre;
  const description = locale === 'ar' && evenement.descriptionAr ? evenement.descriptionAr : evenement.description;
  const imageUrl = '/images/logo-portal-mediouna.png'; // Evénement doesn't have imagePrincipale, or maybe in medias

  return {
    title: `${title} | Portail Médiouna`,
    description: description || 'Événement de la province de Médiouna',
    openGraph: {
      title: `${title} | Portail Médiouna`,
      description: description || 'Événement de la province de Médiouna',
      url: `https://bo.provincemediouna.ma/${locale}/evenements/${id}`,
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
  
  const evenement = await prisma.evenement.findUnique({
    where: { id: parseInt(id) },
    include: { etablissement: { include: { commune: true } } }
  });

  if (!evenement) return <>{children}</>;

  const title = locale === 'ar' && evenement.titreAr ? evenement.titreAr : evenement.titre;
  const description = locale === 'ar' && evenement.descriptionAr ? evenement.descriptionAr : evenement.description;
  
  const locationName = evenement.lieu || evenement.etablissement?.nom || 'Province de Médiouna';
  const locationAddress = evenement.adresse || evenement.etablissement?.adresseComplete || 'Médiouna, Casablanca-Settat';

  return (
    <>
      <EventSchema 
        title={title}
        description={description || title}
        imageUrl="https://bo.provincemediouna.ma/images/logo-portal-mediouna.png"
        startDate={evenement.dateDebut.toISOString()}
        endDate={evenement.dateFin ? evenement.dateFin.toISOString() : undefined}
        locationName={locationName}
        locationAddress={locationAddress}
        organizerName={evenement.organisateur || 'Portail Médiouna'}
      />
      {children}
    </>
  );
}

import React from 'react';

const StructuredData = () => {
  // Schéma de l'organisation gouvernementale (Province de Médiouna)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": "Province de Médiouna - عمالة مديونة",
    "url": "https://bo.provincemediouna.ma",
    "logo": "https://bo.provincemediouna.ma/images/logo-portal-mediouna.png",
    "description": "Portail citoyen officiel de la Province de Médiouna. Gouvernance locale, événements, actualités et gestion des réclamations.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Médiouna",
      "addressRegion": "Casablanca-Settat",
      "addressCountry": "MA"
    },
    // La propriété sameAs est volontairement omise car la plateforme n'a pas encore de réseaux sociaux officiels
  };

  // Schéma du site web pour encourager la barre de recherche (Sitelinks Search Box)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Portail Mediouna",
    "url": "https://bo.provincemediouna.ma",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://bo.provincemediouna.ma/ar/actualites?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
};

export default StructuredData;

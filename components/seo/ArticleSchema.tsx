import React from 'react';

interface ArticleSchemaProps {
  title: string;
  description: string;
  imageUrl: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  isNews?: boolean;
}

const ArticleSchema = ({
  title,
  description,
  imageUrl,
  datePublished,
  dateModified,
  authorName = 'Portail Médiouna',
  isNews = false,
}: ArticleSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": isNews ? "NewsArticle" : "Article",
    "headline": title,
    "description": description,
    "image": [imageUrl],
    "datePublished": datePublished,
    "dateModified": dateModified,
    "author": {
      "@type": "Organization",
      "name": authorName
    },
    "publisher": {
      "@type": "GovernmentOrganization",
      "name": "Province de Médiouna",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bo.provincemediouna.ma/images/logo-portal-mediouna.png"
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default ArticleSchema;

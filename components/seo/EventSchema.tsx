import React from 'react';

interface EventSchemaProps {
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate?: string;
  locationName: string;
  locationAddress: string;
  organizerName?: string;
}

const EventSchema = ({
  title,
  description,
  imageUrl,
  startDate,
  endDate,
  locationName,
  locationAddress,
  organizerName = 'Portail Médiouna'
}: EventSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": title,
    "description": description,
    "image": [imageUrl],
    "startDate": startDate,
    "endDate": endDate || startDate,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": locationName,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Médiouna",
        "addressRegion": "Casablanca-Settat",
        "addressCountry": "MA",
        "streetAddress": locationAddress
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": organizerName,
      "url": "https://bo.provincemediouna.ma"
    }
  };

  // Escape script tags and HTML-sensitive characters to prevent XSS injection via JSON-LD
  const safeJsonLd = JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd }}
    />
  );
};

export default EventSchema;

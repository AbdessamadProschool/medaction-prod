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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default EventSchema;

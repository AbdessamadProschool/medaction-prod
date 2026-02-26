'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';
import L from 'leaflet';

export default function ContactMap() {
  const t = useTranslations('contact_page');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Nettoyage préventif
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (!mapContainerRef.current) return;

    // Fix icons
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const position: [number, number] = [33.45, -7.51];

    // Initialisation manuelle
    const map = L.map(mapContainerRef.current, {
      center: position,
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker(position)
      .addTo(map)
      .bindPopup(t('map_popup'));

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [t]);

  return (
    <div 
      ref={mapContainerRef} 
      className="h-full w-full rounded-2xl z-0"
      style={{ minHeight: '100%', borderRadius: '1rem' }}
    />
  );
}

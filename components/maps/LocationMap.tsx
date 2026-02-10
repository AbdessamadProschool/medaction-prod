'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapProps {
  position: { lat: number; lng: number } | null;
  onPositionChange: (lat: number, lng: number) => void;
  readonly?: boolean;
  height?: string;
}

export default function LocationMap({ 
  position, 
  onPositionChange, 
  readonly = false,
  height = 'h-64'
}: LocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Province de Médiouna - centre
  const defaultCenter: [number, number] = [33.45, -7.51];
  const defaultZoom = 12;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialiser la carte
    const map = L.map(containerRef.current, {
      center: position ? [position.lat, position.lng] : defaultCenter,
      zoom: position ? 15 : defaultZoom,
      zoomControl: true,
      dragging: !readonly ? true : true, // toujours permettre le drag de la carte
      scrollWheelZoom: !readonly,
    });

    // Utiliser les tuiles CartoDB Voyager pour un look plus moderne et professionnel
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    // Ajouter un marqueur si position existe
    if (position) {
      markerRef.current = L.marker([position.lat, position.lng], {
        draggable: !readonly
      }).addTo(map);

      if (!readonly) {
        markerRef.current.on('dragend', () => {
          const latlng = markerRef.current?.getLatLng();
          if (latlng) {
            onPositionChange(latlng.lat, latlng.lng);
          }
        });
      }
    }

    // Clic sur la carte pour placer/déplacer le marqueur (seulement si pas readonly)
    if (!readonly) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            draggable: true
          }).addTo(map);

          markerRef.current.on('dragend', () => {
            const latlng = markerRef.current?.getLatLng();
            if (latlng) {
              onPositionChange(latlng.lat, latlng.lng);
            }
          });
        }

        onPositionChange(lat, lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [readonly]);

  // Mettre à jour le marqueur quand position change
  useEffect(() => {
    if (!mapRef.current || !position) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([position.lat, position.lng]);
    } else {
      markerRef.current = L.marker([position.lat, position.lng], {
        draggable: !readonly
      }).addTo(mapRef.current);

      if (!readonly) {
        markerRef.current.on('dragend', () => {
          const latlng = markerRef.current?.getLatLng();
          if (latlng) {
            onPositionChange(latlng.lat, latlng.lng);
          }
        });
      }
    }

    mapRef.current.setView([position.lat, position.lng], 15);
  }, [position, onPositionChange, readonly]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full ${height} rounded-xl overflow-hidden border-2 border-gray-200`}
      style={{ zIndex: 0 }}
    />
  );
}

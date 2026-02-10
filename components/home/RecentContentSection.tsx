'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Clock, 
  Calendar, 
  Newspaper, 
  Megaphone, 
  ArrowRight, 
  Loader2,
  Sparkles
} from 'lucide-react';

interface ContentItem {
  id: number;
  type: 'evenement' | 'actualite' | 'campagne';
  titre: string;
  description?: string;
  imageUrl?: string;
  date: string;
  categorie?: string;
  secteur?: string;
}

const typeConfig: Record<string, { icon: any; label: string; color: string; bg: string; path: string }> = {
  evenement: { icon: Calendar, label: 'Événement', color: 'text-blue-600', bg: 'bg-blue-100', path: '/evenements' },
  actualite: { icon: Newspaper, label: 'Actualité', color: 'text-emerald-600', bg: 'bg-emerald-100', path: '/actualites' },
  campagne: { icon: Megaphone, label: 'Campagne', color: 'text-amber-600', bg: 'bg-amber-100', path: '/campagnes' },
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function RecentContentSection() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentContent = async () => {
      try {
        // Fetch events, actualites, and campagnes in parallel
        const [evtRes, actRes, campRes] = await Promise.all([
          fetch('/api/evenements?limit=5&statut=PUBLIEE'),
          fetch('/api/actualites?limit=5&isPublie=true'),
          fetch('/api/campagnes?limit=5&statut=ACTIVE'),
        ]);

        const allItems: ContentItem[] = [];

        if (evtRes.ok) {
          const evtData = await evtRes.json();
          const events = evtData.data || evtData.evenements || evtData || [];
          (Array.isArray(events) ? events : []).forEach((e: any) => {
            if (e && e.id) {
              allItems.push({
                id: e.id,
                type: 'evenement',
                titre: e.titre,
                description: e.description?.substring(0, 100),
                imageUrl: e.imageUrl || e.medias?.[0]?.urlPublique,
                date: e.createdAt || e.dateDebut,
                categorie: e.typeCategorique,
                secteur: e.secteur,
              });
            }
          });
        }

        if (actRes.ok) {
          const actData = await actRes.json();
          const actualites = actData.data || actData.actualites || actData || [];
          (Array.isArray(actualites) ? actualites : []).forEach((a: any) => {
            if (a && a.id) {
              allItems.push({
                id: a.id,
                type: 'actualite',
                titre: a.titre,
                description: a.extrait || a.contenu?.substring(0, 100),
                imageUrl: a.imageUrl || a.medias?.[0]?.urlPublique,
                date: a.datePublication || a.createdAt,
                categorie: a.categorie,
              });
            }
          });
        }

        if (campRes.ok) {
          const campData = await campRes.json();
          const campagnes = campData.data || campData.campagnes || campData || [];
          (Array.isArray(campagnes) ? campagnes : []).forEach((c: any) => {
            if (c && c.id) {
              allItems.push({
                id: c.id,
                type: 'campagne',
                titre: c.titre,
                description: c.description?.substring(0, 100),
                imageUrl: c.imageUrl || c.imagePrincipale || c.medias?.[0]?.urlPublique,
                date: c.createdAt || c.dateDebut,
              });
            }
          });
        }

        // Sort by date (most recent first)
        allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setItems(allItems.slice(0, 8));
      } catch (error) {
        console.error('Erreur chargement contenus récents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentContent();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gov-blue mx-auto" />
          <p className="mt-4 text-gray-500">Chargement des dernières publications...</p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null; // Don't show section if no content
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-gov-blue/10 to-gov-gold/10 text-gov-blue rounded-full text-sm font-medium mb-4 border border-gov-blue/20">
            <Sparkles className="w-4 h-4 text-gov-gold" />
            Fil d'actualité
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Les dernières publications
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Retrouvez les événements, actualités et campagnes les plus récents de la Province
          </p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  href={`${config.path}/${item.id}`}
                  className="block group h-full"
                >
                  <div className="bg-white rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 overflow-hidden h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.titre}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${config.bg}`}>
                          <Icon className={`w-12 h-12 ${config.color} opacity-50`} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Type Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${config.bg} ${config.color} rounded-lg text-xs font-semibold backdrop-blur-sm`}>
                          <Icon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </div>
                      
                      {/* Time ago */}
                      <div className="absolute bottom-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/50 text-white rounded-full text-xs backdrop-blur-sm">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.date)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gov-blue transition-colors">
                        {item.titre}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {item.description}...
                        </p>
                      )}
                      {(item.categorie || item.secteur) && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {item.categorie || item.secteur}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Links */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          <Link
            href="/evenements"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <Calendar className="w-4 h-4" />
            Tous les événements
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <Newspaper className="w-4 h-4" />
            Toutes les actualités
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/campagnes"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-medium hover:bg-amber-100 transition-colors border border-amber-200"
          >
            <Megaphone className="w-4 h-4" />
            Toutes les campagnes
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

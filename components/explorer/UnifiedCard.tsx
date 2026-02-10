'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Newspaper, FileText, Megaphone } from 'lucide-react';

interface UnifiedCardProps {
  item: {
    id: number;
    type: 'event' | 'news' | 'article' | 'campaign';
    title: string;
    description: string;
    date: string;
    location: string;
    image: string | null;
    category: string | null;
    secteur: string | null;
    slug: string;
  };
}

const typeConfig = {
  event: { label: 'Événement', color: 'bg-purple-100 text-purple-700', icon: <Calendar className="w-4 h-4" /> },
  news: { label: 'Actualité', color: 'bg-blue-100 text-blue-700', icon: <Newspaper className="w-4 h-4" /> },
  article: { label: 'Article', color: 'bg-gray-100 text-gray-700', icon: <FileText className="w-4 h-4" /> },
  campaign: { label: 'Campagne', color: 'bg-orange-100 text-orange-700', icon: <Megaphone className="w-4 h-4" /> },
};

export default function UnifiedCard({ item }: UnifiedCardProps) {
  const config = typeConfig[item.type];
  const date = new Date(item.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full"
    >
      <Link href={item.slug} className="block flex-1 flex flex-col">
        {/* Image Placeholder or Real Image */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
              <span className="w-12 h-12">{config.icon}</span>
            </div>
          )}
          
          {/* Badge Type */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {date}
            </span>
            {item.location && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {item.location}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-emerald-600 transition-colors">
            {item.title}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
            {item.description}
          </p>

          {/* Footer Card */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
            {item.secteur && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                {item.secteur}
              </span>
            )}
            <span className="text-sm font-medium text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all">
              Lire la suite
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

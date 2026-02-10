import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export const metadata = {
  title: 'À propos | Médiouna Action',
  description: 'Découvrez la plateforme participative de la Province de Médiouna.',
};

export default function AboutPage() {
  const t = useTranslations('about_page');
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('title')}
          </h1>
          <p className="text-xl text-[hsl(45,93%,70%)] max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('vision_title')}</h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {t('vision_text1')}
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('vision_text2')}
            </p>
          </div>
          <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
            {/* Placeholder pour image */}
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
              <span className="text-6xl">🏙️</span>
            </div>
          </div>
        </div>

        {/* Valeurs */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t('values_title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🤝',
                title: t('values.participation.title'),
                desc: t('values.participation.desc')
              },
              {
                icon: '🔍',
                title: t('values.transparency.title'),
                desc: t('values.transparency.desc')
              },
              {
                icon: '⚡',
                title: t('values.efficiency.title'),
                desc: t('values.efficiency.desc')
              }
            ].map((valeur, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{valeur.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{valeur.title}</h3>
                <p className="text-gray-600">{valeur.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chiffres Clés (Statique pour l'instant) */}
        <div className="bg-[hsl(213,80%,28%)] rounded-3xl p-12 text-white text-center mb-20">
          <h2 className="text-3xl font-bold mb-12">{t('stats_title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '5', label: t('stats.communes') },
              { number: '200+', label: t('stats.etablissements') },
              { number: '1000+', label: t('stats.citizens') },
              { number: '24/7', label: t('stats.service') }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold text-[hsl(45,93%,47%)] mb-2">
                  {stat.number}
                </div>
                <div className="text-white/80 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

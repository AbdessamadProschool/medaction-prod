'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, CheckCircle2, Users, Zap } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';



function AnimatedNumber({ 
  value, 
  suffix, 
  inView,
  locale
}: { 
  value: number; 
  suffix: string; 
  inView: boolean;
  locale: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let startTime: number;
    const duration = 2000;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [inView, value]);

  const formatNumber = (num: number) => {
    // Utiliser le locale pour le formatage des nombres
    return num.toLocaleString(locale === 'ar' ? 'ar-MA' : 'fr-FR');
  };

  return (
    <span className={`tabular-nums ${locale === 'ar' ? 'font-cairo font-bold' : ''}`}>
      {formatNumber(displayValue)}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const t = useTranslations();
  const locale = useLocale();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const stats = [
    {
      id: 1,
      value: 137,
      suffix: '',
      label: t('stats.etablissements'),
      description: t('stats.desc_etablissements', { defaultMessage: 'Écoles, centres de santé et équipements sportifs' }),
      icon: <Building2 className="w-10 h-10" />,
      colorClass: 'from-gov-blue to-gov-blue-light',
    },
    {
      id: 2,
      value: 95,
      suffix: '%',
      label: t('stats.satisfaction'),
      description: t('stats.desc_reclamations', { defaultMessage: 'Des réclamations traitées avec succès' }),
      icon: <CheckCircle2 className="w-10 h-10" />,
      colorClass: 'from-gov-green to-gov-green-light',
    },
    {
      id: 3,
      value: 25000,
      suffix: '+',
      label: t('stats.citoyens'),
      description: t('stats.desc_citoyens', { defaultMessage: 'Participants aux initiatives locales' }),
      icon: <Users className="w-10 h-10" />,
      colorClass: 'from-gov-gold-dark to-gov-gold',
    },
    {
      id: 4,
      value: 48,
      suffix: 'h',
      label: t('stats.delai', { defaultMessage: 'Délai Moyen' }),
      description: t('stats.desc_delai', { defaultMessage: 'De réponse aux réclamations urgentes' }),
      icon: <Zap className="w-10 h-10" />,
      colorClass: 'from-gov-red to-gov-red-light',
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-gov-blue-dark via-[hsl(213,80%,20%)] to-gov-blue-dark relative overflow-hidden" dir="ltr">
      {/* Bande tricolore en haut */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gov-red via-gov-gold to-gov-green" />
      
      {/* Background Effects - Gouvernemental */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gov-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gov-green/10 rounded-full blur-3xl" />
        {/* Moroccan pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Animated Lines - Gold color */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-gov-gold/50 to-transparent"
            style={{
              top: `${20 + i * 20}%`,
              left: 0,
              right: 0,
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Section Header - Gouvernemental */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gov-gold/20 backdrop-blur-sm border border-gov-gold/30 text-gov-gold-light rounded-full text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-gov-gold rounded-full animate-pulse" />
            {t('stats.title')}
          </span>
          <h2 className={`font-semibold text-white mb-4 ${locale === 'ar' ? 'text-4xl md:text-5xl font-cairo leading-tight' : 'text-3xl md:text-4xl'}`}>
            {t('stats.subtitle')}
          </h2>
          <p className={`text-white/60 max-w-2xl mx-auto ${locale === 'ar' ? 'text-xl' : 'text-lg'}`}>
            {t('hero.slide1_description')}
          </p>
        </motion.div>

        {/* Stats Grid - Gouvernemental */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 rounded-2xl blur-xl transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--gov-gold) / 0.2), hsl(var(--gov-blue) / 0.2))`,
                }}
              />
              
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-gov-gold/50 transition-all duration-300">
                {/* Gold accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gov-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                
                {/* Icon */}
                <div className="text-4xl mb-4">{stat.icon}</div>

                {/* Value */}
                <div className={`font-bold bg-gradient-to-r ${stat.colorClass} bg-clip-text text-transparent mb-2 ${locale === 'ar' ? 'text-5xl md:text-6xl font-cairo' : 'text-4xl md:text-5xl'}`}>
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} inView={isInView} locale={locale} />
                </div>

                {/* Label */}
                <h3 className={`font-semibold text-white mb-2 ${locale === 'ar' ? 'text-2xl font-cairo' : 'text-xl'}`}>
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-sm text-white/50">
                  {stat.description}
                </p>

                {/* Decorative corner - Gold */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gov-gold to-gov-gold-light opacity-10 rounded-bl-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

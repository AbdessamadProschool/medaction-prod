'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function GovFooter() {
  const t = useTranslations();
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: '/etablissements', labelKey: 'nav.etablissements' },
    { href: '/evenements', labelKey: 'nav.evenements' },
    { href: '/actualites', labelKey: 'nav.actualites' },
    { href: '/reclamations', labelKey: 'nav.reclamations' },
    { href: '/suggestions', labelKey: 'nav.suggestions' },
  ];

  const adminLinks = [
    { href: 'https://www.idarati.ma', labelKey: 'footer.idarati', external: true },
    { href: 'https://www.watiqa.ma', labelKey: 'footer.watiqa', external: true },
  ];

  const legalLinks = [
    { href: '/politique-confidentialite', labelKey: 'footer.confidentialite' },
    { href: '/conditions-utilisation', labelKey: 'footer.conditions' },
    { href: '/accessibilite', labelKey: 'nav.accessibilite' },
  ];

  return (
    <footer className="gov-footer">
      {/* Bande tricolore */}
      <div className="gov-footer-top-strip" />
      
      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-white rounded-lg p-1 shadow-lg flex items-center justify-center overflow-hidden">
                <img
                  src="/images/logo-portal-mediouna.png"
                  alt="Portail Mediouna"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className={`text-lg font-bold text-white ${locale === 'ar' ? '' : 'font-outfit'}`}>
                  <span>PORTAIL </span>
                  <span className="text-gov-gold">MEDIOUNA</span>
                </h3>
                <p className="text-white/60 text-sm">{t('app.province')}</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              {t('footer.description')}
            </p>
            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-gov-gold rounded-full flex items-center justify-center transition-colors group">
                <Facebook size={18} className="text-white group-hover:text-gray-900" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-gov-gold rounded-full flex items-center justify-center transition-colors group">
                <Twitter size={18} className="text-white group-hover:text-gray-900" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-gov-gold rounded-full flex items-center justify-center transition-colors group">
                <Instagram size={18} className="text-white group-hover:text-gray-900" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-gov-gold rounded-full flex items-center justify-center transition-colors group">
                <Youtube size={18} className="text-white group-hover:text-gray-900" />
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gov-gold rounded-full" />
              {t('footer.liens')}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-gov-gold text-sm flex items-center gap-2 group transition-colors"
                  >
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all rtl:rotate-180" />
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens gouvernementaux */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gov-gold rounded-full" />
              {t('footer.portails')}
            </h4>
            <ul className="space-y-2">
              {adminLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-gov-gold text-sm flex items-center gap-2 group transition-colors"
                  >
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all rtl:rotate-180" />
                    {t(link.labelKey)}
                    <ExternalLink size={12} className="opacity-50" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Design amélioré */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-gov-gold rounded-full" />
              {t('footer.contact')}
            </h4>
            <div className="space-y-3">
              {/* Adresse */}
              <div className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gov-gold/20 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-gov-gold" />
                  </div>
                  <div>
                    <p className={`text-white/90 text-xs font-medium ${locale === 'ar' ? '' : 'uppercase tracking-wide'}`}>{t('footer.siege')}</p>
                    <p className="text-white/60 text-sm mt-0.5">Route 3010, Tit Mellil</p>
                  </div>
                </div>
              </div>
              
              {/* Téléphone */}
              <div className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gov-gold/20 flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-gov-gold" />
                  </div>
                  <div>
                    <p className={`text-white/90 text-xs font-medium ${locale === 'ar' ? '' : 'uppercase tracking-wide'}`}>{t('footer.telephone')}</p>
                    <p className="text-white/60 text-sm mt-0.5" dir="ltr">05 22 51 00 51</p>
                  </div>
                </div>
              </div>
              
              {/* Email */}
              <a href="mailto:contact@provincemediouna.ma" className="block bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gov-gold/20 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-gov-gold" />
                  </div>
                  <div>
                    <p className={`text-white/90 text-xs font-medium ${locale === 'ar' ? '' : 'uppercase tracking-wide'}`}>{t('footer.email')}</p>
                    <p className="text-gov-gold text-sm mt-0.5 hover:underline" dir="ltr">contact@provincemediouna.ma</p>
                  </div>
                </div>
              </a>
              
              {/* Site Web */}
              <a href="https://bo.provincemediouna.ma" target="_blank" rel="noopener noreferrer" className="block bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gov-gold/20 flex items-center justify-center flex-shrink-0">
                    <Globe size={16} className="text-gov-gold" />
                  </div>
                  <div>
                    <p className={`text-white/90 text-xs font-medium ${locale === 'ar' ? '' : 'uppercase tracking-wide'}`}>{t('footer.siteweb')}</p>
                    <p className="text-gov-gold text-sm mt-0.5 hover:underline" dir="ltr">bo.provincemediouna.ma</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Barre légale */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/50 text-sm text-center md:text-left">
              © {currentYear} {t('footer.copyright')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mention développeur */}
      <div className="bg-black/20 py-2">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/40 text-xs">
            {t('footer.developpeur')} v1.0.0
          </p>
        </div>
      </div>
    </footer>
  );
}

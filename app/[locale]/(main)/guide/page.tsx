'use client';

import { useState, useEffect, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Search, ChevronRight, ChevronLeft, Info, CheckCircle2, 
  AlertTriangle, Menu, X, ExternalLink, Eye, Map, Building2, 
  Users, Layout, Calendar, Megaphone, User, ShieldAlert, Settings, HelpCircle
} from 'lucide-react';
import Image from 'next/image';
import { guideData, GuideSection, GuideRole } from './guideData';
import { Link } from '@/i18n/navigation';

export default function GuidePage() {
  const locale = useLocale();
  const t = useTranslations('guide');
  const [activeRole, setActiveRole] = useState<string>('consulteur');
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Get data for current language (fallback to 'fr' if not found)
  const currentData = guideData[locale] || guideData['fr'];
  const activeRoleData = currentData.find(r => r.id === activeRole) || currentData[0];
  const activeSectionData = activeRoleData.sections.find(s => s.id === activeSection) || activeRoleData.sections[0];

  const handleRoleChange = (roleId: string) => {
    startTransition(() => {
      setActiveRole(roleId);
      // Select the first section of the new role
      const newRole = currentData.find(r => r.id === roleId);
      if (newRole && newRole.sections.length > 0) {
        setActiveSection(newRole.sections[0].id);
      }
    });
  };

  const handleSectionChange = (sectionId: string) => {
    startTransition(() => {
      setActiveSection(sectionId);
      setSidebarOpen(false);
    });
  };

  // Next and Previous navigation
  const currentIndex = activeRoleData.sections.findIndex(s => s.id === activeSection);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < activeRoleData.sections.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      handleSectionChange(activeRoleData.sections[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      handleSectionChange(activeRoleData.sections[currentIndex + 1].id);
    }
  };

  // Filter sections by search query
  const filteredSections = activeRoleData.sections.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.intro.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.steps?.some(step => step.title.toLowerCase().includes(searchQuery.toLowerCase()) || step.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isRtl = locale === 'ar';

  // Available roles for the guide tabs (showing progress)
  const rolesList = [
    { id: 'consulteur', label: isRtl ? 'زائر' : 'Consulteur', icon: Eye, active: true },
    { id: 'citoyen', label: isRtl ? 'مواطن' : 'Citoyen', icon: User, active: true },
    { id: 'autorite', label: isRtl ? 'سلطة محلية' : 'Autorité Locale', icon: ShieldAlert, active: true },
    { id: 'delegation', label: isRtl ? 'مندوبية' : 'Délégation', icon: Building2, active: true },
    { id: 'gouverneur', label: isRtl ? 'عامل الإقليم' : 'Gouverneur', icon: CompassIcon, active: true },
    { id: 'admin', label: isRtl ? 'مدير المنصة' : 'Admin', icon: Settings, active: true },
  ];

  function CompassIcon(props: any) {
    return <Compass {...props} />;
  }

  function Compass(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf2] text-[#0a3b68]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Immersive Header Banner */}
      <div className="bg-gradient-to-br from-[#0a3b68] to-[#05213b] py-16 relative overflow-hidden border-b-4 border-[#ebd281]">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#ebd281] rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-[#ebd281] rounded-full blur-3xl opacity-15 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-[#ebd281] font-semibold mb-3">
                <Link href="/" className="hover:underline opacity-80">{isRtl ? 'الرئيسية' : 'Accueil'}</Link>
                <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                <span>{isRtl ? 'دليل المستخدم' : 'Guide Utilisateur'}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight uppercase tracking-tight font-cairo">
                {isRtl ? 'دليل مستخدم بوابة مديونة' : 'GUIDE UTILISATEUR MEDACTION'}
              </h1>
              <p className="text-lg text-slate-300 max-w-3xl mt-2 font-medium">
                {isRtl 
                  ? 'دليل تفاعلي مصور لمساعدتكم على فهم واستخدام كافة ميزات المنصة خطوة بخطوة.' 
                  : 'Un guide interactif illustré pour vous accompagner pas à pas dans l\'utilisation de la plateforme.'}
              </p>
            </div>

            {/* Quick Interactive Search inside the Guide */}
            <div className="w-full md:w-80 relative flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder={isRtl ? 'البحث في الدليل...' : 'Rechercher dans le guide...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 text-white placeholder-slate-400 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#ebd281] focus:bg-white/15 transition-all text-sm font-semibold"
                />
                <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'} text-slate-400 pointer-events-none`}>
                  <Search size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Tabs Nav Bar */}
      <div className="bg-white border-b border-gray-200/80 sticky top-20 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 py-3">
            {rolesList.map((role) => {
              const IconComponent = role.icon;
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => role.active && handleRoleChange(role.id)}
                  disabled={!role.active}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
                    isActive 
                      ? 'bg-[#0a3b68] text-white shadow-md' 
                      : role.active
                        ? 'text-[#0a3b68] hover:bg-[#ebd281]/20'
                        : 'text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <IconComponent size={16} />
                  <span>{role.label}</span>
                  {role.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                      {role.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Layout Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Mobile Sidebar Trigger */}
          <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-200/60 mb-2">
            <span className="font-bold text-sm uppercase tracking-wide text-gray-500">
              {isRtl ? 'فهرس الدليل' : 'Sommaire'}
            </span>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-[#0a3b68]/5 rounded-lg text-[#0a3b68] hover:bg-[#0a3b68]/10 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Left Sidebar (Desktop & Mobile drawer) */}
          <AnimatePresence>
            {(sidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
              <motion.aside
                initial={typeof window !== 'undefined' && window.innerWidth < 1024 ? { opacity: 0, x: isRtl ? 300 : -300 } : {}}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRtl ? 300 : -300 }}
                className={`w-full lg:w-72 shrink-0 ${
                  typeof window !== 'undefined' && window.innerWidth < 1024 
                    ? 'fixed inset-y-0 z-50 bg-white p-6 shadow-2xl overflow-y-auto w-80' 
                    : 'hidden lg:block sticky top-36 h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar'
                }`}
                style={typeof window !== 'undefined' && window.innerWidth < 1024 ? { [isRtl ? 'right' : 'left']: 0 } : {}}
              >
                {/* Mobile close button */}
                <div className="lg:hidden flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
                  <h3 className="font-black text-lg text-[#0a3b68]">{isRtl ? 'الفهرس' : 'Sommaire'}</h3>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 hover:text-[#0a3b68]">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#ebd281] bg-[#0a3b68] px-3 py-1.5 rounded-lg mb-3 inline-block">
                      {activeRoleData.title}
                    </h4>
                    <p className="text-xs text-gray-500 font-semibold mb-4 leading-relaxed px-1">
                      {activeRoleData.description}
                    </p>
                    <nav className="space-y-1">
                      {filteredSections.map((section) => {
                        const isSelected = activeSection === section.id;
                        return (
                          <button
                            key={section.id}
                            onClick={() => handleSectionChange(section.id)}
                            className={`w-full text-start px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${
                              isSelected 
                                ? 'bg-[#ebd281] text-[#0a3b68] shadow-sm ring-1 ring-white/10' 
                                : 'text-[#0a3b68]/80 hover:bg-[#ebd281]/10 hover:text-[#0a3b68]'
                            }`}
                          >
                            <span className="truncate">{section.title}</span>
                            <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isRtl ? 'rotate-180' : ''}`} />
                          </button>
                        );
                      })}
                      {filteredSections.length === 0 && (
                        <p className="text-xs text-gray-400 italic p-3 text-center">
                          {isRtl ? 'لا توجد نتائج مطابقة' : 'Aucun résultat trouvé'}
                        </p>
                      )}
                    </nav>
                  </div>

                  {/* Quick helpful links */}
                  <div className="bg-[#0a3b68]/5 rounded-2xl p-4 border border-[#0a3b68]/10">
                    <h5 className="font-bold text-sm mb-2 flex items-center gap-2 text-[#0a3b68]">
                      <HelpCircle size={16} />
                      {isRtl ? 'هل تحتاج إلى مساعدة؟' : 'Besoin d\'aide ?'}
                    </h5>
                    <p className="text-xs text-gray-600 font-medium mb-3 leading-relaxed">
                      {isRtl 
                        ? 'إذا لم تجد الإجابة التي تبحث عنها، يمكنك الاتصال بمركز الدعم مباشرة.' 
                        : 'Si vous ne trouvez pas de réponse, contactez directement notre équipe de support.'}
                    </p>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0a3b68] hover:underline"
                    >
                      <span>{isRtl ? 'الاتصال بالإدارة' : 'Nous contacter'}</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Backdrop for mobile sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              />
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-gray-100">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Title & Metadata */}
                  <div className="border-b border-gray-100 pb-6 mb-8">
                    <div className="flex flex-wrap items-center gap-2.5 mb-3">
                      <span className="px-3 py-1 bg-[#0a3b68]/15 text-[#0a3b68] text-[10px] font-extrabold uppercase tracking-wider rounded-md">
                        {activeRoleData.title}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400 font-semibold">
                        {isRtl ? 'تحديث: يونيو 2026' : 'Mise à jour: Juin 2026'}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400 font-semibold">
                        {isRtl ? '4 دقائق قراءة' : 'Lecture: 4 min'}
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-[#0a3b68] leading-tight uppercase font-cairo">
                      {activeSectionData.title}
                    </h2>
                    <p className="text-lg text-amber-600 font-bold mt-1.5 font-outfit">
                      {activeSectionData.subtitle}
                    </p>
                  </div>

                  {/* Intro Text */}
                  <p className="text-base md:text-lg text-slate-700 leading-relaxed font-semibold mb-8 text-justify">
                    {activeSectionData.intro}
                  </p>

                  {/* Screenshot Display */}
                  {activeSectionData.image && (
                    <div className="relative mb-10 group rounded-2xl overflow-hidden shadow-md border border-gray-200/60 max-w-3xl mx-auto aspect-[16/10] bg-slate-900 flex items-center justify-center">
                      <Image
                        src={activeSectionData.image}
                        alt={activeSectionData.title}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        sizes="(max-width: 1024px) 100vw, 768px"
                      />
                      
                      {/* Zoom Lightbox Action Button */}
                      <button 
                        onClick={() => setLightboxImage(activeSectionData.image || null)}
                        className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300"
                      >
                        <span className="px-5 py-2.5 bg-[#ebd281] text-[#0a3b68] text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <Eye size={14} />
                          {isRtl ? 'تكبير الصورة' : 'Agrandir l\'image'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Steps Guide */}
                  {activeSectionData.steps && activeSectionData.steps.length > 0 && (
                    <div className="space-y-6 mb-8">
                      <h3 className="text-xl font-bold text-[#0a3b68] flex items-center gap-2.5 mb-4 font-cairo">
                        <span className="w-1.5 h-6 bg-[#ebd281] rounded-full" />
                        {isRtl ? 'خطوات الاستخدام والتصفح' : 'Instructions pas à pas'}
                      </h3>
                      <div className="grid gap-6">
                        {activeSectionData.steps.map((step, idx) => (
                          <div 
                            key={idx}
                            className="flex gap-4 p-5 rounded-2xl bg-[#0a3b68]/5 border border-[#0a3b68]/10 hover:border-[#ebd281]/40 hover:bg-[#ebd281]/5 transition-colors duration-200"
                          >
                            <div className="shrink-0 w-8 h-8 rounded-full bg-[#ebd281] flex items-center justify-center text-[#0a3b68] font-black text-sm shadow-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-[#0a3b68] text-base mb-1.5">
                                {step.title}
                              </h4>
                              <p className="text-sm text-slate-600 font-semibold leading-relaxed text-justify">
                                {step.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning and Callouts */}
                  {activeSectionData.alerts && activeSectionData.alerts.length > 0 && (
                    <div className="space-y-4 mb-8">
                      {activeSectionData.alerts.map((alert, idx) => {
                        const isInfo = alert.type === 'info';
                        const isSuccess = alert.type === 'success';
                        const isWarning = alert.type === 'warning';
                        return (
                          <div 
                            key={idx}
                            className={`gov-alert ${
                              isInfo ? 'gov-alert-info' : isSuccess ? 'gov-alert-success' : 'gov-alert-warning'
                            } rounded-2xl p-5 border shadow-sm`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {isInfo && <Info className="w-5 h-5" />}
                              {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                              {isWarning && <AlertTriangle className="w-5 h-5" />}
                            </div>
                            <p className="text-sm font-semibold leading-relaxed">
                              {alert.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Navigation Footer */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-8 mt-10">
                    <button
                      onClick={handlePrev}
                      disabled={!hasPrev}
                      className={`px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                        hasPrev 
                          ? 'text-[#0a3b68] hover:bg-[#0a3b68]/5 hover:border-[#0a3b68] active:scale-[0.98]' 
                          : 'text-gray-300 border-gray-100 cursor-not-allowed'
                      }`}
                    >
                      <ChevronLeft size={16} className={isRtl ? 'rotate-180' : ''} />
                      {isRtl ? 'السابق' : 'Précédent'}
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={!hasNext}
                      className={`px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                        hasNext 
                          ? 'bg-[#0a3b68] text-white hover:bg-[#072a4c] shadow-md hover:shadow-lg active:scale-[0.98]' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isRtl ? 'التالي' : 'Suivant'}
                      <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
                    </button>
                  </div>

                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* Lightbox Zoom Portal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-[#0a3b68]/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setLightboxImage(null)} 
              className="absolute top-6 right-6 text-white/60 hover:text-white p-2.5 bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={lightboxImage}
                alt="Agrandissement"
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Search, ChevronRight, ChevronLeft, Info, CheckCircle2, 
  AlertTriangle, Menu, X, ExternalLink, Eye, Map, Building2, 
  Users, Layout, Calendar, Megaphone, User, ShieldAlert, Settings, HelpCircle, Lock
} from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { guideData, GuideSection, GuideRole } from './guideData';
import { Link } from '@/i18n/navigation';

export default function GuidePage() {
  const locale = useLocale();
  const t = useTranslations('guide');
  const { data: session } = useSession();
  
  const [activeRole, setActiveRole] = useState<string>('consulteur');
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const screenshotContainerRef = useRef<HTMLDivElement>(null);

  const userRole = session?.user?.role || 'CONSULTEUR';

  // Auto-scroll the screenshot container to center the active spotlight
  useEffect(() => {
    if (screenshotContainerRef.current && activeStepHighlight) {
      const container = screenshotContainerRef.current;
      const topPercent = parseFloat(activeStepHighlight.top);
      if (!isNaN(topPercent)) {
        const timer = setTimeout(() => {
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const targetScrollTop = (scrollHeight * (topPercent / 100)) - (clientHeight / 2);
          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
          });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [activeStepIndex, activeSection, activeStepHighlight]);
  const isRtl = locale === 'ar';

  // Get data for current language (fallback to 'fr' if not found)
  const currentData = guideData[locale] || guideData['fr'];
  
  // Available roles for the guide tabs (filtered by user session role)
  const allRolesList = [
    { id: 'consulteur', label: isRtl ? 'زائر' : 'Consulteur', icon: Eye, roleRequired: 'CONSULTEUR' },
    { id: 'citoyen', label: isRtl ? 'مواطن' : 'Citoyen', icon: User, roleRequired: 'CITOYEN' },
    { id: 'autorite', label: isRtl ? 'سلطة محلية' : 'Autorité Locale', icon: ShieldAlert, roleRequired: 'AUTORITE_LOCALE' },
    { id: 'delegation', label: isRtl ? 'مندوبية' : 'Délégation', icon: Building2, roleRequired: 'DELEGATION' },
    { id: 'gouverneur', label: isRtl ? 'عامل الإقليم' : 'Gouverneur', icon: CompassIcon, roleRequired: 'GOUVERNEUR' },
    { id: 'admin', label: isRtl ? 'مدير المنصة' : 'Admin', icon: Settings, roleRequired: 'ADMIN' },
  ];

  // Logic to determine if a role tab should be shown
  const isRoleTabVisible = (roleRequired: string) => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return true; // Admin and Super Admin can see everything
    }
    if (roleRequired === 'CONSULTEUR') {
      return true; // Consulteur is public
    }
    return userRole === roleRequired;
  };

  const visibleRoles = allRolesList.filter(role => isRoleTabVisible(role.roleRequired));

  // Determine the active role data, falling back to consulteur if active role is not in the visible list
  const resolvedActiveRole = visibleRoles.some(r => r.id === activeRole) ? activeRole : 'consulteur';
  const activeRoleData = currentData.find(r => r.id === resolvedActiveRole) || currentData[0];
  
  // Active Section Data
  const activeSectionData = activeRoleData.sections.find(s => s.id === activeSection) || activeRoleData.sections[0];

  // Reset active step index whenever section or role changes
  useEffect(() => {
    setActiveStepIndex(0);
  }, [activeRole, activeSection]);

  const handleRoleChange = (roleId: string) => {
    startTransition(() => {
      setActiveRole(roleId);
      setActiveStepIndex(0);
      const newRole = currentData.find(r => r.id === roleId);
      if (newRole && newRole.sections.length > 0) {
        setActiveSection(newRole.sections[0].id);
      }
    });
  };

  const handleSectionChange = (sectionId: string) => {
    startTransition(() => {
      setActiveSection(sectionId);
      setActiveStepIndex(0);
      setSidebarOpen(false);
    });
  };

  // Next and Previous navigation for sections
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

  const activeStepImage = activeSectionData.steps?.[activeStepIndex]?.image || activeSectionData.image;
  const activeStepHighlight = activeSectionData.steps?.[activeStepIndex]?.highlight;

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
                {isRtl ? 'دليل مستخدم بوابة مديونة' : 'GUIDE UTILISATEUR PORTAIL MÉDIOUNA'}
              </h1>
              <p className="text-lg text-slate-300 max-w-3xl mt-2 font-medium">
                {isRtl 
                  ? 'دليل تفاعلي مصور لمساعدتكم على فهم واستخدام كافة ميزات المنصة خطوة بخطوة.' 
                  : 'Un guide interactif illustré pour vous accompagner pas à pas dans l\'utilisation du portail.'}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 py-2.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {visibleRoles.map((role) => {
              const IconComponent = role.icon;
              const isActive = resolvedActiveRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
                    isActive 
                      ? 'bg-[#0a3b68] text-white shadow-md' 
                      : 'text-[#0a3b68] hover:bg-[#ebd281]/20'
                  }`}
                >
                  <IconComponent size={16} />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>

          {/* Authentication Tip for Roles tab access */}
          {userRole === 'CONSULTEUR' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-200/60 text-xs font-semibold max-w-sm self-start md:self-auto">
              <Lock size={14} className="shrink-0 text-amber-600" />
              <span>
                {isRtl 
                  ? 'سجل الدخول بحسابك لعرض الدلائل الإدارية الخاصة بك.' 
                  : 'Connectez-vous pour voir les guides liés à vos autres rôles.'}
              </span>
            </div>
          )}
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

                  {/* Interactive Screenshot Display with Spotlight overlay */}
                  {activeStepImage && (
                    <div 
                      ref={screenshotContainerRef}
                      className="relative mb-10 rounded-2xl overflow-hidden shadow-md border border-gray-200/60 max-w-3xl mx-auto aspect-[16/10] bg-slate-900 overflow-y-auto scrollbar-thin select-none"
                    >
                      <div className="relative w-full font-sans" style={{ height: 'auto' }}>
                        <img
                          src={activeStepImage}
                          alt={activeSectionData.title}
                          className="w-full h-auto block select-none pointer-events-none"
                          draggable={false}
                        />
                        
                        {/* Spotlight Overlay based on active step coordinates */}
                        <AnimatePresence>
                          {activeStepHighlight && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              key={`${activeSection}-${activeStepIndex}`}
                              style={{
                                position: 'absolute',
                                top: activeStepHighlight.top,
                                left: activeStepHighlight.left,
                                width: activeStepHighlight.width,
                                height: activeStepHighlight.height,
                                border: '3px dashed #ebd281',
                                boxShadow: '0 0 0 9999px rgba(10, 59, 104, 0.45), 0 0 15px 3px #ebd281',
                                borderRadius: '12px',
                                pointerEvents: 'none',
                                zIndex: 20
                              }}
                              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                            >
                              {/* Glowing Ping Indicator */}
                              <span className={`absolute -top-2.5 ${isRtl ? '-right-2.5' : '-left-2.5'} flex h-5 w-5 z-30`}>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ebd281] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 border-2 border-white shadow-md"></span>
                              </span>

                              {/* Dynamic Spotlight tooltip explanation */}
                              <div 
                                className="absolute whitespace-normal bg-[#0a3b68] text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xl border border-[#ebd281] pointer-events-auto leading-normal min-w-[200px] text-center"
                                style={{
                                  top: 'calc(100% + 12px)',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  zIndex: 30
                                }}
                              >
                                {isRtl ? activeStepHighlight.tooltipAr : activeStepHighlight.tooltipFr}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Zoom Lightbox Action Button */}
                      <button 
                        onClick={() => setLightboxImage(activeStepImage)}
                        className="absolute bottom-4 right-4 z-30 p-2.5 bg-[#ebd281] hover:bg-[#ebd281]/95 text-[#0a3b68] rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center"
                        title={isRtl ? 'تكبير الصورة' : 'Agrandir l\'image'}
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  )}

                  {/* Steps Guide (Interactive on click) */}
                  {activeSectionData.steps && activeSectionData.steps.length > 0 && (
                    <div className="space-y-6 mb-8">
                      <h3 className="text-xl font-bold text-[#0a3b68] flex items-center gap-2.5 mb-4 font-cairo">
                        <span className="w-1.5 h-6 bg-[#ebd281] rounded-full" />
                        {isRtl ? 'خطوات الاستخدام (اضغط لتوضيح الصورة)' : 'Instructions (cliquez pour surligner sur l\'image)'}
                      </h3>
                      <div className="grid gap-4">
                        {activeSectionData.steps.map((step, idx) => {
                          const isActive = activeStepIndex === idx;
                          return (
                            <div 
                              key={idx}
                              onClick={() => setActiveStepIndex(idx)}
                              className={`flex gap-4 p-5 rounded-2xl cursor-pointer border transition-all duration-200 ${
                                isActive 
                                  ? 'bg-[#ebd281]/15 border-[#ebd281] shadow-md ring-1 ring-[#ebd281]/30 scale-[1.01]' 
                                  : 'bg-[#0a3b68]/5 border-[#0a3b68]/10 hover:border-[#ebd281]/40 hover:bg-[#ebd281]/5'
                              }`}
                            >
                              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm transition-colors ${
                                isActive ? 'bg-[#0a3b68] text-white' : 'bg-[#ebd281] text-[#0a3b68]'
                              }`}>
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-extrabold text-[#0a3b68] text-base mb-1.5 flex items-center justify-between">
                                  <span>{step.title}</span>
                                  {isActive && (
                                    <span className="text-[10px] bg-[#0a3b68] text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                      {isRtl ? 'محددة' : 'Active'}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-sm text-slate-600 font-semibold leading-relaxed text-justify">
                                  {step.text}
                                </p>
                              </div>
                            </div>
                          );
                        })}
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

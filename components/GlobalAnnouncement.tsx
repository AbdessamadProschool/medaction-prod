'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Info, AlertTriangle, PartyPopper, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Config {
  isActive: boolean;
  title: string;
  message: string;
  showOncePerSession: boolean;
  type?: 'POPUP' | 'TICKER';
  variant?: 'INFO' | 'WARNING' | 'CELEBRATION' | 'DEFAULT';
  startTime?: string;
  endTime?: string;
  speed?: number;
}

export default function GlobalAnnouncement() {
  const [config, setConfig] = useState<Config | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // Hide on admin pages to avoid annoyance
  const isAdmin = pathname?.includes('/admin') || pathname?.includes('/super-admin');

  useEffect(() => {
    // Fetch settings
    fetch('/api/settings/announcement')
      .then(res => res.json())
      .then((data: Config) => {
        if (!data.isActive) return;

        // Check time validity if configured
        if (data.startTime && data.endTime) {
            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentTime = currentHours * 60 + currentMinutes;

            const [startH, startM] = data.startTime.split(':').map(Number);
            const [endH, endM] = data.endTime.split(':').map(Number);
            
            // Check if parsing worked
            if (!isNaN(startH) && !isNaN(endH)) {
                const startTime = startH * 60 + (startM || 0);
                const endTime = endH * 60 + (endM || 0);
                
                if (currentTime < startTime || currentTime > endTime) {
                    return; // Outside of hours
                }
            }
        }

        setConfig(data);

        // Session check for Popup
        if (data.type === 'POPUP' || !data.type) {
             const hasSeen = sessionStorage.getItem('hasSeenAnnouncement');
             if (data.showOncePerSession && hasSeen) {
               return;
             }
             setIsVisible(true);
        } else {
             setIsVisible(true);
        }
      })
      .catch(err => console.error('Failed to load announcement', err));
  }, [pathname]);

  const handleClose = () => {
    setIsVisible(false);
    if (config?.showOncePerSession && (config.type === 'POPUP' || !config.type)) {
      sessionStorage.setItem('hasSeenAnnouncement', 'true');
    }
  };

  if (!config || !isVisible || isAdmin) return null;

  // Render Ticker
  if (config.type === 'TICKER') {
      const getBgStyles = () => {
          switch(config.variant) {
              case 'CELEBRATION': return 'bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#dc2626] text-white shadow-[0_4px_20px_rgba(234,88,12,0.3)]';
              case 'WARNING': return 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-[0_4px_20px_rgba(220,38,38,0.3)]';
              case 'INFO': return 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)]';
              default: return 'bg-gradient-to-r from-gray-800 to-black text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]';
          }
      };

      const getIcon = () => {
          switch(config.variant) {
              case 'CELEBRATION': return <PartyPopper className="w-5 h-5 text-amber-200" />;
              case 'WARNING': return <AlertTriangle className="w-5 h-5 text-red-200" />;
              case 'INFO': return <Info className="w-5 h-5 text-blue-200" />;
              default: return <Megaphone className="w-5 h-5 text-gray-300" />;
          }
      };

      const isRTL = /[\u0600-\u06FF]/.test(config.message || '');
      
      return (
          <div className={`relative z-[60] w-full overflow-hidden py-3 text-start border-b border-white/10 ${getBgStyles()}`}>
              {/* Patterns */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent)]" />
              
              <div className="absolute top-0 right-0 z-20 h-full flex items-center pr-3 rtl:right-auto rtl:left-0 rtl:pl-3">
                  <button onClick={handleClose} className="p-1.5 hover:bg-white/20 rounded-full transition-all hover:scale-110 active:scale-90 backdrop-blur-sm border border-white/10">
                      <X size={16} />
                  </button>
              </div>

              <div className="relative flex items-center gap-4 px-12">
                  <div className="flex-shrink-0 z-10 hidden md:block">
                      {getIcon()}
                  </div>
                  
                  <div className="overflow-hidden flex-1 relative h-8 uppercase tracking-wider flex items-center">
                      <div 
                        className="animate-marquee whitespace-nowrap inline-block font-black text-sm md:text-base align-middle py-2"
                        style={{ 
                            animationDuration: `${config.speed || 40}s`,
                            animationDirection: isRTL ? 'reverse' : 'normal',
                            display: 'inline-block'
                        }}
                      >
                          <span className="mx-8 inline-flex items-center gap-3">
                              {config.title && <span className="text-white/70">{config.title}</span>}
                              <span>{config.message}</span>
                          </span>
                          <span className="mx-8 opacity-30">•</span>
                          <span className="mx-8 inline-flex items-center gap-3">
                              {config.title && <span className="text-white/70">{config.title}</span>}
                              <span>{config.message}</span>
                          </span>
                          <span className="mx-8 opacity-30">•</span>
                          <span className="mx-8 inline-flex items-center gap-3">
                              {config.title && <span className="text-white/70">{config.title}</span>}
                              <span>{config.message}</span>
                          </span>
                          <span className="mx-8 opacity-30">•</span>
                          <span className="mx-8 inline-flex items-center gap-3">
                              {config.title && <span className="text-white/70">{config.title}</span>}
                              <span>{config.message}</span>
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // Render Popup
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative overflow-hidden text-start font-cairo"
            onClick={e => e.stopPropagation()}
          >
            {/* Decoration */}
            <div className={`absolute top-0 left-0 w-full h-2 ${
                 config.variant === 'CELEBRATION' ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500' :
                 config.variant === 'WARNING' ? 'bg-gradient-to-r from-red-600 to-red-800' :
                 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`} />
            
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 rtl:right-auto rtl:left-6 p-2 bg-gray-100 dark:bg-gray-700 rounded-2xl hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600 dark:text-gray-300" />
            </button>

            <div className="flex flex-col items-center text-center pt-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${
                  config.variant === 'CELEBRATION' ? 'bg-amber-100 text-amber-600 shadow-amber-200/50' :
                  config.variant === 'WARNING' ? 'bg-red-100 text-red-600 shadow-red-200/50' :
                  'bg-blue-100 text-blue-600 shadow-blue-200/50'
              }`}>
                  {config.variant === 'CELEBRATION' ? <PartyPopper size={40} /> :
                   config.variant === 'WARNING' ? <AlertTriangle size={40} /> :
                   <Info size={40} />}
              </div>

              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
                {config.title}
              </h3>
              
              <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-lg font-medium leading-relaxed">
                {config.message}
              </div>

              <div className="mt-10 w-full">
                <button
                  onClick={handleClose}
                  className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all hover:-translate-y-1 active:scale-95 text-white ${
                    config.variant === 'CELEBRATION' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' :
                    config.variant === 'WARNING' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                    'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

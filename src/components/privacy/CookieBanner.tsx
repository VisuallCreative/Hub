import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, Settings, Check, X } from 'lucide-react';
import {
  getStoredCookieConsent,
  acceptAllCookies,
  rejectNonEssentialCookies
} from '../../utils/cookieConsent';

interface CookieBannerProps {
  onOpenPreferences: () => void;
  triggerAudio?: (sound: 'tap' | 'success') => void;
}

export default function CookieBanner({ onOpenPreferences, triggerAudio }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = getStoredCookieConsent();
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    if (triggerAudio) triggerAudio('success');
    acceptAllCookies();
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    if (triggerAudio) triggerAudio('tap');
    rejectNonEssentialCookies();
    setIsVisible(false);
  };

  const handleOpenConfig = () => {
    if (triggerAudio) triggerAudio('tap');
    onOpenPreferences();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div
        id="cookie-consent-banner"
        className="fixed bottom-3 sm:bottom-5 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none"
      >
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="max-w-4xl mx-auto pointer-events-auto pkxd-glass-modal rounded-3xl p-4 sm:p-5 text-slate-900"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#F3F0FF] border border-purple-200 flex items-center justify-center shrink-0 text-[#6D28D9]">
                <Cookie className="w-5 h-5" />
              </div>

              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                    <span>Nós usamos cookies</span>
                    <span role="img" aria-label="cookie">🍪</span>
                  </h3>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-[#F3F0FF] border border-purple-200 text-[#6D28D9]">
                    Privacidade
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans max-w-2xl">
                  Utilizamos cookies e tecnologias semelhantes para manter o site funcionando, melhorar sua experiência e lembrar suas preferências.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1 md:pt-0 shrink-0">
              <button
                id="cookie-banner-configure-btn"
                onClick={handleOpenConfig}
                className="pkxd-btn-outline flex-1 sm:flex-none px-3.5 py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Configurar cookies</span>
              </button>

              <button
                id="cookie-banner-reject-btn"
                onClick={handleRejectNonEssential}
                className="pkxd-btn-outline flex-1 sm:flex-none px-3.5 py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Recusar não essenciais</span>
              </button>

              <button
                id="cookie-banner-accept-all-btn"
                onClick={handleAcceptAll}
                className="pkxd-btn-primary w-full sm:w-auto px-4 py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aceitar todos</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

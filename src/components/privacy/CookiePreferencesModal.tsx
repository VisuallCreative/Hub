import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cookie,
  ShieldCheck,
  Sliders,
  BarChart3,
  Megaphone,
  Check,
  X,
  Lock,
  Info,
  Calendar
} from 'lucide-react';
import {
  CookieCategoriesConsent,
  CookieConsentRecord
} from '../../types/privacy';
import {
  getStoredCookieConsent,
  saveCookieConsent,
  acceptAllCookies,
  rejectNonEssentialCookies
} from '../../utils/cookieConsent';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerAudio?: (sound: 'tap' | 'success') => void;
}

export default function CookiePreferencesModal({
  isOpen,
  onClose,
  triggerAudio
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookieCategoriesConsent>({
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  });
  const [consentRecord, setConsentRecord] = useState<CookieConsentRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredCookieConsent();
      if (stored) {
        setPreferences(stored.categories);
        setConsentRecord(stored);
      } else {
        setPreferences({
          necessary: true,
          preferences: false,
          analytics: false,
          marketing: false,
        });
        setConsentRecord(null);
      }
    }
  }, [isOpen]);

  const handleToggle = (category: keyof CookieCategoriesConsent) => {
    if (category === 'necessary') return;
    if (triggerAudio) triggerAudio('tap');
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSaveCustom = () => {
    if (triggerAudio) triggerAudio('success');
    const updated = saveCookieConsent(preferences, true);
    setConsentRecord(updated);
    onClose();
  };

  const handleAcceptAll = () => {
    if (triggerAudio) triggerAudio('success');
    const updated = acceptAllCookies();
    setPreferences(updated.categories);
    setConsentRecord(updated);
    onClose();
  };

  const handleRejectAll = () => {
    if (triggerAudio) triggerAudio('tap');
    const updated = rejectNonEssentialCookies();
    setPreferences(updated.categories);
    setConsentRecord(updated);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="cookie-preferences-modal"
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 text-left"
      >
        <div
          className="fixed inset-0"
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onClose();
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl pkxd-glass-modal rounded-3xl text-slate-900 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-white/60 bg-white/55 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F3F0FF] border border-purple-200 flex items-center justify-center text-[#6D28D9]">
                <Cookie className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Preferências de Cookies
                </h2>
                <p className="text-xs text-slate-500">
                  Personalize suas escolhas de privacidade e navegação
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="px-5 sm:px-6 py-5 overflow-y-auto space-y-4 text-xs font-sans">
            <div className="p-4 rounded-2xl bg-[#F3F0FF] border border-purple-200 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#6D28D9] shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-700 leading-relaxed text-xs">
                <p>
                  Cookies e tecnologias similares ajudam a manter o portal seguro e lembrar suas preferências. Você tem controle total sobre quais categorias opcionais deseja autorizar.
                </p>
                {consentRecord && (
                  <p className="text-[11px] text-[#6D28D9] font-bold flex items-center gap-1.5 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Última atualização: {new Date(consentRecord.timestamp).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(consentRecord.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Versão {consentRecord.policyVersion})
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* 1. Necessary Cookies */}
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#ECFDF5] text-emerald-600 border border-emerald-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900">Cookies necessários</h3>
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">
                      Sempre Ativos
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-emerald-200 text-[11px] font-extrabold text-emerald-700">
                  <Lock className="w-3 h-3" />
                  <span>Obrigatório</span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Essenciais para o funcionamento básico e seguro do site. Sem eles, recursos fundamentais não funcionam.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-600 space-y-1 border border-slate-200">
                <strong className="text-slate-800 block text-[10px] uppercase tracking-wider font-extrabold">
                  Finalidades:
                </strong>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Funcionamento básico do site e navegação fluida;</li>
                  <li>Segurança, prevenção de fraudes e autenticação de conta;</li>
                  <li>Armazenamento das preferências essenciais de consentimento.</li>
                </ul>
              </div>
            </div>

            {/* 2. Preference Cookies */}
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#F3F0FF] text-[#6D28D9] border border-purple-200">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900">Cookies de preferência</h3>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      preferences.preferences ? 'text-[#6D28D9]' : 'text-slate-500'
                    }`}>
                      {preferences.preferences ? 'Ativo' : 'Inativo (Opcional)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('preferences')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    preferences.preferences ? 'bg-[#6D28D9] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                  aria-label="Ativar ou desativar cookies de preferência"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-4 h-4 rounded-full bg-white shadow"
                  />
                </button>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Permitem que o portal lembre escolhas feitas por você para oferecer uma experiência personalizada.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-600 space-y-1 border border-slate-200">
                <strong className="text-slate-800 block text-[10px] uppercase tracking-wider font-extrabold">
                  Finalidades:
                </strong>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Lembrar configurações de áudio e efeitos sonoros;</li>
                  <li>Preferências de idioma, filtros e personalizações de perfil.</li>
                </ul>
              </div>
            </div>

            {/* 3. Analytics Cookies */}
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#EFF8FF] text-[#0284C7] border border-sky-200">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900">Cookies de análise</h3>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      preferences.analytics ? 'text-[#0284C7]' : 'text-slate-500'
                    }`}>
                      {preferences.analytics ? 'Ativo' : 'Inativo (Opcional)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('analytics')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    preferences.analytics ? 'bg-[#0284C7] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                  aria-label="Ativar ou desativar cookies de análise"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-4 h-4 rounded-full bg-white shadow"
                  />
                </button>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Ajudam a entender como os visitantes interagem com o portal de forma agregada, sem identificar indivíduos diretamente.
              </p>

              <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-600 space-y-1 border border-slate-200">
                <strong className="text-slate-800 block text-[10px] uppercase tracking-wider font-extrabold">
                  Finalidades:
                </strong>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Medir visitas e identificar quais seções da comunidade são mais úteis;</li>
                  <li>Avaliar velocidade e estabilidade de carregamento do portal.</li>
                </ul>
              </div>
            </div>

            {/* 4. Marketing Cookies */}
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-50 text-pink-600 border border-pink-200">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900">Cookies de marketing</h3>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      preferences.marketing ? 'text-pink-600' : 'text-slate-500'
                    }`}>
                      {preferences.marketing ? 'Ativo' : 'Inativo (Opcional)'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('marketing')}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    preferences.marketing ? 'bg-pink-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                  aria-label="Ativar ou desativar cookies de marketing"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-4 h-4 rounded-full bg-white shadow"
                  />
                </button>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Utilizados somente caso o site implemente integrações promocionais ou avisos contextuais que necessitem dessa categoria.
              </p>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-5 sm:px-6 py-4 border-t-2 border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            <button
              onClick={handleRejectAll}
              className="pkxd-btn-outline w-full sm:w-auto px-4 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Recusar não essenciais</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleAcceptAll}
                className="pkxd-btn-outline flex-1 sm:flex-none px-4 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aceitar todos</span>
              </button>

              <button
                onClick={handleSaveCustom}
                className="pkxd-btn-primary flex-1 sm:flex-none px-5 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Salvar preferências</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

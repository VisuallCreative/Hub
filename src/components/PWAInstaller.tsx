import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  Bell, 
  Share, 
  Info, 
  Sparkles, 
  X, 
  Zap, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  ChevronRight,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallerProps {
  onAddXP?: (amount: number, reason: string, rewardKey?: string) => void;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
  forceOpenModal?: boolean;
  hideInlineBanner?: boolean;
  onCloseModal?: () => void;
}

export default function PWAInstaller({ onAddXP, triggerAudio, forceOpenModal, hideInlineBanner = false, onCloseModal }: PWAInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'auto' | 'android' | 'ios' | 'desktop'>('auto');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('pkxd_pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (forceOpenModal) {
      setShowInstallModal(true);
    }
  }, [forceOpenModal]);

  useEffect(() => {
    // Check standalone / installed mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect Device Type
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const androidDevice = /android/.test(userAgent);
    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

    if (iosDevice) {
      setActiveGuideTab('ios');
    } else if (androidDevice) {
      setActiveGuideTab('android');
    } else {
      setActiveGuideTab('desktop');
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check notification permission
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }

    // Award one-time +100 XP automatically if opened as installed PWA
    if (isStandalone && onAddXP) {
      onAddXP(100, 'Instalou o aplicativo PKXD Central no Celular', 'pwa_install_100');
    }

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (onAddXP) onAddXP(100, 'Instalou o aplicativo PKXD Central no Celular', 'pwa_install_100');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (triggerAudio) triggerAudio('tap');

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallModal(false);
        if (onCloseModal) onCloseModal();
        showToast('Aplicativo PKXD Central instalado com sucesso! (+100 XP)');
        if (onAddXP) onAddXP(100, 'Instalou o aplicativo PKXD Central no Celular', 'pwa_install_100');
        if (triggerAudio) triggerAudio('levelUp');
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const handleTogglePush = async () => {
    if (triggerAudio) triggerAudio('tap');
    if (!('Notification' in window)) {
      showToast('Seu navegador não suporta notificações Push do sistema.');
      return;
    }

    if (Notification.permission === 'granted') {
      showToast('Notificações do PKXD Central já estão ativas!');
      setPushEnabled(true);
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPushEnabled(true);
        if (triggerAudio) triggerAudio('success');
        if (onAddXP) onAddXP(50, 'Ativou notificações de Spoilers e Eventos');
        showToast('Notificações ativadas! Você receberá avisos de novos eventos e códigos.');

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('PKXD Central', {
              body: 'Tudo pronto! Você receberá alertas de pets, torneios, spoilers e códigos do jogo.',
              icon: '/assets/aistudio/file_000000004688820e877cea70c3a4dcc9_6049124b.png',
              badge: '/assets/aistudio/file_000000004688820e877cea70c3a4dcc9_6049124b.png'
            });
          });
        }
      } else {
        showToast('Permissão de notificação negada no navegador.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem('pkxd_pwa_banner_dismissed', 'true');
    } catch {}
  };

  return (
    <div className="w-full space-y-3 my-3" id="pwa-root-installer">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white text-slate-900 border-2 border-violet-300 px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 max-w-md text-center"
          >
            <Sparkles className="w-4 h-4 text-violet-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Status Bar */}
      {!isOnline && (
        <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-2xl text-amber-900 text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-600" />
            <span>Modo Offline Ativo — Você está navegando em dados salvos em cache no seu dispositivo.</span>
          </div>
          <span className="text-[11px] bg-white px-2.5 py-0.5 rounded-full border border-amber-200 font-bold">Cache PWA</span>
        </div>
      )}

      {/* Main PWA Install & Notification Bar Banner */}
      {!hideInlineBanner && !bannerDismissed && (
        <div className="pkxd-pop-card p-4 sm:p-5 text-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left info area */}
          <div className="flex items-center gap-3.5 text-left w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#7C3AED] border-2 border-[#120624] text-white shadow-[0_3px_0_#16032E] flex-shrink-0 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-display font-bold text-sm sm:text-base text-[#120624] flex items-center gap-1.5">
                  <span>Instalar PKXD Central no Celular</span>
                </h4>
                {isInstalled && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Instalado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-snug font-medium">
                Acesse o app direto da tela inicial do celular com carregamento instantâneo, tela cheia e notificações!
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleNativeInstall}
              className="pkxd-btn-primary flex-1 md:flex-none px-4 py-2.5 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalled ? 'Ver Guia do App' : 'Instalar App (+100 XP)'}</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePush}
              className={`flex-1 md:flex-none px-3.5 py-2.5 rounded-full font-sans text-xs font-bold uppercase tracking-wider border-2 border-[#120624] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                pushEnabled
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-white hover:bg-slate-50 text-[#120624]'
              }`}
              title="Ativar Notificações Push de Eventos e Spoilers"
            >
              <Bell className={`w-3.5 h-3.5 ${pushEnabled ? 'text-emerald-700' : 'text-[#EC4899]'}`} />
              <span>{pushEnabled ? 'Alertas Ativos' : 'Notificações'}</span>
            </button>

            <button
              type="button"
              onClick={dismissBanner}
              className="p-2 bg-white hover:bg-slate-100 text-[#120624] rounded-full border-2 border-[#120624] transition-all cursor-pointer"
              title="Fechar Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Install & PWA Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120624]/75 backdrop-blur-sm p-4">
          <div className="pkxd-pop-card p-6 w-full max-w-lg relative text-left space-y-5 max-h-[90vh] overflow-y-auto text-[#120624]">
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setShowInstallModal(false);
                if (onCloseModal) onCloseModal();
              }}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-full cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white shadow-xs flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-[#120624]">
                  Instalar PKXD Central no Celular
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Acesse o app direto da tela inicial do celular com carregamento instantâneo, tela cheia e notificações!
                </p>
              </div>
            </div>

            {/* Direct Native Button if available */}
            {deferredPrompt && (
              <div className="p-4 bg-violet-50 border-2 border-violet-200 rounded-2xl space-y-2.5">
                <p className="text-xs text-slate-800 font-bold">
                  Seu navegador suporta instalação rápida em 1 toque:
                </p>
                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="pkxd-btn-primary w-full py-3 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Agora</span>
                </button>
              </div>
            )}

            {/* Guide Tabs for different operating systems */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('android')}
                  className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    activeGuideTab === 'android'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Android (Chrome)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('ios')}
                  className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    activeGuideTab === 'ios'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  iPhone (Safari)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('desktop')}
                  className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    activeGuideTab === 'desktop'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PC / Mac
                </button>
              </div>

              {/* Android Guide */}
              {activeGuideTab === 'android' && (
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">1</span>
                    <span>Abra este site no <strong>Google Chrome</strong> ou <strong>Samsung Internet</strong> no seu celular.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">2</span>
                    <span>Toque no botão de <strong>menu (3 pontinhos ⋮)</strong> no canto superior direito.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">3</span>
                    <span>Selecione <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.</span>
                  </div>
                </div>
              )}

              {/* iOS Safari Guide */}
              {activeGuideTab === 'ios' && (
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">1</span>
                    <span>Abra este site no <strong>Safari</strong> no seu iPhone ou iPad.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">2</span>
                    <span>Toque no botão de <strong>Compartilhar <Share className="w-3.5 h-3.5 inline text-pink-600 mx-1" /></strong> na barra inferior do Safari.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">3</span>
                    <span>Role para baixo e toque em <strong>&quot;Adicionar à Tela de Início&quot;</strong> e confirme em <strong>&quot;Adicionar&quot;</strong>.</span>
                  </div>
                </div>
              )}

              {/* Desktop Guide */}
              {activeGuideTab === 'desktop' && (
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">1</span>
                    <span>Abra no <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> no computador.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">2</span>
                    <span>Clique no ícone de <strong>Instalar Aplicativo</strong> no canto direito da barra de endereços.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits List */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <h5 className="text-xs font-bold uppercase text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" /> Vantagens do App Instalado
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Abertura rápida
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Leitura offline
                </div>
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-pink-600" /> Alertas de spoilers
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Tela cheia limpa
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <button
              type="button"
              onClick={() => {
                setShowInstallModal(false);
                if (onCloseModal) onCloseModal();
              }}
              className="pkxd-btn-primary w-full py-3 text-xs uppercase cursor-pointer"
            >
              Entendido, fechar guia
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useState } from 'react';
import {
  Bell,
  Home,
  Calendar,
  CalendarCheck,
  PlusCircle,
  Newspaper,
  Users,
  User,
  KeyRound,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Zap,
  Award,
  PawPrint,
} from 'lucide-react';

export type NavRouteKey =
  | 'inicio'
  | 'eventos'
  | 'minha-agenda'
  | 'criar-evento'
  | 'pets'
  | 'noticias'
  | 'criadores'
  | 'progresso-creator'
  | 'notificacoes'
  | 'perfil'
  | 'oportunidades'
  | 'comunidade'
  | 'pkxd-id'
  | 'artes'
  | 'admin';

interface Navbar2Props {
  activeRoute: NavRouteKey;
  siteLogoUrl?: string;
  user: any;
  isAdmin: boolean;
  fanLevel: number;
  totalXp?: number;
  playerTag?: string;
  unreadCount: number;
  onNavigate: (path: string) => void;
  onOpenNotifications: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
}

export default function Navbar2({
  activeRoute,
  siteLogoUrl,
  user,
  isAdmin,
  fanLevel,
  totalXp = 0,
  playerTag,
  unreadCount,
  onNavigate,
  onOpenNotifications,
  onOpenAuth,
  onLogout,
  triggerAudio,
}: Navbar2Props) {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const desktopNavItems: { key: NavRouteKey; label: string; path: string }[] = [
    { key: 'inicio', label: 'Início', path: '/' },
    { key: 'eventos', label: 'Eventos', path: '/eventos' },
    { key: 'pets', label: 'Pets', path: '/pets' },
    { key: 'noticias', label: 'Notícias', path: '/noticias' },
    { key: 'criadores', label: 'Creators', path: '/criadores' },
  ];

  const handleNav = (path: string) => {
    triggerAudio('tap');
    setMoreSheetOpen(false);
    onNavigate(path);
  };

  const hasValidCustomLogo =
    Boolean(siteLogoUrl) &&
    !siteLogoUrl!.includes('photos.app.goo.gl') &&
    !siteLogoUrl!.includes('google.com/photos');

  const displayFirstName = playerTag
    ? playerTag.split('#')[0]
    : user?.displayName
    ? user.displayName.split('#')[0].split(' ')[0]
    : user?.email
    ? user.email.split('@')[0]
    : 'Meu Perfil';

  return (
    <>
      {/* TOP BAR (Desktop full nav + Mobile compact bar) */}
      <header
        id="nav-header"
        className="sticky top-0 z-40 bg-[#2D0859] border-b-[3px] border-[#120624] text-white select-none"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-3 md:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            id="brand-home-btn"
            type="button"
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F9C826] rounded-full py-1 whitespace-nowrap shrink-0 group"
          >
            {hasValidCustomLogo ? (
              <img
                src={siteLogoUrl}
                alt="PK XD Central"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border-[2.5px] border-[#120624] bg-white shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#F9C826] border-[2.5px] border-[#120624] shadow-[0_2px_0_#120624] text-[#120624] flex items-center justify-center font-display font-bold text-lg shrink-0 group-hover:scale-105 transition-transform">
                PK
              </div>
            )}
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-white whitespace-nowrap shrink-0">
              PK XD <span className="text-[#F9C826]">Central</span>
            </span>
          </button>

          {/* Zone 2: Clean Single-Line Desktop Links */}
          <nav aria-label="Navegação principal" className="hidden lg:flex items-center gap-5">
            {desktopNavItems.map((item) => {
              const isActive = activeRoute === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`relative py-1.5 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#F9C826] ${
                    isActive
                      ? 'text-[#F9C826]'
                      : 'text-white/90 hover:text-[#F9C826]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-[#F9C826]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Creator Progress, Notifications, Profile/Login) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="nav-creator-progress-btn"
              type="button"
              onClick={() => handleNav('/progresso-creator')}
              className="hidden md:inline-flex pkxd-btn-gold items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>Progresso Creator</span>
            </button>

            <button
              id="nav-notifications-btn"
              type="button"
              onClick={() => {
                triggerAudio('tap');
                handleNav('/notificacoes');
              }}
              aria-label="Abrir notificações"
              title="Notificações"
              className={`relative w-10 h-10 rounded-full border-[2.5px] border-[#120624] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                activeRoute === 'notificacoes'
                  ? 'bg-[#F9C826] text-[#120624]'
                  : 'bg-white text-[#120624] hover:bg-[#FEF9C3]'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#EC4899] border-2 border-[#120624] text-white text-[10px] font-extrabold flex items-center justify-center tabular-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {user ? (
              <button
                id="nav-user-profile-btn"
                type="button"
                onClick={() => handleNav('/perfil')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FEF9C3] border-[2.5px] border-[#120624] text-[#120624] text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Abrir Meu Perfil"
              >
                <User className="w-4 h-4 text-[#6D28D9] shrink-0" />
                <span className="max-w-[92px] truncate hidden sm:inline">{displayFirstName}</span>
                <span className="font-mono text-[11px] text-[#6D28D9] tabular-nums hidden xl:inline">
                  {totalXp} XP
                </span>
              </button>
            ) : (
              <button
                id="nav-login-btn"
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onOpenAuth('login');
                }}
                className="pkxd-btn-primary inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Entrar</span>
              </button>
            )}

            {/* Tablet/Mobile Drawer Trigger */}
            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => {
                triggerAudio('tap');
                setMoreSheetOpen((prev) => !prev);
              }}
              aria-expanded={moreSheetOpen}
              aria-label={moreSheetOpen ? 'Fechar menu' : 'Abrir menu completo'}
              className="lg:hidden w-10 h-10 rounded-full border-[2.5px] border-[#120624] bg-[#F9C826] text-[#120624] flex items-center justify-center cursor-pointer shrink-0"
            >
              {moreSheetOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE & TABLET FULL NAVIGATION DRAWER / SHEET */}
      {moreSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#120624]/70 flex items-end md:items-start md:justify-end p-0 md:p-4 animate-fade-in"
          onClick={() => setMoreSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-sm bg-white border-t-[3.5px] md:border-[3.5px] border-[#120624] rounded-t-[28px] md:rounded-[28px] md:shadow-[0_6px_0_#16032E] p-5 space-y-4 max-h-[85vh] overflow-y-auto text-[#120624]"
          >
            <div className="w-12 h-1.5 bg-[#120624]/20 rounded-full mx-auto md:hidden" />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-xl text-[#120624]">
                  Explorar PK XD Central
                </h2>
                <p className="text-xs font-semibold text-slate-600 tabular-nums">
                  Nível {fanLevel} · {totalXp} XP acumulado
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMoreSheetOpen(false)}
                className="w-10 h-10 rounded-full border-2 border-[#120624] bg-[#FEF9C3] flex items-center justify-center cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav aria-label="Menu completo" className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'inicio', label: 'Início', path: '/', icon: Home, bg: 'bg-[#FFFDF7]' },
                { key: 'eventos', label: 'Eventos', path: '/eventos', icon: Calendar, bg: 'bg-[#FEF9C3]' },
                { key: 'minha-agenda', label: 'Minha Agenda', path: '/minha-agenda', icon: CalendarCheck, bg: 'bg-[#FEF9C3]' },
                { key: 'progresso-creator', label: 'Analisador Creator', path: '/progresso-creator', icon: Award, bg: 'bg-[#FEF9C3]' },
                { key: 'criar-evento', label: 'Criar Evento', path: '/criar-evento', icon: PlusCircle, bg: 'bg-[#FCE7F3]' },
                { key: 'pets', label: 'Pets (Doação/Troca)', path: '/pets', icon: PawPrint, bg: 'bg-[#DCFCE7]' },
                { key: 'noticias', label: 'Notícias', path: '/noticias', icon: Newspaper, bg: 'bg-[#DBEAFE]' },
                { key: 'criadores', label: 'Creators', path: '/criadores', icon: Users, bg: 'bg-[#EDE9FE]' },
                { key: 'notificacoes', label: 'Notificações', path: '/notificacoes', icon: Bell, bg: 'bg-[#FCE7F3]' },
                { key: 'perfil', label: 'Meu Perfil', path: '/perfil', icon: User, bg: 'bg-[#EDE9FE]' },
                { key: 'pkxd-id', label: 'PKXD ID', path: '/pkxd-id', icon: Sparkles, bg: 'bg-[#FEF9C3]' },
                { key: 'comunidade', label: 'Comunidade', path: '/comunidade', icon: Zap, bg: 'bg-[#DBEAFE]' },
                { key: 'oportunidades', label: 'Oportunidades', path: '/inscricoes', icon: ChevronRight, bg: 'bg-[#FFFDF7]' },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeRoute === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border-[2.5px] border-[#120624] text-left text-xs font-extrabold flex items-center gap-2 transition-transform active:translate-y-0.5 cursor-pointer ${
                      active
                        ? 'bg-[#2D0859] text-[#F9C826] shadow-[0_3px_0_#16032E]'
                        : `${item.bg} text-[#120624] shadow-[0_3px_0_#16032E]`
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t-2 border-slate-200 space-y-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNav('/perfil')}
                    className="flex-1 min-h-[44px] pkxd-btn-purple px-4 py-2 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span className="truncate">{displayFirstName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreSheetOpen(false);
                      onLogout();
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-full border-[2.5px] border-[#120624] bg-rose-100 text-rose-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMoreSheetOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full min-h-[44px] pkxd-btn-primary px-4 py-2.5 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar ou Criar Conta</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNav('/admin')}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-full border-[2.5px] border-[#120624] bg-[#2D0859] text-[#F9C826] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Painel Administrativo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPACT FIXED BOTTOM TAB BAR ON MOBILE (thumb-ergonomic, <= 15% total sticky height) */}
      <nav
        id="mobile-bottom-nav"
        aria-label="Navegação inferior mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#2D0859] border-t-[3px] border-[#120624] pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-15 px-1">
          {[
            { key: 'inicio', label: 'Início', path: '/', icon: Home },
            { key: 'eventos', label: 'Eventos', path: '/eventos', icon: Calendar },
            { key: 'progresso-creator', label: 'Creator', path: '/progresso-creator', icon: Award, highlight: true },
            { key: 'noticias', label: 'Notícias', path: '/noticias', icon: Newspaper },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeRoute === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleNav(tab.path)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                  active
                    ? 'text-[#F9C826]'
                    : tab.highlight
                    ? 'text-[#EC4899]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <div
                  className={`w-8 h-7 rounded-full flex items-center justify-center ${
                    tab.highlight
                      ? 'bg-[#F9C826] text-[#120624] border-2 border-[#120624]'
                      : active
                      ? 'bg-white/15'
                      : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold leading-none whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              triggerAudio('tap');
              setMoreSheetOpen(true);
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              moreSheetOpen ? 'text-[#F9C826]' : 'text-white/80 hover:text-white'
            }`}
          >
            <div className="w-8 h-7 rounded-full flex items-center justify-center">
              <Menu className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold leading-none whitespace-nowrap">
              Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_NEWS } from './components/initialNews';
import { NewsItem, FeaturedVideo, Theory, ShortItem, PastSpoiler, AppNotification, ServerXPProfile } from './types';
import { loadFromCache, saveToCache } from './utils/cache';
import { getPersistentUserKey, fetchServerXPProfile, awardServerXP, saveServerIdentity } from './utils/xpClient';
import CountdownWidget from './components/CountdownWidget';
import AdminPanel from './components/AdminPanel';
import AdminEcosystemPanel from './components/AdminEcosystemPanel';
import TheoriesSection from './components/TheoriesSection';
import FanLevelSection from './components/FanLevelSection';
import ApplicationsSection from './components/ApplicationsSection';
import SocialSection from './components/SocialSection';
import MissionsSection from './components/MissionsSection';
import ArtesSection from './components/ArtesSection';
import PollsSection from './components/PollsSection';
import EventsSection from './components/EventsSection';
import PassportSection from './components/PassportSection';
import Navbar2, { NavRouteKey } from './components/Navbar2';
import PKXDHomeView from './components/PKXDHomeView';
import NewsSectionView from './components/NewsSectionView';
import PetsSectionView from './components/PetsSectionView';
import NotificationsPageView from './components/NotificationsPageView';
import UserProfileView from './components/UserProfileView';
import PWAInstaller from './components/PWAInstaller';
import CreatorsHubView from './components/CreatorsHubView';
import CommunityFeedbackSection from './components/CommunityFeedbackSection';
import AuthModal, { AuthMode } from './components/AuthModal';
import CookieBanner from './components/privacy/CookieBanner';
import CookiePreferencesModal from './components/privacy/CookiePreferencesModal';
import UserDataRequestModal from './components/privacy/UserDataRequestModal';
import PrivacyPolicyView from './components/privacy/PrivacyPolicyView';
import TermsOfUseView from './components/privacy/TermsOfUseView';
import PrivacyCenterView from './components/privacy/PrivacyCenterView';
import { DataRequestType } from './types/privacy';
import {
  Sparkles,
  Settings,
  Volume2,
  VolumeX,
  Users,
  BellRing,
  Lock,
  LogOut,
  AlertTriangle,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Calendar,
  Target,
  Palette,
  MessageSquarePlus,
  ExternalLink,
  X,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playTapSound, playLevelUpSound, playSuccessSound } from './utils/audio';

// Import Firebase config & helpers
import { auth, db, googleProvider, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

export const maskEmail = (email?: string | null): string => {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const local = parts[0];
  const domain = parts[1];
  if (local.length <= 3) {
    return `${local.slice(0, 1)}***@${domain}`;
  }
  return `${local.slice(0, 3)}***@${domain}`;
};

export default function App() {
  const [newsList, setNewsList] = useState<NewsItem[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_central_news');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Error reading pkxd_central_news from localStorage:", e);
    }
    return INITIAL_NEWS;
  });

  const [spoilerTitle, setSpoilerTitle] = useState(() => {
    try {
      return localStorage.getItem('pkxd_spoiler_title') || 'Aguardando Próximos Spoilers!';
    } catch (e) {
      return 'Aguardando Próximos Spoilers!';
    }
  });

  const [spoilerDesc, setSpoilerDesc] = useState(() => {
    try {
      return localStorage.getItem('pkxd_spoiler_desc') || 'Ainda não temos spoilers ativos para esta semana. Fique atento ao nosso canal no WhatsApp para novidades e acompanhe a contagem regressiva toda segunda às 17h30!';
    } catch (e) {
      return 'Ainda não temos spoilers ativos para esta semana. Fique atento ao nosso canal no WhatsApp para novidades e acompanhe a contagem regressiva toda segunda às 17h30!';
    }
  });

  const [spoilerImage, setSpoilerImage] = useState(() => {
    try {
      return localStorage.getItem('pkxd_spoiler_image') || '';
    } catch (e) {
      return '';
    }
  });

  const [pastSpoilers, setPastSpoilers] = useState<PastSpoiler[]>(() => {
    return loadFromCache<PastSpoiler[]>('pkxd_cache_past_spoilers', []);
  });

  const [siteLogoUrl, setSiteLogoUrl] = useState(() => {
    try {
      return localStorage.getItem('pkxd_site_logo_url') || '';
    } catch (e) {
      return '';
    }
  });

  const [forceReveal, setForceReveal] = useState(() => {
    try {
      return localStorage.getItem('pkxd_force_reveal') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [revealedAt, setRevealedAt] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pkxd_spoiler_revealed_at');
      if (saved) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return 0;
  });

  const [pastSpoilerToEdit, setPastSpoilerToEdit] = useState<PastSpoiler | null>(null);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  // State hooks for new components with instant cache hydration from real site data
  const [featuredList, setFeaturedList] = useState<FeaturedVideo[]>(() => {
    return loadFromCache<FeaturedVideo[]>('pkxd_cache_featured_videos', []);
  });
  const [theoriesList, setTheoriesList] = useState<Theory[]>(() => {
    return loadFromCache<Theory[]>('pkxd_cache_theories', []);
  });
  const [shortsList, setShortsList] = useState<ShortItem[]>(() => {
    return loadFromCache<ShortItem[]>('pkxd_cache_shorts', []);
  });

  // State for alternative/extra countdown timer
  const [extraCountdownTitle, setExtraCountdownTitle] = useState('Spoiler Surpresa!');
  const [extraCountdownDate, setExtraCountdownDate] = useState('');
  const [extraCountdownEnabled, setExtraCountdownEnabled] = useState(false);

  // State for gift countdown release timer
  const [giftCountdownTitle, setGiftCountdownTitle] = useState('PRESENTE SURPRESA!');
  const [giftCountdownDate, setGiftCountdownDate] = useState('');
  const [giftCountdownEnabled, setGiftCountdownEnabled] = useState(false);
  const [giftCountdownContent, setGiftCountdownContent] = useState('');

  // Authentication & Admin levels
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (localStorage.getItem('pkxd_fallback_admin_logged') === 'true') {
        return {
          uid: 'admin_fallback',
          email: 'kawanyuri35@gmail.com',
          displayName: 'Kawanyuri (Admin)',
        } as any;
      }
    } catch (e) {}
    return null;
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      if (localStorage.getItem('pkxd_fallback_admin_logged') === 'true') {
        return true;
      }
    } catch (e) {}
    return false;
  });
  const [activeTab, setActiveTab] = useState<'inicio' | 'eventos' | 'criadores' | 'comunidade' | 'passaporte' | 'missoes' | 'artes'>('inicio');
  const [communitySubTab, setCommunitySubTab] = useState<'mural' | 'pkxd-id' | 'missoes' | 'artes' | 'ouvidoria'>('mural');
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(() => {
    try {
      return localStorage.getItem('pkxd_welcome_guide_dismissed') !== 'true';
    } catch (e) {
      return true;
    }
  });
  const [isCompactHomeMode, setIsCompactHomeMode] = useState(() => {
    try {
      return localStorage.getItem('pkxd_compact_home_mode') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [continuedAsGuest, setContinuedAsGuest] = useState(false);

  // Entry login modal states
  const [modalAuthTab, setModalAuthTab] = useState<'register' | 'login'>('register');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalNickname, setModalNickname] = useState('');
  const [modalPkxdName, setModalPkxdName] = useState('');
  const [modalPkxdNumber, setModalPkxdNumber] = useState('');
  const [modalAuthError, setModalAuthError] = useState<string | null>(null);

  // PK XD Tag setup modal & banner notification states for existing users
  const [showTagSetupModal, setShowTagSetupModal] = useState(false);
  const [tagSetupName, setTagSetupName] = useState('');
  const [tagSetupNumber, setTagSetupNumber] = useState('');
  const [tagSetupError, setTagSetupError] = useState('');
  const [tagBannerDismissed, setTagBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('pkxd_tag_banner_dismissed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [currentPlayerTag, setCurrentPlayerTag] = useState(() => {
    try {
      return localStorage.getItem('pkxd_player_tag') || '';
    } catch (e) {
      return '';
    }
  });

  const isTagConfigured = (tag?: string | null): boolean => {
    if (!tag) return false;
    const clean = tag.trim().toUpperCase();
    if (!clean || clean === 'JOGADOR' || clean === 'JOGADOR#000' || clean === 'GUEST' || clean === 'EXPLORADOR' || clean === 'FÃ SECRETO' || clean === 'CONVIDADO') return false;
    if (!clean.includes('#')) return false;
    const parts = clean.split('#');
    return parts[0].length >= 2 && parts[1].length >= 1;
  };

  // Pending 6-digit email verification code state
  const [pendingEmailVerification, setPendingEmailVerification] = useState<{
    email: string;
    pass: string;
    nickname: string;
    code: string;
    createdAt: number;
  } | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Fallback passcode login states
  const [useBackupPasscode, setUseBackupPasscode] = useState(false);
  const [inputPasscode, setInputPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthTab, setAdminAuthTab] = useState<'email' | 'google' | 'pin'>('pin');

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [fanLevel, setFanLevel] = useState(() => {
    try {
      const saved = localStorage.getItem('pkxd_fan_level');
      if (saved) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 1 : parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return 1;
  });

  const [fanXP, setFanXP] = useState(() => {
    try {
      const saved = localStorage.getItem('pkxd_fan_xp');
      if (saved) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return 0;
  });

  const [xpProfile, setXpProfile] = useState<ServerXPProfile | null>(null);
  const [showInstallAppModal, setShowInstallAppModal] = useState(false);
  const [autoOpenEventCreate, setAutoOpenEventCreate] = useState(false);

  // Sync server-validated XP profile on mount & user auth change
  useEffect(() => {
    let active = true;
    const userKey = getPersistentUserKey(user);
    fetchServerXPProfile(userKey).then((profile) => {
      if (!active || !profile) return;
      setXpProfile(profile);
      if (profile.totalXp > 0) {
        const levelXp = profile.totalXp % 100;
        setFanLevel(profile.level);
        setFanXP(levelXp);
        try {
          localStorage.setItem('pkxd_fan_level', String(profile.level));
          localStorage.setItem('pkxd_fan_xp', String(levelXp));
        } catch {}
      }
      if (profile.playerTag && isTagConfigured(profile.playerTag)) {
        setCurrentPlayerTag(profile.playerTag);
        try {
          localStorage.setItem('pkxd_player_tag', profile.playerTag);
        } catch {}
      }
    });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  // Simple robust state-based path router supporting browser navigation and deep linking (pathname + hash + search fallback)
  const [showCreatorAnalyzer, setShowCreatorAnalyzer] = useState(false);
  const [currentPath, setCurrentPath] = useState(() => {
    try {
      const path = decodeURIComponent(window.location.pathname);
      const hash = decodeURIComponent(window.location.hash);
      const search = decodeURIComponent(window.location.search);
      return `${path} ${hash} ${search}`;
    } catch (e) {
      return `${window.location.pathname} ${window.location.hash} ${window.location.search}`;
    }
  });

  const navigateTo = (path: string) => {
    try {
      const isGitHubPages = window.location.hostname.includes('github.io');
      let targetPath = path;
      const hashMatch = path.match(/#\w+$/);
      const hashSuffix = hashMatch ? hashMatch[0] : '';
      const pLower = path.toLowerCase();

      if (isGitHubPages) {
        const segments = window.location.pathname.split('/');
        const base = segments[1];
        const specialRoutes = ['admin', 'inscricoes', 'criadores', 'progresso-creator', 'progresso', 'creator', 'artes', 'eventos', 'minha-agenda', 'criar-evento', 'pets', 'noticias', 'notificacoes', 'perfil', 'passaporte', 'pkxd-id', 'comunidade', 'missoes', 'login', 'createaccount', 'register', 'resetpassword', 'recuperarsenha', 'privacidade', 'termos-de-uso', 'termos', 'direitos', 'privacidade-e-direitos'];
        const baseIsSpecial = base && specialRoutes.some(r => base.toLowerCase() === r);
        const prefix = baseIsSpecial || !base ? '' : `/${base}`;

        if (pLower.includes('cookies')) {
          setIsCookiePreferencesOpen(true);
          return;
        } else if (pLower.includes('admin')) {
          targetPath = `${prefix}/admin/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('notificacoes') || pLower.includes('notificações')) {
          targetPath = `${prefix}/notificacoes/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('perfil')) {
          targetPath = `${prefix}/perfil/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('minha-agenda')) {
          targetPath = `${prefix}/minha-agenda/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('criar-evento')) {
          targetPath = `${prefix}/criar-evento/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('/pets') || pLower === 'pets') {
          targetPath = `${prefix}/pets/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('/noticias/')) {
          const articlePart = path.replace(/^.*\/noticias\//i, '').split('#')[0].replace(/\/$/, '');
          targetPath = `${prefix}/noticias/${articlePart}${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('noticias') || pLower.includes('notícias')) {
          targetPath = `${prefix}/noticias/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('direitos') || pLower.includes('privacidade-e-direitos')) {
          targetPath = `${prefix}/privacidade-e-direitos/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('privacidade') || pLower.includes('politica')) {
          targetPath = `${prefix}/privacidade/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('termos')) {
          targetPath = `${prefix}/termos-de-uso/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('inscric')) {
          targetPath = `${prefix}/inscricoes/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('criadores')) {
          targetPath = `${prefix}/criadores/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('progresso') || pLower.includes('creator') || pLower.includes('analyzer')) {
          targetPath = `${prefix}/progresso-creator/${hashSuffix}`;
          setShowCreatorAnalyzer(true);
        } else if (pLower.includes('createaccount') || pLower.includes('create-account') || pLower.includes('cadastro') || pLower.includes('register') || pLower.includes('criar-conta')) {
          targetPath = `${prefix}/createaccount/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('resetpassword') || pLower.includes('reset-password') || pLower.includes('esquecisenha') || pLower.includes('recuperarsenha') || pLower.includes('esqueci-senha')) {
          targetPath = `${prefix}/resetpassword/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('login') || pLower.includes('entrar')) {
          targetPath = `${prefix}/login/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('passaporte') || pLower.includes('pkxd-id') || pLower.includes('pkxdid')) {
          targetPath = `${prefix}/pkxd-id/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('artes')) {
          targetPath = `${prefix}/artes/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('evento')) {
          targetPath = `${prefix}/eventos/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('comunidade')) {
          targetPath = `${prefix}/comunidade/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('missoes')) {
          targetPath = `${prefix}/missoes/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else {
          targetPath = `${prefix}/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        }
      } else {
        if (pLower.includes('cookies')) {
          setIsCookiePreferencesOpen(true);
          return;
        } else if (pLower.includes('admin')) {
          targetPath = `/admin${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('notificacoes') || pLower.includes('notificações')) {
          targetPath = `/notificacoes${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('perfil')) {
          targetPath = `/perfil${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('minha-agenda')) {
          targetPath = `/minha-agenda${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('criar-evento')) {
          targetPath = `/criar-evento${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('/pets') || pLower === 'pets') {
          targetPath = `/pets${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('/noticias/')) {
          const articlePart = path.replace(/^.*\/noticias\//i, '').split('#')[0].replace(/\/$/, '');
          targetPath = `/noticias/${articlePart}${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('noticias') || pLower.includes('notícias')) {
          targetPath = `/noticias${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('direitos') || pLower.includes('privacidade-e-direitos')) {
          targetPath = `/privacidade-e-direitos${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('privacidade') || pLower.includes('politica')) {
          targetPath = `/privacidade${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('termos')) {
          targetPath = `/termos-de-uso${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('inscric')) {
          targetPath = `/inscricoes${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('criadores')) {
          targetPath = `/criadores${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('progresso') || pLower.includes('creator') || pLower.includes('analyzer')) {
          targetPath = `/progresso-creator${hashSuffix}`;
          setShowCreatorAnalyzer(true);
        } else if (pLower.includes('createaccount') || pLower.includes('create-account') || pLower.includes('cadastro') || pLower.includes('register') || pLower.includes('criar-conta')) {
          targetPath = `/createaccount${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('resetpassword') || pLower.includes('reset-password') || pLower.includes('esquecisenha') || pLower.includes('recuperarsenha') || pLower.includes('esqueci-senha')) {
          targetPath = `/resetpassword${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('login') || pLower.includes('entrar')) {
          targetPath = `/login${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('passaporte') || pLower.includes('pkxd-id') || pLower.includes('pkxdid')) {
          targetPath = `/pkxd-id${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('artes')) {
          targetPath = `/artes${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('evento')) {
          targetPath = `/eventos${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('comunidade')) {
          targetPath = `/comunidade${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else if (pLower.includes('missoes')) {
          targetPath = `/missoes${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        } else {
          targetPath = `/${hashSuffix}`;
          setShowCreatorAnalyzer(false);
        }
      }

      window.history.pushState({}, '', targetPath);
      
      try {
        const p = decodeURIComponent(window.location.pathname);
        const h = decodeURIComponent(window.location.hash);
        const s = decodeURIComponent(window.location.search);
        setCurrentPath(`${targetPath} ${p} ${h} ${s}`);
      } catch (e) {
        setCurrentPath(targetPath);
      }

      // scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error(e);
    }
  };

  const isAdminRoute = currentPath.toLowerCase().includes('/admin') || 
                        currentPath.toLowerCase().includes('admin');
  const showAdminPanel = isAdminRoute;
  const setShowAdminPanel = (show: boolean) => {
    if (show) {
      navigateTo('/admin');
    } else {
      navigateTo('/');
    }
  };

  const isLoginRoute = currentPath.toLowerCase().includes('/login') || 
                       (currentPath.toLowerCase().includes('login') && !currentPath.toLowerCase().includes('admin'));
  const isRegisterRoute = currentPath.toLowerCase().includes('createaccount') || 
                          currentPath.toLowerCase().includes('create-account') || 
                          currentPath.toLowerCase().includes('cadastro') || 
                          currentPath.toLowerCase().includes('register') || 
                          currentPath.toLowerCase().includes('criar-conta');
  const isResetRoute = currentPath.toLowerCase().includes('resetpassword') || 
                       currentPath.toLowerCase().includes('reset-password') || 
                       currentPath.toLowerCase().includes('esquecisenha') || 
                       currentPath.toLowerCase().includes('recuperarsenha') || 
                       currentPath.toLowerCase().includes('esqueci-senha');

  const isAuthRoute = isLoginRoute || isRegisterRoute || isResetRoute;
  const [explicitAuthModalOpen, setExplicitAuthModalOpen] = useState(false);
  const [explicitAuthMode, setExplicitAuthMode] = useState<AuthMode>('login');

  const isAuthModalOpen = isAuthRoute || explicitAuthModalOpen;
  const currentAuthModalMode: AuthMode = isRegisterRoute 
    ? 'register' 
    : (isResetRoute ? 'resetpassword' : (isLoginRoute ? 'login' : explicitAuthMode));

  useEffect(() => {
    const handlePopState = () => {
      try {
        const p = decodeURIComponent(window.location.pathname);
        const h = decodeURIComponent(window.location.hash);
        const s = decodeURIComponent(window.location.search);
        const combined = `${p} ${h} ${s}`;
        setCurrentPath(combined);
        const cLower = combined.toLowerCase();
        if (!cLower.includes('criadores') && (cLower.includes('progresso') || cLower.includes('creator') || cLower.includes('analyzer'))) {
          setShowCreatorAnalyzer(true);
        } else {
          setShowCreatorAnalyzer(false);
        }
      } catch (e) {
        const combined = `${window.location.pathname} ${window.location.hash} ${window.location.search}`;
        setCurrentPath(combined);
        const cLower = combined.toLowerCase();
        if (!cLower.includes('criadores') && (cLower.includes('progresso') || cLower.includes('creator') || cLower.includes('analyzer'))) {
          setShowCreatorAnalyzer(true);
        } else {
          setShowCreatorAnalyzer(false);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync currentPath with activeTab & communitySubTab
  useEffect(() => {
    document.documentElement.lang = 'pt-BR';
    document.documentElement.classList.add('notranslate');

    const pLower = currentPath.toLowerCase();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const hasIdParam = searchParams && (searchParams.has('id') || searchParams.has('passaporte') || searchParams.has('tag') || searchParams.has('p') || searchParams.has('pkxd-id'));

    if (pLower.includes('artes')) {
      setActiveTab('artes');
      setCommunitySubTab('artes');
    } else if (pLower.includes('evento')) {
      setActiveTab('eventos');
    } else if (pLower.includes('criadores') || pLower.includes('progresso') || pLower.includes('creator') || pLower.includes('analyzer')) {
      setActiveTab('criadores');
    } else if (hasIdParam || pLower.includes('passaporte') || pLower.includes('pkxd-id') || pLower.includes('pkxdid') || pLower.includes('/id')) {
      setActiveTab('passaporte');
      setCommunitySubTab('pkxd-id');
    } else if (pLower.includes('comunidade') || pLower.includes('mural') || pLower.includes('ouvidoria') || pLower.includes('feedback') || pLower.includes('denuncias')) {
      setActiveTab('comunidade');
      if (pLower.includes('ouvidoria') || pLower.includes('feedback') || pLower.includes('denuncias')) {
        setCommunitySubTab('ouvidoria');
      } else {
        setCommunitySubTab('mural');
      }
    } else if (pLower.includes('missoes') || pLower.includes('missao')) {
      setActiveTab('missoes');
      setCommunitySubTab('missoes');
    } else if (!pLower.includes('admin') && !pLower.includes('inscric') && !showCreatorAnalyzer) {
      setActiveTab('inicio');
    }
  }, [currentPath, showCreatorAnalyzer]);

  // Register Service Worker for Web Push on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('PKXD Central Service Worker registered successfully:', reg);
        })
        .catch((err) => {
          console.error('PKXD Central Service Worker registration failed:', err);
        });
    }
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };
  
  const [newsToEdit, setNewsToEdit] = useState<NewsItem | null>(null);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  // Global Privacy, Cookie Preferences & Data Request State
  const [isCookiePreferencesOpen, setIsCookiePreferencesOpen] = useState(false);
  const [isUserDataRequestOpen, setIsUserDataRequestOpen] = useState(false);
  const [userDataRequestInitialType, setUserDataRequestInitialType] = useState<DataRequestType>('access');

  // Dynamic scroll position state to make alert notifications scroll position responsive!
  const [scrollY, setScrollY] = useState(0);
  const isMyAgendaRoute = currentPath.toLowerCase().includes('minha-agenda');
  const isCreateEventRoute = currentPath.toLowerCase().includes('criar-evento');
  const isPetsRoute = /(?:^|\/|\s)pets(?:\/|\s|#|\?|$)/i.test(currentPath);
  const isNewsRoute = currentPath.toLowerCase().includes('/noticias');
  const isNotificationsRoute = currentPath.toLowerCase().includes('/notificacoes') || currentPath.toLowerCase().includes('/notificações');
  const isProfileRoute = currentPath.toLowerCase().includes('/perfil');

  const newsArticleMatch = currentPath.match(/\/noticias\/([^/\s#?]+)/i);
  const selectedNewsArticleId = newsArticleMatch ? newsArticleMatch[1] : null;

  const isApplicationsRoute = currentPath.toLowerCase().includes('inscric') || 
                               currentPath.toLowerCase().includes('inscriç') || 
                               currentPath.toLowerCase().includes('inscricao');
  const isCreatorsDirRoute = currentPath.toLowerCase().includes('criadores');
  const isCreatorProgressRoute = !isCreatorsDirRoute && (
                                 showCreatorAnalyzer ||
                                 currentPath.toLowerCase().includes('progresso') ||
                                 currentPath.toLowerCase().includes('creator') ||
                                 currentPath.toLowerCase().includes('analyzer'));
  const isCreatorsSectionRoute = isCreatorsDirRoute || isCreatorProgressRoute;
  const isPrivacyCenterRoute = currentPath.toLowerCase().includes('direitos') || 
                               currentPath.toLowerCase().includes('privacidade-e-direitos') || 
                               currentPath.toLowerCase().includes('privacidade-central');
  const isPrivacyPolicyRoute = !isPrivacyCenterRoute && (
                               currentPath.toLowerCase().includes('privacidade') || 
                               currentPath.toLowerCase().includes('politica')
                             );
  const isTermsRoute = currentPath.toLowerCase().includes('termos');

  useEffect(() => {
    try {
      if (isAdminRoute) {
        document.title = "PKXD Central - Painel Admin";
      } else if (isPetsRoute) {
        document.title = "PKXD Central - Pets (Doação e Troca)";
      } else if (isNewsRoute) {
        document.title = "PKXD Central - Notícias PK XD";
      } else if (isNotificationsRoute) {
        document.title = "PKXD Central - Notificações";
      } else if (isProfileRoute) {
        document.title = "PKXD Central - Meu Perfil & XP";
      } else if (isMyAgendaRoute) {
        document.title = "PKXD Central - Minha Agenda PKXD";
      } else if (isCreateEventRoute) {
        document.title = "PKXD Central - Criar Novo Evento";
      } else if (isCreatorProgressRoute) {
        document.title = "PKXD Central - Creator Progress Analyzer";
      } else if (isApplicationsRoute) {
        document.title = "PKXD Central - Inscrições";
      } else if (isPrivacyCenterRoute) {
        document.title = "PKXD Central - Privacidade e Direitos";
      } else if (isPrivacyPolicyRoute) {
        document.title = "PKXD Central - Política de Privacidade";
      } else if (isTermsRoute) {
        document.title = "PKXD Central - Termos de Uso";
      } else {
        document.title = "PKXD Central";
      }
    } catch (e) {
      console.warn(e);
    }
  }, [isAdminRoute, isNewsRoute, isNotificationsRoute, isProfileRoute, isMyAgendaRoute, isCreateEventRoute, isApplicationsRoute, isCreatorProgressRoute, isPrivacyCenterRoute, isPrivacyPolicyRoute, isTermsRoute]);
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // New delay & notification states
  const [isDelayed, setIsDelayed] = useState(false);
  const [delayMessage, setDelayMessage] = useState('');
  const [notificationList, setNotificationList] = useState<AppNotification[]>([]);
  const [personalPetNotifications, setPersonalPetNotifications] = useState<AppNotification[]>([]);
  const sessionStartRef = useRef<number>(Date.now());
  const alertedPetNotifIdsRef = useRef<Set<string>>(new Set());
  const [notificationReactions, setNotificationReactions] = useState<Record<string, 'like' | 'dislike'>>(() => {
    try {
      const saved = localStorage.getItem('pkxd_notif_reactions');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const handleNotificationReaction = (notifId: string, type: 'like' | 'dislike') => {
    triggerAudio('tap');
    setNotificationReactions(prev => {
      const current = prev[notifId];
      let updated: Record<string, 'like' | 'dislike'>;
      if (current === type) {
        // undo reaction
        const copy = { ...prev };
        delete copy[notifId];
        updated = copy;
      } else {
        updated = { ...prev, [notifId]: type };
      }
      try {
        localStorage.setItem('pkxd_notif_reactions', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };
  const [isNotifOverlayOpen, setIsNotifOverlayOpen] = useState(false);
  const [seenNotifIds, setSeenNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('seen_notification_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [hasNotificationPermission, setHasNotificationPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  // Helper utility to convert base64 VAPID public key to Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Reusable function to subscribe the client to Web Push notifications
  const subscribeUserToPush = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push is not fully supported in this browser.');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      
      const keyRes = await fetch('/api/vapid-public-key');
      if (!keyRes.ok) throw new Error('Falha ao obter chave pública de push');
      const { publicKey: publicVapidKey } = await keyRes.json();
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      console.log('PKXD Central subscription generated:', subscription);

      // Secure serialization using .toJSON() to prevent empty object bugs in some browsers
      const serializedSubscription = subscription.toJSON();

      // Send subscription object to the server
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializedSubscription)
      });
    } catch (err) {
      console.error('Falha ao registrar push no servidor:', err);
    }
  };

  // Automatically attempt push subscription sync if permission is granted
  useEffect(() => {
    if (hasNotificationPermission) {
      subscribeUserToPush();
    }
  }, [hasNotificationPermission]);

  // Fullscreen spoiler overlay state
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenData, setFullscreenData] = useState<{title: string, desc: string, imageUrl?: string} | null>(null);

  // Session tracking to avoid clock drift issues on real-time notifications
  const initialNotifIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Sync account name into localStorage tags if generic or empty
        const accountName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : '');
        if (accountName) {
          const curTag = localStorage.getItem('pkxd_player_tag');
          const curNick = localStorage.getItem('pkxd_nickname');
          if (!curTag || curTag === 'JOGADOR' || curTag === 'JOGADOR#000' || curTag === 'GUEST') {
            localStorage.setItem('pkxd_player_tag', accountName);
          }
          if (!curNick || curNick === 'Explorador' || curNick === 'Fã Secreto' || curNick === 'JOGADOR') {
            localStorage.setItem('pkxd_nickname', accountName);
          }
          if (!localStorage.getItem('pkxd_username_nickname')) {
            localStorage.setItem('pkxd_username_nickname', accountName);
          }
        }

        if (currentUser.email) {
          const email = currentUser.email.toLowerCase().trim();
          const adminEmails = [
            'kawanyuri35@gmail.com',
            'eukoosh@gmail.com',
            'sg4924603@gmail.com',
            'lucasadriano16794@gmail.com'
          ];
          if (adminEmails.includes(email)) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } else {
        // If not authenticated via Google, check if we have fallback admin session in localStorage
        try {
          if (localStorage.getItem('pkxd_fallback_admin_logged') === 'true') {
            setIsAdmin(true);
            setUser({
              uid: 'admin_fallback',
              email: 'kawanyuri35@gmail.com',
              displayName: 'Kawanyuri (Admin)',
            } as any);
            setIsAuthInitializing(false);
            return;
          }
        } catch (e) {}

        setIsAdmin(false);
        setUser(null);
      }
      setIsAuthInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  // Ensure authenticated user profile and email are ALWAYS successfully synced to Firestore cloud database
  useEffect(() => {
    const ensureUserProfileSynced = async () => {
      if (!user || user.uid === 'guest' || user.uid === 'guest_temp') return;
      
      const cleanedId = user.uid.trim();
      if (!cleanedId) return;

      const userDocRef = doc(db, 'leaderboard', cleanedId);
      try {
        // Read current progress from localStorage as fallback/initial values
        let currentLevel = 1;
        let currentXp = 0;
        let currentFlames = 1;
        let currentInstagram = '';
        let currentInstagramPublic = true;
        
        try {
          currentLevel = Number(localStorage.getItem('pkxd_fan_level')) || 1;
          currentXp = Number(localStorage.getItem('pkxd_fan_xp')) || 0;
          currentFlames = Number(localStorage.getItem('pkxd_fire_streak')) || 1;
          currentInstagram = localStorage.getItem('pkxd_user_instagram') || '';
          currentInstagramPublic = localStorage.getItem('pkxd_user_instagram_public') !== 'false';
        } catch (e) {}

        const payload: any = {
          id: cleanedId,
          email: user.email || '',
          name: user.displayName || localStorage.getItem('pkxd_username_nickname') || 'Fã Secreto',
          level: currentLevel,
          xp: currentXp,
          flames: currentFlames,
          instagram: currentInstagram,
          instagramPublic: currentInstagramPublic,
          photoUrl: user.photoURL || '',
          updatedAt: Date.now()
        };

        if (cleanedId === 'admin_fallback') {
          payload.admin_secret = "pkxd2026_super_secret_admin_key";
        }

        // We use setDoc with merge to ensure we don't overwrite any newer XP/level progress
        // if they already have one in Firestore, but we always write their email and ID!
        await setDoc(userDocRef, {
          id: cleanedId,
          email: user.email || '',
          name: payload.name,
          updatedAt: Date.now()
        }, { merge: true });

        console.log("Successfully ensured user profile and email are synced to cloud:", user.email);
      } catch (err) {
        console.warn("Could not ensure cloud user file is synchronized:", err);
      }
    };

    ensureUserProfileSynced();
  }, [user]);

  // Capture Google login Redirect results (Resolves popup-closed errors on mobile)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          triggerAudio('success');
          
          // Check if this redirect was specifically for connecting Gmail
          let isGmailPending = false;
          try {
            isGmailPending = localStorage.getItem('pending_gmail_connect') === 'true';
          } catch (e) {}
          
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (isGmailPending && credential?.accessToken) {
            try {
              localStorage.setItem('pkxd_gmail_token', credential.accessToken);
              localStorage.removeItem('pending_gmail_connect');
            } catch (e) {}
            setNotifMessage(`Gmail do Admin conectado com sucesso via redirecionamento!`);
          } else {
            setNotifMessage(`Bem-vindo, ${result.user.displayName || 'Admin'}!`);
          }
          
          setTimeout(() => setNotifMessage(null), 4000);
        }
      })
      .catch((error: any) => {
        console.error("Redirect login failed:", error);
        const rawMsg = error?.message || String(error);
        const errorMsgLower = rawMsg.toLowerCase();
        const codeLower = (error?.code || '').toLowerCase();
        
        let errorMsg = rawMsg;
        if (codeLower === 'auth/unauthorized-domain' || errorMsgLower.includes('unauthorized-domain') || errorMsgLower.includes('domain-not-authorized')) {
          errorMsg = `⚠️ DOMÍNIO NÃO AUTORIZADO NO FIREBASE! O domínio atual do seu site ("${window.location.hostname}") não está cadastrado ou autorizado no seu projeto do Firebase. Você precisa adicionar "${window.location.hostname}" na lista de Domínios Autorizados no seu Firebase Console (Authentication > Configurações > Domínios Autorizados) para liberar o login com o Google!`;
        } else if (codeLower === 'auth/operation-not-allowed' || errorMsgLower.includes('operation-not-allowed')) {
          errorMsg = `⚠️ MÉTODO DE LOGIN GOOGLE DESATIVADO!\n\nEste erro acontece porque o login com o Google não está ativado no Authentication do seu Firebase. Siga esses passos rápidos para ativar:\n\n1️⃣ Acesse o console: https://console.firebase.google.com e entre no seu projeto "pkxd-e817c".\n2️⃣ No menu esquerdo, acesse "Compilação" (Build) > "Authentication".\n3️⃣ Clique na aba "Sign-in method" (Método de login) no topo.\n4️⃣ Clique no botão "Adicionar novo provedor" (Add new provider) e selecione "Google".\n5️⃣ Ative o interruptor de ativação (Enable) no topo.\n6️⃣ Configure o e-mail de suporte e clique em "Salvar" (Save).\n\nProntinho! Após salvar, atualize esta página e clique em conectar! 🚀`;
        }
        setGoogleAuthError(errorMsg);
      });
  }, []);

  // Register service worker for mobile notifications support & restore favicon dynamic updates as requested
  useEffect(() => {
    let logoIconUrl = siteLogoUrl;
    if (!logoIconUrl || logoIconUrl.includes("photos.app.goo.gl") || logoIconUrl.includes("google.com/photos")) {
      logoIconUrl = "./favicon.png";
    }
    
    if (logoIconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = logoIconUrl;
      if (logoIconUrl.endsWith('.svg')) {
        link.setAttribute('type', 'image/svg+xml');
      } else {
        link.removeAttribute('type');
      }
    }
  }, [siteLogoUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully:', reg.scope);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }
  }, []);

  // Realtime Firebase news listener
  useEffect(() => {
    const newsRef = collection(db, 'news');
    const unsubscribe = onSnapshot(newsRef, (snapshot) => {
      let list: NewsItem[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as NewsItem);
      });
      
      // Memory sort by id descending
      list.sort((a, b) => {
        const numA = parseInt(a.id);
        const numB = parseInt(b.id);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numB - numA;
        }
        return b.id.localeCompare(a.id);
      });

      if (list.length > 0) {
        setNewsList(list);
        localStorage.setItem('pkxd_central_news', JSON.stringify(list));
      } else {
        // Fallback to defaults
        setNewsList(INITIAL_NEWS);
      }
    }, (error) => {
      console.warn("Could not fetch real-time news:", error);
    });

    return () => unsubscribe();
  }, []);

  // Realtime Firebase settings listener
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'app');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      const defaultTitle = 'Aguardando Próximos Spoilers!';
      const defaultDesc = 'Ainda não temos spoilers ativos para esta semana. Fique atento ao nosso canal no WhatsApp para novidades e acompanhe a contagem regressiva toda segunda às 17h30!';

      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Safeguard partial updates: only alter local states when those specific fields are present in the snapshot
        if (data.spoilerTitle !== undefined && data.spoilerTitle !== null) {
          setSpoilerTitle(data.spoilerTitle);
          localStorage.setItem('pkxd_spoiler_title', data.spoilerTitle);
        }

        if (data.spoilerDesc !== undefined && data.spoilerDesc !== null) {
          setSpoilerDesc(data.spoilerDesc);
          localStorage.setItem('pkxd_spoiler_desc', data.spoilerDesc);
        }

        if (data.spoilerImageUrl !== undefined && data.spoilerImageUrl !== null) {
          setSpoilerImage(data.spoilerImageUrl);
          localStorage.setItem('pkxd_spoiler_image', data.spoilerImageUrl);
        }

        if (data.logoUrl !== undefined && data.logoUrl !== null) {
          setSiteLogoUrl(data.logoUrl);
          localStorage.setItem('pkxd_site_logo_url', data.logoUrl);
        }

        if (data.forceReveal !== undefined && data.forceReveal !== null) {
          const forceVal = data.forceReveal;
          setForceReveal(forceVal);
          localStorage.setItem('pkxd_force_reveal', forceVal ? 'true' : 'false');
        }

        if (data.revealedAt !== undefined && data.revealedAt !== null) {
          const revealedVal = data.revealedAt;
          setRevealedAt(revealedVal);
          localStorage.setItem('pkxd_spoiler_revealed_at', String(revealedVal));
        }

        if (data.extraCountdownTitle !== undefined && data.extraCountdownTitle !== null) {
          setExtraCountdownTitle(data.extraCountdownTitle);
        }

        if (data.extraCountdownDate !== undefined && data.extraCountdownDate !== null) {
          setExtraCountdownDate(data.extraCountdownDate);
        }

        if (data.extraCountdownEnabled !== undefined && data.extraCountdownEnabled !== null) {
          setExtraCountdownEnabled(data.extraCountdownEnabled);
        }

        if (data.isDelayed !== undefined && data.isDelayed !== null) {
          setIsDelayed(data.isDelayed);
        }

        if (data.delayMessage !== undefined && data.delayMessage !== null) {
          setDelayMessage(data.delayMessage);
        }

        if (data.giftCountdownTitle !== undefined && data.giftCountdownTitle !== null) {
          setGiftCountdownTitle(data.giftCountdownTitle);
        }

        if (data.giftCountdownDate !== undefined && data.giftCountdownDate !== null) {
          setGiftCountdownDate(data.giftCountdownDate);
        }

        if (data.giftCountdownEnabled !== undefined && data.giftCountdownEnabled !== null) {
          setGiftCountdownEnabled(data.giftCountdownEnabled);
        }

        if (data.giftCountdownContent !== undefined && data.giftCountdownContent !== null) {
          setGiftCountdownContent(data.giftCountdownContent);
        }
      } else {
        // Document does not exist or has been deleted - fallback to defaults immediately
        setSpoilerTitle(defaultTitle);
        localStorage.setItem('pkxd_spoiler_title', defaultTitle);
        setSpoilerDesc(defaultDesc);
        localStorage.setItem('pkxd_spoiler_desc', defaultDesc);
        setSpoilerImage('');
        localStorage.setItem('pkxd_spoiler_image', '');
        setSiteLogoUrl('');
        localStorage.setItem('pkxd_site_logo_url', '');
        setForceReveal(false);
        localStorage.setItem('pkxd_force_reveal', 'false');
        setRevealedAt(0);
        localStorage.setItem('pkxd_spoiler_revealed_at', '0');
        setExtraCountdownTitle('');
        setExtraCountdownDate('');
        setExtraCountdownEnabled(false);
        setIsDelayed(false);
        setDelayMessage('');
        setGiftCountdownTitle('PRESENTE SURPRESA!');
        setGiftCountdownDate('');
        setGiftCountdownEnabled(false);
        setGiftCountdownContent('');
      }
    }, (error) => {
      console.warn("Could not fetch real-time settings:", error);
    });

    return () => unsubscribe();
  }, []);

  // Realtime Notifications subscription
  useEffect(() => {
    const ref = collection(db, 'notifications');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt || parseInt(a.id) || 0;
        const timeB = b.createdAt || parseInt(b.id) || 0;
        return timeB - timeA;
      });
      setNotificationList(list);

      if (isFirstLoadRef.current) {
        // Collect existing notification IDs to prevent alerting on page load
        snapshot.forEach(doc => {
          initialNotifIdsRef.current.add(doc.id);
        });
        isFirstLoadRef.current = false;
        return;
      }

      // Check for newly added items since page subscription started
      let newNotif: AppNotification | null = null;
      for (const item of list) {
        if (!initialNotifIdsRef.current.has(item.id)) {
          // It's a new notification! Let's alert.
          newNotif = item;
          // Add to seen set so we don't alert again
          initialNotifIdsRef.current.add(item.id);
          break; // alert only the most recent new one
        }
      }

      if (newNotif) {
        triggerAudio('success');
        // Let's set the message text
        setNotifMessage(`📢 ${newNotif.title.toUpperCase()}: ${newNotif.body}`);

        // Trigger native system notification (using service worker wrapper for mobile compatibility!)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const notifTitle = newNotif.title;
            const notifOptions = {
              body: newNotif.body,
              tag: newNotif.id,
              icon: 'https://img.icons8.com/color/96/000000/bell.png',
              badge: '/favicon.png',
              vibrate: [100, 50, 100]
            };

            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(notifTitle, notifOptions);
              }).catch(() => {
                new Notification(notifTitle, notifOptions);
              });
            } else {
              new Notification(notifTitle, notifOptions);
            }
          } catch (err) {
            console.warn("Could not dispatch native browser notification:", err);
          }
        }

        // Auto clear after 8 seconds
        setTimeout(() => setNotifMessage(null), 8000);
      }
    }, (error) => {
      console.warn("Could not fetch notifications:", error);
    });
    return () => unsubscribe();
  }, []);

  // Periodic checkout alert triggers (for Monday countdown)
  useEffect(() => {
    const checkAndNotifyCountdown = async () => {
      // Calculate target next Monday at 17:30
      const now = new Date();
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
      targetDate.setHours(17, 30, 0, 0);
      
      // If today is Monday and already past 17:30, target is next Monday
      if (now.getDay() === 1 && (now.getHours() > 17 || (now.getHours() === 17 && now.getMinutes() >= 30))) {
        targetDate.setDate(targetDate.getDate() + 7);
      }

      const diffMs = targetDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // We only notify if we are within certain intervals, say 24h, 3h, 1h, or 10m
      let notificationKey = '';
      let messageBody = '';

      if (diffHours > 0) {
        if (diffHours <= 0.16) { // < 10 mins
          notificationKey = 'countdown_10m';
          messageBody = '🚨 ATENÇÃO! Falta menos de 10 minutos para revelar os Spoilers PK XD! Fique atualizado!';
        } else if (diffHours <= 1.0) { // < 1 hour
          notificationKey = 'countdown_1h';
          messageBody = '⏰ FALTAM 60 MINUTOS! A carga de spoilers está quase completa! Entre no site para acompanhar.';
        } else if (diffHours <= 3.0) { // < 3 hours
          notificationKey = 'countdown_3h';
          messageBody = '🔥 SÓ MAIS 3 HORAS! Preparados para os novos itens e pacotes incríveis? Faltam 3h!';
        }
      }

      if (notificationKey && messageBody) {
        const lastSent = localStorage.getItem(`last_notif_${notificationKey}`);
        const todayStr = now.toDateString(); // only notify once per day of this bracket
        if (lastSent !== todayStr) {
          // If we are admin, let's auto-push this countdown alert!
          if (isAdmin) {
            try {
              const notifId = Date.now().toString();
              const notifRef = doc(db, 'notifications', notifId);
              await setDoc(notifRef, {
                id: notifId,
                title: '⏰ CONTAGEM REGRESSIVA!',
                body: messageBody,
                type: 'countdown_alert',
                createdAt: Date.now(),
                admin_secret: "pkxd2026_super_secret_admin_key"
              });
              localStorage.setItem(`last_notif_${notificationKey}`, todayStr);
            } catch (e) {
              console.warn("Could not dispatch auto countdown:", e);
            }
          } else {
            // Local fallback alarm for regular users!
            triggerAudio('tap');
            setNotifMessage(`📢 ALERTA: ${messageBody}`);
            setTimeout(() => setNotifMessage(null), 8500);
            localStorage.setItem(`last_notif_${notificationKey}`, todayStr);
          }
        }
      }
    };

    // run on startup
    checkAndNotifyCountdown();

    // and check every 5 minutes
    const interval = setInterval(checkAndNotifyCountdown, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Realtime Featured Videos subscription
  useEffect(() => {
    const ref = collection(db, 'featured_videos');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list: FeaturedVideo[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as FeaturedVideo);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt || parseInt(a.id) || 0;
        const timeB = b.createdAt || parseInt(b.id) || 0;
        return timeB - timeA;
      });
      if (list.length > 0) {
        setFeaturedList(list);
        saveToCache('pkxd_cache_featured_videos', list);
      }
    }, (error) => {
      console.warn("Could not fetch featured videos:", error);
    });
    return () => unsubscribe();
  }, []);

  // Realtime Theories subscription
  useEffect(() => {
    const ref = collection(db, 'theories');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list: Theory[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Theory);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt || parseInt(a.id) || 0;
        const timeB = b.createdAt || parseInt(b.id) || 0;
        return timeB - timeA;
      });
      if (list.length > 0) {
        setTheoriesList(list);
        saveToCache('pkxd_cache_theories', list);
      }
    }, (error) => {
      console.warn("Could not fetch theories:", error);
    });
    return () => unsubscribe();
  }, []);

  // Realtime curated Shorts subscription
  useEffect(() => {
    const ref = collection(db, 'shorts');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list: ShortItem[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as ShortItem);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt || parseInt(a.id) || 0;
        const timeB = b.createdAt || parseInt(b.id) || 0;
        return timeB - timeA;
      });
      if (list.length > 0) {
        setShortsList(list);
        saveToCache('pkxd_cache_shorts', list);
      }
    }, (error) => {
      console.warn("Could not fetch shorts:", error);
    });
    return () => unsubscribe();
  }, []);

  // Realtime Past Spoilers subscription
  useEffect(() => {
    const ref = collection(db, 'past_spoilers');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const list: PastSpoiler[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as PastSpoiler);
      });
      list.sort((a, b) => {
        const timeA = a.createdAt || parseInt(a.id) || 0;
        const timeB = b.createdAt || parseInt(b.id) || 0;
        return timeB - timeA;
      });
      if (list.length > 0) {
        setPastSpoilers(list);
        saveToCache('pkxd_cache_past_spoilers', list);
      }
    }, (error) => {
      console.warn("Could not fetch past spoilers:", error);
    });
    return () => unsubscribe();
  }, []);

  // Audio utility wrapper
  const triggerAudio = (type: 'tap' | 'success' | 'levelUp') => {
    if (!soundEnabled) return;
    if (type === 'tap') playTapSound();
    if (type === 'success') playSuccessSound();
    if (type === 'levelUp') playLevelUpSound();
  };

  // Channel constants
  const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8EhsU7j6fzZDRAup3Z";
  const LOGO_ORIGINAL_URL = "https://photos.app.goo.gl/DLW4xhJyQiprwdAQ7";

  // Sign in with Google
  const handleLogin = async () => {
    setIsAuthenticating(true);
    setGoogleAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      triggerAudio('success');
      setNotifMessage(`Bem-vindo, ${result.user.displayName || 'Admin'}!`);
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (error: any) {
      console.error("Login failed:", error);
      const rawMsg = error?.message || String(error);
      const errorMsgLower = rawMsg.toLowerCase();
      const codeLower = (error?.code || '').toLowerCase();
      
      let errorMsg = rawMsg;
      if (codeLower === 'auth/unauthorized-domain' || errorMsgLower.includes('unauthorized-domain') || errorMsgLower.includes('domain-not-authorized')) {
        errorMsg = `⚠️ DOMÍNIO NÃO AUTORIZADO NO FIREBASE! O domínio atual do seu site ("${window.location.hostname}") não está cadastrado ou autorizado no seu projeto do Firebase. Você precisa adicionar "${window.location.hostname}" na lista de Domínios Autorizados nas configurações do seu Firebase Console (Authentication > Configurações > Domínios Autorizados) para liberar o login com o Google!`;
      } else if (codeLower === 'auth/operation-not-allowed' || errorMsgLower.includes('operation-not-allowed')) {
        errorMsg = `⚠️ MÉTODO DE LOGIN GOOGLE DESATIVADO!\n\nEste erro acontece porque o login com o Google não está ativado no Authentication do seu Firebase. Siga esses passos rápidos para ativar:\n\n1️⃣ Acesse o console: https://console.firebase.google.com e entre no seu projeto "pkxd-e817c".\n2️⃣ No menu esquerdo, acesse "Compilação" (Build) > "Authentication".\n3️⃣ Clique na aba "Sign-in method" (Método de login) no topo.\n4️⃣ Clique no botão "Adicionar novo provedor" (Add new provider) e selecione "Google".\n5️⃣ Ative o interruptor de ativação (Enable) no topo.\n6️⃣ Configure o e-mail de suporte e clique em "Salvar" (Save).\n\nProntinho! Após salvar, atualize esta página e clique em conectar! 🚀`;
      }
      setGoogleAuthError(errorMsg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLoginRedirect = async () => {
    setIsAuthenticating(true);
    setGoogleAuthError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Redirect login failed:", error);
      const rawMsg = error?.message || String(error);
      const errorMsgLower = rawMsg.toLowerCase();
      const codeLower = (error?.code || '').toLowerCase();
      
      let errorMsg = rawMsg;
      if (codeLower === 'auth/unauthorized-domain' || errorMsgLower.includes('unauthorized-domain') || errorMsgLower.includes('domain-not-authorized')) {
        errorMsg = `⚠️ DOMÍNIO NÃO AUTORIZADO NO FIREBASE! O domínio atual do seu site ("${window.location.hostname}") não está cadastrado ou autorizado no seu projeto do Firebase. Você precisa adicionar "${window.location.hostname}" na lista de Domínios Autorizados nas configurações do seu Firebase Console (Authentication > Configurações > Domínios Autorizados) para liberar o login com o Google!`;
      } else if (codeLower === 'auth/operation-not-allowed' || errorMsgLower.includes('operation-not-allowed')) {
        errorMsg = `⚠️ MÉTODO DE LOGIN GOOGLE DESATIVADO!\n\nEste erro acontece porque o login com o Google não está ativado no Authentication do seu Firebase. Siga esses passos rápidos para ativar:\n\n1️⃣ Acesse o console: https://console.firebase.google.com e entre no seu projeto "pkxd-e817c".\n2️⃣ No menu esquerdo, acesse "Compilação" (Build) > "Authentication".\n3️⃣ Clique na aba "Sign-in method" (Método de login) no topo.\n4️⃣ Clique no botão "Adicionar novo provedor" (Add new provider) e selecione "Google".\n5️⃣ Ative o interruptor de ativação (Enable) no topo.\n6️⃣ Configure o e-mail de suporte e clique em "Salvar" (Save).\n\nProntinho! Após salvar, atualize esta página e clique em conectar! 🚀`;
      }
      setGoogleAuthError(errorMsg);
      setIsAuthenticating(false);
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    setIsAuthenticating(true);
    setGoogleAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      triggerAudio('success');
      setNotifMessage(`Bem-vindo de volta!`);
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (error: any) {
      console.error("Email login failed:", error);
      let errMsg = error?.message || String(error);
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-login-credentials' || error?.message?.includes('invalid-credential') || error?.code === 'auth/invalid-credential') {
        errMsg = 'Senha incorreta ou e-mail inválido! Verifique seus dados.';
      } else if (error?.code === 'auth/user-not-found') {
        errMsg = 'E-mail não cadastrado. Cadastre-se grátis para entrar no Ranking!';
      } else if (error?.code === 'auth/invalid-email') {
        errMsg = 'Formato de e-mail inválido!';
      } else if (error?.code === 'auth/too-many-requests') {
        errMsg = 'Muitas tentativas malsucedidas. Tente novamente mais tarde ou redefina sua senha.';
      }
      setGoogleAuthError(`Erro de Login: ${errMsg}`);
      setNotifMessage(`❌ Erro de Login: ${errMsg}`);
      setTimeout(() => setNotifMessage(null), 8000);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleInitiateEmailRegister = (email: string, pass: string, nickname: string) => {
    setModalAuthError(null);
    setGoogleAuthError(null);
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingEmailVerification({
      email: email.trim(),
      pass: pass,
      nickname: nickname.trim(),
      code: generatedCode,
      createdAt: Date.now()
    });
    setVerificationCodeInput('');
    setResendCooldown(30);
    triggerAudio('tap');
    setNotifMessage(`📩 Código de confirmação enviado para ${email.trim()}! [Código de teste: ${generatedCode}]`);
    setTimeout(() => setNotifMessage(null), 12000);
  };

  const handleResendVerificationCode = () => {
    if (!pendingEmailVerification) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingEmailVerification(prev => prev ? { ...prev, code: newCode } : null);
    setResendCooldown(30);
    triggerAudio('tap');
    setNotifMessage(`🔄 Novo código enviado para ${pendingEmailVerification.email}! [Código: ${newCode}]`);
    setTimeout(() => setNotifMessage(null), 12000);
  };

  const handleConfirmEmailCode = async () => {
    if (!pendingEmailVerification) return;
    if (verificationCodeInput.trim() !== pendingEmailVerification.code) {
      setModalAuthError(`❌ Código de confirmação incorreto! Digite o número de 6 dígitos enviado para ${pendingEmailVerification.email}.`);
      triggerAudio('tap');
      return;
    }

    setIsAuthenticating(true);
    setModalAuthError(null);
    setGoogleAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, pendingEmailVerification.email, pendingEmailVerification.pass);
      const fullTag = pendingEmailVerification.nickname;
      const parts = fullTag.split('#');
      const nickOnly = parts[0] || 'Explorador';
      const numberOnly = parts[1] || '000';

      try {
        localStorage.setItem('pkxd_player_tag', fullTag);
        localStorage.setItem('pkxd_nickname', nickOnly);
        localStorage.setItem('pkxd_player_number', numberOnly);
        localStorage.setItem('pkxd_username_nickname', fullTag);
        setCurrentPlayerTag(fullTag);
      } catch (e) {}

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: fullTag
        });
        try {
          await sendEmailVerification(auth.currentUser);
        } catch (e) {
          console.warn("sendEmailVerification notice:", e);
        }
      }
      setPendingEmailVerification(null);
      setVerificationCodeInput('');
      triggerAudio('levelUp');
      setNotifMessage(`E-mail verificado! Conta criada com sucesso com sua Tag PK XD ${fullTag}!`);
      setTimeout(() => setNotifMessage(null), 5000);
    } catch (error: any) {
      console.error("Email register failed:", error);
      let errMsg = error?.message || String(error);
      if (error?.code === 'auth/email-already-in-use') {
        errMsg = 'Este e-mail já está sendo usado por outro fã! Tente fazer login ou use outro.';
      } else if (error?.code === 'auth/weak-password') {
        errMsg = 'A senha informada é muito fraca. Digite pelo menos 6 caracteres!';
      } else if (error?.code === 'auth/invalid-email') {
        errMsg = 'Endereço de e-mail inválido!';
      } else if (error?.code === 'auth/operation-not-allowed') {
        errMsg = 'O login com E-mail e Senha não está ativado nas configurações do Authentication (Sign-in methods) do seu Firebase Console. Por favor, ative-o lá!';
      }
      setModalAuthError(`Erro ao criar conta: ${errMsg}`);
      setNotifMessage(`❌ Erro ao criar conta: ${errMsg}`);
      setTimeout(() => setNotifMessage(null), 8500);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSavePkxdTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = tagSetupName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const cleanNumber = tagSetupNumber.trim().replace(/[^0-9]/g, '');

    if (!cleanName || cleanName.length < 2) {
      setTagSetupError('Por favor, informe seu Nome no PK XD (mínimo 2 letras).');
      return;
    }
    if (!cleanNumber || cleanNumber.length < 1) {
      setTagSetupError('Por favor, informe o número / tag # do seu PK XD (ex: 245 ou 000).');
      return;
    }

    const res = await saveIdentityCore(cleanName, cleanNumber);
    if (!res.ok) {
      setTagSetupError(res.error || 'Erro ao salvar sua tag.');
      return;
    }

    setShowTagSetupModal(false);
    setTagBannerDismissed(true);
    try {
      sessionStorage.setItem('pkxd_tag_banner_dismissed', 'true');
    } catch (e) {}
  };

  const saveIdentityCore = async (rawName: string, rawNumber: string): Promise<{ ok: boolean; error?: string }> => {
    const cleanName = rawName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const cleanNumber = rawNumber.trim().replace(/[^0-9]/g, '');
    if (cleanName.length < 2) {
      return { ok: false, error: 'Informe seu Nome no PK XD (mínimo 2 caracteres).' };
    }
    if (cleanNumber.length < 1) {
      return { ok: false, error: 'Informe o número da sua # (ex: 245).' };
    }

    const fullTag = `${cleanName}#${cleanNumber}`;
    try {
      localStorage.setItem('pkxd_player_tag', fullTag);
      localStorage.setItem('pkxd_nickname', cleanName);
      localStorage.setItem('pkxd_player_number', cleanNumber);
      localStorage.setItem('pkxd_username_nickname', fullTag);
      setCurrentPlayerTag(fullTag);

      const pRaw = localStorage.getItem('pkxd_passport_data');
      if (pRaw) {
        try {
          const p = JSON.parse(pRaw);
          p.playerTag = fullTag;
          p.nickname = cleanName;
          p.updatedAt = Date.now();
          localStorage.setItem('pkxd_passport_data', JSON.stringify(p));
        } catch {}
      }

      if (db && user?.uid && user.uid !== 'guest_user') {
        const cleanKey = encodeURIComponent(fullTag.trim().toLowerCase().replace(/[.#$/[\]]/g, '_'));
        setDoc(doc(db, 'pkxd_passports', user.uid), {
          playerTag: fullTag,
          nickname: cleanName,
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
        setDoc(doc(db, 'pkxd_public_passports', cleanKey), {
          playerTag: fullTag,
          nickname: cleanName,
          lastSavedAt: Date.now()
        }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      console.warn('Erro ao salvar tag:', err);
    }

    // Server-validated identity save + one-time +25 XP reward
    const userKey = getPersistentUserKey(user);
    const serverRes = await saveServerIdentity({
      userKey,
      pkxdName: cleanName,
      pkxdNumber: cleanNumber,
      displayName: user?.displayName || cleanName,
    });
    if (serverRes.success && serverRes.profile) {
      const levelXp = serverRes.profile.totalXp % 100;
      setXpProfile(serverRes.profile);
      setFanLevel(serverRes.profile.level);
      setFanXP(levelXp);
      try {
        localStorage.setItem('pkxd_fan_level', String(serverRes.profile.level));
        localStorage.setItem('pkxd_fan_xp', String(levelXp));
      } catch {}
    }

    triggerAudio('levelUp');
    if (serverRes.xpAwarded && serverRes.xpAwarded > 0) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setNotifMessage(`Identidade PK XD salva: ${fullTag}! (+25 XP GRÁTIS) Preenchimento automático ativado!`);
    } else {
      setNotifMessage(`Identidade PK XD atualizada para ${fullTag}!`);
    }
    setTimeout(() => setNotifMessage(null), 6500);
    return { ok: true };
  };

  const handleEmailRegister = async (email: string, pass: string, nickname: string) => {
    handleInitiateEmailRegister(email, pass, nickname);
  };

  const handlePasscodeLogin = () => {
    // Strengthened security passcodes as requested to avoid simple brute-force logins
    const validPasscodes = ['pkxdcentral2026_portal_admin', 'kawanyuri_adm_seguro_99', 'central_pkxd_super_acesso_real', 'bela12@!', '19810314'];
    if (validPasscodes.includes(inputPasscode.trim())) {
      try {
        localStorage.setItem('pkxd_fallback_admin_logged', 'true');
      } catch (e) {}
      setIsAdmin(true);
      setUser({
        uid: 'admin_fallback',
        email: 'kawanyuri35@gmail.com',
        displayName: 'Kawanyuri (Admin)',
      } as any);
      triggerAudio('success');
      setNotifMessage("Senha de Admin correta! Acesso liberado!");
      setInputPasscode('');
      setPasscodeError('');
      setUseBackupPasscode(false);
      setTimeout(() => setNotifMessage(null), 4000);
    } else {
      setPasscodeError("Código de acesso incorreto. Tente novamente!");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      try {
        localStorage.removeItem('pkxd_fallback_admin_logged');
      } catch (e) {}
      setUser(null);
      setIsAdmin(false);
      setContinuedAsGuest(false);
      try {
        sessionStorage.removeItem('pkxd_continued_as_guest');
      } catch (e) {}

      // Reset the local stats and localStorage key defaults to completely isolate anonymous sessions from authenticated sessions
      setFanLevel(1);
      setFanXP(0);
      try {
        localStorage.setItem('pkxd_fan_level', '1');
        localStorage.setItem('pkxd_fan_xp', '0');
        localStorage.setItem('pkxd_fire_streak', '1');
        localStorage.setItem('pkxd_gems_count', '150');
        localStorage.setItem('pkxd_coins_count', '1000');
        const randomNum = String(Math.floor(10 + Math.random() * 980)).padStart(2, '0');
        localStorage.setItem('pkxd_username_nickname', `Convidado_${randomNum}`);
        localStorage.removeItem('pkxd_user_instagram');
        localStorage.setItem('pkxd_user_instagram_public', 'true');
        
        // Regenerate unique clientId for a clean slate anonymous session
        const newClientId = 'u_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('pkxd_user_clientId', newClientId);
      } catch (e) {}

      triggerAudio('tap');
      setNotifMessage("Você deslogou com sucesso!");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSwitchTab = (tab: 'register' | 'login') => {
    triggerAudio('tap');
    setModalAuthTab(tab);
    setGoogleAuthError(null);
    setModalAuthError(null);
  };

  const checkAdminWritePermission = (): boolean => {
    if (!user) {
      triggerAudio('tap');
      setNotifMessage("⚠️ ERRO: Conecte-se com sua senha de administrador ou conta.");
      setTimeout(() => setNotifMessage(null), 6000);
      return false;
    }
    return true;
  };

  // Create news
  const handleAddNews = async (newPost: Omit<NewsItem, 'id'>) => {
    if (!checkAdminWritePermission()) return;
    const docId = Date.now().toString();
    const fresh = {
      ...newPost,
      id: docId,
      admin_secret: "pkxd2026_super_secret_admin_key"
    };
    try {
      const docRef = doc(db, 'news', docId);
      await setDoc(docRef, fresh);
      triggerAudio('success');
      setNotifMessage("✅ Publicado com sucesso na nuvem! 🌐");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro de publicação: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Edit existing news
  const handleEditNewsRequest = (item: NewsItem) => {
    setNewsToEdit(item);
    // Scroll smoothly to admin panel
    document.getElementById('admin-panel')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveEdit = async (updatedItem: NewsItem) => {
    if (!checkAdminWritePermission()) return;
    const fresh = {
      ...updatedItem,
      admin_secret: "pkxd2026_super_secret_admin_key"
    };
    try {
      const docRef = doc(db, 'news', updatedItem.id);
      await setDoc(docRef, fresh);
      setNewsToEdit(null);
      triggerAudio('success');
      setNotifMessage("Notícia atualizada com sucesso!");
      setTimeout(() => setNotifMessage(null), 4500);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`Erro ao atualizar notícia: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Delete news
  const handleDeleteNews = async (id: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      const docRef = doc(db, 'news', id);
      await deleteDoc(docRef);
      triggerAudio('tap');
      setNotifMessage("🗑️ Item removido com sucesso!");
      setTimeout(() => setNotifMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao remover: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Helper to compress a single base64 image on the client side
  const compressBase64Image = (base64Str: string, maxDimension = 900, quality = 0.72): Promise<string> => {
    return new Promise((resolve) => {
      if (!base64Str || !base64Str.startsWith('data:image/')) {
        resolve(base64Str);
        return;
      }
      if (base64Str.length < 25000) {
        resolve(base64Str);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
          } else {
            resolve(base64Str);
          }
        } catch (err) {
          console.warn("Compression failed, using original", err);
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  // Helper to scan a text block (like description markdown) and compress any embedded base64 images
  const compressAllBase64InText = async (text: string): Promise<string> => {
    if (!text || !text.includes('data:image/')) return text;
    const regex = /data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/=]+/g;
    const matches = text.match(regex);
    if (!matches) return text;

    let result = text;
    const uniqueMatches = Array.from(new Set(matches));
    for (const match of uniqueMatches) {
      try {
        if (match.length > 30000) { // Only compress if over ~30KB
          const compressed = await compressBase64Image(match, 900, 0.72);
          result = result.split(match).join(compressed);
        }
      } catch (err) {
        console.warn("Failed to compress embedded base64:", err);
      }
    }
    return result;
  };

  // Update spoiler settings and add to history
  const handleUpdateSpoilerSettings = async (title: string, desc: string, imageUrl?: string, forceRevealActive: boolean = false) => {
    if (!checkAdminWritePermission()) return;
    try {
      let finalDesc = desc;
      let finalImageUrl = imageUrl || '';

      if (finalDesc.includes('data:image/')) {
        finalDesc = await compressAllBase64InText(finalDesc);
      }
      if (finalImageUrl.startsWith('data:image/')) {
        finalImageUrl = await compressBase64Image(finalImageUrl, 900, 0.72);
      }

      const docRef = doc(db, 'settings', 'app');
      await setDoc(docRef, {
        spoilerTitle: title,
        spoilerDesc: finalDesc,
        spoilerImageUrl: finalImageUrl,
        forceReveal: forceRevealActive,
        revealedAt: Date.now(),
        admin_secret: "pkxd2026_super_secret_admin_key"
      }, { merge: true });

      // Save a copy to history so it doesn't get lost as we change further spoilers
      const pastId = Date.now().toString();
      const pastRef = doc(db, 'past_spoilers', pastId);
      await setDoc(pastRef, {
        id: pastId,
        title,
        description: finalDesc,
        imageUrl: finalImageUrl,
        createdAt: Date.now(),
        admin_secret: "pkxd2026_super_secret_admin_key"
      });

      // Automatically send a push notification document for the new spoiler/story publication!
      const notifId = Date.now().toString();
      const notifRef = doc(db, 'notifications', notifId);
      const notifTitle = forceRevealActive ? '⚡ NOVO SPOILER LIBERADO AGORA!' : '🔮 AGENDAMENTO DE NOVO SPOILER!';
      const notifBody = `Confira já os novos spoilers oficiais: ${title}`;
      
      await setDoc(notifRef, {
        id: notifId,
        title: notifTitle,
        body: notifBody,
        type: 'story_published',
        createdAt: Date.now(),
        admin_secret: "pkxd2026_super_secret_admin_key"
      });

      // Fetch our secure and robust API route to broadcast immediately
      fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifTitle,
          body: notifBody,
          admin_secret: "pkxd2026_super_secret_admin_key",
          url: '/'
        })
      }).catch(err => console.error("Error broadcasting push:", err));

      triggerAudio('success');
      setNotifMessage("✅ Spoiler atualizado e publicado com sucesso!");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao atualizar spoiler: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Direct insert to past spoilers archive without touching main active spoiler
  const handleDirectArchivePastSpoiler = async (title: string, desc: string, imageUrl?: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      let finalDesc = desc;
      let finalImageUrl = imageUrl || '';

      if (finalDesc.includes('data:image/')) {
        finalDesc = await compressAllBase64InText(finalDesc);
      }
      if (finalImageUrl.startsWith('data:image/')) {
        finalImageUrl = await compressBase64Image(finalImageUrl, 900, 0.72);
      }

      const pastId = Date.now().toString();
      const pastRef = doc(db, 'past_spoilers', pastId);
      await setDoc(pastRef, {
        id: pastId,
        title,
        description: finalDesc,
        imageUrl: finalImageUrl,
        createdAt: Date.now(),
        admin_secret: "pkxd2026_super_secret_admin_key"
      });
      triggerAudio('success');
      setNotifMessage("✅ Spoiler arquivado com sucesso diretamente em Spoilers Anteriores! 🔮");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao arquivar spoiler: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Move current active spotlight spoiler to past archives and clear it
  const handleArchiveAndClearActiveSpoiler = async (title: string, desc: string, imageUrl: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      const isDefault = !title || 
        title === 'Aguardando Próximos Spoilers! 🔮' || 
        title.toLowerCase().includes('aguardando') ||
        title.toLowerCase().includes('sem spoiler') ||
        title.toLowerCase().includes('nenhum spoiler');

      if (isDefault) {
        setNotifMessage("Não há nenhum spoiler real ativo para arquivar no momento!");
        setTimeout(() => setNotifMessage(null), 4000);
        return;
      }

      // 1. Save to past spoilers
      const pastId = Date.now().toString();
      const pastRef = doc(db, 'past_spoilers', pastId);
      await setDoc(pastRef, {
        id: pastId,
        title: title,
        description: desc,
        imageUrl: imageUrl || '',
        createdAt: Date.now(),
        admin_secret: "pkxd2026_super_secret_admin_key"
      });

      // 2. Clear active spoiler settings
      const defaultTitle = 'Aguardando Próximos Spoilers! 🔮';
      const defaultDesc = 'Ainda não temos spoilers ativos para esta semana. Fique atento ao nosso canal no WhatsApp para novidades e acompanhe a contagem regressiva toda segunda às 17h30!';
      const docRef = doc(db, 'settings', 'app');
      await setDoc(docRef, {
        spoilerTitle: defaultTitle,
        spoilerDesc: defaultDesc,
        spoilerImageUrl: '',
        forceReveal: false,
        revealedAt: 0,
        admin_secret: "pkxd2026_super_secret_admin_key"
      }, { merge: true });

      // Update local states & storage
      setSpoilerTitle(defaultTitle);
      localStorage.setItem('pkxd_spoiler_title', defaultTitle);
      setSpoilerDesc(defaultDesc);
      localStorage.setItem('pkxd_spoiler_desc', defaultDesc);
      setSpoilerImage('');
      localStorage.setItem('pkxd_spoiler_image', '');
      setForceReveal(false);
      localStorage.setItem('pkxd_force_reveal', 'false');

      triggerAudio('success');
      setNotifMessage("✅ Destaque arquivado com sucesso e limpo do site! 📦");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao arquivar destaque: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Delete active spoiler directly from the site without archiving it
  const handleDeleteActiveSpoiler = async () => {
    if (!checkAdminWritePermission()) return;
    try {
      const defaultTitle = 'Aguardando Próximos Spoilers! 🔮';
      const defaultDesc = 'Ainda não temos spoilers ativos para esta semana. Fique atento ao nosso canal no WhatsApp para novidades e acompanhe a contagem regressiva toda segunda às 17h30!';
      const docRef = doc(db, 'settings', 'app');
      await setDoc(docRef, {
        spoilerTitle: defaultTitle,
        spoilerDesc: defaultDesc,
        spoilerImageUrl: '',
        forceReveal: false,
        revealedAt: 0,
        admin_secret: "pkxd2026_super_secret_admin_key"
      }, { merge: true });

      // Clean local React state and storage
      setSpoilerTitle(defaultTitle);
      localStorage.setItem('pkxd_spoiler_title', defaultTitle);
      setSpoilerDesc(defaultDesc);
      localStorage.setItem('pkxd_spoiler_desc', defaultDesc);
      setSpoilerImage('');
      localStorage.setItem('pkxd_spoiler_image', '');
      setForceReveal(false);
      localStorage.setItem('pkxd_force_reveal', 'false');
      setRevealedAt(0);
      localStorage.setItem('pkxd_spoiler_revealed_at', '0');

      triggerAudio('success');
      setNotifMessage("✅ Spoiler atual excluído e limpo com sucesso do site! ❌");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao limpar spoiler: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Update spoiler delayed status
  const handleUpdateDelay = async (delayed: boolean, message: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      const docRef = doc(db, 'settings', 'app');
      await setDoc(docRef, {
        isDelayed: delayed,
        delayMessage: message,
        admin_secret: "pkxd2026_super_secret_admin_key"
      }, { merge: true });

      // Automatically send alert notification if delayed is activated
      if (delayed) {
        const notifId = Date.now().toString();
        const notifRef = doc(db, 'notifications', notifId);
        const notifTitle = '⚠️ ALERT: SPOILERS ADIADOS!';
        const notifBody = message || 'Os spoilers oficiais do PK XD atrasaram um pouquinho do cronograma original.';
        
        await setDoc(notifRef, {
          id: notifId,
          title: notifTitle,
          body: notifBody,
          type: 'delayed_alert',
          createdAt: Date.now(),
          admin_secret: "pkxd2026_super_secret_admin_key"
        });

        // Fetch our secure and robust API route to broadcast immediately
        fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: notifTitle,
            body: notifBody,
            admin_secret: "pkxd2026_super_secret_admin_key",
            url: '/'
          })
        }).catch(err => console.error("Error broadcasting delayed push:", err));
      }

      triggerAudio('success');
      setNotifMessage("✅ Status de atraso atualizado com sucesso!");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao atualizar status de atraso: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Disparar notificação manual para celular
  const handleSendCustomNotification = async (title: string, body: string, type: 'story_published' | 'countdown_alert' | 'custom_push' | 'delayed_alert') => {
    if (!checkAdminWritePermission()) return;
    const notifId = Date.now().toString();
    try {
      const notifRef = doc(db, 'notifications', notifId);
      await setDoc(notifRef, {
        id: notifId,
        title,
        body,
        type,
        createdAt: Date.now(),
        admin_secret: "pkxd2026_super_secret_admin_key"
      });

      // Fetch our secure and robust API route to broadcast immediately
      fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          admin_secret: "pkxd2026_super_secret_admin_key",
          url: '/'
        })
      }).catch(err => console.error("Error broadcasting custom push:", err));

      triggerAudio('success');
      setNotifMessage("✅ Notificação enviada para todos os fãs cadastrados! 📢");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao disparar notificação: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Save edits of past archive spoilers
  const handleSaveEditPastSpoiler = async (id: string, title: string, desc: string, imageUrl?: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      let finalDesc = desc;
      let finalImageUrl = imageUrl || '';

      if (finalDesc.includes('data:image/')) {
        finalDesc = await compressAllBase64InText(finalDesc);
      }
      if (finalImageUrl.startsWith('data:image/')) {
        finalImageUrl = await compressBase64Image(finalImageUrl, 900, 0.72);
      }

      const docRef = doc(db, 'past_spoilers', id);
      await setDoc(docRef, {
        id,
        title,
        description: finalDesc,
        imageUrl: finalImageUrl,
        admin_secret: "pkxd2026_super_secret_admin_key"
      }, { merge: true });
      
      setPastSpoilerToEdit(null);
      triggerAudio('success');
      setNotifMessage("✅ Alterações no spoiler antigo arquivadas!");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao salvar alterações do spoiler antigo: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Delete past spoiler
  const handleDeletePastSpoiler = async (id: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      const docRef = doc(db, 'past_spoilers', id);
      await deleteDoc(docRef);
      triggerAudio('tap');
      setNotifMessage("✅ Spoiler antigo deletado com sucesso!");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao deletar spoiler antigo: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Update logo url
  const handleUpdateLogoSettings = async (url: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      const docRef = doc(db, 'settings', 'app');
      await setDoc(docRef, {
        logoUrl: url,
        admin_secret: "pkxd2026_super_secret_admin_key"
      }, { merge: true });
      triggerAudio('success');
      setNotifMessage("✅ Logo da Central PK XD atualizada! 🤩");
      setTimeout(() => setNotifMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setNotifMessage(`❌ Erro ao atualizar logo: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8500);
    }
  };

  // Featured video handlers
  const handleAddFeaturedVideo = async (video: Omit<FeaturedVideo, 'id' | 'createdAt'>) => {
    if (!checkAdminWritePermission()) return;
    const id = Date.now().toString();
    try {
      const docRef = doc(db, 'featured_videos', id);
      await setDoc(docRef, { ...video, id, createdAt: Date.now(), admin_secret: "pkxd2026_super_secret_admin_key" });
      triggerAudio('success');
      setNotifMessage("✅ Vídeo em Destaque adicionado com sucesso!");
      setTimeout(() => setNotifMessage(null), 4050);
    } catch (err: any) {
      console.error("Error adding featured video:", err);
      setNotifMessage(`❌ Erro ao adicionar vídeo: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  const handleDeleteFeaturedVideo = async (id: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      await deleteDoc(doc(db, 'featured_videos', id));
      triggerAudio('tap');
      setNotifMessage("✅ Vídeo em Destaque removido!");
      setTimeout(() => setNotifMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting featured video:", err);
      setNotifMessage(`❌ Erro ao remover vídeo: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Theory handlers
  const handleAddTheory = async (theory: Omit<Theory, 'id' | 'likes' | 'createdAt'>) => {
    if (!checkAdminWritePermission()) return;
    const id = Date.now().toString();
    try {
      const docRef = doc(db, 'theories', id);
      await setDoc(docRef, { ...theory, id, likes: 0, createdAt: Date.now(), admin_secret: "pkxd2026_super_secret_admin_key" });
      triggerAudio('success');
      setNotifMessage("✅ Teoria cadastrada com sucesso!");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch (err: any) {
      console.error("Error adding theory:", err);
      setNotifMessage(`❌ Erro ao cadastrar teoria: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  const handleLikeTheory = async (id: string) => {
    const theory = theoriesList.find(t => t.id === id);
    if (!theory) return;
    try {
      await setDoc(doc(db, 'theories', id), { likes: (theory.likes || 0) + 1 }, { merge: true });
    } catch (err) {
      console.error("Error liking theory:", err);
    }
  };

  const handleDeleteTheory = async (id: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      await deleteDoc(doc(db, 'theories', id));
      triggerAudio('tap');
      setNotifMessage("✅ Teoria removida!");
      setTimeout(() => setNotifMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting theory:", err);
      setNotifMessage(`❌ Erro ao remover teoria: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Curated Shorts handlers
  const handleAddShort = async (short: Omit<ShortItem, 'id' | 'createdAt'>) => {
    if (!checkAdminWritePermission()) return;
    const id = Date.now().toString();
    try {
      const docRef = doc(db, 'shorts', id);
      await setDoc(docRef, { ...short, id, createdAt: Date.now(), admin_secret: "pkxd2026_super_secret_admin_key" });
      triggerAudio('success');
      setNotifMessage("✅ Vídeo curto (Short) adicionado!");
      setTimeout(() => setNotifMessage(null), 3500);
    } catch (err: any) {
      console.error("Error adding short:", err);
      setNotifMessage(`❌ Erro ao adicionar short: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  const handleDeleteShort = async (id: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      await deleteDoc(doc(db, 'shorts', id));
      triggerAudio('tap');
      setNotifMessage("✅ Short removido!");
      setTimeout(() => setNotifMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting short:", err);
      setNotifMessage(`❌ Erro ao remover short: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Extra timer details handler
  const handleUpdateExtraCountdown = async (title: string, date: string, enabled: boolean) => {
    if (!checkAdminWritePermission()) return;
    try {
      const docRef = doc(db, 'settings', 'app');
      await setDoc(docRef, {
        extraCountdownTitle: title,
        extraCountdownDate: date,
        extraCountdownEnabled: enabled,
        admin_secret: "pkxd2026_super_secret_admin_key"
      }, { merge: true });
      triggerAudio('success');
      setNotifMessage("✅ Contagem regressiva personalizada atualizada!");
      setTimeout(() => setNotifMessage(null), 3000);
    } catch (err: any) {
      console.error("Error updating extra countdown:", err);
      setNotifMessage(`❌ Erro ao atualizar contagem: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Gift countdown handler
  const handleUpdateGiftCountdown = async (title: string, date: string, enabled: boolean, content: string) => {
    if (!checkAdminWritePermission()) return;
    try {
      const docRef = doc(db, 'settings', 'app');
      await setDoc(docRef, {
        giftCountdownTitle: title,
        giftCountdownDate: date,
        giftCountdownEnabled: enabled,
        giftCountdownContent: content,
        admin_secret: "pkxd2026_super_secret_admin_key"
      }, { merge: true });
      triggerAudio('success');
      setNotifMessage("✅ Contagem regressiva de Presente/Código salva com sucesso! 🎁");
      setTimeout(() => setNotifMessage(null), 3500);

      // Trigger automatic global push notification to let everyone know about the release!
      const notifId = Date.now().toString();
      const notifRef = doc(db, 'notifications', notifId);
      await setDoc(notifRef, {
        id: notifId,
        title: title || '🎁 PRESENTE REVELADO!',
        body: enabled 
          ? `Uma nova contagem regressiva para presentear a comunidade foi iniciada! Liberação em: ${new Date(date).toLocaleString('pt-BR')}`
          : `O cronômetro de presentes foi alterado pelo administrador.`,
        type: 'countdown_alert',
        createdAt: Date.now()
      });
    } catch (err: any) {
      console.error("Error updating gift countdown:", err);
      setNotifMessage(`❌ Erro ao atualizar presente: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Realtime personal Pet Interest notifications subscription (delivered to pet owner)
  useEffect(() => {
    const uid = user?.uid || '';
    const normalizedTag = (currentPlayerTag || '').trim().toUpperCase();
    if (!uid && !normalizedTag) {
      setPersonalPetNotifications([]);
      return;
    }

    const colRef = collection(db, 'user_passports');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const items: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data?.entityType !== 'pet_interest_notification') return;
          const matchesUid = Boolean(uid && data.recipientUserId && data.recipientUserId === uid);
          const matchesTag = Boolean(
            normalizedTag &&
              data.recipientOwnerTag &&
              String(data.recipientOwnerTag).trim().toUpperCase() === normalizedTag
          );
          if (!matchesUid && !matchesTag) return;

          const senderName = String(data.senderName || 'Jogador');
          const senderTagNumber = String(data.senderTagNumber || '000');
          const contactType: 'social' | 'whatsapp' =
            data.contactType === 'whatsapp' ? 'whatsapp' : 'social';
          const contactValue = String(data.contactValue || '');
          const petName = String(data.petName || 'seu pet');
          const petListingType: 'doacao' | 'troca' =
            data.petListingType === 'troca' ? 'troca' : 'doacao';
          const createdAt = typeof data.createdAt === 'number' ? data.createdAt : Date.now();
          const contactLabel = contactType === 'whatsapp' ? `WhatsApp: ${contactValue}` : `Contato: ${contactValue}`;

          const notifItem: AppNotification = {
            id: docSnap.id,
            type: 'pet_interest',
            title: `Eu quero seu pet: ${petName}!`,
            body: `${senderName} #${senderTagNumber} tem interesse na ${petListingType === 'doacao' ? 'doação' : 'troca'} do seu pet (${contactLabel}).`,
            targetUrl: '/pets',
            createdAt,
            isPersonalPetNotification: true,
            petInterest: {
              petId: String(data.petId || ''),
              petName,
              petListingType,
              recipientUserId: String(data.recipientUserId || ''),
              senderName,
              senderTagNumber,
              contactType,
              contactValue,
              message: data.message ? String(data.message) : undefined,
            },
          };

          items.push(notifItem);

          // Live toast alert when a fresh "Eu quero!" arrives during this session
          if (
            createdAt > sessionStartRef.current &&
            !alertedPetNotifIdsRef.current.has(docSnap.id)
          ) {
            alertedPetNotifIdsRef.current.add(docSnap.id);
            triggerAudio('success');
            setNotifMessage(
              `🐾 ${senderName} #${senderTagNumber} clicou em "Eu quero" no seu pet ${petName}! Abra Notificações para ver o contato.`
            );
            setTimeout(() => setNotifMessage(null), 7000);
          }
        });

        items.sort((a, b) => b.createdAt - a.createdAt);
        setPersonalPetNotifications(items);
      },
      (error) => {
        console.warn('Could not fetch pet interest notifications:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, currentPlayerTag]);

  // Delete notification handler (admin for global notifications, recipient/admin for personal pet notifications)
  const handleDeleteNotification = async (id: string, isPersonalPet?: boolean) => {
    if (isPersonalPet) {
      try {
        await deleteDoc(doc(db, 'user_passports', id));
        triggerAudio('tap');
        setNotifMessage('✅ Notificação de pet removida!');
        setTimeout(() => setNotifMessage(null), 3000);
      } catch (err: any) {
        console.error('Error deleting personal pet notification:', err);
        setNotifMessage('❌ Não foi possível remover esta notificação.');
        setTimeout(() => setNotifMessage(null), 5000);
      }
      return;
    }

    if (!checkAdminWritePermission()) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
      triggerAudio('success');
      setNotifMessage("✅ Notificação apagada do banco com sucesso! 🗑️");
      setTimeout(() => setNotifMessage(null), 3500);
    } catch (err: any) {
      console.error("Error deleting notification:", err);
      setNotifMessage(`❌ Erro ao apagar notificação: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Clear / restore default backup list
  const handleResetToDefaults = async () => {
    if (!checkAdminWritePermission()) return;
    try {
      // Restore Cloud configuration setting defaults
      const docRef = doc(db, 'settings', 'app');
      await setDoc(docRef, {
        logoUrl: '',
        spoilerTitle: 'Aguardando Próximos Spoilers! 🔮',
        spoilerDesc: 'Ainda não temos spoilers ativos para esta semana. Fique atento ao nosso canal no WhatsApp para novidades e acompanhe a contagem regressiva toda segunda às 17h30!',
        spoilerImageUrl: '',
        forceReveal: false,
        revealedAt: 0,
        admin_secret: "pkxd2026_super_secret_admin_key"
      }, { merge: true });

      // For news, empty or add default items to DB
      for (const item of INITIAL_NEWS) {
        await setDoc(doc(db, 'news', item.id), {
          ...item,
          admin_secret: "pkxd2026_super_secret_admin_key"
        });
      }

      setNewsToEdit(null);
      triggerAudio('levelUp');
      setNotifMessage("✅ CONFIGURAÇÕES DE FÁBRICA RESTAURADAS NO BANCO DE DADOS! 🌐");
      setTimeout(() => setNotifMessage(null), 4500);
    } catch (err: any) {
      console.error("Error resetting defaults:", err);
      setNotifMessage(`❌ Erro ao resetar dados: ${err?.message || String(err)}`);
      setTimeout(() => setNotifMessage(null), 8000);
    }
  };

  // Interactive leveling feature
  const handleLevelUpCallback = () => {
    const nextLevel = fanLevel + 1;
    setFanLevel(nextLevel);
    localStorage.setItem('pkxd_fan_level', nextLevel.toString());
    triggerAudio('levelUp');
    setNotifMessage(`LEVEL UP! Você subiu para o Nível de Fã ${nextLevel}! 🌟`);
    setTimeout(() => setNotifMessage(null), 4000);
  };

  const handleAddFanXP = (amount: number, reason: string, rewardKey?: string) => {
    const userKey = getPersistentUserKey(user);

    // If this is a server-guarded one-time reward, validate strictly with backend first
    if (rewardKey) {
      awardServerXP({
        userKey,
        amount,
        reason,
        rewardKey,
        displayName: user?.displayName || currentPlayerTag || undefined,
        playerTag: currentPlayerTag || undefined,
      }).then((res) => {
        if (res.alreadyClaimed || !res.awarded) {
          return;
        }
        if (res.profile) {
          const levelXp = res.profile.totalXp % 100;
          setXpProfile(res.profile);
          setFanLevel(res.profile.level);
          setFanXP(levelXp);
          try {
            localStorage.setItem('pkxd_fan_level', String(res.profile.level));
            localStorage.setItem('pkxd_fan_xp', String(levelXp));
          } catch {}
        }
        triggerAudio('levelUp');
        setNotifMessage(`+${res.awardedAmount || amount} XP ganho: ${reason}!`);
        setTimeout(() => setNotifMessage(null), 4500);
      });
      return;
    }

    let nextXp = fanXP + amount;
    setNotifMessage(`+${amount} XP ganho: ${reason}!`);
    setTimeout(() => setNotifMessage(null), 4000);

    let levelsGained = 0;
    while (nextXp >= 100) {
      nextXp -= 100;
      levelsGained++;
    }

    const finalLevel = fanLevel + levelsGained;
    if (levelsGained > 0) {
      setFanLevel(finalLevel);
      localStorage.setItem('pkxd_fan_level', finalLevel.toString());
      triggerAudio('levelUp');
      setNotifMessage(`LEVEL UP x${levelsGained}! Você subiu para o Nível de Fã ${finalLevel}!`);
      setTimeout(() => setNotifMessage(null), 4000);
    } else {
      triggerAudio('success');
    }
    setFanXP(nextXp);
    localStorage.setItem('pkxd_fan_xp', nextXp.toString());

    // Persist in server XP ledger asynchronously
    awardServerXP({
      userKey,
      amount,
      reason,
      displayName: user?.displayName || currentPlayerTag || undefined,
      playerTag: currentPlayerTag || undefined,
    }).then((res) => {
      if (res.profile) {
        setXpProfile(res.profile);
      }
    }).catch(() => {});

    try {
      const pRaw = localStorage.getItem('pkxd_passport_data');
      if (pRaw) {
        const p = JSON.parse(pRaw);
        p.level = finalLevel;
        p.xp = nextXp;
        p.totalXp = ((finalLevel - 1) * 100) + nextXp;
        p.updatedAt = Date.now();
        localStorage.setItem('pkxd_passport_data', JSON.stringify(p));
      }
    } catch (e) {}
  };

  const handleRatePastSpoiler = async (id: string, rating: number) => {
    try {
      const target = pastSpoilers.find(s => s.id === id);
      if (!target) return;

      const currentSum = target.ratingSum || 0;
      const currentCount = target.ratingCount || 0;

      const nextSum = currentSum + rating;
      const nextCount = currentCount + 1;

      // Sync to Firestore
      const spoilerRef = doc(db, 'past_spoilers', id);
      await setDoc(spoilerRef, {
        ratingSum: nextSum,
        ratingCount: nextCount
      }, { merge: true });

      // Add XP for rating
      handleAddFanXP(150, 'Avaliação de Spoiler 🔮');
    } catch (err: any) {
      console.warn("Erro ao registrar avaliação base:", err);
      handleFirestoreError(err, OperationType.WRITE, 'past_spoilers');
    }
  };

  const handleReactPastSpoiler = async (id: string, emoji: string) => {
    try {
      const target = pastSpoilers.find(s => s.id === id);
      if (!target) return;

      const currentReactions = target.reactions || {};
      const nextReactionCount = (currentReactions[emoji] || 0) + 1;

      const updatedReactions = {
        ...currentReactions,
        [emoji]: nextReactionCount
      };

      const spoilerRef = doc(db, 'past_spoilers', id);
      await setDoc(spoilerRef, {
        reactions: updatedReactions
      }, { merge: true });

      handleAddFanXP(50, `Reação ${emoji} a Spoiler 🔮`);
    } catch (err: any) {
      console.warn("Erro ao registrar reação ao spoiler:", err);
      handleFirestoreError(err, OperationType.WRITE, 'past_spoilers');
    }
  };

  const combinedNotifications: AppNotification[] = [
    ...personalPetNotifications,
    ...notificationList,
  ].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

  const unreadNotifications = combinedNotifications.filter(n => !seenNotifIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const totalXpDisplay = xpProfile?.totalXp ?? ((fanLevel - 1) * 100 + fanXP);

  const activeNavKey: NavRouteKey = isAdminRoute
    ? 'admin'
    : isPetsRoute
    ? 'pets'
    : isNewsRoute
    ? 'noticias'
    : isNotificationsRoute
    ? 'notificacoes'
    : isProfileRoute
    ? 'perfil'
    : isMyAgendaRoute
    ? 'minha-agenda'
    : isCreateEventRoute
    ? 'criar-evento'
    : isCreatorProgressRoute
    ? 'progresso-creator'
    : isCreatorsSectionRoute
    ? 'criadores'
    : isApplicationsRoute
    ? 'oportunidades'
    : activeTab === 'eventos'
    ? 'eventos'
    : activeTab === 'passaporte'
    ? 'pkxd-id'
    : activeTab === 'artes'
    ? 'artes'
    : activeTab === 'comunidade' || activeTab === 'missoes'
    ? 'comunidade'
    : 'inicio';

  const isCommunityViewActive =
    !isAdminRoute &&
    !isPetsRoute &&
    !isNewsRoute &&
    !isNotificationsRoute &&
    !isProfileRoute &&
    !isMyAgendaRoute &&
    !isCreateEventRoute &&
    !isCreatorsSectionRoute &&
    !isApplicationsRoute &&
    !isPrivacyCenterRoute &&
    !isPrivacyPolicyRoute &&
    !isTermsRoute &&
    (activeTab === 'comunidade' ||
      activeTab === 'passaporte' ||
      activeTab === 'missoes' ||
      activeTab === 'artes');

  const markNotificationRead = (id: string) => {
    setSeenNotifIds((prev) => {
      const unique = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('seen_notification_ids', JSON.stringify(unique));
      } catch {}
      return unique;
    });
  };

  const markAllNotificationsRead = () => {
    const allIds = combinedNotifications.map((n) => n.id);
    setSeenNotifIds((prev) => {
      const unique = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem('seen_notification_ids', JSON.stringify(unique));
      } catch {}
      return unique;
    });
  };

  const handleEnableBrowserPush = async () => {
    if (!('Notification' in window)) {
      setNotifMessage('Este navegador não suporta notificações de sistema.');
      setTimeout(() => setNotifMessage(null), 5000);
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setHasNotificationPermission(perm === 'granted');
      if (perm === 'granted') {
        triggerAudio('success');
        setTimeout(() => subscribeUserToPush(), 200);
        setNotifMessage('Notificações push ativadas com sucesso!');
        setTimeout(() => setNotifMessage(null), 4000);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const openTagSetupFlow = () => {
    triggerAudio('tap');
    if (isTagConfigured(currentPlayerTag)) {
      const [n, num] = currentPlayerTag.split('#');
      setTagSetupName(n || '');
      setTagSetupNumber(num || '');
    } else {
      setTagSetupName(modalPkxdName || '');
      setTagSetupNumber(modalPkxdNumber || '');
    }
    setTagSetupError('');
    setShowTagSetupModal(true);
  };

  return (
    <div id="pkxd-app-root" className="min-h-screen pkxd-band-purple text-white font-sans selection:bg-[#F9C826] selection:text-[#120624] relative overflow-x-hidden flex flex-col">
      {/* Main Top Navigation + Mobile Bottom Tab Bar */}
      <Navbar2
        activeRoute={activeNavKey}
        siteLogoUrl={siteLogoUrl}
        user={user}
        isAdmin={isAdmin}
        fanLevel={fanLevel}
        totalXp={totalXpDisplay}
        playerTag={currentPlayerTag}
        unreadCount={unreadCount}
        onNavigate={navigateTo}
        onOpenNotifications={() => {
          navigateTo('/notificacoes');
        }}
        onOpenAuth={(mode) => {
          setExplicitAuthMode(mode || 'login');
          setExplicitAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        triggerAudio={triggerAudio}
      />

      {/* Global PWA Installer Modal Controller */}
      <PWAInstaller
        hideInlineBanner={true}
        forceOpenModal={showInstallAppModal}
        onCloseModal={() => setShowInstallAppModal(false)}
        onAddXP={handleAddFanXP}
        triggerAudio={triggerAudio}
      />

      {/* Floating Toast Notification */}
      {notifMessage && (
        <div
          id="floating-celebration"
          role="status"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 w-[92%] max-w-md pkxd-pop-card p-4 flex items-start gap-3 animate-slide-up"
        >
          <div className="p-2 rounded-xl bg-[#F9C826] border-2 border-[#120624] text-[#120624] shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-0.5 text-left">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#7C3AED]">
              Aviso PKXD Central
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#120624] leading-relaxed">
              {notifMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotifMessage(null)}
            className="text-slate-500 hover:text-[#120624] p-1 cursor-pointer shrink-0"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Sound Utility Button (above mobile tab bar) */}
      <div className="fixed bottom-20 md:bottom-6 left-3 sm:left-6 z-40">
        <button
          type="button"
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) {
              try {
                const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = actx.createOscillator();
                osc.connect(actx.destination);
                osc.frequency.setValueAtTime(440, actx.currentTime);
                osc.start();
                osc.stop(actx.currentTime + 0.1);
              } catch (e) {}
            }
          }}
          className={`w-11 h-11 rounded-full border-[3px] border-[#120624] shadow-[0_4px_0_#16032E] flex items-center justify-center cursor-pointer transition-colors ${
            soundEnabled
              ? 'bg-[#F9C826] text-[#120624]'
              : 'bg-white text-[#120624] hover:bg-[#FFF8DB]'
          }`}
          title={soundEnabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
          aria-label={soundEnabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* MAIN VIEW ROUTER */}
      <main id="main-content" className="relative z-10 flex-1 w-full">
        {showAdminPanel ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6" id="admin-panel">
            <div className="pkxd-glass rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  Administração
                </p>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 flex items-center gap-2.5">
                  <Settings className="w-6 h-6 text-violet-700" />
                  <span>Painel Administrativo PKXD Central</span>
                </h1>
                <p className="text-sm text-slate-600">
                  Gerencie notícias, spoilers semanais, vídeos em destaque, transmissões, artes e alertas da comunidade.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  navigateTo('/');
                }}
                className="pkxd-btn-outline px-4 py-2.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer self-start shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Início</span>
              </button>
            </div>

            {isAdmin ? (
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="font-display font-bold text-lg text-emerald-900">
                      {user?.uid === 'admin_fallback'
                        ? 'Acesso Administrativo Ativo (Modo PIN)'
                        : 'Acesso Administrativo Ativo (Conta Google)'}
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-800 max-w-2xl">
                      Todas as alterações feitas aqui são sincronizadas em tempo real no Firestore para toda a comunidade.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer self-start shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{user?.uid === 'admin_fallback' ? 'Sair do PIN' : 'Sair'}</span>
                  </button>
                </div>

                {/* Unified Admin Ecosystem + Exclusive News Manager + Content CMS */}
                <AdminEcosystemPanel
                  initialSection={
                    currentPath.toLowerCase().includes('#noticias') || newsToEdit
                      ? 'noticias'
                      : pastSpoilerToEdit
                      ? 'conteudo'
                      : 'noticias'
                  }
                  forceSection={
                    currentPath.toLowerCase().includes('#noticias') || newsToEdit
                      ? 'noticias'
                      : pastSpoilerToEdit
                      ? 'conteudo'
                      : undefined
                  }
                  newsList={newsList}
                  newsToEdit={newsToEdit}
                  onAddNews={handleAddNews}
                  onSaveEditNews={handleSaveEdit}
                  onCancelEditNews={() => setNewsToEdit(null)}
                  onDeleteNews={handleDeleteNews}
                  onSelectEditNews={(item) => setNewsToEdit(item)}
                  onNavigate={navigateTo}
                  triggerAudio={triggerAudio}
                >
                  <AdminPanel
                    user={user}
                    onAddNews={handleAddNews}
                    onUpdateSpoiler={handleUpdateSpoilerSettings}
                    activeSpoilerTitle={spoilerTitle}
                    activeSpoilerDesc={spoilerDesc}
                    activeSpoilerImage={spoilerImage}
                    activeSpoilerForceReveal={forceReveal}
                    onResetToDefaults={handleResetToDefaults}
                    newsToEdit={newsToEdit}
                    onCancelEdit={() => setNewsToEdit(null)}
                    onSaveEdit={handleSaveEdit}
                    siteLogoUrl={siteLogoUrl}
                    onUpdateLogo={handleUpdateLogoSettings}
                    onAddFeaturedVideo={handleAddFeaturedVideo}
                    onAddTheory={handleAddTheory}
                    onAddShort={handleAddShort}
                    onUpdateExtraCountdown={handleUpdateExtraCountdown}
                    activeExtraCountdownTitle={extraCountdownTitle}
                    activeExtraCountdownDate={extraCountdownDate}
                    activeExtraCountdownEnabled={extraCountdownEnabled}
                    pastSpoilerToEdit={pastSpoilerToEdit}
                    onSaveEditPastSpoiler={handleSaveEditPastSpoiler}
                    onCancelEditPastSpoiler={() => setPastSpoilerToEdit(null)}
                    isDelayed={isDelayed}
                    delayMessage={delayMessage}
                    onUpdateDelay={handleUpdateDelay}
                    onSendCustomNotification={handleSendCustomNotification}
                    onDirectArchivePastSpoiler={handleDirectArchivePastSpoiler}
                    onArchiveAndClearActiveSpoiler={handleArchiveAndClearActiveSpoiler}
                    onDeleteActiveSpoiler={handleDeleteActiveSpoiler}
                    activeGiftCountdownTitle={giftCountdownTitle}
                    activeGiftCountdownDate={giftCountdownDate}
                    activeGiftCountdownEnabled={giftCountdownEnabled}
                    activeGiftCountdownContent={giftCountdownContent}
                    onUpdateGiftCountdown={handleUpdateGiftCountdown}
                  />
                </AdminEcosystemPanel>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 max-w-xl mx-auto space-y-6 text-center shadow-sm">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-display font-bold text-2xl text-slate-900">
                    Acesso de Administrador
                  </h2>
                  {user ? (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-left space-y-1.5 text-xs text-rose-900">
                      <p className="font-bold">Conta padrão detectada</p>
                      <p>
                        Você entrou como <span className="font-mono underline">{maskEmail(user.email)}</span>, que não possui permissão administrativa.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Entre com sua conta administrativa autorizada ou utilize o código PIN de acesso.
                    </p>
                  )}
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold cursor-pointer"
                  >
                    Sair da Conta Atual
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
                      {([
                        { id: 'email', label: 'E-mail e Senha' },
                        { id: 'google', label: 'Google' },
                        { id: 'pin', label: 'PIN' },
                      ] as const).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            triggerAudio('tap');
                            setAdminAuthTab(tab.id);
                            setGoogleAuthError(null);
                          }}
                          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            adminAuthTab === tab.id
                              ? 'bg-white text-violet-700 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {adminAuthTab === 'email' && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleEmailLogin(adminEmail, adminPassword);
                        }}
                        className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-left"
                      >
                        <input
                          type="email"
                          required
                          placeholder="E-mail do Administrador"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-600"
                        />
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="Senha"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-600"
                        />
                        <button
                          type="submit"
                          disabled={isAuthenticating}
                          className="w-full pkxd-btn-primary py-3 rounded-xl text-sm font-bold cursor-pointer"
                        >
                          {isAuthenticating ? 'Conectando...' : 'Entrar no Painel'}
                        </button>
                      </form>
                    )}

                    {adminAuthTab === 'google' && (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5">
                        <button
                          type="button"
                          onClick={handleLogin}
                          disabled={isAuthenticating}
                          className="w-full pkxd-btn-primary py-3 rounded-xl text-sm font-bold cursor-pointer"
                        >
                          {isAuthenticating ? 'Entrando...' : 'Entrar com Google (Popup)'}
                        </button>
                        <button
                          type="button"
                          onClick={handleLoginRedirect}
                          disabled={isAuthenticating}
                          className="w-full pkxd-btn-outline py-3 rounded-xl text-sm font-bold cursor-pointer"
                        >
                          {isAuthenticating ? 'Entrando...' : 'Entrar com Google (Celular)'}
                        </button>
                      </div>
                    )}

                    {adminAuthTab === 'pin' && (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-left">
                        <p className="text-xs text-slate-600">
                          Digite o código PIN de administrador para acessar o gerenciamento em nuvem.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Código PIN de admin"
                            value={inputPasscode}
                            onChange={(e) => setInputPasscode(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePasscodeLogin();
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-600 font-mono"
                          />
                          <button
                            type="button"
                            onClick={handlePasscodeLogin}
                            className="pkxd-btn-primary px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer whitespace-nowrap"
                          >
                            Entrar PIN
                          </button>
                        </div>
                        {passcodeError && (
                          <p className="text-xs font-semibold text-rose-600">{passcodeError}</p>
                        )}
                      </div>
                    )}

                    {googleAuthError && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-1.5 text-xs text-rose-900">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Erro de Conexão</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{googleAuthError}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isPrivacyCenterRoute ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <PrivacyCenterView
              onBack={() => navigateTo('/')}
              onNavigateToPolicy={() => navigateTo('/privacidade')}
              onNavigateToTerms={() => navigateTo('/termos-de-uso')}
              onOpenCookiePreferences={() => setIsCookiePreferencesOpen(true)}
              onOpenDataRequest={() => {
                setUserDataRequestInitialType('access');
                setIsUserDataRequestOpen(true);
              }}
              onOpenDataDeletion={() => {
                setUserDataRequestInitialType('deletion');
                setIsUserDataRequestOpen(true);
              }}
              triggerAudio={triggerAudio}
            />
          </div>
        ) : isPrivacyPolicyRoute ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <PrivacyPolicyView
              onBack={() => navigateTo('/privacidade-e-direitos')}
              onOpenCookiePreferences={() => setIsCookiePreferencesOpen(true)}
              onOpenDataRequest={() => {
                setUserDataRequestInitialType('access');
                setIsUserDataRequestOpen(true);
              }}
              triggerAudio={triggerAudio}
            />
          </div>
        ) : isTermsRoute ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <TermsOfUseView
              onBack={() => navigateTo('/privacidade-e-direitos')}
              triggerAudio={triggerAudio}
            />
          </div>
        ) : isCreatorsSectionRoute ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <CreatorsHubView
              videos={featuredList}
              shorts={shortsList}
              isAdmin={isAdmin}
              currentUser={user}
              initialSubTab={isCreatorProgressRoute ? 'analisador' : 'vitrine'}
              soundEnabled={soundEnabled}
              onDeleteVideo={handleDeleteFeaturedVideo}
              onDeleteShort={handleDeleteShort}
              onAddXP={handleAddFanXP}
              onNavigate={navigateTo}
              onOpenAuthModal={(mode) => {
                setExplicitAuthMode(mode || 'login');
                setExplicitAuthModalOpen(true);
              }}
              triggerAudio={triggerAudio}
            />
          </div>
        ) : isApplicationsRoute ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
            <div className="pkxd-glass rounded-[34px] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  Oportunidades e Seleções
                </p>
                <h1 className="font-display font-bold text-3xl text-slate-900">
                  Inscrições e Programas da Comunidade
                </h1>
                <p className="text-sm text-slate-600 max-w-2xl">
                  Escolha um projeto aberto para enviar seus vídeos, teorias ou se candidatar à equipe da PKXD Central.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  navigateTo('/');
                }}
                className="pkxd-btn-outline px-4 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 cursor-pointer self-start shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Início</span>
              </button>
            </div>

            <ApplicationsSection
              onBackToHub={() => {
                setShowCreatorAnalyzer(false);
                navigateTo('/');
              }}
              onOpenCreatorAnalyzer={() => {
                setShowCreatorAnalyzer(true);
                navigateTo('/progresso-creator');
              }}
              onAddXP={handleAddFanXP}
              soundEnabled={soundEnabled}
              user={user}
              isAdmin={isAdmin}
              onAddNews={handleAddNews}
              onAddShort={handleAddShort}
              onAddTheory={handleAddTheory}
              onAddFeaturedVideo={handleAddFeaturedVideo}
            />
          </div>
        ) : isPetsRoute ? (
          <PetsSectionView
            currentUser={user}
            isAdmin={isAdmin}
            playerTag={currentPlayerTag}
            onOpenAuth={(mode) => {
              setExplicitAuthMode(mode || 'login');
              setExplicitAuthModalOpen(true);
            }}
            onAddXP={handleAddFanXP}
            triggerAudio={triggerAudio}
          />
        ) : isNewsRoute ? (
          <NewsSectionView
            newsList={newsList}
            selectedArticleId={selectedNewsArticleId}
            isAdmin={isAdmin}
            onSelectArticle={(articleId) => {
              if (articleId) {
                navigateTo(`/noticias/${articleId}`);
              } else {
                navigateTo('/noticias');
              }
            }}
            onEditNews={(item) => {
              handleEditNewsRequest(item);
              navigateTo('/admin#noticias');
            }}
            onDeleteNews={handleDeleteNews}
            onNavigate={navigateTo}
            triggerAudio={triggerAudio}
          />
        ) : isNotificationsRoute ? (
          <NotificationsPageView
            notifications={combinedNotifications}
            seenIds={seenNotifIds}
            isAdmin={isAdmin}
            hasPushPermission={hasNotificationPermission}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
            onDeleteNotification={handleDeleteNotification}
            onEnablePush={handleEnableBrowserPush}
            onNavigate={navigateTo}
            triggerAudio={triggerAudio}
          />
        ) : isProfileRoute ? (
          <UserProfileView
            user={user}
            playerTag={currentPlayerTag}
            xpProfile={xpProfile}
            fanLevel={fanLevel}
            fanXP={fanXP}
            onSaveIdentity={saveIdentityCore}
            onOpenInstallApp={() => setShowInstallAppModal(true)}
            onOpenAuth={(mode) => {
              setExplicitAuthMode(mode || 'login');
              setExplicitAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            onNavigate={navigateTo}
            triggerAudio={triggerAudio}
          />
        ) : activeTab === 'eventos' || isMyAgendaRoute || isCreateEventRoute ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6" id="events-section-wrapper">
            <EventsSection
              isAdmin={isAdmin}
              currentUser={user}
              playerTag={currentPlayerTag}
              soundEnabled={soundEnabled}
              initialAgendaTab={isMyAgendaRoute ? 'minha_agenda' : 'todos'}
              autoOpenCreate={isCreateEventRoute || autoOpenEventCreate}
              onCloseAutoCreate={() => {
                setAutoOpenEventCreate(false);
                if (isCreateEventRoute) {
                  navigateTo('/eventos');
                }
              }}
              triggerAudio={triggerAudio}
              onAddXP={handleAddFanXP}
            />
          </div>
        ) : isCommunityViewActive ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
            {/* Community Hub Header */}
            <div className="pkxd-glass rounded-[34px] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Comunidade PK XD Central
                  </p>
                  <h1 className="font-display font-bold text-3xl text-slate-900">
                    Espaço dos Membros, Perfil e Participação
                  </h1>
                  <p className="text-sm text-slate-600 max-w-2xl">
                    Interaja no mural social, personalize seu cartão PKXD ID, complete missões, baixe artes e envie sugestões ou denúncias.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {user ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        triggerAudio('tap');
                        setExplicitAuthMode('login');
                        setExplicitAuthModalOpen(true);
                      }}
                      className="pkxd-btn-primary px-5 py-2.5 rounded-full text-sm font-bold cursor-pointer"
                    >
                      Entrar ou Criar Conta
                    </button>
                  )}
                </div>
              </div>

              {/* Community Sub-Navigation */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {([
                  { id: 'mural', label: 'Mural e Enquetes', icon: Users, path: '/comunidade' },
                  { id: 'pkxd-id', label: 'PKXD ID e Perfil', icon: Sparkles, path: '/pkxd-id' },
                  { id: 'missoes', label: 'Missões e Nível', icon: Target, path: '/missoes' },
                  { id: 'artes', label: 'Artes e Downloads', icon: Palette, path: '/artes' },
                  { id: 'ouvidoria', label: 'Feedback e Denúncias', icon: MessageSquarePlus, path: '/comunidade#ouvidoria' },
                ] as const).map((tab) => {
                  const Icon = tab.icon;
                  const active = communitySubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        triggerAudio('tap');
                        setCommunitySubTab(tab.id);
                        navigateTo(tab.path);
                      }}
                      className={`px-4 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'bg-violet-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Community Panel */}
            {communitySubTab === 'mural' && (
              <div className="space-y-8 animate-fade-in" id="social-feed-section-wrapper">
                <PollsSection onAddXP={handleAddFanXP} isAdmin={isAdmin} />
                <SocialSection
                  currentUser={user}
                  isAdmin={isAdmin}
                  onAddXP={handleAddFanXP}
                  soundEnabled={soundEnabled}
                  triggerAudio={triggerAudio}
                  onLoginRedirect={handleLoginRedirect}
                />
                <div id="theories-section-wrapper">
                  <TheoriesSection
                    theories={theoriesList}
                    isAdmin={isAdmin}
                    currentUser={user}
                    onDelete={handleDeleteTheory}
                    onLike={handleLikeTheory}
                    onAddXP={handleAddFanXP}
                    onNavigate={navigateTo}
                  />
                </div>
              </div>
            )}

            {communitySubTab === 'pkxd-id' && (
              <div className="animate-fade-in" id="passport-section-wrapper">
                <PassportSection
                  currentUser={user}
                  isAdmin={isAdmin}
                  fanXP={fanXP}
                  fanLevel={fanLevel}
                  onAddXP={handleAddFanXP}
                  triggerAudio={triggerAudio}
                />
              </div>
            )}

            {communitySubTab === 'missoes' && (
              <div className="space-y-10 animate-fade-in" id="missions-section-wrapper">
                <MissionsSection
                  fanLevel={fanLevel}
                  fanXP={fanXP}
                  onAddXP={handleAddFanXP}
                  triggerAudio={triggerAudio}
                  soundEnabled={soundEnabled}
                />
                <div id="fan-level-section-wrapper">
                  <FanLevelSection
                    level={fanLevel}
                    xp={fanXP}
                    onAddXP={handleAddFanXP}
                    onLevelUp={handleLevelUpCallback}
                    soundEnabled={soundEnabled}
                    user={user}
                    onLogin={handleLogin}
                    onLoginRedirect={handleLoginRedirect}
                    onLogout={handleLogout}
                    onEmailLogin={handleEmailLogin}
                    onEmailRegister={handleEmailRegister}
                    authError={googleAuthError}
                    isAdmin={isAdmin}
                    setFanLevel={setFanLevel}
                    setFanXP={setFanXP}
                    pendingEmailVerification={pendingEmailVerification}
                    verificationCodeInput={verificationCodeInput}
                    setVerificationCodeInput={setVerificationCodeInput}
                    onConfirmEmailCode={handleConfirmEmailCode}
                    onCancelVerification={() => {
                      setPendingEmailVerification(null);
                      setVerificationCodeInput('');
                      setModalAuthError(null);
                    }}
                    resendCooldown={resendCooldown}
                    onResendCode={handleResendVerificationCode}
                    isAuthenticating={isAuthenticating}
                  />
                </div>
              </div>
            )}

            {communitySubTab === 'artes' && (
              <div className="animate-fade-in" id="artes-section-wrapper">
                <ArtesSection
                  isAdmin={isAdmin}
                  soundEnabled={soundEnabled}
                  triggerAudio={triggerAudio}
                />
              </div>
            )}

            {communitySubTab === 'ouvidoria' && (
              <div className="animate-fade-in">
                <CommunityFeedbackSection
                  currentUser={user}
                  isAdmin={isAdmin}
                  onAddXP={handleAddFanXP}
                  triggerAudio={triggerAudio}
                />
              </div>
            )}
          </div>
        ) : (
          <PKXDHomeView
            user={user}
            isAdmin={isAdmin}
            fanLevel={fanLevel}
            totalXp={totalXpDisplay}
            playerTag={currentPlayerTag}
            identityXpClaimed={Boolean(xpProfile?.claimedRewards?.includes('pkxd_identity_25'))}
            pwaXpClaimed={Boolean(xpProfile?.claimedRewards?.includes('pwa_install_100'))}
            newsList={newsList}
            featuredList={featuredList}
            theoriesList={theoriesList}
            shortsList={shortsList}
            pastSpoilers={pastSpoilers}
            notifications={combinedNotifications}
            spoilerTitle={spoilerTitle}
            spoilerDesc={spoilerDesc}
            spoilerImage={spoilerImage}
            forceReveal={forceReveal}
            revealedAt={revealedAt}
            isDelayed={isDelayed}
            delayMessage={delayMessage}
            extraCountdownTitle={extraCountdownTitle}
            extraCountdownDate={extraCountdownDate}
            extraCountdownEnabled={extraCountdownEnabled}
            giftCountdownTitle={giftCountdownTitle}
            giftCountdownDate={giftCountdownDate}
            giftCountdownEnabled={giftCountdownEnabled}
            giftCountdownContent={giftCountdownContent}
            whatsappChannelUrl={WHATSAPP_CHANNEL_URL}
            onNavigate={navigateTo}
            onOpenTagModal={openTagSetupFlow}
            onTriggerPWAInstall={() => setShowInstallAppModal(true)}
            onAddXP={handleAddFanXP}
            onOpenFullscreenSpoiler={(title, desc, img) => {
              setFullscreenData({ title, desc, imageUrl: img || '' });
              setIsFullscreenOpen(true);
            }}
            onDeletePastSpoiler={handleDeletePastSpoiler}
            onEditPastSpoiler={(spoil) => {
              setPastSpoilerToEdit(spoil);
              navigateTo('/admin');
            }}
            onRatePastSpoiler={handleRatePastSpoiler}
            onReactPastSpoiler={handleReactPastSpoiler}
            onSelectNewsArticle={(id) => navigateTo(`/noticias/${id}`)}
            onDeleteFeaturedVideo={handleDeleteFeaturedVideo}
            onDeleteShort={handleDeleteShort}
            triggerAudio={triggerAudio}
          />
        )}
      </main>

      {/* BOLD NEO-BRUTALIST DEEP PURPLE FOOTER */}
      <footer id="main-footer" className="relative z-10 bg-[#1B0538] border-t-[4px] border-[#120624] text-white mt-auto select-none pb-24 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand & Mission */}
            <div className="space-y-3">
              <strong className="font-display text-xl font-bold text-white block">
                PKXD <span className="text-[#F9C826]">CENTRAL</span>
              </strong>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm">
                Portal independente completo para a comunidade PK XD: eventos, torneios, Minha Agenda, notícias, criadores e sistema de XP.
              </p>
              <button
                type="button"
                onClick={() => setShowInstallAppModal(true)}
                className="pkxd-btn-gold px-4 py-2 text-xs uppercase cursor-pointer"
              >
                Instalar App (+100 XP)
              </button>
            </div>

            {/* Direct Navigation Links */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#F9C826] block">
                Explorar Portal
              </span>
              <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs sm:text-sm text-white/85 font-semibold">
                {[
                  { label: 'Início', path: '/' },
                  { label: 'Eventos', path: '/eventos' },
                  { label: 'Minha Agenda', path: '/minha-agenda' },
                  { label: 'Criar Evento', path: '/criar-evento' },
                  { label: 'Pets (Doação/Troca)', path: '/pets' },
                  { label: 'Notícias', path: '/noticias' },
                  { label: 'Creators', path: '/criadores' },
                  { label: 'Notificações', path: '/notificacoes' },
                  { label: 'Meu Perfil', path: '/perfil' },
                  { label: 'Administração', path: '/admin' },
                ].map((link) => (
                  <li key={link.path}>
                    <button
                      type="button"
                      onClick={() => {
                        triggerAudio('tap');
                        navigateTo(link.path);
                      }}
                      className="hover:text-[#F9C826] transition-colors cursor-pointer"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Privacy, Cookies & Rights */}
            <div className="space-y-3" id="footer-privacy-column">
              <span className="text-xs font-black uppercase tracking-wider text-[#F9C826] block">
                Privacidade e Segurança
              </span>
              <ul className="space-y-2.5 text-xs sm:text-sm text-white/85 font-semibold">
                <li>
                  <button
                    id="footer-link-privacy-policy"
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      navigateTo('/privacidade');
                    }}
                    className="hover:text-[#F9C826] transition-colors cursor-pointer text-left"
                  >
                    Política de Privacidade
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-terms-of-use"
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      navigateTo('/termos-de-uso');
                    }}
                    className="hover:text-[#F9C826] transition-colors cursor-pointer text-left"
                  >
                    Termos de Uso
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-cookie-preferences"
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      setIsCookiePreferencesOpen(true);
                    }}
                    className="hover:text-[#F9C826] transition-colors cursor-pointer text-left"
                  >
                    Preferências de Cookies
                  </button>
                </li>
                <li>
                  <button
                    id="footer-link-user-rights"
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      setUserDataRequestInitialType('access');
                      setIsUserDataRequestOpen(true);
                    }}
                    className="hover:text-[#F9C826] transition-colors cursor-pointer text-left"
                  >
                    Seus Direitos e Dados
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/70">
            <span>© 2026 PKXD Central · Plataforma Independente da Comunidade PK XD</span>
            <button
              type="button"
              onClick={() => {
                triggerAudio('tap');
                navigateTo('/privacidade-e-direitos');
              }}
              className="hover:text-[#F9C826] transition-colors cursor-pointer underline"
            >
              Centro de Privacidade e Direitos
            </button>
          </div>
        </div>
      </footer>

      {/* FULLSCREEN SPOILER MODAL OVERLAY */}
      {isFullscreenOpen && fullscreenData && (
        <div
          onClick={() => {
            setIsFullscreenOpen(false);
            setFullscreenData(null);
            triggerAudio('tap');
          }}
          className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center justify-start p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in cursor-zoom-out"
          id="fullscreen-spoiler-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl my-auto py-6 relative flex flex-col items-stretch text-left cursor-default space-y-5"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display font-bold text-2xl sm:text-4xl text-white">
                {fullscreenData.title}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsFullscreenOpen(false);
                  setFullscreenData(null);
                  triggerAudio('tap');
                }}
                className="w-11 h-11 rounded-2xl bg-white/15 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                aria-label="Fechar visualização"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {fullscreenData.imageUrl && (
              <div className="rounded-3xl border border-white/15 overflow-hidden bg-slate-900 p-2 max-h-[75vh] flex items-center justify-center">
                <img
                  src={fullscreenData.imageUrl}
                  alt={fullscreenData.title}
                  className="max-h-[70vh] w-full h-auto object-contain rounded-2xl select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {fullscreenData.desc && (
              <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl overflow-y-auto max-h-[360px]">
                <CountdownWidget
                  onlyContent={true}
                  spoilerTitle={fullscreenData.title}
                  spoilerDesc={fullscreenData.desc}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* CENTRAL DE ALERTAS OVERLAY (Light, high-contrast) */}
      {isNotifOverlayOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in cursor-pointer"
          id="notifications-list-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsNotifOverlayOpen(false);
              triggerAudio('tap');
            }
          }}
        >
          <div className="pkxd-glass-modal rounded-3xl p-5 sm:p-7 w-full max-w-2xl relative my-4 sm:my-8 text-left cursor-default">
            <div className="flex items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200">
              <div className="flex items-center gap-2.5 text-slate-900">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Notificações Importantes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Spoilers, códigos de lives e comunicados recentes
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsNotifOverlayOpen(false);
                  triggerAudio('tap');
                }}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                aria-label="Fechar notificações"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Browser push opt-in bar */}
            <div className="mb-5 p-4 rounded-2xl bg-violet-50 border border-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-violet-800">
                  Alertas no Navegador e Celular
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ative para receber avisos quando novos spoilers e códigos forem publicados.
                </p>
              </div>

              {hasNotificationPermission ? (
                <span className="shrink-0 bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold">
                  Alertas Ativados
                </span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    triggerAudio('tap');
                    if (!('Notification' in window)) {
                      setNotifMessage('Este navegador não suporta notificações de sistema.');
                      setTimeout(() => setNotifMessage(null), 5000);
                      return;
                    }
                    try {
                      const perm = await Notification.requestPermission();
                      setHasNotificationPermission(perm === 'granted');
                      if (perm === 'granted') {
                        triggerAudio('success');
                        setTimeout(() => subscribeUserToPush(), 200);
                        const welcomeTitle = 'PKXD Central';
                        const welcomeOptions = {
                          body: 'Notificações ativadas com sucesso! Você receberá alertas de novos spoilers e códigos.',
                          icon: '/favicon.png',
                          badge: '/favicon.png',
                        };
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.ready
                            .then((reg) => reg.showNotification(welcomeTitle, welcomeOptions))
                            .catch(() => new Notification(welcomeTitle, welcomeOptions));
                        } else {
                          new Notification(welcomeTitle, welcomeOptions);
                        }
                      }
                    } catch (err) {
                      console.warn(err);
                    }
                  }}
                  className="pkxd-btn-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                >
                  Ativar Alertas
                </button>
              )}
            </div>

            {/* Notification feed */}
            <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
              {combinedNotifications.length === 0 ? (
                <div className="py-10 text-center text-slate-500 space-y-1">
                  <p className="text-sm font-semibold">Nenhuma notificação recente.</p>
                  <p className="text-xs">Novos comunicados, spoilers e pedidos de pets aparecerão aqui.</p>
                </div>
              ) : (
                combinedNotifications.map((notif) => {
                  const userReaction = notificationReactions[notif.id];
                  const baseLikes = (notif.createdAt % 29) + 8;
                  const baseDislikes = notif.createdAt % 7;
                  const displayLikes = baseLikes + (userReaction === 'like' ? 1 : 0);
                  const displayDislikes = baseDislikes + (userReaction === 'dislike' ? 1 : 0);
                  const isPetInterest = notif.type === 'pet_interest' && Boolean(notif.petInterest);
                  const canDelete = isAdmin || Boolean(notif.isPersonalPetNotification);

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 border rounded-2xl space-y-2 ${
                        isPetInterest
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteNotification(
                                notif.id,
                                Boolean(notif.isPersonalPetNotification),
                              )
                            }
                            title="Apagar Notificação"
                            className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{notif.body}</p>
                      {isPetInterest && notif.petInterest && (
                        <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
                          <p className="font-bold text-slate-800">
                            PK XD: <span className="font-mono text-indigo-700">{notif.petInterest.senderName} #{notif.petInterest.senderTagNumber}</span>
                          </p>
                          <p className="font-bold text-slate-800">
                            {notif.petInterest.contactType === 'whatsapp' ? 'WhatsApp: ' : 'Rede Social: '}
                            <span className="font-mono text-emerald-700">{notif.petInterest.contactValue}</span>
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 tabular-nums">
                          {new Date(notif.createdAt).toLocaleString('pt-BR')}
                        </span>
                        {!isPetInterest && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleNotificationReaction(notif.id, 'like')}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer tabular-nums ${
                                userReaction === 'like'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{displayLikes}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNotificationReaction(notif.id, 'dislike')}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer tabular-nums ${
                                userReaction === 'dislike'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>{displayDislikes}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK PK XD TAG SETUP MODAL */}
      {showTagSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="pkxd-glass-modal rounded-3xl p-6 w-full max-w-md relative text-left space-y-4">
            <button
              type="button"
              onClick={() => setShowTagSetupModal(false)}
              className="absolute top-4 right-4 w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center cursor-pointer"
              aria-label="Fechar modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Vincular Nome e # do PK XD
                </h3>
                <span className="text-xs text-amber-700 font-bold">
                  Ganhe +25 XP e preenchimento automático em eventos
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Informe seu Nick e o número com hashtag (#) exatamente como aparece dentro do jogo PK XD.
            </p>

            <form onSubmit={handleSavePkxdTag} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome no PK XD *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="Ex: LUNA"
                    value={tagSetupName}
                    onChange={(e) => {
                      setTagSetupName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''));
                      setTagSetupError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 uppercase focus:outline-none focus:border-violet-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número # *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-mono font-bold text-sm text-violet-700">#</span>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="245"
                      value={tagSetupNumber}
                      onChange={(e) => {
                        setTagSetupNumber(e.target.value.replace(/[^0-9]/g, ''));
                        setTagSetupError('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-600 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Tag Completa:</span>
                <span className="font-mono font-bold text-violet-800">
                  {tagSetupName.trim() || 'SEUNICK'}#{tagSetupNumber.trim() || '000'}
                </span>
              </div>

              {tagSetupError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {tagSetupError}
                </div>
              )}

              <button
                type="submit"
                className="w-full pkxd-btn-primary py-3 rounded-2xl text-sm font-bold cursor-pointer"
              >
                Salvar Tag e Ganhar +25 XP
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={currentAuthModalMode}
        onClose={() => {
          setExplicitAuthModalOpen(false);
          if (isAuthRoute) {
            navigateTo('/');
          }
        }}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setExplicitAuthModalOpen(false);
        }}
        triggerAudio={triggerAudio}
        onNavigate={navigateTo}
        onAddXP={handleAddFanXP}
      />

      {/* GLOBAL COOKIE BANNER & PRIVACY MODALS */}
      <CookieBanner
        onOpenPreferences={() => setIsCookiePreferencesOpen(true)}
        triggerAudio={triggerAudio}
      />

      <CookiePreferencesModal
        isOpen={isCookiePreferencesOpen}
        onClose={() => setIsCookiePreferencesOpen(false)}
        triggerAudio={triggerAudio}
      />

      <UserDataRequestModal
        isOpen={isUserDataRequestOpen}
        initialType={userDataRequestInitialType}
        onClose={() => setIsUserDataRequestOpen(false)}
        triggerAudio={triggerAudio}
      />
    </div>
  );
}

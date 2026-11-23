import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  PKXDPassport,
  PassportBadge,
  PassportStamp,
  PassportFriend,
  CommunityEvent
} from '../types';
import {
  User,
  QrCode,
  Award,
  BookmarkCheck,
  Users,
  Calendar,
  Share2,
  Edit3,
  Sparkles,
  Copy,
  Check,
  Trophy,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Flame,
  UploadCloud,
  ShieldCheck,
  Star,
  Search,
  Gift,
  KeyRound,
  Download,
  Loader2,
  Palette,
  Info,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { exportPKXDCardImage } from '../utils/pkxdCardExporter';
import CardDownloadPreviewModal from './CardDownloadPreviewModal';

interface PassportSectionProps {
  currentUser?: any;
  isAdmin: boolean;
  fanXP: number;
  fanLevel?: number;
  onAddXP?: (amount: number, reason: string) => void;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'spin' | 'success') => void;
  events?: CommunityEvent[];
}

const DEFAULT_BADGES: PassportBadge[] = [
  {
    id: 'badge_pioneer',
    title: 'Pioneiro da Central',
    description: 'Acessou e explorou a plataforma PK XD.',
    icon: '🌟',
    category: 'community',
    unlocked: true,
    unlockedAt: Date.now() - 30 * 24 * 3600 * 1000,
    rarity: 'Comum'
  },
  {
    id: 'badge_spoiler_hunter',
    title: 'Caçador de Spoilers',
    description: 'Acompanhou os spoilers semanais e reagiu às novidades.',
    icon: '🔮',
    category: 'spoilers',
    unlocked: true,
    unlockedAt: Date.now() - 10 * 24 * 3600 * 1000,
    rarity: 'Raro'
  },
  {
    id: 'badge_active_voter',
    title: 'Cidadão Eleitor',
    description: 'Votou em enquetes e decisões da comunidade.',
    icon: '🗳️',
    category: 'social',
    unlocked: false,
    rarity: 'Comum'
  },
  {
    id: 'badge_event_master',
    title: 'Estrela dos Eventos',
    description: 'Participou ou criou eventos oficiais na Central.',
    icon: '🏆',
    category: 'events',
    unlocked: false,
    rarity: 'Épico'
  },
  {
    id: 'badge_pwa_pro',
    title: 'Aplicativo Instalado',
    description: 'Instalou o PK XD Central como aplicativo no celular ou PC.',
    icon: '📱',
    category: 'special',
    unlocked: false,
    rarity: 'Raro'
  },
  {
    id: 'badge_theorist',
    title: 'Teórico da Ilha',
    description: 'Enviou teorias e descobertas sobre o universo de PK XD.',
    icon: '📝',
    category: 'community',
    unlocked: false,
    rarity: 'Épico'
  },
  {
    id: 'badge_code_hunter',
    title: 'Colecionador VIP',
    description: 'Resgatou códigos promocionais de gemas e moedas.',
    icon: '💎',
    category: 'special',
    unlocked: false,
    rarity: 'Raro'
  },
  {
    id: 'badge_friendly',
    title: 'Amigo da Ilha',
    description: 'Conectou amigos ao seu PKXD ID.',
    icon: '🤝',
    category: 'social',
    unlocked: false,
    rarity: 'Comum'
  },
  {
    id: 'badge_legend',
    title: 'Lenda do PK XD',
    description: 'Alcançou o Nível 10+ de fã e conquistou respeito na Ilha.',
    icon: '👑',
    category: 'special',
    unlocked: false,
    rarity: 'Lendário'
  }
];

const DEFAULT_STAMPS: PassportStamp[] = [];

export const DEFAULT_OFFICIAL_AVAILABLE_STAMPS: PassportStamp[] = [
  {
    id: 'stamp_welcome_2026',
    title: 'Selo Oficial de Boas-Vindas 2026',
    eventOrSeason: 'Inauguração PKXD Central',
    location: 'Central Plaza',
    date: '2026',
    icon: '🌟',
    color: '#7C3AED',
    description: 'Carimbado para celebrar sua chegada ao novo portal PK XD Central.',
    xpReward: 50,
    isAvailable: true
  },
  {
    id: 'stamp_island_explorer',
    title: 'Explorador da Ilha',
    eventOrSeason: 'Temporada Oficial',
    location: 'Ilha dos Criadores',
    date: '2026',
    icon: '🧭',
    color: '#0284C7',
    description: 'Resgatado por grandes desbravadores de novidades e eventos da Ilha PK XD.',
    xpReward: 75,
    isAvailable: true
  },
  {
    id: 'stamp_festival_fever',
    title: 'Festa dos Fãs PK XD',
    eventOrSeason: 'Festival Musical',
    location: 'Praça das Estrelas',
    date: '2026',
    icon: '🎉',
    color: '#DB2777',
    description: 'Selo oficial comemorativo do festival de dança e celebração dos criadores!',
    xpReward: 100,
    isAvailable: true
  },
  {
    id: 'stamp_secret_vip',
    title: 'Selo VIP Secreto da Ilha',
    eventOrSeason: 'Edição Secreta',
    location: 'Cofre Secreto',
    date: '2026',
    icon: '👑',
    color: '#D97706',
    description: 'Selo ultra raro desbloqueado com o código secreto CENTRALVIP ou 1000GEMAS.',
    secretCode: 'CENTRALVIP',
    xpReward: 200,
    isAvailable: false
  },
  {
    id: 'stamp_spoiler_insider',
    title: 'Selo Mestre dos Spoilers',
    eventOrSeason: 'Clube dos Vazamentos',
    location: 'Torre de Transmissão',
    date: '2026',
    icon: '🔮',
    color: '#6D28D9',
    description: 'Selo misterioso resgatado através do código SPOILERMASTER ou WELCOME.',
    secretCode: 'SPOILERMASTER',
    xpReward: 150,
    isAvailable: false
  }
];

export interface MinigameItem {
  name: string;
  icon: string;
}

export const PKXD_MINIGAMES: MinigameItem[] = [
  { name: 'Crazy Run', icon: '⚡' },
  { name: 'Pet Parade', icon: '🐶' },
  { name: 'Falcon XD', icon: '🦅' },
  { name: 'XD Turbo Race', icon: '🚗' },
  { name: 'Coleta de Frutas', icon: '🍎' },
  { name: 'Entrega de Pizzas', icon: '🍕' },
  { name: 'Freezing Fun', icon: '❄️' },
  { name: 'XD Champions', icon: '🏆' },
  { name: 'Fashion Star', icon: '👗' },
  { name: 'Monster Lab', icon: '👹' },
  { name: 'Pet Run', icon: '🐾' },
  { name: 'XD Race', icon: '🏎️' },
  { name: 'Robot Arena', icon: '🤖' },
  { name: 'Shooter', icon: '🔫' },
  { name: 'XD Hide', icon: '🙈' },
  { name: 'Miraculous Hunt', icon: '🐞' }
];

export function getMinigameIcon(gameName: string): string {
  const match = PKXD_MINIGAMES.find(g => g.name.toLowerCase() === gameName?.toLowerCase());
  return match ? match.icon : '🎮';
}

export const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Armor&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Star&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Gamer&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Cyber&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Flame&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Neon&backgroundColor=c1f2d5'
];

export async function compressPassportImage(file: File, maxWidth = 256, maxHeight = 256, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (e) => reject(e);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function encodePassportPayload(p: PKXDPassport): string {
  try {
    const minimal = {
      n: p.nickname || 'Explorador',
      t: p.playerTag || 'Explorador',
      a: p.avatarUrl || PRESET_AVATARS[0],
      ti: p.title || 'Explorador da Ilha',
      b: p.bio || 'Explorador da Ilha PK XD!',
      g: p.favoriteMinigame || 'Crazy Run',
      h: p.houseTheme || 'Mansão Gamer',
      c: p.cardTheme || 'neon-purple',
      l: p.level || 1,
      x: p.xp || 0,
      u: p.userId || 'user'
    };
    const jsonStr = JSON.stringify(minimal);
    return encodeURIComponent(btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)))));
  } catch (e) {
    return '';
  }
}

export function decodePassportPayload(encoded: string): PKXDPassport | null {
  try {
    const raw = decodeURIComponent(encoded);
    const jsonStr = decodeURIComponent(Array.prototype.map.call(atob(raw), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const data = JSON.parse(jsonStr);
    if (!data || (!data.n && !data.t)) return null;

    return {
      id: 'shared_' + (data.u || Date.now()),
      userId: data.u || 'shared_user',
      playerTag: data.t || 'JOGADOR',
      nickname: data.n || 'Explorador',
      avatarUrl: data.a || PRESET_AVATARS[0],
      title: data.ti || 'Explorador da Ilha',
      bio: data.b || 'Explorador da Ilha PK XD!',
      favoriteMinigame: data.g || 'Crazy Run',
      houseTheme: data.h || 'Mansão Gamer',
      cardTheme: data.c || 'neon-purple',
      level: Number(data.l) || 1,
      xp: Number(data.x) || 0,
      joinedAt: Date.now() - 30 * 24 * 3600 * 1000,
      timeInCommunity: 'Membro da Central',
      isPublic: true,
      badges: DEFAULT_BADGES,
      stamps: DEFAULT_STAMPS,
      friends: [],
      eventHistory: [],
      updatedAt: Date.now()
    };
  } catch (e) {
    return null;
  }
}

/**
 * Gera link curto e limpo oficial para compartilhar PKXD ID
 */
export function getPassportShareUrl(p: PKXDPassport): string {
  const cleanTag = encodeURIComponent((p.playerTag || 'Explorador').trim());
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://pkxdcentral.site';
  return `${origin}/?id=${cleanTag}`;
}

export default function PassportSection({
  currentUser,
  isAdmin,
  fanXP,
  fanLevel = 1,
  onAddXP,
  triggerAudio,
  events = []
}: PassportSectionProps) {
  const [viewingSharedPassport, setViewingSharedPassport] = useState<PKXDPassport | null>(null);

  const effectiveLevel = viewingSharedPassport ? Number(viewingSharedPassport.level || 1) : Math.max(1, fanLevel || 1);
  const effectiveXP = viewingSharedPassport ? Number(viewingSharedPassport.xp || 0) : Math.max(0, fanXP || 0);
  const totalLifetimeXP = viewingSharedPassport
    ? ((effectiveLevel - 1) * 100 + effectiveXP)
    : ((effectiveLevel - 1) * 100 + effectiveXP);

  const [activeTab, setActiveTab] = useState<'card' | 'badges' | 'stamps' | 'friends' | 'events'>('card');

  // Inline feedback & confirmations (zero alert/confirm popups)
  const [feedbackBanner, setFeedbackBanner] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmRemoveFriendId, setConfirmRemoveFriendId] = useState<string | null>(null);
  const [confirmDeleteStampId, setConfirmDeleteStampId] = useState<string | null>(null);
  const [confirmDeleteHistoryId, setConfirmDeleteHistoryId] = useState<string | null>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  // Beginner quick-start guide visibility
  const [showOnboardingHint, setShowOnboardingHint] = useState(() => {
    try {
      return localStorage.getItem('pkxd_passport_hint_dismissed') !== '1';
    } catch {
      return true;
    }
  });

  const showBanner = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedbackBanner({ text, type });
    setTimeout(() => {
      setFeedbackBanner(prev => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Card ref for high-resolution PNG downloads
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [friendSearch, setFriendSearch] = useState('');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'identity' | 'universe' | 'style'>('identity');
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddStampModalOpen, setIsAddStampModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<PassportBadge | null>(null);
  const [previewModalData, setPreviewModalData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    blob?: Blob;
    filename: string;
  }>({
    isOpen: false,
    imageUrl: '',
    filename: ''
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Friend input form
  const [newFriendTag, setNewFriendTag] = useState('');
  const [newFriendNick, setNewFriendNick] = useState('');
  const [newFriendGame, setNewFriendGame] = useState('Crazy Run');
  const [friendError, setFriendError] = useState('');

  // Stamps System
  const [availableStamps, setAvailableStamps] = useState<PassportStamp[]>(() => {
    const saved = localStorage.getItem('pkxd_available_stamps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_OFFICIAL_AVAILABLE_STAMPS;
  });

  const [secretStampCode, setSecretStampCode] = useState('');
  const [codeRedeemMsg, setCodeRedeemMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Admin Stamp creation form state
  const [newStampTitle, setNewStampTitle] = useState('');
  const [newStampEvent, setNewStampEvent] = useState('');
  const [newStampLocation, setNewStampLocation] = useState('Central Plaza');
  const [newStampDate, setNewStampDate] = useState('2026');
  const [newStampIcon, setNewStampIcon] = useState('🏆');
  const [newStampColor, setNewStampColor] = useState('#7C3AED');
  const [newStampSecretCode, setNewStampSecretCode] = useState('');
  const [newStampXpReward, setNewStampXpReward] = useState(50);

  // Loaded passport data
  const [passport, setPassport] = useState<PKXDPassport>(() => {
    const userAccountName = currentUser?.displayName ||
      (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
      localStorage.getItem('pkxd_nickname') ||
      localStorage.getItem('pkxd_username_nickname') ||
      '';

    const saved = localStorage.getItem('pkxd_passport_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const isGenericTag = !parsed.playerTag || parsed.playerTag === 'JOGADOR' || parsed.playerTag === 'JOGADOR#000' || parsed.playerTag === 'GUEST';
        const isGenericNick = !parsed.nickname || parsed.nickname === 'Explorador' || parsed.nickname === 'Fã Secreto' || parsed.nickname === 'JOGADOR';

        const effectiveTag = (isGenericTag && userAccountName) ? userAccountName : (parsed.playerTag || userAccountName || 'Explorador');
        const effectiveNick = (isGenericNick && userAccountName) ? userAccountName : (parsed.nickname || userAccountName || 'Explorador');

        const effectiveAvatar = currentUser?.photoURL || (parsed.avatarUrl && !parsed.avatarUrl.includes('images.unsplash.com') ? parsed.avatarUrl : PRESET_AVATARS[0]);
        const effectiveStamps = (parsed.stamps || []).filter((s: PassportStamp) =>
          s.id !== 'stamp_central_launch' && s.id !== 'stamp_summer_fest' && s.id !== 'stamp_crazy_run'
        );
        const effectiveBadges = DEFAULT_BADGES.map(defB => {
          const existing = (parsed.badges || []).find((b: PassportBadge) => b.id === defB.id);
          return existing ? { ...defB, unlocked: existing.unlocked, unlockedAt: existing.unlockedAt } : defB;
        });

        const effectiveEventHistory = (parsed.eventHistory || []).filter((h: any) =>
          h.id !== 'ev_1' && h.id !== 'ev_2' &&
          h.id !== 'event_crazy_run_mega' && h.id !== 'event_festa_desfile' &&
          !h.eventName?.includes('Mega Torneio') &&
          !h.eventName?.includes('Grande Desfile')
        );

        const effectiveFriends = (parsed.friends || []).filter((f: any) =>
          f.id !== 'friend_1' && f.id !== 'friend_2' &&
          f.playerTag !== 'LunaStar' && f.playerTag !== 'GabePKXD'
        );

        return {
          ...parsed,
          userId: currentUser?.uid || parsed.userId || 'guest_user',
          playerTag: effectiveTag,
          nickname: effectiveNick,
          avatarUrl: effectiveAvatar,
          level: effectiveLevel,
          xp: effectiveXP,
          isPublic: parsed.isPublic !== false,
          badges: effectiveBadges,
          stamps: effectiveStamps,
          friends: effectiveFriends,
          eventHistory: effectiveEventHistory
        };
      } catch (e) {}
    }

    const rawSavedTag = localStorage.getItem('pkxd_player_tag');
    const rawSavedNick = localStorage.getItem('pkxd_nickname');

    const savedTag = (rawSavedTag && rawSavedTag !== 'JOGADOR' && rawSavedTag !== 'JOGADOR#000')
      ? rawSavedTag
      : (userAccountName || 'Explorador');

    const savedNick = (rawSavedNick && rawSavedNick !== 'Explorador' && rawSavedNick !== 'Fã Secreto' && rawSavedNick !== 'JOGADOR')
      ? rawSavedNick
      : (userAccountName || 'Explorador');

    return {
      id: currentUser?.uid || 'passport_' + Date.now(),
      userId: currentUser?.uid || 'guest_user',
      playerTag: savedTag,
      nickname: savedNick,
      avatarUrl: currentUser?.photoURL || PRESET_AVATARS[0],
      bio: 'Apaixonado por PK XD! Adoro disputar no Crazy Run, personalizar minha casa e curtir eventos com a galera!',
      title: isAdmin ? 'Lorde da Moderação' : 'Explorador da Ilha',
      level: effectiveLevel,
      xp: effectiveXP,
      joinedAt: Date.now() - 45 * 24 * 3600 * 1000,
      timeInCommunity: 'Membro Ativo da Central',
      favoriteMinigame: 'Crazy Run',
      houseTheme: 'Mansão Gamer',
      cardTheme: 'neon-purple',
      isPublic: true,
      badges: DEFAULT_BADGES,
      stamps: DEFAULT_STAMPS,
      friends: [],
      eventHistory: [],
      updatedAt: Date.now()
    };
  });

  // Form edit states
  const [editNick, setEditNick] = useState(passport.nickname);
  const [editTagNumber, setEditTagNumber] = useState(() => {
    if (passport.playerTag && passport.playerTag.includes('#')) {
      return passport.playerTag.split('#')[1] || '';
    }
    return '';
  });
  const [editBio, setEditBio] = useState(passport.bio);
  const [editTitle, setEditTitle] = useState(passport.title);
  const [editMinigame, setEditMinigame] = useState(passport.favoriteMinigame);
  const [editHouse, setEditHouse] = useState(passport.houseTheme);
  const [editTheme, setEditTheme] = useState(passport.cardTheme);
  const [editAvatar, setEditAvatar] = useState(passport.avatarUrl);
  const [editAvatarFrame, setEditAvatarFrame] = useState(passport.avatarFrame || 'classic');
  const [editPet, setEditPet] = useState(passport.favoritePet || 'Unicórnio Mágico');
  const [editVehicle, setEditVehicle] = useState(passport.favoriteVehicle || 'Hoverboard Neon');
  const [editJob, setEditJob] = useState(passport.islandJob || 'Entregador de Pizza Ninja');
  const [editNameColor, setEditNameColor] = useState<'gold' | 'cyan' | 'purple' | 'pink' | 'white' | 'fire'>(passport.nameColor || 'white');
  const [editFeaturedIcon, setEditFeaturedIcon] = useState(passport.featuredBadgeIcon || '⚡');
  const [editStatus, setEditStatus] = useState(passport.statusPhrase || '🎮 Explorando a Ilha');
  const [editPrefix, setEditPrefix] = useState(passport.nicknamePrefix || '');
  const [editHonorBadgeId, setEditHonorBadgeId] = useState(passport.honorBadgeId || 'badge_pioneer');
  const [editIsPublic, setEditIsPublic] = useState(passport.isPublic !== false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleOpenEditModal = (initialTab: 'identity' | 'universe' | 'style' = 'identity') => {
    setEditNick(passport.nickname);
    if (passport.playerTag && passport.playerTag.includes('#')) {
      setEditTagNumber(passport.playerTag.split('#')[1] || '');
    } else {
      setEditTagNumber('000');
    }
    setEditBio(passport.bio);
    setEditTitle(passport.title);
    setEditMinigame(passport.favoriteMinigame);
    setEditHouse(passport.houseTheme || 'Mansão Gamer');
    setEditTheme(passport.cardTheme);
    setEditAvatar(passport.avatarUrl);
    setEditAvatarFrame(passport.avatarFrame || 'classic');
    setEditPet(passport.favoritePet || 'Unicórnio Mágico');
    setEditVehicle(passport.favoriteVehicle || 'Hoverboard Neon');
    setEditJob(passport.islandJob || 'Entregador de Pizza Ninja');
    setEditNameColor(passport.nameColor || 'white');
    setEditFeaturedIcon(passport.featuredBadgeIcon || '⚡');
    setEditStatus(passport.statusPhrase || '🎮 Explorando a Ilha');
    setEditPrefix(passport.nicknamePrefix || '');
    setEditHonorBadgeId(passport.honorBadgeId || 'badge_pioneer');
    setEditIsPublic(passport.isPublic !== false);
    setEditModalTab(initialTab);
    setIsEditModalOpen(true);
  };

  // Parse URL on mount / search params change to load shared passport
  useEffect(() => {
    const handleCheckSharedUrl = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sharedTag = params.get('id') || params.get('passaporte') || params.get('tag') || params.get('p') || params.get('pkxd-id');
        const cardPayload = params.get('card') || params.get('data');

        if (!sharedTag && !cardPayload) return;

        let initialDecoded: PKXDPassport | null = null;
        if (cardPayload) {
          initialDecoded = decodePassportPayload(cardPayload);
        }

        const rawTag = sharedTag || initialDecoded?.playerTag;
        if (rawTag) {
          const currentMyTag = passport.playerTag?.toLowerCase().trim();
          const targetTag = rawTag.toLowerCase().trim();

          if (initialDecoded || (targetTag && targetTag !== currentMyTag)) {
            if (initialDecoded) {
              setViewingSharedPassport(initialDecoded);
            }

            if (db) {
              const cleanKey = encodeURIComponent(targetTag.replace(/[.#$/[\]]/g, '_'));
              const publicDocRef = doc(db, 'pkxd_public_passports', cleanKey);
              const snap = await getDoc(publicDocRef);
              if (snap.exists()) {
                const remoteData = snap.data() as PKXDPassport;
                setViewingSharedPassport(prev => ({
                  ...(prev || initialDecoded || remoteData),
                  ...remoteData
                }));
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao processar passaporte compartilhado:', err);
      }
    };

    handleCheckSharedUrl();
  }, [passport.playerTag]);

  // Sync profile photo and account name whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      const accountName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : '');

      setPassport(prev => {
        const isGenericTag = !prev.playerTag || prev.playerTag === 'JOGADOR' || prev.playerTag === 'JOGADOR#000' || prev.playerTag === 'GUEST' || prev.userId === 'guest_user';
        const isGenericNick = !prev.nickname || prev.nickname === 'Explorador' || prev.nickname === 'Fã Secreto' || prev.nickname === 'JOGADOR' || prev.userId === 'guest_user';
        const isGenericAvatar = !prev.avatarUrl || prev.avatarUrl.includes('dicebear.com/7.x/bottts/svg?seed=PKXD_Armor');

        const updatedTag = (isGenericTag && accountName) ? accountName : prev.playerTag;
        const updatedNick = (isGenericNick && accountName) ? accountName : prev.nickname;
        const updatedAvatar = (isGenericAvatar && currentUser.photoURL) ? currentUser.photoURL : prev.avatarUrl;

        const updated = {
          ...prev,
          userId: currentUser.uid,
          playerTag: updatedTag,
          nickname: updatedNick,
          avatarUrl: updatedAvatar
        };
        try {
          localStorage.setItem('pkxd_passport_data', JSON.stringify(updated));
          localStorage.setItem('pkxd_player_tag', updated.playerTag);
          localStorage.setItem('pkxd_nickname', updated.nickname);
        } catch (e) {}
        return updated;
      });

      if (accountName) {
        setEditNick(prevNick => (!prevNick || prevNick === 'Explorador' || prevNick === 'Fã Secreto' || prevNick === 'JOGADOR') ? accountName : prevNick);
      }
    }
  }, [currentUser?.uid, currentUser?.displayName, currentUser?.email]);

  // Sync Level & XP on props change
  useEffect(() => {
    if (!viewingSharedPassport) {
      setPassport(prev => {
        const updatedBadges = prev.badges.map(b => {
          if (b.id === 'badge_legend' && effectiveLevel >= 10 && !b.unlocked) {
            return { ...b, unlocked: true, unlockedAt: Date.now() };
          }
          return b;
        });

        const updated: PKXDPassport = {
          ...prev,
          level: effectiveLevel,
          xp: effectiveXP,
          badges: updatedBadges,
          updatedAt: Date.now()
        };
        try {
          localStorage.setItem('pkxd_passport_data', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  }, [fanLevel, fanXP, effectiveLevel, effectiveXP, viewingSharedPassport]);

  // Load from Firestore on user mount
  useEffect(() => {
    async function loadRemotePassport() {
      if (!currentUser?.uid || !db) return;
      try {
        const docRef = doc(db, 'pkxd_passports', currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as PKXDPassport;
          const accountName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : '');
          const isGenericTag = !data.playerTag || data.playerTag === 'JOGADOR' || data.playerTag === 'JOGADOR#000';
          const isGenericNick = !data.nickname || data.nickname === 'Explorador' || data.nickname === 'Fã Secreto' || data.nickname === 'JOGADOR';
          const finalTag = (isGenericTag && accountName) ? accountName : (data.playerTag || accountName || 'Explorador');
          const finalNick = (isGenericNick && accountName) ? accountName : (data.nickname || accountName || 'Explorador');

          const cleanedHistory = (data.eventHistory || []).filter((h: any) =>
            h.id !== 'ev_1' && h.id !== 'ev_2' &&
            h.id !== 'event_crazy_run_mega' && h.id !== 'event_festa_desfile' &&
            !h.eventName?.includes('Mega Torneio') &&
            !h.eventName?.includes('Grande Desfile')
          );
          const cleanedFriends = (data.friends || []).filter((f: any) =>
            f.id !== 'friend_1' && f.id !== 'friend_2' &&
            f.playerTag !== 'LunaStar' && f.playerTag !== 'GabePKXD'
          );

          setPassport(prev => {
            const merged = {
              ...prev,
              ...data,
              playerTag: finalTag,
              nickname: finalNick,
              avatarUrl: data.avatarUrl || currentUser?.photoURL || prev.avatarUrl,
              friends: cleanedFriends,
              eventHistory: cleanedHistory,
              level: effectiveLevel,
              xp: effectiveXP
            };
            try {
              localStorage.setItem('pkxd_passport_data', JSON.stringify(merged));
              localStorage.setItem('pkxd_player_tag', merged.playerTag);
              localStorage.setItem('pkxd_nickname', merged.nickname);
            } catch (e) {}
            return merged;
          });
        }
      } catch (err) {
        console.warn('Erro ao carregar passaporte do Firestore:', err);
      }
    }
    loadRemotePassport();
  }, [currentUser?.uid, currentUser?.displayName, currentUser?.email]);

  // Generate QR Code with short share URL
  useEffect(() => {
    const target = viewingSharedPassport || passport;
    const passportUrl = getPassportShareUrl(target);
    QRCode.toDataURL(passportUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Erro gerando QR Code:', err));
  }, [passport, viewingSharedPassport]);

  // Save passport helper
  const savePassport = async (newPassport: PKXDPassport) => {
    setPassport(newPassport);
    try {
      localStorage.setItem('pkxd_passport_data', JSON.stringify(newPassport));
      localStorage.setItem('pkxd_player_tag', newPassport.playerTag);
      localStorage.setItem('pkxd_nickname', newPassport.nickname);
    } catch (err) {
      console.warn('Erro ao salvar localmente:', err);
    }

    if (db) {
      try {
        const cleanKey = encodeURIComponent((newPassport.playerTag || 'player').trim().toLowerCase().replace(/[.#$/[\]]/g, '_'));
        await setDoc(doc(db, 'pkxd_public_passports', cleanKey), {
          ...newPassport,
          cleanKey,
          lastSavedAt: Date.now()
        }, { merge: true });

        if (currentUser?.uid && currentUser.uid !== 'guest_user') {
          await setDoc(doc(db, 'pkxd_passports', currentUser.uid), newPassport, { merge: true });
        }
      } catch (err) {
        console.warn('Erro ao salvar passaporte no Firestore:', err);
      }
    }
  };

  // Handle Edit Submit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = editNick.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '') || 'JOGADOR';
    const cleanNumber = editTagNumber.trim().replace(/[^0-9]/g, '') || '000';
    const formattedTag = `${cleanNick}#${cleanNumber}`;

    const updated: PKXDPassport = {
      ...passport,
      nickname: cleanNick,
      playerTag: formattedTag,
      bio: editBio.trim() || 'Explorador da Ilha PK XD!',
      title: editTitle,
      favoriteMinigame: editMinigame,
      houseTheme: editHouse.trim() || 'Mansão Gamer',
      cardTheme: editTheme,
      avatarUrl: editAvatar || currentUser?.photoURL || PRESET_AVATARS[0],
      avatarFrame: editAvatarFrame as any,
      favoritePet: editPet.trim() || 'Unicórnio Mágico',
      favoriteVehicle: editVehicle.trim() || 'Hoverboard Neon',
      islandJob: editJob.trim() || 'Entregador de Pizza Ninja',
      nameColor: editNameColor,
      featuredBadgeIcon: editFeaturedIcon,
      statusPhrase: editStatus.trim(),
      nicknamePrefix: editPrefix.trim(),
      honorBadgeId: editHonorBadgeId,
      isPublic: editIsPublic,
      updatedAt: Date.now()
    };

    savePassport(updated);
    try {
      localStorage.setItem('pkxd_player_tag', formattedTag);
      localStorage.setItem('pkxd_nickname', cleanNick);
      localStorage.setItem('pkxd_player_number', cleanNumber);
      localStorage.setItem('pkxd_username_nickname', formattedTag);
    } catch (err) {}

    setViewingSharedPassport(null);
    setIsEditModalOpen(false);
    showBanner('Seu PKXD ID foi atualizado e salvo com sucesso!', 'success');

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (triggerAudio) triggerAudio('success');
    if (onAddXP) onAddXP(15, 'Atualizou identificação e perfil do Passaporte');
  };

  // Avatar upload with auto-compression
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      showBanner('A imagem deve ter no máximo 12MB.', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const compressed = await compressPassportImage(file, 256, 256, 0.85);
      setEditAvatar(compressed);
      showBanner('Foto carregada! Clique em "Salvar Alterações" para aplicar.', 'info');
    } catch (err) {
      console.error('Erro comprimindo imagem:', err);
      showBanner('Não foi possível processar esta foto. Tente outra imagem.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Add Friend from shared link
  const handleAddFriendFromShared = (shared: PKXDPassport) => {
    if (passport.friends.some(f => f.playerTag.toLowerCase() === shared.playerTag.toLowerCase())) {
      showBanner('Este amigo já está na sua lista do Passaporte!', 'info');
      return;
    }

    const newFriend: PassportFriend = {
      id: 'friend_' + Date.now(),
      playerTag: shared.playerTag,
      nickname: shared.nickname || shared.playerTag,
      avatarUrl: shared.avatarUrl || PRESET_AVATARS[0],
      level: shared.level || 1,
      favoriteMinigame: shared.favoriteMinigame || 'Crazy Run',
      addedAt: Date.now()
    };

    const updatedFriends = [...passport.friends, newFriend];
    const updatedBadges = passport.badges.map(b => {
      if (b.id === 'badge_friendly' && !b.unlocked) {
        return { ...b, unlocked: true, unlockedAt: Date.now() };
      }
      return b;
    });

    const updated: PKXDPassport = {
      ...passport,
      friends: updatedFriends,
      badges: updatedBadges,
      updatedAt: Date.now()
    };

    savePassport(updated);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (onAddXP) onAddXP(20, `Adicionou ${shared.nickname} aos amigos!`);
    if (triggerAudio) triggerAudio('levelUp');
    showBanner(`${shared.nickname} foi adicionado à sua lista de amigos do Passaporte! (+20 XP)`, 'success');
  };

  // Handle Add Friend manual form
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendTag.trim()) {
      setFriendError('Insira o Nome ou Tag do amigo.');
      return;
    }

    const formattedTag = newFriendTag.trim();

    if (passport.friends.some(f => f.playerTag.toLowerCase() === formattedTag.toLowerCase())) {
      setFriendError('Este amigo já está na sua lista do Passaporte!');
      return;
    }

    const newFriend: PassportFriend = {
      id: 'friend_' + Date.now(),
      playerTag: formattedTag,
      nickname: newFriendNick.trim() || formattedTag,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formattedTag)}&backgroundColor=b6e3f4`,
      level: Math.floor(Math.random() * 15) + 1,
      favoriteMinigame: newFriendGame,
      addedAt: Date.now()
    };

    const updatedFriends = [...passport.friends, newFriend];
    const updatedBadges = passport.badges.map(b => {
      if (b.id === 'badge_friendly' && !b.unlocked) {
        return { ...b, unlocked: true, unlockedAt: Date.now() };
      }
      return b;
    });

    const updated: PKXDPassport = {
      ...passport,
      friends: updatedFriends,
      badges: updatedBadges,
      updatedAt: Date.now()
    };

    savePassport(updated);
    setNewFriendTag('');
    setNewFriendNick('');
    setFriendError('');
    setIsAddFriendModalOpen(false);
    showBanner(`${newFriend.nickname} adicionado à sua lista de amigos! (+15 XP)`, 'success');

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 }
    });

    if (onAddXP) onAddXP(15, 'Adicionou amigo ao Passaporte');
    if (triggerAudio) triggerAudio('levelUp');
  };

  const handleRemoveFriend = (friendId: string) => {
    const updatedFriends = (passport.friends || []).filter(f => f.id !== friendId);
    savePassport({
      ...passport,
      friends: updatedFriends,
      updatedAt: Date.now()
    });
    setConfirmRemoveFriendId(null);
    if (triggerAudio) triggerAudio('tap');
  };

  const handleClaimStamp = (stamp: PassportStamp) => {
    if (passport.stamps.some(s => s.id === stamp.id || s.title.toLowerCase() === stamp.title.toLowerCase())) {
      setCodeRedeemMsg({ text: `Você já possui o selo "${stamp.title}" carimbado no passaporte!`, type: 'error' });
      setTimeout(() => setCodeRedeemMsg(null), 3500);
      return;
    }

    const claimedStamp: PassportStamp = {
      ...stamp,
      acquiredAt: Date.now()
    };

    const updatedStamps = [claimedStamp, ...(passport.stamps || [])];
    savePassport({
      ...passport,
      stamps: updatedStamps,
      updatedAt: Date.now()
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (triggerAudio) triggerAudio('levelUp');
    const xpReward = stamp.xpReward || 50;
    if (onAddXP) onAddXP(xpReward, `Resgatou o Selo Oficial: ${stamp.title}`);

    setCodeRedeemMsg({ text: `Selo "${stamp.title}" resgatado com sucesso! (+${xpReward} XP)`, type: 'success' });
    setTimeout(() => setCodeRedeemMsg(null), 4000);
  };

  const handleRedeemSecretStampCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = secretStampCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) return;

    let matchedStamp = availableStamps.find(s => s.secretCode && s.secretCode.toUpperCase() === cleanCode);

    if (!matchedStamp) {
      if (cleanCode === 'CENTRALVIP' || cleanCode === 'VIP2026') {
        matchedStamp = availableStamps.find(s => s.id === 'stamp_secret_vip') || {
          id: 'stamp_secret_vip',
          title: 'Selo VIP Secreto da Ilha',
          eventOrSeason: 'Edição Secreta',
          location: 'Cofre Secreto',
          date: '2026',
          icon: '👑',
          color: '#D97706',
          description: 'Selo ultra raro desbloqueado com o código secreto CENTRALVIP.',
          xpReward: 200,
          isAvailable: false
        };
      } else if (cleanCode === 'SPOILERMASTER' || cleanCode === 'SPOILER2026') {
        matchedStamp = availableStamps.find(s => s.id === 'stamp_spoiler_insider') || {
          id: 'stamp_spoiler_insider',
          title: 'Selo Mestre dos Spoilers',
          eventOrSeason: 'Clube dos Vazamentos',
          location: 'Torre de Transmissão',
          date: '2026',
          icon: '🔮',
          color: '#6D28D9',
          description: 'Selo misterioso resgatado através do código secreto de Spoilers.',
          xpReward: 150,
          isAvailable: false
        };
      } else if (cleanCode === 'WELCOME' || cleanCode === '1000GEMAS') {
        matchedStamp = {
          id: 'stamp_promo_' + cleanCode.toLowerCase(),
          title: `Selo Código Especial ${cleanCode}`,
          eventOrSeason: 'Promoção Oficial do Site',
          location: 'Central PK XD',
          date: '2026',
          icon: cleanCode === '1000GEMAS' ? '💎' : '🪙',
          color: cleanCode === '1000GEMAS' ? '#0284C7' : '#D97706',
          description: `Selo de honra resgatado pelo código promocional ${cleanCode}!`,
          xpReward: 100
        };
      }
    }

    if (!matchedStamp) {
      setCodeRedeemMsg({ text: 'Código de selo não encontrado ou inválido. Tente CENTRALVIP, SPOILERMASTER ou 1000GEMAS.', type: 'error' });
      if (triggerAudio) triggerAudio('tap');
      setTimeout(() => setCodeRedeemMsg(null), 4000);
      return;
    }

    if (passport.stamps.some(s => s.id === matchedStamp!.id || s.title.toLowerCase() === matchedStamp!.title.toLowerCase())) {
      setCodeRedeemMsg({ text: `Você já possui o selo "${matchedStamp.title}" carimbado no seu passaporte!`, type: 'error' });
      if (triggerAudio) triggerAudio('tap');
      setTimeout(() => setCodeRedeemMsg(null), 4000);
      return;
    }

    handleClaimStamp(matchedStamp);
    setSecretStampCode('');
  };

  const handleClaimBadge = (badge: PassportBadge) => {
    const updatedBadges = passport.badges.map(b => {
      if (b.id === badge.id) {
        return { ...b, unlocked: true, unlockedAt: Date.now() };
      }
      return b;
    });

    savePassport({
      ...passport,
      badges: updatedBadges,
      updatedAt: Date.now()
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (triggerAudio) triggerAudio('levelUp');
    const xpReward = badge.rarity === 'Lendário' ? 100 : badge.rarity === 'Épico' ? 75 : badge.rarity === 'Raro' ? 50 : 30;
    if (onAddXP) onAddXP(xpReward, `Resgatou a Medalha: ${badge.title}`);
  };

  const handleCreateStamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStampTitle.trim()) return;

    const newStamp: PassportStamp = {
      id: 'stamp_' + Date.now(),
      title: newStampTitle.trim(),
      eventOrSeason: newStampEvent.trim() || 'Evento Oficial',
      location: newStampLocation.trim() || 'Central Plaza',
      date: newStampDate.trim() || '2026',
      icon: newStampIcon.trim() || '🏆',
      color: newStampColor || '#7C3AED',
      secretCode: newStampSecretCode.trim().toUpperCase() || undefined,
      xpReward: Number(newStampXpReward) || 50,
      isAvailable: !newStampSecretCode.trim(),
      acquiredAt: Date.now()
    };

    const updatedAvailable = [newStamp, ...availableStamps.filter(s => s.id !== newStamp.id)];
    setAvailableStamps(updatedAvailable);
    try {
      localStorage.setItem('pkxd_available_stamps', JSON.stringify(updatedAvailable));
    } catch (err) {}

    if (db) {
      try {
        setDoc(doc(db, 'pkxd_available_stamps', newStamp.id), newStamp, { merge: true });
      } catch (err) {}
    }

    const updatedStamps = [newStamp, ...(passport.stamps || [])];
    savePassport({
      ...passport,
      stamps: updatedStamps,
      updatedAt: Date.now()
    });

    setNewStampTitle('');
    setNewStampEvent('');
    setNewStampLocation('Central Plaza');
    setNewStampDate('2026');
    setNewStampIcon('🏆');
    setNewStampColor('#7C3AED');
    setNewStampSecretCode('');
    setNewStampXpReward(50);
    setIsAddStampModalOpen(false);
    showBanner('Novo Selo Oficial emitido e publicado!', 'success');

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (triggerAudio) triggerAudio('success');
    if (onAddXP) onAddXP(25, 'Criou e publicou um novo Selo Oficial no Passaporte');
  };

  const handleDeleteStamp = (stampId: string) => {
    const updatedStamps = (passport.stamps || []).filter(s => s.id !== stampId);
    savePassport({
      ...passport,
      stamps: updatedStamps,
      updatedAt: Date.now()
    });
    setConfirmDeleteStampId(null);
    if (triggerAudio) triggerAudio('tap');
  };

  const handleDeleteEventHistory = (histId: string) => {
    const updatedHistory = (passport.eventHistory || []).filter(h => h.id !== histId);
    savePassport({
      ...passport,
      eventHistory: updatedHistory,
      updatedAt: Date.now()
    });
    setConfirmDeleteHistoryId(null);
    if (triggerAudio) triggerAudio('tap');
  };

  const handleClearEventHistory = () => {
    savePassport({
      ...passport,
      eventHistory: [],
      updatedAt: Date.now()
    });
    setConfirmClearHistory(false);
    if (triggerAudio) triggerAudio('tap');
  };

  const handleCopyLink = () => {
    const target = viewingSharedPassport || passport;
    const passportUrl = getPassportShareUrl(target);
    navigator.clipboard.writeText(passportUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      if (triggerAudio) triggerAudio('tap');
    });
  };

  const handleCopyTag = () => {
    const targetTag = viewingSharedPassport ? viewingSharedPassport.playerTag : passport.playerTag;
    navigator.clipboard.writeText(targetTag).then(() => {
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2500);
      if (triggerAudio) triggerAudio('tap');
    });
  };

  // Visual theme styles strictly applied INSIDE #pkxd-passport-card preview
  const getThemeGradients = (theme: PKXDPassport['cardTheme']) => {
    switch (theme) {
      case 'cyber-blue':
        return {
          bg: 'from-cyan-950 via-slate-900 to-blue-950 border-cyan-400/80 shadow-[0_12px_35px_rgba(6,182,212,0.28)]',
          chip: 'from-cyan-300 via-teal-400 to-blue-600 border-cyan-200 text-cyan-950',
          accentText: 'text-cyan-300',
          levelBar: 'from-cyan-400 via-blue-400 to-indigo-400',
          glow1: 'bg-cyan-500/20',
          glow2: 'bg-blue-500/20',
          ringColor: 'border-cyan-400/80 ring-cyan-400/30'
        };
      case 'golden-vip':
        return {
          bg: 'from-amber-950 via-zinc-950 to-yellow-950 border-yellow-400/90 shadow-[0_12px_35px_rgba(234,179,8,0.28)]',
          chip: 'from-yellow-200 via-amber-400 to-yellow-600 border-yellow-100 text-amber-950',
          accentText: 'text-yellow-300',
          levelBar: 'from-yellow-300 via-amber-400 to-orange-400',
          glow1: 'bg-yellow-500/20',
          glow2: 'bg-amber-500/20',
          ringColor: 'border-yellow-400/80 ring-yellow-400/30'
        };
      case 'sunset-pink':
        return {
          bg: 'from-pink-950 via-purple-950 to-rose-950 border-pink-400/80 shadow-[0_12px_35px_rgba(236,72,153,0.28)]',
          chip: 'from-pink-300 via-rose-400 to-purple-600 border-pink-200 text-purple-950',
          accentText: 'text-pink-300',
          levelBar: 'from-pink-400 via-rose-400 to-purple-400',
          glow1: 'bg-pink-500/20',
          glow2: 'bg-rose-500/20',
          ringColor: 'border-pink-400/80 ring-pink-400/30'
        };
      case 'emerald-gamer':
        return {
          bg: 'from-emerald-950 via-slate-950 to-teal-950 border-emerald-400/80 shadow-[0_12px_35px_rgba(16,185,129,0.28)]',
          chip: 'from-emerald-300 via-teal-400 to-green-600 border-emerald-200 text-emerald-950',
          accentText: 'text-emerald-300',
          levelBar: 'from-emerald-400 via-teal-300 to-cyan-400',
          glow1: 'bg-emerald-500/20',
          glow2: 'bg-teal-500/20',
          ringColor: 'border-emerald-400/80 ring-emerald-400/30'
        };
      case 'volcano-red':
        return {
          bg: 'from-red-950 via-zinc-950 to-orange-950 border-orange-500/80 shadow-[0_12px_35px_rgba(249,115,22,0.28)]',
          chip: 'from-orange-300 via-amber-400 to-red-600 border-orange-200 text-orange-950',
          accentText: 'text-orange-300',
          levelBar: 'from-orange-400 via-red-500 to-amber-300',
          glow1: 'bg-orange-500/20',
          glow2: 'bg-red-500/20',
          ringColor: 'border-orange-500/80 ring-orange-500/30'
        };
      case 'frost-diamond':
        return {
          bg: 'from-sky-950 via-slate-950 to-blue-950 border-sky-300/90 shadow-[0_12px_35px_rgba(56,189,248,0.28)]',
          chip: 'from-sky-200 via-blue-300 to-indigo-500 border-white text-blue-950',
          accentText: 'text-sky-300',
          levelBar: 'from-sky-300 via-blue-400 to-teal-300',
          glow1: 'bg-sky-500/20',
          glow2: 'bg-blue-500/20',
          ringColor: 'border-sky-400/80 ring-sky-400/30'
        };
      case 'galaxy-space':
        return {
          bg: 'from-fuchsia-950 via-purple-950 to-zinc-950 border-fuchsia-400/80 shadow-[0_12px_35px_rgba(217,70,239,0.28)]',
          chip: 'from-fuchsia-300 via-purple-400 to-indigo-600 border-fuchsia-200 text-purple-950',
          accentText: 'text-fuchsia-300',
          levelBar: 'from-fuchsia-400 via-purple-500 to-indigo-400',
          glow1: 'bg-fuchsia-500/20',
          glow2: 'bg-purple-500/20',
          ringColor: 'border-fuchsia-400/80 ring-fuchsia-400/30'
        };
      case 'candy-pop':
        return {
          bg: 'from-pink-950 via-sky-950 to-indigo-950 border-pink-400/80 shadow-[0_12px_35px_rgba(244,114,182,0.28)]',
          chip: 'from-pink-200 via-sky-300 to-indigo-400 border-pink-200 text-pink-950',
          accentText: 'text-pink-300',
          levelBar: 'from-pink-400 via-sky-300 to-emerald-300',
          glow1: 'bg-pink-500/20',
          glow2: 'bg-sky-500/20',
          ringColor: 'border-pink-400/80 ring-pink-400/30'
        };
      case 'retro-arcade':
        return {
          bg: 'from-purple-950 via-zinc-950 to-emerald-950 border-green-400/80 shadow-[0_12px_35px_rgba(74,222,128,0.28)]',
          chip: 'from-green-300 via-emerald-400 to-purple-600 border-green-200 text-green-950',
          accentText: 'text-green-300',
          levelBar: 'from-purple-500 via-pink-500 to-green-400',
          glow1: 'bg-green-500/20',
          glow2: 'bg-purple-500/20',
          ringColor: 'border-green-400/80 ring-green-400/30'
        };
      case 'aurora-nordic':
        return {
          bg: 'from-teal-950 via-slate-950 to-cyan-950 border-teal-300/80 shadow-[0_12px_35px_rgba(45,212,191,0.28)]',
          chip: 'from-teal-200 via-cyan-300 to-sky-500 border-teal-100 text-teal-950',
          accentText: 'text-teal-300',
          levelBar: 'from-teal-300 via-cyan-400 to-blue-400',
          glow1: 'bg-teal-500/20',
          glow2: 'bg-cyan-500/20',
          ringColor: 'border-teal-300/80 ring-teal-300/30'
        };
      case 'lava-core':
        return {
          bg: 'from-stone-950 via-orange-950 to-red-950 border-orange-500/90 shadow-[0_12px_35px_rgba(249,115,22,0.28)]',
          chip: 'from-orange-300 via-amber-400 to-red-600 border-orange-200 text-orange-950',
          accentText: 'text-orange-400',
          levelBar: 'from-amber-400 via-orange-500 to-red-600',
          glow1: 'bg-orange-500/20',
          glow2: 'bg-red-500/20',
          ringColor: 'border-orange-500/80 ring-orange-500/30'
        };
      case 'neon-purple':
      default:
        return {
          bg: 'from-purple-950 via-indigo-950 to-zinc-950 border-purple-400/80 shadow-[0_12px_35px_rgba(168,85,247,0.28)]',
          chip: 'from-yellow-300 via-amber-400 to-yellow-600 border-yellow-200 text-purple-950',
          accentText: 'text-purple-300',
          levelBar: 'from-yellow-300 via-pink-400 to-cyan-300',
          glow1: 'bg-purple-500/20',
          glow2: 'bg-pink-500/20',
          ringColor: 'border-purple-400/80 ring-purple-400/30'
        };
    }
  };

  // Download Card as High Quality PNG Image
  const handleDownloadCard = async (targetNickname?: string, targetTag?: string) => {
    setIsDownloadingCard(true);
    try {
      if (triggerAudio) triggerAudio('tap');
      const targetPassport = viewingSharedPassport || passport;
      const cleanNick = (targetNickname || targetPassport.nickname || 'PKXD').replace(/[^a-zA-Z0-9_]/g, '_');
      const cleanTag = (targetTag || targetPassport.playerTag || '000').replace(/[^a-zA-Z0-9_]/g, '_');
      const filename = `PKXD_ID_${cleanNick}_${cleanTag}.png`;

      const result = await exportPKXDCardImage(cardRef.current, targetPassport);
      const imageUrl = result.objectUrl || result.dataUrl;

      if (result.success && imageUrl) {
        setPreviewModalData({
          isOpen: true,
          imageUrl,
          blob: result.blob,
          filename
        });
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });
        if (triggerAudio) triggerAudio('levelUp');
        if (onAddXP) onAddXP(15, 'Baixou e salvou o cartão oficial PKXD ID');
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      } else {
        throw new Error(result.error || 'Falha ao processar imagem');
      }
    } catch (err) {
      console.warn('Erro ao processar imagem do cartão PKXD ID:', err);
      try {
        const targetPassport = viewingSharedPassport || passport;
        const { renderNativeCanvasCard } = await import('../utils/pkxdCardExporter');
        const nativeCanvas = await renderNativeCanvasCard(targetPassport);
        nativeCanvas.toBlob((blob) => {
          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            const cleanNick = (targetNickname || targetPassport.nickname || 'PKXD').replace(/[^a-zA-Z0-9_]/g, '_');
            const cleanTag = (targetTag || targetPassport.playerTag || '000').replace(/[^a-zA-Z0-9_]/g, '_');
            const filename = `PKXD_ID_${cleanNick}_${cleanTag}.png`;
            setPreviewModalData({
              isOpen: true,
              imageUrl: objectUrl,
              blob,
              filename
            });
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 4000);
          } else {
            showBanner('Não foi possível gerar a imagem no momento. Tente novamente!', 'error');
          }
        }, 'image/png');
      } catch (fallbackErr) {
        console.error('Fallback canvas generation also failed:', fallbackErr);
        showBanner('Não foi possível gerar a imagem no momento. Tente novamente!', 'error');
      }
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const filteredBadges = passport.badges.filter(b => {
    if (badgeFilter === 'unlocked') return b.unlocked;
    if (badgeFilter === 'locked') return !b.unlocked;
    return true;
  });

  const filteredFriends = passport.friends.filter(f =>
    f.nickname.toLowerCase().includes(friendSearch.toLowerCase()) ||
    f.playerTag.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const unlockedBadgesCount = passport.badges.filter(b => b.unlocked).length;

  return (
    <div className="space-y-6 text-left animate-fade-in" id="passport-root-container">
      {/* Header Clean PKXD Central 2.0 */}
      <div className="pkxd-glass rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-[#F3F0FF] border border-purple-200 px-3 py-1 rounded-full text-[#6D28D9] font-sans text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Passaporte Digital Oficial
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight">
              PKXD <span className="text-[#6D28D9]">ID</span>
            </h2>
            <p className="font-sans text-sm text-slate-600 max-w-xl leading-relaxed">
              Personalize seu cartão de cidadão da Ilha, baixe em imagem HD e compartilhe seu link curto ou QR Code com amigos!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                handleOpenEditModal('identity');
              }}
              className="pkxd-btn-outline px-4 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-[#6D28D9]" />
              <span>Editar Cartão</span>
            </button>

            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setIsShareModalOpen(true);
              }}
              className="pkxd-btn-primary px-4 py-2.5 text-xs flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code & Link Curto</span>
            </button>
          </div>
        </div>

        {/* Guia rápido amigável no primeiro acesso */}
        {showOnboardingHint && (
          <div className="mt-5 pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-extrabold text-[#0284C7] bg-[#EFF8FF] border border-sky-200 px-2.5 py-1 rounded-xl">
                <Info className="w-3.5 h-3.5" /> Como usar em 3 passos:
              </span>
              <span><strong className="text-slate-900">1.</strong> Edite seu nick e tema</span>
              <span className="text-slate-300">•</span>
              <span><strong className="text-slate-900">2.</strong> Baixe em PNG HD</span>
              <span className="text-slate-300">•</span>
              <span><strong className="text-slate-900">3.</strong> Compartilhe o link curto</span>
            </div>
            <button
              onClick={() => {
                setShowOnboardingHint(false);
                try {
                  localStorage.setItem('pkxd_passport_hint_dismissed', '1');
                } catch {}
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer self-end sm:self-center"
            >
              Entendi ✓
            </button>
          </div>
        )}
      </div>

      {/* Inline Notification Banner */}
      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-2xl border-2 text-xs sm:text-sm font-sans font-bold flex items-center justify-between gap-3 ${
            feedbackBanner.type === 'success'
              ? 'bg-[#ECFDF5] border-emerald-200 text-emerald-800'
              : feedbackBanner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-[#EFF8FF] border-sky-200 text-sky-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedbackBanner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-[#0284C7] shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Horizontal Navigation Tabs */}
      <div className="pkxd-glass p-1.5 sm:p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('card');
          }}
          className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl font-sans font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'card'
              ? 'bg-[#6D28D9] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Cartão ID</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('badges');
          }}
          className={`flex-1 min-w-[115px] py-2.5 px-3 rounded-xl font-sans font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-[#6D28D9] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className={`w-4 h-4 ${activeTab === 'badges' ? 'text-amber-300' : 'text-amber-500'}`} />
          <span>Medalhas ({unlockedBadgesCount}/{passport.badges.length})</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('stamps');
          }}
          className={`flex-1 min-w-[95px] py-2.5 px-3 rounded-xl font-sans font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'stamps'
              ? 'bg-[#6D28D9] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookmarkCheck className={`w-4 h-4 ${activeTab === 'stamps' ? 'text-sky-200' : 'text-[#0284C7]'}`} />
          <span>Selos ({passport.stamps.length})</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('friends');
          }}
          className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl font-sans font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'friends'
              ? 'bg-[#6D28D9] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'friends' ? 'text-pink-200' : 'text-pink-600'}`} />
          <span>Amigos ({passport.friends.length})</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('events');
          }}
          className={`flex-1 min-w-[95px] py-2.5 px-3 rounded-xl font-sans font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'events'
              ? 'bg-[#6D28D9] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === 'events' ? 'text-emerald-200' : 'text-emerald-600'}`} />
          <span>Eventos</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CARTÃO ID */}
      {/* ========================================================= */}
      {activeTab === 'card' && (() => {
        const displayPassport = viewingSharedPassport || {
          ...passport,
          level: effectiveLevel,
          xp: effectiveXP
        };
        const isViewingOther = !!viewingSharedPassport;
        const cardLevel = viewingSharedPassport ? Number(viewingSharedPassport.level || 1) : effectiveLevel;
        const cardXP = viewingSharedPassport ? Number(viewingSharedPassport.xp || 0) : effectiveXP;
        const cardTotalXP = viewingSharedPassport
          ? ((cardLevel - 1) * 100 + cardXP)
          : totalLifetimeXP;
        const themeStyle = getThemeGradients(displayPassport.cardTheme);
        const honorBadge = (displayPassport.badges || []).find(b => b.id === displayPassport.honorBadgeId && b.unlocked);

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Shared passport banner */}
            {isViewingOther && (
              <div className="bg-[#F3F0FF] border-2 border-purple-300 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#6D28D9] shadow-sm bg-white flex-shrink-0">
                    <img
                      src={displayPassport.avatarUrl || PRESET_AVATARS[0]}
                      alt={displayPassport.nickname}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as any).src = PRESET_AVATARS[0]; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-[#FACC15] text-slate-900 font-black px-2.5 py-0.5 rounded-full">
                        PKXD ID Compartilhado
                      </span>
                      <span className="text-xs text-[#6D28D9] font-extrabold">Nível {cardLevel}</span>
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 truncate mt-0.5">
                      {displayPassport.nickname}{' '}
                      <span className="text-xs font-mono text-[#0284C7] font-bold">({displayPassport.playerTag})</span>
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-shrink-0">
                  <button
                    onClick={() => handleAddFriendFromShared(displayPassport)}
                    className="pkxd-btn-primary flex-1 sm:flex-none px-4 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Adicionar Amigo (+20 XP)</span>
                  </button>

                  <button
                    onClick={() => {
                      setViewingSharedPassport(null);
                      const url = new URL(window.location.href);
                      url.searchParams.delete('id');
                      url.searchParams.delete('passaporte');
                      url.searchParams.delete('card');
                      url.searchParams.delete('data');
                      url.searchParams.delete('tag');
                      url.searchParams.delete('p');
                      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
                    }}
                    className="pkxd-btn-outline flex-1 sm:flex-none px-3.5 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookmarkCheck className="w-4 h-4 text-[#0284C7]" />
                    <span>Ver Meu PKXD ID</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Card Preview + Quick Customization Controls */}
              <div className="lg:col-span-7 space-y-4">
                {/* CARTÃO OFICIAL (ÁREA DE CAPTURA PNG) */}
                <div
                  ref={cardRef}
                  id="pkxd-passport-card"
                  className={`bg-gradient-to-br ${themeStyle.bg} border-2 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden transition-all duration-300 select-none`}
                >
                  <div className={`absolute -top-12 -right-12 w-52 h-52 ${themeStyle.glow1} rounded-full filter blur-2xl pointer-events-none`} />
                  <div className={`absolute -bottom-12 -left-12 w-52 h-52 ${themeStyle.glow2} rounded-full filter blur-2xl pointer-events-none`} />

                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-4 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/25 flex-shrink-0">
                        <ShieldCheck className="w-5 h-5 text-yellow-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-sm sm:text-base tracking-wide uppercase text-white">
                            PKXD ID
                          </span>
                          <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[9px] font-mono font-black px-1.5 py-0.5 rounded">
                            CITIZEN
                          </span>
                        </div>
                        <p className="font-mono text-[9px] text-white/75 uppercase tracking-widest">
                          DOCUMENTO OFICIAL DA COMUNIDADE
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Security Microchip */}
                      <div className={`hidden sm:flex w-9 h-7 rounded-md bg-gradient-to-br ${themeStyle.chip} border shadow-md relative overflow-hidden items-center justify-center`}>
                        <div className="w-full h-[1px] bg-black/25" />
                        <div className="h-full w-[1px] bg-black/25 absolute" />
                        <div className="w-3.5 h-2.5 rounded-sm border border-black/30 bg-white/20" />
                      </div>

                      <div className="px-3 py-1 bg-black/50 border border-white/20 rounded-full font-mono font-extrabold text-xs text-yellow-300 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span>NÍVEL {cardLevel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Main Profile Cluster */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 relative z-10">
                    {/* Avatar with Frame */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-xl bg-black/70 p-1 transition-all ${
                        displayPassport.avatarFrame === 'neon-glow'
                          ? 'border-2 border-pink-400 ring-4 ring-pink-500/50'
                          : displayPassport.avatarFrame === 'vip-gold'
                          ? 'border-2 border-yellow-300 ring-4 ring-amber-400/60'
                          : displayPassport.avatarFrame === 'cyber-tech'
                          ? 'border-2 border-cyan-400 ring-2 ring-cyan-400/70'
                          : displayPassport.avatarFrame === 'fire-magic'
                          ? 'border-2 border-orange-400 ring-4 ring-red-500/60'
                          : displayPassport.avatarFrame === 'galaxy-star'
                          ? 'border-2 border-fuchsia-400 ring-4 ring-purple-500/60'
                          : `border-2 ${themeStyle.ringColor}`
                      }`}>
                        <img
                          src={displayPassport.avatarUrl || PRESET_AVATARS[0]}
                          alt={displayPassport.nickname}
                          className="w-full h-full object-cover rounded-xl"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            (e.target as any).src = PRESET_AVATARS[0];
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-1.5 bg-yellow-400 text-black font-black text-[9px] font-mono px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-0.5">
                        <span>LVL</span>
                        <span>{cardLevel}</span>
                      </div>
                    </div>

                    {/* Identity Info */}
                    <div className="flex-1 text-center sm:text-left space-y-2 w-full min-w-0">
                      <div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          {displayPassport.nicknamePrefix && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase bg-gradient-to-r from-yellow-400 to-amber-500 text-black tracking-wider">
                              {displayPassport.nicknamePrefix}
                            </span>
                          )}
                          <h4 className={`font-sans font-black text-xl sm:text-2xl tracking-tight uppercase truncate max-w-[240px] flex items-center gap-1.5 ${
                            displayPassport.nameColor === 'gold' ? 'text-[#F5C542]' :
                            displayPassport.nameColor === 'cyan' ? 'text-[#22D3EE]' :
                            displayPassport.nameColor === 'purple' ? 'text-[#C084FC]' :
                            displayPassport.nameColor === 'pink' ? 'text-[#E83EBC]' :
                            displayPassport.nameColor === 'fire' ? 'text-[#FB923C]' :
                            'text-white'
                          }`}>
                            <span>{displayPassport.nickname}</span>
                            {displayPassport.featuredBadgeIcon && (
                              <span className="text-base select-none" title="Símbolo de Destaque">
                                {displayPassport.featuredBadgeIcon}
                              </span>
                            )}
                          </h4>
                          <button
                            type="button"
                            onClick={handleCopyTag}
                            className="px-2 py-0.5 bg-black/45 hover:bg-black/65 border border-white/25 rounded-md font-mono text-xs font-bold text-cyan-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Clique para copiar a Tag"
                          >
                            <span>{displayPassport.playerTag}</span>
                            {copiedTag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                          <p className={`font-sans font-extrabold text-xs ${themeStyle.accentText} uppercase tracking-wide flex items-center gap-1`}>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{displayPassport.title || 'Explorador da Ilha'}</span>
                          </p>

                          {honorBadge && (
                            <span className="text-[10px] font-sans font-bold text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/35">
                              {honorBadge.icon} {honorBadge.title}
                            </span>
                          )}

                          {displayPassport.statusPhrase && (
                            <span className="text-[10px] font-mono text-cyan-200 bg-black/45 px-2 py-0.5 rounded-full border border-white/15 inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="truncate">{displayPassport.statusPhrase}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="font-sans text-xs text-white/90 leading-relaxed italic bg-black/35 p-2.5 rounded-xl border border-white/10">
                        &ldquo;{displayPassport.bio || 'Explorador dedicado da Ilha PK XD!'}&rdquo;
                      </p>

                      <div className="space-y-1 pt-0.5">
                        <div className="flex justify-between items-center text-[10px] font-mono text-white/90">
                          <span className="flex items-center gap-1 font-bold text-yellow-300">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>Progresso XP</span>
                          </span>
                          <span className="font-bold font-mono tabular-nums">
                            <span className="text-yellow-300">{cardXP % 100}</span>
                            <span className="text-white/60">/100 XP</span>
                            <span className="text-cyan-300 ml-1.5 font-normal">({cardTotalXP} Total)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/20">
                          <div
                            className={`h-full bg-gradient-to-r ${themeStyle.levelBar} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(100, Math.max(0, cardXP % 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Feature Specification Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3.5 border-t border-white/15 text-xs font-sans relative z-10">
                    <div className="bg-black/40 p-2 rounded-xl border border-white/10 space-y-0.5 text-center sm:text-left">
                      <span className="text-[9px] uppercase font-mono font-bold text-white/65 block">🎮 Jogo Favorito</span>
                      <strong className="text-white text-[11px] truncate flex items-center justify-center sm:justify-start gap-1">
                        <span>{getMinigameIcon(displayPassport.favoriteMinigame)}</span>
                        <span className="truncate">{displayPassport.favoriteMinigame}</span>
                      </strong>
                    </div>

                    <div className="bg-black/40 p-2 rounded-xl border border-white/10 space-y-0.5 text-center sm:text-left">
                      <span className="text-[9px] uppercase font-mono font-bold text-white/65 block">🐾 Pet Favorito</span>
                      <strong className="text-white text-[11px] truncate block">
                        {displayPassport.favoritePet || 'Unicórnio Mágico'}
                      </strong>
                    </div>

                    <div className="bg-black/40 p-2 rounded-xl border border-white/10 space-y-0.5 text-center sm:text-left">
                      <span className="text-[9px] uppercase font-mono font-bold text-white/65 block">🚀 Veículo</span>
                      <strong className="text-cyan-300 text-[11px] font-mono font-bold truncate block">
                        {displayPassport.favoriteVehicle || 'Hoverboard Neon'}
                      </strong>
                    </div>

                    <div className="bg-black/40 p-2 rounded-xl border border-white/10 space-y-0.5 text-center sm:text-left">
                      <span className="text-[9px] uppercase font-mono font-bold text-white/65 block">🏠 Casa</span>
                      <strong className="text-yellow-300 text-[11px] font-mono font-bold truncate block">
                        {displayPassport.houseTheme || 'Mansão Gamer'}
                      </strong>
                    </div>
                  </div>

                  {/* Barcode & Watermark Footer */}
                  <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between font-mono text-[8px] sm:text-[9px] text-white/60 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-[2px] h-4 bg-white/85 p-0.5 rounded-[2px]">
                        <div className="w-[2px] h-full bg-black" />
                        <div className="w-[1px] h-full bg-black" />
                        <div className="w-[3px] h-full bg-black" />
                        <div className="w-[1px] h-full bg-black" />
                        <div className="w-[2px] h-full bg-black" />
                        <div className="w-[1px] h-full bg-black" />
                        <div className="w-[2px] h-full bg-black" />
                        <div className="w-[3px] h-full bg-black" />
                      </div>
                      <span className="tracking-widest">ID #{displayPassport.playerTag.replace('#', '')}</span>
                    </div>

                    <span className="uppercase tracking-widest text-right">
                      VERIFICADO • PKXD CENTRAL
                    </span>
                  </div>
                </div>

                {/* Toolbar embaixo do Cartão (Glass UI) */}
                <div className="pkxd-glass rounded-3xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => handleDownloadCard(displayPassport.nickname, displayPassport.playerTag)}
                      disabled={isDownloadingCard}
                      className="pkxd-btn-primary flex-1 py-3 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isDownloadingCard ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Gerando Imagem HD...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Baixar Cartão PKXD ID (PNG HD)</span>
                        </>
                      )}
                    </button>

                    {!isViewingOther && (
                      <button
                        onClick={() => {
                          if (triggerAudio) triggerAudio('tap');
                          handleOpenEditModal('identity');
                        }}
                        className="pkxd-btn-outline py-3 px-5 text-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-[#6D28D9]" />
                        <span>Mais Opções de Editar</span>
                      </button>
                    )}
                  </div>

                  {downloadSuccess && (
                    <div className="p-3 bg-[#ECFDF5] border-2 border-emerald-200 rounded-2xl text-emerald-800 text-xs font-sans font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Imagem gerada! Use os botões da janela para salvar na galeria ou copiar.</span>
                    </div>
                  )}

                  {/* Instant Card Theme Picker */}
                  {!isViewingOther && (
                    <div className="space-y-2.5 pt-3 border-t-2 border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-sans font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-[#6D28D9]" />
                          <span>Tema do Cartão (12 estilos no editor):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal('style')}
                          className="text-xs font-extrabold text-[#6D28D9] hover:underline cursor-pointer"
                        >
                          Ver todos →
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { id: 'neon-purple', label: 'Cosmic', bg: 'from-purple-600 to-indigo-800' },
                          { id: 'cyber-blue', label: 'Cyber', bg: 'from-cyan-500 to-blue-700' },
                          { id: 'golden-vip', label: 'VIP Gold', bg: 'from-yellow-400 to-amber-700' },
                          { id: 'sunset-pink', label: 'Sunset', bg: 'from-pink-500 to-rose-700' },
                          { id: 'emerald-gamer', label: 'Matrix', bg: 'from-emerald-400 to-teal-700' },
                          { id: 'frost-diamond', label: 'Frost', bg: 'from-sky-400 to-blue-700' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              const updated: PKXDPassport = { ...passport, cardTheme: t.id as any, updatedAt: Date.now() };
                              savePassport(updated);
                              if (triggerAudio) triggerAudio('tap');
                            }}
                            className={`p-2 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              passport.cardTheme === t.id
                                ? 'border-[#6D28D9] bg-[#F3F0FF] shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                            }`}
                          >
                            <div className={`w-full h-4 rounded-md bg-gradient-to-r ${t.bg}`} />
                            <span className="text-[10px] font-sans font-extrabold text-slate-800 truncate max-w-full">
                              {t.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Side Info: QR Code + Short Link + Badges Highlight */}
              <div className="lg:col-span-5 space-y-5">
                <div className="pkxd-glass rounded-3xl p-5 sm:p-6 text-center space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-[#6D28D9] font-extrabold text-xs uppercase tracking-wider">
                      <QrCode className="w-4 h-4" />
                      <span>QR Code & Link Curto</span>
                    </div>
                    <span className="text-[11px] font-sans font-semibold text-slate-500">Escaneie para abrir</span>
                  </div>

                  {qrCodeDataUrl ? (
                    <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-sm border-2 border-slate-200 flex items-center justify-center">
                      <img src={qrCodeDataUrl} alt="Passport QR Code" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-44 h-44 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-500 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6D28D9]" />
                      <span>Gerando QR...</span>
                    </div>
                  )}

                  {/* Short link preview */}
                  <div className="bg-[#F8FAFC] border-2 border-slate-200 rounded-xl px-3 py-2 text-left">
                    <span className="text-[10px] font-sans font-extrabold uppercase text-slate-500 block">
                      Link Curto:
                    </span>
                    <span className="font-mono text-xs text-[#0284C7] font-bold truncate block">
                      {getPassportShareUrl(displayPassport)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="pkxd-btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Curto'}</span>
                    </button>

                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="pkxd-btn-outline py-2.5 px-4 text-xs flex items-center justify-center gap-1 cursor-pointer"
                      title="Mais opções de compartilhamento"
                    >
                      <Share2 className="w-4 h-4 text-[#6D28D9]" />
                    </button>
                  </div>
                </div>

                {/* Quick Badges Highlights */}
                <div className="pkxd-glass rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>Destaques de Medalhas</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab('badges')}
                      className="text-xs font-extrabold text-[#6D28D9] hover:underline cursor-pointer"
                    >
                      Ver Todas →
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {displayPassport.badges.slice(0, 4).map((badge) => (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => setSelectedBadge(badge)}
                        className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-105 ${
                          badge.unlocked
                            ? 'bg-[#F3F0FF] border-purple-200'
                            : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
                        }`}
                      >
                        <span className="text-2xl mb-1">{badge.icon}</span>
                        <span className="text-[10px] font-bold text-slate-800 truncate max-w-full">{badge.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* TAB 2: MEDALHAS & CONQUISTAS */}
      {/* ========================================================= */}
      {activeTab === 'badges' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pkxd-glass p-5 rounded-3xl">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Mural de Medalhas & Conquistas</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Ganhe XP, participe de enquetes e adicione amigos para desbloquear todas as medalhas!
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setBadgeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  badgeFilter === 'all' ? 'bg-[#6D28D9] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({passport.badges.length})
              </button>
              <button
                onClick={() => setBadgeFilter('unlocked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  badgeFilter === 'unlocked' ? 'bg-[#6D28D9] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Livres ({unlockedBadgesCount})
              </button>
              <button
                onClick={() => setBadgeFilter('locked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  badgeFilter === 'locked' ? 'bg-[#6D28D9] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Faltam ({passport.badges.length - unlockedBadgesCount})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-5 rounded-3xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                  badge.unlocked
                    ? 'pkxd-glass border-purple-200/80 hover:border-[#6D28D9]'
                    : 'pkxd-glass-soft opacity-75 hover:opacity-100'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border-2 ${
                  badge.unlocked
                    ? 'bg-[#F3F0FF] border-purple-200'
                    : 'bg-slate-200 border-slate-300 grayscale'
                }`}>
                  {badge.icon}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                      {badge.title}
                    </h4>
                    <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full uppercase font-extrabold flex-shrink-0 border ${
                      badge.rarity === 'Lendário'
                        ? 'bg-[#FFFBEB] text-amber-800 border-amber-300'
                        : badge.rarity === 'Épico'
                        ? 'bg-[#F3F0FF] text-[#6D28D9] border-purple-200'
                        : badge.rarity === 'Raro'
                        ? 'bg-[#EFF8FF] text-[#0284C7] border-sky-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {badge.rarity || 'Comum'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {badge.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs font-sans">
                    {badge.unlocked ? (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Desbloqueada
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold">
                        🔒 Bloqueada
                      </span>
                    )}
                    <span className="text-[#6D28D9] font-extrabold hover:underline">Detalhes →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SELOS & CARIMBOS */}
      {/* ========================================================= */}
      {activeTab === 'stamps' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pkxd-glass p-5 rounded-3xl">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-[#0284C7]" />
                <span>Caderno de Selos & Carimbos</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Resgate selos comemorativos gratuitos ou insira códigos secretos das lives e spoilers!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <div className="px-3.5 py-2 bg-[#EFF8FF] border border-sky-200 rounded-xl font-mono text-xs font-extrabold text-[#0284C7] tabular-nums">
                Meus Selos: {passport.stamps.length}
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    if (triggerAudio) triggerAudio('tap');
                    setIsAddStampModalOpen(true);
                  }}
                  className="pkxd-btn-cyan px-4 py-2 text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Selo Oficial (ADM)</span>
                </button>
              )}
            </div>
          </div>

          {codeRedeemMsg && (
            <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold border-2 flex items-center gap-2 ${
              codeRedeemMsg.type === 'success'
                ? 'bg-[#ECFDF5] border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {codeRedeemMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{codeRedeemMsg.text}</span>
            </div>
          )}

          {/* Secret Code Redeem Box */}
          <div className="bg-[#FFFBEB] p-5 sm:p-6 rounded-3xl border-2 border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-800">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <h4 className="font-display font-bold text-base text-slate-900">
                Resgatar Selo com Código Secreto
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Dicas para testar agora:{' '}
              <code className="text-[#6D28D9] bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono font-bold">CENTRALVIP</code>,{' '}
              <code className="text-[#0284C7] bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono font-bold">SPOILERMASTER</code>,{' '}
              <code className="text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono font-bold">1000GEMAS</code> ou{' '}
              <code className="text-amber-800 bg-white px-1.5 py-0.5 rounded border border-amber-200 font-mono font-bold">WELCOME</code>.
            </p>

            <form onSubmit={handleRedeemSecretStampCode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <input
                type="text"
                placeholder="Digite o código secreto do selo (Ex: CENTRALVIP)"
                value={secretStampCode}
                onChange={(e) => setSecretStampCode(e.target.value.toUpperCase())}
                className="flex-1 bg-white border-2 border-amber-300 rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#6D28D9] uppercase font-bold"
              />
              <button
                type="submit"
                className="pkxd-btn-gold px-6 py-3 text-xs flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Resgatar Selo</span>
              </button>
            </form>
          </div>

          {/* Available Stamps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#6D28D9]" />
                <span>Selos Disponíveis ({availableStamps.filter(s => s.isAvailable !== false).length})</span>
              </h4>
              <span className="text-xs text-slate-500 font-semibold">Clique para carimbar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableStamps.filter(s => s.isAvailable !== false).map((stamp) => {
                const isClaimed = passport.stamps.some(s => s.id === stamp.id || s.title.toLowerCase() === stamp.title.toLowerCase());

                return (
                  <div
                    key={stamp.id}
                    className={`pkxd-glass rounded-3xl p-5 transition-all flex flex-col justify-between relative ${
                      isClaimed ? 'border-emerald-300 bg-[#ECFDF5]/60' : 'hover:border-[#6D28D9]'
                    }`}
                  >
                    <div className={`self-end mb-2 border border-dashed rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                      isClaimed ? 'border-emerald-300 text-emerald-700 bg-[#ECFDF5]' : 'border-slate-300 text-slate-500 bg-slate-50'
                    }`}>
                      {isClaimed ? '✓ Resgatado' : 'Disponível'}
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border-2 border-slate-200"
                        style={{ backgroundColor: stamp.color ? `${stamp.color}18` : '#F3F0FF' }}
                      >
                        {stamp.icon}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <h5 className="font-display font-bold text-sm text-slate-900 leading-snug">
                          {stamp.title}
                        </h5>
                        <p className="text-xs text-[#6D28D9] font-extrabold">
                          {stamp.eventOrSeason}
                        </p>
                        <p className="text-xs text-slate-500">
                          📍 {stamp.location || 'Central PK XD'}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed py-3 mt-3 border-t border-slate-100">
                      {stamp.description || 'Selo oficial comemorativo da Ilha PK XD.'}
                    </p>

                    {isClaimed ? (
                      <div className="w-full py-2.5 bg-[#ECFDF5] border border-emerald-200 rounded-xl text-xs font-extrabold uppercase text-emerald-700 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Carimbado no PKXD ID</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimStamp(stamp)}
                        className="pkxd-btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Resgatar Selo (+{stamp.xpReward || 50} XP)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Claimed Stamps */}
          <div className="space-y-3 pt-4 border-t-2 border-slate-200">
            <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-[#0284C7]" />
              <span>Meus Selos Carimbados ({passport.stamps.length})</span>
            </h4>

            {passport.stamps.length === 0 ? (
              <div className="text-center py-10 pkxd-glass-soft rounded-3xl border-2 border-dashed border-slate-300/80 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF8FF] border border-sky-200 text-[#0284C7] flex items-center justify-center mx-auto">
                  <BookmarkCheck className="w-6 h-6" />
                </div>
                <h5 className="font-display font-bold text-base text-slate-900">Você ainda não resgatou nenhum selo!</h5>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Clique em &ldquo;Resgatar Selo&rdquo; nos cards acima ou insira um código secreto para carimbar seu PKXD ID!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {passport.stamps.map((stamp) => (
                  <div
                    key={stamp.id}
                    className="pkxd-glass hover:border-[#0284C7] rounded-3xl p-5 transition-all relative"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border-2 border-slate-200"
                        style={{ backgroundColor: stamp.color ? `${stamp.color}18` : '#EFF8FF' }}
                      >
                        {stamp.icon}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <span className="inline-block border border-dashed border-sky-300 bg-[#EFF8FF] rounded-full px-2 py-0.5 text-[9px] font-mono font-bold text-[#0284C7] uppercase">
                          Carimbo Oficial
                        </span>
                        <h4 className="font-display font-bold text-base text-slate-900">
                          {stamp.title}
                        </h4>
                        <p className="text-xs text-[#6D28D9] font-extrabold">
                          {stamp.eventOrSeason}
                        </p>
                        <p className="text-xs text-slate-500">
                          📍 {stamp.location || 'Central PK XD'} • 📅 {stamp.date}
                        </p>
                        {stamp.acquiredAt && (
                          <p className="text-[11px] text-emerald-700 font-bold">
                            ✓ Resgatado em {new Date(stamp.acquiredAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                        {confirmDeleteStampId === stamp.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteStamp(stamp.id)}
                              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteStampId(null)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteStampId(stamp.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                            title="Excluir Selo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AMIGOS */}
      {/* ========================================================= */}
      {activeTab === 'friends' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pkxd-glass p-5 rounded-3xl">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-600" />
                <span>Amigos Conectados no PKXD ID</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Adicione as Tags de PK XD dos seus amigos para acompanhar seus minigames favoritos!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar amigo..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#6D28D9] w-40 sm:w-48"
                />
              </div>

              <button
                onClick={() => {
                  if (triggerAudio) triggerAudio('tap');
                  setFriendError('');
                  setIsAddFriendModalOpen(true);
                }}
                className="pkxd-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Amigo</span>
              </button>
            </div>
          </div>

          {filteredFriends.length === 0 ? (
            <div className="text-center py-12 pkxd-glass-soft rounded-3xl border-2 border-dashed border-slate-300/80 space-y-3">
              <Users className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-display font-bold text-slate-900 text-base">
                {passport.friends.length === 0 ? 'Nenhum amigo adicionado ainda' : 'Nenhum amigo encontrado na busca'}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Clique em &ldquo;Adicionar Amigo&rdquo; ou abra o link curto de um amigo para conectá-lo ao seu passaporte!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="pkxd-glass hover:border-[#6D28D9] rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 flex-shrink-0">
                      <img
                        src={friend.avatarUrl || PRESET_AVATARS[0]}
                        alt={friend.nickname}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-display font-bold text-sm text-slate-900 truncate">
                        {friend.nickname}
                      </h4>
                      <p className="font-mono text-xs text-[#0284C7] font-bold">
                        {friend.playerTag}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <span>{getMinigameIcon(friend.favoriteMinigame || 'Crazy Run')}</span>
                        <span className="truncate">{friend.favoriteMinigame || 'Crazy Run'} • Nível {friend.level || 5}</span>
                      </p>
                    </div>
                  </div>

                  {confirmRemoveFriendId === friend.id ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Remover
                      </button>
                      <button
                        onClick={() => setConfirmRemoveFriendId(null)}
                        className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveFriendId(friend.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                      title="Remover Amigo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: HISTÓRICO DE EVENTOS */}
      {/* ========================================================= */}
      {activeTab === 'events' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pkxd-glass p-5 rounded-3xl">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Histórico de Participação em Eventos</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Acompanhe os eventos que você organizou ou confirmou presença na comunidade!
              </p>
            </div>

            {passport.eventHistory && passport.eventHistory.length > 0 && (
              <div className="self-start sm:self-auto">
                {confirmClearHistory ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearEventHistory}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Confirmar Limpeza
                    </button>
                    <button
                      onClick={() => setConfirmClearHistory(false)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearHistory(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Histórico</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {(!passport.eventHistory || passport.eventHistory.length === 0) ? (
            <div className="text-center py-12 pkxd-glass-soft rounded-3xl border-2 border-dashed border-slate-300/80 space-y-3">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-display font-bold text-slate-900 text-base">
                Nenhum evento no seu histórico ainda
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Quando você confirmar presença em torneios, festas ou desafios na aba Eventos, eles aparecerão registrados aqui!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {passport.eventHistory.map((hist) => (
                <div
                  key={hist.id}
                  className="pkxd-glass hover:border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-900">
                        {hist.eventName}
                      </h4>
                      <p className="text-xs text-slate-600">
                        Função: <span className="text-emerald-700 font-extrabold uppercase">{hist.role}</span> • Categoria: {hist.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="font-mono text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                      📅 {hist.date}
                    </span>
                    {confirmDeleteHistoryId === hist.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteEventHistory(hist.id)}
                          className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => setConfirmDeleteHistoryId(null)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteHistoryId(hist.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir do Histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {events.length > 0 && (
            <div className="p-4 bg-[#F3F0FF] border-2 border-purple-200 rounded-2xl flex items-center justify-between">
              <div className="text-xs sm:text-sm text-slate-800 font-semibold">
                <span>Há <strong className="text-[#6D28D9]">{events.length} eventos comunitários</strong> abertos na aba de Eventos!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR PERFIL DO PASSAPORTE (EXPANDIDO EM 3 ABAS) */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div
          onClick={() => setIsEditModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pkxd-glass-modal rounded-3xl p-5 sm:p-7 w-full max-w-xl relative space-y-5 my-8 text-left max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-full cursor-pointer transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pr-8">
              <div className="w-10 h-10 rounded-2xl bg-[#F3F0FF] border border-purple-200 flex items-center justify-center text-[#6D28D9]">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-slate-900">
                  Personalizar PKXD ID
                </h3>
                <p className="text-xs text-slate-500">
                  Mais opções para deixar seu passaporte com a sua cara!
                </p>
              </div>
            </div>

            {/* 3 Clean Modal Sub-Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setEditModalTab('identity')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                  editModalTab === 'identity' ? 'bg-white text-[#6D28D9] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Identidade
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('universe')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                  editModalTab === 'universe' ? 'bg-white text-[#6D28D9] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Universo PK XD
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('style')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                  editModalTab === 'style' ? 'bg-white text-[#6D28D9] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Visual & Foto
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editModalTab === 'identity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">
                        Nome no PK XD (Nick) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        placeholder="Ex: LUNA ou GABRIEL"
                        value={editNick}
                        onChange={(e) => setEditNick(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold uppercase focus:outline-none focus:border-[#6D28D9]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">
                        Número / Tag # *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 font-mono font-black text-xs text-[#6D28D9]">#</span>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="Ex: 245 ou 000"
                          value={editTagNumber}
                          onChange={(e) => setEditTagNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-[#6D28D9]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live tag preview */}
                  <div className="p-3 bg-[#F3F0FF] border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-bold">Sua Tag no PK XD:</span>
                    <span className="font-mono font-black text-[#6D28D9] bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                      {editNick.trim() || 'SEUNICK'}#{editTagNumber.trim() || '000'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Título de Cidadão</label>
                      <select
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-[#6D28D9]"
                      >
                        <option value="Explorador da Ilha">🌟 Explorador da Ilha</option>
                        <option value="Caçador de Spoilers">🔮 Caçador de Spoilers</option>
                        <option value="Mestre dos Mini-Games">🏆 Mestre dos Mini-Games</option>
                        <option value="Lenda do PK XD">👑 Lenda do PK XD</option>
                        <option value="Creator Estrela">⭐ Creator Estrela</option>
                        <option value="Arquiteto de Casas">🏠 Arquiteto de Casas</option>
                        <option value="Piloto do Crazy Run">⚡ Piloto do Crazy Run</option>
                        <option value="Colecionador de Pets">🐾 Colecionador de Pets</option>
                        {isAdmin && <option value="Lorde da Moderação">🛡️ Lorde da Moderação</option>}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Prefixo do Nick</label>
                      <select
                        value={editPrefix}
                        onChange={(e) => setEditPrefix(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-[#6D28D9]"
                      >
                        <option value="">Nenhum</option>
                        <option value="[PRO]">⭐ [PRO]</option>
                        <option value="[VIP]">👑 [VIP]</option>
                        <option value="[CREATOR]">🎬 [CREATOR]</option>
                        <option value="[FÃ]">❤️ [FÃ]</option>
                        <option value="[PKXD]">🎮 [PKXD]</option>
                        <option value="[MOD]">🛡️ [MOD]</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Frase de Status / Atividade</label>
                    <input
                      type="text"
                      maxLength={35}
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      placeholder="Ex: 🎮 Jogando Crazy Run"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-[#6D28D9]"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        '🎮 Jogando Crazy Run',
                        '🍕 Entregador de Pizza',
                        '💎 Caçando Gemas',
                        '🎉 Em Festa com Amigos',
                        '🔮 Aguardando Spoilers',
                        '🏠 Decorando Minha Casa'
                      ].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setEditStatus(st)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#F3F0FF] border border-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Bio do Perfil</label>
                    <textarea
                      rows={2}
                      maxLength={140}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Conte um pouco sobre suas aventuras no PK XD..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#6D28D9]"
                    />
                  </div>
                </div>
              )}

              {editModalTab === 'universe' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Minigame Favorito</label>
                      <select
                        value={editMinigame}
                        onChange={(e) => setEditMinigame(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-[#6D28D9]"
                      >
                        {PKXD_MINIGAMES.map((game) => (
                          <option key={game.name} value={game.name}>
                            {game.icon} {game.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">Medalha em Destaque no Cartão</label>
                      <select
                        value={editHonorBadgeId}
                        onChange={(e) => setEditHonorBadgeId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-[#6D28D9]"
                      >
                        <option value="">Nenhuma medalha exibida</option>
                        {passport.badges.filter(b => b.unlocked).map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.icon} {b.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">🐾 Pet / Companheiro</label>
                      <input
                        type="text"
                        maxLength={24}
                        value={editPet}
                        onChange={(e) => setEditPet(e.target.value)}
                        placeholder="Ex: Unicórnio Mágico"
                        className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-[#6D28D9]"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['🦄 Unicórnio', '🐉 Dragão', '🤖 Robô Bob', '🐱 Gatinho', '🐶 Poodle', '🦖 Dino'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setEditPet(p)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#F3F0FF] border border-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">🚀 Veículo Favorito</label>
                      <input
                        type="text"
                        maxLength={24}
                        value={editVehicle}
                        onChange={(e) => setEditVehicle(e.target.value)}
                        placeholder="Ex: Hoverboard Neon"
                        className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-[#6D28D9]"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['🛹 Hoverboard', '🏎️ Carro Gamer', '🐉 Dragão Alado', '🛵 Moto Neon', '🛸 Nave UFO', '🧹 Vassoura'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setEditVehicle(v)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#EFF8FF] border border-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">💼 Papel / Profissão na Ilha</label>
                      <input
                        type="text"
                        maxLength={24}
                        value={editJob}
                        onChange={(e) => setEditJob(e.target.value)}
                        placeholder="Ex: Entregador de Pizza"
                        className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-[#6D28D9]"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['🍕 Entregador', '🎧 DJ da Ilha', '🦺 Guia Turístico', '⚡ Atleta Crazy', '🔍 Detetive', '🍹 Mestre Suco'].map((j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => setEditJob(j)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#FFFBEB] border border-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            {j}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-700">🏠 Estilo da Casa / Mansão</label>
                      <input
                        type="text"
                        maxLength={24}
                        value={editHouse}
                        onChange={(e) => setEditHouse(e.target.value)}
                        placeholder="Ex: Mansão Gamer"
                        className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-[#6D28D9]"
                      />
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['🏠 Mansão Gamer', '🏰 Castelo Real', '🚀 Nave Espacial', '⛵ Iate de Luxo', '🍄 Casa Cogumelo', '🌴 Casa da Árvore'].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setEditHouse(h)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#F3F0FF] border border-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Public visibility setting */}
                  <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {editIsPublic ? (
                        <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">Perfil Compartilhável via Link</span>
                        <span className="text-[11px] text-slate-500">Permite que amigos abram seu cartão pelo link curto ou QR Code</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditIsPublic(!editIsPublic)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 cursor-pointer transition-colors ${
                        editIsPublic
                          ? 'bg-[#ECFDF5] border-emerald-300 text-emerald-800'
                          : 'bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    >
                      {editIsPublic ? 'Ativado' : 'Privado'}
                    </button>
                  </div>
                </div>
              )}

              {editModalTab === 'style' && (
                <div className="space-y-4">
                  {/* Avatar Options */}
                  <div className="space-y-2.5 border-2 border-slate-200 bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-800">Foto do Avatar & Perfil</label>
                      {currentUser?.photoURL && (
                        <button
                          type="button"
                          onClick={() => setEditAvatar(currentUser.photoURL!)}
                          className="text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                        >
                          Usar Foto da Minha Conta
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#6D28D9] bg-white flex-shrink-0">
                        <img
                          src={editAvatar}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as any).src = PRESET_AVATARS[0];
                          }}
                        />
                      </div>
                      <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-purple-300 bg-[#F3F0FF] hover:bg-purple-100 py-2.5 px-3 rounded-xl text-xs font-extrabold text-[#6D28D9] cursor-pointer transition-colors">
                        {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span>{isUploadingPhoto ? 'Processando...' : 'Enviar Foto da Galeria'}</span>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-600 uppercase">Ou escolha um avatar gamer:</span>
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {PRESET_AVATARS.map((avatarUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditAvatar(avatarUrl)}
                            className={`w-11 h-11 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                              editAvatar === avatarUrl ? 'border-[#6D28D9] ring-2 ring-purple-300 scale-105' : 'border-slate-200 opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img src={avatarUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Name Color & Symbol */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 block">🎨 Cor do Seu Nome</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'white', label: 'Branco', dot: 'bg-slate-200 border border-slate-400' },
                          { id: 'gold', label: 'Dourado', dot: 'bg-amber-400' },
                          { id: 'cyan', label: 'Ciano', dot: 'bg-cyan-400' },
                          { id: 'purple', label: 'Roxo', dot: 'bg-purple-500' },
                          { id: 'pink', label: 'Rosa', dot: 'bg-pink-500' },
                          { id: 'fire', label: 'Fogo', dot: 'bg-orange-500' }
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setEditNameColor(c.id as any)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer border-2 ${
                              editNameColor === c.id
                                ? 'bg-[#F3F0FF] border-[#6D28D9] text-[#6D28D9]'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                            <span>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 block">✨ Símbolo ao lado do Nick</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['⚡', '👑', '💎', '🌟', '🔥', '🦄', '🚀', '🎮', '🍕', '🏆', '🐉', '🎧', '🌈', '✨'].map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setEditFeaturedIcon(icon)}
                            className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer border-2 ${
                              editFeaturedIcon === icon
                                ? 'bg-[#6D28D9] border-[#6D28D9] text-white scale-105'
                                : 'bg-white hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Avatar Frame Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-800 block">🖼️ Moldura do Avatar</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { id: 'classic', label: 'Clássica', border: 'border-slate-400' },
                        { id: 'neon-glow', label: 'Pink Glow', border: 'border-pink-500' },
                        { id: 'vip-gold', label: 'VIP Gold', border: 'border-amber-400' },
                        { id: 'cyber-tech', label: 'Cyber Tech', border: 'border-cyan-500' },
                        { id: 'fire-magic', label: 'Fogo', border: 'border-orange-500' },
                        { id: 'galaxy-star', label: 'Galáxia', border: 'border-fuchsia-500' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setEditAvatarFrame(f.id as any)}
                          className={`p-2 rounded-xl border-2 text-[10px] font-extrabold text-center transition-all cursor-pointer ${
                            editAvatarFrame === f.id
                              ? 'border-[#6D28D9] bg-[#F3F0FF] text-[#6D28D9]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 mx-auto rounded-lg border-2 ${f.border} mb-1`} />
                          <span className="truncate block">{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Theme Selection (12 Themes) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                      <span>🎨 Tema do Cartão (12 Estilos)</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'neon-purple', label: 'Cosmic', color: 'bg-purple-600' },
                        { id: 'cyber-blue', label: 'Cyber Blue', color: 'bg-cyan-600' },
                        { id: 'golden-vip', label: 'Golden VIP', color: 'bg-yellow-500' },
                        { id: 'sunset-pink', label: 'Sunset Pink', color: 'bg-pink-600' },
                        { id: 'emerald-gamer', label: 'Emerald', color: 'bg-emerald-600' },
                        { id: 'volcano-red', label: 'Magma Red', color: 'bg-red-600' },
                        { id: 'frost-diamond', label: 'Frost Ice', color: 'bg-sky-500' },
                        { id: 'galaxy-space', label: 'Galáxia', color: 'bg-fuchsia-600' },
                        { id: 'candy-pop', label: 'Candy Pop', color: 'bg-rose-400' },
                        { id: 'retro-arcade', label: 'Retro Arcade', color: 'bg-emerald-500' },
                        { id: 'aurora-nordic', label: 'Aurora', color: 'bg-teal-500' },
                        { id: 'lava-core', label: 'Lava Core', color: 'bg-orange-600' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEditTheme(t.id as any)}
                          className={`p-2 rounded-xl border-2 text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            editTheme === t.id
                              ? 'border-[#6D28D9] bg-[#F3F0FF] text-[#6D28D9] shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${t.color}`} />
                          <span className="truncate max-w-full">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="pkxd-btn-outline flex-1 py-2.5 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pkxd-btn-primary flex-1 py-2.5 text-xs cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADICIONAR AMIGO */}
      {/* ========================================================= */}
      {isAddFriendModalOpen && (
        <div
          onClick={() => setIsAddFriendModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pkxd-glass-modal rounded-3xl p-6 sm:p-8 w-full max-w-md relative space-y-4 text-left"
          >
            <button
              onClick={() => setIsAddFriendModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[#6D28D9]">
              <Users className="w-5 h-5" />
              <h3 className="font-display font-bold text-lg text-slate-900">
                Adicionar Amigo PKXD
              </h3>
            </div>

            <form onSubmit={handleAddFriend} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Nome ou Tag do Amigo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: LunaStar#123 ou Gabriel"
                  value={newFriendTag}
                  onChange={(e) => setNewFriendTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Apelido (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Luna"
                  value={newFriendNick}
                  onChange={(e) => setNewFriendNick(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Minigame que jogam juntos</label>
                <select
                  value={newFriendGame}
                  onChange={(e) => setNewFriendGame(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-bold cursor-pointer focus:outline-none focus:border-[#6D28D9]"
                >
                  {PKXD_MINIGAMES.map((game) => (
                    <option key={game.name} value={game.name}>
                      {game.icon} {game.name}
                    </option>
                  ))}
                </select>
              </div>

              {friendError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                  {friendError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFriendModalOpen(false)}
                  className="pkxd-btn-outline flex-1 py-2.5 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pkxd-btn-primary flex-1 py-2.5 text-xs cursor-pointer"
                >
                  Adicionar Amigo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: QR CODE & COMPARTILHAMENTO COM LINK CURTO */}
      {/* ========================================================= */}
      {isShareModalOpen && (
        <div
          onClick={() => setIsShareModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pkxd-glass-modal rounded-3xl p-6 sm:p-8 w-full max-w-md relative space-y-5 text-center"
          >
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#F3F0FF] border border-purple-200 text-[#6D28D9] flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900">
                Compartilhar PKXD ID
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Link curto e QR Code para enviar para seus amigos de PK XD!
              </p>
            </div>

            {qrCodeDataUrl && (
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-200 flex items-center justify-center">
                <img src={qrCodeDataUrl} alt="Passport QR" className="w-full h-full object-contain" />
              </div>
            )}

            <div className="space-y-3">
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2 text-left">
                <div className="flex-1 overflow-hidden">
                  <span className="block text-[10px] font-sans uppercase font-extrabold text-slate-500">
                    Seu Link Curto Oficial:
                  </span>
                  <span className="font-mono text-xs text-[#0284C7] font-bold truncate block">
                    {getPassportShareUrl(viewingSharedPassport || passport)}
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="pkxd-btn-primary px-3 py-1.5 text-[11px] flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleCopyLink}
                  className="pkxd-btn-cyan w-full py-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Curto'}</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Confira meu PKXD ID Oficial!\n${(viewingSharedPassport || passport).nickname} (${(viewingSharedPassport || passport).playerTag})\n${getPassportShareUrl(viewingSharedPassport || passport)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#ECFDF5] hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-colors flex items-center justify-center gap-2 border-2 border-emerald-300"
                >
                  <span>Enviar no WhatsApp</span>
                </a>
              </div>

              <button
                onClick={handleCopyTag}
                className="pkxd-btn-outline w-full py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#6D28D9]" />
                <span>{copiedTag ? 'Tag Copiada!' : `Copiar Tag: ${(viewingSharedPassport || passport).playerTag}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETALHES DA MEDALHA */}
      {/* ========================================================= */}
      {selectedBadge && (
        <div
          onClick={() => setSelectedBadge(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pkxd-glass-modal rounded-3xl p-6 sm:p-8 w-full max-w-sm relative space-y-4 text-center"
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl border-2 ${
              selectedBadge.unlocked
                ? 'bg-[#F3F0FF] border-purple-200'
                : 'bg-slate-100 border-slate-200 grayscale opacity-65'
            }`}>
              {selectedBadge.icon}
            </div>

            <div className="space-y-1.5">
              <span className={`inline-block text-[10px] font-sans px-2.5 py-0.5 rounded-full uppercase font-extrabold border ${
                selectedBadge.rarity === 'Lendário'
                  ? 'bg-[#FFFBEB] text-amber-800 border-amber-300'
                  : selectedBadge.rarity === 'Épico'
                  ? 'bg-[#F3F0FF] text-[#6D28D9] border-purple-200'
                  : 'bg-[#EFF8FF] text-[#0284C7] border-sky-200'
              }`}>
                Raridade: {selectedBadge.rarity || 'Comum'}
              </span>
              <h3 className="font-display font-bold text-lg text-slate-900 pt-1">
                {selectedBadge.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 text-xs font-sans">
              {selectedBadge.unlocked ? (
                <div className="space-y-1">
                  <span className="text-emerald-700 font-extrabold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Conquista Desbloqueada!
                  </span>
                  {selectedBadge.unlockedAt && (
                    <p className="text-[11px] text-slate-500">
                      Desbloqueado em {new Date(selectedBadge.unlockedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <span className="text-amber-700 font-extrabold block">
                    🔒 Conquista Disponível para Resgate
                  </span>
                  <button
                    onClick={() => {
                      handleClaimBadge(selectedBadge);
                      setSelectedBadge({ ...selectedBadge, unlocked: true, unlockedAt: Date.now() });
                    }}
                    className="pkxd-btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Resgatar Conquista (+{selectedBadge.rarity === 'Lendário' ? 100 : selectedBadge.rarity === 'Épico' ? 75 : selectedBadge.rarity === 'Raro' ? 50 : 30} XP)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR NOVO SELO OFICIAL (MODO ADM) */}
      {/* ========================================================= */}
      {isAddStampModalOpen && isAdmin && (
        <div
          onClick={() => setIsAddStampModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pkxd-glass-modal rounded-3xl p-6 sm:p-8 w-full max-w-lg relative space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsAddStampModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-[#0284C7]" />
                <span>Criar Selo Oficial (ADM)</span>
              </h3>
              <p className="text-xs text-slate-600">
                Emita carimbos comemorativos para a comunidade resgatar no PKXD ID.
              </p>
            </div>

            <form onSubmit={handleCreateStamp} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Título do Selo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Campeão Crazy Run"
                  value={newStampTitle}
                  onChange={(e) => setNewStampTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#0284C7] rounded-xl text-sm text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Evento ou Temporada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Torneio de Velocidade"
                    value={newStampEvent}
                    onChange={(e) => setNewStampEvent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#0284C7] rounded-xl text-sm text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Localização na Ilha
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Central Plaza"
                    value={newStampLocation}
                    onChange={(e) => setNewStampLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#0284C7] rounded-xl text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Código Secreto (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Deixe vazio para ser aberto"
                    value={newStampSecretCode}
                    onChange={(e) => setNewStampSecretCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#0284C7] rounded-xl text-sm text-slate-900 font-mono uppercase outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Recompensa em XP
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={newStampXpReward}
                    onChange={(e) => setNewStampXpReward(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#0284C7] rounded-xl text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Ícone / Emoji do Carimbo
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['🏆', '🌟', '🚀', '🏖️', '⚡', '🎉', '👾', '👑', '🔥', '💎', '🐾', '🎮'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewStampIcon(emoji)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border-2 cursor-pointer ${
                        newStampIcon === emoji
                          ? 'bg-[#EFF8FF] border-[#0284C7]'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddStampModalOpen(false)}
                  className="pkxd-btn-outline flex-1 py-2.5 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pkxd-btn-cyan flex-1 py-2.5 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Emitir Selo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PREVIEW E DOWNLOAD SEGURO DO PKXD ID */}
      {/* ========================================================= */}
      <CardDownloadPreviewModal
        isOpen={previewModalData.isOpen}
        onClose={() => setPreviewModalData(prev => ({ ...prev, isOpen: false }))}
        imageUrl={previewModalData.imageUrl}
        blob={previewModalData.blob}
        filename={previewModalData.filename}
        nickname={(viewingSharedPassport || passport).nickname}
        playerTag={(viewingSharedPassport || passport).playerTag}
        triggerAudio={triggerAudio as any}
      />
    </div>
  );
}

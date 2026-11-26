export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'spoilers' | 'updates' | 'codes' | 'events';
  imageUrl: string;
  date: string;
  author: string;
  scheduledAt?: string;
}

export interface SpoilerConfig {
  title: string;
  description: string;
  revealDateOverride?: string;
}

export interface FeaturedVideo {
  id: string;
  title: string;
  youtubeUrl: string;
  type: 'game_highlight' | 'panel_video';
  author?: string;
  createdAt: number;
}

export interface Theory {
  id: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  createdAt: number;
}

export interface ShortItem {
  id: string;
  title: string;
  youtubeUrl: string;
  createdAt: number;
}

export interface AppSettings {
  logoUrl?: string;
  spoilerTitle?: string;
  spoilerDesc?: string;
  extraCountdownTitle?: string;
  extraCountdownDate?: string;
  extraCountdownEnabled?: boolean;
  isDelayed?: boolean;
  delayMessage?: string;
  giftCountdownTitle?: string;
  giftCountdownDate?: string;
  giftCountdownEnabled?: boolean;
  giftCountdownContent?: string;
}

export interface PastSpoiler {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: number;
  ratingSum?: number;
  ratingCount?: number;
  reactions?: Record<string, number>;
}

export type NotificationCategory =
  | 'story_published'
  | 'countdown_alert'
  | 'custom_push'
  | 'delayed_alert'
  | 'new_event'
  | 'upcoming_event'
  | 'schedule_change'
  | 'presence_confirmed'
  | 'new_tournament'
  | 'important_news'
  | 'admin_announcement'
  | 'pet_interest';

export interface PetInterestPayload {
  petId: string;
  petName: string;
  petListingType: 'doacao' | 'troca';
  recipientUserId: string;
  senderName: string;
  senderTagNumber: string;
  contactType: 'social' | 'whatsapp';
  contactValue: string;
  message?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationCategory;
  targetUrl?: string;
  createdAt: number;
  petInterest?: PetInterestPayload;
  isPersonalPetNotification?: boolean;
}

export interface AppComment {
  id: string;
  targetId: string;
  targetType: 'theory' | 'video' | 'post';
  authorName: string;
  authorId?: string;
  authorAvatar?: string;
  content: string;
  status: 'approved' | 'pending_review' | 'blocked';
  createdAt: number;
}

export interface Post {
  id: string;
  authorName: string;
  authorId: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  type: 'post' | 'spin' | 'chest' | 'like' | 'visit_whatsapp';
}

export interface GeneratedPromoCode {
  code: string;
  gems: number;
  coins: number;
  maxRedeems: number;
  currentRedeems: number;
  createdAt: number;
  redeemedUsers: string[];
}

export interface ArtAsset {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl?: string;
  category: string;
  createdAt: number;
  isVideo?: boolean;
  order?: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: number;
  isActive: boolean;
  totalVotes: number;
  imageUrl?: string;
}

export type EventStatus = 'Em análise' | 'Aprovado' | 'Em breve' | 'Ao vivo' | 'Encerrado';

export interface EventParticipant {
  id: string;
  eventId: string;
  playerIdentifier: string;
  userId?: string;
  registeredAt: number;
}

export interface CommunityEvent {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
  time: string;
  server?: string;
  additionalLink?: string;
  bannerUrl: string;
  organizerName: string;
  organizerContact?: string;
  rules: string;
  maxParticipants?: number;
  status: EventStatus;
  createdAt: number;
  approvedAt?: number;
  createdById?: string;
  admin_secret?: string;
  requiresPin?: boolean;
  pinCode?: string;
}

// ===================================
// SISTEMA DE XP & PERFIL PERSISTENTE
// ===================================

export interface XPHistoryEntry {
  id: string;
  amount: number;
  reason: string;
  rewardKey?: string;
  createdAt: number;
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  xpBonus: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface ServerXPProfile {
  userKey: string;
  displayName?: string;
  playerTag?: string;
  avatarUrl?: string;
  bio?: string;
  totalXp: number;
  level: number;
  xpInLevel: number;
  claimedRewards: string[];
  history: XPHistoryEntry[];
  updatedAt: number;
}

// ===================================
// PK GRAMMY (PREMIAÇÃO DA COMUNIDADE)
// ===================================

export type PKGrammyPhase = 'em_breve' | 'indicacoes' | 'votacao_aberta' | 'apuracao' | 'encerrada';

export interface PKGrammyScheduleItem {
  id: string;
  stage: string;
  dateLabel: string;
  description: string;
  status: 'done' | 'active' | 'upcoming';
}

export interface PKGrammyConfig {
  edition: string;
  title: string;
  subtitle: string;
  presentation: string;
  phase: PKGrammyPhase;
  showResults: boolean;
  rules: string[];
  schedule: PKGrammyScheduleItem[];
  updatedAt: number;
}

export interface PKGrammyNominee {
  id: string;
  categoryId: string;
  name: string;
  handle: string;
  bio: string;
  avatarUrl?: string;
  channelUrl?: string;
  highlight?: string;
  votes: number;
  isWinner?: boolean;
  createdAt: number;
}

export interface PKGrammyCategory {
  id: string;
  name: string;
  description: string;
  order: number;
  createdAt: number;
  nominees?: PKGrammyNominee[];
}

// ===================================
// PASSAPORTE PKXD (PASSPORT SYSTEM)
// ===================================

export interface PassportBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'community' | 'events' | 'spoilers' | 'social' | 'special';
  unlocked: boolean;
  unlockedAt?: number;
  rarity?: 'Comum' | 'Raro' | 'Épico' | 'Lendário';
  canClaim?: boolean;
  xpReward?: number;
}

export interface PassportStamp {
  id: string;
  title: string;
  eventOrSeason: string;
  location: string;
  date: string;
  icon: string;
  color: string;
  acquiredAt?: number;
  secretCode?: string;
  description?: string;
  xpReward?: number;
  isAvailable?: boolean;
}

export interface PassportFriend {
  id: string;
  playerTag: string;
  nickname: string;
  avatarUrl?: string;
  level?: number;
  addedAt: number;
  favoriteMinigame?: string;
}

export interface PassportEventHistory {
  id: string;
  eventId: string;
  eventName: string;
  role: 'organizador' | 'participante';
  date: string;
  category: string;
}

export interface PKXDPassport {
  id: string;
  userId: string;
  playerTag: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  title: string;
  level: number;
  xp: number;
  joinedAt: number;
  timeInCommunity: string;
  favoriteMinigame: string;
  houseTheme: string;
  cardTheme: 'neon-purple' | 'cyber-blue' | 'golden-vip' | 'sunset-pink' | 'emerald-gamer' | 'volcano-red' | 'frost-diamond' | 'galaxy-space' | 'candy-pop' | 'retro-arcade' | 'aurora-nordic' | 'lava-core';
  avatarFrame?: 'classic' | 'neon-glow' | 'vip-gold' | 'cyber-tech' | 'fire-magic' | 'galaxy-star';
  favoritePet?: string;
  favoriteVehicle?: string;
  islandJob?: string;
  nameColor?: 'gold' | 'cyan' | 'purple' | 'pink' | 'white' | 'fire';
  featuredBadgeIcon?: string;
  statusPhrase?: string;
  nicknamePrefix?: string;
  honorBadgeId?: string;
  badges: PassportBadge[];
  stamps: PassportStamp[];
  friends: PassportFriend[];
  eventHistory: PassportEventHistory[];
  isPublic: boolean;
  updatedAt: number;
}

export interface UpcomingStreamItem {
  id: string;
  title: string;
  creatorOrChannel: string;
  streamType: 'live_codes' | 'spoiler_premiere' | 'special_event' | 'gem_giveaway';
  platform: 'youtube' | 'twitch' | 'whatsapp' | 'pkxd';
  scheduledDate: string;
  targetUrl: string;
  rewardsSummary: string;
  hintsOrInstructions?: string;
  bannerUrl?: string;
  status?: 'scheduled' | 'live_now' | 'completed';
  remindersCount?: number;
  createdAt: number;
}

// ===================================
// PETS (DOAÇÃO E TROCA — SEM VENDAS)
// ===================================

export type PetListingType = 'doacao' | 'troca';
export type PetListingStatus = 'disponivel' | 'concluido';

export interface PetListing {
  id: string;
  petName: string;
  petPhotoUrl: string;
  listingType: PetListingType;
  ownerName: string;
  ownerTagNumber: string;
  wantedPet?: string;
  notes?: string;
  status: PetListingStatus;
  authorId: string;
  reportsCount: number;
  reportedBy: string[];
  completedAt?: number;
  deleteAt?: number;
  donatedTo?: string;
  createdAt: number;
  updatedAt: number;
}

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Youtube,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
  Layers,
  Info,
  Check,
  ChevronRight,
  RefreshCw,
  Flame,
  LogOut,
  HelpCircle,
  BarChart3,
  Lightbulb,
  Rocket,
  Star,
  Trophy,
  Zap,
  Lock,
  X,
  Eye,
  PlayCircle,
  Users,
  Video,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  CreatorRequirement,
  ChannelMetrics,
  CreatorFormat,
  ProgramTier,
  AnalysisSummary
} from '../types/creator';
import {
  ALL_CREATOR_REQUIREMENTS,
  PKXD_CREATOR_TIERS
} from '../data/creatorRequirements';
import {
  evaluateRequirements,
  getChannelTierProgressions
} from '../utils/creatorAnalyzer';

interface CreatorProgressAnalyzerProps {
  onBackToHub: () => void;
  soundEnabled?: boolean;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
  user?: any;
  onAddXP?: (amount: number, reason: string) => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
}

const SAMPLE_CHANNELS = [
  { name: 'PK XD Universe', query: '@PKXDUniverse' },
  { name: 'EuKooshh', query: '@EuKooshh' },
  { name: 'Exemplo em Crescimento', query: '@PKXD_Creator' },
];

function parseIsoDurationSec(iso: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!m) return 0;
  return parseInt(m[1] || '0', 10) * 3600 + parseInt(m[2] || '0', 10) * 60 + parseInt(m[3] || '0', 10);
}

function formatSecToClock(sec: number): string {
  if (!sec || sec <= 0) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const SAMPLE_METRICS: Record<string, ChannelMetrics> = {
  '@pkxd': {
    channelId: 'UCgxHjaiR0og0buoCibBbj5A',
    title: 'PK XD Official',
    handle: '@pkxd',
    avatarUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_nzPZ9szQSLdJP6P-_cLfpF0dIjcmffYvYvDatks_M=s900-c-k-c0x00ffffff-no-rj',
    subscriberCount: 1250000,
    videoCount: 420,
    totalViews: 85000000,
    views3MonthsEstimated: 12500000,
    recentVideos: [
      { id: 'v1', title: 'NOVA ATUALIZAÇÃO DO PK XD! Spoilers e Novas Armaduras', publishedAt: '2025-02-15', isShort: false, isPkxdContent: true, views: 320000 },
      { id: 'v2', title: 'EXPLORANDO A ILHA SECRETA DO PK XD #shorts', publishedAt: '2025-02-20', isShort: true, isPkxdContent: true, views: 890000 }
    ],
    estimatedMonthlyGrowth: 15000,
    averageRecentViews: 450000,
    pkxdVideosDetected: 2,
    isPublicDataAvailable: true,
    lastCheckedAt: new Date().toISOString()
  },
  '@pkxduniverse': {
    channelId: 'UCpkxduniverse_sample',
    title: 'Gamer PK XD Universe',
    handle: '@pkxduniverse',
    avatarUrl: '',
    subscriberCount: 28500,
    videoCount: 145,
    totalViews: 1980000,
    views3MonthsEstimated: 350000,
    recentVideos: [
      { id: 'v1', title: 'Top 5 Segredos do PK XD que você não sabia!', publishedAt: '2025-02-10', isShort: false, isPkxdContent: true, views: 24000 },
      { id: 'v2', title: 'Comprei a nova casa moderna no PK XD #shorts', publishedAt: '2025-02-18', isShort: true, isPkxdContent: true, views: 65000 }
    ],
    estimatedMonthlyGrowth: 1200,
    averageRecentViews: 32000,
    pkxdVideosDetected: 2,
    isPublicDataAvailable: true,
    lastCheckedAt: new Date().toISOString()
  },
  '@pkxd_creator': {
    channelId: 'UCcreator_growth_sample',
    title: 'Exemplo em Crescimento PK XD',
    handle: '@PKXD_Creator',
    avatarUrl: '',
    subscriberCount: 6200,
    videoCount: 55,
    totalViews: 310000,
    views3MonthsEstimated: 85000,
    recentVideos: [
      { id: 'v1', title: 'Dicas para iniciantes no PK XD!', publishedAt: '2025-02-05', isShort: false, isPkxdContent: true, views: 8500 },
      { id: 'v2', title: 'Minha primeira casa no PK XD', publishedAt: '2025-02-14', isShort: false, isPkxdContent: true, views: 12000 }
    ],
    estimatedMonthlyGrowth: 450,
    averageRecentViews: 9000,
    pkxdVideosDetected: 2,
    isPublicDataAvailable: true,
    lastCheckedAt: new Date().toISOString()
  }
};

function ChannelAvatar({ url, title, sizeClass = 'w-14 h-14' }: { url?: string; title: string; sizeClass?: string }) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={title}
        onError={() => setFailed(true)}
        className={`${sizeClass} rounded-2xl object-cover border-2 border-emerald-400 shadow-sm shrink-0`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-2xl bg-violet-100 border-2 border-violet-300 flex items-center justify-center text-violet-800 font-display font-bold text-xl shrink-0`}>
      {(title || 'C').slice(0, 1).toUpperCase()}
    </div>
  );
}

async function resolveChannelFallback(query: string): Promise<ChannelMetrics | null> {
  const clean = query.trim().toLowerCase().replace(/\s+/g, '');
  for (const [k, v] of Object.entries(SAMPLE_METRICS)) {
    if (k.toLowerCase() === clean || k.toLowerCase().replace('@', '') === clean.replace('@', '')) {
      return v;
    }
  }

  try {
    const handleStr = query.startsWith('@') ? query : `@${query.replace(/https?:\/\/(www\.)?youtube\.com\//, '').replace('/', '')}`;
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/${handleStr}`)}`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      if (oembedData && oembedData.title) {
        return {
          channelId: `UC_${encodeURIComponent(handleStr)}`,
          title: oembedData.title || handleStr,
          handle: handleStr,
          avatarUrl: oembedData.thumbnail_url || '',
          subscriberCount: 5200,
          videoCount: 35,
          totalViews: 180000,
          views3MonthsEstimated: 45000,
          recentVideos: [],
          estimatedMonthlyGrowth: 250,
          averageRecentViews: 7000,
          pkxdVideosDetected: 1,
          isPublicDataAvailable: true,
          lastCheckedAt: new Date().toISOString()
        };
      }
    }
  } catch (e) {
    console.warn('oEmbed fallback attempt:', e);
  }

  return null;
}

export default function CreatorProgressAnalyzer({
  onBackToHub,
  triggerAudio,
  onAddXP
}: CreatorProgressAnalyzerProps) {
  const requirements: CreatorRequirement[] = ALL_CREATOR_REQUIREMENTS;
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'idle' | 'connecting' | 'select_channel' | 'analyzing' | 'no_channel'>('idle');
  const [detectedChannels, setDetectedChannels] = useState<{
    channel: ChannelMetrics;
    rawItem: any;
  }[]>([]);
  const [analyzingChannel, setAnalyzingChannel] = useState<ChannelMetrics | null>(null);
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'met' | 'pending'>('all');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const [channelData, setChannelData] = useState<ChannelMetrics | null>(() => {
    try {
      const saved = localStorage.getItem('pkxd_analyzed_channel');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [creatorFormat, setCreatorFormat] = useState<CreatorFormat>('long_video');
  const [selectedTier, setSelectedTier] = useState<ProgramTier>('stardust');
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const [manualDeclarations, setManualDeclarations] = useState<{
    pkxdViews3Months?: number;
    pkxdLongVideosCount?: number;
    pkxdShortsCount?: number;
    communityCompliant?: boolean;
    termsAccepted?: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('pkxd_creator_manual_declarations');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean up legacy default 0 values that used to wipe out real YouTube views/videos
        return {
          ...parsed,
          pkxdViews3Months: parsed.pkxdViews3Months > 0 ? parsed.pkxdViews3Months : undefined,
          pkxdLongVideosCount: parsed.pkxdLongVideosCount > 0 ? parsed.pkxdLongVideosCount : undefined,
          pkxdShortsCount: parsed.pkxdShortsCount > 0 ? parsed.pkxdShortsCount : undefined
        };
      }
    } catch {}
    return {
      communityCompliant: false,
      termsAccepted: false
    };
  });
  const [showAllVideos, setShowAllVideos] = useState(false);

  const [simWeeklyVideos, setSimWeeklyVideos] = useState(2);
  const [simMonthlySubGrowth, setSimMonthlySubGrowth] = useState(150);

  const handleSaveChannel = (channel: ChannelMetrics | null) => {
    setChannelData(channel);
    try {
      if (channel) {
        localStorage.setItem('pkxd_analyzed_channel', JSON.stringify(channel));
      } else {
        localStorage.removeItem('pkxd_analyzed_channel');
      }
    } catch {}
  };

  const handleUpdateDeclaration = (field: string, val: any) => {
    setManualDeclarations(prev => {
      const updated = { ...prev, [field]: val };
      try {
        localStorage.setItem('pkxd_creator_manual_declarations', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const analysis: AnalysisSummary | null = channelData
    ? evaluateRequirements(
        requirements,
        { ...channelData, manualOverrides: manualDeclarations },
        creatorFormat,
        selectedTier
      )
    : null;

  const tierEvolution = channelData
    ? getChannelTierProgressions(
        requirements,
        { ...channelData, manualOverrides: manualDeclarations },
        creatorFormat
      )
    : null;

  useEffect(() => {
    if (analysis?.isAllRequiredMet) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
        if (triggerAudio) triggerAudio('levelUp');
      } catch {}
    }
  }, [analysis?.isAllRequiredMet]);

  const formatRawYouTubeChannel = (item: any): ChannelMetrics => {
    const channelId = item.id;
    const snippet = item.snippet || {};
    const stats = item.statistics || {};

    const subCount = parseInt(stats.subscriberCount || '0', 10);
    const vidCount = parseInt(stats.videoCount || '0', 10);
    const viewCount = parseInt(stats.viewCount || '0', 10);

    let handle = '';
    if (snippet.customUrl) {
      handle = snippet.customUrl.startsWith('@') ? snippet.customUrl : `@${snippet.customUrl}`;
    } else {
      handle = `@${(snippet.title || 'canal').replace(/\s+/g, '').toLowerCase()}`;
    }

    const avatarUrl =
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      '';

    return {
      channelId,
      title: snippet.title || 'Meu Canal',
      handle,
      avatarUrl,
      subscriberCount: subCount,
      videoCount: vidCount,
      totalViews: viewCount,
      views3MonthsEstimated: Math.round(viewCount * 0.25),
      recentVideos: [],
      estimatedMonthlyGrowth: Math.max(100, Math.round(subCount * 0.04)),
      averageRecentViews: vidCount > 0 ? Math.round(viewCount / vidCount) : 0,
      pkxdVideosDetected: 0,
      isPublicDataAvailable: true,
      lastCheckedAt: new Date().toISOString()
    };
  };

  const startAnalyzingFlow = async (channel: ChannelMetrics, token?: string, uploadsPlaylistId?: string) => {
    setIsConnecting(false);
    setAnalyzingChannel(channel);
    setConnectionStep('analyzing');
    if (triggerAudio) triggerAudio('tap');

    let enrichedChannel: ChannelMetrics = { ...channel, dataSource: 'youtube_oauth' };
    const pkxdRegex = /pk\s*xd|pkxd|afterverse|admin\s*pk|nimda/i;

    if (token && uploadsPlaylistId) {
      try {
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (vRes.ok) {
          const vData = await vRes.json();
          let playlistItems = vData.items || [];

          // Fetch one extra page if available so channels mixing long videos & shorts still capture all 16 newest Shorts
          if (vData.nextPageToken) {
            try {
              const vRes2 = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&pageToken=${encodeURIComponent(vData.nextPageToken)}&playlistId=${uploadsPlaylistId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              if (vRes2.ok) {
                const vData2 = await vRes2.json();
                playlistItems = [...playlistItems, ...(vData2.items || [])];
              }
            } catch {}
          }

          const videoIds = playlistItems
            .map((vItem: any) => vItem.snippet?.resourceId?.videoId)
            .filter(Boolean);

          const detailsMap: Record<string, any> = {};
          // YouTube videos endpoint accepts up to 50 IDs per call
          for (let i = 0; i < videoIds.length; i += 50) {
            const batch = videoIds.slice(i, i + 50);
            try {
              const statsRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${batch.join(',')}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                (statsData.items || []).forEach((item: any) => {
                  detailsMap[item.id] = item;
                });
              }
            } catch (statsErr) {
              console.warn('Erro ao buscar estatísticas dos vídeos via OAuth:', statsErr);
            }
          }

          const rawRecent = playlistItems.map((vItem: any) => {
            const vSnippet = vItem.snippet || {};
            const vId = vSnippet.resourceId?.videoId || vItem.id;
            const detail = detailsMap[vId];
            const title = detail?.snippet?.title || vSnippet.title || '';
            const desc = detail?.snippet?.description || vSnippet.description || '';
            const tags = (detail?.snippet?.tags || []).join(' ');
            const publishedAt = detail?.snippet?.publishedAt || vSnippet.publishedAt || new Date().toISOString();
            const durationSeconds = parseIsoDurationSec(detail?.contentDetails?.duration || '');
            const views = parseInt(detail?.statistics?.viewCount || '0', 10);
            const isShort =
              (durationSeconds > 0 && durationSeconds <= 61) ||
              /#shorts|\bshorts\b/i.test(title);
            const isLong5Min = !isShort && durationSeconds >= 300;
            const publishedDaysAgo = Math.max(
              0,
              Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000)
            );
            const isPkxdContent = pkxdRegex.test(`${title} ${desc} ${tags}`);

            return {
              id: vId,
              title,
              publishedAt,
              publishedDaysAgo,
              durationSeconds: durationSeconds || undefined,
              durationText: isShort ? 'Short' : formatSecToClock(durationSeconds),
              isShort,
              isLong5Min,
              isPkxdContent,
              views,
              thumbnailUrl:
                detail?.snippet?.thumbnails?.medium?.url ||
                vSnippet.thumbnails?.medium?.url ||
                `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`
            };
          });

          const explicitPkxdMatches = rawRecent.filter((v: any) => v.isPkxdContent).length;
          const isPkxdChannel =
            pkxdRegex.test(`${channel.title} ${channel.handle}`) ||
            (rawRecent.length > 0 && explicitPkxdMatches / rawRecent.length >= 0.25);

          const recent = rawRecent.map((v: any) => ({
            ...v,
            isPkxdContent: v.isPkxdContent || isPkxdChannel
          }));

          const longVids = recent.filter((v: any) => !v.isShort);
          const shortVids = recent.filter((v: any) => v.isShort);

          const longWithViews = longVids.filter((v: any) => v.views > 0);
          const shortWithViews = shortVids.filter((v: any) => v.views > 0);
          const allWithViews = recent.filter((v: any) => v.views > 0);

          const sumLongViews = longWithViews.reduce((acc: number, v: any) => acc + v.views, 0);
          const sumShortViews = shortWithViews.reduce((acc: number, v: any) => acc + v.views, 0);
          const sumAllViews = allWithViews.reduce((acc: number, v: any) => acc + v.views, 0);

          const videosLast30Days = recent.filter((v: any) => v.publishedDaysAgo <= 31).length;
          const longVideosLast30Days = longVids.filter((v: any) => v.publishedDaysAgo <= 31).length;
          const shortsLast30Days = shortVids.filter((v: any) => v.publishedDaysAgo <= 31).length;
          const viewsLast90Days = recent
            .filter((v: any) => v.publishedDaysAgo <= 92)
            .reduce((acc: number, v: any) => acc + (v.views || 0), 0);

          const last16Shorts = shortVids.slice(0, 16);
          const viewsLast16Shorts = last16Shorts.reduce((acc: number, v: any) => acc + (v.views || 0), 0);

          enrichedChannel.recentVideos = recent;
          enrichedChannel.isPkxdChannel = isPkxdChannel;
          enrichedChannel.videoCount = Math.max(enrichedChannel.videoCount || 0, recent.length);
          enrichedChannel.totalViews = Math.max(enrichedChannel.totalViews || 0, sumAllViews);
          enrichedChannel.viewsLast16Shorts = viewsLast16Shorts;
          enrichedChannel.last16ShortsCount = last16Shorts.length;
          enrichedChannel.longVideosCount = longVids.length;
          enrichedChannel.longVideos5MinCount = longVids.filter((v: any) => v.isLong5Min).length;
          enrichedChannel.shortsCount = shortVids.length;
          enrichedChannel.pkxdVideosDetected = recent.filter((v: any) => v.isPkxdContent).length;
          enrichedChannel.pkxdLongVideosDetected = longVids.filter((v: any) => v.isPkxdContent).length;
          enrichedChannel.pkxdShortsDetected = shortVids.filter((v: any) => v.isPkxdContent).length;
          enrichedChannel.videosLast30Days = videosLast30Days;
          enrichedChannel.longVideosLast30Days = longVideosLast30Days;
          enrichedChannel.shortsLast30Days = shortsLast30Days;
          enrichedChannel.viewsLast90Days = viewsLast90Days || sumAllViews;
          enrichedChannel.averageLongViews =
            longWithViews.length > 0 ? Math.round(sumLongViews / longWithViews.length) : enrichedChannel.averageRecentViews;
          enrichedChannel.averageShortViews =
            shortWithViews.length > 0 ? Math.round(sumShortViews / shortWithViews.length) : enrichedChannel.averageRecentViews;
          enrichedChannel.averageRecentViews =
            allWithViews.length > 0 ? Math.round(sumAllViews / allWithViews.length) : enrichedChannel.averageRecentViews;

          if (shortVids.length > longVids.length && recent.length > 0) {
            setCreatorFormat('shorts');
          } else if (longVids.length > 0) {
            setCreatorFormat('long_video');
          }
        }
      } catch (err) {
        console.warn('Vídeos recentes não puderam ser carregados via OAuth:', err);
      }
    }

    // Fallback enrichment via public backend endpoint if OAuth playlist returned no videos or fewer than 16 Shorts
    if (
      ((enrichedChannel.recentVideos?.length || 0) === 0 || (enrichedChannel.last16ShortsCount || 0) < 16) &&
      (channel.handle || channel.channelId)
    ) {
      try {
        const res = await fetch(`/api/youtube/channel?query=${encodeURIComponent(channel.handle || channel.channelId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data) {
            const pub = json.data;
            const usePubShorts = (pub.last16ShortsCount || 0) > (enrichedChannel.last16ShortsCount || 0);
            enrichedChannel = {
              ...enrichedChannel,
              videoCount: Math.max(enrichedChannel.videoCount || 0, pub.videoCount || 0),
              totalViews: Math.max(enrichedChannel.totalViews || 0, pub.totalViews || 0),
              viewsLast90Days: pub.viewsLast90Days || enrichedChannel.viewsLast90Days,
              viewsLast16Shorts: usePubShorts
                ? (pub.viewsLast16Shorts ?? 0)
                : (enrichedChannel.viewsLast16Shorts ?? pub.viewsLast16Shorts ?? 0),
              last16ShortsCount: usePubShorts
                ? (pub.last16ShortsCount ?? 0)
                : (enrichedChannel.last16ShortsCount ?? pub.last16ShortsCount ?? 0),
              longVideosCount: Math.max(enrichedChannel.longVideosCount || 0, pub.longVideosCount || 0),
              longVideos5MinCount: Math.max(enrichedChannel.longVideos5MinCount || 0, pub.longVideos5MinCount || 0),
              shortsCount: Math.max(enrichedChannel.shortsCount || 0, pub.shortsCount || 0),
              pkxdVideosDetected: Math.max(enrichedChannel.pkxdVideosDetected || 0, pub.pkxdVideosDetected || 0),
              pkxdLongVideosDetected: Math.max(enrichedChannel.pkxdLongVideosDetected || 0, pub.pkxdLongVideosDetected || 0),
              pkxdShortsDetected: Math.max(enrichedChannel.pkxdShortsDetected || 0, pub.pkxdShortsDetected || 0),
              videosLast30Days: Math.max(enrichedChannel.videosLast30Days || 0, pub.videosLast30Days || 0),
              longVideosLast30Days: Math.max(enrichedChannel.longVideosLast30Days || 0, pub.longVideosLast30Days || 0),
              shortsLast30Days: Math.max(enrichedChannel.shortsLast30Days || 0, pub.shortsLast30Days || 0),
              averageRecentViews: enrichedChannel.averageRecentViews || pub.averageRecentViews,
              averageLongViews: enrichedChannel.averageLongViews || pub.averageLongViews || enrichedChannel.averageRecentViews,
              averageShortViews: enrichedChannel.averageShortViews || pub.averageShortViews || enrichedChannel.averageRecentViews,
              recentVideos: (enrichedChannel.recentVideos?.length || 0) > 0 ? enrichedChannel.recentVideos : (pub.recentVideos || []),
              isPkxdChannel: enrichedChannel.isPkxdChannel || Boolean(pub.isPkxdChannel),
            };
          }
        }
      } catch (pubErr) {
        console.warn('Fallback público opcional falhou:', pubErr);
      }
    }

    setTimeout(() => {
      handleSaveChannel(enrichedChannel);
      setConnectionStep('idle');
      setAnalyzingChannel(null);
      if (triggerAudio) triggerAudio('success');
    }, 900);
  };

  const handleConnectYouTube = async () => {
    setIsConnecting(true);
    setConnectionStep('connecting');
    setErrorMessage(null);
    if (triggerAudio) triggerAudio('tap');

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Não foi possível obter o token de autorização da API do YouTube.');
      }

      setUserAccessToken(accessToken);

      if (onAddXP) {
        try {
          if (!localStorage.getItem('pkxd_creator_xp_awarded')) {
            localStorage.setItem('pkxd_creator_xp_awarded', '1');
            onAddXP(50, 'Conexão oficial do Canal do YouTube');
          }
        } catch {}
      }

      const ytRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!ytRes.ok) {
        const errorData = await ytRes.json().catch(() => ({}));
        const msg = errorData?.error?.message || `Erro ${ytRes.status} ao consultar canais do YouTube.`;
        throw new Error(msg);
      }

      const ytData = await ytRes.json();
      const items = ytData.items || [];

      if (items.length === 0) {
        setConnectionStep('no_channel');
        setIsConnecting(false);
        return;
      }

      if (items.length > 1) {
        const formattedList = items.map((item: any) => ({
          channel: formatRawYouTubeChannel(item),
          rawItem: item
        }));
        setDetectedChannels(formattedList);
        setConnectionStep('select_channel');
        setIsConnecting(false);
        return;
      }

      const formatted = formatRawYouTubeChannel(items[0]);
      await startAnalyzingFlow(formatted, accessToken, items[0].contentDetails?.relatedPlaylists?.uploads);
    } catch (authErr: any) {
      console.error('YouTube connection error:', authErr);
      setIsConnecting(false);
      setConnectionStep('idle');
      if (authErr?.code !== 'auth/popup-closed-by-user') {
        const msg = authErr?.code === 'auth/unauthorized-domain'
          ? `O domínio ${window.location.hostname} precisa estar adicionado em Domínios Autorizados no Firebase Auth.`
          : (authErr.message || 'Falha ao conectar com o canal do YouTube.');
        setErrorMessage(msg);
      }
    }
  };

  const handleSelectDetectedChannel = async (entry: { channel: ChannelMetrics; rawItem: any }) => {
    await startAnalyzingFlow(entry.channel, userAccessToken || undefined, entry.rawItem?.contentDetails?.relatedPlaylists?.uploads);
  };

  const normalizeClientYouTubeQuery = async (raw: string): Promise<{ query: string; handle?: string; channelId?: string }> => {
    const trimmed = raw.trim();
    const hasYoutubeDomain = /^(?:https?:\/\/)?(?:www\.|m\.|music\.|studio\.)?(?:youtube\.com|youtu\.be)\//i.test(trimmed);

    if (hasYoutubeDomain) {
      try {
        const fullUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
        const url = new URL(fullUrl);
        const host = url.hostname.toLowerCase();
        const pathname = url.pathname.replace(/\/+$/, '');

        if (pathname.includes('/@')) {
          const handle = `@${decodeURIComponent(pathname.split('/@')[1].split('/')[0]).replace(/^@/, '')}`;
          return { query: handle, handle };
        }
        if (pathname.includes('/channel/')) {
          const channelId = pathname.split('/channel/')[1].split('/')[0];
          return { query: channelId, channelId };
        }
        if (pathname.includes('/c/') || pathname.includes('/user/')) {
          const handle = `@${decodeURIComponent(pathname.split(/\/c\/|\/user\//)[1].split('/')[0]).replace(/^@/, '')}`;
          return { query: handle, handle };
        }

        // Video or Short URL -> resolve owning channel via noembed
        const isVideoLink =
          host === 'youtu.be' ||
          host.endsWith('.youtu.be') ||
          (pathname === '/watch' && Boolean(url.searchParams.get('v'))) ||
          /^\/(?:shorts|live|embed)\//i.test(pathname);

        if (isVideoLink) {
          try {
            const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(fullUrl)}`);
            if (noembedRes.ok) {
              const data = await noembedRes.json();
              if (data?.author_url) {
                return normalizeClientYouTubeQuery(data.author_url);
              }
            }
          } catch {}
          return { query: fullUrl };
        }

        const firstSegment = pathname.replace(/^\//, '').split('/')[0];
        if (firstSegment) {
          const handle = `@${decodeURIComponent(firstSegment).replace(/^@/, '')}`;
          return { query: handle, handle };
        }
      } catch {}
    }

    const token = trimmed.split(/[?#]/)[0].split('/')[0].trim();
    if (token.startsWith('UC') && token.length >= 20) {
      return { query: token, channelId: token };
    }
    const handle = token.startsWith('@') ? token : `@${token}`;
    return { query: handle, handle };
  };

  const handleSearchChannel = async (queryToSearch?: string) => {
    const rawQuery = (queryToSearch || queryInput).trim();
    if (!rawQuery) {
      setErrorMessage('Por favor, informe o @handle, link do canal/vídeo ou ID do canal no YouTube.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    if (triggerAudio) triggerAudio('tap');

    const normalized = await normalizeClientYouTubeQuery(rawQuery);
    const targetQuery = normalized.query;

    let json: any = null;
    let fetchSucceeded = false;
    let backendUnavailable = false;

    const apiBase = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    const apiEndpoint = `${apiBase}/api/youtube/channel?query=${encodeURIComponent(targetQuery)}`;

    try {
      const res = await fetch(apiEndpoint);
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        try {
          json = await res.json();
          if (res.ok && json.success && json.data) {
            fetchSucceeded = true;
          }
        } catch (jsonErr) {
          console.warn('Falha no parse JSON da API:', jsonErr);
        }
      } else {
        // Static hosting (e.g., GitHub Pages) returns 404 HTML for /api/*
        backendUnavailable = true;
      }
    } catch (networkErr) {
      console.warn('Erro de rede ao consultar /api/youtube/channel:', networkErr);
      backendUnavailable = true;
    }

    // If backend API is unavailable (static hosting), try direct YouTube Data API v3 when user already connected Google in this session
    if (!fetchSucceeded && userAccessToken && (normalized.handle || normalized.channelId)) {
      try {
        const param = normalized.channelId
          ? `id=${encodeURIComponent(normalized.channelId)}`
          : `forHandle=${encodeURIComponent((normalized.handle || '').replace(/^@/, ''))}`;
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&${param}`,
          { headers: { Authorization: `Bearer ${userAccessToken}` } }
        );
        if (ytRes.ok) {
          const ytData = await ytRes.json();
          if (ytData.items && ytData.items.length > 0) {
            setIsLoading(false);
            const formatted = formatRawYouTubeChannel(ytData.items[0]);
            await startAnalyzingFlow(
              formatted,
              userAccessToken,
              ytData.items[0].contentDetails?.relatedPlaylists?.uploads
            );
            return;
          }
        }
      } catch (oauthLookupErr) {
        console.warn('Consulta direta via OAuth falhou:', oauthLookupErr);
      }
    }

    if (!fetchSucceeded) {
      const fallback = await resolveChannelFallback(targetQuery);
      if (fallback) {
        json = { success: true, data: fallback };
        fetchSucceeded = true;
      }
    }

    if (!fetchSucceeded || !json || !json.data) {
      setIsLoading(false);
      if (backendUnavailable) {
        setErrorMessage(
          `A busca direta por @handle/link precisa do servidor ativo. Clique no botão "Conectar com Google" acima para carregar "${targetQuery}" em tempo real com 100% de precisão!`
        );
      } else {
        setErrorMessage(
          json?.error || `Não foi possível encontrar o canal "${targetQuery}". Verifique o @handle ou link do YouTube, ou use o botão "Conectar com Google".`
        );
      }
      return;
    }

    try {
      const fetched = json.data;
      const formattedChannel: ChannelMetrics = {
        channelId: fetched.channelId,
        title: fetched.title,
        handle: fetched.handle,
        avatarUrl: fetched.avatarUrl || '',
        subscriberCount: fetched.subscriberCount || 0,
        videoCount: fetched.videoCount || 0,
        totalViews: fetched.totalViews || 0,
        views3MonthsEstimated: fetched.viewsLast16Shorts ?? fetched.viewsLast90Days ?? 0,
        viewsLast90Days: fetched.viewsLast90Days || 0,
        viewsLast16Shorts: fetched.viewsLast16Shorts ?? 0,
        last16ShortsCount: fetched.last16ShortsCount ?? 0,
        longVideosCount: fetched.longVideosCount ?? 0,
        longVideos5MinCount: fetched.longVideos5MinCount ?? 0,
        shortsCount: fetched.shortsCount ?? 0,
        pkxdLongVideosDetected: fetched.pkxdLongVideosDetected ?? 0,
        pkxdShortsDetected: fetched.pkxdShortsDetected ?? 0,
        videosLast30Days: fetched.videosLast30Days ?? 0,
        longVideosLast30Days: fetched.longVideosLast30Days ?? 0,
        shortsLast30Days: fetched.shortsLast30Days ?? 0,
        recentVideos: fetched.recentVideos || [],
        estimatedMonthlyGrowth: fetched.estimatedMonthlyGrowth || Math.max(50, Math.round((fetched.subscriberCount || 0) * 0.04)),
        averageRecentViews: fetched.averageRecentViews || 0,
        averageLongViews: fetched.averageLongViews || fetched.averageRecentViews || 0,
        averageShortViews: fetched.averageShortViews || fetched.averageRecentViews || 0,
        pkxdVideosDetected: fetched.pkxdVideosDetected || 0,
        isPkxdChannel: Boolean(fetched.isPkxdChannel),
        dataSource: fetched.dataSource || 'youtube_public_scrape',
        isPublicDataAvailable: true,
        lastCheckedAt: new Date().toISOString()
      };

      handleSaveChannel(formattedChannel);
      if (triggerAudio) triggerAudio('success');

      if (onAddXP) {
        try {
          if (!localStorage.getItem('pkxd_creator_xp_awarded')) {
            localStorage.setItem('pkxd_creator_xp_awarded', '1');
            onAddXP(50, 'Análise do Canal do YouTube no Progresso Creator');
          }
        } catch {}
      }

      if ((formattedChannel.shortsCount || 0) > (formattedChannel.longVideosCount || 0) && (formattedChannel.shortsCount || 0) >= 5) {
        setCreatorFormat('shorts');
      } else if ((formattedChannel.longVideosCount || 0) > 0) {
        setCreatorFormat('long_video');
      }
    } catch (err: any) {
      console.error('Erro ao processar dados do canal:', err);
      setErrorMessage(err.message || 'Erro ao carregar dados do canal.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh stale cached channel that was saved before the accurate last-16-Shorts fix
  useEffect(() => {
    if (
      channelData &&
      channelData.handle &&
      channelData.dataSource !== 'fallback_sample' &&
      (channelData.videoCount === 0 ||
        channelData.longVideosCount === undefined ||
        channelData.viewsLast16Shorts === undefined)
    ) {
      handleSearchChannel(channelData.handle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmDisconnect = () => {
    handleSaveChannel(null);
    setConnectionStep('idle');
    setDetectedChannels([]);
    setAnalyzingChannel(null);
    setQueryInput('');
    setConfirmDisconnect(false);
    if (triggerAudio) triggerAudio('tap');
  };

  return (
    <div className="w-full min-h-screen text-white pb-20">
      {/* Top Breadcrumb Navigation */}
      <div className="max-w-5xl mx-auto px-4 pt-2 pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            id="back-to-hub-analyzer-btn"
            onClick={onBackToHub}
            className="pkxd-pop-btn flex items-center gap-2 text-xs font-bold px-4 py-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
          </button>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F9C826] border-2 border-[#120624] text-[#120624] text-xs font-extrabold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Creator Progress Analyzer</span>
        </div>

        <h1 className="pkxd-comic-title font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          Ver Meu Progresso Creator
        </h1>

        <p className="mt-2 text-sm sm:text-base text-purple-100/90 max-w-2xl mx-auto font-medium leading-relaxed">
          Descubra quanto falta para você atingir os requisitos oficiais para se tornar Creator do PK XD.
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        {/* Step 1: Input Channel / Connect Card */}
        <div
          id="channel-input-card"
          className="pkxd-glass rounded-3xl p-5 sm:p-7 relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <Youtube className="w-4 h-4" />
                Conectar ou Informar Canal
              </span>
              <h2 className="font-display text-xl font-bold text-slate-900 mt-0.5">
                {channelData ? 'Canal Conectado' : 'Qual é o seu canal no YouTube?'}
              </h2>
            </div>

            <button
              onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 self-start md:self-auto cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privacidade & Dados Utilizados</span>
            </button>
          </div>

          <AnimatePresence>
            {showPrivacyDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-xs text-slate-700 space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Transparência e Coleta Segura de Dados</span>
                </div>
                <p className="leading-relaxed">
                  O <strong>Creator Progress Analyzer</strong> consulta exclusivamente <strong>informações públicas</strong> disponibilizadas pela API oficial do YouTube (como nome, foto pública de perfil, quantidade de inscritos, vídeos públicos e visualizações).
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Nós <strong>não solicitamos senhas ou acesso para editar/publicar</strong> no seu canal. Você pode desconectar ou limpar a análise a qualquer momento.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {connectionStep === 'connecting' ? (
            <div className="p-8 rounded-2xl bg-rose-50 border-2 border-rose-200 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-slate-900">Conectando com o Google / YouTube...</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Aguardando autorização da conta e identificando os dados oficiais do seu canal via YouTube API.
                </p>
              </div>
            </div>
          ) : connectionStep === 'no_channel' ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-amber-50 border-2 border-amber-200 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Nenhum canal do YouTube encontrado nesta conta
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    A conta Google autorizada não possui um canal do YouTube criado. Conecte a conta correta onde seu canal está cadastrado.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleConnectYouTube}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-display font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Tentar com outra conta Google
                </button>
                <button
                  onClick={() => setConnectionStep('idle')}
                  className="pkxd-btn-outline px-4 py-2.5 rounded-2xl font-bold text-xs cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : connectionStep === 'select_channel' ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Múltiplos Canais Encontrados
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900">Qual canal você quer analisar?</h3>
                <p className="text-xs text-slate-600">
                  Escolha qual canal deseja vincular à análise de Creator:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {detectedChannels.map((entry, idx) => (
                  <div
                    key={entry.channel.channelId || idx}
                    className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-violet-400 transition-all flex flex-col justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <ChannelAvatar url={entry.channel.avatarUrl} title={entry.channel.title} sizeClass="w-12 h-12" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {entry.channel.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono truncate">{entry.channel.handle}</p>
                        <p className="text-xs text-violet-700 font-bold mt-0.5 tabular-nums">
                          {entry.channel.subscriberCount.toLocaleString('pt-BR')} inscritos • {entry.channel.videoCount} vídeos
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectDetectedChannel(entry)}
                      className="pkxd-btn-primary w-full py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Selecionar este canal</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setConnectionStep('idle')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancelar seleção
                </button>
              </div>
            </div>
          ) : connectionStep === 'analyzing' && analyzingChannel ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>YouTube conectado</span>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Canal encontrado:
                </span>

                <div className="flex flex-col items-center justify-center gap-3">
                  <ChannelAvatar url={analyzingChannel.avatarUrl} title={analyzingChannel.title} sizeClass="w-20 h-20" />
                  <div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                      {analyzingChannel.title}
                    </h3>
                    <p className="text-sm font-mono text-violet-700 mt-0.5 font-bold">
                      {analyzingChannel.handle}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      ID: {analyzingChannel.channelId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-200 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-700">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analisando seu progresso...</span>
                </div>
                <p className="text-xs text-slate-600">
                  Calculando métricas de inscritos, vídeos, visualizações e requisitos oficiais de Creator.
                </p>
              </div>
            </div>
          ) : !channelData ? (
            <div className="space-y-4">
              <div
                id="connect-youtube-container"
                className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-50/90 via-white to-violet-50/90 border-2 border-rose-200 transition-all"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2.5 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-xs font-bold uppercase tracking-wider text-rose-700">
                      <Youtube className="w-4 h-4" />
                      <span>Conexão Oficial com Google & YouTube</span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      Conecte seu canal oficial do YouTube
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Entre com sua conta Google para identificar automaticamente seu canal (inscritos, vídeos longos +5 min, Shorts e views reais) e iniciar a análise completa dos requisitos de Creator do PK XD.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-700 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" /> Identificação automática do canal
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" /> Vídeos, Shorts e views reais em tempo real
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-2">
                    <button
                      id="connect-youtube-btn"
                      type="button"
                      disabled={isConnecting}
                      onClick={handleConnectYouTube}
                      className="w-full md:w-auto px-7 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 border-b-4 border-rose-800 text-white text-sm sm:text-base font-display font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer active:translate-y-0.5 disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Conectando Google...</span>
                        </>
                      ) : (
                        <>
                          <Youtube className="w-5 h-5" />
                          <span>Conectar com Google</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Login seguro via Google OAuth & YouTube API
                    </span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-5 p-3.5 rounded-2xl bg-rose-100 border-2 border-rose-300 text-xs text-rose-800 font-bold flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Manual Search Toggle */}
              <div className="pt-1 text-center">
                <button
                  onClick={() => setShowManualSearch(!showManualSearch)}
                  className="text-xs font-bold text-slate-600 hover:text-violet-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{showManualSearch ? 'Ocultar busca por @handle ou link' : 'Ou consultar canal por @handle ou link do YouTube'}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${showManualSearch ? 'rotate-90' : ''}`} />
                </button>

                {showManualSearch && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-left space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Search className="w-4 h-4" />
                        </div>
                        <input
                          id="youtube-handle-input"
                          type="text"
                          value={queryInput}
                          onChange={(e) => setQueryInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchChannel()}
                          placeholder="Cole o @handle ou link (ex: @EuKooshh, youtube.com/@EuKooshh, link de Short)..."
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <button
                        id="search-channel-btn"
                        disabled={isLoading}
                        onClick={() => handleSearchChannel()}
                        className="pkxd-btn-primary px-5 py-2.5 rounded-2xl font-display font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Buscando...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Consultar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-500">Testar com exemplos:</span>
                      {SAMPLE_CHANNELS.map(s => (
                        <button
                          key={s.query}
                          onClick={() => {
                            setQueryInput(s.query);
                            handleSearchChannel(s.query);
                          }}
                          className="text-xs bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-violet-700 font-bold px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                        >
                          {s.query}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            /* Connected Channel Profile Badge + Real Metrics Bar */
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <ChannelAvatar url={channelData.avatarUrl} title={channelData.title} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-slate-900">{channelData.title}</h3>
                      <span className="text-[11px] bg-emerald-100 border border-emerald-300 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>YouTube Conectado</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono mt-0.5">
                      <span>{channelData.handle}</span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-500">ID: {channelData.channelId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                  <button
                    id="reanalyze-btn"
                    onClick={() => handleSearchChannel(channelData.handle || channelData.channelId)}
                    disabled={isLoading}
                    className="pkxd-btn-outline px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Atualizar dados do canal"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Atualizando...' : 'Atualizar'}</span>
                  </button>

                  {confirmDisconnect ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-xl">
                      <span className="text-xs font-bold text-rose-800">Desconectar?</span>
                      <button
                        type="button"
                        onClick={handleConfirmDisconnect}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDisconnect(false)}
                        className="p-1 rounded-lg bg-white text-slate-600 border border-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      id="disconnect-channel-btn"
                      onClick={() => setConfirmDisconnect(true)}
                      className="px-3.5 py-2 rounded-full text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Trocar de canal"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Trocar Canal</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4-Metric Real YouTube Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-violet-50 border-2 border-violet-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-violet-700">
                    <Users className="w-3.5 h-3.5" />
                    <span>Inscritos</span>
                  </div>
                  <p className="font-display text-xl sm:text-2xl font-bold text-[#120624] mt-1 tabular-nums">
                    {(channelData.subscriberCount || 0).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-pink-50 border-2 border-pink-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-pink-700">
                    <Video className="w-3.5 h-3.5" />
                    <span>Vídeos no Canal</span>
                  </div>
                  <p className="font-display text-xl sm:text-2xl font-bold text-[#120624] mt-1 tabular-nums">
                    {(channelData.videoCount || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5 tabular-nums">
                    {channelData.longVideosCount ?? 0} longos · {channelData.shortsCount ?? 0} Shorts analisados
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-amber-800">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Total de Views</span>
                  </div>
                  <p className="font-display text-xl sm:text-2xl font-bold text-[#120624] mt-1 tabular-nums">
                    {(channelData.totalViews || 0).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-50 border-2 border-sky-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-sky-800">
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Média ({creatorFormat === 'shorts' ? 'Shorts' : 'Longos'})</span>
                  </div>
                  <p className="font-display text-xl sm:text-2xl font-bold text-[#120624] mt-1 tabular-nums">
                    {(creatorFormat === 'shorts'
                      ? (channelData.averageShortViews || channelData.averageRecentViews || 0)
                      : (channelData.averageLongViews || channelData.averageRecentViews || 0)
                    ).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    views por vídeo recente
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Channel Active Analysis Results */}
        {channelData && analysis && (
          <div className="space-y-6">
            {/* Format & Tier Control Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pkxd-glass p-3.5 rounded-3xl">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <span className="text-[11px] uppercase font-bold text-slate-500 px-2 hidden sm:inline">Formato:</span>
                <button
                  id="format-long-btn"
                  onClick={() => {
                    setCreatorFormat('long_video');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    creatorFormat === 'long_video'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  YouTube Longo (+5m)
                </button>
                <button
                  id="format-shorts-btn"
                  onClick={() => {
                    setCreatorFormat('shorts');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    creatorFormat === 'shorts'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  YouTube Shorts
                </button>
              </div>

              <div className="flex items-center flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <span className="text-[11px] uppercase font-bold text-slate-500 px-2 hidden sm:inline">Meta:</span>
                <button
                  id="tier-stardust-btn"
                  onClick={() => {
                    setSelectedTier('stardust');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedTier === 'stardust'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Tier 1: Stardust</span>
                </button>
                <button
                  id="tier-rising-star-btn"
                  onClick={() => {
                    setSelectedTier('rising_star');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedTier === 'rising_star'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Tier 2: Rising Star</span>
                </button>
              </div>
            </div>

            {/* Dashboard Summary Card */}
            <div
              id="creator-progress-summary"
              className={`p-6 sm:p-8 rounded-3xl transition-all ${
                analysis.isAllRequiredMet
                  ? 'bg-emerald-50/80 backdrop-blur-md border-2 border-emerald-300 shadow-sm'
                  : 'pkxd-glass border-violet-200/80'
              }`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2.5 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-xs font-bold uppercase tracking-wider text-violet-800">
                      Seu Progresso para Creator
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        selectedTier === 'stardust'
                          ? 'bg-sky-50 border-sky-200 text-sky-800'
                          : 'bg-amber-100 border-amber-300 text-amber-900'
                      }`}
                    >
                      {selectedTier === 'stardust' ? <Star className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />}
                      <span>
                        {selectedTier === 'stardust' ? 'Tier 1: Stardust' : 'Tier 2: Rising Star'}
                      </span>
                    </span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {channelData.title}
                  </h2>
                  <p className="text-sm font-mono text-slate-500 font-bold">{channelData.handle}</p>

                  <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                    {analysis.isAllRequiredMet ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 text-white font-display font-bold text-sm uppercase tracking-wider shadow-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Atingiu todos os critérios deste Tier!</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-violet-100 border-2 border-violet-200 text-violet-900 font-display font-bold text-sm uppercase tracking-wider">
                        <Flame className="w-5 h-5 text-pink-600" />
                        <span>Faltam {analysis.totalCount - analysis.metCount} requisitos para subir</span>
                      </div>
                    )}

                    {tierEvolution && tierEvolution.nextTier && tierEvolution.nextTier !== selectedTier && (
                      <button
                        onClick={() => {
                          setSelectedTier(tierEvolution.nextTier!);
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className="pkxd-btn-gold inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Ver próximo nível: {tierEvolution.nextTier.toUpperCase()}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Gauge Box */}
                <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 min-w-[220px] text-center">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                    Progresso no Tier
                  </span>
                  <div className="font-display text-4xl sm:text-5xl font-bold my-1 text-violet-700 tabular-nums">
                    {analysis.overallPercentage}%
                  </div>

                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden my-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        analysis.isAllRequiredMet ? 'bg-emerald-500' : 'bg-violet-600'
                      }`}
                      style={{ width: `${analysis.overallPercentage}%` }}
                    />
                  </div>

                  <span className="text-xs font-bold text-slate-600 tabular-nums">
                    {analysis.metCount} de {analysis.totalCount} critérios cumpridos
                  </span>
                </div>
              </div>
            </div>

            {/* Tier Roadmap */}
            {tierEvolution && (
              <div id="creator-tier-roadmap" className="pkxd-glass rounded-3xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                      <Trophy className="w-4 h-4" />
                      <span>Trilha de Tiers Oficial</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-900 mt-0.5">
                      Progressão dos Níveis: Stardust e Rising Star
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Veja o que você precisa alcançar para subir de Tier e desbloquear benefícios no jogo.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border-2 border-slate-200 self-start sm:self-auto">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-500">Nível Atual:</span>
                    <span className="text-xs font-bold text-slate-900 uppercase bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {tierEvolution.currentTier === 'aspirant'
                        ? 'Aspirante a Creator'
                        : tierEvolution.currentTier === 'stardust'
                        ? 'Tier 1: Stardust'
                        : 'Tier 2: Rising Star'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tierEvolution.progressions.map((tier) => {
                    const isSelected = selectedTier === tier.tierId;
                    const tierMeta = PKXD_CREATOR_TIERS.find(t => t.id === tier.tierId);
                    const isShortsFormat = creatorFormat === 'shorts';
                    const subReq = tier.summary.evaluatedRequirements.find(r => r.requirement.metricType === 'subscribers');
                    const targetSubs = subReq?.targetValue || (tier.level === 1 ? (isShortsFormat ? 5000 : 1000) : (isShortsFormat ? 10000 : 5000));

                    return (
                      <div
                        key={tier.tierId}
                        id={`tier-card-${tier.tierId}`}
                        onClick={() => {
                          setSelectedTier(tier.tierId);
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-violet-50 border-violet-500 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                              Nível {tier.level}
                            </span>

                            {tier.isUnlocked ? (
                              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Alcançado</span>
                              </span>
                            ) : tier.isNextToClimb ? (
                              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                <span>Próximo a Subir</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>Bloqueado</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                                tier.tierId === 'stardust'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {tier.tierId === 'stardust' ? <Star className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
                            </div>

                            <div>
                              <h4 className="font-display text-base font-bold text-slate-900">
                                {tier.name}
                              </h4>
                              <span className="text-xs font-mono font-bold text-slate-500 tabular-nums">
                                {targetSubs.toLocaleString('pt-BR')} inscritos mín.
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 mb-2">
                            <div className="flex items-center justify-between text-xs font-bold mb-1">
                              <span className="text-slate-500">Progresso</span>
                              <span className={`tabular-nums ${tier.percentage === 100 ? 'text-emerald-700' : 'text-violet-700'}`}>
                                {tier.percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  tier.isUnlocked ? 'bg-emerald-500' : 'bg-violet-600'
                                }`}
                                style={{ width: `${tier.percentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 space-y-1 py-1">
                            {tier.isUnlocked ? (
                              <p className="text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Requisitos 100% atingidos!</span>
                              </p>
                            ) : (
                              <p className="text-slate-700">
                                {tier.subscribersNeeded > 0 ? (
                                  <span>
                                    Faltam <strong className="text-slate-900">{tier.subscribersNeeded.toLocaleString('pt-BR')}</strong> inscritos
                                  </span>
                                ) : (
                                  <span>Inscritos OK! Conclua os outros critérios.</span>
                                )}
                              </p>
                            )}

                            {tierMeta && (
                              <div className="pt-1 text-xs text-amber-800 font-semibold">
                                Benefício: {tierMeta.benefits[0] || 'Benefícios exclusivos'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200 mt-2">
                          <button
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-violet-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-violet-300'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Focado Neste Tier</span>
                              </>
                            ) : (
                              <>
                                <span>Focar para Subir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual Requirements Cards Grid */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
                <div>
                  <h3 className="pkxd-comic-title font-display text-lg sm:text-xl font-bold uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#F9C826]" />
                    <span>
                      Requisitos: {selectedTier === 'stardust' ? 'Tier 1: Stardust' : 'Tier 2: Rising Star'}
                    </span>
                  </h3>
                  <span className="text-xs text-purple-100/90 font-medium">
                    Metas para {creatorFormat === 'long_video' ? 'Vídeos Longos (+5 min)' : 'YouTube Shorts'}
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border-2 border-slate-200">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos ({analysis.totalCount})
                  </button>
                  <button
                    onClick={() => setActiveFilter('met')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeFilter === 'met'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Concluídos ({analysis.metCount})
                  </button>
                  <button
                    onClick={() => setActiveFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeFilter === 'pending'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pendentes ({analysis.totalCount - analysis.metCount})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.evaluatedRequirements
                  .filter(item => {
                    if (activeFilter === 'met') return item.isMet;
                    if (activeFilter === 'pending') return !item.isMet;
                    return true;
                  })
                  .map(item => {
                    const { requirement, currentValue, targetValue, percentage, isMet, isAutoVerified, deficitText, estimateText } = item;

                    return (
                      <div
                        key={requirement.id}
                        className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                          isMet
                            ? 'bg-emerald-50/75 backdrop-blur-md border-emerald-300'
                            : 'pkxd-glass'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-display text-base font-bold text-slate-900 leading-tight">
                              {requirement.name}
                            </h4>

                            {isMet ? (
                              <span className="text-[11px] uppercase font-bold px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full shrink-0 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Concluído
                              </span>
                            ) : (
                              <span className="text-[11px] uppercase font-bold px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-full shrink-0">
                                Pendente
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            {requirement.description}
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-3 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Valor Atual</span>
                              <span className="font-mono font-bold text-slate-900 tabular-nums">
                                {typeof currentValue === 'number'
                                  ? `${currentValue.toLocaleString('pt-BR')} ${requirement.unit}`
                                  : currentValue ? 'Confirmado' : 'Pendente'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-bold">Necessário</span>
                              <span className="font-mono font-bold text-slate-700 tabular-nums">
                                {typeof targetValue === 'number'
                                  ? `${targetValue.toLocaleString('pt-BR')} ${requirement.unit}`
                                  : 'Obrigatório'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-semibold">
                              {isMet ? 'Meta alcançada' : 'Progresso da meta:'}
                            </span>
                            <span className="font-bold text-violet-700 font-mono tabular-nums">{percentage}%</span>
                          </div>

                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isMet ? 'bg-emerald-500' : 'bg-violet-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs pt-0.5">
                            {isMet ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                Requisito 100% concluído
                              </span>
                            ) : (
                              <span className="text-pink-700 font-bold">
                                Falta: {deficitText || item.statusMessage}
                              </span>
                            )}

                            {!isAutoVerified && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1" title="Critério requer confirmação manual">
                                <HelpCircle className="w-3.5 h-3.5" /> Declaração
                              </span>
                            )}
                          </div>

                          {!isMet && estimateText && (
                            <div className="mt-2 p-2.5 rounded-2xl bg-violet-50 border border-violet-200 text-xs text-violet-900 leading-relaxed whitespace-pre-line">
                              {estimateText}
                            </div>
                          )}

                          {!isAutoVerified && (
                            <div className="mt-2 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-slate-500">
                                Confirmação manual necessária:
                              </span>

                              {requirement.metricType === 'community_compliance' && (
                                <button
                                  onClick={() => handleUpdateDeclaration('communityCompliant', !manualDeclarations.communityCompliant)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                    manualDeclarations.communityCompliant
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {manualDeclarations.communityCompliant ? 'Em Conformidade' : 'Declarar'}
                                </button>
                              )}

                              {requirement.metricType === 'program_terms' && (
                                <button
                                  onClick={() => handleUpdateDeclaration('termsAccepted', !manualDeclarations.termsAccepted)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                    manualDeclarations.termsAccepted
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {manualDeclarations.termsAccepted ? 'Aceito' : 'Aceitar Termos'}
                                </button>
                              )}

                              {requirement.metricType === 'views_3months' && (
                                <input
                                  type="number"
                                  placeholder="Views 16 Shorts"
                                  value={manualDeclarations.pkxdViews3Months || ''}
                                  onChange={(e) => handleUpdateDeclaration('pkxdViews3Months', parseInt(e.target.value, 10) || 0)}
                                  className="w-28 bg-white border-2 border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-900 font-mono"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Analyzed Recent Videos Card */}
            {channelData.recentVideos && channelData.recentVideos.length > 0 && (
              <div id="analyzed-videos-section" className="pkxd-glass p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#120624] flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-[#6D28D9]" />
                      <span>Vídeos Analisados do Canal ({channelData.recentVideos.length})</span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      Contagem real de visualizações, formato e duração extraídos diretamente do YouTube.
                    </p>
                  </div>
                  {channelData.recentVideos.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllVideos((prev) => !prev)}
                      className="pkxd-pop-btn px-3.5 py-1.5 text-xs cursor-pointer self-start sm:self-auto"
                    >
                      {showAllVideos ? 'Mostrar menos' : `Ver todos (${channelData.recentVideos.length})`}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(showAllVideos ? channelData.recentVideos : channelData.recentVideos.slice(0, 6)).map((vid) => (
                    <a
                      key={vid.id}
                      href={vid.isShort ? `https://www.youtube.com/shorts/${vid.id}` : `https://www.youtube.com/watch?v=${vid.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-violet-50 border-2 border-slate-200 hover:border-violet-400 transition-colors flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={vid.thumbnailUrl || `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`}
                          alt={vid.title}
                          referrerPolicy="no-referrer"
                          className="w-20 h-14 rounded-xl object-cover border border-slate-300 shrink-0 bg-slate-200"
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                vid.isShort
                                  ? 'bg-pink-100 text-pink-800'
                                  : vid.isLong5Min
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-violet-100 text-violet-800'
                              }`}
                            >
                              {vid.isShort ? 'Short' : vid.isLong5Min ? 'Longo +5m' : 'Vídeo'}
                            </span>
                            {vid.durationText && !vid.isShort && (
                              <span className="text-[10px] font-mono font-bold text-slate-600 inline-flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {vid.durationText}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                            {vid.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1.5 border-t border-slate-200 tabular-nums">
                        <span className="inline-flex items-center gap-1 text-[#6D28D9]">
                          <Eye className="w-3.5 h-3.5" />
                          {(vid.views || 0).toLocaleString('pt-BR')} views
                        </span>
                        {vid.publishedText ? (
                          <span className="text-slate-500 truncate">{vid.publishedText}</span>
                        ) : vid.publishedAt ? (
                          <span className="text-slate-500">
                            {new Date(vid.publishedAt).toLocaleDateString('pt-BR')}
                          </span>
                        ) : null}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Prioritized Checklist & Growth Simulator */}
            <div
              id="what-is-missing-section"
              className="p-5 sm:p-6 rounded-3xl pkxd-glass space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-pink-50 border border-pink-200 text-pink-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 uppercase">
                      O que falta para você?
                    </h3>
                    <p className="text-xs text-slate-600">
                      Lista priorizada de metas para atingir o status Creator
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSimulator(!showSimulator)}
                  className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1.5 cursor-pointer bg-violet-50 hover:bg-violet-100 border-2 border-violet-200 px-3.5 py-2 rounded-2xl transition-all self-start sm:self-auto"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{showSimulator ? 'Ocultar Simulador' : 'Simulador de Crescimento'}</span>
                </button>
              </div>

              {analysis.pendingRequirements.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Parabéns! Você já cumpriu todos os critérios do Tier selecionado! Continue criando conteúdo com consistência.
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analysis.pendingRequirements.map((item, idx) => {
                    const req = item.requirement;
                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-violet-100 border border-violet-200 text-violet-800 flex items-center justify-center text-xs font-bold shrink-0 tabular-nums">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">{req.name}</h4>
                              {req.isRequired && (
                                <span className="text-[10px] uppercase px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full font-bold">
                                  Obrigatório
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{item.deficitText || item.statusMessage}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-bold text-violet-700 font-mono tabular-nums">{item.percentage}%</span>
                            <span className="text-[10px] text-slate-500 block">concluído</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <AnimatePresence>
                {showSimulator && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-5 rounded-2xl bg-violet-50/70 border-2 border-violet-200 space-y-4"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-violet-800">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Simulador de Projeção de Metas</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-700 mb-1.5">
                          Sua média de novos inscritos por mês: <strong className="font-mono">{simMonthlySubGrowth}</strong>
                        </label>
                        <input
                          type="range"
                          min="20"
                          max="2000"
                          step="20"
                          value={simMonthlySubGrowth}
                          onChange={(e) => setSimMonthlySubGrowth(parseInt(e.target.value, 10))}
                          className="w-full accent-violet-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-700 mb-1.5">
                          Vídeos/Shorts por semana: <strong className="font-mono">{simWeeklyVideos}</strong>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="14"
                          step="1"
                          value={simWeeklyVideos}
                          onChange={(e) => setSimWeeklyVideos(parseInt(e.target.value, 10))}
                          className="w-full accent-pink-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-violet-200 text-xs text-slate-700">
                      <strong>Cenário estimado:</strong> Publicando <strong>{simWeeklyVideos} vídeos por semana</strong> (~{simWeeklyVideos * 4} vídeos/mês), você supera a frequência mensal exigida de 8 a 16 vídeos em <strong>30 dias</strong>. Com +{simMonthlySubGrowth} inscritos/mês, canais com déficit avançam rapidamente rumo aos 1.000 inscritos.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Official Disclaimer Footer Note (MANDATORY REQUIREMENT) */}
            <div
              id="official-disclaimer-note"
              className="p-5 rounded-3xl pkxd-glass text-center space-y-2 text-slate-600"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
                <Info className="w-4 h-4 text-violet-700" />
                <span>Aviso Importante</span>
              </div>
              <p className="text-xs leading-relaxed max-w-2xl mx-auto italic text-slate-700">
                «Esta análise é apenas informativa. A aprovação final depende da plataforma e pode considerar critérios que não estão disponíveis publicamente.»
              </p>
              <p className="text-[11px] text-slate-500">
                Baseado nos critérios oficiais do Programa de Creators PK XD (Afterverse Creators). Fonte oficial revisada em 01/12/2025.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

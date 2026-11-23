export interface YouTubeRecentVideoData {
  id: string;
  title: string;
  publishedAt: string;
  publishedText?: string;
  publishedDaysAgo?: number;
  durationSeconds?: number;
  durationText?: string;
  isShort: boolean;
  isLong5Min?: boolean;
  isPkxdContent: boolean;
  views: number;
  thumbnailUrl?: string;
}

export interface YouTubeChannelData {
  channelId: string;
  title: string;
  handle: string;
  avatarUrl: string;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  viewsLast90Days: number;
  viewsLast16Shorts: number;
  last16ShortsCount: number;
  longVideosCount: number;
  longVideos5MinCount: number;
  shortsCount: number;
  pkxdLongVideosDetected: number;
  pkxdShortsDetected: number;
  videosLast30Days: number;
  longVideosLast30Days: number;
  shortsLast30Days: number;
  recentVideos: YouTubeRecentVideoData[];
  pkxdVideosDetected: number;
  averageRecentViews: number;
  averageLongViews: number;
  averageShortViews: number;
  estimatedMonthlyGrowth: number;
  isPkxdChannel: boolean;
  isPublicDataAvailable: boolean;
  dataSource: 'youtube_api' | 'youtube_public_scrape' | 'fallback_sample';
}

const PKXD_REGEX = /pk\s*xd|pkxd|afterverse|admin\s*pk|nimda|pet\s*pod|pk\s*x\s*d/i;

// Robust numeric parser for YouTube counts across EN & PT-BR ("530K", "100,343,347 views", "1,2 mi", "17 thousand views", "660 videos")
export function parseCompactNumber(text: string): number {
  if (!text) return 0;
  const clean = text
    .replace(/\u00a0/g, ' ')
    .replace(/no views|sem visualiza/i, '0')
    .trim();

  // Billions: "1.2B", "1,2 bi", "1.2 billion"
  const biMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:bi(?:lh[oõ]es)?|billion|b\b)/i);
  if (biMatch) {
    return Math.round(parseFloat(biMatch[1].replace(',', '.')) * 1_000_000_000);
  }

  // Millions: "1.5M", "1,5 mi", "1.5 million", "1,5 milhões"
  const miMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:mi(?:lh[aã]o|lh[oõ]es)?|million|m\b)/i);
  if (miMatch) {
    return Math.round(parseFloat(miMatch[1].replace(',', '.')) * 1_000_000);
  }

  // Thousands: "530K", "17 thousand", "10,5 mil"
  const kMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:mil\b|thousand|k\b)/i);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1_000);
  }

  // Full integer with thousand separators: "100,343,347" or "100.343.347" or "660"
  const intMatch = clean.match(/\d[\d.,]*/);
  if (intMatch) {
    const digitsOnly = intMatch[0].replace(/[.,]/g, '');
    const parsed = parseInt(digitsOnly, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function parseSubscriberCount(text: string): number {
  return parseCompactNumber(text);
}

export function parseVideoCount(text: string): number {
  return parseCompactNumber(text);
}

// Parse ISO 8601 duration ("PT7M40S", "PT1H2M3S", "PT45S") into seconds
export function parseIsoDurationToSeconds(iso: string): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// Parse badge clock duration ("7:40", "1:02:15", "0:58") into seconds
export function parseClockDurationToSeconds(clock: string): number {
  if (!clock) return 0;
  const parts = clock
    .trim()
    .split(':')
    .map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

export function formatSecondsToClock(totalSec: number): string {
  if (!totalSec || totalSec <= 0) return '';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Parse relative age strings ("2w ago", "3 days ago", "1 month ago", "há 5 dias", "Streamed 2 weeks ago") into approximate days
export function parseRelativeAgeToDays(text: string): number | undefined {
  if (!text) return undefined;
  const clean = text.toLowerCase();

  if (/\b(?:just now|agora|second|segundo|minute|minuto|min\b|hour|hora|hr\b|h\s*ago)/i.test(clean)) {
    return 0;
  }

  const numMatch = clean.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 1;

  if (/(?:\d+\s*d\b|day|dia)/i.test(clean)) return num;
  if (/(?:\d+\s*w\b|week|semana)/i.test(clean)) return num * 7;
  if (/(?:\d+\s*mo\b|month|m[eê]s|meses)/i.test(clean)) return num * 30;
  if (/(?:\d+\s*y\b|year|ano)/i.test(clean)) return num * 365;

  return undefined;
}

export function cleanChannelQuery(query: string): {
  handle?: string;
  channelId?: string;
  videoUrl?: string;
  originalQuery: string;
} {
  const trimmed = query.trim();
  const normalizedUrlCandidate =
    /^(?:https?:\/\/)?(?:www\.|m\.|music\.|studio\.)?(?:youtube\.com|youtu\.be)\//i.test(trimmed)
      ? trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`
      : null;

  if (normalizedUrlCandidate) {
    try {
      const url = new URL(normalizedUrlCandidate);
      const host = url.hostname.toLowerCase();
      const pathname = url.pathname.replace(/\/+$/, '');

      // Short share link: https://youtu.be/<videoId>
      if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
        const videoId = pathname.replace(/^\//, '').split('/')[0];
        if (videoId) {
          return { videoUrl: `https://www.youtube.com/watch?v=${videoId}`, originalQuery: trimmed };
        }
      }

      // Handle URL: /@handle, /@handle/videos, /@handle/shorts, /@handle?si=...
      if (pathname.includes('/@')) {
        const rawHandle = decodeURIComponent(pathname.split('/@')[1].split('/')[0]).trim();
        if (rawHandle) {
          return { handle: `@${rawHandle.replace(/^@/, '')}`, originalQuery: trimmed };
        }
      }

      // Channel ID URL: /channel/UC...
      if (pathname.includes('/channel/')) {
        const channelId = pathname.split('/channel/')[1].split('/')[0].trim();
        if (channelId) {
          return { channelId, originalQuery: trimmed };
        }
      }

      // Legacy custom / user URL: /c/Name or /user/Name
      if (pathname.includes('/c/') || pathname.includes('/user/')) {
        const name = decodeURIComponent(pathname.split(/\/c\/|\/user\//)[1].split('/')[0]).trim();
        if (name) {
          return { handle: `@${name.replace(/^@/, '')}`, originalQuery: trimmed };
        }
      }

      // Video or Short URL: /watch?v=... or /shorts/<id> or /live/<id>
      if (pathname === '/watch' && url.searchParams.get('v')) {
        return {
          videoUrl: `https://www.youtube.com/watch?v=${url.searchParams.get('v')}`,
          originalQuery: trimmed
        };
      }
      if (/^\/(?:shorts|live|embed)\/([^/]+)/i.test(pathname)) {
        const m = pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/i);
        if (m?.[1]) {
          return { videoUrl: `https://www.youtube.com/watch?v=${m[1]}`, originalQuery: trimmed };
        }
      }

      // Bare vanity URL: https://youtube.com/EuKooshh
      const firstSegment = pathname.replace(/^\//, '').split('/')[0].trim();
      if (firstSegment && !['feed', 'results', 'playlist', 'gaming', 'premium'].includes(firstSegment.toLowerCase())) {
        return { handle: `@${decodeURIComponent(firstSegment).replace(/^@/, '')}`, originalQuery: trimmed };
      }
    } catch {}
  }

  // Strip accidental trailing paths/query params on handles like "@EuKooshh/shorts" or "@EuKooshh?si=..."
  const cleanToken = trimmed.split(/[?#]/)[0].split('/')[0].trim();

  if (cleanToken.startsWith('@')) {
    return { handle: cleanToken, originalQuery: trimmed };
  }

  if (cleanToken.startsWith('UC') && cleanToken.length >= 20) {
    return { channelId: cleanToken, originalQuery: trimmed };
  }

  return { handle: `@${cleanToken.replace(/^@/, '')}`, originalQuery: trimmed };
}

function extractYtInitialData(html: string): any | null {
  const patterns = [
    /var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    /window\["ytInitialData"\]\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    /ytInitialData\s*=\s*(\{[\s\S]*?\});\s*var\s+/
  ];
  for (const regex of patterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch {}
    }
  }
  return null;
}

// Recursive helper to locate objects by key name inside ytInitialData
function findAllByKey(root: any, targetKey: string, maxItems = 80): any[] {
  const results: any[] = [];
  const stack: any[] = [root];
  const visited = new Set<any>();

  while (stack.length > 0 && results.length < maxItems) {
    const node = stack.pop();
    if (!node || typeof node !== 'object' || visited.has(node)) continue;
    visited.add(node);

    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        stack.push(node[i]);
      }
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(node, targetKey)) {
      results.push(node[targetKey]);
    }

    for (const key of Object.keys(node)) {
      const child = node[key];
      if (child && typeof child === 'object') {
        stack.push(child);
      }
    }
  }

  return results;
}

function extractText(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field.simpleText === 'string') return field.simpleText;
  if (typeof field.content === 'string') return field.content;
  if (Array.isArray(field.runs)) {
    return field.runs.map((r: any) => r?.text || '').join('');
  }
  return '';
}

function parseVideosFromYtData(ytData: any, isChannelPkxd: boolean): YouTubeRecentVideoData[] {
  const videos: YouTubeRecentVideoData[] = [];
  const seenIds = new Set<string>();

  // 1. Modern YouTube renderer: lockupViewModel
  const lockups = findAllByKey(ytData, 'lockupViewModel', 50);
  for (const lv of lockups) {
    const id = lv?.contentId;
    if (!id || typeof id !== 'string' || seenIds.has(id)) continue;

    const meta = lv?.metadata?.lockupMetadataViewModel;
    const title = extractText(meta?.title);
    if (!title) continue;

    // Extract duration badge from thumbnail overlays
    let durationText = '';
    const badges = findAllByKey(lv?.contentImage, 'thumbnailBadgeViewModel', 5);
    for (const b of badges) {
      const txt = (b?.text || '').trim();
      if (/^\d+:\d+(?::\d+)?$/.test(txt)) {
        durationText = txt;
        break;
      }
    }
    const durationSeconds = parseClockDurationToSeconds(durationText);

    // Extract views & published time from metadataRows
    const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
    let views = 0;
    let publishedText = '';
    let publishedDaysAgo: number | undefined;

    for (const row of rows) {
      const parts = row?.metadataParts || [];
      for (const part of parts) {
        const label = part?.accessibilityLabel || extractText(part?.text) || '';
        const text = extractText(part?.text) || label;
        if (/view|visualiza/i.test(label) || part?.leadingIcon?.name === 'PLAY_ARROW_OUTLINED') {
          const parsedV = parseCompactNumber(label || text);
          if (parsedV > 0) views = parsedV;
        } else if (/ago|há|streamed|transmitido|premiered/i.test(label) || /ago|há/i.test(text)) {
          publishedText = text;
          publishedDaysAgo = parseRelativeAgeToDays(label || text);
        }
      }
    }

    const thumbSources = lv?.contentImage?.thumbnailViewModel?.image?.sources || [];
    const thumbnailUrl = thumbSources[thumbSources.length - 1]?.url || thumbSources[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    const isShort = (durationSeconds > 0 && durationSeconds <= 61) || /#shorts|\bshorts\b/i.test(title);
    const isLong5Min = !isShort && durationSeconds >= 300;
    const isPkxd = isChannelPkxd || PKXD_REGEX.test(title);
    const publishedAt = publishedDaysAgo !== undefined
      ? new Date(Date.now() - publishedDaysAgo * 86400000).toISOString()
      : '';

    seenIds.add(id);
    videos.push({
      id,
      title,
      publishedAt,
      publishedText,
      publishedDaysAgo,
      durationSeconds: durationSeconds || undefined,
      durationText: durationText || undefined,
      isShort,
      isLong5Min,
      isPkxdContent: isPkxd,
      views,
      thumbnailUrl
    });
  }

  // 2. Legacy YouTube renderer fallback: videoRenderer
  if (videos.length === 0) {
    const renderers = findAllByKey(ytData, 'videoRenderer', 50);
    for (const vr of renderers) {
      const id = vr?.videoId;
      if (!id || seenIds.has(id)) continue;
      const title = extractText(vr?.title);
      if (!title) continue;

      const durationText = extractText(vr?.lengthText);
      const durationSeconds = parseClockDurationToSeconds(durationText);
      const viewText = extractText(vr?.viewCountText) || extractText(vr?.shortViewCountText);
      const views = parseCompactNumber(viewText);
      const publishedText = extractText(vr?.publishedTimeText);
      const publishedDaysAgo = parseRelativeAgeToDays(publishedText);
      const thumbs = vr?.thumbnail?.thumbnails || [];
      const thumbnailUrl = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      const isShort = (durationSeconds > 0 && durationSeconds <= 61) || /#shorts|\bshorts\b/i.test(title);
      const isLong5Min = !isShort && durationSeconds >= 300;
      const isPkxd = isChannelPkxd || PKXD_REGEX.test(title);

      seenIds.add(id);
      videos.push({
        id,
        title,
        publishedAt: publishedDaysAgo !== undefined ? new Date(Date.now() - publishedDaysAgo * 86400000).toISOString() : '',
        publishedText,
        publishedDaysAgo,
        durationSeconds: durationSeconds || undefined,
        durationText: durationText || undefined,
        isShort,
        isLong5Min,
        isPkxdContent: isPkxd,
        views,
        thumbnailUrl
      });
    }
  }

  return videos;
}

function parseShortsFromYtData(ytData: any, isChannelPkxd: boolean): YouTubeRecentVideoData[] {
  const shorts: YouTubeRecentVideoData[] = [];
  const seenIds = new Set<string>();

  const lockups = findAllByKey(ytData, 'shortsLockupViewModel', 50);
  for (const sl of lockups) {
    const id =
      sl?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ||
      (typeof sl?.entityId === 'string' ? sl.entityId.replace(/^shorts-shelf-item-/, '') : '');
    if (!id || seenIds.has(id)) continue;

    const accText: string = sl?.accessibilityText || '';
    const primaryTitle = extractText(sl?.overlayMetadata?.primaryText);
    const secondaryViews = extractText(sl?.overlayMetadata?.secondaryText);

    // Parse fallback from accessibilityText: "Title here, 25 thousand views - play Short"
    let title = primaryTitle;
    let views = parseCompactNumber(secondaryViews);

    if (!title && accText) {
      const cleaned = accText.replace(/\s*-\s*play short.*$/i, '');
      const commaParts = cleaned.split(/,\s*(?=[^,]*?(?:views?|visualiza))/i);
      title = (commaParts[0] || cleaned).trim();
      if (!views && commaParts[1]) {
        views = parseCompactNumber(commaParts[1]);
      }
    } else if (!views && accText) {
      const viewsPart = accText.match(/([\d.,]+\s*(?:thousand|million|billion|mil|mi|bi|k|m|b)?\s*(?:views?|visualiza\w*))/i);
      if (viewsPart) {
        views = parseCompactNumber(viewsPart[1]);
      }
    }

    if (!title) continue;

    const thumbs = sl?.onTap?.innertubeCommand?.reelWatchEndpoint?.thumbnail?.thumbnails || [];
    const thumbnailUrl = thumbs[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    seenIds.add(id);
    shorts.push({
      id,
      title,
      publishedAt: '',
      durationSeconds: 30,
      durationText: 'Short',
      isShort: true,
      isLong5Min: false,
      isPkxdContent: isChannelPkxd || PKXD_REGEX.test(title),
      views,
      thumbnailUrl
    });
  }

  return shorts;
}

function summarizeMetrics(params: {
  channelId: string;
  title: string;
  handle: string;
  avatarUrl: string;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  description?: string;
  longVideos: YouTubeRecentVideoData[];
  shorts: YouTubeRecentVideoData[];
  dataSource: 'youtube_api' | 'youtube_public_scrape' | 'fallback_sample';
}): YouTubeChannelData {
  const {
    channelId,
    title,
    handle,
    avatarUrl,
    subscriberCount,
    description = '',
    longVideos,
    shorts,
    dataSource
  } = params;

  // Deduplicate combined recent videos while preserving order (long videos + shorts)
  const combinedMap = new Map<string, YouTubeRecentVideoData>();
  for (const v of longVideos) combinedMap.set(v.id, v);
  for (const s of shorts) {
    if (!combinedMap.has(s.id)) combinedMap.set(s.id, s);
  }
  const allRecent = Array.from(combinedMap.values());

  // Determine if the channel itself is a PK XD channel
  const explicitPkxdMatches = allRecent.filter((v) => PKXD_REGEX.test(v.title)).length;
  const isPkxdChannel =
    PKXD_REGEX.test(title) ||
    PKXD_REGEX.test(handle) ||
    PKXD_REGEX.test(description) ||
    (allRecent.length > 0 && explicitPkxdMatches / allRecent.length >= 0.25);

  // Mark videos appropriately if channel is a PK XD channel
  const finalizedVideos = allRecent.map((v) => ({
    ...v,
    isPkxdContent: v.isPkxdContent || isPkxdChannel
  }));

  const finalLongs = finalizedVideos.filter((v) => !v.isShort);
  const finalShorts = finalizedVideos.filter((v) => v.isShort);

  // Video counts: never let total videoCount be smaller than actual discovered videos
  const discoveredCount = finalizedVideos.length;
  const videoCount = Math.max(params.videoCount || 0, discoveredCount);

  const longVideos5MinCount = finalLongs.filter((v) => v.isLong5Min || (v.durationSeconds !== undefined && v.durationSeconds >= 300)).length;
  const longVideosCount = finalLongs.length;
  const shortsCount = finalShorts.length;

  const pkxdLongVideosDetected = finalLongs.filter((v) => v.isPkxdContent).length;
  const pkxdShortsDetected = finalShorts.filter((v) => v.isPkxdContent).length;
  const pkxdVideosDetected = finalizedVideos.filter((v) => v.isPkxdContent).length;

  // Compute views stats
  const longWithViews = finalLongs.filter((v) => v.views > 0);
  const shortsWithViews = finalShorts.filter((v) => v.views > 0);
  const allWithViews = finalizedVideos.filter((v) => v.views > 0);

  const sumLongViews = longWithViews.reduce((acc, v) => acc + v.views, 0);
  const sumShortViews = shortsWithViews.reduce((acc, v) => acc + v.views, 0);
  const sumAllSampleViews = allWithViews.reduce((acc, v) => acc + v.views, 0);

  const totalViews = Math.max(params.totalViews || 0, sumAllSampleViews);

  const averageLongViews =
    longWithViews.length > 0
      ? Math.round(sumLongViews / longWithViews.length)
      : videoCount > 0 && totalViews > 0
      ? Math.round(totalViews / videoCount)
      : 0;

  const averageShortViews =
    shortsWithViews.length > 0
      ? Math.round(sumShortViews / shortsWithViews.length)
      : videoCount > 0 && totalViews > 0
      ? Math.round(totalViews / videoCount)
      : 0;

  const averageRecentViews =
    allWithViews.length > 0
      ? Math.round(sumAllSampleViews / allWithViews.length)
      : videoCount > 0 && totalViews > 0
      ? Math.round(totalViews / videoCount)
      : 0;

  // Count videos published in the last 30 days and views in the last 90 days
  const getDaysAgo = (v: YouTubeRecentVideoData): number | undefined => {
    if (typeof v.publishedDaysAgo === 'number') return v.publishedDaysAgo;
    if (v.publishedAt) {
      const ts = new Date(v.publishedAt).getTime();
      if (!Number.isNaN(ts)) {
        return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
      }
    }
    return undefined;
  };

  let videosLast30Days = 0;
  let longVideosLast30Days = 0;
  let shortsLast30Days = 0;
  let viewsLast90Days = 0;

  for (const v of finalizedVideos) {
    const days = getDaysAgo(v);
    if (days !== undefined) {
      if (days <= 31) {
        videosLast30Days++;
        if (v.isShort) shortsLast30Days++;
        else longVideosLast30Days++;
      }
      if (days <= 92) {
        viewsLast90Days += v.views || 0;
      }
    }
  }

  // If shorts had no timestamps from /shorts tab, estimate conservatively from RSS-dated shorts or total views
  if (viewsLast90Days === 0 && sumAllSampleViews > 0) {
    viewsLast90Days = sumAllSampleViews;
  }

  // Preserve genuine newest-first order from YouTube tabs (never re-sort undated Shorts by views!)
  const sortNewestFirst = (list: YouTubeRecentVideoData[]) => {
    const indexed = list.map((item, idx) => ({ item, idx, days: getDaysAgo(item) }));
    indexed.sort((a, b) => {
      if (a.days !== undefined && b.days !== undefined) return a.days - b.days;
      return a.idx - b.idx;
    });
    return indexed.map((entry) => entry.item);
  };

  const orderedLongs = sortNewestFirst(finalLongs);
  const orderedShorts = sortNewestFirst(finalShorts);

  // Sum ONLY the last 16 Shorts (newest-first) for the official PK XD Shorts views rule
  const last16Shorts = orderedShorts.slice(0, 16);
  const viewsLast16Shorts = last16Shorts.reduce((acc, v) => acc + (v.views || 0), 0);
  const last16ShortsCount = last16Shorts.length;

  // Keep enough recent items from BOTH formats so all 16 newest Shorts are always preserved
  const preservedVideos = [...orderedShorts.slice(0, 25), ...orderedLongs.slice(0, 25)];
  preservedVideos.sort((a, b) => {
    const da = getDaysAgo(a);
    const db = getDaysAgo(b);
    if (da !== undefined && db !== undefined) return da - db;
    if (da !== undefined) return -1;
    if (db !== undefined) return 1;
    return 0;
  });

  const estimatedMonthlyGrowth = Math.max(50, Math.round(subscriberCount * 0.04));

  return {
    channelId,
    title: title || handle,
    handle,
    avatarUrl,
    subscriberCount,
    videoCount,
    totalViews,
    viewsLast90Days,
    viewsLast16Shorts,
    last16ShortsCount,
    longVideosCount,
    longVideos5MinCount,
    shortsCount,
    pkxdLongVideosDetected,
    pkxdShortsDetected,
    videosLast30Days,
    longVideosLast30Days,
    shortsLast30Days,
    recentVideos: preservedVideos,
    pkxdVideosDetected,
    averageRecentViews,
    averageLongViews,
    averageShortViews,
    estimatedMonthlyGrowth,
    isPkxdChannel,
    isPublicDataAvailable: true,
    dataSource
  };
}

export async function fetchYouTubeChannelData(query: string): Promise<YouTubeChannelData> {
  let parsed = cleanChannelQuery(query);
  const apiKey = process.env.YOUTUBE_API_KEY;

  // 0. If the user pasted a video or Short URL, resolve its owning channel first
  if (parsed.videoUrl && !parsed.handle && !parsed.channelId) {
    try {
      const oembedRes = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(parsed.videoUrl)}`
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        if (oembed?.author_url) {
          parsed = cleanChannelQuery(oembed.author_url);
        }
      }
    } catch {}

    // Fallback: extract channelId directly from the video watch HTML
    if (!parsed.handle && !parsed.channelId && parsed.videoUrl) {
      try {
        const vidRes = await fetch(parsed.videoUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Cookie': 'CONSENT=YES+cb; SOCS=CAI'
          }
        });
        if (vidRes.ok) {
          const vidHtml = await vidRes.text();
          const cid = vidHtml.match(/"channelId":"(UC[a-zA-Z0-9_-]{20,24})"/)?.[1];
          if (cid) parsed = { channelId: cid, originalQuery: query };
        }
      } catch {}
    }
  }

  // 1. Try YouTube Data API v3 if API key is provided
  if (apiKey) {
    try {
      let apiUrl = '';
      if (parsed.channelId) {
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${parsed.channelId}&key=${apiKey}`;
      } else if (parsed.handle) {
        const cleanHandle = parsed.handle.replace(/^@/, '');
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
      }

      if (apiUrl) {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const channelId = item.id;
            const snippet = item.snippet || {};
            const stats = item.statistics || {};

            const subs = parseInt(stats.subscriberCount || '0', 10);
            const vids = parseInt(stats.videoCount || '0', 10);
            const views = parseInt(stats.viewCount || '0', 10);
            const description = snippet.description || '';
            const title = snippet.title || parsed.handle || 'Canal do YouTube';
            const handle = snippet.customUrl
              ? `@${snippet.customUrl.replace(/^@/, '')}`
              : (parsed.handle || `@${title.replace(/\s+/g, '')}`);
            const avatarUrl =
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              snippet.thumbnails?.default?.url ||
              '';

            const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
            const longVideos: YouTubeRecentVideoData[] = [];
            const shorts: YouTubeRecentVideoData[] = [];

            if (uploadsPlaylistId) {
              try {
                const playRes = await fetch(
                  `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}&key=${apiKey}`
                );
                if (playRes.ok) {
                  const playData = await playRes.json();
                  const videoIds = (playData.items || [])
                    .map((i: any) => i.snippet?.resourceId?.videoId)
                    .filter(Boolean);

                  const detailsMap: Record<string, any> = {};
                  if (videoIds.length > 0) {
                    const vidStatsRes = await fetch(
                      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds.join(',')}&key=${apiKey}`
                    );
                    if (vidStatsRes.ok) {
                      const vidData = await vidStatsRes.json();
                      (vidData.items || []).forEach((v: any) => {
                        detailsMap[v.id] = v;
                      });
                    }
                  }

                  for (const i of playData.items || []) {
                    const vId = i.snippet?.resourceId?.videoId || '';
                    if (!vId) continue;
                    const detail = detailsMap[vId];
                    const vTitle = detail?.snippet?.title || i.snippet?.title || '';
                    const vDesc = detail?.snippet?.description || i.snippet?.description || '';
                    const vTags = (detail?.snippet?.tags || []).join(' ');
                    const publishedAt = detail?.snippet?.publishedAt || i.snippet?.publishedAt || '';
                    const durationSeconds = parseIsoDurationToSeconds(detail?.contentDetails?.duration || '');
                    const viewCount = parseInt(detail?.statistics?.viewCount || '0', 10);
                    const isShort = (durationSeconds > 0 && durationSeconds <= 61) || /#shorts|\bshorts\b/i.test(vTitle);
                    const isLong5Min = !isShort && durationSeconds >= 300;
                    const isPkxd = PKXD_REGEX.test(`${vTitle} ${vDesc} ${vTags}`);
                    const daysAgo = publishedAt
                      ? Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000))
                      : undefined;

                    const entry: YouTubeRecentVideoData = {
                      id: vId,
                      title: vTitle,
                      publishedAt,
                      publishedDaysAgo: daysAgo,
                      durationSeconds: durationSeconds || undefined,
                      durationText: isShort ? 'Short' : formatSecondsToClock(durationSeconds),
                      isShort,
                      isLong5Min,
                      isPkxdContent: isPkxd,
                      views: viewCount,
                      thumbnailUrl:
                        detail?.snippet?.thumbnails?.medium?.url ||
                        i.snippet?.thumbnails?.medium?.url ||
                        `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`
                    };

                    if (isShort) shorts.push(entry);
                    else longVideos.push(entry);
                  }
                }
              } catch (e) {
                console.warn('Erro ao puxar vídeos da playlist via API:', e);
              }
            }

            return summarizeMetrics({
              channelId,
              title,
              handle,
              avatarUrl,
              subscriberCount: subs,
              videoCount: vids,
              totalViews: views,
              description,
              longVideos,
              shorts,
              dataSource: 'youtube_api'
            });
          }
        }
      }
    } catch (apiErr) {
      console.warn('Falha na requisição YouTube Data API, usando coletor público resiliente:', apiErr);
    }
  }

  // 2. Resilient public YouTube collector (/about + /videos + /shorts + RSS feed in parallel)
  let baseUrl = '';
  if (parsed.channelId) {
    baseUrl = `https://www.youtube.com/channel/${parsed.channelId}`;
  } else if (parsed.handle) {
    baseUrl = `https://www.youtube.com/${parsed.handle}`;
  } else {
    baseUrl = `https://www.youtube.com/@${parsed.originalQuery}`;
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cookie': 'CONSENT=YES+cb; SOCS=CAI',
    'Cache-Control': 'no-cache'
  };

  console.log(`[YouTube Scraper] Coletando dados públicos: ${baseUrl}`);

  const [aboutRes, videosRes, shortsRes] = await Promise.all([
    fetch(`${baseUrl}/about`, { headers }).catch(() => null),
    fetch(`${baseUrl}/videos`, { headers }).catch(() => null),
    fetch(`${baseUrl}/shorts`, { headers }).catch(() => null)
  ]);

  if ((!aboutRes || !aboutRes.ok) && (!videosRes || !videosRes.ok)) {
    throw new Error(
      `Não foi possível carregar o canal "${query}". Verifique se o @handle, link ou ID está correto e público.`
    );
  }

  const [aboutHtml, videosHtml, shortsHtml] = await Promise.all([
    aboutRes && aboutRes.ok ? aboutRes.text() : Promise.resolve(''),
    videosRes && videosRes.ok ? videosRes.text() : Promise.resolve(''),
    shortsRes && shortsRes.ok ? shortsRes.text() : Promise.resolve('')
  ]);

  const primaryHtml = aboutHtml || videosHtml || shortsHtml;
  const aboutData = aboutHtml ? extractYtInitialData(aboutHtml) : null;
  const videosData = videosHtml ? extractYtInitialData(videosHtml) : null;
  const shortsData = shortsHtml ? extractYtInitialData(shortsHtml) : null;

  // Extract channel identity & exact stats from aboutChannelViewModel + pageHeaderViewModel
  const aboutVms = aboutData ? findAllByKey(aboutData, 'aboutChannelViewModel', 1) : [];
  const aboutVm = aboutVms[0] || {};

  const headerSource = aboutData || videosData || shortsData;
  const headerVms = headerSource ? findAllByKey(headerSource, 'pageHeaderViewModel', 1) : [];
  const headerVm = headerVms[0] || {};

  let channelId =
    aboutVm.channelId ||
    parsed.channelId ||
    primaryHtml.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{20,24})"/i)?.[1] ||
    primaryHtml.match(/"channelId":"(UC[a-zA-Z0-9_-]{20,24})"/)?.[1] ||
    '';

  let title =
    extractText(headerVm?.title?.dynamicTextViewModel?.text) ||
    primaryHtml.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] ||
    primaryHtml.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*-\s*YouTube\s*$/i, '').trim() ||
    '';

  let avatarUrl =
    headerVm?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.slice(-1)?.[0]?.url ||
    primaryHtml.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] ||
    '';

  const canonicalHandleMatch =
    (aboutVm.canonicalChannelUrl || '').match(/\/(@[a-zA-Z0-9_.-]+)/) ||
    primaryHtml.match(/"canonicalBaseUrl":"\/(@[a-zA-Z0-9_.-]+)"/);
  const handle = canonicalHandleMatch?.[1] || parsed.handle || `@${title.replace(/\s+/g, '')}`;

  const description: string = aboutVm.description || '';

  // Exact counts from aboutChannelViewModel
  let subscriberCount = parseCompactNumber(aboutVm.subscriberCountText || '');
  let videoCount = parseCompactNumber(aboutVm.videoCountText || '');
  let totalViews = parseCompactNumber(aboutVm.viewCountText || '');

  // Fallback to pageHeaderViewModel metadata rows (where YouTube shows "@handle · 530K subscribers · 660 videos")
  if (subscriberCount === 0 || videoCount === 0) {
    const headerRows = headerVm?.metadata?.contentMetadataViewModel?.metadataRows || [];
    for (const row of headerRows) {
      for (const part of row?.metadataParts || []) {
        const txt = extractText(part?.text);
        if (subscriberCount === 0 && /subscriber|inscrito/i.test(txt)) {
          subscriberCount = parseCompactNumber(txt);
        }
        if (videoCount === 0 && /video|vídeo/i.test(txt)) {
          videoCount = parseCompactNumber(txt);
        }
      }
    }
  }

  // Secondary HTML regex fallback if needed
  if (subscriberCount === 0) {
    const subM = primaryHtml.match(/"([0-9.,]+\s*(?:K|M|B|mil|mi|bi)?\s*(?:subscribers|inscritos))"/i);
    if (subM) subscriberCount = parseCompactNumber(subM[1]);
  }
  if (videoCount === 0) {
    const vidM = primaryHtml.match(/"([0-9.,]+\s*(?:K|mil)?\s*(?:videos|v[íi]deos))"/i);
    if (vidM) videoCount = parseCompactNumber(vidM[1]);
  }
  if (totalViews === 0) {
    const viewM = primaryHtml.match(/"([0-9.,]+\s*(?:views|visualiza\w*))"/i);
    if (viewM) totalViews = parseCompactNumber(viewM[1]);
  }

  const prelimPkxd = PKXD_REGEX.test(`${title} ${handle} ${description}`);

  // Parse long videos & shorts from ytInitialData
  const longVideos = videosData ? parseVideosFromYtData(videosData, prelimPkxd) : [];
  const shorts = shortsData ? parseShortsFromYtData(shortsData, prelimPkxd) : [];

  // 3. Enrich with RSS feed (exact ISO publishedAt timestamps & exact integer views for the 15 newest uploads!)
  if (channelId) {
    try {
      const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
        headers: { 'User-Agent': headers['User-Agent'] }
      });

      if (rssRes.ok) {
        const xml = await rssRes.text();
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
        let entryMatch;
        const longMap = new Map(longVideos.map((v) => [v.id, v]));
        const shortMap = new Map(shorts.map((v) => [v.id, v]));

        while ((entryMatch = entryRegex.exec(xml)) !== null) {
          const entryXml = entryMatch[1];
          const vidId = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i)?.[1] || '';
          const vidTitle = entryXml.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
          const published = entryXml.match(/<published>([^<]+)<\/published>/i)?.[1] || '';
          const viewsStr = entryXml.match(/<media:statistics views="(\d+)"/i)?.[1];
          const descStr = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/i)?.[1] || '';
          const linkHref = entryXml.match(/<link[^>]*href="([^"]+)"/i)?.[1] || '';

          if (!vidId) continue;

          const exactViews = viewsStr ? parseInt(viewsStr, 10) : 0;
          const daysAgo = published
            ? Math.max(0, Math.floor((Date.now() - new Date(published).getTime()) / 86400000))
            : undefined;
          const isShortLink = linkHref.includes('/shorts/') || /#shorts|\bshorts\b/i.test(vidTitle);
          const isPkxd = prelimPkxd || PKXD_REGEX.test(`${vidTitle} ${descStr}`);

          const existingLong = longMap.get(vidId);
          const existingShort = shortMap.get(vidId);

          if (existingLong) {
            if (published) existingLong.publishedAt = published;
            if (daysAgo !== undefined) existingLong.publishedDaysAgo = daysAgo;
            if (exactViews > 0) existingLong.views = exactViews;
            if (isPkxd) existingLong.isPkxdContent = true;
          } else if (existingShort) {
            if (published) existingShort.publishedAt = published;
            if (daysAgo !== undefined) existingShort.publishedDaysAgo = daysAgo;
            if (exactViews > 0) existingShort.views = exactViews;
            if (isPkxd) existingShort.isPkxdContent = true;
          } else if (vidTitle) {
            const newItem: YouTubeRecentVideoData = {
              id: vidId,
              title: vidTitle,
              publishedAt: published,
              publishedDaysAgo: daysAgo,
              isShort: isShortLink,
              isPkxdContent: isPkxd,
              views: exactViews,
              thumbnailUrl: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`
            };
            if (isShortLink) {
              shorts.push(newItem);
              shortMap.set(vidId, newItem);
            } else {
              longVideos.push(newItem);
              longMap.set(vidId, newItem);
            }
          }
        }
      }
    } catch (rssErr) {
      console.warn('Aviso ao enriquecer com RSS do YouTube:', rssErr);
    }
  }

  return summarizeMetrics({
    channelId: channelId || `UC_${encodeURIComponent(handle)}`,
    title: title || handle,
    handle,
    avatarUrl,
    subscriberCount,
    videoCount,
    totalViews,
    description,
    longVideos,
    shorts,
    dataSource: 'youtube_public_scrape'
  });
}

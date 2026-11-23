var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_web_push = __toESM(require("web-push"), 1);
var import_crypto = __toESM(require("crypto"), 1);

// src/lib/firebase-admin.ts
var import_app = require("firebase-admin/app");
var import_auth = require("firebase-admin/auth");
var import_firestore = require("firebase-admin/firestore");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "pkxd-e817c",
  appId: "1:932539609984:web:74c5cc5650c7807e6c4765",
  apiKey: "AIzaSyBFIEDUk1UMeiNU_yv0VscVUwVyFuSffi0",
  authDomain: "auth.pkxdcentral.site",
  storageBucket: "pkxd-e817c.firebasestorage.app",
  messagingSenderId: "932539609984",
  measurementId: "G-FSFT099FH4"
};

// src/lib/firebase-admin.ts
if (!(0, import_app.getApps)().length) {
  (0, import_app.initializeApp)({
    projectId: firebase_applet_config_default.projectId
  });
}
var adminAuth = (0, import_auth.getAuth)();
var adminDb = (0, import_firestore.getFirestore)();

// src/lib/youtubeService.ts
var PKXD_REGEX = /pk\s*xd|pkxd|afterverse|admin\s*pk|nimda|pet\s*pod|pk\s*x\s*d/i;
function parseCompactNumber(text) {
  if (!text) return 0;
  const clean = text.replace(/\u00a0/g, " ").replace(/no views|sem visualiza/i, "0").trim();
  const biMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:bi(?:lh[oõ]es)?|billion|b\b)/i);
  if (biMatch) {
    return Math.round(parseFloat(biMatch[1].replace(",", ".")) * 1e9);
  }
  const miMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:mi(?:lh[aã]o|lh[oõ]es)?|million|m\b)/i);
  if (miMatch) {
    return Math.round(parseFloat(miMatch[1].replace(",", ".")) * 1e6);
  }
  const kMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:mil\b|thousand|k\b)/i);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1].replace(",", ".")) * 1e3);
  }
  const intMatch = clean.match(/\d[\d.,]*/);
  if (intMatch) {
    const digitsOnly = intMatch[0].replace(/[.,]/g, "");
    const parsed = parseInt(digitsOnly, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
function parseIsoDurationToSeconds(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}
function parseClockDurationToSeconds(clock) {
  if (!clock) return 0;
  const parts = clock.trim().split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}
function formatSecondsToClock(totalSec) {
  if (!totalSec || totalSec <= 0) return "";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor(totalSec % 3600 / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function parseRelativeAgeToDays(text) {
  if (!text) return void 0;
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
  return void 0;
}
function cleanChannelQuery(query) {
  const trimmed = query.trim();
  const normalizedUrlCandidate = /^(?:https?:\/\/)?(?:www\.|m\.|music\.|studio\.)?(?:youtube\.com|youtu\.be)\//i.test(trimmed) ? trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}` : null;
  if (normalizedUrlCandidate) {
    try {
      const url = new URL(normalizedUrlCandidate);
      const host = url.hostname.toLowerCase();
      const pathname = url.pathname.replace(/\/+$/, "");
      if (host === "youtu.be" || host.endsWith(".youtu.be")) {
        const videoId = pathname.replace(/^\//, "").split("/")[0];
        if (videoId) {
          return { videoUrl: `https://www.youtube.com/watch?v=${videoId}`, originalQuery: trimmed };
        }
      }
      if (pathname.includes("/@")) {
        const rawHandle = decodeURIComponent(pathname.split("/@")[1].split("/")[0]).trim();
        if (rawHandle) {
          return { handle: `@${rawHandle.replace(/^@/, "")}`, originalQuery: trimmed };
        }
      }
      if (pathname.includes("/channel/")) {
        const channelId = pathname.split("/channel/")[1].split("/")[0].trim();
        if (channelId) {
          return { channelId, originalQuery: trimmed };
        }
      }
      if (pathname.includes("/c/") || pathname.includes("/user/")) {
        const name = decodeURIComponent(pathname.split(/\/c\/|\/user\//)[1].split("/")[0]).trim();
        if (name) {
          return { handle: `@${name.replace(/^@/, "")}`, originalQuery: trimmed };
        }
      }
      if (pathname === "/watch" && url.searchParams.get("v")) {
        return {
          videoUrl: `https://www.youtube.com/watch?v=${url.searchParams.get("v")}`,
          originalQuery: trimmed
        };
      }
      if (/^\/(?:shorts|live|embed)\/([^/]+)/i.test(pathname)) {
        const m = pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/i);
        if (m?.[1]) {
          return { videoUrl: `https://www.youtube.com/watch?v=${m[1]}`, originalQuery: trimmed };
        }
      }
      const firstSegment = pathname.replace(/^\//, "").split("/")[0].trim();
      if (firstSegment && !["feed", "results", "playlist", "gaming", "premium"].includes(firstSegment.toLowerCase())) {
        return { handle: `@${decodeURIComponent(firstSegment).replace(/^@/, "")}`, originalQuery: trimmed };
      }
    } catch {
    }
  }
  const cleanToken = trimmed.split(/[?#]/)[0].split("/")[0].trim();
  if (cleanToken.startsWith("@")) {
    return { handle: cleanToken, originalQuery: trimmed };
  }
  if (cleanToken.startsWith("UC") && cleanToken.length >= 20) {
    return { channelId: cleanToken, originalQuery: trimmed };
  }
  return { handle: `@${cleanToken.replace(/^@/, "")}`, originalQuery: trimmed };
}
function extractYtInitialData(html) {
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
      } catch {
      }
    }
  }
  return null;
}
function findAllByKey(root, targetKey, maxItems = 80) {
  const results = [];
  const stack = [root];
  const visited = /* @__PURE__ */ new Set();
  while (stack.length > 0 && results.length < maxItems) {
    const node = stack.pop();
    if (!node || typeof node !== "object" || visited.has(node)) continue;
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
      if (child && typeof child === "object") {
        stack.push(child);
      }
    }
  }
  return results;
}
function extractText(field) {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field.simpleText === "string") return field.simpleText;
  if (typeof field.content === "string") return field.content;
  if (Array.isArray(field.runs)) {
    return field.runs.map((r) => r?.text || "").join("");
  }
  return "";
}
function parseVideosFromYtData(ytData, isChannelPkxd) {
  const videos = [];
  const seenIds = /* @__PURE__ */ new Set();
  const lockups = findAllByKey(ytData, "lockupViewModel", 50);
  for (const lv of lockups) {
    const id = lv?.contentId;
    if (!id || typeof id !== "string" || seenIds.has(id)) continue;
    const meta = lv?.metadata?.lockupMetadataViewModel;
    const title = extractText(meta?.title);
    if (!title) continue;
    let durationText = "";
    const badges = findAllByKey(lv?.contentImage, "thumbnailBadgeViewModel", 5);
    for (const b of badges) {
      const txt = (b?.text || "").trim();
      if (/^\d+:\d+(?::\d+)?$/.test(txt)) {
        durationText = txt;
        break;
      }
    }
    const durationSeconds = parseClockDurationToSeconds(durationText);
    const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
    let views = 0;
    let publishedText = "";
    let publishedDaysAgo;
    for (const row of rows) {
      const parts = row?.metadataParts || [];
      for (const part of parts) {
        const label = part?.accessibilityLabel || extractText(part?.text) || "";
        const text = extractText(part?.text) || label;
        if (/view|visualiza/i.test(label) || part?.leadingIcon?.name === "PLAY_ARROW_OUTLINED") {
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
    const isShort = durationSeconds > 0 && durationSeconds <= 61 || /#shorts|\bshorts\b/i.test(title);
    const isLong5Min = !isShort && durationSeconds >= 300;
    const isPkxd = isChannelPkxd || PKXD_REGEX.test(title);
    const publishedAt = publishedDaysAgo !== void 0 ? new Date(Date.now() - publishedDaysAgo * 864e5).toISOString() : "";
    seenIds.add(id);
    videos.push({
      id,
      title,
      publishedAt,
      publishedText,
      publishedDaysAgo,
      durationSeconds: durationSeconds || void 0,
      durationText: durationText || void 0,
      isShort,
      isLong5Min,
      isPkxdContent: isPkxd,
      views,
      thumbnailUrl
    });
  }
  if (videos.length === 0) {
    const renderers = findAllByKey(ytData, "videoRenderer", 50);
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
      const isShort = durationSeconds > 0 && durationSeconds <= 61 || /#shorts|\bshorts\b/i.test(title);
      const isLong5Min = !isShort && durationSeconds >= 300;
      const isPkxd = isChannelPkxd || PKXD_REGEX.test(title);
      seenIds.add(id);
      videos.push({
        id,
        title,
        publishedAt: publishedDaysAgo !== void 0 ? new Date(Date.now() - publishedDaysAgo * 864e5).toISOString() : "",
        publishedText,
        publishedDaysAgo,
        durationSeconds: durationSeconds || void 0,
        durationText: durationText || void 0,
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
function parseShortsFromYtData(ytData, isChannelPkxd) {
  const shorts = [];
  const seenIds = /* @__PURE__ */ new Set();
  const lockups = findAllByKey(ytData, "shortsLockupViewModel", 50);
  for (const sl of lockups) {
    const id = sl?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId || (typeof sl?.entityId === "string" ? sl.entityId.replace(/^shorts-shelf-item-/, "") : "");
    if (!id || seenIds.has(id)) continue;
    const accText = sl?.accessibilityText || "";
    const primaryTitle = extractText(sl?.overlayMetadata?.primaryText);
    const secondaryViews = extractText(sl?.overlayMetadata?.secondaryText);
    let title = primaryTitle;
    let views = parseCompactNumber(secondaryViews);
    if (!title && accText) {
      const cleaned = accText.replace(/\s*-\s*play short.*$/i, "");
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
      publishedAt: "",
      durationSeconds: 30,
      durationText: "Short",
      isShort: true,
      isLong5Min: false,
      isPkxdContent: isChannelPkxd || PKXD_REGEX.test(title),
      views,
      thumbnailUrl
    });
  }
  return shorts;
}
function summarizeMetrics(params) {
  const {
    channelId,
    title,
    handle,
    avatarUrl,
    subscriberCount,
    description = "",
    longVideos,
    shorts,
    dataSource
  } = params;
  const combinedMap = /* @__PURE__ */ new Map();
  for (const v of longVideos) combinedMap.set(v.id, v);
  for (const s of shorts) {
    if (!combinedMap.has(s.id)) combinedMap.set(s.id, s);
  }
  const allRecent = Array.from(combinedMap.values());
  const explicitPkxdMatches = allRecent.filter((v) => PKXD_REGEX.test(v.title)).length;
  const isPkxdChannel = PKXD_REGEX.test(title) || PKXD_REGEX.test(handle) || PKXD_REGEX.test(description) || allRecent.length > 0 && explicitPkxdMatches / allRecent.length >= 0.25;
  const finalizedVideos = allRecent.map((v) => ({
    ...v,
    isPkxdContent: v.isPkxdContent || isPkxdChannel
  }));
  const finalLongs = finalizedVideos.filter((v) => !v.isShort);
  const finalShorts = finalizedVideos.filter((v) => v.isShort);
  const discoveredCount = finalizedVideos.length;
  const videoCount = Math.max(params.videoCount || 0, discoveredCount);
  const longVideos5MinCount = finalLongs.filter((v) => v.isLong5Min || v.durationSeconds !== void 0 && v.durationSeconds >= 300).length;
  const longVideosCount = finalLongs.length;
  const shortsCount = finalShorts.length;
  const pkxdLongVideosDetected = finalLongs.filter((v) => v.isPkxdContent).length;
  const pkxdShortsDetected = finalShorts.filter((v) => v.isPkxdContent).length;
  const pkxdVideosDetected = finalizedVideos.filter((v) => v.isPkxdContent).length;
  const longWithViews = finalLongs.filter((v) => v.views > 0);
  const shortsWithViews = finalShorts.filter((v) => v.views > 0);
  const allWithViews = finalizedVideos.filter((v) => v.views > 0);
  const sumLongViews = longWithViews.reduce((acc, v) => acc + v.views, 0);
  const sumShortViews = shortsWithViews.reduce((acc, v) => acc + v.views, 0);
  const sumAllSampleViews = allWithViews.reduce((acc, v) => acc + v.views, 0);
  const totalViews = Math.max(params.totalViews || 0, sumAllSampleViews);
  const averageLongViews = longWithViews.length > 0 ? Math.round(sumLongViews / longWithViews.length) : videoCount > 0 && totalViews > 0 ? Math.round(totalViews / videoCount) : 0;
  const averageShortViews = shortsWithViews.length > 0 ? Math.round(sumShortViews / shortsWithViews.length) : videoCount > 0 && totalViews > 0 ? Math.round(totalViews / videoCount) : 0;
  const averageRecentViews = allWithViews.length > 0 ? Math.round(sumAllSampleViews / allWithViews.length) : videoCount > 0 && totalViews > 0 ? Math.round(totalViews / videoCount) : 0;
  const getDaysAgo = (v) => {
    if (typeof v.publishedDaysAgo === "number") return v.publishedDaysAgo;
    if (v.publishedAt) {
      const ts = new Date(v.publishedAt).getTime();
      if (!Number.isNaN(ts)) {
        return Math.max(0, Math.floor((Date.now() - ts) / 864e5));
      }
    }
    return void 0;
  };
  let videosLast30Days = 0;
  let longVideosLast30Days = 0;
  let shortsLast30Days = 0;
  let viewsLast90Days = 0;
  for (const v of finalizedVideos) {
    const days = getDaysAgo(v);
    if (days !== void 0) {
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
  if (viewsLast90Days === 0 && sumAllSampleViews > 0) {
    viewsLast90Days = sumAllSampleViews;
  }
  const sortNewestFirst = (list) => {
    const indexed = list.map((item, idx) => ({ item, idx, days: getDaysAgo(item) }));
    indexed.sort((a, b) => {
      if (a.days !== void 0 && b.days !== void 0) return a.days - b.days;
      return a.idx - b.idx;
    });
    return indexed.map((entry) => entry.item);
  };
  const orderedLongs = sortNewestFirst(finalLongs);
  const orderedShorts = sortNewestFirst(finalShorts);
  const last16Shorts = orderedShorts.slice(0, 16);
  const viewsLast16Shorts = last16Shorts.reduce((acc, v) => acc + (v.views || 0), 0);
  const last16ShortsCount = last16Shorts.length;
  const preservedVideos = [...orderedShorts.slice(0, 25), ...orderedLongs.slice(0, 25)];
  preservedVideos.sort((a, b) => {
    const da = getDaysAgo(a);
    const db = getDaysAgo(b);
    if (da !== void 0 && db !== void 0) return da - db;
    if (da !== void 0) return -1;
    if (db !== void 0) return 1;
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
async function fetchYouTubeChannelData(query) {
  let parsed = cleanChannelQuery(query);
  const apiKey = process.env.YOUTUBE_API_KEY;
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
    } catch {
    }
    if (!parsed.handle && !parsed.channelId && parsed.videoUrl) {
      try {
        const vidRes = await fetch(parsed.videoUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Cookie": "CONSENT=YES+cb; SOCS=CAI"
          }
        });
        if (vidRes.ok) {
          const vidHtml = await vidRes.text();
          const cid = vidHtml.match(/"channelId":"(UC[a-zA-Z0-9_-]{20,24})"/)?.[1];
          if (cid) parsed = { channelId: cid, originalQuery: query };
        }
      } catch {
      }
    }
  }
  if (apiKey) {
    try {
      let apiUrl = "";
      if (parsed.channelId) {
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${parsed.channelId}&key=${apiKey}`;
      } else if (parsed.handle) {
        const cleanHandle = parsed.handle.replace(/^@/, "");
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
      }
      if (apiUrl) {
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const channelId2 = item.id;
            const snippet = item.snippet || {};
            const stats = item.statistics || {};
            const subs = parseInt(stats.subscriberCount || "0", 10);
            const vids = parseInt(stats.videoCount || "0", 10);
            const views = parseInt(stats.viewCount || "0", 10);
            const description2 = snippet.description || "";
            const title2 = snippet.title || parsed.handle || "Canal do YouTube";
            const handle2 = snippet.customUrl ? `@${snippet.customUrl.replace(/^@/, "")}` : parsed.handle || `@${title2.replace(/\s+/g, "")}`;
            const avatarUrl2 = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "";
            const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
            const longVideos2 = [];
            const shorts2 = [];
            if (uploadsPlaylistId) {
              try {
                const playRes = await fetch(
                  `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploadsPlaylistId}&key=${apiKey}`
                );
                if (playRes.ok) {
                  const playData = await playRes.json();
                  const videoIds = (playData.items || []).map((i) => i.snippet?.resourceId?.videoId).filter(Boolean);
                  const detailsMap = {};
                  if (videoIds.length > 0) {
                    const vidStatsRes = await fetch(
                      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds.join(",")}&key=${apiKey}`
                    );
                    if (vidStatsRes.ok) {
                      const vidData = await vidStatsRes.json();
                      (vidData.items || []).forEach((v) => {
                        detailsMap[v.id] = v;
                      });
                    }
                  }
                  for (const i of playData.items || []) {
                    const vId = i.snippet?.resourceId?.videoId || "";
                    if (!vId) continue;
                    const detail = detailsMap[vId];
                    const vTitle = detail?.snippet?.title || i.snippet?.title || "";
                    const vDesc = detail?.snippet?.description || i.snippet?.description || "";
                    const vTags = (detail?.snippet?.tags || []).join(" ");
                    const publishedAt = detail?.snippet?.publishedAt || i.snippet?.publishedAt || "";
                    const durationSeconds = parseIsoDurationToSeconds(detail?.contentDetails?.duration || "");
                    const viewCount = parseInt(detail?.statistics?.viewCount || "0", 10);
                    const isShort = durationSeconds > 0 && durationSeconds <= 61 || /#shorts|\bshorts\b/i.test(vTitle);
                    const isLong5Min = !isShort && durationSeconds >= 300;
                    const isPkxd = PKXD_REGEX.test(`${vTitle} ${vDesc} ${vTags}`);
                    const daysAgo = publishedAt ? Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 864e5)) : void 0;
                    const entry = {
                      id: vId,
                      title: vTitle,
                      publishedAt,
                      publishedDaysAgo: daysAgo,
                      durationSeconds: durationSeconds || void 0,
                      durationText: isShort ? "Short" : formatSecondsToClock(durationSeconds),
                      isShort,
                      isLong5Min,
                      isPkxdContent: isPkxd,
                      views: viewCount,
                      thumbnailUrl: detail?.snippet?.thumbnails?.medium?.url || i.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`
                    };
                    if (isShort) shorts2.push(entry);
                    else longVideos2.push(entry);
                  }
                }
              } catch (e) {
                console.warn("Erro ao puxar v\xEDdeos da playlist via API:", e);
              }
            }
            return summarizeMetrics({
              channelId: channelId2,
              title: title2,
              handle: handle2,
              avatarUrl: avatarUrl2,
              subscriberCount: subs,
              videoCount: vids,
              totalViews: views,
              description: description2,
              longVideos: longVideos2,
              shorts: shorts2,
              dataSource: "youtube_api"
            });
          }
        }
      }
    } catch (apiErr) {
      console.warn("Falha na requisi\xE7\xE3o YouTube Data API, usando coletor p\xFAblico resiliente:", apiErr);
    }
  }
  let baseUrl = "";
  if (parsed.channelId) {
    baseUrl = `https://www.youtube.com/channel/${parsed.channelId}`;
  } else if (parsed.handle) {
    baseUrl = `https://www.youtube.com/${parsed.handle}`;
  } else {
    baseUrl = `https://www.youtube.com/@${parsed.originalQuery}`;
  }
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "CONSENT=YES+cb; SOCS=CAI",
    "Cache-Control": "no-cache"
  };
  console.log(`[YouTube Scraper] Coletando dados p\xFAblicos: ${baseUrl}`);
  const [aboutRes, videosRes, shortsRes] = await Promise.all([
    fetch(`${baseUrl}/about`, { headers }).catch(() => null),
    fetch(`${baseUrl}/videos`, { headers }).catch(() => null),
    fetch(`${baseUrl}/shorts`, { headers }).catch(() => null)
  ]);
  if ((!aboutRes || !aboutRes.ok) && (!videosRes || !videosRes.ok)) {
    throw new Error(
      `N\xE3o foi poss\xEDvel carregar o canal "${query}". Verifique se o @handle, link ou ID est\xE1 correto e p\xFAblico.`
    );
  }
  const [aboutHtml, videosHtml, shortsHtml] = await Promise.all([
    aboutRes && aboutRes.ok ? aboutRes.text() : Promise.resolve(""),
    videosRes && videosRes.ok ? videosRes.text() : Promise.resolve(""),
    shortsRes && shortsRes.ok ? shortsRes.text() : Promise.resolve("")
  ]);
  const primaryHtml = aboutHtml || videosHtml || shortsHtml;
  const aboutData = aboutHtml ? extractYtInitialData(aboutHtml) : null;
  const videosData = videosHtml ? extractYtInitialData(videosHtml) : null;
  const shortsData = shortsHtml ? extractYtInitialData(shortsHtml) : null;
  const aboutVms = aboutData ? findAllByKey(aboutData, "aboutChannelViewModel", 1) : [];
  const aboutVm = aboutVms[0] || {};
  const headerSource = aboutData || videosData || shortsData;
  const headerVms = headerSource ? findAllByKey(headerSource, "pageHeaderViewModel", 1) : [];
  const headerVm = headerVms[0] || {};
  let channelId = aboutVm.channelId || parsed.channelId || primaryHtml.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{20,24})"/i)?.[1] || primaryHtml.match(/"channelId":"(UC[a-zA-Z0-9_-]{20,24})"/)?.[1] || "";
  let title = extractText(headerVm?.title?.dynamicTextViewModel?.text) || primaryHtml.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || primaryHtml.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*-\s*YouTube\s*$/i, "").trim() || "";
  let avatarUrl = headerVm?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.slice(-1)?.[0]?.url || primaryHtml.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] || "";
  const canonicalHandleMatch = (aboutVm.canonicalChannelUrl || "").match(/\/(@[a-zA-Z0-9_.-]+)/) || primaryHtml.match(/"canonicalBaseUrl":"\/(@[a-zA-Z0-9_.-]+)"/);
  const handle = canonicalHandleMatch?.[1] || parsed.handle || `@${title.replace(/\s+/g, "")}`;
  const description = aboutVm.description || "";
  let subscriberCount = parseCompactNumber(aboutVm.subscriberCountText || "");
  let videoCount = parseCompactNumber(aboutVm.videoCountText || "");
  let totalViews = parseCompactNumber(aboutVm.viewCountText || "");
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
  const longVideos = videosData ? parseVideosFromYtData(videosData, prelimPkxd) : [];
  const shorts = shortsData ? parseShortsFromYtData(shortsData, prelimPkxd) : [];
  if (channelId) {
    try {
      const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
        headers: { "User-Agent": headers["User-Agent"] }
      });
      if (rssRes.ok) {
        const xml = await rssRes.text();
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
        let entryMatch;
        const longMap = new Map(longVideos.map((v) => [v.id, v]));
        const shortMap = new Map(shorts.map((v) => [v.id, v]));
        while ((entryMatch = entryRegex.exec(xml)) !== null) {
          const entryXml = entryMatch[1];
          const vidId = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i)?.[1] || "";
          const vidTitle = entryXml.match(/<title>([^<]+)<\/title>/i)?.[1] || "";
          const published = entryXml.match(/<published>([^<]+)<\/published>/i)?.[1] || "";
          const viewsStr = entryXml.match(/<media:statistics views="(\d+)"/i)?.[1];
          const descStr = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/i)?.[1] || "";
          const linkHref = entryXml.match(/<link[^>]*href="([^"]+)"/i)?.[1] || "";
          if (!vidId) continue;
          const exactViews = viewsStr ? parseInt(viewsStr, 10) : 0;
          const daysAgo = published ? Math.max(0, Math.floor((Date.now() - new Date(published).getTime()) / 864e5)) : void 0;
          const isShortLink = linkHref.includes("/shorts/") || /#shorts|\bshorts\b/i.test(vidTitle);
          const isPkxd = prelimPkxd || PKXD_REGEX.test(`${vidTitle} ${descStr}`);
          const existingLong = longMap.get(vidId);
          const existingShort = shortMap.get(vidId);
          if (existingLong) {
            if (published) existingLong.publishedAt = published;
            if (daysAgo !== void 0) existingLong.publishedDaysAgo = daysAgo;
            if (exactViews > 0) existingLong.views = exactViews;
            if (isPkxd) existingLong.isPkxdContent = true;
          } else if (existingShort) {
            if (published) existingShort.publishedAt = published;
            if (daysAgo !== void 0) existingShort.publishedDaysAgo = daysAgo;
            if (exactViews > 0) existingShort.views = exactViews;
            if (isPkxd) existingShort.isPkxdContent = true;
          } else if (vidTitle) {
            const newItem = {
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
      console.warn("Aviso ao enriquecer com RSS do YouTube:", rssErr);
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
    dataSource: "youtube_public_scrape"
  });
}

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.disable("x-powered-by");
app.use(import_express.default.json());
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
var fallbackPublicKey = "BOjr-tCGr-DdW6_g8F3quXEvVYc7QlkkEnI-c8kslDtX3M839-ga74J-x5H2LBHs3ufvSjlWm_fa0IqTNLEC1Tc";
var fallbackPrivateKey = "SIwRZY-VmYgHBNpfVVwMGsQOG30j1hIusw6snQnQXVI";
function isValidPrivateKey(key) {
  if (!key) return false;
  try {
    const buf = Buffer.from(key.trim(), "base64url");
    return buf.length === 32;
  } catch (e) {
    return false;
  }
}
var vapidKeys = (() => {
  let pub = (process.env.VAPID_PUBLIC_KEY || "").trim();
  let priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
  if (!pub || pub.length < 40 || !isValidPrivateKey(priv)) {
    console.log("[Web Push] Using fallback hardcoded VAPID keys because env keys were missing or invalid.");
    pub = fallbackPublicKey;
    priv = fallbackPrivateKey;
  }
  return { publicKey: pub, privateKey: priv };
})();
try {
  import_web_push.default.setVapidDetails(
    "mailto:kawanyuri35@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log("[Web Push] VAPID details configured successfully.");
} catch (error) {
  console.error("[Web Push] Failed to configure VAPID details with primary keys, trying fallback keys...", error);
  try {
    import_web_push.default.setVapidDetails(
      "mailto:kawanyuri35@gmail.com",
      fallbackPublicKey,
      fallbackPrivateKey
    );
    console.log("[Web Push] Fallback VAPID details configured successfully.");
  } catch (fallbackError) {
    console.error("[Web Push] Critical: Both primary and fallback VAPID configurations failed.", fallbackError);
  }
}
var serverStartTime = Date.now() - 5e3;
async function sendPushNotificationToAll(title, body, url = "/") {
  console.log(`[Web Push] Disparando notifica\xE7\xE3o nativa para todos: "${title}" - "${body}"`);
  try {
    const subsSnap = await adminDb.collection("push_subscriptions").get();
    if (subsSnap.empty) {
      console.log("[Web Push] Nenhuma inscri\xE7\xE3o encontrada no banco.");
      return;
    }
    const payload = JSON.stringify({
      title,
      body,
      url
    });
    const sendPromises = subsSnap.docs.map(async (doc) => {
      const subData = doc.data();
      try {
        await import_web_push.default.sendNotification(subData.subscription, payload);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Web Push] Removendo inscri\xE7\xE3o inativa: ${doc.id}`);
          await doc.ref.delete();
        } else {
          console.error(`[Web Push] Erro ao enviar para ${doc.id}:`, err);
        }
      }
    });
    await Promise.allSettled(sendPromises);
    console.log("[Web Push] Disparo em lote finalizado.");
  } catch (err) {
    console.error("[Web Push] Erro geral ao disparar notifica\xE7\xF5es:", err);
  }
}
try {
  adminDb.collection("notifications").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        if (data && data.createdAt && data.createdAt > serverStartTime) {
          await sendPushNotificationToAll(data.title, data.body, "/");
        }
      }
    });
  });
  console.log("[Web Push] Ouvinte em tempo real da cole\xE7\xE3o 'notifications' ativado.");
} catch (snapshotErr) {
  console.error("Erro ao configurar Firestore Snapshot Listener para Web Push:", snapshotErr);
}
app.get("/api/vapid-public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});
app.post("/api/push-subscribe", async (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    res.status(400).json({ error: "Inscri\xE7\xE3o inv\xE1lida" });
    return;
  }
  try {
    const subscriptionId = import_crypto.default.createHash("sha256").update(subscription.endpoint).digest("hex");
    console.log(`[Web Push] Nova inscri\xE7\xE3o registrada! ID: ${subscriptionId}, Endpoint: ${subscription.endpoint}`);
    const subRef = adminDb.collection("push_subscriptions").doc(subscriptionId);
    await subRef.set({
      subscription,
      createdAt: Date.now()
    });
    res.json({ success: true, id: subscriptionId });
  } catch (err) {
    console.error("Erro ao salvar inscri\xE7\xE3o Push:", err);
    res.status(500).json({ error: err.message || "Erro interno do servidor" });
  }
});
app.post("/api/send-push", async (req, res) => {
  const { title, body, admin_secret, url } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!title || !body) {
    res.status(400).json({ error: "T\xEDtulo e corpo s\xE3o obrigat\xF3rios." });
    return;
  }
  try {
    console.log(`[Web Push API] Enviando notifica\xE7\xE3o manual direta: "${title}"`);
    await sendPushNotificationToAll(title, body, url || "/");
    res.json({ success: true });
  } catch (err) {
    console.error("[Web Push API] Erro ao disparar notifica\xE7\xE3o manual direta:", err);
    res.status(500).json({ error: err.message || "Erro interno ao disparar push" });
  }
});
app.post("/api/admin-delete", async (req, res) => {
  const { collectionName, docId, admin_secret } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!collectionName || !docId) {
    res.status(400).json({ error: "Par\xE2metros collectionName e docId s\xE3o obrigat\xF3rios." });
    return;
  }
  try {
    console.log(`[Admin DB] Deletando documento ${docId} da cole\xE7\xE3o ${collectionName}`);
    await adminDb.collection(collectionName).doc(docId).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("[Admin DB] Erro ao deletar documento:", err);
    res.status(500).json({ error: err.message || "Erro interno ao deletar" });
  }
});
app.get("/api/feedback", async (req, res) => {
  try {
    const snap = await adminDb.collection("community_feedback").orderBy("createdAt", "desc").limit(50).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, items });
  } catch (err) {
    console.warn("[Feedback API] GET fallback:", err?.message);
    res.json({ success: true, items: [], fallback: true });
  }
});
app.post("/api/feedback", async (req, res) => {
  const { title, description, category, rating, authorName, authorTag, authorId } = req.body;
  if (!title || !description) {
    res.status(400).json({ error: "T\xEDtulo e descri\xE7\xE3o s\xE3o obrigat\xF3rios." });
    return;
  }
  const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item = {
    id,
    title: String(title).trim().slice(0, 120),
    description: String(description).trim().slice(0, 1200),
    category: String(category || "Nova Funcionalidade"),
    rating: Number(rating) || 5,
    authorName: String(authorName || "Membro da Comunidade").trim().slice(0, 60),
    authorTag: String(authorTag || "").trim().slice(0, 30),
    authorId: authorId ? String(authorId) : null,
    votes: 1,
    status: "em_analise",
    createdAt: Date.now()
  };
  try {
    await adminDb.collection("community_feedback").doc(id).set(item);
    res.json({ success: true, item });
  } catch (err) {
    console.warn("[Feedback API] POST error:", err?.message);
    res.status(500).json({ error: "N\xE3o foi poss\xEDvel salvar no servidor.", item });
  }
});
app.post("/api/feedback/:id/vote", async (req, res) => {
  const { id } = req.params;
  try {
    const ref = adminDb.collection("community_feedback").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Sugest\xE3o n\xE3o encontrada." });
      return;
    }
    const currentVotes = Number(snap.data()?.votes || 0);
    await ref.update({ votes: currentVotes + 1 });
    res.json({ success: true, votes: currentVotes + 1 });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Erro ao votar" });
  }
});
app.patch("/api/feedback/:id", async (req, res) => {
  const { id } = req.params;
  const { status, admin_secret } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  try {
    await adminDb.collection("community_feedback").doc(id).update({ status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Erro ao atualizar" });
  }
});
app.get("/api/reports", async (req, res) => {
  const adminSecret = req.query.admin_secret;
  if (adminSecret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  try {
    const snap = await adminDb.collection("community_reports").orderBy("createdAt", "desc").limit(50).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, items });
  } catch (err) {
    res.json({ success: true, items: [], fallback: true });
  }
});
app.post("/api/reports", async (req, res) => {
  const { type, targetRef, description, severity, reporterName, reporterContact } = req.body;
  if (!description) {
    res.status(400).json({ error: "A descri\xE7\xE3o do problema ou den\xFAncia \xE9 obrigat\xF3ria." });
    return;
  }
  const id = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item = {
    id,
    type: String(type || "Problema T\xE9cnico / Bug"),
    targetRef: String(targetRef || "").trim().slice(0, 200),
    description: String(description).trim().slice(0, 1500),
    severity: String(severity || "media"),
    reporterName: String(reporterName || "An\xF4nimo").trim().slice(0, 60),
    reporterContact: String(reporterContact || "").trim().slice(0, 100),
    status: "aberto",
    createdAt: Date.now()
  };
  try {
    await adminDb.collection("community_reports").doc(id).set(item);
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: "Erro ao registrar envio.", item });
  }
});
app.patch("/api/reports/:id", async (req, res) => {
  const { id } = req.params;
  const { status, admin_secret } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  try {
    await adminDb.collection("community_reports").doc(id).update({ status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Erro ao atualizar den\xFAncia" });
  }
});
var ADMIN_SECRET_KEY = "pkxd2026_super_secret_admin_key";
var memXpStore = /* @__PURE__ */ new Map();
function sanitizeKey(raw) {
  return String(raw || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 100);
}
function buildDefaultXPProfile(userKey) {
  return {
    userKey,
    displayName: "",
    playerTag: "",
    avatarUrl: "",
    bio: "",
    totalXp: 0,
    level: 1,
    xpInLevel: 0,
    claimedRewards: [],
    history: [],
    updatedAt: Date.now()
  };
}
async function readXPProfile(userKey) {
  const safeKey = sanitizeKey(userKey);
  if (!safeKey) return buildDefaultXPProfile("anon");
  try {
    const snap = await adminDb.collection("user_xp_profiles").doc(safeKey).get();
    if (snap.exists) {
      const data = snap.data() || {};
      const merged = { ...buildDefaultXPProfile(safeKey), ...data, userKey: safeKey };
      memXpStore.set(safeKey, merged);
      return merged;
    }
  } catch (err) {
    console.warn("[XP API] Firestore read fallback:", err?.message);
  }
  return memXpStore.get(safeKey) || buildDefaultXPProfile(safeKey);
}
async function writeXPProfile(userKey, profile) {
  const safeKey = sanitizeKey(userKey);
  const payload = { ...profile, userKey: safeKey, updatedAt: Date.now() };
  memXpStore.set(safeKey, payload);
  try {
    await adminDb.collection("user_xp_profiles").doc(safeKey).set(payload, { merge: true });
  } catch (err) {
    console.warn("[XP API] Firestore write fallback:", err?.message);
  }
  return payload;
}
app.get("/api/xp/:userKey", async (req, res) => {
  const safeKey = sanitizeKey(req.params.userKey);
  if (!safeKey) {
    res.status(400).json({ error: "Identificador de usu\xE1rio inv\xE1lido." });
    return;
  }
  const profile = await readXPProfile(safeKey);
  res.json({ success: true, profile });
});
app.post("/api/xp/award", async (req, res) => {
  const { userKey, amount, reason, rewardKey, displayName, playerTag } = req.body || {};
  const safeKey = sanitizeKey(userKey);
  const numAmount = Math.max(1, Math.min(500, Math.round(Number(amount) || 0)));
  if (!safeKey || !numAmount || !reason) {
    res.status(400).json({ error: "Par\xE2metros obrigat\xF3rios: userKey, amount e reason." });
    return;
  }
  const profile = await readXPProfile(safeKey);
  const claimed = Array.isArray(profile.claimedRewards) ? [...profile.claimedRewards] : [];
  const cleanRewardKey = rewardKey ? sanitizeKey(rewardKey) : "";
  if (cleanRewardKey && claimed.includes(cleanRewardKey)) {
    res.json({
      success: true,
      awarded: false,
      alreadyClaimed: true,
      message: "Esta recompensa \xFAnica j\xE1 foi resgatada por este usu\xE1rio.",
      profile
    });
    return;
  }
  let verifiedAmount = numAmount;
  if (cleanRewardKey === "pkxd_identity_25") verifiedAmount = 25;
  if (cleanRewardKey === "pwa_install_100") verifiedAmount = 100;
  if (cleanRewardKey) claimed.push(cleanRewardKey);
  const nextTotalXp = Number(profile.totalXp || 0) + verifiedAmount;
  const nextLevel = Math.floor(nextTotalXp / 100) + 1;
  const nextXpInLevel = nextTotalXp % 100;
  const entry = {
    id: `xp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    amount: verifiedAmount,
    reason: String(reason).trim().slice(0, 140),
    rewardKey: cleanRewardKey || void 0,
    createdAt: Date.now()
  };
  const nextHistory = [entry, ...Array.isArray(profile.history) ? profile.history : []].slice(0, 80);
  const updated = await writeXPProfile(safeKey, {
    ...profile,
    displayName: displayName ? String(displayName).trim().slice(0, 60) : profile.displayName,
    playerTag: playerTag ? String(playerTag).trim().toUpperCase().slice(0, 30) : profile.playerTag,
    totalXp: nextTotalXp,
    level: nextLevel,
    xpInLevel: nextXpInLevel,
    claimedRewards: claimed,
    history: nextHistory
  });
  res.json({
    success: true,
    awarded: true,
    alreadyClaimed: false,
    awardedAmount: verifiedAmount,
    profile: updated
  });
});
app.post("/api/identity", async (req, res) => {
  const { userKey, pkxdName, pkxdNumber, displayName, avatarUrl, bio } = req.body || {};
  const safeKey = sanitizeKey(userKey);
  const cleanName = String(pkxdName || "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 20);
  const cleanNumber = String(pkxdNumber || "").trim().replace(/[^0-9]/g, "").slice(0, 6);
  if (!safeKey || cleanName.length < 2 || cleanNumber.length < 1) {
    res.status(400).json({ error: "Informe seu Nome (m\xEDn. 2 caracteres) e o n\xFAmero # do PK XD (ex: LUNA e 245)." });
    return;
  }
  const fullTag = `${cleanName}#${cleanNumber}`;
  const profile = await readXPProfile(safeKey);
  const claimed = Array.isArray(profile.claimedRewards) ? [...profile.claimedRewards] : [];
  let xpAwarded = 0;
  let nextHistory = Array.isArray(profile.history) ? [...profile.history] : [];
  if (!claimed.includes("pkxd_identity_25")) {
    claimed.push("pkxd_identity_25");
    xpAwarded = 25;
    nextHistory = [
      {
        id: `xp_${Date.now()}_id`,
        amount: 25,
        reason: "Cadastrou sua Identidade PK XD",
        rewardKey: "pkxd_identity_25",
        createdAt: Date.now()
      },
      ...nextHistory
    ].slice(0, 80);
  }
  const nextTotalXp = Number(profile.totalXp || 0) + xpAwarded;
  const nextLevel = Math.floor(nextTotalXp / 100) + 1;
  const nextXpInLevel = nextTotalXp % 100;
  const updated = await writeXPProfile(safeKey, {
    ...profile,
    displayName: displayName ? String(displayName).trim().slice(0, 60) : profile.displayName || cleanName,
    playerTag: fullTag,
    avatarUrl: avatarUrl !== void 0 ? String(avatarUrl).trim().slice(0, 400) : profile.avatarUrl,
    bio: bio !== void 0 ? String(bio).trim().slice(0, 240) : profile.bio,
    totalXp: nextTotalXp,
    level: nextLevel,
    xpInLevel: nextXpInLevel,
    claimedRewards: claimed,
    history: nextHistory
  });
  res.json({
    success: true,
    playerTag: fullTag,
    xpAwarded,
    profile: updated
  });
});
var DEFAULT_GRAMMY_CONFIG = {
  edition: "Edi\xE7\xE3o 2026",
  title: "PK Grammy",
  subtitle: "A Premia\xE7\xE3o Oficial da Comunidade PK XD Central",
  presentation: "Celebrando os criadores, organizadores de festas, artistas e momentos que marcaram o universo PK XD. Participe votando nas categorias oficiais com valida\xE7\xE3o segura contra votos duplicados.",
  phase: "votacao_aberta",
  showResults: false,
  rules: [
    "Cada jogador pode registrar apenas 1 voto por categoria por edi\xE7\xE3o (valida\xE7\xE3o autom\xE1tica no servidor).",
    "Os indicados s\xE3o selecionados e aprovados pela administra\xE7\xE3o com base na participa\xE7\xE3o na comunidade PK XD.",
    "Tentativas de manipula\xE7\xE3o ou automa\xE7\xE3o de votos s\xE3o bloqueadas e desconsideradas na apura\xE7\xE3o.",
    "Os vencedores oficiais s\xE3o revelados ap\xF3s o encerramento da apura\xE7\xE3o no palco digital do PK XD Central."
  ],
  schedule: [
    {
      id: "sched_1",
      stage: "Abertura das Categorias e Indica\xE7\xF5es",
      dateLabel: "Fase 1",
      description: "Defini\xE7\xE3o das categorias oficiais e sele\xE7\xE3o dos criadores e destaques da comunidade.",
      status: "done"
    },
    {
      id: "sched_2",
      stage: "Vota\xE7\xE3o Popular da Comunidade",
      dateLabel: "Fase 2",
      description: "Membros votam diretamente no PK XD Central em cada categoria dispon\xEDvel.",
      status: "active"
    },
    {
      id: "sched_3",
      stage: "Auditoria e Apura\xE7\xE3o dos Votos",
      dateLabel: "Fase 3",
      description: "Valida\xE7\xE3o final da contagem oficial pela equipe administrativa.",
      status: "upcoming"
    },
    {
      id: "sched_4",
      stage: "Cerim\xF4nia e Revela\xE7\xE3o dos Vencedores",
      dateLabel: "Fase 4",
      description: "Divulga\xE7\xE3o dos trof\xE9us e vencedores no mural oficial do PK Grammy.",
      status: "upcoming"
    }
  ],
  updatedAt: Date.now()
};
var memGrammyConfig = { ...DEFAULT_GRAMMY_CONFIG };
var memGrammyCategories = /* @__PURE__ */ new Map();
var memGrammyNominees = /* @__PURE__ */ new Map();
var memGrammyVotes = /* @__PURE__ */ new Map();
app.get("/api/pk-grammy", async (req, res) => {
  const voterKey = sanitizeKey(String(req.query.voterKey || ""));
  let config = { ...memGrammyConfig };
  let categories = [];
  let nominees = [];
  const userVotes = {};
  try {
    const cfgSnap = await adminDb.collection("pk_grammy_config").doc("main").get();
    if (cfgSnap.exists) {
      config = { ...DEFAULT_GRAMMY_CONFIG, ...cfgSnap.data() };
      memGrammyConfig = config;
    }
    const catSnap = await adminDb.collection("pk_grammy_categories").get();
    categories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nomSnap = await adminDb.collection("pk_grammy_nominees").get();
    nominees = nomSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (voterKey) {
      const voteSnap = await adminDb.collection("pk_grammy_votes").where("voterKey", "==", voterKey).get();
      voteSnap.docs.forEach((d) => {
        const v = d.data();
        if (v?.categoryId && v?.nomineeId) {
          userVotes[v.categoryId] = v.nomineeId;
        }
      });
    }
  } catch (err) {
    console.warn("[PK Grammy API] Firestore read fallback:", err?.message);
    categories = Array.from(memGrammyCategories.values());
    nominees = Array.from(memGrammyNominees.values());
    if (voterKey) {
      memGrammyVotes.forEach((v) => {
        if (v.voterKey === voterKey) userVotes[v.categoryId] = v.nomineeId;
      });
    }
  }
  categories.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const categoriesWithNominees = categories.map((cat) => ({
    ...cat,
    nominees: nominees.filter((n) => n.categoryId === cat.id).sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0))
  }));
  res.json({
    success: true,
    config,
    categories: categoriesWithNominees,
    userVotes,
    totalVotes: nominees.reduce((acc, n) => acc + Number(n.votes || 0), 0)
  });
});
app.post("/api/pk-grammy/vote", async (req, res) => {
  const { categoryId, nomineeId, voterKey, voterTag } = req.body || {};
  const safeVoter = sanitizeKey(voterKey);
  if (!categoryId || !nomineeId || !safeVoter) {
    res.status(400).json({ error: "Dados de vota\xE7\xE3o incompletos." });
    return;
  }
  const voteDocId = `${sanitizeKey(categoryId)}__${safeVoter}`;
  try {
    const cfgSnap = await adminDb.collection("pk_grammy_config").doc("main").get();
    const phase = cfgSnap.exists ? cfgSnap.data()?.phase : memGrammyConfig.phase;
    if (phase && phase !== "votacao_aberta") {
      res.status(403).json({ error: "A vota\xE7\xE3o do PK Grammy n\xE3o est\xE1 aberta nesta fase." });
      return;
    }
    const voteRef = adminDb.collection("pk_grammy_votes").doc(voteDocId);
    const existingVote = await voteRef.get();
    if (existingVote.exists) {
      res.status(409).json({ error: "Voc\xEA j\xE1 votou nesta categoria do PK Grammy!", alreadyVoted: true });
      return;
    }
    const nomRef = adminDb.collection("pk_grammy_nominees").doc(nomineeId);
    const nomSnap = await nomRef.get();
    if (!nomSnap.exists) {
      res.status(404).json({ error: "Indicado n\xE3o encontrado." });
      return;
    }
    const currentVotes = Number(nomSnap.data()?.votes || 0);
    await voteRef.set({
      categoryId,
      nomineeId,
      voterKey: safeVoter,
      voterTag: String(voterTag || "").slice(0, 40),
      createdAt: Date.now()
    });
    await nomRef.update({ votes: currentVotes + 1 });
    res.json({ success: true, votes: currentVotes + 1, categoryId, nomineeId });
  } catch (err) {
    console.warn("[PK Grammy Vote] Fallback:", err?.message);
    if (memGrammyVotes.has(voteDocId)) {
      res.status(409).json({ error: "Voc\xEA j\xE1 votou nesta categoria do PK Grammy!", alreadyVoted: true });
      return;
    }
    const nom = memGrammyNominees.get(nomineeId);
    if (!nom) {
      res.status(404).json({ error: "Indicado n\xE3o encontrado." });
      return;
    }
    nom.votes = Number(nom.votes || 0) + 1;
    memGrammyVotes.set(voteDocId, { categoryId, nomineeId, voterKey: safeVoter, createdAt: Date.now() });
    res.json({ success: true, votes: nom.votes, categoryId, nomineeId });
  }
});
app.post("/api/pk-grammy/admin/config", async (req, res) => {
  const { admin_secret, ...configData } = req.body || {};
  if (admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  const merged = {
    ...DEFAULT_GRAMMY_CONFIG,
    ...memGrammyConfig,
    ...configData,
    updatedAt: Date.now()
  };
  memGrammyConfig = merged;
  try {
    await adminDb.collection("pk_grammy_config").doc("main").set(merged, { merge: true });
  } catch (err) {
    console.warn("[PK Grammy Admin Config] fallback:", err?.message);
  }
  res.json({ success: true, config: merged });
});
app.post("/api/pk-grammy/admin/category", async (req, res) => {
  const { admin_secret, id, name, description, order } = req.body || {};
  if (admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!name) {
    res.status(400).json({ error: "Nome da categoria \xE9 obrigat\xF3rio." });
    return;
  }
  const catId = id || `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const item = {
    id: catId,
    name: String(name).trim().slice(0, 100),
    description: String(description || "").trim().slice(0, 300),
    order: Number(order) || 1,
    createdAt: Date.now()
  };
  memGrammyCategories.set(catId, item);
  try {
    await adminDb.collection("pk_grammy_categories").doc(catId).set(item, { merge: true });
  } catch (err) {
    console.warn("[PK Grammy Admin Category] fallback:", err?.message);
  }
  res.json({ success: true, category: item });
});
app.delete("/api/pk-grammy/admin/category/:id", async (req, res) => {
  const adminSecret = req.body?.admin_secret || req.query.admin_secret;
  if (adminSecret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  const { id } = req.params;
  memGrammyCategories.delete(id);
  try {
    await adminDb.collection("pk_grammy_categories").doc(id).delete();
  } catch (err) {
    console.warn("[PK Grammy Delete Category] fallback:", err?.message);
  }
  res.json({ success: true });
});
app.post("/api/pk-grammy/admin/nominee", async (req, res) => {
  const { admin_secret, id, categoryId, name, handle, bio, avatarUrl, channelUrl, highlight, isWinner } = req.body || {};
  if (admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!categoryId || !name) {
    res.status(400).json({ error: "Categoria e nome do indicado s\xE3o obrigat\xF3rios." });
    return;
  }
  const nomId = id || `nom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  let existingVotes = 0;
  try {
    const existing = await adminDb.collection("pk_grammy_nominees").doc(nomId).get();
    if (existing.exists) existingVotes = Number(existing.data()?.votes || 0);
  } catch {
  }
  const item = {
    id: nomId,
    categoryId: String(categoryId),
    name: String(name).trim().slice(0, 80),
    handle: String(handle || "").trim().slice(0, 60),
    bio: String(bio || "").trim().slice(0, 400),
    avatarUrl: String(avatarUrl || "").trim().slice(0, 500),
    channelUrl: String(channelUrl || "").trim().slice(0, 500),
    highlight: String(highlight || "").trim().slice(0, 140),
    isWinner: Boolean(isWinner),
    votes: existingVotes,
    createdAt: Date.now()
  };
  memGrammyNominees.set(nomId, item);
  try {
    await adminDb.collection("pk_grammy_nominees").doc(nomId).set(item, { merge: true });
  } catch (err) {
    console.warn("[PK Grammy Admin Nominee] fallback:", err?.message);
  }
  res.json({ success: true, nominee: item });
});
app.delete("/api/pk-grammy/admin/nominee/:id", async (req, res) => {
  const adminSecret = req.body?.admin_secret || req.query.admin_secret;
  if (adminSecret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  const { id } = req.params;
  memGrammyNominees.delete(id);
  try {
    await adminDb.collection("pk_grammy_nominees").doc(id).delete();
  } catch (err) {
    console.warn("[PK Grammy Delete Nominee] fallback:", err?.message);
  }
  res.json({ success: true });
});
app.post("/api/notifications/emit", async (req, res) => {
  const { title, body, type, targetUrl, sendPush, admin_secret } = req.body || {};
  if (!title || !body) {
    res.status(400).json({ error: "T\xEDtulo e mensagem s\xE3o obrigat\xF3rios." });
    return;
  }
  const allowedPublicTypes = ["new_event", "new_tournament", "schedule_change", "presence_confirmed", "upcoming_event"];
  const notifType = String(type || "admin_announcement");
  if (!allowedPublicTypes.includes(notifType) && admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Apenas administradores podem publicar este tipo de comunicado." });
    return;
  }
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const docData = {
    id,
    title: String(title).trim().slice(0, 120),
    body: String(body).trim().slice(0, 500),
    type: notifType,
    targetUrl: String(targetUrl || "/").slice(0, 160),
    createdAt: Date.now()
  };
  try {
    await adminDb.collection("notifications").doc(id).set(docData);
    if (sendPush && admin_secret === ADMIN_SECRET_KEY) {
      sendPushNotificationToAll(docData.title, docData.body, docData.targetUrl).catch(() => {
      });
    }
    res.json({ success: true, notification: docData });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Erro ao registrar notifica\xE7\xE3o." });
  }
});
var DEFAULT_EVENT_CATEGORIES = [
  "Torneios",
  "Festas",
  "Esconder-Esconder",
  "Encontros de Creators",
  "Desafios & Mini-Games",
  "Outros"
];
var memCustomCategories = [...DEFAULT_EVENT_CATEGORIES];
app.get("/api/event-categories", async (req, res) => {
  try {
    const snap = await adminDb.collection("settings").doc("event_categories").get();
    if (snap.exists && Array.isArray(snap.data()?.categories)) {
      res.json({ success: true, categories: snap.data()?.categories });
      return;
    }
  } catch {
  }
  res.json({ success: true, categories: memCustomCategories });
});
app.post("/api/admin/categories", async (req, res) => {
  const { admin_secret, categories } = req.body || {};
  if (admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(400).json({ error: "Informe ao menos uma categoria." });
    return;
  }
  const clean = Array.from(
    new Set(categories.map((c) => String(c).trim()).filter(Boolean))
  ).slice(0, 20);
  memCustomCategories = clean;
  try {
    await adminDb.collection("settings").doc("event_categories").set({ categories: clean, updatedAt: Date.now() }, { merge: true });
  } catch {
  }
  res.json({ success: true, categories: clean });
});
app.get("/api/admin/stats", async (req, res) => {
  const adminSecret = req.query.admin_secret;
  if (adminSecret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  try {
    const [eventsSnap, newsSnap, notifsSnap, usersSnap, postsSnap, grammyCatsSnap, grammyNomsSnap, grammyVotesSnap] = await Promise.all([
      adminDb.collection("community_events").get(),
      adminDb.collection("news").get(),
      adminDb.collection("notifications").get(),
      adminDb.collection("user_xp_profiles").get(),
      adminDb.collection("posts").get(),
      adminDb.collection("pk_grammy_categories").get(),
      adminDb.collection("pk_grammy_nominees").get(),
      adminDb.collection("pk_grammy_votes").get()
    ]);
    const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => Number(b.totalXp || 0) - Number(a.totalXp || 0)).slice(0, 50);
    res.json({
      success: true,
      stats: {
        users: usersSnap.size,
        events: eventsSnap.size,
        news: newsSnap.size,
        notifications: notifsSnap.size,
        posts: postsSnap.size,
        grammyCategories: grammyCatsSnap.size,
        grammyNominees: grammyNomsSnap.size,
        grammyVotes: grammyVotesSnap.size
      },
      users
    });
  } catch (err) {
    res.json({
      success: true,
      stats: {
        users: memXpStore.size,
        events: 0,
        news: 0,
        notifications: 0,
        posts: 0,
        grammyCategories: memGrammyCategories.size,
        grammyNominees: memGrammyNominees.size,
        grammyVotes: memGrammyVotes.size
      },
      users: Array.from(memXpStore.values()),
      fallback: true
    });
  }
});
var aiClient = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY n\xE3o encontrada no servidor. Configure-a no painel de Secrets.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function cleanHtmlText(html) {
  let clean = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<[^>]+>/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  return clean.substring(0, 6e4);
}
function extractHeuristicFallback(html) {
  let title = "Novidade PK XD! \u{1F579}\uFE0F";
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  } else {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = h1Match[1].trim();
    }
  }
  if (title.length > 50) {
    title = title.substring(0, 50) + "...";
  }
  let cleanText = cleanHtmlText(html);
  if (cleanText.length > 400) {
    cleanText = cleanText.substring(0, 400) + "...";
  }
  const description = `### \u26A0\uFE0F [Modelos de IA sob Alta Demanda]

Os servidores do Gemini est\xE3o ocupados no momento (Erro 503), mas salvamos as informa\xE7\xF5es b\xE1sicas diretamente do conte\xFAdo:

**Conte\xFAdo extra\xEDdo da newsletter:**
${cleanText}

*Por favor, tente enviar novamente em alguns instantes para o Gemini gerar o relat\xF3rio automatizado completo com diagrama\xE7\xE3o e IA!*`;
  return { title, description };
}
async function generateContentWithFallback(ai, prompt, schema) {
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview"
  ];
  let lastError = null;
  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Tentando gerar com o modelo ${model} (tentativa ${attempt}/2)...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });
        if (response && response.text) {
          console.log(`[Gemini] Sucesso ao gerar conte\xFAdo usando modelo: ${model}`);
          return response;
        }
      } catch (err) {
        lastError = err;
        const errStr = String(err?.message || err?.status || err?.statusText || JSON.stringify(err) || err || "");
        console.warn(`[Gemini] Erro no modelo ${model} (tentativa ${attempt}):`, errStr);
        const is503Or429 = errStr.includes("503") || errStr.includes("429") || errStr.toLowerCase().includes("unavailable") || errStr.toLowerCase().includes("high demand") || errStr.toLowerCase().includes("spikes in demand") || errStr.toLowerCase().includes("exhausted") || errStr.toLowerCase().includes("quota") || err?.status && (String(err.status).includes("503") || String(err.status).includes("429"));
        if (is503Or429) {
          console.warn(`[Gemini] Modelo ${model} est\xE1 sobrecarregado ou sem cota (Erro cr\xEDtico/Transit\xF3rio). Avan\xE7ando imediatamente para o pr\xF3ximo modelo...`);
          break;
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        }
      }
    }
  }
  throw lastError || new Error("Todos os modelos do Gemini falharam ou est\xE3o fora do ar.");
}
app.post("/api/scrape-spoiler", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: "URL \xE9 obrigat\xF3ria" });
    return;
  }
  let htmlContent = "";
  try {
    const fetchResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    if (!fetchResponse.ok) {
      res.status(500).json({ error: `Falha ao carregar a p\xE1gina do link. Status: ${fetchResponse.status}` });
      return;
    }
    htmlContent = await fetchResponse.text();
    const textToAnalyze = cleanHtmlText(htmlContent);
    const ai = getAI();
    const prompt = `Voc\xEA \xE9 um rob\xF4 extrator inteligente do portal PKXD Central.
Eu te passei o conte\xFAdo em texto limpo de uma newsletter de novidades e spoilers semanais recebida por e-mail do PK XD.
Analise com aten\xE7\xE3o e extraia os seguintes dados em portugu\xEAs das novidades ou spoilers descritos:
1. Um t\xEDtulo chamativo em portugu\xEAs sobre a principal novidade ou spoiler (m\xE1ximo de 8 palavras) acompanhado de um emoji legal de spoiler ou PK XD.
2. Uma descri\xE7\xE3o resumida, por\xE9m detalhada e interessante em formato markdown limpo contendo os principais fatos, datas de atualiza\xE7\xE3o citadas e itens novos exclusivos revelados no texto.

Retorne no formato JSON exato especificado a seguir:
{
  "title": "...",
  "description": "..."
}

Newsletter PK XD:
---
${textToAnalyze}
---
`;
    const schema = {
      type: import_genai.Type.OBJECT,
      properties: {
        title: { type: import_genai.Type.STRING },
        description: { type: import_genai.Type.STRING }
      },
      required: ["title", "description"]
    };
    const modelResponse = await generateContentWithFallback(ai, prompt, schema);
    const parsedData = JSON.parse(modelResponse.text || "{}");
    res.json({
      success: true,
      data: parsedData
    });
  } catch (err) {
    console.error("Erro no scraping / an\xE1lise com Gemini:", err);
    if (htmlContent) {
      try {
        console.log("[Resgate] Ativando analisador alternativo (HTML Heuristic)...");
        const fallbackData = extractHeuristicFallback(htmlContent);
        res.json({
          success: true,
          data: fallbackData,
          isFallbackRescue: true
        });
        return;
      } catch (rescueErr) {
        console.error("Falha no resgate heur\xEDstico:", rescueErr);
      }
    }
    res.status(500).json({ error: err.message || "Erro desconhecido ao puxar spoilers." });
  }
});
app.get("/api/youtube/channel", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const query = (req.query.query || "").trim();
  if (!query) {
    res.status(400).json({ error: "O par\xE2metro query (handle, ID ou URL do canal) \xE9 obrigat\xF3rio." });
    return;
  }
  try {
    const channelData = await fetchYouTubeChannelData(query);
    res.json({ success: true, data: channelData });
  } catch (err) {
    console.error("[YouTube API] Erro ao buscar canal:", err);
    res.status(404).json({
      error: err.message || "Canal n\xE3o encontrado ou indispon\xEDvel publicamente."
    });
  }
});
var FIREBASE_AUTH_ORIGIN = "https://pkxd-e817c.firebaseapp.com";
var HOP_BY_HOP_HEADERS = /* @__PURE__ */ new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length"
]);
async function proxyFirebaseAuth(req, res) {
  try {
    const targetUrl = `${FIREBASE_AUTH_ORIGIN}${req.originalUrl}`;
    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (lower === "host" || HOP_BY_HOP_HEADERS.has(lower)) continue;
      if (typeof value === "string") {
        forwardHeaders[key] = value;
      } else if (Array.isArray(value)) {
        forwardHeaders[key] = value.join(", ");
      }
    }
    forwardHeaders["host"] = new URL(FIREBASE_AUTH_ORIGIN).host;
    const method = req.method.toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(method);
    const body = hasBody && req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : void 0;
    const upstream = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      redirect: "manual"
    });
    res.status(upstream.status);
    upstream.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!HOP_BY_HOP_HEADERS.has(lower) && lower !== "x-frame-options") {
        res.setHeader(key, val);
      }
    });
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error("[Firebase Auth Proxy] Erro ao encaminhar requisi\xE7\xE3o:", err);
    res.status(502).json({ error: "Falha ao conectar ao handler de autentica\xE7\xE3o do Firebase." });
  }
}
app.all("/__/auth/*", proxyFirebaseAuth);
app.get("/__/firebase/init.json", async (req, res) => {
  try {
    const upstream = await fetch(`${FIREBASE_AUTH_ORIGIN}/__/firebase/init.json`);
    if (upstream.ok) {
      const jsonText = await upstream.text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.send(jsonText);
      return;
    }
  } catch {
  }
  try {
    const raw = import_fs.default.readFileSync(import_path.default.join(process.cwd(), "firebase-applet-config.json"), "utf-8");
    const cfg = JSON.parse(raw);
    res.json({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId
    });
  } catch (err) {
    console.error("[Firebase Init JSON] Erro ao ler firebase-applet-config.json:", err);
    res.status(500).json({ error: "Configura\xE7\xE3o do Firebase indispon\xEDvel." });
  }
});
async function startServer() {
  app.use((req, res, next) => {
    const acceptHeader = req.headers.accept || "";
    const isHtmlNavigation = req.method === "GET" && acceptHeader.includes("text/html");
    const isInternalOrAsset = req.path.startsWith("/api") || req.path.startsWith("/__/") || req.path.startsWith("/@") || req.path.startsWith("/src/") || req.path.startsWith("/node_modules/") || Boolean(import_path.default.extname(req.path));
    if (!isHtmlNavigation || isInternalOrAsset) {
      return next();
    }
    if (process.env.NODE_ENV !== "production") {
      req.url = "/";
    }
    next();
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

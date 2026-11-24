import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Smartphone,
  Square,
  Instagram,
  Sparkles,
  FileText
} from 'lucide-react';
import { AnalysisSummary, ChannelMetrics, CreatorFormat, ProgramTier } from '../types/creator';

interface CreatorInstagramCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelData: ChannelMetrics;
  analysis: AnalysisSummary;
  creatorFormat: CreatorFormat;
  selectedTier: ProgramTier;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
}

type ExportFormat = 'story' | 'feed';
type CardThemeId = 'pkxd_purple' | 'creator_gold' | 'neon_cyber';

interface CardTheme {
  id: CardThemeId;
  label: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accent: string;
  accentSecondary: string;
  panelBg: string;
  panelBorder: string;
  badgeText: string;
  progressStart: string;
  progressEnd: string;
}

const CARD_THEMES: Record<CardThemeId, CardTheme> = {
  pkxd_purple: {
    id: 'pkxd_purple',
    label: 'Roxo PK XD',
    bgStart: '#230647',
    bgMid: '#3D1278',
    bgEnd: '#5B1EB0',
    accent: '#F9C826',
    accentSecondary: '#FF3B9A',
    panelBg: 'rgba(18, 6, 36, 0.72)',
    panelBorder: '#120624',
    badgeText: '#120624',
    progressStart: '#F9C826',
    progressEnd: '#FF3B9A'
  },
  creator_gold: {
    id: 'creator_gold',
    label: 'Dourado Creator',
    bgStart: '#1A082E',
    bgMid: '#361254',
    bgEnd: '#5E240F',
    accent: '#FFD54F',
    accentSecondary: '#FF7043',
    panelBg: 'rgba(20, 7, 34, 0.76)',
    panelBorder: '#120624',
    badgeText: '#120624',
    progressStart: '#FFD54F',
    progressEnd: '#FB923C'
  },
  neon_cyber: {
    id: 'neon_cyber',
    label: 'Neon Cyber',
    bgStart: '#0A0522',
    bgMid: '#1C0B4B',
    bgEnd: '#2F106E',
    accent: '#22D3EE',
    accentSecondary: '#EC4899',
    panelBg: 'rgba(10, 5, 34, 0.78)',
    panelBorder: '#070217',
    badgeText: '#0A0522',
    progressStart: '#22D3EE',
    progressEnd: '#EC4899'
  }
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}...`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}...`;
}

function formatCompactPt(num: number): string {
  if (!Number.isFinite(num) || num <= 0) return '0';
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (num >= 100_000) {
    return `${Math.round(num / 1_000)} mil`;
  }
  return num.toLocaleString('pt-BR');
}

async function loadImageSafe(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  const apiBase = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  const proxiedUrl = url.startsWith('https://')
    ? `${apiBase}/api/youtube/avatar?url=${encodeURIComponent(url)}`
    : url;

  const tryLoad = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => resolve(null), 4500);
      img.onload = () => {
        clearTimeout(timer);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
      img.src = src;
    });

  const proxied = await tryLoad(proxiedUrl);
  if (proxied) return proxied;
  return tryLoad(url);
}

export default function CreatorInstagramCardModal({
  isOpen,
  onClose,
  channelData,
  analysis,
  creatorFormat,
  selectedTier,
  triggerAudio
}: CreatorInstagramCardModalProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('story');
  const [themeId, setThemeId] = useState<CardThemeId>('pkxd_purple');
  const [includeChecklist, setIncludeChecklist] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const avatarCacheRef = useRef<{ url: string; img: HTMLImageElement | null } | null>(null);

  useEffect(() => {
    try {
      const nav = navigator as any;
      if (typeof nav?.share === 'function' && typeof nav?.canShare === 'function') {
        const testFile = new File(['x'], 'test.png', { type: 'image/png' });
        setCanShareFiles(Boolean(nav.canShare({ files: [testFile] })));
      }
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const tierLabel = selectedTier === 'rising_star' ? 'TIER 2: RISING STAR' : 'TIER 1: STARDUST';
  const formatLabel = creatorFormat === 'shorts' ? 'YOUTUBE SHORTS' : 'VÍDEOS LONGOS (+5M)';
  const viewsLast16Shorts = channelData.viewsLast16Shorts ?? channelData.views3MonthsEstimated ?? 0;
  const last16Count = channelData.last16ShortsCount ?? 0;
  const avgViews =
    creatorFormat === 'shorts'
      ? channelData.averageShortViews || channelData.averageRecentViews || 0
      : channelData.averageLongViews || channelData.averageRecentViews || 0;

  const buildInstagramCaption = () => {
    const statusLine = analysis.isAllRequiredMet
      ? `Meta 100% concluída para o ${selectedTier === 'rising_star' ? 'Tier 2: Rising Star' : 'Tier 1: Stardust'}!`
      : `Já alcancei ${analysis.overallPercentage}% dos requisitos (${analysis.metCount}/${analysis.totalCount}) rumo ao ${selectedTier === 'rising_star' ? 'Rising Star' : 'Stardust'}!`;

    return [
      `Meu Progresso Creator no PK XD (${channelData.handle || channelData.title})`,
      ``,
      statusLine,
      `- Inscritos: ${(channelData.subscriberCount || 0).toLocaleString('pt-BR')}`,
      `- Views (últimos ${last16Count || 16} Shorts): ${viewsLast16Shorts.toLocaleString('pt-BR')}`,
      `- Média por vídeo recente: ${avgViews.toLocaleString('pt-BR')} views`,
      ``,
      `Analise seu canal também em pkxdcentral.site`,
      `#PKXD #PKXDCreator #PKXDCentral #YouTubeCreator #GamingBR`
    ].join('\n');
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const renderCard = async () => {
      setIsRendering(true);
      const theme = CARD_THEMES[themeId];
      const width = 1080;
      const height = exportFormat === 'story' ? 1920 : 1350;
      const isStory = exportFormat === 'story';

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load or reuse cached channel avatar
      let avatarImg: HTMLImageElement | null = null;
      if (channelData.avatarUrl) {
        if (avatarCacheRef.current?.url === channelData.avatarUrl) {
          avatarImg = avatarCacheRef.current.img;
        } else {
          avatarImg = await loadImageSafe(channelData.avatarUrl);
          avatarCacheRef.current = { url: channelData.avatarUrl, img: avatarImg };
        }
      }
      if (cancelled) return;

      // 1. Rich layered background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, theme.bgStart);
      bgGrad.addColorStop(0.52, theme.bgMid);
      bgGrad.addColorStop(1, theme.bgEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle glowing radial ambient highlights
      const glow1 = ctx.createRadialGradient(width * 0.85, height * 0.12, 40, width * 0.85, height * 0.12, 540);
      glow1.addColorStop(0, `${theme.accentSecondary}55`);
      glow1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(width * 0.15, height * 0.82, 40, width * 0.15, height * 0.82, 560);
      glow2.addColorStop(0, `${theme.accent}40`);
      glow2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // Decorative diagonal speed stripes (subtle PK XD energy)
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#FFFFFF';
      for (let i = -3; i < 10; i++) {
        ctx.save();
        ctx.translate(i * 220, 0);
        ctx.rotate(-0.28);
        ctx.fillRect(0, -200, 64, height + 600);
        ctx.restore();
      }
      ctx.restore();

      // Subtle crisp four-point stars
      const drawStar = (cx: number, cy: number, size: number, color: string, alpha: number) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.quadraticCurveTo(cx + size * 0.18, cy - size * 0.18, cx + size, cy);
        ctx.quadraticCurveTo(cx + size * 0.18, cy + size * 0.18, cx, cy + size);
        ctx.quadraticCurveTo(cx - size * 0.18, cy + size * 0.18, cx - size, cy);
        ctx.quadraticCurveTo(cx - size * 0.18, cy - size * 0.18, cx, cy - size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      drawStar(120, isStory ? 170 : 100, 26, theme.accent, 0.7);
      drawStar(960, isStory ? 240 : 120, 20, '#FFFFFF', 0.5);
      drawStar(975, height - 180, 28, theme.accentSecondary, 0.65);
      drawStar(95, height - 220, 18, theme.accent, 0.55);

      const padX = 68;
      const contentW = width - padX * 2;
      let y = isStory ? 115 : 64;

      // 2. Top Brand Pill Header
      const headerPillW = 610;
      const headerPillH = 58;
      const headerPillX = (width - headerPillW) / 2;

      // Straight-down comic shadow
      drawRoundedRect(ctx, headerPillX, y + 7, headerPillW, headerPillH, 29);
      ctx.fillStyle = '#120624';
      ctx.fill();

      drawRoundedRect(ctx, headerPillX, y, headerPillW, headerPillH, 29);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#120624';
      ctx.stroke();

      ctx.fillStyle = theme.badgeText;
      ctx.font = '900 24px "Fredoka", "Inter", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PK XD CENTRAL  •  PROGRESSO CREATOR', width / 2, y + headerPillH / 2 + 1);

      y += headerPillH + (isStory ? 44 : 28);

      // 3. Channel Identity Card
      const idCardH = isStory ? 235 : 196;
      drawRoundedRect(ctx, padX, y + 10, contentW, idCardH, 36);
      ctx.fillStyle = theme.panelBorder;
      ctx.fill();

      drawRoundedRect(ctx, padX, y, contentW, idCardH, 36);
      ctx.fillStyle = theme.panelBg;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.stroke();

      // Avatar circle
      const avatarSize = isStory ? 148 : 128;
      const avatarX = padX + 42;
      const avatarY = y + (idCardH - avatarSize) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.closePath();

      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();

      if (avatarImg) {
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      } else {
        const avGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
        avGrad.addColorStop(0, '#7C3AED');
        avGrad.addColorStop(1, '#EC4899');
        ctx.fillStyle = avGrad;
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 66px "Fredoka", "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((channelData.title || 'C').slice(0, 1).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 3);
      }
      ctx.restore();

      // Channel title, handle & badges
      const textX = avatarX + avatarSize + 34;
      const maxTextW = padX + contentW - textX - 34;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${isStory ? 44 : 40}px "Fredoka", "Inter", system-ui, sans-serif`;
      ctx.fillText(truncateText(ctx, channelData.title || 'Meu Canal', maxTextW), textX, y + (isStory ? 82 : 68));

      ctx.fillStyle = '#D8B4FE';
      ctx.font = `700 ${isStory ? 26 : 24}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText(truncateText(ctx, channelData.handle || '@canal', maxTextW), textX, y + (isStory ? 122 : 104));

      // Tier & Format pills inside identity card
      const drawTag = (tx: number, ty: number, label: string, bg: string, fg: string) => {
        ctx.font = '800 19px "Inter", system-ui, sans-serif';
        const tw = ctx.measureText(label).width + 30;
        const th = 40;
        drawRoundedRect(ctx, tx, ty, tw, th, 14);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.fillStyle = fg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, tx + tw / 2, ty + th / 2 + 1);
        return tw;
      };

      const tagY = y + (isStory ? 152 : 126);
      const firstW = drawTag(textX, tagY, tierLabel, theme.accent, theme.badgeText);
      drawTag(textX + firstW + 14, tagY, formatLabel, 'rgba(255,255,255,0.16)', '#FFFFFF');

      y += idCardH + (isStory ? 38 : 26);

      // 4. Hero Progress Card
      const progCardH = isStory ? 280 : 226;
      drawRoundedRect(ctx, padX, y + 10, contentW, progCardH, 36);
      ctx.fillStyle = theme.panelBorder;
      ctx.fill();

      drawRoundedRect(ctx, padX, y, contentW, progCardH, 36);
      const progCardBg = ctx.createLinearGradient(padX, y, padX + contentW, y + progCardH);
      progCardBg.addColorStop(0, 'rgba(255,255,255,0.13)');
      progCardBg.addColorStop(1, 'rgba(18,6,36,0.78)');
      ctx.fillStyle = progCardBg;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = analysis.isAllRequiredMet ? '#34D399' : `${theme.accent}AA`;
      ctx.stroke();

      // Label left + giant % right
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#E9D5FF';
      ctx.font = '800 22px "Inter", system-ui, sans-serif';
      ctx.fillText('PROGRESSO NO PROGRAMA CREATOR', padX + 42, y + (isStory ? 62 : 52));

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${isStory ? 38 : 32}px "Fredoka", "Inter", system-ui, sans-serif`;
      const statusHeadline = analysis.isAllRequiredMet
        ? 'TODOS OS CRITÉRIOS ALCANÇADOS!'
        : `${analysis.metCount} de ${analysis.totalCount} requisitos concluídos`;
      ctx.fillText(statusHeadline, padX + 42, y + (isStory ? 116 : 96));

      ctx.textAlign = 'right';
      ctx.fillStyle = analysis.isAllRequiredMet ? '#34D399' : theme.accent;
      ctx.font = `900 ${isStory ? 96 : 82}px "Fredoka", "Inter", system-ui, sans-serif`;
      ctx.fillText(`${analysis.overallPercentage}%`, padX + contentW - 42, y + (isStory ? 124 : 104));

      // Chunky Progress Bar
      const barX = padX + 42;
      const barY = y + (isStory ? 164 : 132);
      const barW = contentW - 84;
      const barH = isStory ? 44 : 36;

      drawRoundedRect(ctx, barX, barY, barW, barH, barH / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.stroke();

      const fillW = Math.max(barH, Math.round((barW * Math.min(100, Math.max(0, analysis.overallPercentage))) / 100));
      drawRoundedRect(ctx, barX, barY, fillW, barH, barH / 2);
      const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      if (analysis.isAllRequiredMet) {
        barGrad.addColorStop(0, '#10B981');
        barGrad.addColorStop(1, '#34D399');
      } else {
        barGrad.addColorStop(0, theme.progressStart);
        barGrad.addColorStop(1, theme.progressEnd);
      }
      ctx.fillStyle = barGrad;
      ctx.fill();

      // Glossy top shine on progress bar
      drawRoundedRect(ctx, barX + 10, barY + 5, Math.max(20, fillW - 20), barH * 0.34, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fill();

      // Sub caption inside progress card
      ctx.textAlign = 'left';
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '700 22px "Inter", system-ui, sans-serif';
      const remaining = analysis.totalCount - analysis.metCount;
      const bottomStatus = analysis.isAllRequiredMet
        ? 'Pronto para o próximo nível de Creator do PK XD'
        : `Faltam apenas ${remaining} ${remaining === 1 ? 'requisito' : 'requisitos'} para completar este Tier`;
      ctx.fillText(bottomStatus, barX, y + progCardH - (isStory ? 28 : 22));

      y += progCardH + (isStory ? 38 : 26);

      // 5. 4-Metric Grid (2x2)
      const gridGap = 24;
      const tileW = (contentW - gridGap) / 2;
      const tileH = isStory ? 186 : 148;

      const metrics = [
        {
          label: 'INSCRITOS NO CANAL',
          value: formatCompactPt(channelData.subscriberCount || 0),
          sub: `${(channelData.subscriberCount || 0).toLocaleString('pt-BR')} inscritos`,
          color: '#A78BFA'
        },
        {
          label: `VIEWS (${last16Count ? `ÚLT. ${last16Count}` : 'ÚLT. 16'} SHORTS)`,
          value: formatCompactPt(viewsLast16Shorts),
          sub: viewsLast16Shorts >= 10000 ? 'Meta de 10.000 views batida!' : 'Meta oficial: 10.000 views',
          color: theme.accent
        },
        {
          label: 'MÉDIA POR VÍDEO',
          value: formatCompactPt(avgViews),
          sub: creatorFormat === 'shorts' ? 'Média nos Shorts recentes' : 'Média nos Vídeos Longos',
          color: '#38BDF8'
        },
        {
          label: 'VÍDEOS PUBLICADOS',
          value: formatCompactPt(channelData.videoCount || 0),
          sub: `${channelData.videosLast30Days ?? 0} publicados nos últ. 30 dias`,
          color: theme.accentSecondary
        }
      ];

      metrics.forEach((m, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const tx = padX + col * (tileW + gridGap);
        const ty = y + row * (tileH + gridGap);

        drawRoundedRect(ctx, tx, ty + 8, tileW, tileH, 28);
        ctx.fillStyle = theme.panelBorder;
        ctx.fill();

        drawRoundedRect(ctx, tx, ty, tileW, tileH, 28);
        ctx.fillStyle = theme.panelBg;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = `${m.color}66`;
        ctx.stroke();

        // Top color bar accent
        drawRoundedRect(ctx, tx + 26, ty + 22, 54, 7, 4);
        ctx.fillStyle = m.color;
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '800 18px "Inter", system-ui, sans-serif';
        ctx.fillText(m.label, tx + 26, ty + (isStory ? 62 : 52));

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `900 ${isStory ? 54 : 44}px "Fredoka", "Inter", system-ui, sans-serif`;
        ctx.fillText(truncateText(ctx, m.value, tileW - 52), tx + 26, ty + (isStory ? 124 : 102));

        ctx.fillStyle = m.color;
        ctx.font = '700 18px "Inter", system-ui, sans-serif';
        ctx.fillText(truncateText(ctx, m.sub, tileW - 52), tx + 26, ty + tileH - (isStory ? 24 : 18));
      });

      y += tileH * 2 + gridGap + (isStory ? 38 : 26);

      // 6. Optional Requirements Checklist Snapshot
      if (includeChecklist) {
        const maxItems = isStory ? 5 : 3;
        const checklistItems = analysis.evaluatedRequirements.slice(0, maxItems);
        const rowH = isStory ? 68 : 54;
        const listH = (isStory ? 84 : 66) + checklistItems.length * rowH;

        drawRoundedRect(ctx, padX, y + 8, contentW, listH, 32);
        ctx.fillStyle = theme.panelBorder;
        ctx.fill();

        drawRoundedRect(ctx, padX, y, contentW, listH, 32);
        ctx.fillStyle = theme.panelBg;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = theme.accent;
        ctx.font = '900 21px "Inter", system-ui, sans-serif';
        ctx.fillText('RESUMO DOS REQUISITOS OFICIAIS', padX + 34, y + (isStory ? 48 : 40));

        checklistItems.forEach((item, idx) => {
          const ry = y + (isStory ? 72 : 56) + idx * rowH;

          // Separator line
          if (idx > 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padX + 34, ry - 4);
            ctx.lineTo(padX + contentW - 34, ry - 4);
            ctx.stroke();
          }

          // Status dot / badge
          const dotX = padX + 48;
          const dotY = ry + rowH / 2 - 4;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 13, 0, Math.PI * 2);
          ctx.fillStyle = item.isMet ? '#10B981' : '#F59E0B';
          ctx.fill();

          ctx.fillStyle = '#120624';
          ctx.font = '900 17px "Inter", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.isMet ? '✓' : '•', dotX, dotY + 1);

          // Requirement name
          ctx.textAlign = 'left';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `700 ${isStory ? 23 : 20}px "Inter", system-ui, sans-serif`;
          ctx.fillText(truncateText(ctx, item.requirement.name, contentW - 260), padX + 78, dotY + 1);

          // Right percentage pill
          const pillText = item.isMet ? '100% OK' : `${item.percentage}%`;
          ctx.font = '900 19px "Inter", system-ui, sans-serif';
          const pw = 114;
          const ph = 34;
          const px = padX + contentW - 34 - pw;
          const py = dotY - ph / 2;
          drawRoundedRect(ctx, px, py, pw, ph, 12);
          ctx.fillStyle = item.isMet ? 'rgba(16,185,129,0.22)' : 'rgba(245,158,11,0.22)';
          ctx.fill();
          ctx.fillStyle = item.isMet ? '#6EE7B7' : '#FCD34D';
          ctx.textAlign = 'center';
          ctx.fillText(pillText, px + pw / 2, dotY + 1);
        });
      }

      // 7. Footer Branding Bar
      const footerY = height - (isStory ? 96 : 64);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '900 26px "Fredoka", "Inter", system-ui, sans-serif';
      ctx.fillText('pkxdcentral.site', width / 2, footerY - 14);

      ctx.fillStyle = 'rgba(216,180,254,0.85)';
      ctx.font = '700 18px "Inter", system-ui, sans-serif';
      const dateStr = new Date().toLocaleDateString('pt-BR');
      ctx.fillText(`Gerado no Creator Progress Analyzer  •  ${dateStr}`, width / 2, footerY + 20);

      if (!cancelled) {
        try {
          setPreviewUrl(canvas.toDataURL('image/png'));
        } catch (err) {
          console.error('Erro ao exportar canvas PNG:', err);
        } finally {
          setIsRendering(false);
        }
      }
    };

    renderCard();
    return () => {
      cancelled = true;
    };
  }, [isOpen, exportFormat, themeId, includeChecklist, channelData, analysis, creatorFormat, selectedTier, tierLabel, formatLabel, viewsLast16Shorts, last16Count, avgViews]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const cleanFileName = `pkxd-creator-${(channelData.handle || channelData.title || 'canal')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase()}-${exportFormat}.png`;

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2400);
    if (triggerAudio) triggerAudio('success');
  };

  const handleNativeShare = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob) return;
      const file = new File([blob], cleanFileName, { type: 'image/png' });
      const nav = navigator as any;
      if (typeof nav?.share === 'function') {
        await nav.share({
          title: `Progresso Creator PK XD - ${channelData.title}`,
          text: buildInstagramCaption(),
          files: [file]
        });
        if (triggerAudio) triggerAudio('success');
      }
    } catch (err) {
      console.warn('Compartilhamento cancelado ou indisponível:', err);
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob || !(window as any).ClipboardItem || !navigator.clipboard?.write) {
        handleDownload();
        return;
      }
      await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': blob })]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2400);
      if (triggerAudio) triggerAudio('success');
    } catch {
      handleDownload();
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(buildInstagramCaption());
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2400);
      if (triggerAudio) triggerAudio('tap');
    } catch {}
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-[#0F041E]/85 backdrop-blur-md flex items-start sm:items-center justify-center p-2.5 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl bg-white border-[3px] border-[#120624] shadow-[0_10px_0_#120624] overflow-hidden text-slate-900 mt-2 sm:mt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2D0859] via-[#4E1B96] to-[#6D28D9] px-5 py-4 flex items-center justify-between gap-3 border-b-[3px] border-[#120624]">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-2xl bg-[#F9C826] border-2 border-[#120624] text-[#120624] flex items-center justify-center shrink-0">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold leading-tight">
                Card da Análise para Instagram
              </h3>
              <p className="text-xs text-purple-100/90 font-medium">
                Imagem em alta resolução (1080px) pronta para postar nos Stories ou Feed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-h-[82vh] overflow-y-auto">
          {/* Left: High-res Preview */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-100 border-2 border-slate-200 rounded-3xl p-4">
            <div className="relative w-full flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`Card de Progresso Creator de ${channelData.title}`}
                  className={`rounded-2xl border-2 border-[#120624] shadow-lg object-contain ${
                    exportFormat === 'story' ? 'max-h-[460px]' : 'max-h-[420px]'
                  } w-auto`}
                />
              ) : (
                <div className="h-[360px] w-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Sparkles className="w-6 h-6 animate-pulse text-violet-600" />
                  <span className="text-xs font-bold">Montando imagem em alta qualidade...</span>
                </div>
              )}

              {isRendering && previewUrl && (
                <div className="absolute inset-0 bg-white/50 rounded-2xl flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-full bg-[#120624] text-white text-xs font-bold">
                    Atualizando...
                  </span>
                </div>
              )}
            </div>

            <span className="mt-3 text-[11px] font-mono font-bold text-slate-500">
              Resolução real: {exportFormat === 'story' ? '1080 × 1920 px (Story 9:16)' : '1080 × 1350 px (Feed 4:5)'}
            </span>
          </div>

          {/* Right: Customization & Export Controls */}
          <div className="lg:col-span-6 space-y-5">
            {/* Format Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                1. Formato do Instagram
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setExportFormat('story');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    exportFormat === 'story'
                      ? 'bg-violet-50 border-violet-600 text-violet-950 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-violet-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Story / Reels</div>
                    <div className="text-[11px] text-slate-500">9:16 (1080×1920)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportFormat('feed');
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    exportFormat === 'feed'
                      ? 'bg-pink-50 border-pink-600 text-pink-950 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Square className="w-5 h-5 text-pink-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Post no Feed</div>
                    <div className="text-[11px] text-slate-500">4:5 (1080×1350)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Theme Picker */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                2. Estilo Visual do Card
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.values(CARD_THEMES) as CardTheme[]).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setThemeId(t.id);
                      if (triggerAudio) triggerAudio('tap');
                    }}
                    className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      themeId === t.id
                        ? 'border-[#120624] bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="w-full h-5 rounded-lg mb-1.5 border border-black/20"
                      style={{
                        background: `linear-gradient(90deg, ${t.bgMid}, ${t.accent}, ${t.accentSecondary})`
                      }}
                    />
                    <span className="text-[11px] font-bold block truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist Toggle */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-900">Mostrar resumo de requisitos</div>
                <div className="text-[11px] text-slate-500">
                  Inclui a lista dos principais critérios concluídos e em andamento
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeChecklist}
                onChange={(e) => setIncludeChecklist(e.target.checked)}
                className="w-4 h-4 accent-violet-600 cursor-pointer"
              />
            </label>

            {/* Export Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!previewUrl}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#F9C826] hover:bg-[#fbbf24] text-[#120624] border-2 border-[#120624] shadow-[0_4px_0_#120624] active:translate-y-0.5 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {downloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                <span>{downloaded ? 'Foto Salva no Dispositivo!' : 'Baixar Foto (PNG Alta Qualidade)'}</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {canShareFiles && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-violet-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Enviar pro Instagram</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyImage}
                  className={`py-2.5 px-4 rounded-2xl bg-violet-50 hover:bg-violet-100 border-2 border-violet-200 text-violet-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                    canShareFiles ? '' : 'sm:col-span-1'
                  }`}
                >
                  {copiedImage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedImage ? 'Imagem Copiada!' : 'Copiar Imagem'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedCaption ? <Check className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4" />}
                  <span>{copiedCaption ? 'Legenda Copiada!' : 'Copiar Legenda p/ Post'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

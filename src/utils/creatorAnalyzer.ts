import {
  CreatorRequirement,
  ChannelMetrics,
  CreatorFormat,
  ProgramTier,
  EvaluatedRequirement,
  AnalysisSummary
} from '../types/creator';

export function evaluateRequirements(
  requirements: CreatorRequirement[],
  channel: ChannelMetrics,
  format: CreatorFormat,
  targetTier: ProgramTier = 'stardust'
): AnalysisSummary {
  const relevantReqs = requirements.filter((req) => {
    if (req.applicableFormat && req.applicableFormat !== 'both' && format !== 'both') {
      if (req.applicableFormat !== format) return false;
    }

    if (targetTier === 'rising_star') {
      return req.category === 'rising_star' || req.category === 'admission';
    } else {
      return req.category === 'admission' || req.category === 'stardust';
    }
  });

  const groupMetMap: Record<string, boolean> = {};

  const recentVideos = channel.recentVideos || [];
  const longVideos = recentVideos.filter((v) => !v.isShort);
  const shortVideos = recentVideos.filter((v) => v.isShort);

  // Derive accurate real metrics even if loaded from an older cached shape
  const detectedLong5Min =
    channel.longVideos5MinCount ??
    longVideos.filter((v) => v.isLong5Min || (v.durationSeconds !== undefined && v.durationSeconds >= 300)).length;

  const detectedLongTotal = channel.longVideosCount ?? longVideos.length;
  const detectedShortsTotal = channel.shortsCount ?? shortVideos.length;

  const detectedPkxdLongs =
    channel.pkxdLongVideosDetected ??
    longVideos.filter((v) => v.isPkxdContent).length;

  const detectedPkxdShorts =
    channel.pkxdShortsDetected ??
    shortVideos.filter((v) => v.isPkxdContent).length;

  // Compute total views fallback from recent videos if totalViews is missing
  const recentViewsSum = recentVideos.reduce((acc, v) => acc + (v.views || 0), 0);
  const effectiveTotalViews =
    (channel.totalViews && channel.totalViews > 0 ? channel.totalViews : 0) ||
    (channel.viewsLast90Days && channel.viewsLast90Days > 0 ? channel.viewsLast90Days : 0) ||
    recentViewsSum ||
    (channel.views3MonthsEstimated || 0);

  // Compute real 30-day upload frequency from actual video dates
  const calcLast30Days = (list: typeof recentVideos) => {
    let count = 0;
    let hasAnyDate = false;
    for (const v of list) {
      let days = v.publishedDaysAgo;
      if (days === undefined && v.publishedAt) {
        const ts = new Date(v.publishedAt).getTime();
        if (!Number.isNaN(ts)) {
          days = Math.max(0, Math.floor((Date.now() - ts) / 86400000));
        }
      }
      if (days !== undefined) {
        hasAnyDate = true;
        if (days <= 31) count++;
      }
    }
    return { count, hasAnyDate };
  };

  const preliminaryEvaluations = relevantReqs.map((req) => {
    let currentValue = 0;
    let isAutoVerified = req.autoVerifiable;

    switch (req.metricType) {
      case 'subscribers':
        currentValue = channel.subscriberCount || 0;
        isAutoVerified = true;
        break;

      case 'views_3months': {
        // Only apply manual override if user explicitly typed a positive number
        const manualViews = channel.manualOverrides?.pkxdViews3Months;
        if (typeof manualViews === 'number' && manualViews > 0) {
          currentValue = manualViews;
          isAutoVerified = false;
        } else if (typeof channel.viewsLast16Shorts === 'number') {
          currentValue = channel.viewsLast16Shorts;
          isAutoVerified = true;
        } else {
          // Fallback: sum strictly the newest 16 Shorts from recentVideos (never lifetime totalViews)
          const last16Shorts = shortVideos.slice(0, 16);
          currentValue = last16Shorts.reduce((acc, v) => acc + (v.views || 0), 0);
          isAutoVerified = true;
        }
        break;
      }

      case 'pkxd_long_videos': {
        const manualLongs = channel.manualOverrides?.pkxdLongVideosCount;
        if (typeof manualLongs === 'number' && manualLongs > 0) {
          currentValue = manualLongs;
          isAutoVerified = false;
        } else if (detectedLong5Min > 0) {
          // Real count of long videos (>= 5 min) detected from the channel's /videos tab or API
          // If the channel is a PK XD channel and has more total videos than our sample window, reflect detected long videos accurately
          currentValue = channel.isPkxdChannel
            ? Math.max(detectedLong5Min, detectedPkxdLongs > 0 ? detectedPkxdLongs : detectedLong5Min)
            : detectedLong5Min;
          isAutoVerified = true;
        } else if (detectedPkxdLongs > 0) {
          currentValue = detectedPkxdLongs;
          isAutoVerified = true;
        } else if (detectedLongTotal > 0) {
          currentValue = detectedLongTotal;
          isAutoVerified = true;
        } else {
          currentValue = channel.videoCount || 0;
          isAutoVerified = (channel.videoCount || 0) > 0;
        }
        break;
      }

      case 'pkxd_shorts': {
        const manualShorts = channel.manualOverrides?.pkxdShortsCount;
        if (typeof manualShorts === 'number' && manualShorts > 0) {
          currentValue = manualShorts;
          isAutoVerified = false;
        } else if (detectedPkxdShorts > 0) {
          currentValue = detectedPkxdShorts;
          isAutoVerified = true;
        } else if (detectedShortsTotal > 0) {
          currentValue = detectedShortsTotal;
          isAutoVerified = true;
        } else {
          currentValue = channel.videoCount || 0;
          isAutoVerified = (channel.videoCount || 0) > 0;
        }
        break;
      }

      case 'monthly_frequency': {
        if (format === 'shorts') {
          if (typeof channel.shortsLast30Days === 'number' && channel.shortsLast30Days > 0) {
            currentValue = channel.shortsLast30Days;
            isAutoVerified = true;
          } else {
            const s30 = calcLast30Days(shortVideos);
            const all30 = calcLast30Days(recentVideos);
            if (s30.hasAnyDate) {
              currentValue = s30.count;
              isAutoVerified = true;
            } else if (typeof channel.videosLast30Days === 'number' && channel.videosLast30Days > 0) {
              currentValue = channel.videosLast30Days;
              isAutoVerified = true;
            } else if (all30.hasAnyDate) {
              currentValue = all30.count;
              isAutoVerified = true;
            } else {
              currentValue = Math.min(detectedShortsTotal, Math.round((channel.videoCount || 0) / 12));
              isAutoVerified = false;
            }
          }
        } else {
          if (typeof channel.longVideosLast30Days === 'number' && channel.longVideosLast30Days > 0) {
            currentValue = channel.longVideosLast30Days;
            isAutoVerified = true;
          } else {
            const l30 = calcLast30Days(longVideos);
            const all30 = calcLast30Days(recentVideos);
            if (l30.hasAnyDate) {
              currentValue = l30.count;
              isAutoVerified = true;
            } else if (typeof channel.videosLast30Days === 'number' && channel.videosLast30Days > 0) {
              currentValue = channel.videosLast30Days;
              isAutoVerified = true;
            } else if (all30.hasAnyDate) {
              currentValue = all30.count;
              isAutoVerified = true;
            } else {
              currentValue = Math.round((channel.videoCount || 0) / 12);
              isAutoVerified = false;
            }
          }
        }
        break;
      }

      case 'avg_views': {
        if (format === 'shorts' && channel.averageShortViews && channel.averageShortViews > 0) {
          currentValue = channel.averageShortViews;
        } else if (format === 'long_video' && channel.averageLongViews && channel.averageLongViews > 0) {
          currentValue = channel.averageLongViews;
        } else if (channel.averageRecentViews && channel.averageRecentViews > 0) {
          currentValue = channel.averageRecentViews;
        } else if (effectiveTotalViews > 0 && channel.videoCount > 0) {
          currentValue = Math.round(effectiveTotalViews / channel.videoCount);
        } else {
          currentValue = 0;
        }
        isAutoVerified = true;
        break;
      }

      case 'community_compliance':
        currentValue = channel.manualOverrides?.communityCompliant ? 1 : 0;
        isAutoVerified = false;
        break;

      case 'program_terms':
        currentValue = channel.manualOverrides?.termsAccepted ? 1 : 0;
        isAutoVerified = false;
        break;

      default:
        currentValue = 0;
        break;
    }

    const isMet = currentValue >= req.targetValue;
    if (req.eitherOrGroupId && isMet) {
      groupMetMap[req.eitherOrGroupId] = true;
    }

    return {
      req,
      currentValue,
      isAutoVerified,
      isMet
    };
  });

  const evaluatedRequirements: EvaluatedRequirement[] = preliminaryEvaluations.map((item) => {
    const { req, currentValue, isAutoVerified } = item;
    let isMet = item.isMet;
    let isEitherOrMet = false;

    if (req.eitherOrGroupId && groupMetMap[req.eitherOrGroupId]) {
      isEitherOrMet = true;
      isMet = true;
    }

    const percentage =
      req.targetValue > 0
        ? Math.min(100, Math.round(((Number(currentValue) || 0) / req.targetValue) * 100))
        : 100;

    let deficitText: string | undefined;
    let estimateText: string | undefined;
    let statusMessage = '';

    if (isMet) {
      statusMessage =
        isEitherOrMet && !item.isMet
          ? `Requisito atendido pela opção alternativa (${req.eitherOrLabel})`
          : 'Requisito atingido';
    } else {
      if (!isAutoVerified && currentValue === 0 && (req.metricType === 'community_compliance' || req.metricType === 'program_terms')) {
        statusMessage = 'Confirmação manual necessária.';
        deficitText = 'Requer confirmação direta do criador';
      } else {
        const remaining = Math.max(0, req.targetValue - Number(currentValue));
        deficitText = `Faltam ${remaining.toLocaleString('pt-BR')} ${req.unit}`;
        statusMessage = `Faltam ${remaining.toLocaleString('pt-BR')} para cumprir este requisito`;

        estimateText = `Você está a ${remaining.toLocaleString('pt-BR')} ${req.unit} de atingir esse requisito.`;

        if (req.metricType === 'subscribers') {
          const monthlyGrowth =
            channel.estimatedMonthlyGrowth && channel.estimatedMonthlyGrowth > 0
              ? channel.estimatedMonthlyGrowth
              : 120;
          const monthsNeeded = Math.ceil(remaining / monthlyGrowth);
          estimateText += `\nRitmo estimado de ~${monthlyGrowth.toLocaleString('pt-BR')} novos inscritos/mês: aproximadamente ${monthsNeeded} ${monthsNeeded === 1 ? 'mês' : 'meses'} para alcançar a meta.`;
        } else if (req.metricType === 'monthly_frequency') {
          estimateText += '\nPublicar com constância nos últimos 30 dias acelera a aprovação no programa.';
        }
      }
    }

    return {
      requirement: req,
      currentValue,
      targetValue: req.targetValue,
      percentage: isMet ? 100 : percentage,
      isMet,
      isAutoVerified,
      statusMessage,
      deficitText,
      estimateText,
      isEitherOrMet
    };
  });

  const totalScore = evaluatedRequirements.reduce((acc, curr) => acc + curr.percentage, 0);
  const overallPercentage =
    evaluatedRequirements.length > 0 ? Math.round(totalScore / evaluatedRequirements.length) : 0;

  const metList = evaluatedRequirements.filter((r) => r.isMet);
  const pendingList = evaluatedRequirements
    .filter((r) => !r.isMet)
    .sort((a, b) => {
      if (a.requirement.isRequired && !b.requirement.isRequired) return -1;
      if (!a.requirement.isRequired && b.requirement.isRequired) return 1;
      return a.percentage - b.percentage;
    });

  const isAllRequiredMet = evaluatedRequirements
    .filter((r) => r.requirement.isRequired)
    .every((r) => r.isMet);

  return {
    channel,
    creatorFormat: format,
    targetTier,
    overallPercentage,
    metCount: metList.length,
    totalCount: evaluatedRequirements.length,
    isAllRequiredMet,
    evaluatedRequirements,
    pendingRequirements: pendingList,
    metRequirements: metList
  };
}

export interface TierProgressionStatus {
  tierId: ProgramTier;
  level: number;
  name: string;
  isUnlocked: boolean;
  percentage: number;
  metCount: number;
  totalCount: number;
  subscribersNeeded: number;
  isCurrent: boolean;
  isNextToClimb: boolean;
  summary: AnalysisSummary;
}

export function getChannelTierProgressions(
  requirements: CreatorRequirement[],
  channel: ChannelMetrics,
  format: CreatorFormat
): {
  currentTier: ProgramTier | 'aspirant';
  nextTier: ProgramTier | null;
  progressions: TierProgressionStatus[];
} {
  const tiers: { id: ProgramTier; level: number; name: string }[] = [
    { id: 'stardust', level: 1, name: 'Stardust' },
    { id: 'rising_star', level: 2, name: 'Rising Star' }
  ];

  const evaluations: { tier: (typeof tiers)[0]; summary: AnalysisSummary }[] = tiers.map((t) => ({
    tier: t,
    summary: evaluateRequirements(requirements, channel, format, t.id)
  }));

  let currentTier: ProgramTier | 'aspirant' = 'aspirant';
  for (const item of evaluations) {
    if (item.summary.isAllRequiredMet) {
      currentTier = item.tier.id;
    } else {
      break;
    }
  }

  const nextTierItem = evaluations.find((item) => !item.summary.isAllRequiredMet);
  const nextTier: ProgramTier | null = nextTierItem ? nextTierItem.tier.id : null;

  const progressions: TierProgressionStatus[] = evaluations.map((item) => {
    const isUnlocked = item.summary.isAllRequiredMet;
    const isCurrent = currentTier === item.tier.id;
    const isNextToClimb = nextTier === item.tier.id;

    const subReq = item.summary.evaluatedRequirements.find((r) => r.requirement.metricType === 'subscribers');
    const subCurrent = typeof subReq?.currentValue === 'number' ? subReq.currentValue : channel.subscriberCount || 0;
    const subTarget = subReq?.targetValue || 1000;
    const subscribersNeeded = Math.max(0, subTarget - subCurrent);

    return {
      tierId: item.tier.id,
      level: item.tier.level,
      name: item.tier.name,
      isUnlocked,
      percentage: item.summary.overallPercentage,
      metCount: item.summary.metCount,
      totalCount: item.summary.totalCount,
      subscribersNeeded,
      isCurrent,
      isNextToClimb,
      summary: item.summary
    };
  });

  return {
    currentTier,
    nextTier,
    progressions
  };
}

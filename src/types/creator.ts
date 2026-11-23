export type MetricType = 
  | 'subscribers' 
  | 'views_3months' 
  | 'pkxd_long_videos' 
  | 'pkxd_shorts' 
  | 'monthly_frequency' 
  | 'avg_views' 
  | 'community_compliance' 
  | 'program_terms';

export type CreatorFormat = 'long_video' | 'shorts' | 'both';

export type ProgramTier = 'admission' | 'stardust' | 'rising_star';

export interface TierInfo {
  id: ProgramTier;
  level: number;
  name: string;
  badgeName: string;
  tagline: string;
  icon: string;
  accentColor: string;
  borderClass: string;
  bgGradient: string;
  minSubscribersLong: number;
  minSubscribersShorts: number;
  minAvgViewsLong: number;
  minAvgViewsShorts: number;
  monthlyFrequency: number;
  monthlyGems: number;
  benefits: string[];
}

export interface CreatorRequirement {
  id: string;
  name: string;
  metricType: MetricType;
  category: ProgramTier;
  targetValue: number;
  unit: string;
  isRequired: boolean;
  description: string;
  officialSourceUrl: string;
  lastUpdated: string;
  autoVerifiable: boolean;
  applicableFormat?: CreatorFormat;
  eitherOrGroupId?: string;
  eitherOrLabel?: string;
  notes?: string;
}

export interface YouTubeRecentVideo {
  id: string;
  title: string;
  publishedAt: string;
  publishedText?: string;
  publishedDaysAgo?: number;
  durationSeconds?: number;
  durationText?: string;
  views?: number;
  isShort?: boolean;
  isLong5Min?: boolean;
  isPkxdContent?: boolean;
  thumbnailUrl?: string;
}

export interface ChannelMetrics {
  channelId: string;
  title: string;
  handle: string;
  avatarUrl: string;
  subscriberCount: number;
  videoCount: number;
  totalViews?: number;
  views3MonthsEstimated?: number;
  viewsLast90Days?: number;
  viewsLast16Shorts?: number;
  last16ShortsCount?: number;
  longVideosCount?: number;
  longVideos5MinCount?: number;
  shortsCount?: number;
  pkxdLongVideosDetected?: number;
  pkxdShortsDetected?: number;
  videosLast30Days?: number;
  longVideosLast30Days?: number;
  shortsLast30Days?: number;
  recentVideos: YouTubeRecentVideo[];
  estimatedMonthlyGrowth?: number;
  averageRecentViews?: number;
  averageLongViews?: number;
  averageShortViews?: number;
  pkxdVideosDetected?: number;
  isPkxdChannel?: boolean;
  isPublicDataAvailable: boolean;
  dataSource?: 'youtube_api' | 'youtube_oauth' | 'youtube_public_scrape' | 'fallback_sample';
  lastCheckedAt: string;
  // User overrides / manual declarations for non-public data
  manualOverrides?: {
    pkxdLongVideosCount?: number;
    pkxdShortsCount?: number;
    pkxdViews3Months?: number;
    communityCompliant?: boolean;
    termsAccepted?: boolean;
  };
}

export interface EvaluatedRequirement {
  requirement: CreatorRequirement;
  currentValue: number | boolean;
  targetValue: number;
  percentage: number;
  isMet: boolean;
  isAutoVerified: boolean;
  statusMessage: string;
  deficitText?: string;
  estimateText?: string;
  isEitherOrMet?: boolean;
}

export interface AnalysisSummary {
  channel: ChannelMetrics;
  creatorFormat: CreatorFormat;
  targetTier: ProgramTier;
  overallPercentage: number;
  metCount: number;
  totalCount: number;
  isAllRequiredMet: boolean;
  evaluatedRequirements: EvaluatedRequirement[];
  pendingRequirements: EvaluatedRequirement[];
  metRequirements: EvaluatedRequirement[];
}

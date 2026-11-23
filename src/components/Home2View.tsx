import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Sparkles,
  Users,
  Award,
  ArrowRight,
  Clock,
  Newspaper,
  Video,
  MessageSquarePlus,
  Flag,
  Play,
  ExternalLink,
  Search,
  CheckCircle2,
  Gift,
  Palette,
  Target,
  Trash2,
  Edit3,
  X,
  Share2,
  BookOpen,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import {
  NewsItem,
  FeaturedVideo,
  Theory,
  ShortItem,
  PastSpoiler,
  CommunityEvent,
  Poll,
  Post,
} from '../types';
import CountdownWidget from './CountdownWidget';
import GiftCountdown from './GiftCountdown';
import PastSpoilersSection from './PastSpoilersSection';
import UpcomingStreamsSection from './UpcomingStreamsSection';
import WhatsAppPromo from './WhatsAppPromo';
import PartnerChannelPromo from './PartnerChannelPromo';
import PWAInstaller from './PWAInstaller';

interface Home2ViewProps {
  user: any;
  isAdmin: boolean;
  fanLevel: number;
  newsList: NewsItem[];
  featuredList: FeaturedVideo[];
  theoriesList: Theory[];
  shortsList: ShortItem[];
  pastSpoilers: PastSpoiler[];
  spoilerTitle: string;
  spoilerDesc: string;
  spoilerImage: string;
  forceReveal: boolean;
  revealedAt: number;
  isDelayed: boolean;
  delayMessage: string;
  extraCountdownTitle: string;
  extraCountdownDate: string;
  extraCountdownEnabled: boolean;
  giftCountdownTitle: string;
  giftCountdownDate: string;
  giftCountdownEnabled: boolean;
  giftCountdownContent: string;
  whatsappChannelUrl: string;
  onNavigate: (path: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onAddXP: (amount: number, reason: string) => void;
  onOpenFullscreenSpoiler: (title: string, desc: string, imageUrl?: string) => void;
  onDeletePastSpoiler: (id: string) => void;
  onEditPastSpoiler: (spoil: PastSpoiler) => void;
  onRatePastSpoiler: (id: string, rating: number) => void;
  onReactPastSpoiler: (id: string, emoji: string) => void;
  onEditNews: (item: NewsItem) => void;
  onDeleteNews: (id: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
}

const NEWS_CATEGORY_LABELS: Record<NewsItem['category'], string> = {
  updates: 'Atualizações',
  spoilers: 'Spoilers',
  codes: 'Códigos',
  events: 'Eventos',
};

export default function Home2View({
  user,
  isAdmin,
  fanLevel,
  newsList,
  featuredList,
  theoriesList,
  shortsList,
  pastSpoilers,
  spoilerTitle,
  spoilerDesc,
  spoilerImage,
  forceReveal,
  revealedAt,
  isDelayed,
  delayMessage,
  extraCountdownTitle,
  extraCountdownDate,
  extraCountdownEnabled,
  giftCountdownTitle,
  giftCountdownDate,
  giftCountdownEnabled,
  giftCountdownContent,
  whatsappChannelUrl,
  onNavigate,
  onOpenAuth,
  onAddXP,
  onOpenFullscreenSpoiler,
  onDeletePastSpoiler,
  onEditPastSpoiler,
  onRatePastSpoiler,
  onReactPastSpoiler,
  onEditNews,
  onDeleteNews,
  triggerAudio,
}: Home2ViewProps) {
  // News states
  const [newsCategory, setNewsCategory] = useState<'all' | NewsItem['category']>('all');
  const [newsSearch, setNewsSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);

  // Live Events preview from Firestore
  const [eventsPreview, setEventsPreview] = useState<CommunityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'live' | 'past'>('all');

  // Live Polls & Mural preview
  const [latestPoll, setLatestPoll] = useState<Poll | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);

  // Hero Live Mini-Countdown to Next Monday 17:30
  const [miniCountdown, setMiniCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateMiniClock = () => {
      const now = new Date();
      const target = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilMon = (1 + 7 - dayOfWeek) % 7;
      target.setDate(now.getDate() + daysUntilMon);
      target.setHours(17, 30, 0, 0);
      if (dayOfWeek === 1 && now.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 7);
      }
      const diff = Math.max(0, target.getTime() - now.getTime());
      setMiniCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    updateMiniClock();
    const timer = setInterval(updateMiniClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Events listener
  useEffect(() => {
    const q = query(collection(db, 'community_events'), orderBy('createdAt', 'desc'), limit(24));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: CommunityEvent[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as CommunityEvent;
          if (data.status !== 'Em análise' || isAdmin) {
            list.push({ ...data, id: docSnap.id });
          }
        });
        setEventsPreview(list);
        setEventsLoading(false);
      },
      () => {
        setEventsLoading(false);
      }
    );
    return () => unsub();
  }, [isAdmin]);

  // Real-time Poll & Recent Mural Posts
  useEffect(() => {
    const qPoll = query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(1));
    const unsubPoll = onSnapshot(
      qPoll,
      (snap) => {
        if (!snap.empty) {
          const d = snap.docs[0];
          setLatestPoll({ id: d.id, ...(d.data() as Omit<Poll, 'id'>) });
        } else {
          setLatestPoll(null);
        }
      },
      () => {}
    );

    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(3));
    const unsubPosts = onSnapshot(
      qPosts,
      (snap) => {
        const items: Post[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<Post, 'id'>) }));
        setRecentPosts(items);
      },
      () => {}
    );

    return () => {
      unsubPoll();
      unsubPosts();
    };
  }, []);

  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      const catMatch = newsCategory === 'all' || item.category === newsCategory;
      const q = newsSearch.trim().toLowerCase();
      const textMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [newsList, newsCategory, newsSearch]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return eventsPreview
      .filter((ev) => {
        if (eventFilter === 'all') return true;
        if (eventFilter === 'live') return ev.status === 'Ao vivo';
        if (eventFilter === 'past') return ev.status === 'Encerrado' || (ev.date && ev.date < todayStr);
        if (eventFilter === 'upcoming') {
          return ev.status === 'Em breve' || ev.status === 'Aprovado' || (ev.date && ev.date >= todayStr);
        }
        return true;
      })
      .slice(0, 6);
  }, [eventsPreview, eventFilter]);

  const featuredCreators = useMemo(() => {
    const seen = new Set<string>();
    const list: { author: string; title: string; url: string }[] = [];
    featuredList.forEach((v) => {
      const author = (v.author || 'Criador PK XD').trim();
      if (!seen.has(author)) {
        seen.add(author);
        list.push({ author, title: v.title, url: v.youtubeUrl });
      }
    });
    return list.slice(0, 4);
  }, [featuredList]);

  const getYoutubeThumb = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/shorts\/)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = match && match[2].length === 11 ? match[2] : null;
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    } catch {
      return null;
    }
  };

  const hasActiveCustomSpoiler =
    spoilerTitle &&
    !spoilerTitle.toLowerCase().includes('aguardando próximos spoilers');

  const opportunities = [
    {
      id: 'panel',
      title: 'Painel de Destaques',
      summary: 'Envie seus melhores vídeos e gameplays de PK XD para ganhar destaque na vitrine oficial da comunidade.',
      benefit: 'Visibilidade na Home e perfil na área de Criadores',
      route: '/inscricoes#panel',
      accentBg: 'bg-violet-600',
    },
    {
      id: 'shorts',
      title: 'Vitrine Shorts PK XD',
      summary: 'Mostre vídeos curtos criativos, desafios e dicas rápidas para milhares de jogadores.',
      benefit: 'Presença no carrossel de Shorts da Semana',
      route: '/inscricoes#shorts',
      accentBg: 'bg-sky-600',
    },
    {
      id: 'theory',
      title: 'Teorias & Redação',
      summary: 'Compartilhe descobertas, teorias sobre atualizações e análises do universo PK XD.',
      benefit: 'Publicação creditada e +XP no seu PKXD ID',
      route: '/inscricoes#theory',
      accentBg: 'bg-pink-600',
    },
    {
      id: 'admin',
      title: 'Equipe PKXD Central',
      summary: 'Participe da organização de eventos, moderação e curadoria de novidades da plataforma.',
      benefit: 'Acesso à equipe organizadora e ferramentas de moderação',
      route: '/inscricoes#admin',
      accentBg: 'bg-amber-500',
    },
  ];

  return (
    <div className="space-y-0">
      {/* PWA & Offline Helper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <PWAInstaller onAddXP={onAddXP} triggerAudio={triggerAudio} />
      </div>

      {/* =====================================================================
          1. HERO SECTION (Light purple composition with subtle 20% XD pattern)
      ====================================================================== */}
      <section className="pkxd-dot-pattern border-b border-purple-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copy & Primary Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <p className="text-sm font-bold text-violet-800 tracking-wide">
                Comunidade Independente do Universo PK XD
              </p>

              <h1
                className="font-display font-bold text-slate-950 leading-[1.08] tracking-tight text-balance"
                style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.65rem)' }}
              >
                Notícias, eventos e oportunidades para quem vive o PK XD
              </h1>

              <p className="text-base sm:text-lg text-slate-700 max-w-2xl leading-relaxed">
                Acompanhe atualizações e spoilers semanais em tempo real, confirme presença em eventos criados por jogadores, descubra criadores e participe dos projetos da PKXD Central.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate('/eventos');
                  }}
                  className="pkxd-btn-primary px-6 py-3.5 rounded-full text-base font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Explorar Eventos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate('/inscricoes');
                  }}
                  className="pkxd-btn-gold px-6 py-3.5 rounded-full text-base font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Ver Oportunidades</span>
                </button>

                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      onNavigate('/pkxd-id');
                    }}
                    className="pkxd-btn-outline px-5 py-3.5 rounded-full text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Meu PKXD ID · Lv.{fanLevel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      onOpenAuth('register');
                    }}
                    className="pkxd-btn-outline px-5 py-3.5 rounded-full text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Criar Conta Grátis</span>
                  </button>
                )}
              </div>

              {/* Clean factual quick links / summary */}
              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    document.getElementById('novidades-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="font-semibold hover:text-violet-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Newspaper className="w-4 h-4 text-violet-700" />
                  <span>{newsList.length} notícias publicadas</span>
                </button>
                <span aria-hidden="true" className="text-purple-400">·</span>
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate('/eventos');
                  }}
                  className="font-semibold hover:text-sky-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 tabular-nums"
                >
                  <Calendar className="w-4 h-4 text-sky-700" />
                  <span>{eventsPreview.length} eventos na agenda</span>
                </button>
                <span aria-hidden="true" className="text-purple-400">·</span>
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate('/criadores');
                  }}
                  className="font-semibold hover:text-pink-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 tabular-nums"
                >
                  <Video className="w-4 h-4 text-pink-600" />
                  <span>{featuredList.length + shortsList.length} vídeos em destaque</span>
                </button>
              </div>
            </div>

            {/* Right Interactive Showcase Card (Glassmorphism on card) */}
            <div className="lg:col-span-5">
              <div className="pkxd-glass rounded-[36px] p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
                    Radar Semanal PK XD
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Segundas · 17h30
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-display font-bold text-2xl text-slate-900">
                    {hasActiveCustomSpoiler ? spoilerTitle : 'Próximo Spoiler Oficial'}
                  </h2>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {isDelayed && delayMessage
                      ? delayMessage
                      : hasActiveCustomSpoiler
                      ? 'Spoiler ativo publicado pela equipe. Confira os detalhes logo abaixo!'
                      : 'Contagem regressiva em tempo real para a próxima revelação semanal da comunidade.'}
                  </p>
                </div>

                {/* Tabular Countdown Strip */}
                <div className="grid grid-cols-4 gap-2.5 text-center">
                  {[
                    { label: 'Dias', val: miniCountdown.days },
                    { label: 'Horas', val: miniCountdown.hours },
                    { label: 'Min', val: miniCountdown.minutes },
                    { label: 'Seg', val: miniCountdown.seconds },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="rounded-3xl bg-violet-100/80 border border-purple-200/70 py-3 px-2"
                    >
                      <span className="block font-mono font-bold text-2xl text-violet-800 tabular-nums leading-none">
                        {String(unit.val).padStart(2, '0')}
                      </span>
                      <span className="block text-[11px] font-bold text-slate-600 uppercase mt-1">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Actions inside Showcase */}
                <div className="pt-1 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      document.getElementById('countdown-card-root')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Ver Spoilers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      onNavigate('/progresso-creator');
                    }}
                    className="px-4 py-2.5 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Award className="w-3.5 h-3.5 text-sky-600" />
                    <span>Progresso Creator</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. ÁREA DE NOVIDADES (Notícias, Atualizações, Spoilers & Lives)
      ====================================================================== */}
      <section id="novidades-section" className="pkxd-glass-band py-14 sm:py-16 border-b border-purple-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          {/* Header + Filters */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-800">
                Área de Novidades
              </p>
              <h2 className="font-display font-bold text-3xl text-slate-950">
                Notícias e Atualizações do PK XD
              </h2>
              <p className="text-sm text-slate-700 max-w-2xl">
                Fique por dentro das notas de atualização, códigos ativos, eventos especiais e publicações recentes da comunidade.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  placeholder="Buscar novidade..."
                  className="pl-10 pr-4 py-2 rounded-full bg-white border-2 border-purple-200 text-sm text-slate-900 focus:outline-none focus:border-violet-600 w-48 sm:w-56 shadow-xs"
                />
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate('/admin');
                  }}
                  className="pkxd-btn-primary px-4 py-2 rounded-full text-xs font-bold cursor-pointer"
                >
                  + Publicar Notícia
                </button>
              )}
            </div>
          </div>

          {/* Interactive Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'all', label: 'Todas' },
              { id: 'updates', label: 'Atualizações' },
              { id: 'spoilers', label: 'Spoilers' },
              { id: 'codes', label: 'Códigos' },
              { id: 'events', label: 'Eventos' },
            ] as const).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  setNewsCategory(cat.id);
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                  newsCategory === cat.id
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-purple-200 hover:bg-purple-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* News Display */}
          {filteredNews.length === 0 ? (
            <div className="rounded-3xl pkxd-glass border-dashed border-amber-300/80 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-display font-bold text-xl text-slate-900">
                  {newsList.length === 0
                    ? 'As próximas notícias e atualizações aparecerão aqui'
                    : 'Nenhuma publicação encontrada com esse filtro'}
                </h3>
                <p className="text-sm text-slate-600">
                  Enquanto isso, confira os spoilers semanais, códigos de lives e publicações da comunidade logo abaixo.
                </p>
              </div>
              {newsCategory !== 'all' || newsSearch ? (
                <button
                  type="button"
                  onClick={() => {
                    setNewsCategory('all');
                    setNewsSearch('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-800 cursor-pointer shrink-0"
                >
                  Limpar filtros
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Lead Featured News Item */}
              <article
                onClick={() => {
                  triggerAudio('tap');
                  setSelectedArticle(filteredNews[0]);
                }}
                className="lg:col-span-7 group cursor-pointer rounded-[34px] overflow-hidden pkxd-glass hover:border-violet-400 transition-colors"
              >
                {filteredNews[0].imageUrl ? (
                  <div className="aspect-[16/9] bg-slate-200 overflow-hidden">
                    <img
                      src={filteredNews[0].imageUrl}
                      alt={filteredNews[0].title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-violet-100 via-sky-50 to-amber-50 flex items-center justify-center p-8">
                    <Newspaper className="w-16 h-16 text-violet-400" />
                  </div>
                )}

                <div className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold">
                    <span className="text-violet-700 font-bold">
                      {NEWS_CATEGORY_LABELS[filteredNews[0].category] || 'Novidade'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{filteredNews[0].date}</span>
                    <span aria-hidden="true">·</span>
                    <span>Por {filteredNews[0].author}</span>
                  </div>

                  <h3 className="font-display font-bold text-2xl text-slate-900 group-hover:text-violet-700 transition-colors">
                    {filteredNews[0].title}
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {filteredNews[0].excerpt}
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-violet-700 inline-flex items-center gap-1.5">
                      <span>Ler matéria completa</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>

                    {isAdmin && (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onEditNews(filteredNews[0])}
                          className="p-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-violet-700 cursor-pointer"
                          title="Editar notícia"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNews(filteredNews[0].id)}
                          className="p-2 rounded-full bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Excluir notícia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>

              {/* Editorial List of Additional Recent Updates inside Frosted Glass Card */}
              <div className="lg:col-span-5 pkxd-glass rounded-[34px] p-5 sm:p-6 divide-y divide-slate-200/75">
                {filteredNews.slice(1, 6).map((item) => (
                  <article
                    key={item.id}
                    onClick={() => {
                      triggerAudio('tap');
                      setSelectedArticle(item);
                    }}
                    className="py-4 first:pt-1 last:pb-1 flex items-start gap-4 group cursor-pointer"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 text-violet-600">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-violet-700">
                          {NEWS_CATEGORY_LABELS[item.category] || 'Novidade'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.date}</span>
                      </div>
                      <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{item.excerpt}</p>
                    </div>
                  </article>
                ))}
                {filteredNews.length === 1 && (
                  <div className="py-8 text-center text-sm text-slate-600">
                    Confira os spoilers semanais e transmissões com códigos logo abaixo.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Weekly Spoilers, Gift Countdown, Past Spoilers & Upcoming Lives */}
          <div className="pt-4 space-y-8">
            {giftCountdownEnabled && (
              <GiftCountdown
                title={giftCountdownTitle}
                targetDate={giftCountdownDate}
                enabled={giftCountdownEnabled}
                giftContent={giftCountdownContent}
              />
            )}

            <div id="countdown-card-root">
              <CountdownWidget
                spoilerTitle={spoilerTitle}
                spoilerDesc={spoilerDesc}
                spoilerImageUrl={spoilerImage}
                onReveal={() => triggerAudio('levelUp')}
                extraCountdownTitle={extraCountdownTitle}
                extraCountdownDate={extraCountdownDate}
                extraCountdownEnabled={extraCountdownEnabled}
                forceReveal={forceReveal}
                revealedAt={revealedAt}
                isDelayed={isDelayed}
                delayMessage={delayMessage}
                onOpenFullscreen={onOpenFullscreenSpoiler}
              />
            </div>

            <div id="past-spoilers-history-section-wrapper">
              <PastSpoilersSection
                spoilers={pastSpoilers}
                isAdmin={isAdmin}
                onDelete={onDeletePastSpoiler}
                onEdit={onEditPastSpoiler}
                onRate={onRatePastSpoiler}
                onReact={onReactPastSpoiler}
              />
            </div>

            <div id="upcoming-streams-section-wrapper">
              <UpcomingStreamsSection
                isAdmin={isAdmin}
                currentUser={user}
                onAddXP={onAddXP}
                triggerAudio={triggerAudio}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. EVENTOS (Próximos, Em andamento, Anteriores)
      ====================================================================== */}
      <section id="home-eventos-band" className="pkxd-glass-sky pkxd-sky-pattern py-14 sm:py-16 border-b border-sky-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Agenda da Comunidade
              </p>
              <h2 className="font-display font-bold text-3xl text-slate-900">
                Eventos e Encontros PK XD
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Torneios, festas, esconder-esconder e encontros organizados por jogadores. Confirme presença com sua Tag PK XD ou crie seu próprio evento.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/eventos');
                }}
                className="pkxd-btn-cyan px-5 py-2.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Abrir Central de Eventos</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'all', label: 'Todos' },
              { id: 'upcoming', label: 'Próximos' },
              { id: 'live', label: 'Em andamento' },
              { id: 'past', label: 'Anteriores' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  setEventFilter(tab.id);
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                  eventFilter === tab.id
                    ? 'bg-sky-700 text-white'
                    : 'bg-white text-slate-700 border border-sky-200 hover:bg-sky-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {eventsLoading ? (
            <div className="p-8 rounded-[34px] pkxd-glass text-center text-sm text-slate-600">
              Carregando eventos da comunidade...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-10 rounded-[34px] pkxd-glass border-dashed border-sky-300 text-center space-y-3">
              <p className="font-display font-bold text-xl text-slate-900">
                Nenhum evento nesta categoria no momento
              </p>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Você pode organizar uma festa, torneio ou desafio na Central de Eventos e convidar toda a comunidade.
              </p>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/eventos');
                }}
                className="pkxd-btn-primary px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Criar ou Ver Eventos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((ev) => (
                <article
                  key={ev.id}
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate('/eventos');
                  }}
                  className="pkxd-glass rounded-[34px] overflow-hidden flex flex-col justify-between cursor-pointer hover:border-sky-400 transition-colors"
                >
                  {ev.bannerUrl ? (
                    <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                      <img
                        src={ev.bannerUrl}
                        alt={ev.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold">
                        <span className="text-sky-700 font-bold">{ev.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{ev.date} {ev.time ? `às ${ev.time}` : ''}</span>
                      </div>
                      <h3 className="font-display font-bold text-xl text-slate-900 line-clamp-2">
                        {ev.name}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {ev.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Por {ev.organizerName}</span>
                      <span className="text-sky-700 inline-flex items-center gap-1">
                        Confirmar Presença <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          4. CRIADORES (Perfis em destaque + Analisador Creator)
      ====================================================================== */}
      <section id="home-criadores-band" className="pkxd-glass-band py-14 sm:py-16 border-b border-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-pink-600">
                Criadores da Comunidade
              </p>
              <h2 className="font-display font-bold text-3xl text-slate-900">
                Conheça Novos Criadores e Vídeos
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Explore canais que produzem conteúdo de PK XD, assista aos destaques selecionados ou analise seu próprio canal no YouTube.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/progresso-creator');
                }}
                className="pkxd-btn-outline px-4 py-2.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-violet-700" />
                <span>Analisador Creator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/criadores');
                }}
                className="pkxd-btn-primary px-5 py-2.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Ver Área de Criadores</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {featuredList.length === 0 && shortsList.length === 0 ? (
            <div className="rounded-3xl pkxd-glass border-pink-200/80 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-xl text-slate-900">
                  Quer destacar seu canal de PK XD aqui?
                </h3>
                <p className="text-sm text-slate-600 max-w-xl">
                  Envie seu vídeo ou canal na área de Oportunidades ou verifique seus requisitos no Analisador de Progresso Creator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/inscricoes#panel');
                }}
                className="pkxd-btn-gold px-5 py-3 rounded-2xl text-sm font-bold cursor-pointer whitespace-nowrap"
              >
                Enviar Conteúdo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Featured Videos Preview */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {featuredList.slice(0, 4).map((video) => {
                  const thumb = getYoutubeThumb(video.youtubeUrl);
                  return (
                    <a
                      key={video.id}
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => triggerAudio('tap')}
                      className="group rounded-[30px] pkxd-glass overflow-hidden hover:border-violet-400 transition-colors flex flex-col"
                    >
                      <div className="relative aspect-video bg-slate-200 overflow-hidden">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={video.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-violet-100 text-violet-700">
                            <Play className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <p className="text-xs font-semibold text-slate-500">
                          {video.author || 'Criador PK XD'} · {video.type === 'game_highlight' ? 'Painel Oficial' : 'Comunidade'}
                        </p>
                        <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-violet-700 line-clamp-2">
                          {video.title}
                        </h3>
                      </div>
                    </a>
                  );
                })}
              </div>

              {/* Creator Directory List */}
              <div className="lg:col-span-4 rounded-[34px] pkxd-glass p-6 space-y-4">
                <h3 className="font-display font-bold text-xl text-slate-900">
                  Criadores em Destaque
                </h3>
                {featuredCreators.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    Envie seu canal para entrar na lista oficial de criadores da comunidade.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200">
                    {featuredCreators.map((c) => (
                      <li key={c.author} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{c.author}</p>
                          <p className="text-xs text-slate-500 truncate">{c.title}</p>
                        </div>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-violet-700 shrink-0"
                          title="Abrir canal"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate('/criadores');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-violet-50 border border-slate-200 text-sm font-bold text-violet-700 cursor-pointer transition-colors"
                >
                  Explorar todos os criadores
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          5. OPORTUNIDADES (Projetos abertos, programas e benefícios)
      ====================================================================== */}
      <section id="home-oportunidades-band" className="pkxd-glass-violet py-14 sm:py-16 border-b border-violet-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                Oportunidades Abertas
              </p>
              <h2 className="font-display font-bold text-3xl text-slate-900">
                Participe dos Projetos da PKXD Central
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Programas de participação abertos para criadores, redatores de teorias e membros que querem ajudar a construir a comunidade.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerAudio('tap');
                onNavigate('/inscricoes');
              }}
              className="pkxd-btn-primary px-5 py-2.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer self-start shrink-0"
            >
              <span>Ver Todas as Inscrições</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {opportunities.map((opp, idx) => (
              <div
                key={opp.id}
                className="pkxd-glass rounded-[34px] p-6 flex flex-col justify-between gap-5 hover:border-violet-400 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="text-violet-700">0{idx + 1}. Programa Aberto</span>
                    <span className="text-emerald-700">Inscrições Abertas</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-slate-900">
                    {opp.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {opp.summary}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 pt-1">
                    Benefício: <span className="text-violet-700">{opp.benefit}</span>
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      onNavigate(opp.route);
                    }}
                    className="pkxd-btn-outline px-4 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Inscrever-se nesta oportunidade</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. COMUNIDADE (Projetos, Participações, Mural, PKXD ID & Feedback)
      ====================================================================== */}
      <section id="home-comunidade-band" className="pkxd-glass-band py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Comunidade PK XD
              </p>
              <h2 className="font-display font-bold text-3xl text-slate-900">
                Projetos, Participações e Identidade
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Crie seu cartão PKXD ID, vote nas enquetes da semana, publique no mural, baixe artes e acompanhe suas missões diárias.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerAudio('tap');
                onNavigate('/comunidade');
              }}
              className="pkxd-btn-gold px-5 py-2.5 rounded-2xl text-sm font-bold inline-flex items-center gap-2 cursor-pointer self-start shrink-0"
            >
              <Users className="w-4 h-4" />
              <span>Entrar na Comunidade</span>
            </button>
          </div>

          {/* Open Split: Activities & Live Community Participation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: 4 Initiative Shortcuts (No card-in-card nesting) */}
            <div className="lg:col-span-7 divide-y divide-slate-200 border-t border-b border-slate-200">
              {[
                {
                  title: 'Passaporte PKXD ID',
                  desc: 'Personalize seu cartão oficial de jogador com selos, carimbos de eventos, QR Code e amigos.',
                  icon: Sparkles,
                  color: 'text-amber-600 bg-amber-50',
                  path: '/pkxd-id',
                  cta: 'Abrir PKXD ID',
                },
                {
                  title: 'Missões Diárias e Nível de Fã',
                  desc: 'Complete missões diárias, gire a roleta, acumule XP e suba no ranking da comunidade.',
                  icon: Target,
                  color: 'text-violet-700 bg-violet-50',
                  path: '/missoes',
                  cta: 'Ver Missões',
                },
                {
                  title: 'Galeria de Artes e Downloads',
                  desc: 'Renders, logos, fundos e materiais visuais organizados para criadores e fãs.',
                  icon: Palette,
                  color: 'text-pink-600 bg-pink-50',
                  path: '/artes',
                  cta: 'Explorar Artes',
                },
                {
                  title: 'Sugestões, Feedback e Denúncias',
                  desc: 'Envie ideias de melhorias, vote em sugestões ou reporte qualquer problema diretamente à equipe.',
                  icon: MessageSquarePlus,
                  color: 'text-emerald-700 bg-emerald-50',
                  path: '/comunidade#ouvidoria',
                  cta: 'Enviar Feedback',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-display font-bold text-lg text-slate-900">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600 max-w-md">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerAudio('tap');
                        onNavigate(item.path);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-violet-700 hover:text-white text-slate-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap self-start sm:self-center"
                    >
                      {item.cta}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right: Live Poll & Mural Pulse */}
            <div className="lg:col-span-5 space-y-5">
              {latestPoll && (
                <div className="bg-amber-50/75 backdrop-blur-md border border-amber-200/80 rounded-[34px] p-6 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                    <span>Enquete Ativa na Comunidade</span>
                    <span className="tabular-nums">{latestPoll.totalVotes} votos</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-slate-900">
                    {latestPoll.question}
                  </h3>
                  <div className="space-y-1.5">
                    {latestPoll.options.slice(0, 3).map((opt) => (
                      <div
                        key={opt.id}
                        className="px-3.5 py-2 rounded-2xl bg-white border border-amber-200/80 text-sm font-medium text-slate-800 flex items-center justify-between"
                      >
                        <span className="truncate">{opt.text}</span>
                        <span className="text-xs font-bold text-amber-700 tabular-nums shrink-0 ml-2">
                          {opt.votes}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      onNavigate('/comunidade');
                    }}
                    className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Votar na Enquete
                  </button>
                </div>
              )}

              <div className="pkxd-glass rounded-[34px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Atividade no Mural
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      onNavigate('/comunidade');
                    }}
                    className="text-xs font-bold text-violet-700 hover:underline cursor-pointer"
                  >
                    Ver mural completo
                  </button>
                </div>

                {recentPosts.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    Participe do Mural Social e compartilhe teorias e momentos do jogo com outros jogadores.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-bold text-slate-800">{post.authorName}</span>
                          <span className="tabular-nums">{post.likes} curtidas</span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {theoriesList.length > 0 && (
                  <p className="text-xs text-slate-500 pt-1">
                    {theoriesList.length} teorias publicadas na comunidade.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* WhatsApp & Partner Channels */}
          <div className="space-y-6 pt-2">
            <WhatsAppPromo channelUrl={whatsappChannelUrl} onAddXP={onAddXP} />
            <PartnerChannelPromo onAddXP={onAddXP} />
          </div>
        </div>
      </section>

      {/* =====================================================================
          ARTICLE READER MODAL
      ====================================================================== */}
      {selectedArticle && (
        <div
          onClick={() => setSelectedArticle(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <article
            onClick={(e) => e.stopPropagation()}
            className="pkxd-glass-modal rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 space-y-5 my-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold">
                  <span className="text-violet-700 font-bold">
                    {NEWS_CATEGORY_LABELS[selectedArticle.category] || 'Novidade'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedArticle.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>Por {selectedArticle.author}</span>
                </div>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
                  {selectedArticle.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Fechar matéria"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedArticle.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[380px] object-cover"
                />
              </div>
            )}

            <div className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {selectedArticle.content || selectedArticle.excerpt}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopiedArticleId(selectedArticle.id);
                  setTimeout(() => setCopiedArticleId(null), 2500);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedArticleId === selectedArticle.id ? 'Link copiado!' : 'Compartilhar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="pkxd-btn-primary px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar Leitura
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

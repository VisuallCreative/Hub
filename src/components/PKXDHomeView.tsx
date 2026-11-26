import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ArrowRight,
  Newspaper,
  Smartphone,
  Bell,
  ExternalLink,
  Zap,
  CheckCircle2,
  Plus,
  Award,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  NewsItem,
  FeaturedVideo,
  Theory,
  ShortItem,
  PastSpoiler,
  CommunityEvent,
  EventParticipant,
  AppNotification,
} from '../types';
import CountdownWidget from './CountdownWidget';
import GiftCountdown from './GiftCountdown';
import PastSpoilersSection from './PastSpoilersSection';
import UpcomingStreamsSection from './UpcomingStreamsSection';
import WhatsAppPromo from './WhatsAppPromo';
import PartnerChannelPromo from './PartnerChannelPromo';
import FeaturedVideos from './FeaturedVideos';
import BestShorts from './BestShorts';

interface PKXDHomeViewProps {
  user: any;
  isAdmin: boolean;
  fanLevel: number;
  totalXp: number;
  playerTag: string;
  identityXpClaimed: boolean;
  pwaXpClaimed: boolean;
  newsList: NewsItem[];
  featuredList: FeaturedVideo[];
  theoriesList: Theory[];
  shortsList: ShortItem[];
  pastSpoilers: PastSpoiler[];
  notifications: AppNotification[];
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
  onOpenTagModal: () => void;
  onTriggerPWAInstall: () => void;
  onAddXP: (amount: number, reason: string, rewardKey?: string) => void;
  onOpenFullscreenSpoiler: (title: string, desc: string, imageUrl?: string) => void;
  onDeletePastSpoiler: (id: string) => void;
  onEditPastSpoiler: (spoiler: PastSpoiler) => void;
  onRatePastSpoiler: (id: string, rating: number) => void;
  onReactPastSpoiler: (id: string, emoji: string) => void;
  onSelectNewsArticle: (id: string) => void;
  onDeleteFeaturedVideo: (id: string) => void;
  onDeleteShort: (id: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
}

const EVENT_CATEGORIES = [
  'Todas',
  'Torneios',
  'Festas',
  'Esconder-Esconder',
  'Encontros de Creators',
  'Desafios & Mini-Games',
  'Outros',
];

export default function PKXDHomeView({
  user,
  isAdmin,
  fanLevel,
  totalXp,
  playerTag,
  identityXpClaimed,
  pwaXpClaimed,
  newsList,
  featuredList,
  shortsList,
  pastSpoilers,
  notifications,
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
  onOpenTagModal,
  onTriggerPWAInstall,
  onAddXP,
  onOpenFullscreenSpoiler,
  onDeletePastSpoiler,
  onEditPastSpoiler,
  onRatePastSpoiler,
  onReactPastSpoiler,
  onSelectNewsArticle,
  onDeleteFeaturedVideo,
  onDeleteShort,
  triggerAudio,
}: PKXDHomeViewProps) {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [agendaStatus, setAgendaStatus] = useState<'todos' | 'ao_vivo' | 'confirmados'>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    if (!db) return;
    const unsubEv = onSnapshot(
      collection(db, 'community_events'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) } as CommunityEvent))
          .filter((e) => e.status !== 'Em análise' || isAdmin)
          .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        setEvents(list);
      },
      () => {}
    );
    const unsubParts = onSnapshot(
      collection(db, 'event_participants'),
      (snap) => {
        setParticipants(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as EventParticipant))
        );
      },
      () => {}
    );
    return () => {
      unsubEv();
      unsubParts();
    };
  }, [isAdmin]);

  const liveCount = useMemo(
    () => events.filter((e) => e.status === 'Ao vivo').length,
    [events]
  );
  const confirmedCount = useMemo(
    () => events.filter((e) => e.status === 'Aprovado' || e.status === 'Em breve').length,
    [events]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedCategory !== 'Todas' && e.category !== selectedCategory) return false;
      if (agendaStatus === 'ao_vivo') return e.status === 'Ao vivo';
      if (agendaStatus === 'confirmados') return e.status === 'Aprovado' || e.status === 'Em breve';
      return true;
    });
  }, [events, selectedCategory, agendaStatus]);

  const featuredCreators = useMemo(() => {
    const map = new Map<string, { name: string; title: string; url: string; count: number }>();
    featuredList.forEach((v) => {
      const name = (v.author || 'Creator PK XD').trim();
      const existing = map.get(name);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(name, { name, title: v.title, url: v.youtubeUrl, count: 1 });
      }
    });
    return Array.from(map.values()).slice(0, 6);
  }, [featuredList]);

  return (
    <div className="w-full">
      {/* =====================================================================
          BAND 1 (DEEP PURPLE #2D0859): HERO + IDENTIDADE PK XD (+25 XP GRÁTIS)
      ====================================================================== */}
      <section className="pkxd-band-purple py-10 sm:py-16 border-b-[4px] border-[#120624]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-5">
            <h1 className="pkxd-comic-title text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] text-balance">
              O ponto de encontro oficial da comunidade PK XD!
            </h1>
            <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-2xl font-medium">
              Crie e participe de festas, torneios e encontros, acompanhe notícias em tempo real, descubra criadores e suba de nível ganhando XP.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/criar-evento');
                }}
                className="pkxd-btn-gold px-6 py-3.5 text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Novo Evento</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/eventos');
                }}
                className="pkxd-pop-btn px-6 py-3.5 text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Explorar Eventos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SECTION 2: IDENTIDADE PK XD (+25 XP GRÁTIS) */}
          <div className="lg:col-span-5">
            <div className="pkxd-pop-card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-[#6D28D9] uppercase tracking-wide">
                  Identidade do Jogador
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F9C826] border-2 border-[#120624] text-xs font-extrabold text-[#120624] inline-flex items-center gap-1">
                  {identityXpClaimed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>+25 XP Resgatado</span>
                    </>
                  ) : (
                    '+25 XP GRÁTIS'
                  )}
                </span>
              </div>

              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#120624] leading-tight">
                Complete sua Identidade PK XD!
              </h2>

              <p className="text-sm text-slate-700 leading-relaxed">
                Cadastre seu Nome e # do PK XD (ex: <strong className="font-mono text-[#6D28D9]">LUNA#245</strong>) para ter preenchimento automático em todas as festas e eventos!
              </p>

              {/* Current Tag & XP Balance */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-[#120624] flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block">Sua Tag Atual</span>
                  <span className="font-mono font-extrabold text-sm text-[#2D0859]">
                    {playerTag || 'Ainda não cadastrada'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-bold block">Saldo de XP</span>
                  <span className="font-mono font-extrabold text-sm text-[#EC4899] tabular-nums">
                    {totalXp} XP · Nv. {fanLevel}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onOpenTagModal();
                  }}
                  className="pkxd-btn-primary flex-1 min-h-[46px] px-5 py-2.5 text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{playerTag ? 'Editar Tag' : 'Cadastrar Tag'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate('/perfil');
                  }}
                  className="pkxd-pop-btn min-h-[46px] px-4 py-2.5 text-xs cursor-pointer"
                >
                  Ver XP
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BAND 2 (RICH VIBRANT PURPLE #3D1278): CENTRAL DE EVENTOS + MINHA AGENDA PKXD
      ====================================================================== */}
      <section className="pkxd-band-purple-2 py-12 sm:py-16 border-b-[4px] border-[#120624]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#F9C826]">
                Central de Eventos
              </p>
              <h2 className="pkxd-comic-title text-3xl sm:text-5xl font-bold leading-tight">
                Comunidade PK XD
              </h2>
              <p className="text-sm sm:text-base font-medium text-purple-100/95 leading-relaxed">
                Crie seus próprios torneios, festas e encontros de PK XD ou confirme presença nos eventos da nossa comunidade para jogar junto com a galera!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/criar-evento');
                }}
                className="pkxd-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Novo Evento</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/eventos');
                }}
                className="pkxd-pop-btn px-5 py-3 text-sm inline-flex items-center gap-2 cursor-pointer tabular-nums"
              >
                <span>Todos os Eventos ({events.length})</span>
              </button>
            </div>
          </div>

          {/* SECTION 6: MINHA AGENDA PKXD CARD */}
          <div className="pkxd-pop-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-200 pb-4">
              <div>
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#120624] inline-flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-[#6D28D9]" />
                  <span>Minha Agenda PKXD</span>
                </h3>
                <p className="text-xs font-bold text-slate-600 tabular-nums mt-0.5">
                  Mostrando {filteredEvents.length} evento(s).
                </p>
              </div>

              {/* Status Counters */}
              <div className="flex flex-wrap gap-2">
                {([
                  { id: 'todos', label: `Todos (${events.length})`, dot: false },
                  { id: 'ao_vivo', label: `Ao Vivo (${liveCount})`, dot: true },
                  { id: 'confirmados', label: `Confirmados (${confirmedCount})`, dot: false },
                ] as const).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      setAgendaStatus(st.id);
                    }}
                    className={`px-4 py-2 rounded-full border-[2.5px] border-[#120624] text-xs font-extrabold cursor-pointer tabular-nums inline-flex items-center gap-1.5 ${
                      agendaStatus === st.id
                        ? 'bg-[#2D0859] text-[#F9C826]'
                        : 'bg-white text-[#120624] hover:bg-[#FEF9C3]'
                    }`}
                  >
                    {st.dot && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    setSelectedCategory(cat);
                  }}
                  className={`px-3.5 py-1.5 rounded-full border-2 border-[#120624] text-xs font-extrabold cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#EC4899] text-white'
                      : 'bg-white text-[#120624] hover:bg-[#FEF9C3]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Events Grid or Empty State */}
            {filteredEvents.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-3 bg-slate-50 rounded-[24px] border-[2.5px] border-dashed border-[#120624]/30">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] border-2 border-[#120624] text-[#2D0859] flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-2xl text-[#120624]">
                  Nenhum evento encontrado
                </h4>
                <p className="text-sm text-slate-600 max-w-lg mx-auto">
                  Não há eventos disponíveis nesta categoria no momento. Seja o primeiro a divulgar um evento para a comunidade PK XD!
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      onNavigate('/criar-evento');
                    }}
                    className="pkxd-btn-purple px-6 py-3 text-sm cursor-pointer"
                  >
                    Criar Evento Agora
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEvents.slice(0, 6).map((ev) => {
                  const pCount = participants.filter((p) => p.eventId === ev.id).length;
                  return (
                    <article
                      key={ev.id}
                      onClick={() => {
                        triggerAudio('tap');
                        onNavigate('/eventos');
                      }}
                      className="rounded-[24px] border-[3px] border-[#120624] bg-white shadow-[0_5px_0_#16032E] overflow-hidden flex flex-col justify-between cursor-pointer hover:-translate-y-1 transition-transform"
                    >
                      {ev.bannerUrl ? (
                        <div className="aspect-[16/9] border-b-[3px] border-[#120624] overflow-hidden bg-slate-100">
                          <img
                            src={ev.bannerUrl}
                            alt={ev.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] border-b-[3px] border-[#120624] bg-[#2D0859] flex items-center justify-center text-[#F9C826]">
                          <Calendar className="w-10 h-10" />
                        </div>
                      )}
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold text-[#6D28D9]">
                            <span>{ev.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">
                              {ev.date} {ev.time ? `às ${ev.time}` : ''}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-lg text-[#120624] line-clamp-2">
                            {ev.name}
                          </h4>
                          <p className="text-xs text-slate-600 line-clamp-2">{ev.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-extrabold">
                          <span className="text-slate-600 truncate">Por {ev.organizerName}</span>
                          <span className="text-[#EC4899] tabular-nums shrink-0">
                            {pCount} confirmado(s)
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          BAND 3 (ELECTRIC ROYAL VIOLET #4E1B96): INSTALAR APP NO CELULAR (PWA)
      ====================================================================== */}
      <section className="pkxd-band-purple-3 py-10 sm:py-14 border-b-[4px] border-[#120624]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="pkxd-pop-card-pink p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#6D28D9]">
                  Aplicativo PWA Oficial
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F9C826] border-2 border-[#120624] text-xs font-extrabold text-[#120624] inline-flex items-center gap-1">
                  {pwaXpClaimed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>+100 XP Resgatado</span>
                    </>
                  ) : (
                    '+100 XP'
                  )}
                </span>
              </div>

              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#120624] inline-flex items-center gap-2.5">
                <Smartphone className="w-7 h-7 text-[#6D28D9] shrink-0" />
                <span>Instalar PKXD Central no Celular</span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Acesse o app direto da tela inicial do celular com carregamento instantâneo, tela cheia e notificações!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onTriggerPWAInstall();
                }}
                className="pkxd-btn-purple px-6 py-3.5 text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Instalar App (+100 XP)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/notificacoes');
                }}
                className="pkxd-pop-btn px-5 py-3.5 text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Bell className="w-4 h-4 text-[#EC4899]" />
                <span>Notificações</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BAND 4 (MIDNIGHT PLUM #230647): NOTÍCIAS PK XD & SPOILERS
      ====================================================================== */}
      <section className="pkxd-band-purple-4 py-12 sm:py-16 border-b-[4px] border-[#120624]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#F9C826]">
                Atualizações e Spoilers
              </p>
              <h2 className="pkxd-comic-title text-3xl sm:text-5xl font-bold">
                Notícias PK XD
              </h2>
              <p className="text-sm sm:text-base text-purple-100/90 font-medium max-w-2xl">
                Novidades do jogo, spoilers da semana, códigos de lives e comunicados recentes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerAudio('tap');
                onNavigate('/noticias');
              }}
              className="pkxd-btn-gold px-5 py-3 text-sm inline-flex items-center gap-2 cursor-pointer self-start shrink-0"
            >
              <span>Ver Todas as Notícias</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {newsList.length === 0 ? (
            <div className="pkxd-pop-card p-8 text-center space-y-2">
              <h3 className="font-display font-bold text-xl text-[#120624]">
                Nenhuma notícia publicada ainda
              </h3>
              <p className="text-sm text-slate-600">
                Assim que novas atualizações e matérias forem publicadas pela equipe, elas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {newsList.slice(0, 3).map((item) => (
                <article
                  key={item.id}
                  onClick={() => {
                    triggerAudio('tap');
                    onSelectNewsArticle(item.id);
                    onNavigate(`/noticias/${encodeURIComponent(item.id)}`);
                  }}
                  className="pkxd-pop-card overflow-hidden flex flex-col justify-between cursor-pointer hover:-translate-y-1 transition-transform"
                >
                  <div>
                    {item.imageUrl ? (
                      <div className="aspect-[16/9] border-b-[3px] border-[#120624] overflow-hidden bg-slate-100">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] border-b-[3px] border-[#120624] bg-[#DBEAFE] flex items-center justify-center">
                        <Newspaper className="w-10 h-10 text-[#2563EB]" />
                      </div>
                    )}
                    <div className="p-5 space-y-2">
                      <p className="text-xs font-extrabold text-[#2563EB]">
                        {item.date} · {item.author}
                      </p>
                      <h3 className="font-display font-bold text-xl text-[#120624] line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">{item.excerpt}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <span className="text-xs font-extrabold text-[#6D28D9] inline-flex items-center gap-1">
                      Ler matéria completa <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Weekly Spoiler Countdown & Streams */}
          <div className="space-y-6 pt-2">
            {giftCountdownEnabled && (
              <GiftCountdown
                title={giftCountdownTitle}
                targetDate={giftCountdownDate}
                enabled={giftCountdownEnabled}
                giftContent={giftCountdownContent}
              />
            )}

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

            {pastSpoilers.length > 0 && (
              <PastSpoilersSection
                spoilers={pastSpoilers}
                isAdmin={isAdmin}
                onDelete={onDeletePastSpoiler}
                onEdit={onEditPastSpoiler}
                onRate={onRatePastSpoiler}
                onReact={onReactPastSpoiler}
              />
            )}

            <UpcomingStreamsSection
              isAdmin={isAdmin}
              currentUser={user}
              onAddXP={onAddXP}
              triggerAudio={triggerAudio}
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          BAND 5 (AMETHYST PURPLE #350D6B): CREATORS E COMUNIDADE
      ====================================================================== */}
      <section className="pkxd-band-purple-5 py-12 sm:py-16 border-b-[4px] border-[#120624]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#F9C826]">
                Criadores e Projetos
              </p>
              <h2 className="pkxd-comic-title text-3xl sm:text-5xl font-bold leading-tight">
                Creators e Comunidade
              </h2>
              <p className="text-sm sm:text-base text-purple-100/90 font-medium">
                Conheça criadores de conteúdo, vídeos em destaque, projetos da comunidade e ferramentas exclusivas para quem cria no universo PK XD.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/progresso-creator');
                }}
                className="pkxd-btn-gold px-5 py-2.5 text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>Analisador Creator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/criadores');
                }}
                className="pkxd-pop-btn px-5 py-2.5 text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Ver Creators</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PAINEL DE VÍDEOS & SHORTS EM DESTAQUE */}
          <div className="space-y-6">
            <FeaturedVideos
              videos={featuredList}
              isAdmin={isAdmin}
              currentUser={user}
              onDelete={onDeleteFeaturedVideo}
              onAddXP={onAddXP}
              onNavigate={onNavigate}
            />

            <BestShorts
              shorts={shortsList}
              isAdmin={isAdmin}
              onDelete={onDeleteShort}
              onNavigate={onNavigate}
            />
          </div>

          {featuredCreators.length === 0 ? (
            <div className="pkxd-pop-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-2xl text-[#120624]">
                  Quer aparecer nos Destaques de Creators?
                </h3>
                <p className="text-sm text-slate-700 max-w-xl">
                  Envie seu canal, vídeo ou projeto da comunidade na área de Oportunidades ou acompanhe seu progresso no Analisador Creator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/inscricoes');
                }}
                className="pkxd-btn-primary px-6 py-3 text-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                Inscrever Meu Canal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCreators.map((creator) => (
                <div
                  key={creator.name}
                  className="pkxd-pop-card p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="w-16 h-16 pkxd-avatar-ring bg-[#EDE9FE] text-[#2D0859] font-display font-bold text-2xl flex items-center justify-center">
                      {creator.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-2xl text-[#120624]">
                        {creator.name}
                      </h3>
                      <p className="text-xs font-extrabold text-[#6D28D9]">
                        {creator.count} {creator.count === 1 ? 'vídeo em destaque' : 'vídeos em destaque'}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{creator.title}</p>
                  </div>
                  <a
                    href={creator.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => triggerAudio('tap')}
                    className="pkxd-pop-btn w-full min-h-[44px] px-4 py-2.5 text-sm inline-flex items-center justify-center gap-2"
                  >
                    <span>Ver canal no YouTube</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Community Shortcuts Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              {
                title: 'Passaporte PKXD ID',
                desc: 'Seu cartão personalizável com selos e QR Code.',
                path: '/pkxd-id',
                btn: 'Abrir PKXD ID',
              },
              {
                title: 'Mural & Enquetes',
                desc: 'Converse com a comunidade e vote nas enquetes.',
                path: '/comunidade',
                btn: 'Ir ao Mural',
              },
              {
                title: 'Artes & Downloads',
                desc: 'Renders, logos e fundos para seus vídeos.',
                path: '/artes',
                btn: 'Ver Artes',
              },
              {
                title: 'Oportunidades',
                desc: 'Envie vídeos, teorias ou candidate-se à equipe.',
                path: '/inscricoes',
                btn: 'Participar',
              },
            ].map((item) => (
              <div key={item.title} className="pkxd-pop-card-purple p-5 flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-[#120624]">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate(item.path);
                  }}
                  className="pkxd-pop-btn w-full py-2 text-xs cursor-pointer"
                >
                  {item.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          BAND 6 (TWILIGHT PURPLE #270750): NOTIFICAÇÕES RECENTES & CANAIS
      ====================================================================== */}
      <section className="pkxd-band-purple-6 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="pkxd-comic-title text-3xl sm:text-4xl font-bold inline-flex items-center gap-2.5">
                <Bell className="w-7 h-7 text-[#F9C826]" />
                <span>Últimas Notificações</span>
              </h2>
              <p className="text-sm text-purple-100/90 mt-1">
                Avisos recentes de eventos, torneios e comunicados da administração.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerAudio('tap');
                onNavigate('/notificacoes');
              }}
              className="pkxd-btn-gold px-5 py-2.5 text-xs cursor-pointer self-start shrink-0"
            >
              Ver Painel de Notificações
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="pkxd-pop-card p-6 text-sm text-slate-600">
              Nenhuma notificação recente no momento. Ative os alertas para não perder nada!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="pkxd-pop-card p-5 space-y-2">
                  <p className="text-[11px] font-extrabold text-[#6D28D9] tabular-nums">
                    {new Date(n.createdAt).toLocaleString('pt-BR')}
                  </p>
                  <h3 className="font-display font-bold text-lg text-[#120624] line-clamp-1">
                    {n.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{n.body}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-5 pt-2">
            <WhatsAppPromo channelUrl={whatsappChannelUrl} onAddXP={onAddXP} />
            <PartnerChannelPromo onAddXP={onAddXP} />
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useRef, useState, useEffect } from 'react';
import {
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Play,
  Trash2,
  ExternalLink,
  Sparkles,
  Flame,
  Share2,
  Check,
  MoveHorizontal,
  X
} from 'lucide-react';
import { ShortItem } from '../types';
import { playTapSound } from '../utils/audio';

interface BestShortsProps {
  shorts: ShortItem[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onNavigate?: (path: string) => void;
}

const DEFAULT_SHORTS: ShortItem[] = [
  {
    id: 'default_short_1',
    title: 'NOVA ATUALIZAÇÃO SECRETA DO PK XD!',
    youtubeUrl: 'https://youtube.com/shorts/5JqR2_e7YkM',
    createdAt: Date.now() - 24 * 3600 * 1000
  },
  {
    id: 'default_short_2',
    title: 'TESTEI O NOVO BUG DA ARMADURA NO CRAZY RUN!',
    youtubeUrl: 'https://youtube.com/shorts/6rZlQ1W9e0k',
    createdAt: Date.now() - 48 * 3600 * 1000
  },
  {
    id: 'default_short_3',
    title: 'TODOS OS CÓDIGOS SECRETOS DE GEMAS DESTA SEMANA!',
    youtubeUrl: 'https://youtube.com/shorts/3XkM8_q1Z2w',
    createdAt: Date.now() - 72 * 3600 * 1000
  },
  {
    id: 'default_short_4',
    title: 'DECORANDO A NOVA CASA TECH COM 100K MOEDAS!',
    youtubeUrl: 'https://youtube.com/shorts/7YwQ4_p9L1m',
    createdAt: Date.now() - 96 * 3600 * 1000
  }
];

export default function BestShorts({ shorts, isAdmin, onDelete, onNavigate }: BestShortsProps) {
  const displayShorts = shorts && shorts.length > 0 ? shorts : DEFAULT_SHORTS;

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasMovedDistance, setHasMovedDistance] = useState(false);

  const getYoutubeEmbedId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\/shorts\/|shorts\?v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch {
      return null;
    }
  };

  const updateScrollState = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const cardWidth = 280;
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(displayShorts.length - 1, Math.max(0, index)));
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [displayShorts.length]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    playTapSound();
    if (!carouselRef.current) return;
    const cardWidth = 300;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const scrollToIndex = (index: number) => {
    playTapSound();
    if (!carouselRef.current) return;
    const cardWidth = 300;
    carouselRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setHasMovedDistance(false);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeftState(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 6) {
      setHasMovedDistance(true);
    }
    carouselRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWatchClick = (url: string) => {
    if (hasMovedDistance) return;
    playTapSound();
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleCopyLink = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    playTapSound();
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {}
  };

  return (
    <section
      id="best-shorts-section"
      className="pkxd-glass rounded-[34px] p-5 sm:p-8 space-y-5 text-left relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border-2 border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
                Melhores Shorts da Semana
              </h3>
              <span className="font-bold text-[10px] uppercase px-2.5 py-0.5 bg-sky-50 text-sky-700 rounded-full border border-sky-200 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Curadoria PKXD Central</span>
              </span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-slate-600 mt-0.5">
              Vídeos curtos selecionados com destaque pela equipe do{' '}
              <strong className="text-pink-600">PKXD Central</strong>.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          {onNavigate ? (
            <button
              onClick={() => {
                playTapSound();
                onNavigate('/inscricoes#shorts');
              }}
              className="pkxd-btn-cyan px-4 py-2.5 rounded-2xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Envie seu vídeo para aparecer aqui"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Enviar Shorts</span>
            </button>
          ) : (
            <a
              href="https://forms.gle/bmJqrXkSa9uibQqo9"
              target="_blank"
              rel="noopener noreferrer"
              className="pkxd-btn-cyan px-4 py-2.5 rounded-2xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Enviar Shorts</span>
            </a>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border-2 border-slate-200">
            <button
              onClick={() => scrollByAmount('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-white hover:bg-sky-50 text-sky-700 shadow-sm'
                  : 'text-slate-400 cursor-not-allowed opacity-50'
              }`}
              title="Ver Short anterior"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs font-bold text-slate-600 px-2 select-none tabular-nums">
              {activeIndex + 1}/{displayShorts.length}
            </span>

            <button
              onClick={() => scrollByAmount('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-white hover:bg-sky-50 text-sky-700 shadow-sm'
                  : 'text-slate-400 cursor-not-allowed opacity-50'
              }`}
              title="Ver próximo Short"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Helper Cue */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-1.5 text-sky-700 font-bold">
          <MoveHorizontal className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Arraste para o lado para ver mais Shorts</span>
        </div>
        <span className="text-xs font-mono font-bold text-slate-500 hidden sm:inline tabular-nums">
          {displayShorts.length} shorts selecionados
        </span>
      </div>

      {/* CAROUSEL TRACK */}
      <div className="relative group/carousel">
        {canScrollLeft && (
          <button
            onClick={() => scrollByAmount('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white hover:bg-sky-50 text-sky-700 border-2 border-slate-200 hover:border-sky-400 rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all hover:scale-105 hidden md:flex"
            title="Short anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scrollByAmount('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white hover:bg-sky-50 text-sky-700 border-2 border-slate-200 hover:border-sky-400 rounded-full shadow-md flex items-center justify-center cursor-pointer transition-all hover:scale-105 hidden md:flex"
            title="Próximo Short"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={carouselRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory py-2 px-1 no-scrollbar select-none scroll-smooth ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayShorts.map((short, idx) => {
            const embedId = getYoutubeEmbedId(short.youtubeUrl);
            const isCurrentActive = idx === activeIndex;

            return (
              <div
                key={short.id || idx}
                className={`w-[240px] sm:w-[270px] flex-shrink-0 snap-center sm:snap-start bg-white border-2 rounded-3xl overflow-hidden flex flex-col justify-between group transition-all duration-200 relative shadow-sm hover:-translate-y-0.5 ${
                  isCurrentActive
                    ? 'border-sky-400 ring-2 ring-sky-100'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                {/* Header Badge */}
                <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
                  <span className="bg-slate-900/85 text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border border-white/20 uppercase flex items-center gap-1 shadow-sm">
                    <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>#{idx + 1} Short</span>
                  </span>

                  <button
                    onClick={(e) => handleCopyLink(e, short.youtubeUrl, short.id)}
                    className="pointer-events-auto p-1.5 bg-white/95 hover:bg-white text-slate-700 rounded-full border border-slate-200 transition-all cursor-pointer shadow-sm active:scale-90"
                    title="Copiar link do Short"
                  >
                    {copiedId === short.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-slate-600 hover:text-sky-600" />
                    )}
                  </button>
                </div>

                {/* Vertical 9:16 video canvas */}
                <div className="relative aspect-[9/16] bg-slate-900 w-full overflow-hidden">
                  {embedId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${embedId}?enablejsapi=1&rel=0&modestbranding=1`}
                      title={short.title}
                      className="w-full h-full border-0 absolute inset-0 pointer-events-auto"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <div
                      onClick={() => handleWatchClick(short.youtubeUrl)}
                      className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center cursor-pointer bg-gradient-to-b from-sky-600 to-violet-700"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Assistir no YouTube
                      </span>
                      <span className="text-[11px] text-white/80 mt-1">Toque para abrir</span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="p-4 space-y-2.5 bg-white border-t border-slate-100">
                  <h4
                    title={short.title}
                    className="font-display font-bold text-sm text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-2 leading-snug"
                  >
                    {short.title}
                  </h4>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleWatchClick(short.youtubeUrl)}
                      className="font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer uppercase text-[11px] tracking-wide"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no App</span>
                    </button>

                    {isAdmin && (
                      confirmDeleteId === short.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              playTapSound();
                              onDelete(short.id);
                              setConfirmDeleteId(null);
                            }}
                            className="bg-rose-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="bg-slate-100 text-slate-600 p-1 rounded-lg cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playTapSound();
                            setConfirmDeleteId(short.id);
                          }}
                          className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-200 transition-colors"
                          title="Deletar este Short"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="text-[11px]">Excluir</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {displayShorts.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            className={`transition-all duration-200 rounded-full cursor-pointer ${
              i === activeIndex
                ? 'w-6 h-2 bg-sky-600'
                : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
            }`}
            title={`Ir para Short #${i + 1}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

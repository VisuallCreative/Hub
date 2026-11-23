import React, { useState, useEffect } from 'react';
import { PastSpoiler } from '../types';
import { Trash2, Calendar, Flame, Edit, Star, Maximize2, X, Share2 } from 'lucide-react';

interface PastSpoilersSectionProps {
  spoilers: PastSpoiler[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onEdit?: (spoil: PastSpoiler) => void;
  onRate: (id: string, rating: number) => void;
  onReact?: (id: string, emoji: string) => void;
}

// Utility to clean up and extract a short plain text snippet from markdown description
function getPlainSnippet(text: string): string {
  if (!text) return "";
  // Strip markdown image syntax
  let clean = text.replace(/!\[.*?\]\([^\)]+\)/g, "");
  // Strip HTML image syntax
  clean = clean.replace(/<img\s+[^>]*src=["'](?:[^"']+)["'][^>]*>/gi, "");
  // Strip raw image URLs
  clean = clean.replace(/https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?/gi, "");
  // Standardize spacing
  clean = clean.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  return clean;
}

// Utility to extract the first image URL from description (markdown, HTML or raw URL)
function getFirstImageFromDescription(text: string): string | null {
  if (!text) return null;
  // Match Markdown Image: ![alt](url)
  const mdMatched = text.match(/!\[.*?\]\((.*?)\)/i);
  if (mdMatched && mdMatched[1]) {
    return mdMatched[1];
  }
  // Match HTML Image src: <img src="url">
  const htmlMatched = text.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (htmlMatched && htmlMatched[1]) {
    return htmlMatched[1];
  }
  // Match raw image URLs
  const rawMatched = text.match(/https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?/i);
  if (rawMatched && rawMatched[0]) {
    return rawMatched[0];
  }
  return null;
}

// Custom parser to split paragraphs, lists, headers, and media links in order
function renderRichContent(text: string) {
  if (!text) return null;

  // Split content into segments of media (images or base64) and text blocks
  const mediaRegex = /(!\[.*?\]\([^\)]+\)|<img\s+[^>]*src=["'](?:[^"']+)["'][^>]*>|(?:https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?))/gi;
  const parts = text.split(mediaRegex);

  return (
    <div className="space-y-4 text-left mt-2 text-slate-700">
      {parts.map((part, partIdx) => {
        if (!part) return null;

        // Check for Markdown Image syntax: ![Alt](url)
        const mdMatched = part.match(/!\[(.*?)\]\((.*?)\)/i);
        if (mdMatched) {
          const altText = mdMatched[1] || 'Imagem do Spoiler';
          const imageUrl = mdMatched[2];
          return (
            <div key={`part-${partIdx}`} className="my-3 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-50 p-2 text-center">
              <img 
                src={imageUrl} 
                alt={altText} 
                className="w-full max-h-[480px] object-contain hover:scale-[1.01] transition-transform duration-300 mx-auto rounded-xl" 
                referrerPolicy="no-referrer"
              />
              {altText && altText !== 'Spoiler' && (
                <span className="text-xs text-slate-500 block pt-2 font-semibold uppercase tracking-wider">
                  {altText}
                </span>
              )}
            </div>
          );
        }

        // Check for HTML img tag syntax
        const htmlMatched = part.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
        if (htmlMatched) {
          const imageUrl = htmlMatched[1];
          return (
            <div key={`part-${partIdx}`} className="my-3 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-50 p-2">
              <img 
                src={imageUrl} 
                alt="Spoiler Media" 
                className="w-full max-h-[480px] object-contain hover:scale-[1.01] transition-transform duration-300 mx-auto rounded-xl" 
                referrerPolicy="no-referrer"
              />
            </div>
          );
        }

        // Check for raw image URL match
        if (part.match(/^https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?$/i)) {
          return (
            <div key={`part-${partIdx}`} className="my-3 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-50 p-2">
              <img src={part} alt="Imagem do Spoiler" className="w-full max-h-[480px] object-contain hover:scale-[1.01] transition-transform duration-300 mx-auto rounded-xl" referrerPolicy="no-referrer" />
            </div>
          );
        }

        // Otherwise, it's a plain text run
        const lines = part.split('\n');
        return (
          <div key={`part-${partIdx}`} className="space-y-2">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lineIdx} className="h-1" />;

              // Bullet lists
              if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                const content = trimmed.substring(1).trim();
                return (
                  <div key={lineIdx} className="flex items-start gap-2 text-sm text-slate-700 pl-1">
                    <span className="text-violet-600 mt-1 flex-shrink-0 text-xs font-bold">•</span>
                    <span>{content}</span>
                  </div>
                );
              }

              // Headers
              if (trimmed.startsWith('###')) {
                return <h5 key={lineIdx} className="font-display font-bold text-sm text-sky-700 uppercase tracking-wider pt-2">{trimmed.replace('###', '').trim()}</h5>;
              }
              if (trimmed.startsWith('##')) {
                return <h4 key={lineIdx} className="font-display font-bold text-base text-violet-700 uppercase tracking-wide pt-2">{trimmed.replace('##', '').trim()}</h4>;
              }

              return (
                <p key={lineIdx} className="font-sans text-sm text-slate-700 leading-relaxed">
                  {trimmed}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function PastSpoilersSection({ spoilers, isAdmin, onDelete, onEdit, onRate, onReact }: PastSpoilersSectionProps) {
  // Track selected spoiler for full screen immersive overlay
  const [immersiveSpoiler, setImmersiveSpoiler] = useState<PastSpoiler | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // State to track copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Track reacted state from localStorage
  const [reactedSpoilers, setReactedSpoilers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('pkxd_reacted_spoilers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const handleReactAction = (spoilerId: string, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (reactedSpoilers[spoilerId]) return; // already reacted
    
    const nextReacted = { ...reactedSpoilers, [spoilerId]: emoji };
    setReactedSpoilers(nextReacted);
    try {
      localStorage.setItem('pkxd_reacted_spoilers', JSON.stringify(nextReacted));
    } catch (e) {}

    if (onReact) {
      onReact(spoilerId, emoji);
    }
  };

  const handleShare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const deepLink = `${window.location.origin}${window.location.pathname}?spoiler=${id}`;
    
    navigator.clipboard.writeText(deepLink)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err);
      });
  };

  // Deep Link handler
  useEffect(() => {
    if (!spoilers || spoilers.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const spoilerIdParam = params.get('spoiler');
    
    if (spoilerIdParam) {
      const matched = spoilers.find(s => s.id === spoilerIdParam);
      if (matched) {
        setImmersiveSpoiler(matched);
        
        // Scroll to container element
        setTimeout(() => {
          const sectionEl = document.getElementById('past-spoilers-history-section');
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
    }
  }, [spoilers]);

  // Track rated state from keys to values (1-5 star)
  const [ratedSpoilers, setRatedSpoilers] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('pkxd_rated_spoilers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({});

  const handleRateAction = (spoilerId: string, rating: number) => {
    if (ratedSpoilers[spoilerId]) return; // already rated
    const nextRated = { ...ratedSpoilers, [spoilerId]: rating };
    setRatedSpoilers(nextRated);
    try {
      localStorage.setItem('pkxd_rated_spoilers', JSON.stringify(nextRated));
    } catch (e) {}
    onRate(spoilerId, rating);
    
    // Dynamically update immersive view rating on-screen if it matches
    if (immersiveSpoiler && immersiveSpoiler.id === spoilerId) {
      setImmersiveSpoiler(prev => {
        if (!prev) return null;
        const currentSum = prev.ratingSum || 0;
        const currentCount = prev.ratingCount || 0;
        return {
          ...prev,
          ratingSum: currentSum + rating,
          ratingCount: currentCount + 1
        };
      });
    }
  };

  const isEmpty = !spoilers || spoilers.length === 0;

  return (
    <section 
      id="past-spoilers-history-section"
      className="pkxd-glass rounded-3xl p-5 sm:p-7 space-y-6 relative overflow-hidden text-left"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-pink-100 rounded-2xl border border-pink-200 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900">
              Galeria de Spoilers &amp; Novidades
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-500">
              Clique nos cards para abrir os detalhes completos e avaliar com estrelas.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 text-violet-700 rounded-full flex-shrink-0 self-start sm:self-center">
          {isEmpty ? 0 : spoilers.length} lançados
        </span>
      </div>

      {isEmpty ? (
        <div className="text-center py-10 px-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-600 font-sans space-y-2">
          <p className="text-sm font-bold text-slate-800">
            Nenhum spoiler arquivado ainda
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Assim que o administrador publicar e arquivar os próximos spoilers semanais, eles aparecerão organizados aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="max-h-[540px] overflow-y-auto pr-1 sm:pr-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {spoilers.map((spoil) => {
                const isDateValid = spoil.createdAt && !isNaN(new Date(spoil.createdAt).getTime());
                const formattedDate = isDateValid
                  ? new Date(spoil.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  : 'Sem data';

                const snippet = getPlainSnippet(spoil.description);
                const firstImgUrl = getFirstImageFromDescription(spoil.description) || spoil.imageUrl;
                const avgRating = spoil.ratingCount && spoil.ratingCount > 0 
                  ? (spoil.ratingSum || 0) / spoil.ratingCount 
                  : null;

                return (
                  <div 
                    key={spoil.id}
                    onClick={() => setImmersiveSpoiler(spoil)}
                    className="flex flex-col bg-white/80 backdrop-blur-md hover:border-violet-400 border-2 border-white/80 rounded-2xl overflow-hidden transition-all duration-200 shadow-xs hover:shadow-md group cursor-pointer relative"
                  >
                    {/* Card Image */}
                    <div className="h-36 w-full overflow-hidden relative bg-gradient-to-br from-violet-100 via-sky-50 to-amber-50 border-b border-slate-100">
                      {firstImgUrl ? (
                        <img 
                          src={firstImgUrl} 
                          alt={spoil.title} 
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" 
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-display font-bold text-2xl text-violet-300">
                          PKXD
                        </div>
                      )}
                      
                      {/* Date overlay badge */}
                      <div className="absolute top-2.5 left-2.5 bg-white/95 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                        {formattedDate}
                      </div>

                      {/* Rating Badge */}
                      <div className="absolute top-2.5 right-2.5 bg-amber-300 text-slate-900 font-sans font-extrabold text-[11px] px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                        ★ {avgRating ? avgRating.toFixed(1) : 'Novo'}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-violet-700 leading-snug transition-colors line-clamp-1">
                          {spoil.title}
                        </h4>
                        <p className="font-sans text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {snippet || 'Toque para abrir a descrição completa.'}
                        </p>
                      </div>

                      {/* Interactive Emoji Reaction Bar */}
                      <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider pl-1.5 select-none">Reagir:</span>
                        <div className="flex items-center gap-1">
                          {[
                            { emoji: '👍', label: 'Like' },
                            { emoji: '🔥', label: 'Amei' },
                            { emoji: '😮', label: 'Uau' },
                            { emoji: '🚀', label: 'Top' },
                            { emoji: '😢', label: 'Triste' }
                          ].map((item) => {
                            const count = spoil.reactions?.[item.emoji] || 0;
                            const hasReactedToThis = reactedSpoilers[spoil.id] === item.emoji;
                            const hasReactedToAny = !!reactedSpoilers[spoil.id];

                            return (
                              <button
                                key={item.emoji}
                                type="button"
                                onClick={(e) => handleReactAction(spoil.id, item.emoji, e)}
                                disabled={hasReactedToAny}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg transition-all duration-150 cursor-pointer text-xs select-none ${
                                  hasReactedToThis
                                    ? 'bg-violet-100 text-violet-800 border border-violet-300 font-bold'
                                    : hasReactedToAny
                                      ? 'opacity-45 pointer-events-none'
                                      : 'hover:bg-white text-slate-600 hover:text-slate-900 active:scale-95'
                                }`}
                                title={`Reagir com ${item.label}`}
                              >
                                <span>{item.emoji}</span>
                                {count > 0 && (
                                  <span className="text-[10px] font-mono font-bold text-slate-600">
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Open detail trigger & Share row */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span 
                            onClick={() => setImmersiveSpoiler(spoil)}
                            className="text-xs font-bold text-violet-700 group-hover:text-violet-900 flex items-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            Abrir
                          </span>

                          {/* Share Link Button */}
                          <button
                            type="button"
                            onClick={(e) => handleShare(spoil.id, e)}
                            className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border active:scale-95 transition-all cursor-pointer ${
                              copiedId === spoil.id 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                                : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700'
                            }`}
                            title="Copiar Link para Compartilhar"
                          >
                            <Share2 className="w-3 h-3" />
                            {copiedId === spoil.id ? 'Copiado!' : 'Compartilhar'}
                          </button>
                        </div>

                        {/* Admin Direct Actions inside lists */}
                        {isAdmin && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {onEdit && (
                              <button 
                                type="button"
                                onClick={() => onEdit(spoil)}
                                className="text-amber-700 hover:bg-amber-100 p-1.5 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {confirmDeleteId === spoil.id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onDelete(spoil.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                              >
                                Confirmar?
                              </button>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => setConfirmDeleteId(spoil.id)}
                                className="text-rose-600 hover:bg-rose-100 p-1.5 bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                                title="Deletar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {spoilers.length > 3 && (
            <div className="text-center pt-1">
              <span className="text-xs font-semibold text-slate-500 bg-white px-3.5 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1">
                <span>Role o painel acima para ver todos os {spoilers.length} spoilers</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* IMMERSIVE FULL-SCREEN MODE MODAL */}
      {immersiveSpoiler && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setImmersiveSpoiler(null)}
        >
          {/* Main Modal Panel */}
          <div 
            className="relative pkxd-glass-modal max-w-2xl w-full rounded-3xl overflow-hidden my-8 text-slate-900 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Area */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-pink-600" />
                <span className="text-xs font-extrabold uppercase text-violet-700 tracking-wider">
                  Visualização Completa do Spoiler
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImmersiveSpoiler(null)}
                className="text-slate-500 hover:text-slate-900 p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content inside */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-grow">
              
              {/* Optional big Cover image / GIF */}
              {immersiveSpoiler.imageUrl && (
                <div className="w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 relative p-1.5">
                  <img 
                    src={immersiveSpoiler.imageUrl} 
                    alt={immersiveSpoiler.title} 
                    className="w-full max-h-[380px] object-contain mx-auto rounded-xl" 
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Title & Metadata */}
              <div className="space-y-2 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <Calendar className="w-4 h-4 text-violet-600" />
                  <span>
                    Publicado em {immersiveSpoiler.createdAt && !isNaN(new Date(immersiveSpoiler.createdAt).getTime())
                      ? new Date(immersiveSpoiler.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })
                      : 'Sem data'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
                  {immersiveSpoiler.title}
                </h3>
              </div>

              {/* Description */}
              <div>
                {renderRichContent(immersiveSpoiler.description)}
              </div>

              {/* Fans Rating Box */}
              {(() => {
                const spId = immersiveSpoiler.id;
                const ratedValue = ratedSpoilers[spId];
                const hoverValue = hoveredStars[spId] || 0;
                const avgRating = immersiveSpoiler.ratingCount && immersiveSpoiler.ratingCount > 0 
                  ? (immersiveSpoiler.ratingSum || 0) / immersiveSpoiler.ratingCount 
                  : null;

                return (
                  <div className="flex flex-col gap-3 p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 mt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <span className="text-slate-900 font-bold uppercase text-xs tracking-wider flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        Média de avaliação dos fãs
                      </span>
                      <span className="text-amber-900 font-mono font-bold text-sm flex items-center gap-1.5 bg-white px-3.5 py-1 rounded-full border border-amber-300">
                        ★ {avgRating ? `${avgRating.toFixed(1)} / 5.0` : 'Sem votos'}
                        {immersiveSpoiler.ratingCount ? ` (${immersiveSpoiler.ratingCount} votos)` : ''}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-1 border-t border-amber-200 pt-3">
                      <span className="text-slate-700 text-xs font-semibold">
                        {ratedValue ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                            ✓ Você deu nota {ratedValue} ★ (+15 XP coletados)
                          </span>
                        ) : (
                          <span>Avalie esse spoiler para ganhar <strong className="text-amber-800 font-extrabold">+15 XP</strong>:</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = ratedValue ? star <= ratedValue : (hoverValue ? star <= hoverValue : false);
                          return (
                            <button
                              key={star}
                              type="button"
                              disabled={!!ratedValue}
                              onClick={() => handleRateAction(spId, star)}
                              onMouseEnter={() => !ratedValue && setHoveredStars(prev => ({ ...prev, [spId]: star }))}
                              onMouseLeave={() => !ratedValue && setHoveredStars(prev => ({ ...prev, [spId]: 0 }))}
                              className={`cursor-pointer transition-all duration-150 ${!!ratedValue ? 'opacity-85' : 'hover:scale-125 active:scale-95'}`}
                            >
                              <Star 
                                className={`w-6 h-6 ${
                                  isFilled 
                                    ? 'fill-amber-400 text-amber-500' 
                                    : 'text-slate-300'
                                }`} 
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Footer Row */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => handleShare(immersiveSpoiler.id, e)}
                className={`px-5 py-2.5 border-2 font-sans font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 ${
                  copiedId === immersiveSpoiler.id
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white hover:bg-sky-50 border-slate-200 hover:border-sky-300 text-sky-700'
                }`}
                title="Copiar link direto para este spoiler"
              >
                <Share2 className="w-4 h-4" />
                {copiedId === immersiveSpoiler.id ? 'Link Copiado!' : 'Compartilhar Spoiler'}
              </button>

              <button
                type="button"
                onClick={() => setImmersiveSpoiler(null)}
                className="pkxd-btn-primary px-6 py-2.5 text-xs uppercase tracking-wider cursor-pointer"
              >
                Voltar para a Galeria
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}


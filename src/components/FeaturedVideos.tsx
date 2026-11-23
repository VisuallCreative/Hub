import React, { useState } from 'react';
import { Star, Play, Trash2, Trophy, Sparkles, ExternalLink, Check, X } from 'lucide-react';
import { FeaturedVideo } from '../types';
import { playTapSound } from '../utils/audio';

interface FeaturedVideosProps {
  videos: FeaturedVideo[];
  isAdmin: boolean;
  currentUser: any;
  onDelete: (id: string) => void;
  onAddXP?: (amount: number, reason: string) => void;
  onNavigate?: (path: string) => void;
}

export default function FeaturedVideos({ videos, isAdmin, onDelete, onNavigate }: FeaturedVideosProps) {
  const [activeTab, setActiveTab] = useState<'painel' | 'comunidade'>('painel');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const mostRecentVideoId = videos.length > 0
    ? [...videos].sort((a, b) => b.createdAt - a.createdAt)[0].id
    : null;

  const getYoutubeEmbedId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch {
      return null;
    }
  };

  const openVideo = (url: string) => {
    playTapSound();
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const filteredVideos = videos.filter(video => {
    const type = video.type || 'game_highlight';
    return activeTab === 'painel' ? type === 'game_highlight' : type === 'panel_video';
  });

  return (
    <section
      id="featured-videos-section"
      className="pkxd-glass rounded-[34px] p-5 sm:p-8 space-y-6 text-left"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
              Painel de Destaques da Comunidade
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-600 mt-0.5">
              Os melhores vídeos, gameplays e criações selecionados pela equipe do{' '}
              <strong className="text-violet-700">PKXD Central</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {onNavigate ? (
            <button
              onClick={() => {
                playTapSound();
                onNavigate('/inscricoes#panel');
              }}
              className="pkxd-btn-primary px-4 py-2.5 rounded-2xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enviar Conteúdo</span>
            </button>
          ) : (
            <a
              href="https://forms.gle/bmJqrXkSa9uibQqo9"
              target="_blank"
              rel="noopener noreferrer"
              className="pkxd-btn-primary px-4 py-2.5 rounded-2xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enviar Conteúdo</span>
            </a>
          )}
          <span className="font-bold text-[11px] uppercase px-3 py-1 bg-violet-50 text-violet-700 rounded-full border border-violet-200 whitespace-nowrap">
            Curadoria Oficial
          </span>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => {
            playTapSound();
            setActiveTab('painel');
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'painel'
              ? 'pkxd-btn-gold'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-2 border-slate-200'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${activeTab === 'painel' ? 'fill-current' : ''}`} />
          <span>Painel (Super Destaques)</span>
        </button>

        <button
          onClick={() => {
            playTapSound();
            setActiveTab('comunidade');
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'comunidade'
              ? 'pkxd-btn-primary'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-2 border-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Comunidade (Enviados)</span>
        </button>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-10 rounded-3xl text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">
            {activeTab === 'painel'
              ? 'Nenhum vídeo em Super Destaque no momento.'
              : 'Nenhum vídeo aprovado na aba da Comunidade ainda.'}
          </p>
          <p className="text-xs text-slate-500">
            Envie seu melhor vídeo de PK XD para participar da próxima seleção!
          </p>
        </div>
      ) : (
        <div className="max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredVideos.map((video) => {
              const embedId = getYoutubeEmbedId(video.youtubeUrl);
              const isMostRecent = video.id === mostRecentVideoId;
              const isPainel = video.type === 'game_highlight';

              return (
                <article
                  key={video.id}
                  className={`rounded-3xl overflow-hidden flex flex-col justify-between group transition-all relative border-2 ${
                    isPainel
                      ? 'border-amber-300 bg-amber-50/40 shadow-sm hover:border-amber-400'
                      : 'bg-white border-slate-200 hover:border-violet-300 shadow-sm'
                  }`}
                >
                  {/* Prestigious Floating Badge */}
                  {isPainel && (
                    <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-display font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm border border-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Super Destaque Oficial</span>
                    </div>
                  )}

                  {!isPainel && isMostRecent && (
                    <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 bg-pink-600 text-white text-[10px] font-display font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      <span>Novo Destaque</span>
                    </div>
                  )}

                  {/* Embed player */}
                  <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                    {embedId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${embedId}`}
                        title={video.title}
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => openVideo(video.youtubeUrl)}
                        className="absolute inset-0 w-full h-full bg-gradient-to-br from-violet-600 to-sky-600 flex flex-col items-center justify-center text-center p-4 cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                          <Play className="w-7 h-7 fill-current ml-0.5" />
                        </div>
                        <span className="text-xs uppercase font-bold text-white tracking-wider">
                          Assistir no YouTube
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="p-5 space-y-3 bg-white flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            isPainel
                              ? 'text-amber-800 bg-amber-100 border-amber-300'
                              : 'text-violet-700 bg-violet-50 border-violet-200'
                          }`}
                        >
                          {isPainel ? 'Destaque Supremo' : 'Destaque da Semana'}
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {video.createdAt && !isNaN(new Date(video.createdAt).getTime())
                            ? new Date(video.createdAt).toLocaleDateString('pt-BR')
                            : 'Sem Data'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug">
                          {video.title}
                        </h4>
                        {video.author && video.author !== 'Staff PKXD Central' && (
                          <p className="text-xs font-bold text-violet-700">
                            Criador: @{video.author.replace('@', '')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openVideo(video.youtubeUrl)}
                        className="text-xs font-bold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver no YouTube</span>
                      </button>

                      {isAdmin && (
                        confirmDeleteId === video.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                playTapSound();
                                onDelete(video.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold inline-flex items-center cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setConfirmDeleteId(video.id);
                            }}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Deletar vídeo destacado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

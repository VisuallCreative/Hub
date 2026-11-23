import React, { useState, useEffect, useMemo } from 'react';
import { Youtube, Video, Play, Award, Users, ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { FeaturedVideo, ShortItem } from '../types';
import FeaturedVideos from './FeaturedVideos';
import BestShorts from './BestShorts';
import CreatorProgressAnalyzer from './CreatorProgressAnalyzer';

interface CreatorsHubViewProps {
  videos: FeaturedVideo[];
  shorts: ShortItem[];
  isAdmin: boolean;
  currentUser: any;
  initialSubTab?: 'vitrine' | 'analisador';
  soundEnabled: boolean;
  onDeleteVideo: (id: string) => void;
  onDeleteShort: (id: string) => void;
  onAddXP: (amount: number, reason: string) => void;
  onNavigate: (path: string) => void;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
}

export default function CreatorsHubView({
  videos,
  shorts,
  isAdmin,
  currentUser,
  initialSubTab = 'vitrine',
  soundEnabled,
  onDeleteVideo,
  onDeleteShort,
  onAddXP,
  onNavigate,
  onOpenAuthModal,
  triggerAudio,
}: CreatorsHubViewProps) {
  const [subTab, setSubTab] = useState<'vitrine' | 'analisador'>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Build creator directory dynamically from real featured videos
  const creatorProfiles = useMemo(() => {
    const map = new Map<string, { name: string; videosCount: number; latestTitle: string; sampleUrl: string }>();
    videos.forEach((v) => {
      const author = (v.author || 'Criador PKXD Central').trim();
      const existing = map.get(author);
      if (existing) {
        existing.videosCount += 1;
      } else {
        map.set(author, {
          name: author,
          videosCount: 1,
          latestTitle: v.title,
          sampleUrl: v.youtubeUrl,
        });
      }
    });
    return Array.from(map.values());
  }, [videos]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Band */}
      <section className="pkxd-glass rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Área de Criadores
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 text-balance">
            Criadores da Comunidade PK XD
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Conheça canais e criadores em destaque, assista aos melhores vídeos e Shorts da semana ou analise o progresso do seu canal para o Programa Creator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                triggerAudio('tap');
                setSubTab('vitrine');
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                subTab === 'vitrine'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Vitrine e Perfis</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerAudio('tap');
                setSubTab('analisador');
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                subTab === 'analisador'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Analisador Creator</span>
            </button>
          </div>
        </div>
      </section>

      {subTab === 'analisador' ? (
        <CreatorProgressAnalyzer
          onBackToHub={() => setSubTab('vitrine')}
          soundEnabled={soundEnabled}
          triggerAudio={triggerAudio}
          user={currentUser}
          onAddXP={onAddXP}
          onOpenAuthModal={onOpenAuthModal}
        />
      ) : (
        <div className="space-y-10">
          {/* Creator Directory Strip */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="pkxd-comic-title font-display font-bold text-2xl sm:text-3xl">
                  Perfis em Destaque
                </h2>
                <p className="text-sm text-purple-100/90 font-medium mt-1">
                  Criadores que compartilham gameplays, dicas e novidades com a comunidade.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/inscricoes#panel');
                }}
                className="pkxd-btn-gold px-4 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 cursor-pointer self-start whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enviar meu Canal</span>
              </button>
            </div>

            {creatorProfiles.length === 0 ? (
              <div className="pkxd-glass border-amber-200/80 rounded-[34px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-display font-bold text-lg text-slate-900">
                    Quer aparecer na lista oficial de criadores?
                  </p>
                  <p className="text-sm text-slate-600">
                    Envie um vídeo ou canal na área de Oportunidades para ser avaliado e destacado aqui na PKXD Central.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onNavigate('/inscricoes#panel');
                  }}
                  className="pkxd-btn-primary px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>Participar Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatorProfiles.map((creator) => (
                  <div
                    key={creator.name}
                    className="pkxd-glass rounded-[32px] p-5 flex flex-col justify-between gap-4 hover:border-violet-400 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 font-display font-bold text-lg flex items-center justify-center shrink-0">
                          {creator.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-lg text-slate-900 truncate">
                            {creator.name}
                          </h3>
                          <p className="text-xs text-slate-500 tabular-nums">
                            {creator.videosCount} {creator.videosCount === 1 ? 'destaque publicado' : 'destaques publicados'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        Último destaque: {creator.latestTitle}
                      </p>
                    </div>
                    <a
                      href={creator.sampleUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => triggerAudio('tap')}
                      className="inline-flex items-center justify-between px-4 py-2.5 rounded-full bg-slate-50 hover:bg-violet-50 border border-slate-200 text-sm font-bold text-slate-800 hover:text-violet-700 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-rose-600" />
                        <span>Assistir conteúdo</span>
                      </span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Analyzer Promo Strip */}
          <section className="pkxd-glass rounded-[34px] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                Ferramenta Gratuita para Criadores
              </p>
              <h2 className="font-display font-bold text-2xl text-slate-900">
                Analisador de Progresso Creator
              </h2>
              <p className="text-sm text-slate-600 max-w-xl">
                Consulte os números públicos do seu canal do YouTube e veja o quanto falta para atingir os requisitos de criador PK XD.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerAudio('tap');
                setSubTab('analisador');
              }}
              className="pkxd-btn-primary px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Youtube className="w-4 h-4" />
              <span>Analisar Meu Canal</span>
            </button>
          </section>

          {/* Featured Videos & Best Shorts */}
          <FeaturedVideos
            videos={videos}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onDelete={onDeleteVideo}
            onAddXP={onAddXP}
            onNavigate={onNavigate}
          />

          <BestShorts
            shorts={shorts}
            isAdmin={isAdmin}
            onDelete={onDeleteShort}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Sparkles, Compass, Trophy, ChevronRight, X, Flame } from 'lucide-react';

interface WelcomeGuideCardProps {
  onNavigateToPassport: () => void;
  onNavigateToSpoilers: () => void;
  onNavigateToCreator: () => void;
  triggerAudio?: (sound: any) => void;
  isCompactMode: boolean;
  onToggleCompactMode: () => void;
  onDismiss: () => void;
}

export default function WelcomeGuideCard({
  onNavigateToPassport,
  onNavigateToSpoilers,
  onNavigateToCreator,
  triggerAudio,
  isCompactMode,
  onToggleCompactMode,
  onDismiss
}: WelcomeGuideCardProps) {
  return (
    <div
      id="first-access-welcome-guide"
      className="relative overflow-hidden pkxd-glass rounded-3xl p-5 sm:p-7 text-left select-none animate-fade-in"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F3F0FF] border border-purple-200 flex items-center justify-center text-[#6D28D9]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-sans font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#EFF8FF] text-[#0284C7] border border-sky-200">
                Guia Rápido
              </span>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                Bem-vindo ao PKXD Central 2.0!
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Comece por onde preferir em 3 caminhos diretos:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onToggleCompactMode();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer border-2 ${
              isCompactMode
                ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Alternar entre visualização focada e completa"
          >
            <span>{isCompactMode ? 'Modo Focado' : 'Todas as Seções'}</span>
          </button>

          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onDismiss();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Fechar guia"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* Action 1: PKXD ID */}
        <button
          type="button"
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onNavigateToPassport();
          }}
          className="group p-4 bg-[#FFFBEB] hover:bg-amber-100/70 border-2 border-amber-200 hover:border-amber-400 rounded-2xl transition-all cursor-pointer text-left flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center justify-between gap-2">
                <span>1. Criar Meu PKXD ID</span>
                <span className="text-[10px] font-sans text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200 font-extrabold">
                  Popular
                </span>
              </h4>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                Crie seu cartão com Nick, Nível e Conquistas, baixe em imagem HD e compartilhe seu link curto.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-extrabold text-amber-800 group-hover:translate-x-1 transition-transform">
            <span>Acessar PKXD ID</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        {/* Action 2: Spoilers */}
        <button
          type="button"
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onNavigateToSpoilers();
          }}
          className="group p-4 bg-[#EFF8FF] hover:bg-sky-100/70 border-2 border-sky-200 hover:border-[#0284C7] rounded-2xl transition-all cursor-pointer text-left flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 text-[#0284C7] flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center justify-between gap-2">
                <span>2. Spoilers & Novidades</span>
                <span className="text-[10px] font-sans text-[#0284C7] bg-white px-2 py-0.5 rounded-full border border-sky-200 font-extrabold">
                  Ao Vivo
                </span>
              </h4>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                Veja o cronômetro dos próximos spoilers semanais e acompanhe tudo o que vai chegar no jogo.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-extrabold text-[#0284C7] group-hover:translate-x-1 transition-transform">
            <span>Ver Contagem Regressiva</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>

        {/* Action 3: Creator Program */}
        <button
          type="button"
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onNavigateToCreator();
          }}
          className="group p-4 bg-[#F3F0FF] hover:bg-purple-100/70 border-2 border-purple-200 hover:border-[#6D28D9] rounded-2xl transition-all cursor-pointer text-left flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 text-[#6D28D9] flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-slate-900 flex items-center justify-between gap-2">
                <span>3. Programa Creator</span>
                <span className="text-[10px] font-sans text-[#6D28D9] bg-white px-2 py-0.5 rounded-full border border-purple-200 font-extrabold">
                  Progresso
                </span>
              </h4>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                Consulte os requisitos oficiais e calcule seu progresso para se tornar Creator reconhecido.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-extrabold text-[#6D28D9] group-hover:translate-x-1 transition-transform">
            <span>Calcular Requisitos</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>
      </div>
    </div>
  );
}

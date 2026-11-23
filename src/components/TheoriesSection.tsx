import React, { useState } from 'react';
import { Sparkles, MessageSquare, ThumbsUp, Trash2, Calendar } from 'lucide-react';
import { Theory } from '../types';
import { playTapSound, playSuccessSound } from '../utils/audio';

interface TheoriesSectionProps {
  theories: Theory[];
  isAdmin: boolean;
  currentUser: any;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onAddXP: (amount: number, reason: string) => void;
  onNavigate?: (path: string) => void;
}

export default function TheoriesSection({
  theories,
  isAdmin,
  onLike,
  onDelete,
  onAddXP,
  onNavigate
}: TheoriesSectionProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [likedList, setLikedList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_liked_theories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleLikeClick = (id: string) => {
    if (likedList.includes(id)) {
      playTapSound();
      return;
    }

    const updated = [...likedList, id];
    setLikedList(updated);
    localStorage.setItem('pkxd_liked_theories', JSON.stringify(updated));
    onLike(id);
    playSuccessSound();
    onAddXP(80, 'Apoio a Teoria 🔮');
  };

  return (
    <section
      id="theories-section"
      className="pkxd-glass rounded-3xl p-6 sm:p-8 space-y-6 text-left"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 border-2 border-pink-200 text-pink-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900">
              Teorias & Novidades do PK XD
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-600">
              Confira as principais teorias e análises sobre futuras atualizações criadas pela comunidade.
            </p>
          </div>
        </div>

        {onNavigate ? (
          <button
            onClick={() => {
              playTapSound();
              onNavigate('/inscricoes#theory');
            }}
            className="pkxd-btn-primary px-4 py-2.5 text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enviar Teoria</span>
          </button>
        ) : (
          <a
            href="https://forms.gle/xzPA9LYofmPU4JTE9"
            target="_blank"
            rel="noreferrer"
            className="pkxd-btn-primary px-4 py-2.5 text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enviar Teoria</span>
          </a>
        )}
      </div>

      {theories.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-pink-400 mx-auto" />
          <p className="text-sm font-bold text-slate-600">
            Ainda não há teorias publicadas. Envie sua teoria para aparecer aqui!
          </p>
        </div>
      ) : (
        <div className="max-h-[540px] overflow-y-auto pr-1 sm:pr-2 space-y-4 custom-scrollbar">
          {theories.map((theory) => {
            const isLiked = likedList.includes(theory.id);
            const isConfirming = confirmDeleteId === theory.id;
            return (
              <div
                key={theory.id}
                className="bg-slate-50 border-2 border-slate-200 hover:border-pink-300 p-5 rounded-2xl space-y-4 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-pink-700 px-3 py-1 bg-pink-100 border border-pink-200 rounded-full">
                      {theory.author || 'PKXD Central'}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {theory.createdAt && !isNaN(new Date(theory.createdAt).getTime())
                        ? new Date(theory.createdAt).toLocaleDateString('pt-BR')
                        : 'Recente'}
                    </span>
                  </div>

                  {isAdmin && (
                    isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            playTapSound();
                            onDelete(theory.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-lg cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          playTapSound();
                          setConfirmDeleteId(theory.id);
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                        title="Deletar teoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    )
                  )}
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-display font-bold text-base sm:text-lg text-slate-900">
                    {theory.title}
                  </h4>
                  <p className="font-sans text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {theory.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => handleLikeClick(theory.id)}
                    disabled={isLiked}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors border-2 ${
                      isLiked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 cursor-default'
                        : 'bg-white border-slate-200 hover:border-pink-400 text-slate-700 hover:text-pink-700 cursor-pointer'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                    <span className="tabular-nums">Concordar • {theory.likes || 0} votos</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

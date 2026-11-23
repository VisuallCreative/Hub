import React, { useRef, useState } from 'react';
import { Ticket, ExternalLink, Play, Trash2, Edit2, Video, Sparkles, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { NewsItem } from '../types';
import { playTapSound, playSuccessSound } from '../utils/audio';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface PromoCodeRedeemerProps {
  videos: NewsItem[];
  isAdmin: boolean;
  onDeleteVideo: (id: string) => void;
  onEditVideo: (item: NewsItem) => void;
}

export default function PromoCodeRedeemer({ videos, isAdmin, onDeleteVideo, onEditVideo }: PromoCodeRedeemerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [codeText, setCodeText] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codeText.toUpperCase().trim().replace(/\s+/g, '');
    if (!cleanCode) {
      playTapSound();
      setRedeemResult({ success: false, msg: 'Por favor, digite um código de cupom válido.' });
      return;
    }

    setIsRedeeming(true);
    playTapSound();
    setRedeemResult(null);

    try {
      let docRef = doc(db, 'promo_codes', cleanCode);
      let docSnap = null;

      try {
        docSnap = await getDoc(docRef);
        if (!docSnap || !docSnap.exists()) {
          docRef = doc(db, 'generated_promo_codes', cleanCode);
          docSnap = await getDoc(docRef);
        }
      } catch (firestoreErr) {
        console.warn('Firestore promo code lookup failed, checking local fallbacks:', firestoreErr);
      }

      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();

        if ((data.currentRedeems || 0) >= (data.maxRedeems || 0)) {
          setRedeemResult({
            success: false,
            msg: `O cupom "${cleanCode}" atingiu o limite de resgates e expirou.`
          });
          return;
        }

        const userId = auth.currentUser?.uid || localStorage.getItem('pkxd_username_nickname') || 'Jogador_Convidado';
        const redeemedList = data.redeemedUsers || [];
        if (redeemedList.includes(userId)) {
          setRedeemResult({
            success: false,
            msg: `Você já resgatou o cupom "${cleanCode}" nesta conta.`
          });
          return;
        }

        const updatedList = [...redeemedList, userId];
        await updateDoc(docRef, {
          currentRedeems: (data.currentRedeems || 0) + 1,
          redeemedUsers: updatedList
        });

        window.dispatchEvent(new CustomEvent('pkxd_add_gems_coins', {
          detail: { gems: data.gems || 0, coins: data.coins || 0 }
        }));

        playSuccessSound();
        setRedeemResult({
          success: true,
          msg: `Cupom resgatado! Você ganhou +${data.gems || 0} Joias e +${data.coins || 0} Moedas no seu perfil do portal!`
        });
        setCodeText('');
        return;
      }

      const fallbacks: Record<string, { gems: number; coins: number }> = {
        WELCOME: { gems: 50, coins: 2000 },
        PKXD2026: { gems: 100, coins: 5000 },
        '1000GEMAS': { gems: 1000, coins: 0 },
        CENTRAL50: { gems: 50, coins: 3000 }
      };

      if (cleanCode in fallbacks) {
        const reward = fallbacks[cleanCode];

        let localRedeemed: string[] = [];
        try {
          localRedeemed = JSON.parse(localStorage.getItem('pkxd_redeemed_fallbacks') || '[]');
        } catch {}

        if (localRedeemed.includes(cleanCode)) {
          setRedeemResult({
            success: false,
            msg: `Você já resgatou o cupom "${cleanCode}" nesta conta.`
          });
          return;
        }

        localRedeemed.push(cleanCode);
        localStorage.setItem('pkxd_redeemed_fallbacks', JSON.stringify(localRedeemed));

        window.dispatchEvent(new CustomEvent('pkxd_add_gems_coins', {
          detail: { gems: reward.gems, coins: reward.coins }
        }));

        playSuccessSound();
        setRedeemResult({
          success: true,
          msg: `Cupom especial resgatado! Você ganhou +${reward.gems} Joias e +${reward.coins} Moedas no portal!`
        });
        setCodeText('');
        return;
      }

      setRedeemResult({
        success: false,
        msg: `Cupom "${cleanCode}" inválido ou expirado. Acompanhe os criadores abaixo para pegar novos códigos.`
      });
    } catch (err: any) {
      console.error('Erro no resgate do cupom:', err);
      setRedeemResult({
        success: false,
        msg: `Ocorreu um erro ao processar o resgate: ${err.message}`
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const getVideoHref = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(url)}`;
  };

  const getYoutubeEmbedId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch {
      return null;
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    playTapSound();
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.85;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div
      id="promo-code-redeemer-box"
      className="pkxd-glass rounded-3xl p-6 sm:p-8 space-y-6 text-left"
    >
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border-2 border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900">
              Códigos, Cupons & Próximas Lives
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-600">
              Resgate recompensas exclusivas do portal e acompanhe os criadores que liberam códigos do PK XD.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {videos.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleScroll('left')}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border-2 border-slate-200 transition-colors cursor-pointer"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border-2 border-slate-200 transition-colors cursor-pointer"
                title="Próximo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="bg-[#FFFBEB] border border-amber-200 px-3 py-1.5 rounded-full">
            <span className="font-mono tabular-nums text-xs text-amber-800 font-extrabold">
              {videos.length} vídeo(s) listado(s)
            </span>
          </div>
        </div>
      </div>

      {/* DUAL REDEEMER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTOR 1: EXCLUSIVE SITE CODES */}
        <div className="bg-[#FFFBEB] border-2 border-amber-300 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="font-display font-bold text-sm sm:text-base text-amber-900">
                  Códigos Exclusivos do Portal
                </h4>
              </div>
              <span className="bg-white text-amber-800 text-[10px] font-sans font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-amber-300">
                Aqui no Site
              </span>
            </div>

            <p className="text-xs sm:text-sm text-amber-950/80 font-sans leading-relaxed">
              Resgate cupons para receber <strong className="text-amber-950">Moedas e Joias virtuais no seu perfil deste portal</strong>, liberando avatares e personalizações.
            </p>

            <div className="text-xs bg-white border border-amber-200 p-3 rounded-2xl text-amber-900 space-y-1">
              <span className="font-extrabold uppercase block text-[11px] text-amber-700">Cupons ativos para testar:</span>
              <p>• Experimente: <strong className="font-mono underline">WELCOME</strong> (50 Joias + 2.000 Moedas)</p>
              <p>• Especial: <strong className="font-mono underline">1000GEMAS</strong> (1.000 Joias virtuais)</p>
            </div>

            <form onSubmit={handleRedeemCode} className="flex flex-col gap-2.5">
              <input
                type="text"
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                placeholder="Digite o código aqui (Ex: 1000GEMAS)"
                className="w-full bg-white border-2 border-amber-300 rounded-2xl px-4 py-3 text-xs sm:text-sm font-mono font-extrabold uppercase tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 text-center"
                disabled={isRedeeming}
              />

              <button
                type="submit"
                disabled={isRedeeming}
                className="pkxd-btn-gold w-full py-3 disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando código...</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Resgatar Recompensa do Site</span>
                  </>
                )}
              </button>
            </form>

            {redeemResult && (
              <div
                className={`p-3 rounded-2xl border-2 flex items-start gap-2 text-xs font-sans font-bold leading-relaxed ${
                  redeemResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {redeemResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{redeemResult.msg}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-amber-800/75 italic text-center">
            *Estes recursos são virtuais e exclusivos para personalização neste fã-clube.
          </p>
        </div>

        {/* SECTOR 2: OFFICIAL PK XD GAME CODES */}
        <div className="bg-[#F3F0FF] border-2 border-purple-200 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-purple-200 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#6D28D9]" />
                <h4 className="font-display font-bold text-sm sm:text-base text-purple-950">
                  Códigos Oficiais do Jogo PK XD
                </h4>
              </div>
              <span className="bg-white text-[#6D28D9] text-[10px] font-sans font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-purple-200">
                Jogo Oficial
              </span>
            </div>

            <p className="text-xs sm:text-sm text-purple-950/80 font-sans leading-relaxed">
              Tem um código oficial liberado pelos Creators da Afterverse? Resgate diretamente no site oficial para receber os itens na sua conta do jogo PK XD.
            </p>

            <div className="text-xs bg-white border border-purple-200 p-3.5 rounded-2xl text-slate-700 leading-relaxed space-y-1.5">
              <span className="font-extrabold uppercase text-[#6D28D9] block text-[11px]">Como resgatar no jogo:</span>
              <p>1. Clique no botão abaixo para abrir a página oficial de resgates.</p>
              <p>2. Faça login com a sua conta do PK XD.</p>
              <p>3. Insira o código oficial para receber diretamente no seu celular.</p>
            </div>
          </div>

          <div>
            <a
              href="https://app.playpkxd.com/promo-code"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playTapSound()}
              className="pkxd-btn-primary w-full py-3 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              <span>Abrir Resgates Oficiais PK XD</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <span className="text-[11px] text-purple-800/75 block text-center mt-2 font-mono">
              https://app.playpkxd.com/promo-code
            </span>
          </div>
        </div>
      </div>

      {/* Explainer */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle className="text-amber-600 w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="font-sans text-xs sm:text-sm text-slate-700 leading-relaxed">
          <strong className="text-slate-900">Onde conseguir códigos do jogo?</strong> Acompanhe os vídeos e lives dos criadores listados abaixo que recebem cupons oficiais para distribuir durante suas transmissões!
        </p>
      </div>

      {/* Carousel */}
      <div className="relative">
        {videos.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center space-y-2">
            <Video className="w-8 h-8 text-slate-400 mx-auto" />
            <h5 className="font-display font-bold text-base text-slate-800">
              Aguardando próximas lives e vídeos
            </h5>
            <p className="font-sans text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Nenhum criador está com vídeo de códigos listado agora. Acompanhe o canal no WhatsApp para saber assim que novos links entrarem.
            </p>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth custom-scrollbar"
          >
            {videos.map((item) => {
              const embedId = getYoutubeEmbedId(item.content);
              const thumbnailUrl = embedId ? `https://img.youtube.com/vi/${embedId}/0.jpg` : null;
              const isConfirming = confirmDeleteId === item.id;

              return (
                <div
                  key={item.id}
                  className="snap-start w-[290px] sm:w-[320px] flex-shrink-0 bg-slate-50 border-2 border-slate-200 hover:border-amber-400 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-colors shadow-sm"
                >
                  <div className="space-y-2.5">
                    {thumbnailUrl ? (
                      <a
                        href={getVideoHref(item.content)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playTapSound()}
                        className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 block group"
                      >
                        <img
                          src={thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                          <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 fill-white translate-x-[1px]" />
                          </div>
                        </div>
                      </a>
                    ) : (
                      <div className="aspect-video rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                        <Video className="w-8 h-8 text-slate-400" />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-sans font-extrabold uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            item.date?.includes('Ao Vivo')
                              ? 'text-rose-700 bg-rose-100 border-rose-200'
                              : item.date?.includes('Estreia')
                              ? 'text-purple-700 bg-purple-100 border-purple-200'
                              : item.date?.includes('Agendado') || item.date?.includes('Próxima')
                              ? 'text-sky-700 bg-sky-100 border-sky-200'
                              : 'text-amber-800 bg-amber-100 border-amber-200'
                          }`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{item.date || 'Código Ativo'}</span>
                        </span>

                        {item.scheduledAt && (
                          <span className="text-[10px] font-mono tabular-nums text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-bold">
                            {(() => {
                              try {
                                if (item.scheduledAt.includes('T')) {
                                  const [datePart, timePart] = item.scheduledAt.split('T');
                                  const [, month, day] = datePart.split('-');
                                  const [hour, min] = timePart.split(':');
                                  return `${day}/${month} • ${hour}:${min}`;
                                }
                                return item.scheduledAt;
                              } catch {
                                return item.scheduledAt;
                              }
                            })()}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-sans text-slate-500 truncate max-w-[120px]">
                        Por <strong className="text-slate-800">@{item.author.replace('@', '')}</strong>
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>

                    <p className="font-sans text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <a
                      href={getVideoHref(item.content)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playTapSound()}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-sans text-xs font-extrabold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Assistir & Pegar Código</span>
                    </a>

                    {isAdmin && (
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => {
                            playTapSound();
                            onEditVideo(item);
                          }}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg border border-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                playTapSound();
                                onDeleteVideo(item.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              playTapSound();
                              setConfirmDeleteId(item.id);
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Master Portal CTA */}
      <div className="pt-2 text-center border-t border-slate-100">
        <a
          href="https://app.playpkxd.com/promo-code"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playTapSound()}
          className="pkxd-btn-gold w-full sm:w-auto px-6 py-3.5 text-xs sm:text-sm inline-flex items-center justify-center gap-2"
        >
          <Ticket className="w-4 h-4 flex-shrink-0" />
          <span>Ir para o Portal Oficial de Resgates PK XD</span>
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
        </a>
      </div>
    </div>
  );
}

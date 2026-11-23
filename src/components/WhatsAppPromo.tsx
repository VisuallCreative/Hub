import React, { useState } from 'react';
import { MessageSquare, Heart, Bookmark, ExternalLink, ArrowRight, ShieldCheck, Zap, Ticket } from 'lucide-react';
import { playTapSound, playSuccessSound } from '../utils/audio';

interface WhatsAppPromoProps {
  channelUrl: string;
  onAddXP?: (amount: number, reason: string) => void;
}

export default function WhatsAppPromo({ channelUrl, onAddXP }: WhatsAppPromoProps) {
  const [likes, setLikes] = useState(384);
  const [hasLiked, setHasLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(() => {
    try {
      return localStorage.getItem('pkxd_whatsapp_xp_claimed') === 'true';
    } catch {
      return false;
    }
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasLiked) {
      setLikes(likes + 1);
      setHasLiked(true);
      playSuccessSound();
    } else {
      setLikes(likes - 1);
      setHasLiked(false);
      playTapSound();
    }
  };

  const handleJoinClick = () => {
    playLevelUpSound();

    if (!xpClaimed && onAddXP) {
      onAddXP(250, 'Comunidade WhatsApp');
      setXpClaimed(true);
      try {
        localStorage.setItem('pkxd_whatsapp_xp_claimed', 'true');
      } catch {}
    }
  };

  const handleCopyChannelLink = () => {
    try {
      navigator.clipboard.writeText(channelUrl);
      playSuccessSound();
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      setCopiedLink(false);
    }
  };

  function playLevelUpSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      [261.63, 329.63, 392.00, 523.25].forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gain.gain.setValueAtTime(0.12, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.15);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.16);
      });
    } catch (e) {}
  }

  return (
    <div 
      id="whatsapp-promo-container"
      className="bg-emerald-50/90 backdrop-blur-md p-6 sm:p-8 rounded-[34px] border-2 border-white/85 text-slate-900 overflow-hidden relative shadow-md"
    >
      <div className="flex flex-col md:flex-row items-center gap-8">
        
        {/* Left Side: Clean WhatsApp Channel Preview */}
        <div className="w-full md:w-5/12 flex-shrink-0">
          <div className="bg-white rounded-2xl border-2 border-emerald-200 overflow-hidden shadow-sm select-none">
            {/* Header / Chat Name */}
            <div className="bg-emerald-600 p-3.5 flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-display font-bold text-sm shadow-xs">
                PC
              </div>
              <div>
                <h4 className="font-sans font-bold text-sm text-white flex items-center gap-1.5">
                  PKXD Central
                  <span className="bg-white text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    ✓
                  </span>
                </h4>
                <p className="font-sans text-[11px] text-emerald-100 font-semibold">Canal Oficial · Online</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-3.5 max-h-[230px] overflow-y-auto bg-slate-50">
              
              {/* Message bubble 1 */}
              <div className="bg-white text-slate-700 p-3 rounded-2xl rounded-tl-sm max-w-[90%] text-xs border border-slate-200 shadow-xs text-left">
                <span className="text-emerald-700 font-bold text-[10px] block mb-1 uppercase">Comunidade PKXD Central</span>
                Aqui postamos com rapidez os spoilers das novas atualizações, eventos da comunidade e códigos ativos!
                <span className="text-[10px] text-slate-400 text-right block mt-1.5">17:28</span>
              </div>

              {/* Message bubble 2 */}
              <div className="bg-white text-slate-700 p-3 rounded-2xl rounded-tl-sm max-w-[90%] text-xs border border-slate-200 shadow-xs text-left">
                <span className="text-violet-700 font-bold text-[10px] block mb-1 uppercase">Spoilers Semanais</span>
                Toda segunda-feira às 17h30 tem radar novo no ar. Ative o sininho no canal para não perder nada!
                
                {/* Action/reaction bar */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      hasLiked ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-pink-500 text-pink-500' : 'text-slate-500'}`} />
                    <span>{likes} curtidas</span>
                  </button>
                  <span className="text-[10px] text-slate-400">17:31</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Informative Title & Call To Action */}
        <div className="flex-1 space-y-5 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" /> Canal Oficial no WhatsApp
            </div>
            
            <h3 className="font-display font-bold text-2xl sm:text-3xl leading-tight text-slate-900">
              Seja o primeiro a saber de tudo
            </h3>
            
            <p className="font-sans text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mt-2">
              Receba diretamente no WhatsApp as notícias da comunidade PK XD, alertas de códigos, convites de eventos e a contagem para os spoilers semanais.
            </p>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto md:mx-0">
            {[
              { icon: Ticket, text: 'Códigos Exclusivos', color: 'text-amber-700 border-amber-200 bg-white' },
              { icon: ShieldCheck, text: 'Notícias Verificadas', color: 'text-sky-700 border-sky-200 bg-white' }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 ${feature.color} select-none`}
              >
                <feature.icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-sans font-bold text-xs text-slate-800">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Main Join CTA Button */}
          <div className="pt-1 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="relative w-full sm:w-auto">
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleJoinClick}
                  className="w-full px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-sans font-bold text-sm rounded-2xl shadow-[0_4px_0_0_#166534] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span>Entrar no Canal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </a>
                <div className="mt-1.5 text-[11px] font-bold text-emerald-700 text-center sm:text-left">
                  {xpClaimed ? '✓ +250 XP coletados' : 'Ganha +250 XP ao entrar'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyChannelLink}
                className={`w-full sm:w-auto h-fit px-5 py-3 font-sans font-bold text-sm rounded-2xl border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{copiedLink ? '✓ Link Copiado!' : 'Compartilhar Canal'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

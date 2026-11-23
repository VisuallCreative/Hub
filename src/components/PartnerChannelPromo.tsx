import React, { useState } from 'react';
import { MessageSquare, Heart, ExternalLink, ArrowRight, ShieldCheck, Zap, Star, Sparkles, Bell } from 'lucide-react';
import { playTapSound, playSuccessSound } from '../utils/audio';

interface PartnerChannelPromoProps {
  onAddXP?: (amount: number, reason: string) => void;
}

export default function PartnerChannelPromo({ onAddXP }: PartnerChannelPromoProps) {
  const channelUrl = "https://whatsapp.com/channel/0029Vb66p8S47XeCPY21PF1E";
  const channelName = "Alertas PK XD";
  
  const [likes, setLikes] = useState(412);
  const [hasLiked, setHasLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(() => {
    try {
      return localStorage.getItem('pkxd_partner_xp_claimed') === 'true';
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
      onAddXP(250, 'Parceria Alertas PK XD');
      setXpClaimed(true);
      try {
        localStorage.setItem('pkxd_partner_xp_claimed', 'true');
      } catch {}
    }
  };

  const handleCopyPartnerLink = () => {
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
      [293.66, 349.23, 440.00, 587.33].forEach((freq, index) => {
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
      id="partner-promo-container"
      className="bg-amber-50/90 backdrop-blur-md p-6 sm:p-8 rounded-[34px] border-2 border-white/85 text-slate-900 overflow-hidden relative shadow-md"
    >
      <div className="flex flex-col md:flex-row items-center gap-8">
        
        {/* Left Side: Clean WhatsApp Partner Preview */}
        <div className="w-full md:w-5/12 flex-shrink-0">
          <div className="bg-white rounded-2xl border-2 border-amber-200 overflow-hidden shadow-sm select-none">
            {/* Header / Chat Name */}
            <div className="bg-amber-400 p-3.5 flex items-center gap-3 text-slate-900">
              <div className="w-9 h-9 rounded-xl bg-white text-amber-700 flex items-center justify-center font-bold text-sm shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-sans font-extrabold text-xs text-slate-900 flex items-center gap-1">
                  <span className="truncate">{channelName}</span>
                  <span className="bg-slate-900 text-[9px] font-black text-amber-300 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    ✓
                  </span>
                </h4>
                <p className="font-sans text-[11px] text-amber-950 font-semibold">Parceiro Oficial · Alertas Ativos</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-3.5 max-h-[220px] overflow-y-auto bg-slate-50">
              
              {/* Message bubble 1 */}
              <div className="bg-white text-slate-700 p-3 rounded-2xl rounded-tl-sm max-w-[90%] text-xs border border-slate-200 shadow-xs text-left">
                <span className="text-amber-700 font-bold text-[10px] block mb-1 uppercase">Canal Parceiro de Alertas</span>
                Avisos rápidos sobre atualizações, horários e novidades em tempo real para você não perder nada no PK XD!
                <span className="text-[10px] text-slate-400 text-right block mt-1">11:15</span>
              </div>

              {/* Message bubble 2 */}
              <div className="bg-white text-slate-700 p-3 rounded-2xl rounded-tl-sm max-w-[90%] text-xs border border-slate-200 shadow-xs text-left">
                <span className="text-sky-700 font-bold text-[10px] block mb-1 uppercase">Atualizações &amp; Promo Codes</span>
                Novo código liberado! Confira rapidamente antes que o prazo expire.
                
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      hasLiked ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-amber-500 text-amber-600' : 'text-slate-500'}`} />
                    <span>{likes} curtidas</span>
                  </button>
                  <span className="text-[10px] text-slate-400">11:18</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Informative Title & Call To Action */}
        <div className="flex-1 space-y-5 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-200 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Parceiro Oficial PKXD Central
            </div>
            
            <h3 className="font-display font-bold text-2xl sm:text-3xl leading-tight text-slate-900">
              {channelName}
            </h3>
            
            <p className="font-sans text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mt-2">
              Conheça nosso canal parceiro oficial no WhatsApp para acompanhar alertas instantâneos sobre novidades relâmpago, códigos e eventos do universo PK XD.
            </p>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto md:mx-0">
            {[
              { icon: Zap, text: 'Alertas Rápidos', color: 'text-amber-700 border-amber-200 bg-white' },
              { icon: ShieldCheck, text: 'Parceria Verificada', color: 'text-sky-700 border-sky-200 bg-white' }
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
            <div className="flex flex-col sm:flex-row gap-3 pt-1 justify-center md:justify-start">
              <div className="relative w-full sm:w-auto">
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleJoinClick}
                  className="pkxd-btn-gold w-full px-6 py-3 text-sm flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span>Seguir Canal de Alertas</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </a>
                <div className="mt-1.5 text-[11px] font-bold text-amber-800 text-center sm:text-left">
                  {xpClaimed ? '✓ +250 XP coletados' : 'Ganha +250 XP ao seguir'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyPartnerLink}
                className={`w-full sm:w-auto h-fit px-5 py-3 font-sans font-bold text-sm rounded-2xl border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{copiedLink ? '✓ Link Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

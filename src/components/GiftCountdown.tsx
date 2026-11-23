import React, { useState, useEffect } from 'react';
import { Gift, Lock, Unlock, Copy, Check, Sparkles, Timer } from 'lucide-react';
import { playTapSound, playSuccessSound } from '../utils/audio';

interface GiftCountdownProps {
  title: string;
  targetDate: string;
  enabled: boolean;
  giftContent: string;
}

export default function GiftCountdown({
  title,
  targetDate,
  enabled,
  giftContent
}: GiftCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!enabled || !targetDate) return;

    const calculateTime = () => {
      const targetTime = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, enabled]);

  if (!enabled || !targetDate) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(giftContent);
    setCopied(true);
    playSuccessSound();
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div 
      id="gift-countdown-banner-wrapper"
      className={`relative w-full max-w-4xl mx-auto mb-6 overflow-hidden rounded-3xl border-2 p-5 sm:p-6 transition-all duration-300 shadow-sm ${
        timeLeft.isOver 
          ? 'bg-emerald-50 border-emerald-200 text-slate-900' 
          : 'bg-violet-50 border-violet-200 text-slate-900'
      }`}
    >
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Present state / details */}
        <div className="flex items-center gap-4 text-left flex-1 w-full">
          <div className={`relative p-3.5 rounded-2xl flex-shrink-0 border-2 ${
            timeLeft.isOver 
              ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' 
              : 'bg-violet-600 border-violet-700 text-white shadow-sm'
          }`}>
            {timeLeft.isOver ? (
              <>
                <Unlock className="w-7 h-7" />
                <Sparkles className="absolute -top-1.5 -right-1.5 w-4 h-4 text-amber-300" />
              </>
            ) : (
              <>
                <Lock className="w-7 h-7" />
                <Gift className="absolute -top-1.5 -right-1.5 w-4 h-4 text-amber-300" />
              </>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                timeLeft.isOver 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-violet-100 text-violet-800 border-violet-200'
              }`}>
                {timeLeft.isOver ? 'Liberado agora' : 'Contagem regressiva'}
              </span>
            </div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
              {timeLeft.isOver 
                ? 'A contagem acabou! O código ou presente abaixo já está liberado para resgate.' 
                : 'Aguarde a contagem abaixo para revelar o seu código especial PK XD.'
              }
            </p>
          </div>
        </div>

        {/* Action content / clock side */}
        <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3 flex-shrink-0">
          
          {!timeLeft.isOver ? (
            /* CLOCK TIMER DISPLAY */
            <div className="flex items-center gap-1.5 sm:gap-2" id="gift-countdown-timer-clocks">
              
              {/* Days */}
              {timeLeft.days > 0 && (
                <div className="flex flex-col items-center bg-white border-2 border-violet-200 rounded-2xl p-2 px-3 min-w-[54px] shadow-xs">
                  <span className="font-mono tabular-nums font-bold text-lg sm:text-xl text-violet-700 leading-none">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-1">Dias</span>
                </div>
              )}

              {/* Hours */}
              <div className="flex flex-col items-center bg-white border-2 border-violet-200 rounded-2xl p-2 px-3 min-w-[54px] shadow-xs">
                <span className="font-mono tabular-nums font-bold text-lg sm:text-xl text-violet-700 leading-none">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-1">Horas</span>
              </div>

              <span className="font-mono font-black text-violet-400 text-lg">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center bg-white border-2 border-violet-200 rounded-2xl p-2 px-3 min-w-[54px] shadow-xs">
                <span className="font-mono tabular-nums font-bold text-lg sm:text-xl text-violet-700 leading-none">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-1">Min</span>
              </div>

              <span className="font-mono font-black text-violet-400 text-lg">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center bg-white border-2 border-pink-200 rounded-2xl p-2 px-3 min-w-[54px] shadow-xs">
                <span className="font-mono tabular-nums font-bold text-lg sm:text-xl text-pink-600 leading-none">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-1">Seg</span>
              </div>

            </div>
          ) : (
            /* REVEALED GIFT/CODE CONTAINER */
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="bg-white border-2 border-emerald-300 rounded-2xl p-2.5 px-4 font-mono font-bold text-sm text-emerald-800 tracking-wide text-center select-all flex items-center justify-center min-w-[200px]">
                {giftContent}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs py-2.5 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_3px_0_0_#047857] active:translate-y-0.5 active:shadow-none"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Presente</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
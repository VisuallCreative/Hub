import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  MessageCircle,
  ArrowRight,
  PawPrint,
  BellRing,
} from 'lucide-react';
import { PetInterestPayload } from '../types';

export const SITE_FAVICON_URL =
  '/assets/aistudio/file_000000004688820e877cea70c3a4dcc9_6049124b.png';

export interface PopupNotificationItem {
  id: string;
  title: string;
  body: string;
  categoryLabel?: string;
  targetUrl?: string;
  petInterest?: PetInterestPayload;
  createdAt?: number;
}

interface NotificationPopupBannerProps {
  notification: PopupNotificationItem | null;
  onDismiss: () => void;
  onOpen: (targetUrl?: string) => void;
}

export default function NotificationPopupBanner({
  notification,
  onDismiss,
  onOpen,
}: NotificationPopupBannerProps) {
  const [hovered, setHovered] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);

  useEffect(() => {
    setCopiedTag(false);
  }, [notification?.id]);

  useEffect(() => {
    if (!notification || hovered) return;
    const duration = notification.petInterest ? 12000 : 8000;
    const timer = window.setTimeout(() => {
      onDismiss();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [notification, hovered, onDismiss]);

  if (!notification || typeof document === 'undefined') {
    return null;
  }

  const pet = notification.petInterest;
  const waDigits =
    pet && pet.contactType === 'whatsapp'
      ? pet.contactValue.replace(/\D/g, '')
      : '';
  const waHref =
    waDigits.length >= 10
      ? `https://wa.me/${waDigits.startsWith('55') ? waDigits : `55${waDigits}`}?text=${encodeURIComponent(
          `Oi ${pet?.senderName}! Vi seu "Eu quero!" no meu pet ${pet?.petName} no PK XD Central!`
        )}`
      : null;

  const handleCopySender = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pet) return;
    const tag = `${pet.senderName}#${pet.senderTagNumber}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tag).catch(() => {});
    }
    setCopiedTag(true);
    window.setTimeout(() => setCopiedTag(false), 2000);
  };

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed top-3 sm:top-5 left-3 right-3 sm:left-auto sm:right-5 sm:w-[410px] z-[150] animate-fade-in"
    >
      <div
        onClick={() => onOpen(notification.targetUrl || '/notificacoes')}
        className="w-full rounded-[24px] bg-white text-[#120624] border-[3px] border-[#120624] shadow-[0_10px_28px_rgba(18,6,36,0.42),0_5px_0_#16032E] overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5"
      >
        {/* Top Accent Strip */}
        <div
          className={`px-4 py-2 border-b-2 border-[#120624] flex items-center justify-between gap-2 ${
            pet ? 'bg-[#DCFCE7]' : 'bg-[#FEF9C3]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#2D0859] truncate">
              {pet ? (
                <PawPrint className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              ) : (
                <BellRing className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" />
              )}
              <span>{notification.categoryLabel || 'Notificação PK XD Central'}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-600 shrink-0">
              · agora
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Fechar notificação pop-up"
            className="w-6 h-6 rounded-full bg-white border-2 border-[#120624] text-[#120624] hover:bg-slate-100 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Pop-up Body */}
        <div className="p-4 flex items-start gap-3.5 text-left">
          {/* Site Favicon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-[#2D0859] border-[2.5px] border-[#120624] shadow-[0_3px_0_#120624] flex items-center justify-center p-1.5 shrink-0">
            <img
              src={SITE_FAVICON_URL}
              alt="PK XD Central"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <h4 className="font-display font-bold text-sm sm:text-base text-[#120624] leading-snug line-clamp-2">
              {notification.title}
            </h4>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed line-clamp-3">
              {notification.body}
            </p>

            {/* Structured Pet Interest Contact Info */}
            {pet && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-2 rounded-xl bg-[#F8FAFC] border-2 border-[#120624] p-2.5 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                  <span className="font-extrabold text-[#120624] truncate">
                    {pet.senderName}{' '}
                    <span className="font-mono text-[#6D28D9]">
                      #{pet.senderTagNumber}
                    </span>
                  </span>
                  <span className="font-mono font-extrabold text-emerald-700 truncate">
                    {pet.contactValue}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopySender}
                    className="px-2.5 py-1 rounded-lg border-2 border-[#120624] bg-[#FEF9C3] hover:bg-[#F9C826] text-[11px] font-extrabold text-[#120624] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedTag ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar #</span>
                      </>
                    )}
                  </button>

                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg border-2 border-[#120624] bg-[#25D366] text-[#120624] text-[11px] font-extrabold inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpen('/notificacoes')}
                    className="px-2.5 py-1 rounded-lg border-2 border-[#120624] bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[11px] font-extrabold text-[#2D0859] inline-flex items-center gap-1 cursor-pointer ml-auto"
                  >
                    <span>Ver tudo</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {!pet && (
              <div className="pt-1 flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-[#6D28D9] inline-flex items-center gap-1">
                  <span>Toque para abrir</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

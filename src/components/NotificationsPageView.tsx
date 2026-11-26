import React, { useState, useMemo } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Check,
  Trash2,
  Calendar,
  Trophy,
  Newspaper,
  Megaphone,
  Clock,
  CheckCircle2,
  Sparkles,
  PawPrint,
  Copy,
  MessageCircle,
  AtSign,
  ExternalLink,
} from 'lucide-react';
import { AppNotification, NotificationCategory } from '../types';

interface NotificationsPageViewProps {
  notifications: AppNotification[];
  seenIds: string[];
  isAdmin: boolean;
  hasPushPermission: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string, isPersonalPet?: boolean) => void;
  onEnablePush: () => Promise<unknown> | void;
  onTestPopup?: () => void;
  onNavigate: (path: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
}

const NOTIF_META: Record<string, { label: string; icon: any; bg: string }> = {
  pet_interest: { label: 'Interesse no seu Pet', icon: PawPrint, bg: 'bg-[#DCFCE7]' },
  new_event: { label: 'Novo Evento', icon: Calendar, bg: 'bg-[#FEF9C3]' },
  upcoming_event: { label: 'Evento Próximo', icon: Clock, bg: 'bg-[#DBEAFE]' },
  schedule_change: { label: 'Alteração de Horário', icon: Clock, bg: 'bg-amber-100' },
  presence_confirmed: { label: 'Confirmação de Presença', icon: CheckCircle2, bg: 'bg-emerald-100' },
  new_tournament: { label: 'Novo Torneio', icon: Trophy, bg: 'bg-[#FCE7F3]' },
  important_news: { label: 'Notícia Importante', icon: Newspaper, bg: 'bg-[#DBEAFE]' },
  story_published: { label: 'Notícia / Spoiler', icon: Sparkles, bg: 'bg-[#EDE9FE]' },
  admin_announcement: { label: 'Comunicado Admin', icon: Megaphone, bg: 'bg-[#FCE7F3]' },
  custom_push: { label: 'Comunicado Oficial', icon: Megaphone, bg: 'bg-[#EDE9FE]' },
  countdown_alert: { label: 'Alerta de Contagem', icon: Clock, bg: 'bg-[#FEF9C3]' },
  delayed_alert: { label: 'Aviso de Horário', icon: Clock, bg: 'bg-amber-100' },
};

const FILTER_OPTIONS: { id: 'all' | 'unread' | NotificationCategory; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'Não lidas' },
  { id: 'pet_interest', label: 'Pets' },
  { id: 'new_event', label: 'Novos Eventos' },
  { id: 'new_tournament', label: 'Torneios' },
  { id: 'schedule_change', label: 'Horários' },
  { id: 'important_news', label: 'Notícias' },
  { id: 'admin_announcement', label: 'Comunicados' },
];

export default function NotificationsPageView({
  notifications,
  seenIds,
  isAdmin,
  hasPushPermission,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onEnablePush,
  onTestPopup,
  onNavigate,
  triggerAudio,
}: NotificationsPageViewProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationCategory>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyValue = (key: string, value: string) => {
    triggerAudio('tap');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2200);
  };

  const buildWhatsappHref = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const withCountry = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${withCountry}`;
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !seenIds.includes(n.id)).length,
    [notifications, seenIds]
  );

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !seenIds.includes(n.id);
      if (filter === 'important_news') return n.type === 'important_news' || n.type === 'story_published';
      if (filter === 'admin_announcement') return n.type === 'admin_announcement' || n.type === 'custom_push';
      if (filter === 'schedule_change') return n.type === 'schedule_change' || n.type === 'delayed_alert' || n.type === 'upcoming_event';
      return n.type === filter;
    });
  }, [notifications, seenIds, filter]);

  return (
    <div className="w-full animate-fade-in">
      <section className="pkxd-band-purple py-10 sm:py-14 border-b-[4px] border-[#120624]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="pkxd-comic-title text-4xl sm:text-5xl font-bold">
                Notificações
              </h1>
              <p className="text-sm sm:text-base text-white font-semibold">
                Avisos de novos eventos, torneios, alterações de horário, confirmações de presença, notícias e comunicados da equipe.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('success');
                    onMarkAllRead();
                  }}
                  className="pkxd-btn-gold px-4 py-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Marcar todas como lidas ({unreadCount})</span>
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onNavigate('/admin#comunicados')}
                  className="pkxd-pop-btn px-4 py-2.5 text-xs cursor-pointer"
                >
                  + Enviar Comunicado
                </button>
              )}
            </div>
          </div>

          {/* Push Opt-in Bar */}
          <div className="pkxd-pop-card-purple p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2D0859] border-2 border-[#120624] flex items-center justify-center p-1 shrink-0">
                <img
                  src="/assets/aistudio/file_000000004688820e877cea70c3a4dcc9_6049124b.png"
                  alt="PK XD Central"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-display font-bold text-base text-[#120624]">
                  Notificações Pop-up no Celular e Navegador
                </p>
                <p className="text-xs text-slate-600">
                  Receba alertas pop-up instantâneos quando alguém quiser seu pet ou quando saírem novidades e spoilers.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onTestPopup && (
                <button
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    onTestPopup();
                  }}
                  className="px-4 py-2 rounded-full border-2 border-[#120624] bg-[#FEF9C3] hover:bg-[#F9C826] text-xs font-extrabold text-[#120624] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Testar Pop-up</span>
                </button>
              )}

              {hasPushPermission ? (
                <span className="px-4 py-2 rounded-full bg-emerald-200 border-2 border-[#120624] text-xs font-extrabold text-[#120624] shrink-0 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                  <span>Pop-up Ativado</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onEnablePush}
                  className="pkxd-btn-purple px-5 py-2.5 text-xs cursor-pointer shrink-0"
                >
                  Ativar Notificações Pop-up
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="pkxd-band-purple-2 py-10 sm:py-14 min-h-[420px]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  setFilter(opt.id);
                }}
                className={`px-4 py-2 rounded-full border-[2.5px] border-[#120624] text-xs font-extrabold cursor-pointer ${
                  filter === opt.id
                    ? 'bg-[#F9C826] text-[#120624] shadow-[0_3px_0_#120624]'
                    : 'bg-white text-[#120624] hover:bg-[#FEF9C3]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="pkxd-pop-card p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#FEF9C3] border-[3px] border-[#120624] flex items-center justify-center mx-auto">
                <Bell className="w-7 h-7 text-[#2D0859]" />
              </div>
              <h2 className="font-display font-bold text-2xl text-[#120624]">
                Nenhuma notificação nesta visualização
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Quando houver novos eventos, torneios, atualizações ou comunicados da administração, eles aparecerão no seu histórico aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((notif) => {
                const isRead = seenIds.includes(notif.id);
                const meta = NOTIF_META[notif.type] || NOTIF_META.admin_announcement;
                const Icon = meta.icon;

                return (
                  <div
                    key={notif.id}
                    className={`pkxd-pop-card p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                      isRead ? 'opacity-90' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full border-2 border-[#120624] flex items-center justify-center shrink-0 ${meta.bg}`}
                      >
                        <Icon className="w-5 h-5 text-[#120624]" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                          <span className="text-[#6D28D9]">{meta.label}</span>
                          {!isRead && (
                            <span className="px-2 py-0.5 rounded-full bg-[#EC4899] text-white text-[10px]">
                              NOVA
                            </span>
                          )}
                          <span className="text-slate-400 tabular-nums">
                            {new Date(notif.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-[#120624]">
                          {notif.title}
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">{notif.body}</p>

                        {notif.type === 'pet_interest' && notif.petInterest && (
                          <div className="mt-3 rounded-2xl bg-[#F8FAFC] border-2 border-[#120624] p-3.5 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-xs sm:text-sm font-extrabold text-[#120624]">
                                <span className="text-slate-500 font-bold mr-1.5">Jogador PK XD:</span>
                                {notif.petInterest.senderName}{' '}
                                <span className="font-mono text-[#6D28D9] tabular-nums">
                                  #{notif.petInterest.senderTagNumber}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyValue(
                                    `${notif.id}_tag`,
                                    `${notif.petInterest!.senderName}#${notif.petInterest!.senderTagNumber}`
                                  )
                                }
                                className="px-3 py-1 rounded-xl border-2 border-[#120624] bg-[#FEF9C3] hover:bg-[#F9C826] text-[#120624] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                {copiedKey === `${notif.id}_tag` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar Nome #</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                              <div className="text-xs sm:text-sm font-extrabold text-[#120624] inline-flex items-center gap-1.5 break-all">
                                {notif.petInterest.contactType === 'whatsapp' ? (
                                  <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                                ) : (
                                  <AtSign className="w-4 h-4 text-[#6D28D9] shrink-0" />
                                )}
                                <span className="text-slate-500 font-bold">
                                  {notif.petInterest.contactType === 'whatsapp' ? 'WhatsApp:' : 'Contato @:'}
                                </span>
                                <span className="font-mono">{notif.petInterest.contactValue}</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyValue(
                                      `${notif.id}_contact`,
                                      notif.petInterest!.contactValue
                                    )
                                  }
                                  className="px-3 py-1 rounded-xl border-2 border-[#120624] bg-white hover:bg-slate-100 text-[#120624] text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  {copiedKey === `${notif.id}_contact` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Copiado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>

                                {notif.petInterest.contactType === 'whatsapp' &&
                                  buildWhatsappHref(notif.petInterest.contactValue) && (
                                    <a
                                      href={buildWhatsappHref(notif.petInterest.contactValue)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 rounded-xl border-2 border-[#120624] bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#14532D] text-xs font-extrabold inline-flex items-center gap-1 whitespace-nowrap"
                                    >
                                      <span>Abrir WhatsApp</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                              </div>
                            </div>

                            {notif.petInterest.message && (
                              <p className="text-xs font-semibold text-slate-700 pt-2 border-t border-slate-200">
                                <strong className="text-[#120624]">Recado:</strong> {notif.petInterest.message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerAudio('tap');
                            onMarkRead(notif.id);
                          }}
                          className="pkxd-pop-btn px-3.5 py-1.5 text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Marcar lida</span>
                        </button>
                      )}
                      {notif.targetUrl && notif.targetUrl !== '/' && (
                        <button
                          type="button"
                          onClick={() => {
                            onMarkRead(notif.id);
                            onNavigate(notif.targetUrl!);
                          }}
                          className="pkxd-btn-gold px-3.5 py-1.5 text-xs cursor-pointer"
                        >
                          Abrir
                        </button>
                      )}
                      {(isAdmin || notif.isPersonalPetNotification) && (
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteNotification(notif.id, Boolean(notif.isPersonalPetNotification))
                          }
                          className="p-2 rounded-full border-2 border-[#120624] bg-rose-100 text-rose-700 cursor-pointer"
                          title="Excluir notificação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

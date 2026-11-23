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
} from 'lucide-react';
import { AppNotification, NotificationCategory } from '../types';

interface NotificationsPageViewProps {
  notifications: AppNotification[];
  seenIds: string[];
  isAdmin: boolean;
  hasPushPermission: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onEnablePush: () => Promise<void>;
  onNavigate: (path: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
}

const NOTIF_META: Record<string, { label: string; icon: any; bg: string }> = {
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
  onNavigate,
  triggerAudio,
}: NotificationsPageViewProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationCategory>('all');

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
              <div className="w-11 h-11 rounded-full bg-[#FEF9C3] border-2 border-[#120624] flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-[#2D0859]" />
              </div>
              <div>
                <p className="font-display font-bold text-base text-[#120624]">
                  Alertas Push no Celular e Navegador
                </p>
                <p className="text-xs text-slate-600">
                  Receba avisos instantâneos quando novos torneios, eventos ou comunicados forem publicados.
                </p>
              </div>
            </div>

            {hasPushPermission ? (
              <span className="px-4 py-2 rounded-full bg-emerald-200 border-2 border-[#120624] text-xs font-extrabold text-[#120624] shrink-0 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                <span>Alertas Ativados</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onEnablePush}
                className="pkxd-btn-purple px-5 py-2.5 text-xs cursor-pointer shrink-0"
              >
                Ativar Notificações Push
              </button>
            )}
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
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteNotification(notif.id)}
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

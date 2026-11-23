import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Flame, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Bell, 
  BellRing, 
  Sparkles, 
  Share2, 
  Check, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Gift, 
  Eye, 
  Video, 
  Info, 
  AlertCircle,
  Tv,
  CalendarPlus,
  Play
} from 'lucide-react';
import { UpcomingStreamItem } from '../types';
import { playTapSound, playSuccessSound } from '../utils/audio';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';

interface UpcomingStreamsSectionProps {
  isAdmin: boolean;
  currentUser?: any;
  onAddXP?: (amount: number, reason?: string) => void;
  triggerAudio?: (sound: 'tap' | 'success' | 'levelUp' | 'spin') => void;
}

// Curated default scheduled streams if database is starting fresh
const DEFAULT_UPCOMING_STREAMS: UpcomingStreamItem[] = [];

export default function UpcomingStreamsSection({
  isAdmin,
  currentUser,
  onAddXP,
  triggerAudio
}: UpcomingStreamsSectionProps) {
  const [streams, setStreams] = useState<UpcomingStreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'gems' | 'spoilers'>('all');
  const [activeReminders, setActiveReminders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_stream_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Form Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCreator, setFormCreator] = useState('');
  const [formStreamType, setFormStreamType] = useState<UpcomingStreamItem['streamType']>('live_codes');
  const [formPlatform, setFormPlatform] = useState<UpcomingStreamItem['platform']>('youtube');
  const [formDate, setFormDate] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formRewards, setFormRewards] = useState('');
  const [formHints, setFormHints] = useState('');
  const [formBanner, setFormBanner] = useState('');
  const [formStatus, setFormStatus] = useState<UpcomingStreamItem['status']>('scheduled');
  const [isSaving, setIsSaving] = useState(false);

  // Real-time Firestore sync
  useEffect(() => {
    try {
      const q = query(collection(db, 'upcoming_streams'), orderBy('scheduledDate', 'asc'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: UpcomingStreamItem[] = snapshot.docs.map(d => ({
            id: d.id,
            ...(d.data() as Omit<UpcomingStreamItem, 'id'>)
          }));
          setStreams(list);
        } else {
          setStreams([]);
        }
        setLoading(false);
      }, (err) => {
        console.warn('Upcoming streams snapshot error:', err);
        setStreams([]);
        setLoading(false);
      });

      return () => unsub();
    } catch (err) {
      setStreams([]);
      setLoading(false);
    }
  }, []);

  // Format relative time or live countdown
  const getTimeRemaining = (scheduledDateStr: string) => {
    const target = new Date(scheduledDateStr).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      return { isLive: true, text: 'AO VIVO AGORA!' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);

    if (days > 1) {
      return { isLive: false, text: `Em ${days} dias (${new Date(scheduledDateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})` };
    } else if (days === 1) {
      return { isLive: false, text: `Amanhã às ${new Date(scheduledDateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` };
    } else if (hours >= 1) {
      return { isLive: false, text: `Em ${hours}h ${minutes}m` };
    } else {
      return { isLive: false, text: `Em ${minutes} minutos` };
    }
  };

  const handleToggleReminder = async (stream: UpcomingStreamItem) => {
    const isSet = activeReminders.includes(stream.id);
    let nextReminders: string[];

    if (isSet) {
      nextReminders = activeReminders.filter(id => id !== stream.id);
      playTapSound();
    } else {
      nextReminders = [...activeReminders, stream.id];
      if (triggerAudio) triggerAudio('success');
      else playSuccessSound();

      // Ask for browser notification permission if available
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Award fan XP
      if (onAddXP) {
        onAddXP(15, 'Lembrete de Live com Código ativado');
      }

      // Increment Firestore reminder count if doc exists
      try {
        if (!stream.id.startsWith('default_')) {
          const docRef = doc(db, 'upcoming_streams', stream.id);
          await updateDoc(docRef, {
            remindersCount: (stream.remindersCount || 0) + 1
          });
        }
      } catch (e) {}
    }

    setActiveReminders(nextReminders);
    try {
      localStorage.setItem('pkxd_stream_reminders', JSON.stringify(nextReminders));
    } catch (e) {}
  };

  const handleCopyStreamLink = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    playTapSound();
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {}
  };

  const getGoogleCalendarUrl = (stream: UpcomingStreamItem): string => {
    try {
      const startDate = new Date(stream.scheduledDate);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const title = encodeURIComponent(`PK XD Live com Códigos: ${stream.title}`);
      const details = encodeURIComponent(
        `Acompanhe a transmissão e garanta seus códigos do PK XD!\n\nRecompensas: ${stream.rewardsSummary}\n\nDicas: ${stream.hintsOrInstructions || 'Preste atenção nos códigos!'}\n\nLink: ${stream.targetUrl}`
      );
      const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${encodeURIComponent(stream.targetUrl)}`;
    } catch (e) {
      return stream.targetUrl;
    }
  };

  // Open Admin Form Modal for adding or editing
  const handleOpenAdminModal = (streamToEdit?: UpcomingStreamItem) => {
    playTapSound();
    if (streamToEdit) {
      setEditingStreamId(streamToEdit.id);
      setFormTitle(streamToEdit.title);
      setFormCreator(streamToEdit.creatorOrChannel);
      setFormStreamType(streamToEdit.streamType);
      setFormPlatform(streamToEdit.platform);
      setFormDate(new Date(streamToEdit.scheduledDate).toISOString().slice(0, 16));
      setFormUrl(streamToEdit.targetUrl);
      setFormRewards(streamToEdit.rewardsSummary);
      setFormHints(streamToEdit.hintsOrInstructions || '');
      setFormBanner(streamToEdit.bannerUrl || '');
      setFormStatus(streamToEdit.status || 'scheduled');
    } else {
      setEditingStreamId(null);
      setFormTitle('');
      setFormCreator('PKXD Central Oficial');
      setFormStreamType('live_codes');
      setFormPlatform('youtube');
      // Set default to tomorrow at 18:30
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
      tomorrow.setHours(18, 30, 0, 0);
      setFormDate(tomorrow.toISOString().slice(0, 16));
      setFormUrl('https://youtube.com');
      setFormRewards('💎 50 Gemas + 🪙 15.000 Moedas');
      setFormHints('Códigos liberados durante a live no chat e na tela!');
      setFormBanner('');
      setFormStatus('scheduled');
    }
    setShowAdminModal(true);
  };

  const handleSaveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim() || !formDate) return;

    setIsSaving(true);
    try {
      const streamPayload: Omit<UpcomingStreamItem, 'id'> = {
        title: formTitle.trim(),
        creatorOrChannel: formCreator.trim() || 'PKXD Central',
        streamType: formStreamType,
        platform: formPlatform,
        scheduledDate: new Date(formDate).toISOString(),
        targetUrl: formUrl.trim(),
        rewardsSummary: formRewards.trim() || 'Códigos e Recompensas Especiais',
        hintsOrInstructions: formHints.trim(),
        bannerUrl: formBanner.trim() || '',
        status: formStatus,
        remindersCount: 0,
        createdAt: Date.now()
      };

      if (editingStreamId && !editingStreamId.startsWith('default_')) {
        await updateDoc(doc(db, 'upcoming_streams', editingStreamId), streamPayload as any);
      } else {
        await addDoc(collection(db, 'upcoming_streams'), streamPayload);
      }

      if (triggerAudio) triggerAudio('success');
      setShowAdminModal(false);
    } catch (err) {
      console.error('Error saving upcoming stream:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered streams list
  const filteredStreams = useMemo(() => {
    return streams.filter(stream => {
      if (selectedFilter === 'live') {
        const remaining = getTimeRemaining(stream.scheduledDate);
        return remaining.isLive || stream.status === 'live_now';
      }
      if (selectedFilter === 'gems') {
        return stream.streamType === 'live_codes' || stream.streamType === 'gem_giveaway';
      }
      if (selectedFilter === 'spoilers') {
        return stream.streamType === 'spoiler_premiere';
      }
      return true;
    });
  }, [streams, selectedFilter]);

  const [confirmDeleteStreamId, setConfirmDeleteStreamId] = useState<string | null>(null);

  const getStreamTypeLabel = (type: UpcomingStreamItem['streamType']) => {
    switch (type) {
      case 'live_codes':
        return { label: 'Live com Códigos', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'spoiler_premiere':
        return { label: 'Estreia com Spoilers', color: 'bg-violet-50 text-violet-700 border-violet-200' };
      case 'gem_giveaway':
        return { label: 'Sorteio de Gemas', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'special_event':
        return { label: 'Evento Especial', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'Transmissão Oficial', color: 'bg-pink-50 text-pink-700 border-pink-200' };
    }
  };

  return (
    <section 
      id="upcoming-streams-section" 
      className="pkxd-pop-card p-5 sm:p-7 space-y-6 text-left relative overflow-hidden"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-400 text-slate-900 border-2 border-amber-500 rounded-2xl shadow-xs flex-shrink-0">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900">
                Próximos Vídeos e Lives com Códigos
              </h3>
              <span className="font-bold text-[11px] px-2.5 py-0.5 bg-white text-amber-800 rounded-full border border-amber-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-400" />
                <span>Radar de Cupons</span>
              </span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-slate-600 mt-0.5">
              Acompanhe os próximos vídeos e transmissões para garantir seus <strong className="text-slate-900">cupons oficiais</strong> e <strong className="text-violet-700">novos códigos</strong>.
            </p>
          </div>
        </div>

        {/* Admin Action Button */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => handleOpenAdminModal()}
            className="pkxd-btn-gold px-4 py-2.5 text-xs uppercase tracking-wider flex items-center gap-1.5 self-start md:self-center flex-shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agendar Live / Vídeo</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Tip Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          <button
            type="button"
            onClick={() => { playTapSound(); setSelectedFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border-2 ${
              selectedFilter === 'all'
                ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-slate-900'
            }`}
          >
            Todos ({streams.length})
          </button>

          <button
            type="button"
            onClick={() => { playTapSound(); setSelectedFilter('gems'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 border-2 ${
              selectedFilter === 'gems'
                ? 'bg-sky-500 border-sky-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Com Gemas</span>
          </button>

          <button
            type="button"
            onClick={() => { playTapSound(); setSelectedFilter('spoilers'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 border-2 ${
              selectedFilter === 'spoilers'
                ? 'bg-violet-600 border-violet-700 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Estreias de Spoilers</span>
          </button>

          <button
            type="button"
            onClick={() => { playTapSound(); setSelectedFilter('live'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 border-2 ${
              selectedFilter === 'live'
                ? 'bg-rose-600 border-rose-700 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Ao Vivo Agora</span>
          </button>
        </div>

        {/* Tip */}
        <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Ative o lembrete para ganhar <strong className="text-violet-700">+15 XP</strong></span>
        </div>
      </div>

      {/* STREAMS GRID */}
      {filteredStreams.length > 0 && (
        <div className="max-h-[540px] overflow-y-auto pr-1 sm:pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStreams.map((stream) => {
              const typeInfo = getStreamTypeLabel(stream.streamType);
              const timeInfo = getTimeRemaining(stream.scheduledDate);
              const isReminderSet = activeReminders.includes(stream.id);
              const dateObj = new Date(stream.scheduledDate);

              return (
                <div
                  key={stream.id}
                  className={`bg-white border-2 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 relative shadow-xs hover:shadow-md group ${
                    timeInfo.isLive || stream.status === 'live_now'
                      ? 'border-rose-400'
                      : 'border-slate-200 hover:border-amber-400'
                  }`}
                >
                  {/* TOP BANNER / COVER WITH COUNTDOWN OVERLAY */}
                  <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-violet-100 via-sky-50 to-amber-100 overflow-hidden border-b border-slate-100">
                    {stream.bannerUrl ? (
                      <img
                        src={stream.bannerUrl}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-amber-200 text-amber-600 flex items-center justify-center mb-2 shadow-xs">
                          <Radio className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold uppercase text-slate-600">
                          {stream.creatorOrChannel}
                        </span>
                      </div>
                    )}

                    {/* Status & Countdown Pill */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase shadow-xs flex items-center gap-1.5 ${
                        timeInfo.isLive || stream.status === 'live_now'
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-white/95 text-slate-900 border-slate-200'
                      }`}>
                        {timeInfo.isLive || stream.status === 'live_now' ? (
                          <span>AO VIVO AGORA</span>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{timeInfo.text}</span>
                          </>
                        )}
                      </span>

                      {/* Share button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyStreamLink(e, stream.targetUrl, stream.id)}
                        className="p-1.5 bg-white/95 hover:bg-white text-slate-700 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-90"
                        title="Copiar link da transmissão"
                      >
                        {copiedId === stream.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </button>
                    </div>

                    {/* Creator Badge at Bottom of Banner */}
                    <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex items-center justify-between text-[11px] font-semibold text-slate-800 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200">
                      <span className="font-bold truncate text-violet-700 flex items-center gap-1">
                        <Tv className="w-3 h-3 text-violet-600" />
                        <span>{stream.creatorOrChannel}</span>
                      </span>
                      <span className="text-[10px] text-slate-600 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 text-sky-600" />
                        <span>{dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                  </div>

                  {/* CARD DETAILS */}
                  <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </div>

                      <h4 
                        title={stream.title}
                        className="font-display font-bold text-base text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug"
                      >
                        {stream.title}
                      </h4>
                    </div>

                    {/* Guaranteed Rewards Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                        <span>Recompensas &amp; Cupons</span>
                      </div>
                      <p className="text-xs font-sans font-bold text-slate-900">
                        {stream.rewardsSummary}
                      </p>
                    </div>

                    {/* Secret Tip / Instructions */}
                    {stream.hintsOrInstructions && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 font-sans bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                        <Info className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                        <span><strong className="text-slate-900">Dica:</strong> {stream.hintsOrInstructions}</span>
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleReminder(stream)}
                          className={`py-2 px-2.5 rounded-xl font-sans font-bold text-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border-2 ${
                            isReminderSet
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                          title={isReminderSet ? 'Lembrete ativado!' : 'Ativar lembrete no dispositivo'}
                        >
                          {isReminderSet ? (
                            <>
                              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="truncate">Lembrando</span>
                            </>
                          ) : (
                            <>
                              <Bell className="w-3.5 h-3.5 text-amber-600" />
                              <span className="truncate">Lembrar</span>
                            </>
                          )}
                        </button>

                        <a
                          href={getGoogleCalendarUrl(stream)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playTapSound()}
                          className="py-2 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 rounded-xl font-sans font-bold text-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                          title="Salvar na Google Agenda"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-sky-600" />
                          <span className="truncate">Agenda</span>
                        </a>
                      </div>

                      {/* Primary Link: Watch Live or Go to Stream */}
                      <a
                        href={stream.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          if (triggerAudio) triggerAudio('tap');
                          else playTapSound();
                        }}
                        className={`w-full py-2.5 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
                          timeInfo.isLive || stream.status === 'live_now'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_3px_0_0_#9f1239]'
                            : 'pkxd-btn-gold text-slate-900'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{timeInfo.isLive || stream.status === 'live_now' ? 'Entrar na Live Agora' : 'Acessar Transmissão'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {/* Admin controls */}
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleOpenAdminModal(stream)}
                            className="p-1.5 text-slate-700 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Editar transmissão"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>

                          {confirmDeleteStreamId === stream.id ? (
                            <button
                              type="button"
                              onClick={async () => {
                                playTapSound();
                                try {
                                  if (!stream.id.startsWith('default_')) {
                                    await deleteDoc(doc(db, 'upcoming_streams', stream.id));
                                  } else {
                                    setStreams(prev => prev.filter(s => s.id !== stream.id));
                                  }
                                } catch (err) {
                                  console.error('Error deleting stream:', err);
                                }
                                setConfirmDeleteStreamId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Confirmar exclusão
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteStreamId(stream.id)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Excluir transmissão"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Excluir</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredStreams.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-amber-200 space-y-3 px-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <h4 className="font-display font-bold text-base text-slate-900">
            {streams.length === 0 ? 'Nenhuma live ou transmissão agendada' : 'Nenhuma transmissão encontrada neste filtro'}
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            {streams.length === 0
              ? 'Assim que uma nova transmissão ou vídeo oficial com códigos e cupons for agendado pelo administrador, ele aparecerá aqui.'
              : 'Selecione a aba "Todos" para visualizar todos os próximos vídeos e eventos agendados.'}
          </p>
          {isAdmin && streams.length === 0 && (
            <button
              type="button"
              onClick={() => handleOpenAdminModal()}
              className="pkxd-btn-gold mt-2 px-4 py-2.5 text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agendar Transmissão Oficial</span>
            </button>
          )}
        </div>
      )}

      {/* ADMIN MODAL: ADD / EDIT STREAM */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-left max-h-[90vh] overflow-y-auto text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Radio className="w-5 h-5" />
                <h4 className="font-display font-bold text-lg text-slate-900">
                  {editingStreamId ? 'Editar Transmissão Agendada' : 'Agendar Live/Vídeo com Códigos'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="text-slate-500 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStream} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Título do Vídeo ou Live *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Live Especial com 5 Códigos de Gemas"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Canal / Criador *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PKXD Central Oficial"
                    value={formCreator}
                    onChange={(e) => setFormCreator(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={formStreamType}
                    onChange={(e) => setFormStreamType(e.target.value as any)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                  >
                    <option value="live_codes">Live com Códigos ao Vivo</option>
                    <option value="spoiler_premiere">Estreia com Spoilers &amp; Códigos</option>
                    <option value="gem_giveaway">Sorteio de Gemas &amp; Itens</option>
                    <option value="special_event">Evento Especial da Central</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data e Horário Previsto *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status Atual
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                  >
                    <option value="scheduled">Agendado</option>
                    <option value="live_now">Ao Vivo Agora</option>
                    <option value="completed">Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Link do Vídeo / Live (YouTube) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://youtube.com/live/..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Recompensas &amp; Cupons Prometidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 50 a 100 Gemas + 20.000 Moedas"
                  value={formRewards}
                  onChange={(e) => setFormRewards(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Dica / Instruções para Resgate
                </label>
                <input
                  type="text"
                  placeholder="Ex: Os códigos aparecem na tela e no chat fixado"
                  value={formHints}
                  onChange={(e) => setFormHints(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  URL da Imagem de Capa (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="pkxd-btn-gold px-5 py-2 text-xs uppercase cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Transmissão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

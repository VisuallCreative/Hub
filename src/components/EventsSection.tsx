import React, { useState, useEffect, useMemo } from 'react';
import { CommunityEvent, EventParticipant, EventStatus } from '../types';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  CheckCircle,
  AlertCircle,
  Trash2,
  Copy,
  FileSpreadsheet,
  FileText,
  Download,
  Search,
  UploadCloud,
  X,
  Check,
  Sparkles,
  UserCheck,
  Share2,
  Star,
  BookmarkCheck,
  CalendarPlus,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Pencil,
  Globe,
  Link2,
  UserMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface EventsSectionProps {
  isAdmin: boolean;
  currentUser?: any;
  playerTag?: string;
  soundEnabled?: boolean;
  initialAgendaTab?: 'todos' | 'minha_agenda';
  autoOpenCreate?: boolean;
  onCloseAutoCreate?: () => void;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
  onAddXP?: (amount: number, reason: string, rewardKey?: string) => void;
}

const CATEGORIES = [
  'Todas',
  'Torneios',
  'Festas',
  'Esconder-Esconder',
  'Encontros de Creators',
  'Desafios & Mini-Games',
  'Outros'
];

const DEFAULT_COMMUNITY_EVENTS: CommunityEvent[] = [];

function EventBannerImage({ bannerUrl, name }: { bannerUrl?: string; name: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (bannerUrl && !bannerUrl.includes('images.unsplash.com') && !imgFailed) {
    return (
      <img
        src={bannerUrl}
        alt={name}
        onError={() => setImgFailed(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-violet-600 via-pink-500 to-sky-500 flex items-center justify-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white">
        <Calendar className="w-8 h-8" />
      </div>
    </div>
  );
}

export default function EventsSection({
  isAdmin,
  currentUser,
  playerTag,
  initialAgendaTab = 'todos',
  autoOpenCreate = false,
  onCloseAutoCreate,
  triggerAudio,
  onAddXP
}: EventsSectionProps) {
  const [events, setEvents] = useState<CommunityEvent[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_custom_events');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(ev =>
            ev.id !== 'event_crazy_run_mega' &&
            ev.id !== 'event_festa_desfile' &&
            !ev.name?.includes('Mega Torneio') &&
            !ev.name?.includes('Grande Desfile')
          );
          try {
            localStorage.setItem('pkxd_custom_events', JSON.stringify(cleaned));
          } catch {}
          return cleaned;
        }
      }
    } catch {}
    return DEFAULT_COMMUNITY_EVENTS;
  });

  const [participants, setParticipants] = useState<EventParticipant[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_event_participants');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(p =>
            p.eventId !== 'event_crazy_run_mega' &&
            p.eventId !== 'event_festa_desfile'
          );
          try {
            localStorage.setItem('pkxd_event_participants', JSON.stringify(cleaned));
          } catch {}
          return cleaned;
        }
      }
    } catch {}
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [agendaTab, setAgendaTab] = useState<'todos' | 'minha_agenda'>(initialAgendaTab);
  const [savedAgendaIds, setSavedAgendaIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_saved_agenda_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & confirm states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showPresenceModal, setShowPresenceModal] = useState<CommunityEvent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<CommunityEvent | null>(null);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState<string | null>(null);
  const [confirmRemovePartId, setConfirmRemovePartId] = useState<string | null>(null);

  // Form states for Create / Edit Event
  const [newEventName, setNewEventName] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Torneios');
  const [customCategory, setCustomCategory] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventServer, setNewEventServer] = useState('');
  const [newEventLink, setNewEventLink] = useState('');
  const [newEventBanner, setNewEventBanner] = useState('');
  const [newOrganizerName, setNewOrganizerName] = useState(
    playerTag || currentUser?.displayName || ''
  );
  const [newEventRules, setNewEventRules] = useState('');
  const [newMaxParticipants, setNewMaxParticipants] = useState<string>('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState(false);
  const [createErrorMsg, setCreateErrorMsg] = useState<string | null>(null);

  // PIN / Password Protection
  const [newEventRequiresPin, setNewEventRequiresPin] = useState(false);
  const [newEventPinCode, setNewEventPinCode] = useState('');
  const [showPinInCreateForm, setShowPinInCreateForm] = useState(false);

  // Sync external route props
  useEffect(() => {
    setAgendaTab(initialAgendaTab);
  }, [initialAgendaTab]);

  useEffect(() => {
    if (autoOpenCreate) {
      setEditingEventId(null);
      setCreateErrorMsg(null);
      const savedTag = playerTag || localStorage.getItem('pkxd_player_tag') || currentUser?.displayName || '';
      if (savedTag && !newOrganizerName) {
        setNewOrganizerName(savedTag);
      }
      setShowCreateModal(true);
    }
  }, [autoOpenCreate, playerTag, currentUser]);

  // Presence Confirmation
  const [playerTagInput, setPlayerTagInput] = useState('');
  const [presencePinInput, setPresencePinInput] = useState('');
  const [showPresencePinInput, setShowPresencePinInput] = useState(false);
  const [hasAutoFilledTag, setHasAutoFilledTag] = useState(false);
  const [presenceError, setPresenceError] = useState('');
  const [presenceSuccess, setPresenceSuccess] = useState(false);

  // Organizer Panel Search & Toast
  const [participantSearch, setParticipantSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedSingleTagId, setCopiedSingleTagId] = useState<string | null>(null);
  const [copiedBatchFormat, setCopiedBatchFormat] = useState<string | null>(null);
  const [copyFormatTab, setCopyFormatTab] = useState<'lines' | 'comma' | 'numbered'>('lines');
  const [quickAddTagInput, setQuickAddTagInput] = useState('');
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const toggleSaveAgenda = (eventId: string, eventName: string) => {
    if (triggerAudio) triggerAudio('tap');
    setSavedAgendaIds(prev => {
      const isSaved = prev.includes(eventId);
      let updated: string[];
      if (isSaved) {
        updated = prev.filter(id => id !== eventId);
        showToast('Evento removido da sua Agenda PKXD.');
      } else {
        updated = [...prev, eventId];
        showToast(`Evento "${eventName}" salvo na sua Agenda PKXD!`);
        if (triggerAudio) triggerAudio('success');
        if (onAddXP) onAddXP(25, 'Salvou evento na Agenda PKXD');
      }
      try {
        localStorage.setItem('pkxd_saved_agenda_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleGoogleCalendar = (ev: CommunityEvent) => {
    if (triggerAudio) triggerAudio('tap');
    const title = encodeURIComponent(`PK XD: ${ev.name}`);
    const details = encodeURIComponent(`Evento da Comunidade PKXD Central\n${ev.description || ''}\nOrganizador: ${ev.organizerName}\nRegras: ${ev.rules || 'Sem regras adicionais'}`);
    const location = encodeURIComponent('PK XD - Servidor Oficial');

    let dateParam = '';
    if (ev.date) {
      const cleanDate = ev.date.replace(/-/g, '');
      const cleanTime = (ev.time || '18:00').replace(/:/g, '') + '00';
      dateParam = `&dates=${cleanDate}T${cleanTime}/${cleanDate}T${cleanTime}`;
    }

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}${dateParam}`;
    const a = document.createElement('a');
    a.href = gcalUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleDownloadICS = (ev: CommunityEvent) => {
    if (triggerAudio) triggerAudio('tap');
    const cleanDate = (ev.date || '2026-08-15').replace(/-/g, '');
    const cleanTime = (ev.time || '18:00').replace(/:/g, '') + '00';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PKXD Central//Agenda Oficial//PT',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:PK XD - ${ev.name}`,
      `DESCRIPTION:${(ev.description || '').replace(/\n/g, ' ')}`,
      'LOCATION:Ilha PK XD',
      `DTSTART:${cleanDate}T${cleanTime}`,
      `DTEND:${cleanDate}T${cleanTime}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evento_${ev.id || 'pkxd'}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Lembrete do evento (.ics) baixado!');
  };

  const handleShareEvent = (event: CommunityEvent) => {
    if (triggerAudio) triggerAudio('tap');
    const shareUrl = `${window.location.origin}${window.location.pathname}?evento=${event.id}#events-section-wrapper`;
    if (navigator.share) {
      navigator.share({
        title: `Evento PK XD: ${event.name}`,
        text: `Venha participar do evento "${event.name}" no PK XD Central!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast(`Link do evento "${event.name}" copiado!`);
    }
  };

  useEffect(() => {
    if (!db) return;

    const eventsRef = collection(db, 'community_events');
    const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
      const list: CommunityEvent[] = [];
      snapshot.forEach((docSnap) => {
        const evData = { id: docSnap.id, ...docSnap.data() } as CommunityEvent;
        if (
          docSnap.id === 'event_crazy_run_mega' ||
          docSnap.id === 'event_festa_desfile' ||
          evData.name?.includes('Mega Torneio') ||
          evData.name?.includes('Grande Desfile')
        ) {
          deleteDoc(doc(db, 'community_events', docSnap.id)).catch(() => {});
        } else {
          list.push(evData);
        }
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setEvents(list);
      try {
        localStorage.setItem('pkxd_custom_events', JSON.stringify(list));
      } catch {}
    }, (error) => {
      console.warn('Firestore events sync warning (using local):', error);
    });

    const partRef = collection(db, 'event_participants');
    const unsubPart = onSnapshot(partRef, (snapshot) => {
      const list: EventParticipant[] = [];
      snapshot.forEach((docSnap) => {
        const pData = { id: docSnap.id, ...docSnap.data() } as EventParticipant;
        if (
          pData.eventId === 'event_crazy_run_mega' ||
          pData.eventId === 'event_festa_desfile'
        ) {
          deleteDoc(doc(db, 'event_participants', docSnap.id)).catch(() => {});
        } else {
          list.push(pData);
        }
      });
      setParticipants(list);
      try {
        localStorage.setItem('pkxd_event_participants', JSON.stringify(list));
      } catch {}
    }, (error) => {
      console.warn('Firestore participants sync warning:', error);
    });

    return () => {
      unsubEvents();
      unsubPart();
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (agendaTab === 'minha_agenda' && !savedAgendaIds.includes(ev.id)) {
        return false;
      }
      if (selectedCategory !== 'Todas' && ev.category !== selectedCategory) {
        return false;
      }
      if (statusFilter === 'EM_ANALISE') return ev.status === 'Em análise';
      if (statusFilter === 'APROVADOS') return ev.status === 'Aprovado' || ev.status === 'Em breve' || ev.status === 'Ao vivo';
      if (statusFilter === 'AO_VIVO') return ev.status === 'Ao vivo';
      if (statusFilter === 'ENCERRADOS') return ev.status === 'Encerrado';
      return true;
    });
  }, [events, selectedCategory, statusFilter, agendaTab, savedAgendaIds]);

  const savedAgendaEventsCount = useMemo(() => {
    return events.filter(e => savedAgendaIds.includes(e.id)).length;
  }, [events, savedAgendaIds]);

  const pendingEventsCount = useMemo(() => {
    return events.filter(e => e.status === 'Em análise').length;
  }, [events]);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreateErrorMsg(null);

    if (file.size > 8 * 1024 * 1024) {
      setCreateErrorMsg('A imagem é muito grande! Escolha uma imagem de até 8MB.');
      return;
    }

    setIsUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewEventBanner(event.target?.result as string);
      setIsUploadingBanner(false);
    };
    reader.onerror = () => {
      setCreateErrorMsg('Erro ao carregar arquivo de imagem.');
      setIsUploadingBanner(false);
    };
    reader.readAsDataURL(file);
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setNewEventName('');
    setNewEventDesc('');
    setNewEventCategory('Torneios');
    setCustomCategory('');
    setNewEventBanner('');
    setNewEventRules('');
    setNewEventServer('');
    setNewEventLink('');
    setNewMaxParticipants('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventRequiresPin(false);
    setNewEventPinCode('');
    setShowPinInCreateForm(false);
    setCreateErrorMsg(null);
  };

  const openCreateEventModal = () => {
    resetEventForm();
    const autoOrganizer = playerTag || localStorage.getItem('pkxd_player_tag') || currentUser?.displayName || '';
    if (autoOrganizer) setNewOrganizerName(autoOrganizer);
    setShowCreateModal(true);
  };

  const openEditEventModal = (ev: CommunityEvent) => {
    if (triggerAudio) triggerAudio('tap');
    setEditingEventId(ev.id);
    setNewEventName(ev.name);
    setNewEventDesc(ev.description || '');
    const standardCats = ['Torneios', 'Festas', 'Esconder-Esconder', 'Encontros de Creators', 'Desafios & Mini-Games', 'Outros'];
    if (standardCats.includes(ev.category)) {
      setNewEventCategory(ev.category);
      setCustomCategory('');
    } else {
      setNewEventCategory('CUSTOM');
      setCustomCategory(ev.category);
    }
    setNewEventDate(ev.date || '');
    setNewEventTime(ev.time || '');
    setNewEventServer(ev.server || '');
    setNewEventLink(ev.additionalLink || '');
    setNewEventBanner(ev.bannerUrl || '');
    setNewOrganizerName(ev.organizerName || '');
    setNewEventRules(ev.rules || '');
    setNewMaxParticipants(ev.maxParticipants ? String(ev.maxParticipants) : '');
    setNewEventRequiresPin(Boolean(ev.requiresPin));
    setNewEventPinCode(ev.pinCode || '');
    setCreateErrorMsg(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setEditingEventId(null);
    if (onCloseAutoCreate) onCloseAutoCreate();
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (triggerAudio) triggerAudio('tap');
    setCreateErrorMsg(null);

    if (!newEventName.trim() || !newEventDate || !newOrganizerName.trim()) {
      setCreateErrorMsg('Preencha todos os campos obrigatórios (Nome, Data e Organizador).');
      return;
    }

    if (newEventRequiresPin && !newEventPinCode.trim()) {
      setCreateErrorMsg('Defina o PIN ou Senha de confirmação de presença do evento.');
      return;
    }

    const cat = newEventCategory === 'CUSTOM' ? customCategory || 'Outros' : newEventCategory;
    const maxPart = newMaxParticipants ? parseInt(newMaxParticipants, 10) : undefined;
    const existingEvent = editingEventId ? events.find(ev => ev.id === editingEventId) : null;
    const eventId = existingEvent ? existingEvent.id : 'event_' + Date.now();
    const scheduleChanged = Boolean(
      existingEvent && (existingEvent.date !== newEventDate || existingEvent.time !== (newEventTime || '18:00'))
    );

    const eventPayload: CommunityEvent = {
      id: eventId,
      name: newEventName.trim(),
      description: newEventDesc.trim() || 'Evento oficial da comunidade PK XD!',
      category: cat,
      date: newEventDate,
      time: newEventTime || '18:00',
      server: newEventServer.trim() || undefined,
      additionalLink: newEventLink.trim() || undefined,
      bannerUrl: newEventBanner.trim(),
      organizerName: newOrganizerName.trim(),
      rules: newEventRules.trim() || 'Respeitar os demais jogadores e seguir as instruções do organizador.',
      maxParticipants: maxPart,
      status: existingEvent ? existingEvent.status : 'Aprovado',
      createdAt: existingEvent ? existingEvent.createdAt : Date.now(),
      approvedAt: existingEvent ? existingEvent.approvedAt : Date.now(),
      createdById: existingEvent ? existingEvent.createdById : (currentUser?.uid || 'user_' + Date.now()),
      requiresPin: newEventRequiresPin,
      pinCode: newEventRequiresPin ? newEventPinCode.trim().toUpperCase() : undefined
    };

    const cleanedData: Record<string, any> = {};
    Object.entries(eventPayload).forEach(([key, val]) => {
      if (val !== undefined) {
        cleanedData[key] = val;
      }
    });

    setEvents(prev => {
      const updated = existingEvent
        ? prev.map(ev => (ev.id === eventId ? eventPayload : ev))
        : [eventPayload, ...prev.filter(ev => ev.id !== eventId)];
      try {
        localStorage.setItem('pkxd_custom_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      if (db) {
        await setDoc(doc(db, 'community_events', eventId), cleanedData, { merge: true });
      }
    } catch (err) {
      console.warn('Could not sync event to remote Firestore, saved locally:', err);
    }

    // Emit real community notification
    try {
      if (existingEvent && scheduleChanged) {
        fetch('/api/notifications/emit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Horário atualizado: ${eventPayload.name}`,
            body: `Nova data/horário: ${eventPayload.date} às ${eventPayload.time}. Organizado por ${eventPayload.organizerName}.`,
            type: 'schedule_change',
            eventId,
            url: '/eventos',
          }),
        }).catch(() => {});
      } else if (!existingEvent) {
        const isTournament = cat.toLowerCase().includes('torneio');
        fetch('/api/notifications/emit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: isTournament ? `Novo Torneio: ${eventPayload.name}` : `Novo Evento: ${eventPayload.name}`,
            body: `${eventPayload.category} em ${eventPayload.date} às ${eventPayload.time} · Organizador: ${eventPayload.organizerName}.`,
            type: isTournament ? 'new_tournament' : 'new_event',
            eventId,
            url: '/eventos',
          }),
        }).catch(() => {});
      }
    } catch {}

    if (triggerAudio) triggerAudio('success');
    if (!existingEvent && onAddXP) {
      onAddXP(50, `Criou o evento "${eventPayload.name}"`);
    }

    setCreateSuccessMsg(true);
    setTimeout(() => {
      setCreateSuccessMsg(false);
      closeCreateModal();
      resetEventForm();
      showToast(existingEvent ? 'Evento atualizado com sucesso!' : 'Evento criado e publicado com sucesso!');
    }, 1000);
  };

  const handleUpdateStatus = async (eventId: string, newStatus: EventStatus) => {
    if (triggerAudio) triggerAudio('tap');
    try {
      if (db) {
        await updateDoc(doc(db, 'community_events', eventId), {
          status: newStatus,
          approvedAt: newStatus === 'Aprovado' ? Date.now() : undefined
        });
      } else {
        setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: newStatus } : ev));
      }
      showToast(`Status do evento atualizado para "${newStatus}".`);
    } catch (err) {
      console.error('Error updating event status:', err);
    }
  };

  const handleOpenPresenceModal = (event: CommunityEvent) => {
    if (triggerAudio) triggerAudio('tap');
    const rawTag = localStorage.getItem('pkxd_player_tag') || '';
    const clean = rawTag.trim().toUpperCase();
    const isConfiguredTag = clean && clean.includes('#') && !clean.includes('JOGADOR#000') && !clean.includes('GUEST') && clean.split('#')[0].length >= 2 && clean.split('#')[1].length >= 1;

    if (isConfiguredTag) {
      setPlayerTagInput(clean);
      setHasAutoFilledTag(true);
    } else {
      setPlayerTagInput('');
      setHasAutoFilledTag(false);
    }
    setPresencePinInput('');
    setShowPresencePinInput(false);
    setPresenceError('');
    setPresenceSuccess(false);
    setShowPresenceModal(event);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (triggerAudio) triggerAudio('tap');
    setConfirmDeleteEventId(null);
    setShowDetailsModal(null);
    setShowPresenceModal(null);

    setEvents(prev => {
      const updated = prev.filter(ev => ev.id !== eventId);
      try {
        localStorage.setItem('pkxd_custom_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setParticipants(prev => {
      const updated = prev.filter(p => p.eventId !== eventId);
      try {
        localStorage.setItem('pkxd_event_participants', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const savedPassport = localStorage.getItem('pkxd_passport_data');
      if (savedPassport) {
        const pData = JSON.parse(savedPassport);
        if (Array.isArray(pData.eventHistory)) {
          const evToDelete = events.find(e => e.id === eventId);
          pData.eventHistory = pData.eventHistory.filter((h: any) =>
            h.id !== eventId &&
            h.eventName !== evToDelete?.name &&
            h.id !== 'ev_1' && h.id !== 'ev_2' &&
            !h.eventName?.includes('Mega Torneio') &&
            !h.eventName?.includes('Grande Desfile')
          );
          localStorage.setItem('pkxd_passport_data', JSON.stringify(pData));
          if (db && currentUser?.uid && currentUser.uid !== 'guest_user') {
            setDoc(doc(db, 'pkxd_passports', currentUser.uid), pData, { merge: true }).catch(() => {});
          }
        }
      }
    } catch {}

    try {
      if (db) {
        deleteDoc(doc(db, 'community_events', eventId)).catch(() => {});
        const eventParts = participants.filter(p => p.eventId === eventId);
        for (const p of eventParts) {
          deleteDoc(doc(db, 'event_participants', p.id)).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Could not delete from remote Firestore (deleted locally):', err);
    }
    showToast('Evento excluído com sucesso.');
  };

  const handleConfirmPresence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPresenceModal) return;

    if (triggerAudio) triggerAudio('tap');
    setPresenceError('');

    let rawTag = playerTagInput.trim().toUpperCase();
    if (!rawTag) {
      setPresenceError('Informe seu identificador do PK XD (ex: KOOSH#000).');
      return;
    }

    if (!rawTag.includes('#')) {
      rawTag = rawTag + '#000';
    }

    if (showPresenceModal.requiresPin && showPresenceModal.pinCode) {
      const cleanPinInput = presencePinInput.trim().toUpperCase();
      const expectedPin = showPresenceModal.pinCode.trim().toUpperCase();

      if (!cleanPinInput) {
        setPresenceError('Este evento exige o PIN / Senha de confirmação.');
        return;
      }

      if (cleanPinInput !== expectedPin) {
        setPresenceError('PIN / Senha de acesso incorreta. Confirme com o organizador.');
        return;
      }
    }

    const eventId = showPresenceModal.id;
    const currentList = participants.filter(p => p.eventId === eventId);

    if (currentList.some(p => p.playerIdentifier === rawTag)) {
      setPresenceError(`O jogador "${rawTag}" já está confirmado neste evento.`);
      return;
    }

    if (showPresenceModal.maxParticipants && currentList.length >= showPresenceModal.maxParticipants) {
      setPresenceError('O limite máximo de participantes para este evento já foi atingido.');
      return;
    }

    const newPart: EventParticipant = {
      id: `part_${eventId}_${Date.now()}`,
      eventId,
      playerIdentifier: rawTag,
      userId: currentUser?.uid || undefined,
      registeredAt: Date.now()
    };

    setParticipants(prev => {
      const updated = [...prev, newPart];
      try {
        localStorage.setItem('pkxd_event_participants', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Auto-save to Minha Agenda when confirming presence
    setSavedAgendaIds(prev => {
      if (prev.includes(eventId)) return prev;
      const updated = [...prev, eventId];
      try {
        localStorage.setItem('pkxd_saved_agenda_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const savedPassport = localStorage.getItem('pkxd_passport_data');
      if (savedPassport) {
        const pData = JSON.parse(savedPassport);
        const newHistEntry = {
          id: 'ev_' + Date.now(),
          eventName: showPresenceModal.name,
          role: 'participante',
          date: showPresenceModal.date,
          category: showPresenceModal.category
        };
        const currentHist = Array.isArray(pData.eventHistory)
          ? pData.eventHistory.filter((h: any) =>
              h.id !== 'ev_1' && h.id !== 'ev_2' &&
              !h.eventName?.includes('Mega Torneio') &&
              !h.eventName?.includes('Grande Desfile')
            )
          : [];
        if (!currentHist.some((h: any) => h.eventName === showPresenceModal.name)) {
          pData.eventHistory = [newHistEntry, ...currentHist];
          pData.updatedAt = Date.now();
          localStorage.setItem('pkxd_passport_data', JSON.stringify(pData));
          if (db && currentUser?.uid && currentUser.uid !== 'guest_user') {
            setDoc(doc(db, 'pkxd_passports', currentUser.uid), pData, { merge: true }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('Could not sync to passport:', err);
    }

    if (db) {
      setDoc(doc(db, 'event_participants', newPart.id), newPart).catch((err) => {
        console.warn('Participant sync to Firestore background warning:', err);
      });
    }

    if (triggerAudio) triggerAudio('levelUp');
    if (onAddXP) onAddXP(30, 'Confirmou presença em evento (+30 XP)');

    setPresenceSuccess(true);
    setTimeout(() => {
      setPresenceSuccess(false);
      setShowPresenceModal(null);
      setPlayerTagInput('');
      showToast(`Presença confirmada para "${rawTag}"! (+30 XP)`);
    }, 1100);
  };

  const handleConfirmRemoveParticipant = async (partId: string, playerIdentifier: string) => {
    if (triggerAudio) triggerAudio('tap');
    setConfirmRemovePartId(null);

    setParticipants(prev => {
      const updated = prev.filter(p => p.id !== partId);
      try {
        localStorage.setItem('pkxd_event_participants', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      if (db) {
        await deleteDoc(doc(db, 'event_participants', partId));
      }
      showToast(`Participante "${playerIdentifier}" removido.`);
    } catch (err) {
      console.error('Error removing participant:', err);
    }
  };

  const handleCopySingleTag = (tag: string, partId: string) => {
    if (triggerAudio) triggerAudio('tap');
    navigator.clipboard.writeText(tag);
    setCopiedSingleTagId(partId);
    setTimeout(() => setCopiedSingleTagId(null), 2500);
    showToast(`Tag "${tag}" copiada! Cole no PK XD para convidar.`);
  };

  const handleCopyTagsFormatted = (event: CommunityEvent, list: EventParticipant[], format: 'lines' | 'comma' | 'numbered') => {
    if (triggerAudio) triggerAudio('tap');
    if (list.length === 0) {
      showToast('Nenhum participante confirmado para copiar.');
      return;
    }

    let formattedText = '';
    if (format === 'lines') {
      formattedText = list.map(p => p.playerIdentifier).join('\n');
    } else if (format === 'comma') {
      formattedText = list.map(p => p.playerIdentifier).join(', ');
    } else {
      formattedText = `[Lista de Membros - ${event.name}]\n` + list.map((p, i) => `${i + 1}. ${p.playerIdentifier}`).join('\n');
    }

    navigator.clipboard.writeText(formattedText);
    setCopiedBatchFormat(format);
    setTimeout(() => setCopiedBatchFormat(null), 2500);
    showToast(`${list.length} tag(s) copiada(s)!`);
  };

  const handleQuickAddParticipant = async (eventId: string) => {
    setQuickAddError(null);
    if (!quickAddTagInput.trim()) return;
    const rawTag = quickAddTagInput.trim().toUpperCase();
    if (!rawTag.includes('#')) {
      setQuickAddError('Insira a tag no formato NOME#000.');
      return;
    }

    const eventParts = participants.filter(p => p.eventId === eventId);
    if (eventParts.some(p => p.playerIdentifier.toUpperCase() === rawTag)) {
      setQuickAddError('Este jogador já está na lista deste evento.');
      return;
    }

    const newPart: EventParticipant = {
      id: 'part_' + Date.now(),
      eventId,
      playerIdentifier: rawTag,
      registeredAt: Date.now()
    };

    setParticipants(prev => {
      const updated = [...prev, newPart];
      try {
        localStorage.setItem('pkxd_event_participants', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (db) {
      setDoc(doc(db, 'event_participants', newPart.id), newPart).catch(() => {});
    }

    setQuickAddTagInput('');
    setShowQuickAdd(false);
    if (triggerAudio) triggerAudio('success');
    showToast(`Jogador "${rawTag}" adicionado à lista!`);
  };

  const handleExportTXT = (event: CommunityEvent, list: EventParticipant[]) => {
    if (triggerAudio) triggerAudio('tap');
    const formattedText = list.map(p => p.playerIdentifier).join('\n');
    const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `participantes_${event.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo .TXT baixado!');
  };

  const handleExportExcel = (event: CommunityEvent, list: EventParticipant[]) => {
    if (triggerAudio) triggerAudio('tap');
    const excelData = list.map((p, index) => ({
      '#': index + 1,
      'Identificador PKXD': p.playerIdentifier,
      'Data de Inscrição': new Date(p.registeredAt).toLocaleString('pt-BR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes');
    XLSX.writeFile(workbook, `participantes_${event.name.replace(/\s+/g, '_')}.xlsx`);
    showToast('Planilha Excel (.XLSX) baixada!');
  };

  const handleExportPDF = (event: CommunityEvent, list: EventParticipant[]) => {
    if (triggerAudio) triggerAudio('tap');
    const pdf = new jsPDF();

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(109, 40, 217);
    pdf.text('PKXD Central - Lista Oficial de Participantes', 14, 20);

    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Evento: ${event.name}`, 14, 30);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Organizador: ${event.organizerName} | Categoria: ${event.category} | Data: ${event.date} às ${event.time}`, 14, 37);
    pdf.text(`Total de Participantes Confirmados: ${list.length}`, 14, 43);

    pdf.setLineWidth(0.5);
    pdf.setDrawColor(203, 213, 225);
    pdf.line(14, 48, 196, 48);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);

    let x = 14;
    let y = 58;
    const colWidth = 60;
    const maxY = 270;

    list.forEach((p, i) => {
      pdf.text(`${i + 1}. ${p.playerIdentifier}`, x, y);
      y += 8;

      if (y > maxY) {
        y = 58;
        x += colWidth;
        if (x > 140) {
          pdf.addPage();
          x = 14;
          y = 20;
        }
      }
    });

    pdf.save(`lista_participantes_${event.name.replace(/\s+/g, '_')}.pdf`);
    showToast('Documento PDF baixado!');
  };

  return (
    <div className="space-y-8 text-left relative">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-violet-500 text-white font-sans text-xs font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Section Header */}
      <div className="pkxd-pop-card-purple p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3.5 py-1 bg-[#F9C826] text-[#120624] border-2 border-[#120624] text-xs font-black uppercase rounded-full shadow-[0_3px_0_#16032E]">
              Comunidade PK XD
            </span>
            {pendingEventsCount > 0 && isAdmin && (
              <span className="px-3 py-1 bg-amber-100 text-amber-900 border-2 border-[#120624] text-xs font-bold uppercase rounded-full flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" /> {pendingEventsCount} Em Análise
              </span>
            )}
          </div>

          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#120624] tracking-tight">
            Central de <span className="text-[#7C3AED]">Eventos</span>
          </h2>

          <p className="font-sans text-sm text-slate-600 leading-relaxed font-medium">
            Crie seus próprios torneios, festas e encontros ou confirme presença nos eventos oficiais da comunidade para jogar junto com a galera!
          </p>
        </div>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            openCreateEventModal();
          }}
          className="pkxd-btn-primary w-full md:w-auto px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Criar Novo Evento</span>
        </button>
      </div>

      {/* Mode Switcher: Todos os Eventos vs Minha Agenda PKXD */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pkxd-pop-card-sm p-3">
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              setAgendaTab('todos');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-full font-display text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border-[2.5px] border-[#120624] ${
              agendaTab === 'todos'
                ? 'bg-[#7C3AED] text-white shadow-[0_3px_0_#16032E]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Todos os Eventos ({events.length})</span>
          </button>

          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              setAgendaTab('minha_agenda');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-full font-display text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border-[2.5px] border-[#120624] ${
              agendaTab === 'minha_agenda'
                ? 'bg-[#F9C826] text-[#120624] shadow-[0_3px_0_#16032E]'
                : 'bg-amber-50 text-[#120624] hover:bg-amber-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Minha Agenda PKXD</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-[#120624] text-[#F9C826] tabular-nums">
              {savedAgendaEventsCount}
            </span>
          </button>
        </div>

        {agendaTab === 'minha_agenda' && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#FFF8DB] border-2 border-[#120624] rounded-2xl text-xs font-bold text-[#120624]">
            <BookmarkCheck className="w-4 h-4 text-[#7C3AED] shrink-0" />
            <span>Eventos salvos e confirmados com exportação para agenda</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="pkxd-pop-card-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setStatusFilter('TODOS');
              }}
              className={`px-4 py-2 rounded-full text-xs font-extrabold border-2 border-[#120624] transition-all cursor-pointer ${
                statusFilter === 'TODOS'
                  ? 'bg-[#2D0859] text-white shadow-[0_3px_0_#16032E]'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setStatusFilter('AO_VIVO');
              }}
              className={`px-4 py-2 rounded-full text-xs font-extrabold border-2 border-[#120624] transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'AO_VIVO'
                  ? 'bg-rose-600 text-white shadow-[0_3px_0_#16032E]'
                  : 'bg-white text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>Ao Vivo</span>
            </button>
            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setStatusFilter('APROVADOS');
              }}
              className={`px-4 py-2 rounded-full text-xs font-extrabold border-2 border-[#120624] transition-all cursor-pointer ${
                statusFilter === 'APROVADOS'
                  ? 'bg-emerald-600 text-white shadow-[0_3px_0_#16032E]'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              Confirmados
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  if (triggerAudio) triggerAudio('tap');
                  setStatusFilter('EM_ANALISE');
                }}
                className={`px-4 py-2 rounded-full text-xs font-extrabold border-2 border-[#120624] transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'EM_ANALISE'
                    ? 'bg-[#F9C826] text-[#120624] shadow-[0_3px_0_#16032E]'
                    : 'bg-white text-amber-800 hover:bg-amber-50'
                }`}
              >
                <span>Em Análise</span>
                {pendingEventsCount > 0 && (
                  <span className="bg-[#120624] text-white px-1.5 py-0.5 text-[10px] rounded-full tabular-nums">
                    {pendingEventsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          <span className="text-xs font-bold text-slate-700 px-2 tabular-nums">
            Mostrando <strong className="text-[#2D0859]">{filteredEvents.length}</strong> evento(s).
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setSelectedCategory(cat);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border-2 border-[#120624] ${
                selectedCategory === cat
                  ? 'bg-[#EC4899] text-white shadow-[0_3px_0_#16032E]'
                  : 'bg-slate-50 text-slate-700 hover:bg-[#FFF8DB]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid Display */}
      {filteredEvents.length === 0 ? (
        <div className="pkxd-pop-card-purple p-10 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F9C826] border-[3px] border-[#120624] text-[#120624] flex items-center justify-center mx-auto shadow-[0_4px_0_#16032E]">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-2xl text-[#120624]">
            {agendaTab === 'minha_agenda' ? 'Nenhum evento na sua agenda' : 'Nenhum evento encontrado'}
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto font-medium">
            {agendaTab === 'minha_agenda'
              ? 'Você ainda não salvou ou confirmou presença em nenhum evento. Explore todos os eventos ou crie o seu agora!'
              : 'Não há eventos disponíveis nesta categoria no momento. Seja o primeiro a divulgar um evento!'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {agendaTab === 'minha_agenda' && (
              <button
                onClick={() => {
                  if (triggerAudio) triggerAudio('tap');
                  setAgendaTab('todos');
                }}
                className="pkxd-pop-btn px-5 py-2.5 text-xs uppercase cursor-pointer"
              >
                Ver Todos os Eventos
              </button>
            )}
            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                openCreateEventModal();
              }}
              className="pkxd-btn-primary px-6 py-3 font-display text-sm font-bold cursor-pointer"
            >
              Criar Evento Agora
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => {
            const eventParts = participants.filter(p => p.eventId === event.id);
            const isFull = event.maxParticipants ? eventParts.length >= event.maxParticipants : false;
            const isSaved = savedAgendaIds.includes(event.id);
            const canDelete = isAdmin || (currentUser && event.createdById === currentUser.uid);
            const normalizedMyTag = (playerTag || localStorage.getItem('pkxd_player_tag') || '').trim().toUpperCase();
            const myParticipation = eventParts.find(
              p => (normalizedMyTag && p.playerIdentifier.toUpperCase() === normalizedMyTag) || (currentUser?.uid && p.userId === currentUser.uid)
            );

            return (
              <div
                key={event.id}
                className="pkxd-pop-card-purple overflow-hidden flex flex-col transition-all duration-200 group"
              >
                {/* Banner */}
                <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden flex-shrink-0">
                  <EventBannerImage bannerUrl={event.bannerUrl} name={event.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent" />

                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 right-12 flex flex-wrap gap-1.5">
                    {event.status === 'Ao vivo' && (
                      <span className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold uppercase rounded-full shadow-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        Ao Vivo
                      </span>
                    )}
                    {event.status === 'Em breve' && (
                      <span className="px-2.5 py-1 bg-sky-600 text-white text-[11px] font-bold uppercase rounded-full shadow-sm">
                        Em Breve
                      </span>
                    )}
                    {event.status === 'Aprovado' && (
                      <span className="px-2.5 py-1 bg-violet-600 text-white text-[11px] font-bold uppercase rounded-full shadow-sm">
                        Confirmado
                      </span>
                    )}
                    {event.status === 'Em análise' && (
                      <span className="px-2.5 py-1 bg-amber-400 text-slate-950 text-[11px] font-bold uppercase rounded-full shadow-sm">
                        Em Análise
                      </span>
                    )}
                    {event.status === 'Encerrado' && (
                      <span className="px-2.5 py-1 bg-slate-700 text-slate-200 text-[11px] font-bold uppercase rounded-full shadow-sm">
                        Encerrado
                      </span>
                    )}

                    <span className="px-2.5 py-1 bg-white/95 text-slate-800 text-[11px] font-bold uppercase rounded-full shadow-sm">
                      {event.category}
                    </span>

                    {event.requiresPin && event.pinCode && (
                      <span className="px-2.5 py-1 bg-amber-400 text-slate-950 font-mono text-[11px] font-bold uppercase rounded-full shadow-sm flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Com PIN
                      </span>
                    )}
                  </div>

                  {/* Edit & Delete Actions */}
                  {canDelete && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                      {confirmDeleteEventId === event.id ? (
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-md border-2 border-[#120624]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            Excluir
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteEventId(null);
                            }}
                            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditEventModal(event);
                            }}
                            className="p-2 bg-white hover:bg-[#F9C826] text-[#120624] border-2 border-[#120624] rounded-xl shadow-[0_3px_0_#16032E] transition-colors cursor-pointer"
                            title="Editar Evento"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteEventId(event.id);
                            }}
                            className="p-2 bg-white hover:bg-rose-100 text-[#120624] hover:text-rose-700 border-2 border-[#120624] rounded-xl shadow-[0_3px_0_#16032E] transition-colors cursor-pointer"
                            title="Excluir Evento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Organizer Tag */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-xs font-medium text-white bg-slate-900/75 px-3 py-1 rounded-full inline-block">
                      Organizado por: <strong>{event.organizerName}</strong>
                    </span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-xl text-slate-900 leading-tight group-hover:text-violet-700 transition-colors">
                      {event.name}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-700 pt-1">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Calendar className="w-4 h-4 text-[#EC4899]" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-4 h-4 text-[#2563EB]" />
                        {event.time}
                      </span>
                      {event.server && (
                        <span className="flex items-center gap-1 font-bold text-[#7C3AED]">
                          <Globe className="w-3.5 h-3.5" />
                          {event.server}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Save to Agenda Button */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => toggleSaveAgenda(event.id, event.name)}
                      className={`w-full py-2.5 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border-2 ${
                        isSaved
                          ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                          : 'bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isSaved ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                      <span>{isSaved ? 'Salvo na Minha Agenda' : 'Salvar na Minha Agenda'}</span>
                    </button>

                    {isSaved && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGoogleCalendar(event)}
                          className="flex-1 py-2 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Google Agenda</span>
                        </button>

                        <button
                          onClick={() => handleDownloadICS(event)}
                          className="flex-1 py-2 px-2.5 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Lembrete (.ICS)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Participants Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-violet-600" />
                        Confirmados:
                      </span>
                      <span className="text-slate-900 font-mono tabular-nums">
                        {eventParts.length} {event.maxParticipants ? `/ ${event.maxParticipants}` : 'jogadores'}
                      </span>
                    </div>

                    {event.maxParticipants && (
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? 'bg-rose-500' : 'bg-violet-600'
                          }`}
                          style={{ width: `${Math.min(100, (eventParts.length / event.maxParticipants) * 100)}%` }}
                        />
                      </div>
                    )}

                    {eventParts.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleCopyTagsFormatted(event, eventParts, 'lines')}
                          className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar {eventParts.length} Tags</span>
                        </button>

                        <button
                          onClick={() => {
                            if (triggerAudio) triggerAudio('tap');
                            setShowDetailsModal(event);
                          }}
                          className="py-2 px-3 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Ver Lista</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => handleShareEvent(event)}
                      className="pkxd-btn-outline py-2.5 px-3 text-xs font-bold uppercase rounded-2xl cursor-pointer flex items-center justify-center gap-1.5"
                      title="Compartilhar Link do Evento"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartilhar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (triggerAudio) triggerAudio('tap');
                        setShowDetailsModal(event);
                      }}
                      className="pkxd-btn-outline flex-1 py-2.5 px-3 text-xs font-bold uppercase rounded-2xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Detalhes</span>
                    </button>

                    {event.status !== 'Encerrado' && (
                      myParticipation ? (
                        <button
                          onClick={() => handleConfirmRemoveParticipant(myParticipation.id, myParticipation.playerIdentifier)}
                          className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-[#120624] font-display text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_3px_0_#16032E]"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Cancelar Presença</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenPresenceModal(event)}
                          disabled={isFull}
                          className={`flex-1 py-2.5 px-3 font-display text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer flex items-center justify-center gap-1.5 ${
                            isFull
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed border-2 border-slate-300'
                              : event.requiresPin
                              ? 'pkxd-btn-gold'
                              : 'pkxd-btn-primary'
                          }`}
                        >
                          {event.requiresPin ? <Lock className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          <span>{isFull ? 'Esgotado' : event.requiresPin ? 'Confirmar c/ PIN' : 'Confirmar Presença'}</span>
                        </button>
                      )
                    )}

                    {isAdmin && (
                      <div className="w-full pt-2">
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                          <span className="text-amber-700 font-bold uppercase">Status Admin:</span>
                          <select
                            value={event.status}
                            onChange={(e) => handleUpdateStatus(event.id, e.target.value as EventStatus)}
                            className="bg-white border border-slate-300 text-slate-900 font-bold rounded-xl px-2.5 py-1 text-xs cursor-pointer"
                          >
                            <option value="Em análise">Em análise</option>
                            <option value="Aprovado">Aprovado</option>
                            <option value="Em breve">Em breve</option>
                            <option value="Ao vivo">Ao vivo</option>
                            <option value="Encerrado">Encerrado</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="pkxd-glass-modal rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col relative overflow-hidden text-slate-900">
            <div className="p-5 border-b-2 border-[#120624] bg-[#F9C826] flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#120624]">
                <Calendar className="w-5 h-5" />
                <h3 className="font-display font-bold text-base sm:text-lg text-[#120624] uppercase">
                  {editingEventId ? 'Editar Evento da Comunidade' : 'Criar Evento da Comunidade'}
                </h3>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-2 bg-white hover:bg-slate-100 border-2 border-[#120624] text-[#120624] rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="flex flex-col flex-1 overflow-hidden text-left">
              <div className="p-5 space-y-4 overflow-y-auto max-h-[62vh] custom-scrollbar">
                {createErrorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createErrorMsg}</span>
                  </div>
                )}

                {createSuccessMsg ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-700 flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-slate-900 uppercase">
                      Evento Publicado!
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Seu evento já está visível para toda a comunidade PK XD confirmar presença.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-700">Nome do Evento *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Torneio de Esconder-Esconder / Festa na Ilha"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-700">Seu Nome / Nickname *</label>
                        <input
                          type="text"
                          required
                          placeholder="Seu Nickname"
                          value={newOrganizerName}
                          onChange={(e) => setNewOrganizerName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-700">Categoria *</label>
                        <select
                          value={newEventCategory}
                          onChange={(e) => setNewEventCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 font-semibold cursor-pointer"
                        >
                          <option value="Torneios">Torneios</option>
                          <option value="Festas">Festas e Desfiles</option>
                          <option value="Esconder-Esconder">Esconder-Esconder</option>
                          <option value="Encontros de Creators">Encontros de Creators</option>
                          <option value="Desafios & Mini-Games">Desafios & Mini-Games</option>
                          <option value="Outros">Outros</option>
                          <option value="CUSTOM">+ Criar Categoria...</option>
                        </select>
                      </div>
                    </div>

                    {newEventCategory === 'CUSTOM' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-pink-700">Nome da Nova Categoria</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Batalha de Dança"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-pink-300 rounded-xl text-sm text-slate-900 font-semibold"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-700">Data do Evento *</label>
                        <input
                          type="date"
                          required
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-700">Horário *</label>
                        <input
                          type="time"
                          required
                          value={newEventTime}
                          onChange={(e) => setNewEventTime(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-700">Descrição do Evento</label>
                      <textarea
                        rows={2}
                        placeholder="Descreva o objetivo do evento e o que vai acontecer..."
                        value={newEventDesc}
                        onChange={(e) => setNewEventDesc(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-700">Regras e Instruções</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: 1. Não vale usar montaria. 2. Respeitar o horário..."
                        value={newEventRules}
                        onChange={(e) => setNewEventRules(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-700">Servidor PK XD</label>
                        <input
                          type="text"
                          placeholder="Ex: Brasil / América do Sul"
                          value={newEventServer}
                          onChange={(e) => setNewEventServer(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-700">Limite Máximo (Opcional)</label>
                        <input
                          type="number"
                          placeholder="Ex: 50 (vazio = ilimitado)"
                          value={newMaxParticipants}
                          onChange={(e) => setNewMaxParticipants(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-700">Link ou Informações Adicionais (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: https://youtube.com/... ou código da ilha"
                        value={newEventLink}
                        onChange={(e) => setNewEventLink(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* PIN Protection */}
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-amber-900 shrink-0">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase text-slate-900 block">
                              Proteger Inscrição com PIN / Senha?
                            </span>
                            <span className="text-[11px] text-slate-600 block">
                              Apenas jogadores com a senha poderão confirmar presença
                            </span>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={newEventRequiresPin}
                            onChange={(e) => setNewEventRequiresPin(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>

                      {newEventRequiresPin && (
                        <div className="pt-2 border-t border-amber-200 space-y-2">
                          <label className="block text-xs font-bold uppercase text-amber-900">
                            Crie o PIN / Senha Secreta *
                          </label>
                          <div className="relative flex items-center">
                            <div className="absolute left-3 text-amber-700">
                              <KeyRound className="w-4 h-4" />
                            </div>
                            <input
                              type={showPinInCreateForm ? 'text' : 'password'}
                              required={newEventRequiresPin}
                              maxLength={20}
                              placeholder="Ex: 1234, FESTA2026 ou VIPPKXD"
                              value={newEventPinCode}
                              onChange={(e) => setNewEventPinCode(e.target.value.toUpperCase())}
                              className="w-full pl-9 pr-10 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500 uppercase tracking-widest"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPinInCreateForm(!showPinInCreateForm)}
                              className="absolute right-3 text-slate-500 hover:text-slate-900 cursor-pointer"
                            >
                              {showPinInCreateForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Banner Upload */}
                    <div className="space-y-2 border-2 border-slate-200 bg-slate-50 p-3.5 rounded-2xl">
                      <label className="block text-xs font-bold uppercase text-slate-700">
                        Banner do Evento (Opcional)
                      </label>

                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-violet-300 bg-white hover:bg-violet-50 rounded-xl p-3 cursor-pointer transition-colors">
                        <UploadCloud className="w-5 h-5 text-violet-600 mb-1" />
                        <span className="text-xs font-bold uppercase text-violet-700">
                          {isUploadingBanner
                            ? 'Carregando imagem...'
                            : newEventBanner.startsWith('data:')
                            ? 'Imagem Selecionada!'
                            : 'Enviar Foto do Dispositivo'}
                        </span>
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                      </label>

                      {newEventBanner && (
                        <div className="h-28 w-full rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                          <img src={newEventBanner} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewEventBanner('')}
                            className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-full cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {!createSuccessMsg && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2.5">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="pkxd-btn-outline flex-1 py-2.5 text-xs font-bold uppercase rounded-full cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="pkxd-btn-primary flex-1 py-2.5 text-xs font-display font-bold uppercase tracking-wider cursor-pointer"
                  >
                    {editingEventId ? 'Salvar Alterações' : 'Publicar Evento'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM PRESENCE MODAL */}
      {showPresenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4 animate-fade-in">
          <div className="pkxd-glass-modal rounded-3xl p-6 w-full max-w-md relative text-left space-y-4 text-slate-900">
            <button
              onClick={() => {
                setShowPresenceModal(null);
                setPresenceError('');
              }}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-violet-700">
              <UserCheck className="w-6 h-6" />
              <h3 className="font-display font-bold text-lg text-slate-900 uppercase">
                Confirmar Presença
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Evento: <strong className="text-violet-700">{showPresenceModal.name}</strong>
            </p>

            {presenceSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-display font-bold text-slate-900 text-base uppercase">Presença Confirmada!</h4>
                <p className="text-xs text-slate-600">
                  Você foi adicionado à lista oficial de participantes!
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPresence} className="space-y-4">
                {hasAutoFilledTag ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
                    <p className="font-bold">Preenchimento Automático Ativo</p>
                    <p className="text-emerald-700 mt-0.5">
                      Tag detectada no perfil: <strong className="font-mono">{playerTagInput}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                    <p className="font-bold">Digite seu Nickname e # do PK XD</p>
                    <p className="text-amber-700 mt-0.5">
                      Configure seu PKXD ID para preencher automaticamente nas próximas festas.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-700">
                    Seu Identificador do PK XD *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: KOOSH#000 ou LUNA#245"
                    value={playerTagInput}
                    onChange={(e) => setPlayerTagInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-violet-500 uppercase"
                  />
                </div>

                {showPresenceModal.requiresPin && showPresenceModal.pinCode && (
                  <div className="space-y-2 p-3.5 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                    <div className="flex items-center gap-2 text-amber-900">
                      <Lock className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="text-xs font-bold uppercase block">
                          Senha / PIN Obrigatório
                        </span>
                        <span className="text-[11px] text-amber-800 block">
                          Evento restrito pelo organizador ({showPresenceModal.organizerName}).
                        </span>
                      </div>
                    </div>

                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-amber-700">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPresencePinInput ? 'text' : 'password'}
                        required
                        placeholder="Digite o PIN do evento"
                        value={presencePinInput}
                        onChange={(e) => setPresencePinInput(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-10 py-2.5 bg-white border-2 border-amber-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500 uppercase tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPresencePinInput(!showPresencePinInput)}
                        className="absolute right-3 text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        {showPresencePinInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {presenceError && (
                  <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                    {presenceError}
                  </div>
                )}

                <button
                  type="submit"
                  className="pkxd-btn-primary w-full py-3 font-display text-xs font-bold uppercase tracking-wider rounded-2xl cursor-pointer"
                >
                  Confirmar Minha Presença
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EVENT DETAILS & PARTICIPANTS MODAL */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="pkxd-glass-modal rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col relative overflow-hidden text-left text-slate-900">
            <div className="p-5 border-b border-white/60 bg-white/55 flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 bg-pink-100 text-pink-800 text-[11px] font-bold uppercase rounded-full">
                  {showDetailsModal.category}
                </span>
                <h3 className="font-display font-bold text-xl text-slate-900 mt-1">
                  {showDetailsModal.name}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="p-2 bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 max-h-[70vh] custom-scrollbar">
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {showDetailsModal.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Data e Hora</span>
                    <strong className="text-violet-700">{showDetailsModal.date} às {showDetailsModal.time}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Organizador</span>
                    <strong className="text-slate-900">{showDetailsModal.organizerName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Status</span>
                    <strong className="text-pink-700">{showDetailsModal.status}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Segurança</span>
                    <strong className="text-amber-700 flex items-center gap-1">
                      {showDetailsModal.requiresPin ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Com PIN</span>
                        </>
                      ) : (
                        <span className="text-emerald-700">Pública</span>
                      )}
                    </strong>
                  </div>
                </div>

                {showDetailsModal.requiresPin && showDetailsModal.pinCode && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-700" />
                      <div>
                        <span className="text-[11px] font-bold uppercase text-amber-900 block">
                          PIN / Senha de Inscrição:
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900 tracking-widest bg-white px-2.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                          {showDetailsModal.pinCode}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (triggerAudio) triggerAudio('tap');
                        navigator.clipboard.writeText(showDetailsModal.pinCode || '');
                        showToast(`PIN "${showDetailsModal.pinCode}" copiado!`);
                      }}
                      className="pkxd-btn-gold px-3 py-1.5 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar PIN</span>
                    </button>
                  </div>
                )}

                {(showDetailsModal.server || showDetailsModal.additionalLink) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                    {showDetailsModal.server && (
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Servidor</span>
                        <strong className="text-[#7C3AED] inline-flex items-center gap-1 mt-0.5">
                          <Globe className="w-3.5 h-3.5" />
                          {showDetailsModal.server}
                        </strong>
                      </div>
                    )}
                    {showDetailsModal.additionalLink && (
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Link / Info Adicional</span>
                        {showDetailsModal.additionalLink.startsWith('http') ? (
                          <a
                            href={showDetailsModal.additionalLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#2563EB] font-bold underline inline-flex items-center gap-1 mt-0.5 break-all"
                          >
                            <Link2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Abrir Link</span>
                          </a>
                        ) : (
                          <strong className="text-slate-900 mt-0.5 block">{showDetailsModal.additionalLink}</strong>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {showDetailsModal.rules && (
                  <div className="pt-2">
                    <span className="text-xs font-bold uppercase text-slate-600 block mb-1">Regras do Evento:</span>
                    <div className="p-3 bg-white rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-200">
                      {showDetailsModal.rules}
                    </div>
                  </div>
                )}
              </div>

              {(() => {
                const eventParts = participants.filter(p => p.eventId === showDetailsModal.id);
                const filteredList = eventParts.filter(p =>
                  p.playerIdentifier.toLowerCase().includes(participantSearch.toLowerCase())
                );

                const linesText = eventParts.map(p => p.playerIdentifier).join('\n');
                const commaText = eventParts.map(p => p.playerIdentifier).join(', ');
                const numberedText = `[Lista de Membros - ${showDetailsModal.name}]\n` + eventParts.map((p, i) => `${i + 1}. ${p.playerIdentifier}`).join('\n');

                const activeFormattedText = copyFormatTab === 'lines' ? linesText : copyFormatTab === 'comma' ? commaText : numberedText;

                return (
                  <div className="space-y-4">
                    <div className="bg-amber-50/70 border-2 border-amber-200 p-4 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-display font-bold text-sm uppercase text-slate-900">
                            Painel de Membros & Tags (PK XD)
                          </h4>
                          <p className="text-xs text-slate-600">
                            Copie as tags dos participantes para convidá-los no PK XD.
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-white text-amber-900 font-mono text-xs font-bold rounded-xl border border-amber-200 self-start sm:self-auto tabular-nums">
                          {eventParts.length} {eventParts.length === 1 ? 'membro' : 'membros'}
                        </span>
                      </div>

                      {eventParts.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-amber-200">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200 text-[11px] font-bold">
                              <button
                                onClick={() => setCopyFormatTab('lines')}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  copyFormatTab === 'lines' ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                1 por Linha
                              </button>
                              <button
                                onClick={() => setCopyFormatTab('comma')}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  copyFormatTab === 'comma' ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Por Vírgulas
                              </button>
                              <button
                                onClick={() => setCopyFormatTab('numbered')}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  copyFormatTab === 'numbered' ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Numerado
                              </button>
                            </div>

                            <button
                              onClick={() => handleCopyTagsFormatted(showDetailsModal, eventParts, copyFormatTab)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer ${
                                copiedBatchFormat === copyFormatTab
                                  ? 'bg-emerald-600 text-white'
                                  : 'pkxd-btn-gold'
                              }`}
                            >
                              {copiedBatchFormat === copyFormatTab ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span>Copiar Todas</span>
                                </>
                              )}
                            </button>
                          </div>

                          <textarea
                            readOnly
                            value={activeFormattedText}
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                            rows={Math.min(5, Math.max(2, eventParts.length))}
                            className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-mono text-slate-900 leading-relaxed focus:outline-none resize-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h4 className="font-display font-bold text-sm uppercase text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-violet-700" />
                        Membros Inscritos ({eventParts.length})
                      </h4>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => {
                            setQuickAddError(null);
                            setShowQuickAdd(!showQuickAdd);
                          }}
                          className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{showQuickAdd ? 'Fechar' : 'Add Jogador'}</span>
                        </button>

                        <button
                          onClick={() => handleExportExcel(showDetailsModal, eventParts)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                        </button>

                        <button
                          onClick={() => handleExportPDF(showDetailsModal, eventParts)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>

                        <button
                          onClick={() => handleExportTXT(showDetailsModal, eventParts)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> TXT
                        </button>
                      </div>
                    </div>

                    {showQuickAdd && (
                      <div className="p-3.5 bg-pink-50 border border-pink-200 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-pink-900 uppercase block">
                          Adicionar Jogador Diretamente na Lista:
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Tag no PK XD (ex: AMIGO#123)..."
                            value={quickAddTagInput}
                            onChange={(e) => {
                              setQuickAddError(null);
                              setQuickAddTagInput(e.target.value.toUpperCase());
                            }}
                            className="flex-1 px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs text-slate-900 font-mono"
                          />
                          <button
                            onClick={() => handleQuickAddParticipant(showDetailsModal.id)}
                            className="pkxd-btn-primary px-4 py-2 text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </button>
                        </div>
                        {quickAddError && (
                          <p className="text-xs font-bold text-rose-700">{quickAddError}</p>
                        )}
                      </div>
                    )}

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Pesquisar jogador na lista (ex: KOOSH#000)..."
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                      />
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                      {filteredList.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <p className="text-slate-500 text-xs">
                            {eventParts.length === 0
                              ? 'Nenhum participante confirmado ainda. Compartilhe o link do evento!'
                              : 'Nenhum jogador encontrado com essa pesquisa.'}
                          </p>
                        </div>
                      ) : (
                        filteredList.map((p, idx) => {
                          const isCopied = copiedSingleTagId === p.id;
                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between bg-slate-50 hover:bg-violet-50 border border-slate-200 p-2.5 rounded-xl transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono text-[11px] text-slate-500 font-bold tabular-nums">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <span className="font-mono text-xs font-bold text-slate-900 tracking-wider block">
                                    {p.playerIdentifier}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Inscrito em {new Date(p.registeredAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleCopySingleTag(p.playerIdentifier, p.id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer border ${
                                    isCopied
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Copiado</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copiar Tag</span>
                                    </>
                                  )}
                                </button>

                                {(isAdmin || (currentUser && showDetailsModal.createdById === currentUser.uid)) && (
                                  confirmRemovePartId === p.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleConfirmRemoveParticipant(p.id, p.playerIdentifier)}
                                        className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        onClick={() => setConfirmRemovePartId(null)}
                                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmRemovePartId(p.id)}
                                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Remover jogador da lista"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              {(isAdmin || (currentUser && showDetailsModal.createdById === currentUser.uid)) ? (
                confirmDeleteEventId === showDetailsModal.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-700">Confirmar exclusão?</span>
                    <button
                      onClick={() => handleDeleteEvent(showDetailsModal.id)}
                      className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => setConfirmDeleteEventId(null)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteEventId(showDetailsModal.id)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Evento</span>
                  </button>
                )
              ) : (
                <div />
              )}

              <button
                onClick={() => setShowDetailsModal(null)}
                className="pkxd-btn-outline px-5 py-2 text-xs font-bold uppercase rounded-2xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

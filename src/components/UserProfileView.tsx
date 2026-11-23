import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Zap,
  Award,
  Calendar,
  CheckCircle2,
  Edit3,
  History,
  Sparkles,
  Smartphone,
  Trophy,
  LogOut,
  KeyRound,
  ArrowRight,
  Save,
  X,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CommunityEvent, EventParticipant, ServerXPProfile } from '../types';

interface UserProfileViewProps {
  user: any;
  playerTag: string;
  xpProfile: ServerXPProfile | null;
  fanLevel: number;
  fanXP: number;
  onSaveIdentity: (name: string, number: string) => Promise<{ ok: boolean; error?: string }>;
  onOpenInstallApp: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onNavigate: (path: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
}

export default function UserProfileView({
  user,
  playerTag,
  xpProfile,
  fanLevel,
  fanXP,
  onSaveIdentity,
  onOpenInstallApp,
  onOpenAuth,
  onLogout,
  onNavigate,
  triggerAudio,
}: UserProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'xp' | 'eventos' | 'conquistas'>('xp');
  const [editingTag, setEditingTag] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [numInput, setNumInput] = useState('');
  const [savingTag, setSavingTag] = useState(false);
  const [tagError, setTagError] = useState('');

  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);

  useEffect(() => {
    if (playerTag && playerTag.includes('#')) {
      const [n, num] = playerTag.split('#');
      setNameInput(n || '');
      setNumInput(num || '');
    }
  }, [playerTag]);

  useEffect(() => {
    if (!db) return;
    const unsubEvents = onSnapshot(
      collection(db, 'community_events'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as CommunityEvent));
        setEvents(list);
      },
      () => {}
    );
    const unsubParts = onSnapshot(
      collection(db, 'event_participants'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as EventParticipant));
        setParticipants(list);
      },
      () => {}
    );
    return () => {
      unsubEvents();
      unsubParts();
    };
  }, []);

  const totalXp = xpProfile?.totalXp ?? ((fanLevel - 1) * 100 + fanXP);
  const displayLevel = xpProfile?.level ?? fanLevel;
  const xpInLevel = xpProfile?.xpInLevel ?? (totalXp % 100);
  const claimedRewards = xpProfile?.claimedRewards || [];
  const xpHistory = xpProfile?.history || [];

  const identityClaimed = claimedRewards.includes('pkxd_identity_25') || Boolean(playerTag && playerTag.includes('#'));
  const pwaClaimed = claimedRewards.includes('pwa_install_100');

  const createdEvents = useMemo(() => {
    const cleanTag = (playerTag || '').trim().toUpperCase();
    return events.filter(
      (e) =>
        (user?.uid && e.createdById === user.uid) ||
        (cleanTag && (e.organizerName || '').trim().toUpperCase() === cleanTag)
    );
  }, [events, user, playerTag]);

  const confirmedEvents = useMemo(() => {
    const cleanTag = (playerTag || '').trim().toUpperCase();
    const myEventIds = new Set(
      participants
        .filter(
          (p) =>
            (user?.uid && p.userId === user.uid) ||
            (cleanTag && (p.playerIdentifier || '').trim().toUpperCase() === cleanTag)
        )
        .map((p) => p.eventId)
    );
    return events.filter((e) => myEventIds.has(e.id));
  }, [events, participants, user, playerTag]);

  const achievements = useMemo(
    () => [
      {
        id: 'ach_identity',
        title: 'Identidade PK XD',
        desc: 'Cadastrou seu Nome e # oficial do PK XD.',
        unlocked: identityClaimed,
        bonus: '+25 XP',
      },
      {
        id: 'ach_pwa',
        title: 'App na Tela Inicial',
        desc: 'Instalou o PK XD Central no celular como aplicativo PWA.',
        unlocked: pwaClaimed,
        bonus: '+100 XP',
      },
      {
        id: 'ach_event_host',
        title: 'Organizador da Ilha',
        desc: 'Criou pelo menos 1 evento na Central de Eventos.',
        unlocked: createdEvents.length > 0,
        bonus: 'Organizador',
      },
      {
        id: 'ach_event_guest',
        title: 'Presença Confirmada',
        desc: 'Confirmou presença em um evento da comunidade.',
        unlocked: confirmedEvents.length > 0,
        bonus: 'Participante',
      },
      {
        id: 'ach_lvl5',
        title: 'Explorador Veterano',
        desc: 'Alcançou 500 XP acumulados na plataforma.',
        unlocked: totalXp >= 500,
        bonus: 'Nível 6+',
      },
    ],
    [identityClaimed, pwaClaimed, createdEvents.length, confirmedEvents.length, totalXp]
  );

  const handleTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTagError('');
    setSavingTag(true);
    const res = await onSaveIdentity(nameInput, numInput);
    setSavingTag(false);
    if (!res.ok) {
      setTagError(res.error || 'Verifique seu Nome e # do PK XD.');
      return;
    }
    setEditingTag(false);
  };

  const displayName =
    (playerTag && playerTag.split('#')[0]) ||
    user?.displayName ||
    xpProfile?.displayName ||
    'Explorador PK XD';

  return (
    <div className="w-full animate-fade-in">
      {/* BAND 1: PROFILE HEADER (Deep Purple Band + Crisp White Card with Gold Shadow) */}
      <section className="pkxd-band-purple py-10 sm:py-14 border-b-[4px] border-[#120624]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="pkxd-pop-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 pkxd-avatar-ring object-cover shrink-0 bg-[#EDE9FE]"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 pkxd-avatar-ring bg-[#F9C826] text-[#120624] font-display font-bold text-3xl flex items-center justify-center shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="space-y-1.5">
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#120624]">
                  {displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
                  <span className="font-mono text-[#6D28D9]">
                    {playerTag || 'Tag PK XD não cadastrada'}
                  </span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="text-[#120624] tabular-nums">Nível {displayLevel}</span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="text-[#EC4899] tabular-nums">{totalXp} XP</span>
                </div>

                {/* Level Progress Bar */}
                <div className="pt-1 w-full max-w-xs space-y-1">
                  <div className="h-3 rounded-full bg-slate-200 border-2 border-[#120624] overflow-hidden">
                    <div
                      className="h-full bg-[#6D28D9]"
                      style={{ width: `${Math.min(100, xpInLevel)}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 tabular-nums">
                    {xpInLevel}/100 XP para o Nível {displayLevel + 1}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  setEditingTag((prev) => !prev);
                }}
                className="pkxd-btn-gold px-4 py-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{playerTag ? 'Editar Tag PK XD' : 'Cadastrar Tag (+25 XP)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  onNavigate('/pkxd-id');
                }}
                className="pkxd-pop-btn px-4 py-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#6D28D9]" />
                <span>Abrir Passaporte PKXD ID</span>
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2.5 rounded-full border-[3px] border-[#120624] bg-rose-100 text-rose-800 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="pkxd-btn-primary px-4 py-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar / Criar Conta</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Tag Edit Form */}
          {editingTag && (
            <form
              onSubmit={handleTagSubmit}
              className="pkxd-pop-card-pink p-5 sm:p-6 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-xl text-[#120624]">
                    {playerTag ? 'Editar Identidade PK XD' : 'Complete sua Identidade PK XD! (+25 XP GRÁTIS)'}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Seu Nome e # serão preenchidos automaticamente em todas as festas e eventos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTag(false)}
                  className="w-9 h-9 rounded-full border-2 border-[#120624] bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-extrabold text-[#120624] mb-1">
                    Nome no PK XD
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    placeholder="Ex: LUNA"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-2xl border-[2.5px] border-[#120624] bg-slate-50 font-mono font-bold text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#120624] mb-1">
                    Número #
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-[#6D28D9]">
                      #
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="245"
                      value={numInput}
                      onChange={(e) => setNumInput(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl border-[2.5px] border-[#120624] bg-slate-50 font-mono font-bold text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingTag}
                  className="pkxd-btn-purple min-h-[44px] px-5 py-2.5 text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingTag ? 'Salvando...' : 'Salvar Identidade'}</span>
                </button>
              </div>
              {tagError && <p className="text-xs font-bold text-rose-600">{tagError}</p>}
            </form>
          )}

          {/* Profile Navigation Tabs */}
          <div className="flex flex-wrap gap-2.5">
            {([
              { id: 'xp', label: 'Sistema de XP & Histórico', icon: Zap },
              { id: 'eventos', label: `Meus Eventos (${createdEvents.length + confirmedEvents.length})`, icon: Calendar },
              { id: 'conquistas', label: `Conquistas (${achievements.filter((a) => a.unlocked).length}/${achievements.length})`, icon: Award },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    setActiveTab(tab.id);
                  }}
                  className={`px-4 py-2.5 rounded-full border-[3px] border-[#120624] text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer ${
                    active
                      ? 'bg-[#F9C826] text-[#120624] shadow-[0_4px_0_#120624]'
                      : 'bg-white text-[#120624] hover:bg-[#FEF9C3]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* BAND 2: TAB BODY (Rich Purple Shade) */}
      <section className="pkxd-band-purple-2 py-10 sm:py-14 min-h-[420px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          {activeTab === 'xp' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Initial One-Time Rewards */}
              <div className="lg:col-span-5 space-y-4">
                <div className="pkxd-pop-card p-6 space-y-4">
                  <h2 className="font-display font-bold text-2xl text-[#120624] inline-flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#6D28D9]" />
                    <span>Recompensas de XP</span>
                  </h2>
                  <p className="text-xs font-semibold text-slate-600">
                    Recompensas únicas validadas no servidor (1 resgate por usuário).
                  </p>

                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl border-2 border-[#120624] bg-[#FEF9C3] flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-sm text-[#120624]">
                          Identidade PK XD (+25 XP)
                        </p>
                        <p className="text-xs text-slate-700">
                          Cadastre seu Nome e # (ex: LUNA#245).
                        </p>
                      </div>
                      {identityClaimed ? (
                        <span className="text-xs font-extrabold text-emerald-700 shrink-0 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Resgatado</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingTag(true)}
                          className="pkxd-btn-purple px-3.5 py-1.5 text-xs cursor-pointer shrink-0"
                        >
                          Resgatar
                        </button>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl border-2 border-[#120624] bg-[#FCE7F3] flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-sm text-[#120624]">
                          Instalar App no Celular (+100 XP)
                        </p>
                        <p className="text-xs text-slate-700">
                          Instale o PWA na tela inicial do celular.
                        </p>
                      </div>
                      {pwaClaimed ? (
                        <span className="text-xs font-extrabold text-emerald-700 shrink-0 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Resgatado</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={onOpenInstallApp}
                          className="pkxd-btn-primary px-3.5 py-1.5 text-xs cursor-pointer shrink-0"
                        >
                          Instalar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: XP History Ledger */}
              <div className="lg:col-span-7 pkxd-pop-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-2xl text-[#120624] flex items-center gap-2">
                    <History className="w-5 h-5 text-[#6D28D9]" />
                    <span>Histórico de XP e Atividades</span>
                  </h2>
                  <span className="text-xs font-extrabold text-[#6D28D9] tabular-nums">
                    Total: {totalXp} XP
                  </span>
                </div>

                {xpHistory.length === 0 ? (
                  <div className="py-8 text-center space-y-2 text-slate-600">
                    <p className="font-bold text-sm text-[#120624]">
                      Nenhuma movimentação de XP registrada ainda.
                    </p>
                    <p className="text-xs">
                      Cadastre sua Tag PK XD (+25 XP), instale o app (+100 XP) ou confirme presença em eventos!
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y-2 divide-slate-100">
                    {xpHistory.map((entry) => (
                      <li
                        key={entry.id}
                        className="py-3 flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[#120624] truncate">{entry.reason}</p>
                          <p className="text-xs text-slate-500 tabular-nums">
                            {new Date(entry.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span className="font-mono font-extrabold text-emerald-700 tabular-nums shrink-0">
                          +{entry.amount} XP
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'eventos' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Created Events */}
              <div className="pkxd-pop-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-2xl text-[#120624]">
                    Eventos Criados ({createdEvents.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => onNavigate('/criar-evento')}
                    className="pkxd-btn-primary px-3.5 py-1.5 text-xs cursor-pointer"
                  >
                    + Criar
                  </button>
                </div>

                {createdEvents.length === 0 ? (
                  <p className="text-sm text-slate-600 py-4">
                    Você ainda não organizou nenhum evento. Clique em Criar Novo Evento para divulgar sua festa ou torneio!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {createdEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-2xl border-2 border-[#120624] bg-slate-50 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-display font-bold text-base text-[#120624] truncate">
                            {ev.name}
                          </p>
                          <p className="text-xs font-semibold text-slate-600 tabular-nums">
                            {ev.category} · {ev.date} {ev.time ? `às ${ev.time}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigate('/eventos')}
                          className="pkxd-pop-btn px-3 py-1.5 text-xs cursor-pointer shrink-0"
                        >
                          Gerenciar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmed Events */}
              <div className="pkxd-pop-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-2xl text-[#120624]">
                    Eventos Confirmados ({confirmedEvents.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => onNavigate('/minha-agenda')}
                    className="pkxd-btn-gold px-3.5 py-1.5 text-xs cursor-pointer"
                  >
                    Minha Agenda
                  </button>
                </div>

                {confirmedEvents.length === 0 ? (
                  <p className="text-sm text-slate-600 py-4">
                    Você ainda não confirmou presença em nenhum evento. Explore a Central de Eventos para participar!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {confirmedEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-2xl border-2 border-[#120624] bg-[#ECFDF5] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-display font-bold text-base text-[#120624] truncate">
                            {ev.name}
                          </p>
                          <p className="text-xs font-semibold text-slate-600 tabular-nums">
                            {ev.category} · {ev.date} {ev.time ? `às ${ev.time}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigate('/minha-agenda')}
                          className="pkxd-pop-btn px-3 py-1.5 text-xs cursor-pointer shrink-0"
                        >
                          Ver Agenda
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'conquistas' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`pkxd-pop-card p-5 space-y-2.5 ${
                    ach.unlocked ? '' : 'opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border-2 border-[#120624] ${
                        ach.unlocked ? 'bg-emerald-300 text-[#120624]' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {ach.unlocked ? 'Desbloqueada' : 'Bloqueada'}
                    </span>
                    <span className="text-[#6D28D9]">{ach.bonus}</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-[#120624] flex items-center gap-2">
                    <Trophy
                      className={`w-5 h-5 ${
                        ach.unlocked ? 'text-[#EAB308]' : 'text-slate-400'
                      }`}
                    />
                    <span>{ach.title}</span>
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{ach.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

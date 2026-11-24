import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  Calendar,
  Megaphone,
  Settings,
  Trash2,
  CheckCircle2,
  Radio,
  RefreshCw,
  Tag,
  Newspaper,
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { CommunityEvent, NewsItem } from '../types';
import AdminNewsManager from './AdminNewsManager';

const ADMIN_SECRET = 'pkxd2026_super_secret_admin_key';

export type AdminEcosystemSection = 'noticias' | 'stats' | 'eventos' | 'comunicados' | 'conteudo';

interface AdminEcosystemPanelProps {
  initialSection?: AdminEcosystemSection;
  forceSection?: AdminEcosystemSection;
  newsList?: NewsItem[];
  newsToEdit?: NewsItem | null;
  onAddNews?: (item: Omit<NewsItem, 'id'>) => void | Promise<void>;
  onSaveEditNews?: (updated: NewsItem) => void | Promise<void>;
  onCancelEditNews?: () => void;
  onDeleteNews?: (id: string) => void | Promise<void>;
  onSelectEditNews?: (item: NewsItem) => void;
  onNavigate?: (path: string) => void;
  triggerAudio?: (type: 'tap' | 'success' | 'levelUp') => void;
  children: React.ReactNode;
}

export default function AdminEcosystemPanel({
  initialSection = 'noticias',
  forceSection,
  newsList = [],
  newsToEdit = null,
  onAddNews,
  onSaveEditNews,
  onCancelEditNews,
  onDeleteNews,
  onSelectEditNews,
  onNavigate,
  triggerAudio,
  children,
}: AdminEcosystemPanelProps) {
  const [section, setSection] = useState<AdminEcosystemSection>(forceSection || initialSection);

  useEffect(() => {
    if (forceSection) {
      setSection(forceSection);
    }
  }, [forceSection]);
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [eventCategories, setEventCategories] = useState<string[]>([]);
  const [newEventCatInput, setNewEventCatInput] = useState('');

  // Broadcast Announcement State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState('admin_announcement');
  const [notifSendPush, setNotifSendPush] = useState(true);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const flash = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const loadStats = useCallback(async () => {
    let loadedFromApi = false;
    try {
      const [statsRes, catsRes] = await Promise.all([
        fetch(`/api/admin/stats?admin_secret=${encodeURIComponent(ADMIN_SECRET)}`),
        fetch('/api/event-categories'),
      ]);
      const statsCt = statsRes.headers.get('content-type') || '';
      if (statsRes.ok && statsCt.includes('application/json')) {
        const statsData = await statsRes.json();
        if (statsData?.success) {
          setStats(statsData.stats);
          setUsersList(Array.isArray(statsData.users) ? statsData.users : []);
          loadedFromApi = true;
        }
      }
      const catsCt = catsRes.headers.get('content-type') || '';
      if (catsRes.ok && catsCt.includes('application/json')) {
        const catsData = await catsRes.json();
        if (catsData?.success && Array.isArray(catsData.categories)) {
          setEventCategories(catsData.categories);
        }
      }
    } catch (e) {
      console.warn(e);
    }

    // Live Firestore fallback when running on static hosting
    if (!loadedFromApi && db) {
      try {
        const [usersSnap, eventsSnap, newsSnap] = await Promise.all([
          getDocs(collection(db, 'user_xp_profiles')),
          getDocs(collection(db, 'community_events')),
          getDocs(collection(db, 'news')),
        ]);
        const users = usersSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => Number(b.totalXp || 0) - Number(a.totalXp || 0))
          .slice(0, 50);
        setStats({
          users: usersSnap.size,
          events: eventsSnap.size,
          news: newsSnap.size,
        });
        setUsersList(users);
      } catch (fsErr) {
        console.warn('Firestore stats fallback error:', fsErr);
      }
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(
      collection(db, 'community_events'),
      (snap) => {
        setEvents(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) } as CommunityEvent))
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
        );
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const handleEventStatus = async (evId: string, status: CommunityEvent['status']) => {
    try {
      await updateDoc(doc(db, 'community_events', evId), { status });
      flash(`Status do evento atualizado para "${status}".`);
    } catch (e: any) {
      flash(`Erro ao atualizar evento: ${e?.message}`);
    }
  };

  const handleDeleteEvent = async (evId: string) => {
    try {
      await deleteDoc(doc(db, 'community_events', evId));
      flash('Evento removido com sucesso.');
    } catch {
      await fetch('/api/admin-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName: 'community_events', docId: evId, admin_secret: ADMIN_SECRET }),
      });
      flash('Evento removido via servidor.');
    }
  };

  const handleSaveCategories = async (next: string[]) => {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_secret: ADMIN_SECRET, categories: next }),
    });
    const data = await res.json();
    if (data?.success) {
      setEventCategories(data.categories);
      flash('Categorias de eventos salvas!');
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) return;
    const res = await fetch('/api/notifications/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_secret: ADMIN_SECRET,
        title: notifTitle,
        body: notifBody,
        type: notifType,
        sendPush: notifSendPush,
        targetUrl: '/notificacoes',
      }),
    });
    if (res.ok) {
      setNotifTitle('');
      setNotifBody('');
      flash('Comunicado publicado nas Notificações da comunidade!');
    }
  };

  return (
    <div className="space-y-6">
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-[#F9C826] border-[3px] border-[#120624] text-[#120624] font-extrabold text-sm">
          {feedbackMsg}
        </div>
      )}

      {/* Top Admin Sub-Navigation */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'noticias', label: `Notícias PK XD (${newsList.length})`, icon: Newspaper },
          { id: 'stats', label: 'Estatísticas & Usuários', icon: BarChart3 },
          { id: 'eventos', label: `Eventos & Categorias (${events.length})`, icon: Calendar },
          { id: 'comunicados', label: 'Comunicados & Push', icon: Megaphone },
          { id: 'conteudo', label: 'Spoilers, Vídeos & Sistema', icon: Settings },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`px-4 py-2.5 rounded-full border-[2.5px] border-[#120624] text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer ${
                active
                  ? 'bg-[#F9C826] text-[#120624] shadow-[0_3px_0_#120624]'
                  : 'bg-white text-[#120624] hover:bg-[#FEF9C3]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 0. EXCLUSIVE PK XD NEWS MANAGER */}
      {section === 'noticias' && onAddNews && onSaveEditNews && onCancelEditNews && onDeleteNews && (
        <AdminNewsManager
          newsList={newsList}
          newsToEdit={newsToEdit}
          onAddNews={onAddNews}
          onSaveEdit={onSaveEditNews}
          onCancelEdit={onCancelEditNews}
          onDeleteNews={onDeleteNews}
          onSelectEdit={onSelectEditNews}
          onNavigate={onNavigate}
          triggerAudio={triggerAudio}
        />
      )}

      {/* 1. STATS & USERS */}
      {section === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Usuários / Perfis XP', val: stats?.users ?? 0 },
              { label: 'Eventos Cadastrados', val: stats?.events ?? events.length },
              { label: 'Notícias Publicadas', val: stats?.news ?? 0 },
            ].map((s) => (
              <div key={s.label} className="pkxd-pop-card-purple p-5 space-y-1">
                <p className="text-xs font-extrabold text-slate-500">{s.label}</p>
                <p className="font-display font-bold text-3xl text-[#2D0859] tabular-nums">
                  {s.val}
                </p>
              </div>
            ))}
          </div>

          <div className="pkxd-pop-card-purple p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-[#120624] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#6D28D9]" />
                <span>Membros Registrados e Saldo de XP</span>
              </h3>
              <button
                type="button"
                onClick={loadStats}
                className="pkxd-pop-btn px-3 py-1.5 text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar
              </button>
            </div>

            {usersList.length === 0 ? (
              <p className="text-sm text-slate-600">
                Nenhum membro registrou XP ou Identidade PK XD ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#120624] text-slate-500 font-extrabold">
                      <th className="py-2 pr-4">Jogador</th>
                      <th className="py-2 pr-4">Tag PK XD</th>
                      <th className="py-2 pr-4">Nível</th>
                      <th className="py-2 pr-4">XP Total</th>
                      <th className="py-2">Recompensas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {usersList.map((u) => (
                      <tr key={u.id || u.userKey}>
                        <td className="py-2.5 pr-4 font-bold text-[#120624]">
                          {u.displayName || 'Jogador'}
                        </td>
                        <td className="py-2.5 pr-4 font-mono font-bold text-[#6D28D9]">
                          {u.playerTag || '—'}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums font-bold">
                          Nv. {u.level || 1}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums font-extrabold text-emerald-700">
                          {u.totalXp || 0} XP
                        </td>
                        <td className="py-2.5 text-xs text-slate-600">
                          {(u.claimedRewards || []).join(', ') || 'Nenhuma'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MODERATE EVENTS & CATEGORIES */}
      {section === 'eventos' && (
        <div className="space-y-6">
          <div className="pkxd-pop-card p-6 space-y-4">
            <h3 className="font-display font-bold text-xl text-[#120624] flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#6D28D9]" />
              <span>Categorias de Eventos</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {eventCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF9C3] border-2 border-[#120624] text-xs font-extrabold"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => handleSaveCategories(eventCategories.filter((c) => c !== cat))}
                    className="text-rose-700 hover:text-rose-900 cursor-pointer"
                    title="Remover categoria"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Nova categoria..."
                value={newEventCatInput}
                onChange={(e) => setNewEventCatInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border-2 border-[#120624] text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newEventCatInput.trim()) return;
                  handleSaveCategories([...eventCategories, newEventCatInput.trim()]);
                  setNewEventCatInput('');
                }}
                className="pkxd-btn-purple px-4 py-2 text-xs cursor-pointer"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div className="pkxd-pop-card p-6 space-y-4">
            <h3 className="font-display font-bold text-xl text-[#120624]">
              Moderar Eventos ({events.length})
            </h3>
            {events.length === 0 ? (
              <p className="text-sm text-slate-600">Nenhum evento cadastrado no momento.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl border-2 border-[#120624] bg-[#FFFDF7] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="font-display font-bold text-base text-[#120624]">{ev.name}</p>
                      <p className="text-xs font-semibold text-slate-600">
                        {ev.category} · Organizador: {ev.organizerName} · {ev.date} {ev.time} · Status:{' '}
                        <strong className="text-[#6D28D9]">{ev.status}</strong>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEventStatus(ev.id, 'Aprovado')}
                        className="px-3 py-1.5 rounded-full border-2 border-[#120624] bg-emerald-200 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEventStatus(ev.id, 'Ao vivo')}
                        className="px-3 py-1.5 rounded-full border-2 border-[#120624] bg-rose-200 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Radio className="w-3.5 h-3.5" /> Ao Vivo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEventStatus(ev.id, 'Encerrado')}
                        className="px-3 py-1.5 rounded-full border-2 border-[#120624] bg-slate-200 text-xs font-extrabold cursor-pointer"
                      >
                        Encerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-2 rounded-full border-2 border-[#120624] bg-rose-500 text-white cursor-pointer"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. BROADCAST ANNOUNCEMENTS */}
      {section === 'comunicados' && (
        <form onSubmit={handleSendAnnouncement} className="pkxd-pop-card-purple p-6 space-y-4 max-w-2xl">
          <h3 className="font-display font-bold text-2xl text-[#120624]">
            Criar Comunicado Oficial / Notificação
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold mb-1">Categoria do Aviso</label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[#120624] text-sm bg-white"
              >
                <option value="admin_announcement">Comunicado da Administração</option>
                <option value="important_news">Notícia Importante</option>
                <option value="new_event">Novo Evento</option>
                <option value="new_tournament">Novo Torneio</option>
                <option value="upcoming_event">Evento Próximo</option>
                <option value="schedule_change">Alteração de Horário</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold mb-1">Título</label>
              <input
                type="text"
                required
                placeholder="Ex: Torneio de Crazy Run hoje às 19h!"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#120624] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-extrabold mb-1">Mensagem</label>
            <textarea
              required
              rows={3}
              placeholder="Escreva os detalhes do comunicado para a comunidade..."
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#120624] text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer">
            <input
              type="checkbox"
              checked={notifSendPush}
              onChange={(e) => setNotifSendPush(e.target.checked)}
              className="w-4 h-4"
            />
            Enviar também como Notificação Push para dispositivos inscritos
          </label>
          <button
            type="submit"
            className="pkxd-btn-primary px-6 py-2.5 text-sm cursor-pointer"
          >
            Publicar Comunicado Agora
          </button>
        </form>
      )}

      {/* 4. UNIFIED MODERN CONTENT CMS */}
      {section === 'conteudo' && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

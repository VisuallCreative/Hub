import React, { useState, useEffect } from 'react';
import {
  MessageSquarePlus,
  Flag,
  ThumbsUp,
  Send,
  CheckCircle2,
  AlertTriangle,
  Star,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  category: string;
  rating: number;
  authorName: string;
  authorTag?: string;
  votes: number;
  status: 'em_analise' | 'planejado' | 'implementado';
  createdAt: number;
}

export interface ReportItem {
  id: string;
  type: string;
  targetRef?: string;
  description: string;
  severity: 'baixa' | 'media' | 'alta';
  reporterName: string;
  reporterContact?: string;
  status: 'aberto' | 'em_verificacao' | 'resolvido';
  createdAt: number;
}

interface CommunityFeedbackSectionProps {
  currentUser: any;
  isAdmin: boolean;
  onAddXP?: (amount: number, reason: string) => void;
  triggerAudio?: (type: 'tap' | 'success' | 'levelUp') => void;
}

const LOCAL_FEEDBACK_KEY = 'pkxd_local_feedback_items';
const LOCAL_VOTED_KEY = 'pkxd_local_feedback_voted';
const LOCAL_REPORTS_KEY = 'pkxd_local_report_items';

export default function CommunityFeedbackSection({
  currentUser,
  isAdmin,
  onAddXP,
  triggerAudio,
}: CommunityFeedbackSectionProps) {
  const [activeTab, setActiveTab] = useState<'feedback' | 'denuncias'>('feedback');

  // Feedback state
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [votedIds, setVotedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_VOTED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [fbTitle, setFbTitle] = useState('');
  const [fbCategory, setFbCategory] = useState('Nova Funcionalidade');
  const [fbRating, setFbRating] = useState(5);
  const [fbDesc, setFbDesc] = useState('');
  const [fbAuthor, setFbAuthor] = useState(() => {
    return (
      currentUser?.displayName ||
      localStorage.getItem('pkxd_player_tag') ||
      ''
    );
  });
  const [submittingFb, setSubmittingFb] = useState(false);
  const [fbStatusMsg, setFbStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reports state
  const [reportType, setReportType] = useState('Bug ou Erro no Site');
  const [reportSeverity, setReportSeverity] = useState<'baixa' | 'media' | 'alta'>('media');
  const [reportTarget, setReportTarget] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportContact, setReportContact] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportStatusMsg, setReportStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminReports, setAdminReports] = useState<ReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Load feedback from backend + merge local cache
  useEffect(() => {
    let active = true;
    const loadFeedback = async () => {
      setLoadingFeedback(true);
      let localItems: FeedbackItem[] = [];
      try {
        const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
        if (raw) localItems = JSON.parse(raw);
      } catch {}

      try {
        const res = await fetch('/api/feedback');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.items) && data.items.length > 0) {
            setFeedbackList(data.items);
            try {
              localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(data.items));
            } catch {}
            setLoadingFeedback(false);
            return;
          }
        }
      } catch {}

      if (active) {
        setFeedbackList(localItems);
        setLoadingFeedback(false);
      }
    };
    loadFeedback();
    return () => {
      active = false;
    };
  }, []);

  // Load reports for Admin review
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const loadReports = async () => {
      setLoadingReports(true);
      let localReports: ReportItem[] = [];
      try {
        const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
        if (raw) localReports = JSON.parse(raw);
      } catch {}

      try {
        const res = await fetch('/api/reports?admin_secret=pkxd2026_super_secret_admin_key');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.items)) {
            const merged = data.items.length > 0 ? data.items : localReports;
            setAdminReports(merged);
            setLoadingReports(false);
            return;
          }
        }
      } catch {}

      if (active) {
        setAdminReports(localReports);
        setLoadingReports(false);
      }
    };
    loadReports();
    return () => {
      active = false;
    };
  }, [isAdmin, activeTab]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbTitle.trim() || !fbDesc.trim()) {
      setFbStatusMsg({ type: 'error', text: 'Preencha o título e a descrição da sua sugestão.' });
      return;
    }

    setSubmittingFb(true);
    setFbStatusMsg(null);
    const authorName =
      fbAuthor.trim() ||
      currentUser?.displayName ||
      localStorage.getItem('pkxd_player_tag') ||
      'Membro da Comunidade';

    const payload = {
      title: fbTitle.trim(),
      description: fbDesc.trim(),
      category: fbCategory,
      rating: fbRating,
      authorName,
      authorTag: localStorage.getItem('pkxd_player_tag') || '',
      authorId: currentUser?.uid || null,
    };

    let createdItem: FeedbackItem = {
      id: `fb_${Date.now()}`,
      ...payload,
      votes: 1,
      status: 'em_analise',
      createdAt: Date.now(),
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) createdItem = data.item;
      }
    } catch {}

    const nextList = [createdItem, ...feedbackList];
    setFeedbackList(nextList);
    try {
      localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(nextList));
    } catch {}

    setFbTitle('');
    setFbDesc('');
    setSubmittingFb(false);
    if (triggerAudio) triggerAudio('success');
    if (onAddXP) onAddXP(40, 'Enviou sugestão para a PKXD Central');
    setFbStatusMsg({
      type: 'success',
      text: 'Sugestão registrada com sucesso! Obrigado por ajudar a evoluir a PKXD Central.',
    });
  };

  const handleVoteFeedback = async (id: string) => {
    if (votedIds.includes(id)) return;
    if (triggerAudio) triggerAudio('tap');

    const updatedVoted = [...votedIds, id];
    setVotedIds(updatedVoted);
    try {
      localStorage.setItem(LOCAL_VOTED_KEY, JSON.stringify(updatedVoted));
    } catch {}

    setFeedbackList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, votes: (item.votes || 0) + 1 } : item))
    );

    try {
      await fetch(`/api/feedback/${id}/vote`, { method: 'POST' });
    } catch {}

    if (onAddXP) onAddXP(10, 'Apoiou uma sugestão da comunidade');
  };

  const handleUpdateFeedbackStatus = async (id: string, status: FeedbackItem['status']) => {
    if (!isAdmin) return;
    setFeedbackList((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    try {
      await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_secret: 'pkxd2026_super_secret_admin_key' }),
      });
    } catch {}
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim()) {
      setReportStatusMsg({ type: 'error', text: 'Descreva o problema ou ocorrência para enviarmos à moderação.' });
      return;
    }

    setSubmittingReport(true);
    setReportStatusMsg(null);

    const payload = {
      type: reportType,
      targetRef: reportTarget.trim(),
      description: reportDesc.trim(),
      severity: reportSeverity,
      reporterName: currentUser?.displayName || localStorage.getItem('pkxd_player_tag') || 'Membro',
      reporterContact: reportContact.trim() || currentUser?.email || '',
    };

    let createdReport: ReportItem = {
      id: `rep_${Date.now()}`,
      ...payload,
      status: 'aberto',
      createdAt: Date.now(),
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) createdReport = data.item;
      }
    } catch {}

    try {
      const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
      const existing: ReportItem[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify([createdReport, ...existing]));
    } catch {}

    if (isAdmin) {
      setAdminReports((prev) => [createdReport, ...prev]);
    }

    setReportTarget('');
    setReportDesc('');
    setReportContact('');
    setSubmittingReport(false);
    if (triggerAudio) triggerAudio('success');
    setReportStatusMsg({
      type: 'success',
      text: `Registro recebido (Protocolo ${createdReport.id.slice(-6).toUpperCase()}). Nossa equipe vai analisar em breve.`,
    });
  };

  const handleUpdateReportStatus = async (id: string, status: ReportItem['status']) => {
    if (!isAdmin) return;
    setAdminReports((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    try {
      await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_secret: 'pkxd2026_super_secret_admin_key' }),
      });
    } catch {}
  };

  const statusLabelMap: Record<FeedbackItem['status'], { label: string; color: string }> = {
    em_analise: { label: 'Em análise', color: 'text-amber-700' },
    planejado: { label: 'Planejado', color: 'text-sky-700' },
    implementado: { label: 'Implementado', color: 'text-emerald-700' },
  };

  return (
    <section id="community-feedback-section" className="space-y-8">
      <div className="pkxd-glass rounded-[34px] p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Ouvidoria e Participação
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            Feedback, Sugestões e Denúncias
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Envie ideias para melhorar a PKXD Central, vote nas sugestões da comunidade ou comunique problemas e denúncias diretamente para a equipe.
          </p>
        </div>

        {/* Interactive Mode Switcher */}
        <div className="inline-flex p-1.5 rounded-full bg-slate-100 border border-slate-200 shrink-0 self-start">
          <button
            type="button"
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              setActiveTab('feedback');
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Sugestões</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              setActiveTab('denuncias');
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'denuncias'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Denúncias e Problemas</span>
          </button>
        </div>
      </div>

      {activeTab === 'feedback' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Submission Form */}
          <form
            onSubmit={handleSubmitFeedback}
            className="lg:col-span-5 pkxd-glass rounded-3xl p-6 space-y-4"
          >
            <h3 className="font-display font-bold text-xl text-slate-900">
              Enviar Sugestão ou Feedback
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Seu nome ou Tag PK XD
              </label>
              <input
                type="text"
                value={fbAuthor}
                onChange={(e) => setFbAuthor(e.target.value)}
                placeholder="Ex: LUNA#245"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Categoria</label>
                <select
                  value={fbCategory}
                  onChange={(e) => setFbCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-600"
                >
                  <option value="Nova Funcionalidade">Nova Funcionalidade</option>
                  <option value="Eventos">Eventos</option>
                  <option value="Criadores">Criadores</option>
                  <option value="Visual e Navegação">Visual e Navegação</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Avaliação do site</label>
                <div className="flex items-center gap-1 h-[42px] px-3 rounded-xl bg-slate-50 border border-slate-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFbRating(star)}
                      aria-label={`Nota ${star}`}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= fbRating
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Título da ideia</label>
              <input
                type="text"
                required
                maxLength={120}
                value={fbTitle}
                onChange={(e) => setFbTitle(e.target.value)}
                placeholder="Ex: Ranking semanal de melhores casas"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Detalhes</label>
              <textarea
                rows={4}
                required
                maxLength={1200}
                value={fbDesc}
                onChange={(e) => setFbDesc(e.target.value)}
                placeholder="Explique como essa melhoria pode ajudar os jogadores e criadores..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-violet-600 resize-none"
              />
            </div>

            {fbStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
                  fbStatusMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {fbStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{fbStatusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingFb}
              className="w-full pkxd-btn-primary py-3 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submittingFb ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{submittingFb ? 'Enviando...' : 'Publicar Sugestão'}</span>
            </button>
          </form>

          {/* Suggestions Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-slate-900">
                Sugestões da Comunidade
              </h3>
              <span className="text-xs font-semibold text-slate-500 tabular-nums">
                {feedbackList.length} {feedbackList.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {loadingFeedback ? (
              <div className="p-8 text-center text-sm text-slate-600 rounded-3xl pkxd-glass">
                Carregando sugestões...
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="p-10 text-center space-y-2 border border-dashed border-slate-300/80 rounded-3xl pkxd-glass-soft">
                <p className="font-display font-bold text-lg text-slate-800">
                  Nenhuma sugestão enviada ainda
                </p>
                <p className="text-sm text-slate-600">
                  Use o formulário ao lado para compartilhar a primeira ideia com a comunidade!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackList.map((item) => {
                  const hasVoted = votedIds.includes(item.id);
                  const statusMeta = statusLabelMap[item.status] || statusLabelMap.em_analise;
                  return (
                    <article
                      key={item.id}
                      className="pkxd-glass rounded-2xl p-5 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-bold ${statusMeta.color}`}>{statusMeta.label}</span>
                          <span aria-hidden="true">·</span>
                          <span>Por {item.authorName}</span>
                        </div>
                        <h4 className="font-display font-bold text-lg text-slate-900">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {item.description}
                        </p>

                        {isAdmin && (
                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Status Admin:</span>
                            {(['em_analise', 'planejado', 'implementado'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleUpdateFeedbackStatus(item.id, st)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                                  item.status === st
                                    ? 'bg-violet-700 text-white border-violet-700'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {statusLabelMap[st].label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVoteFeedback(item.id)}
                        disabled={hasVoted}
                        className={`px-3.5 py-2 rounded-xl border text-sm font-bold flex flex-col items-center gap-0.5 shrink-0 cursor-pointer transition-colors tabular-nums ${
                          hasVoted
                            ? 'bg-violet-50 border-violet-300 text-violet-700'
                            : 'bg-slate-50 hover:bg-violet-50 border-slate-200 text-slate-700 hover:text-violet-700'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{item.votes || 0}</span>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Reports & Bug Submission Form */}
          <form
            onSubmit={handleSubmitReport}
            className="lg:col-span-6 pkxd-glass rounded-3xl p-6 space-y-4"
          >
            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-slate-900">
                Comunicar Problema ou Enviar Denúncia
              </h3>
              <p className="text-xs text-slate-600">
                Os envios são confidenciais e analisados pela moderação da PKXD Central.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Tipo de ocorrência</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="Bug ou Erro no Site">Bug ou Erro no Site</option>
                  <option value="Problema em Evento">Problema em Evento</option>
                  <option value="Conduta de Jogador">Conduta de Jogador</option>
                  <option value="Conteúdo Impróprio">Conteúdo Impróprio</option>
                  <option value="Link ou Código Quebrado">Link ou Código Quebrado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Prioridade</label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta (Urgente)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Página, Evento ou Tag envolvida (opcional)
              </label>
              <input
                type="text"
                value={reportTarget}
                onChange={(e) => setReportTarget(e.target.value)}
                placeholder="Ex: Evento Crazy Run ou @JOGADOR#000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Descrição detalhada</label>
              <textarea
                rows={4}
                required
                maxLength={1500}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Conte o que aconteceu, onde ocorreu e qualquer detalhe que ajude a equipe a resolver rápido..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Seu contato para retorno (opcional)
              </label>
              <input
                type="text"
                value={reportContact}
                onChange={(e) => setReportContact(e.target.value)}
                placeholder="E-mail ou @Instagram"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            {reportStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
                  reportStatusMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {reportStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{reportStatusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingReport}
              className="w-full py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white border-b-4 border-rose-900 active:translate-y-0.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              {submittingReport ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Flag className="w-4 h-4" />
              )}
              <span>{submittingReport ? 'Enviando registro...' : 'Enviar para Análise'}</span>
            </button>
          </form>

          {/* Guidelines / Admin Moderation Inbox */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <h3 className="font-display font-bold text-lg">Segurança da Comunidade</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
                <li>1. Nunca compartilhe sua senha do PK XD ou da sua conta Google com terceiros.</li>
                <li>2. Problemas técnicos e links quebrados são corrigidos prioritariamente pela equipe.</li>
                <li>3. Denúncias de eventos ou comentários passam por moderação real antes de qualquer ação.</li>
              </ul>
            </div>

            {isAdmin && (
              <div className="pkxd-glass rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-lg text-slate-900">
                    Caixa de Denúncias (Admin)
                  </h4>
                  <span className="text-xs font-bold text-slate-500 tabular-nums">
                    {adminReports.length} registros
                  </span>
                </div>

                {loadingReports ? (
                  <p className="text-sm text-slate-500">Carregando denúncias...</p>
                ) : adminReports.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma denúncia ou problema registrado.</p>
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                    {adminReports.map((rep) => (
                      <div key={rep.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-bold text-slate-800">{rep.type}</span>
                          <span>Prioridade: {rep.severity}</span>
                        </div>
                        {rep.targetRef && (
                          <p className="text-xs font-semibold text-violet-700">Alvo: {rep.targetRef}</p>
                        )}
                        <p className="text-sm text-slate-700">{rep.description}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <span className="text-xs text-slate-500">
                            Por {rep.reporterName} {rep.reporterContact ? `· ${rep.reporterContact}` : ''}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {(['aberto', 'em_verificacao', 'resolvido'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleUpdateReportStatus(rep.id, st)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                  rep.status === st
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-200'
                                }`}
                              >
                                {st === 'aberto' ? 'Aberto' : st === 'em_verificacao' ? 'Verificando' : 'Resolvido'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

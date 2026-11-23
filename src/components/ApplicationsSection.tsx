import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Smartphone,
  Video,
  UserCheck,
  Compass,
  Send,
  Check,
  ExternalLink,
  AlertCircle,
  Trophy,
  ArrowLeft,
  Lock,
  RefreshCw,
  Trash2,
  CheckCircle,
  Eye,
  Star,
  Upload,
  Image as ImageIcon,
  Instagram,
  Youtube,
  Link2,
  X
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { playTapSound, playSuccessSound, playLevelUpSound } from '../utils/audio';

interface ApplicationsSectionProps {
  onBackToHub: () => void;
  onOpenCreatorAnalyzer?: () => void;
  onAddXP: (amount: number, reason: string) => void;
  soundEnabled: boolean;
  user: any;
  isAdmin?: boolean;
  onAddNews?: (news: any) => void;
  onAddShort?: (short: any) => void;
  onAddTheory?: (theory: any) => void;
  onAddFeaturedVideo?: (video: any) => void;
}

export default function ApplicationsSection({
  onBackToHub,
  onOpenCreatorAnalyzer,
  onAddXP,
  soundEnabled,
  user,
  isAdmin = false,
  onAddShort,
  onAddTheory,
  onAddFeaturedVideo
}: ApplicationsSectionProps) {
  const [activeTab, setActiveTab] = useState<'panel' | 'shorts' | 'theory' | 'admin'>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('admin') || search.includes('admin')) return 'admin';
      if (hash.includes('shorts') || search.includes('shorts')) return 'shorts';
      if (hash.includes('theory') || search.includes('theory') || hash.includes('teoria') || search.includes('teoria')) return 'theory';
      if (hash.includes('panel') || search.includes('panel') || hash.includes('destaque') || search.includes('destaque')) return 'panel';
    } catch {}
    return 'panel';
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const checkHash = () => {
      try {
        const hash = window.location.hash.toLowerCase();
        const search = window.location.search.toLowerCase();
        if (hash.includes('admin') || search.includes('admin')) {
          setActiveTab('admin');
        } else if (hash.includes('shorts') || search.includes('shorts')) {
          setActiveTab('shorts');
        } else if (hash.includes('theory') || search.includes('theory') || hash.includes('teoria') || search.includes('teoria')) {
          setActiveTab('theory');
        } else if (hash.includes('panel') || search.includes('panel') || hash.includes('destaque') || search.includes('destaque')) {
          setActiveTab('panel');
        }
      } catch {}
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Admin Dashboard States
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isComponentAdmin, setIsComponentAdmin] = useState(isAdmin);
  const [inputPasscode, setInputPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [adminFeedback, setAdminFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmDeleteAppId, setConfirmDeleteAppId] = useState<string | null>(null);

  const [appsPanel, setAppsPanel] = useState<any[]>([]);
  const [appsShorts, setAppsShorts] = useState<any[]>([]);
  const [appsTheories, setAppsTheories] = useState<any[]>([]);
  const [appsAdmin, setAppsAdmin] = useState<any[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState(false);
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'panel' | 'shorts' | 'theory' | 'admin'>('panel');

  const fetchAllApplications = async () => {
    setIsAppsLoading(true);
    try {
      try {
        const panelSnap = await getDocs(collection(db, 'applications_panel'));
        setAppsPanel(panelSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'applications_panel');
      }

      try {
        const shortsSnap = await getDocs(collection(db, 'applications_shorts'));
        setAppsShorts(shortsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'applications_shorts');
      }

      try {
        const theoriesSnap = await getDocs(collection(db, 'applications_theories'));
        setAppsTheories(theoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'applications_theories');
      }

      try {
        const adminSnap = await getDocs(collection(db, 'applications_admin'));
        setAppsAdmin(adminSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'applications_admin');
      }
    } catch (err) {
      console.error('Erro ao buscar inscrições:', err);
    } finally {
      setIsAppsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      setIsComponentAdmin(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (showAdminDashboard && isComponentAdmin) {
      fetchAllApplications();
    }
  }, [showAdminDashboard, isComponentAdmin]);

  const handlePasscodeUnlock = () => {
    triggerAudio('tap');
    const validPasscodes = ['pkxdcentral2026_portal_admin', 'kawanyuri_adm_seguro_99', 'central_pkxd_super_acesso_real', 'bela12@!'];
    if (validPasscodes.includes(inputPasscode.trim())) {
      setIsComponentAdmin(true);
      setPasscodeError('');
      setInputPasscode('');
      triggerAudio('success');
    } else {
      setPasscodeError('Código de acesso incorreto. Tente novamente.');
    }
  };

  // Form states - Tab 1: Panel Highlight
  const [panelCreator, setPanelCreator] = useState('');
  const [panelUrl, setPanelUrl] = useState('');
  const [panelDescription, setPanelDescription] = useState('');
  const [panelCreatorPhoto, setPanelCreatorPhoto] = useState('');
  const [panelPhotoInputType, setPanelPhotoInputType] = useState<'upload' | 'url'>('upload');
  const [panelInstagram, setPanelInstagram] = useState('');
  const [panelTikTok, setPanelTikTok] = useState('');
  const [panelYouTube, setPanelYouTube] = useState('');

  // Form states - Tab 2: Shorts Highlight
  const [shortsCreator, setShortsCreator] = useState('');
  const [shortsUrl, setShortsUrl] = useState('');
  const [shortsTitle, setShortsTitle] = useState('');
  const [shortsCreatorPhoto, setShortsCreatorPhoto] = useState('');
  const [shortsPhotoInputType, setShortsPhotoInputType] = useState<'upload' | 'url'>('upload');
  const [shortsInstagram, setShortsInstagram] = useState('');
  const [shortsTikTok, setShortsTikTok] = useState('');
  const [shortsYouTube, setShortsYouTube] = useState('');

  // Form states - Tab 3: Theory
  const [theoryTitle, setTheoryTitle] = useState('');
  const [theoryContent, setTheoryContent] = useState('');
  const [theoryAuthor, setTheoryAuthor] = useState('');

  // Form states - Tab 4: Admin Application
  const [adminName, setAdminName] = useState('');
  const [adminContact, setAdminContact] = useState('');
  const [adminAge, setAdminAge] = useState('');
  const [adminReason, setAdminReason] = useState('');
  const [adminHours, setAdminHours] = useState('');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSubmitStatus({
        success: false,
        message: 'A foto é muito pesada (limite de 5MB). Por favor, escolha outra imagem.'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setter(result);
    };
    reader.readAsDataURL(file);
  };

  const triggerAudio = (type: 'tap' | 'success' | 'levelUp') => {
    if (!soundEnabled) return;
    if (type === 'tap') playTapSound();
    if (type === 'success') playSuccessSound();
    if (type === 'levelUp') playLevelUpSound();
  };

  const handleTabChange = (tab: 'panel' | 'shorts' | 'theory' | 'admin') => {
    triggerAudio('tap');
    setActiveTab(tab);
    setSubmitStatus(null);
  };

  const resetForms = () => {
    setPanelCreator('');
    setPanelUrl('');
    setPanelDescription('');
    setPanelCreatorPhoto('');
    setPanelInstagram('');
    setPanelTikTok('');
    setPanelYouTube('');

    setShortsCreator('');
    setShortsUrl('');
    setShortsTitle('');
    setShortsCreatorPhoto('');
    setShortsInstagram('');
    setShortsTikTok('');
    setShortsYouTube('');

    setTheoryTitle('');
    setTheoryContent('');
    setTheoryAuthor('');

    setAdminName('');
    setAdminContact('');
    setAdminAge('');
    setAdminReason('');
    setAdminHours('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerAudio('tap');
    setIsSubmitting(true);
    setSubmitStatus(null);

    const id = 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    let collectionName = '';
    let payload: any = {
      id,
      submittedBy: user?.uid || 'anonymous',
      submittedByEmail: user?.email || 'convidado@pkxdcentral.com',
      createdAt: Date.now(),
      status: 'pending'
    };

    try {
      if (activeTab === 'panel') {
        if (!panelCreator.trim() || !panelUrl.trim() || !panelDescription.trim()) {
          throw new Error('Preencha todos os campos obrigatórios (Nome, Link do Conteúdo e Descrição).');
        }

        const hasSocial = Boolean(panelInstagram.trim() || panelTikTok.trim() || panelYouTube.trim());
        if (!hasSocial) {
          throw new Error('Informe pelo menos UMA rede social do indicado (Instagram, TikTok ou YouTube).');
        }

        const socialParts: string[] = [];
        if (panelInstagram.trim()) socialParts.push(`Instagram: ${panelInstagram.trim()}`);
        if (panelTikTok.trim()) socialParts.push(`TikTok: ${panelTikTok.trim()}`);
        if (panelYouTube.trim()) socialParts.push(`YouTube: ${panelYouTube.trim()}`);

        collectionName = 'applications_panel';
        payload = {
          ...payload,
          creator: panelCreator.trim(),
          url: panelUrl.trim(),
          description: panelDescription.trim(),
          creatorPhoto: panelCreatorPhoto.trim() || null,
          instagram: panelInstagram.trim() || null,
          tiktok: panelTikTok.trim() || null,
          youtube: panelYouTube.trim() || null,
          social: socialParts.join(' • ')
        };
      } else if (activeTab === 'shorts') {
        if (!shortsCreator.trim() || !shortsUrl.trim() || !shortsTitle.trim()) {
          throw new Error('Preencha todos os campos obrigatórios (Canal, Link do Short e Título).');
        }

        const hasSocial = Boolean(shortsInstagram.trim() || shortsTikTok.trim() || shortsYouTube.trim());
        if (!hasSocial) {
          throw new Error('Informe pelo menos UMA rede social do indicado (Instagram, TikTok ou YouTube).');
        }

        const socialParts: string[] = [];
        if (shortsInstagram.trim()) socialParts.push(`Instagram: ${shortsInstagram.trim()}`);
        if (shortsTikTok.trim()) socialParts.push(`TikTok: ${shortsTikTok.trim()}`);
        if (shortsYouTube.trim()) socialParts.push(`YouTube: ${shortsYouTube.trim()}`);

        collectionName = 'applications_shorts';
        payload = {
          ...payload,
          creator: shortsCreator.trim(),
          url: shortsUrl.trim(),
          title: shortsTitle.trim(),
          creatorPhoto: shortsCreatorPhoto.trim() || null,
          instagram: shortsInstagram.trim() || null,
          tiktok: shortsTikTok.trim() || null,
          youtube: shortsYouTube.trim() || null,
          social: socialParts.join(' • ')
        };
      } else if (activeTab === 'theory') {
        if (!theoryTitle.trim() || !theoryContent.trim() || !theoryAuthor.trim()) {
          throw new Error('Preencha todos os campos obrigatórios.');
        }
        collectionName = 'applications_theories';
        payload = {
          ...payload,
          title: theoryTitle.trim(),
          content: theoryContent.trim(),
          author: theoryAuthor.trim()
        };
      } else if (activeTab === 'admin') {
        if (!adminName.trim() || !adminContact.trim() || !adminAge || !adminReason.trim() || !adminHours.trim()) {
          throw new Error('Preencha todos os campos obrigatórios.');
        }
        collectionName = 'applications_admin';
        payload = {
          ...payload,
          name: adminName.trim(),
          contact: adminContact.trim(),
          age: adminAge,
          reason: adminReason.trim(),
          hours: adminHours.trim()
        };
      }

      try {
        await setDoc(doc(db, collectionName, id), payload);
      } catch (dbErr: any) {
        if (dbErr?.code === 'permission-denied') {
          throw new Error('Permissão Negada de Nuvem (Firestore). Entre em contato com um administrador.');
        } else {
          handleFirestoreError(dbErr, OperationType.WRITE, collectionName);
        }
      }

      triggerAudio('levelUp');
      setSubmitStatus({
        success: true,
        message: 'Sugestão / Inscrição enviada com sucesso! Guardada na nuvem do PKXD Central para análise da equipe!'
      });

      const xpReward = 150;
      onAddXP(xpReward, `Inscrição: ${activeTab === 'panel' ? 'Destaque de Vídeo' : activeTab === 'shorts' ? 'Destaque de Shorts' : activeTab === 'theory' ? 'Envio de Teoria' : 'Candidatura ADM'}`);

      resetForms();
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Erro ao processar inscrição. Verifique as informações e tente novamente.';
      try {
        if (err.message && err.message.startsWith('{')) {
          const parsed = JSON.parse(err.message);
          if (parsed.error && (parsed.error.includes('permission-denied') || parsed.error.includes('Missing or insufficient permissions'))) {
            errMsg = 'A gravação foi rejeitada pelas regras do banco de dados. Verifique sua autenticação.';
          } else {
            errMsg = parsed.error || errMsg;
          }
        } else if (err.message) {
          errMsg = err.message;
        }
      } catch {}

      setSubmitStatus({
        success: false,
        message: errMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDeleteButton = (colName: string, id: string, label = 'Excluir') => {
    if (confirmDeleteAppId === id) {
      return (
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={async () => {
              triggerAudio('tap');
              try {
                await deleteDoc(doc(db, colName, id));
                setConfirmDeleteAppId(null);
                setAdminFeedback({ success: true, message: 'Registro removido com sucesso.' });
                fetchAllApplications();
              } catch (err: any) {
                setAdminFeedback({ success: false, message: err.message || 'Erro ao excluir.' });
              }
            }}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteAppId(null)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          triggerAudio('tap');
          setConfirmDeleteAppId(id);
        }}
        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 ml-auto"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8 relative text-slate-900" id="applications-area-wrapper">
      {/* Upper Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={() => {
            triggerAudio('tap');
            onBackToHub();
          }}
          className="pkxd-btn-outline px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar à Central</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-50 py-1.5 px-3 rounded-full border-2 border-amber-200">
            <Trophy className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">
              <span className="hidden sm:inline">Inscrição = </span>
              <strong className="text-amber-800">+150 XP</strong>
            </span>
          </div>

          <button
            onClick={() => {
              triggerAudio('tap');
              setShowAdminDashboard(!showAdminDashboard);
              setSubmitStatus(null);
              setAdminFeedback(null);
            }}
            className={`px-4 py-2 rounded-2xl font-display text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 ${
              showAdminDashboard
                ? 'bg-rose-600 text-white border-b-4 border-rose-800'
                : 'pkxd-btn-gold'
            }`}
          >
            {showAdminDashboard ? (
              <>
                <Eye className="w-4 h-4" />
                <span>Enviar Inscrição</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Área do Admin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showAdminDashboard ? (
        <>
          <div className="pkxd-glass border-amber-300/80 rounded-3xl p-6 sm:p-8 text-left space-y-2.5">
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 px-3.5 py-1 rounded-full text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              Painel do Administrador (Inscrições)
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-4xl tracking-tight text-slate-900">
              Curadoria de <span className="text-amber-600">Inscrições</span>
            </h2>
            <p className="font-sans text-sm text-slate-600 leading-relaxed max-w-2xl">
              Gerencie todas as solicitações enviadas pelos membros. Aprove conteúdos direto para o portal ou entre em contato com candidatos a administrador.
            </p>
          </div>

          {!isComponentAdmin ? (
            <div className="pkxd-glass rounded-3xl p-6 sm:p-8 text-center">
              <div className="max-w-md mx-auto py-6 space-y-5">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600">
                  <Lock className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-bold text-xl text-slate-900">
                    Acesso Restrito (Código Admin)
                  </h3>
                  <p className="font-sans text-xs text-slate-600 leading-relaxed">
                    Insira uma senha de acesso autorizada para visualizar as inscrições feitas na central.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Senha de Admin ou PIN"
                    value={inputPasscode}
                    onChange={(e) => setInputPasscode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePasscodeUnlock();
                    }}
                    className="bg-slate-50 text-slate-900 placeholder-slate-400 text-sm px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-amber-500 w-full font-mono text-center"
                  />
                  <button
                    onClick={handlePasscodeUnlock}
                    className="pkxd-btn-gold py-3 rounded-2xl text-xs font-display font-bold tracking-wider cursor-pointer w-full uppercase"
                  >
                    Desbloquear Painel
                  </button>
                  {passcodeError && (
                    <p className="text-rose-600 text-xs font-bold pt-1">{passcodeError}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {adminFeedback && (
                <div
                  className={`p-3.5 rounded-2xl border-2 text-xs font-bold flex items-center gap-2 ${
                    adminFeedback.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {adminFeedback.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{adminFeedback.message}</span>
                </div>
              )}

              {/* Admin Subtabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <button
                  onClick={() => { triggerAudio('tap'); setAdminActiveSubTab('panel'); }}
                  className={`p-3.5 rounded-2xl border-2 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    adminActiveSubTab === 'panel'
                      ? 'bg-violet-600 text-white border-violet-700 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Vídeo Destaque ({appsPanel.length})</span>
                </button>

                <button
                  onClick={() => { triggerAudio('tap'); setAdminActiveSubTab('shorts'); }}
                  className={`p-3.5 rounded-2xl border-2 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    adminActiveSubTab === 'shorts'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Shorts ({appsShorts.length})</span>
                </button>

                <button
                  onClick={() => { triggerAudio('tap'); setAdminActiveSubTab('theory'); }}
                  className={`p-3.5 rounded-2xl border-2 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    adminActiveSubTab === 'theory'
                      ? 'bg-pink-600 text-white border-pink-700 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Teorias ({appsTheories.length})</span>
                </button>

                <button
                  onClick={() => { triggerAudio('tap'); setAdminActiveSubTab('admin'); }}
                  className={`p-3.5 rounded-2xl border-2 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    adminActiveSubTab === 'admin'
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Candidatos ADM ({appsAdmin.length})</span>
                </button>
              </div>

              <div className="pkxd-glass rounded-3xl p-6 sm:p-8 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-900">
                    Solicitações:{' '}
                    {adminActiveSubTab === 'panel'
                      ? 'Destaque de Vídeos'
                      : adminActiveSubTab === 'shorts'
                      ? 'Destaque de Shorts'
                      : adminActiveSubTab === 'theory'
                      ? 'Teorias Enviadas'
                      : 'Candidaturas ADM'}
                  </h3>
                  <button
                    onClick={() => { triggerAudio('tap'); fetchAllApplications(); }}
                    disabled={isAppsLoading}
                    className="pkxd-btn-outline px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAppsLoading ? 'animate-spin' : ''}`} />
                    <span>{isAppsLoading ? 'Atualizando...' : 'Atualizar'}</span>
                  </button>
                </div>

                {isAppsLoading ? (
                  <div className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-violet-600 mb-3" />
                    <p className="font-sans text-xs">Acessando banco de dados...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminActiveSubTab === 'panel' && (
                      appsPanel.length === 0 ? (
                        <p className="py-8 text-center text-slate-500 text-xs">Nenhum pedido de destaque de vídeo pendente.</p>
                      ) : (
                        appsPanel.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                              <div className="flex items-center gap-3">
                                {item.creatorPhoto ? (
                                  <img
                                    src={item.creatorPhoto}
                                    alt={item.creator}
                                    className="w-12 h-12 rounded-2xl object-cover border-2 border-violet-300 bg-white shrink-0"
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-violet-100 border-2 border-violet-200 flex items-center justify-center text-violet-700 font-bold text-base shrink-0">
                                    {item.creator?.charAt(0)?.toUpperCase() || 'C'}
                                  </div>
                                )}
                                <div>
                                  <span className="text-[11px] text-violet-700 font-bold uppercase block">Criador Indicado</span>
                                  <h4 className="font-display font-bold text-base text-slate-900">{item.creator}</h4>
                                  <span className="text-[10px] font-mono text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.instagram && (
                                  <a
                                    href={item.instagram.startsWith('http') ? item.instagram : `https://instagram.com/${item.instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 text-[11px] font-bold"
                                  >
                                    <Instagram className="w-3 h-3" />
                                    <span>{item.instagram.startsWith('@') ? item.instagram : `@${item.instagram.replace('https://instagram.com/', '')}`}</span>
                                  </a>
                                )}
                                {item.tiktok && (
                                  <a
                                    href={item.tiktok.startsWith('http') ? item.tiktok : `https://tiktok.com/@${item.tiktok.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-bold"
                                  >
                                    <span>TikTok: {item.tiktok.startsWith('@') ? item.tiktok : `@${item.tiktok.replace('https://tiktok.com/@', '')}`}</span>
                                  </a>
                                )}
                                {item.youtube && (
                                  <a
                                    href={item.youtube.startsWith('http') ? item.youtube : `https://youtube.com/@${item.youtube.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold"
                                  >
                                    <Youtube className="w-3 h-3" />
                                    <span>{item.youtube.startsWith('@') ? item.youtube : item.youtube.replace('https://youtube.com/@', '')}</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <p className="text-slate-700"><strong className="text-slate-900">Descrição:</strong> {item.description}</p>
                              <div className="font-mono text-[11px] text-sky-800 break-all bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                <span>{item.url}</span>
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-900 shrink-0">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (!onAddFeaturedVideo) {
                                    setAdminFeedback({ success: false, message: 'Ação onAddFeaturedVideo indisponível.' });
                                    return;
                                  }
                                  try {
                                    onAddFeaturedVideo({
                                      title: item.description || `Destaque de ${item.creator}!`,
                                      youtubeUrl: item.url,
                                      type: 'game_highlight',
                                      author: item.creator
                                    });
                                    await deleteDoc(doc(db, 'applications_panel', item.id));
                                    triggerAudio('success');
                                    setAdminFeedback({ success: true, message: 'Aprovado no Painel Super Destaques!' });
                                    fetchAllApplications();
                                  } catch (err: any) {
                                    setAdminFeedback({ success: false, message: 'Erro ao aprovar: ' + err.message });
                                  }
                                }}
                                className="pkxd-btn-gold px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span>Aprovar no Painel</span>
                              </button>

                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (!onAddFeaturedVideo) {
                                    setAdminFeedback({ success: false, message: 'Ação onAddFeaturedVideo indisponível.' });
                                    return;
                                  }
                                  try {
                                    onAddFeaturedVideo({
                                      title: item.description || `Vídeo de ${item.creator}!`,
                                      youtubeUrl: item.url,
                                      type: 'panel_video',
                                      author: item.creator
                                    });
                                    await deleteDoc(doc(db, 'applications_panel', item.id));
                                    triggerAudio('success');
                                    setAdminFeedback({ success: true, message: 'Aprovado na aba Comunidade!' });
                                    fetchAllApplications();
                                  } catch (err: any) {
                                    setAdminFeedback({ success: false, message: 'Erro ao aprovar: ' + err.message });
                                  }
                                }}
                                className="pkxd-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aprovar na Comunidade</span>
                              </button>

                              {renderDeleteButton('applications_panel', item.id)}
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {adminActiveSubTab === 'shorts' && (
                      appsShorts.length === 0 ? (
                        <p className="py-8 text-center text-slate-500 text-xs">Nenhum pedido de destaque de shorts pendente.</p>
                      ) : (
                        appsShorts.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                              <div className="flex items-center gap-3">
                                {item.creatorPhoto ? (
                                  <img
                                    src={item.creatorPhoto}
                                    alt={item.creator}
                                    className="w-12 h-12 rounded-2xl object-cover border-2 border-sky-300 bg-white shrink-0"
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-sky-100 border-2 border-sky-200 flex items-center justify-center text-sky-700 font-bold text-base shrink-0">
                                    {item.creator?.charAt(0)?.toUpperCase() || 'S'}
                                  </div>
                                )}
                                <div>
                                  <span className="text-[11px] text-sky-700 font-bold uppercase block">Canal / Criador</span>
                                  <h4 className="font-display font-bold text-base text-slate-900">{item.creator}</h4>
                                  <span className="text-[10px] font-mono text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <p className="text-slate-700"><strong className="text-slate-900">Título do Short:</strong> {item.title}</p>
                              <div className="font-mono text-[11px] text-sky-800 break-all bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                <span>{item.url}</span>
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-900 shrink-0">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (!onAddShort) return;
                                  try {
                                    onAddShort({ title: item.title, youtubeUrl: item.url });
                                    await deleteDoc(doc(db, 'applications_shorts', item.id));
                                    triggerAudio('success');
                                    setAdminFeedback({ success: true, message: 'Short aprovado!' });
                                    fetchAllApplications();
                                  } catch (err: any) {
                                    setAdminFeedback({ success: false, message: 'Erro ao aprovar: ' + err.message });
                                  }
                                }}
                                className="pkxd-btn-cyan px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aprovar Shorts</span>
                              </button>

                              {renderDeleteButton('applications_shorts', item.id)}
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {adminActiveSubTab === 'theory' && (
                      appsTheories.length === 0 ? (
                        <p className="py-8 text-center text-slate-500 text-xs">Nenhuma teoria enviada pendente.</p>
                      ) : (
                        appsTheories.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                              <div>
                                <span className="text-[11px] text-pink-700 font-bold uppercase block">Autor / Título</span>
                                <h4 className="font-display font-bold text-sm text-slate-900">{item.title}</h4>
                                <p className="text-xs text-slate-600">Por: {item.author}</p>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                            </div>

                            <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                onClick={async () => {
                                  triggerAudio('tap');
                                  if (!onAddTheory) return;
                                  try {
                                    onAddTheory({
                                      title: item.title,
                                      content: item.content,
                                      author: item.author
                                    });
                                    await deleteDoc(doc(db, 'applications_theories', item.id));
                                    triggerAudio('success');
                                    setAdminFeedback({ success: true, message: 'Teoria aprovada no mural!' });
                                    fetchAllApplications();
                                  } catch (err: any) {
                                    setAdminFeedback({ success: false, message: 'Erro ao aprovar: ' + err.message });
                                  }
                                }}
                                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aprovar Teoria</span>
                              </button>

                              {renderDeleteButton('applications_theories', item.id)}
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {adminActiveSubTab === 'admin' && (
                      appsAdmin.length === 0 ? (
                        <p className="py-8 text-center text-slate-500 text-xs">Nenhuma candidatura de administrador pendente.</p>
                      ) : (
                        appsAdmin.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                              <div>
                                <span className="text-[11px] text-amber-700 font-bold uppercase block">Candidato</span>
                                <h4 className="font-display font-bold text-sm text-slate-900">{item.name} ({item.age} anos)</h4>
                                <p className="text-xs text-slate-600">Contato: <strong className="text-slate-900 select-all">{item.contact}</strong></p>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                            </div>

                            <div className="space-y-2 text-xs">
                              <p className="text-slate-700"><strong className="text-slate-900">Disponibilidade:</strong> {item.hours}</p>
                              <div className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                                <strong className="text-slate-900 block mb-1">Por que quer ser Admin?</strong>
                                {item.reason}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <a
                                href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(item.contact)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => triggerAudio('tap')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Contatar via WhatsApp</span>
                              </a>

                              {renderDeleteButton('applications_admin', item.id, 'Excluir Candidatura')}
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Hero Header Card */}
          <div className="pkxd-glass rounded-3xl p-6 sm:p-8 text-left space-y-3">
            <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 px-3.5 py-1 rounded-full text-violet-800 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              Portal de Recrutamento & Destaques
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-slate-900">
              Área de <span className="text-violet-700">Inscrições</span>
            </h2>
            <p className="font-sans text-sm text-slate-600 leading-relaxed max-w-2xl">
              Inscreva-se para aparecer em destaque no portal, envie suas teorias exclusivas de PK XD ou candidate-se para a equipe de moderadores.
            </p>
          </div>

          {/* Creator Progress Analyzer Callout */}
          <div
            id="applications-creator-analyzer-callout"
            className="pkxd-glass-violet rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white border border-violet-200 text-violet-700 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Quer saber quanto falta para se tornar Creator Oficial do PK XD?
                </h4>
                <p className="text-xs text-slate-600">
                  Calcule seus inscritos, vídeos e métricas automaticamente com base nos requisitos oficiais.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (onOpenCreatorAnalyzer) {
                  onOpenCreatorAnalyzer();
                } else {
                  window.history.pushState({}, '', '/progresso-creator');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="pkxd-btn-primary px-4 py-2 rounded-2xl font-display font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Ver Meu Progresso</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Category Selector Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleTabChange('panel')}
              className={`p-4 rounded-2xl border-2 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                activeTab === 'panel'
                  ? 'bg-violet-600 text-white border-violet-700 shadow-sm'
                  : 'bg-white/75 backdrop-blur-md text-slate-700 border-white/80 hover:border-violet-300'
              }`}
            >
              <Video className="w-5 h-5" />
              <span className="text-center">Destaque de Vídeo</span>
            </button>

            <button
              onClick={() => handleTabChange('shorts')}
              className={`p-4 rounded-2xl border-2 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                activeTab === 'shorts'
                  ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                  : 'bg-white/75 backdrop-blur-md text-slate-700 border-white/80 hover:border-sky-300'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-center">Destaque de Shorts</span>
            </button>

            <button
              onClick={() => handleTabChange('theory')}
              className={`p-4 rounded-2xl border-2 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                activeTab === 'theory'
                  ? 'bg-pink-600 text-white border-pink-700 shadow-sm'
                  : 'bg-white/75 backdrop-blur-md text-slate-700 border-white/80 hover:border-pink-300'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-center">Enviar Teoria</span>
            </button>

            <button
              onClick={() => handleTabChange('admin')}
              className={`p-4 rounded-2xl border-2 font-display font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white/75 backdrop-blur-md text-slate-700 border-white/80 hover:border-amber-300'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-center">Ser Administrador</span>
            </button>
          </div>

          {/* Form Area */}
          <div className="pkxd-glass rounded-3xl p-6 sm:p-8 text-left">
            {submitStatus && (
              <div
                className={`p-4 rounded-2xl mb-6 flex items-start gap-3 border-2 ${
                  submitStatus.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {submitStatus.success ? <Check className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />}
                <span className="font-sans text-xs font-semibold leading-relaxed">{submitStatus.message}</span>
              </div>
            )}

            {!user?.email && (
              <div className="p-4 rounded-2xl mb-6 flex items-start gap-3 border-2 bg-amber-50 text-amber-900 border-amber-200">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-0.5">
                  <p className="font-sans text-xs font-bold">Você está enviando como Visitante</p>
                  <p className="font-sans text-xs text-amber-800">
                    Para salvar o histórico na sua conta e receber XP na nuvem, faça login antes de enviar sua inscrição.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === 'panel' && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-display font-bold text-lg text-violet-800">
                      Indicação de Criador / Destaque de Vídeo
                    </h3>
                    <p className="text-xs text-slate-600">
                      Indique seu canal ou sugira um criador talentoso de PK XD para entrar nos destaques do portal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome do Indicado / Criador *</label>
                      <input
                        type="text"
                        required
                        value={panelCreator}
                        onChange={(e) => setPanelCreator(e.target.value)}
                        placeholder="Ex: JogadorEstrela_PKXD"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Link do Vídeo / Live / Canal *</label>
                      <input
                        type="url"
                        required
                        value={panelUrl}
                        onChange={(e) => setPanelUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-xs font-bold text-violet-800 uppercase flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" />
                          <span>Foto Real do Indicado (Opcional)</span>
                        </label>
                        <p className="text-[11px] text-slate-600">
                          Envie uma foto do avatar/canal ou cole o link direto da imagem.
                        </p>
                      </div>

                      <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setPanelPhotoInputType('upload')}
                          className={`px-3 py-1 rounded-lg cursor-pointer ${
                            panelPhotoInputType === 'upload' ? 'bg-violet-600 text-white' : 'text-slate-600'
                          }`}
                        >
                          Upload Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setPanelPhotoInputType('url')}
                          className={`px-3 py-1 rounded-lg cursor-pointer ${
                            panelPhotoInputType === 'url' ? 'bg-violet-600 text-white' : 'text-slate-600'
                          }`}
                        >
                          Colar Link
                        </button>
                      </div>
                    </div>

                    {panelPhotoInputType === 'upload' ? (
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-violet-400 rounded-xl bg-white cursor-pointer">
                        <Upload className="w-5 h-5 text-violet-600 mb-1" />
                        <span className="text-xs font-bold text-slate-700">Clique para selecionar foto (Max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, setPanelCreatorPhoto)}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <input
                        type="url"
                        value={panelCreatorPhoto}
                        onChange={(e) => setPanelCreatorPhoto(e.target.value)}
                        placeholder="https://exemplo.com/foto.png"
                        className="w-full bg-white border-2 border-slate-200 focus:border-violet-500 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                      />
                    )}

                    {panelCreatorPhoto && (
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-violet-200">
                        <img
                          src={panelCreatorPhoto}
                          alt="Foto do Indicado"
                          className="w-12 h-12 rounded-xl object-cover border border-violet-300 shrink-0"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">Foto anexada com sucesso!</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPanelCreatorPhoto('')}
                          className="p-1.5 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                    <div className="border-b border-slate-200 pb-2 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                          <Link2 className="w-4 h-4 text-violet-700" />
                          <span>Redes Sociais do Indicado *</span>
                        </label>
                        <p className="text-[11px] text-slate-600">
                          Pelo menos uma rede social (Instagram, TikTok ou YouTube) é obrigatória.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-pink-700 uppercase flex items-center gap-1">
                          <Instagram className="w-3.5 h-3.5" />
                          <span>Instagram</span>
                        </label>
                        <input
                          type="text"
                          value={panelInstagram}
                          onChange={(e) => setPanelInstagram(e.target.value)}
                          placeholder="@usuario ou link"
                          className="w-full bg-white border-2 border-slate-200 focus:border-pink-500 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-sky-700 uppercase flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>TikTok</span>
                        </label>
                        <input
                          type="text"
                          value={panelTikTok}
                          onChange={(e) => setPanelTikTok(e.target.value)}
                          placeholder="@usuario ou link"
                          className="w-full bg-white border-2 border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
                          <Youtube className="w-3.5 h-3.5" />
                          <span>YouTube</span>
                        </label>
                        <input
                          type="text"
                          value={panelYouTube}
                          onChange={(e) => setPanelYouTube(e.target.value)}
                          placeholder="@canal ou link"
                          className="w-full bg-white border-2 border-slate-200 focus:border-rose-500 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição / Motivo da Indicação *</label>
                    <textarea
                      required
                      rows={3}
                      value={panelDescription}
                      onChange={(e) => setPanelDescription(e.target.value)}
                      placeholder="Conte um pouco sobre o criador ou vídeo..."
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-violet-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'shorts' && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-display font-bold text-lg text-sky-800">
                      Indicação de Shorts
                    </h3>
                    <p className="text-xs text-slate-600">
                      Indique seus curtas favoritos de PK XD para entrar no carrossel do portal!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome do Canal / Indicado *</label>
                      <input
                        type="text"
                        required
                        value={shortsCreator}
                        onChange={(e) => setShortsCreator(e.target.value)}
                        placeholder="Nome do Criador ou Canal"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL do Short *</label>
                      <input
                        type="url"
                        required
                        value={shortsUrl}
                        onChange={(e) => setShortsUrl(e.target.value)}
                        placeholder="https://www.youtube.com/shorts/..."
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold text-sky-800 uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        <span>Foto Real do Indicado (Opcional)</span>
                      </label>
                      <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setShortsPhotoInputType('upload')}
                          className={`px-3 py-1 rounded-lg cursor-pointer ${
                            shortsPhotoInputType === 'upload' ? 'bg-sky-600 text-white' : 'text-slate-600'
                          }`}
                        >
                          Upload Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setShortsPhotoInputType('url')}
                          className={`px-3 py-1 rounded-lg cursor-pointer ${
                            shortsPhotoInputType === 'url' ? 'bg-sky-600 text-white' : 'text-slate-600'
                          }`}
                        >
                          Colar Link
                        </button>
                      </div>
                    </div>

                    {shortsPhotoInputType === 'upload' ? (
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl bg-white cursor-pointer">
                        <Upload className="w-5 h-5 text-sky-600 mb-1" />
                        <span className="text-xs font-bold text-slate-700">Clique para selecionar foto (Max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, setShortsCreatorPhoto)}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <input
                        type="url"
                        value={shortsCreatorPhoto}
                        onChange={(e) => setShortsCreatorPhoto(e.target.value)}
                        placeholder="https://exemplo.com/foto.png"
                        className="w-full bg-white border-2 border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                      />
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                    <label className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-sky-700" />
                      <span>Redes Sociais do Indicado * (Mínimo 1)</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={shortsInstagram}
                        onChange={(e) => setShortsInstagram(e.target.value)}
                        placeholder="Instagram (@usuario)"
                        className="w-full bg-white border-2 border-slate-200 focus:border-pink-500 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                      />
                      <input
                        type="text"
                        value={shortsTikTok}
                        onChange={(e) => setShortsTikTok(e.target.value)}
                        placeholder="TikTok (@usuario)"
                        className="w-full bg-white border-2 border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                      />
                      <input
                        type="text"
                        value={shortsYouTube}
                        onChange={(e) => setShortsYouTube(e.target.value)}
                        placeholder="YouTube (@canal)"
                        className="w-full bg-white border-2 border-slate-200 focus:border-rose-500 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Título do Short *</label>
                    <input
                      type="text"
                      required
                      value={shortsTitle}
                      onChange={(e) => setShortsTitle(e.target.value)}
                      placeholder="Ex: MINHA NOVA ARMADURA DO PK XD!"
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'theory' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-display font-bold text-lg text-pink-700">
                      Enviar Nova Teoria ao Mural
                    </h3>
                    <p className="text-xs text-slate-600">
                      Compartilhe suas teorias sobre as próximas atualizações e mistérios do universo PK XD.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Autor / Nickname *</label>
                      <input
                        type="text"
                        required
                        value={theoryAuthor}
                        onChange={(e) => setTheoryAuthor(e.target.value)}
                        placeholder="Seu nome de fã"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-pink-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Título da Teoria *</label>
                      <input
                        type="text"
                        required
                        value={theoryTitle}
                        onChange={(e) => setTheoryTitle(e.target.value)}
                        placeholder="Ex: O Retorno Secreto da Nave Alienígena!"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-pink-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sua Teoria Completa *</label>
                    <textarea
                      required
                      rows={5}
                      value={theoryContent}
                      onChange={(e) => setTheoryContent(e.target.value)}
                      placeholder="Descreva em detalhes a sua teoria..."
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-pink-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-display font-bold text-lg text-amber-700">
                      Candidatura para Administrador (ADM)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Faça parte do time PKXD Central para organizar eventos, novidades e moderar a comunidade.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome Completo / Nickname *</label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1 col-span-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sua Idade *</label>
                      <input
                        type="number"
                        required
                        value={adminAge}
                        onChange={(e) => setAdminAge(e.target.value)}
                        placeholder="Ex: 14"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contato (Discord, WhatsApp, E-mail) *</label>
                      <input
                        type="text"
                        required
                        value={adminContact}
                        onChange={(e) => setAdminContact(e.target.value)}
                        placeholder="Seu ID do Discord ou WhatsApp"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Horas Disponíveis por Semana *</label>
                      <input
                        type="text"
                        required
                        value={adminHours}
                        onChange={(e) => setAdminHours(e.target.value)}
                        placeholder="Ex: 10 horas por semana"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Por que quer ser Admin? *</label>
                    <textarea
                      required
                      rows={4}
                      value={adminReason}
                      onChange={(e) => setAdminReason(e.target.value)}
                      placeholder="Conte sua experiência e o que gostaria de ajudar..."
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl p-3 text-xs text-slate-900 outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 px-6 rounded-2xl font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                  isSubmitting
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : activeTab === 'shorts'
                    ? 'pkxd-btn-cyan'
                    : activeTab === 'admin'
                    ? 'pkxd-btn-gold'
                    : 'pkxd-btn-primary'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando Dados...' : 'Enviar Inscrição Oficial'}</span>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

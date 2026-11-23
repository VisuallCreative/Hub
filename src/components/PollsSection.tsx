import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, orderBy, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Poll } from '../types';
import { playTapSound, playSuccessSound } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Vote, AlertCircle, CheckCircle2, History, PlusCircle, X, Send, Sparkles, Plus, Loader2, Share2, Copy, Upload, Link2, Check } from 'lucide-react';

interface PollsSectionProps {
  onAddXP: (amount: number, reason: string) => void;
  isAdmin: boolean;
}

export default function PollsSection({ onAddXP, isAdmin }: PollsSectionProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [votingStatus, setVotingStatus] = useState<Record<string, 'idle' | 'voting' | 'success' | 'error'>>({});
  const [pollErrors, setPollErrors] = useState<Record<string, string>>({});

  // Poll Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [, setImageFile] = useState<File | null>(null);
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Load voted polls from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pkxd_voted_polls');
      if (saved) {
        setVotedPolls(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not parse voted polls from localStorage', e);
    }
  }, []);

  // Subscribe to polls from firestore
  useEffect(() => {
    const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPolls: Poll[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedPolls.push({
          id: docSnap.id,
          question: data.question || '',
          options: data.options || [],
          createdAt: data.createdAt || Date.now(),
          isActive: data.isActive !== false,
          totalVotes: data.totalVotes || 0,
          imageUrl: data.imageUrl || undefined,
        });
      });
      setPolls(loadedPolls);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to polls:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setModalError('Por favor, escolha uma imagem menor que 3MB.');
        return;
      }
      setModalError(null);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSharePoll = (poll: Poll) => {
    playTapSound();
    const shareUrl = `${window.location.origin}${window.location.pathname}?enquete=${poll.id}#polls-section`;
    if (navigator.share) {
      navigator.share({
        title: `Enquete PK XD: ${poll.question}`,
        text: `Dê o seu voto na enquete "${poll.question}" no PKXD Central!`,
        url: shareUrl,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Link da enquete copiado com sucesso!');
    }
  };

  const handleVote = async (pollId: string) => {
    const optionId = selectedOptions[pollId];
    if (!optionId) {
      playTapSound();
      setPollErrors(prev => ({ ...prev, [pollId]: 'Selecione uma opção antes de enviar seu voto.' }));
      return;
    }

    if (votedPolls.includes(pollId)) {
      playTapSound();
      return;
    }

    playTapSound();
    setPollErrors(prev => {
      const next = { ...prev };
      delete next[pollId];
      return next;
    });
    setVotingStatus(prev => ({ ...prev, [pollId]: 'voting' }));

    try {
      const pollRef = doc(db, 'polls', pollId);
      const poll = polls.find(p => p.id === pollId);
      if (!poll) throw new Error('Enquete não encontrada!');

      const updatedOptions = poll.options.map((opt) => {
        if (opt.id === optionId) {
          return { ...opt, votes: (opt.votes || 0) + 1 };
        }
        return opt;
      });

      await updateDoc(pollRef, {
        options: updatedOptions,
        totalVotes: increment(1)
      });

      const newVoted = [...votedPolls, pollId];
      setVotedPolls(newVoted);
      localStorage.setItem('pkxd_voted_polls', JSON.stringify(newVoted));

      setVotingStatus(prev => ({ ...prev, [pollId]: 'success' }));
      playSuccessSound();
      onAddXP(50, 'Votou na Enquete de Atualização! 📊');
    } catch (err: any) {
      console.error('Error casting vote:', err);
      setVotingStatus(prev => ({ ...prev, [pollId]: 'error' }));
      setPollErrors(prev => ({
        ...prev,
        [pollId]: 'Não foi possível registrar o voto no momento. Tente novamente! (' + (err?.message || err) + ')'
      }));
    }
  };

  const handleSelectOption = (pollId: string, optionId: string) => {
    playTapSound();
    setPollErrors(prev => {
      const next = { ...prev };
      delete next[pollId];
      return next;
    });
    setSelectedOptions(prev => ({ ...prev, [pollId]: optionId }));
  };

  const handleAddOptionField = () => {
    if (newOptions.length >= 6) {
      setModalError('Máximo de 6 opções por enquete.');
      return;
    }
    setModalError(null);
    playTapSound();
    setNewOptions(prev => [...prev, '']);
  };

  const handleRemoveOptionField = (index: number) => {
    if (newOptions.length <= 2) {
      setModalError('A enquete precisa de no mínimo 2 opções.');
      return;
    }
    setModalError(null);
    playTapSound();
    setNewOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrSuggestPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    setCreatedShareUrl(null);
    setCopiedLink(false);

    const cleanQ = newQuestion.trim();
    if (!cleanQ) {
      setModalError('Por favor, digite a pergunta da enquete.');
      return;
    }

    const cleanOpts = newOptions.map(o => o.trim()).filter(o => o !== '');
    if (cleanOpts.length < 2) {
      setModalError('Por favor, preencha pelo menos duas opções de resposta.');
      return;
    }

    setIsSubmittingPoll(true);
    playTapSound();

    try {
      if (isAdmin) {
        const activePollsSnapshot = polls.filter(p => p.isActive);
        for (const activePoll of activePollsSnapshot) {
          const pRef = doc(db, 'polls', activePoll.id);
          try {
            await setDoc(pRef, { isActive: false, admin_secret: 'pkxd2026_super_secret_admin_key' }, { merge: true });
          } catch (e) {
            console.warn('Could not deactivate previous poll:', e);
          }
        }

        const pollId = 'poll_' + Date.now();
        const pollRef = doc(db, 'polls', pollId);
        const optionsArray = cleanOpts.map((opt, idx) => ({
          id: `opt_${idx}_${Date.now()}`,
          text: opt,
          votes: 0
        }));

        const pollData: Record<string, any> = {
          id: pollId,
          question: cleanQ,
          options: optionsArray,
          createdAt: Date.now(),
          isActive: true,
          totalVotes: 0,
          admin_secret: 'pkxd2026_super_secret_admin_key'
        };
        if (newImageUrl.trim()) {
          pollData.imageUrl = newImageUrl.trim();
        }

        await setDoc(pollRef, pollData);

        const shareUrl = `${window.location.origin}${window.location.pathname}?enquete=${pollId}#polls-section`;
        setCreatedShareUrl(shareUrl);

        playSuccessSound();
        onAddXP(100, 'Criou uma nova Enquete Oficial! 📊');
        setModalSuccess('Enquete criada e publicada com sucesso no fã-clube!');
      } else {
        const suggestionId = 'sug_poll_' + Date.now();
        const sugRef = doc(db, 'suggested_polls', suggestionId);

        const sugData: Record<string, any> = {
          id: suggestionId,
          question: cleanQ,
          options: cleanOpts,
          createdAt: Date.now(),
          authorName: localStorage.getItem('pkxd_nickname') || 'Fã Anonimo',
          status: 'pending'
        };
        if (newImageUrl.trim()) {
          sugData.imageUrl = newImageUrl.trim();
        }

        await setDoc(sugRef, sugData);

        playSuccessSound();
        onAddXP(30, 'Sugeriu uma Enquete para o Fã-Clube! 🔮');
        setModalSuccess('Sua sugestão de enquete foi enviada para a Administração! Obrigado!');
        setTimeout(() => {
          setShowCreateModal(false);
          setNewQuestion('');
          setNewOptions(['', '']);
          setNewImageUrl('');
          setImageFile(null);
          setModalSuccess(null);
        }, 2200);
      }
    } catch (err: any) {
      console.error('Erro ao salvar enquete:', err);
      setModalError('Ocorreu um erro ao salvar a enquete: ' + (err?.message || String(err)));
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  const getPercentage = (votes: number, total: number) => {
    if (!total) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <div className="pkxd-glass rounded-3xl flex flex-col items-center justify-center p-12 text-slate-600">
        <Loader2 className="w-8 h-8 text-[#0284C7] animate-spin mb-3" />
        <span className="font-mono text-xs uppercase font-bold tracking-wider">Carregando Enquetes...</span>
      </div>
    );
  }

  const activePolls = polls.filter(p => p.isActive);
  const inactivePolls = polls.filter(p => !p.isActive);

  return (
    <section id="polls-section" className="pkxd-glass rounded-3xl p-6 sm:p-8 space-y-6 text-left relative">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-[#0284C7] text-white font-sans text-xs font-extrabold uppercase px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF8FF] border-2 border-sky-200 text-[#0284C7] flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900">
              Enquetes e Opiniões
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-600">
              Dê o seu voto, expresse a sua opinião e decida as melhores ideias para o PK XD com a comunidade.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            playTapSound();
            setShowCreateModal(true);
            setModalError(null);
            setModalSuccess(null);
            setCreatedShareUrl(null);
            setNewImageUrl('');
            setImageFile(null);
          }}
          className="pkxd-btn-cyan px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isAdmin ? 'Criar Nova Enquete' : 'Sugerir Enquete (+30 XP)'}</span>
        </button>
      </div>

      {/* Active Polls Container */}
      <div className="max-h-[600px] overflow-y-auto pr-1 sm:pr-2 space-y-5 custom-scrollbar">
        {activePolls.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
            <p className="text-sm font-semibold text-slate-600">
              Nenhuma enquete ativa no momento. Seja o primeiro a sugerir ou criar uma!
            </p>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setShowCreateModal(true);
              }}
              className="pkxd-btn-outline px-4 py-2 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#6D28D9]" />
              <span>{isAdmin ? 'Criar Enquete Agora' : 'Sugerir Ideia de Enquete'}</span>
            </button>
          </div>
        ) : (
          activePolls.map((poll) => {
            const alreadyVoted = votedPolls.includes(poll.id);
            const showResults = alreadyVoted;
            const currentSelected = selectedOptions[poll.id] || '';
            const status = votingStatus[poll.id] || 'idle';
            const errorText = pollErrors[poll.id];

            return (
              <div
                key={poll.id}
                className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-sky-300 transition-colors"
              >
                {/* Active Tag & Share Button */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 flex-wrap">
                  <span className="text-[11px] bg-sky-100 border border-sky-300 text-sky-800 px-3 py-1 rounded-full font-sans font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5">
                    <Vote className="w-3.5 h-3.5 text-[#0284C7]" />
                    Enquete Ativa
                  </span>

                  <div className="flex items-center gap-2">
                    {alreadyVoted && (
                      <span className="text-[11px] bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full font-sans font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Votado
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSharePoll(poll)}
                      className="px-3 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border-2 border-slate-200 hover:border-sky-300 text-xs font-extrabold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      title="Compartilhar Enquete"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartilhar</span>
                    </button>
                  </div>
                </div>

                {/* Optional Poll Photo Banner */}
                {poll.imageUrl && (
                  <div className="relative w-full max-h-60 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white">
                    <img
                      src={poll.imageUrl}
                      alt={poll.question}
                      className="w-full h-full object-cover max-h-60"
                    />
                  </div>
                )}

                {/* Question */}
                <h4 className="font-display font-bold text-slate-900 text-lg sm:text-xl leading-snug">
                  {poll.question}
                </h4>

                {/* Options list */}
                <div className="space-y-3 pt-1">
                  {showResults ? (
                    <div className="space-y-3">
                      {poll.options.map((option) => {
                        const pct = getPercentage(option.votes || 0, poll.totalVotes);
                        return (
                          <div key={option.id} className="space-y-1.5">
                            <div className="flex justify-between text-xs sm:text-sm text-slate-800 font-sans font-bold px-0.5 gap-2">
                              <span>{option.text}</span>
                              <span className="font-mono tabular-nums text-[#0284C7] font-extrabold shrink-0">
                                {pct}% ({option.votes || 0} {option.votes === 1 ? 'voto' : 'votos'})
                              </span>
                            </div>
                            <div className="h-3.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-[#0284C7] to-[#6D28D9] rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {poll.options.map((option) => {
                        const isSelected = currentSelected === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectOption(poll.id, option.id)}
                            className={`w-full p-3.5 rounded-2xl text-left text-xs sm:text-sm font-sans font-bold flex items-center gap-3 transition-all border-2 cursor-pointer select-none ${
                              isSelected
                                ? 'bg-[#EFF8FF] border-[#0284C7] text-sky-900 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? 'border-[#0284C7] bg-sky-100' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-2.5 h-2.5 bg-[#0284C7] rounded-full" />}
                            </div>
                            <span>{option.text}</span>
                          </button>
                        );
                      })}

                      {errorText && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorText}</span>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={!currentSelected || status === 'voting'}
                          onClick={() => handleVote(poll.id)}
                          className="pkxd-btn-cyan px-6 py-2.5 disabled:opacity-45 disabled:pointer-events-none text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Vote className="w-4 h-4" />
                          <span>{status === 'voting' ? 'Processando...' : 'Enviar Meu Voto'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer status */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums pt-3 border-t border-slate-200">
                  <span>{poll.totalVotes} votos no total</span>
                  {alreadyVoted && (
                    <span className="text-emerald-700 font-sans font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Voto registrado!
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Closed Polls (History) */}
      {inactivePolls.length > 0 && (
        <div className="space-y-4 pt-5 border-t-2 border-slate-100">
          <h4 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Histórico de Enquetes Encerradas</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactivePolls.map((poll) => (
              <div
                key={poll.id}
                className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] bg-slate-200 border border-slate-300 text-slate-700 px-2.5 py-0.5 rounded-full font-sans font-extrabold uppercase tracking-wider">
                    Encerrada
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 font-bold">{poll.totalVotes} votos</span>
                    <button
                      type="button"
                      onClick={() => handleSharePoll(poll)}
                      className="p-1.5 text-sky-600 hover:bg-sky-100 rounded-lg cursor-pointer transition-colors"
                      title="Compartilhar Enquete"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {poll.imageUrl && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-white">
                    <img src={poll.imageUrl} alt={poll.question} className="w-full h-full object-cover" />
                  </div>
                )}

                <h5 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-snug">
                  {poll.question}
                </h5>

                <div className="space-y-2.5 pt-1">
                  {poll.options.map((option) => {
                    const pct = getPercentage(option.votes || 0, poll.totalVotes);
                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-700 font-sans font-semibold px-0.5 gap-2">
                          <span>{option.text}</span>
                          <span className="font-mono tabular-nums text-slate-600 font-bold shrink-0">
                            {pct}% ({option.votes || 0})
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-slate-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE CRIAR OU SUGERIR ENQUETE */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="pkxd-glass-modal rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 text-left relative overflow-y-auto max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#EFF8FF] border border-sky-200 text-[#0284C7]">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    {isAdmin ? 'Criar Nova Enquete Oficial' : 'Sugerir Enquete para o Fã-Clube'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setShowCreateModal(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Modal */}
              <form onSubmit={handleCreateOrSuggestPoll} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Pergunta da Enquete *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Qual dessas novas roupas você quer na próxima atualização?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7] transition-colors"
                  />
                </div>

                {/* Option to Add Photo / Image */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Foto / Banner da Enquete (Opcional)
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-800 text-xs font-extrabold rounded-xl cursor-pointer inline-flex items-center gap-2 transition-colors shrink-0">
                        <Upload className="w-4 h-4 text-[#0284C7]" />
                        <span>Carregar do Dispositivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-slate-500">ou cole um link abaixo:</span>
                    </div>

                    <input
                      type="url"
                      placeholder="https://exemplo.com/imagem_enquete.png"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7] font-mono"
                    />

                    {newImageUrl && (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 h-36 bg-slate-100">
                        <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setNewImageUrl('');
                            setImageFile(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-rose-600 text-slate-800 hover:text-white rounded-lg shadow transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Opções de Resposta * (mínimo 2)
                    </label>
                    <span className="text-xs font-mono tabular-nums text-slate-500 font-bold">
                      {newOptions.length}/6 opções
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {newOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 font-mono w-6">#{idx + 1}</span>
                        <input
                          type="text"
                          required={idx < 2}
                          placeholder={`Opção ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newOptions];
                            updated[idx] = e.target.value;
                            setNewOptions(updated);
                          }}
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7]"
                        />
                        {newOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionField(idx)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {newOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      className="mt-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-[#0284C7] border-2 border-slate-200 text-xs font-extrabold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Outra Opção</span>
                    </button>
                  )}
                </div>

                {modalError && (
                  <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl font-sans flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{modalError}</span>
                  </p>
                )}

                {modalSuccess && (
                  <div className="space-y-3 bg-emerald-50 border-2 border-emerald-200 p-3.5 rounded-2xl text-left">
                    <p className="text-xs text-emerald-800 font-sans font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{modalSuccess}</span>
                    </p>

                    {createdShareUrl && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-200">
                        <span className="text-[11px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5" />
                          Link direto para compartilhar:
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={createdShareUrl}
                            className="flex-1 bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-800 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              navigator.clipboard?.writeText(createdShareUrl);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2500);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedLink ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setShowCreateModal(false);
                      setCreatedShareUrl(null);
                    }}
                    className="pkxd-btn-outline px-4 py-2.5 text-xs font-extrabold cursor-pointer"
                  >
                    {createdShareUrl ? 'Fechar' : 'Cancelar'}
                  </button>

                  {!createdShareUrl && (
                    <button
                      type="submit"
                      disabled={isSubmittingPoll}
                      className="pkxd-btn-cyan px-5 py-2.5 disabled:opacity-50 text-xs flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmittingPoll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{isAdmin ? 'Publicar Enquete Oficial' : 'Enviar Sugestão (+30 XP)'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Sparkles, CheckCircle2,
  Gift, Compass, RotateCw
} from 'lucide-react';
import { DailyMission } from '../types';

interface MissionsSectionProps {
  fanLevel: number;
  fanXP: number;
  onAddXP: (amount: number, reason: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
  soundEnabled: boolean;
}

export default function MissionsSection({
  fanLevel,
  fanXP,
  onAddXP,
  triggerAudio,
}: MissionsSectionProps) {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [notif, setNotif] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const defaultMissions: DailyMission[] = [
    {
      id: 'm1',
      title: '🔥 Aquecer os Motores',
      description: 'Resgate seu Foguinho Diário no painel de Nível de Fã para garantir sua sequência de fogos!',
      xpReward: 150,
      completed: false,
      claimed: false,
      type: 'visit_whatsapp'
    },
    {
      id: 'm2',
      title: '🎡 Girar a Roleta da Sorte',
      description: 'Gire a Roleta da Sorte para ganhar bônus instantâneos de XP!',
      xpReward: 100,
      completed: false,
      claimed: false,
      type: 'spin'
    },
    {
      id: 'm3',
      title: '🎁 Abrir o Baú Secreto',
      description: 'Abra o Baú Secreto de recompensas diárias para descobrir prêmios extras!',
      xpReward: 120,
      completed: false,
      claimed: false,
      type: 'chest'
    },
    {
      id: 'm4',
      title: '💬 Voz da Comunidade',
      description: 'Faça uma publicação no Mural da Comunidade para compartilhar ideias com outros fãs!',
      xpReward: 200,
      completed: false,
      claimed: false,
      type: 'post'
    },
    {
      id: 'm5',
      title: '💖 Apreciação Lendária',
      description: 'Curta pelo menos uma postagem no mural ou teoria da comunidade!',
      xpReward: 80,
      completed: false,
      claimed: false,
      type: 'like'
    }
  ];

  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const lastCheck = localStorage.getItem('pkxd_missions_last_check_date');
      const savedMissions = localStorage.getItem('pkxd_daily_missions_state');

      if (lastCheck === today && savedMissions) {
        setMissions(JSON.parse(savedMissions));
      } else {
        localStorage.setItem('pkxd_missions_last_check_date', today);
        localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(defaultMissions));
        setMissions(defaultMissions);
      }
    } catch {
      setMissions(defaultMissions);
    }
  }, []);

  useEffect(() => {
    const checkCompletionChanges = () => {
      try {
        const savedMissions = localStorage.getItem('pkxd_daily_missions_state');
        if (savedMissions) {
          const parsed = JSON.parse(savedMissions) as DailyMission[];
          const lastClaim = localStorage.getItem('pkxd_last_claim_date');
          const today = new Date().toDateString();
          const hasClaimedFoguinho = lastClaim === today;

          let changed = false;
          const updated = parsed.map(m => {
            if (m.id === 'm1' && hasClaimedFoguinho && !m.completed) {
              m.completed = true;
              changed = true;
            }
            return m;
          });

          if (changed) {
            localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(updated));
            setMissions(updated);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    checkCompletionChanges();
    const interval = setInterval(checkCompletionChanges, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimMission = (id: string, xpReward: number) => {
    triggerAudio('levelUp');

    const updated = missions.map(m => {
      if (m.id === id) {
        return { ...m, claimed: true };
      }
      return m;
    });

    setMissions(updated);
    try {
      localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(updated));
    } catch {}

    onAddXP(xpReward, 'Recompensa de Missão Coletada! 🎁');
    showNotification(`Coletado com sucesso! +${xpReward} XP adicionados!`);
  };

  const handleResetMissions = () => {
    triggerAudio('tap');
    const reset = defaultMissions.map(m => ({ ...m, completed: false, claimed: false }));
    setMissions(reset);
    try {
      localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(reset));
      localStorage.setItem('pkxd_missions_last_check_date', new Date().toDateString());
    } catch {}
    showNotification('Missões diárias reiniciadas para você completar!');
  };

  const completedCount = missions.filter(m => m.completed).length;
  const progressPercent = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0;

  return (
    <div id="missions-section-container" className="space-y-6">
      {/* Floating Alert Box */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-50 bg-[#FACC15] text-slate-900 font-extrabold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border-2 border-slate-900 text-xs sm:text-sm font-sans"
          >
            <Sparkles className="w-4 h-4 text-slate-900" />
            <span>{notif}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missions Summary Header Banner */}
      <div className="pkxd-glass rounded-3xl p-6 sm:p-8 space-y-4 text-left">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFBEB] border border-amber-300 text-amber-800 font-extrabold text-xs uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>PKXD Central • Desafios Diários</span>
          </div>

          <button
            onClick={handleResetMissions}
            className="pkxd-btn-outline px-3.5 py-2 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
            title="Clique para reiniciar as missões diárias"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reiniciar Missões</span>
          </button>
        </div>

        <h3 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
          Painel de Missões Diárias
        </h3>

        <p className="font-sans text-sm text-slate-600 leading-relaxed max-w-4xl">
          Complete as missões diárias abaixo para ganhar bônus extras de XP, subir de nível no ranking da comunidade e desbloquear novas conquistas.
        </p>

        {/* Global Progress Bar */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-500 font-bold uppercase">Progresso de hoje:</span>
            <span className="text-[#6D28D9] font-extrabold">
              {completedCount} de {missions.length} completadas ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3.5 bg-slate-100 rounded-full p-0.5 border border-slate-200 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FACC15] via-amber-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Missions Checklist */}
        <div className="lg:col-span-2 pkxd-glass rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Lista de Objetivos</span>
            </h4>
          </div>

          <div className="max-h-[520px] overflow-y-auto pr-1 sm:pr-2 space-y-3 custom-scrollbar">
            {missions.map((mission) => {
              let stateBadge = 'bg-slate-100 text-slate-600 border-slate-200';
              let badgeText = 'Pendente';

              if (mission.completed) {
                if (mission.claimed) {
                  stateBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  badgeText = 'Reivindicado';
                } else {
                  stateBadge = 'bg-amber-100 text-amber-900 border-amber-300';
                  badgeText = 'Completo!';
                }
              }

              return (
                <div
                  key={mission.id}
                  className={`p-4 border-2 rounded-2xl text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                    mission.completed
                      ? mission.claimed
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : 'border-amber-300 bg-[#FFFBEB]'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-display font-bold text-sm sm:text-base text-slate-900">
                        {mission.title}
                      </h5>
                      <span className={`text-[10px] font-sans font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${stateBadge}`}>
                        {badgeText}
                      </span>
                    </div>
                    <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-slate-200 pt-3 sm:pt-0 shrink-0">
                    <span className="font-mono tabular-nums text-xs sm:text-sm font-extrabold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                      +{mission.xpReward} XP
                    </span>

                    {mission.completed && !mission.claimed ? (
                      <button
                        onClick={() => handleClaimMission(mission.id, mission.xpReward)}
                        className="pkxd-btn-gold px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Resgatar</span>
                      </button>
                    ) : mission.claimed ? (
                      <div className="text-xs font-extrabold text-emerald-700 font-sans uppercase bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
                        Pronto
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-500 font-sans bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                        Em aberto
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="pkxd-glass rounded-3xl p-5 sm:p-6 text-left space-y-4">
            <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#0284C7]" />
              <span>Como subir no Ranking</span>
            </h4>
            <p className="text-xs sm:text-sm font-sans text-slate-600 leading-relaxed">
              Toda vez que você completa uma missão diária ou participa dos desafios de fã, seu nível é atualizado no placar da comunidade.
            </p>
            <div className="space-y-2.5 border-t border-slate-100 pt-3 bg-slate-50 rounded-2xl p-3.5 border">
              <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                <span className="text-slate-600 font-semibold">Nível Atual:</span>
                <span className="text-slate-900 font-extrabold">Nível {fanLevel}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                <span className="text-slate-600 font-semibold">Progresso do Nível:</span>
                <span className="text-[#6D28D9] font-extrabold">{fanXP}/100 XP</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                <span className="text-slate-600 font-semibold">Total de Fogos:</span>
                <span className="text-orange-600 font-extrabold">🔥 {localStorage.getItem('pkxd_fire_streak') || 1}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Dica: Resgatar o bônus das missões garante saltos maiores no placar geral da PKXD Central.
            </p>
          </div>

          <div className="pkxd-glass-violet rounded-3xl p-5 sm:p-6 text-left space-y-2.5 shadow-sm">
            <h4 className="font-display font-bold text-base text-[#6D28D9]">
              Novidades da Comunidade
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              Suas conquistas agora aparecem no seu PKXD ID e no perfil social para todos os exploradores da comunidade acompanharem!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

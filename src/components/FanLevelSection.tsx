import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Sparkles, CheckCircle2, User, Edit2, Check, Award, Instagram, Lock, Mail } from 'lucide-react';
import { playTapSound, playSuccessSound } from '../utils/audio';
import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, limit, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

const maskEmail = (email?: string | null): string => {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const local = parts[0];
  const domain = parts[1];
  if (local.length <= 3) {
    return `${local.slice(0, 1)}***@${domain}`;
  }
  return `${local.slice(0, 3)}***@${domain}`;
};

interface FanLevelSectionProps {
  level: number;
  xp: number;
  onAddXP: (amount: number, reason: string) => void;
  onLevelUp: () => void;
  soundEnabled: boolean;
  user?: any;
  onLogin?: () => void;
  onLoginRedirect?: () => void;
  onLogout?: () => void;
  onEmailLogin?: (email: string, pass: string) => void;
  onEmailRegister?: (email: string, pass: string, nickname: string) => void;
  authError?: string | null;
  isAdmin?: boolean;
  setFanLevel?: (level: number) => void;
  setFanXP?: (xp: number) => void;
  pendingEmailVerification?: {
    email: string;
    pass: string;
    nickname: string;
    code: string;
    createdAt: number;
  } | null;
  verificationCodeInput?: string;
  setVerificationCodeInput?: (code: string) => void;
  onConfirmEmailCode?: () => void;
  onCancelVerification?: () => void;
  resendCooldown?: number;
  onResendCode?: () => void;
  isAuthenticating?: boolean;
}

interface RankedPlayer {
  id: string;
  name: string;
  level: number;
  xp: number;
  flames: number;
  isCurrentUser?: boolean;
  instagram?: string;
  instagramPublic?: boolean;
  photoUrl?: string;
  email?: string;
}

export default function FanLevelSection({
  level,
  xp,
  onAddXP,
  soundEnabled,
  user,
  onLogin,
  onLoginRedirect,
  onLogout,
  onEmailLogin,
  onEmailRegister,
  authError: outerAuthError,
  isAdmin = false,
  setFanLevel,
  setFanXP,
  pendingEmailVerification,
  verificationCodeInput,
  setVerificationCodeInput,
  onConfirmEmailCode,
  onCancelVerification,
  resendCooldown,
  onResendCode,
  isAuthenticating
}: FanLevelSectionProps) {
  const [hasClaimedDaily, setHasClaimedDaily] = useState(() => {
    try {
      const lastClaim = localStorage.getItem('pkxd_last_claim_date');
      if (!lastClaim) return false;
      return lastClaim === new Date().toDateString();
    } catch {
      return false;
    }
  });

  const [fireStreak, setFireStreak] = useState(() => {
    try {
      const saved = localStorage.getItem('pkxd_fire_streak');
      if (saved) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 1 : parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return 1;
  });

  const [nickname, setNickname] = useState(() => {
    try {
      return localStorage.getItem('pkxd_username_nickname') || 'Jogador_Convidado';
    } catch {
      return 'Jogador_Convidado';
    }
  });
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickInput, setNickInput] = useState(nickname);

  const [instagram, setInstagram] = useState(() => {
    try {
      return localStorage.getItem('pkxd_user_instagram') || '';
    } catch {
      return '';
    }
  });
  const [instagramPublic, setInstagramPublic] = useState(() => {
    try {
      return localStorage.getItem('pkxd_user_instagram_public') === 'false' ? false : true;
    } catch {
      return true;
    }
  });

  const [instagramForm, setInstagramForm] = useState('');
  const [instagramPublicForm, setInstagramPublicForm] = useState(true);
  const [instaInput, setInstaInput] = useState('');
  const [instaPublicInput, setInstaPublicInput] = useState(true);
  const [notif, setNotif] = useState<string | null>(null);
  const [confirmDeletePlayerId, setConfirmDeletePlayerId] = useState<string | null>(null);

  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [emailForm, setEmailForm] = useState('');
  const [passwordForm, setPasswordForm] = useState('');
  const [nicknameForm, setNicknameForm] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [clientId] = useState(() => {
    try {
      let saved = localStorage.getItem('pkxd_user_clientId');
      if (!saved) {
        saved = 'u_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('pkxd_user_clientId', saved);
      }
      return saved;
    } catch {
      return 'u_fallback_' + Math.random().toString(36).substring(2, 5);
    }
  });

  const activePlayerId = user?.uid || clientId;
  const [dbPlayers, setDbPlayers] = useState<RankedPlayer[]>([]);
  const [leaderboard, setLeaderboard] = useState<RankedPlayer[]>([]);
  const [localPhotoUrl, setLocalPhotoUrl] = useState(() => localStorage.getItem('pkxd_custom_profile_image') || '');

  useEffect(() => {
    const handleStorageChange = () => {
      setLocalPhotoUrl(localStorage.getItem('pkxd_custom_profile_image') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  interface MonthlyWinner {
    winnerName: string;
    winnerLevel: number;
    winnerFlames: number;
    winnerXp: number;
    lastCheckedMonth: number;
    lastCheckedYear: number;
    recordedAt: number;
  }
  const [monthlyWinner, setMonthlyWinner] = useState<MonthlyWinner | null>(null);

  const [activeXpTab, setActiveXpTab] = useState<'daily' | 'wheel' | 'chest'>('daily');

  // A. Lucky Wheel
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<{ amount: number; message: string } | null>(null);
  const [wheelCooldown, setWheelCooldown] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pkxd_next_wheel_spin');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [wheelTimeLeft, setWheelTimeLeft] = useState(0);

  useEffect(() => {
    if (wheelCooldown <= 0) return;
    const updateTimer = () => {
      const now = Date.now();
      setWheelTimeLeft(Math.max(0, Math.ceil((wheelCooldown - now) / 1000)));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [wheelCooldown]);

  const handleSpinWheel = () => {
    if (isSpinning || wheelTimeLeft > 0) return;
    setIsSpinning(true);
    setWheelResult(null);
    if (soundEnabled) playTapSound();

    setTimeout(() => {
      const rewards = [
        { amount: 150, text: '⭐ Super Sorte' },
        { amount: 250, text: '🔥 Brilho de Fogo' },
        { amount: 100, text: '⚡ Gíria Cósmica' },
        { amount: 300, text: '👑 Baú Lendário!' },
        { amount: 150, text: '🔮 Orbe Divino' },
        { amount: 200, text: '🛸 Nave do Admin' }
      ];
      const selected = rewards[Math.floor(Math.random() * rewards.length)];
      setWheelResult({ amount: selected.amount, message: selected.text });
      setIsSpinning(false);

      addXP(selected.amount, `${selected.text} da Roleta! 🎡`);

      const nextSpinTime = Date.now() + 3 * 60 * 60 * 1000;
      setWheelCooldown(nextSpinTime);
      try {
        localStorage.setItem('pkxd_next_wheel_spin', nextSpinTime.toString());
      } catch {}
    }, 2400);
  };

  // B. Secret Mystery Chest
  const [chestTaps, setChestTaps] = useState(0);
  const [chestMaxTaps] = useState(8);
  const [isChestBroken, setIsChestBroken] = useState(false);
  const [chestReward, setChestReward] = useState<{ amount: number; name: string; rarity: string } | null>(null);
  const [chestCooldown, setChestCooldown] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pkxd_next_chest_hunt');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [chestTimeLeft, setChestTimeLeft] = useState(0);

  useEffect(() => {
    if (chestCooldown <= 0) return;
    const updateTimer = () => {
      const now = Date.now();
      setChestTimeLeft(Math.max(0, Math.ceil((chestCooldown - now) / 1000)));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [chestCooldown]);

  const handleTapChest = () => {
    if (isChestBroken || chestTimeLeft > 0) return;

    const nextTaps = chestTaps + 1;
    setChestTaps(nextTaps);
    if (soundEnabled) playTapSound();

    if (nextTaps >= chestMaxTaps) {
      setIsChestBroken(true);
      if (soundEnabled) playSuccessSound();

      const standardLoot = [
        { amount: 150, name: '⚡ Super Gema Verde', rarity: 'Raro' },
        { amount: 200, name: '🛸 Turbina de Gravidade Zero', rarity: 'Épico' },
        { amount: 250, name: '🕶️ Óculos Retro-Tech do Admin', rarity: 'Lendário' },
        { amount: 150, name: '🎒 Mochila Foguete', rarity: 'Raro' },
        { amount: 300, name: '⭐ Armadura Suprema PK XD', rarity: 'Lendário' },
        { amount: 200, name: '🐲 Drone Companheiro', rarity: 'Épico' }
      ];
      const selected = standardLoot[Math.floor(Math.random() * standardLoot.length)];
      setChestReward(selected);

      addXP(selected.amount, `Abriu Baú Secreto: encontrou ${selected.name}! 🎁`);

      const nextChestTime = Date.now() + 10 * 60 * 1000;
      setChestCooldown(nextChestTime);
      try {
        localStorage.setItem('pkxd_next_chest_hunt', nextChestTime.toString());
      } catch {}
    }
  };

  const handleResetChest = () => {
    setChestTaps(0);
    setIsChestBroken(false);
    setChestReward(null);
    if (soundEnabled) playTapSound();
  };

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        setNickname('Jogador_Convidado');
        setNickInput('Jogador_Convidado');
        setFireStreak(1);
        setInstagram('');
        setInstagramPublic(true);
        return;
      }

      setIsLoadingProfile(true);
      const cleanedId = user.uid.trim();
      const userDocRef = doc(db, 'leaderboard', cleanedId);

      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const dbName = data.name || 'Fã Secreto';
          const dbLevel = Number(data.level) || 1;
          const dbXp = Number(data.xp) || 0;
          const dbFlames = Number(data.flames) || 1;
          const dbInsta = data.instagram || '';
          const dbInstaPublic = data.instagramPublic !== false;

          setNickname(dbName);
          setNickInput(dbName);
          setFireStreak(dbFlames);
          setInstagram(dbInsta);
          setInstagramPublic(dbInstaPublic);

          localStorage.setItem('pkxd_username_nickname', dbName);
          localStorage.setItem('pkxd_fire_streak', String(dbFlames));
          localStorage.setItem('pkxd_user_instagram', dbInsta);
          localStorage.setItem('pkxd_user_instagram_public', String(dbInstaPublic));
          localStorage.setItem('pkxd_fan_level', String(dbLevel));
          localStorage.setItem('pkxd_fan_xp', String(dbXp));

          setFanLevel?.(dbLevel);
          setFanXP?.(dbXp);
        } else {
          const payload: any = {
            id: cleanedId,
            email: user.email || '',
            name: nickname === 'Jogador_Convidado' ? (user.displayName || 'Jogador_Convidado') : nickname,
            level: Number(level) || 1,
            xp: Number(xp) || 0,
            flames: Number(fireStreak) || 1,
            instagram: instagram || '',
            instagramPublic: instagramPublic !== false,
            photoUrl: localPhotoUrl || user.photoURL || '',
            updatedAt: Date.now()
          };

          if (user.uid === 'admin_fallback') {
            payload.admin_secret = 'pkxd2026_super_secret_admin_key';
          }

          await setDoc(userDocRef, payload);

          const finalName = payload.name;
          setNickname(finalName);
          setNickInput(finalName);
          localStorage.setItem('pkxd_username_nickname', finalName);
        }
      } catch (err) {
        console.warn('Could not retrieve/set cloud user file:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    if (isLoadingProfile) return;
    localStorage.setItem('pkxd_fire_streak', fireStreak.toString());
  }, [fireStreak, isLoadingProfile]);

  useEffect(() => {
    if (isLoadingProfile) return;
    localStorage.setItem('pkxd_username_nickname', nickname);
  }, [nickname, isLoadingProfile]);

  useEffect(() => {
    const syncToDB = async () => {
      if (isLoadingProfile) return;
      if (!user?.uid) return;

      const cleanedId = user.uid.trim();
      if (!cleanedId || cleanedId.length === 0) return;

      const userDoc = doc(db, 'leaderboard', cleanedId);
      try {
        const payload: any = {
          id: cleanedId,
          email: user.email || '',
          name: nickname,
          level: Number(level) || 1,
          xp: Number(xp) || 0,
          flames: Number(fireStreak) || 0,
          instagram: instagram || '',
          instagramPublic: instagramPublic !== false,
          photoUrl: localPhotoUrl || user.photoURL || '',
          updatedAt: Date.now()
        };

        if (user.uid === 'admin_fallback') {
          payload.admin_secret = 'pkxd2026_super_secret_admin_key';
        }

        await setDoc(userDoc, payload);
      } catch (err) {
        console.warn('Could not sync leaderboard stats:', err);
      }
    };

    const timer = setTimeout(() => {
      syncToDB();
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, nickname, level, xp, fireStreak, instagram, instagramPublic, localPhotoUrl, isLoadingProfile]);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), limit(40));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const players: RankedPlayer[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.id && !data.id.startsWith('u_')) {
          players.push({
            id: data.id,
            email: data.email || '',
            name: data.name || 'Fã Secreto',
            level: Number(data.level) || 1,
            xp: Number(data.xp) || 0,
            flames: Number(data.flames) || 0,
            instagram: data.instagram || '',
            instagramPublic: data.instagramPublic !== false,
            photoUrl: data.photoUrl || ''
          });
        }
      });
      setDbPlayers(players);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'leaderboard');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const winnerRef = doc(db, 'settings', 'monthly_winner');
    const unsubscribe = onSnapshot(winnerRef, async (snapshot) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (snapshot.exists()) {
        const data = snapshot.data() as MonthlyWinner;
        setMonthlyWinner(data);

        if (data.lastCheckedMonth !== currentMonth || data.lastCheckedYear !== currentYear) {
          try {
            const q = query(collection(db, 'leaderboard'));
            const querySnapshot = await getDocs(q);
            const players: any[] = [];
            querySnapshot.forEach((docSnap) => {
              const pData = docSnap.data();
              if (pData && pData.id && !pData.id.startsWith('u_')) {
                players.push(pData);
              }
            });

            if (players.length > 0) {
              const computeScore = (p: any) =>
                (Number(p.level || 1) * 10000) + (Number(p.flames || 0) * 100) + Number(p.xp || 0);
              players.sort((a, b) => computeScore(b) - computeScore(a));
              const topPlayer = players[0];

              const newWinner: MonthlyWinner = {
                winnerName: topPlayer.name || 'Fã Secreto',
                winnerLevel: Number(topPlayer.level) || 1,
                winnerFlames: Number(topPlayer.flames) || 0,
                winnerXp: Number(topPlayer.xp) || 0,
                lastCheckedMonth: currentMonth,
                lastCheckedYear: currentYear,
                recordedAt: Date.now()
              };

              await setDoc(winnerRef, newWinner);
              setMonthlyWinner(newWinner);
            }
          } catch (err) {
            console.error('Erro ao registrar vencedor mensal:', err);
          }
        }
      } else {
        try {
          const q = query(collection(db, 'leaderboard'));
          const querySnapshot = await getDocs(q);
          const players: any[] = [];
          querySnapshot.forEach((docSnap) => {
            const pData = docSnap.data();
            if (pData && pData.id && !pData.id.startsWith('u_')) {
              players.push(pData);
            }
          });

          let winnerName = 'Ainda nenhum';
          let winnerLevel = 1;
          let winnerFlames = 0;
          let winnerXp = 0;

          if (players.length > 0) {
            const computeScore = (p: any) =>
              (Number(p.level || 1) * 10000) + (Number(p.flames || 0) * 100) + Number(p.xp || 0);
            players.sort((a, b) => computeScore(b) - computeScore(a));
            const topPlayer = players[0];
            winnerName = topPlayer.name || 'Fã Secreto';
            winnerLevel = Number(topPlayer.level) || 1;
            winnerFlames = Number(topPlayer.flames) || 0;
            winnerXp = Number(topPlayer.xp) || 0;
          }

          const initWinner: MonthlyWinner = {
            winnerName,
            winnerLevel,
            winnerFlames,
            winnerXp,
            lastCheckedMonth: currentMonth,
            lastCheckedYear: currentYear,
            recordedAt: Date.now()
          };

          await setDoc(winnerRef, initWinner);
          setMonthlyWinner(initWinner);
        } catch (err) {
          console.error('Erro ao inicializar vencedor mensal:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let combined = [...dbPlayers];

    if (!user?.uid) {
      const computeScore = (p: RankedPlayer) => (p.level * 10000) + (p.flames * 100) + p.xp;
      combined.sort((a, b) => computeScore(b) - computeScore(a));
      setLeaderboard(combined);
      return;
    }

    const activeId = user.uid;
    const hasMe = combined.some(p => p.id === activeId);

    if (!hasMe) {
      combined.push({
        id: activeId,
        name: nickname,
        level: level,
        xp: xp,
        flames: fireStreak,
        isCurrentUser: true,
        instagram: instagram,
        instagramPublic: instagramPublic
      });
    } else {
      combined = combined.map(p =>
        p.id === activeId
          ? {
              ...p,
              name: nickname,
              level: level,
              xp: xp,
              flames: fireStreak,
              isCurrentUser: true,
              instagram: instagram,
              instagramPublic: instagramPublic
            }
          : p
      );
    }

    const computeScore = (p: RankedPlayer) => (p.level * 10000) + (p.flames * 100) + p.xp;
    combined.sort((a, b) => computeScore(b) - computeScore(a));
    setLeaderboard(combined);
  }, [dbPlayers, user, clientId, nickname, level, xp, fireStreak, instagram, instagramPublic]);

  const addXP = (amount: number, reason: string) => {
    if (soundEnabled) playSuccessSound();
    setNotif(`+${amount} XP: ${reason}`);
    setTimeout(() => setNotif(null), 3000);
    onAddXP(amount, reason);
  };

  const handleClaimDaily = () => {
    playTapSound();
    if (hasClaimedDaily) return;

    const today = new Date().toDateString();
    localStorage.setItem('pkxd_last_claim_date', today);
    setHasClaimedDaily(true);

    const newStreak = fireStreak + 1;
    setFireStreak(newStreak);

    addXP(500, 'Coleta Diária 🔥 +1 Foguinho!');
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    try {
      await deleteDoc(doc(db, 'leaderboard', playerId));
      setConfirmDeletePlayerId(null);
      setNotif(`Fã ${playerName} removido do ranking.`);
      if (soundEnabled) playTapSound();
      setTimeout(() => setNotif(null), 3000);
    } catch (err) {
      console.error('Erro ao excluir fã:', err);
      setNotif('Erro ao excluir fã do ranking.');
      setTimeout(() => setNotif(null), 3000);
    }
  };

  return (
    <section
      id="fan-level-dashboard"
      className="pkxd-glass rounded-3xl p-6 sm:p-8 space-y-6 text-left"
    >
      {/* Floating XP Notification */}
      {notif && (
        <div className="fixed top-20 right-6 z-50 bg-[#FACC15] text-slate-900 font-extrabold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border-2 border-slate-900 text-xs sm:text-sm">
          <Flame className="w-5 h-5 text-orange-600 fill-orange-500" />
          <span>{notif}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b-2 border-slate-100 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-extrabold text-xs uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>PKXD Central • Sequência de Fogos</span>
          </div>
          <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900">
            Central do Foguinho & Ranking
          </h3>
          <p className="font-sans text-xs sm:text-sm text-slate-600 max-w-xl">
            Resgate sua energia diária, gire a roleta, acumule fogos seguidos e suba no ranking oficial da comunidade.
          </p>
        </div>

        {/* User Quick Stats Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 w-full lg:w-[400px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-[#FACC15] p-0.5 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex flex-col items-center justify-center">
                <span className="text-xs font-mono font-extrabold text-orange-600 leading-none">Lv {level}</span>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              {isEditingNickname ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={nickInput}
                    onChange={(e) => setNickInput(e.target.value)}
                    className="bg-white text-slate-900 text-xs px-2.5 py-1.5 rounded-lg border-2 border-slate-200 w-40 focus:outline-none focus:border-orange-500 font-sans font-bold"
                    maxLength={15}
                    placeholder="Apelido..."
                  />

                  <div className="space-y-1">
                    <input
                      type="text"
                      value={instaInput}
                      onChange={(e) => setInstaInput(e.target.value)}
                      className="bg-white text-slate-900 text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-200 w-full focus:outline-none focus:border-orange-500 font-mono"
                      placeholder="Instagram (Link ou @user)"
                    />
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 select-none cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={instaPublicInput}
                        onChange={(e) => setInstaPublicInput(e.target.checked)}
                        className="rounded border-slate-300 text-orange-600 cursor-pointer"
                      />
                      <span>Instagram público no ranking</span>
                    </label>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        playTapSound();
                        const clean = nickInput.trim().replace(/\s+/g, '_');
                        if (clean.length > 0) {
                          const isDuplicate = dbPlayers.some(
                            p => p.id !== activePlayerId && p.name.trim().toLowerCase() === clean.trim().toLowerCase()
                          );
                          if (isDuplicate) {
                            setNotif(`Apelido "${clean}" já está em uso! Escolha outro.`);
                            setTimeout(() => setNotif(null), 3500);
                            return;
                          }
                          setNickname(clean);
                        }

                        const cleanInsta = instaInput.trim();
                        localStorage.setItem('pkxd_user_instagram', cleanInsta);
                        localStorage.setItem('pkxd_user_instagram_public', String(instaPublicInput));
                        setInstagram(cleanInsta);
                        setInstagramPublic(instaPublicInput);

                        setIsEditingNickname(false);
                        setNotif('Perfil atualizado com sucesso!');
                        setTimeout(() => setNotif(null), 2500);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar</span>
                    </button>
                    <button
                      onClick={() => setIsEditingNickname(false)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-display font-bold text-slate-900 truncate max-w-[140px]">
                    {nickname}
                  </span>
                  <button
                    onClick={() => {
                      playTapSound();
                      setIsEditingNickname(true);
                      setNickInput(nickname);
                      setInstaInput(instagram);
                      setInstaPublicInput(instagramPublic);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Mudar Apelido"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-orange-600 font-extrabold">
                <Flame className="w-3.5 h-3.5 fill-orange-500" />
                <span className="tabular-nums">{fireStreak} Fogos Conquistados</span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-1.5 shrink-0">
            <div className="text-xs font-bold text-slate-500 font-mono tabular-nums">
              XP: <span className="text-[#6D28D9] font-extrabold">{xp}/100</span>
            </div>
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-[#FACC15] rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, xp))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Connection / Auth Banner */}
      {!user || user.uid === 'admin_fallback' ? (
        <div className="bg-[#F3F0FF] border-2 border-purple-200 rounded-3xl p-5 sm:p-6 space-y-5 text-left font-sans">
          <div className="space-y-1">
            <h4 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#6D28D9]" />
              <span>Conecte sua Conta para aparecer no Ranking Real</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              Seu perfil atual é temporário como <strong className="text-[#6D28D9] font-mono">{nickname}</strong>. Faça login ou cadastre-se abaixo para salvar seu nível e sequência de fogos na nuvem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Left Column: Google Sign-in */}
            <div className="bg-white p-5 rounded-2xl border-2 border-purple-100 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <h5 className="text-xs font-extrabold text-[#6D28D9] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>Opção 1: Acesso Rápido com Google</span>
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Entre instantaneamente usando sua conta Google conectada ao navegador.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    if (soundEnabled) playSuccessSound();
                    if (onLogin) onLogin();
                  }}
                  className="pkxd-btn-primary w-full py-3 px-4 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Entrar com Google</span>
                </button>
                <button
                  onClick={() => {
                    if (soundEnabled) playTapSound();
                    if (onLoginRedirect) onLoginRedirect();
                  }}
                  className="pkxd-btn-outline w-full py-2.5 px-4 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Use se o popup do Google estiver bloqueado no celular"
                >
                  <span>Alternativa para Celular</span>
                </button>
              </div>
            </div>

            {/* Right Column: Email / Password or Verification */}
            {pendingEmailVerification ? (
              <div className="bg-white p-5 rounded-2xl border-2 border-emerald-300 flex flex-col justify-between space-y-4">
                <div className="space-y-3 text-left">
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-1.5 text-xs text-emerald-900">
                    <div className="font-extrabold uppercase tracking-wider text-[11px] text-emerald-700 flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      <span>Código de Confirmação Gerado</span>
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-900 font-sans">
                      Código para <strong className="font-mono">{pendingEmailVerification.email}</strong>:
                    </p>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px] uppercase font-bold">Seu Código:</span>
                      <span className="text-emerald-700 font-mono font-extrabold text-sm tracking-widest">
                        {pendingEmailVerification.code}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Digite o código de 6 dígitos:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={verificationCodeInput || ''}
                      onChange={(e) => setVerificationCodeInput && setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center bg-slate-50 border-2 border-slate-200 rounded-2xl py-2.5 text-2xl font-mono font-extrabold tracking-[0.35em] text-[#6D28D9] focus:outline-none focus:border-[#6D28D9]"
                    />
                  </div>

                  {(authError || outerAuthError) && (
                    <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl whitespace-pre-line leading-relaxed">
                      {authError || outerAuthError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playSuccessSound();
                      if (onConfirmEmailCode) onConfirmEmailCode();
                    }}
                    disabled={isAuthenticating || (verificationCodeInput || '').length !== 6}
                    className="pkxd-btn-cyan w-full py-3 disabled:opacity-50 text-xs cursor-pointer"
                  >
                    {isAuthenticating ? 'Verificando código...' : 'Confirmar Código e Ativar Conta'}
                  </button>

                  <div className="flex flex-col gap-1.5 pt-1 text-center border-t border-slate-100">
                    <button
                      type="button"
                      disabled={resendCooldown ? resendCooldown > 0 : false}
                      onClick={() => {
                        if (soundEnabled) playTapSound();
                        if (onResendCode) onResendCode();
                      }}
                      className="text-xs text-[#6D28D9] hover:underline font-extrabold disabled:opacity-40 cursor-pointer"
                    >
                      {resendCooldown && resendCooldown > 0 ? `Reenviar em (${resendCooldown}s)...` : 'Reenviar Código'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (soundEnabled) playTapSound();
                        if (onCancelVerification) onCancelVerification();
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Voltar e editar dados
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (soundEnabled) playTapSound();
                  if (!emailForm || !passwordForm) {
                    setAuthError('Preencha os campos de e-mail e senha.');
                    return;
                  }
                  setAuthError(null);
                  if (authTab === 'register') {
                    if (passwordForm.length < 8) {
                      setAuthError('A senha precisa ter no mínimo 8 caracteres.');
                      return;
                    }
                    if (!/\d/.test(passwordForm) || !/[A-Za-z]/.test(passwordForm)) {
                      setAuthError('A senha deve conter letras e números.');
                      return;
                    }
                    const simplePasswords = ['123456', '12345678', 'senha123', 'admin123', 'pkxd123', 'pkxd2026', 'password'];
                    if (simplePasswords.some(sw => passwordForm.toLowerCase().includes(sw))) {
                      setAuthError('Escolha uma senha mais segura.');
                      return;
                    }

                    const pickNickname = nicknameForm.trim() || nickname;
                    const clean = pickNickname.trim().replace(/\s+/g, '_');
                    const isDuplicate = dbPlayers.some(
                      p => p.id !== activePlayerId && p.name.trim().toLowerCase() === clean.trim().toLowerCase()
                    );
                    if (isDuplicate) {
                      setAuthError(`O apelido "${clean}" já está em uso. Escolha outro nome.`);
                      return;
                    }

                    const cleanInsta = instagramForm.trim();
                    localStorage.setItem('pkxd_user_instagram', cleanInsta);
                    localStorage.setItem('pkxd_user_instagram_public', String(instagramPublicForm));
                    setInstagram(cleanInsta);
                    setInstagramPublic(instagramPublicForm);

                    if (onEmailRegister) onEmailRegister(emailForm, passwordForm, clean);
                  } else {
                    if (onEmailLogin) onEmailLogin(emailForm, passwordForm);
                  }
                }}
                className="bg-white p-5 rounded-2xl border-2 border-purple-100 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 gap-2">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Opção 2: E-mail e Senha
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (soundEnabled) playTapSound();
                          setAuthTab('login');
                          setAuthError(null);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                          authTab === 'login' ? 'bg-[#6D28D9] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Entrar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (soundEnabled) playSuccessSound();
                          setAuthTab('register');
                          setAuthError(null);
                          setNicknameForm(nickname);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                          authTab === 'register' ? 'bg-[#6D28D9] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Cadastrar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <input
                      type="email"
                      required
                      placeholder="Seu e-mail (ex: fa@email.com)"
                      value={emailForm}
                      onChange={(e) => setEmailForm(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9] font-mono"
                    />

                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Sua senha (mínimo 8 caracteres com letras e números)"
                      value={passwordForm}
                      onChange={(e) => setPasswordForm(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9] font-mono"
                    />

                    {authTab === 'register' && (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="block text-[11px] text-slate-600 font-extrabold uppercase mb-1">
                            Nickname no Site:
                          </label>
                          <input
                            type="text"
                            placeholder="Nome de Fã"
                            value={nicknameForm}
                            onChange={(e) => setNicknameForm(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9] font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 font-extrabold uppercase mb-1">
                            Seu Instagram (Opcional):
                          </label>
                          <input
                            type="text"
                            placeholder="ex: @pkxd_explorer"
                            value={instagramForm}
                            onChange={(e) => setInstagramForm(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9] font-mono"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-semibold">
                          <input
                            type="checkbox"
                            checked={instagramPublicForm}
                            onChange={(e) => setInstagramPublicForm(e.target.checked)}
                            className="rounded border-slate-300 text-[#6D28D9] cursor-pointer"
                          />
                          <span>Mostrar meu Instagram no ranking público</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {(authError || outerAuthError) && (
                    <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl whitespace-pre-line leading-relaxed">
                      {authError || outerAuthError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="pkxd-btn-outline w-full py-2.5 px-4 text-xs font-extrabold cursor-pointer"
                >
                  {authTab === 'register' ? 'Criar Conta e Verificar' : 'Entrar e Sincronizar'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 font-sans">
          <div className="space-y-1 text-left">
            <h4 className="font-display text-base font-bold text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Sua conta de fã está conectada!</span>
            </h4>
            <p className="text-xs sm:text-sm text-emerald-900/80 leading-relaxed">
              Autenticado como <strong className="font-mono underline">{maskEmail(user.email)}</strong>. Seus níveis e fogos diários estão sincronizados em tempo real.
            </p>
          </div>
          <button
            onClick={() => {
              if (soundEnabled) playTapSound();
              if (onLogout) onLogout();
            }}
            className="px-4 py-2.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer border-2 border-emerald-200 hover:border-rose-300 transition-colors whitespace-nowrap"
          >
            Desconectar
          </button>
        </div>
      )}

      {/* Main Split Playground + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: XP Playground */}
        <div className="lg:col-span-5 bg-slate-50 border-2 border-slate-200 p-5 sm:p-6 rounded-3xl flex flex-col justify-between space-y-5 min-h-[450px]">
          {/* Switcher */}
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 gap-1.5 select-none">
            <button
              type="button"
              onClick={() => {
                setActiveXpTab('daily');
                if (soundEnabled) playTapSound();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold text-center transition-colors cursor-pointer ${
                activeXpTab === 'daily'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🔥 Fogo
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveXpTab('wheel');
                if (soundEnabled) playTapSound();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold text-center transition-colors cursor-pointer ${
                activeXpTab === 'wheel'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🎡 Roleta
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveXpTab('chest');
                if (soundEnabled) playTapSound();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold text-center transition-colors cursor-pointer ${
                activeXpTab === 'chest'
                  ? 'bg-[#6D28D9] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              📦 Baú
            </button>
          </div>

          {/* Tab 1: FOGO */}
          {activeXpTab === 'daily' && (
            <div className="space-y-4 flex flex-col justify-between flex-1">
              <div className="space-y-1.5">
                <span className="inline-block text-[11px] font-extrabold bg-orange-100 text-orange-800 px-3 py-1 rounded-full uppercase tracking-wider">
                  Check-in Diário
                </span>
                <h4 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Acenda sua chama diária!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Cada check-in diário garante <strong className="text-amber-700">+500 XP</strong> e aumenta sua sequência de <strong className="text-orange-600">Fogos</strong>!
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border-2 border-slate-200 space-y-2 select-none">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-orange-500 to-[#FACC15] shadow-md transition-transform ${
                    hasClaimedDaily ? 'opacity-60' : 'hover:scale-105'
                  }`}
                >
                  <Flame className="w-8 h-8 text-white fill-white" />
                </div>

                <div className="text-center">
                  <div className="text-sm font-display font-bold text-slate-900 flex items-center justify-center gap-1.5">
                    <span>Sequência de Fogos:</span>
                    <span className="text-orange-600 font-mono tabular-nums">{fireStreak} dias</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {hasClaimedDaily ? 'Chama coletada por hoje!' : 'Sua energia diária está disponível!'}
                  </p>
                </div>
              </div>

              <div>
                {hasClaimedDaily ? (
                  <div className="w-full bg-emerald-50 border-2 border-emerald-200 p-3 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-extrabold justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Coleta diária garantida (+500 XP)!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleClaimDaily}
                    className="pkxd-btn-gold w-full py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Coletar XP Diário (+500 XP)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: WHEEL */}
          {activeXpTab === 'wheel' && (
            <div className="space-y-4 flex flex-col justify-between flex-1">
              <div className="space-y-1.5">
                <span className="inline-block text-[11px] font-extrabold bg-pink-100 text-pink-800 px-3 py-1 rounded-full uppercase tracking-wider">
                  Giro da Sorte
                </span>
                <h4 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Roleta de XP da Comunidade
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Gire a roleta a cada <strong className="text-pink-600">3 horas</strong> para ganhar de 100 a 300 XP extras!
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-3 select-none">
                <div className="relative flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-pink-600 mb-1" />
                  <div
                    className={`w-28 h-28 rounded-full border-4 border-pink-500 bg-white flex items-center justify-center shadow-lg transition-transform ${
                      isSpinning ? 'animate-spin' : ''
                    }`}
                  >
                    <div className="text-center p-2">
                      {isSpinning ? (
                        <span className="text-2xl block">🌀</span>
                      ) : wheelResult ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-extrabold text-pink-600 block truncate max-w-[85px]">
                            {wheelResult.message}
                          </span>
                          <span className="text-xs font-mono font-extrabold text-[#6D28D9] block">
                            +{wheelResult.amount} XP
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-xs font-display font-bold text-slate-900 block">ROLETA</span>
                          <span className="text-[10px] font-extrabold text-pink-600 block">GIRAR</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {wheelTimeLeft > 0 ? (
                  <div className="w-full bg-white border-2 border-slate-200 p-3 rounded-2xl text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-extrabold mb-1">Próximo giro disponível em:</p>
                    <span className="text-sm font-mono tabular-nums font-extrabold text-pink-600">
                      {Math.floor(wheelTimeLeft / 3600).toString().padStart(2, '0')}:
                      {Math.floor((wheelTimeLeft % 3600) / 60).toString().padStart(2, '0')}:
                      {(wheelTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isSpinning}
                    onClick={handleSpinWheel}
                    className="pkxd-btn-primary w-full py-3 disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                  >
                    {isSpinning ? 'Girando a Sorte...' : 'Girar Roleta da Sorte'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: CHEST */}
          {activeXpTab === 'chest' && (
            <div className="space-y-4 flex flex-col justify-between flex-1">
              <div className="space-y-1.5">
                <span className="inline-block text-[11px] font-extrabold bg-[#F3F0FF] text-[#6D28D9] px-3 py-1 rounded-full uppercase tracking-wider">
                  Caça ao Baú Secreto
                </span>
                <h4 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Abra o Baú Surpresa
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Toque no baú para romper o selo e descobrir um bônus aleatório de XP!
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 flex flex-col items-center justify-center min-h-[175px] select-none">
                {chestTimeLeft > 0 ? (
                  <div className="text-center space-y-2 py-2">
                    <span className="text-2xl block">🔒</span>
                    <h5 className="font-bold text-xs text-slate-800 uppercase">Baú Recarregando</h5>
                    <p className="text-xs text-slate-500 max-w-[210px] mx-auto">
                      Um novo baú secreto estará disponível em breve!
                    </p>
                    <div className="text-xs font-mono tabular-nums font-extrabold text-[#6D28D9] bg-[#F3F0FF] px-3 py-1.5 rounded-xl border border-purple-200 inline-block">
                      {Math.floor(chestTimeLeft / 60).toString().padStart(2, '0')}:
                      {(chestTimeLeft % 60).toString().padStart(2, '0')} min
                    </div>
                  </div>
                ) : isChestBroken ? (
                  <div className="text-center space-y-2.5 py-1">
                    <span className="text-3xl block">🎁</span>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full inline-block">
                        Loot {chestReward?.rarity}!
                      </span>
                      <h5 className="font-display font-bold text-sm text-slate-900">{chestReward?.name}</h5>
                      <span className="text-xs font-mono font-extrabold text-[#6D28D9] block">
                        +{chestReward?.amount} XP Adicionados!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetChest}
                      className="text-xs font-extrabold text-[#6D28D9] hover:underline bg-[#F3F0FF] py-1.5 px-3 rounded-full cursor-pointer"
                    >
                      Procurar Outro Baú
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 flex flex-col items-center w-full">
                    <button
                      type="button"
                      onClick={handleTapChest}
                      className="relative focus:outline-none transition-transform active:scale-90 cursor-pointer"
                    >
                      <div className={`text-5xl transition-transform select-none leading-none ${chestTaps > 0 ? 'scale-110' : 'hover:scale-105'}`}>
                        📦
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-[#FACC15] text-slate-900 text-[10px] font-extrabold font-mono w-5 h-5 flex items-center justify-center rounded-full shadow border border-amber-500">
                        {chestMaxTaps - chestTaps}
                      </div>
                    </button>

                    <div className="w-full max-w-[190px] space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span>Selo do Baú</span>
                        <span className="text-[#6D28D9]">{Math.round((chestTaps / chestMaxTaps) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#6D28D9] to-[#E83EBC] transition-all duration-150"
                          style={{ width: `${(chestTaps / chestMaxTaps) * 100}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-bold">Toque no baú para abrir!</p>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-600 bg-white rounded-xl p-2.5 text-center border border-slate-200">
                O baú pode conceder até <strong className="text-[#6D28D9]">300 XP</strong> e recarrega a cada 10 minutos.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-time Dynamic Leaderboard */}
        <div className="lg:col-span-7 bg-slate-50 border-2 border-slate-200 p-5 sm:p-6 rounded-3xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Ranking Oficial da Comunidade</span>
              </h4>
              <span className="text-[11px] font-sans text-slate-500 uppercase tracking-wider font-extrabold">
                Top Exploradores
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              O ranking atualiza em tempo real conforme você ganha XP e mantém sua sequência diária de fogos!
            </p>

            {/* Monthly Prize Info Card (no border-l-4, no pulse) */}
            <div className="bg-[#FFFBEB] border-2 border-amber-300 p-3.5 rounded-2xl text-left space-y-1">
              <h5 className="font-display font-bold text-xs sm:text-sm text-amber-900">
                Prêmio Especial Todo Mês
              </h5>
              <p className="font-sans text-xs text-amber-950/80 leading-relaxed">
                <strong>O ranking é renovado todo início de mês</strong>. Quem encerrar em <strong>1º lugar</strong> recebe destaque e prêmio especial da PKXD Central!
              </p>
            </div>

            {/* Monthly Winner Coronation Card */}
            {new Date().getDate() <= 3 && monthlyWinner && (
              <div className="bg-amber-100 border-2 border-amber-400 p-4 rounded-2xl text-left space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#FACC15] text-slate-900 rounded-xl flex-shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-extrabold text-amber-800 block leading-none">
                      TEMPORADA ANTERIOR
                    </span>
                    <h5 className="font-display font-bold text-sm text-slate-900">
                      Grande Vencedor da Temporada!
                    </h5>
                  </div>
                </div>

                <p className="font-sans text-xs text-slate-800 leading-relaxed">
                  Parabéns a <strong>@{monthlyWinner.winnerName}</strong>, que alcançou o <strong>Nível {monthlyWinner.winnerLevel}</strong> com <strong>{monthlyWinner.winnerFlames} fogos</strong>!
                </p>

                <div className="flex items-center justify-between border-t border-amber-300 pt-2 text-[11px] font-mono text-amber-900 font-bold">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Destaque PKXD Central
                  </span>
                  <span className="bg-white/70 px-2 py-0.5 rounded-md border border-amber-300">
                    Exibido nos 3 primeiros dias
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Leaders List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar flex-grow">
            {leaderboard.map((player, index) => {
              const rank = index + 1;
              const isUser = player.isCurrentUser;
              const isConfirming = confirmDeletePlayerId === player.id;

              let medalBadge = '';
              if (rank === 1) medalBadge = '🥇';
              else if (rank === 2) medalBadge = '🥈';
              else if (rank === 3) medalBadge = '🥉';

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-colors ${
                    isUser
                      ? 'bg-[#FFFBEB] border-amber-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center font-extrabold text-xs font-mono text-slate-500">
                      {medalBadge ? <span className="text-lg">{medalBadge}</span> : <span>#{rank}</span>}
                    </div>

                    <div className="relative w-9 h-9 flex-shrink-0">
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt={player.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isUser ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs sm:text-sm font-bold truncate ${isUser ? 'text-orange-700' : 'text-slate-900'}`}>
                          {player.name}
                        </span>
                        {isUser && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full uppercase font-extrabold">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <span className="text-[11px] text-slate-600 font-semibold font-mono">
                          Explorador <strong className="text-[#6D28D9]">Nível {player.level}</strong>
                        </span>

                        {player.instagram && (player.instagramPublic || isAdmin) && (
                          <div className="flex items-center gap-1 text-[11px] text-pink-600 font-semibold font-sans flex-wrap">
                            <Instagram className="w-3 h-3 flex-shrink-0" />
                            {player.instagram.startsWith('http') ? (
                              <a
                                href={player.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline truncate max-w-[150px]"
                              >
                                {player.instagram.substring(0, 24)}
                                {player.instagram.length > 24 ? '...' : ''}
                              </a>
                            ) : (
                              <a
                                href={`https://instagram.com/${player.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {player.instagram.startsWith('@') ? player.instagram : `@${player.instagram}`}
                              </a>
                            )}
                            {!player.instagramPublic && isAdmin && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 uppercase font-extrabold">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Privado</span>
                              </span>
                            )}
                          </div>
                        )}

                        {isAdmin && player.email && (
                          <div className="flex items-center gap-1 text-[11px] text-sky-700 font-semibold font-mono select-all">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[170px]">{player.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs font-extrabold font-mono tabular-nums text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                      <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                      <span>{player.flames}</span>
                    </div>

                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Progresso</div>
                      <div className="text-xs text-[#6D28D9] font-mono tabular-nums font-extrabold">{player.xp}/100 XP</div>
                    </div>

                    {isAdmin && (
                      isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlayer(player.id, player.name);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-extrabold cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeletePlayerId(null);
                            }}
                            className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeletePlayerId(player.id);
                          }}
                          className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-sans text-[10px] font-extrabold uppercase rounded-lg cursor-pointer"
                          title="Excluir Jogador do Ranking"
                        >
                          Excluir
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-right pt-1 text-xs text-slate-500 font-mono font-bold tabular-nums">
            {leaderboard.length} exploradores ranqueados nesta temporada
          </div>
        </div>
      </div>

      {/* How to earn XP */}
      <div className="p-5 bg-slate-50 rounded-3xl border-2 border-slate-200 space-y-3">
        <h5 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-orange-500" />
          <span>Como ganhar mais XP e subir de Nível?</span>
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="font-extrabold text-amber-700">⭐ Avaliar Novidades (+150 XP)</div>
            <p className="leading-relaxed">Avalie as novidades e spoilers com estrelas para somar pontos.</p>
          </div>
          <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="font-extrabold text-pink-600">🔮 Apoiar Teorias (+80 XP)</div>
            <p className="leading-relaxed">Concorde com teorias da comunidade para desbloquear bônus.</p>
          </div>
          <div className="space-y-1 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="font-extrabold text-emerald-700">🟢 Canal do WhatsApp (+250 XP)</div>
            <p className="leading-relaxed">Acompanhe nosso canal oficial para ganhar energia extra!</p>
          </div>
        </div>
      </div>
    </section>
  );
}

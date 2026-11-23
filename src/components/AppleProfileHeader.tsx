import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Sparkles, Plus,
  Edit2, Camera, Upload, Store,
  Gift, PlusCircle, Check, CreditCard, Trash2,
  Users, UserPlus, UserCheck, Search
} from 'lucide-react';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  query, orderBy, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

interface AppleProfileHeaderProps {
  user: any;
  fanLevel: number;
  fanXP: number;
  soundEnabled: boolean;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (show: boolean) => void;
  isAdmin: boolean;
}

interface CustomAvatar {
  id: string;
  name: string;
  imageUrl: string;
  priceGems: number;
  priceCoins: number;
  creatorName: string;
  createdAt: number;
}

export default function AppleProfileHeader({
  user,
  fanLevel,
  fanXP,
  triggerAudio,
  isAdmin
}: AppleProfileHeaderProps) {
  const [nickname, setNickname] = useState(() => {
    const saved = localStorage.getItem('pkxd_username_nickname');
    if (saved) return saved;
    const randomNum = String(Math.floor(10 + Math.random() * 980)).padStart(2, '0');
    const guestName = `Convidado_${randomNum}`;
    localStorage.setItem('pkxd_username_nickname', guestName);
    return guestName;
  });
  const [bio, setBio] = useState(() => {
    return localStorage.getItem('pkxd_user_bio') || 'Olá! Explorando novidades do universo PK XD.';
  });
  const [instagram, setInstagram] = useState(() => {
    return localStorage.getItem('pkxd_user_instagram') || '';
  });

  const [customProfileImage, setCustomProfileImage] = useState(() => {
    return localStorage.getItem('pkxd_custom_profile_image') || '';
  });

  const [gems, setGems] = useState(() => {
    const saved = localStorage.getItem('pkxd_gems_count');
    return saved ? parseInt(saved, 10) : 150;
  });
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('pkxd_coins_count');
    return saved ? parseInt(saved, 10) : 1000;
  });

  const [ownedAvatars, setOwnedAvatars] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_owned_avatars');
      return saved ? JSON.parse(saved) : ['koosh', 'pipoca', 'admin', 'kitty'];
    } catch {
      return ['koosh', 'pipoca', 'admin', 'kitty'];
    }
  });

  const [activeAvatarId, setActiveAvatarId] = useState(() => {
    return localStorage.getItem('pkxd_active_avatar_id') || 'koosh';
  });

  const [shopAvatars, setShopAvatars] = useState<CustomAvatar[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isCreateAvatarOpen, setIsCreateAvatarOpen] = useState(false);
  const [showFriendsPanel, setShowFriendsPanel] = useState(false);

  const [confirmRemoveFriendId, setConfirmRemoveFriendId] = useState<string | null>(null);
  const [confirmDeleteAvatarId, setConfirmDeleteAvatarId] = useState<string | null>(null);

  const [friendships, setFriendships] = useState<any[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [friendSearchResults, setFriendSearchResults] = useState<any[]>([]);
  const [searchingFriends, setSearchingFriends] = useState(false);
  const [guestFriends, setGuestFriends] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_guest_friends');
      return saved ? JSON.parse(saved) : ['Pipoca', 'Nerd_Gamer', 'Spoiler_Master'];
    } catch {
      return ['Pipoca', 'Nerd_Gamer', 'Spoiler_Master'];
    }
  });

  const [editName, setEditName] = useState(nickname);
  const [editBio, setEditBio] = useState(bio);
  const [editInsta, setEditInsta] = useState(instagram);
  const [editCustomPic, setEditCustomPic] = useState(customProfileImage);

  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newAvatarPriceGems, setNewAvatarPriceGems] = useState(10);
  const [newAvatarPriceCoins, setNewAvatarPriceCoins] = useState(500);
  const [newAvatarBase64, setNewAvatarBase64] = useState('');

  const [notif, setNotif] = useState<string | null>(null);

  const avatarPresets = [
    { id: 'koosh', emoji: '🥤', label: 'Koosh (Copo)', color: 'bg-indigo-100' },
    { id: 'pipoca', emoji: '🍿', label: 'Pipoca (Coroa)', color: 'bg-pink-100' },
    { id: 'admin', emoji: '🤖', label: 'Admin (Visor)', color: 'bg-rose-100' },
    { id: 'kitty', emoji: '🐱', label: 'Kitty (Fofa)', color: 'bg-amber-100' }
  ];

  // Clean up any legacy theme-dark class on mount
  useEffect(() => {
    const root = document.getElementById('pkxd-app-root');
    if (root) {
      root.classList.remove('theme-dark', 'theme-light', 'theme-neutral');
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'custom_avatars'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: CustomAvatar[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CustomAvatar);
      });
      setShopAvatars(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('pkxd_username_nickname', nickname);
  }, [nickname]);

  useEffect(() => {
    localStorage.setItem('pkxd_user_bio', bio);
  }, [bio]);

  useEffect(() => {
    localStorage.setItem('pkxd_user_instagram', instagram);
  }, [instagram]);

  useEffect(() => {
    localStorage.setItem('pkxd_active_avatar_id', activeAvatarId);
  }, [activeAvatarId]);

  useEffect(() => {
    localStorage.setItem('pkxd_custom_profile_image', customProfileImage);
  }, [customProfileImage]);

  useEffect(() => {
    localStorage.setItem('pkxd_gems_count', gems.toString());
  }, [gems]);

  useEffect(() => {
    localStorage.setItem('pkxd_coins_count', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('pkxd_owned_avatars', JSON.stringify(ownedAvatars));
  }, [ownedAvatars]);

  useEffect(() => {
    const handleAddResources = (e: Event) => {
      const customEvent = e as CustomEvent<{ gems: number; coins: number }>;
      if (customEvent && customEvent.detail) {
        const { gems: gemsToAdd, coins: coinsToAdd } = customEvent.detail;
        setGems(prev => prev + (gemsToAdd || 0));
        setCoins(prev => prev + (coinsToAdd || 0));
      }
    };
    window.addEventListener('pkxd_add_gems_coins', handleAddResources);
    return () => {
      window.removeEventListener('pkxd_add_gems_coins', handleAddResources);
    };
  }, []);

  const showAlert = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
  };

  useEffect(() => {
    if (!user) {
      const savedNickname = localStorage.getItem('pkxd_username_nickname');
      if (savedNickname && savedNickname.startsWith('Convidado_')) {
        setNickname(savedNickname);
      } else {
        const randomNum = String(Math.floor(10 + Math.random() * 980)).padStart(2, '0');
        const guestName = `Convidado_${randomNum}`;
        localStorage.setItem('pkxd_username_nickname', guestName);
        setNickname(guestName);
      }
    } else {
      const savedNickname = localStorage.getItem('pkxd_username_nickname');
      if (savedNickname && savedNickname !== 'Koosh' && !savedNickname.startsWith('Convidado_')) {
        setNickname(savedNickname);
      } else if (user.displayName) {
        setNickname(user.displayName.replace(/\s+/g, '_'));
      } else {
        setNickname(user.email?.split('@')[0] || 'Jogador_PK');
      }
    }
  }, [user]);

  useEffect(() => {
    setEditName(nickname);
  }, [nickname]);

  useEffect(() => {
    if (!user) {
      setFriendships([]);
      return;
    }
    const q = query(collection(db, 'friendships'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.senderId === user.uid || data.receiverId === user.uid) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        setFriendships(list);
      },
      (err) => {
        console.error('Erro friendships snapshot:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSearchFriends = async () => {
    if (!friendSearchQuery.trim()) {
      setFriendSearchResults([]);
      return;
    }
    setSearchingFriends(true);
    triggerAudio('tap');
    try {
      const q = query(collection(db, 'leaderboard'));
      const snapshot = await getDocs(q);
      const results: any[] = [];
      const queryLower = friendSearchQuery.toLowerCase().trim();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docName = (data.name || '').toLowerCase();
        if (docName.includes(queryLower) && docSnap.id !== user?.uid) {
          results.push({ id: docSnap.id, ...data });
        }
      });

      setFriendSearchResults(results);
      if (results.length === 0) {
        showAlert('Nenhum jogador encontrado com esse nome.');
      }
    } catch (err) {
      console.error(err);
      showAlert('Erro ao pesquisar jogadores.');
    } finally {
      setSearchingFriends(false);
    }
  };

  const handleSendFriendRequest = async (targetPlayer: any) => {
    if (!user) {
      showAlert('Faça login para adicionar amigos globalmente!');
      return;
    }
    if (targetPlayer.id === user.uid) {
      showAlert('Você não pode adicionar a si mesmo!');
      return;
    }

    const existing = friendships.find(
      f =>
        (f.senderId === user.uid && f.receiverId === targetPlayer.id) ||
        (f.senderId === targetPlayer.id && f.receiverId === user.uid)
    );

    if (existing) {
      if (existing.status === 'accepted') {
        showAlert('Vocês já são amigos!');
      } else {
        showAlert('Já existe uma solicitação pendente entre vocês!');
      }
      return;
    }

    triggerAudio('success');
    const docId = `${user.uid}_${targetPlayer.id}`;
    try {
      await setDoc(doc(db, 'friendships', docId), {
        senderId: user.uid,
        senderName: nickname,
        receiverId: targetPlayer.id,
        receiverName: targetPlayer.name || 'Jogador',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      showAlert(`Solicitação enviada para ${targetPlayer.name}!`);
    } catch (err) {
      console.error(err);
      showAlert('Não foi possível enviar a solicitação.');
    }
  };

  const handleAcceptFriendRequest = async (friendship: any) => {
    triggerAudio('success');
    try {
      await setDoc(doc(db, 'friendships', friendship.id), {
        ...friendship,
        status: 'accepted',
        updatedAt: Date.now()
      });
      showAlert(`Amizade com ${friendship.senderId === user.uid ? friendship.receiverName : friendship.senderName} aceita!`);
    } catch (err) {
      console.error(err);
      showAlert('Erro ao aceitar solicitação.');
    }
  };

  const handleRemoveFriendship = async (friendshipId: string) => {
    triggerAudio('tap');
    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
      setConfirmRemoveFriendId(null);
      showAlert('Amizade removida com sucesso!');
    } catch (err) {
      console.error(err);
      showAlert('Erro ao remover amizade.');
    }
  };

  const handleAddGuestFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const input = document.getElementById('guest-friend-name-input') as HTMLInputElement;
    const name = input?.value?.trim();
    if (!name) return;

    const formatted = name.replace(/\s+/g, '_');
    if (guestFriends.includes(formatted)) {
      showAlert('Esse amigo já está na sua lista!');
      return;
    }

    const newList = [...guestFriends, formatted];
    setGuestFriends(newList);
    localStorage.setItem('pkxd_guest_friends', JSON.stringify(newList));
    triggerAudio('success');
    showAlert(`${formatted} adicionado à lista local!`);
    if (input) input.value = '';
  };

  const handleRemoveGuestFriend = (name: string) => {
    const newList = guestFriends.filter(f => f !== name);
    setGuestFriends(newList);
    localStorage.setItem('pkxd_guest_friends', JSON.stringify(newList));
    triggerAudio('tap');
    showAlert('Amigo removido da lista local.');
  };

  const handleClaimFreeReward = () => {
    triggerAudio('tap');
    showAlert('Resgate um cupom ativo na seção de códigos abaixo para ganhar Joias e Moedas!');
    const redeemerBox = document.getElementById('promo-code-redeemer-box');
    if (redeemerBox) {
      redeemerBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      redeemerBox.classList.add('ring-4', 'ring-purple-400');
      setTimeout(() => {
        redeemerBox.classList.remove('ring-4', 'ring-purple-400');
      }, 2000);
    }
  };

  const handleSaveProfile = () => {
    triggerAudio('success');
    const cleanedName = editName.trim().replace(/\s+/g, '_');
    if (cleanedName.length === 0) {
      showAlert('Por favor, digite um nome válido!');
      return;
    }
    setNickname(cleanedName);
    setBio(editBio.trim() || 'Fã de PK XD Central!');
    setInstagram(editInsta.trim());
    setCustomProfileImage(editCustomPic.trim());
    setIsEditing(false);
    showAlert('Seu perfil foi atualizado!');
    window.dispatchEvent(new Event('storage'));
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('Imagem muito pesada! Escolha uma menor que 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditCustomPic(reader.result as string);
        showAlert('Foto carregada! Clique em "Salvar Alterações" para aplicar.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarPicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('Imagem muito pesada! Escolha uma menor que 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarBase64(reader.result as string);
        showAlert('Imagem do avatar carregada!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showAlert('Apenas administradores podem criar avatares na loja!');
      return;
    }
    if (!newAvatarName.trim()) {
      showAlert('Dê um nome para o seu avatar!');
      return;
    }

    const finalImageUrl = newAvatarBase64 || newAvatarUrl.trim();
    if (!finalImageUrl) {
      showAlert('Envie uma foto ou cole um link de imagem do avatar!');
      return;
    }

    triggerAudio('success');
    const avatarId = 'custom_' + Date.now();
    const newAvatar: CustomAvatar = {
      id: avatarId,
      name: newAvatarName.trim(),
      imageUrl: finalImageUrl,
      priceGems: Number(newAvatarPriceGems) || 0,
      priceCoins: Number(newAvatarPriceCoins) || 0,
      creatorName: nickname,
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'custom_avatars', avatarId), newAvatar);
      setOwnedAvatars(prev => [...prev, avatarId]);
      setNewAvatarName('');
      setNewAvatarUrl('');
      setNewAvatarBase64('');
      setIsCreateAvatarOpen(false);
      showAlert(`Avatar "${newAvatar.name}" publicado na Loja!`);
    } catch (err) {
      console.error(err);
      showAlert('Erro ao salvar o avatar na nuvem.');
    }
  };

  const handleDeleteAvatar = async (avatar: CustomAvatar) => {
    triggerAudio('tap');
    try {
      await deleteDoc(doc(db, 'custom_avatars', avatar.id));
      setConfirmDeleteAvatarId(null);
      showAlert('Avatar removido da loja.');
    } catch {
      showAlert('Erro ao deletar o avatar.');
    }
  };

  const handleBuyAvatar = (avatar: CustomAvatar) => {
    if (ownedAvatars.includes(avatar.id)) {
      showAlert('Você já possui esse avatar!');
      return;
    }

    const canBuyGems = avatar.priceGems > 0 && gems >= avatar.priceGems;
    const canBuyCoins = avatar.priceCoins > 0 && coins >= avatar.priceCoins;

    if (!canBuyGems && !canBuyCoins) {
      showAlert('Saldo insuficiente! Resgate moedas/joias nos cupons abaixo.');
      return;
    }

    triggerAudio('success');
    if (canBuyCoins) {
      setCoins(prev => prev - avatar.priceCoins);
      showAlert(`Compra realizada! Você gastou ${avatar.priceCoins} moedas.`);
    } else {
      setGems(prev => prev - avatar.priceGems);
      showAlert(`Compra realizada! Você gastou ${avatar.priceGems} joias.`);
    }

    setOwnedAvatars(prev => [...prev, avatar.id]);
  };

  const getAvatarDisplay = () => {
    if (customProfileImage) {
      return (
        <img
          src={customProfileImage}
          alt="Foto de Perfil"
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }

    const foundPreset = avatarPresets.find(p => p.id === activeAvatarId);
    if (foundPreset) {
      return <span className="text-4xl select-none">{foundPreset.emoji}</span>;
    }

    const foundCustom = shopAvatars.find(a => a.id === activeAvatarId);
    if (foundCustom) {
      return (
        <img
          src={foundCustom.imageUrl}
          alt={foundCustom.name}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      );
    }

    return <span className="text-4xl select-none">🥤</span>;
  };

  const getAvatarColorClass = () => {
    if (customProfileImage) return 'bg-white';
    const found = avatarPresets.find(p => p.id === activeAvatarId);
    return found ? found.color : 'bg-[#F3F0FF]';
  };

  const pendingFriendRequests = user
    ? friendships.filter(f => f.status === 'pending' && f.receiverId === user.uid)
    : [];

  return (
    <div id="apple-profile-header-root" className="max-w-4xl mx-auto space-y-5 select-none animate-fade-in relative z-20 text-left">
      {/* 1. ACCESSORY TOP BAR */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 px-4 flex items-center justify-between shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerAudio('tap');
              setIsEditing(!isEditing);
              setShowFriendsPanel(false);
              setIsStoreOpen(false);
              setEditName(nickname);
              setEditBio(bio);
              setEditInsta(instagram);
              setEditCustomPic(customProfileImage);
            }}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border-2 text-xs font-extrabold ${
              isEditing
                ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Ajustar Perfil"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Ajustes do Perfil</span>
          </button>

          <button
            onClick={() => {
              triggerAudio('tap');
              setShowFriendsPanel(!showFriendsPanel);
              setIsEditing(false);
              setIsStoreOpen(false);
            }}
            className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border-2 text-xs font-extrabold ${
              showFriendsPanel
                ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Lista de Amigos"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Amigos</span>
          </button>

          <button
            onClick={handleClaimFreeReward}
            className="px-3 py-2 bg-pink-50 hover:bg-pink-100 border-2 border-pink-200 rounded-xl transition-colors cursor-pointer text-pink-700 flex items-center gap-1.5 font-extrabold text-xs"
            title="Resgatar Joias e Moedas"
          >
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Cupons</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>PKXD Central 2.0 • Perfil Oficial</span>
        </div>

        {/* Currency Indicator Box */}
        <div className="flex items-center gap-2">
          <div className="bg-[#FFFBEB] border-2 border-amber-300 rounded-full py-1 px-3 flex items-center gap-1.5">
            <span className="text-sm">🪙</span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-800 font-mono tabular-nums">
              {coins.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="bg-[#F3F0FF] border-2 border-purple-200 rounded-full py-1 px-3 flex items-center gap-1.5">
            <span className="text-sm">💎</span>
            <span className="text-xs sm:text-sm font-extrabold text-[#6D28D9] font-mono tabular-nums">
              {gems.toLocaleString('pt-BR')}
            </span>
            <button
              onClick={() => {
                triggerAudio('tap');
                handleClaimFreeReward();
              }}
              className="w-5 h-5 rounded-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
              title="Ganhar mais Joias"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE PROFILE PANEL */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
          {/* Avatar + Info */}
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative flex-shrink-0 select-none group">
              <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#FACC15] via-pink-500 to-[#6D28D9] shadow-md">
                <button
                  onClick={() => {
                    triggerAudio('tap');
                    setIsEditing(true);
                  }}
                  className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden cursor-pointer ${getAvatarColorClass()}`}
                  title="Alterar foto de perfil"
                >
                  {getAvatarDisplay()}
                </button>
              </div>

              <div className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Camera className="w-6 h-6 text-white" />
              </div>

              <span
                className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow"
                title="Jogador Online"
              />
            </div>

            <div className="space-y-2 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="font-display font-bold text-2xl text-slate-900 leading-tight">
                  {nickname}
                </h2>

                {isAdmin && (
                  <span
                    className="inline-flex items-center justify-center bg-[#0284C7] text-white rounded-full text-[10px] font-black w-5 h-5 select-none"
                    title="Criador Verificado Oficial"
                  >
                    ✓
                  </span>
                )}

                <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  #{nickname.toLowerCase()}
                </span>
              </div>

              <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line max-w-lg">
                {bio}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  onClick={() => {
                    triggerAudio('tap');
                    setIsEditing(!isEditing);
                    setShowFriendsPanel(false);
                    setIsStoreOpen(false);
                    setEditName(nickname);
                    setEditBio(bio);
                    setEditInsta(instagram);
                    setEditCustomPic(customProfileImage);
                  }}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full transition-colors text-xs font-extrabold text-slate-800 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#6D28D9]" />
                  <span>Editar Perfil</span>
                </button>

                <button
                  onClick={() => {
                    triggerAudio('tap');
                    setShowFriendsPanel(!showFriendsPanel);
                    setIsEditing(false);
                    setIsStoreOpen(false);
                  }}
                  className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 border rounded-full transition-colors text-xs font-extrabold cursor-pointer ${
                    showFriendsPanel
                      ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Amigos</span>
                  {pendingFriendRequests.length > 0 && (
                    <span className="bg-rose-600 text-white text-[10px] font-black h-4 px-1.5 rounded-full flex items-center justify-center">
                      {pendingFriendRequests.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    triggerAudio('tap');
                    setIsStoreOpen(!isStoreOpen);
                    setIsEditing(false);
                    setShowFriendsPanel(false);
                  }}
                  className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 border rounded-full transition-colors text-xs font-extrabold cursor-pointer ${
                    isStoreOpen
                      ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Loja de Avatares</span>
                </button>
              </div>
            </div>
          </div>

          {/* Level Tracker Badge */}
          <div className="bg-[#F3F0FF] border-2 border-purple-200 p-4 rounded-2xl text-center space-y-1 min-w-[115px] self-center sm:self-start shrink-0">
            <div className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Nível Fã</div>
            <div className="text-3xl font-display font-bold text-[#6D28D9] leading-none">{fanLevel}</div>
            <div className="text-xs font-bold text-slate-600 font-mono tabular-nums">{fanXP}% XP</div>
          </div>
        </div>

        {/* 3. PROFILE EDITING FORM */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t-2 border-slate-100 mt-6 pt-5 text-left"
            >
              <div className="space-y-4 max-w-2xl">
                <h4 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#6D28D9]" />
                  <span>Personalizar Perfil Público</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Apelido de Fã</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={editName}
                      disabled={!user}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Ex: Explorador"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none border-2 ${
                        !user
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                          : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-[#6D28D9]'
                      }`}
                    />
                    {!user && (
                      <span className="text-[11px] text-amber-700 font-bold block mt-1">
                        Entre na sua conta abaixo para alterar seu apelido.
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Link de Foto Externa (Opcional)</label>
                    <input
                      type="text"
                      value={editCustomPic}
                      onChange={(e) => setEditCustomPic(e.target.value)}
                      placeholder="Cole um link https://..."
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Minha Biografia</label>
                  <textarea
                    rows={2}
                    maxLength={100}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Fale um pouco sobre você..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Instagram (@user ou link)</label>
                    <input
                      type="text"
                      maxLength={30}
                      value={editInsta}
                      onChange={(e) => setEditInsta(e.target.value)}
                      placeholder="@seu_instagram"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 block">Enviar foto do dispositivo</label>
                    <label className="w-full bg-slate-50 hover:bg-slate-100 transition-colors border-2 border-dashed border-slate-300 rounded-xl px-3.5 py-2.5 flex items-center justify-center gap-2 cursor-pointer text-xs font-extrabold text-slate-700">
                      <Upload className="w-4 h-4 text-[#6D28D9]" />
                      <span>Upload de Foto</span>
                      <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 block">Ou escolha um Avatar Desbloqueado</label>
                  <div className="flex flex-wrap gap-2">
                    {avatarPresets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          triggerAudio('tap');
                          setActiveAvatarId(p.id);
                          setEditCustomPic('');
                        }}
                        className={`p-2 px-3 rounded-xl border-2 text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer ${
                          activeAvatarId === p.id && !editCustomPic
                            ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-base">{p.emoji}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}

                    {shopAvatars
                      .filter(a => ownedAvatars.includes(a.id))
                      .map((avatar) => (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => {
                            triggerAudio('tap');
                            setActiveAvatarId(avatar.id);
                            setEditCustomPic('');
                          }}
                          className={`p-1.5 px-3 rounded-xl border-2 text-xs font-extrabold transition-colors flex items-center gap-2 cursor-pointer ${
                            activeAvatarId === avatar.id && !editCustomPic
                              ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <img src={avatar.imageUrl} alt={avatar.name} className="w-5 h-5 rounded-full object-cover" />
                          <span>{avatar.name}</span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button onClick={handleSaveProfile} className="pkxd-btn-primary px-5 py-2.5 text-xs cursor-pointer">
                    Salvar Alterações
                  </button>
                  <button
                    onClick={() => {
                      triggerAudio('tap');
                      setIsEditing(false);
                    }}
                    className="pkxd-btn-outline px-4 py-2.5 text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3.5. FRIENDS SYSTEM */}
        <AnimatePresence>
          {showFriendsPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t-2 border-slate-100 mt-6 pt-5 text-left"
            >
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Users className="w-5 h-5 text-[#6D28D9]" />
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">Painel de Amigos da Central</h3>
                    <p className="text-xs text-slate-600">
                      Adicione outros fãs de PK XD para acompanhar seus níveis e conexões em tempo real.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* LEFT COLUMN: ADD FRIENDS */}
                  <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-[#6D28D9] uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4" />
                      <span>Adicionar Novos Amigos</span>
                    </h4>

                    {user ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Busque pelo apelido de um jogador cadastrado para enviar solicitação:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={friendSearchQuery}
                            onChange={(e) => setFriendSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchFriends()}
                            placeholder="Buscar por apelido..."
                            className="bg-white border-2 border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#6D28D9] flex-1"
                          />
                          <button
                            onClick={handleSearchFriends}
                            disabled={searchingFriends}
                            className="pkxd-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>{searchingFriends ? '...' : 'Buscar'}</span>
                          </button>
                        </div>

                        {friendSearchResults.length > 0 && (
                          <div className="space-y-2 mt-2 max-h-[170px] overflow-y-auto pr-1 custom-scrollbar">
                            <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                              Jogadores Encontrados:
                            </h5>
                            {friendSearchResults.map((player) => {
                              const isAlreadyFriend = friendships.some(
                                f => f.status === 'accepted' && (f.senderId === player.id || f.receiverId === player.id)
                              );
                              const isPending = friendships.some(
                                f => f.status === 'pending' && (f.senderId === player.id || f.receiverId === player.id)
                              );

                              return (
                                <div
                                  key={player.id}
                                  className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-[#F3F0FF] flex items-center justify-center font-bold text-[#6D28D9] text-xs border border-purple-200">
                                      {player.name ? player.name.slice(0, 2).toUpperCase() : 'PK'}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 flex items-center gap-1">
                                        <span>{player.name}</span>
                                        {player.level >= 10 && (
                                          <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-full font-extrabold">
                                            Mestre
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        Nível {player.level || 1} • {player.flames || 1} 🔥
                                      </div>
                                    </div>
                                  </div>

                                  {isAlreadyFriend ? (
                                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" /> Amigo
                                    </span>
                                  ) : isPending ? (
                                    <span className="text-xs font-semibold text-[#6D28D9]">Pendente...</span>
                                  ) : (
                                    <button
                                      onClick={() => handleSendFriendRequest(player)}
                                      className="py-1 px-2.5 bg-[#F3F0FF] hover:bg-[#6D28D9] border border-purple-200 text-[#6D28D9] hover:text-white rounded-lg text-[11px] font-extrabold uppercase transition-colors cursor-pointer"
                                    >
                                      Adicionar
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-[#F3F0FF] border border-purple-200 rounded-xl">
                          <p className="text-xs text-purple-900 leading-relaxed font-semibold">
                            Você está como Convidado! Entre na sua conta para adicionar amigos reais no servidor.
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-600 font-extrabold uppercase">
                          Adicionar amigo na lista local
                        </p>
                        <form onSubmit={handleAddGuestFriend} className="flex gap-2">
                          <input
                            id="guest-friend-name-input"
                            type="text"
                            maxLength={15}
                            placeholder="Apelido do amigo..."
                            className="bg-white border-2 border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#6D28D9] flex-1"
                          />
                          <button type="submit" className="pkxd-btn-primary px-4 py-2 text-xs cursor-pointer">
                            Adicionar
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: FRIENDS LIST */}
                  <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl space-y-4">
                    {user ? (
                      <div className="space-y-4">
                        {pendingFriendRequests.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-extrabold text-pink-700 uppercase tracking-wider flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4" />
                              <span>Solicitações Pendentes</span>
                            </h4>
                            <div className="space-y-2">
                              {pendingFriendRequests.map((friendship) => (
                                <div
                                  key={friendship.id}
                                  className="p-2.5 bg-white border border-pink-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-700 text-xs">
                                      {friendship.senderName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900">{friendship.senderName}</span>
                                      <span className="block text-[10px] text-slate-500">Quer ser seu amigo!</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleAcceptFriendRequest(friendship)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold uppercase cursor-pointer"
                                    >
                                      Aceitar
                                    </button>
                                    <button
                                      onClick={() => handleRemoveFriendship(friendship.id)}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-extrabold uppercase cursor-pointer"
                                    >
                                      Recusar
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold text-[#6D28D9] uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>Seus Amigos ({friendships.filter(f => f.status === 'accepted').length})</span>
                          </h4>

                          {friendships.filter(f => f.status === 'accepted').length === 0 ? (
                            <p className="text-xs text-slate-500 italic">
                              Você ainda não adicionou amigos na comunidade. Busque jogadores ao lado!
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                              {friendships
                                .filter(f => f.status === 'accepted')
                                .map((friendship) => {
                                  const isSender = friendship.senderId === user.uid;
                                  const friendName = isSender ? friendship.receiverName : friendship.senderName;
                                  const confirming = confirmRemoveFriendId === friendship.id;

                                  return (
                                    <div
                                      key={friendship.id}
                                      className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#F3F0FF] flex items-center justify-center font-bold text-[#6D28D9] text-xs border border-purple-200">
                                          {friendName.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="font-bold text-slate-900">{friendName}</div>
                                          <div className="text-[10px] text-slate-500">Amigo Verificado</div>
                                        </div>
                                      </div>

                                      {confirming ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleRemoveFriendship(friendship.id)}
                                            className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                          >
                                            Sim
                                          </button>
                                          <button
                                            onClick={() => setConfirmRemoveFriendId(null)}
                                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                                          >
                                            Não
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setConfirmRemoveFriendId(friendship.id)}
                                          title="Desfazer Amizade"
                                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-[#6D28D9] uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>Lista de Amigos Local ({guestFriends.length})</span>
                        </h4>

                        {guestFriends.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Lista vazia. Adicione apelidos ao lado!</p>
                        ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                            {guestFriends.map((friendName) => (
                              <div
                                key={friendName}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-[#F3F0FF] flex items-center justify-center font-bold text-[#6D28D9] text-xs border border-purple-200">
                                    {friendName.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900">{friendName}</span>
                                    <span className="block text-[10px] text-slate-500">Amigo Local</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRemoveGuestFriend(friendName)}
                                  title="Remover Amigo"
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. AVATAR STORE */}
        <AnimatePresence>
          {isStoreOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t-2 border-slate-100 mt-6 pt-5 text-left"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <Store className="w-5 h-5 text-[#6D28D9]" />
                    <div>
                      <h3 className="font-display text-base font-bold text-slate-900">
                        Loja de Avatares da Comunidade
                      </h3>
                      <p className="text-xs text-slate-600">
                        Desbloqueie e equipe novos avatares exclusivos usando suas Joias e Moedas do portal.
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        triggerAudio('tap');
                        setIsCreateAvatarOpen(!isCreateAvatarOpen);
                      }}
                      className="pkxd-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Criar Novo (Admin)</span>
                    </button>
                  )}
                </div>

                {isCreateAvatarOpen && (
                  <motion.form
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleCreateAvatar}
                    className="p-4 bg-[#F3F0FF] border-2 border-purple-200 rounded-2xl space-y-3"
                  >
                    <h4 className="text-xs font-extrabold text-[#6D28D9] uppercase">Novo Avatar para a Loja</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-700">Nome do Avatar</label>
                        <input
                          type="text"
                          required
                          value={newAvatarName}
                          onChange={(e) => setNewAvatarName(e.target.value)}
                          placeholder="Ex: Koosh Supremo"
                          className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#6D28D9]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-700">Enviar Foto</label>
                        <label className="w-full bg-white hover:bg-slate-50 border-2 border-dashed border-purple-300 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                          <Upload className="w-3.5 h-3.5 text-[#6D28D9]" />
                          <span>{newAvatarBase64 ? 'Foto Carregada!' : 'Upload de Foto'}</span>
                          <input type="file" accept="image/*" onChange={handleAvatarPicUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700">Ou link de imagem externa (URL)</label>
                      <input
                        type="text"
                        value={newAvatarUrl}
                        onChange={(e) => setNewAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#6D28D9]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-700">Preço em Joias 💎</label>
                        <input
                          type="number"
                          min={0}
                          value={newAvatarPriceGems}
                          onChange={(e) => setNewAvatarPriceGems(Number(e.target.value))}
                          className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-700">Preço em Moedas 🪙</label>
                        <input
                          type="number"
                          min={0}
                          value={newAvatarPriceCoins}
                          onChange={(e) => setNewAvatarPriceCoins(Number(e.target.value))}
                          className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="pkxd-btn-primary px-4 py-2 text-xs cursor-pointer">
                        Publicar Avatar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreateAvatarOpen(false)}
                        className="pkxd-btn-outline px-4 py-2 text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </motion.form>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {avatarPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm">
                        {preset.emoji}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900">{preset.label.split(' ')[0]}</div>
                        <div className="text-[10px] text-slate-500">Padrão</div>
                      </div>
                      <div className="w-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold py-1 rounded-xl">
                        Desbloqueado ✓
                      </div>
                    </div>
                  ))}

                  {shopAvatars.map((avatar) => {
                    const isOwned = ownedAvatars.includes(avatar.id);
                    const isConfirmingDel = confirmDeleteAvatarId === avatar.id;
                    return (
                      <div
                        key={avatar.id}
                        className="p-3.5 bg-white border-2 border-slate-200 rounded-2xl flex flex-col items-center text-center justify-between space-y-2 relative"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                          <img
                            src={avatar.imageUrl}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 truncate max-w-[110px]">{avatar.name}</div>
                          <div className="text-[10px] text-slate-500">Por {avatar.creatorName}</div>
                        </div>

                        {!isOwned && (
                          <div className="flex items-center gap-2 text-xs font-extrabold font-mono text-slate-700">
                            {avatar.priceGems > 0 && <span>💎{avatar.priceGems}</span>}
                            {avatar.priceCoins > 0 && <span>🪙{avatar.priceCoins}</span>}
                          </div>
                        )}

                        {isOwned ? (
                          <button
                            onClick={() => {
                              triggerAudio('tap');
                              setActiveAvatarId(avatar.id);
                              setCustomProfileImage('');
                              showAlert(`Avatar "${avatar.name}" equipado!`);
                            }}
                            className={`w-full py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer ${
                              activeAvatarId === avatar.id && !customProfileImage
                                ? 'bg-[#6D28D9] text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            {activeAvatarId === avatar.id && !customProfileImage ? 'Equipado' : 'Equipar'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyAvatar(avatar)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Comprar</span>
                          </button>
                        )}

                        {(isAdmin || avatar.creatorName === nickname) && (
                          isConfirmingDel ? (
                            <div className="flex items-center gap-1 pt-1">
                              <button
                                onClick={() => handleDeleteAvatar(avatar)}
                                className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmDeleteAvatarId(null)}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteAvatarId(avatar.id)}
                              className="absolute top-2 right-2 p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                              title="Deletar Avatar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating System Notification */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-extrabold p-3 px-5 rounded-full shadow-xl border-2 border-[#6D28D9] flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>{notif}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

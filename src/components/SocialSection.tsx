import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart, MessageSquare, Send, User, Award, Trash2,
  Instagram, Sparkles, Clock, AlertTriangle, Smile, Shield, X, CheckCircle2
} from 'lucide-react';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  query, orderBy, limit, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import { Post } from '../types';
import CommentsSection from './CommentsSection';

interface SocialSectionProps {
  currentUser: any;
  isAdmin: boolean;
  onAddXP: (amount: number, reason: string) => void;
  soundEnabled: boolean;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
  onLoginRedirect: () => void;
}

export default function SocialSection({
  currentUser,
  isAdmin,
  onAddXP,
  triggerAudio,
  onLoginRedirect
}: SocialSectionProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);

  // Public Profile Modal State
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProfileData, setSelectedProfileData] = useState<any>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);

  // Local feedback message
  const [notif, setNotif] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3200);
  };

  // Real-time listen to community posts from Firestore
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        postsData.push({
          id: docSnap.id,
          authorName: data.authorName || 'Fã Secreto',
          authorId: data.authorId || '',
          authorAvatar: data.authorAvatar || '',
          content: data.content || '',
          likes: Number(data.likes) || 0,
          likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
          createdAt: Number(data.createdAt) || Date.now()
        });
      });
      setPosts(postsData);
    }, (error) => {
      console.error('Error loading posts:', error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch or listen to profile stats when a profile is selected
  useEffect(() => {
    if (!selectedProfileId) {
      setSelectedProfileData(null);
      setProfilePosts([]);
      return;
    }

    const profileRef = doc(db, 'leaderboard', selectedProfileId);
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setSelectedProfileData({ id: docSnap.id, ...docSnap.data() });
      } else {
        setSelectedProfileData({
          id: selectedProfileId,
          name: 'Fã Secreto',
          level: 1,
          flames: 1,
          xp: 0,
          bio: 'Este fã é super misterioso e ainda não configurou seu perfil público!'
        });
      }
    });

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const pPosts: Post[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.authorId === selectedProfileId) {
          pPosts.push({
            id: docSnap.id,
            authorName: data.authorName || 'Fã Secreto',
            authorId: data.authorId || '',
            authorAvatar: data.authorAvatar || '',
            content: data.content || '',
            likes: Number(data.likes) || 0,
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            createdAt: Number(data.createdAt) || Date.now()
          });
        }
      });
      setProfilePosts(pPosts);
    });

    return () => {
      unsubscribeProfile();
      unsubscribePosts();
    };
  }, [selectedProfileId]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      triggerAudio('tap');
      showNotification('Entre na sua conta para poder postar!');
      return;
    }

    const content = newPostContent.trim();
    if (content.length === 0) return;

    if (content.length > 500) {
      showNotification('O post não pode passar de 500 caracteres.');
      return;
    }

    setIsSubmitting(true);
    triggerAudio('tap');

    const postId = 'post_' + Date.now();
    const nickname = localStorage.getItem('pkxd_username_nickname') || currentUser.displayName || 'Jogador_Convidado';

    try {
      const postRef = doc(db, 'posts', postId);
      await setDoc(postRef, {
        id: postId,
        authorName: nickname,
        authorId: currentUser.uid,
        authorAvatar: currentUser.photoURL || '',
        content: content,
        likes: 0,
        likedBy: [],
        createdAt: Date.now()
      });

      setNewPostContent('');
      triggerAudio('success');
      showNotification('Post compartilhado no Mural da Comunidade!');

      try {
        const lastMissionsStr = localStorage.getItem('pkxd_daily_missions_state');
        if (lastMissionsStr) {
          const missions = JSON.parse(lastMissionsStr);
          const updated = missions.map((m: any) => {
            if (m.type === 'post' && !m.completed) {
              m.completed = true;
              onAddXP(m.xpReward, `Missão Cumprida: ${m.title}! 🎯`);
              showNotification(`Missão Completa: ${m.title}! +${m.xpReward} XP`);
            }
            return m;
          });
          localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn(e);
      }

      onAddXP(40, 'Publicação de Post na Comunidade 💬');
    } catch (err: any) {
      console.error(err);
      showNotification('Erro ao postar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (post: Post) => {
    if (!currentUser) {
      triggerAudio('tap');
      showNotification('Entre na sua conta para curtir as postagens!');
      return;
    }

    triggerAudio('tap');
    const postRef = doc(db, 'posts', post.id);
    const hasLiked = post.likedBy.includes(currentUser.uid);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUser.uid),
          likes: Math.max(0, post.likes - 1)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(currentUser.uid),
          likes: post.likes + 1
        });

        triggerAudio('success');

        try {
          const lastMissionsStr = localStorage.getItem('pkxd_daily_missions_state');
          if (lastMissionsStr) {
            const missions = JSON.parse(lastMissionsStr);
            const updated = missions.map((m: any) => {
              if (m.type === 'like' && !m.completed) {
                m.completed = true;
                onAddXP(m.xpReward, `Missão Cumprida: ${m.title}! 🎯`);
                showNotification(`Missão Completa: ${m.title}! +${m.xpReward} XP`);
              }
              return m;
            });
            localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(updated));
          }
        } catch (e) {
          console.warn(e);
        }

        onAddXP(10, 'Apreciação de fã 💖');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    triggerAudio('tap');
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setConfirmDeletePostId(null);
      showNotification('Post removido com sucesso!');
    } catch (err: any) {
      showNotification('Erro ao remover post: ' + err.message);
    }
  };

  const getAvatarFallback = (name: string) => {
    const chars = ['🤖', '🦄', '🐱', '🐶', '🦊', '🐻', '🐼', '🐯', '👽', '🦖', '🦁', '🦉'];
    const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return chars[sum % chars.length];
  };

  return (
    <div id="social-central-container" className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-50 bg-slate-900 text-white font-extrabold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border-2 border-[#6D28D9] text-xs sm:text-sm font-sans"
          >
            <CheckCircle2 className="w-4 h-4 text-[#FACC15]" />
            <span>{notif}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Central Header */}
      <div className="pkxd-glass rounded-3xl p-6 sm:p-8 space-y-3 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F0FF] border border-purple-200 text-[#6D28D9] font-extrabold text-xs uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          <span>PKXD Central • Rede Social</span>
        </div>

        <h3 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 flex items-center gap-2.5 flex-wrap">
          <span>Mural da Comunidade PKXD Central</span>
          <span className="text-xs bg-pink-100 text-pink-700 border border-pink-200 font-sans font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Ao Vivo
          </span>
        </h3>

        <p className="font-sans text-sm text-slate-600 leading-relaxed max-w-4xl">
          Compartilhe teorias, comente sobre atualizações, faça novas amizades no jogo e interaja com outros fãs da comunidade em tempo real.
        </p>
      </div>

      {/* Social Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Posting area and feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Creation Box */}
          <div className="pkxd-glass rounded-3xl p-5 sm:p-6 text-left space-y-4">
            <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-pink-600" />
              <span>O que está acontecendo no seu universo?</span>
            </h4>

            {currentUser ? (
              <form onSubmit={handleCreatePost} className="space-y-3">
                <div className="relative">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Compartilhe teorias, novidades ou mande um oi para a comunidade PKXD Central..."
                    maxLength={500}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9] min-h-[110px] resize-none font-sans leading-relaxed"
                  />
                  <div className="absolute bottom-3 right-4 text-[11px] font-mono tabular-nums text-slate-400 font-bold">
                    {newPostContent.length}/500
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-sans">
                    <span className="text-lg">{getAvatarFallback(localStorage.getItem('pkxd_username_nickname') || 'Jogador_Convidado')}</span>
                    <span>
                      Postando como:{' '}
                      <strong className="text-[#6D28D9] font-extrabold">
                        {localStorage.getItem('pkxd_username_nickname') || 'Fã Secreto'}
                      </strong>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || newPostContent.trim().length === 0}
                    className="pkxd-btn-primary px-5 py-2.5 disabled:opacity-50 disabled:pointer-events-none text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Publicando...' : 'Postar no Mural'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed font-sans max-w-lg mx-auto">
                  Conecte sua conta de fã para publicar no mural, curtir ideias da galera e desbloquear insígnias sociais.
                </p>
                <button
                  onClick={() => {
                    triggerAudio('tap');
                    onLoginRedirect();
                    setTimeout(() => {
                      document.getElementById('fan-level-dashboard')?.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                  }}
                  className="pkxd-btn-primary px-6 py-2.5 text-xs sm:text-sm inline-flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>Entrar / Criar Conta de Fã</span>
                </button>
              </div>
            )}
          </div>

          {/* Social Feed Items */}
          <div className="max-h-[620px] overflow-y-auto pr-1 sm:pr-2 space-y-4 custom-scrollbar">
            {posts.length === 0 ? (
              <div className="pkxd-glass rounded-3xl p-12 text-center space-y-2 select-none">
                <Smile className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-display font-bold text-base text-slate-800">Ainda não há posts</h4>
                <p className="font-sans text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Seja o primeiro a publicar algo legal e ganhar XP interagindo com a comunidade.
                </p>
              </div>
            ) : (
              posts.map((post) => {
                const isMyPost = currentUser && post.authorId === currentUser.uid;
                const isLikedByMe = currentUser && post.likedBy.includes(currentUser.uid);
                const isOfficialCreator =
                  post.authorName.toLowerCase().includes('admin') ||
                  post.authorId === 'admin_fallback' ||
                  post.authorId === 'p6u6hBInG8fS6hPzC78p4KXD';
                const confirmingDelete = confirmDeletePostId === post.id;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pkxd-glass rounded-3xl p-5 sm:p-6 text-left space-y-4 hover:border-purple-300 transition-colors"
                  >
                    {/* Author block */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            triggerAudio('tap');
                            setSelectedProfileId(post.authorId || null);
                          }}
                          className="w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FACC15] via-pink-500 to-[#6D28D9] hover:scale-105 active:scale-95 transition-transform cursor-pointer relative shrink-0"
                        >
                          <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xl shadow-inner">
                            <span className="select-none">{getAvatarFallback(post.authorName)}</span>
                          </div>
                          <span
                            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                            title="Membro Ativo"
                          />
                        </button>

                        <div className="space-y-0.5">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <button
                              onClick={() => {
                                triggerAudio('tap');
                                setSelectedProfileId(post.authorId || null);
                              }}
                              className="font-display text-sm sm:text-base font-bold text-slate-900 hover:text-[#6D28D9] hover:underline text-left cursor-pointer transition-colors"
                            >
                              {post.authorName}
                            </button>

                            {isOfficialCreator && (
                              <span
                                className="inline-flex items-center justify-center bg-[#0284C7] text-white rounded-full text-[9px] font-black w-4 h-4 select-none"
                                title="Criador Oficial Verificado"
                              >
                                ✓
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 font-sans font-medium">
                            {post.createdAt && !isNaN(new Date(post.createdAt).getTime())
                              ? `${new Date(post.createdAt).toLocaleDateString('pt-BR')} às ${new Date(post.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                              : 'Recente'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOfficialCreator && (
                          <span className="text-[10px] font-extrabold bg-[#F3F0FF] text-[#6D28D9] border border-purple-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            CREATOR
                          </span>
                        )}

                        {(isAdmin || isMyPost) && (
                          confirmingDelete ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold rounded-lg cursor-pointer"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeletePostId(null)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                triggerAudio('tap');
                                setConfirmDeletePostId(post.id);
                              }}
                              title="Excluir Post"
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <p className="font-sans text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Action Bar */}
                    <div className="flex items-center gap-6 pt-3 border-t border-slate-100 text-xs sm:text-sm font-bold">
                      <button
                        onClick={() => handleLikePost(post)}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isLikedByMe ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'
                        }`}
                      >
                        <Heart className={`w-4.5 h-4.5 ${isLikedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{post.likes === 1 ? '1 curtida' : `${post.likes} curtidas`}</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerAudio('tap');
                          setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id);
                        }}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                          activeCommentsPostId === post.id
                            ? 'text-[#6D28D9]'
                            : 'text-slate-500 hover:text-[#6D28D9]'
                        }`}
                      >
                        <MessageSquare className="w-4.5 h-4.5" />
                        <span>Comentários</span>
                      </button>
                    </div>

                    {/* Integrated Comments Area */}
                    <AnimatePresence>
                      {activeCommentsPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pt-2"
                        >
                          <CommentsSection
                            targetId={post.id}
                            targetType="post"
                            currentUser={currentUser}
                            isAdmin={isAdmin}
                            onAddXP={onAddXP}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Rules Box */}
          <div className="pkxd-glass rounded-3xl p-5 sm:p-6 text-left space-y-4">
            <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Regras do Mural</span>
            </h4>
            <ul className="list-disc pl-4 font-sans text-xs text-slate-600 space-y-2 leading-relaxed">
              <li>
                <strong className="text-slate-900">Respeito sempre:</strong> Ofensas, bullying ou provocações não são tolerados.
              </li>
              <li>
                <strong className="text-slate-900">Sem Spoilers Falsos:</strong> Compartilhe apenas ideias, teorias e informações confiáveis.
              </li>
              <li>
                <strong className="text-slate-900">Evite Spam:</strong> Não envie o mesmo post repetidamente ou propagandas não autorizadas.
              </li>
              <li>
                <strong className="text-slate-900">Moderação Ativa:</strong> Publicações fora das regras são removidas pela equipe.
              </li>
            </ul>
          </div>

          {/* Social Badges Widget */}
          <div className="pkxd-glass rounded-3xl p-5 sm:p-6 text-left space-y-4">
            <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0284C7]" />
              <span>Insígnias Sociais</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Interaja no Mural e suba de nível para desbloquear insígnias exclusivas exibidas no seu perfil público.
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FFFBEB] border border-amber-200">
                <span className="text-xl">🌟</span>
                <div>
                  <h5 className="text-xs font-extrabold text-amber-900 leading-tight">Fã Conectado</h5>
                  <p className="text-[11px] text-amber-800/80">Logou com conta registrada no site.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#F3F0FF] border border-purple-200">
                <span className="text-xl">🔮</span>
                <div>
                  <h5 className="text-xs font-extrabold text-purple-900 leading-tight">Veterano da Central</h5>
                  <p className="text-[11px] text-purple-800/80">Alcançou o Nível de Fã 5+.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#EFF8FF] border border-sky-200">
                <span className="text-xl">🚀</span>
                <div>
                  <h5 className="text-xs font-extrabold text-sky-900 leading-tight">Mestre dos Spoilers</h5>
                  <p className="text-[11px] text-sky-800/80">Alcançou o Nível de Fã 10+.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-orange-50 border border-orange-200">
                <span className="text-xl">🔥</span>
                <div>
                  <h5 className="text-xs font-extrabold text-orange-900 leading-tight">Estrela Cósmica</h5>
                  <p className="text-[11px] text-orange-800/80">Alcançou 10+ Fogos conquistados.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PUBLIC PROFILE MODAL */}
      <AnimatePresence>
        {selectedProfileId && selectedProfileData && (
          <div
            onClick={() => setSelectedProfileId(null)}
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="pkxd-glass-modal rounded-3xl p-6 sm:p-8 w-full max-w-xl relative my-auto text-left overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#6D28D9] via-[#E83EBC] to-[#0284C7]" />

              <button
                onClick={() => setSelectedProfileId(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Fechar Perfil"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FACC15] via-pink-500 to-[#6D28D9] p-1 flex items-center justify-center shadow-md relative select-none text-4xl shrink-0">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    {getAvatarFallback(selectedProfileData.name || 'Fã')}
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h3 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <span>{selectedProfileData.name}</span>
                    {selectedProfileData.level >= 10 && (
                      <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full border border-sky-200 font-sans font-extrabold">
                        Mestre
                      </span>
                    )}
                  </h3>

                  <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                    <span className="text-xs font-extrabold text-orange-800 font-mono tabular-nums bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                      🔥 {selectedProfileData.flames || 1} FOGOS
                    </span>
                    <span className="text-xs font-extrabold text-amber-900 font-mono tabular-nums bg-[#FFFBEB] border border-amber-300 px-3 py-1 rounded-full">
                      ⭐ NÍVEL {selectedProfileData.level || 1}
                    </span>
                  </div>

                  {selectedProfileData.instagram && selectedProfileData.instagramPublic !== false && (
                    <a
                      href={
                        selectedProfileData.instagram.startsWith('http')
                          ? selectedProfileData.instagram
                          : `https://instagram.com/${selectedProfileData.instagram.replace('@', '')}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:underline font-mono"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>
                        {selectedProfileData.instagram.startsWith('@')
                          ? selectedProfileData.instagram
                          : `@${selectedProfileData.instagram.split('/').pop()}`}
                      </span>
                    </a>
                  )}
                </div>
              </div>

              {/* Bio Block */}
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-1">
                <h4 className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold">Biografia do Fã</h4>
                <p className="font-sans text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  {selectedProfileData.bio || '“Sou um fã apaixonado por PK XD e acompanho todas as novidades da PKXD Central!”'}
                </p>
              </div>

              {/* Earned Badges block */}
              <div className="mt-5 space-y-2.5">
                <h4 className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold">Conquistas & Badges</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 bg-slate-50 ${selectedProfileData.id.startsWith('u_') ? 'border-slate-200 opacity-50' : 'border-amber-300 bg-[#FFFBEB]'}`}>
                    <span className="text-2xl">🌟</span>
                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-900 leading-tight">FÃ REGISTRADO</h5>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {selectedProfileData.id.startsWith('u_') ? 'Bloqueado' : 'Desbloqueado'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 bg-slate-50 ${selectedProfileData.level < 5 ? 'border-slate-200 opacity-50' : 'border-purple-300 bg-[#F3F0FF]'}`}>
                    <span className="text-2xl">🔮</span>
                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-900 leading-tight">FÃ VETERANO</h5>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {selectedProfileData.level < 5 ? 'Nível 5+' : 'Desbloqueado'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 bg-slate-50 ${selectedProfileData.level < 10 ? 'border-slate-200 opacity-50' : 'border-sky-300 bg-[#EFF8FF]'}`}>
                    <span className="text-2xl">🚀</span>
                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-900 leading-tight">MESTRE SPOILER</h5>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {selectedProfileData.level < 10 ? 'Nível 10+' : 'Desbloqueado'}
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 bg-slate-50 ${selectedProfileData.flames < 10 ? 'border-slate-200 opacity-50' : 'border-orange-300 bg-orange-50'}`}>
                    <span className="text-2xl">🔥</span>
                    <div>
                      <h5 className="text-[11px] font-extrabold text-slate-900 leading-tight">ESTRELA DE FOGO</h5>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {selectedProfileData.flames < 10 ? '10+ Fogos' : 'Desbloqueado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent posts by user */}
              <div className="mt-5 space-y-2.5">
                <h4 className="text-[11px] text-slate-500 uppercase tracking-wider font-extrabold">
                  Publicações Recentes ({profilePosts.length})
                </h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                  {profilePosts.length === 0 ? (
                    <p className="text-xs text-slate-500 font-sans italic">Nenhum post publicado recentemente no mural.</p>
                  ) : (
                    profilePosts.map((pp) => (
                      <div key={pp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                        <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">{pp.content}</p>
                        <span className="block text-[10px] text-slate-500 font-mono">
                          {pp.createdAt && !isNaN(new Date(pp.createdAt).getTime())
                            ? new Date(pp.createdAt).toLocaleDateString('pt-BR')
                            : 'Recente'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedProfileId(null)}
                  className="pkxd-btn-outline w-full py-2.5 text-xs font-extrabold cursor-pointer text-center"
                >
                  Fechar Perfil
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

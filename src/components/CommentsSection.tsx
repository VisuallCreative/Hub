import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  Check,
  AlertTriangle,
  User,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AppComment } from '../types';
import { playTapSound, playSuccessSound } from '../utils/audio';
import { checkIsIllicit } from '../utils/moderation';

interface CommentsSectionProps {
  targetId: string;
  targetType: 'theory' | 'video' | 'post';
  currentUser: any;
  isAdmin: boolean;
  onAddXP?: (amount: number, reason: string) => void;
}

export default function CommentsSection({
  targetId,
  targetType,
  currentUser,
  isAdmin,
  onAddXP
}: CommentsSectionProps) {
  const [comments, setComments] = useState<AppComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [guestName, setGuestName] = useState(() => {
    return localStorage.getItem('pkxd_comment_guest_name') || '';
  });
  const [loading, setLoading] = useState(true);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const commentsRef = collection(db, 'comments');

    let q;
    if (isAdmin) {
      q = query(
        commentsRef,
        where('targetId', '==', targetId),
        where('targetType', '==', targetType),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        commentsRef,
        where('targetId', '==', targetId),
        where('targetType', '==', targetType),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AppComment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        } as AppComment);
      });
      setComments(list);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to comments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetId, targetType, isAdmin]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim()) return;

    const finalAuthorName = currentUser
      ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'Jogador PK XD')
      : guestName.trim();

    if (!currentUser && !finalAuthorName) {
      setWarningMessage('Por favor, digite um apelido para comentar como convidado.');
      return;
    }

    if (!currentUser) {
      localStorage.setItem('pkxd_comment_guest_name', finalAuthorName);
    }

    setWarningMessage(null);
    setSuccessMessage(null);

    const commentContent = inputText.trim();

    const { isIllicit } = checkIsIllicit(commentContent);
    const matchedAuthor = checkIsIllicit(finalAuthorName);

    const isNameIllicit = matchedAuthor.isIllicit;
    const finalStatus = (isIllicit || isNameIllicit) ? 'pending_review' : 'approved';

    try {
      playTapSound();

      const commentsRef = collection(db, 'comments');
      await addDoc(commentsRef, {
        targetId,
        targetType,
        authorName: isNameIllicit ? 'Nome Filtrado' : finalAuthorName,
        authorId: currentUser ? currentUser.uid : null,
        authorAvatar: currentUser ? currentUser.photoURL : null,
        content: commentContent,
        status: finalStatus,
        createdAt: Date.now()
      });

      setInputText('');
      playSuccessSound();

      if (finalStatus === 'pending_review') {
        setWarningMessage('Seu comentário foi enviado para revisão da moderação antes de aparecer no mural.');
        if (onAddXP) {
          onAddXP(5, 'Feedback Moderado 🛡️');
        }
      } else {
        setSuccessMessage('Comentário publicado com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
        if (onAddXP) {
          onAddXP(30, 'Discussão de Spoilers 💬');
        }
      }
    } catch (err) {
      console.error('Error writing comment to Firestore:', err);
      setWarningMessage('Erro ao enviar comentário. Tente novamente mais tarde.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAdmin) return;
    try {
      playTapSound();
      await deleteDoc(doc(db, 'comments', commentId));
      setConfirmDeleteId(null);
      setSuccessMessage('Comentário excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div className="mt-3 pt-4 border-t-2 border-slate-100 space-y-4" id={`comments-container-${targetId}`}>
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-[#6D28D9]" />
        <span className="font-sans font-extrabold text-xs uppercase tracking-wider text-slate-800">
          Discussão ({comments.length})
        </span>
      </div>

      {/* Warning / Success Banners */}
      {warningMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>{warningMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-2.5">
        {!currentUser && (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-bold">Apelido:</span>
              <input
                type="text"
                placeholder="Ex: PlayerXD"
                maxLength={25}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full pl-16 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 focus:border-[#6D28D9] outline-none transition-colors font-bold placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
            <div className="px-3 py-2 bg-[#F3F0FF] border border-purple-200 rounded-xl text-[11px] text-[#6D28D9] flex items-center justify-center gap-1.5 font-extrabold uppercase tracking-wide">
              <span>Convidado</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-center">
          {currentUser && currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Avatar"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border-2 border-purple-200 bg-slate-100 flex-shrink-0 select-none hidden sm:block object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 select-none hidden sm:flex">
              <User className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder={currentUser ? 'Escreva sua opinião aqui...' : 'Escreva seu comentário aqui...'}
              maxLength={250}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#6D28D9] outline-none transition-colors"
            />
            <button
              type="submit"
              className="pkxd-btn-primary px-3.5 py-2 rounded-xl flex items-center justify-center cursor-pointer"
              title="Enviar comentário"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Real-time Comments List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <div className="text-center py-4 text-xs text-slate-500 font-semibold">
            Carregando discussões...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-5 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl">
            <p className="text-xs font-bold text-slate-500">Sem comentários ainda. Seja o primeiro a opinar!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isPendingReview = comment.status === 'pending_review';
            const isConfirming = confirmDeleteId === comment.id;
            return (
              <div
                key={comment.id}
                className={`p-3 rounded-2xl border flex items-start gap-2.5 transition-colors ${
                  isPendingReview
                    ? 'border-amber-300 bg-amber-50'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {comment.authorAvatar ? (
                  <img
                    src={comment.authorAvatar}
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-slate-200 bg-white flex-shrink-0 select-none object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 select-none">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-sans font-extrabold text-xs text-[#6D28D9]">
                        {comment.authorName}
                      </span>
                      {comment.authorId && (
                        <span className="text-[10px] font-sans bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200 font-bold uppercase select-none">
                          Inscrito
                        </span>
                      )}
                      {isPendingReview && (
                        <span className="text-[10px] font-sans bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 font-bold uppercase inline-flex items-center gap-1 select-none">
                          <ShieldAlert className="w-2.5 h-2.5" />
                          Sob Revisão
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                      <Clock className="w-2.5 h-2.5" />
                      <span>
                        {comment.createdAt && !isNaN(new Date(comment.createdAt).getTime())
                          ? new Date(comment.createdAt).toLocaleDateString('pt-BR')
                          : 'Recente'}
                      </span>
                      {isAdmin && (
                        isConfirming ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(comment.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Excluir Comentário"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <p className="font-sans text-xs text-slate-700 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

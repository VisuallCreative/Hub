import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ArtAsset } from '../types';
import {
  Download,
  Copy,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Film,
  Check,
  Heart,
  Sparkles,
  UploadCloud,
  X,
  Search,
  Maximize2,
  Share2,
  Flame,
  Grid
} from 'lucide-react';
import { loadFromCache, saveToCache } from '../utils/cache';

interface ArtesSectionProps {
  isAdmin: boolean;
  triggerAudio: (sound: string) => void;
  soundEnabled: boolean;
}

export default function ArtesSection({ isAdmin, triggerAudio }: ArtesSectionProps) {
  const [artes, setArtes] = useState<ArtAsset[]>(() => {
    return loadFromCache<ArtAsset[]>('pkxd_cache_artes', []);
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    return loadFromCache<string[]>('pkxd_artes_liked', []);
  });

  const [selectedAsset, setSelectedAsset] = useState<ArtAsset | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newDownloadUrl, setNewDownloadUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Renders');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  const [notif, setNotif] = useState<string | null>(null);
  const [notifType, setNotifType] = useState<'success' | 'info'>('success');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotif(msg);
    setNotifType(type);
    setTimeout(() => {
      setNotif(null);
    }, 3500);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\/shorts\/|shorts\?v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  useEffect(() => {
    const q = query(collection(db, 'art_assets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ArtAsset[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          downloadUrl: data.downloadUrl || '',
          category: data.category || 'Outros',
          isVideo: data.isVideo || false,
          order: typeof data.order === 'number' ? data.order : undefined,
          createdAt: data.createdAt || Date.now()
        });
      });

      if (list.length > 0) {
        setArtes(list);
        saveToCache('pkxd_cache_artes', list);
      }
    }, (error) => {
      console.warn('Could not fetch real-time art_assets from Firestore, using cache:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio('tap');

    let newLikes: string[];
    if (likedIds.includes(id)) {
      newLikes = likedIds.filter(item => item !== id);
      showToast('Removido dos favoritos', 'info');
    } else {
      newLikes = [...likedIds, id];
      showToast('Adicionado aos seus favoritos!', 'success');
      triggerAudio('success');
    }
    setLikedIds(newLikes);
    saveToCache('pkxd_artes_liked', newLikes);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video/');
    const isImg = file.type.startsWith('image/');

    if (!isVid && !isImg) {
      showToast('Selecione uma foto ou vídeo válido!', 'info');
      return;
    }

    setUploadingImage(true);
    triggerAudio('tap');

    if (isVid) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setNewImgUrl(result);
        if (!newDownloadUrl) {
          setNewDownloadUrl(result);
        }
        setIsVideo(true);
        if (newCategory === 'Renders') {
          setNewCategory('Vídeos');
        }
        showToast('Vídeo carregado com sucesso!', 'success');
        triggerAudio('success');
        setUploadingImage(false);
      };
      reader.onerror = () => {
        showToast('Erro ao ler o arquivo de vídeo.', 'info');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } else {
      setIsVideo(false);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/png');
            setNewImgUrl(compressedBase64);
            if (!newDownloadUrl) {
              setNewDownloadUrl(compressedBase64);
            }
            showToast('Foto carregada em alta qualidade!', 'success');
            triggerAudio('success');
          }
          setUploadingImage(false);
        };
        img.onerror = () => {
          showToast('Falha ao processar a imagem.', 'info');
          setUploadingImage(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        showToast('Erro ao ler arquivo do dispositivo.', 'info');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddArt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !newImgUrl.trim()) {
      showToast('Título e link ou imagem/vídeo são obrigatórios!', 'info');
      triggerAudio('tap');
      return;
    }

    const finalCat = newCategory;
    const isVidFinal = isVideo ||
      finalCat === 'Vídeos' ||
      newImgUrl.startsWith('data:video/') ||
      newImgUrl.endsWith('.mp4') ||
      newImgUrl.endsWith('.webm') ||
      newImgUrl.includes('youtube.com') ||
      newImgUrl.includes('youtu.be');

    const minOrder = artes.reduce((min, item) => {
      const o = item.order !== undefined ? item.order : 0;
      return Math.min(min, o);
    }, 0);

    const newItem: Omit<ArtAsset, 'id'> = {
      title: newTitle.trim(),
      description: newDesc.trim() || 'Use livremente nos seus vídeos do YouTube e redes sociais!',
      imageUrl: newImgUrl.trim(),
      downloadUrl: newDownloadUrl.trim() || newImgUrl.trim(),
      category: finalCat,
      isVideo: isVidFinal,
      order: minOrder - 1,
      createdAt: Date.now()
    };

    try {
      triggerAudio('tap');
      const docRef = await addDoc(collection(db, 'art_assets'), {
        ...newItem,
        admin_secret: 'pkxd2026_super_secret_admin_key'
      });

      const updatedList = [{ id: docRef.id, ...newItem }, ...artes];
      setArtes(updatedList);
      saveToCache('pkxd_cache_artes', updatedList);

      setNewTitle('');
      setNewDesc('');
      setNewImgUrl('');
      setNewDownloadUrl('');
      setNewCategory('Renders');
      setIsVideo(false);
      setShowAddModal(false);

      showToast(isVidFinal ? 'Vídeo publicado na galeria com sucesso!' : 'Foto/Arte publicada com sucesso!', 'success');
      triggerAudio('success');
    } catch (err) {
      console.error('Erro ao adicionar arte/vídeo:', err);
      const tempId = 'local_' + Date.now();
      const updatedList = [{ id: tempId, ...newItem }, ...artes];
      setArtes(updatedList);
      saveToCache('pkxd_cache_artes', updatedList);
      setShowAddModal(false);
      showToast('Mídia salva no dispositivo!', 'success');
    }
  };

  const handleDeleteArt = async (id: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;

    try {
      triggerAudio('tap');
      await deleteDoc(doc(db, 'art_assets', id));
      const updated = artes.filter(a => a.id !== id);
      setArtes(updated);
      saveToCache('pkxd_cache_artes', updated);
      setConfirmDeleteId(null);
      if (selectedAsset?.id === id) {
        setSelectedAsset(null);
      }
      showToast(`"${title}" excluído com sucesso!`, 'success');
      triggerAudio('success');
    } catch (err) {
      console.error('Erro ao remover arte:', err);
      const updated = artes.filter(a => a.id !== id);
      setArtes(updated);
      saveToCache('pkxd_cache_artes', updated);
      setConfirmDeleteId(null);
      if (selectedAsset?.id === id) setSelectedAsset(null);
      showToast('Removido da galeria local', 'success');
    }
  };

  const handleDownload = async (url: string, title: string, isVid: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio('tap');
    showToast(`Preparando download de "${title}"...`, 'info');

    const safeFilename = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.${isVid ? 'mp4' : 'png'}`;

    try {
      if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Download concluído com sucesso!', 'success');
        triggerAudio('success');
        return;
      }

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Abrindo vídeo no YouTube...', 'info');
        return;
      }

      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);

      showToast('Download salvo no seu dispositivo!', 'success');
      triggerAudio('success');
    } catch {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Abrindo mídia em nova guia para salvar...', 'info');
    }
  };

  const handleShareAsset = async (asset: ArtAsset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio('tap');
    const shareUrl = `${window.location.origin}${window.location.pathname}?arte=${asset.id}#artes`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `PKXD Central - ${asset.title}`,
          text: `Confira essa mídia no PKXD Central: ${asset.title}`,
          url: shareUrl
        });
        showToast('Compartilhado com sucesso!', 'success');
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(asset.id);
      showToast('Link copiado para a área de transferência!', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('Erro ao copiar link', 'info');
    }
  };

  const handleCopyLink = (url: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerAudio('tap');
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      showToast('Link copiado!', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {}
  };

  const categories = useMemo(() => {
    const base = ['Todas', 'Vídeos', 'Renders', 'Logos', 'Fundos', 'Overlays', 'Outros'];
    const uniqueFromDb = Array.from(new Set(artes.map(a => a.category).filter(Boolean))) as string[];
    const extra = uniqueFromDb.filter(c => !base.includes(c) && c !== 'Todas' && c !== 'CUSTOM');
    return [...base, ...extra];
  }, [artes]);

  const filteredArtes = useMemo(() => {
    let list = [...artes];

    if (onlyFavorites) {
      list = list.filter(a => likedIds.includes(a.id));
    } else if (categoryFilter !== 'Todas') {
      list = list.filter(a => a.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : Infinity;
      const orderB = b.order !== undefined ? b.order : Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [artes, categoryFilter, searchQuery, onlyFavorites, likedIds]);

  return (
    <div className="w-full pkxd-glass rounded-3xl p-5 sm:p-8 text-left" id="artes-section-main">
      {/* Floating Toast Notification */}
      {notif && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border-2 text-xs font-extrabold uppercase tracking-wider ${
            notifType === 'success'
              ? 'bg-emerald-900 text-white border-emerald-400'
              : 'bg-slate-900 text-white border-[#6D28D9]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#FACC15] flex-shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-5 border-b-2 border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-11 h-11 rounded-2xl bg-pink-50 text-pink-600 border-2 border-pink-200 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              Galeria de Fotos, Renders & Vídeos
            </h2>
            <span className="bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border border-pink-200 inline-flex items-center gap-1">
              <Flame className="w-3 h-3" />
              <span>Alta Definição</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Baixe renders 3D sem fundo, logos, wallpapers e materiais gratuitos para usar nas suas thumbnails, edições e vídeos de PK XD.
          </p>
        </div>

        <button
          onClick={() => {
            triggerAudio('tap');
            setShowAddModal(true);
          }}
          className="pkxd-btn-primary px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Enviar Foto ou Vídeo</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar foto, render, vídeo ou categoria..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              triggerAudio('tap');
              setOnlyFavorites(!onlyFavorites);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer border-2 ${
              onlyFavorites
                ? 'bg-pink-600 text-white border-pink-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-pink-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white text-white' : 'text-pink-500'}`} />
            <span className="tabular-nums">Favoritos ({likedIds.length})</span>
          </button>
        </div>

        {!onlyFavorites && (
          <div className="flex flex-wrap gap-1.5 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  triggerAudio('tap');
                  setCategoryFilter(cat);
                }}
                className={`px-3 py-1.5 rounded-xl font-sans text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  categoryFilter === cat
                    ? 'bg-[#6D28D9] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {cat === 'Vídeos' && <VideoIcon className="w-3 h-3" />}
                {cat === 'Renders' && <Sparkles className="w-3 h-3" />}
                {cat === 'Todas' && <Grid className="w-3 h-3" />}
                <span>{cat}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Media Assets */}
      {filteredArtes.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 space-y-3">
          <Film className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-display text-base font-bold text-slate-800">
            Nenhuma mídia encontrada
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `Nenhum resultado para "${searchQuery}". Tente outros termos.`
              : onlyFavorites
              ? 'Você ainda não favoritou nenhuma foto ou vídeo. Clique no coração para salvar aqui!'
              : 'Nenhuma mídia cadastrada nesta categoria ainda.'}
          </p>
          <button
            onClick={() => {
              triggerAudio('tap');
              setShowAddModal(true);
            }}
            className="pkxd-btn-outline px-4 py-2 text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enviar Primeira Mídia</span>
          </button>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArtes.map((art) => {
              const isArtVid =
                art.isVideo ||
                art.category === 'Vídeos' ||
                (art.imageUrl &&
                  (art.imageUrl.startsWith('data:video/') ||
                    art.imageUrl.endsWith('.mp4') ||
                    art.imageUrl.endsWith('.webm') ||
                    art.imageUrl.endsWith('.mov') ||
                    art.imageUrl.includes('youtube.com') ||
                    art.imageUrl.includes('youtu.be')));

              const isLiked = likedIds.includes(art.id);
              const isConfirming = confirmDeleteId === art.id;

              return (
                <div
                  key={art.id}
                  onClick={() => {
                    triggerAudio('tap');
                    setSelectedAsset(art);
                  }}
                  className="group bg-slate-50 border-2 border-slate-200 hover:border-pink-400 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md flex flex-col justify-between relative cursor-pointer"
                >
                  {/* Category Pill Tag */}
                  <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                    <span className="bg-white/95 text-slate-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-slate-200 inline-flex items-center gap-1 shadow-sm">
                      {isArtVid ? <VideoIcon className="w-3 h-3 text-[#0284C7]" /> : <ImageIcon className="w-3 h-3 text-pink-600" />}
                      <span>{art.category}</span>
                    </span>
                  </div>

                  {/* Floating Heart & Share Actions */}
                  <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleToggleLike(art.id, e)}
                      className={`p-1.5 rounded-xl border transition-colors shadow-sm cursor-pointer ${
                        isLiked
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white/95 hover:bg-white text-slate-600 border-slate-200 hover:text-pink-600'
                      }`}
                      title={isLiked ? 'Remover dos favoritos' : 'Favoritar'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleShareAsset(art, e)}
                      className="p-1.5 bg-white/95 hover:bg-white text-slate-600 hover:text-[#0284C7] rounded-xl border border-slate-200 transition-colors shadow-sm cursor-pointer"
                      title="Compartilhar link"
                    >
                      {copiedId === art.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>

                    {isAdmin && (
                      isConfirming ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 bg-white p-1 rounded-xl border border-rose-200 shadow-sm"
                        >
                          <button
                            onClick={(e) => handleDeleteArt(art.id, art.title, e)}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[10px] font-extrabold cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(art.id);
                          }}
                          className="p-1.5 bg-white/95 hover:bg-rose-50 text-rose-600 rounded-xl border border-rose-200 transition-colors shadow-sm cursor-pointer"
                          title="Excluir Mídia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>

                  {/* Media Preview Box (checkerboard preserves transparent PNG legibility!) */}
                  <div
                    className="relative aspect-video w-full overflow-hidden flex items-center justify-center border-b-2 border-slate-200"
                    style={
                      !isArtVid
                        ? {
                            backgroundColor: '#f1f5f9',
                            backgroundImage: `
                              linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                              linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                              linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
                            `,
                            backgroundSize: '16px 16px',
                            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                          }
                        : { backgroundColor: '#0f172a' }
                    }
                  >
                    {isArtVid ? (
                      art.imageUrl.includes('youtube.com') || art.imageUrl.includes('youtu.be') ? (
                        <iframe
                          src={getYouTubeEmbedUrl(art.imageUrl)}
                          title={art.title}
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={art.imageUrl}
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain bg-slate-950"
                        />
                      )
                    ) : (
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="max-w-full max-h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    )}

                    <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="px-3 py-1.5 bg-white text-slate-900 rounded-full border border-slate-200 flex items-center gap-1.5 text-xs font-extrabold shadow-md">
                        <Maximize2 className="w-3.5 h-3.5 text-[#6D28D9]" />
                        <span>Ver Completo</span>
                      </div>
                    </div>
                  </div>

                  {/* Details & Actions */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white/75 backdrop-blur-sm">
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-pink-600 transition-colors flex items-center gap-1.5">
                        {isArtVid && <VideoIcon className="w-3.5 h-3.5 text-[#0284C7] flex-shrink-0" />}
                        <span className="line-clamp-1">{art.title}</span>
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {art.description}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={(e) => handleDownload(art.downloadUrl || art.imageUrl, art.title, isArtVid, e)}
                        className="pkxd-btn-primary flex-1 py-2 px-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isArtVid ? 'Baixar Vídeo' : 'Baixar Foto'}</span>
                      </button>

                      <button
                        onClick={(e) => handleCopyLink(art.downloadUrl || art.imageUrl, art.id, e)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer text-slate-600"
                        title="Copiar link direto"
                      >
                        {copiedId === art.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX / ASSET PREVIEW MODAL */}
      {selectedAsset && (
        <div
          onClick={() => setSelectedAsset(null)}
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pkxd-glass-modal rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col relative"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/60 flex items-center justify-between gap-3 bg-white/60">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border border-pink-200 flex-shrink-0">
                  {selectedAsset.category}
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 truncate">
                  {selectedAsset.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLike(selectedAsset.id)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    likedIds.includes(selectedAsset.id)
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-pink-600'
                  }`}
                  title="Favoritar"
                >
                  <Heart className={`w-4 h-4 ${likedIds.includes(selectedAsset.id) ? 'fill-white' : ''}`} />
                </button>

                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Media Canvas */}
            <div
              className="relative flex-1 min-h-[280px] max-h-[55vh] sm:max-h-[60vh] flex items-center justify-center overflow-hidden p-4"
              style={
                !selectedAsset.isVideo
                  ? {
                      backgroundColor: '#f1f5f9',
                      backgroundImage: `
                        linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                        linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                        linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
                      `,
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                    }
                  : { backgroundColor: '#0f172a' }
              }
            >
              {selectedAsset.isVideo || selectedAsset.category === 'Vídeos' ? (
                selectedAsset.imageUrl.includes('youtube.com') || selectedAsset.imageUrl.includes('youtu.be') ? (
                  <iframe
                    src={getYouTubeEmbedUrl(selectedAsset.imageUrl)}
                    title={selectedAsset.title}
                    className="w-full h-full aspect-video border-0"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={selectedAsset.imageUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-w-full max-h-full object-contain"
                  />
                )
              ) : (
                <img
                  src={selectedAsset.imageUrl}
                  alt={selectedAsset.title}
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t-2 border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm text-slate-700 font-sans">
                  {selectedAsset.description}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {new Date(selectedAsset.createdAt).toLocaleDateString('pt-BR')} • Gratuito para Edits e Vídeos
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleShareAsset(selectedAsset)}
                  className="pkxd-btn-outline px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </button>

                <button
                  onClick={() => handleDownload(selectedAsset.downloadUrl || selectedAsset.imageUrl, selectedAsset.title, !!selectedAsset.isVideo)}
                  className="pkxd-btn-primary px-5 py-2 text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo HD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / UPLOAD ASSET MODAL */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pkxd-glass-modal rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 relative"
          >
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-pink-50 border border-pink-200 text-pink-600 rounded-xl">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Enviar Foto ou Vídeo
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddArt} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-[#6D28D9]" />
                  <span>1. Enviar do seu dispositivo (Celular/PC)</span>
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:uppercase file:bg-[#F3F0FF] file:text-[#6D28D9] hover:file:bg-purple-100 file:cursor-pointer cursor-pointer bg-slate-50 p-2 rounded-2xl border-2 border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  Ou cole o link da imagem / YouTube
                </label>
                <input
                  type="text"
                  value={newImgUrl}
                  onChange={(e) => setNewImgUrl(e.target.value)}
                  placeholder="https://... ou link do YouTube"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  Título da mídia *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Novo Render 3D Explorador"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#6D28D9]"
                >
                  <option value="Renders">Renders 3D (Sem Fundo)</option>
                  <option value="Vídeos">Vídeos & Edits</option>
                  <option value="Logos">Logos & Ícones</option>
                  <option value="Fundos">Fundos & Wallpapers</option>
                  <option value="Overlays">Molduras & Overlays</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Ideal para thumb do YouTube..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="pkxd-btn-outline flex-1 py-2.5 text-xs font-extrabold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="pkxd-btn-primary flex-1 py-2.5 text-xs disabled:opacity-50 cursor-pointer"
                >
                  {uploadingImage ? 'Processando...' : 'Publicar Mídia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

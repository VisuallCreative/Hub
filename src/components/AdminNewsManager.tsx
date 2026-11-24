import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Newspaper,
  PlusCircle,
  Save,
  X,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Check,
  Calendar,
  User
} from 'lucide-react';
import { NewsItem } from '../types';

interface AdminNewsManagerProps {
  newsList: NewsItem[];
  newsToEdit: NewsItem | null;
  onAddNews: (item: Omit<NewsItem, 'id'>) => void | Promise<void>;
  onSaveEdit: (updated: NewsItem) => void | Promise<void>;
  onCancelEdit: () => void;
  onDeleteNews: (id: string) => void | Promise<void>;
  onSelectEdit?: (item: NewsItem) => void;
  onNavigate?: (path: string) => void;
  triggerAudio?: (type: 'tap' | 'success' | 'levelUp') => void;
}

const NEWS_CATEGORIES: { id: NewsItem['category']; label: string; badgeClass: string }[] = [
  { id: 'updates', label: 'Atualizações', badgeClass: 'bg-violet-100 text-violet-800 border-violet-300' },
  { id: 'spoilers', label: 'Spoilers', badgeClass: 'bg-pink-100 text-pink-800 border-pink-300' },
  { id: 'codes', label: 'Códigos', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'events', label: 'Eventos', badgeClass: 'bg-sky-100 text-sky-800 border-sky-300' }
];

const CATEGORY_LABEL_MAP: Record<string, string> = {
  updates: 'Atualizações',
  spoilers: 'Spoilers',
  codes: 'Códigos',
  events: 'Eventos'
};

function getTodayFormatted(): string {
  const now = new Date();
  return now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function compressUploadedImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = () => {
      const src = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        try {
          const maxW = 1280;
          const maxH = 720;
          let { width, height } = img;
          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch {
          resolve(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminNewsManager({
  newsList,
  newsToEdit,
  onAddNews,
  onSaveEdit,
  onCancelEdit,
  onDeleteNews,
  onSelectEdit,
  onNavigate,
  triggerAudio
}: AdminNewsManagerProps) {
  const [editingItem, setEditingItem] = useState<NewsItem | null>(newsToEdit);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NewsItem['category']>('updates');
  const [author, setAuthor] = useState('Equipe PKXD Central');
  const [date, setDate] = useState(getTodayFormatted());
  const [imageUrl, setImageUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Published list filters
  const [filterCat, setFilterCat] = useState<'all' | NewsItem['category']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadIntoEditor = (item: NewsItem | null) => {
    setEditingItem(item);
    if (item) {
      setTitle(item.title || '');
      setCategory(item.category || 'updates');
      setAuthor(item.author || 'Equipe PKXD Central');
      setDate(item.date || getTodayFormatted());
      setImageUrl(item.imageUrl || '');
      setExcerpt(item.excerpt || '');
      setContent(item.content || '');
    } else {
      setTitle('');
      setCategory('updates');
      setAuthor('Equipe PKXD Central');
      setDate(getTodayFormatted());
      setImageUrl('');
      setExcerpt('');
      setContent('');
    }
  };

  useEffect(() => {
    if (newsToEdit) {
      loadIntoEditor(newsToEdit);
    }
  }, [newsToEdit]);

  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return newsList.filter((item) => {
      if (filterCat !== 'all' && item.category !== filterCat) return false;
      if (!q) return true;
      return (
        (item.title || '').toLowerCase().includes(q) ||
        (item.excerpt || '').toLowerCase().includes(q) ||
        (item.content || '').toLowerCase().includes(q)
      );
    });
  }, [newsList, filterCat, searchTerm]);

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImg(true);
    try {
      const compressed = await compressUploadedImage(file);
      setImageUrl(compressed);
      if (triggerAudio) triggerAudio('tap');
    } catch {
      flash('Não foi possível processar a imagem selecionada.');
    } finally {
      setIsUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    setIsSaving(true);
    try {
      const payload: Omit<NewsItem, 'id'> = {
        title: title.trim(),
        category,
        author: author.trim() || 'Equipe PKXD Central',
        date: date.trim() || getTodayFormatted(),
        imageUrl: imageUrl.trim(),
        excerpt: excerpt.trim(),
        content: content.trim() || excerpt.trim()
      };

      if (editingItem) {
        await onSaveEdit({
          ...editingItem,
          ...payload
        });
        loadIntoEditor(null);
        onCancelEdit();
        flash('Notícia atualizada com sucesso em Notícias PK XD!');
      } else {
        await onAddNews(payload);
        loadIntoEditor(null);
        flash('Nova notícia publicada com sucesso em Notícias PK XD!');
      }
      if (triggerAudio) triggerAudio('success');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditing = () => {
    loadIntoEditor(null);
    onCancelEdit();
    if (triggerAudio) triggerAudio('tap');
  };

  const handleStartEdit = (item: NewsItem) => {
    loadIntoEditor(item);
    if (onSelectEdit) onSelectEdit(item);
    if (triggerAudio) triggerAudio('tap');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      {/* Section Hero Banner */}
      <div className="pkxd-pop-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#2D0859] via-[#4C1D95] to-[#6D28D9] text-white px-5 py-5 sm:px-7 border-b-[3px] border-[#120624] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F9C826] border-2 border-[#120624] text-[#120624] flex items-center justify-center shrink-0">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F9C826] block">
                Redação Oficial • Área Exclusiva
              </span>
              <h2 className="font-display font-bold text-xl sm:text-2xl leading-tight">
                Gerenciador Exclusivo de Notícias PK XD
              </h2>
              <p className="text-xs text-purple-100/90 mt-0.5">
                Publique e organize matérias de Atualizações, Spoilers, Códigos e Eventos exibidas na página Notícias PK XD.
              </p>
            </div>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                onNavigate('/noticias');
              }}
              className="px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border-2 border-white/25 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Página de Notícias</span>
            </button>
          )}
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div className="mx-5 sm:mx-7 mt-5 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Editor + Live Preview Grid */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left: Form Inputs */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-display font-bold text-lg text-[#120624] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#6D28D9]" />
                <span>{editingItem ? 'Editando Notícia Publicada' : 'Publicar Nova Notícia'}</span>
              </h3>

              {editingItem && (
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-700 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar Edição</span>
                </button>
              )}
            </div>

            {/* Category Selector Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Categoria da Notícia *
              </label>
              <div className="flex flex-wrap gap-2">
                {NEWS_CATEGORIES.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        if (triggerAudio) triggerAudio('tap');
                      }}
                      className={`px-4 py-2 rounded-full border-2 text-xs font-extrabold cursor-pointer transition-all ${
                        active
                          ? 'bg-[#F9C826] border-[#120624] text-[#120624] shadow-[0_3px_0_#120624]'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-violet-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Título da Notícia *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nova Atualização de Inverno no PK XD: Armadura, Pets e Códigos!"
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-slate-300 focus:border-[#6D28D9] text-sm font-bold text-[#120624] placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Author + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Autor / Redação
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Equipe PKXD Central"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-slate-300 focus:border-[#6D28D9] text-sm font-semibold text-[#120624] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Data de Exibição
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="23/11/2026"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-slate-300 focus:border-[#6D28D9] text-sm font-semibold text-[#120624] focus:outline-none"
                />
              </div>
            </div>

            {/* Cover Image URL + Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Imagem de Capa (Link ou Enviar Foto)
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Cole o link da imagem (https://...) ou envie do seu dispositivo"
                  className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white border-2 border-slate-300 focus:border-[#6D28D9] text-sm text-[#120624] placeholder-slate-400 focus:outline-none"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingImg}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-2xl bg-violet-50 hover:bg-violet-100 border-2 border-violet-300 text-violet-900 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingImg ? 'Processando...' : 'Enviar Foto'}</span>
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-700 text-xs font-bold cursor-pointer shrink-0"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Resumo / Chamada do Card *
              </label>
              <textarea
                required
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Um resumo curto e chamativo que aparece no card da página Notícias PK XD..."
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-slate-300 focus:border-[#6D28D9] text-sm text-[#120624] placeholder-slate-400 focus:outline-none resize-y"
              />
            </div>

            {/* Full Article Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Texto Completo da Matéria *
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {content.length} caracteres
                </span>
              </div>
              <textarea
                required
                rows={7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva todos os detalhes da novidade, datas, códigos de gemas, horários ou instruções completas para os jogadores..."
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-slate-300 focus:border-[#6D28D9] text-sm text-[#120624] placeholder-slate-400 focus:outline-none leading-relaxed resize-y"
              />
            </div>

            {/* Submit Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-full bg-[#F9C826] hover:bg-[#fbbf24] text-[#120624] border-[2.5px] border-[#120624] shadow-[0_4px_0_#120624] active:translate-y-0.5 font-display font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {editingItem ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                <span>
                  {isSaving
                    ? 'Salvando...'
                    : editingItem
                    ? 'Salvar Alterações da Notícia'
                    : 'Publicar Notícia Agora'}
                </span>
              </button>

              {editingItem && (
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  className="px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-700 text-xs font-extrabold cursor-pointer"
                >
                  Descartar
                </button>
              )}
            </div>
          </div>

          {/* Right: Live Card Preview */}
          <div className="lg:col-span-4 space-y-2.5">
            <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Pré-visualização do Card
            </span>
            <div className="rounded-3xl bg-white border-[3px] border-[#120624] shadow-[0_6px_0_#16032E] overflow-hidden">
              {imageUrl ? (
                <div className="aspect-[16/9] bg-slate-100 border-b-[3px] border-[#120624] overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={title || 'Pré-visualização'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-[#DBEAFE] border-b-[3px] border-[#120624] flex flex-col items-center justify-center text-[#2563EB] gap-1.5">
                  <ImageIcon className="w-9 h-9" />
                  <span className="text-[11px] font-bold">Capa da Notícia (16:9)</span>
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
                  <span className="text-[#2563EB]">
                    {CATEGORY_LABEL_MAP[category] || 'Notícia'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{date || getTodayFormatted()}</span>
                </div>

                <h4 className="font-display font-bold text-lg text-[#120624] leading-snug line-clamp-2">
                  {title.trim() || 'Título da sua notícia aparecerá aqui'}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {excerpt.trim() || 'O resumo chamativo aparecerá aqui no card da página Notícias PK XD.'}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {author.trim() || 'Equipe PKXD Central'}
                  </span>
                  <span className="text-[#6D28D9]">Ler matéria</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Published News List with Category Filter & Search */}
      <div className="pkxd-pop-card p-5 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-xl text-[#120624]">
              Notícias Publicadas ({newsList.length})
            </h3>
            <p className="text-xs text-slate-600">
              Filtre por categoria, busque ou edite/remova qualquer matéria publicada.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar notícias..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-50 border-2 border-[#120624] text-xs font-bold text-[#120624] focus:outline-none focus:bg-white"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={`px-3.5 py-1.5 rounded-full border-2 text-xs font-extrabold cursor-pointer ${
              filterCat === 'all'
                ? 'bg-[#F9C826] border-[#120624] text-[#120624]'
                : 'bg-slate-100 border-transparent text-slate-700 hover:border-slate-300'
            }`}
          >
            Todas ({newsList.length})
          </button>
          {NEWS_CATEGORIES.map((cat) => {
            const count = newsList.filter((n) => n.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCat(cat.id)}
                className={`px-3.5 py-1.5 rounded-full border-2 text-xs font-extrabold cursor-pointer ${
                  filterCat === cat.id
                    ? 'bg-[#F9C826] border-[#120624] text-[#120624]'
                    : 'bg-slate-100 border-transparent text-slate-700 hover:border-slate-300'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Articles List */}
        {filteredList.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 text-center space-y-1.5">
            <p className="font-display font-bold text-base text-[#120624]">
              {newsList.length === 0
                ? 'Nenhuma notícia publicada ainda'
                : 'Nenhuma notícia encontrada para esse filtro'}
            </p>
            <p className="text-xs text-slate-500">
              Use o formulário acima para publicar sua primeira matéria em Notícias PK XD.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item) => {
              const catMeta = NEWS_CATEGORIES.find((c) => c.id === item.category);
              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 hover:border-violet-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-20 h-14 rounded-xl object-cover border-2 border-[#120624] shrink-0 bg-white"
                      />
                    ) : (
                      <div className="w-20 h-14 rounded-xl bg-[#DBEAFE] border-2 border-[#120624] flex items-center justify-center text-[#2563EB] shrink-0">
                        <Newspaper className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full border ${
                            catMeta?.badgeClass || 'bg-slate-200 text-slate-800 border-slate-300'
                          }`}
                        >
                          {CATEGORY_LABEL_MAP[item.category] || 'Notícia'}
                        </span>
                        <span className="text-slate-500 inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                        <span className="text-slate-500 truncate">{item.author}</span>
                      </div>

                      <h4 className="font-display font-bold text-sm sm:text-base text-[#120624] truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1">{item.excerpt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate(`/noticias/${encodeURIComponent(item.id)}`)}
                        className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="Abrir notícia publicada"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className="px-3 py-1.5 rounded-full bg-violet-100 hover:bg-violet-200 border-2 border-violet-300 text-violet-900 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border-2 border-rose-300 px-2 py-1 rounded-full">
                        <span className="text-[11px] font-extrabold text-rose-800 pl-1">Excluir?</span>
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteNews(item.id);
                            setConfirmDeleteId(null);
                            if (editingItem?.id === item.id) {
                              handleCancelEditing();
                            }
                          }}
                          className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[11px] font-bold border border-slate-300 cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="p-2 rounded-full bg-rose-100 hover:bg-rose-200 border-2 border-rose-300 text-rose-700 cursor-pointer"
                        title="Excluir notícia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

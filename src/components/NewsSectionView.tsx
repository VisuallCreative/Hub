import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  Search,
  ArrowLeft,
  ArrowRight,
  Share2,
  Check,
  Calendar,
  User,
  Edit3,
  Trash2,
} from 'lucide-react';
import { NewsItem } from '../types';

interface NewsSectionViewProps {
  newsList: NewsItem[];
  selectedArticleId?: string | null;
  isAdmin: boolean;
  onSelectArticle: (articleId: string | null) => void;
  onEditNews: (item: NewsItem) => void;
  onDeleteNews: (id: string) => void;
  onNavigate: (path: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todas',
  updates: 'Atualizações',
  spoilers: 'Spoilers',
  codes: 'Códigos',
  events: 'Eventos',
};

export default function NewsSectionView({
  newsList,
  selectedArticleId,
  isAdmin,
  onSelectArticle,
  onEditNews,
  onDeleteNews,
  onNavigate,
  triggerAudio,
}: NewsSectionViewProps) {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedArticle = useMemo(
    () => (selectedArticleId ? newsList.find((n) => n.id === selectedArticleId) || null : null),
    [newsList, selectedArticleId]
  );

  const filteredNews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return newsList.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.excerpt.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
      );
    });
  }, [newsList, category, search]);

  const handleShare = (item: NewsItem) => {
    triggerAudio('tap');
    const url = `${window.location.origin}/noticias/${encodeURIComponent(item.id)}`;
    if (navigator.share) {
      navigator.share({ title: item.title, text: item.excerpt, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // INDIVIDUAL READING PAGE VIEW
  if (selectedArticle) {
    return (
      <div className="w-full animate-fade-in">
        <section className="pkxd-band-purple py-8 sm:py-12 border-b-[4px] border-[#120624]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5">
            <button
              type="button"
              onClick={() => {
                triggerAudio('tap');
                onSelectArticle(null);
                onNavigate('/noticias');
              }}
              className="pkxd-pop-btn px-4 py-2 text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Notícias</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-white/95">
              <span className="px-3 py-1 rounded-full bg-[#F9C826] text-[#120624] border-2 border-[#120624]">
                {CATEGORY_LABELS[selectedArticle.category] || 'Notícia'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {selectedArticle.date}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {selectedArticle.author}
              </span>
            </div>

            <h1 className="pkxd-comic-title text-3xl sm:text-5xl font-bold leading-tight text-balance">
              {selectedArticle.title}
            </h1>
          </div>
        </section>

        <section className="pkxd-band-purple-2 py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <article className="pkxd-pop-card overflow-hidden">
              {selectedArticle.imageUrl ? (
                <div className="aspect-[16/9] bg-slate-100 border-b-[3px] border-[#120624] overflow-hidden">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              <div className="p-6 sm:p-10 space-y-6">
                {selectedArticle.excerpt && (
                  <p className="text-base sm:text-lg font-bold text-[#2D0859] leading-relaxed">
                    {selectedArticle.excerpt}
                  </p>
                )}

                <div className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-line space-y-3">
                  {selectedArticle.content || selectedArticle.excerpt}
                </div>

                <div className="pt-6 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleShare(selectedArticle)}
                    className="pkxd-btn-gold px-5 py-2.5 text-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    {copiedId === selectedArticle.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Link Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Compartilhar Notícia</span>
                      </>
                    )}
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditNews(selectedArticle)}
                        className="pkxd-pop-btn px-4 py-2 text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteNews(selectedArticle.id);
                          onSelectArticle(null);
                          onNavigate('/noticias');
                        }}
                        className="px-4 py-2 rounded-full border-[2.5px] border-[#120624] bg-rose-100 text-rose-700 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    );
  }

  // NEWS LISTING VIEW
  return (
    <div className="w-full animate-fade-in">
      <section className="pkxd-band-purple py-10 sm:py-14 border-b-[4px] border-[#120624]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <h1 className="pkxd-comic-title text-4xl sm:text-5xl font-bold leading-tight">
                Notícias PK XD
              </h1>
              <p className="text-sm sm:text-base text-white/95 font-medium">
                Atualizações do jogo, spoilers oficiais, códigos de gemas e destaques da comunidade PK XD Central.
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="pkxd-btn-gold px-5 py-2.5 text-sm cursor-pointer self-start shrink-0"
              >
                + Publicar Notícia
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    triggerAudio('tap');
                    setCategory(key);
                  }}
                  className={`px-4 py-2 rounded-full border-[2.5px] border-[#120624] text-xs font-extrabold cursor-pointer ${
                    category === key
                      ? 'bg-[#F9C826] text-[#120624] shadow-[0_3px_0_#120624]'
                      : 'bg-white text-[#120624] hover:bg-[#FEF9C3]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar notícias..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border-[2.5px] border-[#120624] text-sm font-semibold text-[#120624] focus:outline-none focus:ring-2 focus:ring-[#F9C826]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pkxd-band-purple-2 py-10 sm:py-14 min-h-[420px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {filteredNews.length === 0 ? (
            <div className="pkxd-pop-card p-10 text-center space-y-3 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#DBEAFE] border-[3px] border-[#120624] flex items-center justify-center mx-auto">
                <Newspaper className="w-7 h-7 text-[#2563EB]" />
              </div>
              <h2 className="font-display font-bold text-2xl text-[#120624]">
                {newsList.length === 0
                  ? 'Nenhuma notícia publicada ainda'
                  : 'Nenhuma notícia encontrada para esse filtro'}
              </h2>
              <p className="text-sm text-slate-600">
                {newsList.length === 0
                  ? 'Assim que a equipe publicar novas atualizações, spoilers ou comunicados do PK XD, eles aparecerão aqui.'
                  : 'Tente limpar a busca ou selecionar outra categoria acima.'}
              </p>
              {(category !== 'all' || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory('all');
                    setSearch('');
                  }}
                  className="pkxd-btn-purple px-5 py-2 text-xs cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item) => (
                <article
                  key={item.id}
                  onClick={() => {
                    triggerAudio('tap');
                    onSelectArticle(item.id);
                    onNavigate(`/noticias/${encodeURIComponent(item.id)}`);
                  }}
                  className="pkxd-pop-card overflow-hidden flex flex-col justify-between cursor-pointer group hover:-translate-y-1 transition-transform"
                >
                  <div>
                    {item.imageUrl ? (
                      <div className="aspect-[16/9] bg-slate-100 border-b-[3px] border-[#120624] overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-[#DBEAFE] border-b-[3px] border-[#120624] flex items-center justify-center">
                        <Newspaper className="w-12 h-12 text-[#2563EB]" />
                      </div>
                    )}

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
                        <span className="text-[#2563EB]">
                          {CATEGORY_LABELS[item.category] || 'Notícia'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.date}</span>
                      </div>

                      <h2 className="font-display font-bold text-xl text-[#120624] group-hover:text-[#6D28D9] transition-colors line-clamp-2">
                        {item.title}
                      </h2>

                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {item.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#2D0859] inline-flex items-center gap-1">
                      Ler matéria <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(item);
                      }}
                      className="p-2 rounded-full border-2 border-[#120624] bg-[#FEF9C3] text-[#120624] cursor-pointer"
                      aria-label="Compartilhar"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

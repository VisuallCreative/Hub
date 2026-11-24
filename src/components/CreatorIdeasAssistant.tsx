import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  Image as ImageIcon,
  Copy,
  Check,
  Shuffle,
  Film,
  Clapperboard,
  Wand2,
  Hash,
  Eye,
  Palette
} from 'lucide-react';
import { AnalysisSummary, ChannelMetrics, CreatorFormat, ProgramTier } from '../types/creator';
import {
  CREATOR_FOCUS_CATEGORIES,
  generateLocalCreatorIdeas
} from '../data/creatorIdeasBank';

interface CreatorIdeasAssistantProps {
  channelData: ChannelMetrics | null;
  analysis: AnalysisSummary | null;
  creatorFormat: CreatorFormat;
  selectedTier: ProgramTier;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
}

export default function CreatorIdeasAssistant({
  channelData,
  analysis,
  creatorFormat,
  selectedTier,
  triggerAudio
}: CreatorIdeasAssistantProps) {
  const [selectedFormat, setSelectedFormat] = useState<'mixed' | 'shorts' | 'long_video'>(
    creatorFormat === 'shorts' ? 'shorts' : 'mixed'
  );
  const [selectedPreset, setSelectedPreset] = useState<string>(CREATOR_FOCUS_CATEGORIES[0].label);
  const [customTopic, setCustomTopic] = useState('');
  const [appliedTopic, setAppliedTopic] = useState('');
  const [seed, setSeed] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const result = useMemo(
    () =>
      generateLocalCreatorIdeas({
        categoryLabel: selectedPreset,
        format: selectedFormat,
        customTopic: appliedTopic,
        seed,
        channelData,
        analysis,
        creatorFormat,
        selectedTier
      }),
    [selectedPreset, selectedFormat, appliedTopic, seed, channelData, analysis, creatorFormat, selectedTier]
  );

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      if (triggerAudio) triggerAudio('tap');
    } catch {}
  };

  const handleApplyAndShuffle = () => {
    setAppliedTopic(customTopic.trim());
    setSeed((prev) => prev + 1);
    if (triggerAudio) triggerAudio('success');
  };

  return (
    <section
      id="creator-ideas-assistant"
      className="pkxd-glass rounded-3xl p-5 sm:p-7 space-y-5 text-slate-900"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-[11px] font-extrabold uppercase tracking-wider text-violet-800">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Planejador Criativo para Creators</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#120624]">
            Gerador de Ideias de Vídeos & Thumbnails
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Escolha um objetivo ou digite um tema do PK XD para receber roteiros prontos, ganchos para os primeiros 3 segundos e modelos visuais de thumbnail instantaneamente.
          </p>
        </div>

        {channelData && (
          <div className="self-start md:self-center px-3.5 py-2 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Adaptado para {channelData.handle || channelData.title}</span>
          </div>
        )}
      </div>

      {/* Controls Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4">
        {/* Format Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Formato dos vídeos:
          </span>
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            {[
              { id: 'mixed', label: 'Misto (Shorts + Longos)' },
              { id: 'shorts', label: 'Só Shorts' },
              { id: 'long_video', label: 'Só Longos (+5m)' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedFormat(opt.id as 'mixed' | 'shorts' | 'long_video');
                  if (triggerAudio) triggerAudio('tap');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedFormat === opt.id
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Focus Presets */}
        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
            Objetivo ou categoria PK XD:
          </span>
          <div className="flex flex-wrap gap-2">
            {CREATOR_FOCUS_CATEGORIES.map((preset) => {
              const active = selectedPreset === preset.label;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset.label);
                    if (triggerAudio) triggerAudio('tap');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#F9C826] border-[#120624] text-[#120624] shadow-[0_2px_0_#120624]'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-violet-300'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Topic Input + Shuffle/Generate */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApplyAndShuffle();
              }
            }}
            placeholder="Opcional: digite um assunto (ex: Nova Armadura, Casa Futurista, Pet Lendário)..."
            className="flex-1 bg-white border-2 border-slate-200 focus:border-violet-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />

          <button
            type="button"
            onClick={handleApplyAndShuffle}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#5B21B6] to-[#EC4899] hover:opacity-95 text-white border-2 border-[#120624] shadow-[0_4px_0_#120624] active:translate-y-0.5 font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Shuffle className="w-4 h-4" />
            <span>{customTopic.trim() ? 'Gerar Com Esse Tema' : 'Sortear Novas Ideias'}</span>
          </button>
        </div>
      </div>

      {/* Results (Always Instant) */}
      <div className="space-y-5 pt-1">
        {/* Channel Strategy Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-950 to-indigo-950 text-white border-2 border-[#120624] shadow-[0_4px_0_#120624] flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F9C826] text-[#120624] flex items-center justify-center shrink-0 border-2 border-[#120624]">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#F9C826]">
              Foco Estratégico para o Seu Canal
            </div>
            <p className="text-xs sm:text-sm text-purple-100 leading-relaxed font-medium">
              {result.channelDiagnosis}
            </p>
          </div>
        </div>

        {/* 4 Idea Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {result.ideas.map((idea, idx) => {
            const isShort = idea.format === 'Shorts';
            const primaryHex = idea.thumbnail.primaryColor;
            const accentHex = idea.thumbnail.accentColor;

            const fullIdeaText = [
              `TÍTULO: ${idea.title}`,
              `FORMATO: ${idea.format} (${idea.estimatedDuration})`,
              `GANCHO (3s): ${idea.hook}`,
              `ROTEIRO:\n${idea.scriptSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
              `THUMBNAIL: "${idea.thumbnail.headlineText}" | Selo: ${idea.thumbnail.focalBadge}`,
              `CENÁRIO: ${idea.thumbnail.visualScene}`,
              `POSE / EXPRESSÃO: ${idea.thumbnail.expressionAndPose}`,
              `CORES: ${primaryHex} + ${accentHex}`,
              `HASHTAGS: ${idea.hashtags.join(' ')}`
            ].join('\n\n');

            const thumbBriefText = [
              `TEXTO NA THUMB: ${idea.thumbnail.headlineText}`,
              `SELO: ${idea.thumbnail.focalBadge}`,
              `CENÁRIO: ${idea.thumbnail.visualScene}`,
              `POSE / EXPRESSÃO: ${idea.thumbnail.expressionAndPose}`,
              `CORES: ${primaryHex} e ${accentHex}`,
              `DICA DE CTR: ${idea.thumbnail.proTip}`
            ].join('\n');

            return (
              <article
                key={`${idea.id}-${idx}`}
                className="rounded-3xl bg-white border-2 border-slate-200 hover:border-violet-400 transition-colors p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-sm"
              >
                <div className="space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wider ${
                          isShort
                            ? 'bg-pink-100 text-pink-800 border border-pink-200'
                            : 'bg-violet-100 text-violet-800 border border-violet-200'
                        }`}
                      >
                        {isShort ? <Film className="w-3.5 h-3.5" /> : <Clapperboard className="w-3.5 h-3.5" />}
                        <span>{idea.format}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {idea.estimatedDuration}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(`title-${idx}`, idea.title)}
                      className="text-[11px] font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === `title-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey === `title-${idx}` ? 'Copiado' : 'Copiar título'}</span>
                    </button>
                  </div>

                  {/* Video Title */}
                  <h4 className="font-display text-base sm:text-lg font-bold text-[#120624] leading-snug">
                    {idea.title}
                  </h4>

                  {/* Visual Thumbnail Mockup Card */}
                  <div className="rounded-2xl overflow-hidden border-2 border-[#120624] shadow-[0_4px_0_#120624]">
                    <div
                      className="relative p-4 min-h-[146px] flex flex-col justify-between"
                      style={{
                        background: `linear-gradient(135deg, ${primaryHex} 0%, #120624 100%)`
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-[#120624]"
                          style={{ backgroundColor: accentHex, color: '#120624' }}
                        >
                          {idea.thumbnail.focalBadge}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/50 text-white/90 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>Modelo de Thumbnail</span>
                        </span>
                      </div>

                      <div className="my-2.5">
                        <p
                          className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight leading-none drop-shadow-[0_3px_0_#120624]"
                          style={{ color: accentHex }}
                        >
                          {idea.thumbnail.headlineText}
                        </p>
                        <p className="text-[11px] text-white/90 font-semibold mt-1.5 leading-snug">
                          Pose: {idea.thumbnail.expressionAndPose}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/15 text-[10px] text-white/85">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Palette className="w-3 h-3" />
                          <span
                            className="w-3 h-3 rounded-full border border-white/70 inline-block"
                            style={{ backgroundColor: primaryHex }}
                          />
                          <span>{primaryHex}</span>
                          <span
                            className="w-3 h-3 rounded-full border border-white/70 inline-block ml-1"
                            style={{ backgroundColor: accentHex }}
                          />
                          <span>{accentHex}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(`thumb-${idx}`, thumbBriefText)}
                          className="px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 text-white font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          {copiedKey === `thumb-${idx}` ? (
                            <Check className="w-3 h-3 text-emerald-300" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === `thumb-${idx}` ? 'Briefing copiado' : 'Copiar thumb'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-slate-200 px-3.5 py-2.5 text-[11px] space-y-1">
                      <p className="leading-snug">
                        <strong className="text-white">Cenário:</strong> {idea.thumbnail.visualScene}
                      </p>
                      <p className="text-amber-300 font-semibold leading-snug">
                        Dica de CTR: {idea.thumbnail.proTip}
                      </p>
                    </div>
                  </div>

                  {/* Hook (3 seconds) */}
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                      Gancho para os primeiros 3 segundos
                    </span>
                    <p className="text-xs font-bold text-slate-900 leading-relaxed">
                      "{idea.hook}"
                    </p>
                  </div>

                  {/* Script Steps */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Roteiro rápido
                    </span>
                    <ol className="space-y-1">
                      {idea.scriptSteps.map((step, sIdx) => (
                        <li key={sIdx} className="text-xs text-slate-700 flex items-start gap-2 leading-snug">
                          <span className="w-4 h-4 rounded-md bg-violet-100 text-violet-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Viral Angle */}
                  <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <Eye className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-900">Por que funciona:</strong> {idea.viralReason}
                    </span>
                  </div>
                </div>

                {/* Footer: Hashtags & Copy All */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {idea.hashtags.slice(0, 5).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md"
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(`full-${idx}`, fullIdeaText)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedKey === `full-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === `full-${idx}` ? 'Tudo Copiado!' : 'Copiar Ideia Completa'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

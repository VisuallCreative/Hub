import React, { useState } from 'react';
import {
  X,
  Settings2,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Check
} from 'lucide-react';
import { CreatorRequirement, MetricType, CreatorFormat, ProgramTier } from '../types/creator';
import { resetToDefaultRequirements } from '../data/creatorRequirements';

interface CreatorRequirementsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: CreatorRequirement[];
  onSaveRequirements: (newReqs: CreatorRequirement[]) => void;
  soundEnabled?: boolean;
}

export default function CreatorRequirementsConfigModal({
  isOpen,
  onClose,
  requirements,
  onSaveRequirements,
}: CreatorRequirementsConfigModalProps) {
  const [draftReqs, setDraftReqs] = useState<CreatorRequirement[]>(() => JSON.parse(JSON.stringify(requirements)));
  const [selectedId, setSelectedId] = useState<string>(requirements[0]?.id || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const currentSelected = draftReqs.find(r => r.id === selectedId) || draftReqs[0];

  const handleFieldChange = (field: keyof CreatorRequirement, value: any) => {
    setErrorMsg(null);
    setDraftReqs(prev => prev.map(r => {
      if (r.id === selectedId) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleSave = () => {
    onSaveRequirements(draftReqs);
    setErrorMsg(null);
    setSuccessMsg('Requisitos atualizados com sucesso!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1000);
  };

  const handleConfirmReset = () => {
    const defaults = resetToDefaultRequirements();
    setDraftReqs(JSON.parse(JSON.stringify(defaults)));
    setSelectedId(defaults[0]?.id || '');
    onSaveRequirements(defaults);
    setConfirmReset(false);
    setErrorMsg(null);
    setSuccessMsg('Restaurado para os padrões oficiais!');
    setTimeout(() => setSuccessMsg(null), 1600);
  };

  const handleAddNew = () => {
    setErrorMsg(null);
    const newId = `custom_req_${Date.now()}`;
    const newReq: CreatorRequirement = {
      id: newId,
      name: 'Novo Requisito',
      metricType: 'subscribers',
      category: 'stardust',
      targetValue: 100,
      unit: 'unidades',
      isRequired: true,
      description: 'Descrição do requisito oficial do programa.',
      officialSourceUrl: 'https://playpkxd.com',
      lastUpdated: new Date().toISOString().split('T')[0],
      autoVerifiable: true,
      applicableFormat: 'both'
    };
    setDraftReqs(prev => [...prev, newReq]);
    setSelectedId(newId);
  };

  const handleDelete = (idToDelete: string) => {
    if (draftReqs.length <= 1) {
      setErrorMsg('É necessário manter ao menos um requisito configurado.');
      return;
    }
    setErrorMsg(null);
    const updated = draftReqs.filter(r => r.id !== idToDelete);
    setDraftReqs(updated);
    if (selectedId === idToDelete) {
      setSelectedId(updated[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm overflow-y-auto">
      <div
        id="creator-requirements-modal"
        className="bg-white border-2 border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-100 border border-violet-200 text-violet-700">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase">
                Configuração de Requisitos
              </h2>
              <p className="text-xs text-slate-600">
                Gerencie metas, valores mínimos e critérios do Programa Creator PK XD
              </p>
            </div>
          </div>
          <button
            id="close-config-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Fechar configurações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Split Column) */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: List of Requirements */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 p-3 overflow-y-auto max-h-[35vh] md:max-h-full space-y-2 bg-slate-50">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span>Critérios ({draftReqs.length})</span>
              <button
                id="add-new-req-btn"
                onClick={handleAddNew}
                className="flex items-center gap-1 text-xs text-violet-700 hover:text-violet-900 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {draftReqs.map(req => {
              const isSelected = req.id === currentSelected?.id;
              return (
                <button
                  key={req.id}
                  onClick={() => {
                    setErrorMsg(null);
                    setSelectedId(req.id);
                  }}
                  className={`w-full text-left p-3 rounded-2xl text-xs transition-all cursor-pointer flex flex-col gap-1 border-2 ${
                    isSelected
                      ? 'bg-violet-50 border-violet-500 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="font-bold truncate">{req.name}</span>
                    {req.isRequired && (
                      <span className="text-[10px] uppercase px-2 py-0.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-full font-bold shrink-0">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono tabular-nums">
                      Meta: {req.targetValue.toLocaleString('pt-BR')} {req.unit}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{req.category}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Requirement Editor Form */}
          {currentSelected ? (
            <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-4 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                    Editando Critério
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900">{currentSelected.name}</h3>
                </div>
                <button
                  onClick={() => handleDelete(currentSelected.id)}
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  title="Remover este requisito"
                >
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Requisito
                  </label>
                  <input
                    type="text"
                    value={currentSelected.name}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor Mínimo Necessário
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentSelected.targetValue}
                    onChange={e => handleFieldChange('targetValue', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidade de Medida
                  </label>
                  <input
                    type="text"
                    value={currentSelected.unit}
                    onChange={e => handleFieldChange('unit', e.target.value)}
                    placeholder="ex: inscritos, vídeos, visualizações"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Métrica
                  </label>
                  <select
                    value={currentSelected.metricType}
                    onChange={e => handleFieldChange('metricType', e.target.value as MetricType)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  >
                    <option value="subscribers">Inscritos (subscribers)</option>
                    <option value="views_3months">Visualizações dos últimos 16 Shorts (views_3months)</option>
                    <option value="pkxd_long_videos">Vídeos Longos (+5 min) (pkxd_long_videos)</option>
                    <option value="pkxd_shorts">Shorts/TikToks (pkxd_shorts)</option>
                    <option value="monthly_frequency">Frequência Mensal (monthly_frequency)</option>
                    <option value="avg_views">Média de Views por Vídeo (avg_views)</option>
                    <option value="community_compliance">Conformidade com Diretrizes (community_compliance)</option>
                    <option value="program_terms">Aceite dos Termos (program_terms)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Classificação / Tier
                  </label>
                  <select
                    value={currentSelected.category}
                    onChange={e => handleFieldChange('category', e.target.value as ProgramTier)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  >
                    <option value="admission">Critério Geral de Admissão</option>
                    <option value="stardust">Tier 1: Stardust (Inicial)</option>
                    <option value="rising_star">Tier 2: Rising Star (Ascensão)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Formato de Conteúdo Aplicável
                  </label>
                  <select
                    value={currentSelected.applicableFormat || 'both'}
                    onChange={e => handleFieldChange('applicableFormat', e.target.value as CreatorFormat)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  >
                    <option value="both">Geral (Todos os Formatos)</option>
                    <option value="long_video">Apenas Criadores de Vídeo Longo</option>
                    <option value="shorts">Apenas Criadores de Shorts</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="is-required-check"
                    checked={currentSelected.isRequired}
                    onChange={e => handleFieldChange('isRequired', e.target.checked)}
                    className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                  />
                  <label htmlFor="is-required-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Requisito Obrigatório para Aprovação
                  </label>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="is-auto-verifiable-check"
                    checked={currentSelected.autoVerifiable}
                    onChange={e => handleFieldChange('autoVerifiable', e.target.checked)}
                    className="w-4 h-4 rounded accent-violet-600 cursor-pointer"
                  />
                  <label htmlFor="is-auto-verifiable-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Verificável via dados públicos do YouTube
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição Explicativa
                </label>
                <textarea
                  rows={2}
                  value={currentSelected.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL da Fonte Oficial
                  </label>
                  <input
                    type="text"
                    value={currentSelected.officialSourceUrl}
                    onChange={e => handleFieldChange('officialSourceUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data da Última Atualização
                  </label>
                  <input
                    type="date"
                    value={currentSelected.lastUpdated}
                    onChange={e => handleFieldChange('lastUpdated', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-wrap items-center gap-2">
            {confirmReset ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl">
                <span className="text-xs font-bold text-amber-900">Restaurar padrões?</span>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Sim
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                id="reset-requirements-btn"
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrões Oficiais
              </button>
            )}
            {successMsg && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> {successMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="save-requirements-btn"
              onClick={handleSave}
              className="pkxd-btn-primary flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-display font-bold uppercase tracking-wider cursor-pointer"
            >
              <Save className="w-4 h-4" /> Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

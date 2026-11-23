import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  FileText,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  Send,
  Copy,
  Check,
  HelpCircle,
  Database
} from 'lucide-react';
import { DataRequestType } from '../../types/privacy';

interface UserDataRequestModalProps {
  isOpen: boolean;
  initialType?: DataRequestType;
  onClose: () => void;
  triggerAudio?: (sound: 'tap' | 'success') => void;
}

export default function UserDataRequestModal({
  isOpen,
  initialType = 'access',
  onClose,
  triggerAudio,
}: UserDataRequestModalProps) {
  const [requestType, setRequestType] = useState<DataRequestType>(initialType);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState('');
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [localDataExported, setLocalDataExported] = useState(false);
  const [localDataCleared, setLocalDataCleared] = useState(false);
  const [confirmClearLocal, setConfirmClearLocal] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setRequestType(initialType);
      setSubmittedProtocol(null);
      setCopiedProtocol(false);
      setLocalDataExported(false);
      setLocalDataCleared(false);
      setConfirmClearLocal(false);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    if (triggerAudio) triggerAudio('success');

    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const protocol = `LGPD-${datePart}-${randomHex}`;

    try {
      const historyKey = 'pkxd_user_data_requests_log';
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
      existing.unshift({
        protocol,
        type: requestType,
        fullName,
        email,
        details,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 20)));
    } catch (err) {
      console.warn('Erro ao registrar protocolo:', err);
    }

    setSubmittedProtocol(protocol);
  };

  const handleExportLocalData = () => {
    try {
      const localData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('pkxd_') || key.includes('cookie') || key.includes('auth'))) {
          try {
            localData[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            localData[key] = localStorage.getItem(key);
          }
        }
      }

      const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-pkxd-central-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (triggerAudio) triggerAudio('success');
      setLocalDataExported(true);
      setTimeout(() => setLocalDataExported(false), 4000);
    } catch (e) {
      console.error('Falha ao exportar dados:', e);
    }
  };

  const executeClearLocalData = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('pkxd_') || key.includes('cookie'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      if (triggerAudio) triggerAudio('tap');
      setConfirmClearLocal(false);
      setLocalDataCleared(true);
      setTimeout(() => setLocalDataCleared(false), 4000);
    } catch (e) {
      console.error('Falha ao limpar dados locais:', e);
    }
  };

  const handleCopyProtocol = () => {
    if (!submittedProtocol) return;
    navigator.clipboard.writeText(submittedProtocol);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2500);
  };

  return (
    <AnimatePresence>
      <div
        id="user-data-request-modal"
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 text-left"
      >
        <div
          className="fixed inset-0"
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onClose();
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl pkxd-glass-modal rounded-3xl text-slate-900 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-white/60 bg-white/55 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F3F0FF] border border-purple-200 flex items-center justify-center text-[#6D28D9]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">
                  Seus Direitos e Solicitação de Dados
                </h2>
                <p className="text-xs text-slate-500">
                  Transparência, controle e cumprimento à LGPD
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-5 sm:px-6 py-5 overflow-y-auto space-y-5 text-xs font-sans">
            {submittedProtocol ? (
              <div className="space-y-4 py-2">
                <div className="p-5 rounded-3xl bg-[#ECFDF5] border-2 border-emerald-200 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Solicitação Registrada com Sucesso!
                  </h3>
                  <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
                    Guarde o número de protocolo abaixo para acompanhamento:
                  </p>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="font-mono font-bold text-sm bg-white px-3.5 py-1.5 rounded-xl border-2 border-emerald-300 text-emerald-700 tracking-wider">
                      {submittedProtocol}
                    </span>
                    <button
                      onClick={handleCopyProtocol}
                      className="p-2 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 cursor-pointer"
                      title="Copiar Protocolo"
                    >
                      {copiedProtocol ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2 text-slate-700 leading-relaxed text-xs">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-[#6D28D9]" />
                    <span>Próximas Etapas</span>
                  </h4>
                  <p>
                    Se quiser complementar o pedido com comprovante de titularidade, envie o protocolo para:
                  </p>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-[#6D28D9] font-bold flex items-center justify-between">
                    <span>privacidade@pkxdcentral.site</span>
                    <span className="text-[10px] text-slate-500 uppercase">Encarregado / DPO</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setSubmittedProtocol(null);
                      onClose();
                    }}
                    className="pkxd-btn-primary px-5 py-2.5 text-xs cursor-pointer"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-emerald-200 space-y-1.5 leading-relaxed text-slate-700">
                  <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Seus Direitos pela LGPD</span>
                  </h3>
                  <p className="text-xs">
                    Você pode consultar, exportar, corrigir ou solicitar a eliminação de dados armazenados a qualquer momento.
                  </p>
                </div>

                {/* Self-Service Local Tools */}
                <div className="p-4 rounded-2xl bg-[#F3F0FF] border-2 border-purple-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#6D28D9]" />
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                        Ações Imediatas no Navegador
                      </h4>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#6D28D9] bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                      Autoatendimento
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    Baixe uma cópia completa dos seus dados salvos neste navegador ou limpe o armazenamento local agora mesmo:
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportLocalData}
                      className="pkxd-btn-outline px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer bg-white"
                    >
                      <Download className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>Exportar Dados Locais (.json)</span>
                    </button>

                    {confirmClearLocal ? (
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-rose-200">
                        <span className="text-[11px] font-bold text-rose-700 px-2">Limpar tudo deste navegador?</span>
                        <button
                          type="button"
                          onClick={executeClearLocalData}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Sim, limpar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearLocal(false)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearLocal(true)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Limpar Dados Locais</span>
                      </button>
                    )}
                  </div>

                  {localDataExported && (
                    <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Arquivo JSON baixado com sucesso!</span>
                    </p>
                  )}

                  {localDataCleared && (
                    <p className="text-xs text-amber-800 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Dados locais removidos deste navegador!</span>
                    </p>
                  )}
                </div>

                {/* Request Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                      Tipo de Solicitação *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('access');
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-3 rounded-2xl border-2 text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          requestType === 'access'
                            ? 'bg-[#F3F0FF] border-[#6D28D9] text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-[#6D28D9] mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-xs">Solicitar Meus Dados</div>
                          <div className="text-[11px] text-slate-500">Acesso a informações cadastrais</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('deletion');
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-3 rounded-2xl border-2 text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          requestType === 'deletion'
                            ? 'bg-rose-50 border-rose-500 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Trash2 className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-xs">Solicitar Exclusão</div>
                          <div className="text-[11px] text-slate-500">Eliminação de conta ou registros</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('rectification');
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-3 rounded-2xl border-2 text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          requestType === 'rectification'
                            ? 'bg-[#EFF8FF] border-[#0284C7] text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4 text-[#0284C7] mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-xs">Correção de Dados</div>
                          <div className="text-[11px] text-slate-500">Atualização de dados incorretos</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('revocation');
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-3 rounded-2xl border-2 text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          requestType === 'revocation'
                            ? 'bg-[#FFFBEB] border-amber-500 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-xs">Revogar Consentimento</div>
                          <div className="text-[11px] text-slate-500">Retirar autorizações concedidas</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        Seu Nome ou Nickname *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Gabriel ou seu Nick"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#6D28D9]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        E-mail de Contato *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="seuemail@exemplo.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#6D28D9]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Detalhes adicionais (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Informe detalhes úteis para localizar seus registros (ex: tag PK XD, comentários, etc.)."
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#6D28D9] resize-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 font-mono">
                      DPO: privacidade@pkxdcentral.site
                    </span>

                    <button
                      type="submit"
                      className="pkxd-btn-primary w-full sm:w-auto px-5 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Registrar Solicitação</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

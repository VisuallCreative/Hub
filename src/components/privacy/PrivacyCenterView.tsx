import React from 'react';
import {
  ShieldCheck,
  Lock,
  Cookie,
  FileText,
  Trash2,
  ScrollText,
  ArrowLeft,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

interface PrivacyCenterViewProps {
  onBack: () => void;
  onNavigateToPolicy: () => void;
  onNavigateToTerms: () => void;
  onOpenCookiePreferences: () => void;
  onOpenDataRequest: () => void;
  onOpenDataDeletion: () => void;
  triggerAudio?: (sound: 'tap' | 'success') => void;
}

export default function PrivacyCenterView({
  onBack,
  onNavigateToPolicy,
  onNavigateToTerms,
  onOpenCookiePreferences,
  onOpenDataRequest,
  onOpenDataDeletion,
  triggerAudio,
}: PrivacyCenterViewProps) {
  const handleBack = () => {
    if (triggerAudio) triggerAudio('tap');
    onBack();
  };

  const cards = [
    {
      id: 'privacy-policy-card',
      icon: Lock,
      cardStyle: 'pkxd-glass border-purple-200/80 hover:border-[#6D28D9]',
      iconBox: 'bg-[#F3F0FF] text-[#6D28D9] border-purple-200',
      badge: 'Transparência',
      title: 'Privacidade',
      subtitle: 'Entenda como seus dados são utilizados no portal.',
      actionLabel: 'Ver Política Completa',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onNavigateToPolicy();
      },
    },
    {
      id: 'cookies-card',
      icon: Cookie,
      cardStyle: 'pkxd-glass border-pink-200/80 hover:border-pink-500',
      iconBox: 'bg-pink-50 text-pink-600 border-pink-200',
      badge: 'Preferências',
      title: 'Cookies',
      subtitle: 'Gerencie suas preferências de cookies e sessões.',
      actionLabel: 'Configurar Cookies',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onOpenCookiePreferences();
      },
    },
    {
      id: 'user-data-card',
      icon: FileText,
      cardStyle: 'pkxd-glass border-sky-200/80 hover:border-[#0284C7]',
      iconBox: 'bg-[#EFF8FF] text-[#0284C7] border-sky-200',
      badge: 'Acesso & Relatório',
      title: 'Seus dados',
      subtitle: 'Exporte ou solicite informações relacionadas aos seus dados.',
      actionLabel: 'Solicitar Meus Dados',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onOpenDataRequest();
      },
    },
    {
      id: 'delete-data-card',
      icon: Trash2,
      cardStyle: 'pkxd-glass border-rose-200/80 hover:border-rose-500',
      iconBox: 'bg-rose-50 text-rose-600 border-rose-200',
      badge: 'Direito ao Esquecimento',
      title: 'Excluir dados',
      subtitle: 'Solicite a exclusão dos seus registros quando aplicável.',
      actionLabel: 'Solicitar Exclusão',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onOpenDataDeletion();
      },
    },
    {
      id: 'terms-of-use-card',
      icon: ScrollText,
      cardStyle: 'pkxd-glass border-amber-200/80 hover:border-amber-500',
      iconBox: 'bg-[#FFFBEB] text-amber-700 border-amber-200',
      badge: 'Regras de Uso',
      title: 'Termos de Uso',
      subtitle: 'Leia as regras de convivência e utilização do site.',
      actionLabel: 'Ler Termos de Uso',
      onClick: () => {
        if (triggerAudio) triggerAudio('tap');
        onNavigateToTerms();
      },
    },
  ];

  return (
    <div id="privacy-center-view" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-slate-900 text-left">
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-purple-200/40">
        <button
          onClick={handleBack}
          className="pkxd-pop-btn px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Portal</span>
        </button>

        <span className="text-xs text-emerald-800 font-extrabold bg-[#ECFDF5] border-2 border-[#120624] px-3 py-1 rounded-full flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>LGPD & Google API</span>
        </span>
      </div>

      {/* Hero Banner */}
      <div className="rounded-[34px] p-6 sm:p-8 pkxd-glass mb-8">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F0FF] border border-purple-200 text-[#6D28D9] text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Centro de Transparência</span>
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight">
            Privacidade e Direitos
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            Controle completo sobre seus dados no <strong>PK XD Central</strong> — incluindo conta Google/Firebase, Identidade PK XD, Eventos e Agenda, Sistema de XP, Notificações Push e integração opcional com o YouTube no Progresso Creator.
          </p>
        </div>
      </div>

      {/* The 5 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16 }}
              className={`rounded-3xl p-5 border-2 flex flex-col justify-between transition-colors group shadow-sm ${card.cardStyle}`}
            >
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.iconBox}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                    {card.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1 font-sans">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              <button
                id={card.id}
                onClick={card.onClick}
                className="pkxd-btn-outline w-full py-2.5 px-3.5 text-xs flex items-center justify-between cursor-pointer"
              >
                <span>{card.actionLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Contact Footer */}
      <div className="p-5 rounded-3xl pkxd-glass text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <div className="space-y-0.5 text-center sm:text-left">
          <strong className="text-slate-900 block text-sm">Dúvidas ou Requisições Especiais?</strong>
          <span>
            Responsável: <strong className="text-slate-900">Equipe PKXD Central</strong> •{' '}
            <span className="font-mono font-bold text-[#6D28D9]">privacidade@pkxdcentral.site</span>
          </span>
        </div>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onOpenDataRequest();
          }}
          className="pkxd-btn-primary px-5 py-2.5 text-xs cursor-pointer shrink-0"
        >
          Abrir Solicitação
        </button>
      </div>
    </div>
  );
}

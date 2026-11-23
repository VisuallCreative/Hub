import React from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Cookie,
  Sliders
} from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack: () => void;
  onOpenCookiePreferences: () => void;
  onOpenDataRequest: () => void;
  triggerAudio?: (sound: 'tap') => void;
}

export default function PrivacyPolicyView({
  onBack,
  onOpenCookiePreferences,
  onOpenDataRequest,
  triggerAudio,
}: PrivacyPolicyViewProps) {
  const handleBack = () => {
    if (triggerAudio) triggerAudio('tap');
    onBack();
  };

  return (
    <div id="privacy-policy-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-slate-900 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-purple-200/80">
        <button
          onClick={handleBack}
          className="pkxd-btn-outline px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Portal</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onOpenCookiePreferences();
            }}
            className="px-3.5 py-2 rounded-full bg-[#F3F0FF] hover:bg-purple-100 border border-purple-200 text-[#6D28D9] text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Gerenciar Cookies</span>
          </button>

          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onOpenDataRequest();
            }}
            className="px-3.5 py-2 rounded-full bg-[#EFF8FF] hover:bg-sky-100 border border-sky-200 text-[#0284C7] text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Seus Direitos</span>
          </button>
        </div>
      </div>

      <div className="pkxd-glass rounded-[34px] p-6 sm:p-8 space-y-8">
        <div className="space-y-2 border-b-2 border-slate-100 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F0FF] border border-purple-200 text-[#6D28D9] text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Transparência e LGPD</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Política de Privacidade
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Última atualização: <strong className="text-slate-800">2026</strong> • Versão 2.0
          </p>
        </div>

        <div className="space-y-7 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
          <section className="p-5 rounded-2xl bg-[#F8FAFC] border-2 border-slate-200 space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              1. Informações Gerais e Compromisso com a Privacidade
            </h2>
            <p>
              Esta Política de Privacidade descreve de forma transparente e acessível como o <strong>PKXD Central</strong> lida com as informações geradas, armazenadas ou compartilhadas quando você utiliza nosso portal.
            </p>
            <p>
              O portal é um projeto independente mantido por fãs, destinado à comunidade de jogadores de PK XD. Respeitamos a privacidade de todos os visitantes e cumprimos a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              2. Quais Dados Podem Ser Coletados
            </h2>
            <p>Coletamos apenas as informações estritamente necessárias para as funcionalidades do portal:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                <strong className="text-slate-900">Dados Básicos de Conta (Opcional):</strong> Nome de exibição, e-mail e foto de perfil quando você opta por fazer login (Google ou E-mail e Senha).
              </li>
              <li>
                <strong className="text-slate-900">Tag e Identificador PK XD (Opcional):</strong> Nickname e número da tag (ex: NICK#123) informados voluntariamente para enquetes, eventos ou PKXD ID.
              </li>
              <li>
                <strong className="text-slate-900">Interações da Comunidade:</strong> Votos em enquetes, comentários, teorias, artes e curtidas.
              </li>
              <li>
                <strong className="text-slate-900">Dados Públicos de Canal do YouTube (Módulo Creator):</strong> Métricas públicas obtidas mediante autorização explícita via OAuth para cálculo de progresso de criadores.
              </li>
              <li>
                <strong className="text-slate-900">Dados Técnicos e Preferências:</strong> Preferências de áudio, consentimento de cookies e dados locais salvos no navegador.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900">
              3. Para Que os Dados São Utilizados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-extrabold">Operação do Portal</strong>
                <p className="text-xs text-slate-600">Permitir login, emissão de PKXD ID e carregamento de notícias e eventos.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-extrabold">Análise Creator</strong>
                <p className="text-xs text-slate-600">Calcular o progresso de canais do YouTube em relação aos requisitos públicos.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-extrabold">Interação Social</strong>
                <p className="text-xs text-slate-600">Exibir comentários, rankings de fãs, missões e artes submetidas pelos membros.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-extrabold">Segurança e Integridade</strong>
                <p className="text-xs text-slate-600">Prevenir spam, abusos e garantir conformidade com os Termos de Uso.</p>
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              4. Armazenamento e Proteção
            </h2>
            <p>
              <strong className="text-slate-900">Armazenamento Local:</strong> Preferências de som, tag PK XD e progresso offline são salvos no <em>localStorage</em> do seu navegador.
            </p>
            <p>
              <strong className="text-slate-900">Infraestrutura Segura:</strong> Dados sincronizados utilizam criptografia HTTPS/TLS e regras de acesso do Firebase (Google Cloud).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900">
              5. Cookies e Tecnologias Semelhantes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#ECFDF5] rounded-2xl border border-emerald-200">
                <strong className="text-emerald-800 block font-extrabold mb-1">Cookies Necessários (Ativos)</strong>
                <span className="text-slate-700">Garantem segurança, autenticação de sessão e estabilidade do portal.</span>
              </div>
              <div className="p-3.5 bg-[#F3F0FF] rounded-2xl border border-purple-200">
                <strong className="text-[#6D28D9] block font-extrabold mb-1">Cookies de Preferência (Opcionais)</strong>
                <span className="text-slate-700">Lembram configurações como som, filtros e personalizações.</span>
              </div>
              <div className="p-3.5 bg-[#EFF8FF] rounded-2xl border border-sky-200">
                <strong className="text-[#0284C7] block font-extrabold mb-1">Cookies de Análise (Opcionais)</strong>
                <span className="text-slate-700">Avaliam audiência agregada e desempenho sem identificação direta.</span>
              </div>
              <div className="p-3.5 bg-pink-50 rounded-2xl border border-pink-200">
                <strong className="text-pink-700 block font-extrabold mb-1">Cookies de Marketing (Opcionais)</strong>
                <span className="text-slate-700">Aplicáveis apenas em integrações promocionais ou avisos contextuais.</span>
              </div>
            </div>
            <div className="pt-1">
              <button
                onClick={() => {
                  if (triggerAudio) triggerAudio('tap');
                  onOpenCookiePreferences();
                }}
                className="pkxd-btn-outline px-4 py-2 text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-[#6D28D9]" />
                <span>Abrir Preferências de Cookies</span>
              </button>
            </div>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              6. Seus Direitos (LGPD)
            </h2>
            <p>
              Você pode solicitar acesso, correção, exportação em JSON ou eliminação dos seus dados a qualquer momento pelo nosso autoatendimento:
            </p>
            <div className="pt-1">
              <button
                onClick={() => {
                  if (triggerAudio) triggerAudio('tap');
                  onOpenDataRequest();
                }}
                className="pkxd-btn-primary px-4 py-2.5 text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Exercer Meus Direitos de Privacidade</span>
              </button>
            </div>
          </section>

          <section className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
            <h2 className="font-display font-bold text-base text-slate-900">
              7. Contato e Encarregado (DPO)
            </h2>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                <span className="font-sans">Responsável pelo Portal:</span>
                <span className="text-slate-900 font-bold">Equipe PKXD Central</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                <span className="font-sans">E-mail de Privacidade:</span>
                <span className="text-[#6D28D9] font-bold">privacidade@pkxdcentral.site</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

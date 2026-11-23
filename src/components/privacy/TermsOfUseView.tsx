import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

interface TermsOfUseViewProps {
  onBack: () => void;
  triggerAudio?: (sound: 'tap') => void;
}

export default function TermsOfUseView({ onBack, triggerAudio }: TermsOfUseViewProps) {
  const handleBack = () => {
    if (triggerAudio) triggerAudio('tap');
    onBack();
  };

  return (
    <div id="terms-of-use-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-slate-900 text-left">
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-purple-200/80">
        <button
          onClick={handleBack}
          className="pkxd-btn-outline px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Portal</span>
        </button>

        <span className="text-xs text-violet-900 bg-white border border-purple-200 px-3 py-1 rounded-full font-mono font-bold">
          Versão 2.0 • 2026
        </span>
      </div>

      <div className="pkxd-glass rounded-[34px] p-6 sm:p-8 space-y-8">
        <div className="space-y-2 border-b-2 border-slate-100 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF8FF] border border-sky-200 text-[#0284C7] text-xs font-extrabold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Regras e Condições</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Termos de Uso
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Leia atentamente os termos e condições para utilização do portal PKXD Central.
          </p>
        </div>

        <div className="space-y-7 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
          <section className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              1. Aceitação e Objeto do Site
            </h2>
            <p>
              Ao acessar e utilizar o <strong>PKXD Central</strong>, você concorda com estes Termos de Uso e com nossa Política de Privacidade.
            </p>
            <p>
              O PKXD Central é um portal gratuito criado de forma independente por fãs de PK XD, reunindo novidades, contagens regressivas, eventos, rankings e ferramentas de progresso para criadores.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              2. Responsabilidades do Usuário
            </h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Fornecer informações verdadeiras em formulários e cadastros opcionais;</li>
              <li>Manter a segurança de suas credenciais de acesso quando criar conta;</li>
              <li>Respeitar os demais membros da comunidade, mantendo um ambiente amigável e seguro;</li>
              <li>Não praticar atos que comprometam o funcionamento ou segurança do site.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              3. Conteúdo Enviado pelos Usuários
            </h2>
            <p>
              Nas áreas de comentários, teorias, enquetes, artes e eventos, o usuário é responsável pelo conteúdo publicado. A moderação pode remover conteúdos que violem leis, direitos autorais ou regras da comunidade.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              4. Propriedade Intelectual e Independência
            </h2>
            <div className="p-4 rounded-2xl bg-[#FFFBEB] border-2 border-amber-200 text-amber-950 space-y-1.5">
              <strong className="block font-extrabold text-xs uppercase tracking-wider text-amber-900">
                Aviso Importante sobre a Marca PK XD
              </strong>
              <p className="text-xs leading-relaxed">
                <strong>PK XD</strong> é uma marca registrada de seus legítimos titulares (Afterverse / PlayKids). O PKXD Central é um portal independente criado por fãs e não possui vínculo oficial, afiliação ou patrocínio da desenvolvedora do jogo.
              </p>
            </div>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              5. Comportamento Proibido
            </h2>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Publicar ofensas, discursos de ódio, ameaças ou conteúdo impróprio;</li>
              <li>Veicular spam, links maliciosos, golpes ou tentativas de fraude;</li>
              <li>Explorar vulnerabilidades técnicas ou passar-se por administradores/criadores oficiais.</li>
            </ul>
          </section>

          <section className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
            <h2 className="font-display font-bold text-base text-slate-900">
              6. Contato e Esclarecimentos
            </h2>
            <p>
              Em caso de dúvidas ou denúncias relativas a estes Termos de Uso, utilize a aba de feedback/denúncia no portal ou contate:
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 font-mono text-xs">
              <div className="text-slate-600">Responsável: <span className="text-slate-900 font-bold">Equipe PKXD Central</span></div>
              <div className="text-slate-600">Atendimento: <span className="text-[#6D28D9] font-bold">contato@pkxdcentral.site</span></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  FileText,
  ArrowLeft,
  ShieldAlert,
  Calendar,
  Youtube,
  Award,
  Scale
} from 'lucide-react';

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
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-purple-200/40 flex-wrap">
        <button
          onClick={handleBack}
          className="pkxd-pop-btn px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Portal</span>
        </button>

        <span className="text-xs text-[#120624] bg-[#F9C826] border-2 border-[#120624] px-3.5 py-1 rounded-full font-mono font-extrabold">
          Versão 3.0 • Novembro 2026
        </span>
      </div>

      <div className="pkxd-glass rounded-[34px] p-6 sm:p-8 space-y-8">
        <div className="space-y-2 border-b-2 border-slate-100 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF8FF] border border-sky-200 text-[#0284C7] text-xs font-extrabold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Regras, Direitos e Condições</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Termos de Uso — PK XD Central
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Regras completas de convivência, responsabilidades, propriedade intelectual e uso de todas as ferramentas de <strong>pkxdcentral.site</strong>.
          </p>
        </div>

        <div className="space-y-7 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
          {/* 1. Aceitação e Objeto */}
          <section className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              1. Aceitação e Objeto da Plataforma
            </h2>
            <p>
              Ao acessar, instalar o aplicativo PWA ou utilizar qualquer recurso do <strong>PK XD Central</strong> (<strong>pkxdcentral.site</strong>), você concorda com estes Termos de Uso e com a nossa <strong>Política de Privacidade</strong>. Caso não concorde com alguma condição, recomendamos não utilizar os recursos que exijam cadastro ou envio de conteúdo.
            </p>
            <p>
              O PK XD Central é uma plataforma comunitária gratuita voltada aos jogadores e criadores de PK XD, oferecendo: Central de Eventos e Minha Agenda, Identidade PK XD e Passaporte, Sistema de XP e Conquistas, Notícias e Spoilers, espaço de Creators e Analisador de Progresso Creator, Notificações e áreas interativas da comunidade (comentários, teorias, artes, enquetes e inscrições).
            </p>
          </section>

          {/* 2. Independência e Propriedade Intelectual */}
          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#6D28D9]" />
              <span>2. Independência do Portal e Direitos de Propriedade Intelectual</span>
            </h2>
            <div className="p-4 rounded-2xl bg-[#FFFBEB] border-2 border-amber-300 text-amber-950 space-y-1.5">
              <strong className="block font-extrabold text-xs uppercase tracking-wider text-amber-900">
                Aviso Legal sobre a Marca PK XD
              </strong>
              <p className="text-xs leading-relaxed">
                <strong>PK XD</strong>, seus logotipos, personagens, itens, gemas e elementos audiovisuais são marcas e propriedades registradas da <strong>Afterverse / PlayKids</strong>. O <strong>PK XD Central</strong> é um projeto independente feito por fãs, sem afiliação oficial, endosso, patrocínio ou administração pela desenvolvedora do jogo.
              </p>
            </div>
            <p>
              O layout, código-fonte, organização editorial e identidade visual própria do PK XD Central pertencem à equipe do portal. Os conteúdos autorais enviados pelos usuários (artes, teorias, banners de eventos e textos) permanecem de propriedade de seus respectivos criadores, que concedem ao PK XD Central uma licença gratuita, não exclusiva e revogável para exibi-los nas páginas do portal enquanto estiverem publicados.
            </p>
          </section>

          {/* 3. Conta, Identidade PK XD e Menores */}
          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              3. Contas de Usuário, Identidade PK XD e Segurança
            </h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                O login via Conta Google (autenticado com segurança em <code>auth.pkxdcentral.site</code>) ou E-mail e Senha é opcional, sendo necessário apenas para salvar perfil na nuvem, acumular XP vinculado à conta, criar/gerenciar eventos e participar de recursos autenticados.
              </li>
              <li>
                Ao informar sua <strong>Identidade PK XD (Nome#TAG)</strong>, você declara que a tag pertence a você e concorda que ela pode ser exibida em eventos criados ou confirmados e no seu Passaporte PKXD ID.
              </li>
              <li>
                <strong>Segurança contra golpes:</strong> o PK XD Central <strong>nunca</strong> solicita a senha da sua conta do jogo PK XD, códigos de recuperação bancários ou pagamentos em dinheiro para participar de eventos ou ganhar XP.
              </li>
              <li>
                Usuários menores de 18 anos devem utilizar recursos de cadastro e participação com ciência e autorização de seus pais ou responsáveis legais.
              </li>
            </ul>
          </section>

          {/* 4. Eventos e Minha Agenda */}
          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6D28D9]" />
              <span>4. Central de Eventos, Festas e Minha Agenda PKXD</span>
            </h2>
            <p>
              Qualquer usuário autenticado pode divulgar torneios, festas, encontros de creators, esconde-esconde e mini-games no jogo PK XD. Ao publicar um evento, o organizador compromete-se a:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Informar dados reais (data, horário, servidor, regras e limite de vagas) e atualizar ou cancelar o evento caso haja imprevistos;</li>
              <li>Não utilizar eventos para promover golpes, falsos sorteios de gemas, links maliciosos, venda ilegal de contas ou coleta indevida de dados de jogadores;</li>
              <li>Utilizar apenas imagens de divulgação que não violem direitos autorais de terceiros nem contenham material impróprio.</li>
            </ul>
            <p>
              O PK XD Central atua apenas como vitrine e agenda comunitária; não nos responsabilizamos por atrasos, cancelamentos ou ocorrências dentro do jogo PK XD em eventos organizados por terceiros.
            </p>
          </section>

          {/* 5. Progresso Creator e YouTube */}
          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-600" />
              <span>5. Analisador de Progresso Creator e Integração YouTube</span>
            </h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                O módulo <strong>Ver Meu Progresso Creator</strong> realiza uma análise estritamente <strong>informativa e educacional</strong>, comparando métricas públicas do canal (inscritos, vídeos longos +5 min, Shorts, frequência mensal e visualizações dos últimos 16 Shorts) com parâmetros conhecidos do programa de criadores.
              </li>
              <li>
                Atingir 100% no analisador <strong>não garante aprovação automática</strong> no Programa Oficial de Creators PK XD, pois a avaliação final, elegibilidade e concessão de selos ou gemas cabem exclusivamente à Afterverse.
              </li>
              <li>
                Ao utilizar a integração com o YouTube, você também concorda em respeitar os{' '}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-700 font-bold underline"
                >
                  Termos de Serviço do YouTube
                </a>
                .
              </li>
            </ul>
          </section>

          {/* 6. Sistema de XP, Conquistas e Códigos */}
          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>6. Sistema de XP, Recompensas, Conquistas e Códigos</span>
            </h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                O XP acumulado no portal (incluindo bônus únicos como <code>+25 XP</code> no cadastro da Identidade PK XD, <code>+100 XP</code> pela instalação do App PWA e <code>+50 XP</code> na análise Creator), bem como níveis, selos e conquistas do Passaporte, são itens <strong>exclusivamente virtuais e recreativos</strong> do PK XD Central, sem valor monetário, não resgatáveis em dinheiro e intransferíveis.
              </li>
              <li>
                Tentativas de burlar limites de recompensa única, criar contas múltiplas para farmar XP ou manipular votações/enquetes podem resultar em zeragem de XP e suspensão da conta.
              </li>
              <li>
                Códigos promocionais do jogo PK XD divulgados no portal são informativos e dependem de validade, estoque e regras definidas pela desenvolvedora do jogo.
              </li>
            </ul>
          </section>

          {/* 7. Condutas Proibidas e Moderação */}
          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>7. Comportamento Proibido e Moderação Administrativa</span>
            </h2>
            <p>É estritamente proibido no PK XD Central:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Publicar ofensas, bullying, assédio, discursos de ódio, ameaças ou conteúdo impróprio para o público infantojuvenil;</li>
              <li>Divulgar spam, phishing, links suspeitos, golpes de gemas grátis ou pedidos de senha/conta;</li>
              <li>Fazer-se passar por administradores do PK XD Central, membros da Afterverse ou outros criadores de conteúdo;</li>
              <li>Explorar falhas técnicas, realizar ataques automatizados ou tentar acessar áreas administrativas sem autorização.</li>
            </ul>
            <p>
              A equipe administrativa do PK XD Central reserva-se o direito de moderar, ocultar ou remover eventos, comentários, artes, teorias e publicações que violem estes Termos, bem como suspender ou encerrar contas reincidentes, sem aviso prévio quando necessário para proteger a comunidade.
            </p>
          </section>

          {/* 8. Disponibilidade, Notificações e Alterações */}
          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              8. Disponibilidade, Notificações e Atualizações dos Termos
            </h2>
            <p>
              Trabalhamos continuamente para manter o PK XD Central rápido, seguro e disponível (inclusive como App PWA), mas não garantimos operação ininterrupta ou isenta de falhas técnicas de terceiros (como instabilidades momentâneas em APIs do YouTube, Firebase ou provedores de internet).
            </p>
            <p>
              Podemos atualizar estes Termos de Uso periodicamente para refletir novos recursos do portal ou exigências legais. O uso continuado após a publicação da nova versão implica ciência e concordância com os termos atualizados.
            </p>
          </section>

          {/* 9. Contato */}
          <section className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2">
            <h2 className="font-display font-bold text-base text-slate-900">
              9. Contato, Denúncias e Direitos Autorais
            </h2>
            <p>
              Para dúvidas sobre estes Termos, denúncias de eventos/conteúdos inadequados ou pedidos de remoção por direitos autorais, utilize a aba de <strong>Feedback & Denúncias</strong> do portal ou entre em contato:
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                <span className="font-sans">Responsável:</span>
                <span className="text-slate-900 font-bold">Equipe PK XD Central</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                <span className="font-sans">Atendimento e Denúncias:</span>
                <span className="text-[#6D28D9] font-bold">contato@pkxdcentral.site</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                <span className="font-sans">Privacidade e Dados (LGPD):</span>
                <span className="text-[#6D28D9] font-bold">privacidade@pkxdcentral.site</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

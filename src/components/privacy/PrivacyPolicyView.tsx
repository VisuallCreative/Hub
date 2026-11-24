import React from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Cookie,
  Sliders,
  Youtube,
  Database,
  Bell,
  Users,
  Lock,
  ExternalLink
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-purple-200/40">
        <button
          onClick={handleBack}
          className="pkxd-pop-btn px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Portal</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onOpenCookiePreferences();
            }}
            className="px-3.5 py-2 rounded-full bg-white hover:bg-purple-50 border-2 border-[#120624] text-[#6D28D9] text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Gerenciar Cookies</span>
          </button>

          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onOpenDataRequest();
            }}
            className="px-3.5 py-2 rounded-full bg-[#F9C826] hover:bg-amber-300 border-2 border-[#120624] text-[#120624] text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Exercer Meus Direitos</span>
          </button>
        </div>
      </div>

      <div className="pkxd-glass rounded-[34px] p-6 sm:p-8 space-y-8">
        <div className="space-y-2 border-b-2 border-slate-100 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F0FF] border border-purple-200 text-[#6D28D9] text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Transparência, LGPD & Google API</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Política de Privacidade — PK XD Central
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Domínio oficial: <strong className="text-slate-800">pkxdcentral.site</strong> • Última atualização: <strong className="text-slate-800">Novembro de 2026</strong> • Versão 3.0
          </p>
        </div>

        <div className="space-y-7 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
          {/* 1. Visão Geral */}
          <section className="p-5 rounded-2xl bg-[#F8FAFC] border-2 border-slate-200 space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              1. Compromisso com a Privacidade e Natureza do Portal
            </h2>
            <p>
              Esta Política de Privacidade explica de forma clara, completa e acessível quais dados o <strong>PK XD Central</strong> (acessível em <strong>pkxdcentral.site</strong> e aplicativo PWA instalável) coleta, para qual finalidade cada informação é usada, como protegemos seus dados e como você pode exercer todos os seus direitos.
            </p>
            <p>
              O PK XD Central é uma plataforma digital independente criada por fãs para a comunidade do jogo PK XD, reunindo <strong>Central de Eventos, Minha Agenda, Identidade PK XD / Passaporte, Sistema de XP e Conquistas, Notícias e Spoilers, Comunidade (comentários, teorias, artes, enquetes e inscrições), Notificações Push e o Analisador de Progresso Creator</strong>. Atuamos em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD)</strong> e com a Política de Dados do Usuário dos Serviços de API do Google.
            </p>
          </section>

          {/* 2. Quais dados coletamos e onde */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#6D28D9]" />
              <span>2. Quais Dados Coletamos em Cada Área do Site</span>
            </h2>
            <p>
              Coletamos apenas os dados necessários para o funcionamento de cada recurso que você escolher utilizar. Você pode navegar pela maior parte do portal sem criar conta.
            </p>

            <div className="space-y-2.5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-extrabold">A) Conta e Autenticação (Opcional)</strong>
                <p className="text-slate-600">
                  Ao entrar com sua <strong>Conta Google</strong> (via <code>auth.pkxdcentral.site</code>, utilizando apenas escopos básicos de identificação: <code>openid</code>, <code>email</code> e <code>profile</code>) ou com <strong>E-mail e Senha</strong>, coletamos: identificador único da conta (UID), nome de exibição, endereço de e-mail e foto de perfil pública.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-extrabold">B) Identidade PK XD e Passaporte (PKXD ID)</strong>
                <p className="text-slate-600">
                  Quando você cadastra sua Identidade PK XD ou personaliza seu Passaporte, armazenamos voluntariamente seu <strong>Nome e #TAG do PK XD</strong> (ex: <code>LUNA#245</code>), avatar/estilo do cartão, profissão na ilha e selos resgatados. Esses dados permitem preenchimento automático em festas/eventos e geração do seu cartão de jogador.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-extrabold">C) Central de Eventos e Minha Agenda PKXD</strong>
                <p className="text-slate-600">
                  Ao criar um evento, registramos título, descrição, categoria (Torneios, Festas, Esconde-Esconde, Encontros de Creators, Desafios & Mini-Games, Outros), data, horário, servidor, limite de vagas, imagem de divulgação, link/observações e o Nome#TAG do organizador. Ao confirmar presença, registramos sua participação para exibir o evento na sua <strong>Minha Agenda PKXD</strong> e contabilizar participantes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-extrabold">D) Sistema de XP, Conquistas, Missões e Ranking de Fãs</strong>
                <p className="text-slate-600">
                  Registramos seu saldo de XP, histórico de recompensas (como <code>+25 XP</code> no primeiro cadastro da Identidade PK XD, <code>+100 XP</code> após confirmação de instalação do App PWA, <code>+50 XP</code> na análise Creator e missões concluídas), conquistas desbloqueadas e registros antifraude para garantir concessão única por usuário.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-extrabold">E) Comunidade, Interações, Inscrições e Feedback</strong>
                <p className="text-slate-600">
                  Coletamos conteúdos que você envia voluntariamente: comentários, teorias, artes/fanarts, votos em enquetes, sugestões, denúncias e formulários de inscrição (Creators, parceiros ou equipe), que podem incluir links ou <code>@arrobas</code> públicos de redes sociais (YouTube, Instagram, TikTok) e e-mail de contato.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-extrabold">F) Notificações Push e App Instalável (PWA)</strong>
                <p className="text-slate-600">
                  Somente mediante sua autorização expressa no navegador, armazenamos o token/assinatura técnica de <strong>Web Push</strong> (endpoint e chaves de criptografia do navegador) e o histórico de notificações lidas para enviar alertas sobre novos eventos, mudanças de horário, confirmações de presença, torneios, notícias, spoilers e comunicados da administração.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-extrabold">G) Progresso Creator — Dados Públicos do YouTube</strong>
                <p className="text-slate-600">
                  No módulo <strong>Ver Meu Progresso Creator</strong>, você pode consultar seu canal por <strong>@handle ou link público</strong> (sem login Google) ou conectar voluntariamente via <strong>Google OAuth</strong>. Coletamos apenas métricas públicas do canal: ID do canal, título, @handle, foto pública, contagem de inscritos, total de vídeos, vídeos longos (+5 min), Shorts recentes, contagem de visualizações dos últimos 16 Shorts e datas de publicação para calcular seu progresso nos requisitos do programa.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Google API & YouTube Limited Use */}
          <section className="p-5 rounded-2xl bg-rose-50/70 border-2 border-rose-200 space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Youtube className="w-4 h-4 text-rose-600" />
              <span>3. Uso de Dados das APIs do Google e YouTube (Limited Use)</span>
            </h2>
            <p>
              O uso e a transferência de informações recebidas das APIs do Google pelo <strong>PK XD Central</strong> seguem integralmente a{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-700 font-bold underline inline-flex items-center gap-1"
              >
                Política de Dados do Usuário dos Serviços de API do Google
                <ExternalLink className="w-3 h-3" />
              </a>
              , incluindo os requisitos de <strong>Uso Limitado (Limited Use)</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-700">
              <li>
                <strong>Somente leitura:</strong> ao optar pelo botão <em>Conectar com Google</em> na área Creator, solicitamos apenas o escopo <code>youtube.readonly</code> para identificar seu canal e ler estatísticas públicas (inscritos, vídeos, durações e visualizações). O portal <strong>nunca</strong> cria, edita ou exclui vídeos, comentários ou configurações do seu canal.
              </li>
              <li>
                <strong>Finalidade exclusiva:</strong> os dados do YouTube são usados exclusivamente para exibir a você seu progresso nos requisitos de Creator no próprio navegador (armazenados localmente no seu dispositivo e removíveis clicando em <em>Trocar Canal</em>).
              </li>
              <li>
                <strong>Sem venda ou publicidade:</strong> nunca vendemos, alugamos ou transferimos dados das APIs do Google/YouTube para corretores de dados, anunciantes ou treinamento de modelos de inteligência artificial.
              </li>
              <li>
                <strong>Revogação imediata:</strong> além de desconectar no próprio site, você pode revogar a permissão da sua conta Google a qualquer momento em{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6D28D9] font-bold underline"
                >
                  myaccount.google.com/permissions
                </a>
                .
              </li>
            </ul>
          </section>

          {/* 4. Finalidades e Bases Legais */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900">
              4. Para Que Cada Dado é Utilizado (Finalidades e Bases Legais — LGPD)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-extrabold">Execução das Funcionalidades do Portal</strong>
                <p className="text-xs text-slate-600">
                  Autenticar sua conta, preencher automaticamente sua Tag PK XD em eventos, sincronizar sua Minha Agenda, emitir seu Passaporte e salvar XP e conquistas.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-extrabold">Análise de Progresso Creator</strong>
                <p className="text-xs text-slate-600">
                  Comparar métricas públicas do seu canal do YouTube (inscritos, frequência mensal, vídeos longos e views dos últimos 16 Shorts) com os critérios do programa.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-extrabold">Comunicação e Notificações (Consentimento)</strong>
                <p className="text-xs text-slate-600">
                  Enviar avisos no painel e notificações Push sobre eventos confirmados, torneios, spoilers, notícias e comunicados, somente se você autorizar.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-extrabold">Moderação, Segurança e Antifraude</strong>
                <p className="text-xs text-slate-600">
                  Prevenir spam, duplicidade indevida de recompensas de XP, contas falsas, golpes e conteúdos inadequados por meio da moderação administrativa.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Compartilhamento e Infraestrutura */}
          <section className="space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#6D28D9]" />
              <span>5. Armazenamento, Segurança e Compartilhamento com Terceiros</span>
            </h2>
            <p>
              <strong>Não vendemos nem comercializamos seus dados pessoais.</strong> Para operar o portal com estabilidade e segurança, utilizamos exclusivamente parceiros técnicos essenciais:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                <strong className="text-slate-900">Google Firebase / Cloud Firestore & Authentication:</strong> armazenamento em nuvem de contas, perfis, eventos, notificações, notícias, XP e regras rígidas de controle de acesso com criptografia em trânsito (HTTPS/TLS).
              </li>
              <li>
                <strong className="text-slate-900">Armazenamento Local do Navegador (localStorage & Cache PWA):</strong> salva preferências de som, consentimento de cookies, dados locais do analisador Creator e funcionamento rápido do aplicativo instalado no celular.
              </li>
              <li>
                <strong className="text-slate-900">Serviços Públicos de Métricas do YouTube:</strong> usados apenas para consultar dados já públicos de canais quando você pesquisa por <code>@handle</code> ou link.
              </li>
              <li>
                <strong className="text-slate-900">Visibilidade Pública na Comunidade:</strong> informações que você escolhe publicar em áreas abertas — como nome/tag em eventos criados, comentários, teorias, artes e ranking — ficam visíveis aos demais visitantes do portal. Seu e-mail privado nunca é exibido publicamente.
              </li>
            </ul>
          </section>

          {/* 6. Proteção de Crianças e Adolescentes */}
          <section className="p-5 rounded-2xl bg-[#EFF8FF] border-2 border-sky-200 space-y-2">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0284C7]" />
              <span>6. Privacidade de Crianças e Adolescentes</span>
            </h2>
            <p className="text-slate-700">
              Sabemos que a comunidade de PK XD inclui jovens jogadores. Por isso, aplicamos o princípio da minimização de dados (LGPD, Art. 14): <strong>não exigimos cadastro para navegar, ler notícias ou ver eventos</strong>, e nunca pedimos documentos pessoais, endereço residencial, telefone ou senha do jogo PK XD.
            </p>
            <p className="text-slate-700">
              Menores de 18 anos devem realizar cadastros, publicar eventos ou conectar contas externas sob orientação e consentimento dos pais ou responsáveis legais. Pais ou responsáveis podem solicitar a qualquer momento a revisão ou exclusão imediata de quaisquer dados pelo botão <strong>Exercer Meus Direitos</strong> ou pelo e-mail <code>privacidade@pkxdcentral.site</code>.
            </p>
          </section>

          {/* 7. Cookies e Notificações */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#6D28D9]" />
              <span>7. Cookies, Armazenamento Local e Notificações Push</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#ECFDF5] rounded-2xl border border-emerald-200">
                <strong className="text-emerald-800 block font-extrabold mb-1">Essenciais (Sempre Ativos)</strong>
                <span className="text-slate-700">Mantêm sessão de login segura, proteção antifraude, preferências de consentimento e estabilidade do portal/PWA.</span>
              </div>
              <div className="p-3.5 bg-[#F3F0FF] rounded-2xl border border-purple-200">
                <strong className="text-[#6D28D9] block font-extrabold mb-1">Preferências (Opcionais)</strong>
                <span className="text-slate-700">Memorizam som do site, filtros da agenda, tema de cartão e últimos dados do analisador Creator no seu dispositivo.</span>
              </div>
              <div className="p-3.5 bg-[#EFF8FF] rounded-2xl border border-sky-200">
                <strong className="text-[#0284C7] block font-extrabold mb-1">Análise e Desempenho (Opcionais)</strong>
                <span className="text-slate-700">Ajudam a entender quais páginas e recursos são mais úteis para a comunidade, de forma agregada.</span>
              </div>
              <div className="p-3.5 bg-pink-50 rounded-2xl border border-pink-200">
                <strong className="text-pink-700 block font-extrabold mb-1">Notificações Push (Opt-in)</strong>
                <span className="text-slate-700">Só são ativadas se você clicar em permitir; podem ser revogadas a qualquer instante nas configurações do navegador.</span>
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

          {/* 8. Retenção e Direitos do Titular */}
          <section className="space-y-3">
            <h2 className="font-display font-bold text-base text-slate-900">
              8. Retenção de Dados e Seus Direitos Garantidos pela LGPD
            </h2>
            <p>
              Mantemos seus dados somente enquanto sua conta estiver ativa ou enquanto necessários para os fins descritos nesta Política. Conforme o Art. 18 da LGPD, você tem direito a:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700">
              <li><strong>Confirmação e Acesso:</strong> saber quais dados seus estão armazenados e obter uma cópia completa (inclusive exportação em formato JSON);</li>
              <li><strong>Correção:</strong> editar sua Identidade PK XD (Nome#TAG), perfil, eventos ou informações incorretas/desatualizadas;</li>
              <li><strong>Eliminação e Esquecimento:</strong> solicitar a exclusão definitiva da sua conta, eventos, assinatura Push e dados pessoais;</li>
              <li><strong>Revogação de Consentimento:</strong> cancelar cookies opcionais, notificações Push ou a conexão Google/YouTube a qualquer momento;</li>
              <li><strong>Informação e Oposição:</strong> obter esclarecimentos sobre compartilhamento de dados e se opor a tratamentos em desacordo com a lei.</li>
            </ul>
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

          {/* 9. Alterações e Contato */}
          <section className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2.5">
            <h2 className="font-display font-bold text-base text-slate-900">
              9. Atualizações desta Política e Contato (Encarregado / DPO)
            </h2>
            <p>
              Sempre que lançarmos novos recursos relevantes no PK XD Central, atualizaremos esta Política informando a nova data de revisão no topo da página. Para dúvidas, solicitações de pais/responsáveis ou exercício de direitos de privacidade, fale com nossa equipe:
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                <span className="font-sans">Controlador / Responsável:</span>
                <span className="text-slate-900 font-bold">Equipe PK XD Central</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                <span className="font-sans">Portal Oficial:</span>
                <span className="text-slate-900 font-bold">https://pkxdcentral.site</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                <span className="font-sans">E-mail de Privacidade (DPO):</span>
                <span className="text-[#6D28D9] font-bold">privacidade@pkxdcentral.site</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

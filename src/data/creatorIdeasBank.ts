import { AnalysisSummary, ChannelMetrics, CreatorFormat, ProgramTier } from '../types/creator';

export interface ThumbnailBlueprint {
  headlineText: string;
  focalBadge: string;
  visualScene: string;
  expressionAndPose: string;
  primaryColor: string;
  accentColor: string;
  proTip: string;
}

export interface VideoIdeaBlueprint {
  id: string;
  category: string;
  format: 'Shorts' | 'Vídeo Longo (+5 min)';
  estimatedDuration: string;
  title: string;
  hook: string;
  scriptSteps: string[];
  viralReason: string;
  hashtags: string[];
  thumbnail: ThumbnailBlueprint;
}

export const CREATOR_FOCUS_CATEGORIES = [
  { id: 'shorts_10k', label: 'Bater 10k nos 16 Shorts' },
  { id: 'long_5min', label: 'Vídeos Longos (+5 min)' },
  { id: 'updates', label: 'Atualizações & Spoilers' },
  { id: 'challenges', label: 'Desafios & Mini-Games' },
  { id: 'lore', label: 'Segredos (Admin & Nimda)' },
  { id: 'subs', label: 'Ganhar Inscritos Rápido' }
] as const;

export const PKXD_IDEAS_BANK: VideoIdeaBlueprint[] = [
  // === BATER 10K NOS 16 SHORTS ===
  {
    id: 'short-3-erros-novatos',
    category: 'Bater 10k nos 16 Shorts',
    format: 'Shorts',
    estimatedDuration: '30–45 seg',
    title: '3 Erros que Todo Jogador Comete no PK XD (O 3º Dá Raiva!)',
    hook: 'Se você já perdeu moedas ou gemas no PK XD, aposto que já fez o erro número 3!',
    scriptSteps: [
      'Mostre o erro 1 em 6 segundos (gastar gemas antes de checar a caixa secreta da semana).',
      'Mostre o erro 2 em 8 segundos (esquecer de evoluir o pet antes de entrar em corridas).',
      'Feche com o erro 3 bem rápido e pergunte nos comentários: "Qual desses você já fez?"'
    ],
    viralReason: 'Listas rápidas com curiosidade no item final aumentam o tempo de exibição e geram dezenas de comentários.',
    hashtags: ['#PKXD', '#PKXDShorts', '#DicasPKXD', '#PKXDBrasil', '#Shorts'],
    thumbnail: {
      headlineText: 'NÃO FAÇA ISSO!',
      focalBadge: '3 ERROS',
      visualScene: 'Avatar na Praça do PK XD cercado por ícones de gemas riscados com um X vermelho brilhante.',
      expressionAndPose: 'Close no avatar com as mãos na cabeça e expressão assustada/surpresa olhando para a câmera.',
      primaryColor: '#5B1EB0',
      accentColor: '#F9C826',
      proTip: 'Use no máximo 3 palavras grandes e deixe o X vermelho bem visível mesmo em telas pequenas.'
    }
  },
  {
    id: 'short-antes-depois-casa',
    category: 'Bater 10k nos 16 Shorts',
    format: 'Shorts',
    estimatedDuration: '25–40 seg',
    title: 'Transformei a Casa Mais Barata do PK XD em uma Mansão Secreta!',
    hook: 'Olha como essa casa simples de moedas ficou depois de 10 minutos de decoração!',
    scriptSteps: [
      'Comece mostrando a casa totalmente vazia por 2 segundos com corte seco.',
      'Faça transições sincronizadas na batida da música colocando parede, luzes neon e área gamer.',
      'Finalize com um tour de 5 segundos e peça uma nota de 0 a 10 nos comentários.'
    ],
    viralReason: 'Transformações de antes e depois em ritmo acelerado fazem as pessoas assistirem 2 ou 3 vezes em loop.',
    hashtags: ['#PKXD', '#DecoracaoPKXD', '#CasaPKXD', '#PKXDShorts', '#Shorts'],
    thumbnail: {
      headlineText: 'ANTES X DEPOIS',
      focalBadge: 'CASA BARATA',
      visualScene: 'Tela dividida: lado esquerdo casa vazia escura, lado direito sala super iluminada com móveis neon.',
      expressionAndPose: 'Avatar no centro apontando para o lado transformado com sorriso confiante.',
      primaryColor: '#3B0764',
      accentColor: '#22D3EE',
      proTip: 'Escureça levemente o lado "Antes" para o lado "Depois" brilhar e puxar o olhar imediatamente.'
    }
  },
  {
    id: 'short-caixa-secreta-fast',
    category: 'Bater 10k nos 16 Shorts',
    format: 'Shorts',
    estimatedDuration: '20–35 seg',
    title: 'Pegue AGORA a Caixa Secreta Escondida Antes que Suma do PK XD!',
    hook: 'Para tudo! Tem uma caixa secreta escondida no mapa agora e quase ninguém viu!',
    scriptSteps: [
      'Mostre o ponto de partida exato (ex: frente do Robozão ou Torre) nos primeiros 3 segundos.',
      'Acelere o trajeto em 1.5x com setas simples apontando onde pular.',
      'Abra a caixa no final mostrando a recompensa e mande salvar o vídeo para não esquecer.'
    ],
    viralReason: 'Utilidade imediata gera muitos compartilhamentos e salvamentos, disparando o alcance no feed de Shorts.',
    hashtags: ['#PKXD', '#CaixaSecretaPKXD', '#SegredoPKXD', '#PKXDShorts', '#Shorts'],
    thumbnail: {
      headlineText: 'CAIXA SECRETA!',
      focalBadge: 'PEGUE JÁ',
      visualScene: 'Caixa brilhante escondida no alto de uma construção do mapa com uma seta amarela gigante apontando.',
      expressionAndPose: 'Avatar pulando com armadura de salto bem perto da caixa com olhar animado.',
      primaryColor: '#1E1B4B',
      accentColor: '#FACC15',
      proTip: 'Adicione um brilho suave atrás da caixa para criar contraste contra o céu do PK XD.'
    }
  },
  {
    id: 'short-bug-ou-truque',
    category: 'Bater 10k nos 16 Shorts',
    format: 'Shorts',
    estimatedDuration: '30–45 seg',
    title: 'Testei o Truque Secreto de Velocidade no Crazy Run — Funcionou?',
    hook: 'Será que esse atalho no Crazy Run realmente deixa você em 1º lugar toda partida?',
    scriptSteps: [
      'Mostre a largada do Crazy Run e anuncie o teste em 4 segundos.',
      'Execute o atalho em câmera lenta no momento do pulo exato.',
      'Mostre o resultado cruzando a linha de chegada e pergunte se querem a parte 2.'
    ],
    viralReason: 'Vídeos de "Testando se funciona" seguram a retenção até o último segundo pela curiosidade do resultado.',
    hashtags: ['#PKXD', '#CrazyRun', '#DicasPKXD', '#PKXDShorts', '#Shorts'],
    thumbnail: {
      headlineText: 'FUNCIONA MESMO?',
      focalBadge: 'ATALHO',
      visualScene: 'Pista do Crazy Run com trilha de velocidade neon atrás do personagem saltando um obstáculo.',
      expressionAndPose: 'Avatar inclinado para frente em corrida máxima com expressão determinada.',
      primaryColor: '#311068',
      accentColor: '#FF3B9A',
      proTip: 'Deixe o fundo levemente desfocado em movimento (motion blur) para passar sensação real de velocidade.'
    }
  },

  // === VÍDEOS LONGOS (+5 MIN) ===
  {
    id: 'long-24h-so-itens-gratis',
    category: 'Vídeos Longos (+5 min)',
    format: 'Vídeo Longo (+5 min)',
    estimatedDuration: '7–10 min',
    title: 'Sobrevivi 1 Dia Inteiro no PK XD Usando APENAS Itens Grátis (Sem Gemas!)',
    hook: 'Será que dá para montar um visual incrível, decorar uma casa e vencer mini-games sem gastar 1 única gema?',
    scriptSteps: [
      'Apresente as 3 regras do desafio em 30 segundos (zero gemas, só itens de moedas e recompensas).',
      'Etapa 1: crie o melhor look possível gastando o mínimo e peça nota no servidor.',
      'Etapa 2: jogue Crazy Run e Pet Parade para juntar moedas em tempo real.',
      'Etapa 3: decore a casa e faça o tour final mostrando o saldo intacto de gemas.'
    ],
    viralReason: 'Desafios com metas claras e etapas mantêm quem assiste até o final e cumprem com folga a marca de +5 minutos.',
    hashtags: ['#PKXD', '#DesafioPKXD', '#SemGemas', '#PKXDBrasil', '#PKXDCreator'],
    thumbnail: {
      headlineText: 'ZERO GEMAS!',
      focalBadge: 'DESAFIO',
      visualScene: 'Avatar com look criativo de moedas ao lado de um baú de gemas trancado com cadeado gigante.',
      expressionAndPose: 'Avatar sorrindo com os braços cruzados e olhar desafiador em primeiro plano.',
      primaryColor: '#4C1D95',
      accentColor: '#FDE047',
      proTip: 'Coloque o avatar ocupando 45% da imagem no lado esquerdo e o texto grande alinhado à direita.'
    }
  },
  {
    id: 'long-avaliando-casas-inscritos',
    category: 'Vídeos Longos (+5 min)',
    format: 'Vídeo Longo (+5 min)',
    estimatedDuration: '8–12 min',
    title: 'Avaliei as Casas Mais Criativas dos Meus Inscritos no PK XD (Notas de 0 a 10!)',
    hook: 'Vocês me desafiaram a visitar suas casas no PK XD — e a última me deixou sem palavras!',
    scriptSteps: [
      'Mostre um teaser de 5 segundos da casa mais bonita sem revelar tudo.',
      'Visite 4 ou 5 casas comentando detalhes criativos de móveis, cores e iluminação.',
      'Dê uma nota de 0 a 10 para cada uma e mostre ideias que qualquer pessoa pode copiar.',
      'Convide quem está assistindo a comentar o nickname/código para aparecer no próximo episódio.'
    ],
    viralReason: 'Envolve a comunidade diretamente, explode os comentários e cria uma série recorrente que fideliza inscritos.',
    hashtags: ['#PKXD', '#CasasPKXD', '#InscritosPKXD', '#DecoracaoPKXD', '#PKXDBrasil'],
    thumbnail: {
      headlineText: 'NOTA 1000?!',
      focalBadge: 'INSCRITOS',
      visualScene: 'Interior luxuoso de uma casa do PK XD ao fundo com placas de nota "10" flutuando.',
      expressionAndPose: 'Avatar com expressão de boca aberta impressionado segurando uma placa de nota.',
      primaryColor: '#2E1065',
      accentColor: '#34D399',
      proTip: 'Use um recorte limpo com contorno branco fino ao redor do avatar para destacar do cenário detalhado.'
    }
  },
  {
    id: 'long-guia-definitivo-moedas',
    category: 'Vídeos Longos (+5 min)',
    format: 'Vídeo Longo (+5 min)',
    estimatedDuration: '6–9 min',
    title: 'Guia Completo: Como Farmar Muitas Moedas Rápido no PK XD (Método Atualizado)',
    hook: 'Se você quer comprar a nova casa ou armadura sem passar horas farmando do jeito errado, siga essa rota!',
    scriptSteps: [
      'Compare quanto tempo leva farmar aleatoriamente vs. seguindo uma rotina otimizada.',
      'Mostre na prática a ordem ideal: entrega de pizza, colheita de frutas, Crazy Run e bônus diários.',
      'Coloque um cronômetro na tela provando quantas moedas você ganhou em 5 minutos reais.',
      'Feche com um resumo rápido na tela para o pessoal tirar print.'
    ],
    viralReason: 'Conteúdo pesquisável ("como ganhar moedas no PK XD") continua recebendo views todos os dias por meses.',
    hashtags: ['#PKXD', '#MoedasPKXD', '#DicasPKXD', '#TutorialPKXD', '#PKXDCreator'],
    thumbnail: {
      headlineText: 'MOEDAS RÁPIDO!',
      focalBadge: 'GUIA 2026',
      visualScene: 'Chuva de moedas douradas do PK XD atrás do personagem com seta verde subindo.',
      expressionAndPose: 'Avatar comemorando com os dois braços levantados e sorriso largo.',
      primaryColor: '#1E1B4B',
      accentColor: '#F59E0B',
      proTip: 'Contraste o roxo escuro do fundo com dourado vivo nas moedas e no texto para máxima legibilidade.'
    }
  },
  {
    id: 'long-evoluindo-pets-raros',
    category: 'Vídeos Longos (+5 min)',
    format: 'Vídeo Longo (+5 min)',
    estimatedDuration: '7–10 min',
    title: 'Abri Vários Pet Pods Até Conseguir um Pet Raro no PK XD! (Deu Sorte?)',
    hook: 'Juntei moedas a semana toda para abrir esses Pet Pods — será que hoje vem um pet lendário?',
    scriptSteps: [
      'Mostre todos os Pet Pods prontos no quintal e diga qual pet você está caçando.',
      'Cumpra as missões de chocar com cortes dinâmicos e reações sinceras a cada abertura.',
      'Compare os pets que vieram e faça fusão no Pet Shop se completar o nível.',
      'Peça sugestões de nomes nos comentários para o pet vencedor.'
    ],
    viralReason: 'Abertura de Pet Pods tem alto fator surpresa e gera forte engajamento com pedidos de nomes nos comentários.',
    hashtags: ['#PKXD', '#PetsPKXD', '#PetPod', '#PKXDBrasil', '#GameplayPKXD'],
    thumbnail: {
      headlineText: 'VEIO LENDÁRIO?!',
      focalBadge: 'PET POD',
      visualScene: 'Pet Pod rachando com raio luminoso dourado saindo de dentro e silhueta misteriosa de pet.',
      expressionAndPose: 'Avatar ajoelhado ao lado do Pod com olhos brilhando de expectativa.',
      primaryColor: '#4A044E',
      accentColor: '#FACC15',
      proTip: 'Transforme o pet em silhueta escura com interrogação "?" para despertar curiosidade imediata.'
    }
  },

  // === ATUALIZAÇÕES & SPOILERS ===
  {
    id: 'update-analise-spoiler-short',
    category: 'Atualizações & Spoilers',
    format: 'Shorts',
    estimatedDuration: '30–50 seg',
    title: '5 Detalhes Escondidos no Novo Spoiler do PK XD que Quase Ninguém Viu!',
    hook: 'Você viu a nova imagem oficial do PK XD? Se piscar, perde o detalhe mais secreto no canto!',
    scriptSteps: [
      'Mostre a imagem/trailer oficial por 2 segundos e dê zoom rápido no primeiro detalhe escondido.',
      'Aponte 3 a 5 pistas de itens, roupas, pets ou mudanças no mapa usando círculos vermelhos.',
      'Encerre perguntando qual novidade deixou a galera mais ansiosa.'
    ],
    viralReason: 'Vídeos de detalhes escondidos em spoilers surfam o pico de buscas no dia do anúncio oficial.',
    hashtags: ['#PKXD', '#SpoilerPKXD', '#AtualizacaoPKXD', '#PKXDCentral', '#Shorts'],
    thumbnail: {
      headlineText: 'VOCÊ VIU ISSO?!',
      focalBadge: 'SPOILER',
      visualScene: 'Zoom ampliado com lupa e círculo vermelho destacando um elemento misterioso da atualização.',
      expressionAndPose: 'Avatar no canto inferior olhando fixamente para o detalhe circulado.',
      primaryColor: '#230647',
      accentColor: '#FF3B9A',
      proTip: 'Use um círculo vermelho + seta amarela apontando exatamente para o detalhe com zoom.'
    }
  },
  {
    id: 'update-review-completo-long',
    category: 'Atualizações & Spoilers',
    format: 'Vídeo Longo (+5 min)',
    estimatedDuration: '7–11 min',
    title: 'CHEGOU! Testando TUDO da Nova Atualização do PK XD (Vale a Pena?)',
    hook: 'A atualização acabou de sair! Antes de gastar suas moedas ou gemas, vem ver tudo o que realmente compensa!',
    scriptSteps: [
      'Mostre o mapa renovado logo na abertura com reação genuína.',
      'Teste cada nova roupa, armadura, casa ou mini-game destacando prós e contras.',
      'Mostre se existe caixa secreta nova ou recompensa grátis no evento.',
      'Dê seu veredito final: "O que vale comprar primeiro e o que dá para pular."'
    ],
    viralReason: 'Jogadores procuram reviews honestos antes de gastar recursos no jogo, elevando muito o tempo assistido.',
    hashtags: ['#PKXD', '#NovaAtualizacaoPKXD', '#PKXDUpdate', '#PKXDBrasil', '#PKXDCreator'],
    thumbnail: {
      headlineText: 'VALE A PENA?',
      focalBadge: 'NOVA UPDATE',
      visualScene: 'Novo cenário ou armadura da atualização em destaque no centro com brilho épico ao redor.',
      expressionAndPose: 'Avatar equipando o item novo em pose de ação no centro da tela.',
      primaryColor: '#1E1B4B',
      accentColor: '#38BDF8',
      proTip: 'Mostre o item mais desejado da atualização bem grande — quem joga PK XD reconhece na hora.'
    }
  },
  {
    id: 'update-comparacao-armaduras',
    category: 'Atualizações & Spoilers',
    format: 'Shorts',
    estimatedDuration: '30–45 seg',
    title: 'Nova Armadura vs. Armadura Clássica no PK XD: Qual Pula Mais Alto?',
    hook: 'Coloquei a nova armadura contra a favorita da comunidade — o resultado vai te surpreender!',
    scriptSteps: [
      'Mostre as duas armaduras lado a lado na linha de partida.',
      'Teste salto em altura, velocidade em linha reta e desempenho no Crazy Run.',
      'Declare a vencedora no placar final e pergunte qual a favorita de quem assistiu.'
    ],
    viralReason: 'Batalhas "X vs Y" geram debate imediato nos comentários e têm excelente taxa de conclusão.',
    hashtags: ['#PKXD', '#ArmaduraPKXD', '#PKXDShorts', '#ComparacaoPKXD', '#Shorts'],
    thumbnail: {
      headlineText: 'QUAL É MELHOR?',
      focalBadge: 'VS',
      visualScene: 'Duelo dividido ao meio com um "VS" elétrico dourado separando as duas armaduras.',
      expressionAndPose: 'Duas capturas do avatar em poses opostas encarando o centro.',
      primaryColor: '#3B0764',
      accentColor: '#F9C826',
      proTip: 'Use cores opostas em cada metade do fundo (ex: roxo de um lado, ciano do outro) para destacar o duelo.'
    }
  },

  // === DESAFIOS & MINI-GAMES ===
  {
    id: 'challenge-so-uma-cor-long',
    category: 'Desafios & Mini-Games',
    format: 'Vídeo Longo (+5 min)',
    estimatedDuration: '6–9 min',
    title: 'Desafio da COR ÚNICA no PK XD: Look, Casa e Pet Tudo da Mesma Cor!',
    hook: 'Girei a roleta de cores e agora preciso montar meu avatar, minha casa e meu pet só nessa cor!',
    scriptSteps: [
      'Sorteie a cor logo nos primeiros 15 segundos para já prender a atenção.',
      'Monte o visual completo do avatar sem poder usar nenhum acessório fora da paleta.',
      'Decore um cômodo inteiro seguindo a mesma regra e escolha um pet combinando.',
      'Entre na Praça para ver a reação de outros jogadores e peça a próxima cor nos comentários.'
    ],
    viralReason: 'Desafios visuais com cores são extremamente clicáveis na thumbnail e fáceis de transformar em série.',
    hashtags: ['#PKXD', '#DesafioDasCores', '#PKXDBrasil', '#DesafioPKXD', '#PKXDCreator'],
    thumbnail: {
      headlineText: 'SÓ UMA COR!',
      focalBadge: 'DESAFIO',
      visualScene: 'Personagem, pet e móveis totalmente monocromáticos em neon vibrante contrastando com fundo escuro.',
      expressionAndPose: 'Avatar segurando o pet no colo com sorriso divertido e olhando para a câmera.',
      primaryColor: '#701A75',
      accentColor: '#F472B6',
      proTip: 'Sature bem a cor escolhida do desafio para a thumbnail saltar no feed do YouTube.'
    }
  },
  {
    id: 'challenge-crazy-run-olhos-fechados',
    category: 'Desafios & Mini-Games',
    format: 'Shorts',
    estimatedDuration: '25–40 seg',
    title: 'Tentei Vencer o Crazy Run SEM Pular nos Blocos Verdes!',
    hook: 'Se eu encostar em qualquer bloco verde no Crazy Run, o vídeo acaba na hora!',
    scriptSteps: [
      'Mostre a regra na tela em texto grande logo no segundo 1.',
      'Passe pelos 3 obstáculos mais tensos com efeitos sonoros de suspense nos quase-erros.',
      'Termine com uma vitória épica ou uma queda engraçada pedindo o próximo desafio.'
    ],
    viralReason: 'Regras simples de entender em 2 segundos ("se tocar, perde") funcionam muito bem no algoritmo de Shorts.',
    hashtags: ['#PKXD', '#CrazyRun', '#DesafioPKXD', '#PKXDShorts', '#Shorts'],
    thumbnail: {
      headlineText: 'NÃO PODE TOCAR!',
      focalBadge: 'IMPOSSÍVEL?',
      visualScene: 'Avatar saltando no limite por cima de uma plataforma verde brilhante no Crazy Run.',
      expressionAndPose: 'Personagem no ar em pose dramática quase caindo da pista.',
      primaryColor: '#064E3B',
      accentColor: '#FACC15',
      proTip: 'Destaque o obstáculo proibido com um contorno neon brilhante para explicar o desafio sem precisar ler.'
    }
  },
  {
    id: 'challenge-esconde-esconde-long',
    category: 'Desafios & Mini-Games',
    format: 'Vídeo Longo (+5 min)',
    estimatedDuration: '8–11 min',
    title: 'Esconde-Esconde Extremo no PK XD: Os 7 Esconderijos Mais Impossíveis!',
    hook: 'Meus amigos tiveram 5 minutos para me achar no PK XD — duvido você descobrir o esconderijo número 7!',
    scriptSteps: [
      'Mostre a contagem regressiva e escolha o primeiro esconderijo fora do óbvio.',
      'Mostre os amigos passando bem perto enquanto você narra a tensão.',
      'Teste esconderijos criativos usando tamanho reduzido, arbustos, telhados e decorações.',
      'Faça o ranking final dos melhores esconderijos para o pessoal usar com amigos.'
    ],
    viralReason: 'Esconde-esconde com amigos tem humor espontâneo, tensão constante e excelente retenção em vídeos longos.',
    hashtags: ['#PKXD', '#EscondeEsconde', '#AmigosPKXD', '#PKXDBrasil', '#GameplayPKXD'],
    thumbnail: {
      headlineText: 'NINGUÉM ACHOU!',
      focalBadge: 'ESCONDERIJO',
      visualScene: 'Avatar camuflado espiando atrás de um objeto do mapa enquanto outro jogador passa procurando com lupa.',
      expressionAndPose: 'Avatar fazendo sinal de silêncio ("shhh") com sorriso travesso.',
      primaryColor: '#1E3A8A',
      accentColor: '#F9C826',
      proTip: 'Crie contraste entre quem se esconde (perto da câmera) e quem procura (ao fundo) para dar profundidade.'
    }
  },

  // === SEGREDOS (ADMIN & NIMDA) ===
  {
    id: 'lore-teoria-admin-nimda-long',
    category: 'Segredos (Admin & Nimda)',
    format: 'Vídeo Longo (+5 min)',
    estimatedDuration: '6–10 min',
    title: 'A Verdadeira História do Admin e da Nimda no PK XD (Todas as Pistas!)',
    hook: 'Você sabia que existem pistas escondidas pelo mapa do PK XD ligando o Admin à Nimda desde as primeiras atualizações?',
    scriptSteps: [
      'Comece apresentando o maior mistério em aberto entre Admin e Nimda.',
      'Visite os pontos do mapa com símbolos, placas ou eventos antigos e conecte a linha do tempo.',
      'Apresente 2 teorias fortes sobre o que pode acontecer nas próximas atualizações.',
      'Convide os fãs de lore a deixarem suas próprias teorias nos comentários.'
    ],
    viralReason: 'A lore do PK XD (Admin vs Nimda) tem uma base super fiel que comenta muito e compartilha teorias.',
    hashtags: ['#PKXD', '#AdminPKXD', '#NimdaPKXD', '#TeoriaPKXD', '#SegredosPKXD'],
    thumbnail: {
      headlineText: 'O SEGREDO REAL!',
      focalBadge: 'LORE',
      visualScene: 'Fundo misterioso dividido entre a energia azul/dourada do Admin e o glitch roxo/magenta da Nimda.',
      expressionAndPose: 'Silhueta dos dois personagens frente a frente com efeito glitch central.',
      primaryColor: '#1E0536',
      accentColor: '#E879F9',
      proTip: 'Adicione um leve efeito glitch nas bordas do texto para reforçar o clima de mistério da Nimda.'
    }
  },
  {
    id: 'lore-lugares-secretos-short',
    category: 'Segredos (Admin & Nimda)',
    format: 'Shorts',
    estimatedDuration: '25–40 seg',
    title: '3 Lugares Secretos no Mapa do PK XD que Só Jogadores Antigos Lembram!',
    hook: 'Se você lembra do lugar número 3, pode se considerar veterano raiz do PK XD!',
    scriptSteps: [
      'Mostre o lugar 1 com corte rápido e diga o que tinha lá.',
      'Mostre o lugar 2 e um detalhe curioso que mudou com o tempo.',
      'Revele o lugar 3 com nostalgia e pergunte em que ano a pessoa começou a jogar.'
    ],
    viralReason: 'Nostalgia dispara comentários ("Eu jogo desde 2020!"), sinalizando alto engajamento para o YouTube.',
    hashtags: ['#PKXD', '#NostalgiaPKXD', '#SegredosPKXD', '#PKXDShorts', '#Shorts'],
    thumbnail: {
      headlineText: 'SÓ VETERANOS!',
      focalBadge: 'NOSTALGIA',
      visualScene: 'Mapa do PK XD com brilho dourado em pontos icônicos antigos e um relógio estilizado.',
      expressionAndPose: 'Avatar clássico olhando para o horizonte da ilha com expressão nostálgica.',
      primaryColor: '#312E81',
      accentColor: '#FDE047',
      proTip: 'Textos que desafiam a memória ("SÓ VETERANOS") aumentam cliques de jogadores antigos e curiosos.'
    }
  },

  // === GANHAR INSCRITOS RÁPIDO ===
  {
    id: 'subs-respondendo-inscritos-short',
    category: 'Ganhar Inscritos Rápido',
    format: 'Shorts',
    estimatedDuration: '25–45 seg',
    title: 'Fiz o Desafio Maluco que Meu Inscrito Comentou no PK XD!',
    hook: 'Um inscrito duvidou que eu conseguia fazer isso no PK XD — então bora provar agora!',
    scriptSteps: [
      'Mostre o print do comentário do inscrito na tela nos primeiros 3 segundos.',
      'Execute o desafio pedido no jogo de forma rápida e divertida.',
      'No final, diga: "Se inscreve e comenta o próximo desafio que eu escolho um amanhã!"'
    ],
    viralReason: 'Dá um motivo real e imediato para o espectador se inscrever e comentar buscando aparecer no próximo vídeo.',
    hashtags: ['#PKXD', '#InscritosPKXD', '#DesafioPKXD', '#PKXDShorts', '#Shorts'],
    thumbnail: {
      headlineText: 'ELE DUVIDOU!',
      focalBadge: 'INSCRITO',
      visualScene: 'Balão de comentário do YouTube grande no topo com o avatar cumprindo o desafio logo abaixo.',
      expressionAndPose: 'Avatar apontando para o comentário com expressão empolgada.',
      primaryColor: '#4C1D95',
      accentColor: '#34D399',
      proTip: 'Coloque um balão de comentário estilizado na thumb — esse elemento visual gera muita curiosidade.'
    }
  },
  {
    id: 'subs-top-5-dicas-pro-long',
    category: 'Ganhar Inscritos Rápido',
    format: 'Vídeo Longo (+5 min)',
    estimatedDuration: '6–8 min',
    title: '7 Truques de Jogador Pro no PK XD que Mudam Completamente Sua Gameplay!',
    hook: 'Depois que aprendi esses 7 truques simples, jogar PK XD ficou muito mais divertido e rápido!',
    scriptSteps: [
      'Abra entregando o truque #1 logo nos primeiros 20 segundos (sem enrolação).',
      'Intercale dicas de movimentação, decoração inteligente e economia de moedas/gemas.',
      'Mostre na tela a diferença antes e depois de aplicar cada dica.',
      'Convide para se inscrever no canal para receber toda semana guias atualizados de PK XD.'
    ],
    viralReason: 'Quem descobre dicas úteis que realmente funcionam tende a se inscrever imediatamente para não perder as próximas.',
    hashtags: ['#PKXD', '#DicasPKXD', '#TruquesPKXD', '#PKXDBrasil', '#PKXDCreator'],
    thumbnail: {
      headlineText: '7 TRUQUES PRO!',
      focalBadge: 'NÍVEL MAX',
      visualScene: 'Avatar com equipamento de destaque no centro cercado por ícones de estrela e setas brilhantes.',
      expressionAndPose: 'Avatar em pose confiante com óculos estiloso e sorriso de quem domina o jogo.',
      primaryColor: '#2D0859',
      accentColor: '#F9C826',
      proTip: 'Números ímpares (3, 5, 7) funcionam muito bem no título e na thumbnail por transmitirem conteúdo direto.'
    }
  }
];

function cleanTopicLabel(rawTopic: string): string {
  return rawTopic.trim().replace(/\s+/g, ' ').slice(0, 60);
}

function buildCustomTopicIdeas(topic: string, format: 'mixed' | 'shorts' | 'long_video'): VideoIdeaBlueprint[] {
  const clean = cleanTopicLabel(topic);
  const shortHeadline = clean
    .split(' ')
    .slice(0, 3)
    .join(' ')
    .toUpperCase();

  const tagSlug = clean
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 18);

  const customTag = tagSlug ? `#${tagSlug}` : '#PKXDNovidade';

  const shortIdeas: VideoIdeaBlueprint[] = [
    {
      id: `custom-short-1-${tagSlug}`,
      category: 'Tema Personalizado',
      format: 'Shorts',
      estimatedDuration: '25–45 seg',
      title: `Testei "${clean}" no PK XD e Olha o Que Aconteceu!`,
      hook: `Muita gente pediu para eu testar ${clean} no PK XD — mas eu não esperava esse detalhe no final!`,
      scriptSteps: [
        `Mostre "${clean}" em destaque nos primeiros 2 segundos sem introdução demorada.`,
        'Faça um teste rápido destacando o detalhe mais curioso ou secreto.',
        `Finalize perguntando nos comentários se a galera aprova "${clean}" de 0 a 10.`
      ],
      viralReason: 'Vai direto ao tema que o público já está procurando, com gancho de curiosidade nos primeiros 3 segundos.',
      hashtags: ['#PKXD', '#PKXDShorts', customTag, '#PKXDBrasil', '#Shorts'],
      thumbnail: {
        headlineText: shortHeadline || 'TESTEI AGORA!',
        focalBadge: 'NOVIDADE',
        visualScene: `Close bem nítido no elemento principal de "${clean}" dentro do PK XD com fundo desfocado e brilho atrás.`,
        expressionAndPose: 'Avatar em primeiro plano reagindo com surpresa e apontando direto para o destaque.',
        primaryColor: '#4E1B96',
        accentColor: '#F9C826',
        proTip: 'Deixe apenas 1 elemento principal + seu avatar para a thumb ficar limpa e legível no celular.'
      }
    },
    {
      id: `custom-short-2-${tagSlug}`,
      category: 'Tema Personalizado',
      format: 'Shorts',
      estimatedDuration: '30–45 seg',
      title: `3 Segredos Sobre "${clean}" no PK XD que Quase Ninguém Reparou!`,
      hook: `Você achava que já sabia tudo sobre ${clean}? Espera só até ver o segredo número 3!`,
      scriptSteps: [
        'Segredo 1 (6s): mostre um detalhe visual ou combinação pouco conhecida.',
        'Segredo 2 (10s): dê uma dica prática para aproveitar melhor sem gastar à toa.',
        'Segredo 3 (12s): entregue a maior surpresa e peça para salvar o Short.'
      ],
      viralReason: 'Estrutura em 3 pontos mantém ritmo acelerado e aumenta muito a chance de replay completo.',
      hashtags: ['#PKXD', '#SegredosPKXD', customTag, '#PKXDShorts', '#Shorts'],
      thumbnail: {
        headlineText: '3 SEGREDOS!',
        focalBadge: 'VOCÊ VIU?',
        visualScene: `Cena de "${clean}" no PK XD com lupa ampliando um detalhe escondido e seta luminosa.`,
        expressionAndPose: 'Avatar com expressão investigativa/curiosa ao lado da lupa.',
        primaryColor: '#230647',
        accentColor: '#FF3B9A',
        proTip: 'Use seta amarela ou ciano com borda preta grossa para guiar o olhar na hora.'
      }
    }
  ];

  const longIdeas: VideoIdeaBlueprint[] = [
    {
      id: `custom-long-1-${tagSlug}`,
      category: 'Tema Personalizado',
      format: 'Vídeo Longo (+5 min)',
      estimatedDuration: '7–10 min',
      title: `TUDO Sobre "${clean}" no PK XD: Testei na Prática! (Vale a Pena?)`,
      hook: `Antes de gastar moedas ou gemas com ${clean} no PK XD, vem conferir meu teste completo com todos os detalhes!`,
      scriptSteps: [
        `Mostre o melhor momento de "${clean}" logo na abertura em 10 segundos.`,
        'Explore todas as possibilidades, combinações e interações dentro do mapa ou casa.',
        'Compare custo-benefício com outras opções famosas do PK XD.',
        'Feche com nota final de 0 a 10 e pergunte qual será o próximo tema do canal.'
      ],
      viralReason: 'Vídeos completos de análise e teste prático superam facilmente 5 minutos e atraem buscas orgânicas no YouTube.',
      hashtags: ['#PKXD', customTag, '#PKXDBrasil', '#PKXDCreator', '#GameplayPKXD'],
      thumbnail: {
        headlineText: 'VALE A PENA?',
        focalBadge: 'ANÁLISE',
        visualScene: `Destaque central de "${clean}" no PK XD com ícones de moedas/gemas e contraste forte no fundo.`,
        expressionAndPose: 'Avatar sorrindo em pose confiante ao lado do destaque principal.',
        primaryColor: '#1E1B4B',
        accentColor: '#22D3EE',
        proTip: 'Mantenha o texto no lado oposto ao avatar com sombra escura bem marcada para leitura instantânea.'
      }
    },
    {
      id: `custom-long-2-${tagSlug}`,
      category: 'Tema Personalizado',
      format: 'Vídeo Longo (+5 min)',
      estimatedDuration: '8–11 min',
      title: `Desafio Extremo com "${clean}" no PK XD (Será que Eu Consigo?)`,
      hook: `Criei um desafio quase impossível usando "${clean}" no PK XD — se eu falhar, pago mico na Praça!`,
      scriptSteps: [
        'Explique a meta do desafio em menos de 20 segundos.',
        'Divida o vídeo em 3 fases de dificuldade crescente para manter o ritmo.',
        'Inclua reações reais nos momentos de quase derrota para prender a atenção.',
        'Mostre o resultado final e desafie os inscritos a tentarem também.'
      ],
      viralReason: 'Misturar um tema popular com desafio dá história começo-meio-fim e segura a audiência até o minuto final.',
      hashtags: ['#PKXD', '#DesafioPKXD', customTag, '#PKXDBrasil', '#PKXDCreator'],
      thumbnail: {
        headlineText: 'CONSEGUI?!',
        focalBadge: 'DESAFIO',
        visualScene: `Momento mais tenso do desafio envolvendo "${clean}" com efeitos de brilho e exclamação.`,
        expressionAndPose: 'Avatar com expressão dramática/divertida no canto direito.',
        primaryColor: '#4C1D95',
        accentColor: '#FACC15',
        proTip: 'Mostre emoção clara no rosto do avatar — expressões fortes aumentam a taxa de clique (CTR).'
      }
    }
  ];

  if (format === 'shorts') return shortIdeas;
  if (format === 'long_video') return longIdeas;
  return [shortIdeas[0], longIdeas[0], shortIdeas[1], longIdeas[1]];
}

export function buildChannelStrategyDiagnosis(
  channelData: ChannelMetrics | null,
  analysis: AnalysisSummary | null,
  creatorFormat: CreatorFormat,
  selectedTier: ProgramTier
): string {
  const tierName = selectedTier === 'rising_star' ? 'Tier 2: Rising Star' : 'Tier 1: Stardust';

  if (!channelData || !analysis) {
    return 'Combine Shorts rápidos de 25 a 45 segundos (focados em retenção e replay) com vídeos longos acima de 5 minutos para construir audiência fiel e acelerar sua aprovação no Programa de Creators PK XD.';
  }

  if (analysis.isAllRequiredMet) {
    return `Parabéns, ${channelData.title}! Você já bateu 100% dos critérios do ${tierName}. O melhor foco agora é manter consistência semanal e testar formatos de série com seus inscritos para escalar ainda mais suas views.`;
  }

  const viewsLast16Shorts = channelData.viewsLast16Shorts ?? channelData.views3MonthsEstimated ?? 0;
  const subReq = analysis.evaluatedRequirements.find((r) => r.requirement.metricType === 'subscribers');
  const viewsReq = analysis.evaluatedRequirements.find((r) => r.requirement.metricType === 'views_3months');
  const freqReq = analysis.evaluatedRequirements.find((r) => r.requirement.metricType === 'monthly_frequency');

  if (viewsReq && !viewsReq.isMet) {
    const missingViews = Math.max(0, viewsReq.targetValue - viewsLast16Shorts);
    return `Prioridade para ${channelData.handle || channelData.title}: faltam ${missingViews.toLocaleString('pt-BR')} views nos últimos 16 Shorts para bater a meta de 10.000. Aposte em Shorts curtos (25–40s) com gancho forte nos 3 primeiros segundos e temas de caixas secretas, transformações e spoilers.`;
  }

  if (subReq && !subReq.isMet) {
    const missingSubs = Math.max(0, subReq.targetValue - (channelData.subscriberCount || 0));
    return `Prioridade para ${channelData.handle || channelData.title}: faltam ${missingSubs.toLocaleString('pt-BR')} inscritos para o ${tierName}. Crie séries com participação dos inscritos (avaliando casas ou cumprindo desafios dos comentários) e faça chamadas diretas para inscrição.`;
  }

  if (freqReq && !freqReq.isMet) {
    const currentFreq = typeof freqReq.currentValue === 'number' ? freqReq.currentValue : 0;
    const needed = Math.max(1, freqReq.targetValue - currentFreq);
    return `Seu canal já está bem encaminhado no ${tierName}! Faltam ${needed} publicações no ritmo dos últimos 30 dias (${creatorFormat === 'shorts' ? 'Shorts' : 'Vídeos Longos +5 min'}). Escolha 4 ideias abaixo para montar seu calendário das próximas semanas.`;
  }

  return `Você já completou ${analysis.overallPercentage}% do ${tierName} (${analysis.metCount}/${analysis.totalCount} critérios). Use os roteiros e thumbnails abaixo para manter constância e fechar os requisitos restantes mais rápido.`;
}

export function generateLocalCreatorIdeas(params: {
  categoryLabel: string;
  format: 'mixed' | 'shorts' | 'long_video';
  customTopic: string;
  seed: number;
  channelData: ChannelMetrics | null;
  analysis: AnalysisSummary | null;
  creatorFormat: CreatorFormat;
  selectedTier: ProgramTier;
}): { channelDiagnosis: string; ideas: VideoIdeaBlueprint[] } {
  const { categoryLabel, format, customTopic, seed, channelData, analysis, creatorFormat, selectedTier } = params;

  const channelDiagnosis = buildChannelStrategyDiagnosis(channelData, analysis, creatorFormat, selectedTier);
  const cleanTopic = customTopic.trim();

  // Filter base pool by requested format
  const formatFilter = (item: VideoIdeaBlueprint) => {
    if (format === 'shorts') return item.format === 'Shorts';
    if (format === 'long_video') return item.format === 'Vídeo Longo (+5 min)';
    return true;
  };

  // Prioritize ideas matching selected category, then fill from remaining pool
  const exactCategory = PKXD_IDEAS_BANK.filter((i) => i.category === categoryLabel && formatFilter(i));
  const otherCategory = PKXD_IDEAS_BANK.filter((i) => i.category !== categoryLabel && formatFilter(i));

  const rotate = <T,>(arr: T[], offset: number): T[] => {
    if (arr.length <= 1) return arr;
    const shift = ((offset % arr.length) + arr.length) % arr.length;
    return [...arr.slice(shift), ...arr.slice(0, shift)];
  };

  let picked: VideoIdeaBlueprint[] = [];

  if (cleanTopic) {
    const customIdeas = buildCustomTopicIdeas(cleanTopic, format);
    picked.push(...customIdeas);
  }

  const rotatedPrimary = rotate(exactCategory, seed);
  const rotatedSecondary = rotate(otherCategory, seed * 2);

  for (const candidate of [...rotatedPrimary, ...rotatedSecondary]) {
    if (picked.length >= 4) break;
    if (!picked.some((p) => p.id === candidate.id)) {
      picked.push(candidate);
    }
  }

  // If mixed mode and no custom topic, ensure a nice balance of Shorts and Long Videos when possible
  if (format === 'mixed' && !cleanTopic && picked.length === 4) {
    const hasShort = picked.some((i) => i.format === 'Shorts');
    const hasLong = picked.some((i) => i.format === 'Vídeo Longo (+5 min)');
    if (!hasShort) {
      const replacement = rotate(PKXD_IDEAS_BANK.filter((i) => i.format === 'Shorts'), seed)[0];
      if (replacement) picked[3] = replacement;
    } else if (!hasLong) {
      const replacement = rotate(PKXD_IDEAS_BANK.filter((i) => i.format === 'Vídeo Longo (+5 min)'), seed)[0];
      if (replacement) picked[3] = replacement;
    }
  }

  return {
    channelDiagnosis,
    ideas: picked.slice(0, 4)
  };
}

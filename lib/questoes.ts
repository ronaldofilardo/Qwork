// Dados dos grupos de avaliação COPSOQ III + JZ + EF

export interface QuestionCondition {
  questionId: string // ID da questão que determina a condição
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne' // Operador de comparação
  value: number // Valor para comparação
}

export interface QuestionItem {
  id: string
  texto: string
  textoGestao?: string // Texto específico para gestão
  invertida?: boolean // Para cálculo de score (alguns itens são negativos)
  condition?: QuestionCondition // Condição para exibir a questão
  category?: 'behavioral' | 'financial' | 'health' | 'core' // Categoria da questão
}

export interface GrupoAvaliacao {
  id: number
  titulo: string
  dominio: string
  descricao: string
  itens: QuestionItem[]
  tipo: 'positiva' | 'negativa'
}

export const grupos: GrupoAvaliacao[] = [
  {
    id: 1,
    titulo: 'Grupo 1 - Demandas no Trabalho',
    dominio: 'Demandas no Trabalho',
    descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
    tipo: 'negativa',
    itens: [
      { id: 'Q1', texto: 'Com que frequência você tem muito serviço pra fazer?', textoGestao: 'Com que frequência você tem um volume elevado de trabalho?' },
      { id: 'Q2', texto: 'Com que frequência você não dá conta de terminar tudo que precisa fazer?', textoGestao: 'Com que frequência você não consegue completar todas as suas tarefas?' },
      { id: 'Q3', texto: 'Com que frequência você precisa trabalhar correndo?', textoGestao: 'Com que frequência você precisa trabalhar em ritmo acelerado?' },
      { id: 'Q9', texto: 'Com que frequência o trabalho te deixa com o corpo moído/cansado?', textoGestao: 'Com que frequência seu trabalho te deixa fisicamente exaurido?' },
    ]
  },
  {
    id: 2,
    titulo: 'Grupo 2 - Organização e Conteúdo',
    dominio: 'Organização e Conteúdo do Trabalho',
    descricao: 'Influência, desenvolvimento de habilidades e significado do trabalho',
    tipo: 'positiva',
    itens: [
      { id: 'Q13', texto: 'Você consegue decidir o que faz no trabalho?', textoGestao: 'Você pode influenciar as atividades que realiza no trabalho?' },
      { id: 'Q17', texto: 'Você tem chance de aprender coisas novas e crescer no trabalho?', textoGestao: 'Você tem oportunidades de desenvolvimento pessoal no trabalho?' },
      { id: 'Q18', texto: 'Você acha que o seu trabalho tem sentido/faz diferença?', textoGestao: 'Você considera seu trabalho significativo?' },
      { id: 'Q19', texto: 'Você sente que o que você faz é importante?', textoGestao: 'Você sente que o trabalho que realiza é importante?' },
    ]
  },
  {
    id: 3,
    titulo: 'Grupo 3 - Relações Interpessoais',
    dominio: 'Relações Sociais e Liderança',
    descricao: 'Apoio social, feedback e reconhecimento no trabalho',
    tipo: 'positiva',
    itens: [
      { id: 'Q20', texto: 'Com que frequência os colegas te ajudam e te dão apoio?', textoGestao: 'Com que frequência você recebe ajuda e suporte dos colegas?' },
      { id: 'Q21', texto: 'Com que frequência os colegas param pra te ouvir quando você tem problema no trabalho?', textoGestao: 'Com que frequência seus colegas estão dispostos a ouvir seus problemas relacionados ao trabalho?' },
      { id: 'Q23', texto: 'Seu chefe direto se preocupa se você está satisfeito no trabalho?', textoGestao: 'Seu superior imediato prioriza a satisfação no trabalho?' },
      { id: 'Q25', texto: 'Seu chefe direto é bom em resolver briga/discussão no time?', textoGestao: 'Seu superior imediato é bom em resolver conflitos?' },
      { id: 'Q26', texto: 'Você recebe reconhecimento quando se esforça no trabalho?', textoGestao: 'Você recebe reconhecimento pelo esforço realizado no trabalho?' },
      { id: 'Q28', texto: 'Seu trabalho é respeitado pelos colegas e chefes?', textoGestao: 'Seu trabalho é valorizado por colegas e superiores?' },
    ]
  },
  {
    id: 4,
    titulo: 'Grupo 4 - Interface Trabalho-Indivíduo',
    dominio: 'Interface Trabalho-Indivíduo',
    descricao: 'Insegurança no trabalho e conflito trabalho-família',
    tipo: 'negativa',
    itens: [
      { id: 'Q31', texto: 'Você tem medo de ser transferido pra outro lugar sem querer?', textoGestao: 'Você está preocupado com a possibilidade de transferência contra sua vontade?' },
      { id: 'Q32', texto: 'Depois do trabalho, você ainda tem energia pra ficar com família e amigos?', textoGestao: 'Você tem energia suficiente para família e amigos no tempo livre?', invertida: true },
      { id: 'Q33', texto: 'O trabalho toma o tempo que você queria passar com família e amigos?', textoGestao: 'Seu trabalho consome tempo que gostaria de dedicar à família e amigos?' },
      { id: 'Q34', texto: 'Você acha que o trabalho está atrapalhando sua vida pessoal?', textoGestao: 'Você sente que seu trabalho prejudica sua vida privada?' },
    ]
  },
  {
    id: 5,
    titulo: 'Grupo 5 - Valores no Trabalho',
    dominio: 'Valores Organizacionais',
    descricao: 'Confiança, justiça e respeito mútuo na organização',
    tipo: 'positiva',
    itens: [
      { id: 'Q35', texto: 'Os funcionários escondem coisas uns dos outros?', textoGestao: 'Os colaboradores ocultam informações entre si?', invertida: true },
      { id: 'Q38', texto: 'Os funcionários confiam nas informações que vêm da chefia?', textoGestao: 'Os colaboradores confiam nas informações fornecidas pela gestão?' },
      { id: 'Q41', texto: 'Quem faz um bom trabalho é valorizado?', textoGestao: 'Os colaboradores são reconhecidos quando realizam um bom trabalho?' },
    ]
  },
  {
    id: 6,
    titulo: 'Grupo 6 - Personalidade (Opcional)',
    dominio: 'Traços de Personalidade',
    descricao: 'Autoeficácia e autoconfiança',
    tipo: 'positiva',
    itens: [
      { id: 'Q43', texto: 'Eu sempre consigo resolver problemas difíceis se eu me esforçar bastante', textoGestao: 'Eu consigo resolver problemas difíceis se eu me esforçar o suficiente' },
      { id: 'Q45', texto: 'É fácil pra mim continuar firme nas minhas metas e conseguir alcançá-las', textoGestao: 'É fácil para mim manter o foco nas metas e atingir meus objetivos' },
    ]
  },
  {
    id: 7,
    titulo: 'Grupo 7 - Saúde e Bem-Estar',
    dominio: 'Saúde e Bem-Estar',
    descricao: 'Avaliação de estresse, burnout e sintomas somáticos',
    tipo: 'negativa',
    itens: [
      { id: 'Q48', texto: 'Com que frequência você se sentiu estressado?', textoGestao: 'Com que frequência você se sentiu estressado?' },
      { id: 'Q52', texto: 'Com que frequência você teve problema pra dormir?', textoGestao: 'Com que frequência você apresentou dificuldades para dormir?' },
      { id: 'Q55', texto: 'Com que frequência você sentiu que não aguenta mais?', textoGestao: 'Com que frequência você sentiu que não consegue continuar?' },
    ]
  },
  {
    id: 8,
    titulo: 'Grupo 8 - Comportamentos Ofensivos',
    dominio: 'Comportamentos Ofensivos',
    descricao: 'Exposição a assédio e violência no trabalho',
    tipo: 'negativa',
    itens: [
      { id: 'Q56', texto: 'Você sofreu assédio sexual no trabalho?', textoGestao: 'Você foi submetido a assédio sexual no ambiente de trabalho?' },
      { id: 'Q57', texto: 'Você sofreu ameaças de violência no trabalho?', textoGestao: 'Você foi submetido a ameaças de violência no trabalho?' },
      { id: 'Q58', texto: 'Você sofreu violência física no trabalho?', textoGestao: 'Você foi vítima de violência física no trabalho?' },
    ]
  },
  {
    id: 9,
    titulo: 'Grupo 9 - Jogos de Apostas',
    dominio: 'Comportamento de Jogo',
    descricao: 'Avaliação de comportamentos relacionados a Jogos de Apostas',
    tipo: 'negativa',
    itens: [
      { id: 'Q59', texto: 'Você fez apostas em Jogos de Apostas (bet, loteria, jogo do bicho, cassino online etc.)?', textoGestao: 'Você realizou apostas em Jogos de Apostas (ex.: apostas esportivas, loterias, jogo do bicho, cassinos online)?' },
      { id: 'Q61', texto: 'Mesmo perdendo dinheiro, você continuou apostando?', textoGestao: 'Você persistiu nas apostas mesmo após perdas financeiras?' },
      { id: 'Q62', texto: 'Pensar em apostas atrapalhou seu rendimento no trabalho?', textoGestao: 'Os pensamentos sobre apostas prejudicaram seu desempenho profissional?' },
      { id: 'Q64', texto: 'Você usou o celular ou horário de trabalho pra fazer apostas?', textoGestao: 'Você utilizou tempo de trabalho (celular, intervalos) para realizar apostas?' },
    ]
  },
  {
    id: 10,
    titulo: 'Grupo 10 - Endividamento',
    dominio: 'Endividamento Financeiro',
    descricao: 'Avaliação do nível de endividamento e estresse financeiro',
    tipo: 'negativa',
    itens: [
      { id: 'Q65', texto: 'Você ficou preocupado com dívidas ou contas pra pagar?', textoGestao: 'Você se sentiu preocupado com dívidas ou pagamento de contas?' },
      { id: 'Q66', texto: 'O estresse com dívidas atrapalhou sua concentração no trabalho?', textoGestao: 'O estresse financeiro afetou sua concentração no trabalho?' },
      { id: 'Q68', texto: 'Você precisou pegar empréstimo (banco, agiota ou familiar) pra pagar as contas?', textoGestao: 'Você precisou contrair empréstimos (bancário, agiota ou familiar) para cobrir despesas?' },
      { id: 'Q70', texto: 'Você sente que suas dívidas estão fora de controle?', textoGestao: 'Você sente que seu nível de endividamento está fora de controle?' },
    ]
  },
]

export const escalasResposta = {
  'Nunca': 0,
  'Raramente': 25,
  'Às vezes': 50,
  'Muitas vezes': 75,
  'Sempre': 100,
}

export type RespostaValor = keyof typeof escalasResposta

// Função para obter texto da questão baseado no nível do funcionário
export function getTextoQuestao(item: QuestionItem, nivelCargo: 'operacional' | 'gestao'): string {
  if (nivelCargo === 'gestao' && item.textoGestao) {
    return item.textoGestao
  }
  return item.texto
}

// Função para obter todas as questões com diferenciação por nível
export function getQuestoesPorNivel(nivelCargo: 'operacional' | 'gestao') {
  return grupos.map(grupo => ({
    ...grupo,
    itens: grupo.itens.map(item => ({
      ...item,
      texto: getTextoQuestao(item, nivelCargo)
    }))
  }))
}

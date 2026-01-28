// Dados do relatório completo para cada grupo COPSOQ III
export interface RelatorioGrupo {
  id: number
  nome: string
  explicacao: string
  gestao: string
  baixo: string
  medio: string
  alto: string
}

export const dadosRelatorio: RelatorioGrupo[] = [
  {
    id: 1,
    nome: "Demandas do Trabalho",
    explicacao: "São exigências do dia a dia que podem sobrecarregar você física ou mentalmente. Exemplos: • Trabalhar muito rápido ou com prazos apertados • Lembrar de muitas coisas ao mesmo tempo • Lidar com situações emocionalmente difíceis ou pessoas agressivas • Esconder sentimentos para atender regras",
    gestao: "Dicas práticas que valorizam seu papel na empresa: • Priorize 3 tarefas por dia – foque no que realmente gera resultado para o time. • Faça pausas de 5 min a cada 90 min – volta mais focado e produz mais no fim do dia. • Use a caixa de sugestões – sua ideia pode melhorar o fluxo de todos. • Treinamento interno gratuito: Gestão de Tempo (próximo: [DATA]). Seu ritmo é essencial para o sucesso da equipe – você faz a diferença.",
    baixo: "Excelente. Você já gerencia bem as demandas e entrega com qualidade. Continue assim: • Mantenha a priorização diária – isso inspira o time. • Compartilhe sua técnica com colegas (opcional). • Avise se houver aumento de carga – sua percepção é valiosa.",
    medio: "Boa oportunidade. Você enfrenta picos de demanda que podem afetar seu ritmo ideal. Ações simples para produzir mais e melhor: • Registre picos no quadro da equipe (5 min/dia). • Converse com seu líder sobre priorização – juntos otimizam o fluxo. • Use pausas ativas (10 min a cada 2h) – mantém sua energia alta. • Refaça o COPSOQ em 3 meses – acompanhe seu progresso.",
    alto: "Vamos ajustar juntos. Você está sob demanda muito alta – isso impacta sua produtividade e bem-estar. Ações práticas para você entregar mais com menos esforço: • Abra protocolo no SESMT/RH hoje (link: [INSIRA]) – é rápido e anônimo. • Reunião com líder em 48h para priorizar tarefas essenciais. • Avaliação médica (NR-7) será agendada – prevenção é investimento. • Redução temporária de jornada pode ser aplicada (se necessário). Sua função é crítica – cuidando de você, entregamos mais para o cliente."
  },
  {
    id: 2,
    nome: "Organização e Conteúdo do Trabalho",
    explicacao: "É o quanto você decide como fazer seu trabalho e aprende coisas novas para crescer. Exemplos: • Escolher a ordem das tarefas • Ter liberdade para resolver problemas do seu jeito • Aprender habilidades que te tornam mais eficiente",
    gestao: "Dicas práticas que aumentam sua produtividade e valor na empresa: • Sugira 1 melhoria por semana na caixa de ideias – muitas viram padrão. • Compartilhe 1 aprendizado com o time (5 min na reunião). • Peça 1 tarefa nova ao líder – mostra proatividade. • Treinamento interno gratuito: Habilidades do Futuro (próximo: [DATA]). Sua iniciativa acelera o resultado de todos – você é peça-chave.",
    baixo: "Vamos crescer juntos. Você sente pouca liberdade ou aprendizado – isso limita seu potencial. Ações simples para entregar mais valor: • Liste 1 ideia de melhoria e envie à caixa de sugestões. • Peça ao líder 1 tarefa desafiadora – mostra seu interesse. • Participe do treinamento interno – gratuito e rápido. • Refaça o COPSOQ em 3 meses – acompanhe seu progresso.",
    medio: "Boa base! Você tem alguma influência e aprendizado, mas pode ir além. Ações práticas para crescer e produzir mais: • Compartilhe 1 dica útil com o time na próxima reunião. • Sugira 1 ajuste no seu fluxo ao líder (5 min). • Acesse o treinamento interno – aumenta sua eficiência. • Monitore seu avanço com o COPSOQ trimestral.",
    alto: "Parabéns! Você tem alta influência e aprendizado – isso eleva o padrão da equipe. Continue assim: • Lidere 1 micro-projeto (ex: melhorar 1 processo). • Mentore 1 colega (opcional) – fortalece o time. • Avise se precisar de mais desafios – sua visão impulsiona."
  },
  {
    id: 3,
    nome: "Relações Interpessoais e Liderança",
    explicacao: "É o apoio que você recebe de colegas e líder e como a liderança facilita seu dia. Exemplos: • Ajuda rápida quando precisa • Feedback claro sobre seu desempenho • Clima de equipe e confiança na chefia",
    gestao: "Dicas práticas que aceleram resultados e fortalecem o time: • Cumprimente 1 colega por dia – melhora o clima em segundos. • Peça feedback rápido ao líder (1 frase) – ajusta seu foco. • Ofereça ajuda em 1 tarefa – cria rede de confiança. • Reunião semanal de 15 min com o time (já existe). Relacionamentos fortes = entrega mais rápida e menos erros.",
    baixo: "Vamos conectar mais. Você sente pouco apoio ou orientação clara – isso pode atrasar seu ritmo. Ações simples para ganhar velocidade: • Inicie 1 conversa curta com um colega hoje (café, corredor). • Peça 1 feedback rápido ao líder – \"O que posso melhorar?\". • Participe da próxima reunião de time – sua presença conta. • Refaça o COPSOQ em 3 meses – veja a diferença.",
    medio: "Bom caminho! Você tem algum apoio, mas pode fortalecer para entregar mais. Ações práticas para elevar o nível: • Ofereça ajuda em 1 tarefa do time esta semana. • Peça 1 feedback específico ao líder (ex: \"Como priorizar?\"). • Participe ativamente da reunião semanal – traga 1 ideia. • Monitore com o COPSOQ trimestral.",
    alto: "Excelente! Você tem relações sólidas e liderança clara – isso multiplica sua entrega. Continue assim: • Lidere 1 micro-ajuda no time (ex: ensinar atalho). • Dê feedback positivo a 1 colega – reforça o ciclo. • Avise se precisar de mais autonomia – sua visão impulsiona."
  },
  {
    id: 4,
    nome: "Interface Trabalho-Indivíduo",
    explicacao: "É o quanto o trabalho invade sua vida pessoal e a estabilidade que você sente no cargo. Exemplos: • Cancelar planos por causa do trabalho • Medo de perder o emprego ou mudanças bruscas",
    gestao: "Dicas práticas que aumentam seu foco e entrega: • Planeje 1 compromisso pessoal fixo por semana – protege sua energia. • Desligue notificações após o horário – volta mais produtivo no dia seguinte. • Atualize 1 meta de carreira com o líder – reforça sua segurança. • Reunião mensal 1:1 com o líder (já existe). Equilíbrio pessoal = cabeça limpa = mais resultados para a empresa.",
    baixo: "Parabéns! Você tem bom equilíbrio e segurança – isso mantém sua produtividade alta. Continue assim: • Mantenha 1 compromisso pessoal fixo por semana. • Compartilhe sua técnica de equilíbrio com o time (opcional). • Avise se sentir qualquer mudança.",
    medio: "Boa oportunidade. Você sente algum conflito ou insegurança que pode roubar foco. Ações simples para entregar mais com tranquilidade: • Bloqueie 1 hora pessoal na agenda (ex: academia, família). • Converse com o líder sobre 1 preocupação de segurança (5 min). • Desligue notificações após o horário – recarrega 100%. • Refaça o COPSOQ em 3 meses.",
    alto: "Vamos ajustar juntos. Você vive alto conflito ou insegurança – isso drena sua energia e entrega. Ações práticas para você render mais: • Abra protocolo no RH hoje (link: [INSIRA]) – é rápido e confidencial. • Reunião 1:1 com líder em 48h para clareza de metas e segurança. • Defina 1 limite pessoal (ex: \"não atendo após 19h\") – respeitado pela empresa. • Acompanhamento mensal será agendado. Sua função é essencial – com equilíbrio, você entrega o dobro."
  },
  {
    id: 5,
    nome: "Valores no Trabalho",
    explicacao: "É o quanto a empresa facilita seu dia com recursos, clareza e reconhecimento. Exemplos: • Ferramentas adequadas • Metas claras • Reconhecimento por resultados",
    gestao: "Dicas práticas que aumentam sua entrega e satisfação: • Registre 1 dificuldade de recurso (5 min) – envie à caixa. • Peça 1 meta clara ao líder – evita retrabalho. • Dê 1 feedback positivo ao time – reforça o ciclo. • Reunião mensal de alinhamento (já existe). Suporte claro = menos esforço = mais resultado.",
    baixo: "Vamos crescer juntos. Você sente pouco reconhecimento ou justiça – isso limita seu engajamento. Ações simples para se sentir mais valorizado: • Registre 1 contribuição sua e compartilhe com o líder. • Peça 1 feedback sobre seu trabalho – mostra seu interesse. • Participe da próxima reunião de valores – sua voz conta. • Refaça o COPSOQ em 3 meses – acompanhe seu progresso.",
    medio: "Boa base! Você tem algum reconhecimento e justiça, mas pode fortalecer. Ações práticas para se sentir mais valorizado: • Compartilhe 1 realização sua na reunião semanal. • Peça 1 feedback específico ao líder (ex: \"O que valoriza?\"). • Dê feedback positivo a 1 colega – reforça o ciclo. • Monitore com o COPSOQ trimestral.",
    alto: "Excelente! Você tem altos valores organizacionais – isso multiplica sua motivação. Continue assim: • Lidere 1 ação de reconhecimento no time. • Compartilhe seus valores com 1 colega. • Avise se precisar de mais reconhecimento."
  },
  {
    id: 6,
    nome: "Personalidade (Opcional)",
    explicacao: "É o quanto você se sente motivado e conectado com o propósito da empresa. Exemplos: • Orgulho do que faz • Alinhamento com valores da empresa • Vontade de continuar por anos",
    gestao: "Dicas práticas que aumentam sua motivação e entrega: • Escreva 1 motivo de orgulho por semana – 1 frase. • Conecte 1 tarefa diária ao propósito da equipe. • Participe de 1 ação de impacto (ex: voluntariado interno). • Reunião mensal de propósito (já existe). Propósito claro = motivação alta = entrega excepcional.",
    baixo: "Vamos reacender! Você sente pouco engajamento – isso limita seu brilho. Ações simples para render mais: • Escreva 1 motivo de orgulho esta semana. • Conecte 1 tarefa ao impacto no cliente. • Participe da próxima ação de impacto. • Refaça o COPSOQ em 3 meses.",
    medio: "Bom caminho! Você tem algum engajamento, mas pode ir além. Ações práticas para brilhar mais: • Escreva 1 motivo de orgulho por semana. • Conecte 1 tarefa ao propósito da empresa. • Participe de 1 ação de impacto. • Monitore com o COPSOQ trimestral.",
    alto: "Parabéns! Você tem alto engajamento e propósito – isso inspira o time. Continue assim: • Lidere 1 ação de impacto. • Compartilhe seu propósito com 1 colega. • Avise se precisar de mais desafios alinhados."
  },
  {
    id: 7,
    nome: "Saúde e Bem-Estar",
    explicacao: "É como você se sente fisicamente e mentalmente no dia a dia do trabalho. Exemplos: • Energia para as tarefas • Sono de qualidade • Ausência de estresse ou dores por causa do trabalho",
    gestao: "Dicas práticas que mantêm você 100% para entregar mais: • Durma 7h por noite – 1h a mais = 20% mais foco. • Alongue 2 min a cada 2h – evita dores e mantém o ritmo. • Respire fundo 3x quando sentir tensão – limpa a mente em 30 s. • Reunião de check-in semanal (já existe). Sua energia é o motor da equipe – cuide dela e produza o dobro.",
    baixo: "Excelente! Você está cheio de energia e sem sinais de desgaste – isso reflete na entrega. Continue assim: • Mantenha 7h de sono e alongamentos rápidos. • Compartilhe 1 dica de energia com o time (opcional). • Avise se sentir qualquer queda.",
    medio: "Boa oportunidade. Você sente algum cansaço ou tensão que pode reduzir seu pico de desempenho. Ações simples para voltar ao 100%: • Registre seu sono por 1 semana (app grátis). • Alongue 2 min a cada 2h – use o timer do celular. • Respire fundo 3x ao sentir pressão – técnica 4-7-8. • Refaça o COPSOQ em 3 meses.",
    alto: "Vamos recuperar sua energia. Você está com sinais claros de desgaste – isso corta sua produtividade. Ações práticas para você render mais: • Abra protocolo no SESMT hoje (link: [INSIRA]) – é rápido e anônimo. • Reunião com líder em 48h para ajuste de carga. • Durma 7h fixas – crie rotina noturna (desligar telas 30 min antes). • Alongamento diário + respiração será monitorado semanalmente. Sua função é crítica – com energia, você entrega o melhor."
  },
  {
    id: 8,
    nome: "Comportamentos Ofensivos",
    explicacao: "São ações que humilham, excluem ou ameaçam você no trabalho. Exemplos: • Comentários maliciosos ou piadas ofensivas • Exclusão de reuniões ou grupos • Retenção de informações importantes • Assédio moral ou sexual",
    gestao: "Dicas práticas que protegem sua produtividade e o clima do time: • Registre 1 fato estranho em bloco de notas (data + descrição). • Fale com 1 colega de confiança – dois olhos veem mais. • Use o canal anônimo – 2 cliques e zero risco. • Campanha mensal de respeito (já existe). Ambiente limpo = foco total = entrega máxima.",
    baixo: "Parabéns! Você não sofreu ofensas – isso mantém seu foco 100%. Continue assim: • Reforce o respeito elogiando 1 atitude positiva por semana. • Avise se notar algo estranho – previne para todos. • Participe da campanha mensal (opcional).",
    medio: "Atenção. Você sofreu ofensas leves ou esporádicas – isso rouba energia e foco. Ações simples para manter a entrega alta: • Registre 1 episódio (data + fato) no bloco. • Use o canal anônimo – resolve rápido e sem exposição. • Fale com 1 colega de confiança – apoio imediato. • Refaça o COPSOQ em 3 meses.",
    alto: "Vamos proteger você. Você sofre ofensas frequentes – isso corta sua produtividade e saúde. Ações práticas para você render 100%: • Abra protocolo no canal anônimo hoje (link: [INSIRA]). • Reunião com RH em 48h – investigação imediata. • Registre tudo (data, local, testemunhas). • Apoio psicológico interno será agendado. Sua função é vital – sem ofensas, você entrega o dobro."
  },
  {
    id: 9,
    nome: "Jogos de Apostas",
    explicacao: "É o uso de apostas (online, loteria, cassino, bolão) que pode afetar seu foco e finanças. Exemplos: • Apostar dinheiro com frequência • Pensar em jogos durante o trabalho • Sentir necessidade de \"recuperar\" perdas",
    gestao: "Dicas práticas que mantêm sua cabeça no trabalho e no bolso: • Registre gastos com apostas por 1 semana (bloco ou app grátis). • Substitua 1 aposta por 1 meta de trabalho – mesma emoção, mais ganho. • Desligue notificações de sites de aposta – 1 clique. • Reunião mensal de foco financeiro (já existe). Cabeça limpa = entrega rápida = bolso cheio.",
    baixo: "Ótimo! Você não tem risco com jogos – seu foco está 100% no trabalho. Continue assim: • Mantenha zero distração com apostas. • Compartilhe sua disciplina com o time (opcional). • Avise se notar colegas em risco.",
    medio: "Atenção. Você tem algum hábito de aposta que pode roubar tempo e energia. Ações simples para render mais: • Registre gastos por 7 dias – veja o impacto real. • Bloqueie 1 site/app de aposta no celular. • Troque 1 aposta por 1 meta de produção – mesma emoção. • Refaça o questionário em 3 meses.",
    alto: "Vamos redirecionar sua energia. Você tem risco alto com jogos – isso drena foco, dinheiro e saúde. Ações práticas para você entregar 100%: • Abra protocolo confidencial no RH hoje (link: [INSIRA]). • Reunião com líder em 48h para ajuste de metas + apoio. • Bloqueie todos os sites/apps – use extensão gratuita. • Acompanhamento mensal será agendado. Sua função é essencial – sem jogos, você ganha mais (e melhor)."
  },
  {
    id: 10,
    nome: "Endividamento",
    explicacao: "É quando dívidas ou pressão financeira afetam seu foco, sono e entrega no trabalho. Exemplos: • Contas atrasadas • Preocupação constante com dinheiro • Empréstimos entre colegas",
    gestao: "Dicas práticas que mantêm seu foco no trabalho e paz financeira: • Liste 3 despesas fixas e 1 corte possível – 5 min/dia. • Use planilha grátis (modelo interno) – controle em 1 clique. • Converse com 1 colega de confiança – apoio emocional. • Oficina mensal de finanças (já existe). Finanças em ordem = cabeça leve = entrega 100%.",
    baixo: "Ótimo! Você não tem pressão financeira – seu foco está total no trabalho. Continue assim: • Mantenha o controle simples de gastos. • Compartilhe 1 dica financeira com o time (opcional). • Avise se notar colegas em dificuldade.",
    medio: "Atenção. Você sente alguma pressão com dívidas – isso rouba energia. Ações simples para render mais: • Liste 3 despesas e 1 corte – use planilha interna. • Bloqueie compras por impulso (app grátis). • Participe da oficina de finanças – próxima [DATA]. • Refaça o questionário em 3 meses.",
    alto: "Vamos organizar juntos. Você tem alto endividamento – isso drena sua produtividade. Ações práticas para você entregar mais: • Abra protocolo confidencial no RH hoje (link: [INSIRA]). • Reunião com líder em 48h para apoio + ajuste de metas. • Use planilha interna + bloqueie compras impulsivas. • Acompanhamento mensal será agendado. Sua função é vital – com paz financeira, você entrega o dobro."
  }
]

// Função para obter dados do relatório por grupo
export function getRelatorioGrupo(grupoId: number): RelatorioGrupo | undefined {
  return dadosRelatorio.find(grupo => grupo.id === grupoId)
}

// Função para obter recomendação baseada na categoria
export function getRecomendacao(grupoId: number, categoria: 'baixo' | 'medio' | 'alto'): string {
  const grupo = getRelatorioGrupo(grupoId)
  if (!grupo) return ""
  
  switch (categoria) {
    case 'baixo':
      return grupo.baixo
    case 'medio':
      return grupo.medio
    case 'alto':
      return grupo.alto
    default:
      return ""
  }
}
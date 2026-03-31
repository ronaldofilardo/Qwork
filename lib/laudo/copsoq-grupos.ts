/**
 * lib/laudo/copsoq-grupos.ts
 *
 * Dados puros dos 10 grupos COPSOQ III.
 * Separado da lógica de cálculo para facilitar manutenção e testes.
 */

export const gruposCOPSOQ = [
  {
    grupo: 1,
    dominio: 'Demandas no Trabalho',
    descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
    tipo: 'negativa' as const,
    recomendacao:
      'Para equilibrar exigências quantitativas e ritmo acelerado, revisar metas com participação da equipe via reuniões participativas, dimensionar adequadamente os quadros de pessoal com análise de turnover e carga horária pelo SESMT, implementar pausas regulares e planejadas conforme NR-17 (ergonomia), registrar tudo no Inventário de Riscos do PGR com matriz de priorização por severidade/probabilidade. Abordagem acolher o bem-estar diário dos trabalhadores, complementar por orientação contínua em saúde com clínicos gerais e profissionais multidisciplinares para acolher sinais iniciais de fadiga física/emocional, ajudar todos manterem o ritmo produtivo sem desgaste excessivo ou afastamentos por LER/DORT.',
  },
  {
    grupo: 2,
    dominio: 'Organização e Conteúdo do Trabalho',
    descricao:
      'Influência, desenvolvimento de habilidades e significado do trabalho',
    tipo: 'positiva' as const,
    recomendacao:
      'Criar comitês participativos permanentes para decisões sobre processos produtivos, oferecer capacitações regulares certificadas pelo RH em desenvolvimento de competências técnicas e comportamentais, definir papéis claros com feedback estruturado quinzenal sobre o impacto do trabalho nos objetivos organizacionais, documentar avanços no PGR para fomentar desenvolvimento contínuo e significado profissional mensurável. Estrutura valorizar cada contribuição individual e coletiva, orientação acessível em saúde com orientadores profissionais para esclarecer dúvidas sobre crescimento profissional, trilhas de carreira e equilíbrio cotidiano entre tarefas e aspirações, criar ciclo virtuoso de motivação e retenção de talentos.',
  },
  {
    grupo: 3,
    dominio: 'Relações Sociais e Liderança',
    descricao: 'Apoio social, feedback e reconhecimento no trabalho',
    tipo: 'positiva' as const,
    recomendacao:
      'Investir em treinamentos acolhedores para gestores sobre feedback construtivo (modelo SBI), mediação de conflitos certificada por psicólogos organizacionais e rituais de equipe semanais para apoio social e reconhecimento genuíno via programas de bonificação não financeira, registrar resultados no PGR com pesquisas de clima organizacional trimestrais validadas. Práticas construir laços sólidos e respeitosos entre pares e liderança, apoiar por suporte psicológico breve com psicólogos clínicos especializados em dinâmicas laborais para navegar tensões interpessoais com serenidade, confiança renovada e redução de litígios trabalhistas.',
  },
  {
    grupo: 4,
    dominio: 'Interface Trabalho-Indivíduo',
    descricao: 'Insegurança no trabalho e conflito trabalho-família',
    tipo: 'negativa' as const,
    recomendacao:
      'Adotar políticas de flexibilidade horária flexível (banco de horas, home office regulado), transparência em reestruturações com comunicação empática prévia por escrito e reuniões town hall, integrar ao PGR para minimizar insegurança laboral e conflitos trabalho-família com análise de jornadas pelo SESMT. Cuidado equilibrar vida profissional e pessoal de forma humanizada e legalmente sustentável, complementar por terapia focada com psicólogos especializados em equilíbrio vida-trabalho oferecer ferramentas rápidas e comprovadas para harmonizar esses mundos com mais leveza e menor impacto na saúde familiar.',
  },
  {
    grupo: 5,
    dominio: 'Valores Organizacionais',
    descricao: 'Confiança, justiça e respeito mútuo na organização',
    tipo: 'positiva' as const,
    recomendacao:
      'Elaborar e divulgar código de ética robusto aprovado pelo Comitê de Compliance, manter canais confidenciais de denúncia 24h com fluxos de apuração em até 72h e critérios transparentes de avaliação 360° e recompensas por mérito documentados, atualizar PGR com evidências de aplicação e auditorias internas semestrais. Base fortalecer confiança mútua e respeito diário entre todos os níveis hierárquicos, enriquecer por acompanhamento psicológico com especialistas em ética organizacional acolher percepções de injustiça ou verticalização excessiva, promover senso renovado de pertencimento e alinhamento cultural.',
  },
  {
    grupo: 6,
    dominio: 'Traços de Personalidade',
    descricao: 'Autoeficácia e autoconfiança',
    tipo: 'positiva' as const,
    recomendacao:
      'Oferecer oficinas voluntárias e integradas ao PCMSO para desenvolver autoeficácia via metodologias cognitivo-comportamentais e confiança com assessments psicométricos validados, enfatizar resultados agregados anônimos no PGR, evitar individualizações estigmatizantes com foco exclusivo em prevenção coletiva. Iniciativa empoderar de dentro para fora com suporte técnico-científico, suporte psicológico direcionado com psicólogos do trabalho nutrir autoconfiança sob pressões operacionais rotineiras, permitir cada colaborador florescer no seu melhor potencial produtivo sustentável.',
  },
  {
    grupo: 7,
    dominio: 'Saúde e Bem-Estar',
    descricao: 'Avaliação de estresse, burnout e sintomas somáticos',
    tipo: 'negativa' as const,
    recomendacao:
      'Lançar campanhas permanentes sobre ergonomia certificada NR-17, sono restaurador com orientações do médico do trabalho, atividade física leve via programas corporativos com educadores físicos, estabelecer fluxos claros para PCMSO com exames admissionais/periodicos ampliados, monitorar sintomas no PGR para prevenção proativa de burnout e somatizações. Ações cuidar corpo e mente de forma integrada e holística, avaliação clínica geral com médicos, orientação nutricional personalizada com nutricionistas e suporte amplo em saúde com equipes multidisciplinares aliviar estresse crônico e burnout com passos simples, eficazes e mensuráveis por indicadores de saúde ocupacional.',
  },
  {
    grupo: 8,
    dominio: 'Comportamentos Ofensivos',
    descricao: 'Exposição a assédio e violência no trabalho',
    tipo: 'negativa' as const,
    recomendacao:
      'Instituir política de tolerância zero ao assédio moral/sexual e violência (Lei 14.457/22), realizar treinamentos anuais obrigatórios com psicólogos organizacionais e apurações ágeis e imparciais em até 5 dias úteis com comitês bipartites, documentar incidentes e ações corretivas no PGR para proteção coletiva auditável. Compromisso proteger dignidade de todos os trabalhadores, apoiar por terapia psicológica especializada com psicólogos clínicos em trauma laboral restaurar paz interior após exposições a situações agressivas ou abusivas, com acompanhamento pós-intervenção e reinserção segura.',
  },
  {
    grupo: 9,
    dominio: 'Comportamento de Jogo',
    descricao: 'Avaliação de comportamentos relacionados a Jogos de Apostas',
    tipo: 'negativa' as const,
    recomendacao:
      'Promover campanhas educativas sobre riscos de apostas patológicas com psiquiatras especializados, implementar bloqueios técnicos em ambientes corporativos (redes WI-FI, terminais) e avaliar impactos via PCMSO com exames neuropsicológicos quando indicado, registrar no PGR com foco preventivo e indicadores comportamentais. Prevenção gentil e firme com embasamento científico, complementar por suporte psicológico breve com psicólogos cognitivo-comportamentais guiar padrões comportamentais compulsivos para escolhas mais conscientes, equilibradas no dia a dia laboral e pessoal.',
  },
  {
    grupo: 10,
    dominio: 'Endividamento Financeiro',
    descricao: 'Avaliação do nível de endividamento e estresse financeiro',
    tipo: 'negativa' as const,
    recomendacao:
      'Realizar workshops práticos de educação financeira com planejadores financeiros certificados (CFP), revisar políticas de consignados e adiantamentos com auditoria interna para evitar superendividamento, monitorar no PGR ligado a estresse somático com indicadores de absentismo por motivos financeiros. Ajuda estrutural aliviar pesos reais e crônicos das famílias trabalhadoras, consulta clínica geral com médicos ocupacionais ou orientação contínua com equipes de saúde cuidar ecos físicos do estresse financeiro prolongado (hipertensão, insônia), restaurar estabilidade com empatia técnica e acompanhamento longitudinal.',
  },
];

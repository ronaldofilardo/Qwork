/**
 * Teste para validar a geração correta de Interpretação e Recomendações
 * incluindo a listagem dos grupos de alto risco
 */

import { CategoriaRisco, ClassificacaoSemaforo } from '@/lib/laudo-tipos';

interface ScoreGrupo {
  grupo: number;
  dominio: string;
  descricao: string;
  tipo: 'positiva' | 'negativa';
  media: number;
  desvioPadrao: number;
  mediaMenosDP: number;
  mediaMaisDP: number;
  categoriaRisco: CategoriaRisco;
  classificacaoSemaforo: ClassificacaoSemaforo;
  acaoRecomendada: string;
}

interface InterpretacaoRecomendacoes {
  textoPrincipal: string;
  gruposAtencao: ScoreGrupo[];
  gruposMonitoramento: ScoreGrupo[];
  gruposExcelente: ScoreGrupo[];
  gruposAltoRisco: ScoreGrupo[];
  conclusao: string;
}

function gerarInterpretacaoRecomendacoes(
  empresaNome: string,
  scores: ScoreGrupo[]
): InterpretacaoRecomendacoes {
  // Classificar grupos por categoria de risco
  const gruposBaixoRisco = scores.filter((s) => s.categoriaRisco === 'baixo');
  const gruposMedioRisco = scores.filter((s) => s.categoriaRisco === 'medio');
  const gruposAltoRisco = scores.filter((s) => s.categoriaRisco === 'alto');

  // Gerar texto principal na ordem: baixo risco → médio risco → alto risco
  let textoPrincipal = `A ${empresaNome} apresenta `;

  // 1. Primeiro: dimensões de baixo risco (Excelente)
  if (gruposBaixoRisco.length > 0) {
    const nomesBaixoRisco = gruposBaixoRisco
      .map((g) => `${g.grupo} - ${g.dominio}`)
      .join(', ');
    textoPrincipal += `os indicadores Excelente nos grupos ${nomesBaixoRisco} que são importantes fatores de proteção e devem ser valorizados e mantidos. `;
  }

  // 2. Segundo: dimensões de risco médio (Atenção Necessária)
  if (gruposMedioRisco.length > 0) {
    const nomesMedioRisco = gruposMedioRisco
      .map((g) => `${g.grupo} - ${g.dominio}`)
      .join(', ');
    textoPrincipal += `${gruposMedioRisco.length} dimensão(ões) classificada(s) como Atenção Necessária (${nomesMedioRisco}) onde essa(s) área(s) requer(em) atenção por parte da instituição com intervenção imediata para prevenção de riscos psicossociais. `;
  }

  // 3. Terceiro: dimensões de alto risco
  if (gruposAltoRisco.length > 0) {
    const nomesAltoRisco = gruposAltoRisco
      .map((g) => `${g.grupo} - ${g.dominio}`)
      .join(', ');
    textoPrincipal += `Além disso, apresenta ${gruposAltoRisco.length} dimensão(ões) de alto risco (${nomesAltoRisco}) que requerem ação corretiva urgente.`;
  }

  // Conclusão padrão
  const conclusao = `A amostragem acima descrita foi submetida à avaliação psicossocial para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho. Durante o período da avaliação, foi possível identificar os pontos acima descritos.`;

  return {
    textoPrincipal,
    gruposAtencao: gruposMedioRisco,
    gruposMonitoramento: gruposMedioRisco,
    gruposExcelente: gruposBaixoRisco,
    gruposAltoRisco,
    conclusao,
  };
}

describe('Interpretação e Recomendações - Listagem de Grupos', () => {
  const scoresExemplo: ScoreGrupo[] = [
    {
      grupo: 1,
      dominio: 'Demandas no Trabalho',
      descricao: 'Avaliação das exigências',
      tipo: 'positiva',
      media: 74.9,
      desvioPadrao: 10,
      mediaMenosDP: 64.9,
      mediaMaisDP: 84.9,
      categoriaRisco: 'baixo',
      classificacaoSemaforo: 'verde',
      acaoRecomendada: 'Manter',
    },
    {
      grupo: 2,
      dominio: 'Organização e Conteúdo do Trabalho',
      descricao: 'Influência e desenvolvimento',
      tipo: 'positiva',
      media: 18.6,
      desvioPadrao: 10,
      mediaMenosDP: 8.6,
      mediaMaisDP: 28.6,
      categoriaRisco: 'alto',
      classificacaoSemaforo: 'vermelho',
      acaoRecomendada: 'Ação imediata',
    },
    {
      grupo: 3,
      dominio: 'Relações Sociais e Liderança',
      descricao: 'Apoio social',
      tipo: 'positiva',
      media: 75.4,
      desvioPadrao: 10,
      mediaMenosDP: 65.4,
      mediaMaisDP: 85.4,
      categoriaRisco: 'baixo',
      classificacaoSemaforo: 'verde',
      acaoRecomendada: 'Manter',
    },
    {
      grupo: 4,
      dominio: 'Interface Trabalho-Indivíduo',
      descricao: 'Insegurança no trabalho',
      tipo: 'negativa',
      media: 18.2,
      desvioPadrao: 10,
      mediaMenosDP: 8.2,
      mediaMaisDP: 28.2,
      categoriaRisco: 'baixo',
      classificacaoSemaforo: 'verde',
      acaoRecomendada: 'Manter',
    },
    {
      grupo: 5,
      dominio: 'Valores Organizacionais',
      descricao: 'Confiança e justiça',
      tipo: 'positiva',
      media: 50,
      desvioPadrao: 10,
      mediaMenosDP: 40,
      mediaMaisDP: 60,
      categoriaRisco: 'medio',
      classificacaoSemaforo: 'amarelo',
      acaoRecomendada: 'Monitorar',
    },
    {
      grupo: 6,
      dominio: 'Traços de Personalidade',
      descricao: 'Autoeficácia',
      tipo: 'positiva',
      media: 18.8,
      desvioPadrao: 10,
      mediaMenosDP: 8.8,
      mediaMaisDP: 28.8,
      categoriaRisco: 'alto',
      classificacaoSemaforo: 'vermelho',
      acaoRecomendada: 'Ação imediata',
    },
  ];

  test('Deve classificar corretamente os grupos por categoria de risco', () => {
    const resultado = gerarInterpretacaoRecomendacoes(
      'Empresa Teste',
      scoresExemplo
    );

    // Verificar contagens
    expect(resultado.gruposExcelente.length).toBe(3); // Grupos 1, 3, 4
    expect(resultado.gruposMonitoramento.length).toBe(1); // Grupo 5
    expect(resultado.gruposAltoRisco.length).toBe(2); // Grupos 2, 6
  });

  test('Deve incluir grupos de ALTO RISCO na lista gruposAltoRisco', () => {
    const resultado = gerarInterpretacaoRecomendacoes(
      'Empresa Teste',
      scoresExemplo
    );

    expect(resultado.gruposAltoRisco).toHaveLength(2);
    expect(resultado.gruposAltoRisco[0].grupo).toBe(2);
    expect(resultado.gruposAltoRisco[0].dominio).toBe(
      'Organização e Conteúdo do Trabalho'
    );
    expect(resultado.gruposAltoRisco[1].grupo).toBe(6);
    expect(resultado.gruposAltoRisco[1].dominio).toBe(
      'Traços de Personalidade'
    );
  });

  test('Deve mencionar grupos de alto risco no texto principal', () => {
    const resultado = gerarInterpretacaoRecomendacoes(
      'Empresa Teste',
      scoresExemplo
    );

    expect(resultado.textoPrincipal).toContain('2 dimensão(ões) de alto risco');
    expect(resultado.textoPrincipal).toContain(
      '2 - Organização e Conteúdo do Trabalho'
    );
    expect(resultado.textoPrincipal).toContain('6 - Traços de Personalidade');
    expect(resultado.textoPrincipal).toContain('ação corretiva urgente');
  });

  test('Deve separar corretamente grupos positivos com baixa pontuação como ALTO RISCO', () => {
    const resultado = gerarInterpretacaoRecomendacoes(
      'Empresa Teste',
      scoresExemplo
    );

    // Grupo 2 (Positivo, 18.6%) deve estar em Alto Risco
    const grupo2 = resultado.gruposAltoRisco.find((g) => g.grupo === 2);
    expect(grupo2).toBeDefined();
    expect(grupo2?.tipo).toBe('positiva');
    expect(grupo2?.media).toBe(18.6);
    expect(grupo2?.categoriaRisco).toBe('alto');
  });

  test('Deve separar corretamente grupos negativos com baixa pontuação como BAIXO RISCO', () => {
    const resultado = gerarInterpretacaoRecomendacoes(
      'Empresa Teste',
      scoresExemplo
    );

    // Grupo 4 (Negativo, 18.2%) deve estar em Baixo Risco (Excelente)
    const grupo4 = resultado.gruposExcelente.find((g) => g.grupo === 4);
    expect(grupo4).toBeDefined();
    expect(grupo4?.tipo).toBe('negativa');
    expect(grupo4?.media).toBe(18.2);
    expect(grupo4?.categoriaRisco).toBe('baixo');
  });

  test('Não deve haver grupos duplicados entre as categorias', () => {
    const resultado = gerarInterpretacaoRecomendacoes(
      'Empresa Teste',
      scoresExemplo
    );

    const todosGrupos = [
      ...resultado.gruposExcelente.map((g) => g.grupo),
      ...resultado.gruposMonitoramento.map((g) => g.grupo),
      ...resultado.gruposAltoRisco.map((g) => g.grupo),
    ];

    const gruposUnicos = new Set(todosGrupos);
    expect(todosGrupos.length).toBe(gruposUnicos.size);
  });

  test('Soma de todos os grupos deve ser igual ao total de scores', () => {
    const resultado = gerarInterpretacaoRecomendacoes(
      'Empresa Teste',
      scoresExemplo
    );

    const totalClassificados =
      resultado.gruposExcelente.length +
      resultado.gruposMonitoramento.length +
      resultado.gruposAltoRisco.length;

    expect(totalClassificados).toBe(scoresExemplo.length);
  });

  test('Quando não há grupos de alto risco, a lista deve estar vazia', () => {
    const scoresSemAltoRisco = scoresExemplo.filter(
      (s) => s.categoriaRisco !== 'alto'
    );
    const resultado = gerarInterpretacaoRecomendacoes(
      'Empresa Teste',
      scoresSemAltoRisco
    );

    expect(resultado.gruposAltoRisco).toHaveLength(0);
    expect(resultado.textoPrincipal).not.toContain('alto risco');
  });

  test('Quando há apenas grupos de alto risco, deve listá-los corretamente', () => {
    const scoresApenasAltoRisco = scoresExemplo.filter(
      (s) => s.categoriaRisco === 'alto'
    );
    const resultado = gerarInterpretacaoRecomendacoes(
      'Empresa Crítica',
      scoresApenasAltoRisco
    );

    expect(resultado.gruposAltoRisco).toHaveLength(2);
    expect(resultado.gruposExcelente).toHaveLength(0);
    expect(resultado.gruposMonitoramento).toHaveLength(0);
    expect(resultado.textoPrincipal).toContain('2 dimensão(ões) de alto risco');
  });
});

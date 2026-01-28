/**
 * Teste para validar a exibição condicional dos boxes de Interpretação
 * Os boxes só devem aparecer se houver grupos na respectiva categoria
 */

describe('Exibição Condicional de Boxes - Interpretação e Recomendações', () => {
  
  interface ScoreGrupo {
    grupo: number
    dominio: string
    categoriaRisco: 'baixo' | 'medio' | 'alto'
  }

  interface InterpretacaoRecomendacoes {
    gruposExcelente: ScoreGrupo[]
    gruposMonitoramento: ScoreGrupo[]
    gruposAltoRisco: ScoreGrupo[]
  }

  function gerarInterpretacao(scores: ScoreGrupo[]): InterpretacaoRecomendacoes {
    return {
      gruposExcelente: scores.filter(s => s.categoriaRisco === 'baixo'),
      gruposMonitoramento: scores.filter(s => s.categoriaRisco === 'medio'),
      gruposAltoRisco: scores.filter(s => s.categoriaRisco === 'alto')
    }
  }

  function deveExibirBox(grupos: ScoreGrupo[]): boolean {
    return grupos && grupos.length > 0
  }

  test('Deve exibir apenas box verde quando só há grupos de baixo risco', () => {
    const scores: ScoreGrupo[] = [
      { grupo: 1, dominio: 'Demandas no Trabalho', categoriaRisco: 'baixo' },
      { grupo: 3, dominio: 'Relações Sociais', categoriaRisco: 'baixo' },
      { grupo: 4, dominio: 'Interface Trabalho-Indivíduo', categoriaRisco: 'baixo' }
    ]

    const resultado = gerarInterpretacao(scores)

    expect(deveExibirBox(resultado.gruposExcelente)).toBe(true)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(false)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(false)
  })

  test('Deve exibir apenas box amarelo quando só há grupos de médio risco', () => {
    const scores: ScoreGrupo[] = [
      { grupo: 5, dominio: 'Valores Organizacionais', categoriaRisco: 'medio' },
      { grupo: 10, dominio: 'Endividamento Financeiro', categoriaRisco: 'medio' }
    ]

    const resultado = gerarInterpretacao(scores)

    expect(deveExibirBox(resultado.gruposExcelente)).toBe(false)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(true)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(false)
  })

  test('Deve exibir apenas box vermelho quando só há grupos de alto risco', () => {
    const scores: ScoreGrupo[] = [
      { grupo: 2, dominio: 'Organização do Trabalho', categoriaRisco: 'alto' },
      { grupo: 6, dominio: 'Traços de Personalidade', categoriaRisco: 'alto' },
      { grupo: 9, dominio: 'Comportamento de Jogo', categoriaRisco: 'alto' }
    ]

    const resultado = gerarInterpretacao(scores)

    expect(deveExibirBox(resultado.gruposExcelente)).toBe(false)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(false)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(true)
  })

  test('Deve exibir todos os boxes quando há grupos em todas as categorias', () => {
    const scores: ScoreGrupo[] = [
      { grupo: 1, dominio: 'Demandas no Trabalho', categoriaRisco: 'baixo' },
      { grupo: 5, dominio: 'Valores Organizacionais', categoriaRisco: 'medio' },
      { grupo: 9, dominio: 'Comportamento de Jogo', categoriaRisco: 'alto' }
    ]

    const resultado = gerarInterpretacao(scores)

    expect(deveExibirBox(resultado.gruposExcelente)).toBe(true)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(true)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(true)
  })

  test('Deve exibir verde e vermelho, mas não amarelo', () => {
    const scores: ScoreGrupo[] = [
      { grupo: 1, dominio: 'Demandas no Trabalho', categoriaRisco: 'baixo' },
      { grupo: 3, dominio: 'Relações Sociais', categoriaRisco: 'baixo' },
      { grupo: 2, dominio: 'Organização do Trabalho', categoriaRisco: 'alto' }
    ]

    const resultado = gerarInterpretacao(scores)

    expect(deveExibirBox(resultado.gruposExcelente)).toBe(true)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(false)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(true)
  })

  test('Não deve exibir nenhum box quando não há grupos', () => {
    const scores: ScoreGrupo[] = []

    const resultado = gerarInterpretacao(scores)

    expect(deveExibirBox(resultado.gruposExcelente)).toBe(false)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(false)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(false)
  })

  test('Deve exibir amarelo e vermelho, mas não verde', () => {
    const scores: ScoreGrupo[] = [
      { grupo: 5, dominio: 'Valores Organizacionais', categoriaRisco: 'medio' },
      { grupo: 9, dominio: 'Comportamento de Jogo', categoriaRisco: 'alto' }
    ]

    const resultado = gerarInterpretacao(scores)

    expect(deveExibirBox(resultado.gruposExcelente)).toBe(false)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(true)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(true)
  })

  test('Contagem de grupos por categoria deve ser precisa', () => {
    const scores: ScoreGrupo[] = [
      { grupo: 1, dominio: 'Grupo 1', categoriaRisco: 'baixo' },
      { grupo: 2, dominio: 'Grupo 2', categoriaRisco: 'baixo' },
      { grupo: 3, dominio: 'Grupo 3', categoriaRisco: 'baixo' },
      { grupo: 4, dominio: 'Grupo 4', categoriaRisco: 'medio' },
      { grupo: 5, dominio: 'Grupo 5', categoriaRisco: 'medio' },
      { grupo: 6, dominio: 'Grupo 6', categoriaRisco: 'alto' }
    ]

    const resultado = gerarInterpretacao(scores)

    expect(resultado.gruposExcelente).toHaveLength(3)
    expect(resultado.gruposMonitoramento).toHaveLength(2)
    expect(resultado.gruposAltoRisco).toHaveLength(1)
  })

  test('Cenário realista: empresa com perfil misto', () => {
    const scores: ScoreGrupo[] = [
      { grupo: 1, dominio: 'Demandas no Trabalho', categoriaRisco: 'baixo' },
      { grupo: 2, dominio: 'Organização do Trabalho', categoriaRisco: 'alto' },
      { grupo: 3, dominio: 'Relações Sociais', categoriaRisco: 'baixo' },
      { grupo: 4, dominio: 'Interface Trabalho-Indivíduo', categoriaRisco: 'baixo' },
      { grupo: 5, dominio: 'Valores Organizacionais', categoriaRisco: 'medio' },
      { grupo: 6, dominio: 'Traços de Personalidade', categoriaRisco: 'alto' },
      { grupo: 7, dominio: 'Saúde e Bem-Estar', categoriaRisco: 'baixo' },
      { grupo: 8, dominio: 'Comportamentos Ofensivos', categoriaRisco: 'baixo' },
      { grupo: 9, dominio: 'Comportamento de Jogo', categoriaRisco: 'alto' },
      { grupo: 10, dominio: 'Endividamento Financeiro', categoriaRisco: 'medio' }
    ]

    const resultado = gerarInterpretacao(scores)

    // Todos os boxes devem ser exibidos
    expect(deveExibirBox(resultado.gruposExcelente)).toBe(true)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(true)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(true)

    // Validar contagens
    expect(resultado.gruposExcelente).toHaveLength(5) // 1, 3, 4, 7, 8
    expect(resultado.gruposMonitoramento).toHaveLength(2) // 5, 10
    expect(resultado.gruposAltoRisco).toHaveLength(3) // 2, 6, 9
  })

  test('Cenário ideal: todos os grupos com baixo risco', () => {
    const scores: ScoreGrupo[] = Array.from({ length: 10 }, (_, i) => ({
      grupo: i + 1,
      dominio: `Grupo ${i + 1}`,
      categoriaRisco: 'baixo' as const
    }))

    const resultado = gerarInterpretacao(scores)

    expect(deveExibirBox(resultado.gruposExcelente)).toBe(true)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(false)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(false)
    expect(resultado.gruposExcelente).toHaveLength(10)
  })

  test('Cenário crítico: todos os grupos com alto risco', () => {
    const scores: ScoreGrupo[] = Array.from({ length: 10 }, (_, i) => ({
      grupo: i + 1,
      dominio: `Grupo ${i + 1}`,
      categoriaRisco: 'alto' as const
    }))

    const resultado = gerarInterpretacao(scores)

    expect(deveExibirBox(resultado.gruposExcelente)).toBe(false)
    expect(deveExibirBox(resultado.gruposMonitoramento)).toBe(false)
    expect(deveExibirBox(resultado.gruposAltoRisco)).toBe(true)
    expect(resultado.gruposAltoRisco).toHaveLength(10)
  })
})

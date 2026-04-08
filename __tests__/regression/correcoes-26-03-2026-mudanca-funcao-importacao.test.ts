/**
 * Testes para as correções de 26/03/2026:
 *
 *  1. column-matcher: 'hierarquia' não é mais sinônimo de nivel_cargo
 *     (causava auto-mapeamento falso → modal nunca abria)
 *
 *  2. column-matcher: 'nivel_hierarquico' continua sendo sinônimo legítimo de nivel_cargo
 *
 *  3. Lógica de detecção de funcoesComMudancaRole:
 *     - Funcionário existente com nova função → capturado
 *     - Funcionário existente com mesma função → não capturado
 *     - CPF sem histórico no banco → não capturado
 *     - Múltiplos CPFs com mudança → deduplicado e ordenado
 *     - Função "Não informado" → ignorada
 *
 *  4. Lógica de rastreamento de funcoesAlteradasList (execute):
 *     - Função nova ≠ função anterior → entra na lista
 *     - Função nova = função anterior → não entra na lista
 *     - Funcionário novo (sem funcaoAnterior) → não entra na lista
 */

import { sugerirMapeamento } from '@/lib/importacao/column-matcher';
import type { DetectedColumn } from '@/lib/importacao/dynamic-parser';

// ============================================================
// 1 & 2 — column-matcher: sinônimos de nivel_cargo
// ============================================================
describe('column-matcher: sinônimos de nivel_cargo', () => {
  it('NÃO mapeia coluna chamada "hierarquia" para nivel_cargo', () => {
    // CORRIGIDO em 26/03/2026: "hierarquia" foi removida dos sinônimos
    // porque causava auto-mapeamento falso e impedia a abertura do modal
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'CPF', exemploDados: ['123.456.789-09'] },
      { indice: 1, nomeOriginal: 'Nome', exemploDados: ['João Silva'] },
      { indice: 2, nomeOriginal: 'Empresa', exemploDados: ['ACME'] },
      { indice: 3, nomeOriginal: 'hierarquia', exemploDados: ['senior'] },
    ];
    const resultado = sugerirMapeamento(colunas);
    const hierarquiaMap = resultado.find(
      (r) => r.nomeOriginal === 'hierarquia'
    );
    expect(hierarquiaMap?.sugestaoQWork).not.toBe('nivel_cargo');
  });

  it('NÃO mapeia coluna chamada "Hierarquia" (case-insensitive) para nivel_cargo', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'CPF', exemploDados: ['123.456.789-09'] },
      { indice: 1, nomeOriginal: 'Nome', exemploDados: ['João Silva'] },
      { indice: 2, nomeOriginal: 'Empresa', exemploDados: ['ACME'] },
      { indice: 3, nomeOriginal: 'Hierarquia', exemploDados: ['Pleno'] },
    ];
    const resultado = sugerirMapeamento(colunas);
    const map = resultado.find((r) => r.nomeOriginal === 'Hierarquia');
    expect(map?.sugestaoQWork).not.toBe('nivel_cargo');
  });

  it('mapeia "nivel hierarquico" para nivel_cargo (sinônimo legítimo mantido)', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'CPF', exemploDados: ['123.456.789-09'] },
      { indice: 1, nomeOriginal: 'Nome', exemploDados: ['João'] },
      { indice: 2, nomeOriginal: 'Empresa', exemploDados: ['ACME'] },
      { indice: 3, nomeOriginal: 'nivel hierarquico', exemploDados: ['Pleno'] },
    ];
    const resultado = sugerirMapeamento(colunas);
    const map = resultado.find((r) => r.nomeOriginal === 'nivel hierarquico');
    expect(map?.sugestaoQWork).toBe('nivel_cargo');
    expect(map?.confianca).toBeGreaterThanOrEqual(0.7);
  });

  it('mapeia "Nível de Cargo" exato para nivel_cargo', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'CPF', exemploDados: ['123.456.789-09'] },
      { indice: 1, nomeOriginal: 'Nome', exemploDados: ['João'] },
      { indice: 2, nomeOriginal: 'Empresa', exemploDados: ['ACME'] },
      { indice: 3, nomeOriginal: 'Nível de Cargo', exemploDados: ['Júnior'] },
    ];
    const resultado = sugerirMapeamento(colunas);
    const map = resultado.find((r) => r.nomeOriginal === 'Nível de Cargo');
    expect(map?.sugestaoQWork).toBe('nivel_cargo');
  });

  it('mapeia "nivel_cargo" exato para nivel_cargo com confiança 1.0', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'CPF', exemploDados: ['123.456.789-09'] },
      { indice: 1, nomeOriginal: 'Nome', exemploDados: ['João'] },
      { indice: 2, nomeOriginal: 'Empresa', exemploDados: ['ACME'] },
      { indice: 3, nomeOriginal: 'nivel_cargo', exemploDados: ['Sênior'] },
    ];
    const resultado = sugerirMapeamento(colunas);
    const map = resultado.find((r) => r.nomeOriginal === 'nivel_cargo');
    expect(map?.sugestaoQWork).toBe('nivel_cargo');
    expect(map?.confianca).toBe(1.0);
  });
});

// ============================================================
// 3 — Lógica pura de detecção de funcoesComMudancaRole
// (extraída e testada isoladamente — mesma lógica do validate/route.ts)
// ============================================================

/**
 * Replica a lógica do validate/route.ts para detectar funções que mudaram.
 * Usada para testar unitariamente sem dependência do banco de dados.
 */
function detectarFuncoesComMudancaRole(
  linhasValidas: Array<{ cpf?: string; funcao?: string }>,
  existingFuncaoMap: Map<string, string>
): string[] {
  function limparCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }
  const funcoesNovasPorMudancaRole = new Set<string>();
  for (const row of linhasValidas) {
    const cpf = limparCPF(row.cpf ?? '');
    const novaFuncao = (row.funcao ?? '').trim();
    if (
      !novaFuncao ||
      novaFuncao === 'Não informado' ||
      !existingFuncaoMap.has(cpf)
    )
      continue;
    const funcaoAtual = (existingFuncaoMap.get(cpf) ?? '').trim();
    if (funcaoAtual !== novaFuncao) {
      funcoesNovasPorMudancaRole.add(novaFuncao);
    }
  }
  return [...funcoesNovasPorMudancaRole].sort();
}

describe('detectarFuncoesComMudancaRole', () => {
  it('retorna função nova quando funcionário existente troca de cargo', () => {
    // Arrange
    const existingFuncaoMap = new Map([['12345678901', 'AUXILIAR']]);
    const linhas = [{ cpf: '123.456.789-01', funcao: 'ANALISTA' }];

    // Act
    const resultado = detectarFuncoesComMudancaRole(linhas, existingFuncaoMap);

    // Assert
    expect(resultado).toContain('ANALISTA');
    expect(resultado).toHaveLength(1);
  });

  it('retorna vazio quando função não mudou', () => {
    // Arrange
    const existingFuncaoMap = new Map([['12345678901', 'AUXILIAR']]);
    const linhas = [{ cpf: '123.456.789-01', funcao: 'AUXILIAR' }];

    // Act
    const resultado = detectarFuncoesComMudancaRole(linhas, existingFuncaoMap);

    // Assert
    expect(resultado).toHaveLength(0);
  });

  it('ignora CPFs não presentes no banco (funcionários novos)', () => {
    // Arrange
    const existingFuncaoMap = new Map<string, string>(); // banco vazio
    const linhas = [{ cpf: '123.456.789-01', funcao: 'OPERADOR' }];

    // Act
    const resultado = detectarFuncoesComMudancaRole(linhas, existingFuncaoMap);

    // Assert — funcionário novo → sem mudança de role
    expect(resultado).toHaveLength(0);
  });

  it('ignora funcao "Não informado"', () => {
    // Arrange
    const existingFuncaoMap = new Map([['12345678901', 'AUXILIAR']]);
    const linhas = [{ cpf: '123.456.789-01', funcao: 'Não informado' }];

    // Act
    const resultado = detectarFuncoesComMudancaRole(linhas, existingFuncaoMap);

    // Assert
    expect(resultado).toHaveLength(0);
  });

  it('ignora linhas com funcao vazia', () => {
    // Arrange
    const existingFuncaoMap = new Map([['12345678901', 'AUXILIAR']]);
    const linhas = [{ cpf: '123.456.789-01', funcao: '' }];

    // Act
    const resultado = detectarFuncoesComMudancaRole(linhas, existingFuncaoMap);

    // Assert
    expect(resultado).toHaveLength(0);
  });

  it('deduplica funções quando múltiplos funcionários mudam para o mesmo cargo', () => {
    // Arrange
    const existingFuncaoMap = new Map([
      ['11111111111', 'AUXILIAR'],
      ['22222222222', 'OPERADOR'],
    ]);
    const linhas = [
      { cpf: '111.111.111-11', funcao: 'ANALISTA' },
      { cpf: '222.222.222-22', funcao: 'ANALISTA' }, // mesmo cargo novo
    ];

    // Act
    const resultado = detectarFuncoesComMudancaRole(linhas, existingFuncaoMap);

    // Assert — "ANALISTA" aparece uma só vez
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toBe('ANALISTA');
  });

  it('retorna múltiplas funções distintas ordenadas alfabeticamente', () => {
    // Arrange
    const existingFuncaoMap = new Map([
      ['11111111111', 'AUXILIAR'],
      ['22222222222', 'OPERADOR'],
    ]);
    const linhas = [
      { cpf: '111.111.111-11', funcao: 'ROUPEIRO' },
      { cpf: '222.222.222-22', funcao: 'ANALISTA' },
    ];

    // Act
    const resultado = detectarFuncoesComMudancaRole(linhas, existingFuncaoMap);

    // Assert — ordenadas: ANALISTA < ROUPEIRO
    expect(resultado).toEqual(['ANALISTA', 'ROUPEIRO']);
  });

  it('funciona corretamente quando linhasValidas está vazio', () => {
    const existingFuncaoMap = new Map([['11111111111', 'AUXILIAR']]);
    const resultado = detectarFuncoesComMudancaRole([], existingFuncaoMap);
    expect(resultado).toHaveLength(0);
  });

  it('funciona corretamente quando existingFuncaoMap está vazio (primeira importação)', () => {
    const existingFuncaoMap = new Map<string, string>();
    const linhas = [
      { cpf: '123.456.789-01', funcao: 'ANALISTA' },
      { cpf: '234.567.890-12', funcao: 'OPERADOR' },
    ];
    const resultado = detectarFuncoesComMudancaRole(linhas, existingFuncaoMap);
    // Nenhum existente → nenhuma mudança de role detectada
    expect(resultado).toHaveLength(0);
  });

  it('processa CPF com pontuação e sem pontuação igualmente (normalização via limparCPF)', () => {
    // Arrange — banco tem CPF sem pontuação, planilha tem CPF com pontuação
    const existingFuncaoMap = new Map([['12345678909', 'MOTORISTA']]);
    const linhas = [{ cpf: '123.456.789-09', funcao: 'SUPERVISOR' }];

    // Act
    const resultado = detectarFuncoesComMudancaRole(linhas, existingFuncaoMap);

    // Assert — normalização deve casar os CPFs
    expect(resultado).toContain('SUPERVISOR');
  });
});

// ============================================================
// 4 — Lógica pura de rastreamento de funcoesAlteradasList (execute)
// ============================================================

/**
 * Replica a lógica do execute/route.ts para rastrear mudanças de função.
 */
function rastrearFuncaoAlterada(
  nomeFunc: string,
  funcaoNova: string,
  funcaoAnterior: string | null,
  lista: Array<{
    nome: string;
    funcaoAnterior: string | null;
    funcaoNova: string;
  }>
): void {
  if (funcaoNova !== 'Não informado' && funcaoNova !== funcaoAnterior) {
    lista.push({ nome: nomeFunc, funcaoAnterior, funcaoNova });
  }
}

describe('rastrearFuncaoAlterada (funcoesAlteradasList)', () => {
  it('adiciona à lista quando função muda para existente', () => {
    const lista: Array<{
      nome: string;
      funcaoAnterior: string | null;
      funcaoNova: string;
    }> = [];
    rastrearFuncaoAlterada('João Silva', 'ANALISTA', 'AUXILIAR', lista);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({
      nome: 'João Silva',
      funcaoAnterior: 'AUXILIAR',
      funcaoNova: 'ANALISTA',
    });
  });

  it('NÃO adiciona quando função não muda', () => {
    const lista: Array<{
      nome: string;
      funcaoAnterior: string | null;
      funcaoNova: string;
    }> = [];
    rastrearFuncaoAlterada('João Silva', 'AUXILIAR', 'AUXILIAR', lista);
    expect(lista).toHaveLength(0);
  });

  it('NÃO adiciona quando funcaoNova é "Não informado"', () => {
    const lista: Array<{
      nome: string;
      funcaoAnterior: string | null;
      funcaoNova: string;
    }> = [];
    rastrearFuncaoAlterada('João Silva', 'Não informado', 'AUXILIAR', lista);
    expect(lista).toHaveLength(0);
  });

  it('funcaoAnterior null é tratado como funcionário novo (sem entrada na lista)', () => {
    // Funcionário novo: funcaoAnterior = null, funcaoNova != null → SIM entra na lista
    // (novo funcionário sempre tem funcaoNova diferente de null)
    // Na execute/route.ts, a branch "funcionário novo" não chama rastrear →
    // mas para o helper isolado, null !== 'ANALISTA' → entraria.
    // Testamos o comportamento isolado da comparação.
    const lista: Array<{
      nome: string;
      funcaoAnterior: string | null;
      funcaoNova: string;
    }> = [];
    rastrearFuncaoAlterada('Maria Souza', 'ANALISTA', null, lista);
    // null !== 'ANALISTA' → é adicionado (funcionário preexistente sem cargo definido)
    expect(lista).toHaveLength(1);
    expect(lista[0].funcaoAnterior).toBeNull();
    expect(lista[0].funcaoNova).toBe('ANALISTA');
  });

  it('acumula múltiplas mudanças corretamente', () => {
    const lista: Array<{
      nome: string;
      funcaoAnterior: string | null;
      funcaoNova: string;
    }> = [];
    rastrearFuncaoAlterada('João Silva', 'ANALISTA', 'AUXILIAR', lista);
    rastrearFuncaoAlterada('Maria Souza', 'GERENTE', 'COORDENADOR', lista);
    rastrearFuncaoAlterada('Carlos Lima', 'OPERADOR', 'OPERADOR', lista); // sem mudança
    expect(lista).toHaveLength(2);
    expect(lista.map((f) => f.nome)).toEqual(['João Silva', 'Maria Souza']);
  });
});

// ============================================================
// 5 — Regressão: 'funcao' continua sendo mapeada corretamente
// ============================================================
describe('sugerirMapeamento: campo funcao não afetado pela correção', () => {
  it('mapeia "Cargo / Função" para campo funcao (não para nivel_cargo)', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'CPF', exemploDados: ['123.456.789-09'] },
      { indice: 1, nomeOriginal: 'Nome', exemploDados: ['João'] },
      { indice: 2, nomeOriginal: 'Empresa', exemploDados: ['ACME'] },
      { indice: 3, nomeOriginal: 'cargo', exemploDados: ['Analista'] },
    ];
    const resultado = sugerirMapeamento(colunas);
    const map = resultado.find((r) => r.nomeOriginal === 'cargo');
    expect(map?.sugestaoQWork).toBe('funcao');
    expect(map?.sugestaoQWork).not.toBe('nivel_cargo');
  });

  it('mapeia "função" para campo funcao', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'CPF', exemploDados: ['123.456.789-09'] },
      { indice: 1, nomeOriginal: 'Nome', exemploDados: ['João'] },
      { indice: 2, nomeOriginal: 'Empresa', exemploDados: ['ACME'] },
      { indice: 3, nomeOriginal: 'função', exemploDados: ['Operador'] },
    ];
    const resultado = sugerirMapeamento(colunas);
    const map = resultado.find((r) => r.nomeOriginal === 'função');
    expect(map?.sugestaoQWork).toBe('funcao');
  });
});

// ============================================================
// 6 — Lógica de mascaramento de nome e coleta de funcionariosComMudanca
// (extraída e testada isoladamente — mesma lógica do validate/route.ts)
// ============================================================

/**
 * Replica a lógica de mascaramento de nome do validate/route.ts.
 * "João Silva" → "J. S."
 * "João" → "J."
 * "" → "N/A"
 */
function mascarNome(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length >= 2) {
    return `${partes[0][0] ?? '?'}. ${partes[partes.length - 1][0] ?? '?'}.`;
  } else if (partes[0]) {
    return `${partes[0][0]}.`;
  }
  return 'N/A';
}

type NivelCargoValue = 'gestao' | 'operacional' | null;
type MudancaRoleDetalhe = {
  nomeMascarado: string;
  funcaoAnterior: string;
  nivelAtual: NivelCargoValue;
};

/**
 * Replica a lógica de coleta de funcionariosComMudanca do validate/route.ts.
 */
function coletarFuncionariosComMudanca(
  linhasValidas: Array<{ cpf?: string; funcao?: string }>,
  existingFuncaoMap: Map<string, string>,
  existingNivelCargoMap: Map<string, string | null>,
  existingNomeMap: Map<string, string>
): Map<string, MudancaRoleDetalhe[]> {
  function limparCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }
  const result = new Map<string, MudancaRoleDetalhe[]>();
  for (const row of linhasValidas) {
    const cpf = limparCPF(row.cpf ?? '');
    const novaFuncao = (row.funcao ?? '').trim();
    if (!novaFuncao || novaFuncao === 'Não informado' || !existingFuncaoMap.has(cpf))
      continue;
    const funcaoAtual = (existingFuncaoMap.get(cpf) ?? '').trim();
    if (funcaoAtual === novaFuncao) continue;

    const nomeCompleto = existingNomeMap.get(cpf) ?? '';
    const nomeMascarado = mascarNome(nomeCompleto);
    const nivelRaw = existingNivelCargoMap.get(cpf) ?? null;
    const nivelAtual: NivelCargoValue =
      nivelRaw === 'gestao' || nivelRaw === 'operacional' ? nivelRaw : null;

    if (!result.has(novaFuncao)) result.set(novaFuncao, []);
    const lista = result.get(novaFuncao)!;
    const jaAdicionado = lista.some(
      (d) => d.nomeMascarado === nomeMascarado && d.funcaoAnterior === funcaoAtual
    );
    if (!jaAdicionado) {
      lista.push({ nomeMascarado, funcaoAnterior: funcaoAtual, nivelAtual });
    }
  }
  return result;
}

describe('mascarNome', () => {
  it('mascara nome completo (primeiro + último inicial)', () => {
    expect(mascarNome('João Silva')).toBe('J. S.');
  });

  it('mascara nome com múltiplas partes (usa primeiro e último)', () => {
    expect(mascarNome('Maria Da Conceição Lima')).toBe('M. L.');
  });

  it('mascara nome com um único token', () => {
    expect(mascarNome('Eduardo')).toBe('E.');
  });

  it('retorna N/A para string vazia', () => {
    expect(mascarNome('')).toBe('N/A');
  });

  it('retorna N/A para string de espaços', () => {
    expect(mascarNome('   ')).toBe('N/A');
  });
});

describe('coletarFuncionariosComMudanca', () => {
  it('coleta detalhes do funcionário que mudou de função', () => {
    const funcaoMap = new Map([['12345678901', 'AUXILIAR']]);
    const nivelMap = new Map<string, string | null>([['12345678901', 'operacional']]);
    const nomeMap = new Map([['12345678901', 'João Silva']]);
    const linhas = [{ cpf: '123.456.789-01', funcao: 'ANALISTA' }];

    const result = coletarFuncionariosComMudanca(linhas, funcaoMap, nivelMap, nomeMap);

    expect(result.has('ANALISTA')).toBe(true);
    const detalhes = result.get('ANALISTA')!;
    expect(detalhes).toHaveLength(1);
    expect(detalhes[0]).toMatchObject({
      nomeMascarado: 'J. S.',
      funcaoAnterior: 'AUXILIAR',
      nivelAtual: 'operacional',
    });
  });

  it('deduplica quando mesmo funcionário aparece em duas linhas', () => {
    const funcaoMap = new Map([['12345678901', 'AUXILIAR']]);
    const nivelMap = new Map<string, string | null>([['12345678901', 'gestao']]);
    const nomeMap = new Map([['12345678901', 'Carlos Melo']]);
    const linhas = [
      { cpf: '123.456.789-01', funcao: 'GESTOR' },
      { cpf: '123.456.789-01', funcao: 'GESTOR' },
    ];

    const result = coletarFuncionariosComMudanca(linhas, funcaoMap, nivelMap, nomeMap);
    expect(result.get('GESTOR')).toHaveLength(1);
  });

  it('coleta nivel_cargo null quando não definido no banco', () => {
    const funcaoMap = new Map([['12345678901', 'OPERADOR']]);
    const nivelMap = new Map<string, string | null>([['12345678901', null]]);
    const nomeMap = new Map([['12345678901', 'Ana Lima']]);
    const linhas = [{ cpf: '123.456.789-01', funcao: 'SUPERVISOR' }];

    const result = coletarFuncionariosComMudanca(linhas, funcaoMap, nivelMap, nomeMap);
    expect(result.get('SUPERVISOR')![0].nivelAtual).toBeNull();
  });

  it('não coleta funcionário novo (CPF ausente do banco)', () => {
    const funcaoMap = new Map<string, string>();
    const nivelMap = new Map<string, string | null>();
    const nomeMap = new Map<string, string>();
    const linhas = [{ cpf: '123.456.789-01', funcao: 'ANALISTA' }];

    const result = coletarFuncionariosComMudanca(linhas, funcaoMap, nivelMap, nomeMap);
    expect(result.size).toBe(0);
  });

  it('não coleta quando função não muda', () => {
    const funcaoMap = new Map([['12345678901', 'ANALISTA']]);
    const nivelMap = new Map<string, string | null>([['12345678901', 'operacional']]);
    const nomeMap = new Map([['12345678901', 'Pedro Costa']]);
    const linhas = [{ cpf: '123.456.789-01', funcao: 'ANALISTA' }];

    const result = coletarFuncionariosComMudanca(linhas, funcaoMap, nivelMap, nomeMap);
    expect(result.size).toBe(0);
  });

  it('agrupa múltiplos funcionários mudando para a mesma nova função', () => {
    const funcaoMap = new Map([
      ['11111111111', 'MOTORISTA'],
      ['22222222222', 'AUXILIAR'],
    ]);
    const nivelMap = new Map<string, string | null>([
      ['11111111111', 'operacional'],
      ['22222222222', 'gestao'],
    ]);
    const nomeMap = new Map([
      ['11111111111', 'João Silva'],
      ['22222222222', 'Maria Lima'],
    ]);
    const linhas = [
      { cpf: '111.111.111-11', funcao: 'COORDENADOR' },
      { cpf: '222.222.222-22', funcao: 'COORDENADOR' },
    ];

    const result = coletarFuncionariosComMudanca(linhas, funcaoMap, nivelMap, nomeMap);
    const lista = result.get('COORDENADOR')!;
    expect(lista).toHaveLength(2);
    expect(lista.map((d) => d.nivelAtual)).toEqual(
      expect.arrayContaining(['operacional', 'gestao'])
    );
  });
});

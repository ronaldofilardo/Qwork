/**
 * Testes para o componente MudancasAgrupadas.
 *
 * Testa a lógica pura de agrupamento (groupMudancasByEmpresaAndFuncao) e
 * o comportamento esperado do componente quando renderizado com mudanças de função.
 *
 * Nota: Como os testes são unitários da lógica pura, não precisamos testar
 * renderização real (isso seria e2e). Testamos a estrutura de dados gerada.
 */

import type { FuncaoNivelInfo } from '@/components/importacao/NivelCargoStep';

// ===========================================================================
// Lógica pura: groupMudancasByEmpresaAndFuncao
// (replica a função helper do NivelCargoStep)
// ===========================================================================

function groupMudancasByEmpresaAndFuncao(
  funcoesNivelInfo: FuncaoNivelInfo[]
): Map<string, Map<string, { trocas: Array<FuncaoNivelInfo['funcionariosComMudanca']>[0][]; nivelAtual: string }>> {
  const grouped = new Map<string, Map<string, { trocas: Array<FuncaoNivelInfo['funcionariosComMudanca']>[0][]; nivelAtual: string }>>();

  for (const funcaoInfo of funcoesNivelInfo) {
    if (!funcaoInfo.isMudancaRole || !funcaoInfo.funcionariosComMudanca || funcaoInfo.funcionariosComMudanca.length === 0) {
      continue;
    }

    for (const troca of funcaoInfo.funcionariosComMudanca) {
      const empresa = troca.empresa || '(sem empresa)';

      if (!grouped.has(empresa)) {
        grouped.set(empresa, new Map());
      }

      const empresaMap = grouped.get(empresa)!;
      if (!empresaMap.has(funcaoInfo.funcao)) {
        empresaMap.set(funcaoInfo.funcao, {
          trocas: [],
          nivelAtual: funcaoInfo.niveisAtuais.filter((n): n is string => n !== null).join(' / ') || 'não definido'
        });
      }

      empresaMap.get(funcaoInfo.funcao)!.trocas.push(troca);
    }
  }

  return grouped;
}

// ===========================================================================
// 1. Agrupamento básico
// ===========================================================================

describe('groupMudancasByEmpresaAndFuncao — agrupamento básico', () => {
  it('retorna Map vazio quando não há mudanças', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'AUXILIAR',
        isMudancaRole: false,
        qtdFuncionarios: 5,
        qtdNovos: 0,
        qtdExistentes: 5,
        niveisAtuais: ['operacional'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: undefined,
      },
    ];
    const result = groupMudancasByEmpresaAndFuncao(funcs);
    expect(result.size).toBe(0);
  });

  it('agrupa corretamente 1 empresa, 2 funções, múltiplas trocas', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'PROFESSOR',
        isMudancaRole: true,
        qtdFuncionarios: 3,
        qtdNovos: 0,
        qtdExistentes: 3,
        niveisAtuais: [null],
        temNivelNuloExistente: true,
        funcionariosComMudanca: [
          { nomeMascarado: 'J. S.', funcaoAnterior: 'AUXILIAR', nivelAtual: 'operacional', empresa: 'Escola Primavera' },
          { nomeMascarado: 'M. O.', funcaoAnterior: 'OPERADOR', nivelAtual: null, empresa: 'Escola Primavera' },
          { nomeMascarado: 'R. P.', funcaoAnterior: 'TECH', nivelAtual: 'gestao', empresa: 'Escola Primavera' },
        ],
      },
      {
        funcao: 'MECANICO',
        isMudancaRole: true,
        qtdFuncionarios: 2,
        qtdNovos: 0,
        qtdExistentes: 2,
        niveisAtuais: ['operacional'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [
          { nomeMascarado: 'A. B.', funcaoAnterior: 'ASSISTENTE', nivelAtual: 'operacional', empresa: 'Escola Primavera' },
          { nomeMascarado: 'C. D.', funcaoAnterior: 'GERENTE', nivelAtual: 'gestao', empresa: 'Escola Primavera' },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);

    // Deve ter 1 empresa
    expect(result.size).toBe(1);

    // Empresa tem 2 funções
    const empresa = result.get('Escola Primavera')!;
    expect(empresa.size).toBe(2);

    // PROFESSOR tem 3 trocas
    const professor = empresa.get('PROFESSOR')!;
    expect(professor.trocas).toHaveLength(3);
    expect(professor.nivelAtual).toBe('não definido'); // null é filtrado

    // MECANICO tem 2 trocas
    const mecanico = empresa.get('MECANICO')!;
    expect(mecanico.trocas).toHaveLength(2);
  });

  it('agrupa corretamente múltiplas empresas', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'ANALISTA',
        isMudancaRole: true,
        qtdFuncionarios: 2,
        qtdNovos: 0,
        qtdExistentes: 2,
        niveisAtuais: ['gestao'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [
          { nomeMascarado: 'X. Y.', funcaoAnterior: 'ESTAGIARIO', nivelAtual: 'gestao', empresa: 'ACME LTDA' },
          { nomeMascarado: 'Z. W.', funcaoAnterior: 'JUNIOR', nivelAtual: 'gestao', empresa: 'HOUSE HOSPITALAR' },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);

    // Deve ter 2 empresas
    expect(result.size).toBe(2);

    // Cada empresa tem 1 função
    const acme = result.get('ACME LTDA')!;
    const house = result.get('HOUSE HOSPITALAR')!;

    expect(acme.size).toBe(1);
    expect(house.size).toBe(1);

    // ANALISTA em ACME tem 1 troca
    expect(acme.get('ANALISTA')!.trocas).toHaveLength(1);
    // ANALISTA em HOUSE tem 1 troca
    expect(house.get('ANALISTA')!.trocas).toHaveLength(1);
  });
});

// ===========================================================================
// 2. Tratamento de empresa vazia ou undefined
// ===========================================================================

describe('groupMudancasByEmpresaAndFuncao — empresa vazia/undefined', () => {
  it('agrupa com fallback "(sem empresa)" quando empresa é empty string', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'OPERADOR',
        isMudancaRole: true,
        qtdFuncionarios: 1,
        qtdNovos: 0,
        qtdExistentes: 1,
        niveisAtuais: ['operacional'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [
          { nomeMascarado: 'P. Q.', funcaoAnterior: 'ASSISTENTE', nivelAtual: 'operacional', empresa: '' },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);

    expect(result.has('(sem empresa)')).toBe(true);
    expect(result.get('(sem empresa)')!.get('OPERADOR')!.trocas).toHaveLength(1);
  });

  it('preserva ordem de empresas conforme aparecem', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'ZEBRA',
        isMudancaRole: true,
        qtdFuncionarios: 1,
        qtdNovos: 0,
        qtdExistentes: 1,
        niveisAtuais: ['operacional'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [
          { nomeMascarado: 'Z. A.', funcaoAnterior: 'OLD', nivelAtual: 'operacional', empresa: 'Zebra Ltda' },
        ],
      },
      {
        funcao: 'ALFA',
        isMudancaRole: true,
        qtdFuncionarios: 1,
        qtdNovos: 0,
        qtdExistentes: 1,
        niveisAtuais: ['gestao'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [
          { nomeMascarado: 'A. B.', funcaoAnterior: 'OLD', nivelAtual: 'gestao', empresa: 'Alfa Corp' },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);

    // Map mantém ordem de inserção
    const empresas = Array.from(result.keys());
    expect(empresas).toEqual(['Zebra Ltda', 'Alfa Corp']); // not sortedalphabetically
  });
});

// ===========================================================================
// 3. Filtros e exclusões
// ===========================================================================

describe('groupMudancasByEmpresaAndFuncao — filtros', () => {
  it('ignora funções sem isMudancaRole=true', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'IGNORADA',
        isMudancaRole: false,
        qtdFuncionarios: 2,
        qtdNovos: 0,
        qtdExistentes: 2,
        niveisAtuais: ['operacional'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [
          { nomeMascarado: 'I. G.', funcaoAnterior: 'OLD', nivelAtual: 'operacional', empresa: 'ABC' },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);

    expect(result.size).toBe(0);
  });

  it('ignora funções com funcionariosComMudanca vazio', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'VAZIA',
        isMudancaRole: true,
        qtdFuncionarios: 0,
        qtdNovos: 0,
        qtdExistentes: 0,
        niveisAtuais: [],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);

    expect(result.size).toBe(0);
  });
});

// ===========================================================================
// 4. Nível atual synthesis
// ===========================================================================

describe('groupMudancasByEmpresaAndFuncao — nivelAtual synthesis', () => {
  it('sintetiza nivelAtual como "gestao / operacional" quando múltiplos', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'MISTO',
        isMudancaRole: true,
        qtdFuncionarios: 2,
        qtdNovos: 0,
        qtdExistentes: 2,
        niveisAtuais: ['gestao', 'operacional', null],
        temNivelNuloExistente: true,
        funcionariosComMudanca: [
          { nomeMascarado: 'M. 1.', funcaoAnterior: 'OLD', nivelAtual: 'gestao', empresa: 'EMP' },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);
    const misto = result.get('EMP')!.get('MISTO')!;

    expect(misto.nivelAtual).toBe('gestao / operacional'); // null filtrado
  });

  it('sintetiza nivelAtual como "não definido" quando só null', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'NULO',
        isMudancaRole: true,
        qtdFuncionarios: 1,
        qtdNovos: 0,
        qtdExistentes: 1,
        niveisAtuais: [null],
        temNivelNuloExistente: true,
        funcionariosComMudanca: [
          { nomeMascarado: 'N. U.', funcaoAnterior: 'OLD', nivelAtual: null, empresa: 'EMP' },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);
    const nulo = result.get('EMP')!.get('NULO')!;

    expect(nulo.nivelAtual).toBe('não definido');
  });
});

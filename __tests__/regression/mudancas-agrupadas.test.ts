/**
 * Testes para a logica pura de groupMudancasByEmpresaAndFuncao.
 * Replica a funcao helper do NivelCargoStep para testes isolados.
 */

import type { FuncaoNivelInfo } from '@/components/importacao/NivelCargoStep';

// replica da nova implementacao (sem nivelAtual, com trocasNivel)
type TrocaInfo = NonNullable<FuncaoNivelInfo['funcionariosComMudanca']>[0];
type TrocaNivelInfo = NonNullable<FuncaoNivelInfo['funcionariosComMudancaNivel']>[0];

interface GrupoFuncao {
  trocas: TrocaInfo[];
  trocasNivel: TrocaNivelInfo[];
}

function groupMudancasByEmpresaAndFuncao(
  funcoesNivelInfo: FuncaoNivelInfo[]
): Map<string, Map<string, GrupoFuncao>> {
  const grouped = new Map<string, Map<string, GrupoFuncao>>();

  for (const funcaoInfo of funcoesNivelInfo) {
    const hasMudancaRole =
      funcaoInfo.isMudancaRole &&
      (funcaoInfo.funcionariosComMudanca?.length ?? 0) > 0;
    const hasMudancaNivel =
      funcaoInfo.isMudancaNivel &&
      (funcaoInfo.funcionariosComMudancaNivel?.length ?? 0) > 0;

    if (!hasMudancaRole && !hasMudancaNivel) continue;

    if (hasMudancaRole) {
      for (const troca of funcaoInfo.funcionariosComMudanca!) {
        const empresa = troca.empresa || '(sem empresa)';
        if (!grouped.has(empresa)) grouped.set(empresa, new Map());
        const empresaMap = grouped.get(empresa)!;
        if (!empresaMap.has(funcaoInfo.funcao)) {
          empresaMap.set(funcaoInfo.funcao, { trocas: [], trocasNivel: [] });
        }
        empresaMap.get(funcaoInfo.funcao)!.trocas.push(troca);
      }
    }

    if (hasMudancaNivel) {
      for (const troca of funcaoInfo.funcionariosComMudancaNivel!) {
        const empresa = troca.empresa || '(sem empresa)';
        if (!grouped.has(empresa)) grouped.set(empresa, new Map());
        const empresaMap = grouped.get(empresa)!;
        if (!empresaMap.has(funcaoInfo.funcao)) {
          empresaMap.set(funcaoInfo.funcao, { trocas: [], trocasNivel: [] });
        }
        empresaMap.get(funcaoInfo.funcao)!.trocasNivel.push(troca);
      }
    }
  }

  return grouped;
}

// ===========================================================================
// 1. Agrupamento basico — isMudancaRole
// ===========================================================================

describe('groupMudancasByEmpresaAndFuncao — agrupamento basico', () => {
  it('retorna Map vazio quando nao ha mudancas', () => {
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
    expect(groupMudancasByEmpresaAndFuncao(funcs).size).toBe(0);
  });

  it('agrupa corretamente 1 empresa, 2 funcoes, multiplas trocas', () => {
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
    expect(result.size).toBe(1);

    const empresa = result.get('Escola Primavera')!;
    expect(empresa.size).toBe(2);

    expect(empresa.get('PROFESSOR')!.trocas).toHaveLength(3);
    expect(empresa.get('PROFESSOR')!.trocasNivel).toHaveLength(0);
    expect(empresa.get('MECANICO')!.trocas).toHaveLength(2);
  });

  it('agrupa corretamente multiplas empresas', () => {
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
    expect(result.size).toBe(2);
    expect(result.get('ACME LTDA')!.get('ANALISTA')!.trocas).toHaveLength(1);
    expect(result.get('HOUSE HOSPITALAR')!.get('ANALISTA')!.trocas).toHaveLength(1);
  });
});

// ===========================================================================
// 2. Tratamento de empresa vazia
// ===========================================================================

describe('groupMudancasByEmpresaAndFuncao — empresa vazia/undefined', () => {
  it('usa fallback "(sem empresa)" quando empresa e empty string', () => {
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

  it('preserva ordem de insercao das empresas', () => {
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

    const empresas = Array.from(groupMudancasByEmpresaAndFuncao(funcs).keys());
    expect(empresas).toEqual(['Zebra Ltda', 'Alfa Corp']);
  });
});

// ===========================================================================
// 3. Filtros — isMudancaRole e isMudancaNivel
// ===========================================================================

describe('groupMudancasByEmpresaAndFuncao — filtros', () => {
  it('ignora funcoes sem isMudancaRole e sem isMudancaNivel', () => {
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
    expect(groupMudancasByEmpresaAndFuncao(funcs).size).toBe(0);
  });

  it('ignora funcoes com funcionariosComMudanca vazio', () => {
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
    expect(groupMudancasByEmpresaAndFuncao(funcs).size).toBe(0);
  });

  it('inclui funcao com apenas isMudancaNivel (sem isMudancaRole)', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'CARGO_NIVEL',
        isMudancaRole: false,
        isMudancaNivel: true,
        qtdFuncionarios: 1,
        qtdNovos: 0,
        qtdExistentes: 1,
        niveisAtuais: ['gestao'],
        temNivelNuloExistente: false,
        funcionariosComMudancaNivel: [
          { nomeMascarado: 'F. G.', nivelAtual: 'gestao', nivelProposto: 'operacional', empresa: 'MINHA EMP' },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);
    expect(result.size).toBe(1);
    const grupo = result.get('MINHA EMP')!.get('CARGO_NIVEL')!;
    expect(grupo.trocas).toHaveLength(0);
    expect(grupo.trocasNivel).toHaveLength(1);
    expect(grupo.trocasNivel[0].nivelProposto).toBe('operacional');
  });
});

// ===========================================================================
// 4. Combinacao isMudancaRole + isMudancaNivel na mesma funcao
// ===========================================================================

describe('groupMudancasByEmpresaAndFuncao — combinacao de tipos', () => {
  it('agrupa trocas e trocasNivel separadamente para mesma funcao/empresa', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'MISTA',
        isMudancaRole: true,
        isMudancaNivel: true,
        qtdFuncionarios: 3,
        qtdNovos: 0,
        qtdExistentes: 3,
        niveisAtuais: ['gestao'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [
          { nomeMascarado: 'A. A.', funcaoAnterior: 'OLD', nivelAtual: 'gestao', empresa: 'EMP X' },
        ],
        funcionariosComMudancaNivel: [
          { nomeMascarado: 'B. B.', nivelAtual: 'gestao', nivelProposto: 'operacional', empresa: 'EMP X' },
          { nomeMascarado: 'C. C.', nivelAtual: 'operacional', nivelProposto: 'gestao', empresa: 'EMP X' },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);
    const grupo = result.get('EMP X')!.get('MISTA')!;

    expect(grupo.trocas).toHaveLength(1);
    expect(grupo.trocasNivel).toHaveLength(2);
  });
});

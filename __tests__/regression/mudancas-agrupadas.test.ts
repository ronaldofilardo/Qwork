/**
 * Testes para a logica pura de groupMudancasByEmpresaAndFuncao.
 * Usa a funcao exportada diretamente do NivelCargoStep.
 */

import {
  groupMudancasByEmpresaAndFuncao,
  type FuncaoNivelInfo,
} from '@/components/importacao/NivelCargoStep';

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
          {
            nome: 'João Silva',
            funcaoAnterior: 'AUXILIAR',
            nivelAtual: 'operacional',
            empresa: 'Escola Primavera',
          },
          {
            nome: 'Maria Oliveira',
            funcaoAnterior: 'OPERADOR',
            nivelAtual: null,
            empresa: 'Escola Primavera',
          },
          {
            nome: 'Roberto Pereira',
            funcaoAnterior: 'TECH',
            nivelAtual: 'gestao',
            empresa: 'Escola Primavera',
          },
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
          {
            nome: 'André Borges',
            funcaoAnterior: 'ASSISTENTE',
            nivelAtual: 'operacional',
            empresa: 'Escola Primavera',
          },
          {
            nome: 'Carlos Dias',
            funcaoAnterior: 'GERENTE',
            nivelAtual: 'gestao',
            empresa: 'Escola Primavera',
          },
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
          {
            nome: 'Xavier Yamamoto',
            funcaoAnterior: 'ESTAGIARIO',
            nivelAtual: 'gestao',
            empresa: 'ACME LTDA',
          },
          {
            nome: 'Zara Wanderley',
            funcaoAnterior: 'JUNIOR',
            nivelAtual: 'gestao',
            empresa: 'HOUSE HOSPITALAR',
          },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);
    expect(result.size).toBe(2);
    expect(result.get('ACME LTDA')!.get('ANALISTA')!.trocas).toHaveLength(1);
    expect(
      result.get('HOUSE HOSPITALAR')!.get('ANALISTA')!.trocas
    ).toHaveLength(1);
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
          {
            nome: 'Paulo Queiroz',
            funcaoAnterior: 'ASSISTENTE',
            nivelAtual: 'operacional',
            empresa: '',
          },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);
    expect(result.has('(sem empresa)')).toBe(true);
    expect(result.get('(sem empresa)')!.get('OPERADOR')!.trocas).toHaveLength(
      1
    );
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
          {
            nome: 'Zumbi Andrade',
            funcaoAnterior: 'OLD',
            nivelAtual: 'operacional',
            empresa: 'Zebra Ltda',
          },
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
          {
            nome: 'Amara Brito',
            funcaoAnterior: 'OLD',
            nivelAtual: 'gestao',
            empresa: 'Alfa Corp',
          },
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
          {
            nome: 'Igor Gonçalves',
            funcaoAnterior: 'OLD',
            nivelAtual: 'operacional',
            empresa: 'ABC',
          },
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
          {
            nome: 'Flávia Guimarães',
            nivelAtual: 'gestao',
            nivelProposto: 'operacional',
            empresa: 'MINHA EMP',
          },
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
          {
            nome: 'Amanda Alves',
            funcaoAnterior: 'OLD',
            nivelAtual: 'gestao',
            empresa: 'EMP X',
          },
        ],
        funcionariosComMudancaNivel: [
          {
            nome: 'Bruno Barbosa',
            nivelAtual: 'gestao',
            nivelProposto: 'operacional',
            empresa: 'EMP X',
          },
          {
            nome: 'Carla Castro',
            nivelAtual: 'operacional',
            nivelProposto: 'gestao',
            empresa: 'EMP X',
          },
        ],
      },
    ];

    const result = groupMudancasByEmpresaAndFuncao(funcs);
    const grupo = result.get('EMP X')!.get('MISTA')!;

    expect(grupo.trocas).toHaveLength(1);
    expect(grupo.trocasNivel).toHaveLength(2);
  });
});

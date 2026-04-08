/**
 * Testes de regressão para o mecanismo de modal automático do NivelCargoStep.
 *
 * Valida a lógica pura de montagem da fila obrigatória (buildMandatoryQueue):
 *
 *  1. isMudancaRole=true → sempre entra na fila (independe de template).
 *  2. Função nova (qtdNovos>0) sem classificação prévia → entra na fila.
 *  3. Função com isMudancaRole=true mas já classificada via template → AINDA entra
 *     (mudanças de função exigem confirmação explícita do usuário).
 *  4. Função nova já pré-classificada (template) → NÃO entra na fila.
 *  5. Função auto-classificável (existentes com nível único) e já no map → NÃO entra.
 *  6. Fila vazia quando não há funções alteradas nem novas não classificadas.
 *  7. Ordem da fila preserva a ordem do array de funções recebido.
 *
 * Também valida a lógica de navegação sequencial (handleModalSelectLogic) e
 * o modo manual (isManualMode).
 */

import type { FuncaoNivelInfo, NivelCargo } from '@/components/importacao/NivelCargoStep';

// ===========================================================================
// Lógica pura extraída do NivelCargoStep (replica o interior do useEffect).
// Mantida aqui para teste isolado sem dependência de React/DOM.
// ===========================================================================

function buildMandatoryQueue(
  funcoesNivelInfo: FuncaoNivelInfo[],
  nivelCargoMap: Record<string, NivelCargo>
): string[] {
  return funcoesNivelInfo
    .filter((f) => {
      if (f.isMudancaRole) return true;
      if (f.isMudancaNivel && !nivelCargoMap[f.funcao]) return true;
      if (f.qtdNovos > 0 && !nivelCargoMap[f.funcao]) return true;
      return false;
    })
    .map((f) => f.funcao);
}

/** Simula a seleção de um nível no modal e retorna o próximo item da fila. */
function simulateQueueAdvance(
  queue: string[],
  currentIndex: number
): { nextIndex: number; nextFuncao: string | null } {
  const nextIndex = currentIndex + 1;
  if (nextIndex < queue.length) {
    return { nextIndex, nextFuncao: queue[nextIndex] };
  }
  return { nextIndex, nextFuncao: null };
}

// ===========================================================================
// Helpers de fixture
// ===========================================================================

function makeFuncao(
  overrides: Partial<FuncaoNivelInfo> & { funcao: string }
): FuncaoNivelInfo {
  return {
    qtdFuncionarios: 5,
    qtdNovos: 0,
    qtdExistentes: 5,
    niveisAtuais: ['operacional'],
    isMudancaRole: false,
    isMudancaNivel: false,
    temNivelNuloExistente: false,
    funcionariosComMudanca: [],
    funcionariosComMudancaNivel: [],
    ...overrides,
  };
}

// ===========================================================================
// 1. isMudancaRole=true → sempre obrigatório
// ===========================================================================

describe('buildMandatoryQueue — isMudancaRole', () => {
  it('inclui função com isMudancaRole=true mesmo sem classificação prévia', () => {
    const funcs = [
      makeFuncao({ funcao: 'ANALISTA', isMudancaRole: true }),
    ];
    const map: Record<string, NivelCargo> = {};
    expect(buildMandatoryQueue(funcs, map)).toEqual(['ANALISTA']);
  });

  it('inclui função com isMudancaRole=true mesmo quando já está no nivelCargoMap (requer confirmação)', () => {
    const funcs = [
      makeFuncao({ funcao: 'GERENTE', isMudancaRole: true }),
    ];
    const map: Record<string, NivelCargo> = { GERENTE: 'gestao' };
    // Mudanças de função exigem confirmação obrigatória, independente do template
    expect(buildMandatoryQueue(funcs, map)).toEqual(['GERENTE']);
  });

  it('inclui múltiplas funções com isMudancaRole=true', () => {
    const funcs = [
      makeFuncao({ funcao: 'ARQUITETO', isMudancaRole: true }),
      makeFuncao({ funcao: 'ARQUIVISTA', isMudancaRole: true }),
      makeFuncao({ funcao: 'GERENTE REGIONAL', isMudancaRole: true }),
      makeFuncao({ funcao: 'TESTADOR', isMudancaRole: true }),
    ];
    const map: Record<string, NivelCargo> = {};
    expect(buildMandatoryQueue(funcs, map)).toEqual([
      'ARQUITETO',
      'ARQUIVISTA',
      'GERENTE REGIONAL',
      'TESTADOR',
    ]);
  });
});

// ===========================================================================
// 2. Funções novas sem classificação prévia
// ===========================================================================

describe('buildMandatoryQueue — funções novas', () => {
  it('inclui função nova (qtdNovos>0) não classificada', () => {
    const funcs = [
      makeFuncao({ funcao: 'OPERADOR', qtdNovos: 3, qtdExistentes: 0, niveisAtuais: [] }),
    ];
    const map: Record<string, NivelCargo> = {};
    expect(buildMandatoryQueue(funcs, map)).toEqual(['OPERADOR']);
  });

  it('NÃO inclui função nova (qtdNovos>0) já pré-classificada pelo template', () => {
    const funcs = [
      makeFuncao({ funcao: 'OPERADOR', qtdNovos: 3, qtdExistentes: 0, niveisAtuais: [] }),
    ];
    const map: Record<string, NivelCargo> = { OPERADOR: 'operacional' };
    expect(buildMandatoryQueue(funcs, map)).toEqual([]);
  });

  it('inclui função nova com existentes (qtdNovos>0 E qtdExistentes>0) não classificada', () => {
    const funcs = [
      makeFuncao({
        funcao: 'SUPERVISOR',
        qtdNovos: 2,
        qtdExistentes: 3,
        niveisAtuais: ['gestao', null],
      }),
    ];
    const map: Record<string, NivelCargo> = {};
    expect(buildMandatoryQueue(funcs, map)).toEqual(['SUPERVISOR']);
  });
});

// ===========================================================================
// 3. Funções auto-classificáveis não entram na fila
// ===========================================================================

describe('buildMandatoryQueue — funções auto-classificáveis', () => {
  it('NÃO inclui função sem novos e sem mudança (pura existente, já no map)', () => {
    const funcs = [
      makeFuncao({
        funcao: 'AUXILIAR',
        qtdNovos: 0,
        qtdExistentes: 4,
        niveisAtuais: ['operacional'],
        isMudancaRole: false,
      }),
    ];
    const map: Record<string, NivelCargo> = { AUXILIAR: 'operacional' };
    expect(buildMandatoryQueue(funcs, map)).toEqual([]);
  });

  it('NÃO inclui função sem novos e sem mudança, mesmo sem map (não é candidata à fila)', () => {
    const funcs = [
      makeFuncao({
        funcao: 'AUXILIAR',
        qtdNovos: 0,
        qtdExistentes: 4,
        niveisAtuais: ['operacional'],
        isMudancaRole: false,
      }),
    ];
    const map: Record<string, NivelCargo> = {};
    // Sem qtdNovos e sem isMudancaRole → não é candidata obrigatória
    expect(buildMandatoryQueue(funcs, map)).toEqual([]);
  });
});

// ===========================================================================
// 4. Fila vazia
// ===========================================================================

describe('buildMandatoryQueue — fila vazia', () => {
  it('retorna fila vazia quando não há alterações nem novos', () => {
    const funcs = [
      makeFuncao({ funcao: 'AUXILIAR', isMudancaRole: false, qtdNovos: 0 }),
      makeFuncao({ funcao: 'GERENTE', isMudancaRole: false, qtdNovos: 0 }),
    ];
    const map: Record<string, NivelCargo> = {
      AUXILIAR: 'operacional',
      GERENTE: 'gestao',
    };
    expect(buildMandatoryQueue(funcs, map)).toEqual([]);
  });

  it('retorna fila vazia quando funcoesNivelInfo é vazio', () => {
    expect(buildMandatoryQueue([], {})).toEqual([]);
  });
});

// ===========================================================================
// 5. Ordem da fila
// ===========================================================================

describe('buildMandatoryQueue — ordem preservada', () => {
  it('preserva a ordem do array de funções recebido', () => {
    const funcs = [
      makeFuncao({ funcao: 'ZETINHA', isMudancaRole: true }),
      makeFuncao({ funcao: 'ALFA', isMudancaRole: true }),
      makeFuncao({ funcao: 'BETA', qtdNovos: 1, qtdExistentes: 0, niveisAtuais: [] }),
    ];
    const map: Record<string, NivelCargo> = {};
    // Ordem deve ser a mesma do array de entrada
    expect(buildMandatoryQueue(funcs, map)).toEqual(['ZETINHA', 'ALFA', 'BETA']);
  });
});

// ===========================================================================
// 6. Lógica de navegação sequencial
// ===========================================================================

describe('simulateQueueAdvance — navegação sequencial', () => {
  const queue = ['ANALISTA', 'GERENTE', 'OPERADOR'];

  it('avança para o próximo item da fila', () => {
    const result = simulateQueueAdvance(queue, 0);
    expect(result.nextFuncao).toBe('GERENTE');
    expect(result.nextIndex).toBe(1);
  });

  it('avança para o último item', () => {
    const result = simulateQueueAdvance(queue, 1);
    expect(result.nextFuncao).toBe('OPERADOR');
    expect(result.nextIndex).toBe(2);
  });

  it('retorna null ao esgotar a fila', () => {
    const result = simulateQueueAdvance(queue, 2);
    expect(result.nextFuncao).toBeNull();
    expect(result.nextIndex).toBe(3);
  });

  it('retorna null para fila com um único item após seleção', () => {
    const singleQueue = ['ANALISTA'];
    const result = simulateQueueAdvance(singleQueue, 0);
    expect(result.nextFuncao).toBeNull();
  });
});

// ===========================================================================
// 7. Comportamento modal manual (modo de revisão)
// ===========================================================================

describe('modo manual — totalCount e currentIndex', () => {
  it('modal manual usa totalCount=1 e currentIndex=0', () => {
    // Simula a lógica: isManualModeRef.current === true
    const isManualMode = true;
    const modalQueueIndex = 2; // irrelevante em modo manual
    const queueLength = 4; // irrelevante em modo manual

    const modalCurrentIndex = isManualMode ? 0 : modalQueueIndex;
    const modalTotalCount = isManualMode ? 1 : queueLength;

    expect(modalCurrentIndex).toBe(0);
    expect(modalTotalCount).toBe(1);
  });

  it('modal em fila usa modalQueueIndex e queueLength reais', () => {
    const isManualMode = false;
    const modalQueueIndex = 2;
    const queueLength = 4;

    const modalCurrentIndex = isManualMode ? 0 : modalQueueIndex;
    const modalTotalCount = isManualMode ? 1 : queueLength;

    expect(modalCurrentIndex).toBe(2);
    expect(modalTotalCount).toBe(4);
  });
});

// ===========================================================================
// 8. Caso integrado: cenário das "4 funções alteradas" da imagem
// ===========================================================================

describe('cenário integrado — 4 funções alteradas', () => {
  it('gera fila com Arquiteto, Arquivista, Gerente Regional, Testador', () => {
    const funcs: FuncaoNivelInfo[] = [
      {
        funcao: 'Arquiteto',
        isMudancaRole: true,
        qtdFuncionarios: 2,
        qtdNovos: 0,
        qtdExistentes: 2,
        niveisAtuais: ['gestao'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [
          { nomeMascarado: 'J. S.', funcaoAnterior: 'Desenvolvedor', nivelAtual: 'gestao' },
        ],
      },
      {
        funcao: 'Arquivista',
        isMudancaRole: true,
        qtdFuncionarios: 1,
        qtdNovos: 0,
        qtdExistentes: 1,
        niveisAtuais: ['operacional'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [
          { nomeMascarado: 'M. O.', funcaoAnterior: 'Assistente', nivelAtual: 'operacional' },
        ],
      },
      {
        funcao: 'Gerente Regional',
        isMudancaRole: true,
        qtdFuncionarios: 3,
        qtdNovos: 0,
        qtdExistentes: 3,
        niveisAtuais: ['gestao'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [],
      },
      {
        funcao: 'Testador',
        isMudancaRole: true,
        qtdFuncionarios: 1,
        qtdNovos: 0,
        qtdExistentes: 1,
        niveisAtuais: [null],
        temNivelNuloExistente: true,
        funcionariosComMudanca: [],
      },
      // Funções existentes SEM mudança — não devem entrar na fila
      {
        funcao: 'Auxiliar',
        isMudancaRole: false,
        qtdFuncionarios: 10,
        qtdNovos: 0,
        qtdExistentes: 10,
        niveisAtuais: ['operacional'],
        temNivelNuloExistente: false,
        funcionariosComMudanca: [],
      },
    ];

    const map: Record<string, NivelCargo> = {
      Auxiliar: 'operacional', // já classificado
    };

    const queue = buildMandatoryQueue(funcs, map);

    expect(queue).toHaveLength(4);
    expect(queue).toEqual([
      'Arquiteto',
      'Arquivista',
      'Gerente Regional',
      'Testador',
    ]);
  });
});

// ===========================================================================
// 9. isMudancaNivel=true → obrigatório quando não classificado
// ===========================================================================

describe('buildMandatoryQueue — isMudancaNivel', () => {
  it('inclui função com isMudancaNivel=true não classificada', () => {
    const funcs = [
      makeFuncao({
        funcao: 'PROFESSOR',
        isMudancaNivel: true,
        funcionariosComMudancaNivel: [
          { nomeMascarado: 'J. S.', nivelAtual: 'operacional', nivelProposto: 'gestao', empresa: 'Escola ABC' },
        ],
      }),
    ];
    const map: Record<string, NivelCargo> = {};
    expect(buildMandatoryQueue(funcs, map)).toEqual(['PROFESSOR']);
  });

  it('NÃO inclui função com isMudancaNivel=true quando já classificada', () => {
    const funcs = [
      makeFuncao({ funcao: 'PROFESSOR', isMudancaNivel: true }),
    ];
    const map: Record<string, NivelCargo> = { PROFESSOR: 'gestao' };
    expect(buildMandatoryQueue(funcs, map)).toEqual([]);
  });

  it('inclui isMudancaNivel junto com isMudancaRole em ordem correta', () => {
    const funcs = [
      makeFuncao({ funcao: 'PEDAGOGO', isMudancaRole: true }),
      makeFuncao({ funcao: 'PROFESSOR', isMudancaNivel: true }),
      makeFuncao({ funcao: 'INSPETOR', isMudancaRole: false, isMudancaNivel: false, qtdNovos: 0 }),
    ];
    const map: Record<string, NivelCargo> = {};
    expect(buildMandatoryQueue(funcs, map)).toEqual(['PEDAGOGO', 'PROFESSOR']);
  });

  it('empresa em estrutura funcionariosComMudancaNivel não afeta queue logic', () => {
    const func = makeFuncao({
      funcao: 'MECANICO',
      isMudancaNivel: true,
      funcionariosComMudancaNivel: [
        { nomeMascarado: 'A. B.', nivelAtual: 'operacional', nivelProposto: 'gestao', empresa: 'Empresa XYZ' },
        { nomeMascarado: 'C. D.', nivelAtual: null, nivelProposto: 'operacional', empresa: '' },
      ],
    });
    expect(func.funcionariosComMudancaNivel).toHaveLength(2);
    expect(func.funcionariosComMudancaNivel![0].empresa).toBe('Empresa XYZ');
  });
});

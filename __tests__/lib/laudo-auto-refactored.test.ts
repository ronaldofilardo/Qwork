/**
 * Consolidated unit test for the refactored laudo auto logic.
 * Focuses on core behavior with minimal DB/FS/Browser interactions mocked.
 */

import { emitirLaudosAutomaticamenteParaLote } from '@/lib/laudo-auto-refactored';
import * as db from '@/lib/db';
import { uniqueCode } from '../helpers/test-data-factory';

jest.mock('@/lib/db');
jest.mock('puppeteer');
jest.mock('@/lib/laudo-calculos', () => ({
  gerarDadosGeraisEmpresa: jest
    .fn()
    .mockResolvedValue({ empresaAvaliada: 'Empresa Teste' }),
  calcularScoresPorGrupo: jest.fn().mockResolvedValue([]),
  gerarInterpretacaoRecomendacoes: jest.fn().mockReturnValue([]),
  gerarObservacoesConclusao: jest.fn().mockReturnValue({
    observacoesLaudo: 'obs',
    textoConclusao: 'concl',
    dataEmissao: new Date().toISOString(),
    assinatura: {},
  }),
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

const mockedTransaction = db.transaction as unknown as jest.MockedFunction<any>;

describe('laudo-auto-refactored (consolidated)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emite laudo para lote concluído (fluxo principal)', async () => {
    // Implementar um transaction mock que fornece respostas esperadas
    mockedTransaction.mockImplementation(async (runner: Function) => {
      const codigo = uniqueCode('AUTO');
      const tx = {
        query: jest.fn().mockImplementation((sql: string) => {
          if (sql.includes('FROM lotes_avaliacao')) {
            return Promise.resolve({
              rows: [
                {
                  id: 1,
                  status: 'concluido',
                  codigo: codigo,
                  clinica_id: 1,
                  empresa_id: null,
                },
              ],
              rowCount: 1,
            });
          }
          if (sql.includes('FROM laudos WHERE lote_id')) {
            return Promise.resolve({ rows: [], rowCount: 0 });
          }
          if (
            sql
              .trim()
              .toUpperCase()
              .startsWith('INSERT INTO laudos'.toUpperCase())
          ) {
            return Promise.resolve({ rows: [{ id: 999 }], rowCount: 1 });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }),
      };
      return runner(tx);
    });

    const result = await emitirLaudosAutomaticamenteParaLote(1, 'sistema');

    expect(result).toBe(999);
    expect(mockedTransaction).toHaveBeenCalled();
  });
});

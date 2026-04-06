/**
 * Testes para Demanda 2: Remoção de Logs (Questões 2-36)
 * Garante que logs intermediários sejam removidos, mantendo apenas conclusão final
 * 
 * Contexto: Para evitar sobrecarga do servidor, remover logs verbosos das questões 2-36
 * Mantendo apenas logs de conclusão quando atinge 37 respostas
 */

jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
  transactionWithContext: jest.fn(async (fn) => fn(jest.fn())),
}));

jest.mock('@/lib/lotes', () => ({
  recalcularStatusLote: jest.fn(),
}));

jest.mock('@/lib/calculate', () => ({
  calcularResultados: jest.fn(() => []),
}));

import { queryWithContext, transactionWithContext } from '@/lib/db-security';
import { verificarEConcluirAvaliacao } from '@/lib/avaliacao-conclusao';

const mockQueryWithContext = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;
const mockTransactionWithContext = transactionWithContext as jest.MockedFunction<
  typeof transactionWithContext
>;

describe('Demanda 2: Remoção de Logs de Questões 2-36', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock padrão para queryWithContext
    mockQueryWithContext.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Fase 1: Sem logs para totalRespostas < 37 (Questões 2-36)', () => {
    it('não deve fazer console.log quando totalRespostas está entre 2 e 36', async () => {
      // Simular totalRespostas = 10 (questões 2-36)
      mockQueryWithContext.mockResolvedValueOnce({
        rows: [{ total: '10' }],
        rowCount: 1,
      });

      await verificarEConcluirAvaliacao(1, '12345678901');

      // Verificar que NÃO houve logs [AUTO-CONCLUSÃO] para respostas intermediárias
      const autoConclausaoLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.toString().includes('[AUTO-CONCLUSÃO]')
      );

      expect(autoConclausaoLogs.length).toBe(0);
    });

    it('não deve fazer console.log quando totalRespostas = 1 (primeira questão)', async () => {
      mockQueryWithContext.mockResolvedValueOnce({
        rows: [{ total: '1' }],
        rowCount: 1,
      });

      await verificarEConcluirAvaliacao(1, '12345678901');

      const autoConclausaoLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.toString().includes('[AUTO-CONCLUSÃO]')
      );

      expect(autoConclausaoLogs.length).toBe(0);
    });

    it('não deve fazer console.log de "tem X respostas únicas" para intermediários', async () => {
      mockQueryWithContext.mockResolvedValueOnce({
        rows: [{ total: '25' }],
        rowCount: 1,
      });

      await verificarEConcluirAvaliacao(1, '12345678901');

      // Verificar que NÃO há log de contagem intermediária
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('tem 25 respostas únicas')
      );
    });
  });

  describe('Fase 2: Log apenas na conclusão final (totalRespostas = 37)', () => {
    it('deve fazer console.log de conclusão quando totalRespostas = 37', async () => {
      // Simular sequência de queries para totalRespostas = 37
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ total: '37' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            { lote_id: 1, numero_ordem: 1 },
          ],
          rowCount: 1,
        });

      // Setup para transactionWithContext
      mockTransactionWithContext.mockImplementation(async (fn) => {
        const mockQueryTx = jest.fn();
        mockQueryTx
          .mockResolvedValueOnce({ rows: [{ grupo: 1, item: 'Q1', valor: 5 }], rowCount: 1 })
          .mockResolvedValue({ rows: [], rowCount: 0 });
        await fn(mockQueryTx);
      });

      await verificarEConcluirAvaliacao(1, '12345678901');

      // Verificar que houve logs de conclusão final
      const conclusaoLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.toString().includes('[AUTO-CONCLUSÃO]')
      );

      expect(conclusaoLogs.length).toBeGreaterThan(0);
    });

    it('deve manter log de conclusão "concluída com sucesso" final', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ total: '37' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

      mockTransactionWithContext.mockImplementation(async (fn) => {
        const mockQueryTx = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
        await fn(mockQueryTx);
      });

      await verificarEConcluirAvaliacao(1, '12345678901');

      // Verificar que há log de conclusão com sucesso
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('concluída com sucesso')
      );
    });

    it('deve manter log de resultados calculados', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ total: '37' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

      mockTransactionWithContext.mockImplementation(async (fn) => {
        const mockQueryTx = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
        await fn(mockQueryTx);
      });

      await verificarEConcluirAvaliacao(1, '12345678901');

      // Verificar que há log de resultados
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Resultados calculados e salvos')
      );
    });
  });

  describe('Fase 3: Logs removidos (não devem aparecer)', () => {
    it('não deve fazer log "Funcionário atualizado | Lote X será recalculado"', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ total: '37' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

      mockTransactionWithContext.mockImplementation(async (fn) => {
        const mockQueryTx = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
        await fn(mockQueryTx);
      });

      await verificarEConcluirAvaliacao(1, '12345678901');

      // Verificar que NÃO há log de "Funcionário atualizado"
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Funcionário atualizado')
      );
    });

    it('não deve fazer log "Lote X recalculado" (intermediário)', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ total: '37' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

      mockTransactionWithContext.mockImplementation(async (fn) => {
        const mockQueryTx = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
        await fn(mockQueryTx);
      });

      await verificarEConcluirAvaliacao(1, '12345678901');

      // Verificar que NÃO há log de "Lote X recalculado"
      const loteLogs = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.toString().includes('recalculado')
      );
      expect(loteLogs.length).toBe(0);
    });

    it('não deve fazer console.error silencioso para erros de resultado', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ total: '37' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status: 'em_andamento' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ lote_id: 1 }],
          rowCount: 1,
        });

      mockTransactionWithContext.mockImplementation(async (fn) => {
        const mockQueryTx = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
        await fn(mockQueryTx);
      });

      await verificarEConcluirAvaliacao(1, '12345678901');

      // Verificar que NÃO há console.error de erro ao calcular resultados
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Erro ao calcular resultados')
      );
    });
  });

  describe('Fase 4: Idempotência (logs ainda aparecem para status já concluído)', () => {
    it('deve retornar concluida=true quando avaliação já está concluída', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ total: '37' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status: 'concluida' }],
          rowCount: 1,
        });

      const result = await verificarEConcluirAvaliacao(1, '12345678901');

      // Deve retornar concluida=true (idempotência)
      expect(result.concluida).toBe(true);
    });

    it('deve retornar concluida=false quando avaliação está inativada', async () => {
      mockQueryWithContext
        .mockResolvedValueOnce({
          rows: [{ total: '37' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ status: 'inativada' }],
          rowCount: 1,
        });

      const result = await verificarEConcluirAvaliacao(1, '12345678901');

      // Deve retornar concluida=false quando inativada
      expect(result.concluida).toBe(false);
    });
  });
});

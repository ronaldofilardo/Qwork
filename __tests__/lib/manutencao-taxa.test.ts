/**
 * @fileoverview Testes unitários para lib/manutencao-taxa.ts
 * @description Testa funções auxiliares de taxa de manutenção
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { query } from '@/lib/db';
import {
  VALOR_TAXA_MANUTENCAO,
  buscarEntidadesPendentesManutencao,
  buscarEmpresasPendentesManutencao,
  entidadeTemLaudoEmitido,
  buscarDadosManutencaoEntidade,
  buscarDadosManutencaoClinica,
} from '@/lib/manutencao-taxa';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('lib/manutencao-taxa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('VALOR_TAXA_MANUTENCAO', () => {
    it('deve ser R$250', () => {
      expect(VALOR_TAXA_MANUTENCAO).toBe(250);
    });
  });

  describe('buscarEntidadesPendentesManutencao', () => {
    it('deve mapear linhas corretamente', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Entidade A',
            cnpj: '00.000.000/0001-00',
            limite_cobranca: '2026-01-01',
            dias_vencidos: 10,
          },
        ],
        rowCount: 1,
      } as any);

      const result = await buscarEntidadesPendentesManutencao();

      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('entidade');
      expect(result[0].id).toBe(1);
      expect(result[0].valor).toBe(250);
      expect(result[0].clinica_id).toBeNull();
      expect(result[0].dias_vencidos).toBe(10);
    });

    it('deve retornar lista vazia quando não há registros', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await buscarEntidadesPendentesManutencao();
      expect(result).toHaveLength(0);
    });

    it('deve garantir dias_vencidos mínimo de 0', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Ent',
            cnpj: '00',
            limite_cobranca: '',
            dias_vencidos: -5,
          },
        ],
        rowCount: 1,
      } as any);

      const result = await buscarEntidadesPendentesManutencao();
      expect(result[0].dias_vencidos).toBe(0);
    });
  });

  describe('buscarEmpresasPendentesManutencao', () => {
    it('deve mapear linhas com clinica corretamente', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            nome: 'Empresa B',
            cnpj: '11.111.111/0001-11',
            clinica_id: 5,
            clinica_nome: 'Clínica X',
            limite_cobranca: '2026-02-01',
            dias_vencidos: 5,
          },
        ],
        rowCount: 1,
      } as any);

      const result = await buscarEmpresasPendentesManutencao();

      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('empresa_clinica');
      expect(result[0].clinica_id).toBe(5);
      expect(result[0].clinica_nome).toBe('Clínica X');
    });
  });

  describe('entidadeTemLaudoEmitido', () => {
    it('deve retornar true quando há laudo emitido', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ 1: 1 }], rowCount: 1 } as any);
      const result = await entidadeTemLaudoEmitido(1);
      expect(result).toBe(true);
    });

    it('deve retornar false quando não há laudo', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const result = await entidadeTemLaudoEmitido(1);
      expect(result).toBe(false);
    });
  });

  describe('buscarDadosManutencaoEntidade', () => {
    it('deve retornar null se entidade não existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const result = await buscarDadosManutencaoEntidade(999);
      expect(result).toBeNull();
    });

    it('deve retornar null se limite_primeira_cobranca_manutencao é null', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            limite_primeira_cobranca_manutencao: null,
            manutencao_ja_cobrada: false,
            dias_restantes: null,
          },
        ],
        rowCount: 1,
      } as any);
      const result = await buscarDadosManutencaoEntidade(1);
      expect(result).toBeNull();
    });

    it('deve retornar dados com vencida=true quando dias_restantes < 0', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              limite_primeira_cobranca_manutencao: '2026-01-01',
              manutencao_ja_cobrada: false,
              dias_restantes: -10,
            },
          ],
          rowCount: 1,
        } as any) // entidade query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // sem laudo

      const result = await buscarDadosManutencaoEntidade(1);
      expect(result).not.toBeNull();
      expect(result!.vencida).toBe(true);
      expect(result!.laudo_emitido).toBe(false);
    });

    it('deve retornar dados com laudo_emitido=true quando há laudo', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              limite_primeira_cobranca_manutencao: '2026-06-01',
              manutencao_ja_cobrada: false,
              dias_restantes: 30,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [{ 1: 1 }], rowCount: 1 } as any); // laudo exists

      const result = await buscarDadosManutencaoEntidade(1);
      expect(result!.laudo_emitido).toBe(true);
      expect(result!.vencida).toBe(false);
    });
  });

  describe('buscarDadosManutencaoClinica', () => {
    it('deve retornar array de empresas com situação', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            empresa_id: 2,
            empresa_nome: 'Empresa B',
            limite_primeira_cobranca_manutencao: '2026-01-01',
            manutencao_ja_cobrada: false,
            dias_restantes: -5,
            laudo_emitido: false,
          },
        ],
        rowCount: 1,
      } as any);

      const result = await buscarDadosManutencaoClinica(5);

      expect(result).toHaveLength(1);
      expect(result[0].empresa_id).toBe(2);
      expect(result[0].vencida).toBe(true);
      expect(result[0].laudo_emitido).toBe(false);
      expect(result[0].ja_cobrada).toBe(false);
    });

    it('deve retornar array vazio quando clínica não tem empresas', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const result = await buscarDadosManutencaoClinica(99);
      expect(result).toHaveLength(0);
    });
  });
});

import {
  getFuncionariosPorLote,
  getLoteInfo,
  getLoteEstatisticas,
} from '@/lib/queries';
import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('lib/queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFuncionariosPorLote', () => {
    it('deve retornar lista de funcionários de um lote', async () => {
      const mockFuncionarios = [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          matricula: '001',
          nivel_cargo: 'operacional',
          turno: 'Diurno',
          escala: '8h',
          avaliacao_id: 1,
          status_avaliacao: 'concluida',
          data_conclusao: '2025-12-01T10:00:00',
          data_inicio: '2025-11-28T08:00:00',
        },
        {
          cpf: '98765432109',
          nome: 'Maria Santos',
          setor: 'RH',
          funcao: 'Analista',
          matricula: '002',
          nivel_cargo: 'gestao',
          turno: 'Diurno',
          escala: '8h',
          avaliacao_id: 2,
          status_avaliacao: 'em_andamento',
          data_conclusao: null,
          data_inicio: '2025-11-28T08:00:00',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockFuncionarios,
        rowCount: 2,
      } as any);

      const result = await getFuncionariosPorLote(1, 100, 10);

      expect(result).toEqual(mockFuncionarios);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1, 100, 10]
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM vw_funcionarios_por_lote'),
        expect.any(Array)
      );
      // Query agora usa view vw_funcionarios_por_lote ao invés de JOIN
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('vw_funcionarios_por_lote'),
        expect.any(Array)
      );
    });

    it('deve retornar array vazio quando não há funcionários no lote', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await getFuncionariosPorLote(999, 100, 10);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('deve ordenar funcionários por nome', async () => {
      const mockFuncionarios = [
        { nome: 'Ana', cpf: '111' },
        { nome: 'Bruno', cpf: '222' },
        { nome: 'Carlos', cpf: '333' },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockFuncionarios,
        rowCount: 3,
      } as any);

      await getFuncionariosPorLote(1, 100, 10);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY nome ASC'),
        expect.any(Array)
      );
    });

    it('deve filtrar por lote_id, empresa_id e clinica_id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await getFuncionariosPorLote(5, 200, 20);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE lote_id = $1'),
        [5, 200, 20]
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND empresa_id = $2'),
        expect.any(Array)
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND clinica_id = $3'),
        expect.any(Array)
      );
    });
  });

  describe('getLoteInfo', () => {
    it('deve retornar informações completas do lote', async () => {
      const mockLote = {
        id: 1,
        codigo: 'LOT-001',
        titulo: 'Lote Teste',
        descricao: 'Descrição do lote',
        tipo: 'completo',
        status: 'ativo',
        liberado_em: '2025-11-20T10:00:00',
        liberado_por: '12345678901',
        liberado_por_nome: 'Admin Silva',
        empresa_id: 100,
        empresa_nome: 'Empresa Teste',
        emitido_em: null,
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockLote], rowCount: 1 } as any);

      const result = await getLoteInfo(1, 100, 10);

      expect(result).toEqual(mockLote);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM lotes_avaliacao la'),
        [1, 100, 10]
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          'JOIN empresas_clientes ec ON la.empresa_id = ec.id'
        ),
        expect.any(Array)
      );
    });

    it('deve retornar null quando lote não existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await getLoteInfo(999, 100, 10);

      expect(result).toBeNull();
    });

    it('deve filtrar lotes cancelados', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await getLoteInfo(1, 100, 10);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND la.status != 'cancelado'"),
        expect.any(Array)
      );
    });

    it('deve validar permissões de clínica', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await getLoteInfo(1, 100, 10);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND ec.clinica_id = $3'),
        [1, 100, 10]
      );
    });
  });

  describe('getLoteEstatisticas', () => {
    it('deve retornar estatísticas completas do lote', async () => {
      const mockStats = {
        total_avaliacoes: '10',
        avaliacoes_concluidas: '7',
        avaliacoes_inativadas: '1',
        avaliacoes_pendentes: '2',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockStats],
        rowCount: 1,
      } as any);

      const result = await getLoteEstatisticas(1);

      expect(result).toEqual(mockStats);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(a.id) as total_avaliacoes'),
        [1]
      );
    });

    it('deve contar avaliações concluídas corretamente', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_avaliacoes: '5',
            avaliacoes_concluidas: '3',
            avaliacoes_inativadas: '0',
            avaliacoes_pendentes: '2',
          },
        ],
        rowCount: 1,
      } as any);

      await getLoteEstatisticas(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)"
        ),
        [1]
      );
    });

    it('deve contar avaliações inativadas corretamente', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_avaliacoes: '5',
            avaliacoes_concluidas: '3',
            avaliacoes_inativadas: '1',
            avaliacoes_pendentes: '1',
          },
        ],
        rowCount: 1,
      } as any);

      await getLoteEstatisticas(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "COUNT(CASE WHEN a.status = 'inativada' THEN 1 END)"
        ),
        [1]
      );
    });

    it('deve contar avaliações pendentes (iniciada ou em_andamento)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_avaliacoes: '5',
            avaliacoes_concluidas: '2',
            avaliacoes_inativadas: '0',
            avaliacoes_pendentes: '3',
          },
        ],
        rowCount: 1,
      } as any);

      await getLoteEstatisticas(1);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "COUNT(CASE WHEN a.status = 'iniciada' OR a.status = 'em_andamento' THEN 1 END)"
        ),
        [1]
      );
    });

    it('deve retornar zeros quando lote não tem avaliações', async () => {
      const mockEmptyStats = {
        total_avaliacoes: '0',
        avaliacoes_concluidas: '0',
        avaliacoes_inativadas: '0',
        avaliacoes_pendentes: '0',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockEmptyStats],
        rowCount: 1,
      } as any);

      const result = await getLoteEstatisticas(999);

      expect(result.total_avaliacoes).toBe('0');
      expect(result.avaliacoes_concluidas).toBe('0');
      expect(result.avaliacoes_inativadas).toBe('0');
      expect(result.avaliacoes_pendentes).toBe('0');
    });
  });
});

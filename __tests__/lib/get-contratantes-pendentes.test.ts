/**
 * Testes para função getContratantesPendentes
 * - Inclusão de status 'aguardando_pagamento'
 */

import { getContratantesPendentes, query } from '@/lib/db';

// Mocks
jest.mock('@/lib/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('getContratantesPendentes', () => {
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSession = {
      cpf: '12345678901',
      perfil: 'admin',
      nome: 'Admin Teste',
    };
  });

  describe('Sem filtro de tipo', () => {
    it('deve incluir todos os status pendentes: pendente, em_reanalise, aguardando_pagamento', async () => {
      const mockContratantes = [
        {
          id: 1,
          nome: 'Clínica Pendente',
          status: 'pendente',
          tipo: 'clinica',
          plano_tipo: 'fixo',
          plano_nome: 'Plano Fixo',
        },
        {
          id: 2,
          nome: 'Empresa Reanálise',
          status: 'em_reanalise',
          tipo: 'entidade',
          plano_tipo: 'personalizado',
          plano_nome: 'Plano Personalizado',
        },
        {
          id: 3,
          nome: 'Clínica Aguardando',
          status: 'aguardando_pagamento',
          tipo: 'clinica',
          plano_tipo: 'fixo',
          plano_nome: 'Plano Fixo',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockContratantes,
        rowCount: 3,
      });

      const result = await getContratantesPendentes(undefined, mockSession);

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockContratantes);

      // Verifica que a query inclui todos os três status
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('status IN ($1, $2, $3)'),
        ['pendente', 'em_reanalise', 'aguardando_pagamento'],
        mockSession
      );
    });

    it('deve ordenar por tipo e data de criação', async () => {
      const mockContratantes = [
        {
          id: 1,
          nome: 'Clínica 1',
          status: 'pendente',
          tipo: 'clinica',
          criado_em: '2025-01-01',
        },
        {
          id: 2,
          nome: 'Empresa 1',
          status: 'aguardando_pagamento',
          tipo: 'entidade',
          criado_em: '2025-01-02',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockContratantes,
        rowCount: 2,
      });

      await getContratantesPendentes(undefined, mockSession);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY c.tipo, c.criado_em DESC'),
        expect.any(Array),
        mockSession
      );
    });
  });

  describe('Com filtro de tipo', () => {
    it('deve filtrar por tipo clinica', async () => {
      const mockContratantes = [
        {
          id: 1,
          nome: 'Clínica Pendente',
          status: 'pendente',
          tipo: 'clinica',
        },
        {
          id: 3,
          nome: 'Clínica Aguardando',
          status: 'aguardando_pagamento',
          tipo: 'clinica',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockContratantes,
        rowCount: 2,
      });

      const result = await getContratantesPendentes('clinica', mockSession);

      expect(result).toHaveLength(2);
      expect(result.every((c) => c.tipo === 'clinica')).toBe(true);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('status IN ($1, $2, $3) AND c.tipo = $4'),
        ['pendente', 'em_reanalise', 'aguardando_pagamento', 'clinica'],
        mockSession
      );
    });

    it('deve filtrar por tipo entidade', async () => {
      const mockContratantes = [
        {
          id: 2,
          nome: 'Empresa Reanálise',
          status: 'em_reanalise',
          tipo: 'entidade',
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockContratantes,
        rowCount: 1,
      });

      const result = await getContratantesPendentes('entidade', mockSession);

      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('entidade');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('status IN ($1, $2, $3) AND c.tipo = $4'),
        ['pendente', 'em_reanalise', 'aguardando_pagamento', 'entidade'],
        mockSession
      );
    });
  });

  describe('Estrutura da query', () => {
    it('deve incluir campos de plano na query', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      await getContratantesPendentes(undefined, mockSession);

      const queryCall = mockQuery.mock.calls[0][0];
      expect(queryCall).toContain('p.tipo as plano_tipo');
      expect(queryCall).toContain('p.nome as plano_nome');
      expect(queryCall).toContain('LEFT JOIN planos p ON c.plano_id = p.id');
    });

    it('deve usar RLS com sessão quando fornecida', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      await getContratantesPendentes(undefined, mockSession);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        mockSession
      );
    });
  });

  describe('Casos especiais', () => {
    it('deve retornar array vazio quando não há contratantes pendentes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await getContratantesPendentes(undefined, mockSession);

      expect(result).toEqual([]);
    });

    it('deve lidar com erro na query', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Erro de banco de dados'));

      await expect(
        getContratantesPendentes(undefined, mockSession)
      ).rejects.toThrow('Erro de banco de dados');
    });
  });
});

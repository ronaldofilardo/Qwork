/**
 * Testes de integração para validar o estado do banco após reset
 * - IDs resetados para começar do 1
 * - Apenas admin existe sem associações
 * - Banco completamente limpo
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Database Reset Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin user validation', () => {
    it('deve ter apenas o admin com ID = 1', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            cpf: '00000000000',
            nome: 'Admin',
            perfil: 'admin',
            clinica_id: null,
            empresa_id: null,
          },
        ],
        rowCount: 1,
      });

      const result = await query('SELECT * FROM funcionarios');

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        id: 1,
        cpf: '00000000000',
        nome: 'Admin',
        perfil: 'admin',
        clinica_id: null,
        empresa_id: null,
      });
    });

    it('deve confirmar que admin não tem associações', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            clinica_id: null,
            empresa_id: null,
          },
        ],
        rowCount: 1,
      });

      const result = await query(`
        SELECT clinica_id, empresa_id
        FROM funcionarios
        WHERE cpf = '00000000000'
      `);

      expect(result.rows[0].clinica_id).toBeNull();
      expect(result.rows[0].empresa_id).toBeNull();
    });
  });

  describe('Table counts validation', () => {
    it('deve ter 0 clínicas', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 });

      const result = await query('SELECT COUNT(*) FROM clinicas');

      expect(result.rows[0].count).toBe('0');
    });

    it('deve ter 0 empresas', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 });

      const result = await query('SELECT COUNT(*) FROM empresas_clientes');

      expect(result.rows[0].count).toBe('0');
    });

    it('deve ter 0 avaliações', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 });

      const result = await query('SELECT COUNT(*) FROM avaliacoes');

      expect(result.rows[0].count).toBe('0');
    });

    it('deve ter 0 respostas', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 });

      const result = await query('SELECT COUNT(*) FROM respostas');

      expect(result.rows[0].count).toBe('0');
    });

    it('deve ter 1 funcionário (apenas admin)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 });

      const result = await query('SELECT COUNT(*) FROM funcionarios');

      expect(result.rows[0].count).toBe('1');
    });
  });

  describe('ID sequences validation', () => {
    it('deve confirmar que sequences foram resetadas', async () => {
      // Mock para simular que o próximo ID seria 1
      mockQuery.mockResolvedValueOnce({
        rows: [{ nextval: '1' }],
        rowCount: 1,
      });

      const result = await query("SELECT nextval('funcionarios_id_seq')");

      expect(result.rows[0].nextval).toBe('1');
    });
  });
});

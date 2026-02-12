import { registrarAceite } from '@/lib/termos/registrar-aceite';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
}));

import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('registrarAceite - Hotfix TABLES_NOT_MIGRATED', () => {
  const validParams = {
    usuario_cpf: '12345678901',
    usuario_tipo: 'gestor' as const,
    usuario_entidade_id: 100,
    termo_tipo: 'termos_uso' as const,
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    sessao_id: 'session-123',
    entidade_cnpj: '12345678901234',
    entidade_tipo: 'entidade' as const,
    entidade_nome: 'Empresa Teste',
    responsavel_nome: 'Gestor Teste',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Verificação de Tabelas', () => {
    it('deve lançar erro TABLES_NOT_MIGRATED quando tabela não existe (código 42P01)', async () => {
      // Simular erro de tabela não encontrada
      const sqlError: any = new Error('relation "aceites_termos_usuario" does not exist');
      sqlError.code = '42P01';

      mockQuery.mockRejectedValueOnce(sqlError);

      await expect(registrarAceite(validParams)).rejects.toThrow(
        'TABLES_NOT_MIGRATED'
      );

      // Verificar que a query de verificação foi executada
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('aceites_termos_usuario')
      );
    });

    it('deve prosseguir normalmente quando tabelas existem', async () => {
      // Verificação OK
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Insert usuario
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, aceito_em: new Date().toISOString() }],
        rowCount: 1,
      });

      // Insert entidade
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      const result = await registrarAceite(validParams);

      expect(result.success).toBe(true);
      expect(result.usuario_id).toBe(1);
      expect(result.entidade_id).toBe(1);

      // Verificar que foram 3 queries: verificação, insert usuario, insert entidade
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('deve relançar outro erro se não for 42P01', async () => {
      const otherError: any = new Error('Connection timeout');
      otherError.code = 'ETIMEDOUT';

      mockQuery.mockRejectedValueOnce(otherError);

      await expect(registrarAceite(validParams)).rejects.toMatchObject({
        code: 'ETIMEDOUT',
      });
    });
  });

  describe('Registro de Aceites', () => {
    it('deve registrar aceite do usuário com todas as informações', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Verificação OK

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            aceito_em: '2026-02-12T15:30:00Z',
          },
        ],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      await registrarAceite(validParams);

      // Verificar que insert do usuário foi chamado com os parâmetros corretos
      const userInsertCall = mockQuery.mock.calls[1];
      expect(userInsertCall[0]).toContain('aceites_termos_usuario');
      expect(userInsertCall[1]).toContain('12345678901'); // CPF
      expect(userInsertCall[1]).toContain('gestor'); // Tipo
      expect(userInsertCall[1]).toContain('termos_uso'); // Tipo de termo
    });

    it('deve registrar aceite da entidade (redundância legal)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Verificação OK
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, aceito_em: '2026-02-12T15:30:00Z' }],
        rowCount: 1,
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      await registrarAceite(validParams);

      // Verificar que insert da entidade foi chamado com CNPJ
      const entityInsertCall = mockQuery.mock.calls[2];
      expect(entityInsertCall[0]).toContain('aceites_termos_entidade');
      expect(entityInsertCall[1]).toContain('12345678901234'); // CNPJ
      expect(entityInsertCall[1]).toContain('entidade'); // Tipo de entidade
    });
  });
});

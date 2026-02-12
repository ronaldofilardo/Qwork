import { POST } from '@/app/api/termos/registrar/route';
import { registrarAceite } from '@/lib/termos/registrar-aceite';

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(() => ({
    cpf: '12345678901',
    nome: 'Teste Usuário',
    perfil: 'gestor',
    entidade_id: 100,
  })),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: jest.fn(() => ({
    ip_address: '127.0.0.1',
    user_agent: 'Test',
  })),
}));

jest.mock('@/lib/termos/registrar-aceite');

import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRegistrarAceite = registrarAceite as jest.MockedFunction<
  typeof registrarAceite
>;

describe('/api/termos/registrar - Hotfix TABLES_NOT_MIGRATED', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cenário: Tabelas ainda não existem (42P01)', () => {
    it('deve retornar erro 503 amigável quando tabelas não existem', async () => {
      // Mock da query que busca dados da entidade
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 100,
            cnpj: '12345678901234',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      // Simular erro de tabela não encontrada
      mockRegistrarAceite.mockRejectedValueOnce(
        new Error(
          'TABLES_NOT_MIGRATED: As tabelas de aceite de termos ainda não foram criadas. Execute as migrations primeiro.'
        )
      );

      const request = new Request(
        'http://localhost:3000/api/termos/registrar',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termo_tipo: 'termos_uso' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Recurso temporariamente indisponível');
      expect(data.code).toBe('FEATURE_NOT_READY');
      expect(data.message).toContain('sendo preparado');
    });

    it('deve retornar erro 500 para erros genéricos', async () => {
      // Mock da query que busca dados da entidade
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 100,
            cnpj: '12345678901234',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      mockRegistrarAceite.mockRejectedValueOnce(
        new Error('Erro de conexão desconhecido')
      );

      const request = new Request(
        'http://localhost:3000/api/termos/registrar',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termo_tipo: 'politica_privacidade' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro ao registrar aceite');
    });
  });

  describe('Cenário: Sucesso (tabelas existem)', () => {
    it('deve registrar aceite com sucesso quando tabelas existem', async () => {
      // Mock da query que busca dados da entidade
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 100,
            cnpj: '12345678901234',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      mockRegistrarAceite.mockResolvedValueOnce({
        success: true,
        usuario_id: 1,
        entidade_id: 1,
        aceito_em: new Date().toISOString(),
      });

      const request = new Request(
        'http://localhost:3000/api/termos/registrar',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termo_tipo: 'termos_uso' }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.termo_tipo).toBe('termos_uso');
    });
  });
});

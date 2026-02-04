/**
 * Testes de Segurança - Audit Logs
 * Valida sistema de auditoria para operações críticas
 */

import { logAudit, getAuditLogs, extractRequestInfo } from '@/lib/audit';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<any>;

describe('Audit Logs - Sistema de Auditoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAudit', () => {
    it('deve registrar auditoria de INSERT com sucesso', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Admin',
        perfil: 'admin',
      });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await logAudit({
        resource: 'funcionarios',
        action: 'INSERT',
        resourceId: '12345678901',
        newData: {
          cpf: '12345678901',
          nome: 'Novo Funcionário',
          perfil: 'funcionario',
        },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [
          '11111111111', // user_cpf
          'admin', // user_perfil
          'INSERT', // action
          'funcionarios', // resource
          '12345678901', // resource_id
          null, // old_data
          expect.any(String), // new_data (JSON)
          null, // ip_address
          null, // user_agent
          null, // details
        ],
        expect.any(Object) // session
      );
    });

    it('deve registrar auditoria de UPDATE com dados anteriores e novos', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Admin',
        perfil: 'admin',
      });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const dadosAnteriores = { cpf: '12345678901', ativo: true };
      const dadosNovos = { cpf: '12345678901', ativo: false };

      await logAudit({
        resource: 'funcionarios',
        action: 'UPDATE',
        resourceId: '12345678901',
        oldData: dadosAnteriores,
        newData: dadosNovos,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [
          '11111111111', // user_cpf
          'admin', // user_perfil
          'UPDATE', // action
          'funcionarios', // resource
          '12345678901', // resource_id
          expect.any(String), // old_data (JSON)
          expect.any(String), // new_data (JSON)
          null, // ip_address
          null, // user_agent
          null, // details
        ],
        expect.any(Object) // session
      );
    });

    it('deve registrar auditoria de DELETE com dados anteriores', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '22222222222',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 1,
      });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const dadosAnteriores = { id: 123 };

      await logAudit({
        resource: 'lotes_avaliacao',
        action: 'DELETE',
        resourceId: 123,
        oldData: dadosAnteriores,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [
          '22222222222', // user_cpf
          'rh', // user_perfil
          'DELETE', // action
          'lotes_avaliacao', // resource
          '123', // resource_id
          expect.any(String), // old_data (JSON)
          null, // new_data
          null, // ip_address
          null, // user_agent
          null, // details
        ],
        expect.any(Object) // session
      );
    });

    it('deve incluir IP e User-Agent quando fornecidos', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Admin',
        perfil: 'admin',
      });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await logAudit({
        resource: 'empresas_clientes',
        action: 'UPDATE',
        resourceId: '456',
        oldData: { ativa: true },
        newData: { ativa: false },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [
          '11111111111', // user_cpf
          'admin', // user_perfil
          'UPDATE', // action
          'empresas_clientes', // resource
          '456', // resource_id
          expect.any(String), // old_data (JSON)
          expect.any(String), // new_data (JSON)
          '192.168.1.100', // ip_address
          'Mozilla/5.0...', // user_agent
          null, // details
        ],
        expect.any(Object) // session
      );
    });

    it('não deve lançar erro quando não há sessão ativa', async () => {
      mockGetSession.mockResolvedValue(null);

      await expect(
        logAudit({
          resource: 'funcionarios',
          action: 'INSERT',
          resourceId: '123',
          newData: {},
        })
      ).resolves.not.toThrow();

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('não deve interromper operação principal se audit falhar', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Admin',
        perfil: 'admin',
      });
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(
        logAudit({
          resource: 'funcionarios',
          action: 'INSERT',
          resourceId: '123',
          newData: {},
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getAuditLogs', () => {
    it('deve buscar logs sem filtros', async () => {
      const mockLogs = [
        {
          id: 1,
          resource: 'funcionarios',
          action: 'INSERT',
          resource_id: '123',
          usuario_cpf: '11111111111',
          usuario_perfil: 'admin',
          usuario_nome: 'Admin User',
          criado_em: new Date().toISOString(),
        },
      ];
      mockQuery.mockResolvedValue({ rows: mockLogs, rowCount: 1 });

      const result = await getAuditLogs();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(mockLogs[0]);
    });

    it('deve filtrar logs por tabela', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await getAuditLogs({ resource: 'funcionarios' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND al.resource = $'),
        expect.arrayContaining(['funcionarios'])
      );
    });

    it('deve filtrar logs por usuário', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await getAuditLogs({ usuarioCpf: '11111111111' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND al.user_cpf = $'),
        expect.arrayContaining(['11111111111'])
      );
    });

    it('deve aplicar paginação', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      await getAuditLogs({ limit: 10, offset: 20 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([10, 20])
      );
    });

    it('deve retornar array vazio em caso de erro', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const result = await getAuditLogs();

      expect(result).toEqual([]);
    });
  });

  describe('extractRequestInfo', () => {
    it('deve extrair IP de x-forwarded-for', () => {
      const mockHeaders = new Headers({
        'x-forwarded-for': '192.168.1.100',
        'user-agent': 'Mozilla/5.0...',
      });
      const mockRequest = { headers: mockHeaders } as Request;

      const info = extractRequestInfo(mockRequest);

      expect(info.ipAddress).toBe('192.168.1.100');
      expect(info.userAgent).toBe('Mozilla/5.0...');
    });

    it('deve usar x-real-ip como fallback', () => {
      const mockHeaders = new Headers({
        'x-real-ip': '10.0.0.1',
      });
      const mockRequest = { headers: mockHeaders } as Request;

      const info = extractRequestInfo(mockRequest);

      expect(info.ipAddress).toBe('10.0.0.1');
    });

    it('deve retornar undefined quando headers não existem', () => {
      const mockHeaders = new Headers();
      const mockRequest = { headers: mockHeaders } as Request;

      const info = extractRequestInfo(mockRequest);

      expect(info.ipAddress).toBeUndefined();
      expect(info.userAgent).toBeUndefined();
    });
  });

  describe('Operações Críticas Auditadas', () => {
    const operacoesCriticas = [
      {
        resource: 'funcionarios',
        action: 'INSERT',
        descricao: 'Criação de usuário',
      },
      {
        resource: 'funcionarios',
        action: 'UPDATE',
        descricao: 'Mudança de status de usuário',
      },
      {
        resource: 'empresas_clientes',
        action: 'UPDATE',
        descricao: 'Mudança de status de empresa',
      },
      {
        resource: 'lotes_avaliacao',
        action: 'UPDATE',
        descricao: 'Liberação de lote',
      },
      { resource: 'laudos', action: 'INSERT', descricao: 'Emissão de laudo' },
      {
        resource: 'clinicas',
        action: 'INSERT',
        descricao: 'Criação de clínica',
      },
    ];

    operacoesCriticas.forEach(({ resource, action, descricao }) => {
      it(`deve auditar: ${descricao}`, async () => {
        mockGetSession.mockResolvedValue({
          cpf: '11111111111',
          nome: 'Admin',
          perfil: 'admin',
        });
        mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

        await logAudit({
          resource,
          action: action,
          resourceId: '123',
          newData: {},
        });

        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO audit_logs'),
          [
            '11111111111', // user_cpf
            'admin', // user_perfil
            action, // action
            resource, // resource
            '123', // resource_id
            null, // old_data
            expect.any(String), // new_data (JSON)
            null, // ip_address
            null, // user_agent
            null, // details
          ],
          expect.any(Object) // session
        );
      });
    });
  });
});

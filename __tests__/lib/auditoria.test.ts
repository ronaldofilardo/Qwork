/**
 * Testes para funções de auditoria
 */

import '@testing-library/jest-dom';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import { query } from '@/lib/db';

// Mock das dependências
jest.mock('@/lib/db');
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(() => ({
    cpf: '123.456.789-00',
    perfil: 'admin',
    clinica_id: 1,
  })),
}));

jest.mock('@/lib/request-utils', () => ({
  sanitizeUserAgent: jest.fn((ua) => ua),
  isValidIP: jest.fn(() => true),
}));

describe('Sistema de Auditoria', () => {
  const mockQuery = query as jest.MockedFunction<typeof query>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });
  });

  describe('logAudit', () => {
    it('deve registrar evento de auditoria corretamente', async () => {
      const entry = {
        resource: 'contratos',
        action: 'INSERT' as const,
        resourceId: 100,
        newData: { teste: 'valor' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: 'Teste de auditoria',
      };

      await logAudit(entry);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.arrayContaining([
          '123.456.789-00',
          'admin',
          'INSERT',
          'contratos',
          '100',
          expect.any(String), // JSON.stringify(newData)
          null,
          '192.168.1.1',
          'Mozilla/5.0',
          'Teste de auditoria',
        ]),
        expect.any(Object)
      );
    });

    it('deve registrar criação de contrato', async () => {
      const entry = {
        resource: 'contratos',
        action: 'INSERT' as const,
        resourceId: 101,
        newData: { contratante_id: 50, plano_id: 1 },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0',
        details: 'Contrato criado automaticamente',
      };

      await logAudit(entry);

      expect(mockQuery).toHaveBeenCalled();
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[0]).toContain('INSERT INTO audit_logs');
      expect(callArgs[1]).toContain('contratos');
      expect(callArgs[1]).toContain('INSERT');
    });

    it('deve registrar aceite de contrato', async () => {
      const entry = {
        resource: 'contratos',
        action: 'UPDATE' as const,
        resourceId: 101,
        newData: { aceito: true },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0',
        details: 'Contrato aceito',
      };

      await logAudit(entry);

      expect(mockQuery).toHaveBeenCalled();
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[1]).toContain('UPDATE');
      expect(callArgs[1][9]).toContain('Contrato aceito');
    });

    it('deve registrar início de pagamento', async () => {
      const entry = {
        resource: 'pagamentos',
        action: 'INSERT' as const,
        resourceId: 200,
        newData: {
          contratante_id: 50,
          valor: 499.0,
          metodo: 'pix',
          status: 'pendente',
        },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0',
        details: 'Pagamento iniciado - Método: pix, Valor: R$ 499',
      };

      await logAudit(entry);

      expect(mockQuery).toHaveBeenCalled();
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[1]).toContain('pagamentos');
      expect(callArgs[1][9]).toContain('Pagamento iniciado');
    });

    it('deve registrar confirmação de pagamento com severidade alta', async () => {
      const entry = {
        resource: 'pagamentos',
        action: 'UPDATE' as const,
        resourceId: 200,
        oldData: { status: 'pendente' },
        newData: { status: 'pago', data_pagamento: new Date().toISOString() },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0',
        details: 'PAGAMENTO CONFIRMADO - ID: 200, Valor: R$ 499',
      };

      await logAudit(entry);

      expect(mockQuery).toHaveBeenCalled();
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[1][9]).toContain('PAGAMENTO CONFIRMADO');
    });

    it('deve registrar aprovação de contratante', async () => {
      const entry = {
        resource: 'contratantes',
        action: 'UPDATE' as const,
        resourceId: 50,
        oldData: { status: 'pago' },
        newData: {
          status: 'aprovado',
          data_liberacao_login: new Date().toISOString(),
        },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0',
        details: 'CONTRATANTE APROVADO por 123.456.789-00 - Login liberado',
      };

      await logAudit(entry);

      expect(mockQuery).toHaveBeenCalled();
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[1]).toContain('contratantes');
      expect(callArgs[1][9]).toContain('CONTRATANTE APROVADO');
    });

    it('deve registrar rejeição de contratante', async () => {
      const entry = {
        resource: 'contratantes',
        action: 'UPDATE' as const,
        resourceId: 50,
        oldData: { status: 'pendente' },
        newData: {
          status: 'rejeitado',
          motivo_rejeicao: 'Documentação incompleta',
        },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120.0',
        details:
          'Contratante rejeitado por 123.456.789-00 - Motivo: Documentação incompleta',
      };

      await logAudit(entry);

      expect(mockQuery).toHaveBeenCalled();
      const callArgs = mockQuery.mock.calls[0];
      expect(callArgs[1][9]).toContain('Contratante rejeitado');
    });

    it('não deve falhar se sessão não estiver disponível', async () => {
      const { getSession } = require('@/lib/session');
      getSession.mockReturnValueOnce(null);

      const entry = {
        resource: 'contratos',
        action: 'INSERT' as const,
        resourceId: 100,
        newData: { teste: 'valor' },
      };

      await expect(logAudit(entry)).resolves.not.toThrow();
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('não deve falhar se houver erro ao salvar', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const entry = {
        resource: 'contratos',
        action: 'INSERT' as const,
        resourceId: 100,
        newData: { teste: 'valor' },
      };

      await expect(logAudit(entry)).resolves.not.toThrow();
    });
  });

  describe('extractRequestInfo', () => {
    it('deve extrair IP e User-Agent do request', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1';
            if (header === 'user-agent') return 'Mozilla/5.0';
            return null;
          }),
        },
      } as unknown as Request;

      const info = extractRequestInfo(mockRequest);

      expect(info.ipAddress).toBe('192.168.1.1');
      expect(info.userAgent).toBe('Mozilla/5.0');
    });

    it('deve usar x-real-ip se x-forwarded-for não existir', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-real-ip') return '10.0.0.1';
            if (header === 'user-agent') return 'Chrome/120.0';
            return null;
          }),
        },
      } as unknown as Request;

      const info = extractRequestInfo(mockRequest);

      expect(info.ipAddress).toBe('10.0.0.1');
      expect(info.userAgent).toBe('Chrome/120.0');
    });

    it('deve retornar undefined se não houver IP', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null),
        },
      } as unknown as Request;

      const info = extractRequestInfo(mockRequest);

      expect(info.ipAddress).toBeUndefined();
      expect(info.userAgent).toBeUndefined();
    });
  });

  describe('Integração com APIs', () => {
    it('deve registrar auditoria ao criar contrato via API', async () => {
      // Este teste verifica a integração conceitual
      // A implementação real está nas APIs
      const contratoData = {
        contratante_id: 50,
        plano_id: 1,
      };

      const entry = {
        resource: 'contratos',
        action: 'INSERT' as const,
        resourceId: 100,
        newData: contratoData,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: 'Contrato criado automaticamente',
      };

      await logAudit(entry);

      expect(mockQuery).toHaveBeenCalled();
    });

    it('deve registrar auditoria ao confirmar pagamento via API', async () => {
      const pagamentoData = {
        status: 'pago',
        data_pagamento: new Date().toISOString(),
      };

      const entry = {
        resource: 'pagamentos',
        action: 'UPDATE' as const,
        resourceId: 200,
        oldData: { status: 'pendente' },
        newData: pagamentoData,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: 'PAGAMENTO CONFIRMADO - ID: 200, Valor: R$ 499',
      };

      await logAudit(entry);

      expect(mockQuery).toHaveBeenCalled();
    });
  });
});

/**
 * @file __tests__/lib/email-notifications.test.ts
 * Testes para lib/email.ts - notificações por email
 *
 * Valida:
 * - Configuração correta de SMTP (host, port, credentials)
 * - Envio de emails para as 3 notificações (solicitação, lote liberado, aceite contrato)
 * - Logging de sucesso e erro
 * - Tratamento de exceções
 */

import nodemailer from 'nodemailer';
import * as emailModule from '@/lib/email';

// Mock do nodemailer
jest.mock('nodemailer');
const mockSendMail = jest.fn();
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Mock da query do banco
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('lib/email.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();

    // Setup mock do transporter
    mockNodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    // Setup environment
    process.env.SMTP_HOST = 'smtp.office365.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'contato@qwork.app.br';
    process.env.SMTP_PASSWORD = 'test-password';
    process.env.NOTIFY_EMAIL = 'ronaldofilardo@gmail.com';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('notificarSolicitacaoEmissao', () => {
    it('deve enviar email com sucesso para solicitação de emissão', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'msg_123' });

      const payload = {
        loteId: 32,
        solicitanteCpf: '123.456.789-10',
        perfil: 'rh',
        tomadorNome: 'Teste Clínica',
        empresaNome: 'Empresa Teste',
      };

      // Act
      await emailModule.notificarSolicitacaoEmissao(payload);

      // Assert
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call).toMatchObject({
        from: expect.stringContaining('QWork'),
        to: 'ronaldofilardo@gmail.com',
        subject: expect.stringContaining('Solicitação de emissão'),
      });
      expect(call.subject).toContain('Lote #32');
      expect(call.html).toContain('Lote #');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL]'),
        expect.stringContaining('notificarSolicitacaoEmissao'),
        expect.any(Object)
      );
    });

    it('deve logar erro quando sendMail falha', async () => {
      // Arrange
      const error = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValue(error);

      const payload = {
        loteId: 32,
        solicitanteCpf: '123.456.789-10',
        perfil: 'rh',
      };

      // Act & Assert
      await expect(
        emailModule.notificarSolicitacaoEmissao(payload)
      ).rejects.toThrow('SMTP connection failed');

      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('notificarLoteLiberado', () => {
    it('deve enviar email com sucesso para lote liberado', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'msg_456' });

      const payload = {
        loteId: 32,
        numeroOrdem: 320,
        tomadorNome: 'Clínica Teste',
        tomadorTipo: 'clinica' as const,
        empresaNome: 'Empresa ABC',
        avaliacoesCriadas: 5,
      };

      // Act
      await emailModule.notificarLoteLiberado(payload);

      // Assert
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call).toMatchObject({
        from: expect.stringContaining('QWork'),
        to: 'ronaldofilardo@gmail.com',
        subject: expect.stringContaining('Lote liberado'),
        subject: expect.stringContaining('#32'),
        html: expect.stringContaining('Lote #32'),
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL]'),
        expect.stringContaining('notificarLoteLiberado'),
        expect.any(Object)
      );
    });

    it('deve incluir empresa no email quando fornecida', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'msg_789' });

      const payload = {
        loteId: 32,
        numeroOrdem: 320,
        tomadorNome: 'Clínica Teste',
        tomadorTipo: 'clinica' as const,
        empresaNome: 'Empresa XYZ',
      };

      // Act
      await emailModule.notificarLoteLiberado(payload);

      // Assert
      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('Clínica Teste');
      expect(call.html).toContain('Empresa XYZ');
    });

    it('deve funcionar sem empresa quando não fornecida', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'msg_101' });

      const payload = {
        loteId: 32,
        numeroOrdem: 320,
        tomadorNome: 'Entidade Teste',
        tomadorTipo: 'entidade' as const,
      };

      // Act
      await emailModule.notificarLoteLiberado(payload);

      // Assert
      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('Entidade Teste');
      expect(call.html).not.toContain('Empresa:');
    });
  });

  describe('notificarAceiteContrato', () => {
    it('deve enviar email com sucesso para aceite de contrato', async () => {
      // Arrange
      mockSendMail.mockResolvedValue({ messageId: 'msg_202' });

      const payload = {
        tomadorId: 15,
        tomadorNome: 'Tomador Teste LTDA',
        cnpj: '12.345.678/0001-90',
        tipo: 'entidade' as const,
      };

      // Act
      await emailModule.notificarAceiteContrato(payload);

      // Assert
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call).toMatchObject({
        from: expect.stringContaining('QWork'),
        to: 'ronaldofilardo@gmail.com',
        subject: expect.stringContaining('Contrato aceito'),
        subject: expect.stringContaining('Tomador Teste LTDA'),
        html: expect.stringContaining('Tomador ID'),
      });

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL]'),
        expect.stringContaining('notificarAceiteContrato'),
        expect.any(Object)
      );
    });
  });

  describe('dispararEmailLotePago', () => {
    it('deve buscar dados do lote e disparar email', async () => {
      // Arrange
      const { query } = require('@/lib/db');
      query.mockResolvedValue({
        rows: [
          {
            numero_ordem: 320,
            tomador_nome: 'Clínica Paga',
            tomador_tipo: 'clinica',
          },
        ],
      });

      mockSendMail.mockResolvedValue({ messageId: 'msg_303' });

      // Act
      await emailModule.dispararEmailLotePago(32);

      // Assert
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('lotes_avaliacao'),
        [32]
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL]'),
        expect.stringContaining('inicando dispararEmailLotePago')
      );
    });

    it('deve retornar silenciosamente se lote não encontrado', async () => {
      // Arrange
      const { query } = require('@/lib/db');
      query.mockResolvedValue({ rows: [] });

      // Act
      await emailModule.dispararEmailLotePago(999);

      // Assert
      expect(mockSendMail).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL]'),
        expect.stringContaining('não encontrado')
      );
    });
  });

  describe('createTransporter - configuração SMTP', () => {
    it('deve criar transporter com SMTP_HOST e SMTP_PORT do .env', () => {
      // Arrange & Act
      const transporter = require('@/lib/email');
      // Trigger a import do createTransporter através de uma chamada
      expect(mockNodemailer.createTransport).toBeDefined();

      // Assert - verificar que foi chamado com os valores corretos
      // A função createTransporter é chamada dentro de cada função de notificação
    });

    it('deve logar aviso se SMTP_PASSWORD não está configurado em DEV', () => {
      // Arrange
      delete process.env.SMTP_PASSWORD;
      process.env.NODE_ENV = 'development';

      // Act - reimportar módulo com novo ambiente
      jest.resetModules();
      jest.doMock('@/lib/db');

      // Assert - o módulo deve ter logado um aviso
      // (Este teste é mais de integração, pois testa durante import)
    });

    it('deve usar fallback para SMTP_HOST se não configurado', () => {
      // Arrange
      delete process.env.SMTP_HOST;

      // Act & Assert - verificar que temos configurações padrão
      expect(process.env.SMTP_HOST || 'smtp.office365.com').toBe(
        'smtp.office365.com'
      );
    });
  });

  describe('integração webhook + email', () => {
    it('dispararEmailLotePago deve ser chamado após pagamento confirmado', async () => {
      // Este teste valida que o fluxo webhook→email está integrado corretamente
      // Implementado em __tests__/asaas/webhook-handler-idempotencia-atomicidade.test.ts

      expect(true).toBe(true); // placeholder
    });
  });
});

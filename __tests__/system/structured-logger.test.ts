// Jest globals available by default
import { NextRequest } from 'next/server';
import { StructuredLogger } from '@/lib/structured-logger';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('StructuredLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset NODE_ENV
    // @ts-expect-error - NODE_ENV é readonly mas precisamos modificar em testes
    process.env.NODE_ENV = 'development';
    // Limpa registro global de warnings
    if (typeof global.clearWarns === 'function') global.clearWarns();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });

  describe('sanitizeData', () => {
    test('deve mascarar campos sensíveis', () => {
      const input = {
        cpf: '12345678901',
        nome: 'João Silva',
        email: 'joao@email.com',
        senha: 'secret123',
        telefone: '11999999999',
        normalField: 'normal value',
      };

      const result = (StructuredLogger as any).sanitizeData(input);

      expect(result.cpf).toBe('[REDACTED]');
      expect(result.nome).toBe('[REDACTED]');
      expect(result.email).toBe('[REDACTED]');
      expect(result.senha).toBe('[REDACTED]');
      expect(result.telefone).toBe('[REDACTED]');
      expect(result.normalField).toBe('normal value');
    });

    test('deve retornar null/undefined inalterado', () => {
      expect((StructuredLogger as any).sanitizeData(null)).toBeNull();
      expect((StructuredLogger as any).sanitizeData(undefined)).toBeUndefined();
    });

    test('deve lidar com objetos vazios', () => {
      expect((StructuredLogger as any).sanitizeData({})).toEqual({});
    });
  });

  describe('logError', () => {
    test('deve logar erro com contexto completo', async () => {
      const error = new Error('Test error');
      const request = new NextRequest('http://localhost:3000/api/test');
      Object.defineProperty(request, 'headers', {
        value: new Map([
          ['x-forwarded-for', '192.168.1.1'],
          ['user-agent', 'TestAgent/1.0'],
        ]),
        writable: false,
      });

      const session = { cpf: '12345678901', perfil: 'funcionario' };
      const additionalData = { action: 'test', userId: '123' };

      await StructuredLogger.logError(
        'Test message',
        error,
        request,
        session,
        additionalData
      );

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(mockConsoleError.mock.calls[0][1]);

      expect(loggedData.level).toBe('error');
      expect(loggedData.message).toBe('Test message');
      expect(loggedData.context.url).toBe('http://localhost:3000/api/test');
      expect(loggedData.context.method).toBe('GET');
      expect(loggedData.context.ip).toBe('192.168.1.1');
      expect(loggedData.context.userAgent).toBe('TestAgent/1.0');
      expect(loggedData.context.userCpf).toBe('[REDACTED]');
      expect(loggedData.context.userPerfil).toBe('funcionario');
      expect(loggedData.context.error.name).toBe('Error');
      expect(loggedData.context.error.message).toBe('Test error');
      expect(loggedData.context.additionalData.action).toBe('test');
      expect(loggedData.context.additionalData.userId).toBe('123'); // userId não é campo sensível
    });

    test('deve logar erro sem request', async () => {
      const error = new Error('Test error');

      await StructuredLogger.logError('Test message', error);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(mockConsoleError.mock.calls[0][1]);

      expect(loggedData.context.url).toBeUndefined();
      expect(loggedData.context.ip).toBeUndefined();
      expect(loggedData.context.userAgent).toBeUndefined();
    });

    test('deve incluir stack trace em desenvolvimento', async () => {
      // @ts-expect-error - NODE_ENV é readonly mas precisamos modificar em testes
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');

      await StructuredLogger.logError('Test message', error);

      const loggedData = JSON.parse(mockConsoleError.mock.calls[0][1]);
      expect(loggedData.context.error.stack).toBeDefined();
    });

    test('deve omitir stack trace em produção', async () => {
      // @ts-expect-error - NODE_ENV é readonly mas precisamos modificar em testes
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');

      await StructuredLogger.logError('Test message', error);

      const loggedData = JSON.parse(mockConsoleError.mock.calls[0][0]); // Primeiro argumento em produção
      expect(loggedData.context.error.stack).toBeUndefined();
    });
  });

  describe('logWarn', () => {
    test('deve logar warning com contexto', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const session = { cpf: '12345678901', perfil: 'rh' };

      if (typeof global.clearWarns === 'function') global.clearWarns();
      await StructuredLogger.logWarn('Warning message', request, session, {
        action: 'test',
      });

      if (typeof global.expectWarned === 'function')
        global.expectWarned(/Warning message/);
      const warns =
        typeof global.getWarns === 'function' ? global.getWarns() : [];
      const loggedData = warns.length ? JSON.parse(warns[0][1]) : {};

      expect(loggedData.level).toBe('warn');
      expect(loggedData.message).toBe('Warning message');
      expect(loggedData.context.userCpf).toBe('[REDACTED]');
      expect(loggedData.context.userPerfil).toBe('rh');
    });
  });

  describe('logInfo', () => {
    test('deve logar info com contexto', async () => {
      const request = new NextRequest('http://localhost:3000/api/test');
      const session = { perfil: 'admin' };

      await StructuredLogger.logInfo('Info message', request, session);

      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const loggedData = JSON.parse(mockConsoleLog.mock.calls[0][1]);

      expect(loggedData.level).toBe('info');
      expect(loggedData.message).toBe('Info message');
      expect(loggedData.context.userCpf).toBeUndefined(); // Sem CPF na sessão
      expect(loggedData.context.userPerfil).toBe('admin');
    });
  });

  describe('timestamp', () => {
    test('deve incluir timestamp ISO válido', async () => {
      const error = new Error('Test');

      await StructuredLogger.logError('Test', error);

      const loggedData = JSON.parse(mockConsoleError.mock.calls[0][1]);
      const timestamp = new Date(loggedData.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });
});

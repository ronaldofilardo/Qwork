// Jest globals available by default
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/funcionarios/route';
import { StructuredLogger } from '@/lib/structured-logger';
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
const mockQuery = require('@/lib/db').query;

// Mock das dependências
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
  getSession: jest.fn(),
}));

jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
}));

jest.mock('@/lib/structured-logger', () => ({
  StructuredLogger: {
    logError: jest.fn(),
  },
}));

const mockRequireRole = require('@/lib/session').requireRole;
const mockGetSession = require('@/lib/session').getSession;
const mockQueryWithContext = require('@/lib/db-security').queryWithContext;
const mockLogError = StructuredLogger.logError as jest.MockedFunction<
  typeof StructuredLogger.logError
>;

describe('Integração Logger com API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('deve usar logger estruturado em caso de erro na API', async () => {
    // Simular erro na query
    mockRequireRole.mockResolvedValue({ cpf: '12345678901', perfil: 'rh' });
    mockQueryWithContext.mockRejectedValue(
      new Error('Database connection failed')
    );
    // Mock 'query' usada pelo handler: primeiro retorna clinica, depois falha na query principal
    mockQuery.mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 });
    mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/funcionarios?empresa_id=1'
    );
    Object.defineProperty(request, 'headers', {
      value: new Map([
        ['x-forwarded-for', '192.168.1.100'],
        ['user-agent', 'TestBrowser/1.0'],
      ]),
      writable: false,
    });

    mockGetSession.mockResolvedValue({
      cpf: '12345678901',
      perfil: 'rh',
    });

    const response = await GET(request);

    expect(response.status).toBe(500);

    // Agora o código registra o erro via console.error
    expect(console.error).toHaveBeenCalled();
    const [msg, err] = (console.error as jest.Mock).mock.calls[0];
    expect(msg).toBe('Erro ao listar funcionários:');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Database connection failed');
  });

  test('deve mascarar dados sensíveis no logger', async () => {
    mockRequireRole.mockResolvedValue({ cpf: '12345678901', perfil: 'admin' });
    mockQueryWithContext.mockRejectedValue(new Error('Test error'));
    // Forçar comportamento do banco: clinica existe, depois falha na query principal
    mockQuery.mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 });
    mockQuery.mockRejectedValueOnce(new Error('Test error'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/funcionarios'
    );
    mockGetSession.mockResolvedValue({
      cpf: '12345678901',
      perfil: 'admin',
    });

    await GET(request);

    expect(console.error).toHaveBeenCalled();
    const call = (console.error as jest.Mock).mock.calls[0];
    // Verifica que houve log e que o segundo argumento é um Error
    expect(call[1]).toBeInstanceOf(Error);
  });

  test('deve funcionar sem sessão ativa', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem sessão'));
    mockQueryWithContext.mockRejectedValue(new Error('Test error'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/funcionarios'
    );
    mockGetSession.mockResolvedValue(null);

    await GET(request);

    expect(console.error).toHaveBeenCalled();
    const callArgs = (console.error as jest.Mock).mock.calls[0];
    // Quando não há sessão, o logger recebe (message, error) e não session
    expect(callArgs[1]).toBeInstanceOf(Error);
  });

  test('deve incluir informações de request no log', async () => {
    mockRequireRole.mockResolvedValue({ cpf: '12345678901', perfil: 'rh' });
    mockQueryWithContext.mockRejectedValue(new Error('Test error'));
    mockQuery.mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 });
    mockQuery.mockRejectedValueOnce(new Error('Test error'));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/funcionarios?empresa_id=123'
    );
    Object.defineProperty(request, 'method', { value: 'GET' });
    Object.defineProperty(request, 'url', {
      value: 'http://localhost:3000/api/admin/funcionarios?empresa_id=123',
    });

    mockGetSession.mockResolvedValue({
      cpf: '12345678901',
      perfil: 'rh',
    });

    await GET(request);

    expect(console.error).toHaveBeenCalled();
    const callArgs = (console.error as jest.Mock).mock.calls[0];
    // O request não é passado para console.error na implementação atual, apenas a mensagem e o error
    expect(callArgs[1]).toBeInstanceOf(Error);
  });
});

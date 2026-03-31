/**
 * Testes unitários para lib/health-check.ts
 * Cobertura: performHealthCheck, getSystemMetrics
 */

const mockQuery = jest.fn();
jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

import { performHealthCheck, getSystemMetrics } from '@/lib/health-check';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('lib/health-check — performHealthCheck', () => {
  it('deve retornar healthy quando todos checks OK', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // SELECT 1 (database)
      .mockResolvedValueOnce({ rows: [{ count: 10 }] }) // funcionarios count (session)
      .mockResolvedValueOnce({ rows: [{ count: 5 }] }); // mfa_codes count

    const result = await performHealthCheck();

    expect(result.status).toBe('healthy');
    expect(result.checks.database.status).toBe('ok');
    expect(result.checks.session.status).toBe('ok');
    expect(result.checks.mfa.status).toBe('ok');
    expect(result.checks.planos.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
    expect(result.version).toBeDefined();
    expect(result.environment).toBeDefined();
  });

  it('deve retornar unhealthy quando database falha', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('Connection refused')) // database
      .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // session
      .mockResolvedValueOnce({ rows: [{ count: 0 }] }); // mfa

    const result = await performHealthCheck();

    expect(result.status).toBe('unhealthy');
    expect(result.checks.database.status).toBe('error');
    expect(result.checks.database.message).toContain('Connection refused');
  });

  it('deve retornar degraded quando mfa tem muitos códigos ativos', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // database OK
      .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // session OK
      .mockResolvedValueOnce({ rows: [{ count: 1500 }] }); // mfa >1000

    const result = await performHealthCheck();

    expect(result.status).toBe('degraded');
    expect(result.checks.mfa.status).toBe('warning');
    expect(result.checks.mfa.message).toContain('1500');
  });

  it('deve retornar unhealthy quando session check falha', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // database OK
      .mockRejectedValueOnce(new Error('Table not found')) // session FAIL
      .mockResolvedValueOnce({ rows: [{ count: 0 }] }); // mfa OK

    const result = await performHealthCheck();

    expect(result.status).toBe('unhealthy');
    expect(result.checks.session.status).toBe('error');
  });

  it('deve incluir responseTime no check de database', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] });

    const result = await performHealthCheck();

    expect(result.checks.database.responseTime).toBeDefined();
    expect(typeof result.checks.database.responseTime).toBe('number');
  });

  it('planos deve sempre retornar ok (migrado para pagamento por lote)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] });

    const result = await performHealthCheck();

    expect(result.checks.planos.status).toBe('ok');
    expect(result.checks.planos.message).toContain('migrado');
  });
});

describe('lib/health-check — getSystemMetrics', () => {
  it('deve retornar métricas do sistema', () => {
    const metrics = getSystemMetrics();

    expect(metrics.uptime).toBeDefined();
    expect(typeof metrics.uptime).toBe('number');
    expect(metrics.memory).toBeDefined();
    expect(metrics.memory.heapUsed).toBeDefined();
    expect(metrics.timestamp).toBeDefined();
  });
});

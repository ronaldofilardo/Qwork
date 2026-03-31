/**
 * Testes unitários para lib/audit-logger.ts
 * Cobertura: logAudit, buscarAuditoriaPorRecurso, buscarAuditoriaPorUsuario
 */

const mockQuery = jest.fn();
jest.mock('@/lib/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

import {
  logAudit,
  buscarAuditoriaPorRecurso,
  buscarAuditoriaPorUsuario,
} from '@/lib/audit-logger';
import type { AuditLogData } from '@/lib/audit-logger';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('lib/audit-logger — logAudit', () => {
  it('deve inserir registro de auditoria no banco', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

    const data: AuditLogData = {
      acao: 'CREATE',
      recurso: 'entidade',
      recurso_id: 42,
      usuario_cpf: '12345678901',
      ip: '192.168.1.1',
      detalhes: { campo: 'nome', novo: 'QWork' },
    };

    await logAudit(data);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('INSERT INTO auditoria');
    expect(params[0]).toBe('CREATE');
    expect(params[1]).toBe('entidade');
    expect(params[2]).toBe(42);
    expect(params[3]).toBe('12345678901');
    expect(params[4]).toBe('192.168.1.1');
    expect(JSON.parse(params[5])).toEqual({ campo: 'nome', novo: 'QWork' });
  });

  it('deve aceitar dados opcionais como null', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

    await logAudit({ acao: 'DELETE', recurso: 'funcionario' });

    const params = mockQuery.mock.calls[0][1];
    expect(params[2]).toBeNull(); // recurso_id
    expect(params[3]).toBeNull(); // usuario_cpf
    expect(params[4]).toBeNull(); // ip
    expect(params[5]).toBeNull(); // detalhes
  });

  it('deve serializar detalhes como JSON', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await logAudit({
      acao: 'UPDATE',
      recurso: 'lote',
      detalhes: { ids: [1, 2, 3], total: 3 },
    });

    const detalhesParam = mockQuery.mock.calls[0][1][5];
    expect(typeof detalhesParam).toBe('string');
    expect(JSON.parse(detalhesParam)).toEqual({ ids: [1, 2, 3], total: 3 });
  });

  it('não deve lançar erro quando DB falha (fail-safe)', async () => {
    mockQuery.mockRejectedValue(new Error('DB connection failed'));

    // Não deve lançar
    await expect(
      logAudit({ acao: 'CREATE', recurso: 'teste' })
    ).resolves.toBeUndefined();
  });

  it('deve passar session como terceiro argumento para query', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const fakeSession = { client: 'pool-client' };

    await logAudit({ acao: 'READ', recurso: 'relatorio' }, fakeSession);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      fakeSession
    );
  });
});

describe('lib/audit-logger — buscarAuditoriaPorRecurso', () => {
  it('deve buscar por recurso com limite padrão de 50', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: 1, acao: 'CREATE', recurso: 'entidade' }],
    });

    const result = await buscarAuditoriaPorRecurso('entidade');

    expect(result).toHaveLength(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('WHERE recurso = $1');
    expect(params[0]).toBe('entidade');
    expect(params[1]).toBe(50);
  });

  it('deve aceitar limite customizado', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await buscarAuditoriaPorRecurso('lote', 10);

    expect(mockQuery.mock.calls[0][1][1]).toBe(10);
  });

  it('deve ordenar por criado_em DESC', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await buscarAuditoriaPorRecurso('entidade');

    expect(mockQuery.mock.calls[0][0]).toContain('ORDER BY criado_em DESC');
  });
});

describe('lib/audit-logger — buscarAuditoriaPorUsuario', () => {
  it('deve buscar por CPF do usuário', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: 1, usuario_cpf: '12345678901' }],
    });

    const result = await buscarAuditoriaPorUsuario('12345678901');

    expect(result).toHaveLength(1);
    const params = mockQuery.mock.calls[0][1];
    expect(params[0]).toBe('12345678901');
    expect(params[1]).toBe(50); // limite padrão
  });

  it('deve aceitar session e limite customizados', async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const fakeSession = { client: 'pool-client' };

    await buscarAuditoriaPorUsuario('99999999999', 25, fakeSession);

    expect(mockQuery.mock.calls[0][1][1]).toBe(25);
    expect(mockQuery.mock.calls[0][2]).toBe(fakeSession);
  });
});

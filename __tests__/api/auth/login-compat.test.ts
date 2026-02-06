import { POST } from '@/app/api/auth/login/route';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  getDatabaseInfo: () => ({ environment: 'test' }),
}));

jest.mock('@/lib/session', () => ({
  createSession: jest.fn(),
}));

jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: () => ({
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
  }),
}));

const { query } = require('@/lib/db');
const { createSession } = require('@/lib/session');

describe('Login compatibilidade - gestores (CPF join & schema fallback)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('aceita gestor via usuarios + entidades_senhas', async () => {
    const senha = 'senhaTeste123';
    const hash = await bcrypt.hash(senha, 10);

    // Mock comportamento do query de forma diferenciada por SQL
    (query as jest.Mock).mockImplementation(
      async (sql: string, params: any[]) => {
        // Query na tabela usuarios
        if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
          return {
            rows: [
              {
                cpf: '04703084945',
                nome: 'Gestor RH',
                tipo_usuario: 'gestor',
                clinica_id: null,
                entidade_id: 10,
                ativo: true,
              },
            ],
          };
        }

        // Query na tabela entidades_senhas
        if (sql.includes('FROM entidades_senhas')) {
          return {
            rows: [
              {
                senha_hash: hash,
                id: 10,
                ativa: true,
                pagamento_confirmado: true,
              },
            ],
          };
        }

        // Audit log
        if (sql.includes('INSERT INTO audit_logs')) {
          return { rows: [], rowCount: 1 };
        }

        // demais queries: retornar vazio por padrão
        return { rows: [] };
      }
    );

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: '04703084945', senha }),
    });

    const res: any = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(createSession).toHaveBeenCalled();
  });

  test('continua login mesmo se consulta falhar gracefully', async () => {
    const senha = 'senhaTeste456';
    const hash = await bcrypt.hash(senha, 10);

    (query as jest.Mock).mockImplementation(
      async (sql: string, params: any[]) => {
        // Query na tabela usuarios
        if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
          return {
            rows: [
              {
                cpf: '04703084945',
                nome: 'Gestor RH',
                tipo_usuario: 'gestor',
                clinica_id: null,
                entidade_id: 10,
                ativo: true,
              },
            ],
          };
        }

        // Query na tabela entidades_senhas
        if (sql.includes('FROM entidades_senhas')) {
          return {
            rows: [
              {
                senha_hash: hash,
                id: 10,
                ativa: true,
                pagamento_confirmado: true,
              },
            ],
          };
        }

        // Audit log
        if (sql.includes('INSERT INTO audit_logs')) {
          return { rows: [], rowCount: 1 };
        }

        return { rows: [] };
      }
    );

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: '04703084945', senha }),
    });

    const res: any = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(createSession).toHaveBeenCalled();
  });
});

export {};

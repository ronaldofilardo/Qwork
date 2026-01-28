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

  test('aceita gestor via contratantes_senhas vinculado por responsavel_cpf', async () => {
    const senha = 'senhaTeste123';
    const hash = await bcrypt.hash(senha, 10);

    // Mock comportamento do query de forma diferenciada por SQL
    (query as jest.Mock).mockImplementation(
      async (sql: string, params: any[]) => {
        if (sql.includes('FROM contratantes_senhas')) {
          return {
            rows: [
              {
                cpf: '04703084945',
                senha_hash: hash,
                contratante_id: 10,
                responsavel_nome: 'Gestor RH',
                tipo: 'clinica',
                ativa: true,
                pagamento_confirmado: true,
              },
            ],
          };
        }

        // clinicas query -> retornar vazio (sem clinica vinculada)
        if (sql.includes('FROM clinicas')) {
          return { rows: [] };
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

  test('continua login mesmo se consulta de clinicas falhar por coluna ausente', async () => {
    const senha = 'senhaTeste456';
    const hash = await bcrypt.hash(senha, 10);

    (query as jest.Mock).mockImplementation(
      async (sql: string, params: any[]) => {
        if (sql.includes('FROM contratantes_senhas')) {
          return {
            rows: [
              {
                cpf: '04703084945',
                senha_hash: hash,
                contratante_id: 10,
                responsavel_nome: 'Gestor RH',
                tipo: 'clinica',
                ativa: true,
                pagamento_confirmado: true,
              },
            ],
          };
        }

        if (sql.includes('FROM clinicas')) {
          const err: any = new Error('column "contratante_id" does not exist');
          throw err;
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

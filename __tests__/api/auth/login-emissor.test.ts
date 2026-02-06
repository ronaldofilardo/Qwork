import { query as realQuery } from '@/lib/db';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db');
jest.mock('bcryptjs');

// Garantir que createSession está mockado como função (deve ser hoisted antes do import do handler)
jest.mock('@/lib/session', () => ({
  createSession: jest.fn(),
}));

const mockQuery = require('@/lib/db').query as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
const sessionLib = require('@/lib/session');

// Importar o handler APÓS mocks serem registrados (garante que createSession será a função mockada)
const { POST } = require('@/app/api/auth/login/route');

describe('POST /api/auth/login - emissor mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // garantir que mock é função
    sessionLib.createSession = jest.fn();
  });

  it('deve mapear role "emissor" para perfil "emissor" e não admin', async () => {
    // Mock: usuarios lookup com tipo_usuario correto
    mockQuery.mockImplementation(async (sql: string, params: any[]) => {
      if (/from usuarios/i.test(sql) && /WHERE cpf =/.test(sql)) {
        return {
          rows: [
            {
              cpf: '53051173991',
              nome: 'Emissor Teste',
              tipo_usuario: 'emissor',
              clinica_id: null,
              entidade_id: null,
              ativo: true,
            },
          ],
        };
      }
      // Audit log
      if (sql.includes('INSERT INTO audit_logs')) {
        return { rows: [], rowCount: 1 };
      }
      return { rows: [] };
    });

    mockCompare.mockResolvedValue(true);

    // Build Request
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cpf: '53051173991', senha: '123456' }),
    });

    const res = await POST(req as any);
    const body = await res.json();

    // debug
    console.log('LOGIN TEST RESPONSE:', body);

    expect(body.success).toBe(true);
    expect(body.perfil).toBe('emissor');
    expect(body.redirectTo).toBe('/emissor');

    // Verificar que a sessão foi criada com perfil 'emissor'
    const sessionMod = require('@/lib/session');
    expect(sessionMod.createSession).toHaveBeenCalled();
    const created = sessionMod.createSession.mock.calls[0][0];
    expect(created.perfil).toBe('emissor');
  });
});

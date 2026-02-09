import '@testing-library/jest-dom';
import { POST } from '@/app/api/pagamento/iniciar/route';

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { query } from '@/lib/db';

describe('POST /api/pagamento/iniciar - fallback quando tabela contratos ausente', () => {
  beforeEach(() => {
    (query as jest.Mock).mockClear();

    (query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
      // Simular lançamento de erro de relação inexistente quando query tenta acessar contratos
      if (
        /LEFT JOIN contratos/i.test(sql) ||
        /SELECT id FROM contratos/i.test(sql)
      ) {
        const err: any = new Error('relation "contratos" does not exist');
        err.code = '42P01';
        throw err;
      }

      // Resposta para fallback de tomador
      if (/SELECT c.id, c.nome, c.plano_id, c.status/i.test(sql)) {
        return Promise.resolve({
          rows: [
            {
              id: 41,
              nome: 'Empresa X',
              plano_id: 2,
              status: 'aprovado',
              plano_nome: 'Plano Teste',
              plano_tipo: 'fixo',
              numero_funcionarios: 100,
              contrato_id: null,
              valor_unitario: 20.0,
              valor_total: 2000.0,
            },
          ],
        });
      }

      // Inserção de pagamento
      if (/INSERT INTO pagamentos/i.test(sql)) {
        return Promise.resolve({ rows: [{ id: 12345 }] });
      }

      // Select pagamentos existentes
      if (/SELECT id, status FROM pagamentos/i.test(sql)) {
        return Promise.resolve({ rows: [] });
      }

      return Promise.resolve({ rows: [] });
    });
  });

  it('deve iniciar pagamento usando fallback quando contratos não existe', async () => {
    const fakeReq: any = {
      json: async () => ({ tomador_id: 41 }),
    };

    const res: any = await POST(fakeReq);
    const body = await res.json();

    // Agora, com política contract-first, iniciar pagamento sem contrato aceito deve falhar
    expect(body.error).toBe('Contrato deve ser aceito antes do pagamento');
  });
});

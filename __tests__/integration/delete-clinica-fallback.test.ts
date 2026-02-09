import '@testing-library/jest-dom';
import { POST } from '@/app/api/admin/clinicas/delete-secure/route';

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

// Mock de sessão e bcrypt para controlar autenticação no teste
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));

import { query } from '@/lib/db';

describe('POST /api/admin/clinicas/delete-secure - fallback quando tabela contratos ausente', () => {
  beforeEach(() => {
    (query as jest.Mock).mockClear();

    (query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
      // Simular SELECT admin
      if (/SELECT senha_hash, nome FROM funcionarios/i.test(sql)) {
        return Promise.resolve({
          rows: [{ senha_hash: '$2a$10$foo', nome: 'Admin' }],
        });
      }

      // Simular consulta clinicas retornando entidade
      if (/SELECT id, nome, cnpj, ativa FROM clinicas WHERE id =/i.test(sql)) {
        return Promise.resolve({ rows: [] });
      }

      if (
        /SELECT id, nome, cnpj, ativa, tipo FROM tomadors WHERE id =/i.test(
          sql
        )
      ) {
        return Promise.resolve({
          rows: [
            {
              id: 99,
              nome: 'Entidade X',
              cnpj: '12.345.678/0001-99',
              ativa: true,
              tipo: 'entidade',
            },
          ],
        });
      }

      // Contadores
      if (
        /SELECT COUNT\(\*\) as count FROM funcionarios WHERE clinica_id =/i.test(
          sql
        )
      ) {
        return Promise.resolve({ rows: [{ count: '0' }] });
      }
      if (
        /SELECT COUNT\(\*\) as count FROM empresas_clientes WHERE clinica_id =/i.test(
          sql
        )
      ) {
        return Promise.resolve({ rows: [{ count: '0' }] });
      }
      if (
        /SELECT COUNT\(\*\) as count FROM funcionarios WHERE clinica_id =/i.test(
          sql
        )
      ) {
        return Promise.resolve({ rows: [{ count: '0' }] });
      }
      if (/SELECT COUNT\(\*\) as count FROM avaliacoes/i.test(sql)) {
        return Promise.resolve({ rows: [{ count: '0' }] });
      }

      // BEGIN/COMMIT/ROLLBACK
      if (/BEGIN/i.test(sql) || /COMMIT/i.test(sql) || /ROLLBACK/i.test(sql)) {
        return Promise.resolve({ rows: [] });
      }

      // DELETE recibos/pagamentos executa sem problemas
      if (/DELETE FROM recibos WHERE tomador_id =/i.test(sql)) {
        return Promise.resolve({ rows: [] });
      }
      if (/DELETE FROM pagamentos WHERE tomador_id =/i.test(sql)) {
        return Promise.resolve({ rows: [] });
      }

      // Simular ausência da tabela contratos: to_regclass retorna null
      if (/SELECT to_regclass\('public\.contratos'\)/i.test(sql)) {
        return Promise.resolve({ rows: [{ reg: null }] });
      }

      // demais to_regclass checks (existentes)
      if (/SELECT to_regclass\('public\.recibos'\)/i.test(sql)) {
        return Promise.resolve({ rows: [{ reg: 'recibos' }] });
      }
      if (/SELECT to_regclass\('public\.pagamentos'\)/i.test(sql)) {
        return Promise.resolve({ rows: [{ reg: 'pagamentos' }] });
      }

      // Função fn_delete_senha_autorizado inexistente / presente
      if (/SELECT COUNT\(\*\) as c FROM pg_proc WHERE proname =/i.test(sql)) {
        // Indicar que a função não existe
        return Promise.resolve({ rows: [{ c: '0' }] });
      }

      // Registrar log e outras chamadas
      if (/SELECT registrar_log_exclusao_clinica/i.test(sql)) {
        return Promise.resolve({ rows: [] });
      }

      // to_regclass para logs_exclusao_clinicas (presente nesse teste)
      if (/SELECT to_regclass\('public\.logs_exclusao_clinicas'\)/i.test(sql)) {
        return Promise.resolve({ rows: [{ reg: 'logs_exclusao_clinicas' }] });
      }

      // Excluir tomadors final
      if (/DELETE FROM tomadors WHERE id =/i.test(sql)) {
        return Promise.resolve({ rows: [] });
      }

      return Promise.resolve({ rows: [] });
    });
  });

  it('deve ignorar ausência de tabela contratos e concluir exclusão', async () => {
    const fakeRequest: any = {
      json: async () => ({ password: 'senha', clinicaId: 99 }),
      headers: new Map(),
    };

    // Mock session getSession() para simular admin
    const sessionModule = require('@/lib/session');
    (sessionModule.getSession as jest.Mock).mockReturnValue({
      cpf: '00000000000',
      perfil: 'admin',
    });

    // Mock bcrypt para validar senha
    const bcrypt = require('bcryptjs');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res: any = await POST(fakeRequest);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.message).toMatch(
      /Entidade excluída com sucesso|Clínica excluída com sucesso/
    );
  });

  it('deve inserir log diretamente na tabela quando função de log ausente', async () => {
    const fakeRequest: any = {
      json: async () => ({ password: 'senha', clinicaId: 99 }),
      headers: new Map(),
    };

    // Mock session getSession() para simular admin
    const sessionModule = require('@/lib/session');
    (sessionModule.getSession as jest.Mock).mockReturnValue({
      cpf: '00000000000',
      perfil: 'admin',
    });

    // Mock bcrypt para validar senha
    const bcrypt = require('bcryptjs');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res: any = await POST(fakeRequest);
    const body = await res.json();

    expect(body.success).toBe(true);

    // Verificar que houve uma tentativa de INSERT em logs_exclusao_clinicas
    const calls = (query as jest.Mock).mock.calls.map((c: any[]) =>
      String(c[0])
    );
    const foundInsert = calls.some((sql: string) =>
      /INSERT INTO logs_exclusao_clinicas/i.test(sql)
    );
    expect(foundInsert).toBe(true);
  });

  it('deve reatribuir liberado_por e emissor_cpf antes de deletar funcionários', async () => {
    const fakeRequest: any = {
      json: async () => ({ password: 'senha', clinicaId: 99 }),
      headers: new Map(),
    };

    // Mock session getSession() para simular admin
    const sessionModule = require('@/lib/session');
    (sessionModule.getSession as jest.Mock).mockReturnValue({
      cpf: '00000000000',
      perfil: 'admin',
    });

    // Mock bcrypt para validar senha
    const bcrypt = require('bcryptjs');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Reset calls and run
    (query as jest.Mock).mockClear();
    const res: any = await POST(fakeRequest);

    // Procurar UPDATEs esperados
    const calls = (query as jest.Mock).mock.calls.map((c: any[]) =>
      String(c[0])
    );
    const updatedLotes = calls.some((sql: string) =>
      /UPDATE lotes_avaliacao SET liberado_por =/i.test(sql)
    );
    const updatedLaudos = calls.some((sql: string) =>
      /UPDATE laudos SET emissor_cpf =/i.test(sql)
    );

    expect(updatedLotes).toBe(true);
    expect(updatedLaudos).toBe(true);
  });
});

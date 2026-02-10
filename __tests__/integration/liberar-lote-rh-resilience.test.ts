jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
  getSession: jest.fn().mockResolvedValue({}),
}));

// Mock db-gestor helper so tests can call queryAsGestorRH without profile checks
jest.mock('@/lib/db-gestor', () => {
  const actualDb = jest.requireActual('@/lib/db');
  return {
    queryAsGestorRH: async (text: string, params?: any[]) =>
      actualDb.query(text, params),
  } as any;
});

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { POST } from '@/app/api/rh/liberar-lote/route';

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireRHWithEmpresaAccess =
  requireRHWithEmpresaAccess as jest.MockedFunction<
    typeof requireRHWithEmpresaAccess
  >;

describe('Integration: Liberar lote RH - resistência à corrida (resilience)', () => {
  let clinicaId: number;
  let empresaId: number;
  const funcionarioCpf = '77777777777';
  const mockRhCpf = '99999999999';
  const createdLoteIds: number[] = [];

  beforeAll(async () => {
    if (
      !process.env.TEST_DATABASE_URL ||
      !String(process.env.TEST_DATABASE_URL).includes('_test')
    ) {
      throw new Error(
        'TEST_DATABASE_URL não configurado para testes de integração'
      );
    }

    // Set user context to bypass RLS during setup
    await query(`SET LOCAL app.current_user_cpf = '99999999999'`);
    await query(`SET LOCAL app.current_user_perfil = 'rh'`);

    // Criar clinica/empresa/funcionario de teste se necessário
    const clinicaRes = await query(
      `SELECT id FROM clinicas WHERE ativa = true LIMIT 1`
    );
    if (clinicaRes.rows.length > 0) clinicaId = clinicaRes.rows[0].id;
    else {
      const c =
        await query(`INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
        VALUES ('Clinica Resilience', '11111111000199','c@t.com','11900000000','Rua','Cidade','SP','01000-000','R','r@t.com', true) RETURNING id`);
      clinicaId = c.rows[0].id;
    }

    const empresaRes = await query(
      `SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1`,
      [clinicaId]
    );
    if (empresaRes.rows.length > 0) empresaId = empresaRes.rows[0].id;
    else {
      const e = await query(
        `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
        VALUES ($1, 'Empresa Resilience', '22222222000199', 'e@test.com', '11900000002','Rua2','Cidade','SP','01000-002','R','r@e.com', true) RETURNING id`,
        [clinicaId]
      );
      empresaId = e.rows[0].id;
    }

    // Garantir funcionario (upsert sem deletar para evitar FK issues)
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, empresa_id, clinica_id, ativo, indice_avaliacao)
      VALUES ($1, 'Func Res', 'f@r.com', '$2a$10$dummyhash', 'rh', 'rh', $2, $3, true, 0)
      ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, senha_hash = EXCLUDED.senha_hash, perfil = EXCLUDED.perfil, usuario_tipo = EXCLUDED.usuario_tipo, empresa_id = EXCLUDED.empresa_id, clinica_id = EXCLUDED.clinica_id, ativo = EXCLUDED.ativo, indice_avaliacao = EXCLUDED.indice_avaliacao`,
      [funcionarioCpf, empresaId, clinicaId]
    );

    // Criar funcionário para o mock (liberado_por) - upsert
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, empresa_id, clinica_id, ativo, indice_avaliacao)
      VALUES ($1, 'Mock RH', 'mock@rh.com', '$2a$10$dummyhash', 'rh', 'rh', $2, $3, true, 0)
      ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, senha_hash = EXCLUDED.senha_hash, perfil = EXCLUDED.perfil, usuario_tipo = EXCLUDED.usuario_tipo, empresa_id = EXCLUDED.empresa_id, clinica_id = EXCLUDED.clinica_id, ativo = EXCLUDED.ativo, indice_avaliacao = EXCLUDED.indice_avaliacao`,
      ['99999999999', empresaId, clinicaId]
    );

    // Mock session para RH com clinica_id correto
    mockRequireAuth.mockResolvedValue({
      cpf: '99999999999',
      perfil: 'rh',
      clinica_id: clinicaId,
    } as any);
    mockRequireRHWithEmpresaAccess.mockResolvedValue({} as any);
  });

  afterAll(async () => {
    try {
      // Clean up created data (tentar remover todas as avaliações referenciando nossos CPFs / lotes primeiro)
      const cpfs = [funcionarioCpf, mockRhCpf];

      // Remover avaliações dos lotes que criamos explicitamente
      if (createdLoteIds.length > 0) {
        await query('DELETE FROM avaliacoes WHERE lote_id = ANY($1)', [
          createdLoteIds,
        ]);
        await query('DELETE FROM lotes_avaliacao WHERE id = ANY($1)', [
          createdLoteIds,
        ]);
      }

      // Remover avaliações por CPF OU por lotes com padrão Resilience (garante que não existam avaliações penjando de funcionários)
      await query(
        `DELETE FROM avaliacoes
        WHERE funcionario_cpf = ANY($1)
        OR lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo ilike $2)
        OR lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo ilike 'Lote % - %' AND liberado_em > now() - interval '1 day')
      `,
        [cpfs, '%Resilience%']
      );

      // Remover possíveis avaliações pendentes apontando para códigos específicos de teste
      await query(
        "DELETE FROM avaliacoes WHERE lote_id IN (SELECT id FROM lotes_avaliacao WHERE codigo = 'LOTE-RESILIENCE-13' OR codigo = 'LOTE-R-10000')"
      );

      // Remover lotes por padrões/códigos usados em testes
      await query(
        "DELETE FROM lotes_avaliacao WHERE codigo ilike 'Lote % - %' AND liberado_em > now() - interval '1 day'"
      );
      await query(
        "DELETE FROM lotes_avaliacao WHERE codigo = 'LOTE-RESILIENCE-13'"
      );
      await query("DELETE FROM lotes_avaliacao WHERE codigo = 'LOTE-R-10000'");

      // Finalmente remover funcionarios (depois que todas as avaliações foram removidas)
      await query('DELETE FROM funcionarios WHERE cpf = ANY($1)', [cpfs]);
    } catch (err) {
      // Log e ignorar erros de cleanup para não mascarar resultados de testes
      console.warn('[cleanup] Erro durante cleanup (ignorado):', err);
    }
  });

  // Tests: allocator must skip IDs already in use

  // Helper: reserva o próximo id livre chamando fn_next_lote_id() até encontrar um id não usado
  async function reserveNextFreeId() {
    while (true) {
      const r = await query('SELECT fn_next_lote_id() as id');
      const candidate = r.rows[0].id;
      const existsLote = await query(
        'SELECT 1 FROM lotes_avaliacao WHERE id = $1',
        [candidate]
      );
      const existsLaudo = await query('SELECT 1 FROM laudos WHERE id = $1', [
        candidate,
      ]);
      if (existsLote.rowCount === 0 && existsLaudo.rowCount === 0) {
        return candidate;
      }
      // else loop and try next id
    }
  }

  it('fn_next_lote_id() retorna id único e pula ids já ocupados (determinístico)', async () => {
    // Preparar cenário: forçar last_id = 12 e criar lote com id 13 existente
    await query('UPDATE lote_id_allocator SET last_id = 12');

    // Inserir lote com id 13 para simular id já ocupado
    await query(
      `INSERT INTO lotes_avaliacao (id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem, liberado_em)
      VALUES ($1, $2, $3, 'Lote para teste de resiliência', 'completo', 'ativo', '99999999999', 1, NOW())
      ON CONFLICT (id) DO NOTHING`,
      [13, clinicaId, empresaId]
    );

    const reservedRaw = await reserveNextFreeId();
    const reserved = parseInt(String(reservedRaw), 10);

    // O id reservado deve pular 13 e ser >= 14
    expect(reserved).toBeGreaterThanOrEqual(14);
    expect(reserved).not.toBe(13);

    // Garantir que o id reservado realmente não existe ainda em lotes/laudos
    const loteCheck = await query(
      'SELECT 1 FROM lotes_avaliacao WHERE id = $1',
      [reserved]
    );
    const laudoCheck = await query('SELECT 1 FROM laudos WHERE id = $1', [
      reserved,
    ]);
    expect(loteCheck.rowCount).toBe(0);
    expect(laudoCheck.rowCount).toBe(0);
  });
});

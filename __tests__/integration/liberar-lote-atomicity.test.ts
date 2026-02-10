/**
 * Teste de Integração: Atomicidade de Lote + Avaliações
 *
 * Valida que lotes e avaliações são criados em mesma transação
 * e que rollback acontece se avaliações falharem
 */

import { query } from '@/lib/db';
import { withTransactionAsGestor } from '@/lib/db-transaction';

// Mock para simular sessão de gestor RH
jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn().mockResolvedValue({
    cpf: '12345678909',
    perfil: 'rh',
    clinica_id: 1,
  }),
  requireRHWithEmpresaAccess: jest.fn().mockResolvedValue({}),
  getSession: jest.fn().mockReturnValue({
    cpf: '12345678909',
    perfil: 'rh',
    clinica_id: 1,
  }),
}));

describe('Integration: Atomicidade Lote + Avaliações', () => {
  let clinicaId: number;
  let empresaId: number;
  let funcionarioCpf: string;
  const testCpf = '12345678909';

  beforeAll(async () => {
    // Validar ambiente de teste
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    // Configurar contexto de sessão
    await query('SELECT set_config($1, $2, false)', [
      'app.current_user_cpf',
      testCpf,
    ]);
    await query('SELECT set_config($1, $2, false)', [
      'app.current_user_perfil',
      'rh',
    ]);

    // Criar clínica de teste
    const cnpj = `111${Date.now().toString().slice(-8)}`;
    const newClinica = await query(
      `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ('Clinica Test Atomicity', $1, 'test@atomicity.com', '11900000000', 'Rua Test', 'São Paulo', 'SP', '01000-000', 'Resp Test', 'resp@test.com', true)
       RETURNING id`,
      [cnpj]
    );
    clinicaId = newClinica.rows[0].id;

    // Criar empresa de teste
    const cnpjEmp = `222${Date.now().toString().slice(-8)}`;
    const newEmpresa = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ($1, 'Empresa Test Atomicity', $2, 'emp@test.com', '11900000001', 'Rua Emp', 'São Paulo', 'SP', '01000-001', 'Resp Emp', 'resp@emp.com', true)
       RETURNING id`,
      [clinicaId, cnpjEmp]
    );
    empresaId = newEmpresa.rows[0].id;

    // Criar funcionário de teste
    funcionarioCpf = `999${Date.now().toString().slice(-8)}`;
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
       VALUES ($1, 'Func Test Atomicity', 'func@test.com', '$2a$10$dummyhash', 'funcionario', true, 0)`,
      [funcionarioCpf]
    );

    // Criar relacionamento com clínica
    const funcIdResult = await query(
      'SELECT id FROM funcionarios WHERE cpf = $1',
      [funcionarioCpf]
    );
    const funcId = funcIdResult.rows[0].id;

    await query(
      `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, ativo)
       VALUES ($1, $2, true)`,
      [funcId, clinicaId]
    );
  });

  afterAll(async () => {
    // Limpar dados de teste
    try {
      await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [
        funcionarioCpf,
      ]);

      await query(
        `DELETE FROM lotes_avaliacao 
         WHERE descricao LIKE '%Test Atomicity%' 
         AND liberado_em > NOW() - INTERVAL '1 hour'`
      );

      const funcIdResult = await query(
        'SELECT id FROM funcionarios WHERE cpf = $1',
        [funcionarioCpf]
      );
      if (funcIdResult.rowCount > 0) {
        const funcId = funcIdResult.rows[0].id;
        await query(
          'DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1',
          [funcId]
        );
      }

      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    } catch (err) {
      console.warn('[cleanup] Erro durante cleanup (ignorado):', err);
    }
  });

  it('deve criar lote E avaliações em mesma transação', async () => {
    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // 1. Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, $3, 'completo', 'ativo', $4, 1)
           RETURNING id`,
          [clinicaId, empresaId, 'Lote Test Atomicity - Success', testCpf]
        );
        loteId = loteResult.rows[0].id;

        // 2. Criar avaliação
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          [funcionarioCpf, loteId]
        );
      });

      // Verificar que lote foi criado
      expect(loteId).toBeDefined();
      const loteCheck = await query(
        'SELECT id FROM lotes_avaliacao WHERE id = $1',
        [loteId]
      );
      expect(loteCheck.rowCount).toBe(1);

      // Verificar que avaliação foi criada
      const avaliacaoCheck = await query(
        'SELECT id FROM avaliacoes WHERE lote_id = $1',
        [loteId]
      );
      expect(avaliacaoCheck.rowCount).toBe(1);
    } finally {
      // Limpar
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve fazer ROLLBACK de lote se criação de avaliação falhar', async () => {
    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // 1. Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, $3, 'completo', 'ativo', $4, 1)
           RETURNING id`,
          [clinicaId, empresaId, 'Lote Test Atomicity - Rollback', testCpf]
        );
        loteId = loteResult.rows[0].id;

        // 2. Tentar criar avaliação com CPF inválido (vai falhar)
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          ['INVALID_CPF', loteId]
        );
      });

      // Não deve chegar aqui - transação deve falhar
      fail('Transação deveria ter falhado');
    } catch (error) {
      // Esperado - transação falhou
      expect(error).toBeDefined();
    }

    // Verificar que lote NÃO foi criado (ROLLBACK)
    if (loteId) {
      const loteCheck = await query(
        'SELECT id FROM lotes_avaliacao WHERE id = $1',
        [loteId]
      );
      expect(loteCheck.rowCount).toBe(0); // ✅ CRÍTICO - Rollback funcionou
    }
  });

  it('NÃO deve existir lotes órfãos (sem avaliações) no banco', async () => {
    // Verificar todos os lotes ativos criados recentemente
    const lotesOrfaos = await query(`
      SELECT la.id, la.numero_ordem, la.descricao, la.liberado_em
      FROM lotes_avaliacao la
      WHERE la.status = 'ativo'
        AND la.liberado_em > NOW() - INTERVAL '1 hour'
        AND NOT EXISTS (
          SELECT 1 FROM avaliacoes WHERE lote_id = la.id
        )
    `);

    // ✅ CRÍTICO - Não deve haver lotes órfãos
    expect(lotesOrfaos.rowCount).toBe(0);

    if (lotesOrfaos.rowCount > 0) {
      console.error('❌ Lotes órfãos detectados:', lotesOrfaos.rows);
    }
  });

  it('deve validar que rollback não deixa dados inconsistentes', async () => {
    const descricaoUnica = `Lote Test Consistency ${Date.now()}`;
    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, $3, 'completo', 'ativo', $4, 1)
           RETURNING id`,
          [clinicaId, empresaId, descricaoUnica, testCpf]
        );
        loteId = loteResult.rows[0].id;

        // Forçar erro
        throw new Error('Erro simulado para testar rollback');
      });
    } catch (error) {
      // Esperado
    }

    // Verificar que nada foi criado
    const loteCheck = await query(
      'SELECT id FROM lotes_avaliacao WHERE descricao = $1',
      [descricaoUnica]
    );
    expect(loteCheck.rowCount).toBe(0); // ✅ Rollback completo

    const avaliacaoCheck = await query(
      'SELECT id FROM avaliacoes WHERE lote_id = $1',
      [loteId || -1]
    );
    expect(avaliacaoCheck.rowCount).toBe(0); // ✅ Sem avaliações órfãs
  });
});

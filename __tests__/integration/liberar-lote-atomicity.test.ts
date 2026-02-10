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
  let funcionarioId: number;

  beforeAll(async () => {
    // Validar ambiente de teste
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    try {
      // Configurar contexto de sessão
      // Usando funcionarioCpf como user atual
      const userCpf = '12345678909';
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_cpf',
        userCpf,
      ]);
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_perfil',
        'rh',
      ]);

      // Buscar ou criar clínica
      const clinicaRes = await query(
        'SELECT id FROM clinicas WHERE ativa = true LIMIT 1'
      );

      clinicaId = clinicaRes.rows[0]?.id;

      if (!clinicaId) {
        console.log('[Setup] Criando nova clínica...');
        const cnpj = `111${Date.now().toString().slice(-8)}`;
        const newClinica = await query(
          `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_email, ativa)
           VALUES ('Clinica Test Atomicity', $1, 'test@atomicity.com', '11900000000', 'Rua Test', 'São Paulo', 'SP', '01000-000', 'Resp Test', '12345678901', 'resp@test.com', true)
           RETURNING id`,
          [cnpj]
        );
        clinicaId = newClinica.rows[0].id;
      }

      console.log(`[Setup] clinicaId = ${clinicaId}`);

      // Buscar ou criar empresa
      const empresaRes = await query(
        'SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1',
        [clinicaId]
      );

      empresaId = empresaRes.rows[0]?.id;

      if (!empresaId) {
        console.log('[Setup] Criando nova empresa...');
        const cnpjEmp = `222${Date.now().toString().slice(-8)}`;
        const newEmpresa = await query(
          `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
           VALUES ($1, 'Empresa Test Atomicity', $2, 'emp@test.com', '11900000001', 'Rua Emp', 'São Paulo', 'SP', '01000-001', 'Resp Emp', 'resp@emp.com', true)
           RETURNING id`,
          [clinicaId, cnpjEmp]
        );
        empresaId = newEmpresa.rows[0].id;
      }

      console.log(`[Setup] empresaId = ${empresaId}`);

      // 🔍 VERIFICAR se empresa existe no banco
      const empresaCheck = await query(
        'SELECT id, clinica_id, nome FROM empresas_clientes WHERE id = $1',
        [empresaId]
      );
      if (empresaCheck.rowCount === 0) {
        throw new Error(
          `[Setup] ❌ Empresa ${empresaId} não encontrada no banco após criação!`
        );
      }
      console.log(`[Setup] ✅ Empresa encontrada:`, empresaCheck.rows[0]);

      // Criar funcionário
      funcionarioCpf = `999${Date.now().toString().slice(-8)}`;
      console.log(`[Setup] Criando funcionário ${funcionarioCpf}...`);

      const funcResult = await query(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
         VALUES ($1, 'Func Test Atomicity', 'func@test.com', '$2a$10$dummyhash', 'funcionario', true, 0)
         RETURNING id`,
        [funcionarioCpf]
      );
      funcionarioId = funcResult.rows[0].id;

      console.log(`[Setup] funcionarioId = ${funcionarioId}`);

      // Criar relacionamento com clínica
      await query(
        `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, empresa_id, ativo)
         VALUES ($1, $2, $3, true)`,
        [funcionarioId, clinicaId, empresaId]
      );

      console.log(
        `[Setup] ✅ Setup completo: clinicaId=${clinicaId}, empresaId=${empresaId}, funcionarioCpf=${funcionarioCpf}`
      );
    } catch (error) {
      console.error('[Setup] ❌ Erro durante setup:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    try {
      console.log('[Cleanup] Iniciando limpeza...');

      await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [
        funcionarioCpf,
      ]);

      await query(
        `DELETE FROM lotes_avaliacao 
         WHERE descricao LIKE '%Test Atomicity%' 
         AND liberado_em > NOW() - INTERVAL '1 hour'`
      );

      if (funcionarioId) {
        await query(
          'DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1',
          [funcionarioId]
        );
      }

      if (funcionarioCpf) {
        await query('DELETE FROM funcionarios WHERE cpf = $1', [
          funcionarioCpf,
        ]);
      }

      console.log('[Cleanup] ✅ Limpeza concluída');
    } catch (err) {
      console.warn('[Cleanup] ⚠️ Erro durante cleanup (ignorado):', err);
    }
  });

  it('deve criar lote E avaliações em mesma transação', async () => {
    console.log(
      `[Test 1] ANTES DA TRANSAÇÃO: clinicaId=${clinicaId}, empresaId=${empresaId}, funcionarioCpf=${funcionarioCpf}`
    );

    expect(clinicaId).toBeDefined();
    expect(empresaId).toBeDefined();
    expect(funcionarioCpf).toBeDefined();

    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // 🔍 VERIFICAR se empresa é visível dentro da transação
        const empresaVisivel = await client.query(
          'SELECT id, clinica_id, nome FROM empresas_clientes WHERE id = $1',
          [empresaId]
        );
        console.log(
          `[Test 1] DENTRO DA TRANSAÇÃO: empresaId=${empresaId}, empresa visível:`,
          empresaVisivel.rows[0] || 'NÃO ENCONTRADA'
        );
        // Criar lote
        console.log(
          `[Test humanizar 1] DENTRO DA TRANSAÇÃO: clinicaId=${clinicaId}, empresaId=${empresaId}, funcionarioCpf=${funcionarioCpf}`
        );
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote Test Atomicity 1', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, funcionarioCpf]
        );
        loteId = loteResult.rows[0].id;

        // Criar avaliação
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          [funcionarioCpf, loteId]
        );
      });

      // Verificar criação
      const loteCheck = await query(
        'SELECT id FROM lotes_avaliacao WHERE id = $1',
        [loteId]
      );
      expect(loteCheck.rowCount).toBe(1);

      const avaliacaoCheck = await query(
        'SELECT id FROM avaliacoes WHERE lote_id = $1',
        [loteId]
      );
      expect(avaliacaoCheck.rowCount).toBe(1);

      console.log('[Test 1] ✅ Lote e avaliação criados atomicamente');
    } finally {
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve fazer ROLLBACK de lote se criação de avaliação falhar', async () => {
    expect(clinicaId).toBeDefined();
    expect(empresaId).toBeDefined();

    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote Test Atomicity 2', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, funcionarioCpf]
        );
        loteId = loteResult.rows[0].id;

        // Forçar erro na avaliação (CPF inválido)
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ('00000000000', $1, 'iniciada', NOW())`,
          [loteId]
        );
      });

      fail('Deveria ter lançado erro');
    } catch (error) {
      // Esperado
    }

    // Verificar rollback (lote NÃO deve existir)
    if (loteId) {
      const loteCheck = await query(
        'SELECT id FROM lotes_avaliacao WHERE id = $1',
        [loteId]
      );
      expect(loteCheck.rowCount).toBe(0);
      console.log('[Test 2] ✅ Rollback funcionou corretamente');
    }
  });

  it('NÃO deve existir lotes órfãos (sem avaliações) no banco', async () => {
    const orfaosCheck = await query(`
      SELECT l.id, l.descricao
      FROM lotes_avaliacao l
      WHERE l.status = 'ativo'
      AND NOT EXISTS (
        SELECT 1 FROM avaliacoes a 
        WHERE a.lote_id = l.id
      )
      AND l.descricao LIKE '%Test Atomicity%'
    `);

    expect(orfaosCheck.rowCount).toBe(0);
    console.log('[Test 3] ✅ Nenhum lote órfão encontrado');
  });

  it('deve validar que rollback não deixa dados inconsistentes', async () => {
    expect(clinicaId).toBeDefined();
    expect(empresaId).toBeDefined();

    let loteId: number | null = null;

    try {
      await withTransactionAsGestor(async (client) => {
        // Criar lote
        const loteResult = await client.query(
          `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
           VALUES ($1, $2, 'Lote Test Atomicity 3', 'completo', 'ativo', $3, 1)
           RETURNING id`,
          [clinicaId, empresaId, funcionarioCpf]
        );
        loteId = loteResult.rows[0].id;

        // Criar avaliação
        await client.query(
          `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
           VALUES ($1, $2, 'iniciada', NOW())`,
          [funcionarioCpf, loteId]
        );

        // Forçar erro
        throw new Error('Erro forçado para testar rollback');
      });

      fail('Deveria ter lançado erro');
    } catch (error) {
      // Esperado
    }

    // NADA deve ter sido criado
    if (loteId) {
      const loteCheck = await query(
        'SELECT id FROM lotes_avaliacao WHERE id = $1',
        [loteId]
      );
      expect(loteCheck.rowCount).toBe(0);

      const avaliacaoCheck = await query(
        'SELECT id FROM avaliacoes WHERE lote_id = $1',
        [loteId]
      );
      expect(avaliacaoCheck.rowCount).toBe(0);
    }

    console.log('[Test 4] ✅ Rollback completo sem dados inconsistentes');
  });
});

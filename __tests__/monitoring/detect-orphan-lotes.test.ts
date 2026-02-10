/**
 * Teste de Monitoramento: Scripts de Detecção
 * 
 * Valida que scripts de monitoramento funcionam corretamente
 */

import { query } from '@/lib/db';

// Mock dinâmico do módulo de monitoramento
let monitorModule: any;

describe('Monitoring: Scripts de Detecção', () => {
  let clinicaId: number;
  let empresaId: number;
  const testCpf = '12345678909';

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    // Importar módulo de monitoramento
    monitorModule = require('@/scripts/monitor-integridade.cjs');

    // Setup básico
    const clinicaRes = await query('SELECT id FROM clinicas WHERE ativa = true LIMIT 1');
    clinicaId = clinicaRes.rows[0]?.id || (await query(
      `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ('Clinica Monitor Test', '13313313300100', 'monitor@test.com', '11900000012', 'Rua', 'SP', 'SP', '01000-012', 'Resp', 'resp@monitor.com', true)
       RETURNING id`
    )).rows[0].id;

    const empresaRes = await query(
      'SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1',
      [clinicaId]
    );
    empresaId = empresaRes.rows[0]?.id || (await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ($1, 'Empresa Monitor Test', '78978978900100', 'emp@monitor.com', '11900000013', 'Rua', 'SP', 'SP', '01000-013', 'Resp', 'resp@emp.com', true)
       RETURNING id`,
      [clinicaId]
    )).rows[0].id;
  });

  afterAll(async () => {
    try {
      await query(
        `DELETE FROM lotes_avaliacao 
         WHERE descricao LIKE '%Monitor Test%' 
         AND liberado_em > NOW() - INTERVAL '1 hour'`
      );
    } catch (err) {
      console.warn('[cleanup] Erro:', err);
    }
  });

  it('deve detectar lotes órfãos quando existem', async () => {
    let loteId: number | null = null;

    try {
      // Criar lote órfão (sem avaliações)
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, $2, 'Lote Monitor Test Orphan', 'completo', 'ativo', $3, 1)
         RETURNING id`,
        [clinicaId, empresaId, testCpf]
      );
      loteId = loteResult.rows[0].id;

      // Executar detecção
      const resultado = await monitorModule.detectarLotesOrfaos();

      // ✅ Deve detectar o lote órfão
      expect(resultado.status).toBe('error');
      expect(resultado.count).toBeGreaterThan(0);
      expect(resultado.lotes).toBeDefined();

      // Verificar que nosso lote está na lista
      const nossoLote = resultado.lotes.find((l: any) => l.id === loteId);
      expect(nossoLote).toBeDefined();
      expect(nossoLote.descricao).toBe('Lote Monitor Test Orphan');
    } finally {
      if (loteId) {
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve retornar OK quando não há lotes órfãos', async () => {
    let loteId: number | null = null;
    let funcionarioCpf = '55544433322';

    try {
      // Criar funcionário
      await query(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, indice_avaliacao)
         VALUES ($1, 'Func Monitor', 'monitor@func.com', '$2a$10$hash', 'funcionario', true, 0)
         ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome`,
        [funcionarioCpf]
      );

      const funcIdResult = await query('SELECT id FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
      await query(
        `INSERT INTO funcionarios_clinicas (funcionario_id, clinica_id, ativo)
         VALUES ($1, $2, true)
         ON CONFLICT (funcionario_id, clinica_id) DO UPDATE SET ativo = true`,
        [funcIdResult.rows[0].id, clinicaId]
      );

      // Criar lote COM avaliação
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, $2, 'Lote Monitor Test Valid', 'completo', 'ativo', $3, 1)
         RETURNING id`,
        [clinicaId, empresaId, testCpf]
      );
      loteId = loteResult.rows[0].id;

      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
         VALUES ($1, $2, 'iniciada', NOW())`,
        [funcionarioCpf, loteId]
      );

      // Executar detecção
      const resultado = await monitorModule.detectarLotesOrfaos();

      // ✅ Pode retornar OK ou ter outros órfãos, mas não o nosso lote
      if (resultado.status === 'error' && resultado.lotes) {
        const nossoLote = resultado.lotes.find((l: any) => l.id === loteId);
        expect(nossoLote).toBeUndefined(); // Nosso lote NÃO deve estar na lista
      }

      // Limpar
      await query('DELETE FROM avaliacoes WHERE funcionario_cpf = $1', [funcionarioCpf]);
      const funcId = funcIdResult.rows[0].id;
      await query('DELETE FROM funcionarios_clinicas WHERE funcionario_id = $1', [funcId]);
      await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    } finally {
      if (loteId) {
        await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve verificar consistência de auditoria', async () => {
    const resultado = await monitorModule.verificarConsistenciaAuditoria();

    // ✅ Deve retornar estrutura esperada
    expect(resultado.status).toBeDefined();
    expect(['ok', 'warning', 'error']).toContain(resultado.status);

    if (resultado.status === 'warning') {
      expect(resultado.inconsistencias).toBeDefined();
      expect(Array.isArray(resultado.inconsistencias)).toBe(true);
    }
  });

  it('deve validar formato de saída do monitoramento', async () => {
    const resultado = await monitorModule.detectarLotesOrfaos();

    // ✅ Estrutura padrão
    expect(resultado).toHaveProperty('status');
    expect(resultado).toHaveProperty('count');

    if (resultado.status === 'error' && resultado.count > 0) {
      expect(resultado).toHaveProperty('lotes');
      expect(Array.isArray(resultado.lotes)).toBe(true);

      // Validar estrutura de cada lote
      const primeiroLote = resultado.lotes[0];
      expect(primeiroLote).toHaveProperty('id');
      expect(primeiroLote).toHaveProperty('numero_ordem');
      expect(primeiroLote).toHaveProperty('descricao');
      expect(primeiroLote).toHaveProperty('liberado_em');
    }
  });
});

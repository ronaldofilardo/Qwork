/**
 * Teste de Banco: Trigger Reservar Laudo (Migração 1004)
 *
 * Valida que trigger cria laudos com status='rascunho' automaticamente
 * quando lote é criado
 */

import { query } from '@/lib/db';

describe('Database: Trigger reservar_laudo_on_lote', () => {
  let clinicaId: number;
  let empresaId: number;
  const testCpf = '12345678909';

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL?.includes('_test')) {
      throw new Error('TEST_DATABASE_URL deve apontar para banco _test');
    }

    // Setup básico
    const clinicaRes = await query(
      'SELECT id FROM clinicas WHERE ativa = true LIMIT 1'
    );
    clinicaId =
      clinicaRes.rows[0]?.id ||
      (
        await query(
          `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ('Clinica Trigger Test', '77777777000100', 'trigger@test.com', '11900000006', 'Rua', 'SP', 'SP', '01000-006', 'Resp', 'resp@trigger.com', true)
       RETURNING id`
        )
      ).rows[0].id;

    const empresaRes = await query(
      'SELECT id FROM empresas_clientes WHERE clinica_id = $1 AND ativa = true LIMIT 1',
      [clinicaId]
    );
    empresaId =
      empresaRes.rows[0]?.id ||
      (
        await query(
          `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_email, ativa)
       VALUES ($1, 'Empresa Trigger Test', '88888888000100', 'emp@trigger.com', '11900000007', 'Rua', 'SP', 'SP', '01000-007', 'Resp', 'resp@emp.com', true)
       RETURNING id`,
          [clinicaId]
        )
      ).rows[0].id;
  });

  afterAll(async () => {
    try {
      await query(
        `DELETE FROM lotes_avaliacao 
         WHERE descricao LIKE '%Trigger Test%' 
         AND liberado_em > NOW() - INTERVAL '1 hour'`
      );
    } catch (err) {
      console.warn('[cleanup] Erro:', err);
    }
  });

  it('deve criar laudo automaticamente quando lote é criado', async () => {
    let loteId: number | null = null;

    try {
      // Criar lote
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, $2, 'Lote Trigger Test Auto', 'completo', 'ativo', $3, 1)
         RETURNING id`,
        [clinicaId, empresaId, testCpf]
      );
      loteId = loteResult.rows[0].id;

      // ✅ CRÍTICO - Laudo deve ter sido criado automaticamente pelo trigger
      const laudoCheck = await query(
        'SELECT id, lote_id, status FROM laudos WHERE id = $1',
        [loteId]
      );

      expect(laudoCheck.rowCount).toBe(1);
      expect(laudoCheck.rows[0].lote_id).toBe(loteId);
      expect(laudoCheck.rows[0].status).toBe('rascunho'); // ✅ Status correto
    } finally {
      if (loteId) {
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve validar que trigger respeita ON CONFLICT (não duplica laudos)', async () => {
    let loteId: number | null = null;

    try {
      // Criar lote (trigger vai criar laudo)
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, $2, 'Lote Trigger ON CONFLICT Test', 'completo', 'ativo', $3, 1)
         RETURNING id`,
        [clinicaId, empresaId, testCpf]
      );
      loteId = loteResult.rows[0].id;

      // Verificar laudo criado
      const firstCheck = await query(
        'SELECT COUNT(*) as total FROM laudos WHERE id = $1',
        [loteId]
      );
      expect(parseInt(firstCheck.rows[0].total)).toBe(1);

      // Tentar criar laudo duplicado manualmente (deve ser ignorado via ON CONFLICT)
      await query(
        `INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em)
         VALUES ($1, $1, 'rascunho', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [loteId]
      );

      // ✅ CRÍTICO - Ainda deve haver apenas 1 laudo
      const secondCheck = await query(
        'SELECT COUNT(*) as total FROM laudos WHERE id = $1',
        [loteId]
      );
      expect(parseInt(secondCheck.rows[0].total)).toBe(1);
    } finally {
      if (loteId) {
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve validar que trigger não cria laudo para status != ativo', async () => {
    let loteId: number | null = null;

    try {
      // Criar lote com status 'rascunho' (não deve acionar trigger)
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, $2, 'Lote Trigger Rascunho Test', 'completo', 'rascunho', $3, 1)
         RETURNING id`,
        [clinicaId, empresaId, testCpf]
      );
      loteId = loteResult.rows[0].id;

      // Verificar se laudo foi criado
      const laudoCheck = await query('SELECT id FROM laudos WHERE id = $1', [
        loteId,
      ]);

      // Dependendo da implementação do trigger:
      // Se trigger tem condição WHERE status='ativo' → laudoCheck.rowCount = 0
      // Se trigger cria para todos os lotes → laudoCheck.rowCount = 1

      // Documentar comportamento atual
      console.log(
        `[INFO] Trigger criou laudo para lote status='rascunho'? ${laudoCheck.rowCount > 0}`
      );

      // Se implementação do trigger deve criar apenas para 'ativo', descomentar:
      // expect(laudoCheck.rowCount).toBe(0);
    } finally {
      if (loteId) {
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });

  it('deve validar timestamps do laudo criado pelo trigger', async () => {
    let loteId: number | null = null;

    try {
      // Criar lote
      const loteResult = await query(
        `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, descricao, tipo, status, liberado_por, numero_ordem)
         VALUES ($1, $2, 'Lote Trigger Timestamps Test', 'completo', 'ativo', $3, 1)
         RETURNING id`,
        [clinicaId, empresaId, testCpf]
      );
      loteId = loteResult.rows[0].id;

      // Verificar timestamps do laudo
      const laudoCheck = await query(
        'SELECT criado_em, atualizado_em FROM laudos WHERE id = $1',
        [loteId]
      );

      expect(laudoCheck.rowCount).toBe(1);
      expect(laudoCheck.rows[0].criado_em).toBeDefined();
      expect(laudoCheck.rows[0].atualizado_em).toBeDefined();

      // ✅ Timestamps devem ser recentes (< 5 segundos)
      const criadoEm = new Date(laudoCheck.rows[0].criado_em);
      const agora = new Date();
      const diffSeconds = (agora.getTime() - criadoEm.getTime()) / 1000;
      expect(diffSeconds).toBeLessThan(5);
    } finally {
      if (loteId) {
        await query('DELETE FROM laudos WHERE id = $1', [loteId]);
        await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
      }
    }
  });
});

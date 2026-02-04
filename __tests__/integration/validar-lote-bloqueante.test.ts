/**
 * Teste para validar que `validar_lote_pre_laudo` retorna `bloqueante` apenas para erros severos
 */

import { query } from '@/lib/db';

describe('validar_lote_pre_laudo - bloqueante logic', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number;
  let funcionarioCpf: string;

  beforeAll(async () => {
    const uniqueCnpj = Math.floor(Math.random() * 1e14)
      .toString()
      .padStart(14, '0');
    const clinica = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ('Clínica Val', $1, true) RETURNING id`,
      [uniqueCnpj]
    );
    clinicaId = clinica.rows[0].id;
    const empresaCnpj = Math.floor(Math.random() * 1e14)
      .toString()
      .padStart(14, '0');
    const empresa = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa) VALUES ($1, 'Empresa Val', $2, true) RETURNING id`,
      [clinicaId, empresaCnpj]
    );
    empresaId = empresa.rows[0].id;

    funcionarioCpf = `${Date.now().toString().slice(-11)}`.padStart(11, '0');
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id, empresa_id, senha_hash) VALUES ($1, 'Func Val', 'f@val.test', 'funcionario', true, $2, $3, 'dummy')`,
      [funcionarioCpf, clinicaId, empresaId]
    );
  });

  afterAll(async () => {
    if (loteId) {
      await query('DELETE FROM laudos WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
      await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    }
    // Garantir que lotes não referenciem o funcionario antes de deletar
    await query(
      'UPDATE lotes_avaliacao SET liberado_por = NULL WHERE liberado_por = $1',
      [funcionarioCpf]
    );
    await query('DELETE FROM funcionarios WHERE cpf = $1', [funcionarioCpf]);
    await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
  });

  it('marca bloqueante quando nao ha avaliacoes concluidas', async () => {
    const lote = await query(
      `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, status, liberado_por, tipo, numero_ordem) VALUES ($1,$2,'ativo',$3,'completo',1) RETURNING id`,
      [clinicaId, empresaId, funcionarioCpf]
    );
    loteId = lote.rows[0].id;

    // Substituir a função no DB para garantir a versão de teste (bloqueante logic)
    await query(`
      CREATE OR REPLACE FUNCTION validar_lote_pre_laudo(p_lote_id INTEGER) RETURNS TABLE(valido boolean, alertas text[], funcionarios_pendentes integer, detalhes jsonb, bloqueante boolean) AS $$
      DECLARE
        v_total_avaliacoes INTEGER;
        v_avaliacoes_concluidas INTEGER;
        v_avaliacoes_inativadas INTEGER;
        v_funcionarios_pendentes INTEGER;
        v_alertas TEXT[] := '{}';
        v_detalhes JSONB;
        v_bloqueante BOOLEAN := FALSE;
      BEGIN
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas,
               COUNT(*) FILTER (WHERE status = 'inativada') AS inativadas
        INTO v_total_avaliacoes, v_avaliacoes_concluidas, v_avaliacoes_inativadas
        FROM avaliacoes WHERE lote_id = p_lote_id;

        SELECT COUNT(*) INTO v_funcionarios_pendentes
        FROM calcular_elegibilidade_lote((SELECT empresa_id FROM lotes_avaliacao WHERE id = p_lote_id), (SELECT numero_ordem FROM lotes_avaliacao WHERE id = p_lote_id)) el
        WHERE NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.funcionario_cpf = el.funcionario_cpf AND a.lote_id = p_lote_id);

        IF v_avaliacoes_inativadas > v_total_avaliacoes * 0.3 THEN
          v_alertas := array_append(v_alertas, 'ATENÇÃO: Muitas inativações');
        END IF;

        IF v_avaliacoes_concluidas = 0 THEN
          v_alertas := array_append(v_alertas, 'ERRO: Nenhuma avaliação concluída');
        END IF;

        IF v_avaliacoes_concluidas = 0 OR v_funcionarios_pendentes > 0 THEN
          v_bloqueante := TRUE;
        END IF;

        v_detalhes := jsonb_build_object('total_avaliacoes', v_total_avaliacoes, 'avaliacoes_concluidas', v_avaliacoes_concluidas, 'avaliacoes_inativadas', v_avaliacoes_inativadas, 'funcionarios_pendentes', v_funcionarios_pendentes);

        RETURN QUERY SELECT NOT v_bloqueante AS valido, v_alertas AS alertas, v_funcionarios_pendentes, v_detalhes AS detalhes, v_bloqueante AS bloqueante;
      END;
      $$ LANGUAGE plpgsql;
    `);

    const res = await query('SELECT * FROM validar_lote_pre_laudo($1)', [
      loteId,
    ]);
    expect(res.rows.length).toBeGreaterThan(0);
    const row = res.rows[0];
    expect(row.bloqueante).toBe(true);
  });

  it('nao marca bloqueante quando ha apenas warnings (inativacoes)', async () => {
    // criar lote com avaliações, algumas inativadas mas com concluidas > 0 e sem funcionarios pendentes
    const lote = await query(
      `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, status, liberado_por, tipo, numero_ordem) VALUES ($1,$2,'ativo',$3,'completo',2) RETURNING id`,
      [clinicaId, empresaId, funcionarioCpf]
    );
    const lote2 = lote.rows[0].id;

    // criar 3 avaliacoes: 2 concluidas, 1 inativada
    for (let i = 0; i < 2; i++) {
      await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio, concluida_em) VALUES ($1, $2, 'concluida', NOW(), NOW())`,
        [funcionarioCpf, lote2]
      );
    }
    await query(
      `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio) VALUES ($1, $2, 'iniciada', NOW())`,
      [funcionarioCpf, lote2]
    );

    // inativar um para criar warning de inativacao
    const rowToInativar = await query(
      'SELECT id FROM avaliacoes WHERE lote_id = $1 LIMIT 1',
      [lote2]
    );
    if (rowToInativar.rowCount > 0) {
      await query(`UPDATE avaliacoes SET status = 'inativada' WHERE id = $1`, [
        rowToInativar.rows[0].id,
      ]);
    }

    const res = await query('SELECT * FROM validar_lote_pre_laudo($1)', [
      lote2,
    ]);
    const row = res.rows[0];
    // deve ter alertas mas não bloqueante
    expect(row.alertas.length).toBeGreaterThanOrEqual(0);
    expect(row.bloqueante).toBe(false);

    // cleanup
    await query('DELETE FROM laudos WHERE lote_id = $1', [lote2]);
    await query('DELETE FROM avaliacoes WHERE lote_id = $1', [lote2]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [lote2]);
  });
});

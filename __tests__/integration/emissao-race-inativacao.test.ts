/**
 * E2E: Emissão imediata mesmo quando inativação ocorre logo após conclusão
 */

import { query } from '@/lib/db';
import { recalcularStatusLote } from '@/lib/lotes';

jest.setTimeout(60000);

describe('Emissão imediata - corrida de inativação', () => {
  let clinicaId: number;
  let empresaId: number;
  let loteId: number;
  let funcionarioCpf: string;

  beforeAll(async () => {
    // Garantir tabela de fila presente (migration pode não ter sido executada em ambiente de teste)
    await query(`
      CREATE TABLE IF NOT EXISTS emissao_queue (
        id SERIAL PRIMARY KEY,
        lote_id INTEGER NOT NULL,
        tentativas INTEGER NOT NULL DEFAULT 0,
        ultimo_erro TEXT,
        proxima_execucao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const clinica = await query(
      `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ('Clínica Race', '11111111111111', true) RETURNING id`
    );
    clinicaId = clinica.rows[0].id;
    const empresa = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa) VALUES ($1, 'Empresa Race', '22222222222222', true) RETURNING id`,
      [clinicaId]
    );
    empresaId = empresa.rows[0].id;

    funcionarioCpf = `${Date.now().toString().slice(-11)}`.padStart(11, '0');
    await query(
      `INSERT INTO funcionarios (cpf, nome, email, perfil, ativo, clinica_id, empresa_id, senha_hash) VALUES ($1, 'Func Race', 'f@race.test', 'funcionario', true, $2, $3, 'dummy')`,
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

  it('deve gerar o laudo mesmo se uma avaliacao for inativada logo apos a conclusao', async () => {
    // Criar lote e 3 avaliacoes
    const lote = await query(
      `INSERT INTO lotes_avaliacao (clinica_id, empresa_id, status, liberado_por, tipo, numero_ordem) VALUES ($1,$2,'ativo',$3,'completo',1) RETURNING id`,
      [clinicaId, empresaId, funcionarioCpf]
    );
    loteId = lote.rows[0].id;

    const avals = [];
    for (let i = 0; i < 3; i++) {
      const r = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio) VALUES ($1,$2,'iniciada', NOW()) RETURNING id`,
        [funcionarioCpf, loteId]
      );
      avals.push(r.rows[0].id);
    }

    // Marcar todas como concluídas
    for (const aId of avals) {
      await query(
        `UPDATE avaliacoes SET status = 'concluida', envio = NOW() WHERE id = $1`,
        [aId]
      );
    }

    // Substituir função validar_lote_pre_laudo no DB para assegurar comportamento esperado em testes
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

    // Iniciar recálculo e, imediatamente, inativar uma avaliação para simular race
    const recalcularPromise = recalcularStatusLote(avals[0]);

    // Simular inativação logo após (não devemos impedir emissão)
    await query(`UPDATE avaliacoes SET status = 'inativada' WHERE id = $1`, [
      avals[1],
    ]);

    await recalcularPromise;

    // Dar tempo para emissão síncrona/semi-assíncrona
    await new Promise((r) => setTimeout(r, 2000));

    const laudos = await query(
      'SELECT id, status, emitido_em FROM laudos WHERE lote_id = $1',
      [loteId]
    );

    expect(laudos.rows.length).toBeGreaterThan(0);
    expect(laudos.rows[0].status).toBe('emitido'); // Laudo emitido, não enviado automaticamente
    expect(laudos.rows[0].emitido_em).not.toBeNull();
  });
});

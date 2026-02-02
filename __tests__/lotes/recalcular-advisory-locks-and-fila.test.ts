import { query } from '@/lib/db';
import { recalcularStatusLotePorId } from '@/lib/lotes';

describe('RecalcularStatus: advisory lock and fila idempotency', () => {
  it('inserts only one fila_emissao row when called twice for same lote', async () => {
    const clinica = await query(
      "INSERT INTO clinicas (nome) VALUES ('CLA') RETURNING id"
    );
    const clinicaId = clinica.rows[0].id;

    const codigo = 'TEST-COD-1-' + Math.floor(Math.random() * 1000000);
    const loteRes = await query(
      "INSERT INTO lotes_avaliacao (clinica_id, status, codigo, titulo) VALUES ($1, 'rascunho', $2,'Lote Teste') RETURNING id",
      [clinicaId, codigo]
    );
    const loteId = loteRes.rows[0].id;

    // Create one avaliacao concluded (counts towards completion)
    // Note: Inserting with 'concluida' may trigger auto-completion by trigger,
    // so we explicitly call recalcularStatusLotePorId to test idempotency
    await query(
      "INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, '00000000000', 'concluida')",
      [loteId]
    );

    // Call recalcularStatus twice - should insert fila_emissao only once
    await recalcularStatusLotePorId(loteId);
    await recalcularStatusLotePorId(loteId);

    const filaRes = await query(
      'SELECT COUNT(*) FROM fila_emissao WHERE lote_id = $1',
      [loteId]
    );
    expect(parseInt(filaRes.rows[0].count)).toBe(1);

    // Cleanup: remove fila, laudo and reset lote to allow deletions (protection de mutação ativa)
    await query('DELETE FROM fila_emissao WHERE lote_id = $1', [loteId]);
    // For safe cleanup, temporarily mark as emitted to bypass mutation protections, then reset
    await query('UPDATE lotes_avaliacao SET emitido_em = NOW() WHERE id = $1', [
      loteId,
    ]);
    await query(
      // Migration 130: processamento_em foi removida - sistema agora \u00e9 100% manual\n      \"UPDATE lotes_avaliacao SET status = 'ativo', emitido_em = NULL WHERE id = $1\",
      [loteId]
    );
    await query('DELETE FROM laudos WHERE lote_id = $1', [loteId]);
    await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
  });
});

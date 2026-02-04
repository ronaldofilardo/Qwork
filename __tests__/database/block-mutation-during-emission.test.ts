import { query } from '@/lib/db';

describe('Trigger: block mutations during emission', () => {
  it('should prevent updating an avaliacao when lote is concluido and emitido_em is NULL', async () => {
    // Setup: create a clinic, lote and avaliacao
    const clinicaRes = await query(
      "INSERT INTO clinicas (nome) VALUES ('TEST CLINIC') RETURNING id"
    );
    const clinicaId = clinicaRes.rows[0].id;

    const codigo = 'TEST-CODIGO-' + Math.floor(Math.random() * 1000000);
    const loteRes = await query(
      "INSERT INTO lotes_avaliacao (clinica_id, status) VALUES ($1, 'concluido') RETURNING id",
      [clinicaId, codigo]
    );
    const loteId = loteRes.rows[0].id;

    const avalRes = await query(
      "INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, '00000000000', 'iniciada') RETURNING id",
      [loteId]
    );
    const avaliacaoId = avalRes.rows[0].id;

    // Attempt to update the avaliacao - should be blocked by trigger
    await expect(
      query("UPDATE avaliacoes SET status = 'concluida' WHERE id = $1", [
        avaliacaoId,
      ])
    ).rejects.toThrow();

    // Cleanup
    await query('DELETE FROM avaliacoes WHERE id = $1', [avaliacaoId]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
  });
});

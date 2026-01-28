import { query } from '@/lib/db';
import { recalcularStatusLotePorId } from '@/lib/lotes';

describe('Lote status respecting liberadas filter', () => {
  it('should only consider liberadas for concluding a lote', async () => {
    const clinica = await query(
      "INSERT INTO clinicas (nome) VALUES ('CLA2') RETURNING id"
    );
    const clinicaId = clinica.rows[0].id;

    const codigo = 'TEST-COD-2-' + Math.floor(Math.random() * 1000000);
    const loteRes = await query(
      "INSERT INTO lotes_avaliacao (clinica_id, status, codigo, titulo) VALUES ($1, 'ativo', $2,'Lote Liberadas') RETURNING id",
      [clinicaId, codigo]
    );
    const loteId = loteRes.rows[0].id;

    // Create 3 avaliacoes: 2 concluded (liberadas cohort), 1 inativada (not considered liberada)
    await query(
      "INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, '00000000000', 'concluida')",
      [loteId]
    );
    await query(
      "INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, '00000000000', 'concluida')",
      [loteId]
    );
    await query(
      "INSERT INTO avaliacoes (lote_id, funcionario_cpf, status) VALUES ($1, '00000000000', 'inativada')",
      [loteId]
    );

    // Recalculate should mark lote as 'concluido' because liberadas (2) are all concluded
    const res = await recalcularStatusLotePorId(loteId);
    expect(res.novoStatus).toBe('concluido');

    // Cleanup
    await query('DELETE FROM avaliacoes WHERE lote_id = $1', [loteId]);
    await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]);
    await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
  });
});

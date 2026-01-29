import { query } from '@/lib/db';

describe('Lote ID allocator (fn_next_lote_id)', () => {
  it('retorna ids sequenciais dentro de uma transação', async () => {
    // Usamos transação para garantir que não vejamos efeitos permanentes no contador
    await query('BEGIN');
    try {
      const r1 = await query('SELECT fn_next_lote_id() as id');
      const r2 = await query('SELECT fn_next_lote_id() as id');

      const id1 = parseInt(r1.rows[0].id);
      const id2 = parseInt(r2.rows[0].id);

      expect(id2).toBe(id1 + 1);
    } finally {
      await query('ROLLBACK');
    }
  });
});

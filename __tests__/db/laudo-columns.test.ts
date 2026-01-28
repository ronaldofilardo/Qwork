import { query } from '@/lib/db';

describe('DB - laudos columns', () => {
  it('deve existir colunas relatorio_individual e hash_relatorio_individual', async () => {
    const res = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'laudos' AND column_name IN ('relatorio_individual', 'hash_relatorio_individual')
    `);

    const cols = res.rows.map((r) => r.column_name);
    expect(cols).toEqual(
      expect.arrayContaining([
        'relatorio_individual',
        'hash_relatorio_individual',
      ])
    );
  });
});

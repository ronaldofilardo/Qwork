import { query } from '@/lib/db';

describe('DB Schema: contratantes_senhas timestamps', () => {
  it('deve ter colunas de timestamps (criado_em/atualizado_em ou created_at/updated_at)', async () => {
    const res = await query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='contratantes_senhas'"
    );
    const cols = res.rows.map((r: any) => r.column_name);

    const hasPt = cols.includes('criado_em') && cols.includes('atualizado_em');
    const hasEn = cols.includes('created_at') && cols.includes('updated_at');

    expect(hasPt || hasEn).toBe(true);
  });
});

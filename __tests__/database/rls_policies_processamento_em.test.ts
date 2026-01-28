import { query } from '@/lib/db';

describe('RLS policies for processamento_em', () => {
  it('should have lotes_rh_update policy checking processamento_em IS NULL', async () => {
    const res = await query(
      "SELECT pg_get_expr(pol.polqual, pol.polrelid) as using_expr, pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check FROM pg_policy pol WHERE pol.polrelid = 'public.lotes_avaliacao'::regclass AND pol.polname = 'lotes_rh_update'"
    );
    expect(res.rows.length).toBe(1);
    const { using_expr, with_check } = res.rows[0];
    expect(using_expr).toMatch(/processamento_em IS NULL/);
    expect(with_check).toMatch(/processamento_em IS NULL/);
  });

  it('should have avaliacoes_own_update policy checking processamento_em IS NULL', async () => {
    const res = await query(
      "SELECT pg_get_expr(pol.polqual, pol.polrelid) as using_expr, pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check FROM pg_policy pol WHERE pol.polrelid = 'public.avaliacoes'::regclass AND pol.polname = 'avaliacoes_own_update'"
    );
    expect(res.rows.length).toBe(1);
    const { using_expr, with_check } = res.rows[0];
    expect(using_expr).toMatch(/processamento_em IS NULL/);
    expect(with_check).toMatch(/processamento_em IS NULL/);
  });
});

import { query } from '@/lib/db';
import { Session } from '@/lib/session';

describe('RLS: context visibility in queries', () => {
  it('should expose current_setting values when calling query with session', async () => {
    const session: Session = {
      cpf: '99999999999',
      nome: 'Teste RLS',
      perfil: 'gestor_entidade',
      clinica_id: undefined,
    } as Session;

    const cpfRes = await query(
      "SELECT current_setting('app.current_user_cpf', true) AS val",
      [],
      session
    );

    expect(cpfRes.rows[0].val).toBe(session.cpf);

    const perfilRes = await query(
      "SELECT current_setting('app.current_user_perfil', true) AS val",
      [],
      session
    );

    expect(perfilRes.rows[0].val).toBe(session.perfil);

    const clinicaRes = await query(
      "SELECT current_setting('app.current_user_clinica_id', true) AS val",
      [],
      session
    );

    // Expect empty string when clinica_id undefined
    expect(clinicaRes.rows[0].val).toBe('');
  });
});

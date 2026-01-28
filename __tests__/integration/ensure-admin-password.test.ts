import { query } from '@/lib/db';
import { ensureAdminPassword } from '@/lib/db';
import bcrypt from 'bcryptjs';

describe('Inicialização: garantir hash do admin (dev/test)', () => {
  it('corrige hash corrompido do admin', async () => {
    // Forçar hash corrompido (upsert com campos que respeitam constraints)
    // Garantir clinica válida para satisfazer constraints
    const clinicaRes = await query('SELECT id FROM clinicas LIMIT 1');
    const clinicaId = clinicaRes.rows[0]?.id || 1;

    await query(
      `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, clinica_id) VALUES ('00000000000', 'Admin Corrupt', 'admin@bps.com', 'corrupt_hash', 'admin', true, $1) ON CONFLICT (cpf) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, nome = EXCLUDED.nome`,
      [clinicaId]
    );

    // Executar rotina de correção
    await ensureAdminPassword();

    // Verificar que agora o hash valida para 123456
    const res = await query(
      'SELECT senha_hash FROM funcionarios WHERE cpf = $1',
      ['00000000000']
    );
    expect(res.rows.length).toBeGreaterThan(0);
    const hash = res.rows[0].senha_hash;

    const valid = await bcrypt.compare('123456', hash);
    expect(valid).toBe(true);
  });
});

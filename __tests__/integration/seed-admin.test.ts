import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Este teste aplica o mesmo SQL do seed e verifica que o admin (cpf '00000000000') existe
// e que a senha padrão '123' bate com o hash armazenado.

describe('Seed: admin', () => {
  beforeAll(async () => {
    // Aplicar seed (idempotente)
    await query(`
      INSERT INTO funcionarios (cpf, nome, perfil, senha_hash, ativo, criado_em, atualizado_em)
      VALUES ('00000000000','Admin','admin','$2a$10$7VOFZGC2.aJozBaascY3Zu6zWPEocQe0PWQ3Dd4laAT83cLN/F9Ya', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (cpf) DO UPDATE
      SET nome = EXCLUDED.nome,
          perfil = EXCLUDED.perfil,
          senha_hash = EXCLUDED.senha_hash,
          ativo = EXCLUDED.ativo,
          atualizado_em = CURRENT_TIMESTAMP;
    `);
  });

  it('should ensure admin exists and password matches', async () => {
    const res = await query(
      'SELECT cpf, perfil, ativo, senha_hash FROM funcionarios WHERE cpf = $1',
      ['00000000000']
    );
    expect(res.rows.length).toBe(1);
    const row = res.rows[0];

    expect(row.cpf).toBe('00000000000');
    expect(row.perfil).toBe('admin');
    expect(row.ativo).toBe(true);
    expect(row.senha_hash).toBeTruthy();

    const matches = bcrypt.compareSync('123', row.senha_hash);
    expect(matches).toBe(true);
  });
});

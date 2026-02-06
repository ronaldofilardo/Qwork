import { Pool } from 'pg';

const pool = new Pool({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db_test',
});

const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL app.current_user_cpf = '00000000000'");
    await client.query("SET LOCAL app.current_user_perfil = 'admin'");
    const res = await client.query(text, params);
    await client.query('COMMIT');
    return res;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

afterAll(async () => {
  await pool.end();
});

describe('Migration 300 - Integridade de dados', () => {
  it('deve migrar a mesma quantidade de usuários que o backup', async () => {
    const migrated = await query(
      "SELECT COUNT(*)::int AS cnt FROM usuarios WHERE tipo_usuario IN ('admin','emissor','gestor','rh')"
    );
    const backup = await query(
      'SELECT COUNT(*)::int AS cnt FROM funcionarios_backup_pre_300'
    );

    const m = parseInt(migrated.rows[0].cnt);
    const b = parseInt(backup.rows[0].cnt);

    expect(m).toBeGreaterThanOrEqual(0);
    // A expectativa é que a migração copie todos os registros do backup
    expect(m).toBe(b);
  });

  it('deve remover usuários do sistema da tabela `funcionarios`', async () => {
    const res = await query(
      "SELECT COUNT(*)::int AS cnt FROM funcionarios WHERE usuario_tipo IN ('admin','emissor','gestor','rh')"
    );
    expect(parseInt(res.rows[0].cnt)).toBe(0);
  });

  it('deve ter registros de migração em `usuarios_migracao_log`', async () => {
    const res = await query(
      'SELECT COUNT(*)::int AS cnt FROM usuarios_migracao_log'
    );
    expect(parseInt(res.rows[0].cnt)).toBeGreaterThanOrEqual(1);
  });
});

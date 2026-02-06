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
    // padrão de contexto seguro para testes
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

describe('Migration 300 - Estrutura básica', () => {
  it('deve existir a tabela `usuarios`', async () => {
    const res = await query(
      "SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_name = 'usuarios'"
    );
    expect(parseInt(res.rows[0].cnt)).toBeGreaterThanOrEqual(1);
  });

  it('deve existir a tabela de log `usuarios_migracao_log`', async () => {
    const res = await query(
      "SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_name = 'usuarios_migracao_log'"
    );
    expect(parseInt(res.rows[0].cnt)).toBeGreaterThanOrEqual(1);
  });

  it('deve existir o backup `funcionarios_backup_pre_300`', async () => {
    const res = await query(
      "SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_name = 'funcionarios_backup_pre_300'"
    );
    expect(parseInt(res.rows[0].cnt)).toBeGreaterThanOrEqual(1);
  });

  it('tabela `usuarios` deve conter colunas principais (cpf, tipo_usuario, senha_hash)', async () => {
    const res = await query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'"
    );
    const cols = res.rows.map((r: any) => r.column_name);
    expect(cols).toEqual(
      expect.arrayContaining(['cpf', 'tipo_usuario', 'senha_hash', 'email'])
    );
  });
});

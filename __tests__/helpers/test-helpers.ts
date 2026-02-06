import { query } from '@/lib/db';

/**
 * Configura RLS para testes - deve ser chamado antes de qualquer query
 */
export async function setupTestRLS(cpf: string = '00000000000') {
  await query(`SET LOCAL app.current_user_cpf = '${cpf}'`);
  await query(`SET LOCAL app.current_user_perfil = 'admin'`);
}

/**
 * Cria um cliente de banco isolado com RLS configurado
 */
export async function createTestClient(cpf: string = '00000000000') {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const client = await pool.connect();

  // Configurar RLS no cliente isolado
  await client.query(`SET LOCAL app.current_user_cpf = '${cpf}'`);
  await client.query(`SET LOCAL app.current_user_perfil = 'admin'`);

  // Retornar cliente e pool para cleanup
  return { client, pool };
}

/**
 * Cria um usuário de teste simples (sem RLS)
 */
export async function createTestUser(overrides: any = {}) {
  const cpf =
    overrides.cpf ||
    `${Math.floor(Math.random() * 1e11)
      .toString()
      .padStart(11, '0')}`;
  const perfil = overrides.perfil || 'rh';
  const nome = overrides.nome || 'Test User';

  const result = await query(
    `INSERT INTO funcionarios (cpf, nome, perfil) VALUES ($1, $2, $3) RETURNING *`,
    [cpf, nome, perfil]
  );
  return result.rows[0];
}

/**
 * Cria uma clínica de teste simples
 */
export async function createTestClinica(overrides: any = {}) {
  const cnpj =
    overrides.cnpj ||
    `${Math.floor(Math.random() * 1e14)
      .toString()
      .padStart(14, '0')}`;
  const nome = overrides.nome || 'Clinica Test';

  const result = await query(
    `INSERT INTO clinicas (nome, cnpj, ativa) VALUES ($1, $2, true) RETURNING *`,
    [nome, cnpj]
  );
  return result.rows[0];
}

/**
 * Cria um lote de avaliação de teste
 */
export async function createTestLote(overrides: any = {}) {
  const clinicaId = overrides.clinicaId;
  const status = overrides.status || 'rascunho';

  const { client, pool } = await createTestClient('00000000000');
  try {
    // Gerar ID manualmente para evitar dependência da função default
    const idResult = await client.query(
      "SELECT nextval('lotes_avaliacao_id_seq') as id"
    );
    const id = idResult.rows[0].id;

    const result = await client.query(
      `INSERT INTO lotes_avaliacao (id, clinica_id, status) VALUES ($1, $2, $3) RETURNING *`,
      [id, clinicaId, status]
    );
    return result.rows[0];
  } finally {
    client.release();
    await pool.end();
  }
}

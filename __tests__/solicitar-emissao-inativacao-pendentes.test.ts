/**
 * Testes: Inativação de avaliações pendentes ao solicitar emissão do laudo
 *
 * Comportamento novo (27/03/2026):
 *  - Ao solicitar emissão, avaliações 'iniciada' ou 'em_andamento' são
 *    automaticamente inativadas com motivo
 *    'Emissão solicitada - avaliação não concluída no prazo'
 *  - Avaliações já 'concluida' ou 'inativada' NÃO são afetadas
 *  - A inativação ocorre dentro da transação com advisory lock (atômica)
 *  - Após inativação, funcionário recebe 409 ao tentar submeter respostas
 *    (rota /api/avaliacao/respostas já trata status 'inativada')
 */

import { query } from '@/lib/db';
import { Pool as PgPool } from 'pg';

// ─── Pool + cliente RLS compartilhado ────────────────────────────────────────
// Funções audit_trigger_func() (em funcionarios, avaliacoes, lotes_avaliacao)
// exigem SET SESSION app.current_user_cpf. Usamos um cliente dedicado com
// contexto de sessão configurado para TODOS os INSERTs, UPDATEs e DELETEs.

const setupPool = new PgPool({
  connectionString: process.env.TEST_DATABASE_URL,
});
afterAll(async () => {
  await setupPool.end().catch(() => {});
});

type PgClient = Awaited<ReturnType<InstanceType<typeof PgPool>['connect']>>;
let rls: PgClient | null = null;

async function initRLS(): Promise<PgClient> {
  const client = await setupPool.connect();
  await client.query(`SET SESSION app.current_user_cpf = '00000000000'`);
  await client.query(`SET SESSION app.current_user_perfil = 'rh'`);
  await client.query(`SET SESSION app.client_ip = '127.0.0.1'`);
  return client;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const ts = Date.now();
const cnpjBase = String(ts).slice(-8);

/** entidades NÃO tem audit_trigger_func — query() é suficiente */
async function criarEntidade(suffix: string): Promise<number> {
  const result = await query(
    `INSERT INTO entidades (
      tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
      responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa
    ) VALUES (
      'entidade', $1, $2, $3, '11999999999', 'Rua Teste', 'São Paulo', 'SP', '01234567',
      'Resp Teste', '11111111111', $4, '11988888888', true
    ) RETURNING id`,
    [
      `Ent Emissão ${cnpjBase}${suffix}`,
      `${cnpjBase}${suffix}`,
      `ent${cnpjBase}${suffix}@test.local`,
      `resp${cnpjBase}${suffix}@test.local`,
    ]
  );
  return result.rows[0].id;
}

/** lotes_avaliacao tem audit_lote_change — usa rls client */
async function criarLote(
  entidadeId: number,
  descricao: string
): Promise<number> {
  const result = await rls!.query(
    `INSERT INTO lotes_avaliacao (entidade_id, descricao, tipo, status, numero_ordem)
     VALUES ($1, $2, 'completo', 'concluido', 1)
     RETURNING id`,
    [entidadeId, descricao]
  );
  return result.rows[0].id;
}

/** funcionarios tem audit_trigger_func — usa rls client */
async function criarFuncionario(cpf: string): Promise<void> {
  await rls!.query(
    `INSERT INTO funcionarios (cpf, nome, senha_hash, ativo, criado_em)
     VALUES ($1, 'Func Teste', 'noop', true, NOW())
     ON CONFLICT (cpf) DO NOTHING`,
    [cpf]
  );
}

/** avaliacoes tem audit_trigger_func — usa rls client */
async function criarAvaliacao(
  cpf: string,
  loteId: number,
  status: string
): Promise<void> {
  await rls!.query(
    `INSERT INTO avaliacoes (funcionario_cpf, lote_id, status, inicio)
     VALUES ($1, $2, $3, NOW())`,
    [cpf, loteId, status]
  );
}

/** Reproduz exatamente o SQL que a rota executa dentro da transação */
async function simularInativacaoPorEmissao(loteId: number): Promise<number> {
  const result = await rls!.query(
    `UPDATE avaliacoes
     SET status = 'inativada',
         inativada_em = NOW(),
         motivo_inativacao = 'Emissão solicitada - avaliação não concluída no prazo'
     WHERE lote_id = $1
       AND status IN ('iniciada', 'em_andamento')`,
    [loteId]
  );
  return result.rowCount ?? 0;
}

/** Limpeza de lote + avaliações + funcionários usando rls client */
async function cleanupLote(
  lotId: number,
  cpfs: string[],
  entId: number
): Promise<void> {
  await rls!.query(`DELETE FROM avaliacoes WHERE lote_id = $1`, [lotId]);
  await rls!.query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [lotId]);
  if (cpfs.length > 0) {
    await rls!.query(
      `DELETE FROM funcionarios WHERE cpf = ANY($1::char(11)[])`,
      [cpfs]
    );
  }
  await query(`DELETE FROM entidades WHERE id = $1`, [entId]);
}

// ─── suite principal ──────────────────────────────────────────────────────────

describe('Inativação de avaliações pendentes ao solicitar emissão', () => {
  let entidadeId: number;
  let loteId: number;
  const cpfIniciada = `${cnpjBase}i01`;
  const cpfEmAndament = `${cnpjBase}e02`;
  const cpfConcluida = `${cnpjBase}c03`;
  const cpfJaInativ = `${cnpjBase}j04`;

  beforeAll(async () => {
    rls = await initRLS();

    // Arrange: entidade + lote + 4 avaliações em estados diferentes
    entidadeId = await criarEntidade('0001');
    loteId = await criarLote(entidadeId, 'Lote Inativação Principal');
    await criarFuncionario(cpfIniciada);
    await criarFuncionario(cpfEmAndament);
    await criarFuncionario(cpfConcluida);
    await criarFuncionario(cpfJaInativ);
    await criarAvaliacao(cpfIniciada, loteId, 'iniciada');
    await criarAvaliacao(cpfEmAndament, loteId, 'em_andamento');
    await criarAvaliacao(cpfConcluida, loteId, 'concluida');
    await criarAvaliacao(cpfJaInativ, loteId, 'inativada'); // sem motivo

    // Act: simular o que a rota POST solicitar-emissao executa
    await simularInativacaoPorEmissao(loteId);
  });

  afterAll(async () => {
    await cleanupLote(
      loteId,
      [cpfIniciada, cpfEmAndament, cpfConcluida, cpfJaInativ],
      entidadeId
    );
    rls?.release();
    rls = null;
  });

  // ── 1. Avaliações que devem ser inativadas ─────────────────────────────────

  it('deve inativar avaliação com status iniciada', async () => {
    const result = await query(
      `SELECT status, motivo_inativacao, inativada_em
       FROM avaliacoes WHERE lote_id = $1 AND funcionario_cpf = $2`,
      [loteId, cpfIniciada]
    );
    expect(result.rows[0].status).toBe('inativada');
    expect(result.rows[0].motivo_inativacao).toBe(
      'Emissão solicitada - avaliação não concluída no prazo'
    );
    expect(result.rows[0].inativada_em).not.toBeNull();
  });

  it('deve inativar avaliação com status em_andamento', async () => {
    const result = await query(
      `SELECT status, motivo_inativacao, inativada_em
       FROM avaliacoes WHERE lote_id = $1 AND funcionario_cpf = $2`,
      [loteId, cpfEmAndament]
    );
    expect(result.rows[0].status).toBe('inativada');
    expect(result.rows[0].motivo_inativacao).toBe(
      'Emissão solicitada - avaliação não concluída no prazo'
    );
    expect(result.rows[0].inativada_em).not.toBeNull();
  });

  // ── 2. Avaliações que NÃO devem ser afetadas ──────────────────────────────

  it('NÃO deve afetar avaliação já concluida', async () => {
    const result = await query(
      `SELECT status FROM avaliacoes WHERE lote_id = $1 AND funcionario_cpf = $2`,
      [loteId, cpfConcluida]
    );
    expect(result.rows[0].status).toBe('concluida');
  });

  it('NÃO deve sobrescrever motivo de avaliação já inativada antes da solicitação', async () => {
    // A avaliação cpfJaInativ estava inativada sem motivo (NULL).
    // O WHERE status IN ('iniciada', 'em_andamento') garante que não é tocada.
    const result = await query(
      `SELECT status, motivo_inativacao
       FROM avaliacoes WHERE lote_id = $1 AND funcionario_cpf = $2`,
      [loteId, cpfJaInativ]
    );
    expect(result.rows[0].status).toBe('inativada');
    expect(result.rows[0].motivo_inativacao).toBeNull();
  });

  // ── 3. Contagem de linhas afetadas ────────────────────────────────────────

  it('deve afetar exatamente 2 avaliações (iniciada + em_andamento)', async () => {
    const result = await query(
      `SELECT COUNT(*) as total
       FROM avaliacoes
       WHERE lote_id = $1
         AND status = 'inativada'
         AND motivo_inativacao = 'Emissão solicitada - avaliação não concluída no prazo'`,
      [loteId]
    );
    expect(parseInt(result.rows[0].total)).toBe(2);
  });

  it('deve resultar em 3 avaliações inativadas total (2 novas + 1 prévia)', async () => {
    const result = await query(
      `SELECT COUNT(*) as total
       FROM avaliacoes WHERE lote_id = $1 AND status = 'inativada'`,
      [loteId]
    );
    expect(parseInt(result.rows[0].total)).toBe(3);
  });

  it('deve manter 1 avaliação concluida no lote', async () => {
    const result = await query(
      `SELECT COUNT(*) as total
       FROM avaliacoes WHERE lote_id = $1 AND status = 'concluida'`,
      [loteId]
    );
    expect(parseInt(result.rows[0].total)).toBe(1);
  });

  // ── 4. rowCount retornado pelo UPDATE ─────────────────────────────────────

  it('simularInativacaoPorEmissao retorna rowCount = 2 para lote com 2 pendentes', async () => {
    const entId = await criarEntidade('0002');
    const lotId = await criarLote(entId, 'Lote rowCount 2');
    const cpfA = `${cnpjBase}a05`;
    const cpfB = `${cnpjBase}b06`;
    await criarFuncionario(cpfA);
    await criarFuncionario(cpfB);
    await criarAvaliacao(cpfA, lotId, 'iniciada');
    await criarAvaliacao(cpfB, lotId, 'em_andamento');

    const rowCount = await simularInativacaoPorEmissao(lotId);
    expect(rowCount).toBe(2);

    await cleanupLote(lotId, [cpfA, cpfB], entId);
  });

  it('simularInativacaoPorEmissao retorna rowCount = 0 quando não há pendentes', async () => {
    const entId = await criarEntidade('0003');
    const lotId = await criarLote(entId, 'Lote rowCount 0');
    const cpfC = `${cnpjBase}c07`;
    await criarFuncionario(cpfC);
    await criarAvaliacao(cpfC, lotId, 'concluida');

    const rowCount = await simularInativacaoPorEmissao(lotId);
    expect(rowCount).toBe(0);

    await cleanupLote(lotId, [cpfC], entId);
  });

  // ── 5. Schema — colunas necessárias existem ───────────────────────────────

  it('tabela avaliacoes deve ter coluna inativada_em', async () => {
    const result = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'avaliacoes' AND column_name = 'inativada_em'`
    );
    expect(result.rows.length).toBe(1);
  });

  it('tabela avaliacoes deve ter coluna motivo_inativacao', async () => {
    const result = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'avaliacoes' AND column_name = 'motivo_inativacao'`
    );
    expect(result.rows.length).toBe(1);
  });
});

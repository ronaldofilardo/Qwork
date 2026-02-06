require('dotenv').config({ path: '.env.local' });
const { query } = require('../../lib/db');

async function ensureIndexOnClinicas() {
  // Verificar índice único em clinicas.contratante_id
  const idx = await query(
    "SELECT indexname FROM pg_indexes WHERE tablename = 'clinicas' AND indexdef ILIKE '%contratante_id%';"
  );
  if (idx.rows.some((r) => r.indexname.includes('contratante'))) {
    console.log(
      'Índice em clinicas.contratante_id já existe:',
      idx.rows.map((r) => r.indexname)
    );
    return;
  }

  console.log('Criando índice único idx_clinicas_contratante_id_unique...');
  await query(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_clinicas_contratante_id_unique ON clinicas (contratante_id)'
  );
  console.log('Índice criado.');
}

async function ensureGerarHashOverload() {
  // Testar chamada da função com timestamptz
  try {
    await query(
      "SELECT gerar_hash_auditoria('contratante', 1, 'teste', '{}'::jsonb, NOW()::timestamptz) as h"
    );
    console.log('Função gerar_hash_auditoria(TIMESTAMPTZ) existe.');
    return;
  } catch (err) {
    console.warn(
      'Função gerar_hash_auditoria(TIMESTAMPTZ) ausente. Criando...'
    );
    const sql = `
CREATE OR REPLACE FUNCTION gerar_hash_auditoria(
  p_entidade_tipo VARCHAR,
  p_entidade_id INTEGER,
  p_acao VARCHAR,
  p_dados JSONB,
  p_timestamp TIMESTAMPTZ
) RETURNS VARCHAR AS $$
DECLARE
  v_concatenado TEXT;
BEGIN
  v_concatenado := p_entidade_tipo || '|' || COALESCE(p_entidade_id::TEXT, 'NULL') || '|' || p_acao || '|' || COALESCE(p_dados::TEXT, '{}') || '|' || p_timestamp::TEXT;
  RETURN encode(digest(v_concatenado, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
`;
    await query(sql);
    console.log('Função criada.');
  }
}

async function ensureContratantesSenhasColumns() {
  const cols = await query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'entidades_senhas' ORDER BY ordinal_position"
  );
  const existing = cols.rows.map((r) => r.column_name);
  console.log('Colunas atuais de entidades_senhas:', existing.join(', '));

  const needs = [];
  if (!existing.includes('contratante_id'))
    needs.push(
      'ALTER TABLE entidades_senhas ADD COLUMN contratante_id INTEGER'
    );
  if (!existing.includes('created_at'))
    needs.push('ALTER TABLE entidades_senhas ADD COLUMN created_at TIMESTAMP');
  if (!existing.includes('updated_at'))
    needs.push('ALTER TABLE entidades_senhas ADD COLUMN updated_at TIMESTAMP');

  for (const sql of needs) {
    console.log('Aplicando:', sql);
    await query(sql);
  }

  if (needs.length === 0)
    console.log('Nenhuma alteração necessária em entidades_senhas.');

  // Tentar popular contratante_id a partir de contratantes.responsavel_cpf
  console.log(
    'Populando contratante_id em entidades_senhas quando possível...'
  );
  await query(`
    UPDATE entidades_senhas cs
    SET contratante_id = c.id
    FROM contratantes c
    WHERE cs.cpf = c.responsavel_cpf
      AND cs.contratante_id IS NULL
  `);

  const nullCount = await query(
    'SELECT COUNT(*) as total FROM entidades_senhas WHERE contratante_id IS NULL'
  );
  console.log(
    'entidades_senhas com contratante_id NULL após tentativa:',
    nullCount.rows[0].total
  );

  // Se não houver nulos, podemos definir NOT NULL (opcional)
  if (parseInt(nullCount.rows[0].total, 10) === 0) {
    try {
      await query(
        'ALTER TABLE entidades_senhas ALTER COLUMN contratante_id SET NOT NULL'
      );
      console.log('Setado NOT NULL em entidades_senhas.contratante_id');
    } catch (err) {
      console.warn(
        'Não foi possível setar NOT NULL (provavelmente já existe ou há restrições):',
        err.message
      );
    }
  }
}

async function runAll() {
  try {
    console.log(
      '\nIniciando verificação/sincronização de schema (local nr-bps_db)'
    );
    await ensureIndexOnClinicas();
    await ensureGerarHashOverload();
    await ensureContratantesSenhasColumns();
    console.log('\nSincronização concluída.');
  } catch (err) {
    console.error('Erro durante sincronização:', err.message);
    process.exit(1);
  }
}

runAll();

#!/usr/bin/env node
/*
  Script: run-reset-cris-lock.mjs
  Objetivo: Atualizar o funcionário (por CPF) para "nunca avaliado" (indice_avaliacao = 0, data_ultimo_lote = NULL)
  Uso: node scripts/run-reset-cris-lock.mjs --cpf 04180818914 [--yes]

  O script é intencionalmente seguro: faz checagens, mostra o estado atual e pede confirmação antes de aplicar.
*/

import pg from 'pg';
import readline from 'readline';

const argv = process.argv.slice(2);
function parseArg(name) {
  const idx = argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return null;
  const val = argv[idx + 1];
  return val && !val.startsWith('--') ? val : true;
}

const cpf = parseArg('cpf') || '04180818914';
const autoYes = !!parseArg('yes');

const connectionString =
  process.env.LOCAL_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:123456@localhost:5432/nr-bps_db';

function getDbNameFromUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\//g, '');
  } catch (err) {
    return null;
  }
}

async function promptYesNo(question) {
  if (autoYes) return true;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question + ' (y/N): ', (answer) => {
      rl.close();
      const ok = ['y', 'Y', 'yes', 'YES'].includes(answer.trim());
      resolve(ok);
    });
  });
}

(async function main() {
  console.log(
    '> Conexão:',
    connectionString.replace(/password=[^&\s]+/g, 'password=***')
  );
  const dbName = getDbNameFromUrl(connectionString);
  console.log('> Banco detectado:', dbName || 'desconhecido');

  if (!dbName) {
    const ok = await promptYesNo(
      'Não consegui detectar o nome do banco na URL. Deseja continuar?'
    );
    if (!ok) {
      console.log(
        'Abortando. Forneça uma conexão válida via LOCAL_DATABASE_URL ou DATABASE_URL.'
      );
      process.exit(1);
    }
  }

  if (
    connectionString.includes('neon') ||
    connectionString.includes('vercel') ||
    (process.env.NODE_ENV === 'production' &&
      !connectionString.includes('nr-bps_db'))
  ) {
    const ok = await promptYesNo(
      'Parece uma conexão de produção. Tem certeza que deseja prosseguir?'
    );
    if (!ok) {
      console.log('Abortando por segurança.');
      process.exit(1);
    }
  }

  const pool = new pg.Pool({ connectionString, max: 5 });
  const client = await pool.connect();

  try {
    // Mostrar estado atual do funcionário
    const res = await client.query(
      `SELECT id, cpf, nome, indice_avaliacao, data_ultimo_lote FROM funcionarios WHERE cpf = $1`,
      [cpf]
    );

    if (res.rowCount === 0) {
      console.error('Funcionário não encontrado com CPF:', cpf);
      process.exit(1);
    }

    const f = res.rows[0];
    console.log('\n=== Estado atual ===');
    console.table(f);

    // Mostrar avaliações relacionadas (se houver)
    const av = await client.query(
      `SELECT id, lote_id, status, inicio, envio FROM avaliacoes WHERE funcionario_cpf = $1 ORDER BY id`,
      [cpf]
    );
    console.log('\nAvaliações encontradas:', av.rowCount);
    if (av.rowCount > 0) console.table(av.rows);

    const confirm = await promptYesNo(
      `Confirma reset de ${f.nome} (CPF ${cpf}) para *nunca avaliado*?`
    );
    if (!confirm) {
      console.log('Operação cancelada pelo usuário.');
      process.exit(0);
    }

    // Executar update em transação
    await client.query('BEGIN');

    const updateRes = await client.query(
      `UPDATE funcionarios SET indice_avaliacao = 0, data_ultimo_lote = NULL, atualizado_em = NOW() WHERE cpf = $1 RETURNING id, cpf, nome, indice_avaliacao, data_ultimo_lote`,
      [cpf]
    );

    // Mostrar resultado do UPDATE para debug
    console.log('\n[DEBUG] Resultado do UPDATE:', updateRes.rows[0]);

    // Registrar auditoria: preferir a função audit_log_with_context e fazer fallback para insert defensivo
    try {
      const auditRes = await client.query(
        `SELECT public.audit_log_with_context($1, $2, $3, $4, $5, NULL, NULL) AS id`,
        [
          'funcionarios',
          'RESET_NUNCA_AVALIADO',
          String(updateRes.rows[0].id),
          JSON.stringify(updateRes.rows[0]),
          null,
        ]
      );

      console.log('[DEBUG] audit_log_with_context id:', auditRes.rows[0]?.id);
    } catch (auditErr) {
      console.warn(
        '[DEBUG] audit_log_with_context failed, falling back:',
        auditErr.message || auditErr
      );

      // Fallback: tentar detectar esquema (PT/EN) e inserir manualmente
      try {
        const colsRes = await client.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs'"
        );
        const cols = colsRes.rows.map((r) => r.column_name);

        if (cols.length === 0) {
          console.warn(
            '[DEBUG] Tabela audit_logs não encontrada ou sem colunas'
          );
        } else if (cols.includes('action')) {
          // Schema em inglês
          await client.query(
            `INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, new_data, details, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              null,
              'sistema',
              'RESET_NUNCA_AVALIADO',
              'funcionarios',
              String(updateRes.rows[0].id),
              JSON.stringify(updateRes.rows[0]),
              'Solicitado pelo operador - lote deletado 006-050126',
            ]
          );
        } else if (cols.includes('acao')) {
          // Schema em português legado
          await client.query(
            `INSERT INTO audit_logs (acao, entidade, entidade_id, dados, user_id, user_role, criado_em)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              'reset_para_nunca_avaliado',
              'funcionarios',
              updateRes.rows[0].id,
              JSON.stringify({
                motivo: 'Solicitado pelo operador - lote deletado 006-050126',
                resultado: updateRes.rows[0],
              }),
              null,
              'sistema',
            ]
          );
        } else {
          console.warn(
            '[DEBUG] Estrutura de audit_logs não reconhecida. Pulando inserção de auditoria.'
          );
        }
      } catch (secondaryErr) {
        console.warn(
          '[DEBUG] Erro ao inserir audit_logs no fallback:',
          secondaryErr.message || secondaryErr
        );
      }
    }

    await client.query('COMMIT');

    console.log('\n✅ Operação aplicada com sucesso. Estado final:');
    const final = await client.query(
      `SELECT id, cpf, nome, indice_avaliacao, data_ultimo_lote FROM funcionarios WHERE cpf = $1`,
      [cpf]
    );
    console.table(final.rows[0]);

    process.exit(0);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('Erro durante rollback:', rbErr);
    }
    console.error('Erro executando operação:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();

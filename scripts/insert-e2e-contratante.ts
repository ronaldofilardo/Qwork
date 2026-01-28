#!/usr/bin/env tsx
/**
 * Script de utilitário para E2E: insere um contratante, contrato aceito e um pagamento pendente
 * Retorna JSON na saída padrão: { contratanteId, contratoId, pagamentoId }
 * Uso: npx tsx scripts/insert-e2e-contratante.ts -- --cnpj 123... --cpf 000... --nome "Empresa" --email a@b
 */
import { query } from '../lib/db';

// Segurança: impedir execução acidental contra bancos não-testes
if (
  !process.env.TEST_DATABASE_URL ||
  !String(process.env.TEST_DATABASE_URL).includes('_test')
) {
  if (process.env.ALLOW_NON_TEST_DB === 'true') {
    console.warn(
      '⚠️ AVISO: TEST_DATABASE_URL não aponta para um banco de teste, mas OVERRIDE habilitado via ALLOW_NON_TEST_DB=true. Prosseguindo sob sua responsabilidade.'
    );
  } else {
    console.error(
      '🚨 ERRO: TEST_DATABASE_URL não está definido ou não aponta para o banco de testes (nr-bps_db_test). Para proteger seus dados, o script foi abortado. Execute com TEST_DATABASE_URL apontando para nr-bps_db_test ou defina ALLOW_NON_TEST_DB=true para forçar a execução.'
    );
    process.exit(1);
  }
}

// Simple arg parsing to avoid extra deps (format: --cnpj VALUE --cpf VALUE --nome "VALUE" --email VALUE)
function parseArgs() {
  const args = process.argv.slice(2);
  const out: any = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = args[i + 1];
      out[key] = val;
      i++;
    }
  }
  return out;
}

const argv = parseArgs();

async function run() {
  try {
    const { cnpj, cpf, nome, email } = argv;

    // Inserir contratante
    const contratanteRes = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        endereco, cidade, estado, cep, status, ativa, numero_funcionarios_estimado
      ) VALUES (
        'entidade', $1, $2, $3, '(11) 90000-0000',
        'Resp E2E', $4, $3, '(11) 90000-0001',
        'Rua E2E', 'Cidade', 'SP', '00000-000', 'aguardando_pagamento', false, 1
      ) RETURNING id`,
      [nome, cnpj, email, cpf]
    );

    const contratanteId = contratanteRes.rows[0].id;

    // Criar contrato (aceito true)
    const contratoRes = await query(
      `INSERT INTO contratos (contratante_id, plano_id, aceito, hash_contrato, criado_em)
       SELECT $1, plano_id, true, md5(random()::text), CURRENT_TIMESTAMP
       FROM contratantes WHERE id = $1
       RETURNING id`,
      [contratanteId]
    );

    const contratoId = contratoRes.rows[0].id;

    // Inicializar pagamento
    const pagamentoRes = await query(
      `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, numero_parcelas, criado_em)
       VALUES ($1, $2, 1500.00, 'pendente', 'boleto', 1, CURRENT_TIMESTAMP)
       RETURNING id`,
      [contratanteId, contratoId]
    );

    const pagamentoId = pagamentoRes.rows[0].id;

    console.log(JSON.stringify({ contratanteId, contratoId, pagamentoId }));
    process.exit(0);
  } catch (err: any) {
    console.error('ERROR', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();

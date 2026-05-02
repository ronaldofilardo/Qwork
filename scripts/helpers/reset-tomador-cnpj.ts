#!/usr/bin/env node
/**
 * Reset Tomador por CNPJ — Volta para momento de aceitar contrato
 *
 * Uso:
 *   pnpm reset:tomador <CNPJ> [--prod] [--confirm]
 *
 * Exemplo PROD:
 *   pnpm reset:tomador 24165361000156 --prod
 *
 * O que faz:
 * 1. Encontra clínica por CNPJ
 * 2. Busca o login do gestor em clinicas_senhas
 * 3. Reseta a senha para os últimos 6 dígitos do CNPJ
 * 4. Volta contrato para aceito=false / status=aguardando_aceite
 * 5. Limpa aceites de termos LGPD (aceites_termos_usuario + aceites_termos_entidade)
 * 6. Remove tokens de reset pendentes em usuarios
 * 7. Salva auditoria em logs/reset-tomador/*.json
 */

import 'dotenv/config';

import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIPOS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ClinicaData {
  id: number;
  cnpj: string;
  nome: string;
}

interface GestorLoginData {
  id: number;
  clinica_id: number;
  cpf: string;
  primeira_senha_alterada: boolean;
}

interface ContratoData {
  id: number;
  tomador_id: number;
  tipo_tomador: string;
  aceito: boolean;
  status: string;
}

interface AuditoriaLog {
  timestamp: string;
  cnpj: string;
  clinica_id: number;
  status: 'sucesso' | 'erro';
  gestor_cpf: string;
  nova_senha: string;
  contratos_resetados: number[];
  termos_deletados: { tabela: string; linhas: number }[];
  erro?: string;
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURAÇÃO
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ARGS = process.argv.slice(2);
const CNPJ = ARGS[0]?.replace(/\D/g, '');
const IS_PROD = ARGS.includes('--prod');
const AUTO_CONFIRM = ARGS.includes('--confirm');

const DATABASE_URL = IS_PROD
  ? process.env.DATABASE_URL_PROD || process.env.DATABASE_URL
  : process.env.DATABASE_URL ||
    (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db');

const BCRYPT_ROUNDS = 12;
const LOGS_DIR = path.join(process.cwd(), 'logs', 'reset-tomador');

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILS
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function logMsg(
  msg: string,
  type: 'info' | 'warn' | 'error' | 'success' = 'info'
) {
  const icons = { info: '  ✓', warn: '  ⚠', error: '  ✗', success: '  ✅' };
  console.log(`${icons[type]} ${msg}`);
}

function mascararUrl(url: string): string {
  return url.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1***$3');
}

function validarCNPJ(cnpj: string): boolean {
  return /^\d{14}$/.test(cnpj);
}

function ultimos6(cnpj: string): string {
  return cnpj.slice(-6);
}

async function confirmar(pergunta: string): Promise<boolean> {
  if (AUTO_CONFIRM) return true;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`  ${pergunta} (s/n): `, (res) => {
      rl.close();
      resolve(res.toLowerCase() === 's' || res.toLowerCase() === 'y');
    });
  });
}

async function lerTexto(pergunta: string): Promise<string> {
  if (AUTO_CONFIRM) return CNPJ!;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`  ${pergunta}: `, (res) => {
      rl.close();
      resolve(res?.replace(/\D/g, '') || '');
    });
  });
}

function salvarAuditoria(log: AuditoriaLog) {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
  const file = path.join(LOGS_DIR, `reset_${log.cnpj}_${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(log, null, 2), 'utf-8');
  logMsg(`Auditoria salva em: ${file}`, 'info');
}

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  const audit: AuditoriaLog = {
    timestamp: new Date().toISOString(),
    cnpj: CNPJ || '',
    clinica_id: 0,
    status: 'erro',
    gestor_cpf: '',
    nova_senha: '',
    contratos_resetados: [],
    termos_deletados: [],
  };

  let client: PoolClient | null = null;
  let pool: Pool | null = null;

  try {
    // ─── 1. VALIDAÇÃO ────────────────────────────────────────────────────

    if (!CNPJ || !validarCNPJ(CNPJ)) {
      throw new Error(
        `CNPJ inválido: "${ARGS[0]}". Deve ter 14 dígitos numéricos.`
      );
    }

    console.log('\n' + '═'.repeat(60));
    console.log('  RESET TOMADOR POR CNPJ');
    console.log('═'.repeat(60));
    logMsg(`CNPJ: ${CNPJ}`, 'info');
    logMsg(`Ambiente: ${IS_PROD ? 'PROD (neondb_v2)' : 'DEV (local)'}`, 'info');

    if (!DATABASE_URL) {
      throw new Error(
        'DATABASE_URL não definida.\n' +
          '  • DEV:  verifique .env.local (LOCAL_DATABASE_URL)\n' +
          '  • PROD: DATABASE_URL deve estar em .env.local'
      );
    }

    logMsg(`DB: ${mascararUrl(DATABASE_URL)}`, 'info');

    // ─── 2. CONEXÃO ───────────────────────────────────────────────────────

    pool = new Pool({ connectionString: DATABASE_URL });
    client = await pool.connect();
    logMsg('Conectado ao banco', 'success');

    // ─── 3. BUSCAR CLÍNICA ────────────────────────────────────────────────

    const clinicaRes = await client.query<ClinicaData>(
      'SELECT id, cnpj, nome FROM clinicas WHERE cnpj = $1',
      [CNPJ]
    );

    if (clinicaRes.rows.length === 0) {
      throw new Error(
        `Clínica não encontrada com CNPJ: ${CNPJ}\n` +
          '  Verifique se o CNPJ existe: SELECT id, cnpj, nome FROM clinicas;'
      );
    }

    const clinica = clinicaRes.rows[0];
    audit.clinica_id = clinica.id;
    logMsg(`Clínica: ${clinica.nome} (ID: ${clinica.id})`, 'success');

    // ─── 4. BUSCAR GESTOR EM clinicas_senhas ─────────────────────────────
    // O "tomador" que faz login é o responsável registrado em clinicas_senhas

    const gestorRes = await client.query<GestorLoginData>(
      'SELECT id, clinica_id, cpf, primeira_senha_alterada FROM clinicas_senhas WHERE clinica_id = $1',
      [clinica.id]
    );

    if (gestorRes.rows.length === 0) {
      throw new Error(
        `Nenhum login encontrado em clinicas_senhas para clínica ID: ${clinica.id}\n` +
          '  O cadastro pode estar incompleto.'
      );
    }

    const gestores = gestorRes.rows;
    audit.gestor_cpf = gestores.map((g) => g.cpf).join(', ');
    logMsg(
      `Login(s) encontrado(s) em clinicas_senhas: ${gestores.map((g) => g.cpf).join(', ')}`,
      'success'
    );

    // ─── 5. BUSCAR CONTRATO ───────────────────────────────────────────────

    const contratoRes = await client.query<ContratoData>(
      `SELECT id, tomador_id, tipo_tomador, aceito, status
       FROM contratos
       WHERE tipo_tomador = 'clinica' AND tomador_id = $1`,
      [clinica.id]
    );

    if (contratoRes.rows.length === 0) {
      throw new Error(
        `Nenhum contrato encontrado para clínica ID: ${clinica.id}`
      );
    }

    const contrato = contratoRes.rows[0];
    logMsg(
      `Contrato: ID=${contrato.id} | aceito=${contrato.aceito} | status=${contrato.status}`,
      'success'
    );

    // ─── 6. RESUMO E CONFIRMAÇÃO ──────────────────────────────────────────

    const novaSenha = ultimos6(CNPJ);
    audit.nova_senha = novaSenha;

    console.log('\n' + '─'.repeat(60));
    console.log('  AÇÕES QUE SERÃO EXECUTADAS:');
    console.log('─'.repeat(60));
    console.log(
      `  1. Resetar senha → "${novaSenha}" (últimos 6 dígitos do CNPJ)`
    );
    console.log(`     Usuário(s): ${gestores.map((g) => g.cpf).join(', ')}`);
    console.log(`  2. Contrato → aceito=false, status=aguardando_aceite`);
    console.log(`  3. Limpar aceites de termos LGPD`);
    console.log(`  4. Limpar tokens de reset pendentes`);
    console.log('─'.repeat(60) + '\n');

    const ok = await confirmar('Confirma execução?');
    if (!ok) throw new Error('Cancelado pelo usuário.');

    if (!AUTO_CONFIRM) {
      const cnpjConfirm = await lerTexto(
        `⚠️  Digite o CNPJ novamente para confirmar (${CNPJ})`
      );
      if (cnpjConfirm !== CNPJ) {
        throw new Error(
          `CNPJ não confere. Esperado: ${CNPJ} | Digitado: ${cnpjConfirm}`
        );
      }
    }

    // ─── 7. TRANSAÇÃO ─────────────────────────────────────────────────────

    await client.query('BEGIN');

    const senhaHash = await bcrypt.hash(novaSenha, BCRYPT_ROUNDS);
    logMsg(`Hash bcrypt gerado (rounds=${BCRYPT_ROUNDS})`, 'info');

    // ─── 8. RESETAR SENHA em clinicas_senhas ──────────────────────────────

    for (const gestor of gestores) {
      await client.query(
        `UPDATE clinicas_senhas
         SET senha_hash = $1, primeira_senha_alterada = false, atualizado_em = NOW()
         WHERE clinica_id = $2 AND cpf = $3`,
        [senhaHash, clinica.id, gestor.cpf]
      );
      logMsg(
        `Senha resetada para CPF ${gestor.cpf} em clinicas_senhas`,
        'info'
      );
    }

    // ─── 9. RESETAR SENHA em funcionarios.senha_hash (se existir) ─────────

    for (const gestor of gestores) {
      const fRes = await client.query(
        'SELECT cpf FROM funcionarios WHERE cpf = $1',
        [gestor.cpf]
      );
      if (fRes.rows.length > 0) {
        await client.query(
          'UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2',
          [senhaHash, gestor.cpf]
        );
        logMsg(
          `Senha também atualizada em funcionarios para CPF ${gestor.cpf}`,
          'info'
        );
      }
    }

    // ─── 10. LIMPAR TOKENS DE RESET ───────────────────────────────────────

    for (const gestor of gestores) {
      try {
        await client.query(
          `UPDATE usuarios
           SET reset_token = NULL,
               reset_token_expira_em = NULL,
               reset_tentativas_falhas = 0,
               reset_usado_em = NULL
           WHERE cpf = $1`,
          [gestor.cpf]
        );
      } catch {
        // usuarios pode não ter esses campos — ignorar
      }
    }
    logMsg('Tokens de reset limpos', 'info');

    // ─── 11. VOLTAR CONTRATO ──────────────────────────────────────────────

    await client.query(
      `UPDATE contratos
       SET aceito = false,
           status = 'aguardando_aceite',
           ip_aceite = NULL,
           data_aceite = NULL
       WHERE id = $1`,
      [contrato.id]
    );
    audit.contratos_resetados.push(contrato.id);
    logMsg(
      `Contrato ID ${contrato.id} → aceito=false, status=aguardando_aceite`,
      'info'
    );

    // ─── 12. LIMPAR ACEITES DE TERMOS (LGPD) ─────────────────────────────

    const cpfs = gestores.map((g) => g.cpf);

    const r1 = await client.query(
      `DELETE FROM aceites_termos_usuario WHERE usuario_cpf = ANY($1::VARCHAR[])`,
      [cpfs]
    );
    audit.termos_deletados.push({
      tabela: 'aceites_termos_usuario',
      linhas: r1.rowCount || 0,
    });
    logMsg(
      `Deletados ${r1.rowCount} registros em aceites_termos_usuario`,
      'info'
    );

    const r2 = await client.query(
      `DELETE FROM aceites_termos_entidade WHERE entidade_cnpj = $1 AND entidade_tipo = 'clinica'`,
      [CNPJ]
    );
    audit.termos_deletados.push({
      tabela: 'aceites_termos_entidade',
      linhas: r2.rowCount || 0,
    });
    logMsg(
      `Deletados ${r2.rowCount} registros em aceites_termos_entidade`,
      'info'
    );

    // ─── 13. COMMIT ───────────────────────────────────────────────────────

    await client.query('COMMIT');
    logMsg('COMMIT realizado', 'success');

    audit.status = 'sucesso';

    // ─── 14. RESULTADO FINAL ──────────────────────────────────────────────

    console.log('\n' + '═'.repeat(60));
    console.log('  ✅ RESET CONCLUÍDO COM SUCESSO!');
    console.log('═'.repeat(60));
    console.log(`  Clínica : ${clinica.nome}`);
    console.log(`  CNPJ    : ${CNPJ}`);
    console.log(`  CPF(s)  : ${cpfs.join(', ')}`);
    console.log(`  SENHA   : ${novaSenha}  ← use para logar`);
    console.log(`  Contrato: ${contrato.id} → aceito=false`);
    console.log('');
    console.log('  Próximos passos:');
    console.log(
      `  1. Suporte envia link de cadastro/onboarding para o tomador`
    );
    console.log(`  2. Tomador faz login com CPF acima + senha "${novaSenha}"`);
    console.log(`  3. Sistema apresenta o modal de contrato`);
    console.log(`  4. Tomador aceita → contrato fica aceito=true`);
    console.log('═'.repeat(60) + '\n');

    salvarAuditoria(audit);

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    audit.erro = error instanceof Error ? error.message : String(error);

    // Rollback se transação estava aberta
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {}
    }

    console.log('\n' + '═'.repeat(60));
    console.error(`  ✗ ERRO: ${audit.erro}`);
    console.log('═'.repeat(60) + '\n');

    if (audit.erro.includes('SASL') || audit.erro.includes('password')) {
      console.log('  DICA: Erro de autenticação com o banco.');
      console.log(
        `  • DATABASE_URL: ${DATABASE_URL ? mascararUrl(DATABASE_URL) : '[NÃO DEFINIDA]'}`
      );
      console.log(
        '  • Verifique se .env.local tem DATABASE_URL correta para PROD\n'
      );
    }

    salvarAuditoria(audit);

    if (client) client.release();
    if (pool) await pool.end();
    process.exit(1);
  }
}

main();

/**
 * seed-representantes-dev.cjs
 *
 * Insere dois representantes de teste (1 PF, 1 PJ) para validar o painel
 * Geral → Representantes no dashboard do admin.
 *
 * Credenciais de acesso (tela de login unificada — CPF + senha = código):
 *   PF  →  CPF 11122233344  /  Senha REP-PF123
 *   PJ  →  CPF 55566677788  /  Senha REP-PJ123
 *
 * Credenciais legadas (portal representante — email + código):
 *   PF  →  rep.pf.teste@qwork.dev  /  REP-PF123
 *   PJ  →  rep.pj.teste@qwork.dev  /  REP-PJ123
 *
 * SEGURANÇA: O script aborta se DATABASE_URL apontar para produção
 * (neon.tech) e a variável ALLOW_SEED_PROD não estiver explicitamente
 * definida como "true".
 *
 * Uso:
 *   node scripts/seed-representantes-dev.cjs
 */

const { loadEnv } = require('./load-env.cjs');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[seed] DATABASE_URL não definida. Configure .env.local.');
  process.exit(1);
}

// Guardrail de produção
const isProd =
  DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('amazonaws.com');
const allowProd = process.env.ALLOW_SEED_PROD === 'true';

if (isProd && !allowProd) {
  console.error(
    '[seed] ⛔ DATABASE_URL aponta para produção (neon.tech/amazonaws.com).\n' +
      '       Para forçar a execução, defina ALLOW_SEED_PROD=true no ambiente.\n' +
      '       Exemplo: ALLOW_SEED_PROD=true node scripts/seed-representantes-dev.cjs'
  );
  process.exit(1);
}

if (isProd) {
  console.warn(
    '[seed] ⚠️  ALLOW_SEED_PROD=true — inserindo em PRODUÇÃO. Prosseguindo...'
  );
}

/* ------------------------------------------------------------------ */

const REPRESENTANTES = [
  {
    tipo_pessoa: 'pf',
    nome: 'Carlos Teste PF',
    email: 'rep.pf.teste@qwork.dev',
    telefone: '11999000001',
    cpf: '11122233344', // CPF usado no login unificado
    cnpj: null,
    cpf_responsavel_pj: null,
    codigo: 'REP-PF123', // usado como "senha" no login unificado e portal legado
    status: 'ativo', // status inicial — admin pode aprovar direto para 'apto' em um clique
    aceite_termos: true,
    aceite_disclaimer_nv: true,
    banco_codigo: '260',
    agencia: '0001',
    conta: '12345-6',
    tipo_conta: 'corrente',
    titular_conta: 'Carlos Teste PF',
    pix_chave: '12345678901',
    pix_tipo: 'cpf',
  },
  {
    tipo_pessoa: 'pj',
    nome: 'Empresa Teste PJ Ltda',
    email: 'rep.pj.teste@qwork.dev',
    telefone: '11999000002',
    cpf: null,
    cnpj: '12345678000195', // CNPJ fictício para dev
    cpf_responsavel_pj: '55566677788', // CPF do responsável — usado no login unificado
    codigo: 'REP-PJ123',
    status: 'ativo',
    aceite_termos: true,
    aceite_disclaimer_nv: true,
    banco_codigo: '001',
    agencia: '0001',
    conta: '98765-4',
    tipo_conta: 'corrente',
    titular_conta: 'Empresa Teste PJ Ltda',
    pix_chave: '12345678000195',
    pix_tipo: 'cnpj',
  },
];

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log('[seed] Conectado ao banco. Iniciando inserção...\n');

    // Necessário para triggers de auditoria que exigem app.current_user_cpf
    await client.query(`SET app.current_user_cpf = '00000000191'`); // CPF fictício de 11 dígitos (válido para seed)
    await client.query(`SET app.current_user_perfil = 'admin'`);

    for (const r of REPRESENTANTES) {
      // Gerar bcrypt hash do código para login unificado (CPF + código como senha)
      const senha_hash = await bcrypt.hash(r.codigo, 10);

      const res = await client.query(
        `INSERT INTO public.representantes (
          tipo_pessoa, nome, email, telefone,
          cpf, cnpj, cpf_responsavel_pj,
          codigo, senha_hash,
          status,
          aceite_termos, aceite_termos_em,
          aceite_disclaimer_nv, aceite_disclaimer_nv_em,
          banco_codigo, agencia, conta, tipo_conta, titular_conta,
          pix_chave, pix_tipo,
          criado_em, atualizado_em
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9,
          $10,
          $11, NOW(),
          $12, NOW(),
          $13, $14, $15, $16, $17,
          $18, $19,
          NOW(), NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          nome                 = EXCLUDED.nome,
          telefone             = EXCLUDED.telefone,
          cpf                  = EXCLUDED.cpf,
          cnpj                 = EXCLUDED.cnpj,
          cpf_responsavel_pj   = EXCLUDED.cpf_responsavel_pj,
          codigo               = EXCLUDED.codigo,
          senha_hash           = EXCLUDED.senha_hash,
          status               = EXCLUDED.status,
          aceite_termos        = EXCLUDED.aceite_termos,
          aceite_disclaimer_nv = EXCLUDED.aceite_disclaimer_nv,
          banco_codigo         = EXCLUDED.banco_codigo,
          agencia              = EXCLUDED.agencia,
          conta                = EXCLUDED.conta,
          tipo_conta           = EXCLUDED.tipo_conta,
          titular_conta        = EXCLUDED.titular_conta,
          pix_chave            = EXCLUDED.pix_chave,
          pix_tipo             = EXCLUDED.pix_tipo,
          atualizado_em        = NOW()
        RETURNING id, tipo_pessoa, nome, email, cpf, cpf_responsavel_pj, codigo, status`,
        [
          r.tipo_pessoa,
          r.nome,
          r.email,
          r.telefone,
          r.cpf,
          r.cnpj,
          r.cpf_responsavel_pj,
          r.codigo,
          senha_hash,
          r.status,
          r.aceite_termos,
          r.aceite_disclaimer_nv,
          r.banco_codigo,
          r.agencia,
          r.conta,
          r.tipo_conta,
          r.titular_conta,
          r.pix_chave,
          r.pix_tipo,
        ]
      );

      const row = res.rows[0];
      const loginCpf = row.cpf || row.cpf_responsavel_pj || '(sem CPF)';
      console.log(
        `✅  [${row.tipo_pessoa.toUpperCase()}] ${row.nome}\n` +
          `    ID:     ${row.id}\n` +
          `    CPF:    ${loginCpf}    ← use no login unificado (/login)\n` +
          `    Email:  ${row.email}\n` +
          `    Código: ${row.codigo}   ← use como "senha" no login\n` +
          `    Status: ${row.status}\n`
      );
    }

    console.log('─'.repeat(60));
    console.log('🔑 Login UNIFICADO (tela principal):');
    console.log('  POST /api/auth/login');
    console.log('  { "cpf": "11122233344", "senha": "REP-PF123" }  ← PF');
    console.log(
      '  { "cpf": "55566677788", "senha": "REP-PJ123" }  ← PJ (CPF responsável)'
    );
    console.log('');
    console.log('🔗 Login LEGADO (portal representante):');
    console.log('  POST /api/representante/login');
    console.log(
      '  { "email": "rep.pf.teste@qwork.dev", "codigo": "REP-PF123" }'
    );
    console.log(
      '  { "email": "rep.pj.teste@qwork.dev", "codigo": "REP-PJ123" }'
    );
    console.log('─'.repeat(60));
    console.log('Visualizar no admin:');
    console.log('  Dashboard Admin → Geral → Representantes');
    console.log(
      '  (Ambos aparecem com badge "ativo" — admin pode aprovar para "apto" em um clique)'
    );
  } catch (err) {
    console.error('[seed] Erro:', err.message);
    if (err.detail) console.error('       Detalhe:', err.detail);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

const { Client } = require('pg');

const STAGING_URL = 'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require';

async function checkStagingState() {
  const c = new Client({ connectionString: STAGING_URL, connectionTimeoutMillis: 20000 });
  await c.connect();

  // Check which columns exist in key tables
  const checks = [
    ['representantes.codigo', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='representantes' AND column_name='codigo'"],
    ['representantes.percentual_comissao_comercial', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='representantes' AND column_name='percentual_comissao_comercial'"],
    ['representantes.gestor_comercial_cpf', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='representantes' AND column_name='gestor_comercial_cpf'"],
    ['comissoes_laudo.asaas_payment_id', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='comissoes_laudo' AND column_name='asaas_payment_id'"],
    ['comissoes_laudo.nf_nome_arquivo', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='comissoes_laudo' AND column_name='nf_nome_arquivo'"],
    ['comissoes_laudo.tipo_beneficiario', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='comissoes_laudo' AND column_name='tipo_beneficiario'"],
    ['vinculos_comissao.clinica_id', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='vinculos_comissao' AND column_name='clinica_id'"],
    ['vinculos_comissao.percentual_comissao_comercial', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='vinculos_comissao' AND column_name='percentual_comissao_comercial'"],
    ['leads_representante.percentual_comissao_vendedor', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='leads_representante' AND column_name='percentual_comissao_vendedor'"],
    ['clinicas.isento_pagamento', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='clinicas' AND column_name='isento_pagamento'"],
    ['usuarios.asaas_wallet_id', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='usuarios' AND column_name='asaas_wallet_id'"],
    ['configuracoes_gateway table', "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='configuracoes_gateway'"],
    ['beneficiarios_sociedade table', "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='beneficiarios_sociedade'"],
    ['ciclos_comissao table', "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='ciclos_comissao'"],
    ['vendedores_perfil.doc_nf_rpa_path', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='vendedores_perfil' AND column_name='doc_nf_rpa_path'"],
    ['vendedores_perfil.doc_nf_path', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='vendedores_perfil' AND column_name='doc_nf_path'"],
  ];

  console.log('=== STAGING state check ===');
  for (const [label, sql] of checks) {
    const r = await c.query(sql);
    const exists = parseInt(r.rows[0].count) > 0;
    console.log((exists ? '✅' : '❌') + ' ' + label + ': ' + (exists ? 'EXISTS' : 'NOT EXISTS'));
  }

  // Also check perfil_usuario_enum values
  const r = await c.query("SELECT enumlabel FROM pg_enum WHERE enumtypid=(SELECT oid FROM pg_type WHERE typname='perfil_usuario_enum' LIMIT 1) ORDER BY enumsortorder");
  console.log('perfil_usuario_enum:', r.rows.map(x => x.enumlabel).join(', '));

  await c.end();
}

checkStagingState().catch(e => { console.error(e.message); process.exit(1); });

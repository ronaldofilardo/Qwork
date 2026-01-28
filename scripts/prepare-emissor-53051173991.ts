import { query } from '../lib/db';

async function main() {
  const cpf = '53051173991';
  const loteId = 2;

  console.log(`🔎 Verificando existência do emissor ${cpf}...`);
  const res = await query(
    `SELECT cpf, nome, perfil, ativa FROM funcionarios WHERE cpf = $1`,
    [cpf]
  );

  if (res.rows.length === 0) {
    console.log(
      `➡️ Emissor não encontrado. Criando emissor minimal para testes (${cpf})`
    );
    await query(
      `INSERT INTO funcionarios (cpf, nome, perfil, ativa, criado_em) VALUES ($1, $2, $3, TRUE, NOW())`,
      [cpf, 'Emissor Teste', 'emissor']
    );
    console.log('✅ Emissor criado.');
  } else {
    const f = res.rows[0];
    console.log('ℹ️ Emissor encontrado:', f);
    if (f.perfil !== 'emissor') {
      console.log(`➡️ Atualizando perfil para 'emissor'`);
      await query(
        `UPDATE funcionarios SET perfil = 'emissor', ativa = TRUE WHERE cpf = $1`,
        [cpf]
      );
      console.log('✅ Perfil atualizado.');
    }
  }

  // Garantir que lote está pronto (flags limpadas já pelo reset script)
  console.log(`🔧 Reconfirmando estado do lote ${loteId}...`);
  await query(
    `UPDATE lotes_avaliacao SET modo_emergencia = FALSE, motivo_emergencia = NULL, processamento_em = NULL WHERE id = $1`,
    [loteId]
  );

  // Registrar auditoria simples indicando que foi preparado para teste
  console.log(
    '✍️ Registrando auditoria de preparação para teste (user = emissor)...'
  );
  await query(
    `INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, new_data, ip_address)
     VALUES ('laudo_emergencia_prepared', 'lotes_avaliacao', $1, $2, $3, $4, $5)`,
    [
      String(loteId),
      cpf,
      'emissor',
      JSON.stringify({ note: 'prepared for emergency emission test' }),
      '127.0.0.1',
    ]
  );

  const audits = await query(
    `SELECT id, action, resource, resource_id, user_cpf, user_perfil, new_data, criado_em FROM audit_logs WHERE resource = 'lotes_avaliacao' AND resource_id = $1 ORDER BY id DESC LIMIT 10`,
    [String(loteId)]
  );

  console.log('\n📄 Últimas auditorias relevantes:');
  console.table(audits.rows);

  console.log(
    '\nPronto. O emissor está preparado para testar a emissão emergencial no lote 2.'
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Erro ao preparar emissor:', err);
      process.exit(1);
    });
}

export { main };

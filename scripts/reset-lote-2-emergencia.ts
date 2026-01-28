import { query } from '../lib/db';

async function main() {
  const loteId = 2;

  console.log(`🔎 Verificando estado atual do lote ${loteId}...`);

  const lote = await query(
    `SELECT id, codigo, status, modo_emergencia, motivo_emergencia, processamento_em, emitido_em, enviado_em FROM lotes_avaliacao WHERE id = $1`,
    [loteId]
  );

  console.log('\n📄 lote_avaliacao:');
  console.table(lote.rows);

  const laudos = await query(
    `SELECT id, status, emitido_em, enviado_em, hash_pdf FROM laudos WHERE lote_id = $1 ORDER BY id DESC`,
    [loteId]
  );

  console.log('\n📄 laudos (mais recentes primeiro):');
  console.table(laudos.rows);

  const audits = await query(
    `SELECT id, action, resource, resource_id, user_cpf, user_perfil, new_data, criado_em FROM audit_logs WHERE resource = 'lotes_avaliacao' AND resource_id = $1 ORDER BY id DESC LIMIT 20`,
    [String(loteId)]
  );

  console.log('\n📄 audit_logs relevantes (últimos 20):');
  console.table(audits.rows);

  // Confirmação manual: o script sempre fará o reset quando executado
  console.log(
    '\n⚠️ Fazendo RESET: deletando laudos do lote, limpando flags de emergência e processamento...'
  );

  // Deletar laudos associados
  const deleted = await query(
    `DELETE FROM laudos WHERE lote_id = $1 RETURNING id`,
    [loteId]
  );
  console.log(
    `🗑️ Laudos deletados: ${deleted.rows.map((r) => r.id).join(', ') || 'nenhum'}`
  );

  // Resetar lote
  await query(
    `UPDATE lotes_avaliacao SET modo_emergencia = FALSE, motivo_emergencia = NULL, processamento_em = NULL, emitido_em = NULL, enviado_em = NULL WHERE id = $1`,
    [loteId]
  );

  await query(
    `INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, new_data, ip_address)
     VALUES ('laudo_emergencia_reset', 'lotes_avaliacao', $1, $2, $3, $4, $5)`,
    [
      String(loteId),
      '00000000000',
      'system',
      JSON.stringify({ reason: 'reset for testing emergency emission' }),
      '127.0.0.1',
    ]
  );

  const loteAfter = await query(
    `SELECT id, codigo, status, modo_emergencia, motivo_emergencia, processamento_em, emitido_em, enviado_em FROM lotes_avaliacao WHERE id = $1`,
    [loteId]
  );

  console.log('\n✅ Estado final do lote após reset:');
  console.table(loteAfter.rows);

  const laudosAfter = await query(
    `SELECT id, status, emitido_em, enviado_em FROM laudos WHERE lote_id = $1 ORDER BY id DESC`,
    [loteId]
  );

  console.log('\n📄 laudos após reset:');
  console.table(laudosAfter.rows);

  console.log(
    '\nPronto. O lote agora deve permitir uso do Modo Emergência novamente.'
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Erro ao executar reset:', err);
      process.exit(1);
    });
}

export { main };

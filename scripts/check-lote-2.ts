import { query } from '../lib/db';

async function main() {
  const loteId = 2;
  const lote = await query(
    `SELECT id, codigo, status, modo_emergencia, motivo_emergencia, processamento_em, emitido_em, enviado_em FROM lotes_avaliacao WHERE id = $1`,
    [loteId]
  );
  console.log(JSON.stringify({ lote: lote.rows }, null, 2));

  const laudos = await query(
    `SELECT id, status, emitido_em, enviado_em FROM laudos WHERE lote_id = $1 ORDER BY id DESC`,
    [loteId]
  );
  console.log(JSON.stringify({ laudos: laudos.rows }, null, 2));

  const audits = await query(
    `SELECT id, action, resource, resource_id, user_cpf, user_perfil, new_data, criado_em FROM audit_logs WHERE resource = 'lotes_avaliacao' AND resource_id = $1 ORDER BY id DESC LIMIT 20`,
    [String(loteId)]
  );
  console.log(JSON.stringify({ audits: audits.rows }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { main };

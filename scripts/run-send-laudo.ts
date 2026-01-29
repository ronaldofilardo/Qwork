import { config } from 'dotenv';
config({ path: '.env.development' });
import { query } from '@/lib/db';
import { enviarLaudosAutomaticamente } from '@/lib/laudo-auto';

async function main() {
  const args = process.argv
    .slice(2)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));
  if (args.length === 0) {
    console.error('Uso: tsx scripts/run-send-laudo.ts <loteId> [<loteId>...]');
    process.exit(1);
  }

  for (const loteId of args) {
    try {
      const res = await query(
        `SELECT la.id as lote_id, la.codigo, la.clinica_id, la.empresa_id, la.contratante_id, la.emitido_em, la.enviado_em, la.auto_emitir_em, l.id as laudo_id, l.status as status_l
        FROM lotes_avaliacao la JOIN laudos l ON la.id = l.id WHERE la.id = $1`,
        [loteId]
      );
      if (res.rows.length === 0) {
        console.error(`[RUN-SEND] Nenhum laudo encontrado para lote ${loteId}`);
        continue;
      }
      const laudo = res.rows[0];
      console.log(`[RUN-SEND] Enviando laudo:`, laudo);
      await enviarLaudosAutomaticamente();
      console.log(`[RUN-SEND] Envio solicitado para lote ${loteId}`);
    } catch (err) {
      console.error(`[RUN-SEND] Erro ao enviar laudo do lote ${loteId}:`, err);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

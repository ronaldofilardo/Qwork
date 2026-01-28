import { query } from '@/lib/db';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: pnpm tsx scripts/diagnose-lote.mts <loteId|codigo>');
  process.exit(2);
}

(async function run() {
  const whereById = Number.isFinite(Number(arg));
  try {
    let loteRes;
    if (whereById) {
      // Query genérica para evitar problemas de colunas ausentes entre ambientes
      loteRes = await query('SELECT * FROM lotes_avaliacao WHERE id = $1', [
        Number(arg),
      ]);
    } else {
      loteRes = await query('SELECT * FROM lotes_avaliacao WHERE codigo = $1', [
        arg,
      ]);
    }

    if (!loteRes.rows || loteRes.rows.length === 0) {
      console.log('Lote não encontrado:', arg);
      process.exit(2);
    }

    const l = loteRes.rows[0];
    console.log('Lote:', l);

    const laudos = await query(
      'SELECT id, status, hash_pdf, emitido_em, enviado_em FROM laudos WHERE lote_id = $1',
      [l.id]
    );
    console.log('Laudos:', laudos.rows);

    const fila = await query(
      'SELECT id, lote_id, tentativas, max_tentativas, proxima_tentativa FROM fila_emissao WHERE lote_id = $1',
      [l.id]
    );
    console.log('Fila emissão:', fila.rows);

    const notifs = await query(
      'SELECT id, tipo, mensagem, criado_em FROM notificacoes_admin WHERE lote_id = $1 ORDER BY criado_em DESC LIMIT 10',
      [l.id]
    );
    console.log('Notificações admin recentes:', notifs.rows);

    const auditorias = await query(
      'SELECT id, acao, status, criado_em FROM auditoria_laudos WHERE lote_id = $1 ORDER BY criado_em DESC LIMIT 10',
      [l.id]
    );
    console.log('Auditorias laudos:', auditorias.rows);

    const emissores = await query(
      "SELECT cpf, nome, ativo FROM funcionarios WHERE perfil = 'emissor' ORDER BY criado_em DESC"
    );
    console.log(
      'Emissores (ativos):',
      emissores.rows.filter((e) => e.ativo)
    );

    const falhas = await query(
      "SELECT id, tipo, mensagem, criado_em FROM notificacoes_admin WHERE lote_id = $1 AND tipo IN ('falha_emissao_imediata','erro_critico_emissao','sem_emissor') ORDER BY criado_em DESC",
      [l.id]
    );
    console.log('Notificações de falha de emissão:', falhas.rows);

    process.exit(0);
  } catch (err) {
    console.error('Erro ao diagnosticar:', err);
    process.exit(1);
  }
})();

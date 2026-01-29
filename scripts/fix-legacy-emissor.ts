import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log('[FIX-EMISSOR] Buscando emissores ativos...');
    const res = await client.query(
      `SELECT cpf, nome FROM funcionarios WHERE perfil = 'emissor' AND ativo = true`
    );
    if (res.rows.length === 0) {
      console.error(
        '[FIX-EMISSOR] Nenhum emissor ativo encontrado. Abortando.'
      );
      process.exit(1);
    }

    if (res.rows.length > 1) {
      console.warn(
        '[FIX-EMISSOR] Múltiplos emissores ativos encontrados. Selecionando o primeiro por segurança:',
        res.rows.map((r) => r.cpf)
      );
    }

    const targetCpf = res.rows[0].cpf;
    console.log(
      `[FIX-EMISSOR] Usando emissor ${targetCpf} (${res.rows[0].nome}) para correção.`
    );

    // Atualizar laudos não-emitidos
    const updateRes = await client.query(
      `UPDATE laudos SET emissor_cpf = $1, atualizado_em = NOW() WHERE emissor_cpf = '00000000000' AND emitido_em IS NULL RETURNING id, lote_id`,
      [targetCpf]
    );
    console.log(
      `[FIX-EMISSOR] Laudos atualizados (não emitidos): ${updateRes.rowCount}`
    );
    updateRes.rows.forEach((r) =>
      console.log('  - laudo', r.id, 'lote', r.lote_id)
    );

    // Tentar atualizar laudos emitidos (pode falhar devido a trigger de imutabilidade)
    try {
      const updateEmitted = await client.query(
        `UPDATE laudos SET emissor_cpf = $1, atualizado_em = NOW() WHERE emissor_cpf = '00000000000' AND emitido_em IS NOT NULL RETURNING id, lote_id`,
        [targetCpf]
      );
      console.log(
        `[FIX-EMISSOR] Laudos emitidos atualizados: ${updateEmitted.rowCount}`
      );
      updateEmitted.rows.forEach((r) =>
        console.log('  - laudo', r.id, 'lote', r.lote_id)
      );
    } catch (err) {
      console.warn(
        '[FIX-EMISSOR] Não foi possível atualizar laudos emitidos automaticamente. Erro:',
        err.message || err
      );
      // Registrar para intervenção manual
      const notified = await client.query(
        `INSERT INTO notificacoes_admin (tipo, mensagem, criado_em) VALUES ('fix_legacy_emissor_failed', $1, NOW()) RETURNING id`,
        [
          `Falha ao atualizar laudos emitidos com emissor 00000000000: ${err.message || err}`,
        ]
      );
      console.log(
        '[FIX-EMISSOR] Notificação administrativa registrada:',
        notified.rows[0].id
      );
    }

    console.log('[FIX-EMISSOR] Correção finalizada.');
  } catch (err) {
    console.error('[FIX-EMISSOR] Erro durante correção:', err);
  } finally {
    await client.end();
  }
})();

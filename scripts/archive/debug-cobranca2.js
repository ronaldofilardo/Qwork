import { query } from '../lib/db.js';

(async () => {
  const cnpj = '02494916000170';
  try {
    const ctRes = await query(
      "SELECT id, cnpj, numero_funcionarios_estimado FROM tomadors WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1 LIMIT 1",
      [cnpj]
    );
    console.log('tomador:', ctRes.rows[0]);

    const ctId = ctRes.rows[0]?.id;
    if (!ctId) return;

    const contratos = await query(
      `SELECT id, plano_id, numero_funcionarios, numero_funcionarios_estimado, valor_personalizado, criado_em
       FROM contratos WHERE tomador_id = $1 ORDER BY criado_em DESC, id DESC LIMIT 10`,
      [ctId]
    );
    console.log('contratos:', contratos.rows);

    const contratosPlanos = await query(
      `SELECT id, plano_id, valor_personalizado_por_funcionario, numero_funcionarios_estimado, numero_funcionarios_atual, created_at
       FROM contratos_planos WHERE tomador_id = $1 ORDER BY created_at DESC, id DESC LIMIT 10`,
      [ctId]
    );
    console.log('contratos_planos:', contratosPlanos.rows);

    const planos = await query(
      'SELECT id, tipo, nome, valor_por_funcionario, valor_fixo_anual FROM planos'
    );
    console.log('planos:', planos.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();

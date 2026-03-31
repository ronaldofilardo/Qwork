#!/usr/bin/env node
/**
 * Fix: audit_lote_change() — garante que o campo ip_address use ::inet cast correto.
 * Migration 1011 corrigiu isso no banco de dev; este script sincroniza o banco de teste.
 */
const { Pool } = require('pg');

const dbUrl = process.env.TEST_DATABASE_URL;
if (!dbUrl) {
  console.warn(
    '⚠️  TEST_DATABASE_URL não definida; pulando fix-audit-lote-trigger.'
  );
  process.exit(0);
}

const SQL = `
CREATE OR REPLACE FUNCTION audit_lote_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
      'lote_criado',
      'lotes_avaliacao',
      NEW.id,
      jsonb_build_object(
        'lote_id', NEW.id,
        'empresa_id', NEW.empresa_id,
        'numero_ordem', NEW.numero_ordem,
        'status', NEW.status
      ),
      NULLIF(current_setting('app.client_ip', true), '')::inet
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status OR
       OLD.emitido_em IS DISTINCT FROM NEW.emitido_em OR
       OLD.enviado_em IS DISTINCT FROM NEW.enviado_em THEN
      INSERT INTO audit_logs (
        user_cpf,
        action,
        resource,
        resource_id,
        details,
        ip_address
      ) VALUES (
        COALESCE(current_setting('app.current_user_cpf', true), 'system'),
        'lote_atualizado',
        'lotes_avaliacao',
        NEW.id,
        jsonb_build_object(
          'lote_id', NEW.id,
          'status', NEW.status,
          'emitido_em', NEW.emitido_em,
          'enviado_em', NEW.enviado_em,
          'mudancas', jsonb_build_object(
            'status_anterior', OLD.status,
            'status_novo', NEW.status
          )
        ),
        NULLIF(current_setting('app.client_ip', true), '')::inet
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_cpf,
      action,
      resource,
      resource_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(current_setting('app.current_user_cpf', true), 'system'),
      'lote_deletado',
      'lotes_avaliacao',
      OLD.id,
      jsonb_build_object(
        'lote_id', OLD.id,
        'empresa_id', OLD.empresa_id,
        'numero_ordem', OLD.numero_ordem,
        'status', OLD.status
      ),
      NULLIF(current_setting('app.client_ip', true), '')::inet
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

(async () => {
  const pool = new Pool({ connectionString: dbUrl });
  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    console.warn(
      '⚠️  Não foi possível conectar ao banco de testes. Pulando fix-audit-lote-trigger.'
    );
    console.warn(connErr.message || connErr);
    try {
      await pool.end();
    } catch {}
    process.exit(0);
  }

  try {
    console.log(
      'Aplicando correção do trigger audit_lote_change (::inet cast)...'
    );
    await client.query(SQL);
    console.log('Correção audit_lote_change aplicada com sucesso.');
  } catch (err) {
    console.error(
      'Erro ao aplicar correção audit_lote_change:',
      err.message || err
    );
    process.exit(1);
  } finally {
    try {
      client.release();
    } catch {}
    try {
      await pool.end();
    } catch {}
  }
})();

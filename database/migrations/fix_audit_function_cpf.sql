-- Fix: registrar_auditoria_comissionamento — não chamar current_user_cpf() (que lança RAISE)
-- Usar current_setting com missing_ok=TRUE diretamente, retornando NULL se não configurado.
-- Compatível com queries sem sessão (triggers internos, jobs, etc.)

CREATE OR REPLACE FUNCTION public.registrar_auditoria_comissionamento(
  p_tabela        VARCHAR(50),
  p_registro_id   INTEGER,
  p_status_ant    VARCHAR(60),
  p_status_novo   VARCHAR(60),
  p_triggador     VARCHAR(30),
  p_motivo        TEXT         DEFAULT NULL,
  p_dados_extras  JSONB        DEFAULT NULL,
  p_cpf           CHAR(11)     DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.comissionamento_auditoria (
    tabela, registro_id, status_anterior, status_novo,
    triggador, motivo, dados_extras, criado_por_cpf
  ) VALUES (
    p_tabela, p_registro_id, p_status_ant, p_status_novo,
    p_triggador, p_motivo, p_dados_extras,
    COALESCE(p_cpf, NULLIF(current_setting('app.current_user_cpf', TRUE), ''))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.registrar_auditoria_comissionamento IS
  'Grava linha na tabela de auditoria do comissionamento.
   Usa current_setting(missing_ok=true) em vez de public.current_user_cpf() para o CPF —
   nunca lança exceção quando a sessão não definiu app.current_user_cpf (jobs, triggers internos, etc.).
   O CPF fica NULL nesses casos, o que é aceitável pois criado_por_cpf é nullable.';

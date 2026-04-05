-- Políticas RLS para RH
CREATE POLICY "empresas_rh_clinica" ON empresas_clientes
FOR SELECT USING (clinica_id::text = current_setting('app.current_user_clinica_id', true));

CREATE POLICY "funcionarios_rh_clinica" ON funcionarios
FOR SELECT USING (empresa_id IN (
  SELECT id FROM empresas_clientes
  WHERE clinica_id::text = current_setting('app.current_user_clinica_id', true)
));

CREATE POLICY "avaliacoes_rh_clinica" ON avaliacoes
FOR SELECT USING (funcionario_cpf IN (
  SELECT cpf FROM funcionarios WHERE empresa_id IN (
    SELECT id FROM empresas_clientes
    WHERE clinica_id::text = current_setting('app.current_user_clinica_id', true)
  )
));

CREATE POLICY "lotes_rh_clinica" ON lotes_avaliacao
FOR SELECT USING (empresa_id IN (
  SELECT id FROM empresas_clientes
  WHERE clinica_id::text = current_setting('app.current_user_clinica_id', true)
));

CREATE POLICY "laudos_rh_clinica" ON laudos
FOR SELECT USING (lote_id IN (
  SELECT id FROM lotes_avaliacao WHERE empresa_id IN (
    SELECT id FROM empresas_clientes
    WHERE clinica_id::text = current_setting('app.current_user_clinica_id', true)
  )
));
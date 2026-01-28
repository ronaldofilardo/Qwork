CREATE OR REPLACE FUNCTION public.gerar_numero_recibo()
RETURNS character varying
LANGUAGE plpgsql
AS $$
DECLARE
  data_atual DATE;
  contador INTEGER;
  numero_recibo VARCHAR(50);
BEGIN
  data_atual := CURRENT_DATE;

  -- Contar recibos pelo dia de criacao (coluna atual: criado_em)
  SELECT COUNT(*) INTO contador
  FROM recibos
  WHERE DATE(criado_em) = data_atual;

  contador := contador + 1;

  -- Formato: REC-YYYYMMDD-NNNN
  numero_recibo := 'REC-' || TO_CHAR(data_atual, 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 4, '0');

  RETURN numero_recibo;
END;
$$;
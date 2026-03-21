-- Migration 1026: [DEV SEED] Vincular vendedor 44444444444 ao representante 33333333333
-- ATENÇÃO: Este arquivo é apenas para ambiente de desenvolvimento. NÃO aplicar em produção.

DO $$
DECLARE
  v_vendedor_id     INTEGER;
  v_representante_id INTEGER;
BEGIN
  SELECT id INTO v_vendedor_id
    FROM public.usuarios
   WHERE cpf = '44444444444' AND ativo = true
   LIMIT 1;

  SELECT id INTO v_representante_id
    FROM public.representantes
   WHERE cpf = '33333333333' AND status = 'ativo'
   LIMIT 1;

  IF v_vendedor_id IS NULL THEN
    RAISE NOTICE '[SEED 1026] Vendedor 44444444444 não encontrado — seed ignorado.';
    RETURN;
  END IF;

  IF v_representante_id IS NULL THEN
    RAISE NOTICE '[SEED 1026] Representante 33333333333 não encontrado — seed ignorado.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.hierarquia_comercial
     WHERE vendedor_id = v_vendedor_id AND representante_id = v_representante_id AND ativo = true
  ) THEN
    RAISE NOTICE '[SEED 1026] Vínculo já existe e está ativo — nenhuma alteração.';
    RETURN;
  END IF;

  -- Reativa se existir desligado
  UPDATE public.hierarquia_comercial
     SET ativo = true, atualizado_em = now()
   WHERE vendedor_id = v_vendedor_id AND representante_id = v_representante_id AND ativo = false;

  IF NOT FOUND THEN
    INSERT INTO public.hierarquia_comercial (vendedor_id, representante_id, ativo)
    VALUES (v_vendedor_id, v_representante_id, true);
    RAISE NOTICE '[SEED 1026] Vínculo criado: vendedor % → representante %', v_vendedor_id, v_representante_id;
  ELSE
    RAISE NOTICE '[SEED 1026] Vínculo reativado: vendedor % → representante %', v_vendedor_id, v_representante_id;
  END IF;
END $$;

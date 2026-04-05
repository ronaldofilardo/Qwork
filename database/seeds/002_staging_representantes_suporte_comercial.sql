-- ====================================================================
-- Seed 002: Representantes Suporte e Comercial (STAGING)
-- Data: 2026-04-05
-- Branch: staging
-- Target: neondb_staging (Neon) — NÃO aplicar em produção
-- ====================================================================
-- Objetivo:
--   1. Renumerar código do representante Ronaldo (88593998070): '1' → '3'
--   2. Criar representante Suporte (CPF 11111111111) com código '1'
--   3. Criar representante Comercial (CPF 22222222222) com código '2'
--   4. Ajustar seq_representante_codigo → nextval = 4
--   5. Vincular Suporte e Comercial em hierarquia_comercial
--
-- Idempotente: pode ser executado múltiplas vezes sem efeito colateral.
-- Guards via DO $$ garantem que INSERTs/UPDATEs só ocorrem se necessário.
-- ====================================================================

BEGIN;

-- ====================================================================
-- FASE 1 — Desabilitar trigger de geração automática de código
-- O trigger trg_representante_codigo sobrescreve qualquer código informado
-- manualmente no INSERT usando nextval(seq_representante_codigo).
-- Precisa ser desabilitado para inserir códigos exatos.
-- ====================================================================

ALTER TABLE public.representantes DISABLE TRIGGER trg_representante_codigo;

-- ====================================================================
-- FASE 2 — Renumerar Ronaldo: '1' → '3'
-- Feito ANTES dos INSERTs para liberar o código '1' (constraint UNIQUE).
-- ====================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.representantes WHERE cpf = '88593998070' AND codigo = '1') THEN
    UPDATE public.representantes SET codigo = '3', atualizado_em = now()
     WHERE cpf = '88593998070';
    RAISE NOTICE '[SEED 002] Representante 88593998070: código atualizado ''1'' → ''3''';
  ELSIF EXISTS (SELECT 1 FROM public.representantes WHERE cpf = '88593998070' AND codigo = '3') THEN
    RAISE NOTICE '[SEED 002] Representante 88593998070 já está com código ''3'' — sem alteração.';
  ELSE
    RAISE NOTICE '[SEED 002] Representante 88593998070 não encontrado com código ''1'' ou ''3'' — verificar manualmente.';
  END IF;
END $$;

-- ====================================================================
-- FASE 3 — Criar representante Suporte (codigo='1')
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.representantes WHERE cpf = '11111111111') THEN
    INSERT INTO public.representantes (
      tipo_pessoa, nome, email, telefone, cpf, codigo, status,
      aceite_termos, aceite_disclaimer_nv, criado_em, atualizado_em
    ) VALUES (
      'pf', 'Suporte', 'suporte@qwork.app.br', '00000000000',
      '11111111111', '1', 'ativo',
      false, false, now(), now()
    );
    RAISE NOTICE '[SEED 002] Representante Suporte (11111111111) criado com código ''1''.';
  ELSE
    RAISE NOTICE '[SEED 002] Representante CPF 11111111111 já existe — INSERT ignorado.';
  END IF;
END $$;

-- ====================================================================
-- FASE 4 — Criar representante Comercial (codigo='2')
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.representantes WHERE cpf = '22222222222') THEN
    INSERT INTO public.representantes (
      tipo_pessoa, nome, email, telefone, cpf, codigo, status,
      aceite_termos, aceite_disclaimer_nv, criado_em, atualizado_em
    ) VALUES (
      'pf', 'Comercial', 'comercial@qwork.app.br', '00000000000',
      '22222222222', '2', 'ativo',
      false, false, now(), now()
    );
    RAISE NOTICE '[SEED 002] Representante Comercial (22222222222) criado com código ''2''.';
  ELSE
    RAISE NOTICE '[SEED 002] Representante CPF 22222222222 já existe — INSERT ignorado.';
  END IF;
END $$;

-- ====================================================================
-- FASE 5 — Reabilitar trigger de geração automática de código
-- ====================================================================

ALTER TABLE public.representantes ENABLE TRIGGER trg_representante_codigo;

-- ====================================================================
-- FASE 6 — Ajustar seq_representante_codigo para continuar do 4
-- setval(seq, 3) → próximo nextval retorna 4
-- ====================================================================

DO $$
DECLARE
  v_current bigint;
BEGIN
  SELECT last_value INTO v_current FROM public.seq_representante_codigo;
  IF v_current < 3 THEN
    PERFORM setval('public.seq_representante_codigo', 3);
    RAISE NOTICE '[SEED 002] seq_representante_codigo ajustada para 3 (próximo nextval = 4).';
  ELSE
    RAISE NOTICE '[SEED 002] seq_representante_codigo já está em % (>= 3) — sem alteração.', v_current;
  END IF;
END $$;

-- ====================================================================
-- FASE 7 — Vincular Suporte em hierarquia_comercial
-- vendedor = usuarios(cpf='11111111111') → representante(cpf='11111111111')
-- ====================================================================

DO $$
DECLARE
  v_vendedor_id     INTEGER;
  v_representante_id INTEGER;
BEGIN
  SELECT id INTO v_vendedor_id
    FROM public.usuarios
   WHERE cpf = '11111111111' AND ativo = true
   LIMIT 1;

  SELECT id INTO v_representante_id
    FROM public.representantes
   WHERE cpf = '11111111111'
   LIMIT 1;

  IF v_vendedor_id IS NULL THEN
    RAISE NOTICE '[SEED 002] Usuário Suporte (11111111111) não encontrado — vínculo ignorado.';
    RETURN;
  END IF;

  IF v_representante_id IS NULL THEN
    RAISE NOTICE '[SEED 002] Representante Suporte (11111111111) não encontrado — vínculo ignorado.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.hierarquia_comercial
     WHERE vendedor_id = v_vendedor_id AND representante_id = v_representante_id AND ativo = true
  ) THEN
    RAISE NOTICE '[SEED 002] Vínculo Suporte já existe e ativo — sem alteração.';
    RETURN;
  END IF;

  -- Reativa se existir desligado
  UPDATE public.hierarquia_comercial
     SET ativo = true, atualizado_em = now()
   WHERE vendedor_id = v_vendedor_id AND representante_id = v_representante_id AND ativo = false;

  IF NOT FOUND THEN
    INSERT INTO public.hierarquia_comercial (vendedor_id, representante_id, ativo)
    VALUES (v_vendedor_id, v_representante_id, true);
    RAISE NOTICE '[SEED 002] Vínculo Suporte criado: vendedor % → representante %', v_vendedor_id, v_representante_id;
  ELSE
    RAISE NOTICE '[SEED 002] Vínculo Suporte reativado: vendedor % → representante %', v_vendedor_id, v_representante_id;
  END IF;
END $$;

-- ====================================================================
-- FASE 8 — Vincular Comercial em hierarquia_comercial
-- vendedor = usuarios(cpf='22222222222') → representante(cpf='22222222222')
-- ====================================================================

DO $$
DECLARE
  v_vendedor_id     INTEGER;
  v_representante_id INTEGER;
BEGIN
  SELECT id INTO v_vendedor_id
    FROM public.usuarios
   WHERE cpf = '22222222222' AND ativo = true
   LIMIT 1;

  SELECT id INTO v_representante_id
    FROM public.representantes
   WHERE cpf = '22222222222'
   LIMIT 1;

  IF v_vendedor_id IS NULL THEN
    RAISE NOTICE '[SEED 002] Usuário Comercial (22222222222) não encontrado — vínculo ignorado.';
    RETURN;
  END IF;

  IF v_representante_id IS NULL THEN
    RAISE NOTICE '[SEED 002] Representante Comercial (22222222222) não encontrado — vínculo ignorado.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.hierarquia_comercial
     WHERE vendedor_id = v_vendedor_id AND representante_id = v_representante_id AND ativo = true
  ) THEN
    RAISE NOTICE '[SEED 002] Vínculo Comercial já existe e ativo — sem alteração.';
    RETURN;
  END IF;

  -- Reativa se existir desligado
  UPDATE public.hierarquia_comercial
     SET ativo = true, atualizado_em = now()
   WHERE vendedor_id = v_vendedor_id AND representante_id = v_representante_id AND ativo = false;

  IF NOT FOUND THEN
    INSERT INTO public.hierarquia_comercial (vendedor_id, representante_id, ativo)
    VALUES (v_vendedor_id, v_representante_id, true);
    RAISE NOTICE '[SEED 002] Vínculo Comercial criado: vendedor % → representante %', v_vendedor_id, v_representante_id;
  ELSE
    RAISE NOTICE '[SEED 002] Vínculo Comercial reativado: vendedor % → representante %', v_vendedor_id, v_representante_id;
  END IF;
END $$;

-- ====================================================================
-- VERIFICAÇÃO FINAL
-- ====================================================================

\echo ''
\echo '=== ESTADO FINAL representantes ==='
SELECT id, cpf, nome, codigo, status
  FROM public.representantes
 ORDER BY codigo::integer;

\echo ''
\echo '=== hierarquia_comercial ativa ==='
SELECT hc.id, u.cpf AS usuario_cpf, u.tipo_usuario, r.codigo AS rep_codigo, r.cpf AS rep_cpf, hc.ativo
  FROM public.hierarquia_comercial hc
  JOIN public.usuarios          u ON u.id = hc.vendedor_id
  JOIN public.representantes    r ON r.id = hc.representante_id
 WHERE hc.ativo = true
 ORDER BY hc.id;

\echo ''
\echo '=== Próximo código automático ==='
SELECT last_value + 1 AS proximo_codigo FROM public.seq_representante_codigo;

COMMIT;

\echo ''
\echo '✓ Seed 002 concluído — representantes Suporte(1), Comercial(2), Ronaldo(3). Próximo auto = 4+'

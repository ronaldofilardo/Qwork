-- Migração: Criar clínicas faltantes para tomadores ativos tipo 'clinica'
-- Data: 2026-01-26
-- Objetivo: Corrigir dados órfãos de tomadores sem entrada em clinicas

DO $$
DECLARE
  contratante_rec RECORD;
  nova_clinica_id INT;
  funcionarios_atualizados INT := 0;
  clinicas_criadas INT := 0;
BEGIN
  RAISE NOTICE 'Iniciando migração de clínicas órfãs...';
  
  -- Para cada contratante tipo 'clinica' que NÃO tem entrada em clinicas
  FOR contratante_rec IN
    SELECT 
      c.id,
      c.responsavel_nome,
      c.responsavel_email,
      c.responsavel_telefone,
      c.endereco,
      c.cnpj,
      c.responsavel_cpf
    FROM tomadores c
    WHERE c.tipo = 'clinica'
      AND c.ativa = true
      AND c.pagamento_confirmado = true
      AND NOT EXISTS (
        SELECT 1 FROM clinicas cl WHERE cl.contratante_id = c.id
      )
  LOOP
    RAISE NOTICE 'Criando clínica para contratante % (%)', contratante_rec.id, contratante_rec.responsavel_nome;
    
    -- Criar entrada em clinicas
    INSERT INTO clinicas (
      nome,
      cnpj,
      email,
      telefone,
      endereco,
      contratante_id,
      ativa,
      criado_em,
      atualizado_em
    )
    VALUES (
      contratante_rec.responsavel_nome,
      contratante_rec.cnpj,
      contratante_rec.responsavel_email,
      contratante_rec.responsavel_telefone,
      contratante_rec.endereco,
      contratante_rec.id,
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING id INTO nova_clinica_id;
    
    clinicas_criadas := clinicas_criadas + 1;
    RAISE NOTICE '✓ Clínica % criada para contratante %', nova_clinica_id, contratante_rec.id;
    
    -- Atualizar funcionários RH deste contratante para apontar para a nova clínica
    UPDATE funcionarios
    SET clinica_id = nova_clinica_id,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE contratante_id = contratante_rec.id
      AND perfil = 'rh'
      AND clinica_id IS NULL;
    
    GET DIAGNOSTICS funcionarios_atualizados = ROW_COUNT;
    
    IF funcionarios_atualizados > 0 THEN
      RAISE NOTICE '✓ % funcionário(s) RH atualizado(s) com clinica_id = %', funcionarios_atualizados, nova_clinica_id;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migração concluída:';
  RAISE NOTICE '  - Clínicas criadas: %', clinicas_criadas;
  RAISE NOTICE '========================================';
  
END $$;

-- Verificação pós-migração
SELECT 
  'tomadores tipo clinica SEM clinica' as status,
  COUNT(*) as total
FROM tomadores c
WHERE c.tipo = 'clinica'
  AND c.ativa = true
  AND c.pagamento_confirmado = true
  AND NOT EXISTS (SELECT 1 FROM clinicas cl WHERE cl.contratante_id = c.id)

UNION ALL

SELECT 
  'RHs SEM clinica_id' as status,
  COUNT(*) as total
FROM funcionarios
WHERE perfil = 'rh'
  AND ativo = true
  AND contratante_id IS NOT NULL
  AND clinica_id IS NULL;

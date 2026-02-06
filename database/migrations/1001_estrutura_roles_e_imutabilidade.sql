-- ============================================================================
-- Migração 1001: Estrutura de Roles e Princípio da Imutabilidade de Laudos
-- Data: 2026-01-30
-- ============================================================================

-- ============================================================================
-- DOCUMENTAÇÃO DA ESTRUTURA DO SISTEMA
-- ============================================================================

/*
REGRAS DE NEGÓCIO - ROLES E HIERARQUIA:

1. GESTORES NÃO SÃO FUNCIONÁRIOS
   - gestor: gerencia ENTIDADE (contratante tipo='entidade')
   - rh: gerencia CLÍNICA (contratante tipo='clinica')
   - Ambos estão em entidades_senhas, vinculados a contratante_id
   - NÃO devem estar na tabela funcionarios

2. OBRIGATORIEDADE DE GESTORES:
   - Todo contratante tipo='clinica' → DEVE ter um RH
   - Todo contratante tipo='entidade' → DEVE ter um gestor

3. HIERARQUIA CLÍNICA:
   Contratante (tipo='clinica') 
     → tem Clínica
     → Clínica vincula Empresas (empresas_clientes.clinica_id)
     → Empresas têm Funcionários (funcionarios.empresa_id)
     → Funcionários vinculados ao RH da Clínica

4. HIERARQUIA ENTIDADE:
   Contratante (tipo='entidade')
     → tem Funcionários diretos (funcionarios vinculados ao contratante)
     → Funcionários vinculados ao gestor

5. CICLO DE AVALIAÇÃO:
   - Funcionários são elegíveis para lotes de avaliação
   - Lote gera Laudo com hash SHA-256
   - IMUTABILIDADE: Laudo emitido JAMAIS pode ser alterado ou reemitido
   - Hash comprova integridade
   - Laudo só pode ser baixado e persistido

6. PRINCÍPIO DA IMUTABILIDADE:
   - Tabelas: laudos, avaliacoes, respostas, resultados
   - Triggers: enforce_laudo_immutability, prevent_avaliacao_update_after_emission
   - Após emissão: UPDATE e DELETE bloqueados
   - Garantia: hash_pdf permanece inalterado
*/

-- ============================================================================
-- CORREÇÃO 1: Adicionar gestor faltante (Contratante 4)
-- ============================================================================

-- Verificar contratante 4 (TEses final entidadae)
DO $$ 
DECLARE
  v_contratante_id INT := 4;
  v_cpf VARCHAR := '58241166010';
  v_senha_esperada VARCHAR;
  v_tem_gestor BOOLEAN;
BEGIN
  -- Verificar se já tem gestor
  SELECT EXISTS(
    SELECT 1 FROM entidades_senhas WHERE contratante_id = v_contratante_id
  ) INTO v_tem_gestor;

  IF v_tem_gestor THEN
    RAISE NOTICE 'Contratante % já tem gestor cadastrado', v_contratante_id;
  ELSE
    -- Obter senha (últimos 6 dígitos do CNPJ)
    SELECT RIGHT(cnpj, 6) INTO v_senha_esperada
    FROM contratantes WHERE id = v_contratante_id;
    
    RAISE NOTICE 'Inserindo gestor CPF % para contratante % (senha: %)', v_cpf, v_contratante_id, v_senha_esperada;
    
    -- Inserir gestor com senha hasheada
    INSERT INTO entidades_senhas (
      cpf, 
      contratante_id, 
      senha_hash, 
      primeira_senha_alterada
    )
    VALUES (
      v_cpf,
      v_contratante_id,
      crypt(v_senha_esperada, gen_salt('bf', 10)),
      false
    )
    ON CONFLICT (cpf) DO NOTHING;
    
    RAISE NOTICE 'Gestor inserido com sucesso!';
  END IF;
END $$;

-- ============================================================================
-- VALIDAÇÃO 1: Todos contratantes têm gestor?
-- ============================================================================

DO $$
DECLARE
  v_clinicas_sem_rh INT;
  v_entidades_sem_gestor INT;
BEGIN
  -- Contar clínicas sem RH
  SELECT COUNT(*) INTO v_clinicas_sem_rh
  FROM contratantes c
  LEFT JOIN entidades_senhas cs ON cs.contratante_id = c.id
  WHERE c.tipo = 'clinica' AND cs.cpf IS NULL AND c.ativa = true;
  
  -- Contar entidades sem gestor
  SELECT COUNT(*) INTO v_entidades_sem_gestor
  FROM contratantes c
  LEFT JOIN entidades_senhas cs ON cs.contratante_id = c.id
  WHERE c.tipo = 'entidade' AND cs.cpf IS NULL AND c.ativa = true;
  
  IF v_clinicas_sem_rh = 0 AND v_entidades_sem_gestor = 0 THEN
    RAISE NOTICE '✓ SUCCESS: Todos os contratantes ativos têm gestores!';
  ELSE
    IF v_clinicas_sem_rh > 0 THEN
      RAISE WARNING '❌ % clínica(s) sem RH', v_clinicas_sem_rh;
    END IF;
    IF v_entidades_sem_gestor > 0 THEN
      RAISE WARNING '❌ % entidade(s) sem gestor', v_entidades_sem_gestor;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- VALIDAÇÃO 2: Laudos emitidos têm hash?
-- ============================================================================

DO $$
DECLARE
  v_laudos_sem_hash INT;
  v_total_emitidos INT;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE hash_pdf IS NULL),
    COUNT(*)
  INTO v_laudos_sem_hash, v_total_emitidos
  FROM laudos
  WHERE status IN ('emitido', 'enviado');
  
  IF v_laudos_sem_hash = 0 THEN
    RAISE NOTICE '✓ SUCCESS: Todos os % laudos emitidos têm hash!', v_total_emitidos;
  ELSE
    RAISE WARNING '❌ % de % laudos emitidos SEM HASH (violação da imutabilidade!)', 
      v_laudos_sem_hash, v_total_emitidos;
  END IF;
END $$;

-- ============================================================================
-- VALIDAÇÃO 3: Triggers de imutabilidade ativos?
-- ============================================================================

DO $$
DECLARE
  v_triggers_ativos INT;
  v_triggers_esperados INT := 7; -- triggers críticos de imutabilidade
BEGIN
  SELECT COUNT(*) INTO v_triggers_ativos
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname IN (
    'enforce_laudo_immutability',
    'prevent_avaliacao_update_after_emission',
    'prevent_avaliacao_delete_after_emission',
    'prevent_lote_update_after_emission',
    'trigger_resposta_immutability',
    'trigger_resultado_immutability',
    'trg_prevent_laudo_lote_id_change'
  )
  AND t.tgenabled = 'O'; -- O = enabled
  
  IF v_triggers_ativos >= v_triggers_esperados THEN
    RAISE NOTICE '✓ SUCCESS: % triggers de imutabilidade ativos', v_triggers_ativos;
  ELSE
    RAISE WARNING '❌ Apenas % de % triggers de imutabilidade ativos!', 
      v_triggers_ativos, v_triggers_esperados;
  END IF;
END $$;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

SELECT 
  '========================================' as relatorio,
  'ESTRUTURA DE ROLES E IMUTABILIDADE' as titulo,
  '========================================' as linha;

-- Contratantes e seus gestores
SELECT 
  c.id,
  c.tipo,
  c.nome,
  cs.cpf as gestor_cpf,
  CASE 
    WHEN c.tipo = 'clinica' AND cs.cpf IS NOT NULL THEN '✓ CLINICA COM RH'
    WHEN c.tipo = 'entidade' AND cs.cpf IS NOT NULL THEN '✓ ENTIDADE COM GESTOR'
    WHEN c.tipo = 'clinica' THEN '❌ CLINICA SEM RH'
    WHEN c.tipo = 'entidade' THEN '❌ ENTIDADE SEM GESTOR'
    ELSE '⚠️ TIPO DESCONHECIDO'
  END as status
FROM contratantes c
LEFT JOIN entidades_senhas cs ON cs.contratante_id = c.id
WHERE c.ativa = true
ORDER BY c.tipo, c.id;

-- Laudos e imutabilidade
SELECT 
  l.id,
  l.lote_id,
  l.status,
  l.emitido_em,
  CASE 
    WHEN l.hash_pdf IS NOT NULL THEN '✓ COM HASH'
    ELSE '❌ SEM HASH'
  END as hash_status,
  LENGTH(l.hash_pdf) as tamanho_hash
FROM laudos l
WHERE l.status IN ('emitido', 'enviado')
ORDER BY l.emitido_em DESC;

-- Migration 201: FASE 2 - Refatorar RLS com políticas simplificadas
-- Data: 2026-01-29
-- Descrição: Simplificar políticas RLS usando usuario_tipo
-- Prioridade: ALTA

BEGIN;

\echo '=== MIGRATION 201: FASE 2 - REFATORAR RLS ==='

-- ==========================================
-- 1. REMOVER POLÍTICAS ANTIGAS
-- ==========================================

\echo '1. Removendo políticas RLS antigas...'

-- Funcionarios
DROP POLICY IF EXISTS funcionarios_select_policy ON funcionarios;
DROP POLICY IF EXISTS funcionarios_update_policy ON funcionarios;
DROP POLICY IF EXISTS funcionarios_insert_policy ON funcionarios;
DROP POLICY IF EXISTS funcionarios_delete_policy ON funcionarios;
DROP POLICY IF EXISTS funcionarios_own_select ON funcionarios;
DROP POLICY IF EXISTS funcionarios_own_update ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_clinica ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_insert ON funcionarios;
DROP POLICY IF EXISTS funcionarios_rh_update ON funcionarios;
DROP POLICY IF EXISTS admin_restricted_funcionarios ON funcionarios;
DROP POLICY IF EXISTS admin_all_funcionarios ON funcionarios;

\echo '   ✓ Políticas antigas removidas'

-- ==========================================
-- 2. CRIAR FUNÇÕES AUXILIARES RLS
-- ==========================================

\echo '2. Criando funções auxiliares...'

-- Função para obter usuario_tipo do contexto
CREATE OR REPLACE FUNCTION current_user_tipo() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_tipo', true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION current_user_tipo() IS 
'Retorna o usuario_tipo da sessão atual (app.current_user_tipo)';

\echo '   ✓ Funções auxiliares criadas'

-- ==========================================
-- 3. CRIAR POLÍTICAS RLS UNIFICADAS
-- ==========================================

\echo '3. Criando políticas RLS unificadas...'

-- 3.1. SELECT - Leitura de funcionários
CREATE POLICY funcionarios_unified_select ON funcionarios FOR SELECT USING (
  -- Admin vê todos os registros
  (current_user_tipo() = 'admin')
  OR
  -- Gestor RH vê funcionários da sua clínica
  (current_user_tipo() = 'gestor_rh' 
   AND clinica_id = current_user_clinica_id())
  OR
  -- Gestor entidade vê funcionários da sua entidade
  (current_user_tipo() = 'gestor_entidade'
   AND contratante_id = current_user_contratante_id())
  OR
  -- Emissor vê apenas perfis operacionais (para laudos)
  (current_user_tipo() = 'emissor' 
   AND usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade'))
  OR
  -- Funcionário vê apenas seus próprios dados
  (cpf = current_user_cpf())
);

COMMENT ON POLICY funcionarios_unified_select ON funcionarios IS
'Política unificada de SELECT:
- Admin: vê tudo
- Gestor RH: vê funcionários da clínica (via clinica_id)
- Gestor Entidade: vê funcionários da entidade (via contratante_id)
- Emissor: vê funcionários para emissão de laudos
- Funcionário: vê apenas próprios dados';

-- 3.2. INSERT - Criação de funcionários
CREATE POLICY funcionarios_unified_insert ON funcionarios FOR INSERT WITH CHECK (
  -- Admin pode criar qualquer tipo (exceto outros admins)
  (current_user_tipo() = 'admin' 
   AND usuario_tipo != 'admin')
  OR
  -- Gestor RH pode criar funcionários de clínica na sua clínica
  (current_user_tipo() = 'gestor_rh'
   AND usuario_tipo = 'funcionario_clinica'
   AND clinica_id = current_user_clinica_id())
  OR
  -- Gestor entidade pode criar funcionários de entidade na sua entidade
  (current_user_tipo() = 'gestor_entidade'
   AND usuario_tipo = 'funcionario_entidade'
   AND contratante_id = current_user_contratante_id())
);

COMMENT ON POLICY funcionarios_unified_insert ON funcionarios IS
'Política unificada de INSERT:
- Admin: cria qualquer tipo (exceto admin)
- Gestor RH: cria apenas funcionario_clinica na sua clínica
- Gestor Entidade: cria apenas funcionario_entidade na sua entidade';

-- 3.3. UPDATE - Atualização de funcionários
CREATE POLICY funcionarios_unified_update ON funcionarios FOR UPDATE USING (
  -- Admin pode atualizar qualquer registro (exceto outros admins)
  (current_user_tipo() = 'admin' 
   AND usuario_tipo != 'admin')
  OR
  -- Gestor RH pode atualizar funcionários da sua clínica
  (current_user_tipo() = 'gestor_rh'
   AND clinica_id = current_user_clinica_id())
  OR
  -- Gestor entidade pode atualizar funcionários da sua entidade
  (current_user_tipo() = 'gestor_entidade'
   AND contratante_id = current_user_contratante_id())
  OR
  -- Funcionário pode atualizar apenas seus dados (campos limitados via trigger)
  (cpf = current_user_cpf())
) WITH CHECK (
  -- Impedir mudança de tipo de usuário
  (usuario_tipo = (SELECT usuario_tipo FROM funcionarios WHERE cpf = current_user_cpf()))
  AND
  -- Impedir mudança de vínculos (clinica_id, contratante_id, empresa_id)
  (clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = current_user_cpf()) OR (clinica_id IS NULL AND (SELECT clinica_id FROM funcionarios WHERE cpf = current_user_cpf()) IS NULL))
  AND
  (contratante_id = (SELECT contratante_id FROM funcionarios WHERE cpf = current_user_cpf()) OR (contratante_id IS NULL AND (SELECT contratante_id FROM funcionarios WHERE cpf = current_user_cpf()) IS NULL))
);

COMMENT ON POLICY funcionarios_unified_update ON funcionarios IS
'Política unificada de UPDATE:
- Mesmas regras de SELECT
- WITH CHECK impede mudança de usuario_tipo e vínculos';

-- 3.4. DELETE - Remoção de funcionários
CREATE POLICY funcionarios_unified_delete ON funcionarios FOR DELETE USING (
  -- Apenas admin pode deletar (soft delete preferível)
  (current_user_tipo() = 'admin')
);

COMMENT ON POLICY funcionarios_unified_delete ON funcionarios IS
'Política unificada de DELETE: apenas admin pode deletar';

\echo '   ✓ Políticas RLS unificadas criadas'

-- ==========================================
-- 4. AVALIAR TABELA contratantes_funcionarios
-- ==========================================

\echo '4. Avaliando uso de contratantes_funcionarios...'

DO $$
DECLARE
  total_registros INT;
  uso_ativo BOOLEAN;
BEGIN
  -- Verificar se tabela tem dados
  SELECT COUNT(*) INTO total_registros 
  FROM contratantes_funcionarios;
  
  IF total_registros = 0 THEN
    RAISE NOTICE 'Tabela contratantes_funcionarios vazia';
    RAISE NOTICE 'RECOMENDAÇÃO: Considerar remoção ou população da tabela';
    uso_ativo := false;
  ELSE
    RAISE NOTICE 'Tabela contratantes_funcionarios tem % registros', total_registros;
    uso_ativo := true;
  END IF;
  
  -- Armazenar resultado para referência
  CREATE TEMP TABLE IF NOT EXISTS migration_201_status (
    tabela TEXT,
    status TEXT,
    total_registros INT
  );
  
  INSERT INTO migration_201_status VALUES (
    'contratantes_funcionarios',
    CASE WHEN uso_ativo THEN 'EM_USO' ELSE 'VAZIA' END,
    total_registros
  );
END $$;

\echo '   ✓ Avaliação concluída'

-- ==========================================
-- 5. POPULAR contratantes_funcionarios (OPCIONAL)
-- ==========================================

\echo '5. Populando contratantes_funcionarios (se necessário)...'

-- Popular para funcionários de clínica via clinica→contratante
INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
SELECT 
  f.id,
  c.id,
  c.tipo,
  f.ativo
FROM funcionarios f
JOIN clinicas cl ON cl.id = f.clinica_id
JOIN contratantes c ON c.id = cl.contratante_id
WHERE f.usuario_tipo = 'funcionario_clinica'
  AND NOT EXISTS (
    SELECT 1 FROM contratantes_funcionarios cf 
    WHERE cf.funcionario_id = f.id 
    AND cf.contratante_id = c.id
  );

-- Popular para funcionários de entidade (vínculo direto)
INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
SELECT 
  f.id,
  f.contratante_id,
  'entidade',
  f.ativo
FROM funcionarios f
WHERE f.usuario_tipo = 'funcionario_entidade'
  AND f.contratante_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contratantes_funcionarios cf 
    WHERE cf.funcionario_id = f.id 
    AND cf.contratante_id = f.contratante_id
  );

\echo '   ✓ População concluída'

-- ==========================================
-- 6. CRIAR TRIGGER PARA SINCRONIZAÇÃO
-- ==========================================

\echo '6. Criando trigger de sincronização...'

CREATE OR REPLACE FUNCTION sync_contratantes_funcionarios()
RETURNS TRIGGER AS $$
BEGIN
  -- Ao inserir funcionário, criar vínculo automático
  IF (TG_OP = 'INSERT') THEN
    -- Funcionário de clínica
    IF NEW.usuario_tipo = 'funcionario_clinica' AND NEW.clinica_id IS NOT NULL THEN
      INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
      SELECT NEW.id, c.id, c.tipo, NEW.ativo
      FROM clinicas cl
      JOIN contratantes c ON c.id = cl.contratante_id
      WHERE cl.id = NEW.clinica_id
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Funcionário de entidade
    IF NEW.usuario_tipo = 'funcionario_entidade' AND NEW.contratante_id IS NOT NULL THEN
      INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo)
      VALUES (NEW.id, NEW.contratante_id, 'entidade', NEW.ativo)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  -- Ao atualizar status ativo, sincronizar vínculo
  IF (TG_OP = 'UPDATE') THEN
    IF NEW.ativo != OLD.ativo THEN
      UPDATE contratantes_funcionarios
      SET vinculo_ativo = NEW.ativo,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE funcionario_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_contratantes_funcionarios ON funcionarios;
CREATE TRIGGER trg_sync_contratantes_funcionarios
  AFTER INSERT OR UPDATE ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION sync_contratantes_funcionarios();

COMMENT ON FUNCTION sync_contratantes_funcionarios() IS
'Sincroniza automaticamente vínculos em contratantes_funcionarios ao criar/atualizar funcionários';

\echo '   ✓ Trigger criado'

-- ==========================================
-- 7. VALIDAR RLS
-- ==========================================

\echo '7. Validando configuração RLS...'

DO $$
DECLARE
  rls_ativo BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_ativo
  FROM pg_class
  WHERE relname = 'funcionarios';
  
  IF NOT rls_ativo THEN
    RAISE EXCEPTION 'RLS não está habilitado em funcionarios!';
  END IF;
  
  RAISE NOTICE 'RLS validado: funcionarios tem RLS ativo';
END $$;

\echo '   ✓ Validação RLS concluída'

COMMIT;

\echo '=== MIGRATION 201: FASE 2 CONCLUÍDA COM SUCESSO ==='
\echo ''
\echo 'Próximos passos:'
\echo '  1. Atualizar lib/db-security.ts para usar usuario_tipo'
\echo '  2. Criar lib/funcionarios.ts com função unificada'
\echo '  3. Executar testes RLS'

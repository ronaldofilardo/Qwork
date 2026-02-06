-- Migration 132: Criar Views Semânticas para Separação Clara de Papéis
-- Data: 31/01/2026
-- Descrição: Views para facilitar queries e deixar clara a separação entre gestores e funcionários operacionais

BEGIN;

\echo '=== MIGRATION 132: CRIANDO VIEWS SEMÂNTICAS ==='

-- ==========================================
-- 1. VIEW: GESTORES (RH + ENTIDADE)
-- ==========================================

\echo '1. Criando view gestores...'

CREATE OR REPLACE VIEW gestores AS
SELECT 
  id,
  cpf,
  nome,
  email,
  usuario_tipo,
  perfil,
  CASE 
    WHEN usuario_tipo = 'rh' THEN 'RH (Clínica)'
    WHEN usuario_tipo = 'gestor' THEN 'Entidade'
    ELSE 'Outro'
  END as tipo_gestor_descricao,
  clinica_id,
  contratante_id,
  ativo,
  criado_em,
  atualizado_em
FROM funcionarios
WHERE usuario_tipo IN ('rh', 'gestor');

COMMENT ON VIEW gestores IS 
'View semântica para todos os gestores do sistema.
Inclui gestores de RH (clínicas) e gestores de entidades.
Facilita queries que precisam apenas de gestores administrativos.';

\echo '   ✓ View gestores criada'

-- ==========================================
-- 2. VIEW: FUNCIONÁRIOS OPERACIONAIS
-- ==========================================

\echo '2. Criando view funcionarios_operacionais...'

CREATE OR REPLACE VIEW funcionarios_operacionais AS
SELECT 
  id,
  cpf,
  nome,
  email,
  usuario_tipo,
  perfil,
  CASE 
    WHEN usuario_tipo = 'funcionario_clinica' THEN 'Clínica (Empresa Intermediária)'
    WHEN usuario_tipo = 'funcionario_entidade' THEN 'Entidade (Direto)'
    ELSE 'Outro'
  END as tipo_funcionario_descricao,
  empresa_id,
  clinica_id,
  contratante_id,
  setor,
  funcao,
  nivel_cargo,
  data_nascimento,
  matricula,
  turno,
  escala,
  ativo,
  criado_em,
  atualizado_em
FROM funcionarios
WHERE usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade');

COMMENT ON VIEW funcionarios_operacionais IS 
'View semântica para funcionários operacionais que realizam avaliações.
Exclui gestores, admins e emissores.
Facilita queries de RH e relatórios de funcionários.';

\echo '   ✓ View funcionarios_operacionais criada'

-- ==========================================
-- 3. VIEW: EQUIPE ADMINISTRATIVA (ADMIN + EMISSOR)
-- ==========================================

\echo '3. Criando view equipe_administrativa...'

CREATE OR REPLACE VIEW equipe_administrativa AS
SELECT 
  id,
  cpf,
  nome,
  email,
  usuario_tipo,
  perfil,
  CASE 
    WHEN usuario_tipo = 'admin' THEN 'Administrador do Sistema'
    WHEN usuario_tipo = 'emissor' THEN 'Emissor de Laudos'
    ELSE 'Outro'
  END as papel_descricao,
  clinica_id,
  ativo,
  criado_em,
  atualizado_em
FROM funcionarios
WHERE usuario_tipo IN ('admin', 'emissor');

COMMENT ON VIEW equipe_administrativa IS 
'View semântica para equipe administrativa da plataforma.
Inclui administradores do sistema e emissores de laudos.
Facilita auditoria e gestão de acessos especiais.';

\echo '   ✓ View equipe_administrativa criada'

-- ==========================================
-- 4. VIEW: RESUMO DE USUÁRIOS POR TIPO
-- ==========================================

\echo '4. Criando view usuarios_resumo...'

CREATE OR REPLACE VIEW usuarios_resumo AS
SELECT 
  usuario_tipo,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE ativo = true) as ativos,
  COUNT(*) FILTER (WHERE ativo = false) as inativos,
  COUNT(DISTINCT clinica_id) FILTER (WHERE clinica_id IS NOT NULL) as clinicas_vinculadas,
  COUNT(DISTINCT contratante_id) FILTER (WHERE contratante_id IS NOT NULL) as contratantes_vinculados,
  COUNT(DISTINCT empresa_id) FILTER (WHERE empresa_id IS NOT NULL) as empresas_vinculadas
FROM funcionarios
WHERE usuario_tipo IS NOT NULL
GROUP BY usuario_tipo
ORDER BY 
  CASE usuario_tipo
    WHEN 'admin' THEN 1
    WHEN 'emissor' THEN 2
    WHEN 'rh' THEN 3
    WHEN 'gestor' THEN 4
    WHEN 'funcionario_clinica' THEN 5
    WHEN 'funcionario_entidade' THEN 6
  END;

COMMENT ON VIEW usuarios_resumo IS 
'View analítica com resumo estatístico de usuários por tipo.
Útil para dashboards administrativos e relatórios gerenciais.';

\echo '   ✓ View usuarios_resumo criada'

-- ==========================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ==========================================

\echo '5. Verificando índices necessários...'

-- Índices já foram criados na Migration 200, mas vamos garantir
CREATE INDEX IF NOT EXISTS idx_funcionarios_usuario_tipo ON funcionarios(usuario_tipo);
CREATE INDEX IF NOT EXISTS idx_funcionarios_usuario_tipo_ativo ON funcionarios(usuario_tipo, ativo);
CREATE INDEX IF NOT EXISTS idx_funcionarios_tipo_clinica ON funcionarios(usuario_tipo, clinica_id) WHERE clinica_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_funcionarios_tipo_contratante ON funcionarios(usuario_tipo, contratante_id) WHERE contratante_id IS NOT NULL;

\echo '   ✓ Índices verificados'

-- ==========================================
-- 6. VALIDAÇÃO
-- ==========================================

\echo '6. Validando views...'

DO $$
DECLARE
  total_funcionarios INT;
  total_views INT;
BEGIN
  SELECT COUNT(*) INTO total_funcionarios FROM funcionarios WHERE usuario_tipo IS NOT NULL;
  
  SELECT 
    (SELECT COUNT(*) FROM gestores) +
    (SELECT COUNT(*) FROM funcionarios_operacionais) +
    (SELECT COUNT(*) FROM equipe_administrativa)
  INTO total_views;
  
  IF total_funcionarios != total_views THEN
    RAISE WARNING 'Atenção: total de funcionários (%) diferente de soma das views (%)', total_funcionarios, total_views;
  ELSE
    RAISE NOTICE '✓ Validação OK: % registros cobertos pelas views', total_funcionarios;
  END IF;
END $$;

\echo '   ✓ Validação concluída'

COMMIT;

\echo '=== MIGRATION 132: CONCLUÍDA COM SUCESSO ==='
\echo ''
\echo 'Views criadas:'
\echo '  - gestores: Gestores RH e Entidade'
\echo '  - funcionarios_operacionais: Funcionários que realizam avaliações'
\echo '  - equipe_administrativa: Admins e Emissores'
\echo '  - usuarios_resumo: Estatísticas por tipo de usuário'
\echo ''
\echo 'Uso recomendado:'
\echo '  SELECT * FROM gestores WHERE clinica_id = 123;'
\echo '  SELECT * FROM funcionarios_operacionais WHERE empresa_id = 456;'
\echo '  SELECT * FROM usuarios_resumo;'

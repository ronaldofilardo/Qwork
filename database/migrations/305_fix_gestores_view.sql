-- Migration 305: Corrigir View 'gestores' para buscar em 'usuarios' ao invés de 'funcionarios'
-- Data: 05/02/2026
-- Problema: A view 'gestores' estava buscando tipos 'rh' e 'gestor' na tabela 'funcionarios'
--           quando esses tipos só existem na tabela 'usuarios'
-- Solução: Recriar a view apontando para a tabela correta

-- Dropar view antiga (criada incorretamente na migration 132)
DROP VIEW IF EXISTS gestores CASCADE;

-- Recriar view corretamente apontando para tabela 'usuarios'
CREATE OR REPLACE VIEW gestores AS
SELECT 
  cpf,  -- usuarios usa cpf como PK, não id
  nome,
  email,
  tipo_usuario as usuario_tipo,  -- usuarios usa tipo_usuario, não usuario_tipo
  CASE 
    WHEN tipo_usuario = 'rh' THEN 'RH (Clínica)'
    WHEN tipo_usuario = 'gestor' THEN 'Gestor de Entidade'
    ELSE 'Outro'
  END as tipo_gestor_descricao,
  clinica_id,
  entidade_id,  -- usuarios usa entidade_id, não contratante_id
  ativo,
  criado_em,
  atualizado_em
FROM usuarios
WHERE tipo_usuario IN ('rh', 'gestor');

COMMENT ON VIEW gestores IS 
'View semântica para todos os gestores do sistema.
Inclui gestores de RH (clínicas) e gestores de entidades.
ATUALIZADO: Agora busca corretamente na tabela usuarios (não funcionarios).
Facilita queries que precisam apenas de gestores administrativos.';

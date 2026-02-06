-- Migration: 422_update_views_for_entidades
-- Description: Update database views to use entidade_id instead of contratante_id and rename columns accordingly
-- Created: 2024-01-31

-- Update vw_audit_trail_por_contratante to use entidade columns (keeping backward compatibility)
CREATE OR REPLACE VIEW vw_audit_trail_por_contratante AS
SELECT
    al.id,
    al.resource,
    al.action,
    al.resource_id,
    al.details,
    al.user_cpf,
    f.nome AS user_nome,
    f.clinica_id,
    c.nome AS clinica_nome,
    al.contratante_id,  -- Keep old column name for backward compatibility
    cont.nome AS contratante_nome,  -- Keep old column name
    cont.tipo AS tipo_contratante,  -- Keep old column name
    al.created_at,
    al.ip_address
FROM audit_logs al
LEFT JOIN funcionarios f ON al.user_cpf = f.cpf
LEFT JOIN clinicas c ON f.clinica_id = c.id
LEFT JOIN entidades cont ON al.contratante_id = cont.id
WHERE al.created_at >= (now() - '90 days'::interval)
ORDER BY al.created_at DESC;

-- Update vw_recibos_completos to use entidade columns (keeping backward compatibility)
CREATE OR REPLACE VIEW vw_recibos_completos AS
SELECT
    r.id,
    r.numero_recibo,
    r.vigencia_inicio,
    r.vigencia_fim,
    r.numero_funcionarios_cobertos,
    r.valor_total_anual,
    r.valor_por_funcionario,
    r.forma_pagamento,
    r.numero_parcelas,
    COALESCE(r.valor_parcela,
        CASE
            WHEN r.numero_parcelas IS NOT NULL AND r.numero_parcelas > 0 THEN round(r.valor_total_anual::numeric / r.numero_parcelas::numeric, 2)
            ELSE r.valor_total_anual
        END) AS valor_parcela,
    r.descricao_pagamento,
    r.criado_em,
    c.id AS contrato_id,
    c.conteudo_gerado AS contrato_conteudo,
    c.data_aceite AS contrato_data_aceite,
    ct.nome AS contratante_nome,  -- Keep old column name
    ct.cnpj AS contratante_cnpj,  -- Keep old column name
    ct.email AS contratante_email,  -- Keep old column name
    ct.tipo AS contratante_tipo,  -- Keep old column name
    p.nome AS plano_nome,
    p.tipo AS plano_tipo,
    pg.metodo AS pagamento_metodo,
    pg.data_pagamento,
    pg.status AS pagamento_status
FROM recibos r
JOIN contratos c ON r.contrato_id = c.id
JOIN entidades ct ON r.contratante_id = ct.id
JOIN pagamentos pg ON r.pagamento_id = pg.id
JOIN planos p ON c.plano_id = p.id
WHERE r.ativo = true
ORDER BY r.criado_em DESC;

-- Update funcionarios_operacionais to use entidade_id
CREATE OR REPLACE VIEW funcionarios_operacionais AS
SELECT
    id,
    cpf,
    nome,
    email,
    usuario_tipo,
    perfil,
    CASE
        WHEN usuario_tipo = 'funcionario_clinica'::usuario_tipo_enum THEN 'Clínica (Empresa Intermediária)'::text
        WHEN usuario_tipo = 'funcionario_entidade'::usuario_tipo_enum THEN 'Entidade (Direto)'::text
        ELSE 'Outro'::text
    END AS tipo_funcionario_descricao,
    empresa_id,
    clinica_id,
    contratante_id,  -- Keep old column name for backward compatibility
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
WHERE usuario_tipo = ANY (ARRAY['funcionario_clinica'::usuario_tipo_enum, 'funcionario_entidade'::usuario_tipo_enum]);
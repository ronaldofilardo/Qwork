-- Migração: Atualizar função de geração de laudo para fazer UPDATE em vez de INSERT
-- Data: 2026-01-28
-- Objetivo: Como o laudo rascunho já existe (reservado no momento da criação do lote), 
--           apenas atualizamos o status e dados ao concluir

BEGIN;

-- Atualizar função upsert_laudo para sempre fazer UPDATE (laudo já existe em rascunho)
CREATE OR REPLACE FUNCTION upsert_laudo(
    p_lote_id INTEGER,
    p_emissor_cpf CHAR(11),
    p_observacoes TEXT,
    p_status TEXT DEFAULT 'enviado'
) RETURNS INTEGER AS $$
DECLARE
    v_laudo_id INTEGER;
BEGIN
    -- Como o laudo já foi criado em rascunho ao criar o lote, apenas atualizamos
    UPDATE laudos
    SET 
        emissor_cpf = p_emissor_cpf,
        observacoes = p_observacoes,
        status = p_status,
        emitido_em = NOW(),
        atualizado_em = NOW()
    WHERE id = p_lote_id
    RETURNING id INTO v_laudo_id;

    -- Se não existir (caso de lotes antigos), inserir
    IF v_laudo_id IS NULL THEN
        INSERT INTO laudos (id, lote_id, emissor_cpf, observacoes, status, criado_em, emitido_em, atualizado_em)
        VALUES (p_lote_id, p_lote_id, p_emissor_cpf, p_observacoes, p_status, NOW(), NOW(), NOW())
        RETURNING id INTO v_laudo_id;
    END IF;

    RETURN v_laudo_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_laudo IS 'Atualiza laudo rascunho existente (id já reservado) ou insere se não existir';

COMMIT;

-- Rollback manual (se necessário):
-- Restaurar versão anterior da função

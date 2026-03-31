-- Migration 1123: Deprecar percentual_comissao global do representante
-- Permite NULL para novos representantes (comissão agora é por lead/vínculo)

BEGIN;

-- 1. Permitir NULL no campo global (novos reps não precisam ter valor global)
ALTER TABLE representantes
  ALTER COLUMN percentual_comissao DROP NOT NULL;

ALTER TABLE representantes
  ALTER COLUMN percentual_vendedor_direto DROP NOT NULL;

-- 2. Comentário de deprecação
COMMENT ON COLUMN representantes.percentual_comissao IS 'DEPRECADO: comissão agora é por lead/vínculo (vinculos_comissao.percentual_comissao_representante). Mantido para fallback em legado.';
COMMENT ON COLUMN representantes.percentual_vendedor_direto IS 'DEPRECADO: usar vinculos_comissao.percentual_comissao_representante para vendas diretas.';

COMMIT;

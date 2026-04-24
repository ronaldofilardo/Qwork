-- Script para remover representante PF (CPF 67413957094) do banco de PRODUÇÃO
-- Execute no banco neondb_v2 (produção) com cuidado
-- Gerado em: 2025 — sessão de remoção de Pessoa Física

BEGIN;

-- 1. Desassociar o lead vinculado (se existir)
UPDATE public.representantes_cadastro_leads
SET representante_id = NULL
WHERE representante_id = (
  SELECT id FROM public.representantes
  WHERE cpf = '67413957094' AND tipo_pessoa = 'pf'
  LIMIT 1
);

-- 2. Deletar o representante PF
DELETE FROM public.representantes
WHERE cpf = '67413957094'
  AND tipo_pessoa = 'pf';

-- 3. Verificar resultado (deve retornar 0 linhas)
SELECT id, nome, cpf FROM public.representantes WHERE cpf = '67413957094';

COMMIT;

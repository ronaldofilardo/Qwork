-- Migration 1126: Vendedores PF/PJ + Paths de documentos
-- Data: 2026-03-23
-- Objetivo: Adicionar distinção PF/PJ aos vendedores e campos para armazenar
--           caminhos de documentos (CAD, NF/RPA), alinhando com o sistema de
--           storage hierárquico de representantes.
-- ====================================================================

BEGIN;

-- 1. Tipo pessoa do vendedor (pf ou pj)
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS tipo_pessoa CHAR(2) NOT NULL DEFAULT 'pf'
    CHECK (tipo_pessoa IN ('pf', 'pj'));

-- 2. CNPJ (obrigatório para PJ)
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS cnpj CHAR(14) UNIQUE;

-- 3. CPF do responsável PJ
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS cpf_responsavel_pj CHAR(11);

-- 4. Razão social (obrigatória para PJ)
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS razao_social VARCHAR(200);

-- 5. Path canônico do documento de cadastro (substitui o placeholder doc_path)
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS doc_cad_path TEXT;

-- 6. Path do documento NF (PJ) ou RPA (PF)
ALTER TABLE public.vendedores_perfil
  ADD COLUMN IF NOT EXISTS doc_nf_rpa_path TEXT;

-- Índice para busca por CNPJ
CREATE INDEX IF NOT EXISTS idx_vendedores_perfil_cnpj
  ON public.vendedores_perfil(cnpj)
  WHERE cnpj IS NOT NULL;

-- Índice para busca por tipo_pessoa
CREATE INDEX IF NOT EXISTS idx_vendedores_perfil_tipo_pessoa
  ON public.vendedores_perfil(tipo_pessoa);

COMMIT;

-- Migration 1217: Remove RPA (Recibo Pagamento Autônomo) legacy
-- Since migration 1209, only PJ is allowed. RPA was PF-only concept.
-- This migration renames nf_rpa columns to nf (keeping NF functionality).

-- 1. Rename doc_nf_rpa_path → doc_nf_path on vendedores_perfil
ALTER TABLE vendedores_perfil
  RENAME COLUMN doc_nf_rpa_path TO doc_nf_path;

-- 2. Drop any remaining 'pf' tipo_pessoa values (cleanup)
-- representantes tipo_pessoa is already constrained to 'pj' by migration 1209
-- No further DDL needed for representantes

-- Done: code references to nf_rpa will be updated to nf

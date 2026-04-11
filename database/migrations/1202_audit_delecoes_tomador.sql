-- Migration 1202: Tabela de auditoria para hard-delete de tomadores
-- Data: 2026-04-10
-- Descrição: Registra cada deleção física de tomador executada pelo admin

CREATE TABLE IF NOT EXISTS public.audit_delecoes_tomador (
  id            SERIAL PRIMARY KEY,
  cnpj          VARCHAR(14)   NOT NULL,
  nome          VARCHAR(255)  NOT NULL,
  tipo          VARCHAR(20)   NOT NULL CHECK (tipo IN ('entidade', 'clinica')),
  tomador_id    INTEGER       NOT NULL,
  admin_cpf     VARCHAR(11)   NOT NULL,
  admin_nome    VARCHAR(255)  NOT NULL,
  resumo        JSONB         NOT NULL DEFAULT '{}',
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_delecoes_tomador_cnpj ON public.audit_delecoes_tomador (cnpj);
CREATE INDEX idx_audit_delecoes_tomador_criado_em ON public.audit_delecoes_tomador (criado_em DESC);

COMMENT ON TABLE public.audit_delecoes_tomador IS 'Auditoria de hard-delete de tomadores por admin';

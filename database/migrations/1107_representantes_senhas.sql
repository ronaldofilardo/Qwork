-- Migration 1107: Tabela dedicada de senhas para representantes
-- Substitui a coluna `senha_repres` inline na tabela `representantes`
-- Padrão segue entidades_senhas / clinicas_senhas
-- Inclui flag `primeira_senha_alterada` para forçar troca no 1º login

BEGIN;

CREATE TABLE IF NOT EXISTS public.representantes_senhas (
  id                      SERIAL PRIMARY KEY,
  representante_id        INTEGER NOT NULL REFERENCES public.representantes(id) ON DELETE CASCADE,
  cpf                     VARCHAR(11) NOT NULL,
  senha_hash              VARCHAR(60),
  primeira_senha_alterada BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice único para evitar duplicatas (1 senha por representante+cpf)
CREATE UNIQUE INDEX IF NOT EXISTS idx_representantes_senhas_rep_cpf
  ON public.representantes_senhas (representante_id, cpf);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_representantes_senhas_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_representantes_senhas_atualizado ON public.representantes_senhas;
CREATE TRIGGER trg_representantes_senhas_atualizado
  BEFORE UPDATE ON public.representantes_senhas
  FOR EACH ROW EXECUTE FUNCTION update_representantes_senhas_atualizado_em();

-- Migrar dados existentes de representantes.senha_repres para representantes_senhas
INSERT INTO public.representantes_senhas (representante_id, cpf, senha_hash, primeira_senha_alterada)
SELECT r.id, COALESCE(r.cpf, r.cpf_responsavel_pj, ''), r.senha_repres, TRUE
FROM public.representantes r
WHERE r.senha_repres IS NOT NULL
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.representantes_senhas
  IS 'Senhas de representantes — substitui senha_repres inline. Padrão análogo a entidades_senhas/clinicas_senhas.';

COMMIT;

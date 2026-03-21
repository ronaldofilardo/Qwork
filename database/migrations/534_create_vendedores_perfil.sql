-- Migration 534: Tabela de perfil estendido para vendedores
-- Armazena dados adicionais gerados no momento do cadastro pelo representante
-- Não altera a tabela `usuarios` (sem impacto em constraints existentes)

CREATE TABLE IF NOT EXISTS public.vendedores_perfil (
  id            SERIAL PRIMARY KEY,
  usuario_id    INTEGER UNIQUE NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  codigo        VARCHAR(12) UNIQUE NOT NULL,  -- formato: VND-XXXXX
  sexo          VARCHAR(10) CHECK (sexo IN ('masculino', 'feminino')),
  endereco      TEXT,
  cidade        VARCHAR(100),
  estado        CHAR(2),
  cep           VARCHAR(9),
  doc_path      TEXT,                         -- placeholder: documento pessoal (implementação futura)
  criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index para busca por código (para futura divulgação em redes sociais)
CREATE INDEX IF NOT EXISTS idx_vendedores_perfil_codigo ON public.vendedores_perfil(codigo);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_vendedores_perfil_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendedores_perfil_atualizado ON public.vendedores_perfil;
CREATE TRIGGER trg_vendedores_perfil_atualizado
  BEFORE UPDATE ON public.vendedores_perfil
  FOR EACH ROW EXECUTE FUNCTION update_vendedores_perfil_atualizado_em();

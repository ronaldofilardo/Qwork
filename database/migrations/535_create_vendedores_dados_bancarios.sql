-- Migration 535: Tabela de dados bancários para vendedores
-- Separada de vendedores_perfil pois envolve dados sensíveis com auditoria obrigatória

CREATE TABLE IF NOT EXISTS public.vendedores_dados_bancarios (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER UNIQUE NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  banco_codigo    VARCHAR(10),
  agencia         VARCHAR(20),
  conta           VARCHAR(30),
  tipo_conta      VARCHAR(20) CHECK (tipo_conta IN ('corrente', 'poupanca', 'pagamento')),
  titular_conta   VARCHAR(200),
  pix_chave       VARCHAR(200),
  pix_tipo        VARCHAR(20) CHECK (pix_tipo IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por usuario_id
CREATE INDEX IF NOT EXISTS idx_vendedores_dados_bancarios_usuario ON public.vendedores_dados_bancarios(usuario_id);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_vendedores_dados_bancarios_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendedores_dados_bancarios_atualizado ON public.vendedores_dados_bancarios;
CREATE TRIGGER trg_vendedores_dados_bancarios_atualizado
  BEFORE UPDATE ON public.vendedores_dados_bancarios
  FOR EACH ROW EXECUTE FUNCTION update_vendedores_dados_bancarios_atualizado_em();

COMMENT ON TABLE public.vendedores_dados_bancarios IS
  'Dados bancários de vendedores — acesso restrito ao perfil suporte. Edições são auditadas em comissionamento_auditoria.';

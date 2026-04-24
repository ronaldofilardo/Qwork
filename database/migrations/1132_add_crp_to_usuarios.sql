-- Migration 1132: Adiciona campos crp e titulo_profissional à tabela usuarios
-- e atualiza dados do emissor GILSON DANTAS DAMASCENO

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS crp VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS titulo_profissional VARCHAR(100) NULL;

-- Atualizar dados do emissor com informações reais
UPDATE usuarios
SET
  nome                = 'GILSON DANTAS DAMASCENO',
  crp                 = '08/4053',
  titulo_profissional = 'Psicólogo'
WHERE tipo_usuario = 'emissor';

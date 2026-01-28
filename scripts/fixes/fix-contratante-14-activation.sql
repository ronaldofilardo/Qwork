-- Correção manual para contratante 14 - Ativar conta após pagamento
-- Data: 2025-01-13
-- Contexto: Pagamento confirmado mas conta não ativada corretamente

BEGIN;

-- 1. Ativar contratante e confirmar pagamento
UPDATE contratantes 
SET 
  status = 'aprovado',  -- Status no enum (não existe 'ativo')
  ativa = true,         -- Boolean que indica se está ativa
  pagamento_confirmado = true,
  aprovado_em = CURRENT_TIMESTAMP,
  aprovado_por_cpf = '00000000000',  -- Admin que aprovou (auto-aprovação via payment)
  atualizado_em = CURRENT_TIMESTAMP
WHERE id = 14;

-- 2. Criar conta de login para o responsável (senha padrão: 123456)
INSERT INTO funcionarios (cpf, nome, email, data_nascimento, senha_hash, perfil, ativo, contratante_id, criado_em, atualizado_em)
VALUES (
  '84666497005',
  'Triagem On-line',
  'opkop@koko.com',
  '1980-01-01',  -- Data fictícia
  '$2a$10$k78cXndJSIOJnoK5anDohe8KHvwPMSrhexZ1zvFUIGzvWJ5HLIeQS', -- senha: 123456
  'gestor_entidade',
  true,
  14,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (cpf) DO UPDATE 
SET 
  ativo = true,
  contratante_id = 14,
  data_nascimento = COALESCE(funcionarios.data_nascimento, '1980-01-01'::date),
  perfil = 'gestor_entidade';

-- 3. Verificar resultados
SELECT 'Contratante ativado:' as info, id, nome, status, ativa, pagamento_confirmado 
FROM contratantes WHERE id = 14;

SELECT 'Login criado:' as info, cpf, nome, email, perfil, ativo, contratante_id 
FROM funcionarios WHERE cpf = '84666497005';

COMMIT;

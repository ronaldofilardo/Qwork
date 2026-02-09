-- Correção manual para contratante 14 - Ativar conta após pagamento
-- Data: 2025-01-13
-- Contexto: Pagamento confirmado mas conta não ativada corretamente

BEGIN;

-- 1. Ativar contratante e confirmar pagamento
UPDATE tomadores 
SET 
  status = 'aprovado',  -- Status no enum (não existe 'ativo')
  ativa = true,         -- Boolean que indica se está ativa
  pagamento_confirmado = true,
  aprovado_em = CURRENT_TIMESTAMP,
  aprovado_por_cpf = '00000000000',  -- Admin que aprovou (auto-aprovação via payment)
  atualizado_em = CURRENT_TIMESTAMP
WHERE id = 14;

-- 2. Criar conta de login para o responsável em USUARIOS (gestores não vão para funcionarios)
-- Determinar se é clínica ou entidade para saber o tipo_usuario
DO $$
DECLARE
    v_tipo VARCHAR(20);
    v_clinica_id INTEGER;
    v_contratante_id INTEGER := 14;
BEGIN
    SELECT tipo INTO v_tipo FROM tomadores WHERE id = v_contratante_id;
    
    IF v_tipo = 'clinica' THEN
        -- Buscar clinica_id
        SELECT id INTO v_clinica_id FROM clinicas WHERE contratante_id = v_contratante_id LIMIT 1;
        
        INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo, criado_em, atualizado_em)
        VALUES (
            '84666497005',
            'Triagem On-line',
            'opkop@koko.com',
            '$2a$10$k78cXndJSIOJnoK5anDohe8KHvwPMSrhexZ1zvFUIGzvWJ5HLIeQS',
            'rh',
            v_clinica_id,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (cpf) DO UPDATE SET
            tipo_usuario = 'rh',
            clinica_id = v_clinica_id,
            ativo = true,
            senha_hash = EXCLUDED.senha_hash,
            atualizado_em = NOW();
    ELSE
        -- Tipo entidade
        INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, contratante_id, ativo, criado_em, atualizado_em)
        VALUES (
            '84666497005',
            'Triagem On-line',
            'opkop@koko.com',
            '$2a$10$k78cXndJSIOJnoK5anDohe8KHvwPMSrhexZ1zvFUIGzvWJ5HLIeQS',
            'gestor',
            v_contratante_id,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (cpf) DO UPDATE SET
            tipo_usuario = 'gestor',
            contratante_id = v_contratante_id,
            ativo = true,
            senha_hash = EXCLUDED.senha_hash,
            atualizado_em = NOW();
    END IF;
END $$;
  'gestor',
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
  perfil = 'gestor';

-- 3. Verificar resultados
SELECT 'Contratante ativado:' as info, id, nome, status, ativa, pagamento_confirmado 
FROM tomadores WHERE id = 14;

SELECT 'Login criado:' as info, cpf, nome, email, perfil, ativo, contratante_id 
FROM funcionarios WHERE cpf = '84666497005';

COMMIT;

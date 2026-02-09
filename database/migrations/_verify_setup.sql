-- Teste: Verificar estado do banco após migrations
-- Executar após migrations: _execute_all_fixes.sql

-- 1. Verificar que tipo_tomador existe em contratos
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'contratos' AND column_name = 'tipo_tomador';

-- 2. Verificar índice foi criado
SELECT indexname FROM pg_indexes 
WHERE tablename = 'contratos' AND indexname = 'idx_contratos_tipo_tomador';

-- 3. Verificar valores do enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'status_aprovacao_enum'::regtype 
ORDER BY enumsortorder;

-- 4. Verificar tabelas entidades e clinicas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('entidades', 'clinicas');

-- 5. Verificar tabelas de senhas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('entidades_senhas', 'clinicas_senhas');

-- 6. Estatísticas
SELECT 
  (SELECT COUNT(*) FROM entidades) as total_entidades,
  (SELECT COUNT(*) FROM clinicas) as total_clinicas,
  (SELECT COUNT(*) FROM contratos) as total_contratos,
  (SELECT COUNT(*) FROM entidades_senhas) as total_entidades_senhas,
  (SELECT COUNT(*) FROM clinicas_senhas) as total_clinicas_senhas;

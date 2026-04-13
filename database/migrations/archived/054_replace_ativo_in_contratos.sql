-- Migration 054: Substituir status legado 'ativo' -> 'aprovado' em contratos
-- Idempotente: atualiza somente registros que ainda contenham o valor legado 'ativo'.
-- Executar em dev e prod para normalizar dados herdados.

BEGIN;

-- Atualiza registros legados que armazenaram 'ativo' (em alguns ambientes) para o valor válido 'aprovado'.
-- Usamos status::text na cláusula WHERE para evitar problemas se o enum no banco local
-- não aceitar o valor literal 'ativo' (isso evita casts implícitos que geram erro 22P02).
UPDATE contratos
SET status = 'aprovado'
WHERE status::text = 'ativo';

COMMIT;

-- Nota: este script é seguro para re-execução e não altera registros que já
-- contenham valores válidos do enum (e.g. 'aprovado', 'rejeitado', 'aguardando_pagamento').

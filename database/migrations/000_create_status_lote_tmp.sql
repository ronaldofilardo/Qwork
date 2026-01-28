DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_lote') THEN
        CREATE TYPE status_lote AS ENUM ('rascunho','ativo','concluido','finalizado','cancelado');
    END IF;
END $$;

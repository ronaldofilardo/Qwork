DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_aprovacao_enum') THEN
    CREATE TYPE status_aprovacao_enum AS ENUM (
      'pendente', 'em_reanalise', 'aprovado', 'rejeitado', 'aguardando_pagamento',
      'aguardando_valor_admin', 'valor_definido', 'pendente_pagamento'
    );
    RAISE NOTICE 'Enum status_aprovacao_enum criado';
  ELSE
    RAISE NOTICE 'Enum status_aprovacao_enum já existe';
  END IF;
END $$;

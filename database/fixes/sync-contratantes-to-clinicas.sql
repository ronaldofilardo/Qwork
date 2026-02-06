-- Sincroniza registros de contratantes(tipo='clinica') para tabela `clinicas` usada por partes legadas do sistema
-- Uso: executar em ambiente controlado (executar backup antes)

BEGIN;

-- Criar tabela `clinicas` caso não exista (estrutura mínima esperada pela aplicação)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clinicas') THEN
        CREATE TABLE clinicas (
            id INTEGER PRIMARY KEY,
            nome VARCHAR(200) NOT NULL,
            cnpj VARCHAR(18) NOT NULL,
            email VARCHAR(100),
            telefone VARCHAR(20),
            endereco TEXT,
            cidade VARCHAR(100),
            estado VARCHAR(2),
            ativa BOOLEAN DEFAULT TRUE,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        -- Criar sequence para compatibilidade futura
        PERFORM setval(pg_get_serial_sequence('clinicas','id'), (SELECT COALESCE(MAX(id),0) FROM clinicas));
    END IF;
END $$;

-- Inserir clinicas faltantes a partir de contratantes (mantendo mesmo id)
INSERT INTO clinicas (id, nome, cnpj, email, telefone, endereco, cidade, estado, ativa, criado_em)
SELECT c.id, c.nome, c.cnpj, c.email, c.telefone, c.endereco, c.cidade, c.estado, c.ativa, c.criado_em
FROM contratantes c
WHERE c.tipo = 'clinica'
  AND NOT EXISTS (SELECT 1 FROM clinicas WHERE clinicas.id = c.id);

-- Atualizar sequence da tabela clinicas se houver sequence
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'clinicas_id_seq') THEN
        PERFORM setval('clinicas_id_seq', (SELECT COALESCE(MAX(id),0) FROM clinicas));
    END IF;
END $$;

COMMIT;

-- Nota: revisar triggers/foreign keys após sincronização. Caso existam referências cruzadas,
-- execute validações e ajuste FK para apontar para a tabela correta (clinicas vs contratantes).

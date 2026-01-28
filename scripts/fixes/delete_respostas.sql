-- Desabilitar trigger
ALTER TABLE respostas DISABLE TRIGGER trigger_resposta_immutability;

-- Deletar respostas
DELETE FROM respostas;

-- Reabilitar trigger
ALTER TABLE respostas ENABLE TRIGGER trigger_resposta_immutability;

-- Verificar
SELECT 'Respostas restantes:', COUNT(*) FROM respostas;
# Como Deletar Clínica 103 e Senha ID=1

## Via Console Neon (RECOMENDADO - 2 minutos)

1. **Acesse:** https://console.neon.tech
2. **Selecione** o projeto/database
3. **Abra** SQL Editor
4. **Cole e execute:**

```sql
-- Verificar dados antes
SELECT 'Clínica 103:' AS info, id, nome, cnpj FROM clinicas WHERE id = 103;
SELECT 'Usuários:' AS info, id, cpf, nome FROM usuarios WHERE clinica_id = 103;
SELECT 'Senhas:' AS info, id, clinica_id, cpf FROM clinicas_senhas WHERE clinica_id = 103 OR id = 1;
SELECT 'Contratos:' AS info, id, tomador_id FROM contratos WHERE tomador_id = 103;

-- Deletar (em ordem de dependências)
BEGIN;

DELETE FROM usuarios WHERE clinica_id = 103;
DELETE FROM contratos WHERE tomador_id = 103 AND tipo_tomador = 'clinica';
DELETE FROM clinicas_senhas WHERE clinica_id = 103;
DELETE FROM clinicas_senhas WHERE id = 1;
DELETE FROM clinicas WHERE id = 103;

COMMIT;

-- Verificar exclusão
SELECT 'RESULTADO:' AS info,
  (SELECT COUNT(*) FROM clinicas WHERE id = 103) AS clinicas,
  (SELECT COUNT(*) FROM clinicas_senhas WHERE id = 1) AS senha_id_1,
  (SELECT COUNT(*) FROM usuarios WHERE clinica_id = 103) AS usuarios;
```

**Resultado esperado:** Todas as contagens = 0

---

## Via psql Local (Alternativa)

```bash
# Obtenha a connection string do .env ou Vercel
psql "postgresql://user:pass@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/nr-bps_db?sslmode=require" \
  -f scripts/delete-clinica-103.sql
```

---

## Via Vercel Dashboard

1. **Settings** → **Environment Variables**
2. Copie **DATABASE_URL**
3. Use com psql ou Node.js

---

## Verificação Final

Após executar, confirme:

```sql
SELECT COUNT(*) FROM clinicas WHERE id = 103;        -- Deve ser 0
SELECT COUNT(*) FROM clinicas_senhas WHERE id = 1;  -- Deve ser 0
SELECT COUNT(*) FROM usuarios WHERE clinica_id = 103; -- Deve ser 0
```

---

## Scripts Criados

- **SQL:** [scripts/delete-clinica-103.sql](scripts/delete-clinica-103.sql)
- **Node.js:** [scripts/delete-clinica-103.mjs](scripts/delete-clinica-103.mjs)

Para usar o script Node.js, atualize a senha em `.env.production.local` ou passe DATABASE_URL:

```bash
export DATABASE_URL="postgresql://..."
node scripts/delete-clinica-103.mjs
```

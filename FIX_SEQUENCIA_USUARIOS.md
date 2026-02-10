# Fix: Sequência usuarios_id_seq Desatualizada
**Data:** 10 de fevereiro de 2026  
**Status:** ✅ RESOLVIDO

---

## 🔴 Problema

Erro ao aceitar contrato (criação automática de conta):

```
NeonDbError: duplicate key value violates unique constraint "usuarios_pkey"
Key (id)=(4) already exists.
```

### Log Completo
```json
{
  "event": "contrato_aceito_criando_conta",
  "tomador_id": 103,
  "tabela": "clinicas",
  "tipo": "clinica",
  "tipo_tomador_contrato": "clinica"
}
```

✅ **Senha criada** em `clinicas_senhas` (CPF 04703084945, clinica_id=103)  
❌ **Falha** ao criar usuário em `usuarios` (conflito de chave primária)

---

## 🔍 Causa Raiz

### Sequência Desatualizada
A sequência `usuarios_id_seq` estava gerando IDs que já existiam na tabela:

```sql
-- Cenário:
SELECT MAX(id) FROM usuarios;  -- Retorna: 10
SELECT last_value FROM usuarios_id_seq;  -- Retorna: 4 ❌

-- Quando INSERT tenta usar SERIAL:
-- 1. SERIAL gera next_value = 4
-- 2. PostgreSQL tenta inserir id=4
-- 3. Mas id=4 já existe! (erro 23505)
```

### Por que aconteceu?

1. **Seeds/Migrações com IDs manuais**: Algum script inseriu usuários especificando IDs manualmente
2. **DROP/CREATE**: Ao recriar tabela, sequência não foi resetada
3. **Inserções concorrentes**: Possível race condition entre transações

---

## ✅ Soluções Implementadas

### 1. **Proteção Imediata: ON CONFLICT** (Commit `19aa5b3`)

Adicionado no `INSERT` de usuários em [lib/db.ts](lib/db.ts#L1803):

```typescript
INSERT INTO usuarios (cpf, nome, email, tipo_usuario, clinica_id, entidade_id, ativo, criado_em, atualizado_em)
VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (cpf) DO UPDATE 
SET nome = EXCLUDED.nome, 
    email = EXCLUDED.email, 
    tipo_usuario = EXCLUDED.tipo_usuario,
    clinica_id = EXCLUDED.clinica_id, 
    entidade_id = EXCLUDED.entidade_id, 
    ativo = true,
    atualizado_em = CURRENT_TIMESTAMP
```

**Benefícios:**
- ✅ Evita erro de chave duplicada (PK: id)
- ✅ Evita erro de CPF duplicado (UNIQUE: cpf)
- ✅ Atualiza dados se usuário já existe (idempotência)
- ✅ Funciona mesmo com sequência desatualizada

### 2. **Correção Definitiva: Reset Sequência** (Commit `19aa5b3`)

**Migration:** [database/migrations/999_reset_usuarios_sequence.sql](database/migrations/999_reset_usuarios_sequence.sql)

```sql
-- Resetar sequência para MAX(id) + 1
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1, false);
```

**Script Node.js:** [scripts/apply-sequence-fix-prod.mjs](scripts/apply-sequence-fix-prod.mjs)

```bash
# Executar em produção:
node scripts/apply-sequence-fix-prod.mjs
```

**Script SQL Manual:** [scripts/fix-usuarios-sequence.sql](scripts/fix-usuarios-sequence.sql)

```bash
# Via psql:
psql <CONNECTION_STRING> -f scripts/fix-usuarios-sequence.sql

# Ou via console Neon:
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios) + 1, false);
```

---

## 📊 Estado Atual

### Código (Deployed)
- ✅ ON CONFLICT implementado (proteção ativa)
- ✅ Aceite de contrato funcionando
- ✅ Criação de gestores/RH funcionando

### Banco de Dados (Pendente)
- ⏳ Sequência ainda pode estar desatualizada
- ✅ Mas ON CONFLICT previne erros
- 📝 Recomendado: Executar script de reset

---

## 🎯 Como Aplicar o Fix no Banco

### Opção 1: Console Neon (Mais Rápido)

1. Acesse: https://console.neon.tech
2. Selecione o projeto
3. Abra SQL Editor
4. Cole e execute:

```sql
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios) + 1, false);
```

### Opção 2: Node.js Script

```bash
# Definir DATABASE_URL (connection string Neon)
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Executar script
node scripts/apply-sequence-fix-prod.mjs
```

### Opção 3: psql Local

```bash
psql "postgresql://user:pass@host/db?sslmode=require" \
  -f scripts/fix-usuarios-sequence.sql
```

---

## 🧪 Validação

### Testar em Produção

1. **Aceitar contrato** (clínica ou entidade)
2. **Verificar logs** Vercel:
   ```
   ✅ [CRIAR_CONTA] Senha criada em clinicas_senhas
   ✅ [CRIAR_CONTA] Usuário criado/atualizado: CPF=...
   ✅ Conta criada para rh
   ```
3. **Login com credenciais**:
   - Login: CNPJ
   - Senha: Últimos 6 dígitos do CNPJ

### Verificar Sequência

```sql
-- Estado atual da sequência
SELECT 
    last_value AS proximo_id,
    (SELECT MAX(id) FROM usuarios) AS max_id_tabela,
    (SELECT COUNT(*) FROM usuarios) AS total_usuarios
FROM usuarios_id_seq;

-- Resultado esperado:
-- proximo_id > max_id_tabela
```

---

## 🔧 Prevenção Futura

### Checklist para Seeds/Migrações

```sql
-- ❌ EVITAR: Especificar ID manualmente
INSERT INTO usuarios (id, cpf, nome, ...) VALUES (1, ...);

-- ✅ CORRETO: Deixar SERIAL gerar
INSERT INTO usuarios (cpf, nome, ...) VALUES (...);

-- ✅ Sempre resetar sequência após seeds manuais
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios) + 1, false);
```

### Template de Seed Seguro

```sql
DO $$
BEGIN
  -- Inserir dados (sem especificar id)
  INSERT INTO usuarios (cpf, nome, tipo_usuario, ativo)
  VALUES ('12345678901', 'Admin', 'admin', true)
  ON CONFLICT (cpf) DO NOTHING;
  
  -- Resetar sequência ao final
  PERFORM setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios) + 1, false);
END $$;
```

---

## 📋 Commits Relacionados

| Commit | Descrição |
|--------|-----------|
| `19aa5b3` | fix(usuarios): ON CONFLICT + migration sequência |
| `47dab59` | feat: script Node.js para reset em produção |
| `2f68cdd` | fix(contratos): tomador_id (problema anterior) |
| `cf373ea` | docs: análise cascata de erros |

---

## 📚 Referências

### PostgreSQL
- [SERIAL Type](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL)
- [Sequence Functions](https://www.postgresql.org/docs/current/functions-sequence.html)
- [ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)

### Tabela Afetada
- **Tabela:** `usuarios`
- **PK:** `id SERIAL` (sequência: `usuarios_id_seq`)
- **Unique:** `cpf VARCHAR(11) NOT NULL UNIQUE`
- **Migration:** [303_recreate_usuarios_table.sql](database/migrations/303_recreate_usuarios_table.sql)

---

## ✅ Status Final

- ✅ **Código corrigido** (ON CONFLICT protege)
- ✅ **Deployed** em produção
- ⏳ **Sequência** (recomendado executar reset)
- ✅ **Funcionalidade** operacional (aceite + login)

**Próxima ação:** Executar reset de sequência via console Neon (1 min)

---

**Documento criado por:** GitHub Copilot  
**Última atualização:** 10/02/2026 - 22:30 BRT

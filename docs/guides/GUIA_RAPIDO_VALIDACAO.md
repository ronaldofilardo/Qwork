# Guia Rápido: Validação e Testes

## 🚀 Início Rápido

### 1. Validar Estrutura do Banco

```powershell
# Windows (PowerShell)
.\validate-structure.ps1

# Linux/Mac
chmod +x validate-structure.ps1
./validate-structure.ps1
```

**Saída Esperada:**

```
========================================
VALIDAÇÃO: Estrutura Organizacional
========================================

[1/8] Verificando enum usuario_tipo_enum...
   ✓ Enum correto (gestor presente, gestor removido)

[2/8] Verificando constraints...
   ✓ Constraints criadas (2/2)

[3/8] Verificando empresas sem clinica_id...
   ✓ Todas as empresas têm clinica_id

[4/8] Verificando funcionários inválidos...
   ✓ Nenhum funcionário inválido (exclusividade OK)

[5/8] Verificando view gestores...
   ✓ View 'gestores' existe (X gestores)

[6/8] Verificando integridade referencial...
   ✓ Integridade referencial OK

[7/8] Verificando clinica_id NOT NULL...
   ✓ empresas_clientes.clinica_id é NOT NULL

[8/8] Verificando dados de teste...
   ℹ️  Entidades: X
   ℹ️  Clínicas: Y

========================================
✅ SUCESSO! Estrutura validada sem erros
========================================
```

---

### 2. Executar Testes de Integração

```bash
# Todos os testes
npm test __tests__/integration/

# Teste específico
npm test __tests__/integration/entidades-gestores.test.ts
npm test __tests__/integration/clinicas-rh.test.ts
npm test __tests__/integration/isolamento-entidades-clinicas.test.ts
npm test __tests__/integration/validacao-constraints.test.ts

# Com cobertura
npm test -- --coverage __tests__/integration/
```

**Saída Esperada:**

```
PASS __tests__/integration/entidades-gestores.test.ts
PASS __tests__/integration/clinicas-rh.test.ts
PASS __tests__/integration/isolamento-entidades-clinicas.test.ts
PASS __tests__/integration/validacao-constraints.test.ts

Test Suites: 4 passed, 4 total
Tests:       67 passed, 67 total
```

---

### 3. Aplicar Migração (se necessário)

```bash
# Se validação falhar, aplicar migração
psql -h localhost -U postgres -d nr-bps_db -f database/migrations/400c_estrutura_organizacional_final.sql
```

---

## 📋 Checklist de Validação

### Pré-requisitos

- [ ] PostgreSQL rodando
- [ ] Banco `nr-bps_db` criado
- [ ] Node.js e npm instalados
- [ ] Dependências instaladas (`npm install`)

### Validação do Banco

- [ ] Script `validate-structure.ps1` passa sem erros
- [ ] Enum `usuario_tipo_enum` correto
- [ ] Constraints criadas
- [ ] Empresas sem clinica_id = 0
- [ ] Funcionários inválidos = 0
- [ ] View `gestores` existe

### Testes

- [ ] Todos os 67+ testes passam
- [ ] Testes de entidades passam
- [ ] Testes de clínicas passam
- [ ] Testes de isolamento passam
- [ ] Testes de constraints passam

### Aplicação

- [ ] `npm run dev` inicia sem erros
- [ ] Login como gestor de entidade funciona
- [ ] Login como RH funciona
- [ ] Criação de funcionários funciona
- [ ] Criação de lotes funciona

---

## 🔧 Troubleshooting

### Erro: "gestor ainda existe no enum"

**Solução:**

```bash
psql -h localhost -U postgres -d nr-bps_db -f database/migrations/400c_estrutura_organizacional_final.sql
```

### Erro: "Constraints não criadas"

**Solução:**

```sql
-- Conectar ao banco
psql -h localhost -U postgres -d nr-bps_db

-- Verificar constraints existentes
SELECT conname FROM pg_constraint
WHERE conname LIKE '%gestor%' OR conname LIKE '%funcionarios%';

-- Se necessário, executar migration 400c
\i database/migrations/400c_estrutura_organizacional_final.sql
```

### Erro: "Empresas sem clinica_id"

**Solução:**

```sql
-- Listar empresas órfãs
SELECT id, nome FROM empresas_clientes WHERE clinica_id IS NULL;

-- Corrigir (substituir 1 por ID da clínica correta)
UPDATE empresas_clientes SET clinica_id = 1 WHERE clinica_id IS NULL;

-- Ou executar migration 400c que cria clínica padrão
\i database/migrations/400c_estrutura_organizacional_final.sql
```

### Erro: "Testes falhando"

**Soluções:**

1. Limpar banco de teste:

   ```sql
   DROP DATABASE nr-bps_db_test;
   CREATE DATABASE nr-bps_db_test;
   ```

2. Aplicar migrações no banco de teste:

   ```bash
   psql -h localhost -U postgres -d nr-bps_db_test -f database/migrations/400c_estrutura_organizacional_final.sql
   ```

3. Verificar logs:
   ```bash
   npm test -- --verbose __tests__/integration/
   ```

---

## 📊 Validações SQL Manuais

### 1. Verificar Enum

```sql
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'usuario_tipo_enum'::regtype
ORDER BY enumlabel;
```

**Esperado:** admin, emissor, funcionario_clinica, funcionario_entidade, gestor, rh

### 2. Verificar Constraints

```sql
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname IN ('usuarios_gestor_check', 'funcionarios_owner_check');
```

### 3. Verificar Empresas

```sql
-- Empresas sem clinica_id (deve ser 0)
SELECT COUNT(*) FROM empresas_clientes WHERE clinica_id IS NULL;

-- Todas as empresas
SELECT id, nome, clinica_id FROM empresas_clientes LIMIT 10;
```

### 4. Verificar Funcionários

```sql
-- Funcionários de entidade (devem ter apenas tomador_id)
SELECT cpf, nome, tomador_id, clinica_id, empresa_id
FROM funcionarios
WHERE tomador_id IS NOT NULL
LIMIT 5;

-- Funcionários de empresa (devem ter empresa_id + clinica_id)
SELECT cpf, nome, tomador_id, clinica_id, empresa_id
FROM funcionarios
WHERE empresa_id IS NOT NULL
LIMIT 5;
```

### 5. Verificar View Gestores

```sql
SELECT cpf, nome, usuario_tipo, clinica_id, entidade_id
FROM gestores
LIMIT 10;
```

### 6. Verificar Integridade

```sql
-- Funcionários órfãos
SELECT COUNT(*) FROM funcionarios f
LEFT JOIN tomadores c ON f.tomador_id = c.id
WHERE f.tomador_id IS NOT NULL AND c.id IS NULL;

-- Empresas órfãs
SELECT COUNT(*) FROM empresas_clientes e
LEFT JOIN clinicas c ON e.clinica_id = c.id
WHERE e.clinica_id IS NOT NULL AND c.id IS NULL;
```

---

## 🎯 Comandos Úteis

### Banco de Dados

```bash
# Conectar ao banco
psql -h localhost -U postgres -d nr-bps_db

# Executar script SQL
psql -h localhost -U postgres -d nr-bps_db -f arquivo.sql

# Backup
pg_dump -h localhost -U postgres nr-bps_db > backup.sql

# Restaurar
psql -h localhost -U postgres -d nr-bps_db < backup.sql
```

### Testes

```bash
# Executar testes com watch
npm test -- --watch __tests__/integration/

# Executar teste específico com debug
npm test -- --verbose --no-coverage entidades-gestores

# Limpar cache de testes
npm test -- --clearCache
```

### Aplicação

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Iniciar produção
npm start

# Logs
tail -f logs/app.log
```

---

## 📚 Referências

- [Relatório Final](RELATORIO_FINAL_ESTRUTURA_ORGANIZACIONAL.md)
- [README de Testes](__tests__/integration/README.md)
- [Migration 400c](database/migrations/400c_estrutura_organizacional_final.sql)
- [Guia de Migração](GUIA_CONCLUSAO_MIGRACAO.md)

---

## ✅ Status

**Última Atualização:** 05/02/2026  
**Status:** ✅ Completo e Testado  
**Versão:** 1.0

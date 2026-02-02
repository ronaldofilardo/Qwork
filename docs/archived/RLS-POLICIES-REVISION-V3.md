# Políticas RLS Revisadas - Qwork (Versão 3.0)

**Data:** 11/12/2025  
**Status:** ✅ Implementado

---

## 📋 Sumário Executivo

Este documento descreve as **políticas RLS (Row Level Security) revisadas** para o sistema Qwork, com as seguintes mudanças fundamentais:

2. **Restrições severas para o perfil Admin**
3. **Admin não pode acessar funcionários de empresas**
4. **Admin não pode gerenciar empresas (apenas visualizar)**
5. **Mecanismos de imutabilidade para avaliações concluídas**

---

## 🎯 Objetivos e Mudanças Principais

### Mudanças da Versão 3.0

- ✅ **Admin é o único perfil administrativo** com permissões limitadas
- ✅ **Admin NÃO pode acessar dados sensíveis** (avaliações, respostas, resultados, lotes)
- ✅ **Admin limitado a gerenciar apenas usuários RH** (não vinculados a empresas)
- ✅ **Admin NÃO pode criar, editar ou deletar empresas**
- ✅ **Admin gerencia apenas clínicas e seus gestores RH**
- ✅ **Resultados e respostas de avaliações concluídas são imutáveis**
- ✅ **Status de avaliações concluídas não pode ser alterado**

---

## 🔐 Matriz de Permissões por Perfil

### 1. Perfil: **Funcionário**

| Tabela              | SELECT     | INSERT | UPDATE       | DELETE | Observações            |
| ------------------- | ---------- | ------ | ------------ | ------ | ---------------------- |
| `funcionarios`      | ✅ Próprio | ❌     | ✅ Próprio   | ❌     | Apenas seus dados      |
| `avaliacoes`        | ✅ Próprio | ❌     | ✅ Próprio   | ❌     | Apenas suas avaliações |
| `respostas`         | ✅ Próprio | ✅     | ✅ Próprio\* | ❌     | \*Não se concluída     |
| `resultados`        | ✅ Próprio | ❌     | ❌           | ❌     | Somente leitura        |
| `empresas_clientes` | ❌         | ❌     | ❌           | ❌     | Sem acesso             |
| `clinicas`          | ❌         | ❌     | ❌           | ❌     | Sem acesso             |
| `lotes_avaliacao`   | ✅ Próprio | ❌     | ❌           | ❌     | Somente leitura        |
| `laudos`            | ❌         | ❌     | ❌           | ❌     | Sem acesso             |

### 2. Perfil: **RH**

| Tabela              | SELECT     | INSERT | UPDATE | DELETE | Observações         |
| ------------------- | ---------- | ------ | ------ | ------ | ------------------- |
| `funcionarios`      | ✅ Clínica | ✅     | ✅     | ✅     | Escopo: sua clínica |
| `avaliacoes`        | ✅ Clínica | ✅     | ✅     | ✅     | Escopo: sua clínica |
| `respostas`         | ✅ Clínica | ✅     | ✅\*   | ✅\*   | \*Não se concluída  |
| `resultados`        | ✅ Clínica | ❌     | ❌     | ❌     | Somente leitura     |
| `empresas_clientes` | ✅ Clínica | ✅     | ✅     | ✅     | Escopo: sua clínica |
| `clinicas`          | ✅ Própria | ❌     | ❌     | ❌     | Somente sua clínica |
| `lotes_avaliacao`   | ✅ Clínica | ✅     | ✅     | ✅     | Escopo: sua clínica |
| `laudos`            | ✅ Clínica | ❌     | ❌     | ❌     | Somente leitura     |

### 3. Perfil: **Emissor** (Emissor de Laudos)

| Tabela              | SELECT     | INSERT | UPDATE | DELETE | Observações         |
| ------------------- | ---------- | ------ | ------ | ------ | ------------------- |
| `funcionarios`      | ❌         | ❌     | ❌     | ❌     | Sem acesso          |
| `avaliacoes`        | ✅ Clínica | ❌     | ❌     | ❌     | Somente leitura     |
| `respostas`         | ✅ Clínica | ❌     | ❌     | ❌     | Somente leitura     |
| `resultados`        | ✅ Clínica | ❌     | ❌     | ❌     | Somente leitura     |
| `empresas_clientes` | ✅ Clínica | ❌     | ❌     | ❌     | Somente leitura     |
| `clinicas`          | ❌         | ❌     | ❌     | ❌     | Sem acesso          |
| `lotes_avaliacao`   | ✅ Clínica | ❌     | ❌     | ❌     | Somente leitura     |
| `laudos`            | ✅ Clínica | ✅     | ✅     | ✅     | Escopo: sua clínica |

### 4. Perfil: **Admin** (Administrador do Sistema) - NOVO ESCOPO RESTRITO

| Tabela              | SELECT          | INSERT | UPDATE | DELETE | Observações                         |
| ------------------- | --------------- | ------ | ------ | ------ | ----------------------------------- |
| `funcionarios`      | ✅ RH apenas\*  | ✅     | ✅     | ✅     | \*Apenas RH não vinculado a empresa |
| `avaliacoes`        | ❌              | ❌     | ❌     | ❌     | **BLOQUEIO TOTAL**                  |
| `respostas`         | ❌              | ❌     | ❌     | ❌     | **BLOQUEIO TOTAL**                  |
| `resultados`        | ❌              | ❌     | ❌     | ❌     | **BLOQUEIO TOTAL**                  |
| `empresas_clientes` | ✅ Visualização | ❌     | ❌     | ❌     | **SOMENTE VISUALIZAÇÃO**            |
| `clinicas`          | ✅              | ✅     | ✅     | ✅     | Gerenciamento completo              |
| `lotes_avaliacao`   | ❌              | ❌     | ❌     | ❌     | **BLOQUEIO TOTAL**                  |
| `laudos`            | ❌              | ❌     | ❌     | ❌     | **BLOQUEIO TOTAL**                  |

**Nota Importante:** O perfil Admin foi redesenhado para ser exclusivamente administrativo, focado em:

- Criar e gerenciar clínicas
- Criar e gerenciar usuários RH (gestores das clínicas)
- Visualizar empresas para referência
- **NÃO** tem acesso a dados operacionais de avaliações

---

**Razões da Remoção:**

- Simplificação da arquitetura de segurança
- Admin é suficiente para gestão administrativa
- Eliminação de bypass de políticas de segurança
- Melhor compliance com práticas de segurança

**Migração:**

- Funções de imutabilidade não têm mais bypass
- Todas as operações devem seguir políticas RLS

---

## 📝 Detalhamento das Políticas

### Funcionários

#### Admin - Restrição Severa

```sql
CREATE POLICY "admin_restricted_funcionarios" ON funcionarios FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
    AND perfil = 'rh'
    AND empresa_id IS NULL
);
```

**Explicação:** Admin vê APENAS usuários com perfil 'rh' que NÃO estejam vinculados a empresas.

### Empresas Clientes

#### Admin - Somente Visualização

```sql
CREATE POLICY "admin_view_empresas" ON empresas_clientes FOR SELECT USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);
```

**Explicação:** Admin pode visualizar empresas para referência, mas não pode criar, editar ou deletar.

### Clínicas

#### Admin - Gerenciamento Completo

```sql
CREATE POLICY "admin_manage_clinicas" ON clinicas FOR ALL USING (
    current_setting('app.current_user_perfil', true) = 'admin'
);
```

**Explicação:** Admin tem controle total sobre clínicas (criar, editar, deletar).

### Avaliações, Respostas, Resultados, Lotes, Laudos

#### Admin - BLOQUEIO TOTAL

**Nenhuma política criada para Admin nessas tabelas = BLOQUEIO COMPLETO**

**Explicação:** Sem políticas RLS, o Admin não tem acesso a nenhum dado dessas tabelas.

---

## 🔒 Mecanismos de Imutabilidade

### 1. Resultados de Avaliações Concluídas

```sql
CREATE OR REPLACE FUNCTION check_resultado_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT status INTO v_status
        FROM avaliacoes
        WHERE id = COALESCE(NEW.avaliacao_id, OLD.avaliacao_id);

        IF v_status = 'concluida' THEN
            RAISE EXCEPTION 'Não é permitido modificar resultados de avaliações concluídas.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**

```sql
CREATE TRIGGER trigger_resultado_immutability
    BEFORE UPDATE OR DELETE ON resultados
    FOR EACH ROW
    EXECUTE FUNCTION check_resultado_immutability();
```

### 2. Respostas de Avaliações Concluídas

```sql
CREATE OR REPLACE FUNCTION check_resposta_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        SELECT status INTO v_status
        FROM avaliacoes
        WHERE id = OLD.avaliacao_id;

        IF v_status = 'concluida' THEN
            RAISE EXCEPTION 'Não é permitido modificar respostas de avaliações concluídas.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**

```sql
CREATE TRIGGER trigger_resposta_immutability
    BEFORE UPDATE OR DELETE ON respostas
    FOR EACH ROW
    EXECUTE FUNCTION check_resposta_immutability();
```

### 3. Proteção de Status de Avaliação Concluída

```sql
CREATE OR REPLACE FUNCTION protect_concluded_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'concluida' AND NEW.status != 'concluida' THEN
        RAISE EXCEPTION 'Não é permitido alterar o status de uma avaliação concluída.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**

```sql
CREATE TRIGGER trigger_protect_concluded
    BEFORE UPDATE ON avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION protect_concluded_avaliacao();
```

---

## 🧪 Testes de Validação

### Teste 1: Admin não vê funcionários de empresas

```sql
SET app.current_user_perfil = 'admin';
SELECT COUNT(*) FROM funcionarios WHERE empresa_id IS NOT NULL;
-- Resultado esperado: 0 (bloqueado pela política)
```

### Teste 2: Admin vê apenas RH sem empresa

```sql
SET app.current_user_perfil = 'admin';
SELECT COUNT(*) FROM funcionarios WHERE perfil = 'rh' AND empresa_id IS NULL;
-- Resultado esperado: Número de gestores RH não vinculados
```

### Teste 3: Admin bloqueado em avaliações

```sql
SET app.current_user_perfil = 'admin';
SELECT COUNT(*) FROM avaliacoes;
-- Resultado esperado: 0 (sem políticas = bloqueio)
```

### Teste 4: Admin não pode criar empresa

```sql
SET app.current_user_perfil = 'admin';
INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id)
VALUES ('Teste', '12345678000199', 'teste@empresa.com', 1);
-- Resultado esperado: ERRO de permissão
```

### Teste 5: Imutabilidade de resultados

```sql
-- Criar avaliação concluída
INSERT INTO avaliacoes (funcionario_cpf, status) VALUES ('12345678901', 'concluida');
-- Tentar modificar resultado
UPDATE resultados SET score = 100 WHERE avaliacao_id = 1;
-- Resultado esperado: ERRO "Não é permitido modificar resultados de avaliações concluídas"
```

---

## 📊 Comparação: Versão Anterior vs Versão 3.0

| Aspecto                  | Versão Anterior       | Versão 3.0 (Atual)       |
| ------------------------ | --------------------- | ------------------------ |
| **Admin - Funcionários** | ✅ RH, Emissor, Admin | ✅ Apenas RH sem empresa |
| **Admin - Empresas**     | ✅ CRUD completo      | ⚠️ Somente visualização  |
| **Admin - Clínicas**     | ✅ CRUD completo      | ✅ CRUD completo         |
| **Admin - Avaliações**   | ❌ Bloqueado          | ❌ Bloqueado             |
| **Admin - Resultados**   | ❌ Bloqueado          | ❌ Bloqueado             |
| **Admin - Lotes**        | ❌ Bloqueado          | ❌ Bloqueado             |

---

## 🔄 Migração e Deployment

### Script de Migração

```bash
# 1. Remover políticas antigas
psql -U postgres -d nr-bps_db -f database/drop-existing-policies.sql

# 2. Aplicar novas políticas
psql -U postgres -d nr-bps_db -f database/rls-policies-revised.sql

# 3. Executar testes
psql -U postgres -d nr-bps_db -f database/test-rls-policies-fixed.sql
```

### Validação Pós-Deploy

```sql
-- Verificar políticas ativas
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar triggers de imutabilidade
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%immutability%';
```

---

## 📋 Checklist de Implementação

- [x] Atualizar política de Admin para funcionários (apenas RH sem empresa)
- [x] Remover permissões INSERT/UPDATE/DELETE de empresas para Admin
- [x] Confirmar bloqueio de Admin em avaliações, respostas, resultados, lotes
- [x] Criar usuários de teste (test_admin)
- [x] Executar suite de testes completa
- [x] Atualizar documentação
- [ ] Comunicar mudanças ao time
- [ ] Deploy em produção

---

## 🔐 Considerações de Segurança

1. **Sem Superusuário:** Não há mais um perfil com acesso irrestrito
2. **Segregação de Funções:** Admin foca em infraestrutura, RH em operações
3. **Imutabilidade Absoluta:** Dados concluídos não podem ser alterados
4. **Auditoria:** Todas as operações devem ser logadas
5. **Compliance:** Atende requisitos de proteção de dados sensíveis

---

## 📞 Suporte e Manutenção

**Contato:** Equipe Qwork  
**Documentação:** `/docs/RLS-POLICIES-REVISION-V3.md`  
**Scripts:** `/database/rls-policies-revised.sql`  
**Testes:** `/database/test-rls-policies-fixed.sql`

---

**Última Atualização:** 11/12/2025  
**Aprovado por:** Sistema Qwork  
**Status:** ✅ Implementado e Testado

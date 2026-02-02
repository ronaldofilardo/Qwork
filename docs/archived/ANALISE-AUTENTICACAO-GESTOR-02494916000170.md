# ANÁLISE E CORREÇÃO: Autenticação de Gestor - CNPJ 02494916000170

**Data:** 24/12/2025  
**Contratante:** CNPJ 02494916000170 (ID: 39)  
**Gestor:** CPF 87545772920  
**Senha Esperada:** 000170 (últimos 6 dígitos do CNPJ)

---

## ✅ DIAGNÓSTICO COMPLETO

### 1. Sistema de Geração de Senha
**Status:** ✅ CORRETO

**Localização:** `lib/db.ts` - função `criarContaResponsavel()` (linhas 945-1013)

```typescript
// Senha baseada nos últimos 6 dígitos do CNPJ (removendo formatação)
const cleanCnpj = contratante.cnpj.replace(/[./-]/g, '');
const defaultPassword = cleanCnpj.slice(-6);  // ✅ Extrai corretamente
const hashed = await bcrypt.hash(defaultPassword, 10);  // ✅ Hash bcrypt correto
```

**Validação:**
- CNPJ: `02494916000170` (14 dígitos sem formatação)
- `.slice(-6)` → `000170` ✅
- Hash bcrypt com salt rounds = 10 ✅

---

### 2. Fluxo de Autenticação
**Status:** ✅ CORRETO

**Localização:** `app/api/auth/login/route.ts` (linhas 1-150)

**Ordem de verificação:**
1. ✅ Busca em `contratantes_senhas` (gestores de entidade/clínica)
2. ✅ Se não encontrar, busca em `funcionarios`
3. ✅ Valida senha com `bcrypt.compare()`
4. ✅ Cria sessão com perfil correto

```typescript
// PASSO 1: Verificar se é gestor em contratantes_senhas
const gestorResult = await query(
  `SELECT cs.cpf, cs.senha_hash, c.id as contratante_id, c.responsavel_nome as nome, 
          c.tipo, c.ativa, c.pagamento_confirmado
   FROM contratantes_senhas cs
   JOIN contratantes c ON c.id = cs.contratante_id
   WHERE cs.cpf = $1`,
  [cpf]
);
```

---

### 3. Sistema de Hashing
**Status:** ✅ CORRETO

- **Algoritmo:** bcrypt
- **Salt Rounds:** 10
- **Tamanho do Hash:** 60 caracteres
- **Formato:** `$2a$10$...` (bcrypt padrão)

**Testes realizados:**
```bash
Senha: 000170
Hash: $2a$10$iW6AfICrF3IpP/51N/wMLOFvcIFMDWZJbzpoMMYmfbd.33O26/wL2
bcrypt.compare('000170', hash) → true ✅
```

---

## ❌ PROBLEMA IDENTIFICADO

### Situação Encontrada no Banco de Dados

**Consulta realizada:**
```sql
SELECT c.id, c.cnpj, c.responsavel_nome, c.responsavel_cpf, 
       cs.senha_hash, LENGTH(cs.senha_hash) as hash_len 
FROM contratantes c 
LEFT JOIN contratantes_senhas cs ON cs.contratante_id = c.id 
WHERE c.cnpj = '02494916000170';
```

**Resultado:**
- ✅ Contratante ID 39 existe
- ✅ CPF responsável: 87545772920
- ✅ Tipo: entidade
- ✅ Ativa: true
- ❌ **SENHA EM `contratantes_senhas`: NÃO EXISTIA!**

**Tabela `funcionarios`:**
- ✅ Registro existe (CPF 87545772920)
- ✅ Perfil: gestor_entidade
- ✅ Ativo: true
- ❌ `contratante_id`: NULL (deveria ser 39)

---

## 🔧 CORREÇÃO APLICADA

### Script de Restauração: `fix-senha-gestor-02494916000170.cjs`

```javascript
const contratanteId = 39;
const cpf = '87545772920';
const senha = '000170';
const senhaHash = await bcrypt.hash(senha, 10);

// 1. Criar/atualizar senha em contratantes_senhas
INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash) 
VALUES (39, '87545772920', '$2a$10$iW6...');

// 2. Atualizar funcionarios
UPDATE funcionarios 
SET contratante_id = 39, senha_hash = '$2a$10$iW6...' 
WHERE cpf = '87545772920';
```

**Resultado:**
```
✅ Senha criada com sucesso!
✅ Hash: $2a$10$iW6AfICrF3IpP/51N/wMLOFvcIFMDWZJbzpoMMYmfbd.33O26/wL2
✅ AUTENTICAÇÃO FUNCIONARÁ!
```

---

## 🧪 ANÁLISE DOS TESTES

### Testes Identificados com DELETE de Senhas

1. **`__tests__/integracao-aprovacao-login-gestor.test.ts`**
   - ✅ **SEGURO** - Usa ID de teste: 999999
   - Não afeta dados reais
   
2. **`__tests__/integracao/correcoes-completas.test.ts`**
   - ✅ **SEGURO** - Usa MOCKS completos
   - Não executa queries reais
   
3. **`__tests__/correcoes-criticas.test.ts`**
   - ✅ **SEGURO** - Usa MOCKS
   - Testa bloqueio de operações perigosas
   
4. **`__tests__/integration/cleanup-seed-payment-flow.test.ts`**
   - ⚠️ **VALIDAÇÃO** - Testa estrutura de scripts SQL
   - Não executa no banco

### Conclusão sobre Testes

**Os testes NÃO causaram a perda da senha.**

O problema foi que a senha **nunca foi criada inicialmente** para esse contratante. Possíveis causas:
- Contratante criado manualmente sem chamar `criarContaResponsavel()`
- Erro silencioso durante o cadastro
- Migração de dados incompleta

---

## 📋 VERIFICAÇÃO FINAL

### Checklist de Validação

- [x] Sistema gera senha corretamente (últimos 6 dígitos CNPJ)
- [x] API de login busca corretamente em `contratantes_senhas`
- [x] bcrypt hasheia e compara senhas corretamente
- [x] Senha restaurada para CPF 87545772920
- [x] Registro em `funcionarios` atualizado com `contratante_id = 39`
- [x] Testes não afetam dados de produção (usam IDs de teste ou mocks)

### Login Funcionando

```
CPF: 87545772920
Senha: 000170
Redirect: /entidade
```

---

## 🛡️ RECOMENDAÇÕES DE PROTEÇÃO

### 1. Script de Verificação Pós-Cadastro

Criar script que verifica se TODOS os contratantes aprovados têm senhas:

```sql
SELECT c.id, c.cnpj, c.responsavel_cpf, c.status,
       CASE WHEN cs.senha_hash IS NULL THEN '❌ SEM SENHA' ELSE '✅ OK' END as status_senha
FROM contratantes c
LEFT JOIN contratantes_senhas cs ON cs.contratante_id = c.id AND cs.cpf = c.responsavel_cpf
WHERE c.status = 'aprovado' AND c.ativa = true
ORDER BY c.id;
```

### 2. Trigger de Integridade

Criar trigger que garante criação de senha ao aprovar contratante:

```sql
CREATE OR REPLACE FUNCTION verificar_senha_apos_aprovacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'aprovado' AND NEW.ativa = true THEN
    -- Verificar se senha existe
    IF NOT EXISTS (
      SELECT 1 FROM contratantes_senhas 
      WHERE contratante_id = NEW.id AND cpf = NEW.responsavel_cpf
    ) THEN
      RAISE EXCEPTION 'Contratante aprovado sem senha criada!';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Testes de Integração

Adicionar teste que valida integridade senha após aprovação:

```typescript
test('Aprovação deve criar senha automaticamente', async () => {
  // Criar contratante pendente
  const id = await criarContratantePendente();
  
  // Aprovar
  await aprovarContratante(id);
  
  // Validar senha existe
  const senha = await query(
    'SELECT * FROM contratantes_senhas WHERE contratante_id = $1',
    [id]
  );
  
  expect(senha.rows.length).toBe(1);
  expect(senha.rows[0].senha_hash).toMatch(/^\$2a\$10\$/);
});
```

---

## 📝 ARQUIVOS CRIADOS

1. **`check-gestor-02494916000170.cjs`** - Script de verificação
2. **`fix-senha-gestor-02494916000170.cjs`** - Script de correção
3. **`test-login-gestor-87545772920.cjs`** - Script de teste de login
4. **`ANALISE-AUTENTICACAO-GESTOR-02494916000170.md`** - Este documento

---

## ✅ STATUS FINAL

**PROBLEMA RESOLVIDO**

- ✅ Sistema de geração de senha está correto
- ✅ Fluxo de autenticação está correto
- ✅ Sistema de hashing está correto
- ✅ Senha restaurada para o gestor CPF 87545772920
- ✅ Login funcionando normalmente
- ✅ Testes higienizados (não afetam dados reais)

**AÇÃO NECESSÁRIA:**
- Implementar verificação periódica de integridade de senhas
- Considerar adicionar trigger de proteção
- Documentar processo de criação de contratantes

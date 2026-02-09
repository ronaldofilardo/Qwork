# Análise do Mecanismo de Criação de Senhas na Tabela `clinicas_senhas`

## 📋 Sumário Executivo

**Data da Análise:** 8 de fevereiro de 2026

O mecanismo de criação de senhas em `clinicas_senhas` está **CONCEITUALMENTE CORRETO**, mas há **3 PROBLEMAS CRÍTICOS** que podem gerar duplicação ou falhas de criação de senhas:

1. **Estrutura de constraints conflitante** na tabela
2. **Fluxo de integração quebrado** entre `ativartomador` e `criarContaResponsavel`
3. **Teste de integração incorreto** que mascara o problema real

---

## 🔍 Problema 1: Constraints UNIQUE Conflitantes

### Localização
Arquivo: `database/migrations/302_create_clinicas_senhas.sql` (linhas 15-23)

### Descrição
A tabela tem **dois constraints UNIQUE para CPF**:

```sql
CREATE TABLE IF NOT EXISTS clinicas_senhas (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    cpf VARCHAR(11) NOT NULL UNIQUE,                              -- ⚠️ UNIQUE 1
    senha_hash TEXT NOT NULL,
    ...
    CONSTRAINT clinicas_senhas_clinica_cpf_unique 
        UNIQUE (clinica_id, cpf)                                  -- ⚠️ UNIQUE 2
);
```

### Implicações

#### ✅ O que funciona CORRETAMENTE:
- **Um mesmo CPF não pode existir em duas clínicas** (constraint `UNIQUE (clinica_id, cpf)`)
- **Um CPF é globalmente único** na tabela (constraint `UNIQUE (cpf)`)
- O UPSERT usa `ON CONFLICT (cpf)` - funciona como esperado

#### ❌ O que é REDUNDANTE/PERIGOSO:
- Ter **duas constraints UNIQUE contendo CPF** é ineficiente
- `UNIQUE (cpf)` já garante unicidade global
- Tentar adicionar uma segunda senha com CPF diferente em mesma clínica funcionaria, mas...
- Se dois RHs precisassem estar na mesma clínica (improvável, mas possível), o sistema não permite

### Cenário de Duplicação: NÃO ocorre naturalmente
```sql
-- ❌ Falha na primeira UNIQUE (cpf)
INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash)
VALUES (1, '12345678901', hash1);

INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash)  -- ERRO: UNIQUE (cpf) violado
VALUES (2, '12345678901', hash2);
```

---

## 🔍 Problema 2: Fluxo de Integração Quebrado

### Localização
- Função: `ativarEntidade()` em `lib/entidade-activation.ts` (linhas 40-296)
- Chama: `criarContaResponsavel(entidade_id)` na linha 165
- Problema: O fluxo de `tomadors` → `clinicas` está desconectado

### Descrição do Fluxo Atual

```
┌─── PASSO 1: Cadastro em Tomadors ─────────────────────────────┐
│ INSERT INTO tomadors (                                         │
│   tipo='clinica',                                              │
│   nome, cnpj, responsavel_cpf, ...                            │
│ )                                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ PASSO 2: Ativar Tomador                                         │
│ - Esperado: ativartomador(tomador_id)                          │
│ - Real: ativartomador({ entidade_id, motivo })                │
│                                                                 │
│ ❌ MISMATCH: função espera entidade_id, teste passa tomador_id │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ ativarEntidade(entidade_id)                                     │
│ - Busca em: SELECT * FROM entidades WHERE id = $1             │
│ - Resultado: NÃO ENCONTRA (porque inseriu em tomadors, não em   │
│              entidades)                                        │
│ - Erro: "Entidade {id} não encontrada"                        │
└─────────────────────────────────────────────────────────────────┘
```

### Teste Quebrado
Arquivo: `__tests__/integration/clinica-criacao-login-fluxo.test.ts`

```typescript
// LINHA 107: Insere em TOMADORS
const tomadorResult = await query(
  `INSERT INTO tomadors (tipo, nome, cnpj, ..., responsavel_cpf, ...) 
   VALUES (...)`
);
tomadorId = tomadorResult.rows[0].id;

// LINHA 136: Passa tomador_id, mas função espera entidade_id!
const activationResult = await ativartomador({
  tomador_id: tomadorId,  // ❌ Parâmetro ERRADO - deveria ser entidade_id
  motivo: '...'
});

// LINHA 164: criarContaResponsavel tenta buscar em clinicas/entidades
await criarContaResponsavel(tomadorId);
// ❌ Falha porque:
//    1. Não encontra em clinicas (não foi criada)
//    2. Não encontra em entidades (foi em tomadors)
```

### Por que o teste NÃO falha?
1. Há tratamento de erro (try-catch) em alguns pontos
2. Há fallbacks para entidades_senhas
3. Teste está verificando a senha **na tabela errada**: `entidades_senhas` em vez de `clinicas_senhas`!

---

## 🔍 Problema 3: Teste Verifica a Tabela Errada

### Localização
Arquivo: `__tests__/integration/clinica-criacao-login-fluxo.test.ts`, linha 192

### Problema
```typescript
// LINHA 192: Verifica senha em ENTIDADES (errado para clínica)
const senhaCheck = await query(
  'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1',
  [cpfResponsavel]
);

// ❌ Deveria verificar em clinicas_senhas para uma clínica:
const senhaCheck = await query(
  'SELECT senha_hash FROM clinicas_senhas WHERE cpf = $1',
  [cpfResponsavel]
);
```

### Consequência
- O teste passa porque:
  - Pode haver fallback para `entidades_senhas`
  - Ou erro está sendo silenciado
- Mas a **função NÃO está criando senha em `clinicas_senhas`** como deveria
  
---

## 🎯 Análise da Função `criarContaResponsavel()`

### Localização
`lib/db.ts`, linhas 1492-1760

### Lógica de Determinação de Tabela

```typescript
// LINHAS 1500-1550: Se recebe NUMBER (ID)
if (typeof tomador === 'number') {
  let result = await query(
    'SELECT * FROM clinicas WHERE id = $1',
    [tomador]
  );

  if (result.rows.length > 0) {
    tomadorData = result.rows[0];
    tabelaTomadorOrigem = 'clinicas';  // ✅ Correto para clínica
  } else {
    // Buscar em entidades
    result = await query(
      'SELECT * FROM entidades WHERE id = $1',
      [tomador]
    );
    tomadorData = result.rows[0];
    tabelaTomadorOrigem = 'entidades';  // ✅ Correto para entidade
  }
}

// LINHAS 1598-1617: Determina tabela de senha
if (tomadorData.tipo === 'clinica') {
  tabelaSenha = 'clinicas_senhas';     // ✅ Correto
  campoId = 'clinica_id';
} else if (tomadorData.tipo === 'entidade') {
  tabelaSenha = 'entidades_senhas';    // ✅ Correto
  campoId = 'entidade_id';
} else {
  // Fallback: usa tabelaTomadorOrigem
  if (tabelaTomadorOrigem === 'clinicas') {
    tabelaSenha = 'clinicas_senhas';   // ✅ Correto
  } else {
    tabelaSenha = 'entidades_senhas';  // ✅ Correto
  }
}

// LINHAS 1625-1635: Cria UPSERT
const upsertQuery = `
  INSERT INTO ${tabelaSenha} (${campoId}, cpf, senha_hash, criado_em, atualizado_em)
  VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (cpf) DO UPDATE
  SET senha_hash = EXCLUDED.senha_hash, atualizado_em = CURRENT_TIMESTAMP
  RETURNING id
`;
```

### ✅ Função está CORRETA
- Se encontra em `clinicas`, usa `clinicas_senhas`
- Se encontra em `entidades`, usa `entidades_senhas`
- UPSERT é robusto e impede múltiplas senhas
- **Problema: nunca é chamada com os dados certos!**

---

## ❓ Pergunta 1: Estaria gerando e/ou resgatando senhas deletadas?

### Resposta: **NÃO**

#### Por quê:
1. **Não há soft delete**: Quando senha é deletada, é DELETE hard
   ```sql
   DELETE FROM clinicas_senhas WHERE cpf = ...  -- Hard delete
   ```

2. **Não há mecanismo de "restore"**: Nenhuma função tenta recuperar senhas deletadas

3. **ON CONFLICT não resgata deletadas**: O UPSERT insere NOVO registro:
   ```sql
   ON CONFLICT (cpf) DO UPDATE  -- Apenas atualiza se ainda existe
   ```

4. **Se deletada e recriada**: Nova senha, não "resgatada"
   ```sql
   -- Cenário: Senha foi deletada
   DELETE FROM clinicas_senhas WHERE cpf = '123.456.789-00';

   -- Depois ao chamar criarContaResponsavel() novamente:
   INSERT INTO clinicas_senhas (...)
   ON CONFLICT (cpf) DO UPDATE ...
   -- ✅ Cria NOVO registro de senha, não resgata a antiga
   ```

#### ✅ Conclusão
- **Senhas deletadas NÃO são resgatadas**
- Se deletada, precisa ser recriada chamando `criarContaResponsavel()` novamente

---

## ❓ Pergunta 2: Estaria gerando mais de uma senha no fluxo de cadastro?

### Resposta: **SIM, potencialmente**

#### Cenários onde MÚLTIPLAS SENHAS ocorrem

**Cenário 1: Múltiplas chamadas a `criarContaResponsavel()`**
```typescript
// Fluxo atual (se funcionar)
await ativartomador({ entidade_id });         // Chama criarContaResponsavel() 1x
await criarContaResponsavel(entidade_id);     // Chama 2x
// ✅ Resultado: UPSERT na 2a chamada atualiza

// Mas se somado a:
await criarContaResponsavel(clinicaId);       // Outro fluxo
await criarContaResponsavel(clinicaId);       // Novamente
// ✅ Resultado: Múltiplas chamadas, mas UPSERT previne múltiplas senhas
```

**Cenário 2: Sem UPSERT (em código antigo)**
```sql
-- ❌ Sem ON CONFLICT - criaria múltiplas
INSERT INTO clinicas_senhas (...) VALUES (...);
INSERT INTO clinicas_senhas (...) VALUES (...);
-- Erro: UNIQUE (cpf) violado na 2a inserção
```

**Cenário 3: Bug em lógica condicional**
```typescript
const exists = await query(
  `SELECT id FROM clinicas_senhas WHERE clinica_id = $1 AND cpf = $2`,
  [clinicaId, cpf]
);

if (exists.rows.length > 0) {
  // UPDATE
  await query('UPDATE ...');
} else {
  // INSERT - CORRETO
  await query('INSERT ...');
}
```

✅ Código atual (lib/db.ts) usa UPSERT, então **não gera múltiplas senhas**

#### ⚠️ Risco de Gerar Múltiplas CONTAS
```sql
-- Senhas via UPSERT (máximo 1 por CPF)
INSERT INTO clinicas_senhas (...) ON CONFLICT (cpf) DO UPDATE ...

-- MAS: Usuários podem ser criados múltiplos!
INSERT INTO usuarios (cpf, tipo_usuario, clinica_id, ...)
VALUES ('123...', 'rh', 1, ...);
INSERT INTO usuarios (cpf, tipo_usuario, clinica_id, ...)
VALUES ('123...', 'rh', 2, ...);  -- ✅ Possível! CPF pode estar em 2 clínicas!
```

#### ✅ Conclusão
- **UPSERT previne múltiplas senhas** (máximo 1 por CPF)
- **Mas múltiplas CONTASs são possíveis** (não há constraint no `usuarios`)
- **Teste quebrado mascara o comportamento real**

---

## 📊 Resumo de Achados

| Problema | Severidade | Confirmado | Impacto |
|----------|-----------|-----------|---------|
| Constraints redundantes | 🟡 Média | ✅ Sim | Ineficiência, confusão |
| Fluxo integração quebrado | 🔴 Alta | ✅ Sim | Senhas podem não ser criadas |
| Teste verifica tabela errada | 🔴 Alta | ✅ Sim | Falhas mascaradas |
| UPSERT gera senhas duplicadas | 🟢 Baixa | ❌ Não | Não ocorre (UPSERT protege) |
| Senhas deletadas resgatadas | 🟢 Baixa | ❌ Não | Não ocorre (sem restore) |

---

## 🛠️ Recomendações

### Imediato (Crítico)
1. **Remover uma das constraints UNIQUE**
   - Manter apenas `UNIQUE (clinica_id, cpf)`
   - Remover `UNIQUE (cpf)` redundante

2. **Corrigir fluxo integração**
   - Ajustar teste ou função para trabalhar com `tomadors` corretamente
   - Ou garantir que `ativartomador` trabalhe com `entidades`

3. **Corrigir teste**
   - Verificar senha em `clinicas_senhas` para clínicas
   - Verificar senha em `entidades_senhas` para entidades

### Curto Prazo
1. **Audit de senhas órfãs**
   ```sql
   -- Senhas sem clinica correspondente
   SELECT cs.cpf, cs.clinica_id
   FROM clinicas_senhas cs
   LEFT JOIN clinicas c ON cs.clinica_id = c.id
   WHERE c.id IS NULL;
   ```

2. **Validar unicidade de contas**
   ```sql
   -- Contas duplicadas (mesmo CPF, clínicas diferentes)
   SELECT cpf, COUNT(*)
   FROM usuarios
   WHERE tipo_usuario = 'rh'
   GROUP BY cpf
   HAVING COUNT(*) > 1;
   ```

### Longo Prazo
1. **Refatorar arquitetura de senhas**
   - Consolidar lógica em uma função única
   - Remover redundâncias
   - Melhorar testes de integração

---

## 📌 Notas Finais

- ✅ O mecanismo de **UPSERT está correto e previne duplicatas**
- ❌ O **fluxo de integração está quebrado** (tomadors vs entidades)
- ❌ O **teste mascara o problema** (verifica tabela errada)
- 🔧 **Senhas delete/restore não são implementadas**

# RELATÓRIO DE ENGENHARIA REVERSA

## Análise de Falhas no Sistema - Correções de Dados 06/02/2026

---

## 📋 SUMÁRIO EXECUTIVO

Durante o processo de sincronização do banco de dados de **DESENVOLVIMENTO** para **PRODUÇÃO**, foram identificadas **inconsistências críticas de integridade referencial** que revelam falhas estruturais no código da aplicação. Este relatório mapeia as falhas encontradas, identifica suas possíveis causas no código e propõe correções preventivas.

---

## 🚨 FALHAS IDENTIFICADAS

### **1. FALHA CRÍTICA: Entidade ID 36 Inexistente**

#### **Sintoma**:

- Clínica ID 7 referencia `entidade_id = 36`
- Entidade 36 NÃO EXISTE na tabela `entidades`
- FK constraint violada impedindo operações

#### **Impacto**:

- ❌ Impossível sincronizar clínicas
- ❌ Cascata: funcionários, lotes, laudos bloqueados
- ❌ Sistema permite criar clínicas com referências órfãs

#### **Causa Raiz Provável no Código**:

**HIPÓTESE 1: Ausência de Transação ao Criar Clínica**

```typescript
// PROBLEMA: Criação de clínica sem garantir que entidade existe
async function criarClinica(dados) {
  // ❌ NÃO verifica se entidade_id existe
  // ❌ NÃO usa transação
  await db.query(
    'INSERT INTO clinicas (nome, cnpj, entidade_id) VALUES ($1, $2, $3)',
    [dados.nome, dados.cnpj, dados.entidade_id] // 36 foi passado mas não existe!
  );
}
```

**HIPÓTESE 2: Deleção de Entidade Sem Cascade ou Verificação**

```typescript
// PROBLEMA: Permite deletar entidade mesmo com clínicas vinculadas
async function deletarEntidade(id) {
  // ❌ NÃO verifica se há clínicas vinculadas
  // ❌ NÃO usa CASCADE ou SET NULL
  await db.query('DELETE FROM entidades WHERE id = $1', [id]);
  // Clínica 7 fica órfã apontando para entidade_id=36 que não existe mais
}
```

**HIPÓTESE 3: Bug na Migração ou Importação de Dados**

```typescript
// PROBLEMA: Importação de dados sem validar FKs
async function importarDadosLegado() {
  // ❌ Importa clínicas de sistema antigo
  // ❌ NÃO valida se entidade_id existe antes
  await db.query('INSERT INTO clinicas ...', dados); // FK órfã!
}
```

---

### **2. FALHA ESTRUTURAL: Relacionamentos Incorretos em Laudos/Lotes**

#### **Sintoma**:

- **Lote 2**: Tinha `clinica_id=7, empresa_id=6` mas deveria ser `contratante_id=35`
- **Lote 3**: Tinha `contratante_id=35` mas deveria ser `clinica_id=37`
- **Lote 4**: Correto `contratante_id=37` ✅

#### **Impacto**:

- ⚠️ Dados inconsistentes sobre quem "dono" do lote
- ⚠️ Relatórios e dashboards exibem informações erradas
- ⚠️ Faturamento pode estar sendo atribuído incorretamente

#### **Causa Raiz Provável no Código**:

**HIPÓTESE 1: Lógica de Criação de Lote Ambígua**

```typescript
// PROBLEMA: Lógica confusa sobre quando usar clinica_id vs contratante_id
async function criarLote(funcionarios) {
  const lote = {
    clinica_id: null,
    contratante_id: null,
    empresa_id: null,
  };

  // ❌ Lógica FALHA: não fica claro qual usar
  if (funcionarios[0].clinica_id) {
    lote.clinica_id = funcionarios[0].clinica_id; // MAS E SE for entidade direta?
    lote.empresa_id = funcionarios[0].empresa_id;
  } else {
    lote.contratante_id = funcionarios[0].contratante_id; // OU clínica?
  }

  // Resultado: lotes com vinculações ERRADAS
  await db.query('INSERT INTO lotes_avaliacao ...', lote);
}
```

**HIPÓTESE 2: Falta de Constraint CHECK no Banco**

```sql
-- PROBLEMA: Banco permite múltiplos campos preenchidos simultaneamente
-- Deveria ter CHECK garantindo exclusividade:
-- (clinica_id IS NOT NULL AND empresa_id IS NOT NULL AND contratante_id IS NULL)
-- OR
-- (contratante_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL)
```

**HIPÓTESE 3: Alteração de Regra de Negócio Sem Migração**

```typescript
// PROBLEMA: Sistema mudou de "contratantes" para "entidades"
// mas não migrou lotes antigos
// Lógica antiga:
lote.contratante_id = 35; // entidade direta

// Lógica nova (após refatoração):
lote.clinica_id = 37; // através de clínica

// Mas lotes antigos ficaram com vinculação desatualizada!
```

---

### **3. FALHA DE MIGRAÇÃO: Tabelas "contratantes\*" Obsoletas**

#### **Sintoma**:

- Tabelas `contratantes`, `contratantes_senhas` **VAZIAS**
- Tabela `contratantes_senhas_audit` com 3 registros órfãos
- **4 Foreign Keys** ainda apontam para `contratantes`
- **191 referências no código** ainda usam "contratantes"

#### **Impacto**:

- 🗑️ Código legado poluindo codebase
- 🐛 Risco de bugs ao tentar usar funcionalidades antigas
- 📉 Performance prejudicada por JOINs desnecessários
- 🔀 Confusão entre desenvolvedores: usar `contratantes` ou `entidades`?

#### **Causa Raiz Provável no Código**:

**HIPÓTESE 1: Migração Incompleta de "Contratantes" → "Entidades"**

```typescript
// PROBLEMA: Refatoração feita pela metade
// Arquivos ANTIGOS (não refatorados):
import { getContratante } from '@/lib/contratantes'; // ❌ ainda existe!

// Arquivos NOVOS (refatorados):
import { getEntidade } from '@/lib/entidades'; // ✅ nova abordagem

// RESULTADO: Sistema schizophrenia - duas formas de fazer a mesma coisa!
```

**HIPÓTESE 2: FKs no Schema Não Foram Atualizadas**

```sql
-- PROBLEMA: Schema ainda referencia tabela obsoleta
ALTER TABLE entidades_senhas
  ADD CONSTRAINT fk_contratante
  FOREIGN KEY (contratante_id) REFERENCES contratantes(id);
  -- ❌ Deveria ser: REFERENCES entidades(id)
```

**HIPÓTESE 3: Falta de Estratégia de Deprecation**

```typescript
// PROBLEMA: Código antigo não foi marcado como deprecated
export async function getContratante(id) {
  // ❌ FALTOU: @deprecated Use getEntidade() instead
  // ❌ FALTOU: console.warn('DEPRECATED: Use getEntidade()')
  return db.query('SELECT * FROM contratantes WHERE id = $1', [id]);
}
```

---

### **4. FALHA DE VALIDAÇÃO: Clínica ID 7 Deveria Ser ID 36**

#### **Sintoma**:

- Clínica cadastrada com **ID sequencial 7**
- Mas o sistema espera que o ID da clínica seja **igual ao ID da entidade vinculada (36)**

#### **Impacto**:

- 🔀 Confusão: ID da clínica ≠ ID da entidade
- 🐛 Código que assume `clinica.id === entidade.id` quebra

#### **Causa Raiz Provável no Código**:

**HIPÓTESE 1: Falha ao Criar Clínica - Não Reutiliza ID da Entidade**

```typescript
// PROBLEMA: Clínica usa sequence independente
async function criarClinicaParaEntidade(entidade_id) {
  // ❌ Deixa o banco gerar ID automaticamente (sequence: 7)
  const clinica = await db.query(
    'INSERT INTO clinicas (nome, entidade_id) VALUES ($1, $2) RETURNING id',
    [nome, entidade_id] // entidade_id = 36
  );

  // RESULTADO: clinica.id = 7, mas entidade_id = 36 (inconsistente!)
}

// DEVERIA SER:
async function criarClinicaParaEntidade(entidade_id) {
  // ✅ Força o ID da clínica = ID da entidade
  const clinica = await db.query(
    'INSERT INTO clinicas (id, nome, entidade_id) VALUES ($1, $2, $3)',
    [entidade_id, nome, entidade_id] // id = 36, entidade_id = 36 ✅
  );
}
```

---

### **5. FALHA DE INTEGRIDADE: Dados Órfãos (66% dos dados não copiaram)**

#### **Sintoma**:

- **avaliacoes**: 43% copiado (4 de 7 registros órfãos)
- **laudos**: 33% copiado (2 de 3 registros órfãos)
- **respostas**: 33% copiado (74 de 111 registros órfãos)
- **resultados**: 33% copiado (20 de 30 registros órfãos)

#### **Impacto**:

- 🗑️ Banco cheio de "lixo" - dados de teste não deletados
- 🐛 Referências quebradas causam erros ao consultar

#### **Causa Raiz Provável no Código**:

**HIPÓTESE 1: Falta de CASCADE DELETE**

```sql
-- PROBLEMA: Deleções não propagam
ALTER TABLE avaliacoes
  ADD CONSTRAINT fk_lote
  FOREIGN KEY (lote_id) REFERENCES lotes_avaliacao(id);
  -- ❌ FALTOU: ON DELETE CASCADE

-- RESULTADO: Se deletar lote_id=5, avaliacoes órfãs ficam no banco!
```

**HIPÓTESE 2: Ambiente de Teste Sem Limpeza**

```typescript
// PROBLEMA: Testes criam dados mas não limpam
describe('Criar Avaliação', () => {
  it('deve criar avaliação', async () => {
    await criarAvaliacao({ lote_id: 999 }); // ID fake para teste
    // ❌ FALTOU: afterEach(() => limparDados())
  });
});

// RESULTADO: Banco fica com avaliacao apontando para lote_id=999 que não existe!
```

**HIPÓTESE 3: Soft Delete Mal Implementado**

```typescript
// PROBLEMA: Soft delete apenas marca como "deletado" mas não limpa referências
async function deletarLote(id) {
  await db.query('UPDATE lotes_avaliacao SET deleted = true WHERE id = $1', [
    id,
  ]);
  // ❌ Avaliacoes, laudos, respostas ainda referenciam esse lote!
  // ❌ Deveriam ser deletadas OU marcadas como órfãs
}
```

---

## 🛠️ CORREÇÕES PROPOSTAS

### **CORREÇÃO 1: Validação de FK Antes de INSERT**

**Onde aplicar**: `lib/database/validators.ts` (NOVO)

**Solução**:

- Criar função `validateForeignKey(table, column, value)`
- Chamar antes de TODOS os INSERTs que envolvem FKs
- Retornar erro claro se FK não existir

**Benefício**: Impede criação de registros órfãos

---

### **CORREÇÃO 2: Transações para Operações Complexas**

**Onde aplicar**: Todas as rotas de criação de entidades, clínicas, lotes

**Solução**:

- Envolver criação de clínica + entidade em BEGIN/COMMIT
- Se falhar em qualquer ponto, ROLLBACK completo
- Usar `db.transaction(async (client) => { ... })`

**Benefício**: Atomicidade garantida

---

### **CORREÇÃO 3: Lógica Clara para Vinculação de Lotes**

**Onde aplicar**: `app/api/emissor/lotes/route.ts`

**Solução**:

- Criar enum `TipoVinculacaoLote`:
  - `VINCULADO_A_CLINICA_E_EMPRESA` → preenche `clinica_id` + `empresa_id`
  - `VINCULADO_A_ENTIDADE_DIRETA` → preenche `contratante_id`
- Adicionar CHECK constraint no banco:
  ```sql
  CHECK (
    (clinica_id IS NOT NULL AND empresa_id IS NOT NULL AND contratante_id IS NULL)
    OR
    (contratante_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL)
  )
  ```

**Benefício**: Elimina ambiguidade

---

### **CORREÇÃO 4: Migração Completa: Remover Tabelas "contratantes\*"**

**Onde aplicar**: Nova migration + refatoração em 191 arquivos

**Solução - FASE 1: Preparação**

- Atualizar 4 FKs para apontar para `entidades` ao invés de `contratantes`
- Criar script de busca/substituição: `contratantes` → `entidades`
- Marcar funções antigas como `@deprecated`

**Solução - FASE 2: Execução**

- Backup de `contratantes_senhas_audit` (3 registros históricos)
- DROP FKs obsoletas
- DROP tabelas `contratantes*`
- Remover imports e funções legacy

**Solução - FASE 3: Validação**

- Executar testes end-to-end
- Verificar que nenhuma funcionalidade quebrou

**Benefício**: Codebase limpo, sem confusão

---

### **CORREÇÃO 5: ID Unificado: Clínica.id = Entidade.id**

**Onde aplicar**: `app/api/admin/clinicas/route.ts`

**Solução**:

- Ao criar clínica para entidade existente:
  ```typescript
  const clinica = await db.query(
    'INSERT INTO clinicas (id, nome, entidade_id) VALUES ($1, $2, $3)',
    [entidade.id, nome, entidade.id] // Force mesmo ID
  );
  ```
- Alterar sequence de `clinicas` para não conflitar
- Adicionar CHECK: `clinica.id = clinica.entidade_id` (se não NULL)

**Benefício**: Consistência de IDs

---

### **CORREÇÃO 6: Limpeza Automática de Dados Órfãos**

**Onde aplicar**: Novo cronjob + script manual

**Solução - Script de Limpeza**:

- Criar `scripts/cleanup-orphan-data.ts`
- Detectar e deletar registros órfãos:
  ```sql
  DELETE FROM avaliacoes WHERE lote_id NOT IN (SELECT id FROM lotes_avaliacao);
  DELETE FROM respostas WHERE avaliacao_id NOT IN (SELECT id FROM avaliacoes);
  ```

**Solução - CASCADE DELETE**:

- Adicionar em TODAS as FKs: `ON DELETE CASCADE`
- Revisar schema completo

**Solução - Testes**:

- Adicionar `afterEach()` em todos os testes para limpar dados

**Benefício**: Banco sempre limpo

---

### **CORREÇÃO 7: Auditoria e Logs de Integridade**

**Onde aplicar**: Middleware global + triggers

**Solução**:

- Criar trigger que detecta violações de FK em tempo real
- Logar tentativas de INSERT/UPDATE com FK inválida
- Enviar alerta para desenvolvedores

**Benefício**: Detecção precoce de problemas

---

## 📊 PRIORIZAÇÃO DAS CORREÇÕES

| Prioridade | Correção                  | Impacto | Esforço | Razão                |
| ---------- | ------------------------- | ------- | ------- | -------------------- |
| 🔴 **P0**  | #1 Validação de FK        | Alto    | Médio   | Previne dados órfãos |
| 🔴 **P0**  | #2 Transações             | Alto    | Médio   | Garante atomicidade  |
| 🟠 **P1**  | #3 Lógica Clara Lotes     | Médio   | Baixo   | Elimina confusão     |
| 🟠 **P1**  | #6 Limpeza Órfãos         | Médio   | Médio   | Remove "lixo"        |
| 🟡 **P2**  | #4 Remover contratantes\* | Baixo   | Alto    | Refatoração grande   |
| 🟡 **P2**  | #5 ID Unificado           | Baixo   | Baixo   | Nice to have         |
| 🟢 **P3**  | #7 Auditoria              | Baixo   | Alto    | Monitoramento        |

---

## 🎯 PLANO DE AÇÃO SUGERIDO

### **SPRINT 1 (1-2 semanas)**

1. ✅ Implementar validação de FK (#1)
2. ✅ Adicionar transações em operações críticas (#2)
3. ✅ Corrigir lógica de vinculação de lotes (#3)
4. ✅ Executar script de limpeza de dados órfãos (#6)

### **SPRINT 2 (2-3 semanas)**

5. ✅ Migrar tabelas contratantes\* para entidades (#4)
6. ✅ Refatorar 191 arquivos com referências a "contratantes"

### **SPRINT 3 (1 semana)**

7. ✅ Implementar ID unificado clínica=entidade (#5)
8. ✅ Adicionar auditoria de integridade (#7)

---

## 📝 CONCLUSÃO

As correções de dados revelaram **falhas sistêmicas de integridade referencial** causadas por:

1. ❌ **Falta de validação** antes de INSERTs
2. ❌ **Ausência de transações** em operações complexas
3. ❌ **Migração incompleta** de "contratantes" → "entidades"
4. ❌ **Lógica ambígua** de vinculação de lotes
5. ❌ **Dados de teste** não limpos

**Risco Atual**: 🔴 **ALTO** - Sistema permite criar dados inconsistentes

**Após Correções**: 🟢 **BAIXO** - Integridade garantida por código + constraints

---

**Autor**: Análise Automatizada - Sistema de Sincronização  
**Data**: 06/02/2026  
**Status**: ⚠️ AGUARDANDO APROVAÇÃO PARA IMPLEMENTAÇÃO

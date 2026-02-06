# Análise Crítica: Problema #1 - Gestor Entidade em `funcionarios`

**Data:** 29 de janeiro de 2026  
**Tipo:** Análise arquitetural  
**Status:** 🔴 PROBLEMA CONCEITUAL IDENTIFICADO

---

## 🎯 Resumo Executivo

A proposta de introduzir papel **"responsavel"** para resolver o problema arquitetural de Gestor Entidade **NÃO resolve o problema raiz** e pode adicionar complexidade desnecessária.

### ❌ Problema Real

O problema NÃO é o nome do papel (`gestor` vs `responsavel`).

O problema É:

1. **Mistura de conceitos:** Gestores (que administram) sendo colocados na tabela `funcionarios` (que são gerenciados)
2. **Violação de separação de responsabilidades:** Tabela `funcionarios` deveria conter APENAS pessoas que respondem avaliações
3. **Inconsistência arquitetural:** Duas formas de autenticar gestores (via `funcionarios` vs `entidades_senhas`)

---

## 🏗️ Arquitetura Correta (Já Implementada Parcialmente)

### Separação Clara de Entidades

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA QWORK                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │   GESTORES       │              │   FUNCIONÁRIOS   │     │
│  │  (Administram)   │              │   (Gerenciados)  │     │
│  └──────────────────┘              └──────────────────┘     │
│          │                                  │                │
│          │                                  │                │
│    ┌─────▼──────┐                    ┌─────▼──────┐        │
│    │ Gestor RH  │                    │ Funcionário│        │
│    │ (clínica)  │                    │  Regular   │        │
│    ├────────────┤                    ├────────────┤        │
│    │ - Tabela:  │                    │ - Tabela:  │        │
│    │   funcionarios│                 │   funcionarios│      │
│    │   (perfil=rh) │                 │   (perfil=  │        │
│    │             │                    │   funcionario)│      │
│    │ - Auth:    │                    │             │        │
│    │   contratantes│                 │ - Auth:    │        │
│    │   _senhas   │                    │   CPF+senha│        │
│    └────────────┘                    └────────────┘        │
│                                                              │
│    ┌─────────────┐                                          │
│    │ Gestor      │                                          │
│    │ Entidade    │  ← ⚠️ NÃO DEVE ESTAR EM funcionarios    │
│    ├─────────────┤                                          │
│    │ - Tabela:   │                                          │
│    │   contratantes│                                        │
│    │   _senhas   │                                          │
│    │   APENAS    │                                          │
│    │             │                                          │
│    │ - Auth:     │                                          │
│    │   contratantes│                                        │
│    │   _senhas   │                                          │
│    └─────────────┘                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Por Que Gestor Entidade É Diferente?

| Aspecto                      | Gestor RH (Clínica)             | Gestor Entidade         | Funcionário Regular         |
| ---------------------------- | ------------------------------- | ----------------------- | --------------------------- |
| **Contexto**                 | Clínica precisa de `clinica_id` | Entidade SEM clínica    | Pertence a clínica/entidade |
| **Tabela funcionarios?**     | ✅ SIM (precisa de clinica_id)  | ❌ NÃO (sem clinica_id) | ✅ SIM                      |
| **Constraint clinica_check** | Satisfeito                      | ⚠️ VIOLARIA             | Satisfeito                  |
| **Responde avaliações?**     | ❌ NÃO                          | ❌ NÃO                  | ✅ SIM                      |
| **Autenticação**             | `entidades_senhas`              | `entidades_senhas`      | CPF + senha                 |

---

## ❌ Por Que "Responsavel" NÃO Resolve o Problema

### Proposta Apresentada

Criar novo papel `"responsavel"` para substituir `"gestor"`.

### Problemas com Esta Abordagem

#### 1. **Não Resolve a Violação Arquitetural**

```typescript
// ANTES (problemático)
perfil: 'gestor' em funcionarios ❌

// DEPOIS com "responsavel" (AINDA problemático)
perfil: 'responsavel' em funcionarios ❌

// O problema persiste! Gestor ainda está na tabela errada
```

#### 2. **Adiciona Complexidade Desnecessária**

```typescript
// Agora teríamos:
type Perfil =
  | 'admin'
  | 'rh'
  | 'funcionario'
  | 'emissor'
  | 'gestor' // ← deprecado mas existente
  | 'responsavel'; // ← novo mas resolve nada

// Migrations, testes, RLS policies, middleware - TUDO precisa ser duplicado
```

#### 3. **Confunde Mais a Arquitetura**

A análise fornecida lista **87 itens** que precisariam de ajustes apenas para mudar o nome. Isso é um **code smell** gigante indicando que o problema está em outro lugar.

#### 4. **Quebra Princípio KISS (Keep It Simple, Stupid)**

Renomear não resolve o problema de design. É como trocar a etiqueta de uma porta quebrada em vez de consertá-la.

---

## ✅ Solução Correta (Sem Criar "Responsavel")

### Princípio Fundamental

> **Gestores NÃO são funcionários. Logo, NÃO devem estar na tabela `funcionarios`.**

### Implementação

#### 1. **Manter Arquitetura Atual (Já Correta no Código)**

```typescript
// lib/db.ts - criarContaResponsavel() - ESTÁ CORRETO!
export async function criarContaResponsavel(contratanteId: number) {
  const contratante = await query(
    'SELECT tipo, responsavel_cpf, responsavel_nome FROM contratantes WHERE id = $1',
    [contratanteId]
  );

  if (contratante.rows[0].tipo === 'entidade') {
    // ✅ CORRETO: NÃO cria em funcionarios
    // Apenas cria em entidades_senhas
    await query(
      'INSERT INTO entidades_senhas (cpf, senha_hash, contratante_id) VALUES ($1, $2, $3)',
      [contratante.rows[0].responsavel_cpf, hashedPassword, contratanteId]
    );
  } else {
    // Gestor RH precisa estar em funcionarios (tem clinica_id)
    await query(
      'INSERT INTO funcionarios (cpf, nome, perfil, clinica_id) VALUES ($1, $2, $3, $4)',
      [cpf, nome, 'rh', clinicaId]
    );

    await query(
      'INSERT INTO entidades_senhas (cpf, senha_hash, contratante_id) VALUES ($1, $2, $3)',
      [cpf, hashedPassword, contratanteId]
    );
  }
}
```

#### 2. **Adicionar Constraint Protetora**

```sql
-- Migration: XXX_prevent_gestor_in_funcionarios.sql

-- Garantir que gestor NUNCA seja inserido em funcionarios
ALTER TABLE funcionarios
ADD CONSTRAINT funcionarios_no_gestor
CHECK (perfil != 'gestor');

COMMENT ON CONSTRAINT funcionarios_no_gestor ON funcionarios IS
'Gestores de entidade NÃO devem estar em funcionarios. Eles são autenticados via entidades_senhas apenas.';
```

#### 3. **Limpar Dados Existentes**

```sql
-- Já foi feito na migration 201, mas garantir:

-- Remover gestores entidade de funcionarios (se houver)
DELETE FROM funcionarios
WHERE perfil = 'gestor';

-- Verificar que não há gestor com clinica_id
SELECT cpf, nome
FROM funcionarios
WHERE perfil = 'gestor' AND clinica_id IS NOT NULL;
-- Deve retornar 0 linhas
```

#### 4. **Atualizar Documentação (Já Está Correta!)**

A documentação em [docs/security/GUIA-COMPLETO-RLS-RBAC.md](docs/security/GUIA-COMPLETO-RLS-RBAC.md) já afirma corretamente:

```markdown
##### Gestor Entidade (`perfil='gestor'`)

- **Tabelas:** Apenas `entidades_senhas` (SEM entrada em `funcionarios`)
```

✅ **Documentação está correta. Código está correto. Apenas falta constraint.**

---

## 🔍 Análise da Proposta "Responsavel"

### Checklist Fornecido (87 Itens)

A análise lista **87 verificações** necessárias. Vamos categorizá-las:

#### Itens que NÃO seriam necessários se arquitetura estiver correta:

```
❌ Database & Schema - inserir novo papel
   → Gestor Entidade já existe e funciona

❌ Middleware - adicionar suporte para 'responsavel'
   → Middleware já suporta gestor

❌ Rotas API - validar permissões para novo papel
   → Rotas já validam gestor

❌ RLS Policies - reconhecer 'responsavel'
   → Policies já reconhecem gestor

❌ Testes - atualizar fixtures
   → Fixtures funcionam com gestor

❌ Componentes UI - verificar novo papel
   → UI já renderiza corretamente para gestor

❌ Documentação - criar guia de migração
   → Sem necessidade se não há migração
```

**Resultado:** ~80% dos itens são desnecessários se mantivermos `gestor` corretamente.

#### Itens Realmente Necessários:

```
✅ Adicionar constraint em funcionarios
✅ Verificar RLS policies não bloqueiam gestor incorretamente
✅ Corrigir problema #2 (contratantes_funcionarios vs contratante_id)
```

**Apenas 3-5 itens são críticos**, e **nenhum deles requer criar "responsavel"**.

---

## 📊 Comparação de Abordagens

| Aspecto                       | Criar "Responsavel"            | Manter "Gestor Entidade" + Constraint |
| ----------------------------- | ------------------------------ | ------------------------------------- |
| **Complexidade**              | 🔴 Alta (87 pontos de mudança) | 🟢 Baixa (1 constraint + doc)         |
| **Risco de Regressão**        | 🔴 Alto (muitos arquivos)      | 🟢 Baixo (mudança isolada)            |
| **Tempo de Implementação**    | 🔴 2-3 semanas                 | 🟢 1-2 horas                          |
| **Resolve Problema Raiz?**    | ❌ NÃO                         | ✅ SIM                                |
| **Quebra Compatibilidade?**   | ❌ SIM (dados existentes)      | ✅ NÃO (apenas adiciona proteção)     |
| **Alinhado com Arquitetura?** | ❌ NÃO (ainda em funcionarios) | ✅ SIM (fora de funcionarios)         |

---

## 🎯 Recomendação Final

### ❌ NÃO Implementar Papel "Responsavel"

**Razões:**

1. Não resolve o problema arquitetural
2. Adiciona complexidade desnecessária
3. Requer retrabalho massivo (87 pontos)
4. Quebra compatibilidade com dados existentes
5. Confunde mais a estrutura de papéis

### ✅ Implementar Solução Simples

**Passo a passo (2 horas de trabalho):**

```sql
-- 1. Criar migration (5 min)
CREATE OR REPLACE MIGRATION XXX_prevent_gestor_in_funcionarios AS $$

  -- Verificar se há gestores entidade em funcionarios (não deveria haver)
  DO $$
  DECLARE
    gestor_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO gestor_count
    FROM funcionarios
    WHERE perfil = 'gestor';

    IF gestor_count > 0 THEN
      RAISE WARNING 'Encontrados % gestores entidade em funcionarios. Serão removidos.', gestor_count;

      -- Remover (já não deveriam existir após migration 201)
      DELETE FROM funcionarios WHERE perfil = 'gestor';
    END IF;
  END $$;

  -- Adicionar constraint
  ALTER TABLE funcionarios
  ADD CONSTRAINT funcionarios_no_gestor
  CHECK (perfil != 'gestor');

  -- Comentário explicativo
  COMMENT ON CONSTRAINT funcionarios_no_gestor ON funcionarios IS
  'Gestores de entidade NÃO são funcionários. São autenticados via entidades_senhas.';

$$;
```

```typescript
// 2. Adicionar validação em lib/db.ts (10 min)
export async function criarContaResponsavel(contratanteId: number) {
  const contratante = await query(/* ... */);

  if (contratante.rows[0].tipo === 'entidade') {
    // Validação adicional
    const funcionarioCheck = await query(
      'SELECT id FROM funcionarios WHERE cpf = $1',
      [contratante.rows[0].responsavel_cpf]
    );

    if (funcionarioCheck.rows.length > 0) {
      throw new Error(
        'ERRO: Gestor de entidade não pode estar na tabela funcionarios. ' +
          'Violação arquitetural detectada.'
      );
    }

    // Criar apenas em entidades_senhas (já está correto)
    // ...
  }
}
```

```typescript
// 3. Adicionar teste de regressão (30 min)
describe('Constraint: Gestor Entidade não em funcionarios', () => {
  it('deve impedir inserção de gestor em funcionarios', async () => {
    await expect(
      query(
        'INSERT INTO funcionarios (cpf, nome, perfil) VALUES ($1, $2, $3)',
        ['99999999999', 'Gestor Teste', 'gestor']
      )
    ).rejects.toThrow(/funcionarios_no_gestor/);
  });

  it('deve permitir outros perfis', async () => {
    await expect(
      query(
        'INSERT INTO funcionarios (cpf, nome, perfil, clinica_id) VALUES ($1, $2, $3, $4)',
        ['88888888888', 'RH Teste', 'rh', 1]
      )
    ).resolves.not.toThrow();
  });
});
```

```markdown
// 4. Atualizar AUDITORIA-RLS-RBAC-COMPLETA.md (15 min)

### 1. ✅ RESOLVIDO: Gestor Entidade em `funcionarios`

**Status:** Implementado constraint protetora  
**Migration:** XXX_prevent_gestor_in_funcionarios.sql  
**Data:** 29/01/2026

**Solução Implementada:**

- Constraint `funcionarios_no_gestor` impede inserções
- Validação adicional em `criarContaResponsavel()`
- Testes de regressão adicionados

**Arquitetura Confirmada:**

- Gestor RH: `funcionarios` (perfil='rh') + `entidades_senhas` ✅
- Gestor Entidade: `entidades_senhas` APENAS ✅
- Funcionário: `funcionarios` (perfil='funcionario') ✅
```

---

## 🚨 Problemas com a Análise Fornecida

A análise de 87 itens revela **mal-entendidos arquiteturais**:

### 1. "Entidade não tem empresas" ❌

```typescript
// Análise afirma:
├── empresas/route.ts # ⚠️ Entidade não tem empresas!

// ISSO ESTÁ ERRADO
```

**Realidade:**

- Entidades PODEM ter empresas clientes
- `empresas_clientes.contratante_id` pode apontar para entidade
- A diferença é que clínicas têm `clinica_id`, entidades usam `contratante_id`

### 2. "Remover rotas de empresas para entidade" ❌

**Isso quebraria funcionalidade válida.** Entidades podem gerenciar empresas clientes da mesma forma que clínicas.

### 3. "Tabela de Papéis Formal" ⚠️

```sql
INSERT INTO papeis (id, nome, nome_exibicao, descricao) VALUES
(5, 'responsavel', 'Responsável pela Entidade', 'Gerencia funcionários de sua entidade');
```

**Problema:** Tabela `papeis` NÃO EXISTE no schema atual. O sistema usa enum/const de tipos.

---

## 📋 Ações Recomendadas (Prioridade Real)

### Prioridade 1 - HOJE (2 horas)

- [x] ~~Criar papel "responsavel"~~ ❌ NÃO FAZER
- [ ] ✅ Criar constraint `funcionarios_no_gestor`
- [ ] ✅ Adicionar validação em `criarContaResponsavel()`
- [ ] ✅ Criar testes de regressão

### Prioridade 2 - Esta Semana

- [ ] Verificar RLS policies para gestor (problema #9 da auditoria)
- [ ] Resolver problema #2 (contratantes_funcionarios vs contratante_id)
- [ ] Adicionar índices RLS (problema #10)

### Prioridade 3 - Backlog

- [ ] Documentar diferenças clínica vs entidade (CORRETAMENTE)
- [ ] Revisar todos os mal-entendidos da análise de 87 itens
- [ ] Criar diagramas de fluxo de autenticação

---

## 🎓 Lições Aprendidas

1. **Renomear não resolve problemas de design** - Foque na arquitetura, não em nomes
2. **Simplicidade > Complexidade** - 1 constraint resolve mais que 87 mudanças
3. **Entenda o problema antes de propor solução** - A análise de 87 itens mostra falta de compreensão da arquitetura existente
4. **Código já está certo na maioria das vezes** - Muitas vezes só falta uma proteção adicional

---

## 📚 Referências

- [Auditoria RLS/RBAC Completa](AUDITORIA-RLS-RBAC-COMPLETA.md) - Problema #1
- [Guia Completo RLS/RBAC](security/GUIA-COMPLETO-RLS-RBAC.md) - Arquitetura correta
- [Migration 201](../database/migrations/201_fix_gestor_as_funcionario.sql) - Limpeza já realizada
- [lib/db.ts:criarContaResponsavel](../lib/db.ts#L1466) - Implementação correta

---

**Conclusão:** Manter `gestor` como está + adicionar constraint protetora = Solução simples, robusta e alinhada com a arquitetura existente. ✅

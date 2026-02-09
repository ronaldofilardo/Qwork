# Relatório de Correção: Código Legado - Separação entre Gestores e RH

**Data:** 05 de Fevereiro de 2026  
**Contexto:** Correção de código legado que tratava incorretamente `rh` e `gestor` como mesma categoria

---

## 📊 Problemas Identificados

### 1. Helper `lib/usuario-tipo-helpers.ts`

**Problema:** A função `isGestor()` agrupava incorretamente `rh` e `gestor` como se fossem o mesmo papel.

**Realidade:**

- `rh` = Gestor de **Clínica** (vinculado a `clinica_id`)
- `gestor` = Gestor de **Entidade** (vinculado a `entidade_id`)

São papéis diferentes com responsabilidades e escopos distintos.

---

### 2. Função `getSQLWhereUsuarioTipo()`

**Problema:** Filtrava `rh` e `gestor` juntos quando `tipo='gestor'`.

**Impacto:** Queries SQL que precisavam filtrar apenas gestores de entidade também retornavam RH de clínicas.

---

### 3. View SQL `gestores` (Migration 132)

**Problema CRÍTICO:** A view buscava dados na tabela `funcionarios`:

```sql
-- ❌ ERRADO (Migration 132)
CREATE VIEW gestores AS
SELECT * FROM funcionarios
WHERE usuario_tipo IN ('rh', 'gestor');
```

**Realidade:**

- `rh` e `gestor` estão na tabela **`usuarios`**, não em `funcionarios`
- A tabela `funcionarios` contém apenas `funcionario_clinica` e `funcionario_entidade`

---

## ✅ Correções Implementadas

### 1. Helpers Separados (`lib/usuario-tipo-helpers.ts`)

**Antes:**

```typescript
export function isGestor(tipo: UsuarioTipo): boolean {
  return tipo === 'rh' || tipo === 'gestor';
}
```

**Depois:**

```typescript
/**
 * Verifica se usuario_tipo é gestor de entidade
 */
export function isGestorDeEntidade(tipo: UsuarioTipo): boolean {
  return tipo === 'gestor';
}

/**
 * Verifica se usuario_tipo é gestor de clínica (RH)
 */
export function isGestorDeClinica(tipo: UsuarioTipo): boolean {
  return tipo === 'rh';
}

/**
 * Verifica se usuario_tipo é qualquer tipo de gestor (entidade ou clínica)
 * @deprecated Use isGestorDeEntidade() ou isGestorDeClinica() para maior clareza
 */
export function isGestor(tipo: UsuarioTipo): boolean {
  return tipo === 'rh' || tipo === 'gestor';
}
```

**Decisão:** Mantivemos `isGestor()` como **deprecated** para não quebrar código existente, mas criamos funções específicas.

---

### 2. Correção de `getSQLWhereUsuarioTipo()`

**Antes:**

```typescript
export function getSQLWhereUsuarioTipo(
  tipo: 'funcionario' | 'gestor' | 'all'
): string {
  switch (tipo) {
    case 'gestor':
      return "usuario_tipo IN ('rh', 'gestor')"; // ❌ Agrupava errado
    // ...
  }
}
```

**Depois:**

```typescript
export function getSQLWhereUsuarioTipo(
  tipo: 'funcionario' | 'gestor' | 'gestor_clinica' | 'all'
): string {
  switch (tipo) {
    case 'funcionario':
      return "usuario_tipo IN ('funcionario_clinica', 'funcionario_entidade')";
    case 'gestor':
      return "usuario_tipo = 'gestor'"; // ✅ Separado
    case 'gestor_clinica':
      return "usuario_tipo = 'rh'"; // ✅ Separado
    case 'all':
      return 'usuario_tipo IS NOT NULL';
  }
}
```

---

### 3. Migration 305: Corrigir View `gestores`

**Arquivo:** `database/migrations/305_fix_gestores_view.sql`

**Correção:**

```sql
-- Dropar view incorreta
DROP VIEW IF EXISTS gestores CASCADE;

-- Recriar apontando para tabela correta
CREATE OR REPLACE VIEW gestores AS
SELECT
  cpf,
  nome,
  email,
  tipo_usuario as usuario_tipo,
  CASE
    WHEN tipo_usuario = 'rh' THEN 'RH (Clínica)'
    WHEN tipo_usuario = 'gestor' THEN 'Gestor de Entidade'
    ELSE 'Outro'
  END as tipo_gestor_descricao,
  clinica_id,
  entidade_id,  -- ✅ Usa entidade_id, não tomador_id
  ativo,
  criado_em,
  atualizado_em
FROM usuarios  -- ✅ Busca em usuarios, não funcionarios
WHERE tipo_usuario IN ('rh', 'gestor');
```

**Mudanças principais:**

- ❌ `FROM funcionarios` → ✅ `FROM usuarios`
- ❌ `id` → ✅ `cpf` (PK de usuarios)
- ❌ `tomador_id` → ✅ `entidade_id`
- ❌ `usuario_tipo = 'gestor'` → ✅ `tipo_usuario = 'gestor'`

---

## 🗂️ Estrutura Correta (Referência)

### Tabela `usuarios`

| Campo          | Tipo | Descrição                          |
| -------------- | ---- | ---------------------------------- |
| `cpf`          | PK   | Identificador único                |
| `tipo_usuario` | enum | `rh`, `gestor`, `admin`, `emissor` |
| `clinica_id`   | FK   | Apenas para `rh`                   |
| `entidade_id`  | FK   | Apenas para `gestor`               |

### Tabela `funcionarios`

| Campo          | Tipo | Descrição                                     |
| -------------- | ---- | --------------------------------------------- |
| `cpf`          | PK   | Identificador único                           |
| `usuario_tipo` | enum | `funcionario_clinica`, `funcionario_entidade` |
| `clinica_id`   | FK   | Para `funcionario_clinica`                    |
| `empresa_id`   | FK   | Para `funcionario_clinica`                    |
| `entidade_id`  | FK   | Para `funcionario_entidade`                   |

---

## 🔍 Verificação de Código Morto

**Arquivo:** `app/api/auth/login/route.ts`

**Análise:** Não foi encontrado código morto. O arquivo termina corretamente na linha 321 com o bloco try-catch completo.

**Status:** ✅ OK

---

## 📋 Arquivos Modificados

### Código

- ✅ `lib/usuario-tipo-helpers.ts` - Separação de helpers

### Migrations

- ✅ `database/migrations/305_fix_gestores_view.sql` - Correção da view gestores

### Documentação

- ✅ `docs/RELATORIO_CORRECAO_CODIGO_LEGADO_GESTORES.md` - Este documento

---

## 🎯 Próximos Passos

### Prioridade ALTA

- [ ] **Executar Migration 305** em todos os ambientes (dev, staging, prod)
- [ ] **Buscar usages de `isGestor()`** e migrar para funções específicas
- [ ] **Atualizar queries que usam `getSQLWhereUsuarioTipo('gestor')`**

### Prioridade MÉDIA

- [ ] Verificar outras views que possam ter problema similar
- [ ] Atualizar testes unitários para cobrir os novos helpers
- [ ] Criar lint rule para detectar uso de `isGestor()` deprecated

### Prioridade BAIXA

- [ ] Documentar padrões de nomenclatura em CONTRIBUTING.md
- [ ] Criar diagramas atualizados de relacionamento de tabelas

---

## 📌 Notas Importantes

### Breaking Changes

⚠️ **Sim**, mas controlado:

- `getSQLWhereUsuarioTipo()` mudou assinatura de tipo
- Código que passa `'gestor'` precisa ser atualizado para `'gestor'` ou `'gestor_clinica'`

### Backward Compatibility

✅ Mantida para:

- `isGestor()` - mantido como deprecated
- Views existentes - serão corrigidas pela migration

### Rollback

✅ Possível:

- Fazer rollback da migration 305 restaura view antiga
- Reverter commits no Git para restaurar helpers

---

## 🏁 Conclusão

As correções implementadas resolvem confusões conceituais entre diferentes tipos de gestores no sistema:

- **RH** gerencia **clínicas**
- **Gestor** gerencia **entidades**

A separação clara dessas responsabilidades no código melhora:

- 📖 **Legibilidade** - código autoexplicativo
- 🐛 **Manutenibilidade** - menos bugs
- 🔒 **Segurança** - filtros SQL corretos
- ⚡ **Performance** - queries otimizadas

---

**Status:** ✅ CORREÇÕES IMPLEMENTADAS  
**Versão:** 1.0  
**Autor:** GitHub Copilot  
**Data:** 05 de Fevereiro de 2026

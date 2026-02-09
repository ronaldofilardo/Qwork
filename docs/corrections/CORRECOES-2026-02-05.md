# Correções do Sistema - 5 de fevereiro de 2026

## Problemas Corrigidos

### 1. Erro na Auditoria (entidade_id nulo)

**Problema**: A tabela `auditoria` não permitia `entidade_id` nulo, mas ações como login não têm entidade específica.

**Solução**:

- Alterada a coluna `entidade_id` da tabela `auditoria` para permitir valores NULL
- Modificado o tipo `AuditoriaInput` em `lib/auditoria/auditoria.ts` para `entidade_id?: number | null`

### 2. Erro na View v_tomadores_stats

**Problema**: A view `v_tomadores_stats` não existia, causando erro na API de cobrança.

**Solução**:

- Criada a view que conta funcionários ativos por tomador:

```sql
CREATE VIEW v_tomadores_stats AS
SELECT tomador_id as id, COUNT(*) as funcionarios_ativos
FROM funcionarios
WHERE ativo = true
GROUP BY tomador_id
```

### 3. Erro na Coluna "role" vs "tipo_usuario"

**Problema**: O código usava `tipo_usuario`, mas a tabela tinha coluna `role`.

**Solução**:

- Renomeada a coluna `role` para `tipo_usuario` na tabela `usuarios`
- Corrigido o código em `lib/db.ts` para usar `tipo_usuario` em vez de `role`

### 4. Colunas Faltantes na Tabela usuarios

**Problema**: A tabela `usuarios` não tinha colunas `email`, `senha_hash` e `atualizado_em`.

**Solução**:

- Adicionadas as colunas necessárias à tabela `usuarios`:
  - `email text`
  - `senha_hash text`
  - `atualizado_em timestamp without time zone DEFAULT now()`

## Como Aplicar as Correções

Execute o comando:

```bash
pnpm db:fix-schema
```

Este comando executa o script `scripts/fix-database-schema.js` que aplica todas as correções necessárias de forma segura (usando `IF NOT EXISTS`).

## Status das Correções

- ✅ Auditoria permite entidade_id nulo
- ✅ View v_tomadores_stats criada
- ✅ Tabela usuarios atualizada com colunas necessárias
- ✅ Código sincronizado com schema do banco

## Funcionalidades Afetadas

- Login com auditoria
- Consultas de cobrança
- Criação de emissores independentes

Todas as funcionalidades devem funcionar corretamente após a aplicação das correções.

# Resumo da Implementação - Migration 500

## Data: 2026-02-06

## Status: ✅ Parcialmente Implementado - Necessita Ajustes

### O que foi feito:

1. ✅ **Migração SQL Criada**: [500_segregar_fks_entidades_clinicas.sql](../database/migrations/500_segregar_fks_entidades_clinicas.sql)
2. ✅ **Script PowerShell**: [apply-migration-500-local.ps1](./apply-migration-500-local.ps1)
3. ✅ **Tipos TypeScript Atualizados**:
   - [lib/types/contratacao.ts](../lib/types/contratacao.ts)
   - [lib/types/database.ts](../lib/types/database.ts)
4. ✅ **Progresso Parcial da Migração SQL**:
   - ✅ lotes_avaliacao
   - ✅ contratacao_personalizada
   - ✅ contratos
   - ✅ contratos_planos
   - ✅ entidades_senhas (já correto)
   - ⚠️ recibos (falta ajustar - sem tabela clinicas)

### Descoberta Importante:

O banco local **NÃO tem tabela `clinicas` separada**. A estrutura é:

- Tabela `entidades` com campo `tipo` = 'clinica' | 'entidade'
- Não há necessidade de FK para `clinicas(id)`
- `clinica_id` em outras tabelas provavelmente referencia `entidades.id` onde `tipo='clinica'`

### O que falta fazer:

#### 1. **Ajustar Migração SQL** (Simplificar)

- ❌ Remover tentativas de criar FK para `clinicas` (não existe)
- ✅ Focar em renomear `contratante_id` → `entidade_id`
- ❌ Completar tabelas restantes:
  - recibos
  - empresas_clientes
  - notificacoes_admin
  - tokens_retomada_pagamento
  - audit_logs
  - pagamentos
  - funcionarios (se necessário)

#### 2. **Executar Migração Completa**

```powershell
echo "s" | pwsh -ExecutionPolicy Bypass -File .\scripts\apply-migration-500-local.ps1
```

#### 3. **Atualizar Código TypeScript** (PENDENTE)

Arquivos com `contratante_id` (grep mostrou 200+ matches):

- app/api/\*_/_.ts (50+ arquivos)
- **tests**/\*_/_.ts (150+ arquivos)
- lib/\*_/_.ts (alguns arquivos)
- cypress/\*_/_.ts

**Estratégia**: Busca e substituição sistemática considerando contexto:

- Em queries SQL: `contratante_id` → `entidade_id`
- Em sessões: `session.contratante_id` → `session.entidade_id`
- Em tipos/interfaces: já feito nos tipos principais

#### 4. **Atualizar Views SQL** (P ENDENTE)

- Recriar `vw_recibos_completos` (foi dropada)
- Recriar `vw_recibos_completos_mat` (foi dropada)
- Criar novas views usando `entidade_id`

#### 5. **Recriar RLS Policies** (PENDENTE)

Policies dropadas que precisam ser recriadas usando `entidade_id`:

- lotes_avaliacao policies
- laudos policies
- funcionarios policies
- avaliacoes policies
- contratos policies
- pagamentos policies

#### 6. **Build e Testes**

```bash
npm run build
npm run test:unit
npm run test:integration
```

### Comando para Próximos Passos:

1. **Completar migração SQL simplificada** (sem referências a clinicas):

```sql
-- Para cada tabela restante, simplesmente:
ALTER TABLE tabela ADD COLUMN entidade_id INTEGER;
ALTER TABLE tabela DROP COLUMN contratante_id CASCADE;
ALTER TABLE tabela ADD CONSTRAINT fk_entidade
  FOREIGN KEY (entidade_id) REFERENCES entidades(id);
```

2. **Executar migração no banco**

3. **Busca e substituição em massa no código TypeScript**:

```powershell
# Buscar todos os arquivos com contratante_id
rg "contratante_id" --type ts -l | wc -l

# Substituir em massa (com cuidado!)
# Revisar arquivo por arquivo APIs críticas primeiro
```

### Notas Importantes:

- ⚠️ Banco está **vazio**, então não há risco de perda de dados
- ✅ Mudanças nos tipos TypeScript já foram feitas
- ⚠️ Muitas APIs ainda usam `contratante_id` - precisa atualização em massa
- ✅ Script de migração local criado e testado parcialmente
- ⚠️ RLS policies precisam ser recriadas após migração

### Tempo Estimado Restante:

- Ajustar migração SQL: 30 min
- Executar migração: 5 min
- Atualizar código TS (APIs): 2-3 horas
- Atualizar código TS (testes): 1-2 horas
- Recriar views/policies: 1 hora
- Build e testes: 30 min
- **TOTAL**: ~5-7 horas

### Recomendação:

Dado o volume de mudanças e que o banco está vazio, considerar:

1. Completar migração SQL primeiro
2. Fazer atualização sistemática do código em batches por módulo
3. Testar incrementalmente cada módulo atualizado
4. Priorizar módulos críticos (auth, pagamento, core APIs)

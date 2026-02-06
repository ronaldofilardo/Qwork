# Guia de Migração 400 - Correção Estrutural

**Data:** 05 de Fevereiro de 2026  
**Autor:** Sistema de Migração Automática  
**Prioridade:** 🔴 CRÍTICA  
**Status:** Pronto para execução

---

## 📋 Sumário Executivo

Esta migração corrige a estrutura fundamental do sistema para refletir a organização correta de entidades, clínicas, empresas e funcionários.

### Mudanças Principais:

1. **Remoção de `gestor`** → Usar apenas `gestor`
2. **Entidades geram funcionários DIRETAMENTE** (sem clínica/empresa intermediária)
3. **Clínicas gerenciam EMPRESAS** (tabela `empresas_clientes`)
4. **Empresas vinculadas a clínicas** (`empresas_clientes.clinica_id NOT NULL`)

---

## 🎯 Problema Identificado

### Estrutura INCORRETA (Antes):

```
❌ tipo_usuario = 'gestor' (nome inconsistente)
❌ Entidades → Clínicas → Empresas → Funcionários (hierarquia errada)
❌ empresas_clientes.clinica_id pode ser NULL (permite empresas órfãs)
❌ Confusão sobre quem gera o quê
```

### Estrutura CORRETA (Depois):

```
✅ tipo_usuario = 'gestor' (padronizado)
✅ Entidades [gestor] → Funcionários diretos
✅ Clínicas [rh] → Empresas → Funcionários
✅ empresas_clientes.clinica_id NOT NULL (sempre vinculado)
✅ Separação clara de responsabilidades
```

---

## 🏗️ Arquitetura Correta

### Fluxo ENTIDADE:

```
┌─────────────┐
│  ENTIDADE   │ (gestor)
│  [gestor]   │
└──────┬──────┘
       │
       │ gera DIRETAMENTE
       │
       ▼
┌─────────────┐
│FUNCIONÁRIOS │
│  (entidade) │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────┐
│ AVALIAÇÕES  │───▶│  LOTES  │
└─────────────┘    └─────────┘
```

### Fluxo CLÍNICA:

```
┌─────────────┐
│   CLÍNICA   │ (rh)
│    [rh]     │
└──────┬──────┘
       │
       │ gerencia
       │
       ▼
┌─────────────┐
│  EMPRESAS   │ (clientes)
│ clinica_id  │ ← NOT NULL
└──────┬──────┘
       │
       │ tem
       │
       ▼
┌─────────────┐
│FUNCIONÁRIOS │
│  (empresa)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────┐
│ AVALIAÇÕES  │───▶│  LOTES  │
└─────────────┘    └─────────┘
```

---

## 📊 Impacto da Migração

### Tabelas Afetadas:

| Tabela              | Mudança                         | Risco    |
| ------------------- | ------------------------------- | -------- |
| `usuarios`          | `tipo_usuario: gestor → gestor` | 🟡 MÉDIO |
| `usuario_tipo_enum` | Remover valor `gestor`          | 🟡 MÉDIO |
| `empresas_clientes` | `clinica_id` → NOT NULL         | 🔴 ALTO  |
| `funcionarios`      | Ajustar constraints owner_check | 🟡 MÉDIO |
| `gestores` (view)   | Atualizar WHERE clause          | 🟢 BAIXO |

### Código Afetado:

- ✅ `lib/types/enums.ts` - Enum gestor → GESTOR
- ✅ `lib/config/roles.ts` - ROLES.gestor → ROLES.GESTOR
- ✅ `lib/usuario-tipo-helpers.ts` - Funções e SQL helpers
- ✅ `lib/db.ts` - criarContaResponsavel()
- ✅ `app/api/auth/login/route.ts` - Verificação de tipo
- ✅ `docs/DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md` - Documentação

---

## 🚀 Plano de Execução

### Pré-Requisitos:

1. ✅ Backup completo do banco de dados
2. ✅ Executar em horário de baixo tráfego
3. ✅ Ter plano de rollback preparado
4. ✅ Validar ambiente de teste primeiro

### Passos:

#### 1. Backup (OBRIGATÓRIO)

```bash
# Backup local
pg_dump -h localhost -U postgres -d nr-bps_db > backup_pre_migration_400.sql

# Backup produção (Neon)
# Usar interface web do Neon para criar snapshot
```

#### 2. Executar Migração

```bash
# Desenvolvimento
psql -h localhost -U postgres -d nr-bps_db -f database/migrations/400_corrigir_estrutura_entidades_empresas.sql

# Produção (após validar em dev)
# Conectar ao Neon e executar o arquivo
```

#### 3. Validações Pós-Migração

```sql
-- Verificar que não existem mais gestor
SELECT COUNT(*) FROM usuarios WHERE tipo_usuario = 'gestor';
-- Resultado esperado: 0

-- Verificar view gestores
SELECT COUNT(*) FROM gestores;
SELECT COUNT(*) FROM gestores WHERE usuario_tipo = 'gestor';
SELECT COUNT(*) FROM gestores WHERE usuario_tipo = 'rh';

-- Verificar empresas órfãs
SELECT COUNT(*) FROM empresas_clientes WHERE clinica_id IS NULL;
-- Resultado esperado: 0

-- Verificar funcionários de entidade
SELECT COUNT(*) FROM funcionarios
WHERE usuario_tipo = 'funcionario_entidade'
AND entidade_id IS NOT NULL
AND clinica_id IS NULL
AND empresa_id IS NULL;
```

#### 4. Reiniciar Aplicação

```bash
# Desenvolvimento
pnpm dev

# Produção
# Deploy via Vercel
```

---

## 🧪 Testes Necessários

### Testes Funcionais:

- [ ] Login como gestor (tipo_usuario = 'gestor')
- [ ] Login como RH (tipo_usuario = 'rh')
- [ ] Gestor consegue criar funcionários diretos
- [ ] RH consegue criar empresas
- [ ] RH consegue criar funcionários de empresas
- [ ] View gestores retorna dados corretos
- [ ] Constraints impedem dados inválidos

### Testes de Segurança:

- [ ] RLS filtra corretamente por entidade_id
- [ ] RLS filtra corretamente por clinica_id
- [ ] Gestor NÃO vê dados de outras entidades
- [ ] RH NÃO vê dados de outras clínicas

---

## ⚠️ Riscos e Mitigações

### Risco 1: Empresas Órfãs

**Problema:** Empresas sem `clinica_id` causarão erro com constraint NOT NULL

**Mitigação:**

- Migração cria clínica padrão se necessário
- Tenta recuperar `clinica_id` de funcionários existentes
- Log de warning para revisão manual

### Risco 2: Enum com Referências

**Problema:** Não é possível remover valor do enum se ainda houver referências

**Mitigação:**

- Migração primeiro atualiza todos os registros
- Depois cria novo enum sem `gestor`
- Rollback automático se falhar

### Risco 3: Código Legado

**Problema:** Código ainda pode referenciar `gestor`

**Mitigação:**

- Principais arquivos já atualizados
- Buscar por "gestor" no código
- Atualizar conforme necessário

---

## 🔄 Rollback

### Se a migração falhar:

```sql
-- 1. Restaurar backup
psql -h localhost -U postgres -d nr-bps_db < backup_pre_migration_400.sql

-- 2. Reverter código
git revert <commit_hash>

-- 3. Reiniciar aplicação
pnpm dev
```

---

## 📝 Checklist de Execução

### Pré-Migração:

- [ ] Backup criado e validado
- [ ] Migração testada em ambiente local
- [ ] Equipe notificada
- [ ] Horário de manutenção agendado

### Durante Migração:

- [ ] Aplicação pausada (produção)
- [ ] Migração SQL executada
- [ ] Validações pós-migração OK
- [ ] Logs revisados

### Pós-Migração:

- [ ] Aplicação reiniciada
- [ ] Testes funcionais OK
- [ ] Testes de segurança OK
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

---

## 📚 Documentação Relacionada

- [DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md](./DIAGRAMA_ESTRUTURA_GESTORES_FUNCIONARIOS.md)
- [Migration 400 SQL](../database/migrations/400_corrigir_estrutura_entidades_empresas.sql)
- [Enums TypeScript](../lib/types/enums.ts)
- [Helpers de Usuário](../lib/usuario-tipo-helpers.ts)

---

## 🆘 Suporte

Em caso de problemas durante a migração:

1. **PARE imediatamente** a execução
2. **Reverta** usando o backup
3. **Documente** o erro encontrado
4. **Contate** a equipe de desenvolvimento

---

**Última atualização:** 05 de Fevereiro de 2026  
**Versão:** 1.0

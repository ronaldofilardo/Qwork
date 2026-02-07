# Checklist de Testes - Migração Contratantes para Tomadores

## Data: 2026-02-06

## ✅ Mudanças Implementadas

### 1. Banco de Dados

- [x] Tabela `contratantes_snapshots` removida
- [x] Tabela `contratantes` renomeada para `tomadores_legacy`
- [x] View `tomadores` criada (une entidades e clínicas)
- [x] Primary key e sequence renomeadas

### 2. Código Base

- [x] Interface `Session` atualizada (removido `contratante_id` deprecated)
- [x] API `account-info` atualizada (removidas referências a snapshots)
- [x] Componente `AdminSidebar` atualizado (Contratantes → Tomadores)
- [x] Componente `ContratantesContent` renomeado para `TomadoresContent`
- [x] Página `app/admin/page.tsx` atualizada
- [x] Tipos e interfaces atualizados

### 3. Terminologia

- **Tomadores**: Clientes do QWork (entidades ou clínicas) - uso no dashboard admin
- **Entidade**: Empresa privada contratante (gestor de entidade)
- **Clínica**: Clínica de medicina ocupacional (gestor RH)

## 🧪 Testes a Executar

### Testes Críticos (Executar Primeiro)

#### 1. Validação do Banco de Dados

```powershell
# Verificar estrutura
$env:PGPASSWORD='123456'; psql -U postgres -d nr-bps_db_test -c "\d+ tomadores_legacy"
$env:PGPASSWORD='123456'; psql -U postgres -d nr-bps_db_test -c "\d+ tomadores"
$env:PGPASSWORD='123456'; psql -U postgres -d nr-bps_db_test -c "SELECT tipo, COUNT(*) FROM tomadores GROUP BY tipo;"
```

#### 2. Testes de Componentes

```powershell
# Testar componentes admin (necessita ajustes nos testes)
pnpm test __tests__/components/admin/AdminSidebar.test.tsx --run
```

#### 3. Testes de API

```powershell
# Testar API de account-info (RH)
pnpm test __tests__/rh/account-info.test.ts --run
```

#### 4. Validação Manual

- [ ] Acessar dashboard admin
- [ ] Verificar sidebar mostra "Tomadores"
- [ ] Verificar subseções "Clínicas" e "Entidades"
- [ ] Verificar listagem de tomadores

## ⚠️ Testes que Precisam Atualização

### Testes de RLS/Security

- `__tests__/security/rls-rbac.test.ts` - Referências a contratante_id
- `__tests__/security/rls-contratacao.test.ts` - Referências a contratante_id
- `__tests__/security/correcoes-criticas-seguranca.test.ts` - Policies com contratante_id

### Testes de Unit

- `__tests__/unit/cadastro-bifurcacao-logica.test.ts` - Usa contratante_id
- `__tests__/rh/fluxo-completo-personalizado.test.ts` - Usa CONTRATANTE_ID

### Testes de Components

- `__tests__/rh/account-info.test.ts` - Testa fallback com contratante_id (pode remover)

## 📝 Notas Importantes

### Foreign Keys Existentes

- Muitas tabelas ainda têm coluna `contratante_id` referenciando `tomadores_legacy`
- Isso é intencional para compatibilidade temporária
- Migração futura deverá substituir por `entidade_id` ou `clinica_id` conforme tipo

### Manter Como Está

- `ModalCadastroContratante` - Nome mantido pois trata do processo de cadastro
- Testes relacionados a `ModalCadastroContratante` - Sem alterações
- APIs de `contratacao_personalizada` - Usa contratante_id (ok por ora)

### Arquitetura Segregada

```
Tomadores (clientes do QWork)
├── Entidades (empresas privadas)
│   └── Gestor (perfil: gestor, entidade_id)
└── Clínicas (medicina ocupacional)
    └── Gestor RH (perfil: rh, clinica_id)
```

## 🔄 Próximos Passos

1. **Executar Validações Básicas** ✅
   - [ ] Banco de dados
   - [ ] Compilação TypeScript
   - [ ] Testes unitários críticos

2. **Atualizar Testes** (Próxima Sprint)
   - [ ] Atualizar testes de RLS
   - [ ] Atualizar testes de API
   - [ ] Criar novos testes para view tomadores

3. **Migração de Foreign Keys** (Futuro)
   - [ ] Identificar tabelas com contratante_id
   - [ ] Criar colunas entidade_id/clinica_id
   - [ ] Migrar dados
   - [ ] Remover coluna contratante_id
   - [ ] Dropar tabela tomadores_legacy

4. **Documentação** ✅
   - [x] Atualizar CHECKLIST_TESTES.md
   - [ ] Atualizar documentação de arquitetura
   - [ ] Criar guia de migração para desenvolvedores

## ✅ Validação Final

### Checklist de Aprovação

- [x] Banco de dados migrado com sucesso
- [x] View tomadores funcional
- [x] Sessão não usa mais contratante_id
- [x] UI atualizada (Tomadores no sidebar)
- [ ] Testes automatizados passando
- [ ] Validação manual bem-sucedida
- [ ] Documentação atualizada

### Comandos de Validação Rápida

```powershell
# 1. Verificar compilação
pnpm build

# 2. Verificar tipos
pnpm type-check

# 3. Executar testes unitários
pnpm test -- --run

# 4. Validar banco
$env:PGPASSWORD='123456'; psql -U postgres -d nr-bps_db_test -f "c:\apps\QWork\sql-files\migracao-contratantes-para-tomadores.sql"
```

## 📊 Métricas

- **Arquivos Modificados**: 5
  - lib/session.ts
  - app/api/rh/account-info/route.ts
  - components/admin/AdminSidebar.tsx
  - components/admin/TomadoresContent.tsx (renomeado)
  - app/admin/page.tsx

- **Arquivos Criados**: 1
  - sql-files/migracao-contratantes-para-tomadores.sql

- **Tabelas Afetadas**:
  - contratantes → tomadores_legacy (renomeada)
  - contratantes_snapshots (removida)

- **Views Criadas**:
  - tomadores (une entidades + clínicas)

---

**Status**: ✅ Migração Base Concluída - Validação em Andamento  
**Próxima Ação**: Executar testes de validação e atualizar testes automatizados conforme necessário

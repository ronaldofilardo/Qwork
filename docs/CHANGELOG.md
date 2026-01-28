# Changelog

## [2026-01-22] - Correção de Migrações Pós-Reset do Banco

### 🔧 Fixed

#### Database Schema

- ✅ **Adicionada coluna `hash_pdf`**:
  - Em `lotes_avaliacao` para integridade de PDFs de lotes
  - Em `laudos` para integridade de PDFs de laudos
  - Tipo: `VARCHAR(64)` para armazenar hash SHA-256

- ✅ **Criada tabela `contratantes_senhas`**:
  - Armazena senhas hash bcrypt para gestores de entidades
  - Campos: `contratante_id`, `cpf`, `senha_hash`, `primeira_senha_alterada`
  - Corrige erro: "relação contratantes_senhas não existe"

- ✅ **Criado sistema de planos**:
  - Enum `tipo_plano`: `'personalizado'`, `'fixo'`
  - Tabela `planos`: catálogo de planos disponíveis
  - Tabela `contratos_planos`: associação entidade/clínica com plano
  - Planos padrão inseridos: Básico (50 func) e Premium (200 func)

- ✅ **Criada tabela `mfa_codes`**:
  - Sistema de autenticação multifator para funcionários
  - Campos: `cpf`, `code`, `expires_at`, `used`

#### Test Data

- ✅ **Contratante entidade de teste criado**:
  - ID: 1, Tipo: entidade
  - CPF: 00000000000
  - Senha: 123456 (hash bcrypt)
  - Corrige erro: "Contratante 1 não encontrado ou não é entidade"

### 📁 Files Changed

- **Created:** `database/fixes/fix-missing-migrations-post-reset.sql` - Script consolidado de correção
- **Created:** `docs/corrections/correcao-migracoes-pos-reset-2026-01-22.md` - Documentação detalhada

### 🐛 Bugs Fixed

- ❌ Erro 500 em `/api/entidade/lotes`: coluna hash_pdf ausente → ✅ Resolvido
- ❌ Erro 500 em `/api/planos`: tabela planos não existe → ✅ Resolvido
- ❌ Erro 500 em `/api/auth/login`: tabela contratantes_senhas não existe → ✅ Resolvido
- ❌ Erro 500 em rotas `/api/entidade/*`: entidade não encontrada → ✅ Resolvido

---

## [BREAKING] 2026-01-15 - Remoção do Estado 'Rascunho' e Emissão Imediata

### 🚨 BREAKING CHANGES

#### Removido

- ❌ **Estado 'rascunho' eliminado completamente**:
  - Removido de `StatusLote` enum (apenas: `ativo`, `cancelado`, `finalizado`, `concluido`)
  - Removido de `StatusLaudo` enum (apenas: `emitido`, `enviado`)
  - Todos os lotes em 'rascunho' migrados para 'ativo'
  - Todos os laudos em 'rascunho' migrados para 'emitido'

- ❌ **Cron jobs de emissão desabilitados**:
  - Removido `/api/cron/emitir-laudos-auto`
  - Removido `/api/system/auto-laudo`
  - Removido cron de relatório semanal

- ❌ **Edição de observações bloqueada**:
  - `PUT /api/emissor/laudos/[loteId]` retorna 403
  - Edição só permitida via endpoint de emergência com justificativa

#### Adicionado

- ✨ **Emissão imediata automática**:
  - Laudos são emitidos automaticamente quando lote chega ao emissor
  - `GET /api/emissor/laudos/[loteId]` dispara `gerarLaudoCompletoEmitirPDF()`
  - PDF gerado e status definido como 'emitido' imediatamente

- ✨ **Endpoint de emergência mantido**:
  - `POST /api/emissor/laudos/[loteId]/emergencia` ainda disponível
  - Requer `justificativa` obrigatória (mínimo 10 caracteres)
  - Registra auditoria completa

- 📝 **Nova migração**: `013_remove_rascunho_status.sql`
  - Migra dados existentes automaticamente
  - Atualiza enums do PostgreSQL
  - Valida ausência de registros 'rascunho'

#### Modificado

- 🔄 **Tipos atualizados**:
  - `lib/types/enums.ts` - Enums sem 'rascunho'
  - `lib/types/database.ts` - Interfaces atualizadas
  - `lib/laudo-tipos.ts` - LaudoPadronizado sem 'rascunho'

- 🔄 **Lógica de lotes simplificada**:
  - `lib/lotes.ts` - Status padrão agora é 'ativo'
  - Removidas referências a 'rascunho' nos comentários

- 🔄 **API de laudos refatorada**:
  - GET dispara emissão imediata
  - PUT bloqueado (403)
  - PATCH mantido para transição enviado

#### Impacto Operacional

**Para Emissores:**

- Laudos são gerados automaticamente ao acessar lote concluído
- Não há mais fase de "edição de rascunho"
- Para intervenções, usar endpoint de emergência

**Para Desenvolvedores:**

- Testes que esperam 'rascunho' precisam ser atualizados
- Fixtures de teste devem usar 'emitido' ou 'enviado'
- Mocks de status devem refletir nova máquina de estados

#### Migração de Dados

Execute a migração SQL:

```bash
psql -U postgres -d nr-bps_db -f database/migrations/013_remove_rascunho_status.sql
```

Validação pós-migração:

```sql
-- Deve retornar 0 para ambas
SELECT COUNT(*) FROM lotes_avaliacao WHERE status::text = 'rascunho';
SELECT COUNT(*) FROM laudos WHERE status::text = 'rascunho';
```

#### Documentação Atualizada

- `docs/MAQUINA-ESTADO-SIMPLIFICADA.md` - Nova documentação de fluxo
- `docs/copilot-instructions.md` - Instruções atualizadas

---

## Unreleased

### 🏗️ Refatoração - Sprint 2 (13/01/2026)

#### Added

- ✨ **Nova estrutura PDF**: `lib/infrastructure/pdf/{generators,templates}/`
- ✨ **Rota refatorada**: `app/api/pagamento/route.refactored.ts` (376→80 linhas, -79%)
- ✨ **Schemas Zod**: `app/api/pagamento/schemas.ts` com validação type-safe
- ✨ **Handlers separados**: `app/api/pagamento/handlers.ts` para lógica de negócio
- ✨ **Exports centralizados**: `lib/infrastructure/pdf/index.ts`
- 📚 **Documentação Sprint 2**: `docs/architecture/SPRINT-2-COMPLETO.md`

#### Changed

- 🔄 **Migrados para infrastructure/pdf/generators/**:
  - `receipt-generator.ts`, `pdf-generator.ts`, `pdf-laudo-generator.ts`, `pdf-relatorio-generator.ts`
- 🔄 **Migrados para infrastructure/pdf/templates/**:
  - `recibo-template.ts`
- Laudos (PDF) agora são armazenados localmente em `storage/laudos` em vez de persistir o binário no banco de dados. Metadados (hash, criadoEm, arquivo) são gravados como `laudo-<id>.json`.

#### Maintained

- ✅ **Compatibilidade retroativa**: Re-exports em `lib/` mantêm imports antigos funcionando
- ✅ **Zero breaking changes**: Todo código existente continua operacional

#### Metrics

- 📉 **Redução de boilerplate**: 296 linhas eliminadas em rota de pagamento
- 🔒 **Type safety**: 100% validação automática com Zod
- ✅ **Testabilidade**: Handlers isolados facilitam testes unitários

### Changed

- Laudos (PDF) agora são armazenados localmente em `storage/laudos` em vez de persistir o binário no banco de dados. Metadados (hash, criadoEm, arquivo) são gravados como `laudo-<id>.json`.

### Added

- `docs/guides/ARMAZENAMENTO-LAUDOS.md` — documentação sobre o novo comportamento e instruções de backfill/migração.
- `scripts/backfill/laudos-backfill.ts` — script para exportar arquivos do DB para `storage/laudos` (modo dry-run por padrão).
- `database/migrations/070_remove_laudo_binary_columns.sql` — migration stub para remover colunas binárias (executar após backfill validado).

---

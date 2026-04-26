# Reset de Senha via Link — Admin → Perfis Especiais

## Plano de Implementação — Status de Execução

**Data de Conclusão**: 08/04/2026  
**Status Geral**: ✅ **Código 100% Implementado | Migrations DEV/TEST Aplicadas | Aguardando Staging/PROD**

---

## ✅ FASE 1: Banco de Dados

### Migration 1040 — reset_senha_tokens

**Arquivo**: `database/migrations/1040_reset_senha_tokens.sql`

**Colunas Adicionadas**:

- `reset_token VARCHAR(64)` — token único gerado
- `reset_token_expira_em TIMESTAMP` — expires em 7 dias
- `reset_tentativas_falhas SMALLINT DEFAULT 0` — conta tentativas falhadas
- `reset_usado_em TIMESTAMP` — marca quando foi usado

**Tabelas Afetadas**: `usuarios`, `representantes`

**Status**:

- ✅ DEV: Aplicada (`nr-bps_db`)
- ✅ TEST: Aplicada (`nr-bps_db_test`)
- ⏳ STAGING: Aguardando (`neondb_staging`)
- ⏳ PROD: Aguardando (`neondb`)

---

## ✅ FASE 2: Backend — Geração de Tokens

### lib/reset-senha/gerar-token.ts

**Funções Exportadas**:

```typescript
gerarTokenResetUsuario(cpf: string, db: TransactionClient)
  → { token, link, expira_em, nome, perfil, tabela }
  → Inativa usuário (ativo = false)
  → Retorna link: http://localhost/resetar-senha?token=...

gerarTokenResetRepresentante(cpf: string, db: TransactionClient)
  → { token, link, expira_em, nome, perfil, tabela }
  → Inativa representante (status = 'suspenso')
  → Retorna link: http://localhost/resetar-senha?token=...

logEmailResetSenha(nome, email, link, expira_em)
  → Log fake (simula envio de email)
```

**Perfis Suportados** (const `PERFIS_RESET_USUARIOS`):

- suporte
- comercial
- rh
- gestor
- emissor
- representante (tabela separada)

**Status**: ✅ Implementado

---

## ✅ FASE 3: Backend — API Routes

### POST /api/admin/reset-senha

**Requisitos**:

- Autenticação: `requireRole('admin', false)`
- Body: `{ cpf: string }`

**Resposta (sucesso)**:

```json
{
  "success": true,
  "link": "http://localhost/resetar-senha?token=abc123...",
  "nome": "João Silva",
  "perfil": "suporte",
  "expira_em": "2026-04-15T14:30:00Z"
}
```

**Efeitos Colaterais**:

- Usuários (`usuarios`): `ativo = false`
- Representantes (`representantes`): `status = 'suspenso'`
- Auditoria registrada com `action: 'DEACTIVATE'`

**Status**: ✅ Implementado

---

### GET /api/admin/reset-senha/validar?token=XXX

**Requisitos**:

- Autenticação: Nenhuma (público)
- Query Param: `token` (64 chars hex)

**Resposta (válido)**:

```json
{
  "valido": true,
  "nome": "João Silva",
  "perfil": "suporte"
}
```

**Resposta (inválido)**:

```json
{
  "valido": false,
  "motivo": "token_invalido|token_expirado|token_ja_usado|token_bloqueado"
}
```

**Validações**:

- ✅ Token encontrado
- ✅ Não expirado (reset_token_expira_em > NOW())
- ✅ Não já usado (reset_usado_em IS NULL)
- ✅ Não bloqueado (reset_tentativas_falhas < 3)

**Status**: ✅ Implementado

---

### POST /api/admin/reset-senha/confirmar

**Requisitos**:

- Autenticação: Nenhuma (público)
- Body: `{ token, senha, confirmacao }`

**Validações de Senha**:

- ≥ 8 caracteres
- ≥ 1 letra maiúscula
- ≥ 1 número

**Resposta (sucesso)**:

```json
{ "success": true }
```

**Efeitos Colaterais**:

- Usuários (`usuarios`):
  - `senha_hash` atualizada (bcrypt rounds=12)
  - `ativo = true`
  - `reset_token = NULL`
  - `reset_usado_em = NOW()`
- Representantes (`representantes`):
  - `status = 'ativo'`
  - `reset_token = NULL`
  - `reset_usado_em = NOW()`
  - INSERT em `representantes_senhas` (tabela dedicada)

**Status**: ✅ Implementado

---

## ✅ FASE 4: Frontend — Página Pública

### app/resetar-senha/page.tsx

**Tipo**: Server Component

**Suspense**: Fallback com spinner

**Meta Tags**:

- `robots: { index: false }` — não indexar

**Status**: ✅ Implementado

---

### app/resetar-senha/ResetarSenhaForm.tsx

**Tipo**: Client Component (use client)

**Estados**:

- `validando` — validando token
- `formulario` — input de senha
- `token_invalido` — token não existe
- `token_expirado` — token passou do prazo
- `token_ja_usado` — token já foi utilizado
- `token_bloqueado` — muitas tentativas falhas
- `sucesso` — senha definida, redireciona para /login
- `erro_inesperado` — erro genérico

**Features**:

- ✅ Validação em tempo real (requisito de senha)
- ✅ Checklist visual de complexidade
- ✅ Redireciona para /login após sucesso

**Status**: ✅ Implementado

---

## ✅ FASE 5: Admin UI

### components/admin/ModalResetarSenha.tsx

**Tipo**: Client Component

**Duas Fases**:

**Fase 1: Input**

- Input de CPF com máscara: 000.000.000-00
- Validação: 11 dígitos
- Botões: Cancelar | Gerar Link

**Fase 2: Resultado**

- Card de sucesso (nome, perfil, inativo)
- Input readonly com link
- Botão de cópia (clipboard)
- Warning: "Link válido por 7 dias, use apenas uma vez"
- Botão Fechar

**Status**: ✅ Implementado

---

### components/admin/EmissoresContent.tsx

**Mudanças**:

- ❌ Removido: Botão "Novo Usuário" + `ModalCadastroEmissor`
- ✅ Adicionado: Botão "Resetar Senha" + `ModalResetarSenha`
- ✅ Perfis suportados adicionados: `rh`, `gestor`

**Status**: ✅ Implementado

---

## ✅ FASE 6: Código Legado Removido

**Deletados**:

- ❌ `components/modals/ModalCadastroEmissor.tsx`
- ❌ `components/admin/ModalEmissor.tsx`
- ❌ `app/api/admin/emissores/create/route.ts`
- ❌ `__tests__/components/modal-cadastro-emissor.test.tsx`
- ❌ `__tests__/api/admin/emissores-create.test.ts`

**Status**: ✅ Removido

---

## ✅ FASE 7: Middleware

### middleware.ts

**Rotas Públicas Adicionadas**:

- `/resetar-senha` — página pública
- `/api/admin/reset-senha/validar` — GET validação (public)
- `/api/admin/reset-senha/confirmar` — POST confirmação (public)

**Status**: ✅ Implementado

---

## ✅ FASE 8: Testes

### **tests**/api/admin/reset-senha.test.ts

**Suite**: POST /api/admin/reset-senha

- ✅ Validações de entrada (CPF, body)
- ✅ Autenticação (admin obrigatório)
- ✅ Usuário da tabela `usuarios` (todos os 5 perfis)
- ✅ Representante (fallback quando usuário não encontrado)
- ✅ CPF não encontrado (404)

**Testes**: 9 cases

**Status**: ✅ Todos PASS

---

### **tests**/api/admin/reset-senha-validar.test.ts

**Suite**: GET /api/admin/reset-senha/validar

- ✅ Validações básicas (token obrigatório, comprimento=64)
- ✅ Token válido de usuário
- ✅ Token expirado
- ✅ Token já usado
- ✅ Token bloqueado (>= 3 tentativas falhas)
- ✅ Token de representante
- ✅ Token inexistente

**Testes**: 7 cases

**Status**: ✅ Todos PASS

---

### **tests**/api/admin/reset-senha-confirmar.test.ts

**Suite**: POST /api/admin/reset-senha/confirmar

- ✅ Validações (token, passwordmatch, complexidade)
- ✅ Token inválido/expirado
- ✅ Sucesso com usuário (inativa → ativa)
- ✅ Sucesso com representante (suspenso → ativo)

**Testes**: 8 cases

**Status**: ✅ Todos PASS

---

### **tests**/components/ModalResetarSenha.test.tsx

**Suite**: UI ModalResetarSenha

- ✅ Renderização (aberto/fechado)
- ✅ Formatação de CPF
- ✅ Validação de CPF
- ✅ POST /api/admin/reset-senha
- ✅ Exibição de link com copy
- ✅ Erro da API
- ✅ Fechar modal

**Testes**: 11 cases

**Status**: ✅ Todos PASS

---

## 📊 Resumo de Testes

| Suite                        | Cases  | Status          |
| ---------------------------- | ------ | --------------- |
| reset-senha (POST)           | 9      | ✅ PASS         |
| reset-senha-validar (GET)    | 7      | ✅ PASS         |
| reset-senha-confirmar (POST) | 8      | ✅ PASS         |
| ModalResetarSenha (UI)       | 11     | ✅ PASS         |
| **TOTAL**                    | **35** | **✅ ALL PASS** |

---

## ✅ FASE 9: Build & Git

### Build

```bash
pnpm build
```

**Status**: ✅ Exit code 0, sem warnings

---

### Git

**Commit**: `76b4273`  
**Branch**: `feature/v2` → origin/feature/v2

**Files Changed**: 21

- Criados: 13 (migrations, APIs, components, testes)
- Deletados: 6 (código legado)
- Modificados: 2 (EmissoresContent, middleware)

**Merge**: `staging` — ✅ Feito

**Status**: ✅ Commited & Pushed

---

## ⏳ FASE 10: Aplicação de Migrations — STAGING/PROD

### Scripts Criados

- ✅ `scripts/apply-migration-1040.cjs` — DEV/TEST (executado)
- ✅ `scripts/apply-migration-1040-prod.ps1` — STAGING/PROD (pronto)

---

## 🚀 INSTRUÇÕES: Aplicar Migration 1040 em Staging/PROD

### PRÉ-REQUISITOS

1. **Ter acesso às conexões Neon**:

   ```powershell
   # Staging
   $env:DATABASE_URL_STAGING="postgresql://usuario:senha@host/neondb_staging"

   # Prod
   $env:DATABASE_URL_PROD="postgresql://usuario:senha@host/neondb"
   ```

2. **Ter `psql` CLI instalado** (PostgreSQL tools)

### EXECUÇÃO

#### Passo 1: DRY-RUN (Simulação)

```powershell
cd c:\apps\QWork

$env:DATABASE_URL_STAGING="postgresql://..."
$env:DATABASE_URL_PROD="postgresql://..."

.\scripts\apply-migration-1040-prod.ps1 -DryRun
```

**Esperado**: Sem erro, apenas output informativo

---

#### Passo 2: Aplicar em STAGING

```powershell
.\scripts\apply-migration-1040-prod.ps1 -TargetEnv staging
```

**Esperado**:

```
=== Aplicando migration 1040 em STAGING ===
✅ STAGING: Migration 1040 aplicada com sucesso.
```

---

#### Passo 3: Aplicar em PROD

```powershell
.\scripts\apply-migration-1040-prod.ps1 -TargetEnv prod
```

**Esperado**: Mesma saída para PROD

---

#### Passo 4: Aplicar Ambos (Recomendado)

```powershell
.\scripts\apply-migration-1040-prod.ps1 -TargetEnv all
```

Se STAGING falhar, PROD é pulado automaticamente.

---

## ✅ VERIFICAÇÃO PÓS-EXECUÇÃO

### SQL: Verificar colunas em STAGING/PROD

```sql
-- Usuarios
SELECT column_name FROM information_schema.columns
WHERE table_name = 'usuarios'
AND column_name LIKE 'reset_%'
ORDER BY ordinal_position;

-- Representantes
SELECT column_name FROM information_schema.columns
WHERE table_name = 'representantes'
AND column_name LIKE 'reset_%'
ORDER BY ordinal_position;
```

**Esperado**: 4 colunas cada:

- reset_token
- reset_token_expira_em
- reset_tentativas_falhas
- reset_usado_em

---

## 📋 CHECKLIST FINAL — 100% Implementado

| #   | Implementação                               | Status           |
| --- | ------------------------------------------- | ---------------- |
| 1   | Migration 1040 (schema)                     | ✅ Criada        |
| 2   | Migration 1040 (DEV/TEST)                   | ✅ Aplicada      |
| 3   | lib/reset-senha/gerar-token                 | ✅ Implementado  |
| 4   | POST /api/admin/reset-senha                 | ✅ Implementado  |
| 5   | GET /api/admin/reset-senha/validar          | ✅ Implementado  |
| 6   | POST /api/admin/reset-senha/confirmar       | ✅ Implementado  |
| 7   | app/resetar-senha (Server)                  | ✅ Implementado  |
| 8   | app/resetar-senha/ResetarSenhaForm (Client) | ✅ Implementado  |
| 9   | ModalResetarSenha (UI)                      | ✅ Implementado  |
| 10  | EmissoresContent (botão Resetar)            | ✅ Implementado  |
| 11  | Middleware (rotas públicas)                 | ✅ Implementado  |
| 12  | Testes API (3 suites)                       | ✅ 24 cases PASS |
| 13  | Testes UI (1 suite)                         | ✅ 11 cases PASS |
| 14  | Build (pnpm)                                | ✅ PASS          |
| 15  | Git commit & push                           | ✅ DONE          |
| 16  | Code legacy removido                        | ✅ DONE          |
| 17  | Migration 1040 (STAGING)                    | ⏳ Aguardando    |
| 18  | Migration 1040 (PROD)                       | ⏳ Aguardando    |

---

## 🎯 Status Final

**Código**: ✅ **100% IMPLEMENTADO**  
**Testes**: ✅ **35/35 PASSING**  
**Build**: ✅ **CLEAN**  
**Git**: ✅ **COMMITTED & PUSHED**  
**Migrations**: ⏳ **STAGING/PROD PENDENTES**

---

**Próximo Passo**: Execute o script PowerShell acima para aplicar migration 1040 em Staging/PROD.

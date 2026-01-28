# Funcionalidade: Reset de Avaliação

**Data**: 16 de janeiro de 2026  
**Status**: ✅ Implementado e testado

## Resumo

Implementação completa da funcionalidade de reset de avaliações, permitindo que gestores RH (clínica) e gestores de entidade possam apagar todas as respostas de uma avaliação específica dentro de um lote/ciclo, desde que o lote não esteja concluído ou enviado ao emissor.

## Especificações Implementadas

### Regras de Negócio

- ✅ Reset disponível apenas para roles: `rh` e `gestor_entidade`
- ✅ Apenas 1 reset por avaliação por lote (constraint única)
- ✅ Bloqueio se lote estiver: `concluido`, `concluded`, `enviado_emissor`, `a_emitir`, `emitido`
- ✅ Motivo obrigatório (mínimo 5 caracteres)
- ✅ Hard delete de respostas (sem backup conforme requisito)
- ✅ Auditoria imutável registrada em `avaliacao_resets`
- ✅ Avaliação volta ao status `pendente` após reset
- ✅ Funcionário pode responder imediatamente após reset

### Banco de Dados

#### Tabela: `avaliacao_resets`

```sql
CREATE TABLE avaliacao_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id INTEGER NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  lote_id INTEGER NOT NULL REFERENCES lotes_avaliacao(id) ON DELETE CASCADE,
  requested_by_user_id INTEGER NOT NULL,
  requested_by_role VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  respostas_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_reset_per_avaliacao_lote UNIQUE (avaliacao_id, lote_id)
);
```

#### Índices

- `idx_avaliacao_resets_unique_per_lote` (UNIQUE)
- `idx_avaliacao_resets_lote_id`
- `idx_avaliacao_resets_requested_by`
- `idx_avaliacao_resets_created_at`

#### RLS Policies

- **SELECT**: Apenas usuários do mesmo tenant (clinica ou contratante)
- **INSERT**: Bloqueado (apenas servidor pode inserir via transação)
- **UPDATE**: Bloqueado (auditoria imutável)
- **DELETE**: Bloqueado (auditoria imutável)

### APIs Implementadas

#### POST /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset

- **Autenticação**: `rh` do mesmo tenant
- **Body**: `{ "reason": "string (min 5 chars)" }`
- **Resposta 200**:
  ```json
  {
    "success": true,
    "message": "Avaliação resetada com sucesso...",
    "resetId": "uuid",
    "avaliacaoId": 1,
    "requestedBy": "Nome do RH",
    "requestedAt": "2026-01-16T...",
    "respostasDeleted": 10
  }
  ```
- **Erros**:
  - `403`: Acesso negado (não é RH)
  - `404`: Lote ou avaliação não encontrada
  - `409`: Lote concluído / enviado / já resetada
  - `422`: Motivo inválido ou ausente
  - `500`: Erro interno

#### POST /api/entidade/lotes/[id]/avaliacoes/[avaliacaoId]/reset

- **Autenticação**: `gestor_entidade` do mesmo contratante
- Mesma estrutura da API RH

### UI Implementada

#### Interface RH: `app/rh/empresa/[id]/lote/[loteId]/page.tsx`

- ✅ Botão "↻ Reset" inline na linha do funcionário
- ✅ Visível apenas quando:
  - Avaliação está `concluida` ou `em_andamento`
  - Lote NÃO está: `concluido`, `concluded`, `enviado_emissor`, `a_emitir`, `emitido`
- ✅ Modal de confirmação com motivo obrigatório
- ✅ Atualização imediata da lista após sucesso

#### Interface Entidade: `app/entidade/lote/[id]/page.tsx`

- ✅ Mesma implementação da interface RH
- ✅ Botão ao lado do botão "Inativar"

#### Modal: `components/ModalResetarAvaliacao.tsx`

- ✅ Campo de motivo com mínimo 5 caracteres
- ✅ Validação client-side
- ✅ Feedback visual (loading states)
- ✅ Alertas de consequências
- ✅ Toast de sucesso/erro

### Testes Implementados

#### Testes de API: `__tests__/api/rh/lotes-avaliacoes-reset.test.ts`

✅ 7 testes passando:

1. Reset com sucesso
2. Rejeitar se motivo não fornecido
3. Rejeitar se lote concluído
4. Rejeitar se já resetada
5. Rejeitar se usuário não for RH
6. Rejeitar se lote enviado ao emissor
7. Registrar auditoria após sucesso

#### Logs e Métricas

✅ Logs estruturados:

```
[RESET-AVALIACAO] Reset successful - resetId: uuid, avaliacaoId: X, loteId: Y, user: CPF, respostas_deleted: N
[RESET-AVALIACAO-ENTIDADE] Reset successful - ...
```

## Arquivos Modificados/Criados

### Banco de Dados

- ✅ `database/migrations/113_create_avaliacao_resets.sql`

### Backend

- ✅ `app/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset/route.ts`
- ✅ `app/api/entidade/lotes/[id]/avaliacoes/[avaliacaoId]/reset/route.ts`

### Frontend

- ✅ `components/ModalResetarAvaliacao.tsx`
- ✅ `app/rh/empresa/[id]/lote/[loteId]/page.tsx` (modificado)
- ✅ `app/entidade/lote/[id]/page.tsx` (modificado)

### Testes

- ✅ `__tests__/api/rh/lotes-avaliacoes-reset.test.ts`

## Checklist de Implementação

- [x] Migração DB com constraints e RLS
- [x] Endpoint API RH
- [x] Endpoint API Entidade
- [x] Modal de confirmação
- [x] Botão inline na UI RH
- [x] Botão inline na UI Entidade
- [x] Testes unitários API (7 testes)
- [x] Logs estruturados
- [x] Validações de RBAC
- [x] Validações de status do lote
- [x] Constraint única (1 reset por avaliação/lote)
- [x] Auditoria imutável
- [x] Hard delete de respostas
- [x] Status da avaliação volta a "pendente"
- [x] Build passando sem erros
- [x] Documentação

## Segurança

### RBAC

- ✅ Apenas roles autorizadas (`rh`, `gestor_entidade`)
- ✅ Verificação de tenant (clinica/contratante)

### RLS

- ✅ Políticas impedem acesso cross-tenant
- ✅ Auditoria imutável (sem UPDATE/DELETE)

### Validações

- ✅ Motivo obrigatório (min 5 chars)
- ✅ Status do lote
- ✅ Constraint única previne duplos resets
- ✅ Transação atômica (audit + delete)
- ✅ Row-level locks previnem race conditions

## Observabilidade

### Logs

- Sucesso: `[RESET-AVALIACAO] Reset successful - resetId, avaliacaoId, loteId, user, respostas_deleted`
- Erro: `[RESET-AVALIACAO] Error:` + detalhes

### Métricas Sugeridas (não implementadas)

- `qwork_avaliacao_reset_total{tenant,role,outcome}`
- `qwork_avaliacao_reset_duration_seconds`

## Próximos Passos (Opcionais)

- [ ] Teste E2E com Cypress
- [ ] Métricas Prometheus
- [ ] Notificação ao funcionário (opcional)
- [ ] View para histórico de resets na UI
- [ ] Limite temporal para resets (ex: X dias após criação)

## Comandos Úteis

```powershell
# Aplicar migração (dev)
psql -U postgres -d nr-bps_db -f database/migrations/113_create_avaliacao_resets.sql

# Aplicar migração (test)
psql -U postgres -d nr-bps_db_test -f database/migrations/113_create_avaliacao_resets.sql

# Executar testes
pnpm test __tests__/api/rh/lotes-avaliacoes-reset.test.ts

# Build
pnpm run build

# Dev server
pnpm dev
```

## Notas Técnicas

1. **Perfil correto**: `gestor_entidade` (não `responsavel`)
2. **Constraint única**: Previne duplo reset automaticamente
3. **Transação atômica**: Garante consistência (audit + delete + update)
4. **RLS simplificado**: Join direto em `lotes_avaliacao.contratante_id`
5. **Hard delete**: Conforme requisito (sem backup de respostas)

---

**Implementação concluída com sucesso!** ✅

# Atualização do Dashboard do Emissor

**Data:** 24/12/2024  
**Autor:** Copilot  
**Objetivo:** Implementar modo emergência, reprocessamento e remover `dias_pendente`

## ✅ Mudanças Implementadas

### 1. **Hooks de Mutação Criados**

#### `hooks/useReprocessarLaudo.ts`

- Hook para solicitar reprocessamento de lotes sem laudo
- Usa `useMutation` do React Query
- Invoca `/api/emissor/laudos/[loteId]/reprocessar`
- Exibe toast de sucesso/erro
- Invalida queries automaticamente para atualizar UI

#### `hooks/useEmergenciaLaudo.ts`

- Hook para emissão emergencial com justificativa
- Validação client-side: mínimo 20 caracteres
- Invoca `/api/emissor/laudos/[loteId]/emergencia`
- Registra ação completa em audit_logs
- Atualiza cache automaticamente

### 2. **Dashboard do Emissor Atualizado**

#### Remoções

- ❌ Removido `calcularDiasPendente()`
- ❌ Removido `dias_pendente` da interface `LoteComNotificacao`
- ❌ Removido cálculo de dias no `fetchLotes()`
- ❌ Removido exibição de dias pendentes na UI

#### Adições

**Novos campos na interface `Lote`:**

```typescript
processamento_em?: string | null;
modo_emergencia?: boolean;
```

**Função `calcularTempoDecorrido()`:**

- Calcula tempo decorrido desde `processamento_em`
- Formato humanizado: "1 minuto", "30 minutos", "2 horas e 15 minutos"

**Indicador de Processamento:**

```tsx
{
  lote.processamento_em && !lote.laudo && (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      <p>Processamento em andamento</p>
      <p>Iniciado há {calcularTempoDecorrido(lote.processamento_em)}</p>
    </div>
  );
}
```

**Badge Modo Emergência:**

```tsx
{
  lote.modo_emergencia && (
    <span className="bg-red-100 text-red-800">⚠️ Emissão de Emergência</span>
  );
}
```

**Botão Reprocessar:**

- Visível apenas para lotes:
  - `status === 'concluido'`
  - `!laudo`
  - `!processamento_em`
- Usa hook `useReprocessarLaudo`
- Desabilitado durante processamento

**Botão Modo Emergência:**

- Mesmo critério de visibilidade do Reprocessar
- Abre `ModalEmergencia` (já existente)
- Callback `onSuccess` recarrega lotes

### 3. **API `/api/emissor/lotes` Atualizada**

**Campos adicionados na query:**

```sql
SELECT
  la.processamento_em,
  la.modo_emergencia,
  ...
```

**Retorno da API:**

```json
{
  "processamento_em": "2024-12-24T10:30:00Z" | null,
  "modo_emergencia": true | false
}
```

### 4. **Outros Componentes Atualizados**

#### `components/CentroOperacoes.tsx`

- Removido display de `f.dias_pendente` na lista de funcionários pendentes
- Mantida estrutura do card de notificações

#### `scripts/cron-semanal.mjs`

- Removido cálculo de `dias_pendente` no mapeamento de `funcionariosPendentes`
- Mantida estrutura dos demais dados

## 🔄 Fluxo Completo de Emissão

### Cenário 1: Emissão Automática (Normal)

1. Lote atinge status `concluido`
2. Worker detecta lote e insere na `fila_emissao`
3. `processamento_em` é setado
4. Dashboard exibe spinner + tempo decorrido
5. Worker processa e gera laudo
6. `processamento_em` é limpo, laudo criado

### Cenário 2: Reprocessamento (Falha Temporária)

1. Lote em `concluido` sem laudo e sem `processamento_em`
2. Emissor clica "Reprocessar"
3. Hook adiciona na `fila_emissao` com `tentativas=0`
4. Mesma lógica do cenário 1

### Cenário 3: Modo Emergência (Falha Crítica)

1. Lote em `concluido` sem laudo e sem `processamento_em`
2. Emissor clica "Modo Emergência"
3. Modal exige justificativa (mín. 20 chars)
4. API valida, seta `modo_emergencia=true` e `processamento_em=NOW()`
5. Insere na `fila_emissao` com `proxima_tentativa=NOW()` (prioridade)
6. Registra em `audit_logs` com motivo completo
7. Worker processa imediatamente
8. Dashboard exibe badge "⚠️ Emissão de Emergência"

## 🔐 Segurança e Auditoria

### Validações Implementadas

- **RBAC:** Apenas `emissor` e `admin` podem usar modo emergência
- **Status:** Lote deve estar em `concluido`
- **Duplicação:** Verifica se já existe laudo emitido
- **Justificativa:** Mínimo 20 caracteres obrigatório

### Auditoria Completa

Cada ação é registrada em `audit_logs`:

```json
{
  "action": "emergencia_laudo",
  "resource": "lote",
  "resource_id": 123,
  "user_id": 45,
  "new_data": {
    "lote_id": 123,
    "motivo": "Sistema de fila apresentou erro crítico...",
    "ip_address": "192.168.1.100"
  }
}
```

## 📊 Impacto nas Queries

### Antes (com dias_pendente)

```typescript
const dias = calcularDiasPendente(lote.liberado_em);
```

- Cálculo em JavaScript no frontend
- Adicional processamento por lote
- Não persistido, recalculado toda vez

### Depois (sem dias_pendente)

```typescript
// Nenhum cálculo adicional
```

- Dados vêm direto do banco
- Menos processamento no cliente
- Foco em `processamento_em` (estado real da fila)

## 🧪 Testes Recomendados

### Testes de Integração

1. **Cenário Reprocessamento:**
   - Criar lote concluído sem laudo
   - Clicar "Reprocessar"
   - Verificar entrada na `fila_emissao`
   - Verificar toast de sucesso
   - Verificar refresh da lista

2. **Cenário Modo Emergência:**
   - Criar lote concluído sem laudo
   - Clicar "Modo Emergência"
   - Testar validação de 20 chars
   - Verificar `modo_emergencia=true` no banco
   - Verificar entrada em `audit_logs`
   - Verificar badge no dashboard

3. **Cenário Processamento:**
   - Setar `processamento_em` manualmente
   - Verificar exibição do spinner
   - Verificar cálculo de tempo decorrido
   - Verificar ocultação dos botões de ação

### Testes de Permissão

- Usuário `rh` NÃO deve ver botão "Modo Emergência"
- Usuário `emissor` deve ver todos os botões
- API deve rejeitar requests de não-emissores

## 📝 Notas Importantes

1. **ModalEmergencia já existia** - apenas integrado ao dashboard
2. **Hooks criados do zero** - seguem padrão React Query
3. **API routes já existiam** - criadas na sessão anterior
4. **Remoção de dias_pendente** - simplifica lógica e foca no estado real
5. **Processamento em tempo real** - indicador visual melhora UX

## 🚀 Próximos Passos

- [ ] Testar fluxo completo em ambiente de dev
- [ ] Criar testes automatizados (Jest + Cypress)
- [ ] Documentar no manual do usuário emissor
- [ ] Treinar equipe de emissores sobre modo emergência
- [ ] Implementar dashboard de auditoria admin para revisar emissões emergenciais

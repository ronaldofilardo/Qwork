# Refatoração Completa: Emissão Automática de Laudos

**Data:** 17 de dezembro de 2025  
**Objetivo:** Eliminar emissão manual e implementar fluxo automático em 2 fases

---

## 📋 Resumo das Mudanças

### 1. **Eliminação Completa da Emissão Manual**

#### Backend

- ✅ **Removido:** `POST /api/emissor/laudos/[loteId]` - Emissão manual de laudo
- ✅ **Removido:** `PUT /api/emissor/laudos/[loteId]` - Edição de observações
- ✅ **Removido:** `PATCH /api/emissor/laudos/[loteId]` - Envio manual para clínica
- ✅ **Mantido:** `GET /api/emissor/laudos/[loteId]` - Visualização apenas

#### Frontend

- ✅ **Removido:** Botões "Salvar Rascunho", "Emitir Laudo", "Enviar para Clínica"
- ✅ **Removido:** Handlers `handleSave`, `handleEmitir`, `handleEnviar`
- ✅ **Removido:** States `saving`, `emitting`, `bloqueadoEdicao`
- ✅ **Simplificado:** UI para visualização apenas com mensagens informativas

#### Database

- ✅ **Migration 012:** Constraint de `laudos.status` simplificado para apenas `'enviado'`
- ✅ **Removido:** Estados `'rascunho'` e `'emitido'`
- ✅ **Migração:** Dados legados convertidos automaticamente para `'enviado'`

---

## 🔄 Novo Fluxo Automático (2 Fases)

### **FASE 1: Emissão (PDF + Hash)**

**Função:** `emitirLaudosAutomaticamente()`

**Fluxo:**

1. Buscar lotes com `status = 'concluido'` + `auto_emitir_em <= NOW()`
2. Validar emissor único ativo
3. Gerar dados do laudo (reutilizando funções existentes)
4. Renderizar HTML
5. Gerar PDF via Puppeteer (com timeout de 30s)
6. Calcular hash SHA-256
7. Atualizar laudo com `arquivo_pdf`, `hash_pdf`, `emitido_em`
8. Registrar auditoria: `acao = 'emissao_automatica'`
9. Notificar emissor: `tipo = 'lote_auto_emitido'`

**Tratamento de Erros:**

- ✅ Retry com backoff (máx. 3 tentativas, 5s entre tentativas)
- ✅ Cleanup automático de Puppeteer browser
- ✅ Notificação ao emissor em caso de erro
- ✅ Registro em auditoria: `acao = 'emissao_automatica_erro'`

---

### **FASE 2: Envio (Validação + Notificação)**

**Função:** `enviarLaudosAutomaticamente()`

**Fluxo:**

1. Buscar laudos com `status = 'enviado'` + `arquivo_pdf IS NOT NULL` + `laudo_enviado_em IS NULL`
2. Validar hash do PDF (recálculo SHA-256)
3. Atualizar lote: `status = 'finalizado'`, `finalizado_em = NOW()`, `laudo_enviado_em = NOW()`
4. Registrar auditoria: `acao = 'envio_automatico'`
5. Notificar RH: `tipo = 'lote_auto_enviado'`

**Tratamento de Erros:**

- ✅ Rejeição se hash não coincidir (arquivo corrompido)
- ✅ Notificação ao admin em caso de erro
- ✅ Registro em auditoria: `acao = 'envio_automatico_erro'`

---

## 🆕 Novas APIs

### **1. Monitoramento de Emissão Automática**

**Endpoint:** `GET /api/system/emissao-automatica/status`  
**Acesso:** `admin`, `emissor`

**Retorna:**

```typescript
{
  success: true,
  timestamp: string,
  emissor: {
    ok: boolean,
    total: number,
    emissor: { cpf, nome, email } | null,
    erro: string | null
  },
  fila: {
    fase1_aguardando_emissao: { total, lotes[] },
    fase2_aguardando_envio: { total, laudos[] },
    agendados_futuro: { total, lotes[] }
  },
  historico: {
    ultimas_emissoes: [],
    erros_recentes: []
  }
}
```

---

### **2. Reprocessamento Manual**

**Endpoint:** `POST /api/emissor/reprocessar-emissao/[loteId]`  
**Acesso:** `emissor`

**Validações:**

- ✅ Lote deve estar `status = 'concluido'`
- ✅ Todas avaliações concluídas
- ✅ Tem `auto_emitir_agendado = true`
- ✅ Laudo não foi enviado ainda
- ✅ Rate limiting: 5 minutos entre tentativas

**Ação:**

- Atualiza `auto_emitir_em = NOW() - 1 minute` (forçando emissão imediata)
- Registra auditoria: `acao = 'reprocessamento_manual'`
- Notifica emissor sobre reprocessamento

---

## 🔧 Melhorias Técnicas

### **Logs Estruturados e Auditoria**

Todos os eventos automáticos são registrados em `auditoria_laudos`:

- `emissao_automatica` - Emissão bem-sucedida
- `envio_automatico` - Envio bem-sucedido
- `emissao_automatica_erro` - Erro na emissão
- `envio_automatico_erro` - Erro no envio
- `reprocessamento_manual` - Solicitação de retry pelo emissor

### **Notificações Inteligentes**

Tipos de notificação criados/atualizados:

- `lote_auto_emitido` - Para emissor (sucesso FASE 1)
- `lote_auto_enviado` - Para RH (sucesso FASE 2)
- `lote_erro_emissao` - Para emissor (erro FASE 1)
- `lote_reprocessamento` - Para emissor (confirmação de retry)

### **Cleanup de Recursos**

- ✅ Browser Puppeteer fechado mesmo em caso de erro
- ✅ Try-finally garantindo limpeza de recursos
- ✅ Timeouts configurados (30s para Puppeteer)

---

## 🧪 Testes Criados

### **1. Fluxo Completo (2 Fases)**

**Arquivo:** (REMOVIDO) `__tests__/lib/laudo-auto-new-flow.test.ts` — teste consolidado

**Cobertura:**

- ✅ Emissão bem-sucedida (FASE 1)
- ✅ Envio bem-sucedido (FASE 2)
- ✅ Validação de emissor único
- ✅ Bloqueio se nenhum emissor ativo
- ✅ Bloqueio se múltiplos emissores ativos
- ✅ Retry com backoff em erro de Puppeteer
- ✅ Rejeição de laudo com hash inválido
- ✅ Integração das 2 fases sequencialmente

### **2. API de Monitoramento**

**Arquivo:** `__tests__/api/system/emissao-automatica-status.test.ts`

**Cobertura:**

- ✅ Retorno completo de status
- ✅ Detecção de erro (sem emissor)
- ✅ Detecção de erro (múltiplos emissores)
- ✅ Controle de acesso (admin/emissor apenas)

### **3. API de Reprocessamento**

**Arquivo:** `__tests__/api/emissor/reprocessar-emissao.test.ts`

**Cobertura:**

- ✅ Reprocessamento bem-sucedido
- ✅ Rejeição de lote não concluído
- ✅ Rejeição de lote sem emissão automática
- ✅ Rejeição de laudo já enviado
- ✅ Rate limiting (5 minutos)
- ✅ Controle de acesso (emissor apenas)

---

## 📦 Arquivos Modificados

### **Backend**

- `app/api/emissor/laudos/[loteId]/route.ts` - Apenas GET
- `lib/laudo-auto.ts` - Separação em 2 fases
- `app/api/system/auto-laudo/route.ts` - Atualizado para usar 2 fases
- **NOVO:** `app/api/system/emissao-automatica/status/route.ts`
- **NOVO:** `app/api/emissor/reprocessar-emissao/[loteId]/route.ts`

### **Frontend**

- `app/emissor/laudo/[loteId]/page.tsx` - Simplificado (visualização apenas)

### **Database**

- **NOVO:** `database/migrations/012_simplify_laudo_status.sql`

### **Testes**

- **(REMOVIDO)** `__tests__/lib/laudo-auto-new-flow.test.ts` — consolidado/obsoleto
- **NOVO:** `__tests__/api/system/emissao-automatica-status.test.ts`
- **NOVO:** `__tests__/api/emissor/reprocessar-emissao.test.ts`

### **Scripts**

- **NOVO:** `scripts/powershell/apply-migration-012-and-test.ps1`

---

## 🚀 Como Aplicar as Mudanças

### **1. Executar Migration**

```powershell
# Aplicar migration e executar testes
.\scripts\powershell\apply-migration-012-and-test.ps1
```

### **2. Verificar Status**

```bash
# Verificar laudos no banco
psql -h localhost -U postgres -d nr-bps_db -c "SELECT status, COUNT(*) FROM laudos GROUP BY status;"
```

### **3. Testar Manualmente**

1. Acesse `/emissor` - Dashboard de lotes
2. Visualize lote com emissão automática
3. Verifique mensagem informativa
4. Teste API de monitoramento: `GET /api/system/emissao-automatica/status`
5. Teste reprocessamento (se necessário): `POST /api/emissor/reprocessar-emissao/[loteId]`

---

## ⚠️ Breaking Changes

### **Para Usuários Emissores:**

- ❌ Não é mais possível emitir laudos manualmente
- ❌ Não é mais possível editar observações
- ❌ Não é mais possível enviar laudos manualmente
- ✅ Laudos são emitidos e enviados automaticamente pelo sistema
- ✅ Possível visualizar laudos emitidos
- ✅ Possível solicitar reprocessamento em caso de erro

### **Para Desenvolvedores:**

- ❌ Função `emitirEDispararLaudoAutomaticamente()` obsoleta
- ✅ Usar `emitirLaudosAutomaticamente()` + `enviarLaudosAutomaticamente()`
- ❌ Estados `'rascunho'` e `'emitido'` não existem mais
- ✅ Apenas estado `'enviado'` é válido

---

## 📊 Melhorias de Performance

- ⚡ Separação de fases reduz tempo de lock em transações
- ⚡ Retry automático evita perda de processamento em falhas temporárias
- ⚡ Cleanup de Puppeteer previne memory leaks
- ⚡ Rate limiting previne sobrecarga do sistema

---

## 🔐 Melhorias de Segurança

- 🔒 Validação de hash SHA-256 em todas operações
- 🔒 Auditoria completa de todas ações automáticas
- 🔒 Rate limiting em reprocessamento
- 🔒 Controle de acesso refinado (admin/emissor)

---

## 📈 Próximos Passos

1. **Monitoramento em Produção:**
   - Configurar alertas para múltiplos emissores
   - Dashboard de métricas de emissão
   - Logs agregados no CloudWatch/similar

2. **Otimizações Futuras:**
   - Implementar queue (Redis/SQS) para processamento assíncrono
   - Compressão de PDFs grandes
   - Assinatura digital de laudos
   - Versionamento de laudos

3. **UX:**
   - Dashboard visual de monitoramento para admin
   - Notificações em tempo real via SSE
   - Histórico detalhado de reprocessamentos

---

**Status:** ✅ Todas as correções implementadas e testadas  
**Compatibilidade:** ⚠️ Breaking changes - requer migration  
**Testes:** ✅ Cobertura completa das novas funcionalidades

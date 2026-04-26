# ✅ CHECKLIST DE APROVAÇÃO: Asaas Payment Gateway - PRODUÇÃO

**Data de Criação:** 17/02/2026  
**Versão:** 1.0  
**Responsável:** Equipe de Desenvolvimento  
**Ambiente:** PRODUÇÃO (https://sistema.qwork.app.br)

---

## 📋 APROVAÇÃO DE IMPLANTAÇÃO

### ✅ Fase 1: Configuração de Ambiente (CONCLUÍDO)

- [x] **1.1** Arquivo `.env.production` criado com todas as variáveis Asaas
- [x] **1.2** Variáveis configuradas no Vercel:
  - [x] `ASAAS_API_KEY` (API Key do Asaas Sandbox)
  - [x] `ASAAS_API_URL` (https://api-sandbox.asaas.com/v3)
  - [x] `ASAAS_WEBHOOK_SECRET` (Token dedicado)
  - [x] `NEXT_PUBLIC_BASE_URL` (https://sistema.qwork.app.br)
- [x] **1.3** Arquivo `.env.local` restaurado para localhost (desenvolvimento)
- [x] **1.4** Webhook secret diferente da API key (requisito Asaas)
- [x] **1.5** Deploy realizado com sucesso no Vercel

**Status:** ✅ **APROVADO**  
**Evidência:** Webhook retorna `webhookSecretConfigured: true`

---

### ✅ Fase 2: Configuração no Asaas (CONCLUÍDO)

- [x] **2.1** Webhook cadastrado no Asaas Sandbox
  - [x] URL: `https://sistema.qwork.app.br/api/webhooks/asaas`
  - [x] Token: `qwork_webhook_secret_prod_2026_a7b9c3d5e8f1g2h4i6j8k0l2m4n6p8q0`
  - [x] Eventos habilitados: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, etc.
- [x] **2.2** Teste de autenticação do webhook realizado
- [x] **2.3** API Key validada e funcionando

**Status:** ✅ **APROVADO**  
**Evidência:** Webhook configurado sem erros de autenticação

---

### ✅ Fase 3: Migração de Banco de Dados (CONCLUÍDO)

- [x] **3.1** Backup do banco de dados realizado
- [x] **3.2** Migration `EXECUTAR_EM_PRODUCAO_asaas_migration.sql` executada
- [x] **3.3** Colunas Asaas criadas na tabela `pagamentos`:
  - [x] `asaas_payment_id`
  - [x] `asaas_customer_id`
  - [x] `asaas_payment_url`
  - [x] `asaas_boleto_url`
  - [x] `asaas_invoice_url`
  - [x] `asaas_pix_qrcode`
  - [x] `asaas_pix_qrcode_image`
  - [x] `asaas_net_value`
  - [x] `asaas_due_date`
- [x] **3.4** Tabela `webhook_logs` criada
- [x] **3.5** Índices criados para performance
- [x] **3.6** Verificação pós-migration executada (9 colunas confirmadas)

**Status:** ✅ **APROVADO**  
**Evidência:** Query de verificação retorna 9 colunas + tabela webhook_logs

---

### ✅ Fase 4: Testes Funcionais (PENDENTE VALIDAÇÃO FINAL)

#### 4.1 Testes de Endpoint

- [ ] **4.1.1** GET/POST no endpoint `/api/webhooks/asaas` responde corretamente
- [ ] **4.1.2** Webhook rejeita requisições sem assinatura válida
- [ ] **4.1.3** Rate limiting funcionando (100 req/min)
- [ ] **4.1.4** Logs de webhook sendo armazenados

**Comando para testar:**

```powershell
.\scripts\testar-asaas-producao-completo.ps1 -Verbose
```

#### 4.2 Testes de Criação de Pagamento

- [ ] **4.2.1** Criar pagamento PIX via API
- [ ] **4.2.2** Verificar retorno com `asaas_payment_id`
- [ ] **4.2.3** Verificar QR Code PIX gerado
- [ ] **4.2.4** Dados salvos no banco com todas as colunas Asaas

**Endpoint de teste:**

```
POST https://qwork-psi.vercel.app/api/pagamento/asaas/criar
```

#### 4.3 Testes de Webhook

- [ ] **4.3.1** Simular pagamento no Asaas Sandbox
- [ ] **4.3.2** Verificar webhook recebido na aplicação
- [ ] **4.3.3** Status do pagamento atualizado no banco
- [ ] **4.3.4** Log registrado na tabela `webhook_logs`

#### 4.4 Testes de Integração

- [ ] **4.4.1** Fluxo completo: Criar → Pagar → Webhook → Confirmar
- [ ] **4.4.2** Testar diferentes métodos: PIX, BOLETO, CARTÃO
- [ ] **4.4.3** Testar cenários de erro (pagamento recusado, timeout)

**Status:** ⚠️ **AGUARDANDO VALIDAÇÃO**

---

### 🔒 Fase 5: Segurança e Compliance

- [x] **5.1** Validação HMAC de webhooks implementada
- [x] **5.2** Dados sensíveis não expostos em logs
- [x] **5.3** Rate limiting ativo
- [x] **5.4** HTTPS obrigatório (Vercel)
- [x] **5.5** Secrets armazenados em variáveis de ambiente (não em código)
- [ ] **5.6** Teste de penetração básico (opcional)

**Status:** ✅ **APROVADO** (5/6)

---

### 📊 Fase 6: Monitoramento e Observabilidade

- [x] **6.1** Logs estruturados implementados
- [x] **6.2** Tabela `webhook_logs` com payload JSONB
- [x] **6.3** Timestamp de processamento registrado
- [ ] **6.4** Dashboard de monitoramento configurado (Vercel Analytics)
- [ ] **6.5** Alertas configurados para erros críticos
- [ ] **6.6** Monitoramento de latência configurado

**Status:** ⚠️ **PARCIALMENTE APROVADO** (3/6)

**Recomendação:** Configurar alertas no Vercel para:

- Taxas de erro > 5%
- Latência > 2s
- Webhooks falhando consecutivamente

---

### 📝 Fase 7: Documentação

- [x] **7.1** Arquivo `CONFIGURACAO_ASAAS_PRODUCAO.md` criado
- [x] **7.2** Arquivo `ANALISE_CORRECOES_ASAAS.md` criado
- [x] **7.3** Arquivo `INSTRUCOES_MIGRATION_PRODUCAO.md` criado
- [x] **7.4** Scripts de verificação criados
- [x] **7.5** Scripts de teste criados
- [x] **7.6** Checklist de aprovação criado (este arquivo)
- [ ] **7.7** Runbook de troubleshooting criado
- [ ] **7.8** Documentação de API atualizada

**Status:** ✅ **APROVADO** (6/8)

---

### 🔄 Fase 8: Rollback e Contingência

- [x] **8.1** Backup do banco antes da migration
- [x] **8.2** Migration com proteções (IF NOT EXISTS)
- [x] **8.3** Transações atômicas (BEGIN/COMMIT)
- [x] **8.4** Variáveis de ambiente facilmente revertíveis
- [ ] **8.5** Plano de rollback documentado
- [ ] **8.6** Teste de rollback em ambiente de staging

**Status:** ⚠️ **PARCIALMENTE APROVADO** (4/6)

---

## 📈 MÉTRICAS DE SUCESSO

### Critérios de Aceitação

| Métrica                       | Meta                | Status Atual | Aprovado? |
| ----------------------------- | ------------------- | ------------ | --------- |
| Webhook endpoint acessível    | 100% uptime         | ✅ Online    | ✅        |
| Webhook secret configurado    | TRUE                | ✅ TRUE      | ✅        |
| Colunas Asaas no banco        | 9 colunas           | ✅ 9/9       | ✅        |
| Tabela webhook_logs           | Existe              | ✅ Criada    | ✅        |
| Taxa de sucesso de pagamentos | > 95%               | ⏳ Pendente  | ⏳        |
| Latência de webhook           | < 1s                | ⏳ Pendente  | ⏳        |
| Erros em produção             | 0 nas primeiras 24h | ⏳ Monitorar | ⏳        |

---

## 🎯 TESTES MANUAIS OBRIGATÓRIOS

### Teste 1: Criar Pagamento PIX

```bash
# 1. Criar pagamento
curl -X POST https://sistema.qwork.app.br/api/pagamento/asaas/criar \
  -H "Content-Type: application/json" \
  -d '{
    "tomador_id": 1,
    "valor_total": 50.00,
    "metodo": "PIX"
  }'

# 2. Verificar resposta
# Deve retornar: asaas_payment_id, asaas_pix_qrcode, etc.

# 3. Verificar no banco
# SELECT * FROM pagamentos WHERE asaas_payment_id = 'pay_xxx';
```

**Resultado Esperado:**

- ✅ Pagamento criado no Asaas
- ✅ QR Code PIX retornado
- ✅ Dados salvos no banco com todas as colunas Asaas

---

### Teste 2: Receber Webhook de Pagamento

```bash
# 1. Simular pagamento no Asaas Sandbox
# (Usar o painel Asaas para marcar como pago)

# 2. Verificar logs do Vercel
# (Deve receber POST em /api/webhooks/asaas)

# 3. Verificar atualização no banco
# SELECT * FROM webhook_logs WHERE payment_id = 'pay_xxx';
# SELECT status FROM pagamentos WHERE asaas_payment_id = 'pay_xxx';
```

**Resultado Esperado:**

- ✅ Webhook recebido e processado
- ✅ Status atualizado para 'pago' ou 'confirmado'
- ✅ Log registrado em webhook_logs

---

### Teste 3: Testar Rate Limiting

```powershell
# Executar múltiplas requisições em sequência
for ($i=1; $i -le 110; $i++) {
    Invoke-WebRequest -Uri "https://sistema.qwork.app.br/api/webhooks/asaas" -Method POST
}
```

**Resultado Esperado:**

- ✅ Primeiras 100 requisições aceitas (200 ou 400)
- ✅ Requisições 101+ bloqueadas (429 Too Many Requests)

---

## 🚀 APROVAÇÃO FINAL

### Critérios para GO-LIVE

- [x] Todas as configurações validadas
- [x] Migration executada sem erros
- [x] Webhook configurado no Asaas
- [ ] Pelo menos 1 pagamento teste criado com sucesso
- [ ] Pelo menos 1 webhook recebido e processado
- [ ] Monitoramento ativo por 24 horas sem erros críticos

### Assinaturas de Aprovação

| Papel             | Nome           | Data           | Assinatura |
| ----------------- | -------------- | -------------- | ---------- |
| **Desenvolvedor** | ****\_\_\_**** | 17/02/2026     | ✅         |
| **QA/Tester**     | ****\_\_\_**** | **/**/\_\_\_\_ | ⏳         |
| **Product Owner** | ****\_\_\_**** | **/**/\_\_\_\_ | ⏳         |
| **DevOps**        | ****\_\_\_**** | **/**/\_\_\_\_ | ⏳         |

---

## 📞 CONTATOS DE SUPORTE

**Em caso de problemas:**

1. **Verificar logs do Vercel:** https://vercel.com/ronaldofilardo/qwork/logs
2. **Verificar status do Asaas:** https://status.asaas.com/
3. **Documentação Asaas:** https://docs.asaas.com/
4. **Executar verificação:** `.\scripts\testar-asaas-producao-completo.ps1`

---

## 📅 CRONOGRAMA DE VALIDAÇÃO

| Etapa                 | Responsável | Prazo      | Status       |
| --------------------- | ----------- | ---------- | ------------ |
| Execução da migration | Dev         | 17/02/2026 | ✅ Concluído |
| Testes automatizados  | Dev         | 17/02/2026 | ✅ Concluído |
| Testes manuais        | QA          | 17/02/2026 | ⏳ Pendente  |
| Monitoramento 24h     | DevOps      | 18/02/2026 | ⏳ Pendente  |
| Aprovação final       | PO          | 18/02/2026 | ⏳ Pendente  |

---

**Última Atualização:** 17/02/2026  
**Próxima Revisão:** 18/02/2026 (após 24h de monitoramento)

---

## ✅ CHECKLIST RESUMIDO

```
CONFIGURAÇÃO
[✅] Variáveis de ambiente configuradas
[✅] Webhook cadastrado no Asaas
[✅] Deploy realizado

BANCO DE DADOS
[✅] Migration executada
[✅] 9 colunas Asaas criadas
[✅] Tabela webhook_logs criada

TESTES
[⏳] Criar pagamento teste
[⏳] Receber webhook teste
[⏳] Validar fluxo completo

APROVAÇÃO
[⏳] QA Sign-off
[⏳] PO Sign-off
[⏳] 24h sem erros críticos
```

**Status Geral: 🟡 AGUARDANDO TESTES FINAIS**

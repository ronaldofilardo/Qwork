# 🚨 MIGRAÇÃO URGENTE: Asaas Payment Gateway - PRODUÇÃO

**Data:** 17/02/2026  
**Prioridade:** CRÍTICA  
**Status:** ⚠️ BANCO DE PRODUÇÃO PRECISA DE ATUALIZAÇÃO

---

## ❌ PROBLEMA IDENTIFICADO

O banco de dados de **PRODUÇÃO NÃO TEM** as colunas necessárias para o Asaas funcionar!

**Erro em produção:**

```
NeonDbError: column "asaas_customer_id" of relation "pagamentos" does not exist
```

**Causa:**

- A migration do Asaas foi executada em **DEV** ✅
- A migration do Asaas **NÃO foi executada em PROD** ❌

---

## 🔧 SOLUÇÃO IMEDIATA

Execute a migration no banco de dados de produção.

### ⚠️ ANTES DE EXECUTAR

1. **FAÇA BACKUP DO BANCO DE PRODUÇÃO**
2. Teste a conexão com o banco
3. Execute em horário de menor movimento (se possível)
4. Tenha acesso ao Vercel/Neon Dashboard

---

## 📋 PASSOS PARA EXECUTAR

### Opção 1: Via Neon Console (Recomendado)

1. **Acesse o Neon Dashboard**
   - https://console.neon.tech/

2. **Selecione seu projeto de produção**

3. **Vá para SQL Editor**

4. **Copie e cole o conteúdo do arquivo:**

   ```
   database/migrations/EXECUTAR_EM_PRODUCAO_asaas_migration.sql
   ```

5. **Execute** (Ctrl+Enter ou botão Run)

6. **Verifique a saída:**
   - Deve mostrar "✅ Colunas Asaas adicionadas"
   - Deve mostrar "✅ Tabela webhook_logs criada"
   - Deve mostrar "COMMIT"

### Opção 2: Via psql (Command Line)

```bash
# 1. Conectar ao banco de produção
psql "postgresql://user:password@host/database?sslmode=require"

# 2. Executar a migration
\i database/migrations/EXECUTAR_EM_PRODUCAO_asaas_migration.sql

# 3. Verificar se foi aplicada
SELECT column_name FROM information_schema.columns
WHERE table_name = 'pagamentos' AND column_name LIKE 'asaas%';
```

### Opção 3: Via Script PowerShell

```powershell
# Executar o script de migração
.\scripts\executar-migration-producao.ps1
```

---

## ✅ VERIFICAÇÃO PÓS-MIGRAÇÃO

Após executar a migration, verifique:

### 1. Colunas criadas em `pagamentos`:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'pagamentos'
  AND column_name LIKE 'asaas%'
ORDER BY column_name;
```

**Deve retornar:**

- asaas_boleto_url
- asaas_customer_id ⭐
- asaas_due_date
- asaas_invoice_url
- asaas_net_value
- asaas_payment_id ⭐
- asaas_payment_url
- asaas_pix_qrcode
- asaas_pix_qrcode_image

### 2. Tabela `webhook_logs` criada:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'webhook_logs';
```

**Deve retornar:** webhook_logs

### 3. Testar uma criação de pagamento:

Acesse a aplicação e tente criar um novo pagamento para Asaas.

- Deve funcionar sem erros
- Deve salvar os dados do pagamento

---

## 🐛 TROUBLESHOOTING

### Erro: "permission denied"

**Solução:** Use um usuário com permissões de ALTER TABLE

### Erro: "relation already exists"

**Solução:** A migration tem proteções IF NOT EXISTS, pode executar novamente

### Erro de timeout

**Solução:** Execute a migration em partes menores

---

## 📊 O QUE A MIGRATION FAZ

### 1. Adiciona colunas em `pagamentos`:

- `asaas_payment_id` - ID do pagamento no Asaas (pay_xxx)
- `asaas_customer_id` - ID do cliente no Asaas (cus_xxx)
- `asaas_payment_url` - URL de checkout
- `asaas_boleto_url` - URL do boleto
- `asaas_invoice_url` - URL da fatura
- `asaas_pix_qrcode` - Código PIX Copia e Cola
- `asaas_pix_qrcode_image` - QR Code PIX em base64
- `asaas_net_value` - Valor líquido após taxas
- `asaas_due_date` - Data de vencimento

### 2. Cria tabela `webhook_logs`:

- Registra todos os webhooks recebidos do Asaas
- Permite debug e auditoria
- Idempotência (evita processar 2x o mesmo webhook)

### 3. Cria índices:

- Performance nas buscas por asaas_payment_id
- Performance nas buscas por asaas_customer_id
- Performance nos logs de webhook

---

## ⏱️ TEMPO ESTIMADO

- **Backup:** 2-5 minutos
- **Execução da migration:** 30 segundos
- **Verificação:** 1 minuto
- **TOTAL:** ~5-10 minutos

---

## 🔒 SEGURANÇA

✅ A migration tem proteções:

- BEGIN/COMMIT para transação atômica
- IF NOT EXISTS para evitar duplicação
- Comentários em todas as colunas
- Pode ser executada múltiplas vezes sem problema

---

## 📞 SUPORTE

Se encontrar problemas:

1. **NÃO FAÇA ROLLBACK** se já fez COMMIT
2. Verifique os logs de erro
3. Consulte a documentação do Neon/PostgreSQL
4. Em último caso, restaure o backup

---

## ✅ APÓS EXECUÇÃO

1. Marque este arquivo como executado
2. Teste criar um pagamento
3. Verifique os logs do Vercel
4. Monitore por 30 minutos

---

**Arquivo da migration:** `database/migrations/EXECUTAR_EM_PRODUCAO_asaas_migration.sql`

**Data de criação:** 17/02/2026  
**Responsável:** Sistema Asaas Payment Gateway  
**Ambiente:** PRODUÇÃO

# ⚡ QUICK REFERENCE - DEPLOYMENT EM PRODUÇÃO

## Checklist de 1 página para AGORA!

**Data:** 16 fevereiro 2026 | **Duração:** ~2-3 horas | **Risco:** 🔴 CRÍTICA

---

## 🎯 O QUE VOCÊ VAI FAZER

Você vai **copiar 13 alterações de DEV para PROD** e depois **testar 4 sistemas críticos**.

Tudo isso sem derrubar a produção (modo manutenção opcional).

---

## 📋 PASSO 0: PLÁNEJAMENTO (5 min)

```
☐ Ter backup do banco (OBRIGATÓRIO)
  → pg_dump > backup-prod-2026-02-16.sql

☐ Ter credenciais Asaas (API Key + Webhook)
  → https://app.asaas.com → Configurações → Desenvolvedores

☐ Ter acesso SSH/RDP ao servidor PROD
  → ssh usuario@prod-server
  → cd /opt/qwork  (verificar caminho correto)

☐ COMUNICAR aos usuários (opcional)
  → "Manutenção de 1h, sistema offline brevemente"
```

---

## 🗄️ PASSO 1: BANCO DE DADOS (30 min)

### 1A: Executar Migração 165 (PRIMEIRO!)

```bash
# Conectar ao banco
psql -U user -d qwork_prod -h localhost

# Copiar/colar TUDO abaixo (de uma vez):

DROP TRIGGER IF EXISTS trigger_atualizar_ultima_avaliacao ON lotes_avaliacao;
DROP FUNCTION IF EXISTS atualizar_ultima_avaliacao_funcionario();

CREATE OR REPLACE FUNCTION atualizar_ultima_avaliacao_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE funcionarios
  SET ultima_avaliacao_id = NEW.id,
      ultima_avaliacao_data = NEW.criado_em,
      ultima_avaliacao_score = NEW.score,
      atualizado_em = NOW()
  WHERE id = NEW.funcionario_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_ultima_avaliacao
AFTER INSERT OR UPDATE ON lotes_avaliacao
FOR EACH ROW
EXECUTE FUNCTION atualizar_ultima_avaliacao_funcionario();

COMMIT;
```

**Esperado:** Sem erros

### 1B: Verificação Rápida dos Laudos

```sql
-- Se houver laudos "órfãos" (PDF mas status='rascunho'):
SELECT COUNT(*) as problematicos
FROM laudos
WHERE hash_pdf IS NOT NULL
  AND status = 'rascunho'
  AND arquivo_remoto_url IS NULL;

-- Se > 0, executar:
UPDATE laudos
SET status = 'emitido', emitido_em = NOW(), atualizado_em = NOW()
WHERE hash_pdf IS NOT NULL
  AND status = 'rascunho'
  AND arquivo_remoto_url IS NULL;

SELECT COUNT(*) FROM laudos WHERE status = 'emitido';
-- Anotar o número retornado
```

### 1C: Criar Tabela Asaas

```sql
CREATE TABLE IF NOT EXISTS asaas_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id UUID NOT NULL,
  asaas_customer_id VARCHAR(255),
  asaas_invoice_id VARCHAR(255) UNIQUE,
  asaas_status VARCHAR(50),
  valor_original DECIMAL(10,2),
  taxa_asaas DECIMAL(10,2),
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  boleto_numero VARCHAR(47),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);
COMMIT;
```

---

## 🔐 PASSO 2: VARIÁVEIS DE AMBIENTE (10 min)

### 2A: Editar `.env.production` ou `.env.local`

```bash
# SSH no servidor
ssh usuario@prod-server

# Editar arquivo de .env
nano /opt/qwork/.env.local
# ou
nano /opt/qwork/.env.production

# ADICIONAR estas linhas (copiar/colar):

# ASAAS PAYMENT GATEWAY
ASAAS_API_KEY=chave_api_asaas_aqui
ASAAS_WEBHOOK_SECRET=webhook_secret_aqui
ASAAS_API_URL=https://api.asaas.com
ASAAS_CUSTOMER_ID=seu_customer_id_asaas
ASAAS_WEBHOOK_VALIDATION_ENABLED=true
NEXT_PUBLIC_PAYMENT_PROVIDER=asaas
ASAAS_PIX_ENABLED=true
ASAAS_BOLETO_ENABLED=true
ASAAS_DEBUG_MODE=false
```

**Salvar:** Ctrl+X → Y → Enter

---

## 💾 PASSO 3: DEPLOY DE CÓDIGO (45 min)

### Opção A: Via Git (RECOMENDADO)

```bash
cd /opt/qwork

# 1. Verificar branch
git status
# Esperado: "On branch main"

# 2. Stash de qualquer mudança local
git stash

# 3. Pull de todas as alterações DEV
git pull origin main

# 4. Instalar dependências
npm install

# 5. Build do Next.js
npm run build

# ⚠️ AGUARDAR até terminar (pode demorar 1-2 min)
# Esperado: "ready - started server on 0.0.0.0:3000, url: http://localhost:3000"
# Esperado: ZERO erros
```

### Opção B: Via SCP (Se problemas com Git)

```bash
# Do seu computador local (em pasta com código DEV):
scp -r lib/laudo-auto.ts usuario@prod-server:/opt/qwork/lib/
scp -r lib/asaas/* usuario@prod-server:/opt/qwork/lib/asaas/
scp -r app/api/pagamento/asaas/* usuario@prod-server:/opt/qwork/app/api/pagamento/asaas/
scp -r app/api/emissor/laudos usuario@prod-server:/opt/qwork/app/api/emissor/
scp -r components/CheckoutAsaas.tsx usuario@prod-server:/opt/qwork/components/
scp -r lib/auth/date-validator.ts usuario@prod-server:/opt/qwork/lib/auth/
scp -r lib/auth/password-generator-corrigido.ts usuario@prod-server:/opt/qwork/lib/auth/

# SSH e fazer build
ssh usuario@prod-server
cd /opt/qwork
npm run build
```

### Após qualquer opcão: Restart

```bash
# Se usando PM2:
pm2 restart qwork-prod

# Se usando systemd:
systemctl restart qwork-prod
systemctl status qwork-prod  # Verificar se está UP

# Se usando Docker:
docker restart qwork-prod

# Aguardar ~30 segundos pela aplicação iniciar
sleep 30
```

---

## ✅ PASSO 4: TESTES IMEDIATOS (20 min)

### 4A: Health Check

```bash
# 1. Verificar se app está respondendo
curl -I http://prod.qwork.com/
# Esperado: HTTP 200

# 2. Verificar logs
pm2 logs qwork-prod | head -50
# Esperado: NENHUM erro, apenas "info" messages

# 3. Verificar banco
curl -H "Authorization: Bearer $TOKEN" \
  http://prod.qwork.com/api/health/db
# Esperado: {"status": "healthy"}
```

### 4B: Teste Q37 (1.5 min)

```text
1. Abrir navegador → http://prod.qwork.com
2. Login como avaliador
3. Ir para "Lotes de Avaliação"
4. Clicar em um lote
5. Preencher questão 37 (última)
6. Clicar "Salvar"

✓ ESPERADO: Salva sem erro
✗ ERRO: Se der erro → Migração 165 falhou
```

### 4C: Teste Geração Laudo (2 min)

```text
1. Ir para "Laudos para Emitir"
2. Clicar em um lote
3. Clicar "Gerar Laudo"
4. Aguardar PDF gerar (pode levar 10-20s)

✓ ESPERADO: Card vai para aba "Laudo Emitido"
✓ ESPERADO: Botão agora mostra "Enviar ao Bucket"
✗ ERRO: Card continua em "Laudo para Emitir" → código 1 falhou
```

### 4D: Teste Upload Bucket (2 min)

```text
1. Nesta mesma tela, clicar "Enviar ao Bucket"
2. Aguardar (pode demorar 5-10s)

✓ ESPERADO: Botão muda para "Sincronizado"
✓ ESPERADO: Solicitante vê "Laudo Disponível"
✗ ERRO: Falha no upload → código 3 falhou
```

### 4E: Teste Asaas (1 min)

```bash
# Testar se API Asaas está conectada
curl -X POST http://prod.qwork.com/api/pagamento/asaas/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": "teste",
    "valor": 10.00,
    "tipo": "PIX"
  }'

# ✓ ESPERADO: Retorna um QR Code PIX
# ✗ ERRO: 401 ou "API Key invalid" → credenciais Asaas erradas
```

---

## 📊 RESULTADO DOS TESTES

| Teste         | Status | Se FALHAR                             |
| ------------- | ------ | ------------------------------------- |
| Q37 Salva     | ✓ OK   | Rollback Migração 165                 |
| Laudo Emitido | ✓ OK   | Rollback código 1 (lib/laudo-auto.ts) |
| Upload Bucket | ✓ OK   | Rollback código 3 (upload/route.ts)   |
| Asaas PIX     | ✓ OK   | Verificar ASAAS_API_KEY no .env       |

---

## 🎯 RESULTADO FINAL

Se todos 4 testes passaram:

```
🟢 SISTEMA PRONTO PARA PRODUÇÃO!

Anunciar:
- Q37 salva corretamente
- Laudos vão para aba correta após geração
- Upload ao bucket agora funciona
- Sistema de pagamento Asaas está online
- Senhas com datas inválidas são rejeitadas
```

---

## 🚨 ROLLBACK DE EMERGÊNCIA

**Se algo quebrou e precisa voltar rapidinho:**

### Opção 1: Git Revert

```bash
cd /opt/qwork
git log --oneline | head -3
git revert COMMIT_SHA
npm run build
pm2 restart qwork-prod
```

### Opção 2: Banco

```bash
# Se banco ficou quebrado:
psql -U postgres -d qwork_prod < backup-prod-2026-02-16.sql
# Vai levar 5-10 minutos dependendo tamanho

systemctl restart qwork-prod
```

### Opção 3: Nuclear

```bash
# Se tudo quebrou, restaurar backup completo:
# Contato suporte banco (Neon ou PostgreSQL host)
# Restaurar da versão anterior
# Restore do servidor de file backup
```

---

## ⏱️ CRONOGRAMA

```
13:00 - Backup banco
13:05 - Iniciar manutenção (aviso aos usuários)
13:06 - Executar Migração 165
13:10 - Criar table Asaas
13:15 - Atualizar .env
13:20 - Git pull + npm build (aguardar)
13:30 - Restart servidor
13:35 - Health checks
13:40 - Teste Q37
13:42 - Teste Laudo
13:45 - Teste Upload
13:47 - Teste Asaas
13:50 - ✅ PRONTO se todos OK
13:51 - Comunicar aos usuários: "Manutenção concluída"
```

**Total: ~50 minutos com folga**

---

## 📞 SUPORTE RÁPIDO

| Problema            | Solução                                                 |
| ------------------- | ------------------------------------------------------- |
| Migração 165 falha  | Contato: DBA do banco                                   |
| Build falha         | `rm -rf .next node_modules && npm install && npm build` |
| Asaas 401           | Verificar ASAAS_API_KEY em .env                         |
| Laudo em aba errada | Re-sync: UPDATE laudos SET status='emitido'...          |
| Upload falha        | Verificar espaço em disco / conexão S3                  |
| Banco offline       | Restaurar backup AGORA                                  |

---

## ✅ CHECKLIST FINAL (antes de comunicar sucesso)

```
☐ Health check OK (HTTP 200)
☐ Q37 salva sem erro
☐ Laudo gerado → aba "Emitido" (não "Para Emitir")
☐ Upload ao bucket → botão "Sincronizado"
☐ Asaas retorna QR Code PIX
☐ Nenhum erro nos logs (pm2 logs)
☐ Banco conectado (queries rápidas)
☐ Usuários podem fazer login
☐ Backup do banco feito ANTES de tudo
☐ Todos os 13 arquivos em lugar certo
```

Se tudo checado → **DEPLOY COMPLETADO COM SUCESSO!**

---

**Gerado:** 16 de fevereiro 2026  
**Versão:** Final  
**Próximo passo:** Iniciar em PASSO 1 (Banco de Dados)

# 🚀 INSTRUÇÕES DE RESTART SERVIDOR PRODUÇÃO
## Após aplicar migrações SQL e fazer deploy do código

**Data:** 16 de fevereiro de 2026  
**Pré-requisito:** Migrações SQL executadas + Build completado

---

## ⚙️ OPÇÕES DE RESTART

### Opção 1: PM2 (Recomendado para Node.js)

```bash
# Restart da aplicação
pm2 restart qwork-prod

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs qwork-prod --lines 50

# Se precisar reload (zero-downtime)
pm2 reload qwork-prod
```

### Opção 2: Systemd (Linux)

```bash
# Restart do serviço
sudo systemctl restart qwork-prod

# Verificar status
sudo systemctl status qwork-prod

# Ver logs
sudo journalctl -u qwork-prod -n 100 -f
```

### Opção 3: Docker

```bash
# Rebuild e restart
docker-compose down
docker-compose up -d --build

# Ou restart simples
docker restart qwork-prod

# Ver logs
docker logs -f qwork-prod --tail 100
```

### Opção 4: Vercel/Serverless

```bash
# Deploy automático via Git
git push origin main

# Ou via CLI
vercel --prod

# Verificar deployment
vercel ls
```

### Opção 5: Manual (Next.js standalone)

```bash
# Parar processo atual
pkill -f "next start"

# Ou se tiver PID
kill -9 <PID>

# Iniciar novamente
cd /opt/qwork
NODE_ENV=production pnpm start &

# Verificar se está rodando
ps aux | grep "next start"
```

---

## ✅ VERIFICAÇÕES PÓS-RESTART

### 1. Servidor UP (30 segundos de aguardo)

```bash
# Aguardar inicialização
sleep 30

# Verificar porta (Next.js default: 3000)
netstat -tuln | grep 3000
# OU
lsof -i :3000

# Teste HTTP
curl -I http://localhost:3000/
# Esperado: HTTP/1.1 200 OK
```

### 2. Health Check de Aplicação

```bash
# Se tiver rota /api/health
curl http://localhost:3000/api/health
# Esperado: {"status":"ok"}

# Verificar conexão com banco
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/admin/account-info
# Esperado: Resposta JSON com dados
```

### 3. Verificar Logs (primeiros 2 minutos)

```bash
# PM2
pm2 logs qwork-prod --lines 50 | grep -i error
# Esperado: NENHUM erro

# Systemd
journalctl -u qwork-prod -n 50 | grep -i error
# Esperado: NENHUM erro

# Docker
docker logs qwork-prod --tail 50 | grep -i error
# Esperado: NENHUM erro
```

### 4. Verificar Migrações Aplicadas

```bash
# Conectar ao banco
psql -U postgres -d qwork_prod

# Verificar trigger Q37
SELECT COUNT(*) FROM information_schema.triggers 
WHERE trigger_name = 'trigger_atualizar_ultima_avaliacao';
-- Esperado: 1

# Verificar tabela Asaas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name = 'asaas_pagamentos';
-- Esperado: 1

# Sair do psql
\q
```

---

## 🔥 TESTES FUNCIONAIS IMEDIATOS

### Teste 1: Q37 Salva Corretamente (2 min)

```bash
# Via cURL (se tiver endpoint de teste)
curl -X POST http://localhost:3000/api/avaliacao/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "funcionario_id": 1,
    "questao_37": "Resposta teste"
  }'

# Esperado: {"success": true}
```

**OU testar via UI:**
1. Login como avaliador
2. Abrir lote de avaliação
3. Preencher questão 37
4. Clicar "Salvar"
5. ✅ Deve salvar sem erro

### Teste 2: Laudo em Aba Correta (3 min)

```bash
# Verificar status após geração
curl http://localhost:3000/api/emissor/lotes \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.lotes[] | select(.id==1) | {id, _emitido, status}'

# Esperado:
# {
#   "id": 1,
#   "_emitido": true,
#   "status": "emitido"
# }
```

**OU testar via UI:**
1. Login como emissor
2. Ir para "Laudos"
3. Gerar um laudo
4. ✅ Card deve aparecer em "Laudo Emitido" (não "Para Emitir")
5. ✅ Botão deve ser "Enviar ao Bucket"

### Teste 3: Upload ao Bucket (2 min)

```bash
# Testar upload
curl -X POST http://localhost:3000/api/emissor/laudos/1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@laudo-teste.pdf"

# Esperado: {"success": true, "url": "..."}
```

**OU testar via UI:**
1. Clicar "Enviar ao Bucket"
2. ✅ Botão muda para "Sincronizado"
3. ✅ Solicitante vê laudo disponível

### Teste 4: Asaas Payment (1 min)

```bash
# Testar criação de cobrança PIX
curl -X POST http://localhost:3000/api/pagamento/asaas/criar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": "teste",
    "valor": 10.00,
    "tipo": "PIX"
  }'

# Esperado: 
# {
#   "success": true,
#   "pix": {
#     "qrCode": "00020126...",
#     "copyPaste": "00020126..."
#   }
# }
```

---

## 📊 CHECKLIST FINAL PÓS-RESTART

```
SERVIDOR:
☐ Processo Node.js rodando (ps aux | grep next)
☐ Porta 3000 aberta (netstat -tuln | grep 3000)
☐ HTTP 200 em / (curl -I localhost:3000)
☐ Sem erros nos logs (últimos 50 linhas)

BANCO DE DADOS:
☐ Trigger Q37 existe (1 row)
☐ Tabela asaas_pagamentos existe (1 row)
☐ Laudos órfãos corrigidos (verificar SQL)

FUNCIONALIDADES:
☐ Q37 salva sem erro
☐ Laudo gerado → aba "Emitido" (não "Para Emitir")
☐ Upload ao bucket → status "Sincronizado"
☐ Asaas retorna QR Code PIX

PERFORMANCE:
☐ Tempo de resposta API < 2s
☐ Uso de CPU < 80%
☐ Uso de memória < 85%
☐ Conexões DB < 50
```

---

## 🚨 TROUBLESHOOTING

### Problema 1: Servidor não inicia

```bash
# Verificar porta ocupada
lsof -i :3000
kill -9 <PID>

# Verificar permissões
ls -la /opt/qwork/.next

# Verificar .env
cat /opt/qwork/.env.local | grep DATABASE_URL
```

### Problema 2: Erro "Cannot find module"

```bash
# Reinstalar dependências
cd /opt/qwork
rm -rf node_modules .next
pnpm install
pnpm build
pm2 restart qwork-prod
```

### Problema 3: Erro de banco

```bash
# Verificar conexão
psql -U postgres -d qwork_prod -c "SELECT 1;"

# Verificar pool de conexões
psql -U postgres -d qwork_prod -c "SELECT count(*) FROM pg_stat_activity;"

# Se > 100, matar conexões antigas
psql -U postgres -d qwork_prod -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE datname = 'qwork_prod' 
  AND state = 'idle' 
  AND state_change < now() - interval '5 minutes';
"
```

### Problema 4: Build quebrou no restart

```bash
# Voltar para versão anterior (Git)
cd /opt/qwork
git log --oneline | head -5
git reset --hard COMMIT_ANTERIOR

# Rebuild
pnpm build
pm2 restart qwork-prod
```

---

## 🎯 SUCESSO!

Se todos os checkboxes estão marcados:

```
✅ DEPLOYMENT CONCLUÍDO COM SUCESSO!

Próximos passos:
1. Comunicar aos usuários que sistema está online
2. Monitorar logs por 1-2 horas
3. Verificar métricas de erro (deve ser < 0.1%)
4. Fazer backup incremental do banco após 24h
5. Documentar quaisquer issues encontrados
```

---

**Documento criado:** 16 de fevereiro 2026  
**Próximo:** Executar script de validação pós-deploy

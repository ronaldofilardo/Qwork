# Instruções de Deploy: Separação Contrato e Recibo

## 📋 Checklist Pré-Deploy

### 1. Desenvolvimento Local

- [ ] Migration `041_criar_tabela_recibos.sql` testada localmente
- [ ] Testes unitários passando (`pnpm test`)
- [ ] API `/api/recibo/gerar` funcionando
- [ ] Página `/recibo/[id]` renderizando corretamente
- [ ] Fluxo completo testado: contrato → pagamento → recibo

### 2. Banco de Dados de Teste

- [ ] Migration aplicada em `nr-bps_db_test`
- [ ] Testes de integração passando
- [ ] View `vw_recibos_completos` funcionando
- [ ] Funções `gerar_numero_recibo()` e `calcular_vigencia_fim()` testadas

### 3. Validações de Código

- [ ] TypeScript sem erros (`pnpm build`)
- [ ] ESLint sem erros críticos
- [ ] Imports organizados
- [ ] Console.logs removidos (exceto logs estruturados)

---

## 🚀 Deploy para Produção

### Passo 1: Backup do Banco Atual

```bash
# Criar backup antes de qualquer alteração
pg_dump -h [NEON_HOST] -U [USER] -d [DATABASE] > backup-pre-recibos-$(date +%Y%m%d-%H%M%S).sql
```

### Passo 2: Aplicar Migration no Neon

**Opção A: Via Script de Sync (Recomendado)**

```powershell
# O script sync-dev-to-prod.ps1 já aplica todas as migrations
.\scripts\powershell\sync-dev-to-prod.ps1
```

**Opção B: Manual (via psql)**

```powershell
# Definir DATABASE_URL do Neon
$env:DATABASE_URL = "postgresql://user:pass@host.neon.tech/dbname?sslmode=require"

# Aplicar migration
psql $env:DATABASE_URL -f database/migrations/041_criar_tabela_recibos.sql

# Verificar
psql $env:DATABASE_URL -c "SELECT * FROM information_schema.tables WHERE table_name = 'recibos';"
```

### Passo 3: Deploy no Vercel

**Via repositório remoto (Recomendado)**

```bash
# Commit das mudanças
git add .
git commit -m "feat: implementar separação contrato/recibo"
git push origin main

# Vercel detecta automaticamente e faz deploy
# Acompanhar em: https://vercel.com/seu-projeto/deployments
```

**Via CLI do Vercel**

```bash
# Deploy de produção
vercel --prod

# Verificar logs
vercel logs
```

### Passo 4: Validação Pós-Deploy

#### 4.1 Verificar Banco de Dados

```sql
-- Conectar ao Neon via psql
psql $env:DATABASE_URL

-- Verificar tabela
\d recibos

-- Verificar view
SELECT * FROM vw_recibos_completos LIMIT 1;

-- Verificar função
SELECT gerar_numero_recibo();

-- Testar cálculo de vigência
SELECT calcular_vigencia_fim('2025-12-22'::DATE);
```

#### 4.2 Testar APIs em Produção

```bash
# Verificar health check
curl https://{PROD_BASE_URL}/api/health

# Testar geração de recibo (após ter contrato e pagamento válidos)
curl -X POST https://seu-dominio.vercel.app/api/recibo/gerar \
  -H "Content-Type: application/json" \
  -d '{
    "contrato_id": 1,
    "pagamento_id": 5
  }'

# Buscar recibo
curl https://seu-dominio.vercel.app/api/recibo/gerar?id=1
```

#### 4.3 Testar Fluxo Completo no Browser

1. Acessar `https://seu-dominio.vercel.app/login`
2. Fazer novo cadastro de contratante
3. Selecionar plano e aceitar contrato
4. Simular pagamento
5. Verificar se recibo foi gerado
6. Acessar `/recibo/[id]` e validar informações

### Passo 5: Monitoramento Inicial

**Primeiras 24 horas após deploy:**

```sql
-- Verificar recibos gerados
SELECT COUNT(*) as total_recibos FROM recibos;

-- Verificar erros
SELECT * FROM recibos WHERE ativo = false;

-- Verificar vigências
SELECT
  AVG(EXTRACT(DAY FROM (vigencia_fim - vigencia_inicio))) as dias_vigencia_media
FROM recibos;
-- Deve retornar ~364 dias

-- Verificar valores
SELECT
  MIN(valor_total_anual) as menor_valor,
  MAX(valor_total_anual) as maior_valor,
  AVG(valor_total_anual) as valor_medio
FROM recibos;
```

**Logs da Vercel:**

```bash
# Verificar logs de produção
vercel logs --follow

# Filtrar erros de recibo
vercel logs | grep -i recibo
```

---

## 🔄 Rollback (Se Necessário)

### Se houver problemas críticos:

#### 1. Reverter Deploy no Vercel

```bash
# Listar deployments
vercel ls

# Promover deployment anterior para produção
vercel promote [deployment-url]
```

#### 2. Reverter Migration no Banco

```sql
-- Conectar ao Neon
psql $env:DATABASE_URL

-- Remover view
DROP VIEW IF EXISTS vw_recibos_completos CASCADE;

-- Remover triggers
DROP TRIGGER IF EXISTS trg_gerar_numero_recibo ON recibos;
DROP TRIGGER IF EXISTS trg_recibos_atualizar_data ON recibos;

-- Remover funções
DROP FUNCTION IF EXISTS trigger_gerar_numero_recibo() CASCADE;
DROP FUNCTION IF EXISTS gerar_numero_recibo() CASCADE;
DROP FUNCTION IF EXISTS calcular_vigencia_fim(DATE) CASCADE;

-- Remover tabela
DROP TABLE IF EXISTS recibos CASCADE;
```

#### 3. Restaurar Backup

```powershell
# Se tudo der errado, restaurar backup completo
psql $env:DATABASE_URL < backup-pre-recibos-YYYYMMDD-HHMMSS.sql
```

---

## 📊 Métricas de Sucesso

### KPIs a Monitorar

**Primeiras 24h:**

- Recibos gerados com sucesso: > 90%
- Tempo médio de geração: < 2 segundos
- Erros na API: < 1%

**Primeira semana:**

- Reclamações de usuários: 0
- Recibos acessados: > 50% dos gerados
- Impressões/downloads: > 30%

**Primeiro mês:**

- Satisfação com novo fluxo: > 4.5/5
- Redução de dúvidas sobre valores: > 40%
- Tempo de suporte reduzido: > 25%

---

## 🐛 Troubleshooting Comum

### Problema: Migration falhou no Neon

**Sintoma:** Erro ao executar migration

**Diagnóstico:**

```sql
-- Verificar se tabela já existe
SELECT * FROM information_schema.tables WHERE table_name = 'recibos';

-- Verificar dependências
SELECT * FROM information_schema.table_constraints WHERE table_name = 'recibos';
```

**Solução:**

```sql
-- Se tabela existir mas estiver incompleta, drop e recrie
DROP TABLE IF EXISTS recibos CASCADE;
-- Executar migration novamente
```

---

### Problema: Recibo não é gerado após pagamento

**Sintoma:** Pagamento confirmado mas sem recibo

**Diagnóstico:**

```sql
-- Verificar pagamento
SELECT id, status, contrato_id FROM pagamentos WHERE id = [PAGAMENTO_ID];

-- Verificar se recibo existe
SELECT * FROM recibos WHERE pagamento_id = [PAGAMENTO_ID];

-- Verificar logs
-- Buscar em logs da Vercel por "Erro ao gerar recibo"
```

**Solução:**

```bash
# Gerar recibo manualmente via API
curl -X POST https://seu-dominio.vercel.app/api/recibo/gerar \
  -H "Content-Type: application/json" \
  -d '{
    "contrato_id": [CONTRATO_ID],
    "pagamento_id": [PAGAMENTO_ID]
  }'
```

---

### Problema: Vigência calculada incorretamente

**Sintoma:** Vigência não é 364 dias

**Diagnóstico:**

```sql
-- Verificar cálculo
SELECT
  vigencia_inicio,
  vigencia_fim,
  EXTRACT(DAY FROM (vigencia_fim - vigencia_inicio)) as dias
FROM recibos
WHERE id = [RECIBO_ID];
```

**Solução:**

```sql
-- Corrigir vigência
UPDATE recibos
SET vigencia_fim = vigencia_inicio + INTERVAL '364 days'
WHERE id = [RECIBO_ID];
```

---

### Problema: Página /recibo/[id] não carrega

**Sintoma:** 404 ou erro de rendering

**Diagnóstico:**

1. Verificar se arquivo existe: `app/recibo/[id]/page.tsx`
2. Verificar build: `pnpm build`
3. Verificar logs do browser (F12)

**Solução:**

```bash
# Rebuild e redeploy
pnpm build
vercel --prod
```

---

## 📞 Suporte de Deploy

### Contatos de Emergência

- **Deploy Issues:** Verificar [Vercel Status](https://vercel-status.com)
- **Database Issues:** Verificar [Neon Status](https://neonstatus.com)
- **Logs:** `vercel logs --follow`
- **Documentação:** `docs/SEPARACAO-CONTRATO-RECIBO.md`

### Canais de Comunicação

- Issues: (link removido)
- Slack: Canal #deploy-qwork
- Email: devops@qwork.com.br

---

## ✅ Checklist Final

### Pré-Deploy

- [ ] Código revisado e aprovado
- [ ] Testes passando (unit + integration)
- [ ] Documentação atualizada
- [ ] Backup do banco criado
- [ ] Variáveis de ambiente configuradas

### Durante Deploy

- [ ] Migration aplicada no Neon
- [ ] Deploy no Vercel concluído
- [ ] Health check passou
- [ ] APIs testadas em produção

### Pós-Deploy

- [ ] Fluxo completo testado
- [ ] Monitoramento ativo
- [ ] Logs sem erros críticos
- [ ] Comunicação para equipe enviada
- [ ] Usuários piloto testaram

---

**Preparado por:** Copilot  
**Data:** 22 de dezembro de 2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Deploy

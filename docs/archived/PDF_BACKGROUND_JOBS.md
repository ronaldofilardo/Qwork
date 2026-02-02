# Sistema de Geração de PDFs em Background

## Visão Geral

Sistema assíncrono de geração de PDFs para recibos usando jobs em Postgres + serviço externo de PDF (evita timeouts do Vercel).

## Arquitetura

1. **Trigger automático**: Quando recibo é criado sem PDF → insere job na tabela `pdf_jobs`
2. **Worker/Cron**: Processa jobs pendentes via endpoint `/api/jobs/process-pdf`
3. **Serviço PDF**: Gera PDF via API externa (PDFShift, CloudConvert, etc.)
4. **Notificação**: Cria notificação para o usuário quando PDF estiver pronto

## Setup

### 1. Variáveis de Ambiente

Adicione ao `.env.local` (desenvolvimento) e Vercel (produção):

```bash
# Serviço de PDF (escolha um provider)
PDF_SERVICE_PROVIDER=local          # local | pdfshift | cloudconvert
PDF_SERVICE_API_KEY=your_api_key_here  # Para providers externos
PDF_SERVICE_API_URL=https://api.service.com  # Se aplicável

# URL base da aplicação
BASE_URL=http://localhost:3000      # Dev
# BASE_URL=https://your-app.vercel.app  # Prod

# Secret para proteger endpoint de cron (gere com: openssl rand -base64 32)
CRON_SECRET=your_secret_here
```

### 2. Providers de PDF Suportados

**Local (desenvolvimento apenas)**:

- Provider: `local`
- Usa Puppeteer localmente
- Não recomendado para produção (timeout)

**PDFShift (recomendado para Vercel)**:

- Provider: `pdfshift`
- Plano free: 250 PDFs/mês
- API Key: https://pdfshift.io/
- Exemplo:
  ```bash
  PDF_SERVICE_PROVIDER=pdfshift
  PDF_SERVICE_API_KEY=sk_xxxxxxxxxxxxxxxx
  ```

**CloudConvert (alternativa)**:

- Provider: `cloudconvert`
- Suporta múltiplos formatos
- API Key: https://cloudconvert.com/

### 3. Configurar Vercel Cron

Adicione ao `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/jobs/process-pdf",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Isso executa o processamento de jobs a cada 5 minutos.

## Uso

### Enfileirar job manualmente

```typescript
import { enqueuePdfJob } from '@/lib/pdf-service';

// Após criar recibo
const reciboId = 123;
await enqueuePdfJob(reciboId);
```

### Processar jobs localmente

```bash
# Via script Node
node scripts/fixes/process_pdf_jobs.mjs

# Via API (simula cron)
curl -X POST http://localhost:3000/api/jobs/process-pdf \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Monitorar status

```bash
# Health check
curl http://localhost:3000/api/jobs/process-pdf

# Resposta:
{
  "success": true,
  "jobs": {
    "pending": 3,
    "processing": 1,
    "completed": 50,
    "failed": 2
  },
  "provider": "pdfshift"
}
```

### Verificar jobs no banco

```sql
-- Jobs pendentes
SELECT * FROM pdf_jobs WHERE status = 'pending' ORDER BY created_at;

-- Jobs que falharam
SELECT * FROM pdf_jobs WHERE status = 'failed';

-- Reprocessar job falhado
UPDATE pdf_jobs SET status = 'pending', attempts = 0 WHERE id = 123;
```

## Fluxo de Trabalho

1. **Pagamento confirmado** → cria recibo sem PDF
2. **Trigger automático** → insere job `pending` em `pdf_jobs`
3. **Cron job (5 min)** → chama `/api/jobs/process-pdf`
4. **Endpoint API** → processa até 3 jobs por execução:
   - Marca job como `processing`
   - Chama serviço externo de PDF
   - Atualiza `recibos.pdf` e `recibos.hash_pdf`
   - Marca job como `completed`
   - Cria notificação para o usuário
5. **Usuário** → recebe notificação e pode visualizar/baixar PDF

## Retry e Failover

- **Tentativas**: Até 3 tentativas automáticas por job
- **Backoff**: Job falho retorna para `pending` (processado na próxima rodada)
- **Falha permanente**: Após 3 tentativas, status `failed` (requer intervenção manual)

## Monitoramento

### Logs

- Jobs processados: `console.log` no worker/API
- Erros: `error_message` na tabela `pdf_jobs`
- Vercel: Logs em tempo real no dashboard

### Alertas

Configurar alertas para:

- Alta taxa de falhas (>10% jobs failed)
- Jobs pendentes acumulados (>50 por mais de 1 hora)
- Timeout do Vercel (ajustar limite de jobs por execução)

## Troubleshooting

### Jobs ficam em `pending` indefinidamente

- Verificar se cron está configurado no Vercel
- Testar endpoint manualmente: `POST /api/jobs/process-pdf`
- Verificar logs do Vercel

### Jobs sempre falham

- Verificar API key do provider de PDF
- Verificar se URL base está correta (`BASE_URL`)
- Verificar se rota `/recibo/:numero` está acessível publicamente

### Timeout no Vercel

- Reduzir limite de jobs por execução (default: 3)
- Considerar usar worker dedicado em vez de cron

## Migração de Recibos Antigos

Para gerar PDFs de recibos existentes:

```bash
# 1. Enfileirar todos os recibos sem PDF
INSERT INTO pdf_jobs (recibo_id, status, attempts)
SELECT id, 'pending', 0 FROM recibos WHERE pdf IS NULL AND ativo = true
ON CONFLICT (recibo_id) DO NOTHING;

# 2. Processar via script (recomendado para lotes grandes)
node scripts/fixes/process_pdf_jobs.mjs
```

## Custos Estimados

**PDFShift (plano free)**:

- 250 PDFs/mês grátis
- $0.01 por PDF adicional
- Estimativa: ~$5-10/mês para 500-1000 PDFs

**Vercel (plano free)**:

- Cron jobs inclusos
- Limite de execução: 10s por função
- Sem custos adicionais para este fluxo

## Próximos Passos

- [ ] Configurar provider de PDF (PDFShift ou CloudConvert)
- [ ] Testar localmente com script worker
- [ ] Deploy no Vercel com cron configurado
- [ ] Monitorar logs e ajustar frequência do cron
- [ ] Implementar dashboard de monitoramento (opcional)

# 📚 Guia de Uso - Melhorias de Emissão de Laudo

Este guia demonstra como utilizar todas as novas funcionalidades implementadas.

---

## 🎯 1. Máquina de Estados

### Verificar se pode fazer transição

```typescript
import { validarTransicaoStatus } from '@/lib/types/lote-status';

// Antes de mudar status
const resultado = validarTransicaoStatus('concluido', 'emissao_solicitada');

if (resultado.valido) {
  // Fazer update
  await query('UPDATE lotes_avaliacao SET status = $1 WHERE id = $2', [
    'emissao_solicitada',
    loteId,
  ]);
} else {
  console.error('Transição inválida:', resultado.erro);
}
```

### Obter cor para exibição

```typescript
import { getCorStatus, getDescricaoStatus } from '@/lib/types/lote-status';

const status = 'emissao_solicitada';
const cor = getCorStatus(status); // 'bg-yellow-100 text-yellow-800 ...'
const descricao = getDescricaoStatus(status); // 'Emissão Solicitada'

<span className={`badge ${cor}`}>{descricao}</span>
```

---

## ✅ 2. Validação Centralizada

### Backend - Validar antes de solicitar emissão

```typescript
import { validarSolicitacaoEmissao } from '@/lib/services/laudo-validation-service';

export async function POST(request: Request) {
  const { loteId } = await request.json();

  // Validar
  const validacao = await validarSolicitacaoEmissao(loteId);

  if (!validacao.valido) {
    return NextResponse.json(
      { error: validacao.erros.join(', ') },
      { status: 400 }
    );
  }

  // Avisos (não bloqueiam)
  if (validacao.avisos && validacao.avisos.length > 0) {
    console.warn('[AVISOS]', validacao.avisos);
  }

  // Prosseguir com solicitação...
}
```

### Frontend - Validar antes de exibir botão

```typescript
import { useValidacaoEmissao } from '@/lib/hooks/useValidacaoEmissao';

function BotaoEmissao({ lote }) {
  const validacao = useValidacaoEmissao({
    loteId: lote.id,
    status: lote.status,
    totalAvaliacoes: lote.total_avaliacoes,
    avaliacoesConcluidas: lote.avaliacoes_concluidas,
    avaliacoesInativadas: lote.avaliacoes_inativadas,
    temLaudo: Boolean(lote.laudo_id),
    laudoStatus: lote.laudo_status,
    emissaoSolicitada: lote.emissao_solicitada
  });

  if (!validacao.podeEmitir) {
    return (
      <div>
        <p>Não é possível emitir:</p>
        <ul>
          {validacao.erros.map((erro, idx) => (
            <li key={idx}>{erro}</li>
          ))}
        </ul>
      </div>
    );
  }

  return <button onClick={handleEmitir}>Solicitar Emissão</button>;
}
```

### Validar integridade de PDF

```typescript
import { validarIntegridadePDF } from '@/lib/services/laudo-validation-service';

// Após download do PDF
const pdfBuffer = await downloadPDF(loteId);

const validacao = await validarIntegridadePDF(loteId, pdfBuffer);

if (!validacao.valido) {
  console.error('PDF corrompido!', validacao.erros);
  // Alertar usuário
} else {
  console.log('✓ PDF íntegro, hash:', validacao.dados?.hash);
}
```

---

## 🔄 3. Retry Policy

### Retry para Puppeteer

```typescript
import { executarComRetry, RETRY_CONFIGS } from '@/lib/services/retry-service';

async function gerarPDFComRetry(loteId: number) {
  return await executarComRetry(
    async () => {
      // Função que pode falhar
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(
        `http://localhost:3000/api/emissor/laudos/${loteId}/html`,
        {
          waitUntil: 'networkidle0',
          timeout: 30000,
        }
      );

      const pdf = await page.pdf({ format: 'A4' });
      await browser.close();

      return pdf;
    },
    RETRY_CONFIGS.PUPPETEER, // 3 tentativas, timeout 2min
    `gerar-pdf-lote-${loteId}`
  );
}
```

### Retry para Backblaze

```typescript
import { executarComRetry, RETRY_CONFIGS } from '@/lib/services/retry-service';
import { B2 } from 'backblaze-b2';

async function uploadComRetry(pdfBuffer: Buffer, fileName: string) {
  return await executarComRetry(
    async () => {
      const b2 = new B2({
        applicationKeyId: process.env.B2_KEY_ID!,
        applicationKey: process.env.B2_KEY!,
      });

      await b2.authorize();

      const { data } = await b2.getUploadUrl({
        bucketId: process.env.B2_BUCKET_ID!,
      });

      const response = await b2.uploadFile({
        uploadUrl: data.uploadUrl,
        uploadAuthToken: data.authorizationToken,
        fileName,
        data: pdfBuffer,
      });

      return response.data.fileId;
    },
    RETRY_CONFIGS.BACKBLAZE, // 5 tentativas, timeout 5min
    `upload-${fileName}`
  );
}
```

### Retry customizado

```typescript
import { executarComRetry } from '@/lib/services/retry-service';

const config = {
  maxTentativas: 4,
  delayInicial: 1000,
  multiplicador: 1.5,
  delayMaximo: 15000,
  timeout: 60000,
  usarJitter: true,
  deveRetentar: (erro: Error) => {
    // Retentar apenas erros específicos
    return erro.message.includes('ECONNRESET') || erro.message.includes('503');
  },
};

const resultado = await executarComRetry(
  minhaOperacao,
  config,
  'operacao-customizada'
);
```

### Monitorar métricas

```typescript
import {
  getMetricas,
  getCircuitBreakersStatus,
} from '@/lib/services/retry-service';

// Endpoint de health check
export async function GET() {
  const metricas = getMetricas();
  const circuitBreakers = getCircuitBreakersStatus();

  return NextResponse.json({
    metricas: {
      total: metricas.length,
      sucessos: metricas.filter((m) => m.sucesso).length,
      falhas: metricas.filter((m) => !m.sucesso).length,
      detalhes: metricas.slice(-10), // Últimas 10
    },
    circuitBreakers,
  });
}
```

---

## 📊 4. Feedback em Tempo Real

### Usar hook de progresso

```typescript
'use client';

import { useProgressoEmissao } from '@/lib/hooks/useProgressoEmissao';
import { BarraProgressoEmissao } from '@/components/BarraProgressoEmissao';

function TelaEmissao({ loteId }: { loteId: number }) {
  const { progresso, monitorando, iniciarMonitoramento } = useProgressoEmissao({
    loteId,
    onConcluido: (resultado) => {
      console.log('Emissão concluída!', resultado);
      // Redirecionar ou atualizar UI
    },
    onErro: (erro) => {
      console.error('Erro na emissão:', erro);
      alert(erro);
    }
  });

  const handleIniciar = async () => {
    // Solicitar emissão
    await fetch(`/api/lotes/${loteId}/solicitar-emissao`, {
      method: 'POST'
    });

    // Iniciar monitoramento
    iniciarMonitoramento();
  };

  return (
    <div>
      <button onClick={handleIniciar} disabled={monitorando}>
        Solicitar Emissão
      </button>

      {monitorando && <BarraProgressoEmissao loteId={loteId} autoIniciar />}
    </div>
  );
}
```

### Endpoint de progresso (já implementado)

```typescript
// GET /api/emissor/laudos/[loteId]/progresso
// Retorna:
{
  status: 'gerando_pdf',
  mensagem: 'Gerando PDF do laudo...',
  porcentagem: 50,
  etapa: 2,
  totalEtapas: 5
}
```

---

## 🔒 5. Visualização de Hash

### Exibir hash no card

```tsx
import { HashVisualizer, HashBadge } from '@/components/HashVisualizer';

// Visualizador completo
<HashVisualizer
  hash={laudo.hash_pdf}
  exibirLabel={true}
  compacto={false}
/>

// Badge compacto para lista
<HashBadge hash={laudo.hash_pdf} />
```

### Comparar hashes (verificação)

```tsx
import { HashComparador } from '@/components/HashVisualizer';

<HashComparador
  hashEsperado={laudoDB.hash_pdf}
  hashCalculado={calcularHashSHA256(pdfBuffer)}
/>;
```

---

## 🚨 6. Logs de Erro Estruturados

### Lançar erro com código

```typescript
import { ErroQWork, CodigoErro } from '@/lib/services/error-logger';

// Backend
if (lote.status !== 'concluido') {
  throw new ErroQWork(
    CodigoErro.LOTE_NAO_CONCLUIDO,
    `Lote ${loteId} não está concluído`,
    { loteId, statusAtual: lote.status }
  );
}
```

### Logar erro

```typescript
import { ErrorLogger } from '@/lib/services/error-logger';

try {
  await gerarPDF(loteId);
} catch (erro) {
  ErrorLogger.log(erro as Error, {
    loteId,
    tentativa: 3,
    timestamp: new Date(),
  });

  throw erro;
}
```

### Exibir erro no frontend

```tsx
import { ErrorCard } from '@/components/ErrorCard';

function TelaErro({ erro }) {
  return (
    <ErrorCard
      erro={erro}
      onTentarNovamente={() => {
        // Tentar novamente
      }}
      onVoltar={() => {
        router.back();
      }}
    />
  );
}
```

### Converter erro do backend

```typescript
import {
  converterErroBackend,
  getMensagemErroUsuario,
} from '@/lib/services/error-logger';

// No frontend, ao receber erro da API
const response = await fetch('/api/laudos/123');

if (!response.ok) {
  const erroData = await response.json();
  const erro = converterErroBackend(erroData);

  // Exibir mensagem amigável
  toast.error(erro.mensagemUsuario);

  // Logar detalhes
  console.error('[ERRO]', erro.toJSON());
}
```

---

## 🗄️ 7. Banco de Dados

### Buscar lotes prontos para emissão (view otimizada)

```sql
-- Usar view criada na migration
SELECT * FROM v_dashboard_emissor
ORDER BY liberado_em DESC
LIMIT 20;
```

### Buscar solicitação de emissão

```sql
-- Usar função criada na migration
SELECT * FROM fn_obter_solicitacao_emissao(123);
```

### Validar integridade com trigger

```sql
-- Tentar transição inválida (será bloqueada)
UPDATE lotes_avaliacao
SET status = 'laudo_emitido'
WHERE id = 123 AND status = 'rascunho';
-- ERROR: Transição de status inválida: rascunho -> laudo_emitido
```

---

## 🧪 8. Testes

### Testar retry policy

```typescript
import { executarComRetry, RETRY_CONFIGS } from '@/lib/services/retry-service';

test('deve retentar após falha', async () => {
  let tentativa = 0;
  const operacao = jest.fn().mockImplementation(() => {
    tentativa++;
    if (tentativa < 2) {
      throw new Error('ECONNRESET');
    }
    return Promise.resolve('ok');
  });

  const resultado = await executarComRetry(
    operacao,
    RETRY_CONFIGS.RAPIDO,
    'test'
  );

  expect(resultado).toBe('ok');
  expect(operacao).toHaveBeenCalledTimes(2);
});
```

---

## 📈 9. Monitoramento

### Health check endpoint

```typescript
// app/api/health/route.ts
import {
  getMetricas,
  getCircuitBreakersStatus,
} from '@/lib/services/retry-service';
import { query } from '@/lib/db';

export async function GET() {
  // Verificar banco
  const dbOk = await query('SELECT 1')
    .then(() => true)
    .catch(() => false);

  // Métricas de retry
  const metricas = getMetricas();
  const circuits = getCircuitBreakersStatus();

  // Verificar lotes pendentes
  const lotesPendentes = await query(
    "SELECT COUNT(*) as count FROM lotes_avaliacao WHERE status = 'emissao_solicitada'"
  );

  return NextResponse.json({
    status: dbOk ? 'healthy' : 'unhealthy',
    database: dbOk,
    retry: {
      totalOperacoes: metricas.length,
      sucessos: metricas.filter((m) => m.sucesso).length,
      falhas: metricas.filter((m) => !m.sucesso).length,
    },
    circuitBreakers: circuits,
    lotesPendentes: lotesPendentes.rows[0].count,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 🎓 10. Boas Práticas

### ✅ DO

- Usar validação centralizada em backend e frontend
- Logar erros com códigos estruturados
- Exibir hash SHA-256 para auditoria
- Usar retry para operações transientes
- Validar transições de estado
- Exibir progresso em operações longas

### ❌ DON'T

- Não fazer joins com `fila_emissao` (use auditoria)
- Não fazer transições de estado inválidas
- Não gerar laudo sem validar
- Não ignorar erros de retry
- Não alterar laudo após enviado (imutabilidade)

---

## 🆘 Troubleshooting

### Problema: Botão de emissão bloqueado

**Solução**: Verificar `validacao.erros` no componente.

```typescript
console.log('Erros:', validacao.erros);
// Ex: ["Nem todas as avaliações estão concluídas (5/10 concluídas)"]
```

### Problema: Retry não funciona

**Solução**: Verificar se erro é recuperável.

```typescript
const config = {
  ...RETRY_CONFIGS.PUPPETEER,
  deveRetentar: (erro) => {
    console.log('Verificando se deve retentar:', erro.message);
    return erro.message.includes('timeout');
  },
};
```

### Problema: Progresso não atualiza

**Solução**: Verificar endpoint `/progresso`.

```bash
curl http://localhost:3000/api/emissor/laudos/123/progresso
```

### Problema: Hash inválido

**Solução**: Verificar se PDF foi completamente salvo.

```typescript
const hash = calcularHashSHA256(pdfBuffer);
console.log('Hash calculado:', hash);
console.log('Hash armazenado:', laudoDB.hash_pdf);
```

---

**Documentação completa**: Ver `docs/IMPLEMENTACAO-MELHORIAS-EMISSAO-LAUDO.md`

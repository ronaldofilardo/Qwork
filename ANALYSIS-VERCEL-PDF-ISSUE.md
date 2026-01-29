# 🔴 ANÁLISE CRÍTICA: Falha de Geração de PDF na Vercel

**Data:** 29/01/2026  
**Severidade:** ALTA - Sistema quebrado em produção  
**Status:** Requer correção imediata

---

## 📋 Resumo do Problema

O sistema está **tentando usar Puppeteer/Chromium em produção** quando deveria usar **geração client-side (jsPDF + html2canvas)** conforme implementado em `LaudoDownloadClient.tsx`.

### Erro Vercel:

```
Error: The input directory "/vercel/path0/node_modules/.pnpm/@sparticuz+chromium@143.0.4/node_modules/@sparticuz/chromium/bin" does not exist.
Please provide the location of the brotli files.
```

---

## 🔍 Causa Raiz

### 1. **Rota de Download Incorreta**

**Arquivo:** `app/api/emissor/laudos/[loteId]/download/route.ts`

**Problema (linhas 81-89):**

```typescript
// Se não foi encontrado localmente, tentar gerar o PDF on-demand via rota de PDF
try {
  const { GET: gerarPDF } = await import('../pdf/route');
  console.log(
    `[DEBUG] Arquivo não encontrado localmente para laudo ${loteId}; acionando geração on-demand via /pdf`
  );
  return await gerarPDF(req, { params: { loteId: String(loteId) } });
} catch (err) {
```

**Por que é problema:**

- Tenta gerar PDF server-side usando Puppeteer
- Na Vercel, isso falha porque @sparticuz/chromium não está configurado corretamente
- Contradiz a arquitetura client-side implementada

### 2. **Configuração Incompleta do @sparticuz/chromium**

**Arquivo:** `lib/infrastructure/pdf/generators/pdf-generator.ts` (linhas 32-42)

**Problema:**

```typescript
const executablePath =
  (await chromiumAny.executablePath?.()) ||
  (await chromiumAny.default?.executablePath?.());
const args = chromiumAny.args || chromiumAny.default?.args || [];
```

O @sparticuz/chromium v143+ requer configuração adicional para Vercel:

- Falta `chromium.setHeadlessMode = true`
- Falta `chromium.setGraphicsMode = false`
- Path dos arquivos brotli não está correto

### 3. **Falta de Configuração Next.js para Serverless**

**Arquivo:** `next.config.cjs`

**Problema:** Falta configuração para excluir Puppeteer do bundle:

```javascript
// FALTA ISTO:
experimental: {
  serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium'],
}
```

### 4. **Arquivos Hash Não Encontrados**

```
Não foi possível calcular hash para laudo 11: ENOENT: no such file or directory, open '/var/task/storage/laudos/laudo-11.pdf'
```

Na Vercel, `/var/task/storage/` é **read-only**. PDFs não podem ser salvos localmente.

---

## 🎯 Arquitetura Esperada vs Realidade

### ✅ **Arquitetura CORRETA (Implementada mas não usada)**

```
Emissor clica "Baixar Laudo"
    ↓
Frontend chama /api/emissor/laudos/[loteId]/html
    ↓
API retorna HTML puro (sem gerar PDF)
    ↓
<LaudoDownloadClient> recebe HTML
    ↓
jsPDF + html2canvas geram PDF no navegador
    ↓
Download automático ✅
```

**Vantagens:**

- ✅ Funciona na Vercel Free/Pro
- ✅ Sem timeout
- ✅ Privacidade (PDF gerado localmente)
- ✅ Sem custos de chromium serverless

### ❌ **Realidade ATUAL (Quebrado)**

```
Emissor clica "Baixar Laudo"
    ↓
Frontend chama /api/emissor/laudos/[loteId]/download
    ↓
API tenta ler arquivo local (FALHA - Vercel é read-only)
    ↓
API importa /pdf/route para gerar on-demand
    ↓
Puppeteer tenta iniciar Chromium
    ↓
@sparticuz/chromium FALHA (brotli files not found) ❌
    ↓
ERRO 500 para o usuário
```

---

## 🔧 Soluções Necessárias

### **SOLUÇÃO 1: Redirecionar para Client-Side (RECOMENDADA)**

**O que fazer:**

1. Modificar rota `/download` para retornar HTML ao invés de tentar gerar PDF
2. Frontend usa `LaudoDownloadClient` já implementado
3. Puppeteer fica **SOMENTE** para emergências

**Mudanças:**

#### `app/api/emissor/laudos/[loteId]/download/route.ts`

```typescript
// REMOVER: Geração on-demand via Puppeteer
// ADICIONAR: Redirecionar para /html + usar LaudoDownloadClient

export const GET = async (req, params) => {
  // ... validações ...

  // Se PDF não existe localmente, retornar instruções para usar client-side
  return NextResponse.json(
    {
      success: false,
      useClientSide: true,
      message: 'Use LaudoDownloadClient para gerar PDF no navegador',
      htmlEndpoint: `/api/emissor/laudos/${loteId}/html`,
    },
    { status: 200 }
  );
};
```

#### Frontend (`app/emissor/page.tsx`)

```tsx
const handleDownloadLaudo = async (lote: Lote) => {
  // 1. Tentar download direto (se PDF já existe)
  const response = await fetch(`/api/emissor/laudos/${lote.id}/download`);

  if (
    response.ok &&
    response.headers.get('content-type') === 'application/pdf'
  ) {
    // PDF existe, fazer download
    const blob = await response.blob();
    // ... download ...
  } else {
    // PDF não existe, usar geração client-side
    const data = await response.json();
    if (data.useClientSide) {
      const htmlResponse = await fetch(data.htmlEndpoint);
      const html = await htmlResponse.text();

      // Usar LaudoDownloadClient
      // (ou criar componente dinâmico)
    }
  }
};
```

---

### **SOLUÇÃO 2: Corrigir @sparticuz/chromium (Temporária)**

**Se precisar manter Puppeteer server-side:**

#### `lib/infrastructure/pdf/generators/pdf-generator.ts`

```typescript
export async function getPuppeteerInstance() {
  if (isVercelProduction) {
    const chromium = await import('@sparticuz/chromium');
    const puppeteerCore = await import('puppeteer-core');

    // FIX: Configurar corretamente para Vercel
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    const executablePath = await chromium.executablePath();
    const args = await chromium.args;

    return {
      launch: async (options) => {
        return puppeteerCore.default.launch({
          ...options,
          executablePath,
          args: [...args, ...(Array.isArray(options.args) ? options.args : [])],
        });
      },
    };
  }
  // ... resto do código
}
```

#### `next.config.cjs`

```javascript
const nextConfig = {
  // ... existing config ...
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer',
      'puppeteer-core',
      '@sparticuz/chromium',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'canvas', 'jsdom'];
    }
    return config;
  },
};
```

#### `vercel.json`

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 3008,
      "maxDuration": 60
    }
  },
  "buildCommand": "pnpm build:prod",
  "installCommand": "pnpm install --frozen-lockfile --prefer-offline",
  "env": {
    "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD": "true",
    "PUPPETEER_EXECUTABLE_PATH": ""
  }
}
```

---

### **SOLUÇÃO 3: Armazenamento Remoto (Backblaze)**

**Se já tem PDFs salvos:**

- Modificar `/download` para buscar do Backblaze
- Usar `lib/storage/laudo-storage.ts` (já implementado)
- Cache local em memória (Redis/KV na Vercel)

---

## 📊 Comparação de Soluções

| Critério           | Client-Side (Sol. 1) | Puppeteer Fix (Sol. 2) | Backblaze (Sol. 3) |
| ------------------ | -------------------- | ---------------------- | ------------------ |
| **Complexidade**   | ⭐ Baixa             | ⭐⭐⭐ Alta            | ⭐⭐ Média         |
| **Custo Vercel**   | $ Grátis             | $$$ Alto (3GB RAM)     | $ Baixo            |
| **Confiabilidade** | ⭐⭐⭐⭐⭐ Alta      | ⭐⭐ Baixa (timeouts)  | ⭐⭐⭐⭐ Alta      |
| **Velocidade**     | ⭐⭐⭐⭐ Rápida      | ⭐⭐ Lenta (10-30s)    | ⭐⭐⭐⭐ Rápida    |
| **Privacidade**    | ⭐⭐⭐⭐⭐ Máxima    | ⭐⭐⭐ Média           | ⭐⭐⭐ Média       |
| **Manutenção**     | ⭐⭐⭐⭐⭐ Mínima    | ⭐⭐ Alta              | ⭐⭐⭐ Média       |

**RECOMENDAÇÃO:** Solução 1 (Client-Side) ✅

---

## 🚨 Riscos Atuais

1. **Sistema quebrado em produção** - Usuários não conseguem baixar laudos
2. **Segurança comprometida** - Logs expõem CPFs (\*\*\*3991)
3. **Custos inesperados** - Tentativas de Puppeteer consomem memória
4. **Experiência ruim** - Erros 500 constantes

---

## ✅ Checklist de Correção

### Curto Prazo (Hoje)

- [ ] Implementar Solução 1 no frontend do emissor
- [ ] Modificar `/download` para retornar instruções client-side
- [ ] Testar em staging com Vercel preview
- [ ] Deploy em produção

### Médio Prazo (Esta semana)

- [ ] Implementar cache de PDFs no Backblaze
- [ ] Criar worker para pré-gerar PDFs após emissão
- [ ] Adicionar testes E2E para download na Vercel

### Longo Prazo (Mês)

- [ ] Migrar todos os downloads para client-side
- [ ] Remover Puppeteer do bundle de produção
- [ ] Puppeteer apenas em Workers separados (se necessário)

---

## 📝 Observações Técnicas

### Por que @sparticuz/chromium falha?

1. **Arquivos Brotli:** Chromium compacta binários com Brotli. Na Vercel, o path correto não está sendo resolvido
2. **Lambda Layers:** Vercel Free não suporta Lambda Layers customizadas
3. **Bundle Size:** @sparticuz/chromium adiciona ~50MB ao bundle
4. **Cold Start:** Primeira execução demora 10-15s (timeout na Vercel Free)

### Alternativas ao Puppeteer na Vercel

1. **Playwright** - Mesmos problemas
2. **PDFKit** - Não renderiza HTML
3. **jsPDF + html2canvas** - ✅ Usado atualmente (correto!)
4. **CloudConvert API** - Pago, externo
5. **Vercel Edge Functions** - Não suporta Puppeteer

---

## 🔗 Referências

- [LaudoDownloadClient.tsx](components/pdf/LaudoDownloadClient.tsx) - Componente client-side (já implementado)
- [PDF-CLIENT-GENERATION-IMPLEMENTATION.md](docs/PDF-CLIENT-GENERATION-IMPLEMENTATION.md) - Documentação da implementação
- [@sparticuz/chromium Issues](https://github.com/Sparticuz/chromium/issues) - Problemas conhecidos
- [Vercel Functions Limits](https://vercel.com/docs/functions/serverless-functions/runtimes#limits)

---

**Conclusão:** O sistema já tem a solução correta implementada (`LaudoDownloadClient`), mas o frontend ainda chama a rota antiga (`/download`) que tenta usar Puppeteer. A correção é simples: redirecionar para a rota `/html` + usar o componente client-side já existente.

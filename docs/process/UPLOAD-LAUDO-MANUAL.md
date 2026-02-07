# Fluxo de Upload Manual de Laudo

## 📋 Visão Geral

Sistema implementado para permitir que emissores façam upload manual de laudos em PDF, evitando timeouts do Puppeteer em produção (Vercel).

## 🔄 Máquina de Estados

### Estado do Lote

```
rascunho → em_avaliacao → concluido → finalizado
                              ↓
                          cancelado
```

### Estado do Laudo

```
[não existe] → emitido (imutável) → enviado (imutável)
```

## 🎯 Fluxo Completo

### 1. Pré-requisitos

- Lote deve estar com `status='concluido'`
- Todas as avaliações liberadas devem estar finalizadas (concluídas ou inativadas)
- Não deve existir laudo com `status='enviado'` ou `emitido_em != NULL`
- Usuário deve ter perfil `emissor` e estar autorizado para o lote

### 2. Endpoints

#### `POST /api/emissor/laudos/[loteId]/upload-url`

**Função:** Gera URL e key para upload

**Validações:**

- ✅ Autenticação: `requireRole('emissor')`
- ✅ Lote existe e não está cancelado
- ✅ Emissor está autorizado (ou lote sem emissor definido)
- ✅ Lote está concluído (todas avaliações finalizadas)
- ✅ Não existe laudo emitido/enviado (imutabilidade)

**Resposta:**

```json
{
  "success": true,
  "key": "laudos/lote-123/laudo-1234567890-abc123.pdf",
  "uploadUrl": "/api/emissor/laudos/123/upload-local",
  "uploadMethod": "POST",
  "maxSizeBytes": 1048576,
  "allowedContentTypes": ["application/pdf"],
  "expiresIn": 3600,
  "lote": {
    "id": 123,
    "codigo": "LOTE-2025-001"
  }
}
```

#### `POST /api/emissor/laudos/[loteId]/upload-local`

**Função:** Recebe arquivo via multipart/form-data (local)

**Validações:**

- ✅ Autenticação: `requireRole('emissor')`
- ✅ Arquivo fornecido
- ✅ Key fornecida
- ✅ Tamanho ≤ 1 MB
- ✅ Content-Type = `application/pdf`
- ✅ Header PDF válido (`%PDF-`)

**FormData:**

```
key: string (gerado em upload-url)
file: File (PDF)
```

**Resposta:**

```json
{
  "success": true,
  "key": "laudos/lote-123/laudo-1234567890-abc123.pdf",
  "filename": "laudos_lote-123_laudo-1234567890-abc123.pdf",
  "size": 524288,
  "contentType": "application/pdf",
  "tempPath": "/pending/laudos_lote-123_laudo-1234567890-abc123.pdf"
}
```

**Arquivo salvo em:** `storage/laudos/pending/{filename}`

#### `POST /api/emissor/laudos/[loteId]/upload-confirm`

**Função:** Confirma upload, valida, cria registro e marca como emitido

**Validações:**

- ✅ Autenticação: `requireRole('emissor')`
- ✅ Não existe laudo emitido/enviado (imutabilidade)
- ✅ Arquivo temporário existe
- ✅ Re-validação: tamanho ≤ 1 MB
- ✅ Re-validação: header PDF válido
- ✅ Cálculo de SHA-256 server-side
- ✅ Comparação com hash do cliente (warning se divergente)

**Body:**

```json
{
  "key": "laudos/lote-123/laudo-1234567890-abc123.pdf",
  "filename": "laudo.pdf",
  "size": 524288,
  "clientSha256": "a1b2c3..."
}
```

**Resposta:**

```json
{
  "success": true,
  "laudo_id": 123,
  "sha256": "a1b2c3...",
  "size": 524288,
  "filename": "laudo-123.pdf",
  "message": "Laudo confirmado e emitido com sucesso",
  "immutable": true
}
```

**Operações:**

1. Lê arquivo temporário de `storage/laudos/pending/`
2. Calcula SHA-256
3. Insere registro em `laudos` com `status='emitido'`, `emitido_em=NOW()`, `hash_pdf`
   - Usa `Client` isolado (não compartilha transação)
   - Configurações RLS: `app.current_user_cpf`, `app.current_user_perfil='emissor'`, `app.system_bypass='true'`
   - Trata duplicatas (condições de corrida)
4. Move arquivo para `storage/laudos/laudo-{id}.pdf`
5. Cria metadados em `storage/laudos/laudo-{id}.json`
6. Registra auditoria em `audit_logs`

### 3. Frontend (Modal)

**Componente:** `ModalUploadLaudo`

**Estados:**

- `idle`: Aguardando seleção
- `selecting`: Arquivo selecionado, calculando hash
- `uploading`: Enviando arquivo
- `confirming`: Confirmando e emitindo
- `success`: Laudo emitido com sucesso
- `error`: Erro em qualquer etapa

**Validações Client-Side:**

- ✅ Extensão `.pdf`
- ✅ MIME type `application/pdf`
- ✅ Tamanho ≤ 1 MB (bloqueio)
- ✅ Arquivo não vazio
- ✅ Cálculo de SHA-256 (Web Crypto API)

**Fluxo UX:**

1. Botão "Upload de Laudo" (azul) em preview
2. Modal abre
3. Usuário seleciona PDF
4. Sistema calcula hash e mostra preview
5. Botão "Confirmar Upload" (verde)
6. Barra de progresso (25% → 40% → 70% → 100%)
7. Mensagem de sucesso com ID do laudo
8. Auto-reload após 2s

**Botões em Preview:**

- 🔵 **Upload de Laudo** → Abre modal
- 🟢 **Gerar Automaticamente** → Chama Puppeteer (desenvolvimento)

## 🧪 Testes

### Script PowerShell

```powershell
.\scripts\test-upload-laudo-manual.ps1 -LoteId 1 -Cookie "next-auth.session-token=..."
```

**Passos:**

1. Cria PDF de teste válido
2. Calcula SHA-256 client-side
3. POST `/upload-url` → obter key
4. POST `/upload-local` → enviar arquivo
5. POST `/upload-confirm` → confirmar e emitir
6. Verifica hash match

### Jest Integration Test

```bash
TEST_LOTE_ID=1 TEST_COOKIE="..." npm test -- upload-laudo-manual.test.ts
```

**Casos de teste:**

- ✅ Validação de PDF de teste
- ✅ Geração de URL de upload
- ✅ Upload de arquivo válido
- ✅ Confirmação e emissão
- ❌ Rejeição de arquivo > 1 MB
- ❌ Rejeição de arquivo não-PDF
- ❌ Imutabilidade (segunda emissão)

## 🔐 Segurança

### RBAC

- Apenas `emissor` pode fazer upload
- Emissor deve estar autorizado para o lote (ou lote sem emissor)

### RLS (Row-Level Security)

- Políticas PostgreSQL aplicadas em todas as operações
- Contexto configurado: `app.current_user_cpf`, `app.current_user_perfil`
- Bypass do sistema para inserção atômica

### Validações

- **Client-side:** Extensão, MIME, tamanho, hash
- **Server-side:** Re-validação de todas as regras + header PDF

### Imutabilidade

- Laudo com `emitido_em != NULL` não pode ser modificado
- Laudo com `status='enviado'` não pode ser modificado
- Validação em **todos** os endpoints (upload-url, upload-confirm)

### Auditoria

- Registro em `audit_logs`:
  - Ação: `laudo_upload_manual`
  - Entidade: `laudos`
  - Dados: `lote_id`, `hash`, `size`, `key`, `uploader`
  - User: `emissor` CPF

## 📂 Arquivos Criados

```
app/
  api/
    emissor/
      laudos/
        [loteId]/
          upload-url/
            route.ts          ← Gera URL e key
          upload-local/
            route.ts          ← Recebe arquivo (local)
          upload-confirm/
            route.ts          ← Confirma e emite

components/
  modals/
    ModalUploadLaudo.tsx      ← Modal React com preview

scripts/
  test-upload-laudo-manual.ps1  ← Script de teste PowerShell
  create-test-pdf.ts            ← Utilitário para gerar PDFs

__tests__/
  upload-laudo-manual.test.ts   ← Testes Jest
```

## 🚀 Próximos Passos

### Fase 2: Migração para Backblaze

1. Substituir `/upload-local` por presigned URL do Backblaze
2. Upload direto do cliente para S3
3. Callback de confirmação após upload S3
4. Cleanup de objetos não confirmados (TTL)

### Fase 3: Melhorias

1. Suporte a múltiplas revisões (versionamento)
2. Preview do PDF antes de confirmar
3. Assinatura digital
4. Webhook de notificação pós-emissão

## 🐛 Troubleshooting

### Erro: "Lote não está pronto para emissão"

- Verificar se todas as avaliações liberadas estão finalizadas
- Status do lote deve ser `concluido`

### Erro: "Laudo já foi emitido"

- Laudo é imutável após confirmação
- Deletar registro no DB se for teste

### Erro: "Arquivo temporário não encontrado"

- TTL de 1 hora (presigned URL)
- Refazer fluxo desde upload-url

### Erro: "Hash mismatch"

- Apenas warning (não bloqueia)
- Cliente pode ter calculado errado
- Hash server-side prevalece

## 📚 Referências

- [DATABASE-POLICY.md](../DATABASE-POLICY.md)
- [lib/storage/laudo-storage.ts](../lib/storage/laudo-storage.ts)
- [lib/storage/backblaze-client.ts](../lib/storage/backblaze-client.ts)

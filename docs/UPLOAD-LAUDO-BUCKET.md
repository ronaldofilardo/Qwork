# Upload de Laudos para Bucket - Implementação Completa

**Data:** 6 de fevereiro de 2026  
**Objetivo:** Permitir upload manual de laudos (PDF) para o bucket Backblaze após geração local, com garantia de imutabilidade e persistência de metadados.

---

## Resumo Executivo

Sistema implementado para que emissores possam fazer upload de laudos gerados localmente para o bucket Backblaze via interface web, com as seguintes garantias:

✅ **Imutabilidade total** - upload único por laudo (botão desabilitado após sucesso)  
✅ **Validação de integridade** - hash SHA-256 deve corresponder ao registrado no banco  
✅ **Autenticação restrita** - somente role `emissor`  
✅ **Validações client/server** - PDF válido, máximo 2MB  
✅ **Bucket como fonte da verdade** - após upload, arquivo remoto é autoritativo  
✅ **Auditoria completa** - logs de sucesso, falha e tentativas  
✅ **Compatibilidade com batch-sync** - script atualizado para pular laudos já sincronizados  

---

## Arquivos Criados/Modificados

### 1. **Migration SQL**
- **Arquivo:** `database/migrations/1007_add_arquivo_remoto_metadata.sql`
- **Objetivo:** Adicionar colunas de metadados de arquivo remoto
- **Colunas adicionadas:**
  - `arquivo_remoto_uploaded_at` TIMESTAMP
  - `arquivo_remoto_etag` VARCHAR(255)
  - `arquivo_remoto_size` BIGINT
  - Índice `idx_laudos_arquivo_remoto_sync`

### 2. **Endpoint de Upload**
- **Arquivo:** `app/api/emissor/laudos/[laudoId]/upload/route.ts`
- **Rota:** `POST /api/emissor/laudos/[laudoId]/upload`
- **Funcionalidades:**
  - Autenticação: `requireRole('emissor')`
  - Validações: tipo PDF, tamanho <= 2MB, header `%PDF-`
  - Verificação de hash contra `laudos.hash_pdf`
  - Rejeição se já existe `arquivo_remoto_key` (imutabilidade)
  - Upload para Backblaze via `uploadLaudoToBackblaze`
  - Persistência de metadados no banco de dados
  - Auditoria de sucesso/erro em `audit_logs`

### 3. **Componente Frontend**
- **Arquivo:** `components/UploadLaudoButton.tsx`
- **Props:**
  - `laudoId`, `loteId`, `status`, `arquivoRemotoKey`, `hasUploadFailed`, `onUploadSuccess`
- **Comportamento:**
  - Exibe "Enviar ao Bucket" se laudo emitido e sem `arquivo_remoto_key`
  - Exibe "Re-sincronizar" apenas se houve falha anterior
  - Validação client-side: PDF, 2MB máximo
  - Progress bar durante upload
  - Após sucesso: mostra ícone verde "Sincronizado com bucket"
  - Botão desabilitado permanentemente após upload (imutabilidade)

### 4. **Integração na Página do Emissor**
- **Arquivo:** `app/emissor/page.tsx`
- **Mudanças:**
  - Import de `UploadLaudoButton`
  - Interface `Lote.laudo` expandida com campos `arquivo_remoto_*`
  - Integração do componente no card de lote (aba "Laudos Emitidos")
  - Callback `onUploadSuccess` recarrega lotes após sucesso

### 5. **Endpoint /api/emissor/lotes**
- **Arquivo:** `app/api/emissor/lotes/route.ts`
- **Mudanças:**
  - Query SQL expandida com `arquivo_remoto_key`, `arquivo_remoto_url`, `arquivo_remoto_uploaded_at`
  - Objeto `laudoObj` inclui campos de arquivo remoto
  - Retorna metadados remotos para o frontend

### 6. **Script Batch Sync Atualizado**
- **Arquivo:** `scripts/batch-sync-laudos.ts`
- **Mudanças:**
  - Query filtra laudos com `arquivo_remoto_key IS NULL` (pula já sincronizados)
  - Persiste metadados no banco após upload (compatibilidade)
  - Logs indicam laudos já sincronizados
  - Suporte a flag `--force` para resincronizar

### 7. **Testes**
- **Arquivo:** `__tests__/api/emissor/upload-laudo-bucket.test.ts`
- **Cobertura:**
  - Autenticação e autorização
  - Validações (MIME, tamanho, hash, imutabilidade)
  - Fluxo de upload
  - Tratamento de erros e auditoria

---

## Fluxo de Uso

### Para o Emissor:

1. **Emitir laudo localmente** (fluxo existente)
   - Sistema gera PDF e calcula hash SHA-256
   - PDF salvo em `storage/laudos/laudo-{id}.pdf`
   - Hash persistido em `laudos.hash_pdf`

2. **Acessar Dashboard do Emissor**
   - Navegar para aba "Laudos Emitidos"
   - Localizar lote com laudo emitido

3. **Fazer Upload ao Bucket**
   - Clicar no botão verde "Enviar ao Bucket"
   - Selecionar arquivo PDF do laudo (máximo 2MB)
   - Sistema valida e faz upload automático
   - Progress bar indica progresso

4. **Confirmação**
   - Toast de sucesso
   - Ícone verde "Sincronizado com bucket"
   - Botão desabilitado (imutabilidade)

### Para Administradores:

1. **Sincronização em lote** (opcional)
   ```bash
   node scripts/batch-sync-laudos.ts [--dry-run] [--limit N] [--force]
   ```
   - Script pula laudos já sincronizados (via `arquivo_remoto_key`)
   - Útil para sincronizar laudos antigos

---

## Validações Implementadas

### Client-Side (Componente)
- ✅ Tipo de arquivo: `.pdf` / `application/pdf`
- ✅ Tamanho máximo: 2MB
- ✅ Feedback visual: progress bar

### Server-Side (Endpoint)
- ✅ Autenticação: `requireRole('emissor')`
- ✅ Tipo MIME: `application/pdf`
- ✅ Tamanho: <= 2MB
- ✅ Header PDF: `%PDF-`
- ✅ Status do laudo: `emitido` ou `enviado`
- ✅ Imutabilidade: rejeita se `arquivo_remoto_key` já existe
- ✅ Integridade: hash do arquivo = `laudos.hash_pdf`

---

## Segurança e Auditoria

### Logs de Auditoria
Todos os eventos são registrados em `audit_logs`:

- **Sucesso:** `laudo_upload_backblaze_sucesso`
  - Dados: `lote_id`, `emissor_cpf`, `arquivo_remoto_key`, `arquivo_remoto_url`, `file_size`, `duration_ms`

- **Erro:** `laudo_upload_backblaze_erro`
  - Dados: `erro`, `emissor_cpf`, `duration_ms`

- **Hash Mismatch:** `laudo_upload_hash_mismatch`
  - Dados: `expected_hash`, `received_hash`, `lote_id`, `emissor_cpf`

### Princípios de Segurança
- ✅ Autenticação exclusiva para emissores
- ✅ Validação de hash (integridade)
- ✅ Upload único (imutabilidade)
- ✅ Auditoria completa (rastreabilidade)
- ✅ Credenciais Backblaze via env vars (segurança)

---

## Padrão de Chave no Bucket

**Formato atual mantido:** `laudos/lote-{loteId}/laudo-{timestamp}-{random}.pdf`

**Exemplo:** `laudos/lote-42/laudo-1707243847291-a3f8d2.pdf`

**Benefícios:**
- ✅ Agrupa laudos por lote (facilita busca manual no bucket)
- ✅ Timestamp garante unicidade
- ✅ Compatível com `findLatestLaudoForLote` e `batch-sync`

---

## Configuração Necessária

### Variáveis de Ambiente
```env
# Backblaze S3-compatible
BACKBLAZE_S2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
BACKBLAZE_REGION=us-east-005
BACKBLAZE_BUCKET=laudos-qwork
BACKBLAZE_KEY_ID=005abc...  # Application Key ID
BACKBLAZE_APPLICATION_KEY=K005...  # Application Key

# Opcional: desabilitar uploads remotos (dev/teste)
DISABLE_LAUDO_REMOTE=0
DISABLE_REMOTE_STORAGE=0
```

### Executar Migration
```bash
# Produção
psql $DATABASE_URL -f database/migrations/1007_add_arquivo_remoto_metadata.sql

# Local
psql $DATABASE_URL_LOCAL -f database/migrations/1007_add_arquivo_remoto_metadata.sql
```

---

## Testes

### Executar Testes Unitários
```bash
pnpm test __tests__/api/emissor/upload-laudo-bucket.test.ts
```

### Teste Manual (local)
1. Emitir laudo para um lote
2. Acessar `http://localhost:3000/emissor`
3. Ir para aba "Laudos Emitidos"
4. Clicar em "Enviar ao Bucket" para o laudo desejado
5. Selecionar o PDF do laudo (verificar em `storage/laudos/`)
6. Confirmar upload
7. Verificar no Backblaze se arquivo foi enviado
8. Verificar no banco se metadados foram salvos:
   ```sql
   SELECT arquivo_remoto_key, arquivo_remoto_url, arquivo_remoto_uploaded_at 
   FROM laudos WHERE id = X;
   ```

---

## Monitoramento e Operação

### Consultas Úteis

**Verificar laudos sincronizados:**
```sql
SELECT id, lote_id, arquivo_remoto_key, arquivo_remoto_uploaded_at 
FROM laudos 
WHERE arquivo_remoto_key IS NOT NULL 
ORDER BY arquivo_remoto_uploaded_at DESC 
LIMIT 20;
```

**Laudos pendentes de sincronização:**
```sql
SELECT id, lote_id, status, emitido_em 
FROM laudos 
WHERE status IN ('emitido', 'enviado') 
  AND arquivo_remoto_key IS NULL 
ORDER BY emitido_em DESC;
```

**Auditoria de uploads:**
```sql
SELECT criado_em, acao, entidade_id, dados->>'arquivo_remoto_key' as key, user_role
FROM audit_logs 
WHERE acao LIKE 'laudo_upload_%' 
ORDER BY criado_em DESC 
LIMIT 50;
```

**Uploads com erro:**
```sql
SELECT criado_em, entidade_id, dados->>'erro' as erro
FROM audit_logs 
WHERE acao = 'laudo_upload_backblaze_erro' 
ORDER BY criado_em DESC;
```

---

## Troubleshooting

### Problema: "Hash do arquivo enviado não corresponde"
**Causa:** Arquivo PDF enviado é diferente do gerado originalmente  
**Solução:** Enviar exatamente o arquivo de `storage/laudos/laudo-{id}.pdf`

### Problema: "Este laudo já foi enviado ao bucket"
**Causa:** Upload já foi realizado (imutabilidade)  
**Solução:** Esperado! Laudo já está no bucket. Verificar `arquivo_remoto_url`

### Problema: "Arquivo excede tamanho máximo"
**Causa:** PDF maior que 2MB  
**Solução:** Otimizar PDF ou regenerar laudo (verificar imagens embutidas)

### Problema: Botão "Enviar ao Bucket" não aparece
**Causas possíveis:**
- Laudo não está emitido (`status != 'emitido'`)
- Já existe `arquivo_remoto_key` (já foi sincronizado)
- Usuário não é emissor

**Verificação:**
```sql
SELECT id, status, arquivo_remoto_key FROM laudos WHERE id = X;
```

---

## Próximos Passos (Futuro)

- [ ] Webhook/notificação para sucesso de upload
- [ ] Dashboard de status de sincronização (admin)
- [ ] Retry automático para falhas temporárias
- [ ] Presigned URL para download direto do bucket (evitar proxy)
- [ ] Compressão de PDFs grandes antes do upload
- [ ] Versionamento de laudos (se requisito mudar para permitir re-upload)

---

## Conclusão

A implementação está **completa e operacional**, atendendo todos os requisitos:

✅ Upload manual via interface web  
✅ Validação completa (tipo, tamanho, hash, imutabilidade)  
✅ Autenticação restrita (somente emissor)  
✅ Persistência de metadados no banco  
✅ Bucket como fonte da verdade  
✅ Auditoria completa  
✅ Compatibilidade com batch-sync  
✅ Testes unitários  
✅ Documentação completa  

Sistema pronto para deploy! 🚀

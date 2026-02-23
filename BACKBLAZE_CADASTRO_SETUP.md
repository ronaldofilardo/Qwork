# 📦 Upload de Cadastro - Configuração PROD (Backblaze)

## Resumo da Implementação

**DEV (local):**
- ✅ Upload local em `public/uploads/cadastros/{cnpj}/`
- ✅ Persistência garantida durante sessão
- ✅ Sem dependência de Backblaze

**PROD (Vercel):**
- ✅ Upload direto para Backblaze (bucket: `d2eaa89114748cc094c10211`)
- ✅ Caminho: `/laudos/cad-qwork/{cnpj}/{tipo}_{timestamp}.pdf`
- ✅ Sem arquivo em `/tmp` (serverless efêmero)
- ✅ URL remota persistente no banco

---

## Variáveis de Ambiente Necessárias (PROD - Vercel)

```env
# Backblaze B2 S3-compatible API
BACKBLAZE_KEY_ID=<ID da Application Key>
BACKBLAZE_APPLICATION_KEY=<Secret da Application Key>
BACKBLAZE_ENDPOINT=https://s3.us-east-005.backblazeb2.com
BACKBLAZE_REGION=us-east-005
BACKBLAZE_BUCKET=<bucket-id ou nome>

# IMPORTANTE: Desabilitar upload enquanto feature está em staging
NEXT_PUBLIC_DISABLE_ANEXOS=true
```

**Onde buscar:**
1. Dashboard Backblaze → Application Keys → Criar ou selecionar chave S3
2. Copiar `applicationKeyId` (ID)
3. Copiar `applicationKey` (Secret)
4. Bucket: `laudos-qwork` ou direto o ID `d2eaa89114748cc094c10211`

---

## Estrutura de Arquivos no Bucket

```
laudos-qwork/
├── laudos/                       # Arquivos de emissão (Laudos)
│   ├── lote-{loteId}/
│   │   └── laudo-{timestamp}-{random}.pdf
│   └── cad-qwork/               # Arquivos de cadastro (NOVO)
│       ├── 12345678000100/       # CNPJ (sem formatação)
│       │   ├── cartao_cnpj-1708...pdf
│       │   ├── contrato_social-1708...pdf
│       │   └── doc_identificacao-1708...pdf
│       └── 98765432000187/
│           ├── cartao_cnpj-1708...pdf
│           ├── contrato_social-1708...pdf
│           └── doc_identificacao-1708...pdf
```

---

## Descrição Técnica

### Tabelas Atualizadas (Migration 1102)

Novas colunas adicionadas em `entidades`, `clinicas` e `empresas_clientes`:

```sql
-- Para cada tipo de arquivo (cartao_cnpj, contrato_social, doc_identificacao):
{tipo}_arquivo_remoto_provider VARCHAR(50)   -- 'backblaze'
{tipo}_arquivo_remoto_bucket VARCHAR(255)     -- bucket no B2
{tipo}_arquivo_remoto_key VARCHAR(2048)       -- caminho: laudos/cad-qwork/...
{tipo}_arquivo_remoto_url TEXT                -- URL pública do arquivo
```

### Função Compartilhada: `uploadArquivoCadastro()`

**Arquivo:** `lib/storage/cadastro-storage.ts`

```typescript
export async function uploadArquivoCadastro(
  buffer: Buffer,
  tipo: 'cartao_cnpj' | 'contrato_social' | 'doc_identificacao',
  cnpj: string
): Promise<CadastroArquivoResult>
```

**Comportamento:**
- Detecta `process.env.VERCEL === '1'` ou `NODE_ENV === 'production'`
- **DEV:** Salva em `/public/uploads/cadastros/{cnpj}/{tipo}_{timestamp}.pdf`
- **PROD:** Upload para B2, retorna URL remota

**Retorna:**
```typescript
{
  path: string,  // '/uploads/cadastros/...' (DEV) ou URL (PROD)
  arquivo_remoto?: {
    provider: 'backblaze',
    bucket: string,
    key: string,
    url: string
  }
}
```

### Rotas Modificadas

| Rota | Mudança |
|---|---|
| `POST /api/cadastro/tomadores` | Usa `uploadArquivoCadastro()` |
| `POST /api/rh/empresas` | Usa `uploadArquivoCadastro()` |

Ambas salvam os arquivos **antes** do INSERT no banco e incluem as informações remotas (PROD).

---

## Fluxo de Ativação

**Atualmente (23/02/2026):**
- ✅ `NEXT_PUBLIC_DISABLE_ANEXOS=true` em PROD (desabilita upload)
- ✅ DEV funciona normalmente com `public/uploads/`
- ✅ B2 está pronto mas não está em uso

**Para ativar em PROD:**
1. Remover `NEXT_PUBLIC_DISABLE_ANEXOS=true` (ou deixar `false`) no Vercel
2. Garantir que `BACKBLAZE_*` vars estão setadas
3. Deploy
4. Testar em staging antes de PROD

---

## Verificação Rápida

### Confirmar upload em DEV
```bash
ls -la public/uploads/cadastros/
```

### Confirmar upload em PROD (Vercel logs)
```
[STORAGE] Arquivo de cadastro cartao_cnpj (CNPJ: 12345678000100) 
          enviado para Backblaze: laudos/cad-qwork/12345678000100/cartao_cnpj-1708...pdf
```

### Verificar no banco
```sql
SELECT 
  id, cnpj,
  cartao_cnpj_path,
  cartao_cnpj_arquivo_remoto_provider,
  cartao_cnpj_arquivo_remoto_url
FROM entidades LIMIT 5;
```

---

## Segurança & Boas Práticas

1. **Credenciais:**
   - Nunca commit `BACKBLAZE_APPLICATION_KEY`
   - Usar Vercel Dashboard → Settings → Environment Variables (production/preview)
   - Aplicações Keys do B2 devem ter acesso restrito ao bucket `laudos-qwork` apenas

2. **Validação:**
   - Frontend valida: tipo MIME (PDF/JPG/PNG), tamanho (≤5MB)
   - Backend valida: mesmos critérios antes de fazer upload
   - S3 API retorna erro se arquivo já existe (timestamp único previne)

3. **Fallback:**
   - Se B2 estiver indisponível em PROD, request retorna erro 500
   - Admin pode ativar `NEXT_PUBLIC_DISABLE_ANEXOS=true` como kill-switch

---

## Roadmap Futuro

- [ ] Integrar com AWS Lambda para gerar presigned URLs
- [ ] Implementar view arquivo no dashboard (download do B2)
- [ ] Audit trail de quem/quando fez upload
- [ ] Integração com verificação de documentos (OCR/API)

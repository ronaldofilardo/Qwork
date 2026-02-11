# Fluxo de Upload Manual de Laudos

## Problema Corrigido

Antes, o sistema fazia upload automático do laudo para o Backblaze assim que o emissor gerava o PDF. Isso estava errado porque:

- O solicitante via o laudo disponível antes mesmo do emissor revisar
- Não havia controle sobre quando o laudo era enviado ao bucket

## Comportamento Correto (Atual)

### 1. Emissor Gera Laudo Localmente

```bash
# Via interface ou API
POST /api/emissor/laudos/gerar-laudo-completo
```

**Resultado:**

- ✅ PDF gerado em `storage/laudos/laudo-{id}.pdf`
- ✅ Hash SHA256 calculado e salvo no banco
- ✅ Status do laudo alterado para `emitido`
- ❌ **Arquivo NÃO é enviado ao Backblaze automaticamente**
- ℹ️ Card do solicitante continua mostrando "Aguardando laudo"

### 2. Emissor Revisa e Aprova o Laudo

O emissor pode:

- Abrir o PDF localmente para revisão
- Verificar se está tudo correto
- Decidir quando enviar ao bucket

### 3. Emissor Faz Upload Manual ao Bucket

```bash
# Via API (emissor autenticado)
POST /api/emissor/laudos/{loteId}/upload
Content-Type: multipart/form-data

arquivo: <laudo-{id}.pdf>
```

**O que a API faz:**

1. Valida hash do arquivo enviado vs hash no banco
2. Faz upload para Backblaze bucket `laudos-qwork`
3. Atualiza banco com `arquivo_remoto_*` metadata
4. Registra auditoria do upload

**Resultado:**

- ✅ Arquivo enviado para: `s3://laudos-qwork/laudos/lote-{loteId}/laudo-{timestamp}.pdf`
- ✅ Metadata persistida no banco (`arquivo_remoto_key`, `arquivo_remoto_url`, etc)
- ✅ **Agora sim** o card do solicitante mostra "Laudo Disponível"

## Reset Aplicado (Laudos 1005 e 1007)

Os laudos 1005 e 1007 foram resetados:

```sql
UPDATE laudos
SET
  arquivo_remoto_provider = NULL,
  arquivo_remoto_bucket = NULL,
  arquivo_remoto_key = NULL,
  arquivo_remoto_url = NULL,
  arquivo_remoto_uploaded_at = NULL,
  arquivo_remoto_size = NULL
WHERE id IN (1005, 1007);
```

**Status atual:**

- ✅ Laudo gerado localmente (PDF existe em `storage/laudos/`)
- ✅ Hash SHA256 presente no banco
- ✅ Status = `emitido`
- ❌ Sem `arquivo_remoto_key` → Card do solicitante mostra "Aguardando"

## Como Proceder Agora

### Para Laudo 1005 e 1007:

1. Emissor vai em sua interface
2. Clica em "Enviar Laudo ao Bucket" (ou usa API manual)
3. Sistema faz upload do PDF que está em `storage/laudos/`
4. Card do solicitante é atualizado automaticamente

### Para Novos Laudos:

Fluxo correto já implementado:

1. Gerar laudo → PDF local + hash + status='emitido'
2. Revisar laudo localmente
3. Upload manual → Backblaze + metadata + card atualizado

## Arquivos Modificados

- `lib/laudo-auto.ts`: Removida ETAPA 9 de upload automático
- `app/api/emissor/laudos/[loteId]/upload/route.ts`: Já existia, agora é obrigatório usar

## Rotas Relevantes

### Gerar Laudo (Emissor)

```
POST /api/emissor/laudos/gerar-laudo-completo
Content-Type: application/json

{
  "lote_id": 1005,
  "emissor_cpf": "53051173991"
}
```

### Upload ao Bucket (Emissor)

```
POST /api/emissor/laudos/1005/upload
Content-Type: multipart/form-data

arquivo: <file>
```

### Download (RH)

```
GET /api/rh/laudos/1005/download
```

- Se `arquivo_remoto_key` existe → gera presigned URL e redireciona
- Se não existe → retorna 404 ou aguardando

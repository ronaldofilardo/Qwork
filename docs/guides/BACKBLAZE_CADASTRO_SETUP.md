# Backblaze B2 — Configuração para Upload de Documentos de Representantes

## Bucket

- **Nome**: `rep-qwork`
- **Endpoint**: `s3.us-east-005.backblazeb2.com`
- **Região**: `us-east-005`
- **Tipo**: Privado (requer presigned URL para acesso)

## Variáveis de Ambiente Necessárias

| Variável | Descrição |
|---|---|
| `BACKBLAZE_REP_KEY_ID` | Key ID da aplicação Backblaze B2 com acesso ao bucket `rep-qwork` |
| `BACKBLAZE_REP_APPLICATION_KEY` | Application Key correspondente ao Key ID acima |
| `BACKBLAZE_ENDPOINT` | Endpoint S3-compatible — ex: `s3.us-east-005.backblazeb2.com` (sem `https://`) |
| `BACKBLAZE_REGION` | Região do bucket — ex: `us-east-005` |
| `BACKBLAZE_BUCKET_REP` | Nome do bucket — `rep-qwork` |

## Fluxo de Upload (LP → QWork)

1. **LP** envia o arquivo para o Backblaze diretamente e recebe `backblaze_key_*` e `backblaze_url_*`
2. **LP** envia ao QWork `/api/public/representantes/cadastro` os campos:
   - `backblaze_key_cpf` + `backblaze_url_cpf` (PF)
   - `backblaze_key_cnpj` + `backblaze_url_cnpj` (PJ)
   - `backblaze_key_cpf_responsavel` + `backblaze_url_cpf_responsavel` (responsável PJ)
3. **QWork** valida que a URL começa com `https://`, armazena as chaves no banco sem fazer novo upload

## Geração de Presigned URL (Admin)

Para exibir documentos no painel admin, use `/api/admin/leads/[id]/documentos` ou `/api/admin/representantes/[id]/documentos`, que geram presigned URLs com validade de 1 hora.

**Importante**: O `BACKBLAZE_ENDPOINT` pode ser armazenado sem protocolo (`s3.us-east-005.backblazeb2.com`). O código normaliza automaticamente adicionando `https://` antes de passar ao AWS SDK.

## Estrutura de Pastas no Bucket

```
rep-qwork/
  PF/
    {cpf}/{uuid}-cpf.pdf
  PJ/
    {cnpj}/{uuid}-cnpj.pdf
    {cnpj}/{uuid}-cpf-responsavel.pdf
```

# Checklist de Testes - Upload Manual de Laudo

## ✅ Pré-requisitos

- [ ] Servidor local rodando (`npm run dev`)
- [ ] Banco de dados PostgreSQL conectado
- [ ] Usuário emissor autenticado
- [ ] Lote de teste com status `concluido` e avaliações finalizadas

## 🧪 Teste 1: Validação de Pré-requisitos

### 1.1 Lote Não Concluído

- [ ] Criar lote com avaliações não finalizadas
- [ ] Tentar obter URL de upload
- [ ] **Esperado:** Erro 400 "Lote não está pronto para emissão"

### 1.2 Emissor Não Autorizado

- [ ] Autenticar como emissor diferente
- [ ] Tentar obter URL de upload para lote de outro emissor
- [ ] **Esperado:** Erro 403 "Acesso negado: lote pertence a outro emissor"

### 1.3 Laudo Já Emitido

- [ ] Emitir laudo para um lote
- [ ] Tentar obter URL de upload novamente
- [ ] **Esperado:** Erro 400 "Laudo já foi emitido" + `immutable: true`

## 🧪 Teste 2: Fluxo Completo (Happy Path)

### 2.1 Obter URL de Upload

```bash
curl -X POST http://localhost:3000/api/emissor/laudos/1/upload-url \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json"
```

- [ ] Status 200
- [ ] `success: true`
- [ ] `key` presente e no formato correto
- [ ] `uploadUrl` presente
- [ ] `maxSizeBytes: 1048576`

### 2.2 Upload do Arquivo

```powershell
.\scripts\test-upload-laudo-manual.ps1 -LoteId 1 -Cookie "..."
```

- [ ] PDF de teste criado (< 1MB)
- [ ] SHA-256 calculado
- [ ] Arquivo enviado com sucesso
- [ ] Status 200 de todos os endpoints
- [ ] Arquivo salvo em `storage/laudos/pending/`

### 2.3 Confirmação

- [ ] Registro criado em `laudos` com `status='emitido'`
- [ ] `emitido_em` preenchido
- [ ] `hash_pdf` corresponde ao SHA-256 calculado
- [ ] Arquivo movido para `storage/laudos/laudo-{id}.pdf`
- [ ] Metadados criados em `storage/laudos/laudo-{id}.json`
- [ ] Registro de auditoria em `audit_logs`

### 2.4 Frontend (Modal)

- [ ] Abrir página de preview do laudo
- [ ] Botão "Upload de Laudo" visível (azul)
- [ ] Clicar e abrir modal
- [ ] Selecionar PDF válido
- [ ] SHA-256 calculado e exibido
- [ ] Clicar "Confirmar Upload"
- [ ] Barra de progresso funcional
- [ ] Mensagem de sucesso com ID do laudo
- [ ] Auto-reload após sucesso

## 🧪 Teste 3: Validações de Tamanho

### 3.1 Arquivo > 1MB (Client-Side)

- [ ] Criar PDF > 1MB
- [ ] Selecionar no modal
- [ ] **Esperado:** Erro exibido antes do upload
- [ ] Mensagem: "Arquivo muito grande"

### 3.2 Arquivo > 1MB (Server-Side)

- [ ] Burlar validação client-side
- [ ] Enviar arquivo > 1MB via curl/Postman
- [ ] **Esperado:** Status 400 no `/upload-local`
- [ ] Mensagem: "Arquivo excede o tamanho máximo permitido (1 MB)"

### 3.3 Arquivo Vazio

- [ ] Criar arquivo PDF vazio (0 bytes)
- [ ] Tentar upload
- [ ] **Esperado:** Erro de validação

## 🧪 Teste 4: Validações de Tipo

### 4.1 Arquivo Não-PDF (Extensão Errada)

- [ ] Renomear `.txt` para `.pdf`
- [ ] Tentar upload
- [ ] **Esperado:** Erro no modal ou server-side

### 4.2 Arquivo Não-PDF (MIME Type Errado)

- [ ] Enviar imagem `.jpg` com Content-Type `application/pdf`
- [ ] **Esperado:** Erro 400 "Arquivo não é um PDF válido (header inválido)"

### 4.3 PDF Corrompido

- [ ] Criar arquivo com header `%PDF-` mas conteúdo inválido
- [ ] Upload deve funcionar (validação só do header)
- [ ] Confirmação deve criar registro
- [ ] **Nota:** Validação mais profunda fica para fase futura

## 🧪 Teste 5: SHA-256 e Integridade

### 5.1 Hash Match

- [ ] Upload de PDF válido
- [ ] SHA-256 calculado pelo cliente
- [ ] SHA-256 calculado pelo servidor
- [ ] **Esperado:** Hashes idênticos (case-insensitive)

### 5.2 Hash Mismatch (Warning)

- [ ] Enviar `clientSha256` incorreto no `/upload-confirm`
- [ ] **Esperado:** Warning no console
- [ ] Upload deve prosseguir (hash server prevalece)

### 5.3 Hash Não Fornecido

- [ ] Omitir `clientSha256` no `/upload-confirm`
- [ ] **Esperado:** Sem erros, hash server usado

## 🧪 Teste 6: Imutabilidade

### 6.1 Segunda Emissão (Mesmo Lote)

- [ ] Emitir laudo para lote
- [ ] Tentar obter nova URL de upload
- [ ] **Esperado:** Erro 400 "Laudo já foi emitido" + `immutable: true`

### 6.2 Laudo Enviado

- [ ] Emitir laudo
- [ ] Marcar como `status='enviado'`
- [ ] Tentar upload novamente
- [ ] **Esperado:** Erro 400 "Laudo já foi enviado"

### 6.3 Edição Direta no DB

- [ ] Tentar atualizar `hash_pdf` ou `status` via SQL direto
- [ ] **Esperado:** Políticas RLS devem prevenir (verificar logs)

## 🧪 Teste 7: Concorrência

### 7.1 Upload Simultâneo (Mesmo Lote)

- [ ] Abrir 2 abas do navegador
- [ ] Obter URL de upload em ambas
- [ ] Fazer upload em paralelo
- [ ] **Esperado:** Primeira confirmação cria laudo, segunda falha com erro de duplicata

### 7.2 Condição de Corrida (DB)

- [ ] Simular INSERT duplicado (via script SQL)
- [ ] **Esperado:** Tratamento de erro `23505` (unique constraint)
- [ ] Laudo existente retornado

## 🧪 Teste 8: Segurança e RBAC

### 8.1 Sem Autenticação

- [ ] Fazer request sem cookie de sessão
- [ ] **Esperado:** Status 403 em todos os endpoints

### 8.2 Perfil Não-Emissor

- [ ] Autenticar como `rh`, `clinica`, `entidade`
- [ ] Tentar upload
- [ ] **Esperado:** Status 403 "Acesso negado"

### 8.3 RLS Policies

- [ ] Verificar `app.current_user_cpf` no Client isolado
- [ ] Confirmar bypass `app.system_bypass='true'`
- [ ] Validar que apenas emissor do lote pode inserir

### 8.4 SQL Injection

- [ ] Tentar injetar SQL no `key` ou `filename`
- [ ] **Esperado:** Parametrização previne injeção

## 🧪 Teste 9: Auditoria

### 9.1 Registro de Auditoria

```sql
SELECT * FROM audit_logs
WHERE acao = 'laudo_upload_manual'
ORDER BY criado_em DESC
LIMIT 1;
```

- [ ] Registro criado após confirmação
- [ ] `entidade = 'laudos'`
- [ ] `entidade_id` corresponde ao `laudo_id`
- [ ] `dados` contém `lote_id`, `hash`, `size`, `key`, `uploader`
- [ ] `user_role = 'emissor'`
- [ ] `user_id` corresponde ao CPF do emissor

### 9.2 Falha na Auditoria (Não Bloqueia)

- [ ] Simular falha no INSERT de auditoria
- [ ] **Esperado:** Warning no console
- [ ] Upload deve prosseguir (auditoria não bloqueia)

## 🧪 Teste 10: Limpeza e Manutenção

### 10.1 Arquivo Temporário Não Confirmado

- [ ] Fazer upload sem confirmar
- [ ] Arquivo fica em `storage/laudos/pending/`
- [ ] **Manual:** Verificar existência após 1 hora
- [ ] **Futuro:** Job de cleanup automático

### 10.2 Arquivo Órfão no Storage

- [ ] Criar laudo via upload
- [ ] Deletar registro do DB
- [ ] Arquivo permanece em `storage/laudos/`
- [ ] **Nota:** Implementar job de reconciliação futura

### 10.3 Metadata JSON

- [ ] Verificar `laudo-{id}.json` criado
- [ ] Campos: `arquivo`, `hash`, `criadoEm`, `uploadedBy`, `originalFilename`, `size`, `key`
- [ ] Formato JSON válido

## 🧪 Teste 11: Download Pós-Upload

### 11.1 Download do Laudo Emitido

```bash
curl -X GET http://localhost:3000/api/emissor/laudos/1/download \
  -H "Cookie: next-auth.session-token=..." \
  --output laudo.pdf
```

- [ ] Status 200
- [ ] Content-Type: `application/pdf`
- [ ] Arquivo baixado válido
- [ ] SHA-256 do arquivo corresponde ao `hash_pdf` do DB

### 11.2 Download via Frontend

- [ ] Botão "📄 Baixar PDF" visível após emissão
- [ ] Clicar e iniciar download
- [ ] Arquivo salvo com nome correto

## 🧪 Teste 12: Integração com Máquina de Estados

### 12.1 Transição de Status

- [ ] Lote `concluido` → Upload → Laudo `emitido`
- [ ] Laudo `emitido` → PATCH `/laudos/{id}` → Laudo `enviado`
- [ ] Verificar que `enviado_em` é preenchido

### 12.2 Notificações

- [ ] Emitir laudo
- [ ] Verificar se notificação é criada para clínica/entidade
- [ ] **Futuro:** Webhook ou email de notificação

## 📊 Resumo de Testes

| Categoria       | Total  | ✅ Pass | ❌ Fail | ⏭️ Skip |
| --------------- | ------ | ------- | ------- | ------- |
| Pré-requisitos  | 3      |         |         |         |
| Happy Path      | 4      |         |         |         |
| Tamanho         | 3      |         |         |         |
| Tipo            | 3      |         |         |         |
| SHA-256         | 3      |         |         |         |
| Imutabilidade   | 3      |         |         |         |
| Concorrência    | 2      |         |         |         |
| Segurança/RBAC  | 4      |         |         |         |
| Auditoria       | 2      |         |         |         |
| Limpeza         | 3      |         |         |         |
| Download        | 2      |         |         |         |
| Máquina Estados | 2      |         |         |         |
| **TOTAL**       | **34** | **0**   | **0**   | **0**   |

## 🚀 Executar Todos os Testes

### PowerShell

```powershell
# Teste completo automatizado
.\scripts\test-upload-laudo-manual.ps1 -LoteId 1 -Cookie "next-auth.session-token=..."
```

### Jest

```bash
# Testes de integração
TEST_LOTE_ID=1 TEST_COOKIE="..." npm test -- upload-laudo-manual.test.ts
```

### Manual (Checklist)

- [ ] Marcar todos os itens acima durante testes manuais
- [ ] Documentar falhas em issues do GitHub
- [ ] Registrar edge cases encontrados

## 📝 Notas de Teste

**Encontrou um bug?**

1. Documentar: endpoint, payload, response, logs
2. Criar issue: `[BUG] Upload Laudo - {descrição}`
3. Marcar prioridade (P0-P3)

**Performance:**

- Upload < 500ms (1MB local)
- Confirmação < 1s
- Total do fluxo < 3s

**Logs Importantes:**

```
[UPLOAD-URL] Gerada URL de upload para lote X
[UPLOAD-LOCAL] Arquivo recebido: {filename} ({size} bytes)
[UPLOAD-CONFIRM] Laudo X criado com sucesso
[UPLOAD-CONFIRM] Hash mismatch: client=..., server=...
```

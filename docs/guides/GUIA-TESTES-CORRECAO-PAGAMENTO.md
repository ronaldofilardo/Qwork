# 🧪 Guia de Testes - Correção Máquina de Estado

**Objetivo:** Validar correções no fluxo de cadastro e pagamento

---

## ⚙️ Pré-requisitos

1. ✅ Migration 034 aplicada
2. ✅ Servidor development rodando (`pnpm dev`)
3. ✅ PostgreSQL local ativo

### Aplicar Migration

```powershell
cd c:\apps\QWork\scripts\database
.\apply-migration-034.ps1
```

---

## 🧪 Teste 1: Falha de Pagamento (Simulada)

### Objetivo

Garantir que falha no pagamento **não libera acesso** e **notifica admin**

### Passos

1. **Criar novo cadastro de contratante (Plano Fixo)**
   - Acessar: `/cadastro` (ou rota equivalente)
   - Preencher dados
   - Selecionar plano fixo
   - Finalizar cadastro

2. **Aceitar contrato gerado**
   - Sistema gera contrato
   - Aceitar contrato
   - Verificar: `status = 'aguardando_pagamento'`

3. **Simular erro no processamento**

   **Opção A - Via código (temporário):**

   ```typescript
   // Em processar/route.ts, ANTES do UPDATE contratos:
   throw new Error('TESTE: Simulando falha de pagamento');
   ```

   **Opção B - Via SQL (forçar constraint):**

   ```sql
   -- Criar constraint temporária que vai falhar
   ALTER TABLE contratos ADD CONSTRAINT test_fail CHECK (valor_total > 999999);
   ```

4. **Processar pagamento**
   - Ir para tela de pagamento
   - Preencher dados
   - Clicar em "Processar Pagamento"
   - **Esperado:** Erro exibido

5. **Verificar banco de dados**

   ```sql
   -- Status do contratante deve permanecer 'aguardando_pagamento'
   SELECT id, nome, status, ativa, pagamento_confirmado
   FROM contratantes
   WHERE id = [ID_CONTRATANTE];

   -- Deve retornar:
   -- status = 'aguardando_pagamento'
   -- ativa = false
   -- pagamento_confirmado = false
   ```

6. **Verificar notificação criada**

   ```sql
   SELECT * FROM notificacoes_admin
   WHERE contratante_id = [ID_CONTRATANTE]
   ORDER BY criado_em DESC
   LIMIT 1;

   -- Deve retornar:
   -- tipo = 'falha_pagamento'
   -- resolvida = false
   ```

7. **Tentar fazer login**
   - CPF: [CPF_DO_RESPONSAVEL]
   - Senha: [SENHA]
   - **Esperado:** Erro 403 com mensagem:
     ```json
     {
       "error": "Aguardando confirmação de pagamento...",
       "codigo": "PAGAMENTO_PENDENTE",
       "contratante_id": 123
     }
     ```

8. **Limpar teste (se usou constraint)**
   ```sql
   ALTER TABLE contratos DROP CONSTRAINT IF EXISTS test_fail;
   ```

### ✅ Critérios de Sucesso

- [ ] Status permanece `'aguardando_pagamento'`
- [ ] `ativa = false`
- [ ] `pagamento_confirmado = false`
- [ ] Notificação criada com tipo `'falha_pagamento'`
- [ ] Login bloqueado com erro `PAGAMENTO_PENDENTE`
- [ ] Rollback da transação funcionou (nada foi commitado)

---

## 🧪 Teste 2: Pagamento Bem-Sucedido

### Objetivo

Validar que pagamento com sucesso **libera acesso** corretamente

### Passos

1. **Usar mesmo contratante do Teste 1** ou criar novo

2. **Processar pagamento (sem erro)**
   - Remover simulação de erro
   - Processar pagamento normalmente
   - **Esperado:** Sucesso

3. **Verificar banco de dados**

   ```sql
   SELECT id, nome, status, ativa, pagamento_confirmado, data_liberacao_login
   FROM contratantes
   WHERE id = [ID_CONTRATANTE];

   -- Deve retornar:
   -- status = 'aprovado'
   -- ativa = true
   -- pagamento_confirmado = true
   -- data_liberacao_login = [TIMESTAMP_RECENTE]
   ```

4. **Verificar contrato atualizado**

   ```sql
   SELECT id, numero_contrato, aceito, data_aceite, status
   FROM contratos
   WHERE contratante_id = [ID_CONTRATANTE];

   -- Deve retornar:
   -- aceito = true
   -- data_aceite = [TIMESTAMP_RECENTE]
   -- status = 'ativo'
   ```

5. **Fazer login com sucesso**
   - CPF: [CPF_DO_RESPONSAVEL]
   - Senha: [SENHA]
   - **Esperado:** Login bem-sucedido, redireciona para dashboard

### ✅ Critérios de Sucesso

- [ ] Status = `'aprovado'`
- [ ] `ativa = true`
- [ ] `pagamento_confirmado = true`
- [ ] `data_liberacao_login` preenchida
- [ ] Login permitido
- [ ] Redirecionamento correto (entidade → `/entidade` | clínica → `/rh`)

---

## 🧪 Teste 3: Geração de Link de Retomada

### Objetivo

Validar que admin pode gerar link para contratante retomar pagamento

### Passos

1. **Usar contratante com pagamento pendente** (Teste 1)

2. **Fazer login como Admin**
   - CPF: `00000000000`
   - Senha: [SENHA_ADMIN]

3. **Gerar link via API**

   ```bash
   # PowerShell
   $body = @{
       contratante_id = [ID_CONTRATANTE]
       contrato_id = [ID_CONTRATO]
       enviar_email = $false
   } | ConvertTo-Json

   $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/gerar-link-retomada" `
       -Method POST `
       -Body $body `
       -ContentType "application/json" `
       -SessionVariable session

   $response
   ```

   **Esperado:**

   ```json
   {
     "success": true,
     "link_retomada": "http://localhost:3000/pagamento/simulador?contratante_id=123&contrato_id=456",
     "token": "abc123...",
     "expira_em": "72 horas",
     "dados_contratante": { ... }
   }
   ```

4. **Verificar token no banco**

   ```sql
   SELECT * FROM tokens_retomada_pagamento
   WHERE contratante_id = [ID_CONTRATANTE]
   ORDER BY criado_em DESC
   LIMIT 1;

   -- Verificar:
   -- usado = false
   -- expira_em > NOW() + INTERVAL '71 hours'
   ```

5. **Acessar link de retomada**
   - Abrir navegador
   - Acessar URL gerada
   - **Esperado:** Dados do pagamento retornados

6. **Processar pagamento via link**
   - Completar pagamento
   - **Esperado:** Sucesso

7. **Verificar token marcado como usado**

   ```sql
   SELECT usado, usado_em FROM tokens_retomada_pagamento
   WHERE token = '[TOKEN_GERADO]';

   -- Deve retornar:
   -- usado = true
   -- usado_em = [TIMESTAMP_RECENTE]
   ```

8. **Tentar reutilizar token**
   - Acessar mesmo link novamente
   - **Esperado:** Erro 400 - "Token já foi utilizado"

### ✅ Critérios de Sucesso

- [ ] Token gerado com sucesso
- [ ] Link válido por 72 horas
- [ ] Link retorna dados corretos
- [ ] Pagamento via link funciona
- [ ] Token marcado como usado
- [ ] Token não pode ser reutilizado
- [ ] Log de ação admin criado

---

## 🧪 Teste 4: Expiração de Token

### Objetivo

Validar que tokens expirados não podem ser usados

### Passos

1. **Criar token com expiração forçada (SQL)**

   ```sql
   INSERT INTO tokens_retomada_pagamento (
       token,
       contratante_id,
       contrato_id,
       expira_em,
       usado
   ) VALUES (
       md5(random()::text),
       [ID_CONTRATANTE],
       [ID_CONTRATO],
       NOW() - INTERVAL '1 hour', -- Expirado há 1 hora
       false
   ) RETURNING token;
   ```

2. **Tentar usar token expirado**

   ```bash
   $response = Invoke-RestMethod -Uri "http://localhost:3000/api/pagamento/retomar?token=[TOKEN_EXPIRADO]" `
       -Method GET
   ```

   **Esperado:** Erro 400

   ```json
   {
     "error": "Token expirado",
     "expirou_em": "..."
   }
   ```

### ✅ Critérios de Sucesso

- [ ] Token expirado retorna erro 400
- [ ] Mensagem indica expiração
- [ ] Pagamento não pode ser processado

---

## 🧪 Teste 5: Notificações Admin

### Objetivo

Validar que admin pode ver e gerenciar notificações

### Passos

1. **Buscar notificações não resolvidas**

   ```bash
   $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/notificacoes?resolvida=false" `
       -Method GET
   ```

   **Esperado:**

   ```json
   {
     "success": true,
     "notificacoes": [...],
     "total_nao_lidas": 5
   }
   ```

2. **Marcar notificação como lida**

   ```bash
   $body = @{
       id = [ID_NOTIFICACAO]
       acao = "marcar_lida"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:3000/api/admin/notificacoes" `
       -Method PATCH `
       -Body $body `
       -ContentType "application/json"
   ```

3. **Resolver notificação**

   ```bash
   $body = @{
       id = [ID_NOTIFICACAO]
       acao = "resolver"
       observacoes = "Link de retomada enviado ao contratante"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:3000/api/admin/notificacoes" `
       -Method PATCH `
       -Body $body `
       -ContentType "application/json"
   ```

4. **Verificar no banco**
   ```sql
   SELECT lida, resolvida, observacoes_resolucao
   FROM notificacoes_admin
   WHERE id = [ID_NOTIFICACAO];
   ```

### ✅ Critérios de Sucesso

- [ ] Notificações listadas corretamente
- [ ] Filtros funcionam (tipo, resolvida)
- [ ] Marcar como lida atualiza timestamp
- [ ] Resolver notificação registra CPF do admin
- [ ] Observações salvas corretamente

---

## 📊 Checklist Completo

### Funcionalidades

- [ ] Falha de pagamento bloqueia acesso
- [ ] Status permanece correto após falha
- [ ] Pagamento bem-sucedido libera acesso
- [ ] Status atualizado corretamente (aprovado)
- [ ] data_liberacao_login preenchida

### Notificações

- [ ] Notificação criada em falha de pagamento
- [ ] Admin pode listar notificações
- [ ] Admin pode marcar como lida
- [ ] Admin pode resolver com observações

### Links de Retomada

- [ ] Admin pode gerar link
- [ ] Token válido por 72 horas
- [ ] Link retorna dados corretos
- [ ] Pagamento via link funciona
- [ ] Token não pode ser reutilizado
- [ ] Token expirado retorna erro

### Segurança

- [ ] Login bloqueado sem pagamento_confirmado
- [ ] Erro retorna código PAGAMENTO_PENDENTE
- [ ] Transação com rollback em caso de erro
- [ ] Logs de ações admin criados

---

## 🐛 Troubleshooting

### Erro: "Tabela notificacoes_admin não existe"

```powershell
# Aplicar migration novamente
.\scripts\database\apply-migration-034.ps1
```

### Erro: "Token inválido"

```sql
-- Verificar se token existe
SELECT * FROM tokens_retomada_pagamento WHERE token = '[TOKEN]';
```

### Login ainda permitindo sem pagamento

```sql
-- Verificar flags
SELECT ativa, pagamento_confirmado FROM contratantes WHERE id = [ID];

-- Se ativa=true mas pagamento_confirmado=false, corrigir:
UPDATE contratantes SET ativa = false WHERE id = [ID] AND pagamento_confirmado = false;
```

---

## 📝 Relatório de Bugs

Se encontrar problemas, documente:

1. **Descrição:** O que aconteceu vs. o que era esperado
2. **Passos para reproduzir:** Lista detalhada
3. **Logs:** Console do navegador + terminal do servidor
4. **Queries SQL:** Estado do banco antes/depois
5. **Screenshot:** Se aplicável

**Reportar em:** Issues do repositório ou arquivo em `docs/bugs/`

---

**Sucesso nos testes! 🚀**

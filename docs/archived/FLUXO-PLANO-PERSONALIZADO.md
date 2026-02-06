# Fluxo Completo: Plano Personalizado

## Visão Geral

Documentação do fluxo end-to-end para contratação de plano personalizado, desde a solicitação até a liberação de login.

---

## Etapas do Fluxo

### 1️⃣ Pré-Cadastro (Contratante)

**Rota:** `/cadastro` (modal de cadastro de contratante)

**Ações:**

- Contratante preenche formulário de cadastro
- Seleciona plano "Personalizado"
- Informa número estimado de funcionários
- Envia documentos (CNPJ, Contrato Social, Doc Identificação)

**Backend:**

- `POST /api/cadastro/contratante`
- Cria registro em `contratantes` com `status='pendente'`, `ativa=false`, `plano_id=2` (personalizado)
- Cria registro em `contratacao_personalizada` com `status='aguardando_valor_admin'`
- **Trigger:** `notificar_pre_cadastro_criado()` cria notificação para admin

**Resultado:**

- ✅ Contratante recebe mensagem: "Aguarde análise e definição de valor (até 48h)"
- ✅ Admin recebe notificação de novo pré-cadastro

---

### 2️⃣ Análise e Definição de Valor (Admin)

**Rota:** `/admin` → Menu lateral "Novos Cadastros"

**Ações:**

- Admin vê alerta laranja: "X Plano(s) Personalizado(s) Aguardando Definição de Valor"
- Admin clica em card com badge "🔥 PLANO PERSONALIZADO"
- Clica em botão "Definir Valor e Gerar Link"
- Preenche modal:
  - **Valor por funcionário** (R$)
  - **Número de funcionários** (pré-preenchido com estimativa do contratante)
- Clica em "Definir Valor"

**Backend:**

- `POST /api/admin/novos-cadastros` com `acao: 'aprovar_personalizado'`
- Handler: `handleAprovarPersonalizado()`
  1. Atualiza `contratacao_personalizada`:
     - `valor_por_funcionario`, `numero_funcionarios_estimado`, `valor_total_estimado`
     - `status='valor_definido'`
  2. Gera token único (`payment_link_token`) e expiração (48h)
  3. Insere em `contratos`:
     - `contratante_id`, `plano_id`, `numero_funcionarios`, `valor_total`
     - `status='aguardando_pagamento'`
  4. **Trigger:** `notificar_valor_definido()` notifica gestor do contratante
  5. Retorna link de pagamento: `/pagamento/personalizado/{token}`

**Resultado:**

- ✅ Admin vê mensagem de sucesso com link gerado
- ✅ Card do contratante muda para badge "Aguardando Pagamento"
- ✅ Gestor do contratante recebe notificação com link

---

### 3️⃣ Aceite de Valor (Contratante/Gestor)

**Rota:** `/pagamento/personalizado/{token}`

**Ações:**

- Gestor acessa link recebido por email/notificação
- Página exibe:
  - Nome da empresa
  - Valor por funcionário: R$ X,XX
  - Número de funcionários: XXX
  - **Valor total estimado: R$ X.XXX,XX**
- Botões:
  - ❌ "Recusar e Renegociar" → Volta para admin definir novo valor
  - ✅ "Aceitar Valor" → Prossegue para contrato

**Backend (Aceitar):**

- `POST /api/pagamento/personalizado/aceitar`
- Atualiza `contratacao_personalizada`: `status='valor_aceito_pelo_contratante'`
- Atualiza `contratos`: `aceito=true`, `aceito_em=NOW()`
- Gera conteúdo do contrato padrão (substitui placeholders com dados do contratante)

**Backend (Recusar):**

- `POST /api/pagamento/personalizado/recusar`
- Atualiza `contratacao_personalizada`: `status='aguardando_renegociacao'`
- Notifica admin para redefinir valor

**Resultado:**

- ✅ Redireciona para `/contrato/personalizado/{token}` (apresentação do contrato padrão)

---

### 4️⃣ Apresentação e Aceite do Contrato Padrão

**Rota:** `/contrato/personalizado/{token}`
**⚠️ IMPORTANTE:** Usar mesma lógica de `/contrato/{plano_id}` (planos fixos)

**Ações:**

- Sistema exibe contrato padrão completo (cláusulas, termos, condições)
- Contratante deve **rolar até o final** para habilitar botão "Aceitar Contrato"
- Clica em "Aceitar Contrato"

**Backend:**

- `POST /api/contratos/aceitar`
- Atualiza `contratos`:
  - `aceito=true`
  - `data_aceite=NOW()`
  - `ip_aceite={IP_DO_USUARIO}`
  - `hash_contrato={HASH_SHA256_DO_CONTEUDO}`
- Atualiza `contratacao_personalizada`: `status='contrato_aceito'`

**Resultado:**

- ✅ Redireciona para `/pagamento/simulador/{contrato_id}`

---

### 5️⃣ Simulação de Pagamento

**Rota:** `/pagamento/simulador/{contrato_id}`
**⚠️ IMPORTANTE:** Usar mesma rota/lógica dos planos fixos

**Ações:**

- Sistema exibe simulador de pagamento (sandbox/mock)
- Exibe resumo:
  - Plano: Personalizado
  - Valor total: R$ X.XXX,XX
  - Método de pagamento: PIX / Boleto / Cartão (mock)
- Clica em "Confirmar Pagamento"

**Backend:**

- `POST /api/pagamento/confirmar`
- Atualiza `contratos`: `pagamento_confirmado=true`
- Atualiza `contratantes`:
  - `status='aprovado'`
  - `ativa=true` ← **LIBERA ACESSO**
  - `data_aprovacao=NOW()`
- Atualiza `contratacao_personalizada`: `status='pago'`

**Resultado:**

- ✅ Redireciona para página de sucesso: "Pagamento confirmado! Crie sua senha de acesso."

---

### 6️⃣ Criação de Senha e Liberação de Login

**Rota:** `/criar-senha/{cpf_responsavel}`

**Ações:**

- Gestor cria senha de acesso
- Sistema valida CPF e vincula à conta do contratante

**Backend:**

- `POST /api/auth/criar-senha`
- Insere em `entidades_senhas`:
  - `cpf={CPF_RESPONSAVEL}`
  - `senha_hash={BCRYPT_HASH}`
  - `contratante_id={ID_CONTRATANTE}`
- Atualiza `contratantes`: `data_liberacao_login=NOW()`

**Resultado:**

- ✅ Redireciona para `/login`
- ✅ Gestor pode fazer login com CPF + senha criada
- ✅ Acessa painel de gestão de funcionários e avaliações

---

## Fluxograma Resumido

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Pré-Cadastro (Contratante)                                   │
│    └─> contratantes (pendente) + contratacao_personalizada      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Admin Define Valor                                            │
│    └─> Gera link /pagamento/personalizado/{token}               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Contratante Aceita Valor                                     │
│    └─> status='valor_aceito_pelo_contratante'                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Apresenta Contrato Padrão (mesma rota de plano fixo)         │
│    └─> Contratante aceita → hash_contrato gerado                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Simulador de Pagamento (mesma rota de plano fixo)            │
│    └─> Confirma pagamento → ativa=true                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Cria Senha e Libera Login                                    │
│    └─> entidades_senhas + data_liberacao_login               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estados da Contratação Personalizada

| Status                          | Descrição                        | Responsável | Próxima Ação               |
| ------------------------------- | -------------------------------- | ----------- | -------------------------- |
| `aguardando_valor_admin`        | Pré-cadastro criado              | Admin       | Definir valor e gerar link |
| `valor_definido`                | Admin definiu valor, link gerado | Contratante | Aceitar ou recusar valor   |
| `aguardando_renegociacao`       | Contratante recusou valor        | Admin       | Redefinir valor            |
| `valor_aceito_pelo_contratante` | Contratante aceitou valor        | Sistema     | Exibir contrato padrão     |
| `contrato_aceito`               | Contrato assinado                | Contratante | Confirmar pagamento        |
| `pago`                          | Pagamento confirmado ✅          | Sistema     | Login liberado             |

---

## Rotas a Criar/Adaptar

### Rotas Novas (Específicas de Personalizado)

- ✅ `POST /api/admin/novos-cadastros` (acao: aprovar_personalizado)
- ✅ `POST /api/admin/novos-cadastros` (acao: regenerar_link)
- ⚠️ `GET /pagamento/personalizado/[token]` → Página de aceite de valor
- ⚠️ `POST /api/pagamento/personalizado/aceitar`
- ⚠️ `POST /api/pagamento/personalizado/recusar`

### Rotas Reutilizadas (Planos Fixos)

- 🔁 `GET /contrato/[id]` → Adaptar para aceitar token de personalizado
- 🔁 `POST /api/contratos/aceitar` → Funciona para qualquer plano
- 🔁 `GET /pagamento/simulador/[id]` → Funciona para qualquer plano
- 🔁 `POST /api/pagamento/confirmar` → Funciona para qualquer plano
- 🔁 `POST /api/auth/criar-senha` → Funciona para qualquer contratante

---

## Checklist de Implementação

### Backend

- [x] Handler `handleAprovarPersonalizado` (definir valor)
- [x] Handler `handleRegenerarLink` (regenerar link expirado)
- [ ] Handler `handleAceitarValorPersonalizado` (contratante aceita)
- [ ] Handler `handleRecusarValorPersonalizado` (contratante recusa)
- [ ] Adaptar rota de contratos para aceitar token de personalizado

### Frontend

- [ ] Página `/pagamento/personalizado/[token]` (aceite de valor)
- [ ] Adaptar `/contrato/[id]` para suportar plano personalizado
- [ ] Adaptar `/pagamento/simulador/[id]` (já deve funcionar)
- [ ] Adaptar `/criar-senha/[cpf]` (já deve funcionar)

### Triggers/Database

- [x] Trigger `notificar_pre_cadastro_criado()` (notifica admin)
- [x] Trigger `notificar_valor_definido()` (notifica contratante)
- [ ] Trigger para notificar admin quando contratante recusa valor

---

## Próximos Passos

1. ✅ Reset do contratante CNPJ 41.633.923/0001-68 para teste
2. ✅ Implementar `handleRegenerarLink`
3. ⏭️ Criar página de aceite de valor (`/pagamento/personalizado/[token]`)
4. ⏭️ Criar handlers de aceite/recusa de valor
5. ⏭️ Adaptar rota de contrato para personalizado
6. ⏭️ Testar fluxo completo end-to-end

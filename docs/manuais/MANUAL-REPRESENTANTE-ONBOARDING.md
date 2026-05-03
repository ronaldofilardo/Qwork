# Manual do Usuário: Representante Comercial

**Sistema QWork - Avaliação Psicossocial**  
**Versão:** 1.0 | **Atualização:** Março/2026

---

## Sumário

1. [Sobre este Manual](#sobre-este-manual)
2. [Cadastro via Landing Page](#cadastro-via-landing-page)
3. [Acesso ao Portal](#acesso-ao-portal)
4. [Dashboard Principal](#dashboard-principal)
5. [Gerenciar Leads](#gerenciar-leads)
6. [Meus Vínculos](#meus-vínculos)
7. [Minhas Comissões](#minhas-comissões)
8. [Dados Bancários e PIX](#dados-bancários-e-pix)
9. [Status e Aprovação do Cadastro](#status-e-aprovação-do-cadastro)
10. [Perguntas Frequentes](#perguntas-frequentes)
11. [Suporte](#suporte)

---

## Sobre este Manual

Este manual foi criado para orientar **Representantes Comerciais** no uso completo do sistema QWork, desde o cadastro inicial até o acompanhamento de comissões.

### O que é um Representante Comercial?

O **Representante Comercial** é o profissional parceiro do QWork responsável por indicar novas empresas (clínicas de saúde ocupacional e empresas tomadoras) para a plataforma. Ao indicar clientes que se cadastram e utilizam o sistema, o representante recebe **comissões sobre os laudos emitidos**.

### Responsabilidades

- Indicar empresas para se cadastrarem no QWork
- Acompanhar o progresso das indicações (leads)
- Enviar nota fiscal ou RPA para faturar as comissões geradas
- Manter dados bancários atualizados para recebimento

### Jornada Completa

```
Landing Page → Código Gerado → Análise de Documentos → Apto →
Criar Leads → Cliente Cadastrado → Laudo Emitido → Comissão Gerada →
Enviar NF → Pagamento Realizado
```

---

## Cadastro via Landing Page

O primeiro passo é realizar seu cadastro como representante. O processo é feito pela **landing page do QWork** e é gratuito.

### Tipos de Pessoa

Antes de preencher o formulário, escolha o tipo de pessoa:

| Tipo                     | Quando usar                         | Documentos necessários                     |
| ------------------------ | ----------------------------------- | ------------------------------------------ |
| **Pessoa Física (PF)**   | Autônomo, profissional independente | Documento de CPF (frente)                  |
| **Pessoa Jurídica (PJ)** | Empresa, CNPJ próprio               | Cartão CNPJ + Documento CPF do responsável |

---

### Passo a Passo: Pessoa Física (PF)

**Etapa 1 — Tipo de Pessoa**

1. Selecione **"Pessoa Física"**

**Etapa 2 — Dados Pessoais**

1. Preencha seu **Nome Completo**
2. Informe seu **E-mail** (será usado para login)
3. Informe seu **Telefone** com DDD
4. Informe seu **CPF** (apenas números)

**Etapa 3 — Dados Bancários (opcional no cadastro)**

1. Informe o **Código do Banco**
2. Informe **Agência** e **Conta**
3. Selecione o **Tipo de Conta** (Corrente ou Poupança)
4. Informe o **Titular da Conta**
5. Se preferir PIX, informe a **Chave PIX** e o **Tipo de Chave**

> **Dica:** Os dados bancários podem ser adicionados depois do cadastro pelo portal. Você não precisa preencher agora.

**Etapa 4 — Upload de Documento**

1. Faça upload de um documento com CPF (CNH, RG, ou cartão CPF)
2. Formatos aceitos: **PDF, JPEG ou PNG**
3. Tamanho máximo: **3MB**

**Etapa 5 — Aceite dos Termos**

1. Leia os **Termos de Uso**
2. Leia o **Disclaimer de Não Vínculo Empregatício**
3. Marque as caixas de aceite

**Etapa 6 — Envio**

1. Clique em **"Cadastrar"**
2. Aguarde a confirmação

---

### Passo a Passo: Pessoa Jurídica (PJ)

**Etapa 1 — Tipo de Pessoa**

1. Selecione **"Pessoa Jurídica"**

**Etapa 2 — Dados da Empresa**

1. Informe a **Razão Social** da empresa
2. Informe o **CNPJ** da empresa
3. Informe o **Nome do Responsável**
4. Informe o **CPF do Responsável**
5. Informe o **E-mail** (será usado para login)
6. Informe o **Telefone** com DDD

**Etapa 3 — Dados Bancários (opcional no cadastro)**

- Igual ao processo PF (veja acima)

**Etapa 4 — Upload de Documentos**

1. Faça upload do **Cartão CNPJ** da empresa
2. Faça upload do **Documento CPF do responsável**
3. Formatos aceitos: **PDF, JPEG ou PNG** por arquivo
4. Tamanho máximo: **3MB** por arquivo

**Etapa 5 — Aceite dos Termos**

1. Marque as caixas de aceite dos termos

**Etapa 6 — Envio**

1. Clique em **"Cadastrar"**

---

### Tela de Sucesso — Seu Código Exclusivo

Após o envio, você verá a tela de sucesso com seu **Código de Representante**:

```
🎉 Cadastro realizado!

Seu código exclusivo de representante é:

┌─────────────────┐
│   ABC123        │
└─────────────────┘

Guarde este código! Ele será usado para login e
para seus clientes indicarem você durante o cadastro.
```

> ⚠️ **IMPORTANTE:** Guarde esse código com segurança! Ele é necessário para fazer login e para que os clientes indiquem você durante o cadastro. Não compartilhe com terceiros.

---

### Validações e Possíveis Rejeições

| Situação             | Mensagem               | O que fazer                         |
| -------------------- | ---------------------- | ----------------------------------- |
| CPF já cadastrado    | "CPF já está em uso"   | Verifique se já tem cadastro        |
| CNPJ já cadastrado   | "CNPJ já cadastrado"   | Verifique duplicidade               |
| E-mail já usado      | "E-mail já cadastrado" | Use outro e-mail ou recupere acesso |
| Arquivo muito grande | "Arquivo excede 3MB"   | Reduza o tamanho do arquivo         |
| Formato inválido     | "Tipo não aceito"      | Use PDF, JPEG ou PNG                |
| Arquivo corrompido   | "Arquivo inválido"     | Envie um arquivo íntegro            |

---

### Após o Cadastro — Fluxo de Análise

Seu cadastro passa por uma análise dos documentos pela equipe QWork:

```
Cadastro enviado
      ↓
Status: "Ativo" (aguardando análise)
      ↓
Equipe QWork revisa documentos
      ↓
           ┌── Aprovado → Status: "Apto" ✅
           └── Rejeitado → notificação com motivo
```

> **Durante a análise:** Você já pode criar leads e indicar clientes! As comissões geradas ficam **retidas** até a aprovação. Após aprovado como **Apto**, as comissões são liberadas para o ciclo normal de pagamento.

---

## Acesso ao Portal

### Como fazer Login

1. Acesse a página de login do QWork (`/login`)
2. Selecione o perfil **"Representante"** (ou use o link direto)
3. Informe seu **E-mail**
4. Informe seu **Código de Representante** (gerado no cadastro)
5. Clique em **"Entrar"**

> **Nota:** O acesso do representante usa **e-mail + código** (não CPF + senha como outros usuários). O código substitui a senha.

### Duração da Sessão

A sessão dura **8 horas** a partir do login. Após esse período, será necessário fazer login novamente.

### Primeiro Acesso após Aprovação

Após a equipe QWork aprovar seu cadastro, você receberá um **link de convite por e-mail** para definir sua senha (caso o portal seja futuramente atualizado para suportar senha). Enquanto isso, o acesso segue normalmente por e-mail + código.

---

## Dashboard Principal

Após o login, você será direcionado para o **Dashboard do Representante**.

### Cards de Resumo

O dashboard exibe 4 cards de visão geral:

| Card                   | O que mostra                                    |
| ---------------------- | ----------------------------------------------- |
| 🎯 **Leads Ativos**    | Quantidade de indicações pendentes de conversão |
| 🤝 **Vínculos Ativos** | Clientes que estão gerando comissões            |
| 💰 **A Receber**       | Valor de comissões pendentes de pagamento       |
| ✅ **Total Recebido**  | Valor total já pago historicamente              |

### Alertas Automáticos

O dashboard exibe alertas quando necessário:

**Vínculo próximo do vencimento:**

- 🟡 Amarelo: vence em menos de 60 dias
- 🔴 Vermelho: vence em menos de 30 dias
- O alerta mostra o prazo e um link direto para renovar

**Cadastro em análise (status "Ativo" ou "Apto Pendente"):**

- 📋 Aviso azul informando que comissões estão retidas até aprovação

### Navegação Rápida

O dashboard tem três atalhos principais:

| Link                    | Função                                        |
| ----------------------- | --------------------------------------------- |
| 🎯 **Gerenciar Leads**  | Registrar indicações e gerar links de convite |
| 🤝 **Meus Vínculos**    | Acompanhar clientes e comissões associadas    |
| 💸 **Minhas Comissões** | Pipeline de pagamentos e histórico            |

### Menu Lateral

```
Dashboard
├── Leads
├── Vínculos
├── Comissões
└── Meus Dados
```

---

## Gerenciar Leads

Um **Lead** é uma indicação sua — uma empresa que você indicou e que pode se tornar cliente do QWork.

### Status dos Leads

| Status         | Descrição                                        | Badge |
| -------------- | ------------------------------------------------ | ----- |
| **Pendente**   | Indicação criada, empresa ainda não se cadastrou | Azul  |
| **Convertido** | Empresa se cadastrou no QWork                    | Verde |
| **Expirado**   | Prazo de indicação encerrado sem conversão       | Cinza |

### Criar um Novo Lead

1. Na página Leads, clique em **"+ Novo Lead"**
2. Preencha os dados da empresa a ser indicada:
   - **CNPJ** da empresa (obrigatório)
   - **Razão Social** (opcional, facilita identificação)
   - **Nome do Contato** (opcional)
   - **E-mail do Contato** (opcional)
   - **Telefone do Contato** (opcional)
   - **Valor Negociado** (opcional, para referência)
3. Clique em **"Salvar Lead"**

> **Validação:** O CNPJ é verificado automaticamente quanto ao formato. Se o CNPJ já está vinculado a outro representante, um aviso será exibido.

### Gerar Link/Código de Convite

Após criar um lead, você pode compartilhar sua indicação de duas formas:

**Opção 1 — Código do Representante**

1. Clique em **"Copiar Código"** no lead
2. O sistema copia um texto com o link de login e seu código:

   ```
   Olá! Faça o cadastro da sua empresa no QWork:
   https://app.qwork.com.br/login

   Na etapa de confirmação, informe o código do representante: ABC123
   ```

3. Envie por WhatsApp, e-mail ou como preferir

> **Instruções para o cliente:** Durante o cadastro no QWork, na etapa de confirmação, o cliente deve informar o seu código de representante. Isso vincula o cadastro a você automaticamente.

### Filtros e Ordenação

Na lista de leads, você pode:

- Filtrar por **Status** (Todos / Pendente / Convertido / Expirado)
- Ordenar por **Mais Recente**, **Mais Antigo** ou **Expirando Primeiro**

### Cards de Contagem

Na parte superior, três cards mostram a contagem por status:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Pendentes  │  │ Convertidos │  │  Expirados  │
│      5      │  │      12     │  │      3      │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Meus Vínculos

Um **Vínculo** é criado automaticamente quando um cliente que você indicou se cadastra e começa a usar o QWork. O vínculo garante que você receba as comissões pelos laudos emitidos por esse cliente durante o período de vigência.

### Status dos Vínculos

| Status        | Descrição                               | Badge    |
| ------------- | --------------------------------------- | -------- |
| **Ativo**     | Cliente vinculado e gerando comissões   | Verde    |
| **Inativo**   | Vínculo temporariamente pausado         | Amarelo  |
| **Suspenso**  | Vínculo suspenso por questão contratual | Vermelho |
| **Encerrado** | Vínculo encerrado definitivamente       | Cinza    |

### Informações de Cada Vínculo

Cada card de vínculo exibe:

- **Nome da Empresa** e CNPJ
- **Status** atual
- **Data de início** do vínculo
- **Data de expiração** com contagem regressiva
- **Total de comissões** geradas
- **Valor pendente** (comissões a receber)
- **Valor já pago** historicamente

### Alerta de Expiração

O sistema exibe alertas visuais automáticos:

| Prazo restante     | Cor do alerta              |
| ------------------ | -------------------------- |
| Mais de 60 dias    | Sem alerta                 |
| Entre 30 e 60 dias | 🟡 Amarelo                 |
| Menos de 30 dias   | 🔴 Vermelho                |
| Expirado           | Cinza (expirado há X dias) |

### Renovar Vínculo

Se um vínculo estiver próximo do vencimento:

1. Clique no botão **"Renovar"** no card do vínculo
2. A renovação é processada automaticamente
3. Uma confirmação verde aparecerá na tela

> **Nota:** A renovação pode estar sujeita a condições contratuais. Em caso de dúvida, entre em contato com o suporte QWork.

### Filtros

Filtre vínculos por status: **Todos**, **Ativo**, **Inativo**, **Suspenso** ou **Encerrado**.

---

## Minhas Comissões

As comissões são geradas toda vez que um laudo é emitido para um cliente dentro do seu vínculo ativo.

### Status das Comissões

| Status               | Descrição                                              | Badge    |
| -------------------- | ------------------------------------------------------ | -------- |
| **Retida**           | Aguardando aprovação do seu cadastro (status não-Apto) | Cinza    |
| **Aguardando NF**    | Pronto para você enviar Nota Fiscal ou RPA             | Azul     |
| **NF em Análise**    | NF enviada, aguardando aprovação do time QWork         | Índigo   |
| **Congelada**        | Temporariamente suspensa por questão nas contas        | Laranja  |
| **Aguardando Admin** | Em análise especial pela equipe                        | Amarelo  |
| **Liberada**         | NF aprovada, pronto para pagamento                     | Roxo     |
| **Paga**             | Pagamento realizado                                    | Verde    |
| **Cancelada**        | Comissão cancelada                                     | Vermelho |

### Ciclo de Pagamento

> 📅 **ATENÇÃO — PRAZO CRÍTICO**
>
> O pagamento ocorre mensalmente. Para receber no **dia 15** do mês, você precisa enviar sua NF até o **dia 5 do mesmo mês às 18h (horário de São Paulo)**.
>
> | Evento                        | Data                            |
> | ----------------------------- | ------------------------------- |
> | 🗃️ **Prazo para envio de NF** | Dia 5 do mês às 18h (São Paulo) |
> | 💸 **Pagamento realizado**    | Dia 15 do mês                   |
>
> NFs enviadas após o prazo entram no ciclo do **mês seguinte**.

### Resumo Financeiro

Na parte superior da página de comissões, você vê:

| Card                | Descrição                                                 |
| ------------------- | --------------------------------------------------------- |
| **A Receber**       | Soma de comissões Retidas + Aguardando NF + NF em Análise |
| **Futuro Previsto** | Comissões de meses futuros já provisionadas               |
| **Liberado**        | Soma de comissões aprovadas aguardando pagamento          |
| **Total Recebido**  | Todo o histórico de pagamentos realizados                 |

### Enviar NF

Quando uma comissão está com status **"Aguardando NF"**:

1. Localize a comissão na lista
2. Clique no botão **"Enviar NF"**
3. Selecione o arquivo:
   - Formatos aceitos: **PDF, PNG, JPEG ou WEBP**
   - Tamanho máximo: **2MB**
4. Clique em **"Enviar"**
5. O status mudará para **"NF em Análise"**

> Após a aprovação pelo time QWork, o status avança para **"Liberada"** e o pagamento é incluído no próximo ciclo (dia 15).

### Parcelas

Comissões maiores podem ser pagas em **parcelas**. Cada parcela é exibida separadamente:

- **Parcela confirmada:** Pagamento já efetivado (data de confirmação exibida)
- **Parcela provisionada:** Prevista para o futuro (ainda não paga)

### Filtros

Filtre comissões por:

- **Status** (qualquer dos estados acima)
- **Mês** (ex: fevereiro/2026)

### Comprovante de Pagamento

Comissões pagas exibem um botão para visualizar o **comprovante de pagamento** gerado pela equipe QWork.

---

## Dados Bancários e PIX

Para receber comissões, seus dados bancários precisam estar corretos e validados. Acesse **"Meus Dados"** no menu lateral.

### Formas de Recebimento

**Opção 1 — Transferência (TED)**

| Campo                | Exemplo                                 |
| -------------------- | --------------------------------------- |
| **Código do Banco**  | 001 (BB), 237 (Bradesco), 341 (Itaú)... |
| **Agência**          | 1234 ou 1234-5                          |
| **Conta**            | 12345-6                                 |
| **Tipo de Conta**    | Corrente ou Poupança                    |
| **Titular da Conta** | Nome exatamente como consta no banco    |

**Opção 2 — PIX**

| Tipo de Chave   | Exemplo              |
| --------------- | -------------------- |
| CPF             | 000.000.000-00       |
| CNPJ            | 00.000.000/0001-00   |
| E-mail          | seuemail@exemplo.com |
| Telefone        | (11) 91234-5678      |
| Chave Aleatória | Copiar do seu banco  |

> **Dica:** PIX tende a ser mais rápido e simples. Use a chave que já está cadastrada no seu banco.

### Status dos Dados Bancários

| Status            | Meaning                                  |
| ----------------- | ---------------------------------------- |
| **Não informado** | Dados bancários não preenchidos          |
| **Solicitado**    | Dados informados, aguardando confirmação |
| **Confirmado**    | Dados validados pelo time QWork          |

### Editar Dados Bancários

Para atualizar qualquer campo bancário:

1. Na página **"Meus Dados"**, localize o campo desejado
2. Clique no ícone de edição (lápis) ao lado do campo
3. Atualize o valor
4. Clique em **"Salvar"**
5. Aguarde a confirmação pelo time QWork

> ⚠️ **Atenção:** Pagamentos só são realizados para contas confirmadas. Se seus dados bancários mudaram, atualize com antecedência ao prazo de pagamento (dia 5).

---

## Status e Aprovação do Cadastro

### Trajetória do Status

Após o cadastro, seu perfil passa por uma trajetória de status:

```
🔵 ATIVO
   Cadastro realizado. Pode criar leads.
   Comissões estão retidas.
   ↓
   (Equipe QWork analisa seus documentos)
   ↓
🟡 APTO PENDENTE  ←  você solicita análise
   Documentos em revisão.
   Ainda retendo comissões.
   ↓
🟢 APTO
   Aprovado! Comissões liberadas para pagamento.
   Acesso completo a todas as funcionalidades.
```

> **Solicitar análise:** Na página inicial ou no seu perfil, existe um botão para solicitar que a equipe QWork revise seus documentos e avance seu status para "Apto".

### Outros Status

| Status             | Descrição                                          |
| ------------------ | -------------------------------------------------- |
| **Apto Bloqueado** | Temporariamente bloqueado por pendência específica |
| **Suspenso**       | Conta suspensa por violação contratual             |
| **Desativado**     | Conta encerrada                                    |
| **Rejeitado**      | Cadastro rejeitado por documentação inválida       |

### O que muda com cada status

| Funcionalidade         | Ativo | Apto Pendente | Apto |
| ---------------------- | ----- | ------------- | ---- |
| Criar Leads            | ✅    | ✅            | ✅   |
| Ver Vínculos           | ✅    | ✅            | ✅   |
| Ver Comissões          | ✅    | ✅            | ✅   |
| **Receber Pagamentos** | ❌    | ❌            | ✅   |
| Enviar NF              | ❌    | ❌            | ✅   |

> **Resumo:** Só o status **"Apto"** permite receber pagamentos. Comissões geradas enquanto seu status é Ativo ou Apto Pendente ficam **retidas** e são pagas depois da aprovação.

---

## Perguntas Frequentes

### 1. Perdi meu código de representante. Como recupero?

Entre em contato com o suporte QWork pelo e-mail ou WhatsApp informando seu nome, CPF/CNPJ e e-mail cadastrado. A equipe pode reenviar o código.

### 2. Meu cadastro foi rejeitado. O que fazer?

O e-mail de rejeição informa o motivo. Situações comuns:

- Documento ilegível: re-envie com melhor qualidade
- Documento vencido: envie um documento válido
- Dados inconsistentes: verifique nome, CPF/CNPJ

Em alguns casos, é possível enviar um novo cadastro com documentos corretos.

### 3. Quanto tempo leva para ser aprovado como Apto?

O prazo varia conforme a demanda da equipe QWork, mas normalmente ocorre em **1 a 5 dias úteis** após o envio dos documentos.

### 4. Posso criar leads antes de ser aprovado?

**Sim!** Você pode criar leads e indicar clientes assim que seu cadastro estiver **Ativo**. As comissões geradas ficam retidas até a aprovação, e são liberadas automaticamente quando você se tornar **Apto**.

### 5. Meu cliente se cadastrou mas o vínculo não apareceu. Por quê?

O vínculo é criado automaticamente quando o cliente informa seu código durante o cadastro. Verifique se:

- O cliente usou seu código corretamente
- O cadastro do cliente foi concluído (não apenas iniciado)

Se o problema persistir, entre em contato com o suporte.

### 6. O que significa "Comissão Congelada"?

Uma comissão com status **"Congelada"** pode indicar:

- **Congelada Rep. Suspenso:** Sua conta foi suspensa temporariamente
- **Aguardando Admin:** Aguardando análise especial da equipe

Nenhuma ação sua é necessária. A equipe QWork resolverá a situação.

### 7. Enviei NF mas foi rejeitada. O que acontece?

Quando a NF é rejeitada, o status da comissão volta para **"Aguardando NF"** e o motivo da rejeição é exibido. Você pode enviar um novo documento.

Motivos comuns de rejeição:

- Valor divergente do combinado
- Nota fiscal sem assinatura/carimbo
- Documento ilegível ou corrompido

### 8. Posso ter comissões de múltiplos clientes?

**Sim!** Você pode ter múltiplos vínculos ativos ao mesmo tempo, cada um com seus próprios clientes e comissões.

### 9. Quando o vínculo expira, perco as comissões pendentes?

Não. Comissões já geradas e pendentes de pagamento continuam no pipeline mesmo após o vínculo expirar. O que muda é que **novos laudos emitidos após a expiração** não geram mais comissão.

### 10. Recebi o pagamento em parcelas. É normal?

**Sim.** Para laudos de alto valor, as comissões podem ser parceladas. O sistema exibe cada parcela separadamente com status próprio (provisionada ou confirmada).

### 11. Minha chave PIX mudou. Devo atualizar antes do dia 5?

**Sim, com urgência!** Atualize seus dados bancários **antes do dia 5 do mês às 18h** para garantir que o pagamento seja feito para a conta correta. Pagamentos enviados para dados incorretos podem ser difíceis de recuperar.

---

## Suporte

### Problemas no Cadastro

Se tiver dificuldades para finalizar o cadastro na landing page:

- Verifique se os arquivos estão no formato correto (PDF/JPEG/PNG)
- Verifique se os arquivos têm menos de 3MB
- Tente um navegador diferente

### Problemas de Login

Se não consegue acessar o portal:

1. Confirme que está usando o **e-mail** (não CPF) e o **código** (não senha)
2. Verifique se seu **status** não é Suspenso ou Desativado
3. Solicite novo código ao suporte se necessário

### Contato

Para dúvidas técnicas, problemas de cadastro ou questões sobre comissões:

- **E-mail de Suporte:** Entre em contato através do canal oficial QWork
- **WhatsApp:** Disponível no site qwork.app.br

---

_Manual do Representante Comercial — QWork v1.0 — Março/2026_

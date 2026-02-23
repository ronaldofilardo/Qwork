# Manual do Usuário: Gestor RH

**Sistema QWork - Avaliação Psicossocial**  
**Versão:** 1.0 | **Atualização:** Fevereiro/2026

---

## Sumário

1. [Sobre este Manual](#sobre-este-manual)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Dashboard Principal](#dashboard-principal)
4. [Gestão de Empresas Clientes](#gestão-de-empresas-clientes)
5. [Gestão de Funcionários](#gestão-de-funcionários)
6. [Ciclos de Coletas Avaliativas](#ciclos-de-coletas-avaliativas)
7. [Emissão de Laudos](#emissão-de-laudos)
8. [Relatórios](#relatórios)
9. [Perguntas Frequentes](#perguntas-frequentes)
10. [Suporte](#suporte)

---

## Sobre este Manual

Este manual foi criado para orientar **Gestores RH** no uso do sistema QWork. O QWork é uma plataforma de avaliação psicossocial baseada no questionário **COPSOQ III** (Copenhagen Psychosocial Questionnaire), utilizado para mapear riscos psicossociais no ambiente de trabalho.

### O que é um Gestor RH?

O **Gestor RH** é o profissional responsável por administrar clínicas de medicina ocupacional e gerenciar as empresas clientes. Suas principais responsabilidades incluem:

- Cadastrar e gerenciar empresas clientes
- Importar e gerenciar funcionários
- Criar e liberar ciclos de avaliações
- Acompanhar o progresso das avaliações
- Solicitar e baixar laudos

---

## Acesso ao Sistema

### Como fazer Login

1. Acesse a página de login do sistema
2. Digite seu **CPF** (apenas números)
3. Digite sua **Senha**
4. Clique em **"Entrar"**

> **Nota:** Diferente dos funcionários, o Gestor RH sempre precisa de senha para acessar o sistema.

### Primeiro Acesso - Aceite de Termos

No primeiro acesso, você será direcionado para aceitar os termos de uso:

1. Leia os **Termos de Uso do Sistema**
2. Leia a **Política de Privacidade**
3. Marque as caixas confirmando que leu e concorda
4. Clique em **"Concordar e Continuar"**

### Recuperação de Acesso

Se esqueceu sua senha, entre em contato com o administrador do sistema para redefinição.

---

## Dashboard Principal

Após o login, você verá o **Dashboard do Gestor RH** com:

### Estatísticas Globais

| Card                      | Descrição                                   |
| ------------------------- | ------------------------------------------- |
| **Total de Empresas**     | Quantidade de empresas clientes cadastradas |
| **Total de Funcionários** | Soma de todos os funcionários das empresas  |
| **Total de Avaliações**   | Quantidade total de avaliações criadas      |
| **Avaliações Concluídas** | Avaliações finalizadas com sucesso          |

### Navegação Lateral

O menu lateral contém:

- **Empresas Clientes** - Gerenciar empresas
- **Notificações** - Alertas e avisos do sistema
- **Informações da Conta** - Dados do seu perfil

---

## Gestão de Empresas Clientes

### Cadastrar Nova Empresa

1. No Dashboard, clique em **"Nova Empresa"**
2. Preencha os dados obrigatórios:
   - **Nome da Empresa**
   - **CNPJ**
   - **Representante Nome**
   - **Representante Telefone**
   - **Representante E-mail**
3. Clique em **"Salvar"**

### Visualizar Empresas

Na lista de empresas, você verá:

- Nome e CNPJ da empresa
- Status (Ativa/Inativa)
- Total de funcionários
- Total de avaliações
- Progresso das avaliações (barra de progresso)

### Acessar Dashboard da Empresa

1. Clique no card da empresa desejada
2. Você será redirecionado para o dashboard da empresa
3. Lá você pode gerenciar funcionários e lotes

### Editar Empresa

1. Acesse o dashboard da empresa
2. Clique em **"Editar Dados"**
3. Atualize as informações necessárias
4. Clique em **"Salvar"**

---

## Gestão de Funcionários

### Importar Funcionários via CSV

1. Acesse o dashboard da empresa
2. Clique em **"Importar Funcionários"**
3. Baixe o **template CSV** de exemplo
4. Preencha o arquivo com os dados dos funcionários:
   ```
   cpf,nome,setor,funcao,nivel_cargo
   12345678901,João Silva,Produção,Operador,operacional
   98765432109,Maria Santos,RH,Gerente,gestao
   ```
5. Selecione o arquivo preenchido
6. Clique em **"Importar"**

> **Importante:** O campo `nivel_cargo` aceita apenas `operacional` ou `gestao`.

### Visualizar Lista de Funcionários

Na aba de funcionários, você pode:

- Ver todos os funcionários cadastrados
- Filtrar por setor, função ou nível
- Ver status da avaliação de cada funcionário
- Ver total de respostas (ex: 25/37 questões)

### Inativar Funcionário

Se um funcionário não deve mais participar das avaliações:

1. Localize o funcionário na lista
2. Clique no botão **"Inativar"**
3. Informe o motivo da inativação
4. Confirme a ação

> **Nota:** Funcionários inativados não podem mais responder avaliações.

### Resetar Avaliação

Para apagar todas as respostas de uma avaliação e permitir que o funcionário refaça:

1. Localize o funcionário
2. Clique no botão **"Reset"**
3. Confirme a ação

> **Atenção:** Esta ação é irreversível e apagará todas as respostas anteriores.

---

## Ciclos de Coletas Avaliativas

### O que é um Ciclo?

Um **Ciclo de Coleta Avaliativa** (também chamado de **Lote**) é um conjunto de funcionários selecionados para realizar a avaliação psicossocial em um determinado período.

### Criar Novo Ciclo

1. Acesse **"Ciclos de Coletas Avaliativas"**
2. Clique em **"Iniciar Novo Ciclo"**
3. Selecione os funcionários participantes
4. Configure o tipo do ciclo:
   - **Inicial** - Primeira avaliação da empresa
   - **Sequencial** - Avaliação de acompanhamento
5. Clique em **"Criar Ciclo"**

### Liberar Ciclo para Avaliação

Após criar o ciclo, você precisa liberá-lo para que os funcionários possam responder:

1. Acesse os detalhes do ciclo
2. Verifique se todos os funcionários estão corretos
3. Clique em **"Liberar para Avaliação"**
4. Confirme a liberação

> **Após liberar:** Os funcionários poderão acessar o sistema e responder a avaliação.

### Acompanhar Progresso

Na página de detalhes do ciclo, você pode:

- Ver estatísticas (total, concluídos, pendentes)
- Ver progresso individual de cada funcionário
- Ver classificação de risco por grupo (G1-G10)
- Filtrar por status ou nome

### Status das Avaliações

| Status           | Descrição                                  |
| ---------------- | ------------------------------------------ |
| **Iniciada**     | Avaliação liberada, aguardando funcionário |
| **Em Andamento** | Funcionário começou a responder            |
| **Concluída**    | Funcionário finalizou todas as questões    |
| **Inativada**    | Avaliação cancelada pelo gestor            |

---

## Emissão de Laudos

### Quando Solicitar Emissão

Você pode solicitar a emissão do laudo quando:

- O ciclo estiver com status **"Concluído"**
- Todas as avaliações estiverem finalizadas
- Não houver avaliações inativadas pendentes

### Solicitar Emissão

1. Acesse os detalhes do ciclo concluído
2. Clique em **"Solicitar Emissão do Laudo"**
3. Confirme a solicitação
4. Aguarde o processamento

> **Nota:** A emissão pode levar alguns minutos. Você receberá uma notificação quando estiver pronta.

### Fluxo de Pagamento

Se houver custo associado à emissão:

1. Após solicitar, você será direcionado para pagamento
2. Escolha a forma de pagamento (Boleto/Pix/Cartão)
3. Complete o pagamento
4. A emissão será liberada automaticamente

### Download do Laudo

1. Acesse os detalhes do ciclo
2. Localize a seção **"Laudo Emitido"**
3. Clique em **"Ver Laudo / Baixar PDF"**
4. O arquivo será baixado automaticamente

### Verificação de Integridade

Cada laudo possui um **Hash SHA-256** que garante sua autenticidade:

1. Na seção do laudo, localize o campo **"Hash de Integridade"**
2. Clique em **"Copiar Hash"**
3. Este hash pode ser usado para verificar se o PDF não foi alterado

> **Importante:** Guarde o hash para futuras verificações de autenticidade.

---

## Relatórios

### Gerar Relatório do Ciclo

1. Acesse os detalhes do ciclo
2. Clique em **"Gerar Relatório PDF"**
3. Aguarde o processamento
4. O relatório será baixado automaticamente

O relatório contém:

- Estatísticas gerais do ciclo
- Análise por grupo (G1-G10)
- Classificação de risco
- Recomendações

### Gerar Relatório Individual

1. Na tabela de funcionários, localize o funcionário desejado
2. Clique no botão **"PDF"** na coluna Ações
3. O relatório individual será gerado

### Classificação de Risco

Os grupos são classificados em:

| Classificação | Descrição                                  |
| ------------- | ------------------------------------------ |
| **Excelente** | Indicadores muito favoráveis               |
| **Monitorar** | Indicadores intermediários, requer atenção |
| **Atenção**   | Indicadores críticos, requer intervenção   |

---

## Perguntas Frequentes

### 1. Quantas questões tem a avaliação?

A avaliação contém **37 questões** divididas em 10 grupos temáticos. O tempo estimado de resposta é de **15 a 20 minutos**.

### 2. O funcionário pode pausar a avaliação?

Sim! O sistema salva automaticamente cada resposta. O funcionário pode sair e continuar depois de onde parou.

### 3. Como funciona a classificação de risco?

O sistema calcula a média das respostas por grupo e classifica em:

- **Excelente:** Indicadores favoráveis
- **Monitorar:** Indicadores intermediários
- **Atenção:** Indicadores críticos

### 4. Posso reemitir um laudo?

Sim, entre em contato com o administrador para solicitar a reemissão de um laudo.

### 5. O que significa "Inativar" uma avaliação?

Inativar uma avaliação remove o funcionário do ciclo atual. Ele não poderá mais responder aquela avaliação específica.

### 6. Como adiciono mais funcionários a um ciclo existente?

Não é possível adicionar funcionários a um ciclo já criado. Você deve criar um novo ciclo para os novos funcionários.

---

## Suporte

### Canais de Atendimento

- **E-mail:** suporte@qwork.com.br
- **Telefone:** (XX) XXXX-XXXX

### Informações Úteis

Ao entrar em contato, tenha em mãos:

- Seu CPF
- Nome da empresa
- ID do ciclo (se aplicável)

### Horário de Atendimento

Segunda a Sexta: 08h às 18h

---

**© 2026 QWork - Sistema de Avaliação Psicossocial**

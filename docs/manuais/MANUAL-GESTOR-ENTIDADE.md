# Manual do Usuário: Gestor Entidade

**Sistema QWork - Avaliação Psicossocial**  
**Versão:** 1.0 | **Atualização:** Fevereiro/2026

---

## Sumário

1. [Sobre este Manual](#sobre-este-manual)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Visão Geral](#visão-geral)
4. [Gestão de Funcionários](#gestão-de-funcionários)
5. [Ciclos de Coletas Avaliativas](#ciclos-de-coletas-avaliativas)
6. [Detalhes do Lote](#detalhes-do-lote)
7. [Emissão de Laudos](#emissão-de-laudos)
8. [Perguntas Frequentes](#perguntas-frequentes)
9. [Suporte](#suporte)

---

## Sobre este Manual

Este manual foi criado para orientar **Gestores de Entidade** no uso do sistema QWork. O QWork é uma plataforma de avaliação psicossocial baseada no questionário **COPSOQ III** (Copenhagen Psychosocial Questionnaire), utilizado para mapear riscos psicossociais no ambiente de trabalho.

### O que é um Gestor Entidade?

O **Gestor Entidade** é o profissional responsável por administrar a própria empresa (tomador) dentro do sistema. Diferente do Gestor RH que gerencia múltiplas empresas clientes, o Gestor Entidade gerencia apenas sua empresa.

Suas principais responsabilidades incluem:

- Gerenciar funcionários da empresa
- Criar e liberar ciclos de avaliações
- Acompanhar o progresso das avaliações
- Solicitar e baixar laudos
- Gerar relatórios

---

## Acesso ao Sistema

### Como fazer Login

1. Acesse a página de login do sistema
2. Digite seu **CPF** (apenas números)
3. Digite sua **Senha**
4. Clique em **"Entrar"**

> **Nota:** O Gestor Entidade sempre precisa de senha para acessar o sistema.

### Primeiro Acesso - Aceite de Termos

No primeiro acesso, você será direcionado para aceitar os termos de uso:

1. Leia os **Termos de Uso do Sistema**
2. Leia a **Política de Privacidade**
3. Marque as caixas confirmando que leu e concorda
4. Clique em **"Concordar e Continuar"**

### Após o Login

Após autenticação, você será redirecionado automaticamente para a página de **Ciclos de Coletas Avaliativas**.

---

## Visão Geral

### Dashboard da Empresa

Acesse **"Visão Geral"** no menu lateral para visualizar:

- Estatísticas da empresa
- Resumo de avaliações
- Status dos ciclos ativos

### Navegação Lateral

O menu lateral contém:

- **Empresa**
  - Visão Geral
  - Ciclos de Coletas Avaliativas
  - Funcionários Ativos
- **Informações da Conta** - Dados do seu perfil

---

## Gestão de Funcionários

### Importar Funcionários via CSV

1. Acesse **"Funcionários Ativos"**
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

> **Importante:** O campo `nivel_cargo` aceita apenas `operacional` ou `gestao`. Isso determina qual questionário o funcionário irá responder.

### Visualizar Lista de Funcionários

Na página de funcionários, você pode:

- Ver todos os funcionários cadastrados
- Filtrar por setor, função ou nível
- Ver status da avaliação de cada funcionário
- Ver total de respostas (ex: 25/37 questões)

### Níveis de Cargo

| Nível           | Questionário | Características                           |
| --------------- | ------------ | ----------------------------------------- |
| **Operacional** | 37 questões  | Funcionários de operação, produção, apoio |
| **Gestão**      | 37 questões  | Gerentes, coordenadores, supervisores     |

---

## Ciclos de Coletas Avaliativas

### O que é um Ciclo?

Um **Ciclo de Coleta Avaliativa** (também chamado de **Lote**) é um conjunto de funcionários selecionados para realizar a avaliação psicossocial em um determinado período.

### Lista de Ciclos

Na página **"Ciclos de Coletas Avaliativas"**, você visualiza:

- ID do ciclo
- Status atual
- Total de funcionários
- Avaliações concluídas x pendentes
- Data de liberação

### Status dos Ciclos

| Status         | Descrição                                    |
| -------------- | -------------------------------------------- |
| **Rascunho**   | Ciclo criado mas não liberado                |
| **Ativo**      | Ciclo liberado, funcionários podem responder |
| **Concluído**  | Todas as avaliações finalizadas              |
| **Finalizado** | Laudo emitido e enviado                      |
| **Cancelado**  | Ciclo cancelado                              |

### Criar Novo Ciclo

1. Clique em **"Iniciar Novo Ciclo"**
2. Selecione os funcionários participantes
3. Configure o tipo do ciclo:
   - **Inicial** - Primeira avaliação da empresa
   - **Sequencial** - Avaliação de acompanhamento
4. Clique em **"Criar Ciclo"**

### Liberar Ciclo para Avaliação

Após criar o ciclo, você precisa liberá-lo:

1. Acesse os detalhes do ciclo
2. Verifique se todos os funcionários estão corretos
3. Clique em **"Liberar para Avaliação"**
4. Confirme a liberação

> **Após liberar:** Os funcionários poderão acessar o sistema e responder a avaliação usando CPF + data de nascimento.

---

## Detalhes do Lote

### Acessar Detalhes

1. Na lista de ciclos, clique no card do ciclo desejado
2. Você verá informações detalhadas do ciclo

### Estatísticas do Ciclo

No topo da página, você visualiza:

- **Total de Funcionários** - Quantidade de participantes
- **Avaliações Concluídas** - Quantidade finalizada
- **Avaliações Pendentes** - Quantidade aguardando

### Tabela de Funcionários

A tabela mostra informações detalhadas de cada funcionário:

| Coluna             | Descrição               |
| ------------------ | ----------------------- |
| **ID**             | Número da avaliação     |
| **Nome**           | Nome do funcionário     |
| **CPF**            | CPF do funcionário      |
| **Nível**          | Operacional ou Gestão   |
| **Status**         | Status da avaliação     |
| **Data Conclusão** | Quando finalizou        |
| **G1-G10**         | Classificação por grupo |

### Filtros Disponíveis

Você pode filtrar a tabela por:

- **Nome** - Busca por nome do funcionário
- **CPF** - Busca por CPF
- **Status** - Concluído, Pendente, Inativada
- **Nível** - Operacional ou Gestão
- **Grupos (G1-G10)** - Excelente, Monitorar, Atenção

### Classificação de Risco por Grupo

Os 10 grupos avaliados são:

| Grupo   | Tema                           | Interpretação  |
| ------- | ------------------------------ | -------------- |
| **G1**  | Exigências do Trabalho         | Menor = Melhor |
| **G2**  | Trabalho e Ritmo               | Maior = Melhor |
| **G3**  | Desenvolvimento de Habilidades | Maior = Melhor |
| **G4**  | Compromisso com o Trabalho     | Menor = Melhor |
| **G5**  | Previsibilidade                | Maior = Melhor |
| **G6**  | Claridade da Função            | Maior = Melhor |
| **G7**  | Variedade do Trabalho          | Menor = Melhor |
| **G8**  | Qualidade da Liderança         | Menor = Melhor |
| **G9**  | Suporte Social                 | Menor = Melhor |
| **G10** | Segurança do Emprego           | Menor = Melhor |

### Inativar Avaliação

Se um funcionário não deve mais participar:

1. Localize o funcionário na tabela
2. Clique no botão **"Inativar"**
3. Informe o motivo
4. Confirme a ação

> **Nota:** Avaliações inativadas não contam para o progresso do ciclo.

### Resetar Avaliação

Para permitir que o funcionário refaça a avaliação:

1. Localize o funcionário
2. Clique no botão **"Reset"**
3. Confirme a ação

> **Atenção:** Esta ação apaga todas as respostas anteriores e é irreversível.

### Gerar Relatório Individual

1. Localize o funcionário com avaliação concluída
2. Clique no botão **"PDF"** na coluna Ações
3. O relatório será baixado automaticamente

---

## Emissão de Laudos

### Quando Solicitar Emissão

Você pode solicitar a emissão do laudo quando:

- O ciclo estiver com status **"Concluído"**
- Todas as avaliações estiverem finalizadas
- Não haver avaliações pendentes

### Solicitar Emissão

1. Acesse os detalhes do ciclo concluído
2. Localize a seção **"Lote Concluído"**
3. Clique em **"Solicitar Emissão do Laudo"**
4. Confirme a solicitação

### Status da Emissão

Após solicitar, você verá:

- **Emissão Solicitada** - Aguardando processamento
- **Laudo Emitido** - Pronto para download

### Download do Laudo

1. Acesse os detalhes do ciclo
2. Localize a seção **"Laudo Emitido"**
3. Clique em **"Ver Laudo / Baixar PDF"**
4. O arquivo será baixado automaticamente

> **Nota:** O download só está disponível após o upload do laudo para o servidor.

### Verificação de Integridade

Cada laudo possui um **Hash SHA-256** que garante sua autenticidade:

1. Na seção do laudo, localize o campo **"Hash de Integridade"**
2. Clique em **"Copiar"**
3. Este hash pode ser usado para verificar se o PDF não foi alterado

### Verificar Autenticidade

O sistema verifica automaticamente a integridade do laudo antes do download:

- Se o hash conferir: Download prossegue normalmente
- Se o hash não conferir: Sistema alerta sobre possível alteração

---

## Perguntas Frequentes

### 1. Quantas questões tem a avaliação?

A avaliação contém **37 questões** divididas em 10 grupos temáticos. O tempo estimado de resposta é de **15 a 20 minutos**.

### 2. Como os funcionários acessam o sistema?

Os funcionários acessam usando:

- **CPF** (apenas números)
- **Data de Nascimento** (formato ddmmaaaa)

Eles não precisam de senha.

### 3. O funcionário pode pausar a avaliação?

Sim! O sistema salva automaticamente cada resposta. O funcionário pode sair e continuar depois de onde parou.

### 4. Qual a diferença entre "Inativar" e "Reset"?

- **Inativar:** Remove o funcionário do ciclo, ele não responde mais
- **Reset:** Apaga as respostas e permite refazer a avaliação

### 5. Posso adicionar funcionários a um ciclo existente?

Não. Para incluir novos funcionários, crie um novo ciclo.

### 6. Quanto tempo leva para emitir o laudo?

Após a solicitação, o laudo geralmente fica pronto em alguns minutos. Você será notificado quando estiver disponível.

### 7. O que significa cada classificação de risco?

| Classificação | Significado                                       |
| ------------- | ------------------------------------------------- |
| **Excelente** | Indicadores favoráveis, sem necessidade de ação   |
| **Monitorar** | Indicadores intermediários, requer acompanhamento |
| **Atenção**   | Indicadores críticos, requer intervenção imediata |

### 8. Como funciona o pagamento da emissão?

Se houver custo associado, você será direcionado para o gateway de pagamento após solicitar a emissão. As formas de pagamento incluem Boleto, Pix e Cartão de Crédito.

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

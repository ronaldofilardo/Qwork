# Manual do Usuário: Gestor

**Sistema QWork - Avaliação Psicossocial**  
**Versão:** 1.1 | **Atualização:** Fevereiro/2026

---

## Sumário

1. [Sobre este Manual](#sobre-este-manual)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Visão Geral e Dashboard](#visão-geral-e-dashboard)
4. [Gestão de Empresas Clientes](#gestão-de-empresas-clientes) _(apenas Gestor Clínica)_
5. [Gestão de Funcionários](#gestão-de-funcionários)
6. [Ciclos de Coletas Avaliativas](#ciclos-de-coletas-avaliativas)
7. [Detalhes do Lote](#detalhes-do-lote)
8. [Aba Pendências](#aba-pendências)
9. [Emissão de Laudos](#emissão-de-laudos)
10. [Laudo de Mapeamento de Riscos Psicossociais](#laudo-de-mapeamento-de-riscos-psicossociais)
11. [Relatórios](#relatórios)
12. [Perguntas Frequentes](#perguntas-frequentes)
13. [Suporte](#suporte)

---

## Sobre este Manual

Este manual foi criado para orientar **Gestores** no uso do sistema QWork. O QWork é uma plataforma de avaliação psicossocial baseada no questionário **COPSOQ III** (Copenhagen Psychosocial Questionnaire), utilizado para mapear riscos psicossociais no ambiente de trabalho conforme exigências da **NR-1** e do **GRO** (Gerenciamento de Riscos Ocupacionais).

### Perfis de Gestor

O sistema possui dois perfis de gestor com jornadas distintas:

| Característica                 | Gestor Clínica (RH)                             | Gestor Entidade                          |
| ------------------------------ | ----------------------------------------------- | ---------------------------------------- |
| **Acesso**                     | `/rh/*`                                         | `/entidade/*`                            |
| **Quem é**                     | Profissional de clínica de medicina ocupacional | Profissional da própria empresa avaliada |
| **Gerencia**                   | Múltiplas empresas clientes                     | Apenas a própria empresa                 |
| **Cadastra empresas clientes** | ✅ Sim                                          | ❌ Não                                   |
| **Pagamento do laudo**         | Gerado separadamente por empresa cliente        | Gerado diretamente após solicitação      |
| **Fluxo de trabalho**          | Empresa → Funcionários → Ciclos → Laudos        | Funcionários → Ciclos → Laudos           |

> **Como usar este manual:** As seções que se aplicam apenas a um dos perfis são marcadas com:
>
> - 🏥 **Apenas Gestor Clínica**
> - 🏢 **Apenas Gestor Entidade**
> - Seções sem marcação aplicam-se a **ambos os perfis**.

---

## Acesso ao Sistema

### Como fazer Login

1. Acesse a página de login do sistema
2. Digite seu **CPF** (apenas números)
3. Digite sua **Senha**
4. Clique em **"Entrar"**

> **Nota:** Gestores sempre precisam de senha para acessar o sistema. Diferentemente dos funcionários, que usam CPF + data de nascimento.

### Primeiro Acesso — Aceite de Termos

No primeiro acesso, você será direcionado para aceitar os termos de uso:

1. Leia os **Termos de Uso do Sistema**
2. Leia a **Política de Privacidade**
3. Marque as caixas confirmando que leu e concorda
4. Clique em **"Concordar e Continuar"**

### Recuperação de Acesso

Em caso de esquecimento de senha, entre em contato com o administrador do sistema para redefinição.

---

## Visão Geral e Dashboard

### Fluxo de Trabalho Interativo

O dashboard principal exibe um **Fluxo de Trabalho Interativo** com todas as etapas do processo. Cada etapa possui um tooltip com informações detalhadas sobre o que precisa ser feito.

#### 🏥 Fluxo do Gestor Clínica

1. **Inserção de Nova Empresa** — Cadastre empresas clientes com CNPJ, nome e dados de contato.
2. **Inserção de Funcionário** — Adicione os colaboradores que serão avaliados.
3. **Liberação de Lotes** — Libere lotes de avaliação para que os funcionários acessem.
4. **Avaliações** — Funcionários respondem ao questionário psicossocial.
5. **Solicitação de Emissão de Laudo** — Solicite a emissão após as avaliações serem completadas.
6. **Recebimento do Link para Pagamento** — O link de pagamento é gerado por empresa cliente e enviado via WhatsApp/e-mail.
7. **Emissão e Recebimento do Laudo** — Laudo gerado e disponível para download após confirmação do pagamento.

#### 🏢 Fluxo do Gestor Entidade

1. **Inserção de Funcionário** — Cadastre os funcionários que serão avaliados.
2. **Liberação de Lotes** — Libere lotes de avaliação para que os funcionários acessem.
3. **Avaliações** — Funcionários respondem ao questionário psicossocial.
4. **Solicitação de Emissão de Laudo** — Solicite a emissão após as avaliações serem completadas.
5. **Recebimento do Link para Pagamento** — Receba o link de pagamento via WhatsApp/e-mail.
6. **Emissão e Recebimento do Laudo** — Laudo gerado e disponível para download após pagamento.

### Estatísticas do Dashboard

#### 🏥 Gestor Clínica

| Card                      | Descrição                                   |
| ------------------------- | ------------------------------------------- |
| **Total de Empresas**     | Quantidade de empresas clientes cadastradas |
| **Total de Funcionários** | Soma de todos os funcionários das empresas  |
| **Total de Avaliações**   | Quantidade total de avaliações criadas      |
| **Avaliações Concluídas** | Avaliações finalizadas com sucesso          |

#### 🏢 Gestor Entidade

Acesse **"Visão Geral"** no menu lateral para visualizar:

- Estatísticas da empresa
- Resumo de avaliações
- Status dos ciclos ativos

### Navegação Lateral

#### 🏥 Gestor Clínica

- **Empresas Clientes** — Gerenciar empresas
- **Notificações** — Alertas e avisos do sistema
- **Informações da Conta** — Dados do seu perfil

#### 🏢 Gestor Entidade

- **Empresa**
  - Visão Geral
  - Ciclos de Coletas Avaliativas
  - Funcionários Ativos
  - **Pendências** _(com badge de contagem quando há funcionários pendentes)_
- **Informações da Conta** — Dados do seu perfil

---

## Gestão de Empresas Clientes

> 🏥 **Esta seção se aplica apenas ao Gestor Clínica.**

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
3. Lá você pode gerenciar funcionários e lotes da empresa

### Editar Empresa

1. Acesse o dashboard da empresa
2. Clique em **"Editar Dados"**
3. Atualize as informações necessárias
4. Clique em **"Salvar"**

---

## Gestão de Funcionários

> 🏥 **Gestor Clínica:** acesse o dashboard da empresa cliente antes de gerenciar funcionários.  
> 🏢 **Gestor Entidade:** acesse **"Funcionários Ativos"** no menu lateral.

### Importar Funcionários via CSV

1. Clique em **"Importar Funcionários"**
2. Baixe o **template CSV** de exemplo
3. Preencha o arquivo com os dados dos funcionários:
   ```
   cpf,nome,setor,funcao,nivel_cargo
   12345678901,João Silva,Produção,Operador,operacional
   98765432109,Maria Santos,RH,Gerente,gestao
   ```
4. Selecione o arquivo preenchido
5. Clique em **"Importar"**

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
   - **Inicial** — Primeira avaliação da empresa
   - **Sequencial** — Avaliação de acompanhamento
4. Clique em **"Criar Ciclo"**

### Liberar Ciclo para Avaliação

Após criar o ciclo, você precisa liberá-lo para que os funcionários possam responder:

1. Acesse os detalhes do ciclo
2. Verifique se todos os funcionários estão corretos
3. Clique em **"Liberar para Avaliação"**
4. Confirme a liberação

> **Após liberar:** Os funcionários poderão acessar o sistema e responder a avaliação usando **CPF + data de nascimento** (sem senha).

### Status das Avaliações Individuais

| Status           | Descrição                                  |
| ---------------- | ------------------------------------------ |
| **Iniciada**     | Avaliação liberada, aguardando funcionário |
| **Em Andamento** | Funcionário começou a responder            |
| **Concluída**    | Funcionário finalizou todas as questões    |
| **Inativada**    | Avaliação cancelada pelo gestor            |

---

## Detalhes do Lote

### Acessar Detalhes

1. Na lista de ciclos, clique no card do ciclo desejado
2. Você verá informações detalhadas do ciclo

### Estatísticas do Ciclo

No topo da página, você visualiza:

- **Total de Funcionários** — Quantidade de participantes
- **Avaliações Concluídas** — Quantidade finalizada
- **Avaliações Pendentes** — Quantidade aguardando

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
| **G1–G10**         | Classificação por grupo |

### Filtros Disponíveis

Você pode filtrar a tabela por:

- **Nome** — Busca por nome do funcionário
- **CPF** — Busca por CPF
- **Status** — Concluído, Pendente, Inativada
- **Nível** — Operacional ou Gestão
- **Grupos (G1–G10)** — Excelente, Monitorar, Atenção

### Classificação de Risco por Grupo

Os 10 grupos avaliados são:

| Grupo   | Tema                           |
| ------- | ------------------------------ |
| **G1**  | Exigências do Trabalho         |
| **G2**  | Trabalho e Ritmo               |
| **G3**  | Desenvolvimento de Habilidades |
| **G4**  | Compromisso com o Trabalho     |
| **G5**  | Previsibilidade                |
| **G6**  | Claridade da Função            |
| **G7**  | Variedade do Trabalho          |
| **G8**  | Qualidade da Liderança         |
| **G9**  | Suporte Social                 |
| **G10** | Segurança do Emprego           |

### Inativar Avaliação

Se um funcionário não deve mais participar:

1. Localize o funcionário na tabela
2. Clique no botão **"Inativar"**
3. Informe o motivo
4. Confirme a ação

> **Nota:** Avaliações inativadas não contam para o progresso do ciclo.

### Gerar Relatório Individual

1. Localize o funcionário com avaliação concluída
2. Clique no botão **"PDF"** na coluna Ações
3. O relatório será baixado automaticamente

---

## Aba Pendências

A **Aba Pendências** exibe funcionários ativos que ainda não possuem avaliação concluída em nenhum ciclo avaliativo liberado. Ela serve como ferramenta de acompanhamento para garantir que nenhum colaborador fique sem avaliação registrada.

> 🏥 **Gestor Clínica:** a aba Pendências é exibida dentro do dashboard de cada empresa cliente.  
> 🏢 **Gestor Entidade:** a aba Pendências está disponível no menu lateral, com um **badge numérico** indicando a quantidade atual de funcionários pendentes.

### Quando as Pendências Aparecem?

As pendências são calculadas sempre em relação ao **lote de referência** — o último ciclo avaliativo liberado. Um funcionário aparece na lista de pendências quando se enquadra em um dos seguintes motivos:

| Motivo                     | Descrição                                                                |
| -------------------------- | ------------------------------------------------------------------------ |
| **Inativado no Lote**      | A avaliação do funcionário foi inativada durante o último ciclo liberado |
| **Nunca Avaliado**         | O funcionário nunca participou de nenhum ciclo avaliativo da empresa     |
| **Adicionado Após o Lote** | O funcionário foi cadastrado após a liberação do lote de referência      |
| **Sem Conclusão Válida**   | Participou de algum ciclo, mas não concluiu nenhuma avaliação            |

> **Nota:** Se nenhum ciclo avaliativo tiver sido liberado ainda, a aba exibirá uma mensagem informando que as pendências estarão disponíveis após o primeiro ciclo.

### Como Usar a Aba Pendências

1. Acesse a **Aba Pendências**
2. Visualize o **lote de referência** (ID, data de liberação e status)
3. Os funcionários são agrupados por motivo de pendência
4. Para cada funcionário, você pode ver:
   - Nome, CPF, setor e função
   - Data de cadastro e, quando aplicável, data de inativação
5. Use as informações para decidir se o funcionário deve ser incluído no próximo ciclo ou se a situação deve ser regularizada

### O que Fazer com as Pendências?

- **Funcionários nunca avaliados ou adicionados após o lote:** inclua-os no próximo ciclo de avaliação.
- **Funcionários inativados:** avalie se devem retornar ao processo ou se a inativação é definitiva.
- **Funcionários sem conclusão válida:** verifique se houve algum problema no acesso e, se necessário, crie um novo ciclo para eles.

> A aba de Pendências é atualizada em tempo real. Utilize o botão **"Atualizar"** (ícone de refresh) para recarregar os dados.

---

## Emissão de Laudos

### Quando Solicitar Emissão

Você pode solicitar a emissão do laudo quando:

- O ciclo estiver com status **"Concluído"**
- Todas as avaliações estiverem finalizadas
- Não houver avaliações pendentes relevantes

### Solicitar Emissão

1. Acesse os detalhes do ciclo concluído
2. Localize a seção **"Lote Concluído"**
3. Clique em **"Solicitar Emissão do Laudo"**
4. Confirme a solicitação

### Fluxo de Pagamento

> 🏥 **Gestor Clínica:** o pagamento é gerado **por empresa cliente**. Cada empresa recebe seu próprio link de cobrança, independentemente das outras empresas da clínica.  
> 🏢 **Gestor Entidade:** o pagamento é gerado diretamente para a empresa após a solicitação.

Após a solicitação:

1. Você receberá o link de pagamento via **WhatsApp** e/ou **e-mail**
2. Escolha a forma de pagamento: **Boleto**, **Pix** ou **Cartão de Crédito**
3. Complete o pagamento
4. A emissão do laudo será liberada automaticamente após a confirmação

### Status da Emissão

| Status                   | Descrição                       |
| ------------------------ | ------------------------------- |
| **Emissão Solicitada**   | Aguardando processamento        |
| **Aguardando Pagamento** | Link gerado, pagamento pendente |
| **Laudo Emitido**        | Pronto para download            |

### Download do Laudo

1. Acesse os detalhes do ciclo
2. Localize a seção **"Laudo Emitido"**
3. Clique em **"Ver Laudo / Baixar PDF"**
4. O arquivo será baixado automaticamente

> **Nota:** O download só fica disponível após o upload do laudo para o servidor e confirmação do pagamento.

### Verificação de Integridade (Hash SHA-256)

Cada laudo possui um **Hash SHA-256** que garante sua autenticidade e comprova que o documento não foi adulterado:

1. Na seção do laudo, localize o campo **"Hash de Integridade"**
2. Clique em **"Copiar Hash"**
3. Guarde este hash para futuras verificações

O sistema verifica automaticamente a integridade do laudo antes de cada download:

- ✅ Hash válido: download prossegue normalmente
- ❌ Hash inválido: sistema alerta sobre possível alteração do documento

---

## Laudo de Mapeamento de Riscos Psicossociais

### O que é o Laudo de Mapeamento?

O **Laudo de Identificação e Mapeamento de Riscos Psicossociais** é o documento técnico gerado pelo sistema ao final do processo avaliativo. Ele atende às exigências da **NR-1** (Norma Regulamentadora nº 1) e do **GRO** (Gerenciamento de Riscos Ocupacionais), que tornaram obrigatória a identificação e gestão dos riscos psicossociais no ambiente de trabalho.

O laudo é produzido pelo **Emissor** — profissional habilitado pré-cadastrado no sistema — com base nos resultados das avaliações respondidas pelos funcionários no ciclo concluído.

### O que o Laudo Contém?

- Identificação da empresa e do ciclo avaliativo
- Consolidação das respostas dos funcionários por grupo temático (G1–G10)
- Classificação de risco de cada grupo: **Excelente**, **Monitorar** ou **Atenção**
- Análise qualitativa dos riscos identificados
- Recomendações de intervenção e monitoramento

### Como o Gestor Obtém o Laudo?

1. O ciclo precisa estar com status **"Concluído"**
2. O gestor solicita a emissão (seção [Emissão de Laudos](#emissão-de-laudos))
3. Após o pagamento ser confirmado, o Emissor recebe o lote para emissão
4. O Emissor gera e faz upload do laudo no sistema
5. O gestor é notificado e pode baixar o PDF pelo painel

> **Importante:** O laudo é um documento com validade legal. Guarde-o em local seguro e mantenha o **hash de integridade** registrado para eventuais auditorias ou fiscalizações.

### Classificação dos Grupos

| Classificação | Significado                                       |
| ------------- | ------------------------------------------------- |
| **Excelente** | Indicadores favoráveis, sem necessidade de ação   |
| **Monitorar** | Indicadores intermediários, requer acompanhamento |
| **Atenção**   | Indicadores críticos, requer intervenção imediata |

---

## Relatórios

### Gerar Relatório do Ciclo

1. Acesse os detalhes do ciclo
2. Clique em **"Gerar Relatório PDF"**
3. Aguarde o processamento
4. O relatório será baixado automaticamente

O relatório contém:

- Estatísticas gerais do ciclo
- Análise por grupo (G1–G10)
- Classificação de risco
- Recomendações

### Gerar Relatório Individual

1. Na tabela de funcionários, localize o funcionário desejado
2. Clique no botão **"PDF"** na coluna Ações
3. O relatório individual será baixado automaticamente

---

## Perguntas Frequentes

### 1. Quantas questões tem a avaliação?

A avaliação contém **37 questões** divididas em 10 grupos temáticos. O tempo estimado de resposta é de **15 a 20 minutos**.

### 2. Como os funcionários acessam o sistema?

Os funcionários acessam usando:

- **CPF** (apenas números)
- **Data de Nascimento** (formato ddmmaaaa)

Eles **não precisam de senha**.

### 3. O funcionário pode pausar a avaliação?

Sim. O sistema salva automaticamente cada resposta. O funcionário pode sair e continuar de onde parou.

### 4. Qual a diferença entre "Inativar" e "Reset"?

| Ação         | Efeito                                                     |
| ------------ | ---------------------------------------------------------- |
| **Inativar** | Remove o funcionário do ciclo; ele não pode mais responder |
| **Reset**    | Apaga todas as respostas; o funcionário recomeça do zero   |

> **Atenção:** Ambas as ações são irreversíveis.

### 5. Posso adicionar funcionários a um ciclo existente?

Não. Para incluir novos funcionários, crie um novo ciclo. Os funcionários adicionados após a liberação do último lote aparecerão na **Aba Pendências**.

### 6. Quanto tempo leva para emitir o laudo?

Após a confirmação do pagamento, o Emissor processa o laudo e o disponibiliza para download. O prazo pode variar; você será notificado quando estiver disponível.

### 7. O Gestor Clínica precisa pagar por cada empresa?

🏥 Sim. Cada empresa cliente possui seu próprio processo de emissão e cobrança. O link de pagamento é gerado separadamente para cada empresa.

### 8. O que aparece na Aba Pendências?

A aba exibe funcionários ativos sem avaliação concluída em nenhum ciclo liberado, agrupados por motivo: inativados, nunca avaliados, adicionados após o lote ou sem conclusão válida.

### 9. O laudo tem validade legal?

Sim. O laudo atende aos requisitos da NR-1/GRO. O hash SHA-256 garante a integridade do documento para fins de auditoria e fiscalização.

### 10. Posso reemitir um laudo?

Entre em contato com o administrador do sistema para solicitar a reemissão de um laudo.

---

## Suporte

### Canais de Atendimento

- **E-mail:** suporte@qwork.com.br
- **Telefone:** (XX) XXXX-XXXX

### Informações Úteis

Ao entrar em contato, tenha em mãos:

- Seu CPF
- Nome da empresa (ou empresa cliente, se aplicável)
- ID do ciclo (se aplicável)

### Horário de Atendimento

Segunda a Sexta: 08h às 18h

---

**© 2026 QWork - Sistema de Avaliação Psicossocial**

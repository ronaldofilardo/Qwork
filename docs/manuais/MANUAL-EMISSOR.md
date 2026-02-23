# Manual do Usuário: Emissor

**Sistema QWork - Avaliação Psicossocial**  
**Versão:** 1.0 | **Atualização:** Fevereiro/2026

---

## Sumário

1. [Sobre este Manual](#sobre-este-manual)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Dashboard do Emissor](#dashboard-do-emissor)
4. [Emissão de Laudos](#emissão-de-laudos)
5. [Upload para Bucket](#upload-para-bucket)
6. [Integridade e Segurança](#integridade-e-segurança)
7. [Histórico e Rastreamento](#histórico-e-rastreamento)
8. [Perguntas Frequentes](#perguntas-frequentes)
9. [Suporte](#suporte)

---

## Sobre este Manual

Este manual foi criado para orientar **Emissores** no uso do sistema QWork para emissão de laudos psicossociais.

### O que é um Emissor?

O **Emissor** é o profissional responsável por gerar e assinar os laudos de avaliação psicossocial. Este é um perfil **pré-cadastrado** no sistema, ou seja, você não pode se cadastrar como emissor - precisa ser previamente registrado pelo administrador do sistema.

### Responsabilidades

- Receber lotes de avaliações concluídas
- Gerar laudos de identificação e mapeamento de riscos psicossociais
- Fazer upload dos laudos para o servidor
- Garantir a integridade e autenticidade dos documentos

### Fluxo de Trabalho

O fluxo do Emissor inicia quando:

1. Um gestor (RH ou Entidade) solicita a emissão de um laudo
2. O lote aparece no seu dashboard como "Laudo para Emitir"
3. Você gera o laudo e faz o upload
4. O laudo fica disponível para o solicitante

---

## Acesso ao Sistema

### Pré-cadastro

Como emissor, você foi **previamente cadastrado** no sistema pelo administrador. Seu acesso já está configurado com:

- CPF registrado
- Senha temporária (se for primeiro acesso)
- Perfil de emissor ativo

### Como fazer Login

1. Acesse a página de login do sistema
2. Digite seu **CPF** (apenas números)
3. Digite sua **Senha**
4. Clique em **"Entrar"**

### Primeiro Acesso

Se é seu primeiro acesso:

1. Faça login com a senha temporária fornecida
2. O sistema pode solicitar a troca de senha
3. Defina uma senha segura
4. Continue para o Dashboard

### Instalar Aplicativo (PWA)

O sistema pode ser instalado como um aplicativo no seu dispositivo:

1. No Dashboard, clique em **"Instalar App"**
2. Confirme a instalação
3. O aplicativo será adicionado à sua tela inicial

> **Benefício:** Acesso rápido e notificações em tempo real.

---

## Dashboard do Emissor

### Visão Geral

Após o login, você verá o **Dashboard do Emissor** com:

- Lista de lotes recebidos
- Status de cada lote
- Ações disponíveis

### Abas de Navegação

O dashboard possui três abas:

| Aba                   | Descrição                         |
| --------------------- | --------------------------------- |
| **Laudo para Emitir** | Lotes aguardando emissão          |
| **Laudo Emitido**     | Laudos já gerados e disponíveis   |
| **Cancelados**        | Lotes cancelados pelo solicitante |

### Atualização Automática

O sistema atualiza automaticamente a lista a cada **30 segundos**. Você também pode clicar no botão **"Atualizar"** para uma atualização manual.

### Informações de Cada Lote

Cada card de lote mostra:

- **ID do Lote** - Identificador único
- **Status** - Concluído, Finalizado, Cancelado
- **Empresa Cliente** - Nome da empresa
- **Clínica Origem** - Nome da clínica solicitante
- **Recebido em** - Data e hora de liberação
- **Total de Avaliações** - Quantidade de funcionários

### Status dos Lotes

| Status         | Descrição                       |
| -------------- | ------------------------------- |
| **Concluído**  | Lote pronto para emissão        |
| **Finalizado** | Laudo emitido e enviado         |
| **Cancelado**  | Lote cancelado, não requer ação |

---

## Emissão de Laudos

### Recebendo um Lote

Quando um gestor solicita a emissão:

1. O lote aparece na aba **"Laudo para Emitir"**
2. Você recebe uma notificação no sistema
3. O card mostra informações do solicitante

### Verificando Detalhes

Antes de emitir, verifique:

1. Clique no card do lote
2. Veja informações como:
   - Quem solicitou
   - Data da solicitação
   - Previsão de emissão

### Iniciando a Emissão

1. Na aba **"Laudo para Emitir"**
2. Localize o lote desejado
3. Clique no botão **"Iniciar Laudo"** ou **"Pré-visualização"**

### Pré-visualização

Antes de gerar o laudo definitivo:

1. O sistema mostra uma prévia do laudo
2. Verifique os dados e estatísticas
3. Confirme se tudo está correto
4. Prossiga com a geração

### Geração do PDF

Ao confirmar a emissão:

1. O sistema gera o PDF do laudo
2. Calcula o **Hash SHA-256** do documento
3. Salva o arquivo localmente
4. Marca o laudo como "Emitido"

> **Tempo:** A geração pode levar alguns segundos a um minuto, dependendo do tamanho do lote.

### Reprocessar Laudo

Se houver erro na geração:

1. O botão **"Reprocessar"** aparecerá
2. Clique para tentar novamente
3. O sistema reiniciará o processo de geração

### Download do Laudo

Após a emissão:

1. O laudo aparece na aba **"Laudo Emitido"**
2. Clique no botão de download
3. O PDF será baixado para seu dispositivo

---

## Upload para Bucket

### Por que fazer Upload?

O upload para o bucket (servidor de armazenamento) é essencial para:

- Disponibilizar o laudo para o solicitante
- Garantir backup seguro do documento
- Manter rastreabilidade e integridade

### Quando fazer Upload

O upload deve ser feito **após a emissão**:

1. Gere o laudo (PDF)
2. Verifique se o hash foi calculado
3. Faça o upload para o bucket
4. Confirme o envio

### Processo de Upload

1. Na aba **"Laudo Emitido"**
2. Localize o laudo desejado
3. Clique no botão **"Enviar ao Bucket"** ou **"Upload"**
4. Aguarde a confirmação

### Status do Upload

| Status         | Descrição                         |
| -------------- | --------------------------------- |
| **Aguardando** | Laudo emitido, sem upload         |
| **Enviando**   | Upload em andamento               |
| **Enviado**    | Upload concluído com sucesso      |
| **Erro**       | Falha no upload, tentar novamente |

### Verificando URL Remota

Após o upload:

1. O sistema mostra a **URL remota** do arquivo
2. Esta URL é usada para download pelo solicitante
3. Verifique se a URL está acessível

---

## Integridade e Segurança

### Hash SHA-256

Cada laudo possui um **Hash SHA-256** que garante:

- **Integridade:** O documento não foi alterado
- **Autenticidade:** O documento é original
- **Rastreabilidade:** Histórico verificável

### Onde encontrar o Hash

1. No card do laudo emitido
2. Seção **"Hash de Integridade (SHA-256)"**
3. Código alfanumérico de 64 caracteres

### Copiando o Hash

1. Clique no botão **"Copiar Hash"**
2. O hash será copiado para a área de transferência
3. Use para verificação futura

### Verificação de Integridade

Para verificar se um laudo é autêntico:

1. Compare o hash do PDF baixado com o hash armazenado
2. Use ferramentas como `sha256sum` ou sites de verificação
3. Se os hashes forem iguais, o documento é íntegro

### Boas Práticas

- **Nunca** altere o PDF após a geração
- **Sempre** verifique o hash antes de enviar ao bucket
- **Mantenha** registro dos hashes emitidos
- **Reporte** qualquer discrepância encontrada

---

## Histórico e Rastreamento

### Visualizando Laudos Emitidos

Na aba **"Laudo Emitido"**:

- Todos os laudos que você emitiu
- Data e hora de emissão
- Status de upload
- Hash de integridade

### Informações Registradas

Cada laudo registra:

| Campo          | Descrição              |
| -------------- | ---------------------- |
| **Emissor**    | Seu nome/CPF           |
| **Emitido em** | Data e hora da emissão |
| **Enviado em** | Data e hora do upload  |
| **Hash**       | Código de integridade  |
| **URL Remota** | Link para download     |

### Notificações do Lote

Cada lote pode ter notificações associadas:

- **Lote Liberado** - Quando foi disponibilizado para você
- **Lote Finalizado** - Quando o laudo foi enviado

### Auditoria

O sistema mantém registro de todas as ações:

- Quem emitiu cada laudo
- Quando foi emitido
- Quando foi enviado
- Qual hash foi gerado

---

## Perguntas Frequentes

### 1. Como sei que um novo lote está disponível?

O sistema atualiza automaticamente a cada 30 segundos. Você também verá uma notificação no card do lote.

### 2. Posso editar um laudo após emitir?

**Não.** Após a emissão, o laudo não pode ser alterado. Se houver erro, é necessário reprocessar e emitir novamente.

### 3. O que significa "Pagamento Pendente"?

Alguns laudos requerem confirmação de pagamento antes da emissão. Neste caso, aguarde a confirmação do pagamento pelo solicitante.

### 4. Quanto tempo leva para gerar um laudo?

O tempo varia conforme o tamanho do lote. Geralmente leva de alguns segundos a um minuto.

### 5. O que fazer se o upload falhar?

1. Verifique sua conexão com a internet
2. Clique em **"Re-enviar ao Bucket"**
3. Se o problema persistir, entre em contato com o suporte

### 6. Como verifico se o laudo foi entregue ao solicitante?

Na aba "Laudo Emitido", verifique se:

- O status está como "Enviado"
- A URL remota está preenchida
- A data de envio está registrada

### 7. Posso emitir laudos em lote?

Atualmente, cada laudo deve ser emitido individualmente. Se houver muitos lotes pendentes, processe-os sequencialmente.

### 8. O hash muda se eu reemitir o laudo?

**Sim.** Cada nova emissão gera um novo hash, pois o PDF é regenerado. O hash anterior torna-se inválido.

---

## Suporte

### Problemas Técnicos

Se você encontrar problemas:

1. **Erro na geração:** Tente reprocessar
2. **Erro no upload:** Verifique conexão e tente novamente
3. **Erro de login:** Entre em contato com o administrador

### Canais de Atendimento

- **E-mail:** suporte@qwork.com.br
- **Telefone:** (XX) XXXX-XXXX

### Informações Úteis

Ao entrar em contato, tenha em mãos:

- Seu CPF
- ID do lote com problema
- Descrição do erro
- Prints de tela (se possível)

### Horário de Atendimento

Segunda a Sexta: 08h às 18h

---

## Checklist do Emissor

### Antes de Emitir

- [ ] Verificar se o lote está completo (todas avaliações concluídas)
- [ ] Verificar dados do solicitante
- [ ] Verificar se não há pagamento pendente

### Durante a Emissão

- [ ] Pré-visualizar o laudo
- [ ] Verificar estatísticas e dados
- [ ] Confirmar a geração

### Após a Emissão

- [ ] Verificar se o hash foi gerado
- [ ] Fazer download para conferência
- [ ] Fazer upload para o bucket
- [ ] Confirmar status "Enviado"

---

**© 2026 QWork - Sistema de Avaliação Psicossocial**

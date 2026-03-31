# Manuais de Usuário - Sistema QWork

**Versão:** 1.1 | **Atualização:** Março/2026

---

## Visão Geral

O sistema QWork possui **5 tipos de usuários**, cada um com funcionalidades e jornadas específicas. Selecione o manual correspondente ao seu perfil:

---

## Manuais Disponíveis

### 1. [Manual do Gestor RH](./MANUAL-GESTOR-RH.md)

**Quem é:** Profissional que gerencia clínicas de medicina ocupacional e empresas clientes.

**Principais Funcionalidades:**

- Cadastrar e gerenciar empresas clientes
- Importar e gerenciar funcionários
- Criar e liberar ciclos de avaliações
- Acompanhar progresso das avaliações
- Solicitar e baixar laudos

**Acesso:** `/rh/*` | **Autenticação:** CPF + Senha

---

### 2. [Manual do Gestor Entidade](./MANUAL-GESTOR-ENTIDADE.md)

**Quem é:** Profissional que gerencia a própria empresa (tomador) dentro do sistema.

**Principais Funcionalidades:**

- Gerenciar funcionários da empresa
- Criar e liberar ciclos de avaliações
- Acompanhar progresso das avaliações
- Solicitar e baixar laudos
- Gerar relatórios

**Acesso:** `/entidade/*` | **Autenticação:** CPF + Senha

---

### 3. [Manual do Funcionário](./MANUAL-FUNCIONARIO.md)

**Quem é:** Trabalhador que responde a avaliação psicossocial.

**Principais Funcionalidades:**

- Acessar o sistema (CPF + data de nascimento)
- Responder avaliação psicossocial (COPSOQ III)
- Visualizar comprovante de conclusão
- Acessar histórico de avaliações

**Acesso:** `/dashboard`, `/avaliacao` | **Autenticação:** CPF + Data de Nascimento

---

### 4. [Manual do Emissor](./MANUAL-EMISSOR.md)

**Quem é:** Profissional pré-cadastrado responsável por emitir laudos.

**Principais Funcionalidades:**

- Receber lotes para emissão
- Gerar laudos de identificação e mapeamento de riscos
- Fazer upload dos laudos para o servidor
- Garantir integridade e autenticidade dos documentos

**Acesso:** `/emissor/*` | **Autenticação:** CPF + Senha

---

### 5. [Manual do Representante Comercial](./MANUAL-REPRESENTANTE-ONBOARDING.md)

**Quem é:** Parceiro comercial que indica empresas para o QWork e recebe comissões por laudos emitidos.

**Principais Funcionalidades:**

- Cadastro via landing page (PF ou PJ) com upload de documentos
- Criar e acompanhar leads (indicações de empresas)
- Monitorar vínculos ativos e alertas de expiração
- Pipeline de comissões e envio de NF/RPA
- Gerenciar dados bancários para recebimento

**Acesso:** `/representante/*` | **Autenticação:** E-mail + Código de Representante

---

## Comparativo Rápido

| Característica            | Gestor RH       | Gestor Entidade | Funcionário      | Emissor     | Representante       |
| ------------------------- | --------------- | --------------- | ---------------- | ----------- | ------------------- |
| **Autenticação**          | CPF + Senha     | CPF + Senha     | CPF + Data Nasc. | CPF + Senha | E-mail + Código     |
| **Cadastro próprio**      | Não             | Não             | Não              | Não         | Sim (landing page)  |
| **Gerencia Empresas**     | Sim (múltiplas) | Não             | Não              | Não         | Não                 |
| **Gerencia Funcionários** | Sim             | Sim             | Não              | Não         | Não                 |
| **Cria Ciclos**           | Sim             | Sim             | Não              | Não         | Não                 |
| **Responde Avaliação**    | Não             | Não             | Sim              | Não         | Não                 |
| **Emite Laudos**          | Não             | Não             | Não              | Sim         | Não                 |
| **Recebe Comissões**      | Não             | Não             | Não              | Não         | Sim                 |
| **Pré-cadastrado**        | Não             | Não             | Não              | Sim         | Não (auto-cadastro) |

---

## Sobre o Sistema QWork

### O que é?

O QWork é uma plataforma de avaliação psicossocial baseada no questionário **COPSOQ III** (Copenhagen Psychosocial Questionnaire), utilizado para mapear riscos psicossociais no ambiente de trabalho.

### Objetivo

Identificar fatores de risco psicossocial que podem afetar a saúde mental e o bem-estar dos trabalhadores, permitindo que as empresas desenvolvam ações preventivas e de melhoria.

### Grupos Avaliados (G1-G10)

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

---

## Fluxo Geral do Sistema

```
1. Gestor (RH/Entidade) cadastra funcionários
              |
              v
2. Gestor cria e libera ciclo de avaliação
              |
              v
3. Funcionários respondem a avaliação (37 questões)
              |
              v
4. Gestor acompanha progresso e aguarda conclusão
              |
              v
5. Gestor solicita emissão do laudo
              |
              v
6. Emissor recebe lote e gera o laudo
              |
              v
7. Emissor faz upload do laudo para o servidor
              |
              v
8. Gestor baixa o laudo e relatórios
```

---

## Suporte

### Canais de Atendimento

- **E-mail:** suporte@qwork.com.br
- **Telefone:** (XX) XXXX-XXXX
- **Horário:** Segunda a Sexta, 08h às 18h

### Informações Úteis

Ao entrar em contato, tenha em mãos:

- Seu CPF
- Nome da empresa
- ID do ciclo/lote (se aplicável)
- Descrição detalhada do problema

---

**© 2026 QWork - Sistema de Avaliação Psicossocial**

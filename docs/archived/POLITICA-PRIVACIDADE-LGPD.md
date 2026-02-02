# 🔒 Política de Privacidade e Proteção de Dados - QWork

## Conformidade LGPD - Lei 13.709/2018

---

## 1. 📋 Princípios Aplicados

### Art. 6º - Princípios da LGPD Implementados:

| Princípio                    | Implementação no Sistema                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| **I - Finalidade**           | Base legal registrada para cada tratamento (contrato, obrigação legal, consentimento) |
| **II - Qualidade**           | Validação rigorosa de CPF com dígitos verificadores, auditoria periódica              |
| **III - Necessidade**        | Mascaramento de CPF em interfaces (`***.***.*89-09`), logs mascarados                 |
| **IV - Livre Acesso**        | API `/api/consentimento` permite consulta do próprio consentimento                    |
| **V - Transparência**        | Badge visual de base legal, histórico de tratamentos                                  |
| **VI - Segurança**           | Senhas com bcrypt, sessões httpOnly, validação rigorosa de entrada                    |
| **VII - Prevenção**          | Validação em múltiplas camadas, auditoria contínua                                    |
| **VIII - Não Discriminação** | Dados psicossociais tratados de forma ética e confidencial                            |
| **IX - Responsabilização**   | Logs de auditoria, histórico de exclusões, relatórios mensais                         |

---

## 2. 🗂️ Dados Coletados e Finalidade

### 2.1 Dados de Identificação

| Dado          | Finalidade                         | Base Legal           | Retenção              |
| ------------- | ---------------------------------- | -------------------- | --------------------- |
| **CPF**       | Identificação única do colaborador | Contrato de trabalho | 36 meses após término |
| **Nome**      | Identificação do colaborador       | Contrato de trabalho | 36 meses após término |
| **Email**     | Comunicação e notificações         | Contrato de trabalho | 36 meses após término |
| **Matrícula** | Identificação interna              | Contrato de trabalho | 36 meses após término |

### 2.2 Dados de Avaliação Psicossocial

| Dado                             | Finalidade                            | Base Legal                       | Retenção |
| -------------------------------- | ------------------------------------- | -------------------------------- | -------- |
| **Respostas COPSOQ III**         | Avaliação de riscos psicossociais     | Obrigação legal (NR-01)          | 36 meses |
| **Respostas JZ (Jogo)**          | Rastreamento de comportamento de jogo | Consentimento ou obrigação legal | 36 meses |
| **Respostas EF (Endividamento)** | Identificação de estresse financeiro  | Consentimento                    | 36 meses |
| **Pontuações e Resultados**      | Geração de laudos técnicos            | Obrigação legal                  | 36 meses |

### 2.3 Dados de Auditoria

| Dado                        | Finalidade               | Base Legal         | Retenção |
| --------------------------- | ------------------------ | ------------------ | -------- |
| **IP de Acesso**            | Auditoria de segurança   | Interesse legítimo | 12 meses |
| **Data/Hora de Ações**      | Rastreabilidade          | Interesse legítimo | 60 meses |
| **Histórico de Alterações** | Conformidade e auditoria | Obrigação legal    | 60 meses |

---

## 3. 🔐 Medidas de Segurança Implementadas

### 3.1 Controles Técnicos

✅ **Autenticação e Autorização:**

- Senhas criptografadas com bcrypt (10 rounds)
- Sessões seguras com cookies httpOnly
- Validação de permissões em todas as rotas
- Separação de perfis (funcionário, RH, admin, emissor)

✅ **Proteção de Dados Pessoais:**

- CPF mascarado em interfaces (exibe apenas `***.***.*89-09`)
- Logs com CPF mascarado (`*******8909`)
- Validação rigorosa com dígitos verificadores
- Sanitização de entradas para prevenir SQL injection

✅ **Controle de Acesso:**

- RH acessa apenas empresas da própria clínica
- Funcionários acessam apenas suas próprias avaliações
- Emissores acessam apenas laudos de sua clínica
- Admin tem acesso completo (auditado)

### 3.2 Controles Organizacionais

✅ **Minimização de Dados:**

- Coleta apenas dados necessários para a finalidade
- CPF não é exibido completo sem justificativa
- Anonimização após prazo de validade

✅ **Retenção e Descarte:**

- Avaliações válidas por 36 meses
- Anonimização automática após validade
- Exclusão física após 6 meses da anonimização
- Histórico estatístico mantido de forma anonimizada

✅ **Auditoria e Rastreabilidade:**

- Log de todas as operações em `audit_log`
- Histórico de exclusões em `historico_exclusoes`
- Relatórios mensais de conformidade
- Script de auditoria de CPFs

---

## 4. 📅 Política de Retenção de Dados

### 4.1 Ciclo de Vida dos Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        CICLO DE VIDA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. COLETA               → Registro com base legal             │
│     ↓                      e consentimento                      │
│                                                                 │
│  2. PROCESSAMENTO        → Geração de laudos e                 │
│     ↓                      análises (36 meses)                  │
│                                                                 │
│  3. ANONIMIZAÇÃO         → Após 36 meses ou término            │
│     ↓                      do vínculo                           │
│                                                                 │
│  4. ARQUIVO ANÔNIMO      → Mantido 6 meses para                │
│     ↓                      fins estatísticos                    │
│                                                                 │
│  5. EXCLUSÃO DEFINITIVA  → Após 42 meses total                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Prazos por Tipo de Dado

| Tipo de Dado               | Prazo de Retenção | Justificativa             |
| -------------------------- | ----------------- | ------------------------- |
| **Respostas de Avaliação** | 36 meses          | NR-01 - validade do laudo |
| **Dados Cadastrais**       | 36 meses          | Obrigações trabalhistas   |
| **Logs de Auditoria**      | 60 meses          | Requisitos legais         |
| **Dados Anonimizados**     | Indefinido        | Estatísticas agregadas    |
| **Histórico de Exclusão**  | Indefinido        | Accountability LGPD       |

### 4.3 Processo de Anonimização

**Executado automaticamente por:**

- Cron job mensal: `pnpm lgpd:retencao`
- Função SQL: `executar_politica_retencao()`

**Processo:**

1. Identificar avaliações com `data_validade < NOW()`
2. Criar snapshot anonimizado para estatísticas
3. Registrar em `historico_exclusoes` com CPF mascarado
4. Marcar registro como `anonimizada = true`
5. Após 6 meses, excluir respostas detalhadas
6. Manter apenas dados agregados

---

## 5. 👤 Direitos dos Titulares (Art. 18 LGPD)

### 5.1 Como Exercer seus Direitos

Os colaboradores podem exercer os seguintes direitos:

| Direito                        | Como Solicitar                          | Prazo de Resposta |
| ------------------------------ | --------------------------------------- | ----------------- |
| **Confirmação de Tratamento**  | Via RH ou email ao DPO                  | 15 dias           |
| **Acesso aos Dados**           | GET `/api/consentimento?avaliacao_id=X` | Imediato          |
| **Correção de Dados**          | Via RH                                  | 15 dias           |
| **Anonimização ou Exclusão**   | Via RH ou email ao DPO                  | 30 dias           |
| **Portabilidade**              | Exportação via interface                | Imediato          |
| **Revogação de Consentimento** | Via RH                                  | 15 dias           |

### 5.2 Contato do Encarregado (DPO)

**Email:** dpo@qwork.com.br  
**Telefone:** (11) 0000-0000  
**Horário:** Segunda a Sexta, 9h às 18h

---

## 6. 🔄 Compartilhamento de Dados

### 6.1 Destinatários Autorizados

| Destinatário                | Finalidade                       | Base Legal      |
| --------------------------- | -------------------------------- | --------------- |
| **Clínica Responsável**     | Emissão de laudos técnicos       | Contrato        |
| **Empresa Contratante**     | Gestão de riscos psicossociais   | Contrato        |
| **Autoridades Competentes** | Cumprimento de obrigações legais | Obrigação legal |

### 6.2 Não Compartilhamos com:

❌ Terceiros para fins comerciais  
❌ Empresas de marketing  
❌ Redes sociais  
❌ Parceiros não autorizados

---

## 7. 📊 Relatórios de Conformidade

### 7.1 Relatórios Gerados

**Mensal:**

- Auditoria de CPFs (`pnpm lgpd:auditar`)
- Execução de política de retenção
- Estatísticas de consentimento

**Anual:**

- Relatório de conformidade LGPD
- Inventário de dados pessoais
- Relatório de incidentes (se houver)

### 7.2 Localização dos Logs

```
logs/
├── auditoria-cpf-[timestamp].json
├── retencao/
│   ├── retencao-2025-12-01.json
│   └── erro-2025-12-01.log
└── audit/
    └── [logs de auditoria do sistema]
```

---

## 8. 🚨 Notificação de Incidentes

### 8.1 Em Caso de Violação de Dados

**Prazo de notificação:**

- ANPD: 2 dias úteis (Art. 48)
- Titulares afetados: Prazo razoável

**Conteúdo da notificação:**

- Descrição do incidente
- Dados afetados
- Medidas técnicas de proteção
- Riscos aos titulares
- Medidas corretivas adotadas

### 8.2 Plano de Resposta

1. **Contenção** - Isolar sistema afetado
2. **Avaliação** - Identificar dados comprometidos
3. **Notificação** - Informar ANPD e titulares
4. **Correção** - Implementar medidas de segurança
5. **Documentação** - Registrar em relatório de incidente

---

## 9. ✅ Checklist de Conformidade

### Para Desenvolvedores:

- [ ] CPF sempre validado com dígitos verificadores
- [ ] CPF mascarado em interfaces (`<CPFMascarado />`)
- [ ] Logs nunca exibem CPF completo
- [ ] Base legal registrada para cada avaliação
- [ ] Validação de permissões em todas as rotas
- [ ] Auditoria de ações sensíveis
- [ ] Testes de segurança implementados

### Para RH/Administradores:

- [ ] Consentimento registrado antes de avaliações
- [ ] Funcionários informados sobre coleta de dados
- [ ] Dados de funcionários desligados anonimizados
- [ ] Acesso restrito a dados sensíveis
- [ ] Backup regular do banco de dados
- [ ] Relatórios de conformidade revisados mensalmente

---

## 10. 📚 Referências Legais

- **LGPD** - Lei 13.709/2018: [Texto completo](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- **NR-01** - Gerenciamento de Riscos: [Portaria MTP 6.730/2020](https://www.gov.br/trabalho-e-previdencia/pt-br)
- **COPSOQ III** - Questionário psicossocial: [Referência técnica](https://www.copsoq-network.org/)
- **ANPD** - Autoridade Nacional: [Portal oficial](https://www.gov.br/anpd/pt-br)

---

**Última atualização:** 20 de dezembro de 2025  
**Versão:** 1.0.0  
**Responsável:** Equipe de Desenvolvimento QWork  
**Aprovação:** DPO / Jurídico

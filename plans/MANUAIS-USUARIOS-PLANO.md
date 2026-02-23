# 📚 Plano de Manuais por Tipo de Usuário

**Data:** 18/02/2026  
**Objetivo:** Criar manuais específicos para cada tipo de usuário do sistema QWork, considerando a jornada completa de cada perfil.

---

## 🎯 Visão Geral dos Perfis

| Perfil              | Descrição                             | Acesso                     | Autenticação          |
| ------------------- | ------------------------------------- | -------------------------- | --------------------- |
| **Gestor RH**       | Gerencia clínicas e empresas clientes | `/rh/*`                    | CPF + Senha           |
| **Gestor Entidade** | Gerencia a própria empresa (tomador)  | `/entidade/*`              | CPF + Senha           |
| **Funcionário**     | Responde avaliações psicossociais     | `/dashboard`, `/avaliacao` | CPF + Data Nascimento |
| **Emissor**         | Emite laudos (pré-cadastrado)         | `/emissor/*`               | CPF + Senha           |

---

## 📖 Manual 1: Gestor RH

### Jornada Completa

```mermaid
flowchart TD
    A[Login CPF + Senha] --> B[Aceite de Termos]
    B --> C[Dashboard RH]
    C --> D{Ação}
    D --> E[Gerenciar Empresas]
    D --> F[Criar Nova Empresa]
    D --> G[Acessar Empresa Existente]

    E --> H[Lista de Empresas]
    F --> I[Formulário Nova Empresa]
    G --> J[Dashboard da Empresa]

    J --> K{Ações da Empresa}
    K --> L[Gerenciar Funcionários]
    K --> M[Criar Lote de Avaliação]
    K --> N[Visualizar Lotes]

    L --> L1[Importar Funcionários CSV]
    L --> L2[Visualizar Lista]
    L --> L3[Inativar/Resetar Avaliações]

    M --> M1[Selecionar Funcionários]
    M --> M2[Configurar Lote]
    M --> M3[Liberar Lote]

    N --> N1[Acompanhar Progresso]
    N --> N2[Gerar Relatórios]
    N --> N3[Solicitar Emissão de Laudo]
    N --> N4[Baixar Laudo PDF]
```

### Seções do Manual

1. **Acesso ao Sistema**
   - Como fazer login
   - Aceite de termos de uso
   - Recuperação de acesso

2. **Gestão de Empresas Clientes**
   - Cadastrar nova empresa
   - Editar dados da empresa
   - Visualizar estatísticas

3. **Gestão de Funcionários**
   - Importar funcionários via CSV
   - Visualizar lista de funcionários
   - Inativar funcionários
   - Resetar avaliações

4. **Ciclos de Coletas Avaliativas**
   - Criar novo ciclo/lote
   - Selecionar funcionários
   - Liberar lote para avaliação
   - Acompanhar progresso

5. **Emissão de Laudos**
   - Quando solicitar emissão
   - Fluxo de pagamento
   - Download do laudo
   - Verificação de integridade (hash)

6. **Relatórios**
   - Gerar relatório do lote
   - Gerar relatório individual
   - Exportar dados

---

## 📖 Manual 2: Gestor Entidade

### Jornada Completa

```mermaid
flowchart TD
    A[Login CPF + Senha] --> B[Aceite de Termos]
    B --> C[Dashboard Entidade]
    C --> D{Ação}
    D --> E[Visão Geral]
    D --> F[Ciclos de Coletas]
    D --> G[Funcionários Ativos]
    D --> H[Informações da Conta]

    E --> E1[Estatísticas da Empresa]
    E --> E2[Resumo de Avaliações]

    F --> F1[Lista de Lotes]
    F1 --> F2[Criar Novo Ciclo]
    F2 --> F3[Selecionar Funcionários]
    F3 --> F4[Liberar para Avaliação]

    F1 --> F5[Acessar Detalhes do Lote]
    F5 --> F6[Acompanhar Progresso]
    F5 --> F7[Gerar Relatórios]
    F5 --> F8[Solicitar Emissão]
    F5 --> F9[Baixar Laudo]

    G --> G1[Lista de Funcionários]
    G1 --> G2[Importar via CSV]
    G1 --> G3[Visualizar Status]
```

### Seções do Manual

1. **Acesso ao Sistema**
   - Login e segurança
   - Termos de uso

2. **Visão Geral**
   - Dashboard da empresa
   - Métricas principais

3. **Gestão de Funcionários**
   - Importar funcionários
   - Visualizar funcionários ativos
   - Status das avaliações

4. **Ciclos de Coletas Avaliativas**
   - Criar novo ciclo
   - Selecionar participantes
   - Liberar avaliações
   - Acompanhar andamento

5. **Detalhes do Lote**
   - Visualizar funcionários do lote
   - Progresso individual
   - Classificações de risco (G1-G10)
   - Inativar/Resetar avaliações

6. **Emissão de Laudos**
   - Solicitar emissão
   - Acompanhar status
   - Download e verificação

---

## 📖 Manual 3: Funcionário

### Jornada Completa

```mermaid
flowchart TD
    A[Login CPF + Data Nascimento] --> B[Confirmação de Identidade]
    B --> C[Dashboard Funcionário]
    C --> D{Status da Avaliação}

    D -->|Disponível| E[Iniciar Avaliação]
    D -->|Em Andamento| F[Continuar Avaliação]
    D -->|Concluída| G[Ver Comprovante]

    E --> H[Questionário COPSOQ III]
    F --> H

    H --> I[Responder Questões]
    I --> J{Próxima Questão}
    J -->|Sim| I
    J -->|Última| K[Conclusão]

    K --> L[Modal de Processamento]
    L --> M[Redirecionamento]
    M --> G

    G --> N[Comprovante de Conclusão]
    N --> O[Histórico de Avaliações]
```

### Seções do Manual

1. **Primeiro Acesso**
   - Como fazer login (CPF + data de nascimento)
   - Confirmação de identidade
   - Dicas de segurança

2. **Dashboard**
   - Visualizar avaliações disponíveis
   - Histórico de avaliações
   - Status atual

3. **Realizando a Avaliação**
   - Iniciando a avaliação
   - Escala de respostas (0-4)
   - Salvamento automático
   - Pausar e continuar depois
   - Tempo estimado (15-20 minutos)

4. **Conclusão**
   - Tela de confirmação
   - Comprovante de conclusão
   - O que acontece após concluir

5. **Dúvidas Frequentes**
   - Posso refazer a avaliação?
   - Minhas respostas são confidenciais?
   - Como funciona a classificação de risco?

---

## 📖 Manual 4: Emissor

### Jornada Completa

```mermaid
flowchart TD
    A[Pré-cadastrado no Sistema] --> B[Login CPF + Senha]
    B --> C[Dashboard Emissor]
    C --> D{Aba Selecionada}

    D -->|Laudo para Emitir| E[Lista de Lotes Pendentes]
    D -->|Laudo Emitido| F[Lista de Lotes Finalizados]
    D -->|Cancelados| G[Lotes Cancelados]

    E --> H[Selecionar Lote]
    H --> I{Ação}
    I -->|Iniciar Laudo| J[Gerar Laudo]
    I -->|Reprocessar| K[Reprocessar Laudo]

    J --> L[Geração do PDF]
    L --> M[Cálculo do Hash SHA-256]
    M --> N[Laudo Emitido Localmente]

    N --> O[Upload para Bucket]
    O --> P[Laudo Enviado]
    P --> Q[Disponível para Download]

    F --> R[Visualizar Laudo]
    R --> S[Baixar PDF]
    R --> T[Copiar Hash]
    R --> U[Re-enviar ao Bucket]
```

### Seções do Manual

1. **Acesso ao Sistema**
   - Login como emissor
   - Pré-cadastro (como funciona)
   - Instalar aplicativo PWA

2. **Dashboard do Emissor**
   - Aba "Laudo para Emitir"
   - Aba "Laudo Emitido"
   - Aba "Cancelados"
   - Atualização automática (polling)

3. **Emissão de Laudos**
   - Visualizar lote recebido
   - Iniciar geração do laudo
   - Pré-visualização
   - Confirmar emissão
   - Reprocessar (se necessário)

4. **Upload para Bucket**
   - Quando fazer upload
   - Status do upload
   - Verificar URL remota

5. **Integridade e Segurança**
   - Hash SHA-256
   - Verificação de autenticidade
   - Boas práticas

6. **Histórico e Rastreamento**
   - Visualizar laudos emitidos
   - Dados do emissor
   - Timestamps de emissão

---

## 📋 Estrutura Comum dos Manuais

Cada manual deve conter:

1. **Capa**
   - Título do manual
   - Versão do sistema
   - Data de atualização

2. **Sumário**
   - Navegação rápida

3. **Introdução**
   - Sobre o sistema QWork
   - Sobre o COPSOQ III
   - Objetivo do manual

4. **Conteúdo Principal**
   - Seções específicas por perfil

5. **FAQ**
   - Perguntas frequentes

6. **Suporte**
   - Contatos
   - Canais de ajuda

---

## 🎨 Formato de Entrega

- **Arquivos:** Markdown (.md) no diretório `/docs/manuais/`
- **Diagramas:** Mermaid embutido nos arquivos
- **Imagens:** Screenshots quando necessário (diretório `/docs/manuais/images/`)
- **PDF:** Gerado a partir do Markdown para distribuição

---

## 📅 Próximos Passos

1. [ ] Criar diretório `/docs/manuais/`
2. [ ] Escrever Manual do Gestor RH
3. [ ] Escrever Manual do Gestor Entidade
4. [ ] Escrever Manual do Funcionário
5. [ ] Escrever Manual do Emissor
6. [ ] Revisar com o usuário
7. [ ] Gerar versões PDF

---

**Aprovação necessária para prosseguir com a escrita dos manuais.**

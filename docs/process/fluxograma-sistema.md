<!-- Moved from project root -->
# Fluxograma do Sistema Qwork - Foco em Política de Privacidade e Termos de Uso

Este fluxograma ilustra o fluxo do sistema de avaliação psicossocial Qwork, com ênfase na estruturação da Política de Privacidade e Termos de Uso, considerando todos os níveis de relacionamento: Administrador, Clínicas, RH, Empresas, Funcionários e Emissores.

```mermaid
flowchart TD
    A[Funcionário acessa plataforma] --> B{Aceitou Termos e Privacidade?}
    B -->|Não| C[Exibir Termos de Uso e Política de Privacidade]
    C --> D[Funcionário aceita termos]
    D --> E[Login realizado]
    B -->|Sim| E

    E --> F[Funcionário realiza avaliação psicossocial]
    F --> G[Dados pessoais e respostas coletados<br/>Política de Privacidade: Coleta de dados sensíveis<br/>com consentimento explícito]

    G --> H[RH acessa dashboard<br/>Política de Privacidade: Acesso restrito<br/>a dados de funcionários da empresa]

    H --> I[RH cria lote de avaliações<br/>Termos de Uso: Responsabilidades do RH<br/>em relação aos dados]

    I --> J[Emissor recebe lote<br/>Política de Privacidade: Emissor como<br/>processador de dados]

    J --> K[Emissor analisa dados e gera laudo<br/>Política de Privacidade: Anonimização<br/>e confidencialidade]

    K --> L[Laudo assinado digitalmente<br/>Termos de Uso: Validade jurídica do laudo]

    L --> M[Laudo enviado para RH/Empresa<br/>Política de Privacidade: Compartilhamento<br/>controlado de resultados]

    M --> N[Empresa recebe relatório<br/>Termos de Uso: Uso dos dados para<br/>ações de saúde ocupacional]

    N --> O[Admin monitora sistema<br/>Política de Privacidade: Auditoria de acessos<br/>e conformidade]

    O --> P[Relatórios de conformidade gerados<br/>Termos de Uso: Obrigações do Admin]

    P --> Q[Fim do ciclo]

    subgraph "Nível Funcionário"
        A
        B
        C
        D
        E
        F
        G
    end

    subgraph "Nível RH"
        H
        I
    end

    subgraph "Nível Emissor"
        J
        K
        L
    end

    subgraph "Nível Empresa"
        N
    end

    subgraph "Nível Admin"
        O
        P
        Q
    end

    subgraph "Controles de Privacidade"
        R[Consentimento explícito]
        S[Anonimização de dados]
        T[Controle de acesso RLS]
        U[Auditoria de logs]
        V[Criptografia de dados]
    end

    G -.-> R
    K -.-> S
    H -.-> T
    O -.-> U
    L -.-> V
```

## Explicação dos Pontos de Aplicação

### Política de Privacidade

- **Coleta de Dados**: Durante a avaliação, dados pessoais e psicossociais são coletados com consentimento explícito do funcionário.
- **Processamento**: Dados são processados anonimamente pelos emissores para geração de laudos.
- **Compartilhamento**: Laudos são compartilhados apenas com RH e empresas autorizadas, com controles de acesso.
- **Armazenamento**: Dados criptografados e auditados para conformidade com LGPD.

## Termos de Uso

- **Responsabilidades**: Cada nível tem responsabilidades definidas (RH gerencia lotes, Emissor emite laudos válidos, Admin garante conformidade).
- **Uso da Plataforma**: Define como os dados podem ser utilizados para saúde ocupacional.
- **Validade Jurídica**: Laudos têm validade jurídica para ações trabalhistas.

---

Este fluxograma destaca a integração das políticas em todos os níveis, assegurando privacidade e conformidade legal.

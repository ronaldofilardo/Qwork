# Fluxograma de Implementação de Termos de Uso e Política de Privacidade

Este fluxograma descreve o fluxo de implementação e aceitação de termos de uso e política de privacidade no sistema, considerando os múltiplos níveis de relacionamento: plataforma com clínicas, clínicas com empresas, funcionários com clínica e funcionários com plataforma.

```mermaid
flowchart TD
    A[Usuário faz login] --> B{Tipo de usuário?}
    B -->|Funcionário| C[Verificar se aceitou termos da plataforma]
    C -->|Não| D[Exibir termos da plataforma]
    D --> E[Aceitar termos da plataforma]
    E --> F[Verificar se aceitou termos da clínica]
    F -->|Não| G[Exibir termos da clínica]
    G --> H[Aceitar termos da clínica]
    H --> I[Acesso ao sistema liberado]
    F -->|Sim| I
    C -->|Sim| F

    B -->|Gestor de RH (perfil='rh')| J[Verificar se aceitou termos da plataforma]
    J -->|Não| K[Exibir termos da plataforma]
    K --> L[Aceitar termos da plataforma]
    L --> P[Acesso ao sistema liberado]
    J -->|Sim| P

    B -->|Administrador da Plataforma| Q[Acesso ao sistema liberado]

    R[Implementação inicial] --> S[Criar banco de dados para rastrear aceitações]
    S --> T[Desenvolver componentes UI para exibir termos]
    T --> U[Integrar verificações de aceitação no fluxo de login]
    U --> V[Testar fluxos para cada nível de usuário]
    V --> W[Implantar e monitorar aceitações]
```

## Descrição dos Níveis

1. **Plataforma com Clínicas**: As clínicas devem aceitar os termos da plataforma durante o registro ou primeiro acesso.
2. **Clínicas com Empresas**: As empresas associadas às clínicas devem aceitar termos específicos da clínica.
3. **Funcionários com Clínica**: Os funcionários devem aceitar termos da clínica à qual pertencem.
4. **Funcionários com Plataforma**: Os funcionários devem aceitar termos gerais da plataforma.

O fluxograma mostra o processo de verificação e aceitação sequencial para garantir conformidade em todos os níveis.

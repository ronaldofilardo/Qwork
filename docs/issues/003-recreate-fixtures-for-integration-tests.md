Title: Recriar fixtures/seed para integrações que dependem de dados deletados

Priority: critical

Descrição:

- Deleção irreversível de lotes aptos/emitidos impactou muitas integrações que esperam dados históricos ou um volume de registros.

Tarefas:

- Revisar e identificar testes de integração que falham por `unique constraint` ou dados ausentes (ex.: `planos_nome_key`, `contratantes_responsavel_cpf_unique`).
- Atualizar scripts de seed/test fixtures para garantir isolamento (usar IDs dinâmicos ou limpar antes de inserir).
- Garantir que testes criem e apaguem seus próprios dados, evitando dependência de dados globais.

Arquivos/Locais afetados:

- diversos testes em `__tests__/integration/*` e `__tests__/lib/*`

Notas:

- Prioridade alta; sem esses fixes, muitas suites de integração permanecerão com falhas.

Title: Investigar e corrigir timeouts e testes flakey (login, UI async)

Priority: medium

Descrição:

- Alguns testes de UI (ex.: `login.test.tsx`) estão excedendo timeouts por dependerem de fetch mocks ou operações assíncronas demoradas.

Tarefas:

- Aumentar timeouts onde apropriado para testes longos ou refatorar para usar fake timers/mocks.
- Revisar mocks de `fetch` / network para garantir respostas rápidas e determinísticas.
- Consolidar testes long-running como E2E (Cypress) se apropriado.

Arquivos sugeridos:

- `__tests__/login.test.tsx` e outros testes com 'Exceeded timeout'

Observações:

- Mitigação rápida: aumentar timeout em testes críticos; solução robusta: refatorar mocks e usar fake timers.

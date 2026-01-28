Title: Atualizar NotificationCenter e testes UI que esperam 'rascunho'

Priority: high

Descrição:

- A UI e os testes de NotificationCenter esperavam textos ou tipos relacionados a 'rascunho' (ex.: 'rascunho_pendente').

Tarefas:

- Atualizar componentes para não depender de 'rascunho_pendente' e alterar lógica para tipos: 'novo_lote' | 'processado'.
- Atualizar testes `__tests__/components/NotificationCenter.test.tsx` e `__tests__/api/emissor/notificacoes.test.ts` para refletir a nova mensagem ('Laudo processado...').

Arquivos sugeridos para PR:

- `components/NotificationCenter.tsx`
- `app/api/emissor/notificacoes/route.ts`
- `__tests__/components/NotificationCenter.test.tsx`
- `__tests__/api/emissor/notificacoes.test.ts`

Observações:

- Baixa complexidade dos fixes; testes críticos falham por causa dessas mensagens.

Title: Ajustar testes de cron e emissão para 'cron desabilitado' e emissão imediata

Priority: high

Descrição:

- Muitos testes falharam porque o cron endpoints agora retornam 410 (cron desabilitado) e o fluxo de emissão foi tornado imediato (nenhum agendamento `auto_emitir_em`).

Tarefas:

- Atualizar testes de `__tests__/api/cron/emitir-laudos-auto.test.ts` para esperar 410 e mensagem 'Cron de emissão desabilitado'.
- Atualizar testes de `lib/lotes` (recalculo) para não esperar `auto_emitir_em` mas verificar chamada a `gerarLaudoCompletoEmitirPDF` (mock).
- Remover/skips em testes que verificam agendamento (`auto_emitir_em`) e converter para validar emissão imediata.

Arquivos afetados (sugestão de PR):

- `lib/lotes.ts` (já modificado)
- `app/api/cron/emitir-laudos-auto/route.ts` (já modificado)
- `__tests__/api/cron/*`
- `__tests__/lib/lotes-recalculo.test.ts`

Observações:

- Esses testes são prioritários porque quebram várias integrações e mascaram regressões de emissão.
